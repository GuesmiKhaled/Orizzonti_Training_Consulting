# Role and permission matrix

## Goal

Document the seeded role model and permission structure enforced by the Orizzonti backoffice API.

## Roles

### Super Admin

Permissions:

- manage_users
- manage_roles
- manage_permissions
- manage_blog
- manage_courses
- manage_languages
- manage_media
- manage_mail_settings
- view_dashboard
- manage_course_requests
- view_statistics

### Content Manager

Permissions:

- manage_blog
- manage_languages
- manage_media
- view_dashboard
- manage_course_requests

### Course Manager

Permissions:

- manage_courses
- manage_course_requests
- view_dashboard

### Support / Operations

Permissions:

- view_dashboard
- manage_mail_settings
- manage_course_requests

## Notes

These roles and permissions are seeded by the backend when missing. Existing role assignments are preserved; missing default permissions are added to seeded roles.

## Enforcement strategy

Admin API requests require a bearer JWT. `PermissionsGuard` reloads the active account and its current permissions for each request, so permission changes take effect without waiting for an existing JWT to expire. Controller permissions use metadata rather than username checks:

- `@RequirePermission('manage_blog')`
- `@RequirePermission('manage_courses')`
- `@RequirePermission('manage_course_requests')`

This is safer and more maintainable than hardcoding admin checks directly inside services.
