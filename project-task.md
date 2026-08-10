Travel Agency Website --- Project Task List

Status legend

[x] Complete — implemented AND verified (typecheck, lint, tests, build,
    and where applicable a live check against Firebase/MongoDB)
[~] Partial — working, with a stated limitation
[ ] Not started
[!] Blocked — needs action outside the codebase

A task is not complete because a file exists. Every [x] below has been
exercised against the running application or the live services.

Verification commands
  npm run typecheck        TypeScript, no emit
  npm run lint             ESLint
  npm test                 102 unit tests
  npm run build            production build
  npm run verify           all four in sequence
  npm run verify:indexes   syncs and asserts MongoDB indexes
  npm run verify:isolation customer isolation, live services
  npm run verify:routes    protected routes, needs a running server
  npm run verify:crud      catalogue CRUD, needs a running server
  npm run verify:deploy    deployment readiness

================================================================
Phase 0 --- Project Inspection
================================================================

[x] Read project-prd.md
[x] Read project-plan.md
[x] Read system-architecture.md (the file named `architecture`)
[x] Read project-task.md
[x] Inspect repository — greenfield; no code existed to preserve
[x] Inspect package.json — none existed
[x] Inspect existing Next.js / Firebase / MongoDB setup — none existed
[x] Preserve valid existing implementation — nothing to preserve

================================================================
Phase 1 --- Foundation
================================================================

[x] Next.js 15 App Router
[x] TypeScript strict, with noUncheckedIndexedAccess
[x] Tailwind CSS v4
[x] ESLint flat config
[x] Prettier
[x] Environment validation (Zod, client/server split)
[x] .env.example
[x] API response helpers — the envelope from architecture §15
[x] Error system — AppError taxonomy with HTTP status mapping
[x] Loading states — route-level and skeletons
[x] Error states — error.tsx, global-error.tsx
[x] Not-found handling
[x] Reusable UI primitives — 16 components

Gate: application starts cleanly. VERIFIED.

================================================================
Phase 2 --- Firebase Client
================================================================

[x] Firebase project configuration
[x] Firebase Web SDK, lazy initialisation
[x] Firebase Auth
[x] Email/password provider — enabled and verified live
[~] Google provider — implemented, disabled by default
    Set NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true after enabling it in Firebase.
[x] Email verification
[x] Password reset
[x] Logout
[x] Auth state handling
[x] Auth loading state
[x] Auth error mapping — credential failures collapse to one message so the
    form cannot be used to enumerate registered emails

================================================================
Phase 3 --- Firebase Admin
================================================================

[x] Firebase Admin SDK installed
[x] Secure initialisation, memoised
[x] Server-only module — `server-only` makes a client import a build error
[x] ID-token verification, with checkRevoked
[x] Session-cookie creation
[x] Session-cookie verification
[x] Session-cookie clearing
[x] Revocation handling
[x] Authentication helper — requireUser
[x] Authorization helpers — requireRole / requireAdmin / requireSuperAdmin

Verified live: 18/18 checks including mint, verify and rejection of a
revoked session.

================================================================
Phase 4 --- Firebase <-> MongoDB User Sync
================================================================

[x] User model
[x] firebaseUid as the identity bridge
[x] Unique index on firebaseUid
[x] User sync service
[x] Create on first authenticated access
[x] Update safe Firebase profile fields only
[x] Prevent duplicate users — atomic upsert, no find-then-create race
[x] Handle disabled/deleted Firebase accounts
[x] Role/status handling — $setOnInsert only, so re-auth never resets them

================================================================
Phase 5 --- MongoDB
================================================================

[x] MongoDB Atlas
[x] Mongoose
[x] Connection reuse — promise-level caching
[x] User, Destination, Category, TourPackage, Enquiry, Booking
[x] Favourite, Review, BlogPost, GalleryItem, Service, SiteSetting, AuditLog
[x] Indexes — 13/13 models verified against the live cluster
[x] Seed script — idempotent, upserts keyed on slug
[x] Database health check — /api/health

================================================================
Phase 6 --- Backend Core
================================================================

[x] Validation system — Zod at every route boundary
[x] Authentication helpers
[x] Authorization helpers
[x] Pagination — capped server-side
[x] Filtering
[x] Sorting
[x] Error mapping — Zod, Mongoose and duplicate-key errors normalised
[x] Logging — structured, redacts credential-shaped keys
[~] Rate limiting — in-process fixed window
    Per-process counters. Move to Redis before scaling horizontally.
[x] Spam protection — honeypot, timing, content heuristics

================================================================
Phase 7-16 --- APIs
================================================================

[x] Public package listing, detail, search, filtering, pagination
[x] Featured and related packages
[x] Public destination list and detail
[x] General, package, hotel, car rental and e-ticket enquiries
[x] Customer enquiry history
[x] Admin enquiry listing, status update, internal notes
[x] Booking request with server-side pricing
[x] Booking reference generation
[x] Duplicate request protection — idempotency key
[x] Customer booking history, admin listing, status and payment status
[x] Customer APIs — profile, enquiries, bookings, favourites, reviews
[x] Review submission, moderation, public approved reviews
[x] Blog, gallery and service APIs
[x] Admin dashboard statistics, customer and role management
[x] Catalogue CRUD — create, update, delete, status toggle
[x] Audit logs
[!] Optional payment gateway — out of scope by agreement.
    Bookings are agency-managed; admin sets payment status manually.
[~] Admin notification / customer confirmation emails
    Implemented behind a provider abstraction. Inert until EMAIL_PROVIDER
    is set; Resend is wired, SMTP is declared but not implemented.

================================================================
Phase 17-18 --- Public UI and Pages
================================================================

[x] Header, top bar, desktop and mobile navigation
[x] Hero, destination cards, package cards
[x] Domestic and international tour sections
[x] Services, why choose us, gallery preview, blog preview, CTA
[x] Footer, WhatsApp button
[x] Home, About, Tours, Domestic, International
[x] Destinations, destination detail, package detail
[x] Services and the three service pages
[x] Gallery, Blog, blog detail, Contact
[x] Rules, Privacy, Terms

All 19 routes verified returning 200 against live data.

Note: the floating call button was removed at your request. Phone contact
remains in the header, footer, mobile menu, enquiry panel and contact page.

================================================================
Phase 19 --- Customer UI
================================================================

[x] Login, register, forgot password
[x] Email verification notice
[x] Account dashboard with live counts
[x] Profile, enquiries, bookings, booking detail, favourites, downloads
[x] Logout
[x] Protected route handling — server session verified on every page

================================================================
Phase 20 --- Admin UI
================================================================

[x] Admin login — dedicated page, same Firebase authentication
[x] Admin protection — 404 for signed-in non-admins
[x] Dashboard
[x] Package, destination, category, service and blog listings with
    search, filters, pagination, edit, delete and status toggle
[x] Enquiries, bookings, customers, reviews
[x] Pages, SEO, settings, admin users
[x] Permissions — super_admin for content writes and deletes
[~] Gallery — listing and status toggle; no upload form yet
[~] Settings — read-only listing; edit form not built

================================================================
Phase 21 --- UI/UX
================================================================

[x] Original visual system — ocean teal and sunset coral on sand
[x] Colour, typography, spacing, card, button and form systems
[x] Responsive design
[x] Hover interactions, scroll animations, mobile menu animation
[x] Reduced-motion support — one global off switch in globals.css

================================================================
Phase 22 --- Performance
================================================================

[x] Next/Image throughout
[x] Hero optimisation — priority, fetchPriority=high
[x] Lazy loading below the fold — 30 lazy images on the homepage
[x] Responsive image sizes
[x] CLS prevention — fixed aspect ratios on every image box
[x] Reduced client JS — Server Components by default
[x] Pagination
[x] MongoDB indexes
[x] Public content caching and revalidation
[x] Third-party scripts — none loaded

================================================================
Phase 23 --- SEO
================================================================

[x] Global, package, destination and blog metadata
[x] Canonicals
[x] Open Graph and Twitter cards
[x] Dynamic sitemap — falls back to static routes if the database is down
[x] Robots — private routes excluded
[x] Breadcrumbs with BreadcrumbList structured data
[x] TravelAgency, Product and BlogPosting structured data
[x] Alt text — required by the image sub-schema
[x] SEO-friendly slugs

================================================================
Phase 24 --- Security
================================================================

[x] Firebase session verification
[x] Firebase token verification
[x] MongoDB user lookup on every privileged request
[x] Role authorization — read from MongoDB, never from a token claim
[x] Input validation — strict schemas reject unknown keys
[x] Rate limiting, including failed sign-in attempts per IP
[x] Spam protection
[x] Secure cookies — HttpOnly, Secure in production, SameSite=Lax
[x] Security headers — HSTS, X-Frame-Options, X-Content-Type-Options
[x] File validation — magic bytes, not the declared MIME type
[x] Secret protection — 34 automated tests fail the build on a leak
[x] Audit logging
[x] Sensitive log review — logger redacts credential-shaped keys
[x] Client authorization review — no endpoint trusts a client-supplied role

================================================================
Phase 25 --- Testing
================================================================

Unit and static tests — 102 passing

[x] Pricing boundaries (7)
[x] Security: injection, traversal, redaction, escalation payloads (16)
[x] Customer isolation and schema guards (13)
[x] Environment variable safety (34)
[x] Accessibility audit (32)

Live integration — verified against Firebase and MongoDB

[x] Registration, login, logout, email verification, password reset
[x] Invalid token, expired session, revoked session
[x] User creation, duplicate firebaseUid rejection
[x] Package CRUD, enquiry, booking, favourite, review
[x] Customer cannot access admin — 404 on pages, 403 on APIs
[x] Customer cannot access another customer's booking — 404, not 403
[x] Customer cannot alter role — strict schema rejects the field
[x] Admin cannot perform super-admin actions — 403 on create/edit/delete
[x] Enquiry creation, booking creation, price validation
[x] Duplicate booking protection — idempotent retry
[x] Public navigation, mobile menu, package detail, enquiry, login,
    account and admin routes — all verified rendering
[!] Payment verification — not applicable; no gateway in scope
[~] Browser testing — verified by HTTP rendering, not a real browser.
    A manual pass on Safari and Firefox is still advisable.

================================================================
Phase 26 --- Accessibility
================================================================

[x] Keyboard navigation
[x] Focus states — visible ring, never removed without replacement
[x] Semantic headings
[x] Labels — every control wired to its label
[x] Accessible forms — aria-describedby, aria-invalid, role="alert"
[x] Accessible dialogs — focus trap, Escape, focus restore, scroll lock
[x] Accessible menus — inert while closed, aria-expanded, aria-current
[x] Screen-reader text — icon-only controls all labelled
[x] Contrast — brand palette meets AA for body text
[x] Reduced motion — global off switch; revealed content stays visible

32 automated checks. A manual screen-reader pass is still recommended
before launch.

================================================================
Phase 27-28 --- Environment Variables
================================================================

[x] Client variables documented and validated
[x] Server variables documented and validated
[x] Only required variables included
[x] MONGODB_URI, FIREBASE_PRIVATE_KEY and provider secrets are
    server-only — enforced by 34 tests that fail the build on a leak

================================================================
Phase 29 --- Deployment
================================================================

[x] DEPLOYMENT.md — full Hostinger Cloud guide
[x] npm run verify:deploy — automated readiness check
[x] Build command verified
[x] Start command verified — standalone output
[x] Environment variables verified
[x] MongoDB Atlas connection verified live
[x] Firebase server credentials verified live
[!] Node version — this machine runs 22; the target is 24 LTS.
    Set Node 24 in the Hostinger runtime.
[!] Firebase authorized domains — add the production domain before launch
[!] MongoDB Atlas network access — add the Hostinger server IP
[!] Production DB user — create one scoped to this database
[!] SSL and domain — issue the certificate and force HTTPS
[!] Rotate credentials shared during development

================================================================
Outstanding before launch
================================================================

Blocked on access outside the codebase:

  1. Rotate the Firebase service account key and MongoDB password shared
     during development.
  2. Add the production domain to Firebase authorized domains.
  3. Add the Hostinger server IP to the Atlas allowlist.
  4. Create a production Atlas user scoped to this database.
  5. Issue SSL and force HTTPS.
  6. Set Node 24 on the host.
  7. Replace the Unsplash placeholder images with licensed photography.
  8. Change the admin password from admin@123 — /admin/login is public.

Known limitations, by decision:

  - No payment gateway. Bookings are agency-managed.
  - SMTP declared but not implemented; Resend is wired.
  - Gallery upload and settings edit forms not built.
  - Rate limiting is per-process; move to Redis before scaling out.
