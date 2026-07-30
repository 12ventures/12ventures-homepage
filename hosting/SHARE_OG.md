# Haven share URLs + Open Graph (Amplify)

Goal: copied links look like `https://www.12ventures.io/haven/store/product/{id}` (or `/look/{id}`) while Slack/iMessage still get `og:*` previews.

## Order of operations

1. Backend ships the behavior in “Backend requirements” below.
2. You apply Amplify rewrites from `amplify-custom-rules.json`.
3. Deploy this frontend (prod share URLs use the site origin automatically).

## Your steps (Amplify)

1. Open the Amplify app for **12ventures.io** → **Hosting** → **Rewrites and redirects**.
2. Open the text/JSON editor.
3. Paste the full contents of `hosting/amplify-custom-rules.json`.
   - Share proxy rules **must stay above** the SPA `index.html` fallback.
   - If you already have other rules, merge carefully: keep product/look proxies first, SPA fallback last.
4. Save.
5. Confirm Amplify env `VITE_MLKCH_API_URL` points at the same API host as the rewrite target (`https://api-staging.snapskill.io/api/v1` today).
6. Optional: `VITE_HAVEN_SHARE_ORIGIN=https://www.12ventures.io` (prod already defaults to `window.location.origin`).
7. Redeploy the frontend after backend + rewrites are live.

### Smoke test

```bash
# Should return HTML containing og:title / og:image (not a bare Vite shell)
curl -sL -A "Slackbot-LinkExpanding 1.0" \
  "https://www.12ventures.io/haven/store/product/PRODUCT_ID" | findstr og:

# Browser: open the same URL — full Haven PDP should load (not a redirect loop)
```

Also: Share → Copy on a product should show a `www.12ventures.io` URL; paste into Slack and confirm the preview card.

## Backend requirements

See the handoff blurb in the PR/chat; summary:

- `GET /haven/store/product/{id}` and `GET /haven/store/look/{id}` must **always return 200** HTML with the OG contract when proxied from the public site.
- **Do not 302** browsers to `HAVEN_PUBLIC_APP_URL` for the same path (Amplify proxy + 302 = loop).
- HTML must be **SPA-shaped**: include `og:*` / twitter tags **and** boot the Vite app via same-origin `/assets/*` (and root mount) so humans get the real PDP/look page on `www.12ventures.io`.
- Keep absolute HTTPS `og:image`. Missing/inactive entities → generic Haven 200 preview (no broken image).
