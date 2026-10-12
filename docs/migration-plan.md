# Migration plan

## Scope update

This project will move from a static HTML/CSS/JavaScript site to a maintainable full-stack application with:

- Angular frontend for the public website and admin dashboard
- NestJS backend with REST APIs
- Local SQL database configuration for relational data storage
- Admin login system with username/password authentication
- CMS features for blogs, courses, languages and slider images
- Mail configuration managed securely from the admin dashboard

## Phase 1: Foundation and architecture

- Create the frontend Angular app and backend NestJS app inside the repo.
- Add a root-level developer setup and environment example files.
- Add a structured docs folder with audit and architecture notes.
- Configure a local SQL database connection for development.

## Phase 2: Data model and backend modules

Create data entities for:

- Admin users
- Site settings / mail configuration
- Blogs
- Courses
- Languages
- Slider images

Expose endpoints for:

- authentication
- blog CRUD
- course CRUD
- language CRUD
- mail configuration update
- image metadata management

## Phase 3: Public website migration

Port the main site sections from the legacy HTML:

- home
- about
- courses
- contact
- blog list
- blog details
- language-aware content rendering

## Phase 4: Admin dashboard

Build a secure admin area with a login page using username and password.

Admin features:

- configure SMTP/mail settings
- create and edit blog posts
- create and edit courses
- manage language entries
- upload or reference image assets in the slider and cards
- preview content in the public site

## Phase 5: Deployment and QA

- validate API contract and database integration
- test admin auth workflow
- test public content rendering from database
- validate form submissions and mail configuration
- verify build and local startup

## Acceptance criteria

- public site loads with Angular routes
- admin can log in using username/password
- mail settings are configurable from admin dashboard
- courses, blog posts and language entries are stored in SQL
- slider image sections render from database-managed content
- backend uses localhost SQL configuration
- no secrets are stored in the Angular assets or public bundle

## Risks and assumptions

- SQL database availability must be prepared locally before runtime.
- Admin auth is required for secure configuration control.
- The public site will use database content where practical, while preserving the original brand.
