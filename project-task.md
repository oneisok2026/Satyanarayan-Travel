Travel Agency Website --- Project Task List

Status

[ ] Not started

[~] In progress

[x] Complete

[!] Blocked

Phase 0 --- Project Inspection

Read project-prd.md.

Read project-plan.md.

Read system-architecture.md.

Read project-task.md.

Inspect repository.

Inspect package.json.

Inspect existing Next.js setup.

Inspect existing Firebase setup.

Inspect existing MongoDB setup.

Inspect existing authentication.

Inspect existing routes.

Inspect existing UI.

Preserve valid existing implementation.

Phase 1 --- Foundation

Configure Next.js App Router.

Configure TypeScript strict mode.

Configure Tailwind.

Configure ESLint.

Configure formatting.

Configure environment validation.

Create .env.example.

Create common API response helpers.

Create error system.

Create loading states.

Create error states.

Create not-found handling.

Create reusable UI primitives.

Phase 2 --- Firebase Client

Create Firebase project configuration.

Configure Firebase Web SDK.

Configure Firebase Auth.

Enable required providers.

Email/password.

Google provider if required.

Email verification.

Password reset.

Logout.

Auth state handling.

Auth loading state.

Auth error mapping.

Phase 3 --- Firebase Admin

Install Firebase Admin SDK.

Secure Admin SDK initialization.

Server-only Firebase module.

ID-token verification helper.

Session-cookie creation.

Session-cookie verification.

Session-cookie clearing.

Revocation handling.

Authentication middleware/helper.

Authorization helper.

Phase 4 --- Firebase ↔ MongoDB User Sync

Create User model.

Add firebaseUid.

Add unique index.

Create user sync service.

Create user on first authenticated access.

Update safe Firebase profile fields.

Prevent duplicate users.

Handle disabled/deleted Firebase accounts.

Add role/status handling.

Phase 5 --- MongoDB

Configure MongoDB Atlas.

Configure Mongoose.

Connection reuse.

User model.

Destination model.

Category model.

TourPackage model.

Enquiry model.

Booking model.

Favourite model.

Review model.

BlogPost model.

GalleryItem model.

Service model.

SiteSetting model.

AuditLog model.

Add indexes.

Create seed script.

Add database health check.

Phase 6 --- Backend Core

Validation system.

Authentication helpers.

Authorization helpers.

Pagination.

Filtering.

Sorting.

Error mapping.

Logging.

Rate limiting.

Spam protection.

Phase 7 --- Package APIs

Public package listing.

Public package detail.

Package search.

Package filtering.

Package pagination.

Admin create.

Admin update.

Admin delete/archive.

Featured packages.

Related packages.

Phase 8 --- Destination APIs

Public destination list.

Destination detail.

Admin CRUD.

Featured destinations.

SEO fields.

Phase 9 --- Enquiry APIs

General enquiry.

Package enquiry.

Hotel enquiry.

Car rental enquiry.

E-ticket enquiry.

Customer enquiry history.

Admin enquiry listing.

Status update.

Internal notes.

Admin notification.

Customer confirmation.

Phase 10 --- Booking APIs

Booking request.

Server-side package lookup.

Server-side pricing.

Booking reference generation.

Duplicate request protection.

Customer booking history.

Admin booking listing.

Booking status.

Payment status.

Admin notes.

Optional payment gateway.

Payment verification.

Payment idempotency.

Phase 11 --- Customer APIs

Get current user.

Update profile.

Enquiries.

Bookings.

Favourites.

Reviews.

Downloads.

Phase 12 --- Review APIs

Submit review.

Prevent unauthorized reviews.

Rating validation.

Moderation.

Admin approve/reject.

Public approved reviews.

Phase 13 --- Blog APIs

Public blog list.

Blog detail.

Admin create.

Admin edit.

Draft.

Publish.

Delete/archive.

Categories/tags.

SEO metadata.

Phase 14 --- Gallery APIs

Album management.

Image management.

Captions.

Ordering.

Public gallery.

Upload validation.

Phase 15 --- Services APIs

Service listing.

Service detail.

Admin CRUD.

Service enquiry.

Phase 16 --- Admin APIs

Dashboard statistics.

Customer management.

Role management.

Package management.

Destination management.

Enquiry management.

Booking management.

Blog management.

Gallery management.

Service management.

Review moderation.

Site settings.

SEO settings.

Audit logs.

Phase 17 --- Public UI

Header.

Top bar.

Desktop navigation.

Mobile navigation.

Hero.

Destination cards.

Package cards.

Domestic tours.

International tours.

Services.

Why choose us.

Testimonials.

[Gallery preview.

Blog preview.

CTA.

Footer.

WhatsApp button.

Call button.

Phase 18 --- Public Pages

Home.

About.

Tours.

Domestic.

International.

Destinations.

Destination detail.

Package detail.

Services.

Hotel booking.

Car rental.

E-ticket.

Gallery.

Blog.

Blog detail.

Contact.

Rules.

Privacy.

Terms.

Phase 19 --- Customer UI

Login.

Register.

Email verification.

Forgot password.

Account dashboard.

Profile.

Enquiries.

Bookings.

Favourites.

Downloads.

Logout.

Protected route handling.

Phase 20 --- Admin UI

Admin login.

Admin protection.

Dashboard.

Package CRUD.

Destination CRUD.

Category CRUD.

Enquiries.

Bookings.

Customers.

Blogs.

Gallery.

Services.

Reviews.

Settings.

SEO.

Admin users.

Permissions.

Phase 21 --- UI/UX

Reference-inspired visual system.

Color system.

Typography.

Spacing system.

Card system.

Button system.

Form system.

Responsive design.

Hover interactions.

Scroll animations.

Mobile menu animation.

Reduced-motion support.

Phase 22 --- Performance

Next/Image.

Hero optimization.

Lazy loading.

Responsive image sizes.

Prevent CLS.

Reduce client JS.

Server Components.

Pagination.

MongoDB indexes.

Public content caching.

Third-party script optimization.

Phase 23 --- SEO

Global metadata.

Package metadata.

Destination metadata.

Blog metadata.

Canonicals.

Open Graph.

Twitter cards.

Sitemap.

Robots.

Breadcrumbs.

Structured data.

Alt text.

SEO-friendly slugs.

Phase 24 --- Security

Firebase session verification.

Firebase token verification.

MongoDB user lookup.

Role authorization.

Input validation.

Rate limiting.

Spam protection.

Secure cookies.

Security headers.

File validation.

Secret protection.

Audit logging.

Sensitive log review.

Client authorization review.

Phase 25 --- Testing

Auth unit tests.

Auth integration tests.

Authorization tests.

User synchronization tests.

Package API tests.

Enquiry tests.

Booking tests.

Favourite tests.

Review tests.

Admin tests.

Customer isolation tests.

Payment verification tests if enabled.

Responsive UI testing.

Browser testing.

Phase 26 --- Production

Firebase production project.

Firebase authorized domains.

Firebase providers.

Firebase Admin credentials.

MongoDB Atlas production cluster.

Production DB user.

MongoDB network access.

Production environment variables.

Hostinger Cloud setup.

Domain.

SSL.

Build command.

Start command.

Production smoke tests.

Backup strategy.

Monitoring/error logging.

Final Gate

TypeScript passes.

Lint passes.

Tests pass.

Production build passes.

Firebase login works.

Firebase session works.

MongoDB works.

User synchronization works.

Customer isolation works.

Admin authorization works.

Packages work.

Enquiries work.

Bookings work.

Customer dashboard works.

Admin dashboard works.

SEO works.

Performance acceptable.

Accessibility acceptable.

Production deployment works.