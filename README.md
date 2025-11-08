<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# K-Beauty Personal Shopper

This is a web-based personalized skincare recommendation service that leverages Gemini to find the perfect skincare products from Korean e-commerce websites.

View your app in AI Studio: https://ai.studio/apps/drive/1r-NHkYSIqhS2fqooHaFFNIdKEv6kyaoU

## Getting Started

This project is built with React, Vite, and Tailwind CSS.

### Prerequisites

- Node.js (v18 or later recommended)
- A Gemini API Key. You can get one from [Google AI Studio](https://ai.studio.google.com/app/apikey).

### Running Locally

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up your environment variables:**
    Create a file named `.env.local` in the root of your project and add your Gemini API key:
    ```
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Deploying to Vercel

You can deploy this application to Vercel with a few clicks.

1.  **Push to a Git Repository:**
    Push your project code to a GitHub, GitLab, or Bitbucket repository.

2.  **Import Project on Vercel:**
    - Go to your Vercel dashboard and click "Add New... > Project".
    - Import the Git repository you just pushed.
    - Vercel will automatically detect that this is a Vite project and configure the build settings for you.

3.  **Configure Environment Variables:**
    - In the project settings on Vercel, navigate to the **Settings > Environment Variables** section.
    - Add a new environment variable:
      - **Name:** `GEMINI_API_KEY`
      - **Value:** Paste your Gemini API key here.
    - Click "Save".

4.  **Deploy:**
    - Go back to the deployment screen and click the "Deploy" button.
    - Vercel will build and deploy your application. You'll be provided with a public URL once it's complete.