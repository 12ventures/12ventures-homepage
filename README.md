# 12ventures-homepage

Landing page at [https://12ventures.io](https://12ventures.io/) and [https://www.12ventures.io/](https://www.12ventures.io/). Currently hosted at AWS Amplify.

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS (via CDN)

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This project is configured for automatic deployment via AWS Amplify. Any push to the `main` branch will trigger a build and deployment.

The build configuration is defined in `amplify.yml`.

### Haven share previews (Open Graph)

Crawlers need HTML with `og:*` tags. The API serves that on `/haven/store/product|look/{id}` (bot UA) and 302s browsers to the SPA.

Amplify cannot filter rewrites by User-Agent. Proxying *all* traffic for those paths to the API would loop with that 302. So the share button copies/shares the **API** share URL by default (origin from `VITE_HAVEN_SHARE_ORIGIN`, else derived from `VITE_MLKCH_API_URL`).

Optional later (pretty SPA share URLs): only after the API returns SPA-shaped HTML for everyone on those paths (no 302), paste `hosting/amplify-custom-rules.json` into Amplify → Hosting → Rewrites and redirects (replace `REPLACE_WITH_API_HOST`), then set `VITE_HAVEN_SHARE_ORIGIN` to the SPA origin.
