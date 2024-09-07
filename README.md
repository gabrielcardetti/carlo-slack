# Carlo Slack Bot

Carlo is a Slack bot built with Cloudflare Workers that uses AI to generate tickets from Slack conversations.

## Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Set up your Cloudflare Worker environment
4. Configure your Slack App settings as per the `manifest.json` file
5. Create a `.dev.vars` file in the project root with the following content:

```md
# https://api.slack.com/apps/{your App ID}/general
# Settings > Basic Information > App Credentials > Signing Secret
SLACK_SIGNING_SECRET=

# https://api.slack.com/apps/{your App ID}/install-on-team
# Settings > Install App > Bot User OAuth Token
SLACK_BOT_TOKEN=

SLACK_LOGGING_LEVEL=DEBUG
```

   Replace the empty values with your actual Slack app credentials.

## Configuration

### wrangler.toml

```toml
name = "carlo-slack"
main = "src/index.ts"
compatibility_date = "2024-09-07"

[ai]
binding = "AI"
```

### Slack App Setup

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From an app manifest" and select your workspace
3. Copy the contents of `manifest.json` from this project and paste it into the manifest editor
4. Replace the placeholder URL in the manifest with your Cloudflare Worker URL:

   ```json
   "request_url": "https://your-worker-url.workers.dev",
   ```

5. Review and create the app
6. Once created, navigate to "Basic Information" in the app settings
7. Under "App Credentials", find and copy the "Signing Secret" - you'll need this for the `SLACK_SIGNING_SECRET` in your `.dev.vars` file
8. Go to "OAuth & Permissions" in the sidebar
9. Click "Install to Workspace"
10. After installation, copy the "Bot User OAuth Token" - you'll need this for the `SLACK_BOT_TOKEN` in your `.dev.vars` file
11. Invite the bot to the desired Slack channels by typing `/invite @YourBotName` in each channel

See `manifest.json` for the full Slack App configuration.

## Development

To start the development server:

```bash
npm run start
```

Use ngrok to expose your local server to the internet:

```bash
ngrok http 8787
```

Update the Slack app configuration with the ngrok URL:

```json
"request_url": "https://your-ngrok-url.ngrok.io",
```

## Deployment

To deploy the Worker:

```bash
npm run deploy
```

## After deployment

After deploying we need to add the secrets

```bash
wrangler secret put SLACK_SIGNING_SECRET
wrangler secret put SLACK_BOT_TOKEN
wrangler secret put SLACK_LOGGING_LEVEL  # Optional
```

## Project Structure

- `src/index.ts`: Main application logic
- `src/utils.ts`: Utility functions for formatting tickets and messages
- `package.json`: Project dependencies and scripts
- `wrangler.toml`: Cloudflare Workers configuration
- `manifest.json`: Slack App configuration
- `.dev.vars`: Local environment variables (do not commit this file)

## How it Works

1. The bot listens for app mentions in Slack channels
2. When mentioned in a thread, it analyzes the conversation
3. Using AI, it generates a structured ticket from the conversation
4. The generated ticket is posted back to the Slack thread
5. Users can then create a Linear ticket with a single click

## Useful Docs

- [Cloudflare Workers](https://developers.cloudflare.com/workers)
- [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai)
- [Slack Cloudflare Workers](https://github.com/seratch/slack-cloudflare-workers)
- [Vercel AI SDK](https://sdk.vercel.ai/docs/foundations/overview)
- [Linear API](https://linear.app/developers/api-reference)
