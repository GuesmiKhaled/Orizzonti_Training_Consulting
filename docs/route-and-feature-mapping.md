# Route and feature mapping

## Public routes

- `/` -> Home page
- `/about` -> About page
- `/courses` -> Course listing
- `/courses/:slug` -> Course detail
- `/contact` -> Contact form
- `/blog` -> Blog list
- `/blog/:slug` -> Blog detail
- `/login` -> Admin login page

## Admin routes

- `/admin` -> Dashboard overview
- `/admin/settings` -> Mail and site configuration
- `/admin/blogs` -> Blog admin CRUD
- `/admin/courses` -> Course admin CRUD
- `/admin/languages` -> Language admin CRUD
- `/admin/media` -> Slider image and media management

## Feature mapping

- Contact form -> `POST /api/contact`
- Blog CRUD -> `/api/blogs`
- Course CRUD -> `/api/courses`
- Language CRUD -> `/api/languages`
- Mail settings -> `/api/settings/mail`
- Admin login -> `/api/auth/login`
- Slider media -> `/api/media`

## Notes

This route map is aligned with the migration requirements and the requested admin CMS workflow, while preserving the original public marketing website structure.
