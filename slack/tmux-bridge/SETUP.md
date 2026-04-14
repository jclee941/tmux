# Slack App Setup Guide

This guide walks through the Slack API console configuration required to run the tmux-bridge service.

## Prerequisites

- Slack workspace admin access
- Existing Slack app (the one with bot token `xoxb-...`)

## Step 1: Enable Socket Mode

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Select your app
3. **Settings → Socket Mode** → Toggle **Enable Socket Mode** ON
4. Generate an **App-Level Token**:
   - Token name: `tmux-bridge`
   - Scope: `connections:write`
   - Click **Generate**
   - Copy the `xapp-...` token → save as `SLACK_APP_TOKEN` in `.env`

## Step 2: Register Slash Command

1. **Features → Slash Commands** → **Create New Command**
2. Fill in:
   - Command: `/tmux`
   - Short Description: `Manage tmux sessions`
   - Usage Hint: `[list|new|kill|rename|send|capture|sync|opencode|help]`
3. Click **Save**

## Step 3: Enable Interactivity

1. **Features → Interactivity & Shortcuts** → Toggle **Interactivity** ON
2. Request URL is not needed for Socket Mode (leave blank or enter a placeholder)
3. Click **Save Changes**

## Step 4: Verify Bot Token Scopes

**Features → OAuth & Permissions → Scopes → Bot Token Scopes**

Required scopes:
- `commands` — handle `/tmux` slash command
- `channels:read` — list existing channels
- `channels:join` — join channels
If scopes were added, reinstall the app to the workspace.

## Step 5: Copy Signing Secret

1. **Settings → Basic Information → App Credentials**
2. Copy **Signing Secret** → save as `SLACK_SIGNING_SECRET` in `.env`

## Step 6: Channel Setup

All notifications go to a single `#opencode` channel.

1. Create `#opencode` in your Slack workspace
2. Invite the bot: `/invite @YourBotName`
3. Copy the channel ID → save as `SLACK_CHANNEL_OPENCODE` in `.env`

## Step 7: Create .env

```bash
cd ~/.tmux/slack/tmux-bridge
cp .env.example .env
```

Fill in all values:

```
SLACK_BOT_TOKEN=xoxb-...        # OAuth & Permissions → Bot User OAuth Token
SLACK_APP_TOKEN=xapp-...        # Socket Mode → App-Level Token (socket mode only)
SLACK_SIGNING_SECRET=...        # Basic Information → Signing Secret
SLACK_CHANNEL_OPENCODE=C0...    # #opencode channel ID (required)
SLACK_MODE=socket                # 'socket' (default) or 'http'
SLACK_HTTP_PORT=3001            # HTTP mode listener port
TMUX_SOCKET=default
TMUX_SLACK_NOTIFY_PORT=9876
TMUX_HOME=$HOME/.tmux
```

## Step 8: Start the Service

```bash
# Test locally first
cd ~/.tmux/slack/tmux-bridge && npm start

# If working, enable systemd service
systemctl --user enable --now tmux-slack-bridge.service

# Check status
systemctl --user status tmux-slack-bridge.service
journalctl --user -u tmux-slack-bridge -f
```

## Step 9: Verify

1. Type `/tmux` in any Slack channel → should show session dashboard
2. Click buttons in the dashboard → should trigger actions and modals
3. Wait for an opencode session to go idle → notification appears in `#opencode`

## Troubleshooting

| Symptom                   | Cause                        | Fix                                               |
| ------------------------- | ---------------------------- | ------------------------------------------------- |
| `not_authed`              | Missing or invalid bot token | Check `SLACK_BOT_TOKEN` in `.env`                 |
| `invalid_auth`            | Token doesn't match app      | Regenerate token in OAuth & Permissions           |
| No slash command response | Socket Mode not connected    | Check `SLACK_APP_TOKEN`, verify Socket Mode is ON |
| Buttons don't work        | Interactivity not enabled    | Enable in Interactivity & Shortcuts               |
| No notifications in #tmux | Bot not in channel           | `/invite @BotName` in #tmux                       |
| Notify POST fails         | Bridge service not running   | Check `systemctl --user status tmux-slack-bridge` |
