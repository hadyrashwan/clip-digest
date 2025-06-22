<div align="center">
  <img src="./public/favicon.ico" alt="ClipDigest Icon" width="64" height="64">
  <h1>ClipDigest</h1>
</div>

This is a video summary application that leverages AI to generate concise summaries of YouTube videos.

## Features

- Generate summaries of YouTube videos using AI.
- Allows downloading the summary with realistic human-like sound.
- Provides the video transcript.
- Built with Next.js and tRPC.

## Deployment

The application is deployed and available at: [https://clip-digest.vercel.app/](https://clip-digest.vercel.app/)

### Deploy Your Own

You can deploy your own version of ClipDigest to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/hadyrashwan/clip-digest)

## Setup

To set up the project locally, follow these steps:

1.  **Clone the repository:**

    ```bash
    git clone [repository-url]
    cd video-summary
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root directory based on `.env.example` and fill in the necessary values, especially your OpenAI API key.

    ```
    # .env.example
    OPENAI_API_KEY="your_openai_api_key_here"
    ```


## Development

### Start project

```bash
pnpm dev
```

This will start the Next.js development server. Open [http://localhost:3000](http://localhost:3000) in your browser to access the application.

### Testing

To run tests, use the following commands:

-   **Unit Tests:**
    ```bash
    pnpm test-unit
    ```
-   **End-to-End (E2E) Tests:**
    ```bash
    pnpm test-e2e
    ```
-   **Run all tests (E2E + Unit):**
    ```bash
    pnpm test-start
    ```

## TODO

- Refactor `src/pages/index.tsx` into smaller components and simplify state management.
- Update the UI to be mobile-friendly.
- Add Progressive Web App (PWA) support and Web Share API integration for Android.
- Integrate Model Context Protocol (MCP) for broader AI tool compatibility.
- Expose core functions as chatbot integrations for Slack, Discord, Telegram, Messenger, and Instagram.
- Implement support for transcribing any video using `yt-dlp` and a transcription service.
- Extend support for more AI models beyond OpenAI.
