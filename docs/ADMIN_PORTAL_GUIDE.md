# Orizzonti Admin Portal Navigation Guide

**Last Updated**: October 13, 2026  
**Version**: 1.0

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Admin Dashboard Overview](#admin-dashboard-overview)
3. [Navigation Sections](#navigation-sections)
4. [Detailed Section Guides](#detailed-section-guides)
5. [Common Tasks](#common-tasks)
6. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Accessing the Admin Portal

1. Navigate to `http://localhost:3000/login` (or your production URL)
2. Enter your admin credentials:
   - **Username**: `admin` (default)
   - **Password**: `admin123` (default)
3. Click **Sign in**
4. You will be redirected to the Admin Dashboard

### First Login

- Your profile information appears in the top-right corner
- Your assigned role determines which sections you can access
- If you don't see a section, you lack the required permission

---

## Admin Dashboard Overview

The admin dashboard is organized into a **sidebar navigation** and a **main content area**.

### Sidebar Navigation

Located on the left side of the screen, the sidebar contains:

- **Orizzonti Logo** - Click to return to the public website
- **BACKOFFICE** - Section header
- **Navigation Buttons** - Organized by category
- **Sign out** - Bottom button to log out

### Main Content Area

The right side displays:

- **Top Bar** - Section title and your username/role
- **Status Messages** - Success/error notifications
- **Content Panels** - Forms and tables for managing content
- **Pagination** - For large datasets (users, etc.)

### Responsive Design

- **Desktop**: Sidebar always visible
- **Tablet/Mobile**: Click the menu icon (☰) to toggle sidebar
- **Mobile**: Sidebar slides in from the left

---

## Navigation Sections

The admin portal includes the following main sections:

| Icon | Section | Permission | Purpose |
|------|---------|-----------|---------|
| 📊 | **Overview** | `view_dashboard` | Dashboard statistics and content counts |
| 👥 | **Users** | `manage_users` | Manage admin user accounts |
| 🛡️ | **Roles & permissions** | `manage_roles` | Define roles and assign permissions |
| 📰 | **Blogs** | `manage_blog` | Create and edit blog articles |
| 📚 | **Courses** | `manage_courses` | Manage course offerings |
| 🌐 | **Languages** | `manage_languages` | Manage languages with CEFR levels and exams |
| 🖼️ | **Slider media** | `manage_media` | Manage homepage slider images |
| 📥 | **Course requests** | `manage_course_requests` | Review course inquiry submissions |
| ✉️ | **Mail settings** | `manage_mail_settings` | Configure SMTP mail delivery |

---

## Detailed Section Guides

### 1. Overview (Dashboard)

**Permission**: `view_dashboard`

Displays key statistics about your website:

- **Blogs** - Total number of published blog articles
- **Courses** - Total number of course offerings
- **Languages** - Total number of language programs
- **Slider images** - Total number of homepage slider images
- **Course requests** - Total inquiries received
- **New requests** - Unreviewed course inquiries

**Use Case**: Quick check of content volume and new inquiries

---

### 2. Users

**Permission**: `manage_users`

Manage admin user accounts and their access levels.

#### Features

- **Search** - Filter users by username
- **Pagination** - Navigate through user list (20 per page)
- **Create User** - Add new admin account
- **Edit User** - Modify username, role, or status
- **Activate/Deactivate** - Toggle user access without deletion
- **Delete User** - Permanently remove account

#### User Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Username | Yes | Minimum 3 characters, must be unique |
| Password | Yes (create) / Optional (edit) | Minimum 8 characters |
| Role | Yes | Select from available roles |
| Active | Yes | Checkbox - uncheck to disable access |

#### Workflow

1. Click **Users** in sidebar
2. Search for user (optional)
3. Click **Edit** to modify or **Delete** to remove
4. Click **New user** to create account
5. Fill in form fields
6. Click **Create user** or **Save user**

---

### 3. Roles & Permissions

**Permission**: `manage_roles`

Define custom roles and assign granular permissions.

#### Features

- **Role List** - View all roles with permission counts
- **Create Role** - Add new role with custom permissions
- **Edit Role** - Modify role name, description, and permissions
- **Delete Role** - Remove custom roles (super-admin cannot be deleted)
- **Permission Checkboxes** - Toggle permissions on/off

#### Available Permissions

| Permission | Description |
|-----------|-------------|
| `view_dashboard` | View dashboard statistics |
| `manage_users` | Create, edit, delete admin users |
| `manage_roles` | Create, edit, delete roles |
| `manage_blog` | Create, edit, delete blog articles |
| `manage_courses` | Create, edit, delete courses |
| `manage_languages` | Create, edit, delete languages and exams |
| `manage_media` | Create, edit, delete slider images |
| `manage_course_requests` | View and update course inquiries |
| `manage_mail_settings` | Configure SMTP settings |

#### Workflow

1. Click **Roles & permissions** in sidebar
2. Click a role to edit or click **New role** to create
3. Enter role name and description
4. Check/uncheck permissions as needed
5. Click **Create role** or **Save role**

---

### 4. Blogs

**Permission**: `manage_blog`

Create and manage blog articles.

#### Features

- **Blog List** - View all blog articles
- **Create Blog** - Add new article
- **Edit Blog** - Modify article content
- **Delete Blog** - Remove article

#### Blog Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Article headline |
| Excerpt | Yes | Short summary (appears in listings) |
| Slug | No | URL-friendly identifier (auto-generated) |
| Content | No | Full article body (not shown in current UI) |

#### Workflow

1. Click **Blogs** in sidebar
2. View existing blogs in the list
3. Click **Edit** to modify or **Delete** to remove
4. Click **New blog** to create article
5. Fill in form fields
6. Click **Add blog** or **Update blog**

---

### 5. Courses

**Permission**: `manage_courses`

Manage course offerings.

#### Features

- **Course List** - View all courses
- **Create Course** - Add new course
- **Edit Course** - Modify course details
- **Delete Course** - Remove course

#### Course Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Course title |
| Description | Yes | Course overview |
| Price | No | Course cost (numeric) |
| Slug | No | URL-friendly identifier |

#### Workflow

1. Click **Courses** in sidebar
2. View existing courses in the list
3. Click **Edit** to modify or **Delete** to remove
4. Click **New course** to create course
5. Fill in form fields
6. Click **Add course** or **Update course**

---

### 6. Languages ⭐ (NEW)

**Permission**: `manage_languages`

Manage language programs with CEFR proficiency levels and exam sessions.

#### Features

- **Language List** - View all language programs
- **Create Language** - Add new language
- **Edit Language** - Modify language details
- **Delete Language** - Remove language (cascades to levels and exams)
- **Manage Levels** - Add CEFR levels (A1-C2) to each language
- **Manage Exams** - Schedule exam sessions for each level

#### Language Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Language name (e.g., "Italian") |
| Code | Yes | ISO 639-1 code (e.g., "it") |
| Native name | No | Name in native language |
| Active | Yes | Checkbox - uncheck to hide from public |

#### Workflow: Create Language

1. Click **Languages** in sidebar
2. Click **New language**
3. Fill in language details
4. Click **Add language**
5. Language appears in list

#### Workflow: Manage Language Levels

1. Click **Languages** in sidebar
2. Click **Edit** on a language
3. **Scroll down** to **Language Levels** section (see below)
4. Add/edit/delete CEFR levels

#### Language Levels Section

**Location**: Below language list (requires scrolling)

**Available CEFR Levels**:
- A1 - Beginner
- A2 - Elementary
- B1 - Intermediate
- B2 - Upper Intermediate
- C1 - Advanced
- C2 - Mastery

**Level Form Fields**:

| Field | Required | Notes |
|-------|----------|-------|
| CEFR Level | Yes | Select from A1-C2 dropdown |
| Course Hours | Yes | Total hours for this level |
| Price | Yes | Cost of this level |

**Workflow: Add Level**

1. In Language Levels section, click **New level**
2. Select CEFR level (A1, A2, B1, etc.)
3. Enter course hours
4. Enter price
5. Click **Add level**

**Workflow: Edit Level**

1. In Language Levels section, click **Edit** on a level
2. Modify hours and/or price
3. Click **Update level**

**Workflow: Delete Level**

1. In Language Levels section, click **Delete** on a level
2. Confirm deletion (cascades to all exams for this level)

#### Exam Sessions Section

**Location**: Below Language Levels section

**Features**:
- View all exam sessions for each level
- Create exam sessions with dates and registration deadlines
- Update exam session details
- Delete exam sessions

**Exam Session Form Fields**:

| Field | Required | Notes |
|-------|----------|-------|
| Exam Date | Yes | When the exam occurs (ISO 8601 format) |
| Registration Start | Yes | When registration opens |
| Registration Deadline | Yes | When registration closes (must be before exam date) |
| Subscription URL | Yes | External booking system link |
| Max Participants | No | Capacity limit for exam |

**Workflow: Add Exam Session**

1. In Exam Sessions section, click **New exam**
2. Select the language level
3. Enter exam date (e.g., 2025-06-15)
4. Enter registration start date
5. Enter registration deadline (before exam date)
6. Enter subscription URL
7. Enter max participants (optional)
8. Click **Add exam**

**Workflow: Edit Exam Session**

1. In Exam Sessions section, click **Edit** on an exam
2. Modify dates, URL, or capacity
3. Click **Update exam**

**Workflow: Delete Exam Session**

1. In Exam Sessions section, click **Delete** on an exam
2. Confirm deletion

---

### 7. Slider Media

**Permission**: `manage_media`

Manage homepage slider images.

#### Features

- **Media List** - View all slider images
- **Create Media** - Add new image
- **Edit Media** - Modify image details
- **Delete Media** - Remove image

#### Media Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| Title | Yes | Image name/description |
| Image URL | Yes | Full URL to image file |
| Alt text | No | Accessibility description |
| Visible in slider | Yes | Checkbox - uncheck to hide |

#### Workflow

1. Click **Slider media** in sidebar
2. View existing images in the list
3. Click **Edit** to modify or **Delete** to remove
4. Click **New image** to add image
5. Fill in form fields
6. Click **Add image** or **Update image**

---

### 8. Course Requests

**Permission**: `manage_course_requests`

Review and manage course inquiry submissions.

#### Features

- **Request List** - View all course inquiries
- **Review Status** - Mark requests as reviewed
- **Delete Request** - Remove inquiry

#### Request Information

Each request displays:
- **Name** - Inquirer's full name
- **Course** - Requested course name
- **Email & Status** - Contact info and review status

#### Workflow

1. Click **Course requests** in sidebar
2. View all inquiries in the list
3. Click **Review** to mark as reviewed
4. Click **Delete** to remove inquiry

---

### 9. Mail Settings

**Permission**: `manage_mail_settings`

Configure SMTP mail delivery for contact forms and notifications.

#### Features

- **SMTP Configuration** - Set mail server details
- **Security Options** - Enable TLS/SSL
- **From Address** - Configure sender email

#### Mail Settings Form Fields

| Field | Required | Notes |
|-------|----------|-------|
| SMTP host | Yes | Mail server address (e.g., smtp.gmail.com) |
| Port | Yes | SMTP port (usually 587 or 465) |
| Username | Yes | SMTP authentication username |
| Password | No | SMTP password (not shown when editing) |
| From address | Yes | Email address for outgoing messages |
| Use secure SMTP | Yes | Checkbox - enable TLS/SSL |

#### Workflow

1. Click **Mail settings** in sidebar
2. Fill in SMTP server details
3. Click **Save mail settings**
4. Status message confirms success/failure

#### Common SMTP Providers

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Gmail | smtp.gmail.com | 587 | Yes |
| Outlook | smtp-mail.outlook.com | 587 | Yes |
| ElasticEmail | smtp.elasticemail.com | 2525 | Yes |
| SendGrid | smtp.sendgrid.net | 587 | Yes |

---

## Common Tasks

### Create a New Language with Exam Schedule

1. Click **Languages** → **New language**
2. Enter language name, code, native name
3. Click **Add language**
4. Click **Edit** on the new language
5. Scroll to **Language Levels** section
6. Click **New level**
7. Select CEFR level (A1), enter hours (120), price (500)
8. Click **Add level**
9. Scroll to **Exam Sessions** section
10. Click **New exam**
11. Select the level, enter dates and URL
12. Click **Add exam**

### Promote User to Admin

1. Click **Users**
2. Click **Edit** on the user
3. Change **Role** dropdown to desired role
4. Click **Save user**

### Disable User Access

1. Click **Users**
2. Click **Deactivate** on the user
3. User loses access but account remains

### Create Custom Admin Role

1. Click **Roles & permissions**
2. Click **New role**
3. Enter role name (e.g., "Content Editor")
4. Check only `manage_blog` and `manage_courses` permissions
5. Click **Create role**
6. Assign role to users in **Users** section

### Update Homepage Slider

1. Click **Slider media**
2. Click **Edit** on an image
3. Update title, URL, or alt text
4. Click **Update image**
5. Uncheck "Visible in slider" to hide

---

## Troubleshooting

### I Don't See a Section

**Cause**: Your role lacks the required permission.

**Solution**:
1. Contact your super-admin
2. Ask them to edit your role in **Roles & permissions**
3. Have them enable the required permission
4. Refresh the page

### Form Won't Submit

**Cause**: Required fields are missing or invalid.

**Solution**:
1. Check all fields marked with asterisk (*)
2. Ensure email addresses are valid format
3. Ensure URLs start with http:// or https://
4. Ensure dates are in correct format (YYYY-MM-DD)
5. Look for red error messages below fields

### Changes Not Saving

**Cause**: Network error or authentication expired.

**Solution**:
1. Check your internet connection
2. If logged out, log back in
3. Try again
4. Check browser console (F12) for errors

### Exam Date Validation Error

**Cause**: Registration deadline is after exam date.

**Solution**:
1. Ensure registration deadline is BEFORE exam date
2. Example: Exam on 2025-06-15, deadline on 2025-06-01
3. Resubmit form

### Can't Delete Language

**Cause**: Language has dependent levels or exams.

**Solution**:
1. Delete all exam sessions first
2. Delete all language levels
3. Then delete the language
4. Or use cascade delete (deletes all related data)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + S` | Submit form (if focused) |
| `Esc` | Close modal/cancel form |
| `Tab` | Navigate between form fields |

---

## Best Practices

1. **Regular Backups** - Backup database regularly
2. **Test Changes** - Test on staging before production
3. **Review Permissions** - Audit user roles monthly
4. **Update Content** - Keep course info and exams current
5. **Monitor Requests** - Review course inquiries daily
6. **Secure Passwords** - Use strong admin passwords
7. **Log Out** - Always log out when leaving computer

---

## Support

For technical issues or feature requests:

1. Check this guide first
2. Review the [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. Check API documentation in [LANGUAGE_MANAGEMENT_IMPLEMENTATION.md](./LANGUAGE_MANAGEMENT_IMPLEMENTATION.md)
4. Contact your development team

---

**Document Version**: 1.0  
**Last Updated**: October 13, 2026  
**Maintained By**: Devin AI

## Frontend HTTP behaviour (Phase 1 foundations)

- `authInterceptor` attaches `Authorization: Bearer <token>` (token key `orizzonti-admin-token`) only to requests to the API base URL. A 401 from the API clears the token and redirects to `/login`; a 401 from `POST /auth/login` is left to the login form.
- `errorInterceptor` shows a toast for network errors, 5xx and 4xx (except 401). Callers that render their own inline error set `SKIP_ERROR_TOAST` in the request `HttpContext`.
- `core/api/crud.service.ts` is the generic REST base (`list/get/create/update(PATCH)/remove`); entity services live in `core/api/entities/`. The legacy `OrizzontiApiService` is still used by the existing pages until they are migrated.
- Admin design tokens are CSS variables (`--adm-*`) in `shared/styles/design-tokens.scss`. `base.scss` and `components.scss` are loaded globally, but their rules are nested under `.admin-theme` so they cannot restyle the public Bootstrap-based site.

## Admin shell and routing (Phase 2)

- `/admin` lazy-loads `src/app/admin/admin.routes.ts`: `AdminLayoutComponent` (sidebar, top bar, breadcrumbs) with one lazy child route per section. Each child has a `canMatch` `permissionGuard(...)`; users without the permission are sent to `/admin/forbidden`.
- The sidebar is driven by `src/app/admin/nav.config.ts` and filtered by the signed-in user's permissions.
- Sections not yet rebuilt show a placeholder with a link into the classic dashboard (`/admin/legacy?section=<name>`), which keeps working unchanged until every section is migrated.
- The layout disables the public Bootstrap stylesheet (`#legacy-theme`) while the admin is open and restores it on leave.

## Shared UI kit (Phase 3)

Reusable standalone, OnPush components in `src/app/shared/ui/` (import from `shared/ui`). A live reference is at `/admin/ui-kit` (requires `manage_permissions`; not in the sidebar).

| Component | Purpose |
| --- | --- |
| `app-data-table` | Search, sort, pagination, row actions, status-tag columns, `[table-toolbar]` slot, custom cells via `<ng-template appCell="key">`. `mode="client"` handles everything locally; `mode="server"` shows the given page, uses `total`, and the parent reacts to `queryChange`. |
| `app-page-header`, `app-stat-card`, `app-status-tag`, `app-change-badge` | Headers (with `[actions]` slot), KPI cards, tone pills, New/Modified/Unchanged badges. |
| `app-form-field` | Label, projected control, hint/error, amber `changed` state and `(was X)` hint. Control styles are the `.ui-field` rules in `components.scss`. |
| `app-modal-shell`, `app-confirm-dialog` | Accessible dialog: focus moves in and is restored, Tab is trapped, Esc and backdrop close it, only the topmost stacked modal reacts to Esc. Render with `@if`. |
| `app-stepper` | Numbered circles joined by a line (done / active / upcoming) with an optional per-step change count. |
| `app-image-picker` | Form control (`formControl`) with drag and drop, type/size validation and preview. Pass `[uploader]` to upload; without it the value is a local data URL (preview only) until `POST /media/upload` exists (Phase 6). |

## Languages (Phase 4)

- `/admin/languages` shows one card per language (levels, exams, next exam). **Edit**, **+ Level** and **+ Exam** open the wizard in edit mode on the matching step; **Add language** opens it in create mode. `/admin/languages/levels` and `/admin/languages/exams` are tables across all languages; Edit opens the wizard, Delete asks first.
- Create saves language, levels and exams in one transaction via `POST /languages/wizard`.
- Edit sends only what changed, with `PATCH`, in dependency order (language, levels, exams). Each success becomes the new baseline, so after a failure a retry sends only what is left. Saved levels/exams are deleted from the Levels/Exams pages, not from the wizard.
- Diff state lives in `LanguageWizardStore`: typed forms plus the last saved baseline; `diffValues` compares them. A new item counts as one change, a modified one as one per changed field.

## Remaining sections (Phase 5)

| Route | Page | Permission |
| --- | --- | --- |
| `/admin/overview` | Stat cards, requests per course, latest requests (names abbreviated) | `view_dashboard` |
| `/admin/users` | Server-paged users table, search, role filter, add/edit modal | `manage_users` |
| `/admin/users/roles` | Roles with grouped permissions; `super-admin` is shown as Locked | `manage_roles` |
| `/admin/users/import` | Mass import: still a placeholder | `manage_users` |
| `/admin/courses` | Courses table with level and start date, add/edit modal, image upload | `manage_courses` |
| `/admin/blogs`, `/admin/blogs/new`, `/admin/blogs/:id` | Posts table and editor (publish toggle, cover upload) | `manage_blog` |
| `/admin/media` | Slider image grid, add/edit modal with upload | `manage_media` |
| `/admin/requests` | Course requests: review, accept, reject, delete | `manage_course_requests` |
| `/admin/languages/registrations` | Exam registrations: filter, accept, reject, delete | `manage_course_requests` |
| `/admin/settings/mail` | SMTP settings; the password is write-only | `manage_mail_settings` |
| `/admin/settings/site` | Contact details, About text, highlights, next session date | `manage_site_settings` |

- **New permission** `manage_site_settings` is created and given to `super-admin` when the backend starts. Restart the backend once, and other roles can be granted it on the roles page.
- **Uploads**: `POST /media/upload` (field `file`, max 5 MB) accepts JPEG, PNG, WebP and GIF, identified by file content rather than name or MIME type. Files are stored under a random name in `UPLOAD_DIR` (default `./uploads`; a docker volume in `compose.yaml`) and served read-only from `/uploads`. `UPLOAD_PUBLIC_URL` overrides the origin used in the returned URL.
- **Users** now have optional `fullName`, `email` and `phone`. The list masks phone numbers (`+216 ••• ••• 753`).
- The public site does not read `GET /site-settings` yet; that is a later step.
- The classic dashboard at `/admin/legacy` is kept until the new pages have been verified, then it can be deleted.
