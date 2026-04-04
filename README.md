# projectmeridus

Development Hub for easier management of GitHub, Discord, and Vercel integrations.

## Features

- **Discord Bot Integration**: Slash commands for GitHub operations
- **GitHub API Wrapper**: Create issues, PRs, comments, rebases, and more
- **Vercel Integration**: Deployments and project management
- **OAuth Authentication**: Secure linking of Discord, GitHub, and Vercel accounts
- **Webhook Handling**: Real-time event processing from GitHub and Discord
- **User Preferences**: Customizable notification settings per user
- **Production Ready**: Comprehensive validation, error handling, and security enhancements

## Architecture

- **Frontend**: Next.js 16 with TypeScript
- **Backend**: Vercel Serverless Functions
- **Storage**: Upstash Redis for user data and preferences
- **Security**: AES-256-GCM encryption for stored tokens
- **Communication**: Discord Interactions API and GitHub REST API

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `.env.example`)
4. Run development server: `npm run dev`
5. Deploy to Vercel: `vercel --prod`

## Environment Variables

Required environment variables for production:

- `DISCORD_TOKEN` - Bot token for Discord API
- `DISCORD_PUBLIC_KEY` - Public key for interaction verification
- `DISCORD_CLIENT_ID` - OAuth client ID
- `DISCORD_CLIENT_SECRET` - OAuth client secret
- `GITHUB_TOKEN` - Personal access token for GitHub API
- `GITHUB_ID`/`GITHUB_SECRET` - OAuth credentials
- `UPSTASH_REDIS_REST_URL` - Redis connection URL
- `UPSTASH_REDIS_REST_TOKEN` - Redis authentication token
- `ENCRYPTION_KEY` - 32-byte key for token encryption
- `VERCEL_CLIENT_ID`/`VERCEL_CLIENT_SECRET` - Vercel OAuth credentials
- `MERIDUS_API_KEY` - Internal API key for service-to-service communication

## API Endpoints

### Discord Interactions
- `POST /api/discord/interactions` - Handle Discord slash commands and interactions

### Authentication
- `GET /api/auth/callback` - OAuth callback handler
- `POST /api/auth/services/discord` - Discord OAuth handler
- `POST /api/auth/services/github` - GitHub OAuth handler
- `POST /api/auth/services/vercel` - Vercel OAuth handler

### GitHub Operations
- `GET /api/github/commits` - Get repository commits
- `GET /api/github/issues` - Get repository issues
- `GET /api/github/repos` - Get repository information
- `POST /api/github/webhook` - GitHub webhook handler

### Vercel Operations
- `GET /api/vercel/deployments` - Get project deployments
- `GET /api/vercel/projects` - Get Vercel projects

### Utility
- `GET /api/meridus/ping` - Health check endpoint
- `GET /api/notifications` - Notification preferences

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm test` - Run tests (when implemented)

## Production Deployment

The application is optimized for Vercel deployment with:

- Serverless functions for scalability
- Edge caching where applicable
- Environment variable segregation
- Comprehensive input validation
- Structured error handling and logging
- Rate limiting and abuse prevention
- Security headers and best practices

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

MIT
