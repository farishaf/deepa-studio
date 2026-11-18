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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Internal Studio: login & roles

`/studio` (timeline, calendar, board) is an internal tool, unlinked from the landing page and protected by login.

- **Database:** a single SQLite file via Node's built-in `node:sqlite` (**Node >= 22.13**). No server, no native build.
  It is created automatically at `./data/deepa.db` (override with `DATABASE_PATH`; keep it on a persistent disk).
- **First run:** open `/login`. With no users yet you are sent to `/setup` to create the first admin.
  On a public deploy, set `ADMIN_EMAIL` + `ADMIN_PASSWORD` instead so `/setup` is never exposed.
- **Roles:** `admin` (manages users at `/studio/users`) and `user`. Admins add users; the new user gets an
  invite link (7 days) to choose their own password. Admins can also generate reset links and change roles.
- **Forgot password:** `/forgot-password` sends a 1-hour single-use link. Set `SMTP_URL` + `APP_URL` to email it;
  otherwise it is printed to the server log (and admins can copy links from the Users page).
- **Run:** `npm run build && npm start` (see `.env.example` for all settings).

> Studio items are still stored in each browser's localStorage, not in the database.
