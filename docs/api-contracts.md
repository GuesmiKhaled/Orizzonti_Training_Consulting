# API contracts

## Authentication and profile

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

Returns the available roles and their permissions.

### GET /auth/profile

Returns the profile payload for the current seeded admin user.

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
