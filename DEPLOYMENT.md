# Deployment — Hostinger Cloud

Target architecture:

```
Domain (SSL)
   ↓
Hostinger Cloud — Next.js on Node.js 24 LTS
   ├── MongoDB Atlas
   ├── Firebase Authentication
   └── Email provider (optional)
```

Run `npm run verify:deploy` before every deployment. It checks the Node
version, build and start commands, environment variables, live database and
Firebase connectivity, and prints the manual console steps below.

---

## 1. Before you start

| Requirement | Notes |
| --- | --- |
| Node.js 24 LTS | The PRD target. Builds succeed on 22, but production should match. |
| MongoDB Atlas cluster | With a dedicated production user. |
| Firebase project | Email/Password sign-in enabled. |
| Domain with SSL | Session cookies are `Secure` and will not be sent over http. |

---

## 2. Environment variables

`.env.local` is git-ignored, so **nothing is inherited from a developer
machine**. Every variable must be set in the Hostinger panel.

### Client — sent to the browser

These six identify the Firebase project. They are designed to be public;
security comes from Firebase rules and authorized domains, not from hiding
them.

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

Also required:

```
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=Satyanarayan Tour & Travel PVT. LTD.
NEXT_PUBLIC_CONTACT_PHONE=+918910102904
NEXT_PUBLIC_CONTACT_PHONE_ALT=+919366692603,+918282030868
NEXT_PUBLIC_WHATSAPP_NUMBER=918910102904
NEXT_PUBLIC_CONTACT_EMAIL=satyanarayantourandtravel@gmail.com
```

`NEXT_PUBLIC_SITE_URL` must be the live https domain — canonical URLs, Open
Graph tags and the sitemap are all built from it.

### Server — never sent to the browser

```
MONGODB_URI
MONGODB_DB_NAME
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
SESSION_COOKIE_NAME=__session
SESSION_COOKIE_DAYS=5
NODE_ENV=production
```

Optional, for enquiry and booking emails:

```
EMAIL_PROVIDER=resend
RESEND_API_KEY
EMAIL_FROM
EMAIL_ADMIN_RECIPIENTS
```

> **Never prefix a secret with `NEXT_PUBLIC_`.** That inlines it into the
> browser bundle, where it is permanently readable. `npm test` fails the build
> if this happens, and `verify:deploy` checks it again at deploy time.

`FIREBASE_PRIVATE_KEY` spans multiple lines. Paste it in double quotes keeping
the literal `\n` sequences — the env loader converts them.

---

## 3. Build and start

```bash
npm ci                # exact versions from package-lock.json
npm run build         # next build
```

`next.config.mjs` sets `output: 'standalone'`, so the production start command
is:

```bash
node .next/standalone/server.js
```

Set `PORT` in the Hostinger panel if the default is not 3000.

> `npm start` runs `next start`, which prints a warning under `standalone` and
> is intended for local checks only.

The standalone bundle does **not** include `public/` or `.next/static/`. Copy
both alongside `server.js` when deploying manually:

```
.next/standalone/
├── server.js
├── .next/static/     ← copy from .next/static
└── public/           ← copy from public
```

---

## 4. Firebase Console

**Authentication → Sign-in method**
Enable **Email/Password**. Without it, registration and sign-in fail with
`auth/operation-not-allowed`.

**Authentication → Settings → Authorized domains**
Add your production domain. Sign-in fails on any domain not listed — this is
the single most common cause of "login works locally but not in production".

**Project settings → Service accounts**
Generate a private key for production. Use a key that has never been shared,
and delete any key that has been.

---

## 5. MongoDB Atlas

**Network Access**
Add the Hostinger server's outbound IP. Without it connections *hang* rather
than failing fast, which looks like a slow site rather than a config error.

**Database Access**
Create a production user with `readWrite` on this database only — not
`atlasAdmin`. Use a password you generate, not one reused from development.

**Connection string**
Prefer the `mongodb+srv://` form. A non-SRV URI pins shard hostnames that Atlas
rotates during maintenance, and connections break with `ENOTFOUND` when it
does.

---

## 6. First run

```bash
npm run verify:indexes                        # creates every index
npm run seed                                  # optional demo catalogue
npm run create:admin -- <email> <password>    # first super admin
```

`verify:indexes` is safe to re-run and should be run after every deployment
that changes a schema.

---

## 7. Post-deployment checks

```bash
curl https://yourdomain.com/api/health
```

Expect `"status": "healthy"` with the database and Firebase Admin both `ok`.

Then confirm by hand:

- [ ] Home page loads with real packages
- [ ] A package detail page renders with its itinerary
- [ ] The enquiry form submits and you receive the enquiry
- [ ] Registration creates an account, and it appears in Admin → Customers
- [ ] Sign-in works, and `/account` shows the dashboard
- [ ] `/admin` redirects to the admin sign-in when signed out
- [ ] A customer account gets 404 on `/admin`
- [ ] `/sitemap.xml` and `/robots.txt` return the production domain
- [ ] The WhatsApp button opens a chat to the right number

---

## 8. Security checklist

- [ ] `SESSION_COOKIE_DAYS` set (default 5, maximum 14)
- [ ] SSL issued and HTTPS forced
- [ ] No secret carries a `NEXT_PUBLIC_` prefix
- [ ] The admin password is not a dictionary word — `/admin/login` is public
      and attracts automated attempts
- [ ] Any credential shared during development has been rotated
- [ ] Atlas user is scoped to one database, not `atlasAdmin`

---

## 9. Ongoing

**Backups.** Atlas takes automatic snapshots on M10 and above. On the free M0
tier there are none — export regularly with `mongodump` if you stay on it.

**Monitoring.** Logs are single-line JSON in production, ready for any log
shipper. `/api/health` suits an uptime monitor.

**Rate limiting.** Counters are per-process and in-memory, so running multiple
instances multiplies the effective limit. Move the store to Redis if you scale
horizontally — the call sites do not change.

**Images.** The seeded catalogue uses Unsplash placeholders. Replace them with
licensed photography before launch.
