# Database Changes Summary

## Date: 2026-10-13

### Tables Created

#### 1. language_levels
- **Status**: ✅ Created
- **Purpose**: Stores language proficiency levels (A1, A2, B1, B2, C1, C2)
- **Columns**:
  - `id` (INT, Primary Key, Auto-increment)
  - `languageId` (INT, Foreign Key → languages.id, CASCADE delete)
  - `cefrLevel` (NVARCHAR, Required) - e.g., "A1", "B2"
  - `isActive` (BIT, Default: 1)
  - `price` (NVARCHAR, Nullable) - e.g., "TND 500,00"
  - `courseHours` (NVARCHAR, Nullable) - e.g., "66 hours"
  - `createdAt` (DATETIME2)
  - `updatedAt` (DATETIME2)
- **Indexes**: IDX_language_levels_languageId

#### 2. exam_sessions
- **Status**: ✅ Created
- **Purpose**: Stores exam session information for language levels
- **Columns**:
  - `id` (INT, Primary Key, Auto-increment)
  - `languageLevelId` (INT, Foreign Key → language_levels.id, CASCADE delete)
  - `examDate` (DATETIME, Required)
  - `location` (NVARCHAR, Nullable) - e.g., "Tunis"
  - `registrationStartDate` (DATETIME, Required)
  - `registrationDeadline` (DATETIME, Required)
  - `price` (NVARCHAR, Nullable) - Can override level price
  - `courseHours` (NVARCHAR, Nullable) - Can override level hours
  - `subscriptionUrl` (NVARCHAR, Nullable) - Link to booking system
  - `isActive` (BIT, Default: 1)
  - `createdAt` (DATETIME2)
  - `updatedAt` (DATETIME2)
- **Indexes**: IDX_exam_sessions_languageLevelId

### Tables Verified (No Changes Needed)

✅ admin_users - All columns present
✅ blogs - All columns present (including `content`)
✅ course_requests - All columns present
✅ courses - All columns present
✅ languages - All columns present
✅ mail_settings - All columns present
✅ permissions - All columns present
✅ role_permissions - All columns present
✅ roles - All columns present
✅ slider_media - All columns present

### Frontend Changes

#### Blog Admin Form
- **File**: `apps/frontend/src/app/pages/admin-dashboard/admin-dashboard.component.ts`
- **Change**: Added missing `Content` textarea field to blog form
- **Details**:
  - Added label with textarea for `content` formControl
  - Textarea has 8 rows for better content editing experience
  - Positioned between `Excerpt` and `Slug` fields

### Error Resolution

**Original Error**: `Invalid object name 'language_levels'`
- **Root Cause**: TypeORM entity defined but table not created in database
- **Solution**: Created missing `language_levels` and `exam_sessions` tables

**Blog Content Issue**: Content field missing from admin portal blog form
- **Root Cause**: Form template didn't include content textarea despite entity having the field
- **Solution**: Added content textarea to blog form template
