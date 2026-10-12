# Repository audit

## Summary

This repository started as a static marketing website for Orizzonti Training & Consulting. It contains a complete marketing front end in HTML/CSS/JavaScript, but no app framework, no managed dependency configuration, and no real server-side logic beyond a basic PHP mail handler and browser-side SMTPJS use.

## Pages reviewed

- `index.html`: landing page with hero carousel, header, language selector, about blocks, course highlights, counters, sliding news and call-to-action sections.
- `about.html`: company profile page with a registration form.
- `blog.html`: blog listing page template with generic placeholder content.
- `contact.html`: contact form page using jQuery validation and AJAX.
- `course.html`: course schedule page with actual course and pricing information.
- `single.html`: article detail template page.
- `teacher.html`: teacher template page.

## Confirmed business content

- The site promotes Orizzonti as a language and training center.
- It exposes actual office details: `6 rue Lucie Faure Tunis, Tunisia` and `info@orizzonti.tn`.
- It includes a visible course schedule for language levels and dates.
- It currently supports multiple languages: English, French, Italian and Arabic.

## Confirmed functionality to preserve

- Header and top contact bar.
- Responsive navbar.
- Hero image carousel.
- Course and language marketing sections.
- Contact form.
- Language switcher behavior.
- Counters and countdown interactions.
- Social links and map section.

## Issues discovered

- The legacy project is static and not structured for maintainable publishing.
- Several pages are generic template leftovers, not actual Orizzonti content.
- The mail flow is not production-safe.
- SMTPJS credentials or tokens were found in browser-side code or assumptions in the legacy site.
- There is no real database or admin system.
- Legal links point to a missing privacy file.
- The site mixes template placeholders and real content without a clear CMS model.

## Security and mail findings

- `mail/contact.php` sends mail via PHP `mail()` with a placeholder recipient and no real production configuration.
- Legacy browser-side mail logic exposed an unsafe pattern for email delivery and should not be migrated directly.
- The new platform must keep mail configuration server-side and behind a secure admin login.

## Migration decisions from audit

- The system will include a public website and an admin dashboard.
- Admin users will be able to configure mail settings, manage blog posts, course content and language records, and upload/assign slider images.
- Data should be stored in a relational SQL database on localhost.
- The public site will reflect the database-managed content rather than hard-coded static pages.

## Required implementation direction

This repo is not a simple front-end-only migration. The requested extension includes a CMS/admin layer and SQL-backed content management, so the migration should contain:

- Angular public frontend
- NestJS API backend
- TypeORM + SQL database (localhost configuration)
- Authenticated admin dashboard
- CRUD for blogs, courses, languages, slider images and mail settings

## Risk notes

- Content authenticity: generic blog and teacher pages should not be treated as real business data unless confirmed.
- Need for admin login: a new admin auth layer is required to manage configuration securely.
- Local SQL setup: database initialization needs to be documented and kept in a local dev config.
