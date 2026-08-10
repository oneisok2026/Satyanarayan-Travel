# Satyanarayan Travel

Production travel agency website — tour package discovery, enquiries, agency-managed
bookings, customer accounts and an admin CMS.

## Stack

| Layer          | Technology                              |
| -------------- | --------------------------------------- |
| Framework      | Next.js 15 (App Router), React 19        |
| Language       | TypeScript (strict)                      |
| Styling        | Tailwind CSS v4                          |
| Authentication | Firebase Authentication + Admin SDK      |
| Database       | MongoDB Atlas + Mongoose                 |
| Runtime        | Node.js 24 LTS (target), Node 22+ works  |
| Hosting        | Hostinger Cloud                          |

**Firebase owns identity. MongoDB owns application data.** These responsibilities are
never mixed: `firebaseUid` is the immutable bridge between them, and roles are enforced
server-side from MongoDB rather than trusted from the client.

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev
```

The app builds without credentials, but authentication and database features require a
Firebase project and a MongoDB Atlas cluster. See **Environment** below.

## Scripts

| Command             | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Development server                               |
| `npm run build`     | Production build                                 |
| `npm start`         | Serve the production build                       |
| `npm run typecheck` | TypeScript, no emit                              |
| `npm run lint`      | ESLint                                           |
| `npm test`          | Vitest                                           |
| `npm run seed`      | Seed the database                                |
| `npm run verify`    | typecheck → lint → test → build (the full gate)  |

## Environment

Copy `.env.example` to `.env.local`. Two groups of variables:

- `NEXT_PUBLIC_*` — sent to the browser. Firebase Web SDK config and public contact
  details only.
- Everything else — **server only**. Never prefix a secret with `NEXT_PUBLIC_`.

Required to run auth and the database:

- `NEXT_PUBLIC_FIREBASE_*` — Firebase Console → Project settings → Your apps → Web app
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase
  Console → Project settings → Service accounts → Generate new private key
- `MONGODB_URI` — MongoDB Atlas connection string

Environment variables are validated with Zod at startup ([`src/lib/env.ts`](src/lib/env.ts));
a missing or malformed value fails loudly with a message naming the variable.

## Project structure

```
src/
├── app/              # App Router: pages, layouts, route handlers
├── components/
│   ├── ui/           # Design-system primitives
│   └── auth/         # Auth context and guards
├── lib/
│   ├── firebase/     # client.ts (browser) · admin.ts + session.ts (server only)
│   ├── db/           # Mongoose connection
│   ├── env.ts        # Validated environment
│   ├── errors.ts     # AppError taxonomy
│   └── api-response.ts
├── models/           # Mongoose schemas
├── types/            # Serialized DTOs
└── constants/        # Enums and shared configuration
```

## Security notes

- Session cookies are HTTP-only, `Secure` in production, `SameSite=Lax`, and verified
  server-side with `checkRevoked` so a suspended account loses access immediately.
- Files under `src/lib/firebase/admin.ts` and `session.ts` import `server-only`, making
  it a build error for client code to pull in the Admin SDK.
- Authorization always resolves the MongoDB user server-side. Client-supplied role
  values are never trusted.
- The logger redacts password-, token-, and cookie-shaped keys before writing.

## Documentation

Product and technical specifications live at the repository root:
[`project-prd.md`](project-prd.md), [`project-plan.md`](project-plan.md),
[`architecture`](architecture), [`project-task.md`](project-task.md).
