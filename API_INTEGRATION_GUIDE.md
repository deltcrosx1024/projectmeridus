# GitHub API & OAuth Integration Guide

## Table of Contents
- [OAuth Setup](#oauth-setup)
- [GitHub API Routes](#github-api-routes)
- [Discord Integration](#discord-integration)
- [Client Implementation](#client-implementation)
- [Security Notes](#security-notes)

---

## OAuth Setup

### GitHub OAuth

**1. Create OAuth App:**
- Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
- Fill in:
  - **Description:** Briefly describe your app’s purpose (e.g., “DevHub integrates GitHub and Discord for developer collaboration.”)
  - **Homepage URL:** Use your deployed domain or `http://localhost:3000` for local development
  - **Authorization callback URL:** Must match your backend route, e.g., `http://localhost:3000/api/auth/callback?service=github` (adjust for production)
  - **Application name:** DeltCrosX DevHub (or your app name)
  - **Homepage URL:** `https://yourdomain.com` (localhost for dev)
  - **Authorization callback URL:** `https://yourdomain.com/api/auth/callback?service=github`

**2. Get Credentials:**
- Copy `Client ID` and generate `Client Secret`

**3. Environment Variables (`.env.local`):**
```env
GITHUB_ID=your_client_id
GITHUB_SECRET=your_client_secret
NEXT_PUBLIC_GITHUB_ID=your_client_id
```

### Discord OAuth

**1. Create Application:**
- Go to Discord Developer Portal → Applications → New Application
- Go to OAuth2 → Add Redirect URL:
  ```
  https://yourdomain.com/api/auth/callback?service=discord
  ```

**2. Get Credentials:**
- Copy `Client ID` and `Client Secret`

**3. Environment Variables (`.env.local`):**
```env
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
```

---

## GitHub API Routes

### 1. Get User's Repositories

**Endpoint:**
```
GET /api/github/repos
```

**Headers:**
```
Authorization: Bearer <github_token>
```

**OR** set `GITHUB_TOKEN` in `.env.local`

**Response:**
```json
[
  {
    "id": 123456,
    "name": "project-name",
    "full_name": "username/project-name",
    "description": "Project description",
    "url": "https://api.github.com/repos/username/project-name",
    "html_url": "https://github.com/username/project-name",
    "private": false,
    "fork": false,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-02-05T15:45:00Z",
    "pushed_at": "2024-02-05T14:20:00Z",
    "homepage": "https://example.com",
    "size": 256,
    "stargazers_count": 42,
    "watchers_count": 42,
    "language": "TypeScript",
    "forks_count": 5,
    "open_issues_count": 3,
    "default_branch": "main"
  }
]
```

**Client Example:**
```typescript
const token = document.cookie
  .split('; ')
  .find(row => row.startsWith('github_token='))
  ?.split('=')[1];

const response = await fetch('/api/github/repos', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const repos = await response.json();
```

---

### 2. Get User's Issues (All Repos)

**Endpoint:**
```
GET /api/github/issues
```

**Headers:**
```
Authorization: Bearer <github_token>
```

**Response:**
```json
[
  {
    "id": 987654,
    "number": 42,
    "title": "Bug: Login not working",
    "body": "Issue description...",
    "state": "open",
    "user": {
      "login": "username",
      "id": 123
    },
    "created_at": "2024-02-01T10:00:00Z",
    "updated_at": "2024-02-05T15:30:00Z",
    "closed_at": null,
    "labels": [
      { "name": "bug", "color": "d73a4a" },
      { "name": "urgent", "color": "ff0000" }
    ],
    "assignee": null,
    "pull_request": null,
    "repository": {
      "id": 123456,
      "name": "project-name",
      "full_name": "username/project-name"
    }
  }
]
```

**Client Example:**
```typescript
async function fetchAllIssues() {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('github_token='))
    ?.split('=')[1];

  const response = await fetch('/api/github/issues', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch issues: ${response.statusText}`);
  }
  
  return response.json();
}
```

---

### 3. Get Issues for Specific Repository

**Endpoint:**
```
GET /api/github/repo/[owner]/[repo]/issues
```

**Parameters:**
- `owner` - Repository owner (username or organization)
- `repo` - Repository name

**Headers:**
```
Authorization: Bearer <github_token>
```

**Example:**
```
GET /api/github/repo/facebook/react/issues
```

**Response:**
Same as "Get User's Issues" but filtered for specific repository.

**Client Example:**
```typescript
async function fetchRepoIssues(owner: string, repo: string) {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('github_token='))
    ?.split('=')[1];

  const response = await fetch(`/api/github/repo/${owner}/${repo}/issues`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch ${repo} issues: ${response.statusText}`);
  }
  
  return response.json();
}

// Usage:
const issues = await fetchRepoIssues('facebook', 'react');
```

---

## Discord Integration

### Discord Bot Interaction Endpoint

**Endpoint:**
```
POST /api/webhooks/services/discord
```

**Required Environment Variables:**
```env
DISCORD_PUBLIC_KEY=your_discord_public_key
```

**Discord Developer Portal Setup:**
1. Go to Discord Developer Portal → Applications → Your App
2. Navigate to **Interactions Endpoint URL**
3. Set URL to: `https://yourdomain.com/api/webhooks/services/discord`
4. Copy your Public Key and set as `DISCORD_PUBLIC_KEY`

**Expected Payload:**
```json
{
  "type": 1 | 2 | 3,
  "data": { ... },
  "member": { ... },
  "user": { ... }
}
```

**Response Types:**
- `type: 1` → PING (respond with `{ type: 1 }`)
- `type: 2` → APPLICATION_COMMAND (slash commands)
- `type: 3` → MESSAGE_COMPONENT (buttons, select menus)

**Supported Slash Commands:**
- `/ping` → Responds with "🏓 Pong!"
- `/repo [owner] [repo]` → Returns repository info

---

### GitHub → Discord Webhook Bridge

**Endpoint:**
```
POST /api/webhooks/services/github
```

**Required Environment Variables:**
```env
GITHUB_WEBHOOK_SECRET=your_webhook_secret
DISCORD_WEBHOOK_URL=your_discord_webhook_url
```

**GitHub Setup:**
1. Go to Repository → Settings → Webhooks → Add webhook
2. **Payload URL:** `https://yourdomain.com/api/webhooks/services/github`
3. **Content type:** `application/json`
4. **Secret:** Generate a secret and set as `GITHUB_WEBHOOK_SECRET`

**Discord Setup:**
1. Create a Discord webhook URL in your server channel
2. Set as `DISCORD_WEBHOOK_URL`

**Supported Events:**
- `push` → Notifications for code pushes
- `pull_request` → PR opened, closed, merged, etc.
- `issues` → Issue opened, closed, reopened
- `issue_comment` → Comments on issues/PRs
- `release` → New releases published

---

### Verify Webhook Endpoints

**GitHub Verification:**
```
GET /api/webhooks/services/github
```
Returns: `{ "status": "ok", "message": "GitHub webhook endpoint is active" }`

**Discord Verification:**
- Discord sends a PING (type: 1) on initial setup
- Respond with `{ type: 1 }` to complete verification

---

## Client Implementation

### Login Component Example

```typescript
'use client';

import { handleGitHubLogin, handleDiscordLogin } from '@/app/lib/oauth';
import { useState } from 'react';

export default function AuthButtons() {
  const [loading, setLoading] = useState(false);

  const onGitHubClick = async () => {
    setLoading(true);
    handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_ID!);
  };

  const onDiscordClick = async () => {
    setLoading(true);
    handleDiscordLogin(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID!);
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={onGitHubClick}
        disabled={loading}
        className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect GitHub'}
      </button>
      <button
        onClick={onDiscordClick}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Connecting...' : 'Connect Discord'}
      </button>
    </div>
  );
}
```

### Data Fetching Hook

```typescript
'use client';

import { useEffect, useState } from 'react';

export function useGitHubRepos() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const response = await fetch('/api/github/repos');
        if (!response.ok) throw new Error('Failed to fetch repos');
        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  return { repos, loading, error };
}

// Usage in component:
export default function RepoList() {
  const { repos, loading, error } = useGitHubRepos();

  if (loading) return <div>Loading repos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {repos.map((repo: any) => (
        <li key={repo.id}>
          <a href={repo.html_url} target="_blank">
            {repo.full_name} ⭐ {repo.stargazers_count}
          </a>
        </li>
      ))}
    </ul>
  );
}
```

---

## Security Notes

### ✅ Best Practices

1. **Never expose `GITHUB_SECRET` or `DISCORD_CLIENT_SECRET`**
   - Keep these in `.env.local` (never commit to git)
   - Only use `NEXT_PUBLIC_*` vars on client-side

2. **Use httpOnly Cookies**
   - Tokens are stored in httpOnly cookies automatically
   - Cannot be accessed via JavaScript (prevents XSS)

3. **CSRF Protection**
   - State tokens are automatically generated and validated
   - Stored in cookies with 10-minute expiration

4. **Token Refresh**
   - GitHub tokens: 30-day expiration (in cookie)
   - Discord tokens: 7-day expiration (shorter for security)
   - Implement token refresh logic for long-lived sessions

5. **Environment Separation**
   - Use separate OAuth apps for dev/staging/production
   - Different redirect URLs for each environment

### ❌ Don't Do This

```typescript
// ❌ WRONG: Storing token in localStorage
localStorage.setItem('github_token', token);

// ❌ WRONG: Passing token in URL
fetch(`/api/github/repos?token=${token}`);

// ❌ WRONG: Committing secrets to git
const SECRET = 'ghp_xxxxx'; // in code

// ❌ WRONG: Using same OAuth app for dev & production
```

### ✅ Do This

```typescript
// ✅ RIGHT: Tokens auto-stored in httpOnly cookies
// ✅ RIGHT: Using Authorization header
fetch('/api/github/repos', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// ✅ RIGHT: Storing secrets in .env.local
// GITHUB_SECRET=ghp_xxxxx

// ✅ RIGHT: Using different OAuth apps per environment
// dev: localhost:3000
// prod: yourdomain.com
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `401 Unauthorized` | No token provided or invalid | User needs to login via OAuth |
| `403 CSRF check failed` | State token mismatch | Possible CSRF attack or cookie issue |
| `400 Missing service` | Query param missing | Ensure `?service=github\|discord` in callback URL |
| `500 Auth failed` | Provider API error | Check client ID/secret, rate limits |

### Response Handling

```typescript
async function apiCall(endpoint: string) {
  try {
    const response = await fetch(endpoint);
    
    if (response.status === 401) {
      // Token expired or missing - redirect to login
      window.location.href = '/login';
      return;
    }
    
    if (response.status === 403) {
      // CSRF or permission issue
      console.error('CSRF or permission denied');
      return;
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API error');
    }
    
    return response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}
```

---

## File Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── callback/
│   │   │   └── route.ts          ← Universal callback handler
│   │   └── services/
│   │       ├── github.ts         ← GitHub OAuth handler
│   │       └── discord.ts        ← Discord OAuth handler
│   ├── github/
│   │   ├── repos/
│   │   │   └── route.ts          ← List user's repos
│   │   ├── issues/
│   │   │   └── route.ts          ← List all issues
│   │   └── repo/
│   │       └── [owner]/[repo]/issues/
│   │           └── route.ts      ← List repo issues
│   └── webhooks/
│       └── services/
│           ├── discord/
│           │   └── route.ts      ← Discord bot interactions
│           └── github/
│               └── route.ts      ← GitHub → Discord bridge
├── lib/
│   └── oauth.ts                  ← Client-side OAuth helpers
└── components/
    └── auth/
        └── AuthButtons.tsx       ← Login buttons
```

---

## Next Steps

1. Set up OAuth apps (GitHub & Discord)
2. Add credentials to `.env.local`
3. Add login buttons to your Header component
4. Test OAuth flow locally
5. Implement data fetching hooks for repos/issues
6. Add token refresh logic for production
