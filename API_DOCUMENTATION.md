# Complete Backend API Documentation

**Generated**: January 21, 2026 (Updated)
**Base URL**: `http://localhost:5000/api`  
**Auth Header**: `Authorization: Bearer {token}`

---

## Table of Contents
1. [Authentication Module](#authentication-module)
2. [Patients Module](#patients-module)
3. [Appointments Module](#appointments-module)
4. [Queue Module](#queue-module)
5. [Doctors Module](#doctors-module)
6. [Admin Module](#admin-module)

---

## Authentication Module

### 1. Login
**Endpoint**: `POST /auth/login`  
**Authentication**: Not required  
**Base URL Path**: `/api/auth/login`

**Request Body**:
```json
{
  "email": "string (required, valid email format)",
  "password": "string (required, minimum length)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "name": "string",
  "email": "string",
  "role": "ADMIN | RECEPTIONIST | DOCTOR",
  "token": "JWT token (string, valid for 30 days)"
}
```

**Error Responses**:
- **401 Unauthorized**: Invalid email or password
  ```json
  { "message": "Invalid email or password" }
  ```
- **500 Server Error**: Internal error
  ```json
  { "message": "Error description" }
  ```

**Business Logic**:
- Email and password are required
- Password is validated against bcrypt hash
- JWT token expires in 30 days
- Token is signed with JWT_SECRET environment variable
- Returns user info with token on successful login

**Notes**:
- Token must be used in subsequent API calls as Bearer token
- Password comparison uses bcrypt for security
- User object excludes passwordHash in response

---

### 2. Get Current User
**Endpoint**: `GET /auth/me`  
**Authentication**: Required (Bearer token)  
**Base URL Path**: `/api/auth/me`

**Request Headers**:
```
Authorization: Bearer {token}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "name": "string",
  "email": "string",
  "role": "ADMIN | RECEPTIONIST | DOCTOR",
  "doctorId": "ObjectId (optional, only if user is a doctor)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Token missing or invalid
  ```json
  { "message": "Not authorized, token failed" }
  ```
  OR
  ```json
  { "message": "Not authorized, no token" }
  ```
- **404 Not Found**: User not found (token valid but user deleted)
  ```json
  { "message": "User not found" }
  ```

**Business Logic**:
- Validates JWT token from Authorization header
- Retrieves full user document from database
- Excludes passwordHash from response
- Called to verify authentication status

**Notes**:
- Token required in Authorization header as "Bearer {token}"
- Used to get current user details and verify token validity
- Returns user role for permission-based UI rendering

---

## Patients Module

### 1. Get Patients (with search)
**Endpoint**: `GET /patients`  
**Authentication**: Required  
**Base URL Path**: `/api/patients`

**Query Parameters**:
- `search` (optional, string): Search in patientName, fatherName, phone, email (case-insensitive regex)

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "patientName": "string (required)",
    "fatherName": "string (required)",
    "phone": "string (optional)",
    "email": "string (optional)",
    "dob": "ISO 8601 date",
    "gender": "string (required)",
    "address": "string (optional)",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **500 Server Error**: Database error

**Business Logic**:
- Returns maximum 50 results (limit: 50)
- Search uses case-insensitive regex matching on: patientName, fatherName, phone, email
- Returns all fields from Patient document

**Notes**:
- Empty search returns first 50 patients
- Patient names and father names are searchable
- Response is array of patient objects

---

### 2. Get Patient by ID with Appointments
**Endpoint**: `GET /patients/:id`  
**Authentication**: Required  
**Base URL Path**: `/api/patients/{patientId}`

**URL Parameters**:
- `id` (required, ObjectId string): Patient ID

**Success Response**: Status `200`
```json
{
  "patient": {
    "_id": "ObjectId (string)",
    "patientName": "string",
    "fatherName": "string",
    "phone": "string (optional)",
    "email": "string (optional)",
    "dob": "ISO 8601 date",
    "gender": "string",
    "address": "string (optional)",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  },
  "appointments": [
    {
      "_id": "ObjectId (string)",
      "doctorId": {
        "_id": "ObjectId (string)",
        "name": "string"
      },
      "patientId": "ObjectId (string)",
      "appointmentTypeId": "ObjectId (string)",
      "date": "YYYY-MM-DD",
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "durationMinutes": "number",
      "status": "SCHEDULED | CHECKED_IN | IN_QUEUE | COMPLETED | CANCELLED | NO_SHOW",
      "bookingMode": "NORMAL | BACKDATED",
      "createdAt": "ISO 8601 timestamp",
      "updatedAt": "ISO 8601 timestamp"
    }
  ]
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Patient not found
  ```json
  { "message": "Patient not found" }
  ```

**Business Logic**:
- Retrieves patient details and all associated appointments
- Appointments sorted by date (descending, newest first)
- Populates doctorId with only name field
- Returns appointments in reverse chronological order

**Notes**:
- Returns both patient data and appointment history
- Doctor details are populated in appointments
- Useful for patient profile view in frontend

---

### 3. Create Patient
**Endpoint**: `POST /patients`  
**Authentication**: Required  
**Base URL Path**: `/api/patients`

**Request Body**:
```json
{
  "patientName": "string (required)",
  "fatherName": "string (required)",
  "phone": "string (optional, unique with patientName and fatherName)",
  "email": "string (optional)",
  "dob": "ISO 8601 date (required)",
  "gender": "string (required, e.g., 'Male' or 'Female')",
  "address": "string (optional)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "patientName": "string",
  "fatherName": "string",
  "phone": "string (optional)",
  "email": "string (optional)",
  "dob": "ISO 8601 date",
  "gender": "string",
  "address": "string (optional)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **400 Bad Request**: Duplicate patient (same patientName, fatherName, phone combination exists)
  ```json
  { "message": "Patient with this name, father name and phone already exists" }
  ```
- **400 Bad Request**: Validation error (missing required fields, invalid data types)
- **401 Unauthorized**: Authentication failed
- **500 Server Error**: Database error

**Business Logic**:
- patientName, fatherName, and phone combination must be unique
- Composite index enforces: { patientName, fatherName, phone }
- dob and gender are required
- Audit log created with CREATE action
- User who created the patient is recorded in audit log

**Notes**:
- Phone field is optional but enforced in unique constraint
- Requires authentication
- Creates audit log entry for tracking

---

### 4. Update Patient
**Endpoint**: `PATCH /patients/:id`  
**Authentication**: Required  
**Base URL Path**: `/api/patients/{patientId}`

**URL Parameters**:
- `id` (required, ObjectId string): Patient ID

**Request Body** (all fields optional):
```json
{
  "patientName": "string (optional)",
  "fatherName": "string (optional)",
  "phone": "string (optional)",
  "email": "string (optional)",
  "dob": "ISO 8601 date (optional)",
  "gender": "string (optional)",
  "address": "string (optional)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "patientName": "string",
  "fatherName": "string",
  "phone": "string (optional)",
  "email": "string (optional)",
  "dob": "ISO 8601 date",
  "gender": "string",
  "address": "string (optional)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Patient not found
  ```json
  { "message": "Patient not found" }
  ```
- **400 Bad Request**: Validation error or duplicate constraint violation

**Business Logic**:
- Performs partial update (only provided fields are updated)
- Old and new values are logged in audit trail
- Records actor (user performing update) and role
- updatedAt timestamp is automatically set

**Notes**:
- Only provided fields are updated (PATCH, not PUT)
- Audit log tracks before and after values
- User making the update is recorded

---

## Appointments Module

### 1. Get Available Slots
**Endpoint**: `GET /doctors/:doctorId/slots`  
**Authentication**: Required  
**Base URL Path**: `/api/doctors/{doctorId}/slots`

**URL Parameters**:
- `doctorId` (required, ObjectId string): Doctor ID

**Query Parameters**:
- `date` (required, string, format: YYYY-MM-DD): Appointment date
- `duration` (required, number/string): Slot duration in minutes (e.g., 15, 30, 60)

**Success Response**: Status `200`
```json
[
  {
    "startTime": "HH:mm (string)",
    "endTime": "HH:mm (string)",
    "available": true
  }
]
```

**Error Responses**:
- **400 Bad Request**: Missing date or duration
  ```json
  { "message": "Date and duration are required" }
  ```
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Doctor not found
  ```json
  { "message": "Doctor not found" }
  ```

**Business Logic**:
- Checks doctor existence
- Checks if doctor has leave on the requested date (returns empty slots if on leave)
- Retrieves doctor's schedule template for the day of week
- Gets all booked appointments for the doctor on the date
- Generates available slots by:
  - Taking doctor's working hours from schedule template
  - Subtracting break slots
  - Subtracting booked appointment slots
  - Creating slots of specified duration
- Day of week: 0=Sunday, 1=Monday, ..., 6=Saturday (Luxon conversion: 1-7 Mon-Sun converted to 0-6 Sun-Sat)
- Returns empty array if no schedule exists or doctor is on leave

**Notes**:
- Date format must be ISO (YYYY-MM-DD)
- Duration in minutes (15, 30, 60 are typical)
- Returns array of available time slots
- Excludes appointments with CANCELLED status
- Considers break times within working hours

---

### 2. Create Appointment
**Endpoint**: `POST /appointments`  
**Authentication**: Required  
**Base URL Path**: `/api/appointments`

**Request Body**:
```json
{
  "doctorId": "ObjectId (string, required)",
  "patientId": "ObjectId (string, required)",
  "appointmentTypeId": "ObjectId (string, required)",
  "date": "YYYY-MM-DD (string, required)",
  "startTime": "HH:mm (string, required, format 24-hour)",
  "durationMinutes": "number (required, e.g., 30)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "patientId": "ObjectId (string)",
  "appointmentTypeId": "ObjectId (string)",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm (calculated)",
  "durationMinutes": "number",
  "status": "SCHEDULED",
  "bookingMode": "NORMAL | BACKDATED",
  "createdBy": "ObjectId (string)",
  "updatedBy": "ObjectId (string)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **400 Bad Request**: Double booking detected
  ```json
  { "message": "Double booking not allowed" }
  ```
- **400 Bad Request**: Missing required fields or validation error
- **401 Unauthorized**: Authentication failed
- **500 Server Error**: Database error

**Business Logic**:
- Calculates endTime based on startTime + durationMinutes (Asia/Kolkata timezone)
- Performs double booking check:
  - Searches for overlapping appointments for same doctor on same date
  - Excludes CANCELLED status appointments
  - Checks: overlapping startTime, overlapping endTime, complete overlap
- Determines bookingMode:
  - NORMAL: if appointment time is in future
  - BACKDATED: if appointment time is in past (Asia/Kolkata timezone)
- Creates AppointmentStatusHistory record with status SCHEDULED
- Creates two NotificationOutbox records:
  - One for DOCTOR via EMAIL
  - One for PATIENT via SMS
- Logs audit entry with action CREATE
- Records createdBy and updatedBy as current user

**Notes**:
- endTime is calculated from startTime + durationMinutes
- Uses Asia/Kolkata timezone for time calculations
- Double booking prevention is strict
- Initial status is always SCHEDULED
- Notifications are queued for background processing
- Audit trail captures full appointment details

---

### 3. Reschedule Appointment
**Endpoint**: `PATCH /appointments/:id/reschedule`  
**Authentication**: Required  
**Base URL Path**: `/api/appointments/{appointmentId}/reschedule`

**URL Parameters**:
- `id` (required, ObjectId string): Appointment ID

**Request Body**:
```json
{
  "date": "YYYY-MM-DD (string, required)",
  "startTime": "HH:mm (string, required)",
  "durationMinutes": "number (required)",
  "rescheduleReason": "string (required, mandatory reason for audit trail)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "patientId": "ObjectId (string)",
  "appointmentTypeId": "ObjectId (string)",
  "date": "YYYY-MM-DD (new date)",
  "startTime": "HH:mm (new time)",
  "endTime": "HH:mm (recalculated)",
  "durationMinutes": "number",
  "status": "SCHEDULED (unchanged)",
  "bookingMode": "NORMAL | BACKDATED",
  "rescheduleReason": "string",
  "updatedBy": "ObjectId (string)",
  "updatedAt": "ISO 8601 timestamp",
  "createdAt": "ISO 8601 timestamp",
  "createdBy": "ObjectId (string)"
}
```

**Error Responses**:
- **400 Bad Request**: Missing rescheduleReason
  ```json
  { "message": "Reschedule reason is mandatory" }
  ```
- **400 Bad Request**: Double booking after reschedule
  ```json
  { "message": "Double booking not allowed" }
  ```
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Appointment not found
  ```json
  { "message": "Appointment not found" }
  ```

**Business Logic**:
- rescheduleReason is mandatory (required for audit compliance)
- Recalculates endTime based on new startTime + durationMinutes
- Performs double booking check (same as create, but excludes self)
- Updates date, startTime, endTime, durationMinutes, rescheduleReason
- Updates updatedBy to current user
- Logs audit entry with old and new values
- Status remains SCHEDULED (not changed)

**Notes**:
- Reason is required for audit trail
- Double booking check excludes current appointment
- Preserves original status (SCHEDULED)
- Records old and new values in audit log
- Does NOT create AppointmentStatusHistory or notifications

---

### 4. Cancel Appointment
**Endpoint**: `PATCH /appointments/:id/cancel`  
**Authentication**: Required  
**Base URL Path**: `/api/appointments/{appointmentId}/cancel`

**URL Parameters**:
- `id` (required, ObjectId string): Appointment ID

**Request Body**:
```json
{
  "cancellationReason": "string (required, mandatory reason)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "patientId": "ObjectId (string)",
  "appointmentTypeId": "ObjectId (string)",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "durationMinutes": "number",
  "status": "CANCELLED",
  "bookingMode": "NORMAL | BACKDATED",
  "cancellationReason": "string",
  "updatedBy": "ObjectId (string)",
  "updatedAt": "ISO 8601 timestamp",
  "createdAt": "ISO 8601 timestamp",
  "createdBy": "ObjectId (string)"
}
```

**Error Responses**:
- **400 Bad Request**: Missing cancellationReason
  ```json
  { "message": "Cancellation reason is mandatory" }
  ```
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Appointment not found
  ```json
  { "message": "Appointment not found" }
  ```

**Business Logic**:
- cancellationReason is mandatory
- Changes status from current status to CANCELLED
- Stores old status and captures cancellation reason
- Creates AppointmentStatusHistory entry:
  - fromStatus: previous status
  - toStatus: CANCELLED
  - changedBy: current user
  - note: cancellationReason
- Logs audit entry with action CANCEL
- Records old and new values

**Notes**:
- Cancellation reason is required for compliance
- Creates status history record
- Old status is preserved in history
- Audit log tracks cancellation details

---

### 5. Update Appointment Status
**Endpoint**: `PATCH /appointments/:id/status`  
**Authentication**: Required  
**Base URL Path**: `/api/appointments/{appointmentId}/status`

**URL Parameters**:
- `id` (required, ObjectId string): Appointment ID

**Request Body**:
```json
{
  "status": "SCHEDULED | CHECKED_IN | IN_QUEUE | COMPLETED | CANCELLED | NO_SHOW (required)",
  "note": "string (optional, note for status history)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "patientId": "ObjectId (string)",
  "appointmentTypeId": "ObjectId (string)",
  "date": "YYYY-MM-DD",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "durationMinutes": "number",
  "status": "string (updated status)",
  "bookingMode": "NORMAL | BACKDATED",
  "updatedBy": "ObjectId (string)",
  "updatedAt": "ISO 8601 timestamp",
  "createdAt": "ISO 8601 timestamp",
  "createdBy": "ObjectId (string)"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Appointment not found
  ```json
  { "message": "Appointment not found" }
  ```

**Business Logic**:
- Changes appointment status to provided value
- Valid statuses: SCHEDULED, CHECKED_IN, IN_QUEUE, COMPLETED, CANCELLED, NO_SHOW
- Creates AppointmentStatusHistory entry:
  - fromStatus: previous status
  - toStatus: new status
  - changedBy: current user
  - note: optional note provided
- Logs audit entry with action STATUS_CHANGE
- Records only status change in audit log

**Notes**:
- Status must be valid enum value
- Note is optional but recommended
- Creates history entry for status transition tracking
- Used for appointment workflow progression

---

### 6. Get Appointments (with filters)
**Endpoint**: `GET /appointments`  
**Authentication**: Required  
**Base URL Path**: `/api/appointments`

**Query Parameters**:
- `doctorId` (optional, ObjectId string): Filter by doctor
- `date` (optional, string YYYY-MM-DD): Filter by appointment date
- `status` (optional, string): Filter by appointment status
- `search` (optional, string): Currently not used but available in code

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "doctorId": {
      "_id": "ObjectId (string)",
      "name": "string"
    },
    "patientId": {
      "patientName": "string",
      "phone": "string",
      "_id": "ObjectId (string)"
    },
    "appointmentTypeId": {
      "_id": "ObjectId (string)",
      "name": "string"
    },
    "date": "YYYY-MM-DD",
    "startTime": "HH:mm",
    "endTime": "HH:mm",
    "durationMinutes": "number",
    "status": "SCHEDULED | CHECKED_IN | IN_QUEUE | COMPLETED | CANCELLED | NO_SHOW",
    "bookingMode": "NORMAL | BACKDATED",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed

**Business Logic**:
- Filters appointments based on query parameters (all optional)
- Populates doctorId with name field only
- Populates patientId with patientName and phone
- Populates appointmentTypeId with name
- Sorts results by startTime (ascending)
- Returns empty array if no appointments match criteria

**Notes**:
- All query parameters are optional
- Results include populated references (doctor name, patient details, type name)
- Sorted chronologically by startTime
- Useful for dashboard views and list displays

---

## Queue Module

### 1. Get Queue
**Endpoint**: `GET /queue`  
**Authentication**: Required  
**Base URL Path**: `/api/queue`

**Query Parameters**:
- `doctorId` (required, ObjectId string): Doctor ID
- `date` (required, string YYYY-MM-DD): Queue date

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "doctorId": "ObjectId (string)",
    "date": "YYYY-MM-DD",
    "appointmentId": {
      "_id": "ObjectId (string)",
      "startTime": "HH:mm",
      "endTime": "HH:mm"
    },
    "patientId": {
      "_id": "ObjectId (string)",
      "patientName": "string",
      "phone": "string"
    },
    "tokenNumber": "number",
    "queuePosition": "number",
    "status": "WAITING | SERVING | DONE | CANCELLED",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **400 Bad Request**: Missing doctorId or date
  ```json
  { "message": "Doctor ID and date are required" }
  ```
- **401 Unauthorized**: Authentication failed

**Business Logic**:
- doctorId and date are required query parameters
- Retrieves queue tokens for specific doctor and date
- Populates patientId with patientName and phone
- Populates appointmentId with startTime and endTime
- Sorts by queuePosition (ascending)
- Returns array ordered by queue position

**Notes**:
- Queue is specific to doctor and date
- Sorted by queue position for display
- Includes appointment timing details
- Patient contact info included for reference

---

### 2. Add to Queue
**Endpoint**: `POST /queue/add`  
**Authentication**: Required  
**Base URL Path**: `/api/queue/add`

**Request Body**:
```json
{
  "doctorId": "ObjectId (string, required)",
  "date": "YYYY-MM-DD (string, required)",
  "patientId": "ObjectId (string, required)",
  "appointmentId": "ObjectId (string, required)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "date": "YYYY-MM-DD",
  "appointmentId": "ObjectId (string)",
  "patientId": "ObjectId (string)",
  "tokenNumber": "number (auto-incremented for the day)",
  "queuePosition": "number (auto-incremented for the day)",
  "status": "WAITING",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **500 Server Error**: Database error

**Business Logic**:
- Finds the last token for the doctor on the date
- Increments tokenNumber by 1 (starts from 1)
- Increments queuePosition by 1 (starts from 1)
- Status always set to WAITING initially
- Each token is unique per doctor per date
- Logs audit entry with CREATE action

**Notes**:
- tokenNumber and queuePosition auto-increment for each day
- Both start at 1 for a new day
- Initial status is always WAITING
- Audit trail tracks queue additions
- Useful for queue management

---

### 3. Reorder Queue
**Endpoint**: `PATCH /queue/reorder`  
**Authentication**: Required  
**Base URL Path**: `/api/queue/reorder`

**Request Body**:
```json
{
  "tokens": [
    {
      "id": "ObjectId (string, token ID)",
      "queuePosition": "number (new position)"
    }
  ]
}
```

**Success Response**: Status `200`
```json
{
  "message": "Queue reordered"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **500 Server Error**: Database error

**Business Logic**:
- Takes array of token ID and queuePosition pairs
- Updates each token's queuePosition
- Performs updates sequentially
- Creates single audit log entry for entire batch reorder
- Uses generic ObjectId for batch operation audit

**Notes**:
- Allows bulk reordering of queue
- Updates all positions in one request
- Audit log records entire reorder operation
- Used when queue order needs to be adjusted

---

### 4. Update Queue Status
**Endpoint**: `PATCH /queue/:id/status`  
**Authentication**: Required  
**Base URL Path**: `/api/queue/{tokenId}/status`

**URL Parameters**:
- `id` (required, ObjectId string): Queue Token ID

**Request Body**:
```json
{
  "status": "WAITING | SERVING | DONE | CANCELLED (required)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "date": "YYYY-MM-DD",
  "appointmentId": "ObjectId (string)",
  "patientId": "ObjectId (string)",
  "tokenNumber": "number",
  "queuePosition": "number",
  "status": "string (updated status)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **404 Not Found**: Token not found
  ```json
  { "message": "Token not found" }
  ```

**Business Logic**:
- Updates queue token status to provided value
- Valid statuses: WAITING, SERVING, DONE, CANCELLED
- Records old and new values in audit log
- Logs action as STATUS_CHANGE

**Notes**:
- Status must be valid enum value
- Tracks status transitions in audit log
- Used for queue progression during consultation

---

### 5. Sync Queue
**Endpoint**: `POST /queue/sync`  
**Authentication**: Required  
**Base URL Path**: `/api/queue/sync`

**Query Parameters**:
- `doctorId` (required, ObjectId string): Doctor ID
- `date` (required, string YYYY-MM-DD): Date to sync

**Request Body**: Empty or omitted

**Success Response**: Status `200`
```json
{
  "message": "Synced {count} appointments to queue"
}
```

**Error Responses**:
- **400 Bad Request**: Missing doctorId or date
  ```json
  { "message": "Doctor ID and date are required" }
  ```
- **401 Unauthorized**: Authentication failed

**Business Logic**:
- Finds all appointments for doctor on date with statuses: SCHEDULED or CHECKED_IN
- Retrieves existing queue tokens for same doctor and date
- Identifies appointments not yet in queue
- For each new appointment:
  - Increments tokenNumber from last token
  - Increments queuePosition from last token
  - Creates queue token with status WAITING
- Uses insertMany for bulk insert if tokens to create exist
- Creates audit log only if new tokens were created
- Returns message with count of synced appointments

**Notes**:
- Automatically syncs scheduled and checked-in appointments to queue
- Skips appointments already in queue
- Does not create tokens for CANCELLED appointments
- Used to ensure queue is in sync with appointments
- Audit logged only if changes made

---

## Doctors Module

### 1. Get Available Doctor Slots
**Endpoint**: `GET /doctors/:doctorId/slots`  
**Authentication**: Required  
**Base URL Path**: `/api/doctors/{doctorId}/slots`

(See [Appointments Module - Get Available Slots](#1-get-available-slots) - same endpoint)

---

## Admin Module

### 1. Get Doctors
**Endpoint**: `GET /admin/doctors`  
**Authentication**: Required  
**Authorization**: ADMIN, RECEPTIONIST  
**Base URL Path**: `/api/admin/doctors`

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "name": "string",
    "specialization": "string (optional)",
    "isActive": "boolean",
    "defaultSlotDurationMinutes": "number (default: 15)",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
  ```json
  { "message": "Role {role} is not authorized to access this route" }
  ```

**Business Logic**:
- Requires ADMIN or RECEPTIONIST role
- Returns all doctors from database
- No filtering or pagination applied

**Notes**:
- Can be accessed by ADMIN or RECEPTIONIST
- Returns full doctor list
- Includes inactive doctors

---

### 2. Create Doctor
**Endpoint**: `POST /admin/doctors`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/doctors`

**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, valid email format)",
  "specialization": "string (optional)",
  "defaultSlotDurationMinutes": "number (optional, default: 15)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "name": "string",
  "email": "string",
  "specialization": "string (optional)",
  "isActive": true,
  "defaultSlotDurationMinutes": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **400 Bad Request**: Missing required fields or validation error
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role only
- name is required
- isActive defaults to true
- defaultSlotDurationMinutes defaults to 15
- Logs audit entry with CREATE action

**Notes**:
- Only ADMIN can create doctors
- Doctor is active by default
- Specialization is optional
- Audit trail maintained

---

### 3. Update Doctor
**Endpoint**: `PATCH /admin/doctors/:id`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/doctors/{doctorId}`

**URL Parameters**:
- `id` (required, ObjectId string): Doctor ID

**Request Body** (all fields optional):
```json
{
  "name": "string (optional)",
  "email": "string (optional, valid email format)",
  "specialization": "string (optional)",
  "isActive": "boolean (optional)",
  "defaultSlotDurationMinutes": "number (optional)"
}
```

**Success Response**: Status `200`
```json
{
  "_id": "ObjectId (string)",
  "name": "string",
  "email": "string",
  "specialization": "string (optional)",
  "isActive": "boolean",
  "defaultSlotDurationMinutes": "number",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **404 Not Found**: Doctor not found
  ```json
  { "message": "Doctor not found" }
  ```

**Business Logic**:
- Requires ADMIN role
- Partial update (only provided fields updated)
- Uses OR logic to keep existing values if not provided
- Records old and new values in audit log

**Notes**:
- Only ADMIN can update doctors
- Selective field updates
- Audit trail tracks all changes

---

### 4. Get Receptionists
**Endpoint**: `GET /admin/receptionists`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/receptionists`

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "name": "string",
    "email": "string",
    "role": "RECEPTIONIST",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized

**Business Logic**:
- Requires ADMIN role
- Filters users by role RECEPTIONIST
- Excludes passwordHash from response
- Returns all receptionist users

**Notes**:
- Only ADMIN can view receptionists
- Password hashes are excluded
- Returns all RECEPTIONIST role users

---

### 5. Create Receptionist
**Endpoint**: `POST /admin/receptionists`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/receptionists`

**Request Body**:
```json
{
  "name": "string (required)",
  "email": "string (required, unique, valid email format)",
  "password": "string (required, minimum length recommended)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "name": "string",
  "email": "string",
  "role": "RECEPTIONIST"
}
```

**Error Responses**:
- **400 Bad Request**: User already exists with email
  ```json
  { "message": "User already exists" }
  ```
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **400 Bad Request**: Missing required fields or validation error
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role
- email must be unique
- password is hashed using bcrypt (salt rounds: 10)
- role is set to RECEPTIONIST
- Returns response without passwordHash
- Logs audit entry with CREATE action (includes name, email, role but not password)

**Notes**:
- Only ADMIN can create receptionists
- Email must be unique in system
- Password is bcrypt hashed before storage
- Audit log tracks user creation

---

### 6. Get Appointment Types
**Endpoint**: `GET /admin/appointment-types`  
**Authentication**: Required  
**Authorization**: ADMIN, RECEPTIONIST  
**Base URL Path**: `/api/admin/appointment-types`

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "name": "string",
    "isActive": "boolean",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized

**Business Logic**:
- Requires ADMIN or RECEPTIONIST role
- Returns all appointment types
- Includes inactive types

**Notes**:
- Accessible to ADMIN and RECEPTIONIST
- All types returned regardless of active status

---

### 7. Create Appointment Type
**Endpoint**: `POST /admin/appointment-types`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/appointment-types`

**Request Body**:
```json
{
  "name": "string (required, unique)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "name": "string",
  "isActive": true,
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **400 Bad Request**: Missing required fields or name already exists
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role
- name must be unique
- isActive defaults to true
- Logs audit entry with CREATE action

**Notes**:
- Only ADMIN can create types
- Active by default
- Unique name constraint

---

### 8. Get Schedules
**Endpoint**: `GET /admin/schedules`  
**Authentication**: Required  
**Authorization**: ADMIN, RECEPTIONIST  
**Base URL Path**: `/api/admin/schedules`

**Query Parameters**:
- `doctorId` (optional, ObjectId string): Filter by doctor

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "doctorId": {
      "_id": "ObjectId (string)",
      "name": "string"
    },
    "dayOfWeek": "number (0-6, 0=Sunday)",
    "startTime": "HH:mm",
    "endTime": "HH:mm",
    "breakSlots": [
      {
        "startTime": "HH:mm",
        "endTime": "HH:mm"
      }
    ],
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized

**Business Logic**:
- Requires ADMIN or RECEPTIONIST role
- Filters by doctorId if provided
- Populates doctorId with name field
- Returns schedule templates for all or specific doctor

**Notes**:
- Optional doctorId filter
- dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday
- Each doctor can have one schedule per day
- Includes break slots within working hours

---

### 9. Create Schedule
**Endpoint**: `POST /admin/schedules`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/schedules`

**Request Body**:
```json
{
  "doctorId": "ObjectId (string, required)",
  "dayOfWeek": "number (0-6, required)",
  "startTime": "HH:mm (string, required)",
  "endTime": "HH:mm (string, required)",
  "breakSlots": [
    {
      "startTime": "HH:mm",
      "endTime": "HH:mm"
    }
  ]
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "dayOfWeek": "number",
  "startTime": "HH:mm",
  "endTime": "HH:mm",
  "breakSlots": [
    {
      "startTime": "HH:mm",
      "endTime": "HH:mm"
    }
  ],
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **400 Bad Request**: Missing required fields or validation error (dayOfWeek 0-6)
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role
- doctorId, dayOfWeek, startTime, endTime are required
- dayOfWeek must be 0-6
- breakSlots is optional array of time ranges
- Logs audit entry with CREATE action

**Notes**:
- Only ADMIN can create schedules
- Doctor can have one schedule per day of week
- Break slots are optional (for lunch, breaks, etc.)
- Used for slot generation

---

### 10. Create Bulk Schedule (Upsert)
**Endpoint**: `POST /admin/schedules/bulk`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/schedules/bulk`

**Request Body**:
```json
{
  "doctorId": "ObjectId (string, required)",
  "schedules": [
    {
      "dayOfWeek": "number (0-6, required)",
      "startTime": "HH:mm (string, required)",
      "endTime": "HH:mm (string, required)",
      "breakSlots": [
        {
          "startTime": "HH:mm",
          "endTime": "HH:mm"
        }
      ]
    }
  ]
}
```

**Success Response**: Status `200`
```json
{
  "message": "Successfully updated schedules for {n} day(s)",
  "matchedCount": "number (documents that existed and were updated)",
  "modifiedCount": "number (documents actually modified)",
  "upsertedCount": "number (new documents created)"
}
```

**Error Responses**:
- **400 Bad Request**: Missing doctorId, empty schedules array, invalid dayOfWeek, or missing startTime/endTime
  ```json
  { "message": "Error description" }
  ```
- **404 Not Found**: Doctor not found
  ```json
  { "message": "Doctor not found" }
  ```
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role
- Uses MongoDB bulkWrite with upsert: true
- Filter: { doctorId, dayOfWeek } ensures no duplicates per doctor per day
- Updates existing schedule or creates new one if doesn't exist
- All schedules in array are processed atomically
- Records single audit entry for bulk operation
- Optional breakSlots preserved from request or kept as-is

**Notes**:
- CONSTRAINT: Filter must be `{ doctorId, dayOfWeek }` to prevent duplicates
- Efficient batch operation for weekly availability setup
- Recommended for bulk schedule updates from frontend
- One call replaces entire weekly schedule for a doctor
- dayOfWeek: 0=Sunday, 1=Monday, ..., 6=Saturday

---

### 11. Delete Schedule
**Endpoint**: `DELETE /admin/schedules/:id`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/schedules/{scheduleId}`

**URL Parameters**:
- `id` (required, ObjectId string): Schedule ID

**Success Response**: Status `200`
```json
{
  "message": "Schedule removed"
}
```

**Error Responses**:
- **404 Not Found**: Schedule not found
  ```json
  { "message": "Schedule not found" }
  ```
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role
- Deletes schedule document by ID
- Records DELETE action in audit log with old schedule values
- Prevents future slot generation for that doctor on that day

**Notes**:
- Only ADMIN can delete schedules
- Soft delete not implemented - removes schedule completely
- Use to disable doctor availability on specific days
- Audit trail maintains record of deleted schedule

---

### 12. Get Leaves
**Endpoint**: `GET /admin/leaves`  
**Authentication**: Required  
**Authorization**: ADMIN, RECEPTIONIST  
**Base URL Path**: `/api/admin/leaves`

**Query Parameters**:
- `doctorId` (optional, ObjectId string): Filter by doctor

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "doctorId": {
      "_id": "ObjectId (string)",
      "name": "string"
    },
    "date": "YYYY-MM-DD",
    "reason": "string (optional)",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized

**Business Logic**:
- Requires ADMIN or RECEPTIONIST role
- Filters by doctorId if provided
- Populates doctorId with name field
- Returns all doctor leaves

**Notes**:
- Optional doctorId filter
- One leave record per doctor per day
- Prevents slot generation on leave dates

---

### 13. Create Leave
**Endpoint**: `POST /admin/leaves`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/leaves`

**Request Body**:
```json
{
  "doctorId": "ObjectId (string, required)",
  "date": "YYYY-MM-DD (string, required)",
  "reason": "string (optional)"
}
```

**Success Response**: Status `201`
```json
{
  "_id": "ObjectId (string)",
  "doctorId": "ObjectId (string)",
  "date": "YYYY-MM-DD",
  "reason": "string (optional)",
  "createdAt": "ISO 8601 timestamp",
  "updatedAt": "ISO 8601 timestamp"
}
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized
- **400 Bad Request**: Missing required fields or doctor already has leave on date (unique constraint)
- **500 Server Error**: Database error

**Business Logic**:
- Requires ADMIN role
- doctorId and date are required
- reason is optional
- Composite unique index: { doctorId, date }
- Logs audit entry with CREATE action

**Notes**:
- Only ADMIN can create leaves
- Cannot have duplicate leave for doctor on same date
- Used to block slot generation
- Reason is optional for documentation

---

### 14. Get Audit Logs
**Endpoint**: `GET /admin/audit-logs`  
**Authentication**: Required  
**Authorization**: ADMIN only  
**Base URL Path**: `/api/admin/audit-logs`

**Success Response**: Status `200`
```json
[
  {
    "_id": "ObjectId (string)",
    "actorUserId": {
      "_id": "ObjectId (string)",
      "name": "string"
    },
    "actorRole": "ADMIN | RECEPTIONIST | DOCTOR",
    "actionType": "CREATE | UPDATE | DELETE | RESCHEDULE | CANCEL | STATUS_CHANGE | REORDER | SYNC",
    "entityType": "Patient | Appointment | Doctor | QueueToken | Schedule | Leave | User | AppointmentType",
    "entityId": "ObjectId (string)",
    "oldValue": "any (optional, JSON object or value)",
    "newValue": "any (optional, JSON object or value)",
    "timestamp": "ISO 8601 timestamp",
    "ipAddress": "string (optional)"
  }
]
```

**Error Responses**:
- **401 Unauthorized**: Authentication failed
- **403 Forbidden**: User role not authorized

**Business Logic**:
- Requires ADMIN role
- Returns last 100 audit logs (limit: 100)
- Sorted by timestamp descending (newest first)
- Populates actorUserId with name field
- Tracks all major system actions

**Notes**:
- Only ADMIN can access audit logs
- Limited to 100 most recent logs
- Sorted chronologically (newest first)
- Comprehensive action tracking for compliance

---

## Authentication & Authorization Summary

### User Roles
1. **ADMIN**: Full system access, can manage all resources
2. **RECEPTIONIST**: Can view and manage appointments, patients, doctors; cannot manage admin settings
3. **DOCTOR**: Can view their own schedule and appointments

### Protected Routes
All routes marked as "Authentication: Required" need Bearer token in header:
```
Authorization: Bearer {jwt_token}
```

### Role-Based Access Control
- **Public**: `/auth/login` only
- **ADMIN**: Admin panel operations, user management, system configuration
- **ADMIN + RECEPTIONIST**: View operations for doctors, schedules, leaves, appointment types
- **All Authenticated Users**: Appointments, patients, queue (ADMIN, RECEPTIONIST, DOCTOR)

### Token Details
- **Expiry**: 30 days from issuance
- **Algorithm**: HS256 (JWT)
- **Secret**: Configured in `JWT_SECRET` environment variable
- **Claims**: Contains user ID (`id`), valid for 30 days

---

## Data Types & Formats

### Common Formats
- **ObjectId**: MongoDB ObjectId as string (24 hex characters)
- **Date**: ISO 8601 format (YYYY-MM-DD)
- **Time**: 24-hour format (HH:mm)
- **Timestamp**: ISO 8601 datetime with timezone
- **Timezone**: Asia/Kolkata used for appointment calculations

### Enums

**AppointmentStatus**:
- SCHEDULED
- CHECKED_IN
- IN_QUEUE
- COMPLETED
- CANCELLED
- NO_SHOW

**BookingMode**:
- NORMAL (future appointments)
- BACKDATED (past appointments)

**QueueStatus**:
- WAITING
- SERVING
- DONE
- CANCELLED

**UserRole**:
- ADMIN
- RECEPTIONIST
- DOCTOR

**NotificationType**:
- APPOINTMENT_CREATED
- APPOINTMENT_CANCELLED
- APPOINTMENT_RESCHEDULED

**NotificationTarget**:
- DOCTOR
- PATIENT

**NotificationChannel**:
- SMS
- EMAIL

**NotificationStatus**:
- QUEUED
- SENT
- FAILED

---

## Error Handling

### Standard Error Response Format
```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data, validation failed, constraint violation
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Authenticated but not authorized for this action
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

---

## Business Logic Summary

### Appointments
- **Double booking prevention**: Strict overlap checking by doctor and date
- **Timezone**: All time calculations use Asia/Kolkata
- **Status workflow**: SCHEDULED → CHECKED_IN → IN_QUEUE → COMPLETED or CANCELLED/NO_SHOW
- **Notifications**: Created on appointment lifecycle events
- **Audit trail**: All changes logged with actor and timestamp

### Queue Management
- **Auto-increment**: Token numbers and positions increment per doctor per day
- **Sync**: Automatically adds SCHEDULED/CHECKED_IN appointments to queue
- **Reordering**: Bulk position changes supported

### Scheduling
- **Templates**: Recurring schedule per doctor per day of week
- **Break slots**: Support for lunch and break times
- **Leave management**: Blocks slot generation on leave dates

### Patient Management
- **Unique constraint**: Combination of name, father name, and phone
- **Appointment history**: Related appointments retrievable with patient

### Audit & Compliance
- **Complete audit trail**: All entity changes tracked
- **User accountability**: Every action records actor and role
- **Before/after values**: Changes captured for compliance

---

## Implementation Notes

### Rate Limiting
Not implemented - consider adding for production

### Pagination
Not implemented - consider adding for large result sets

### Validation Middleware
- Validate request body structure
- Validate date/time formats
- Validate enum values
- Validate MongoDB ObjectIds

### Security Considerations
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens signed with secret key
- Role-based authorization on all protected routes
- Input validation on all endpoints

### Performance Indexes
All models have indexes on commonly filtered fields:
- User: { role }, { email }, { doctorId }
- Appointment: { doctorId, date }, { patientId }
- QueueToken: { doctorId, date, queuePosition }, { patientId }, { status, doctorId, date }
- DoctorScheduleTemplate: { doctorId, dayOfWeek }
- DoctorLeave: { doctorId, date } (unique)
- Patient: { patientName, fatherName, phone } (unique)

---

## Example Request/Response Flows

### Login Flow
```
1. POST /auth/login
   Body: { "email": "admin@clinic.com", "password": "password123" }
   Response: { "_id": "...", "name": "...", "email": "...", "role": "ADMIN", "token": "eyJ..." }

2. Store token in localStorage or session

3. Use token in subsequent requests:
   GET /admin/doctors
   Header: Authorization: Bearer eyJ...
```

### Appointment Booking Flow
```
1. GET /doctors/{doctorId}/slots?date=2026-01-25&duration=30
   Response: [ { "startTime": "09:00", "endTime": "09:30", "available": true }, ... ]

2. POST /appointments
   Body: { "doctorId": "...", "patientId": "...", "appointmentTypeId": "...", 
           "date": "2026-01-25", "startTime": "09:00", "durationMinutes": 30 }
   Response: { "_id": "...", status: "SCHEDULED", ... }

3. POST /queue/add
   Body: { "doctorId": "...", "date": "2026-01-25", "patientId": "...", "appointmentId": "..." }
   Response: { "_id": "...", "tokenNumber": 5, "queuePosition": 5, status: "WAITING" }
```

### Appointment Status Progression
```
1. Appointment created: status = SCHEDULED
2. Patient arrives: PATCH /appointments/{id}/status { status: "CHECKED_IN" }
3. Add to queue: POST /queue/add + PATCH /queue/{id}/status { status: "WAITING" }
4. Doctor calling: PATCH /queue/{id}/status { status: "SERVING" }
5. After consultation: PATCH /queue/{id}/status { status: "DONE" }
6. Update appointment: PATCH /appointments/{id}/status { status: "COMPLETED" }
```

---

## Migration & Setup

### Database Models
Ensure MongoDB collections exist for:
- users
- doctors
- patients
- appointments
- appointmenttypes
- doctorscheduletemplates
- doctorleaves
- queuetokens
- appointmentstatushistories
- notificationoutboxes
- auditlogs

### Required Indexes
Create indexes as defined in model files for optimal performance

### Environment Variables
```
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/clinic
PORT=5000
```

---

## Notes for Frontend Integration

### Authentication
1. Store JWT token after login
2. Include token in all API requests in Authorization header
3. Refresh token on 401 error (implement token refresh if needed)
4. Handle 403 errors for role-based access

### Error Handling
- Check response status code
- Parse error message from { "message": "..." }
- Handle specific error messages in UI

### Timezone Handling
- Backend uses Asia/Kolkata for all time operations
- Frontend should adjust display timezone as needed
- Send dates in YYYY-MM-DD format
- Send times in HH:mm format (24-hour)

### Real-time Updates
- Queue status changes not real-time (implement WebSocket if needed)
- Appointment status changes require page refresh or polling
- Consider implementing signalR or Socket.io for real-time updates

---

End of API Documentation
