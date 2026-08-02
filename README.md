# Project J Tracker (PWA)

Offline-first workout logging app. All data stays in your browser's
`localStorage` on your device — nothing is sent anywhere.

## Install on your phone

1. Open this site's URL in Safari (iOS) or Chrome (Android).
2. iOS: tap Share → **Add to Home Screen**.
   Android: tap the menu → **Install app** (or you'll see an install banner).
3. Launch it from the home screen icon — it now runs standalone, offline.

## Local development

```
python -m http.server 8000
```

Then open `http://localhost:8000`. Note: `file://` won't work — the service
worker requires `http://` or `https://`.
