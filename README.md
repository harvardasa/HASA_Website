This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Admin Dashboard

This project now includes a protected admin content-management dashboard.

### Configure Access

Create a `.env.local` file and define:

```bash
ADMIN_DASHBOARD_KEY=your-strong-admin-key
```

If this key is missing in local development, a convenience fallback key is enabled:

```bash
hasa-admin
```

In production, there is no fallback: `ADMIN_DASHBOARD_KEY` must be set.

### Admin Routes

- `/admin/login` - admin sign-in
- `/admin` - dashboard overview
- `/admin/events` - create/edit/delete events
- `/admin/gallery` - upload/manage gallery media
- `/admin/content` - edit short public copy used by events and gallery pages

### Notes

- Admin pages are protected by middleware and an HTTP-only session cookie.
- Admin APIs are isolated under `/api/admin/*` and use a server adapter so backend integration can be swapped later.
- Public pages continue reading from the same content JSON files (`content/events.json`, `content/gallery.json`), with optional editable copy in `content/site-content.json`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
