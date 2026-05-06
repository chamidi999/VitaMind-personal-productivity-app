<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/4d0cf6ff-6670-471b-8d7f-9e11785ab474

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Port configuration (dev)

If you already have another process running, you can customize the ports:

- App server port (default `3000`):
  - PowerShell: `$env:PORT=3001; npm run dev`
  - macOS/Linux: `PORT=3001 npm run dev`
- Vite HMR websocket port (default Vite behavior):
  - PowerShell: `$env:HMR_PORT=24679; npm run dev`
  - macOS/Linux: `HMR_PORT=24679 npm run dev`
- Disable HMR entirely (if websocket port conflicts):
  - PowerShell: `$env:DISABLE_HMR='true'; npm run dev`
  - macOS/Linux: `DISABLE_HMR=true npm run dev`
