# Role and permission matrix

## Goal

Define the minimum role model and permission structure for the Orizzonti backoffice while preserving the current simple admin login flow.

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

These are the recommended default roles for the existing business domain. The current repository does not yet have a persisted role system, so this matrix is the proposed migration target and should be implemented in a backwards-compatible way.

## Enforcement strategy

At the API layer, access should be checked using role and permission metadata, not by checking a raw user name in individual controllers. Future work should add a shared guard and permission decorator for endpoints such as:

- `@RequirePermission('manage_blog')`
- `@RequirePermission('manage_courses')`
- `@RequirePermission('manage_course_requests')`

This is safer and more maintainable than hardcoding admin checks directly inside services.
