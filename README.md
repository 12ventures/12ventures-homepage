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
