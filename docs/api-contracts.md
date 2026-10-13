# API contracts

## Authentication and profile

Except for login, public content reads, contact submission, the root route, and course-request creation, API routes require `Authorization: Bearer {{accessToken}}`. Admin writes require their corresponding permission.

### POST /auth/login

Request:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Response:

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "role": "super-admin",
    "permissions": [
      "manage_users",
      "manage_blog"
    ]
  },
  "accessToken": "jwt-token"
}
```

### GET /auth/roles

Requires `manage_users` or `manage_roles`. Returns roles and their permission assignments.

### GET /auth/permissions

Requires `manage_roles`. Returns the permission catalog.

### GET /auth/profile

Returns the authenticated user's profile and current permissions.

### GET /auth/users?page=0&size=20&search=

Requires `manage_users`. Returns `{ items, total, page, size }`; user items never contain password hashes.

### POST /auth/users

Requires `manage_users`.

```json
{
  "username": "postman-editor",
  "password": "TemporaryPass123!",
  "roleId": 1,
  "isActive": true
}
```

### PATCH /auth/users/:id and DELETE /auth/users/:id

Require `manage_users`. Update accepts username, an optional new password, roleId, or isActive. The current account cannot be deactivated or deleted, and the last active super-admin cannot be removed or demoted.

### POST /auth/roles

Requires `manage_roles`.

```json
{
  "name": "postman-test-role",
  "description": "Temporary role used by Postman tests",
  "permissionIds": []
}
```

### PATCH /auth/roles/:id and DELETE /auth/roles/:id

Require `manage_roles`. The super-admin role cannot be renamed or deleted; assigned users must be moved before a role is removed.

## Contact

### POST /contact

Request:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Course inquiry",
  "message": "Hello"
}
```

## Blog

### GET /blogs

### GET /blogs/:id

### POST /blogs

### PATCH /blogs/:id

### DELETE /blogs/:id

## Courses

### GET /courses

### GET /courses/:id

### POST /courses

### PATCH /courses/:id

### DELETE /courses/:id

## Languages

### GET /languages

### POST /languages

### PATCH /languages/:id

### DELETE /languages/:id

## Mail settings

### GET /settings/mail

### PATCH /settings/mail

Both routes require `manage_mail_settings`. SMTP passwords are never returned by GET; PATCH with an empty or omitted password preserves the stored password. Responses include `passwordConfigured`.

## Media

### GET /media

### POST /media

### PATCH /media/:id

### DELETE /media/:id

## Course requests

### GET /course-requests

### GET /course-requests/:id

### POST /course-requests

### PATCH /course-requests/:id

### DELETE /course-requests/:id

Request example:

```json
{
  "fullName": "Alice Smith",
  "email": "alice@example.com",
  "phone": "+216 12 345 678",
  "courseName": "English for Beginners",
  "message": "Interested in the next available group.",
  "status": "new"
}
```

## Dashboard stats

### GET /dashboard/stats

Response example:

```json
{
  "blogsCount": 0,
  "coursesCount": 0,
  "languagesCount": 0,
  "sliderCount": 0,
  "courseRequestsCount": 0,
  "newCourseRequestsCount": 0
}
```
