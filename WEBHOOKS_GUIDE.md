# Webhooks Integration Guide

This guide covers the webhook endpoints for Discord bot interactions and GitHub → Discord event bridging.

---

## Table of Contents

- [Discord Bot Interactions](#discord-bot-interactions)
- [GitHub → Discord Bridge](#github---discord-bridge)
- [Environment Variables](#environment-variables)
- [Setup Instructions](#setup-instructions)

---

## Discord Bot Interactions

### Endpoint

```
POST /api/webhooks/services/discord
```

Handles Discord bot interactions including:
- Slash commands (`/ping`, `/repo`)
- Button clicks
- Select menu interactions

### Verification

Discord validates your endpoint by sending a `POST` request with `type: 1` (PING). Respond with:

```json
{
  "type": 1
}
```

### Request Headers

| Header | Description |
|--------|-------------|
| `X-Signature-Ed25519` | Ed25519 signature |
| `X-Signature-Timestamp` | Request timestamp |

### Request Body

```json
{
  "type": 1 | 2 | 3,
  "id": "123456789",
  "data": {
    "id": "1234567890",
    "name": "ping",
    "type": 1,
    "options": []
  },
  "member": {
    "user": {
      "id": "123456789",
      "username": "user",
      "discriminator": "1234"
    }
  }
}
```

### Interaction Types

| Type | Description | Response Type |
|------|-------------|---------------|
| 1 | PING | `{ type: 1 }` |
| 2 | APPLICATION_COMMAND | `{ type: 4, data: {...} }` |
| 3 | MESSAGE_COMPONENT | `{ type: 4, data: {...} }` |

### Supported Commands

#### `/ping`
Responds with a pong message.

#### `/repo [owner] [repo]`
Returns repository information.

Example response:
```
📦 Repository: **facebook/react**
https://github.com/facebook/react
```

---

## GitHub → Discord Bridge

### Endpoints

```
POST /api/webhooks/services/github  ← Receive GitHub events
GET /api/webhooks/services/github   ← Verify webhook endpoint
```

Receives GitHub repository events and forwards them to a Discord channel via webhook.

### Supported Events

| Event | Description |
|-------|-------------|
| `push` | Code pushed to repository |
| `pull_request` | PR opened, closed, merged, etc. |
| `issues` | Issue opened, closed, reopened |
| `issue_comment` | Comment on issue/PR |
| `release` | Release published |

### Event Payloads

#### Push Event

```json
{
  "ref": "refs/heads/main",
  "repository": {
    "full_name": "owner/repo"
  },
  "pusher": {
    "name": "username"
  },
  "commits": [
    {
      "id": "abc123",
      "message": "Fix bug",
      "author": {
        "name": "Username"
      }
    }
  ],
  "compare": "https://github.com/..."
}
```

#### Pull Request Event

```json
{
  "action": "opened",
  "pull_request": {
    "title": "Add new feature",
    "number": 42,
    "user": {
      "login": "username"
    },
    "html_url": "https://github.com/..."
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
```

#### Issues Event

```json
{
  "action": "opened",
  "issue": {
    "title": "Bug report",
    "number": 42,
    "user": {
      "login": "username"
    },
    "html_url": "https://github.com/..."
  },
  "repository": {
    "full_name": "owner/repo"
  }
}
```

### Discord Message Format

Each event is formatted as a Discord message with emoji indicators:

```
📤 **Push to owner/repo**
Branch: `main` | Commits: 3
Author: username
https://github.com/...

🔀 **PR opened: Add new feature**
Repo: owner/repo
Author: username
https://github.com/...

📋 **Issue opened: Bug report**
Repo: owner/repo (#42)
Author: username
https://github.com/...

🚀 **Release published: v1.0.0**
Repo: owner/repo
https://github.com/...
```

---

## Environment Variables

### Required Variables

```env
# Discord Bot Interactions
DISCORD_PUBLIC_KEY=your_discord_public_key

# GitHub → Discord Bridge
GITHUB_WEBHOOK_SECRET=your_webhook_secret
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

### How to Get Each Variable

#### DISCORD_PUBLIC_KEY

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Navigate to **General Information**
4. Copy the **Public Key**

#### GITHUB_WEBHOOK_SECRET

1. Go to your GitHub repository
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Generate a random string (use a password generator)
4. Copy the generated secret

#### DISCORD_WEBHOOK_URL

1. Open Discord in your server
2. Go to **Server Settings** → **Integrations**
3. Click **Create Webhook** or **Manage** on existing webhook
4. Copy the **Webhook URL**

---

## Setup Instructions

### Discord Bot Setup

1. **Create Application:**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Click **New Application**
   - Name your application

2. **Add Bot:**
   - Navigate to **Bot** → **Add Bot**
   - Copy the **Bot Token** (if needed)

3. **Configure Interactions Endpoint:**
   - Navigate to **General Information**
   - Set **Interactions Endpoint URL** to:
     ```
     https://yourdomain.com/api/webhooks/services/discord
     ```
   - Copy **Public Key** to `DISCORD_PUBLIC_KEY`

4. **Register Slash Commands:**
   - Commands are auto-registered on first use
   - Or manually register via Discord API

### GitHub Webhook Setup

1. **Create Webhook:**
   - Go to repository **Settings** → **Webhooks** → **Add webhook**

2. **Configure Payload:**
   - **Payload URL:** `https://yourdomain.com/api/webhooks/services/github`
   - **Content type:** `application/json`
   - **Secret:** Your `GITHUB_WEBHOOK_SECRET`

3. **Select Events:**
   - Choose events to receive:
     - [x] Push
     - [x] Pull requests
     - [x] Issues
     - [x] Issue comments
     - [x] Releases

4. **Test Webhook:**
   - Click **Test** to send a ping event
   - Your endpoint should respond with `{ "received": true, "event": "ping" }`

### Discord Webhook Setup

1. **Create Webhook in Discord:**
   - Server Settings → Integrations → Webhooks
   - Create new webhook
   - Copy webhook URL

2. **Set Environment Variable:**
   ```env
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdef...
   ```

---

## Testing

### Test Discord Endpoint

```bash
curl -X POST https://yourdomain.com/api/webhooks/services/discord \
  -H "Content-Type: application/json" \
  -H "X-Signature-Ed25519: your_signature" \
  -H "X-Signature-Timestamp: $(date +%s)" \
  -d '{"type":1}'
```

### Test GitHub Endpoint

```bash
# Verify endpoint
curl https://yourdomain.com/api/webhooks/services/github

# Test with ping event (requires GITHUB_WEBHOOK_SECRET)
curl -X POST https://yourdomain.com/api/webhooks/services/github \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: ping" \
  -H "X-Hub-Signature-256: sha256=..." \
  -d '{"zen":"test","hook_id":123}'
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Invalid signature` | Missing/invalid signature | Check `DISCORD_PUBLIC_KEY` or `GITHUB_WEBHOOK_SECRET` |
| `500 Server not configured` | Missing environment variable | Set required env vars |
| `500 Webhook secret not configured` | `GITHUB_WEBHOOK_SECRET` not set | Set the environment variable |
| Discord: "Interaction failed" | Signature verification failed | Check public key and signature |

### Debug Mode

Enable debug logging by checking server logs:

```bash
# Discord interactions
[Discord] Slash command: ping
[Discord] Component interaction: my_button

# GitHub webhook
[GitHub Webhook] Event: push, Repo: owner/repo
[Discord Notification] Sent successfully
```

---

## Security Notes

1. **Always verify signatures** - Both endpoints validate request signatures
2. **Keep secrets secure** - Never commit `.env` files to version control
3. **Use HTTPS** - Webhooks require HTTPS in production
4. **Validate payloads** - Check expected event types before processing

---

## File Structure

```
app/api/webhooks/
└── services/
    ├── discord/
    │   └── route.ts      ← Discord bot interactions
    └── github/
        └── route.ts      ← GitHub → Discord bridge
```
