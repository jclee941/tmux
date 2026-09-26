# Mobile Access

Phone sessions used plain SSH over LTE to a public port 22 and dropped at every
network change: from Jul 31 to Sep 26 there were 665 remote logins, and 451 of
them were reconnects within minutes of a drop (293 after an IP change). The
target setup is one resumable mosh session per phone over a private network.

## Server (one-time)

1. Tailscale. mosh needs UDP, which the Cloudflare Tunnel cannot carry:

   ```bash
   curl -fsSL https://tailscale.com/install.sh | sh
   sudo tailscale up --accept-dns=false   # prints a login URL
   tailscale ip -4                         # the phone connects to this address
   ```

   `--accept-dns=false` leaves the server's resolver alone (cloudflared, docker).
2. mosh 1.4.0 is already installed. `~/.bashrc` exports
   `MOSH_SERVER_NETWORK_TMOUT=86400` above its non-interactive guard (bash
   reads the file for ssh commands, which is how `mosh` starts mosh-server), so
   a mosh-server whose phone app was killed exits after a day instead of
   holding its tmux client forever.
3. `ufw` is inactive. If it is enabled later, allow UDP 60000-61000 on
   `tailscale0`.

## Phone (Termius on Android)

- Install Tailscale and sign in with the same account.
- Termius host: address = the server's Tailscale IP or MagicDNS name, Mosh on.
- Android settings → Apps → Termius → Battery → Unrestricted, so the session
  survives in the background.
- Korean or long prompts: switch the input to Paste mode (above the shortcut
  bar), write the whole prompt, send it once.
- Shortcut bar: Esc, Ctrl, Tab, Shift+Tab. Session keys: `prefix+j/k` cycle,
  `prefix+Space` MRU picker.
- Screenshots for a prompt: SFTP tab → upload → paste the path.

Login still auto-attaches (`bin/tmux-auto-attach` handles `MOSH_KEY`). On a
client 80+ columns wide the status bar shows `MOSH` once the switch works.

## Close public SSH

Once the phone reaches the server over Tailscale from LTE, remove the router's
port-22 forward. The browser path (ssh.jclee.me through the Cloudflare Tunnel)
does not use it.

## OmO idle alerts (ntfy)

`bin/tmux-omo-notify` runs as the user service `tmux-omo-notify.service`. An
idle OmO TUI draws nothing, so a pane that produced output for at least 30s and
then stayed silent for 20s gets one push, unless a client typed in that
session during the last minute. The topic lives in
`~/.config/tmux/omo-notify.env` (`TMUX_OMO_NOTIFY_NTFY_TOPIC`, mode 600); the
topic name is the only access control on ntfy.sh, so keep it private.

```bash
systemctl --user enable --now ~/.tmux/systemd/tmux-omo-notify.service
~/.tmux/bin/tmux-omo-notify --test        # one test push
journalctl --user -u tmux-omo-notify -f   # "notified: <session>" per push
```

## ssh.jclee.me: Cloudflare Access instead of Basic Auth

Order matters. With `WEB_TERMINAL_AUTH_HEADER` set, ttyd and the upload
gateway accept any request whose `Cf-Access-Authenticated-User-Email` header is
non-empty, so switch the server only after Access is enforced at the edge.

1. Zero Trust → Access → Applications → ssh.jclee.me: policy Bypass → Allow
   (owner email).
2. Gate: `curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' https://ssh.jclee.me/`
   must print `302 https://<team>.cloudflareaccess.com/...`. While the policy
   is Bypass it prints `401` (Basic Auth from the origin).
3. `/etc/default/ttyd`: `WEB_TERMINAL_AUTH_HEADER=Cf-Access-Authenticated-User-Email`;
   `/etc/ttyd/credential.env`: comment out `WEB_TERMINAL_CREDENTIAL`;
   `sudo systemctl restart ttyd` (the browser reconnects after a few seconds).
4. `ps -o args= -C ttyd` shows `--auth-header` and no `--credential`.

Rollback: undo step 3 and restart ttyd.
