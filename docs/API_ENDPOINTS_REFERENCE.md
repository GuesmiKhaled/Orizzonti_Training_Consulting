# Orizzonti API Endpoints Reference

**Last Updated**: October 13, 2026  
**API Version**: 1.0  
**Base URL**: `http://localhost:5007` (development) or your production URL

---

## Table of Contents

1. [Authentication](#authentication)
2. [Health & Dashboard](#health--dashboard)
3. [Blogs](#blogs)
4. [Courses](#courses)
5. [Languages](#languages)
6. [Language Levels](#language-levels)
7. [Exam Sessions](#exam-sessions)
8. [Slider Media](#slider-media)
9. [Course Requests](#course-requests)
10. [Mail Settings](#mail-settings)
11. [Admin Users](#admin-users)
12. [Admin Roles & Permissions](#admin-roles--permissions)
13. [Contact](#contact)

---

## Authentication

### Login

**Endpoint**: `POST /auth/login`

**Description**: Authenticate admin user and receive access token

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "username": "admin",
  "role": "super-admin",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error** (401 Unauthorized):
```json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
```

---

### Get Profile

**Endpoint**: `GET /auth/profile`

**Description**: Get current authenticated user's profile

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK):
```json
{
  "id": 1,
  "username": "admin",
  "role": "super-admin",
  "roleId": 1,
  "isActive": true,
  "permissions": [
    "view_dashboard",
    "manage_users",
    "manage_roles",
    "manage_blog",
    "manage_courses",
    "manage_languages",
    "manage_media",
    "manage_course_requests",
    "manage_mail_settings"
  ]
}
```

---

## Health & Dashboard

### Health Check

**Endpoint**: `GET /`

**Description**: Check API health status

**Response** (200 OK):
```json
{
  "message": "API is running"
}
```

---

### Dashboard Statistics

**Endpoint**: `GET /dashboard/stats`

**Description**: Get dashboard statistics (requires `view_dashboard` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK):
```json
{
  "blogsCount": 5,
  "coursesCount": 3,
  "languagesCount": 2,
  "sliderCount": 4,
  "courseRequestsCount": 12,
  "newCourseRequestsCount": 3
}
```

---

## Blogs

### List Blogs

**Endpoint**: `GET /blogs`

**Description**: Get all blog articles (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Learning Italian",
    "excerpt": "Tips for learning Italian effectively",
    "slug": "learning-italian",
    "isPublished": true,
    "createdAt": "2025-10-13T10:00:00Z"
  }
]
```

---

### Get Blog

**Endpoint**: `GET /blogs/:id`

**Description**: Get specific blog article (public)

**Response** (200 OK):
```json
{
  "id": 1,
  "title": "Learning Italian",
  "excerpt": "Tips for learning Italian effectively",
  "content": "Full article content...",
  "slug": "learning-italian",
  "isPublished": true,
  "createdAt": "2025-10-13T10:00:00Z"
}
```

---

### Create Blog

**Endpoint**: `POST /blogs`

**Description**: Create new blog article (requires `manage_blog` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "title": "Learning Italian",
  "excerpt": "Tips for learning Italian effectively",
  "content": "Full article content...",
  "slug": "learning-italian",
  "isPublished": false
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "title": "Learning Italian",
  "excerpt": "Tips for learning Italian effectively",
  "content": "Full article content...",
  "slug": "learning-italian",
  "isPublished": false,
  "createdAt": "2025-10-13T10:00:00Z"
}
```

---

### Update Blog

**Endpoint**: `PATCH /blogs/:id`

**Description**: Update blog article (requires `manage_blog` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "title": "Learning Italian - Updated",
  "isPublished": true
}
```

**Response** (200 OK): Updated blog object

---

### Delete Blog

**Endpoint**: `DELETE /blogs/:id`

**Description**: Delete blog article (requires `manage_blog` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK):
```json
{
  "message": "Blog deleted successfully"
}
```

---

## Courses

### List Courses

**Endpoint**: `GET /courses`

**Description**: Get all courses (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Italian Beginner",
    "slug": "italian-beginner",
    "level": "Beginner",
    "price": "500",
    "description": "Learn Italian basics"
  }
]
```

---

### Get Course

**Endpoint**: `GET /courses/:id`

**Description**: Get specific course (public)

**Response** (200 OK): Course object

---

### Create Course

**Endpoint**: `POST /courses`

**Description**: Create new course (requires `manage_courses` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "name": "Italian Beginner",
  "slug": "italian-beginner",
  "level": "Beginner",
  "price": "500",
  "description": "Learn Italian basics"
}
```

**Response** (201 Created): Course object

---

### Update Course

**Endpoint**: `PATCH /courses/:id`

**Description**: Update course (requires `manage_courses` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "price": "600",
  "description": "Updated description"
}
```

**Response** (200 OK): Updated course object

---

### Delete Course

**Endpoint**: `DELETE /courses/:id`

**Description**: Delete course (requires `manage_courses` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Languages

### List Languages

**Endpoint**: `GET /languages`

**Description**: Get all languages (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "Italian",
    "code": "it",
    "nativeName": "Italiano",
    "isActive": true,
    "levels": [
      {
        "id": 1,
        "cefrLevel": "A1",
        "courseHours": "120",
        "price": "500"
      }
    ]
  }
]
```

---

### Get Language

**Endpoint**: `GET /languages/:id`

**Description**: Get specific language with all levels and exams (public)

**Response** (200 OK):
```json
{
  "id": 1,
  "name": "Italian",
  "code": "it",
  "nativeName": "Italiano",
  "isActive": true,
  "levels": [
    {
      "id": 1,
      "cefrLevel": "A1",
      "courseHours": 120,
      "price": 500,
      "exams": [
        {
          "id": 1,
          "examDate": "2025-06-15T10:00:00Z",
          "registrationDeadline": "2025-06-01T23:59:59Z",
          "subscriptionUrl": "https://example.com/exam"
        }
      ]
    }
  ]
}
```

---

### Create Language

**Endpoint**: `POST /languages`

**Description**: Create new language (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "name": "Italian",
  "code": "it",
  "nativeName": "Italiano",
  "isActive": true
}
```

**Response** (201 Created): Language object

---

### Update Language

**Endpoint**: `PATCH /languages/:id`

**Description**: Update language (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "nativeName": "Italiano",
  "isActive": true
}
```

**Response** (200 OK): Updated language object

---

### Delete Language

**Endpoint**: `DELETE /languages/:id`

**Description**: Delete language and all related levels and exams (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Language Levels

### List Language Levels

**Endpoint**: `GET /languages/:languageId/levels`

**Description**: Get all CEFR levels for a language (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "cefrLevel": "A1",
    "courseHours": 120,
    "price": 500,
    "languageId": 1
  },
  {
    "id": 2,
    "cefrLevel": "A2",
    "courseHours": 120,
    "price": 500,
    "languageId": 1
  }
]
```

---

### Get Language Level

**Endpoint**: `GET /languages/:languageId/levels/:levelId`

**Description**: Get specific language level (public)

**Response** (200 OK): Language level object

---

### Create Language Level

**Endpoint**: `POST /languages/:languageId/levels`

**Description**: Add CEFR level to language (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "cefrLevel": "A1",
  "courseHours": 120,
  "price": 500
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "cefrLevel": "A1",
  "courseHours": 120,
  "price": 500,
  "languageId": 1
}
```

**Error** (409 Conflict):
```json
{
  "statusCode": 409,
  "message": "Level A1 already exists for this language"
}
```

---

### Update Language Level

**Endpoint**: `PATCH /languages/:languageId/levels/:levelId`

**Description**: Update language level (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "courseHours": 150,
  "price": 600
}
```

**Response** (200 OK): Updated level object

---

### Delete Language Level

**Endpoint**: `DELETE /languages/:languageId/levels/:levelId`

**Description**: Delete language level and all related exams (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Exam Sessions

### List Exam Sessions

**Endpoint**: `GET /languages/:languageId/levels/:levelId/exams`

**Description**: Get all exam sessions for a language level (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "examDate": "2025-06-15T10:00:00Z",
    "registrationStartDate": "2025-05-01T00:00:00Z",
    "registrationDeadline": "2025-06-01T23:59:59Z",
    "subscriptionUrl": "https://example.com/exam",
    "maxParticipants": 30,
    "languageLevelId": 1
  }
]
```

---

### Get Exam Session

**Endpoint**: `GET /languages/:languageId/levels/:levelId/exams/:sessionId`

**Description**: Get specific exam session (public)

**Response** (200 OK): Exam session object

---

### Create Exam Session

**Endpoint**: `POST /languages/:languageId/levels/:levelId/exams`

**Description**: Create exam session (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "examDate": "2025-06-15T10:00:00Z",
  "registrationStartDate": "2025-05-01T00:00:00Z",
  "registrationDeadline": "2025-06-01T23:59:59Z",
  "subscriptionUrl": "https://example.com/exam",
  "maxParticipants": 30
}
```

**Response** (201 Created):
```json
{
  "id": 1,
  "examDate": "2025-06-15T10:00:00Z",
  "registrationStartDate": "2025-05-01T00:00:00Z",
  "registrationDeadline": "2025-06-01T23:59:59Z",
  "subscriptionUrl": "https://example.com/exam",
  "maxParticipants": 30,
  "languageLevelId": 1
}
```

**Error** (400 Bad Request):
```json
{
  "statusCode": 400,
  "message": "Registration deadline must be before exam date"
}
```

---

### Update Exam Session

**Endpoint**: `PATCH /languages/:languageId/levels/:levelId/exams/:sessionId`

**Description**: Update exam session (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "maxParticipants": 40
}
```

**Response** (200 OK): Updated exam object

---

### Delete Exam Session

**Endpoint**: `DELETE /languages/:languageId/levels/:levelId/exams/:sessionId`

**Description**: Delete exam session (requires `manage_languages` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

### Check Booking Eligibility

**Endpoint**: `POST /languages/:languageId/levels/:levelId/exams/:sessionId/subscribe`

**Description**: Check if exam can be booked (public, server-side validation)

**Response** (200 OK):
```json
{
  "isBookable": true,
  "status": "Available",
  "bookingUrl": "https://example.com/exam"
}
```

**Response** (200 OK - Expired):
```json
{
  "isBookable": false,
  "status": "Registration deadline expired"
}
```

---

## Slider Media

### List Media

**Endpoint**: `GET /media`

**Description**: Get all slider images (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "title": "Homepage Banner",
    "imageUrl": "https://example.com/banner.jpg",
    "altText": "Homepage banner image",
    "isActive": true
  }
]
```

---

### Create Media

**Endpoint**: `POST /media`

**Description**: Add slider image (requires `manage_media` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "title": "Homepage Banner",
  "imageUrl": "https://example.com/banner.jpg",
  "altText": "Homepage banner image",
  "isActive": true
}
```

**Response** (201 Created): Media object

---

### Update Media

**Endpoint**: `PATCH /media/:id`

**Description**: Update slider image (requires `manage_media` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "title": "Updated Banner",
  "isActive": false
}
```

**Response** (200 OK): Updated media object

---

### Delete Media

**Endpoint**: `DELETE /media/:id`

**Description**: Delete slider image (requires `manage_media` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Course Requests

### List Course Requests

**Endpoint**: `GET /course-requests`

**Description**: Get all course inquiries (requires `manage_course_requests` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+216 00 000 000",
    "courseName": "Italian Beginner",
    "message": "I'm interested in learning Italian",
    "status": "new",
    "createdAt": "2025-10-13T10:00:00Z"
  }
]
```

---

### Get Course Request

**Endpoint**: `GET /course-requests/:id`

**Description**: Get specific course inquiry (requires `manage_course_requests` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Course request object

---

### Create Course Request

**Endpoint**: `POST /course-requests`

**Description**: Submit course inquiry (public)

**Request Body**:
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "+216 00 000 000",
  "courseName": "Italian Beginner",
  "message": "I'm interested in learning Italian"
}
```

**Response** (201 Created): Course request object

---

### Update Course Request Status

**Endpoint**: `PATCH /course-requests/:id`

**Description**: Update inquiry status (requires `manage_course_requests` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "status": "reviewed"
}
```

**Response** (200 OK): Updated request object

---

### Delete Course Request

**Endpoint**: `DELETE /course-requests/:id`

**Description**: Delete course inquiry (requires `manage_course_requests` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Mail Settings

### Get Mail Settings

**Endpoint**: `GET /settings/mail`

**Description**: Get SMTP configuration (requires `manage_mail_settings` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK):
```json
{
  "id": 1,
  "host": "smtp.elasticemail.com",
  "port": 2525,
  "username": "info@orizzonti.tn",
  "fromAddress": "info@orizzonti.tn",
  "secure": true
}
```

---

### Update Mail Settings

**Endpoint**: `PATCH /settings/mail`

**Description**: Update SMTP configuration (requires `manage_mail_settings` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "host": "smtp.elasticemail.com",
  "port": 2525,
  "username": "info@orizzonti.tn",
  "password": "your-password",
  "fromAddress": "info@orizzonti.tn",
  "secure": true
}
```

**Response** (200 OK): Updated settings object

---

## Admin Users

### List Admin Users

**Endpoint**: `GET /auth/users?page=0&size=10&search=`

**Description**: Get paginated list of admin users (requires `manage_users` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Query Parameters**:
- `page` (number): Page number (0-indexed)
- `size` (number): Items per page
- `search` (string): Search by username

**Response** (200 OK):
```json
{
  "items": [
    {
      "id": 1,
      "username": "admin",
      "role": "super-admin",
      "roleId": 1,
      "isActive": true
    }
  ],
  "total": 1,
  "page": 0,
  "size": 10
}
```

---

### Create Admin User

**Endpoint**: `POST /auth/users`

**Description**: Create new admin user (requires `manage_users` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "username": "newadmin",
  "password": "SecurePass123!",
  "roleId": 1,
  "isActive": true
}
```

**Response** (201 Created):
```json
{
  "id": 2,
  "username": "newadmin",
  "role": "super-admin",
  "roleId": 1,
  "isActive": true
}
```

---

### Update Admin User

**Endpoint**: `PATCH /auth/users/:id`

**Description**: Update admin user (requires `manage_users` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "username": "updated-admin",
  "password": "NewPass123!",
  "isActive": true
}
```

**Response** (200 OK): Updated user object

---

### Delete Admin User

**Endpoint**: `DELETE /auth/users/:id`

**Description**: Delete admin user (requires `manage_users` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Admin Roles & Permissions

### List Roles

**Endpoint**: `GET /auth/roles`

**Description**: Get all roles (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "super-admin",
    "description": "Full system access",
    "permissions": [
      {
        "id": 1,
        "name": "view_dashboard",
        "description": "View dashboard statistics"
      }
    ]
  }
]
```

---

### List Permissions

**Endpoint**: `GET /auth/permissions`

**Description**: Get all available permissions (public)

**Response** (200 OK):
```json
[
  {
    "id": 1,
    "name": "view_dashboard",
    "description": "View dashboard statistics"
  },
  {
    "id": 2,
    "name": "manage_users",
    "description": "Create, edit, delete admin users"
  }
]
```

---

### Create Role

**Endpoint**: `POST /auth/roles`

**Description**: Create new role (requires `manage_roles` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "name": "content-editor",
  "description": "Can manage blogs and courses",
  "permissionIds": [1, 2]
}
```

**Response** (201 Created): Role object

---

### Update Role

**Endpoint**: `PATCH /auth/roles/:id`

**Description**: Update role (requires `manage_roles` permission)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Request Body**:
```json
{
  "description": "Updated description",
  "permissionIds": [1, 2, 3]
}
```

**Response** (200 OK): Updated role object

---

### Delete Role

**Endpoint**: `DELETE /auth/roles/:id`

**Description**: Delete role (requires `manage_roles` permission, cannot delete super-admin)

**Headers**: `Authorization: Bearer {{accessToken}}`

**Response** (200 OK): Success message

---

## Contact

### Submit Contact Message

**Endpoint**: `POST /contact`

**Description**: Submit contact form (public)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "Inquiry about courses",
  "message": "I would like to know more about your courses"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

---

## Common HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., level already exists) |
| 500 | Server Error | Internal server error |

---

## Authentication

All protected endpoints require the `Authorization` header:

```
Authorization: Bearer {{accessToken}}
```

The access token is obtained from the `/auth/login` endpoint and should be included in all subsequent requests to protected endpoints.

---

## Postman Collection

A complete Postman collection is available at:
`docs/postman/Orizzonti API.postman_collection.json`

Import this collection into Postman to test all endpoints with pre-configured requests and variables.

---

## Rate Limiting

Currently, there is no rate limiting implemented. For production, consider implementing:
- 100 requests per minute per IP
- 10 requests per second per user

---

## CORS

CORS is configured to allow requests from the frontend domain. Update CORS settings in `apps/backend/src/main.ts` if needed.

---

## Support

For API issues or questions:
1. Check this reference guide
2. Review the [LANGUAGE_MANAGEMENT_IMPLEMENTATION.md](./LANGUAGE_MANAGEMENT_IMPLEMENTATION.md)
3. Check the [ADMIN_PORTAL_GUIDE.md](./ADMIN_PORTAL_GUIDE.md)
4. Contact your development team

---

**Document Version**: 1.0  
**Last Updated**: October 13, 2026  
**Maintained By**: Devin AI

## Languages: Phase 4 additions

- `POST /languages/wizard` (`manage_languages`): creates a language with `levels[]`, each with optional `exams[]`, in one transaction. Body: `{ language: CreateLanguageDto, levels?: (CreateLanguageLevelDto & { exams?: CreateExamSessionDto[] })[] }`. Duplicate CEFR levels or invalid exam dates return 400 and nothing is saved.
- `PATCH /languages/:id`, `PATCH .../levels/:levelId`, `PATCH .../exams/:sessionId` now validate against `PartialType` DTOs: unknown fields (for example `id`) return 400.
- Exam responses from `GET /languages/:id/levels/:levelId/exams[/:sessionId]` include `level: { id, cefrLevel, ... }`.
- `GET /languages` and `GET /languages/:id` now include `placesLeft`, `isBookable` and `bookingStatus` on the nested exam sessions.
