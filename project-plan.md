Travel Agency Website --- Project Plan

1. Source-of-Truth Order

The coding agent must follow:

project-prd.md

project-plan.md

system-architecture.md

project-task.md

If documents conflict, the PRD is the primary product source, while thesystem architecture controls technical implementation.

Phase 0 --- Discovery

Tasks

Inspect repository.

Inspect existing code.

Inspect package.json.

Inspect environment variables.

Inspect existing Firebase configuration.

Inspect existing MongoDB configuration.

Inspect existing routes/components.

Identify reusable code.

Do not rewrite working code unnecessarily.

Gate

Repository structure understood and implementation plan confirmed.

Phase 1 --- Foundation

Implement:

Next.js App Router.

TypeScript strict mode.

Tailwind CSS.

ESLint.

Environment validation.

Common UI components.

Error handling.

Loading states.

Not-found handling.

Logging foundation.

Gate

Application starts cleanly.

Phase 2 --- Firebase Authentication

Implement Firebase client SDK:

Firebase configuration.

Auth provider.

Email/password.

Google provider if enabled.

Email verification.

Password reset.

Logout.

Implement Firebase Admin SDK:

Secure initialization.

ID-token verification.

Session-cookie creation.

Session-cookie verification.

Session revocation handling.

Authentication flow

Firebase Client Sign-in
        ↓
ID Token
        ↓
Next.js /api/auth/session
        ↓
Firebase Admin verification
        ↓
HTTP-only secure session cookie
        ↓
Server-side protected pages/API

Gate

A customer can register/login/logout and access protected account pagessecurely.

Phase 3 --- MongoDB

Implement:

MongoDB Atlas.

Mongoose connection.

Connection reuse.

Models.

Indexes.

Seed script.

Environment validation.

Models:

User.

Destination.

Category.

TourPackage.

Enquiry.

Booking.

Favourite.

Review.

BlogPost.

GalleryItem.

Service.

SiteSetting.

AuditLog.

Gate

MongoDB connects and all models pass validation.

Phase 4 --- Firebase ↔ MongoDB User Synchronization

When a user authenticates:

Firebase UID
   ↓
Find MongoDB User by firebaseUid
   ↓
If absent → create application user
   ↓
If present → update safe profile fields

Do not create duplicate users based on email.

Use:

firebaseUid = unique

Gate

Every authenticated Firebase user has exactly one MongoDB applicationrecord.

Phase 5 --- Authorization

Implement:

customer.

admin.

super_admin.

Request:

Session verification
      ↓
Firebase UID
      ↓
MongoDB User
      ↓
Status check
      ↓
Role/permission check
      ↓
Controller/service

Gate

A customer cannot access admin APIs even if they manipulate thefrontend.

Phase 6 --- Backend APIs

Implement APIs for:

Auth.

Users.

Destinations.

Categories.

Packages.

Enquiries.

Bookings.

Favourites.

Reviews.

Blogs.

Gallery.

Services.

Settings.

Admin.

Gate

Critical API flows pass integration tests.

Phase 7 --- Public Frontend

Build:

Header.

Navigation.

Mobile menu.

Hero.

Destination sections.

Package sections.

Services.

Testimonials.

Gallery.

Blog.

CTA.

Footer.

WhatsApp.

Call.

Gate

Public website visually matches the intended premium travel-agencydirection.

Phase 8 --- Package Experience

Build:

Domestic tours.

International tours.

Destinations.

Package listing.

Filters.

Package details.

Itinerary.

Gallery.

Brochure.

Reviews.

Related packages.

Enquiry.

Booking.

Phase 9 --- Customer Experience

Build:

Account dashboard.

Profile.

Enquiries.

Bookings.

Favourites.

Downloads.

Account security.

Phase 10 --- Admin

Build:

Dashboard.

Packages.

Destinations.

Categories.

Enquiries.

Bookings.

Customers.

Blogs.

Gallery.

Services.

Reviews.

Pages.

SEO.

Settings.

Users/roles.

Phase 11 --- Conversion

Implement:

Contact form.

Package enquiry.

Hotel enquiry.

Car rental enquiry.

E-ticket enquiry.

Booking request.

WhatsApp.

Phone CTA.

Email notifications if provider is configured.

Phase 12 --- SEO / Performance

Implement:

Metadata.

Sitemap.

Robots.

Canonical URLs.

Structured data.

Image optimization.

Lazy loading.

Caching/revalidation.

Pagination.

Core Web Vitals optimization.

Phase 13 --- Security

Audit:

Firebase session validation.

Authorization.

API validation.

Rate limiting.

Spam prevention.

Upload security.

MongoDB query safety.

Cookies.

Headers.

Secrets.

Logs.

Phase 14 --- QA

Run:

TypeScript.

Lint.

Unit tests.

Integration tests.

Auth tests.

Authorization tests.

Enquiry tests.

Booking tests.

Customer tests.

Admin tests.

Responsive tests.

Browser tests.

SEO audit.

Accessibility audit.

Performance audit.

Phase 15 --- Production

Configure:

Firebase production project.

Authorized domains.

Authentication providers.

Firebase service account/server credentials.

MongoDB Atlas production cluster.

MongoDB network access.

Production database user.

Production environment variables.

Hostinger Cloud.

Domain.

SSL.

Build/start commands.

Then run production smoke tests.

Engineering Gate Rule

A phase is not complete because files exist.

A phase is complete only when:

Code works.

Integration works.

Validation works.

Authorization works.

Tests pass.

Build passes.

UI states are handled.

No critical regression exists.