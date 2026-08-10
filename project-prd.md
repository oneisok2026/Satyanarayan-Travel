Travel Agency Website --- Project PRD

Project: Professional Travel Agency WebsiteArchitecture: Next.js App Router + TypeScript + Next.js RouteHandlers + Firebase Authentication + MongoDB Atlas + Mongoose + TailwindCSSRuntime: Node.js 24 LTSApplication Hosting: Hostinger CloudAuthentication: Firebase AuthenticationDatabase: MongoDB AtlasDatabase ODM: Mongoose

1. Executive Summary

Build a production-ready travel agency website inspired by the suppliedreference website and quotation.

The website must provide a premium travel-focused public experience,destination and tour-package discovery, customer authentication/accountmanagement, enquiry and booking workflows, travel-service enquiries,blog/gallery content, and a secure admin CMS.

The quotation originally describes a WordPress/MySQL implementation. Thebusiness requirements remain applicable, but the finalimplementation technology is replaced by the stack specified above. Thequotation covers professional responsive design, domestic/internationaltours, customer login/dashboard, tour management, enquiries/bookings,services, gallery, blog, SEO, security, speed optimization anddeployment. fileciteturn0file0L10-L31 fileciteturn0file0L41-L62fileciteturn0file0L65-L93

2. Final Technology Decisions

Frontend

Next.js

TypeScript

App Router

React

Tailwind CSS

Next/Image

Server Components by default

Client Components only when interaction requires them

Backend

Next.js Route Handlers

Node.js 24 LTS

TypeScript

Service-layer architecture

Server-side validation

Authentication

Use Firebase Authentication.

Firebase Auth is responsible for: - Customer identity. - Email/passwordauthentication. - Google authentication if enabled. - Emailverification. - Password reset. - Account sign-out. - Firebase UID.

The application database must not store passwords or passwordhashes.

Database

Use MongoDB Atlas + Mongoose.

MongoDB stores application/business data: - User profile/applicationrecord. - Destinations. - Categories. - Tour packages. - Enquiries. -Bookings. - Favourites. - Reviews. - Blogs. - Gallery. - Services. -Site settings. - Audit logs.

Hosting

Host the Next.js application on Hostinger Cloud.

MongoDB remains hosted on MongoDB Atlas.

Firebase Authentication remains hosted by Firebase.

3. Authentication Architecture --- Mandatory

This is a critical part of the project.

Authentication Flow

Browser
   |
   | Firebase Client SDK
   v
Firebase Authentication
   |
   | Firebase ID Token
   v
Next.js Session Endpoint
   |
   | Firebase Admin SDK
   v
HTTP-only Secure Session Cookie
   |
   v
Next.js Server / Route Handlers
   |
   | Verify Firebase session
   v
MongoDB User Record

For server-rendered/private areas, use Firebase session cookies throughthe Firebase Admin SDK. Firebase documents theID-token-to-session-cookie flow and recommends HTTP-only cookies forserver-side sessions. citeturn0search3

For API calls where a direct Firebase ID token is appropriate, theserver must verify the token with Firebase Admin SDK before trusting theFirebase UID. citeturn0search1

MongoDB User Mapping

Every application user must have:

firebaseUid
email
name
phone
photoURL
role
status
profile
createdAt
updatedAt

firebaseUid is the immutable identity bridge between Firebase andMongoDB.

Never use email as the primary identity key.

Use:

Firebase UID → MongoDB User.firebaseUid

Roles

customer

admin

super_admin

The backend must enforce roles.

The UI must never be the only authorization mechanism.

Role Strategy

Use Firebase custom claims only for access-control information whenuseful, such as:

{
  "role": "admin"
}

Do not store profile information or large application data in Firebasecustom claims. Firebase specifically recommends custom claims for accesscontrol and keeping other data in the application's database.citeturn0search0

The authoritative application profile remains MongoDB.

For sensitive admin operations:

Verify Firebase session/token
        ↓
Resolve Firebase UID
        ↓
Load MongoDB User
        ↓
Check account status
        ↓
Check application role/permission
        ↓
Execute operation

This prevents stale client-side role information from becoming anauthorization vulnerability.

4. Product Goals

Create a premium travel-agency web presence.

Showcase domestic and international tours.

Make packages easy to discover.

Convert visitors into enquiries and bookings.

Provide a professional customer account.

Give administrators a complete CMS.

Provide reliable Firebase authentication.

Keep business data in MongoDB Atlas.

Maintain strong SEO.

Deliver excellent mobile performance.

Support lazy-loaded media.

Provide secure production-ready APIs.

Deploy successfully on Hostinger Cloud.

5. Users

Visitor

Can: - Browse website. - View destinations. - Browse domestic tours. -Browse international tours. - View package details. - Read blogs. - Viewgallery. - View services. - Send enquiries. - Contact agency. - UseWhatsApp/call actions.

Customer

Can: - Register/login with Firebase. - Verify email. - Reset password. -Manage profile. - View enquiries. - View bookings. - Save favourites. -Download brochures/itineraries. - Track booking/enquiry status. -Logout.

Admin

Can: - Manage packages. - Manage destinations. - Manage categories. -Manage enquiries. - Manage bookings. - Manage customers. - Manageblogs. - Manage gallery. - Manage services. - Manage website content. -Manage SEO. - Manage settings. - Manage reviews. - Manage admin usersaccording to permissions.

6. Public Website

Main Pages

Home

About Us

Tours

Domestic Tours

International Tours

Destinations

Destination Detail

Tour Package Detail

Travel Services

Hotel Booking Enquiry

Car Rental Enquiry

E-Ticket Booking Enquiry

Gallery

Blog

Blog Detail

Contact

Rules and Regulations

Privacy Policy

Terms and Conditions

These pages align with the supplied quotation's public website scope.fileciteturn0file0L24-L40

7. Home Page Requirements

Build a premium travel-agency homepage.

Sections:

Top contact/announcement bar.

Responsive navigation.

Hero/banner.

Main CTA.

Secondary CTA.

Featured destinations.

Featured tour packages.

Domestic tours.

International tours.

Travel services.

Why choose us.

Testimonials.

Gallery/travel moments.

Blog/travel updates.

Final CTA.

Footer.

Floating WhatsApp button.

Floating call button.

8. Visual / UX Requirements

Use the supplied reference website as inspiration for:

Color direction.

Travel imagery.

Section hierarchy.

Package presentation.

Destination cards.

CTA treatment.

Navigation behavior.

Animation feel.

Responsive composition.

Image-heavy storytelling.

Contact conversion elements.

Create an original implementation.

Do not copy: - Logo. - Proprietary text. - Images. - Source code. -CSS. - Exact page markup. - Pixel-perfect proprietary layouts.

The result should feel like the same category and design quality, not acopied website.

9. Animation

Use premium, restrained animations:

Hero entrance.

Scroll reveal.

Fade/slide section reveal.

Image hover zoom.

Card hover.

Button micro-interactions.

Mobile menu animation.

Accordion animation.

Modal/drawer transitions.

All animations must respect:

prefers-reduced-motion

Animations must never block interaction or create layout shift.

10. Lazy Loading

Implement correct lazy-loading.

Above the fold

Do not unnecessarily lazy-load the primary hero/LCP image.

Below the fold

Lazy-load: - Destination images. - Package images. - Blog images. -Gallery images. - Testimonials media. - Noncritical embeds.

Use:

Next/Image.

Responsive sizes.

Correct dimensions/aspect ratios.

Modern formats where supported.

Optimized thumbnails.

11. Tour Package Management

Each package supports:

Title.

Slug.

Package type.

Destination.

Category.

Short description.

Full description.

Cover image.

Gallery.

Duration.

Journey dates.

Price.

Pricing note.

Day-wise itinerary.

Inclusions.

Exclusions.

Hotel details.

Transportation details.

Brochure.

Featured status.

Publish status.

SEO title.

SEO description.

SEO keywords.

Related packages.

The quotation specifically requires package images/gallery, destination,duration, dates, price, itinerary, inclusions/exclusions,hotel/transport details, brochure, enquiry/booking, featured and relatedpackages. fileciteturn0file0L41-L54

12. Package Detail Page

Must contain:

Breadcrumb.

Hero image.

Package title.

Destination.

Duration.

Dates.

Price.

Summary.

Itinerary timeline/accordion.

Inclusions.

Exclusions.

Hotels.

Transportation.

Gallery.

Brochure download.

Enquiry CTA.

Booking CTA.

Related packages.

Reviews.

Sticky mobile CTA.

13. Enquiry System

Fields:

Name.

Email.

Phone.

Package/destination.

Travel date.

Number of travellers.

Budget.

Message.

Consent.

Flow:

Visitor
  ↓
Enquiry Form
  ↓
Client Validation
  ↓
POST API
  ↓
Server Validation
  ↓
Rate Limit / Spam Check
  ↓
MongoDB
  ↓
Admin Notification
  ↓
Customer Confirmation

Statuses:

new

contacted

follow_up

quoted

confirmed

closed

14. Booking System

This is an agency-managed booking system.

It does not pretend to provide live airline/hotel inventory.

Booking fields:

Booking reference.

Customer.

Package.

Travel date.

Travellers.

Pricing snapshot.

Booking status.

Payment status.

Notes.

Created date.

Updated date.

Statuses:

requested
pending_confirmation
confirmed
cancelled
completed

Payment:

unpaid
pending
paid
failed
refunded

Never trust browser-generated totals.

The server must calculate/validate authoritative pricing.

15. Optional Payment Gateway

If payment is required:

Customer
 ↓
Booking Request
 ↓
Server creates payment order
 ↓
Payment Provider
 ↓
Server verifies payment
 ↓
MongoDB booking updated
 ↓
Customer confirmation

Never mark a booking as paid from a client-side success callback alone.

Use server verification and idempotency.

16. Customer Dashboard

Required:

Dashboard overview.

Profile.

Enquiries.

Bookings.

Favourites.

Downloads.

Account settings.

Logout.

The quotation explicitly includes customer registration/login, profile,booking/enquiry history, favourites, downloads and logout.fileciteturn0file0L55-L64

17. Travel Services

Services:

Hotel Booking Enquiry.

Car Rental Enquiry.

E-Ticket Booking.

Each service requires:

Public information.

Enquiry form.

Admin management.

Status.

Customer history where applicable.

18. Blog CMS

Admin:

Create.

Edit.

Delete.

Draft.

Publish.

Categories.

Tags.

Cover image.

SEO metadata.

Public:

Blog listing.

Blog detail.

Related articles.

Search/filter where required.

19. Gallery

Admin:

Album.

Image.

Caption.

Sort order.

Status.

Public:

Responsive grid/masonry.

Lazy loading.

Lightbox.

Mobile-friendly viewing.

20. Reviews

Customer review submission.

Package association.

Rating.

Moderation.

Approved reviews displayed publicly.

Prevent spam and unauthorized review manipulation.

21. Admin Dashboard

Dashboard:

Total customers.

Total packages.

Published packages.

Enquiries.

Pending enquiries.

Bookings.

Pending bookings.

Recent activity.

Admin modules:

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

Admin users.

22. SEO

Implement:

Metadata.

Dynamic metadata.

Canonical URLs.

Open Graph.

Twitter cards.

Sitemap.

Robots.

Breadcrumbs.

Structured data.

Semantic HTML.

Alt text.

SEO-friendly slugs.

Destination SEO.

Package SEO.

Blog SEO.

23. Security

Mandatory:

Firebase Authentication.

Firebase Admin SDK.

Secure session cookies.

Server-side Firebase session verification.

Server-side authorization.

MongoDB validation.

Input validation.

Rate limiting.

Spam protection.

Secure headers.

File upload validation.

Secret protection.

Audit logs.

No sensitive logs.

No client-side authorization trust.

Firebase's Admin SDK is designed for privileged server-side usermanagement and token verification. citeturn0search2turn0search4

24. Performance

Targets:

Fast first load.

Good Core Web Vitals.

Low JavaScript.

Server Components by default.

Optimized images.

Lazy-loaded below-fold media.

Indexed MongoDB queries.

Pagination.

Caching/revalidation for safe public content.

Minimal third-party scripts.

25. Accessibility

Keyboard navigation.

Visible focus.

Semantic headings.

Accessible forms.

Accessible modals.

Accessible menus.

Screen-reader labels.

Alt text.

Good contrast.

Reduced motion.

26. Acceptance Criteria

The project is complete only when:

Firebase authentication works.

Firebase sessions work securely.

MongoDB user records synchronize correctly.

Customer role works.

Admin role works.

Super-admin role works.

Package CRUD works.

Destination CRUD works.

Enquiries work end-to-end.

Booking workflow works.

Customer dashboard works.

Admin dashboard works.

Blog works.

Gallery works.

Services work.

Reviews work.

SEO works.

Responsive UI works.

Lazy loading works.

Animation works.

Security checks pass.

TypeScript passes.

Lint passes.

Tests pass.

Production build passes.

Hostinger deployment works.

MongoDB Atlas production connection works.

Firebase production authentication works.