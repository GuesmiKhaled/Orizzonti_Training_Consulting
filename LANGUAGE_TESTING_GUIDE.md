# Language Management - Testing Guide

## Quick Start

### 1. Build & Start Services

```bash
# Terminal 1: Backend
cd apps/backend
npm run build
npm run start:dev

# Terminal 2: Frontend
cd apps/frontend
npm run build
npm run start
```

The application will be available at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5007

---

## Manual Testing Scenarios

### Scenario 1: Create Language with Levels and Exams

**Using Postman or curl**:

#### 1.1 Create a Language

```bash
POST http://localhost:5007/languages
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "name": "Italian",
  "code": "it",
  "nativeName": "Italiano",
  "isActive": true
}
```

**Expected Response**: 201 Created with language object including id

#### 1.2 Create Language Levels

```bash
POST http://localhost:5007/languages/{languageId}/levels
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "cefrLevel": "A1",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "isActive": true
}
```

**Repeat for**: A2, B1, B2, C1, C2

**Expected Response**: 201 Created with level object including id

#### 1.3 Create Exam Sessions

```bash
POST http://localhost:5007/languages/{languageId}/levels/{levelId}/exams
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "examDate": "2024-05-16T00:00:00Z",
  "location": "Tunis",
  "registrationStartDate": "2024-03-01T00:00:00Z",
  "registrationDeadline": "2024-05-01T00:00:00Z",
  "price": "TND 500,00",
  "courseHours": "66 hours course +3 hours exam",
  "subscriptionUrl": "https://example.com/booking",
  "isActive": true
}
```

**Expected Response**: 201 Created with exam session object

---

### Scenario 2: View Language Details on Public Website

#### 2.1 View Language Listing

1. Navigate to http://localhost:4200/courses
2. Should see languages loaded from API (not hardcoded)
3. Each language should be clickable

**Expected**:
- Loading state briefly displays
- Languages appear in grid
- No hardcoded course data visible

#### 2.2 View Language Detail Page

1. Click on a language from the listing
2. Should navigate to http://localhost:4200/languages/{id}

**Expected**:
- Language name and native name display
- All levels display in CEFR order: A1, A2, B1, B2, C1, C2
- Each level shows its exam sessions
- Exam calendar table displays correctly

---

### Scenario 3: Test Booking Deadline Validation

#### 3.1 Create Exam with Future Deadline

```bash
POST http://localhost:5007/languages/{languageId}/levels/{levelId}/exams
Authorization: Bearer <admin-token>

{
  "examDate": "2025-12-31T00:00:00Z",
  "location": "Tunis",
  "registrationStartDate": "2025-01-01T00:00:00Z",
  "registrationDeadline": "2025-12-15T00:00:00Z",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "subscriptionUrl": "https://example.com/booking",
  "isActive": true
}
```

#### 3.2 View on Public Page

1. Navigate to language detail page
2. Should see "Subscribe" button for this exam

**Expected**:
- Button is clickable
- Button opens subscription URL when clicked

#### 3.3 Create Exam with Past Deadline

```bash
POST http://localhost:5007/languages/{languageId}/levels/{levelId}/exams
Authorization: Bearer <admin-token>

{
  "examDate": "2023-05-16T00:00:00Z",
  "location": "Tunis",
  "registrationStartDate": "2023-03-01T00:00:00Z",
  "registrationDeadline": "2023-05-01T00:00:00Z",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "subscriptionUrl": "https://example.com/booking",
  "isActive": true
}
```

#### 3.4 View on Public Page

1. Navigate to language detail page
2. Should see "Délai de réservation expiré" message

**Expected**:
- Message displays in red
- Button is disabled
- Cannot click to subscribe

#### 3.5 Create Exam with Future Registration Start

```bash
POST http://localhost:5007/languages/{languageId}/levels/{levelId}/exams
Authorization: Bearer <admin-token>

{
  "examDate": "2025-06-30T00:00:00Z",
  "location": "Tunis",
  "registrationStartDate": "2025-05-01T00:00:00Z",
  "registrationDeadline": "2025-06-15T00:00:00Z",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "subscriptionUrl": "https://example.com/booking",
  "isActive": true
}
```

#### 3.6 View on Public Page

1. Navigate to language detail page
2. Should see "Registration opens at [date]" message

**Expected**:
- Message displays with the registration start date
- Button is disabled
- Cannot click to subscribe

---

### Scenario 4: Test Data Integrity

#### 4.1 Create Two Languages

Create "French" and "German" languages with different levels:

**French**: A1, A2, B1  
**German**: B2, C1, C2

#### 4.2 Verify Language Isolation

1. Navigate to French language detail page
2. Should only see A1, A2, B1 levels
3. Navigate to German language detail page
4. Should only see B2, C1, C2 levels

**Expected**:
- Each language displays only its own levels
- No cross-language data leakage

#### 4.3 Test Cascade Delete

1. Delete the French language via API:
```bash
DELETE http://localhost:5007/languages/{frenchId}
Authorization: Bearer <admin-token>
```

2. Verify all French levels and exams are deleted
3. German language and its levels remain intact

**Expected**:
- French language deleted
- All French levels deleted
- All French exam sessions deleted
- German language and data unaffected

---

### Scenario 5: Test Validation Rules

#### 5.1 Duplicate Level Prevention

```bash
POST http://localhost:5007/languages/{languageId}/levels
Authorization: Bearer <admin-token>

{
  "cefrLevel": "A1",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "isActive": true
}
```

**Expected Response**: 409 Conflict with message "Level A1 already exists for this language"

#### 5.2 Invalid CEFR Level

```bash
POST http://localhost:5007/languages/{languageId}/levels
Authorization: Bearer <admin-token>

{
  "cefrLevel": "X1",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "isActive": true
}
```

**Expected Response**: 400 Bad Request (validation error)

#### 5.3 Invalid Exam Dates

```bash
POST http://localhost:5007/languages/{languageId}/levels/{levelId}/exams
Authorization: Bearer <admin-token>

{
  "examDate": "2025-05-01T00:00:00Z",
  "location": "Tunis",
  "registrationStartDate": "2025-03-01T00:00:00Z",
  "registrationDeadline": "2025-05-15T00:00:00Z",
  "price": "TND 500,00",
  "courseHours": "66 hours",
  "subscriptionUrl": "https://example.com/booking",
  "isActive": true
}
```

**Expected Response**: 400 Bad Request with message "Registration deadline must be before exam date"

---

### Scenario 6: Test Responsive Design

#### 6.1 Desktop View (1920x1080)

1. Navigate to language detail page
2. Verify table displays with all columns visible
3. Verify spacing and typography

**Expected**:
- All columns visible: Exam Date/Location, Period, Price, Online Subscription
- Proper spacing and alignment
- Level name visible on left side

#### 6.2 Tablet View (768x1024)

1. Resize browser to tablet size
2. Navigate to language detail page

**Expected**:
- Font sizes reduced appropriately
- Column widths adjusted
- Table remains readable
- Buttons are clickable

#### 6.3 Mobile View (375x667)

1. Resize browser to mobile size
2. Navigate to language detail page

**Expected**:
- Table stacks vertically
- Level name visible as header
- Exam sessions expandable or stacked
- Full-width buttons
- Text remains readable
- No horizontal scrolling

---

## API Testing with curl

### Get All Languages

```bash
curl http://localhost:5007/languages
```

### Get Language with Levels

```bash
curl http://localhost:5007/languages/{id}
```

### Get Levels for Language

```bash
curl http://localhost:5007/languages/{languageId}/levels
```

### Get Exam Sessions for Level

```bash
curl http://localhost:5007/languages/{languageId}/levels/{levelId}/exams
```

### Check Booking Eligibility

```bash
curl -X POST http://localhost:5007/languages/{languageId}/levels/{levelId}/exams/{sessionId}/subscribe
```

---

## Admin Authentication

### Get Admin Token

```bash
curl -X POST http://localhost:5007/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "super-admin"
  }
}
```

### Use Token in Requests

```bash
curl -H "Authorization: Bearer <accessToken>" \
  http://localhost:5007/languages/{id}/levels
```

---

## Common Issues & Solutions

### Issue: 404 Not Found on Language Detail Page

**Cause**: Language ID doesn't exist  
**Solution**: Verify language ID in URL matches database

### Issue: "Délai de réservation expiré" displays for future exam

**Cause**: Server time is different from client time  
**Solution**: Verify server time is correct; use ISO 8601 dates in API

### Issue: Subscribe button doesn't work

**Cause**: subscriptionUrl not set or invalid  
**Solution**: Verify subscriptionUrl is valid URL in exam session

### Issue: Duplicate level error when creating new level

**Cause**: Level already exists for language  
**Solution**: Use different CEFR level or delete existing level first

---

## Performance Testing

### Load Test Language Listing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:4200/courses
```

### Load Test Language Detail Page

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://localhost:4200/languages/1
```

---

## Browser DevTools Testing

### Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Navigate to language detail page
4. Verify API calls:
   - GET /languages (list)
   - GET /languages/:id/levels (detail)

### Console Tab

1. Open DevTools Console
2. Check for any JavaScript errors
3. Verify no CORS errors

### Application Tab

1. Open DevTools Application tab
2. Check localStorage for auth token
3. Verify no sensitive data exposed

---

## Accessibility Testing

### Keyboard Navigation

1. Open language detail page
2. Press Tab to navigate through elements
3. Verify all interactive elements are reachable
4. Verify focus indicators are visible

### Screen Reader Testing

1. Use NVDA (Windows) or VoiceOver (Mac)
2. Navigate language detail page
3. Verify table headers are announced
4. Verify button purposes are clear

---

## Summary

This testing guide covers:
- ✅ API endpoint testing
- ✅ Frontend functionality testing
- ✅ Booking deadline validation
- ✅ Data integrity testing
- ✅ Validation rule testing
- ✅ Responsive design testing
- ✅ Performance testing
- ✅ Accessibility testing

All tests should pass before considering the feature complete.
