# LUCKY 4K AI

Expo (React Native + TypeScript) Android app + Node.js backend. The app picks a photo, uploads it to **your** backend, the backend runs **Real-ESRGAN** (optional GFPGAN face restoration) on Replicate, and the app downloads the real AI result, shows a before/after slider, and saves/shares it unmodified.

```
app (Expo)  ──upload──▶  server/ (Node, holds the API key)  ──▶  Replicate (Real-ESRGAN)
     ◀── poll status / result URL ──┘
```
The Replicate token lives only in `server/.env`. The app only knows your backend URL.

## 1. Backend

1. Create a Replicate account, add billing (each run is paid; check current pricing), and create a token: https://replicate.com/account/api-tokens
2. Get the model version id:
   ```bash
   curl -s -H "Authorization: Bearer $REPLICATE_API_TOKEN" \
     https://api.replicate.com/v1/models/nightmareai/real-esrgan | grep -o '"latest_version":{"id":"[a-f0-9]*'
   ```
   (or copy it from the model's *API* tab on replicate.com)
3. Run:
   ```bash
   cd server
   cp .env.example .env      # fill in REPLICATE_API_TOKEN and REPLICATE_MODEL_VERSION
   npm install
   npm start                 # http://0.0.0.0:8787 ; check /health
   ```
4. For a real release, deploy `server/` to any Node 18+ host (Render, Railway, Fly.io, a VPS) over **HTTPS**, set the same two env vars there.

## 2. App

```bash
npm install
npx expo install --fix        # aligns native package versions with your Expo SDK
cp .env.example .env          # set EXPO_PUBLIC_API_URL
npm run typecheck
```
- Local test: phone and PC on the same Wi-Fi, use the PC's LAN IP, e.g. `http://192.168.1.50:8787`.
- **Saving to gallery needs a development build or the APK**, not Expo Go on Android 13+ (Expo Go restricts media permissions).
  ```bash
  npx expo run:android     # needs Android Studio/SDK + USB debugging on the Redmi
  ```
  or use the EAS build below and install the APK.

## 3. Build an APK

```bash
npm install -g eas-cli
eas login
eas build:configure          # accept defaults; eas.json is already included
# put your backend URL in the build env:
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://your-backend.example.com
eas build -p android --profile preview     # produces an installable .apk
```
For Google Play use `--profile production` (AAB). Before shipping, set `usesCleartextTraffic` to `false` in `app.json` (only needed for plain-HTTP LAN testing), publish a real privacy policy URL, and replace the contact line in the Privacy screen.

## Behaviour notes
- Photo picker: native Android Photo Picker (no storage permission). JPG/PNG/WEBP only, max 25 MB.
- The backend downscales inputs above 1280 px on the long edge (`MAX_INPUT_EDGE`) so the GPU doesn't run out of memory, then upscales with a scale factor aimed at the chosen target (HD 1920 / 2K 2560 / 4K 3840). The scale is capped at 10×, so tiny images may not reach 4K. The Result screen shows the true output size.
- Progress: stages are real states; the only percentage shown is the actual download progress. The AI step has no percentage because the API doesn't report one.
- Saved images are the downloaded file as-is (no re-compression).
- Errors handled: offline, timeouts, server/API failures, billing/rate limits, unsupported or oversized files, low storage, denied permission; Retry and Cancel on the processing screen (Cancel also cancels the Replicate job).
- The backend is rate-limited per IP but has no user accounts. If you publish it, add auth (e.g. per-install tokens) so strangers can't spend your Replicate credit.

## Structure
```
App.tsx, index.ts, app.json, eas.json
src/screens      Home, Processing, Result, Settings, Info (About/Privacy)
src/components   NeonButton, Card, Header, Segmented, PulseIllustration, BeforeAfterSlider
src/services     api.ts (backend + polling), files.ts (download/save/share), errors.ts
src/context      SettingsContext (persisted with AsyncStorage)
server/index.js  Express API: /api/enhance, /api/enhance/:id, /api/enhance/:id/cancel
```
