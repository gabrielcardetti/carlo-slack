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

### Slack App Manifest

See `manifest.json` for the full Slack App configuration.

## Development

To start the development server:

```
npm run start
```

## Deployment

To deploy the Worker:

```
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
