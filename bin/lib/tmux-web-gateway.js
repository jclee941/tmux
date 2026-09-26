#!/usr/bin/env node
'use strict';

// HTTP gateway that sits in front of ttyd for the tmux web terminal.
//
// ttyd 1.7.4 serves only the terminal itself, so browser file drops have
// nowhere to go. This gateway owns the public port, answers the upload
// endpoint, and transparently forwards every other request -- including the
// terminal WebSocket -- to ttyd on loopback.
//
// Uploaded files land in the current working directory of the tmux pane the
// browser client is looking at, so a drop behaves like `cp` into that pane.
//
// Started by bin/tmux-web-terminal; configured entirely through env:
//   GATEWAY_IFACE          Public bind interface name or address (default: lo)
//   GATEWAY_PORT           Public listen port
//   GATEWAY_BACKEND_PORT   ttyd port on 127.0.0.1
//   GATEWAY_TTYD_PID       ttyd pid, used to tell browser tmux clients apart
//   GATEWAY_TMUX_ARGS      JSON array of tmux server args (e.g. ["-L","qa"])
//   WEB_TERMINAL_CREDENTIAL / WEB_TERMINAL_AUTH_HEADER
//                          Same auth as ttyd; enforced on the upload endpoint
//   WEB_TERMINAL_UPLOAD_MAX_MB  Per-file size cap (default: 100)

const http = require('node:http');
const net = require('node:net');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const UPLOAD_PATH = '/__tmux-upload';
const TARGET_PATH = `${UPLOAD_PATH}/target`;

const PORT = Number(process.env.GATEWAY_PORT || 7681);
const IFACE = process.env.GATEWAY_IFACE || 'lo';
const BACKEND_PORT = Number(process.env.GATEWAY_BACKEND_PORT || 0);
const TTYD_PID = Number(process.env.GATEWAY_TTYD_PID || 0);
const CREDENTIAL = process.env.WEB_TERMINAL_CREDENTIAL || '';
const AUTH_HEADER = (process.env.WEB_TERMINAL_AUTH_HEADER || '').toLowerCase();
const MAX_MB = Number(process.env.WEB_TERMINAL_UPLOAD_MAX_MB) || 100;
const MAX_BYTES = MAX_MB * 1024 * 1024;

let TMUX_ARGS = [];
try {
  const parsed = JSON.parse(process.env.GATEWAY_TMUX_ARGS || '[]');
  if (Array.isArray(parsed)) TMUX_ARGS = parsed.map(String);
} catch (_) {
  TMUX_ARGS = [];
}

if (!BACKEND_PORT) {
  console.error('[web-gateway] GATEWAY_BACKEND_PORT is required');
  process.exit(1);
}

function bindAddress(iface) {
  if (!iface || iface === 'lo' || iface === 'localhost') return '127.0.0.1';
  if (iface === 'all' || iface === 'any') return '0.0.0.0';
  if (net.isIP(iface)) return iface;
  const entries = os.networkInterfaces()[iface] || [];
  const v4 = entries.find((e) => e.family === 'IPv4');
  return v4 ? v4.address : iface;
}

function json(res, code, body) {
  const payload = JSON.stringify(body);
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  });
  res.end(payload);
}

// Mirror ttyd's own auth so the upload endpoint can never be the weak door.
function authorized(req) {
  if (AUTH_HEADER) return typeof req.headers[AUTH_HEADER] === 'string' && req.headers[AUTH_HEADER] !== '';
  if (!CREDENTIAL) return true;
  const match = /^Basic\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return false;
  const got = Buffer.from(match[1]);
  const want = Buffer.from(Buffer.from(CREDENTIAL, 'utf8').toString('base64'));
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

function tmux(args) {
  try {
    return execFileSync('tmux', [...TMUX_ARGS, ...args], {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (_) {
    return '';
  }
}

function parentOf(pid) {
  try {
    const stat = fs.readFileSync(`/proc/${pid}/stat`, 'utf8');
    // The comm field can contain spaces and parens, so parse after the last ')'.
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    return Number(fields[1]) || 0;
  } catch (_) {
    return 0;
  }
}

function descendsFrom(pid, ancestor) {
  let current = pid;
  for (let hops = 0; hops < 32 && current > 1; hops += 1) {
    if (current === ancestor) return true;
    current = parentOf(current);
  }
  return false;
}

function writableDir(dir) {
  try {
    if (!fs.statSync(dir).isDirectory()) return false;
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch (_) {
    return false;
  }
}

// Resolve the drop destination: the pane the browser is currently looking at.
// tmux clients spawned by ttyd are children of the ttyd process, which is how
// a browser client is told apart from a local terminal attached to the same
// server. Most recent activity wins within each group.
function resolveTarget() {
  const clients = tmux(['list-clients', '-F', '#{client_activity}\t#{client_pid}\t#{client_tty}'])
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [activity, pid, tty] = line.split('\t');
      return { activity: Number(activity) || 0, pid: Number(pid) || 0, tty: tty || '' };
    })
    .filter((client) => client.tty)
    .sort((a, b) => b.activity - a.activity);

  const browser = TTYD_PID ? clients.filter((c) => descendsFrom(c.pid, TTYD_PID)) : [];
  for (const client of [...browser, ...clients]) {
    const dir = tmux(['display-message', '-p', '-c', client.tty, '#{pane_current_path}']);
    if (dir && writableDir(dir)) return { dir, client: client.tty };
  }

  const current = tmux(['display-message', '-p', '#{pane_current_path}']);
  if (current && writableDir(current)) return { dir: current, client: '' };
  return { dir: os.homedir(), client: '' };
}

function safeName(rawHeader) {
  let name = String(rawHeader || '');
  try {
    name = decodeURIComponent(name);
  } catch (_) {
    /* keep the raw value when it is not valid percent-encoding */
  }
  name = name.replace(/[\u0000-\u001f\u007f]/g, '').replace(/[\\/]+/g, '_').trim();
  name = path.basename(name);
  if (!name || name === '.' || name === '..') {
    name = `upload-${new Date().toISOString().replace(/[:.]/g, '-')}`;
  }
  return name.slice(0, 200);
}

// Exclusive create, so a drop never silently overwrites an existing file.
function createFile(dir, name) {
  const ext = path.extname(name);
  const stem = name.slice(0, name.length - ext.length) || name;
  for (let n = 0; n < 1000; n += 1) {
    const candidate = n === 0 ? name : `${stem}-${n}${ext}`;
    const full = path.join(dir, candidate);
    if (path.dirname(full) !== path.resolve(dir)) throw new Error('invalid filename');
    try {
      return { fd: fs.openSync(full, 'wx', 0o644), full, name: candidate };
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }
  throw new Error('too many name collisions');
}

function announce(client, full) {
  // Leave the path in the paste buffer so prefix+] drops it into the pane.
  tmux(['set-buffer', full]);
  const args = ['display-message'];
  if (client) args.push('-c', client);
  args.push(`uploaded: ${full}`);
  tmux(args);
}

function handleUpload(req, res) {
  // Reject on the declared size before creating anything, and drain rather
  // than reset so the client reliably reads the status instead of a broken
  // connection mid-body.
  if (Number(req.headers['content-length'] || 0) > MAX_BYTES) {
    json(res, 413, { error: `file is larger than the ${MAX_MB} MB limit` });
    req.resume();
    return;
  }

  const target = resolveTarget();
  let file;
  try {
    file = createFile(target.dir, safeName(req.headers['x-upload-filename']));
  } catch (err) {
    json(res, 500, { error: `cannot write to ${target.dir}: ${err.message}` });
    req.resume();
    return;
  }

  const stream = fs.createWriteStream(null, { fd: file.fd, autoClose: true });
  let bytes = 0;
  let failed = false;

  const fail = (code, message) => {
    if (failed) return;
    failed = true;
    stream.destroy();
    try {
      fs.unlinkSync(file.full);
    } catch (_) {
      /* best effort */
    }
    if (res.headersSent) {
      req.destroy();
      return;
    }
    res.setHeader('connection', 'close');
    json(res, code, { error: message });
    res.on('finish', () => req.destroy());
  };

  req.on('data', (chunk) => {
    bytes += chunk.length;
    if (bytes > MAX_BYTES) fail(413, `file is larger than the ${MAX_MB} MB limit`);
  });
  req.on('close', () => {
    if (!req.readableEnded) fail(400, 'upload aborted');
  });
  stream.on('error', (err) => fail(500, err.message));
  stream.on('finish', () => {
    if (failed) return;
    announce(target.client, file.full);
    json(res, 200, { path: file.full, dir: target.dir, name: file.name, bytes });
  });
  req.pipe(stream);
}

function proxy(req, res) {
  const upstream = http.request(
    {
      host: '127.0.0.1',
      port: BACKEND_PORT,
      method: req.method,
      path: req.url,
      headers: req.headers,
      agent: false,
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(res);
    },
  );
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('terminal backend unavailable');
  });
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
}

function rawRequestHead(req) {
  const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`];
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
  }
  return `${lines.join('\r\n')}\r\n\r\n`;
}

const server = http.createServer((req, res) => {
  const route = (req.url || '').split('?')[0];
  if (route !== UPLOAD_PATH && route !== TARGET_PATH) {
    proxy(req, res);
    return;
  }
  if (!authorized(req)) {
    res.writeHead(401, {
      'www-authenticate': 'Basic realm="ttyd"',
      'content-type': 'application/json; charset=utf-8',
    });
    res.end('{"error":"unauthorized"}');
    req.resume();
    return;
  }
  if (req.method === 'GET' && route === TARGET_PATH) {
    json(res, 200, resolveTarget());
    return;
  }
  if (req.method === 'POST' && route === UPLOAD_PATH) {
    handleUpload(req, res);
    return;
  }
  json(res, 405, { error: 'method not allowed' });
  req.resume();
});

// Terminal traffic is latency sensitive, and a slow upload must not be cut off
// by the default 5 minute request timeout.
server.on('connection', (socket) => socket.setNoDelay(true));
server.requestTimeout = 0;
server.headersTimeout = 60000;

// WebSocket (and any other upgrade) is forwarded at the byte level, so the
// gateway stays out of ttyd's protocol entirely.
server.on('upgrade', (req, socket, head) => {
  socket.setNoDelay(true);
  const upstream = net.connect(BACKEND_PORT, '127.0.0.1', () => {
    upstream.setNoDelay(true);
    upstream.write(rawRequestHead(req));
    if (head && head.length) upstream.write(head);
    socket.pipe(upstream);
    upstream.pipe(socket);
  });
  const teardown = () => {
    socket.destroy();
    upstream.destroy();
  };
  socket.on('error', teardown);
  upstream.on('error', teardown);
  socket.on('close', () => upstream.destroy());
  upstream.on('close', () => socket.destroy());
});

server.on('error', (err) => {
  console.error(`[web-gateway] ${err.message}`);
  process.exit(1);
});

server.listen(PORT, bindAddress(IFACE), () => {
  console.log(
    `[web-gateway] listening on ${bindAddress(IFACE)}:${PORT} -> ttyd 127.0.0.1:${BACKEND_PORT} ` +
      `(upload ${UPLOAD_PATH}, max ${MAX_MB} MB)`,
  );
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000).unref();
  });
}
