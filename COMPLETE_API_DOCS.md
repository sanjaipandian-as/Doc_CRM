# Complete Backend API Documentation

**Last Updated**: January 20, 2026  
**API Version**: v1  
**Base URL**: `http://localhost:5000/api` (or deployed server URL)  
**Database**: MongoDB  
**Timezone**: Asia/Kolkata (IST)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Patients Management](#patients-management)
3. [Appointments Management](#appointments-management)
4. [Queue Management](#queue-management)
5. [Doctor Management](#doctor-management)
6. [Admin Panel](#admin-panel)
7. [Error Responses](#error-responses)
8. [Data Models](#data-models)

---

## Authentication

### 1. Login

**Endpoint**: `POST /auth/login`

**Authentication**: Not required

**Request Body**:
```json
{
  "email": "string (email format, required)",
  "password": "string (minimum 6 characters, required)"
}
```

**Request Example**:
```json
{
  "email": "admin@clinic.com",
  "password": "securePassword123"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@clinic.com",
    "role": "ADMIN"
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | Email and password are required |
| 401 | INVALID_CREDENTIALS | Invalid email or password |
| 500 | SERVER_ERROR | Internal server error |

**Error Example (401)**:
```json
{
  "success": false,
  "error": "Invalid email or password",
  "code": "INVALID_CREDENTIALS"
}
```

**Notes**:
- JWT token valid for 30 days
- Token should be sent in Authorization header as: `Bearer <token>`
- Password is hashed using bcrypt before storage

---

### 2. Get Current User Profile

**Endpoint**: `GET /auth/me`

**Authentication**: Required (Bearer token)

**Request Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Query Parameters**: None

**Success Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@clinic.com",
    "role": "ADMIN",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-20T08:30:00Z"
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token missing or invalid |
| 401 | TOKEN_EXPIRED | Token has expired |
| 500 | SERVER_ERROR | Internal server error |

**Error Example (401)**:
```json
{
  "success": false,
  "error": "Unauthorized access",
  "code": "UNAUTHORIZED"
}
```

---

## Patients Management

### 1. Get All Patients (with Search)

**Endpoint**: `GET /patients`

**Authentication**: Required (Bearer token) - Any role

**Query Parameters**:
```
?search=string (optional, regex search in name, phone, email)
?page=number (optional, default: 1, pagination - 50 per page)
```

**Request Example**:
```
GET /api/patients?search=john&page=1
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "_id": "507f1f77bcf86cd799439012",
        "patientName": "John Doe",
        "fatherName": "Robert Doe",
        "email": "john@example.com",
        "phone": "9876543210",
        "address": "123 Main St, City",
        "age": 35,
        "gender": "MALE",
        "createdAt": "2025-01-10T09:30:00Z",
        "updatedAt": "2025-01-15T14:00:00Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token missing or invalid |
| 500 | SERVER_ERROR | Internal server error |

---

### 2. Get Patient by ID with Appointments

**Endpoint**: `GET /patients/:patientId`

**Authentication**: Required (Bearer token) - Any role

**URL Parameters**:
```
:patientId - MongoDB ObjectId of the patient
```

**Request Example**:
```
GET /api/patients/507f1f77bcf86cd799439012
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "507f1f77bcf86cd799439012",
      "patientName": "John Doe",
      "fatherName": "Robert Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "address": "123 Main St, City",
      "age": 35,
      "gender": "MALE",
      "createdAt": "2025-01-10T09:30:00Z"
    },
    "appointments": [
      {
        "_id": "507f1f77bcf86cd799439050",
        "patientId": "507f1f77bcf86cd799439012",
        "doctorId": {
          "_id": "507f1f77bcf86cd799439001",
          "name": "Dr. Smith",
          "specialization": "Cardiology"
        },
        "appointmentTypeId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "General Checkup"
        },
        "startTime": "2025-01-25T10:00:00Z",
        "endTime": "2025-01-25T10:30:00Z",
        "status": "SCHEDULED",
        "createdAt": "2025-01-10T09:30:00Z"
      }
    ]
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Patient not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 500 | SERVER_ERROR | Internal server error |

---

### 3. Create Patient

**Endpoint**: `POST /patients`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**Request Body**:
```json
{
  "patientName": "string (required, max 100 characters)",
  "fatherName": "string (required, max 100 characters)",
  "email": "string (required, valid email format)",
  "phone": "string (required, 10 digits)",
  "address": "string (optional, max 200 characters)",
  "age": "number (required, min 1, max 150)",
  "gender": "string (required, enum: MALE, FEMALE, OTHER)"
}
```

**Request Example**:
```json
{
  "patientName": "Jane Smith",
  "fatherName": "Michael Smith",
  "email": "jane@example.com",
  "phone": "9876543211",
  "address": "456 Oak Ave, City",
  "age": 28,
  "gender": "FEMALE"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "507f1f77bcf86cd799439013",
      "patientName": "Jane Smith",
      "fatherName": "Michael Smith",
      "email": "jane@example.com",
      "phone": "9876543211",
      "address": "456 Oak Ave, City",
      "age": 28,
      "gender": "FEMALE",
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | DUPLICATE_PATIENT | Patient with this name, father name, and phone already exists |
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Error Example (400)**:
```json
{
  "success": false,
  "error": "Patient with this name, father name, and phone already exists",
  "code": "DUPLICATE_PATIENT"
}
```

**Notes**:
- Unique constraint: (patientName, fatherName, phone) combination
- Email should be valid format
- Phone must be exactly 10 digits
- Creates audit log entry

---

### 4. Update Patient

**Endpoint**: `PATCH /patients/:patientId`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**URL Parameters**:
```
:patientId - MongoDB ObjectId of the patient
```

**Request Body** (all fields optional):
```json
{
  "patientName": "string (max 100 characters)",
  "fatherName": "string (max 100 characters)",
  "email": "string (valid email format)",
  "phone": "string (10 digits)",
  "address": "string (max 200 characters)",
  "age": "number (min 1, max 150)",
  "gender": "string (enum: MALE, FEMALE, OTHER)"
}
```

**Request Example**:
```json
{
  "phone": "9876543212",
  "address": "789 Pine Rd, City"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "patient": {
      "_id": "507f1f77bcf86cd799439013",
      "patientName": "Jane Smith",
      "fatherName": "Michael Smith",
      "email": "jane@example.com",
      "phone": "9876543212",
      "address": "789 Pine Rd, City",
      "age": 28,
      "gender": "FEMALE",
      "updatedAt": "2025-01-20T11:30:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Patient not found |
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- Logs old and new values for audit trail
- Only provided fields are updated
- Cannot violate unique constraints

---

## Appointments Management

### 1. Get Available Slots

**Endpoint**: `GET /appointments/available-slots`

**Authentication**: Required (Bearer token) - Any role

**Query Parameters**:
```
?doctorId=string (required, MongoDB ObjectId)
?date=string (required, format: YYYY-MM-DD)
```

**Request Example**:
```
GET /api/appointments/available-slots?doctorId=507f1f77bcf86cd799439001&date=2025-01-25
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "slots": [
      {
        "startTime": "2025-01-25T09:00:00Z",
        "endTime": "2025-01-25T09:30:00Z"
      },
      {
        "startTime": "2025-01-25T09:30:00Z",
        "endTime": "2025-01-25T10:00:00Z"
      },
      {
        "startTime": "2025-01-25T11:00:00Z",
        "endTime": "2025-01-25T11:30:00Z"
      }
    ],
    "doctor": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "Dr. Smith",
      "specialization": "Cardiology",
      "defaultSlotDurationMinutes": 30
    },
    "date": "2025-01-25"
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | doctorId and date are required |
| 400 | INVALID_DATE_FORMAT | Date must be in YYYY-MM-DD format |
| 400 | PAST_DATE | Cannot book appointments for past dates |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- Considers doctor's schedule template for the day
- Excludes existing appointments
- Excludes break times
- Respects doctor leaves
- Generated slots are typically 30 minutes unless customized

---

### 2. Create Appointment

**Endpoint**: `POST /appointments`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**Request Body**:
```json
{
  "patientId": "string (required, MongoDB ObjectId)",
  "doctorId": "string (required, MongoDB ObjectId)",
  "appointmentTypeId": "string (required, MongoDB ObjectId)",
  "startTime": "string (required, ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)",
  "endTime": "string (required, ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)"
}
```

**Request Example**:
```json
{
  "patientId": "507f1f77bcf86cd799439012",
  "doctorId": "507f1f77bcf86cd799439001",
  "appointmentTypeId": "507f1f77bcf86cd799439020",
  "startTime": "2025-01-25T10:00:00Z",
  "endTime": "2025-01-25T10:30:00Z"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439051",
      "patientId": "507f1f77bcf86cd799439012",
      "doctorId": "507f1f77bcf86cd799439001",
      "appointmentTypeId": "507f1f77bcf86cd799439020",
      "startTime": "2025-01-25T10:00:00Z",
      "endTime": "2025-01-25T10:30:00Z",
      "status": "SCHEDULED",
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T10:00:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | [Field validation errors] |
| 400 | DOUBLE_BOOKING | Doctor already has an appointment during this time |
| 400 | BACKDATED_BOOKING | Cannot book appointments for past times |
| 400 | SLOT_UNAVAILABLE | Selected slot is not available |
| 404 | PATIENT_NOT_FOUND | Patient not found |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 404 | APPOINTMENT_TYPE_NOT_FOUND | Appointment type not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Error Example (400)**:
```json
{
  "success": false,
  "error": "Doctor already has an appointment during this time",
  "code": "DOUBLE_BOOKING"
}
```

**Side Effects**:
- Creates AppointmentStatusHistory record with SCHEDULED status
- Creates NotificationOutbox entry (APPOINTMENT_CREATED)
- Logs audit entry

**Notes**:
- startTime must be before endTime
- endTime - startTime typically equals doctor's slot duration
- Status automatically set to SCHEDULED
- Performs double-booking validation
- Detects backdated bookings

---

### 3. Reschedule Appointment

**Endpoint**: `PATCH /appointments/:appointmentId/reschedule`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**URL Parameters**:
```
:appointmentId - MongoDB ObjectId of the appointment
```

**Request Body**:
```json
{
  "newStartTime": "string (required, ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)",
  "newEndTime": "string (required, ISO 8601 format: YYYY-MM-DDTHH:mm:ssZ)",
  "reason": "string (optional, max 500 characters)"
}
```

**Request Example**:
```json
{
  "newStartTime": "2025-01-26T14:00:00Z",
  "newEndTime": "2025-01-26T14:30:00Z",
  "reason": "Patient requested to shift to next day"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439051",
      "patientId": "507f1f77bcf86cd799439012",
      "doctorId": "507f1f77bcf86cd799439001",
      "appointmentTypeId": "507f1f77bcf86cd799439020",
      "startTime": "2025-01-26T14:00:00Z",
      "endTime": "2025-01-26T14:30:00Z",
      "status": "SCHEDULED",
      "updatedAt": "2025-01-20T11:45:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Appointment not found |
| 400 | INVALID_INPUT | newStartTime and newEndTime are required |
| 400 | DOUBLE_BOOKING | Doctor already has an appointment during this time |
| 400 | PAST_DATE | Cannot reschedule to past times |
| 400 | APPOINTMENT_COMPLETED | Cannot reschedule completed appointments |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Updates appointment with new times
- Creates AppointmentStatusHistory record (RESCHEDULED)
- Creates NotificationOutbox entry (APPOINTMENT_RESCHEDULED)
- Logs audit entry with reason

**Notes**:
- Excludes self when checking for double-booking
- Validates that appointment is not already completed

---

### 4. Cancel Appointment

**Endpoint**: `PATCH /appointments/:appointmentId/cancel`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**URL Parameters**:
```
:appointmentId - MongoDB ObjectId of the appointment
```

**Request Body**:
```json
{
  "reason": "string (optional, max 500 characters)"
}
```

**Request Example**:
```json
{
  "reason": "Patient requested cancellation"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439051",
      "patientId": "507f1f77bcf86cd799439012",
      "doctorId": "507f1f77bcf86cd799439001",
      "appointmentTypeId": "507f1f77bcf86cd799439020",
      "startTime": "2025-01-26T14:00:00Z",
      "endTime": "2025-01-26T14:30:00Z",
      "status": "CANCELLED",
      "cancellationReason": "Patient requested cancellation",
      "updatedAt": "2025-01-20T11:50:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Appointment not found |
| 400 | APPOINTMENT_COMPLETED | Cannot cancel completed appointments |
| 400 | APPOINTMENT_ALREADY_CANCELLED | Appointment is already cancelled |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Sets status to CANCELLED
- Stores cancellation reason
- Creates AppointmentStatusHistory record
- Creates NotificationOutbox entry (APPOINTMENT_CANCELLED)
- Logs audit entry

---

### 5. Update Appointment Status

**Endpoint**: `PATCH /appointments/:appointmentId/status`

**Authentication**: Required (Bearer token) - DOCTOR or ADMIN

**URL Parameters**:
```
:appointmentId - MongoDB ObjectId of the appointment
```

**Request Body**:
```json
{
  "status": "string (required, enum: SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)"
}
```

**Request Example**:
```json
{
  "status": "COMPLETED"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointment": {
      "_id": "507f1f77bcf86cd799439051",
      "status": "COMPLETED",
      "updatedAt": "2025-01-26T14:30:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Appointment not found |
| 400 | INVALID_STATUS | Invalid status value |
| 400 | INVALID_TRANSITION | Status transition not allowed |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Creates AppointmentStatusHistory record
- Logs audit entry
- Creates notification if status changes to COMPLETED

---

### 6. Get Appointments (with Filters)

**Endpoint**: `GET /appointments`

**Authentication**: Required (Bearer token) - Any role

**Query Parameters**:
```
?doctorId=string (optional, MongoDB ObjectId)
?patientId=string (optional, MongoDB ObjectId)
?status=string (optional, enum: SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)
?startDate=string (optional, YYYY-MM-DD)
?endDate=string (optional, YYYY-MM-DD)
?page=number (optional, default: 1)
?limit=number (optional, default: 20, max: 100)
```

**Request Example**:
```
GET /api/appointments?doctorId=507f1f77bcf86cd799439001&status=SCHEDULED&page=1
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "_id": "507f1f77bcf86cd799439051",
        "patientId": {
          "_id": "507f1f77bcf86cd799439012",
          "patientName": "Jane Smith",
          "phone": "9876543211",
          "email": "jane@example.com"
        },
        "doctorId": {
          "_id": "507f1f77bcf86cd799439001",
          "name": "Dr. Smith",
          "specialization": "Cardiology"
        },
        "appointmentTypeId": {
          "_id": "507f1f77bcf86cd799439020",
          "name": "General Checkup"
        },
        "startTime": "2025-01-25T10:00:00Z",
        "endTime": "2025-01-25T10:30:00Z",
        "status": "SCHEDULED",
        "createdAt": "2025-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 50,
      "totalPages": 3
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | Invalid query parameters |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- Sorted by startTime ascending
- All related documents (patient, doctor, appointmentType) are populated
- Supports multiple filter combinations

---

## Queue Management

### 1. Get Queue

**Endpoint**: `GET /queue`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**Query Parameters**:
```
?doctorId=string (required, MongoDB ObjectId)
?date=string (required, format: YYYY-MM-DD)
```

**Request Example**:
```
GET /api/queue?doctorId=507f1f77bcf86cd799439001&date=2025-01-25
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "queue": [
      {
        "_id": "607f1f77bcf86cd799439100",
        "appointmentId": {
          "_id": "507f1f77bcf86cd799439051",
          "startTime": "2025-01-25T10:00:00Z",
          "endTime": "2025-01-25T10:30:00Z"
        },
        "patientId": {
          "_id": "507f1f77bcf86cd799439012",
          "patientName": "Jane Smith",
          "phone": "9876543211"
        },
        "doctorId": "507f1f77bcf86cd799439001",
        "date": "2025-01-25",
        "tokenNumber": 1,
        "queuePosition": 1,
        "status": "WAITING",
        "createdAt": "2025-01-20T09:00:00Z"
      },
      {
        "_id": "607f1f77bcf86cd799439101",
        "appointmentId": {
          "_id": "507f1f77bcf86cd799439052",
          "startTime": "2025-01-25T10:30:00Z",
          "endTime": "2025-01-25T11:00:00Z"
        },
        "patientId": {
          "_id": "507f1f77bcf86cd799439013",
          "patientName": "John Doe",
          "phone": "9876543210"
        },
        "doctorId": "507f1f77bcf86cd799439001",
        "date": "2025-01-25",
        "tokenNumber": 2,
        "queuePosition": 2,
        "status": "WAITING",
        "createdAt": "2025-01-20T09:05:00Z"
      }
    ],
    "totalInQueue": 2,
    "doctor": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "Dr. Smith",
      "specialization": "Cardiology"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | doctorId and date are required |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- Sorted by queuePosition ascending
- Includes only appointments for the specified date
- Populated patient and appointment information

---

### 2. Add to Queue

**Endpoint**: `POST /queue/add`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**Request Body**:
```json
{
  "appointmentId": "string (required, MongoDB ObjectId)"
}
```

**Request Example**:
```json
{
  "appointmentId": "507f1f77bcf86cd799439051"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "queueToken": {
      "_id": "607f1f77bcf86cd799439102",
      "appointmentId": "507f1f77bcf86cd799439051",
      "patientId": "507f1f77bcf86cd799439012",
      "doctorId": "507f1f77bcf86cd799439001",
      "date": "2025-01-25",
      "tokenNumber": 3,
      "queuePosition": 3,
      "status": "WAITING",
      "createdAt": "2025-01-20T10:15:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | APPOINTMENT_NOT_FOUND | Appointment not found |
| 400 | ALREADY_IN_QUEUE | Appointment is already in queue |
| 400 | APPOINTMENT_INVALID_STATUS | Only SCHEDULED or CHECKED_IN appointments can be added to queue |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Auto-increments tokenNumber for the day
- Auto-assigns queuePosition
- Logs audit entry

**Notes**:
- tokenNumber and queuePosition are auto-generated
- Status defaults to WAITING

---

### 3. Reorder Queue

**Endpoint**: `PATCH /queue/reorder`

**Authentication**: Required (Bearer token) - RECEPTIONIST or ADMIN

**Request Body**:
```json
{
  "queueItems": [
    {
      "queueTokenId": "string (MongoDB ObjectId)",
      "newPosition": "number (position in queue)"
    }
  ]
}
```

**Request Example**:
```json
{
  "queueItems": [
    {
      "queueTokenId": "607f1f77bcf86cd799439100",
      "newPosition": 2
    },
    {
      "queueTokenId": "607f1f77bcf86cd799439101",
      "newPosition": 1
    }
  ]
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "updatedQueue": [
      {
        "_id": "607f1f77bcf86cd799439101",
        "queuePosition": 1
      },
      {
        "_id": "607f1f77bcf86cd799439100",
        "queuePosition": 2
      }
    ]
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | queueItems array is required |
| 404 | QUEUE_TOKEN_NOT_FOUND | One or more queue tokens not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Bulk updates queue positions
- Logs all position changes in audit trail

---

### 4. Update Queue Token Status

**Endpoint**: `PATCH /queue/:queueTokenId/status`

**Authentication**: Required (Bearer token) - DOCTOR or RECEPTIONIST or ADMIN

**URL Parameters**:
```
:queueTokenId - MongoDB ObjectId of the queue token
```

**Request Body**:
```json
{
  "status": "string (required, enum: WAITING, SERVING, DONE, CANCELLED)"
}
```

**Request Example**:
```json
{
  "status": "SERVING"
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "queueToken": {
      "_id": "607f1f77bcf86cd799439100",
      "status": "SERVING",
      "updatedAt": "2025-01-25T10:00:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Queue token not found |
| 400 | INVALID_STATUS | Invalid status value |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

---

### 5. Sync Queue

**Endpoint**: `POST /queue/sync`

**Authentication**: Required (Bearer token) - ADMIN only

**Query Parameters**:
```
?doctorId=string (required, MongoDB ObjectId)
?date=string (required, format: YYYY-MM-DD)
```

**Request Example**:
```
POST /api/queue/sync?doctorId=507f1f77bcf86cd799439001&date=2025-01-25
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "synced": 3,
    "message": "3 appointments synced to queue"
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | doctorId and date are required |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Syncs all SCHEDULED and CHECKED_IN appointments to queue
- Creates queue tokens for unqueued appointments
- Logs audit entry

**Notes**:
- Only syncs appointments that don't already have queue tokens
- Useful for daily initialization of queue

---

## Doctor Management

### 1. Get Available Slots (Doctor-specific)

**Endpoint**: `GET /doctors/:doctorId/slots`

**Authentication**: Required (Bearer token) - Any role

**URL Parameters**:
```
:doctorId - MongoDB ObjectId of the doctor
```

**Query Parameters**:
```
?date=string (required, format: YYYY-MM-DD)
?duration=number (optional, slot duration in minutes, default: doctor's default)
```

**Request Example**:
```
GET /api/doctors/507f1f77bcf86cd799439001/slots?date=2025-01-25&duration=30
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "507f1f77bcf86cd799439001",
      "name": "Dr. Smith",
      "specialization": "Cardiology",
      "defaultSlotDurationMinutes": 30
    },
    "date": "2025-01-25",
    "slots": [
      {
        "startTime": "2025-01-25T09:00:00Z",
        "endTime": "2025-01-25T09:30:00Z"
      },
      {
        "startTime": "2025-01-25T09:30:00Z",
        "endTime": "2025-01-25T10:00:00Z"
      }
    ],
    "totalSlots": 2
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | date is required |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- Uses doctor's schedule template
- Excludes breaks and existing appointments
- Considers doctor leaves

---

## Admin Panel

### 1. Get All Doctors

**Endpoint**: `GET /admin/doctors`

**Authentication**: Required (Bearer token) - ADMIN or RECEPTIONIST

**Query Parameters**:
```
?active=boolean (optional, filter by isActive status)
?page=number (optional, default: 1)
?limit=number (optional, default: 20)
```

**Request Example**:
```
GET /api/admin/doctors?active=true
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "doctors": [
      {
        "_id": "507f1f77bcf86cd799439001",
        "name": "Dr. Smith",
        "specialization": "Cardiology",
        "defaultSlotDurationMinutes": 30,
        "isActive": true,
        "createdAt": "2025-01-10T08:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 5,
      "totalPages": 1
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

---

### 2. Create Doctor

**Endpoint**: `POST /admin/doctors`

**Authentication**: Required (Bearer token) - ADMIN only

**Request Body**:
```json
{
  "name": "string (required, max 100 characters)",
  "specialization": "string (required, max 100 characters)",
  "defaultSlotDurationMinutes": "number (required, min 15, max 120)"
}
```

**Request Example**:
```json
{
  "name": "Dr. Jane Anderson",
  "specialization": "Neurology",
  "defaultSlotDurationMinutes": 45
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "507f1f77bcf86cd799439002",
      "name": "Dr. Jane Anderson",
      "specialization": "Neurology",
      "defaultSlotDurationMinutes": 45,
      "isActive": true,
      "createdAt": "2025-01-20T12:00:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- isActive defaults to true
- Creates audit log entry

---

### 3. Update Doctor

**Endpoint**: `PATCH /admin/doctors/:doctorId`

**Authentication**: Required (Bearer token) - ADMIN only

**URL Parameters**:
```
:doctorId - MongoDB ObjectId of the doctor
```

**Request Body** (all fields optional):
```json
{
  "name": "string (max 100 characters)",
  "specialization": "string (max 100 characters)",
  "defaultSlotDurationMinutes": "number (min 15, max 120)",
  "isActive": "boolean"
}
```

**Request Example**:
```json
{
  "isActive": false
}
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "doctor": {
      "_id": "507f1f77bcf86cd799439002",
      "name": "Dr. Jane Anderson",
      "specialization": "Neurology",
      "defaultSlotDurationMinutes": 45,
      "isActive": false,
      "updatedAt": "2025-01-20T12:30:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 404 | NOT_FOUND | Doctor not found |
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Logs changes in audit trail

---

### 4. Get All Receptionists (Users)

**Endpoint**: `GET /admin/users`

**Authentication**: Required (Bearer token) - ADMIN only

**Query Parameters**:
```
?role=string (optional, filter by role)
?page=number (optional, default: 1)
?limit=number (optional, default: 20)
```

**Request Example**:
```
GET /api/admin/users?role=RECEPTIONIST
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "_id": "507f1f77bcf86cd799439030",
        "name": "John Receptionist",
        "email": "john@clinic.com",
        "role": "RECEPTIONIST",
        "createdAt": "2025-01-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 3,
      "totalPages": 1
    }
  }
}
```

**Notes**:
- passwordHash is NOT returned
- Only ADMIN can view all users

---

### 5. Create Receptionist/User

**Endpoint**: `POST /admin/users`

**Authentication**: Required (Bearer token) - ADMIN only

**Request Body**:
```json
{
  "name": "string (required, max 100 characters)",
  "email": "string (required, valid email format)",
  "password": "string (required, minimum 6 characters)",
  "role": "string (required, enum: RECEPTIONIST, DOCTOR, ADMIN)"
}
```

**Request Example**:
```json
{
  "name": "Mary Smith",
  "email": "mary@clinic.com",
  "password": "securePass123",
  "role": "RECEPTIONIST"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439031",
      "name": "Mary Smith",
      "email": "mary@clinic.com",
      "role": "RECEPTIONIST",
      "createdAt": "2025-01-20T13:00:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 400 | DUPLICATE_EMAIL | Email already exists |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Side Effects**:
- Password is hashed using bcrypt
- Creates audit log entry

---

### 6. Get Appointment Types

**Endpoint**: `GET /admin/appointment-types`

**Authentication**: Required (Bearer token) - ADMIN or RECEPTIONIST

**Query Parameters**:
```
?active=boolean (optional, filter by isActive)
?page=number (optional, default: 1)
```

**Request Example**:
```
GET /api/admin/appointment-types?active=true
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "appointmentTypes": [
      {
        "_id": "507f1f77bcf86cd799439020",
        "name": "General Checkup",
        "isActive": true,
        "createdAt": "2025-01-10T08:00:00Z"
      },
      {
        "_id": "507f1f77bcf86cd799439021",
        "name": "Follow-up Consultation",
        "isActive": true,
        "createdAt": "2025-01-10T08:05:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "totalCount": 2,
      "totalPages": 1
    }
  }
}
```

---

### 7. Create Appointment Type

**Endpoint**: `POST /admin/appointment-types`

**Authentication**: Required (Bearer token) - ADMIN only

**Request Body**:
```json
{
  "name": "string (required, max 100 characters, unique)"
}
```

**Request Example**:
```json
{
  "name": "Cardiac Stress Test"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "appointmentType": {
      "_id": "507f1f77bcf86cd799439022",
      "name": "Cardiac Stress Test",
      "isActive": true,
      "createdAt": "2025-01-20T13:30:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | name is required |
| 400 | DUPLICATE_NAME | Appointment type with this name already exists |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

---

### 8. Get Doctor Schedules

**Endpoint**: `GET /admin/schedules`

**Authentication**: Required (Bearer token) - ADMIN or RECEPTIONIST

**Query Parameters**:
```
?doctorId=string (optional, MongoDB ObjectId)
?dayOfWeek=number (optional, 0-6, Monday-Sunday)
?page=number (optional, default: 1)
```

**Request Example**:
```
GET /api/admin/schedules?doctorId=507f1f77bcf86cd799439001
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "schedules": [
      {
        "_id": "707f1f77bcf86cd799439200",
        "doctorId": {
          "_id": "507f1f77bcf86cd799439001",
          "name": "Dr. Smith",
          "specialization": "Cardiology"
        },
        "dayOfWeek": 0,
        "dayName": "Monday",
        "startTime": "09:00",
        "endTime": "17:00",
        "breakSlots": [
          {
            "start": "12:00",
            "end": "13:00"
          }
        ],
        "createdAt": "2025-01-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "totalCount": 5,
      "totalPages": 1
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- dayOfWeek: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
- Time format in response: HH:mm

---

### 9. Create Doctor Schedule

**Endpoint**: `POST /admin/schedules`

**Authentication**: Required (Bearer token) - ADMIN only

**Request Body**:
```json
{
  "doctorId": "string (required, MongoDB ObjectId)",
  "dayOfWeek": "number (required, 0-6, Monday-Sunday)",
  "startTime": "string (required, format: HH:mm)",
  "endTime": "string (required, format: HH:mm)",
  "breakSlots": [
    {
      "start": "string (format: HH:mm)",
      "end": "string (format: HH:mm)"
    }
  ]
}
```

**Request Example**:
```json
{
  "doctorId": "507f1f77bcf86cd799439001",
  "dayOfWeek": 0,
  "startTime": "09:00",
  "endTime": "17:00",
  "breakSlots": [
    {
      "start": "12:00",
      "end": "13:00"
    }
  ]
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "schedule": {
      "_id": "707f1f77bcf86cd799439201",
      "doctorId": "507f1f77bcf86cd799439001",
      "dayOfWeek": 0,
      "startTime": "09:00",
      "endTime": "17:00",
      "breakSlots": [
        {
          "start": "12:00",
          "end": "13:00"
        }
      ],
      "createdAt": "2025-01-20T14:00:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 400 | DUPLICATE_SCHEDULE | Schedule for this doctor on this day already exists |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

---

### 10. Get Doctor Leaves

**Endpoint**: `GET /admin/leaves`

**Authentication**: Required (Bearer token) - ADMIN or RECEPTIONIST

**Query Parameters**:
```
?doctorId=string (optional, MongoDB ObjectId)
?startDate=string (optional, YYYY-MM-DD)
?endDate=string (optional, YYYY-MM-DD)
?page=number (optional, default: 1)
```

**Request Example**:
```
GET /api/admin/leaves?doctorId=507f1f77bcf86cd799439001&startDate=2025-01-20&endDate=2025-02-20
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "leaves": [
      {
        "_id": "807f1f77bcf86cd799439300",
        "doctorId": {
          "_id": "507f1f77bcf86cd799439001",
          "name": "Dr. Smith"
        },
        "date": "2025-01-26",
        "reason": "Personal leave",
        "createdAt": "2025-01-20T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "totalCount": 1,
      "totalPages": 1
    }
  }
}
```

---

### 11. Create Doctor Leave

**Endpoint**: `POST /admin/leaves`

**Authentication**: Required (Bearer token) - ADMIN only

**Request Body**:
```json
{
  "doctorId": "string (required, MongoDB ObjectId)",
  "date": "string (required, format: YYYY-MM-DD)",
  "reason": "string (optional, max 200 characters)"
}
```

**Request Example**:
```json
{
  "doctorId": "507f1f77bcf86cd799439001",
  "date": "2025-01-26",
  "reason": "Personal leave"
}
```

**Success Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "leave": {
      "_id": "807f1f77bcf86cd799439301",
      "doctorId": "507f1f77bcf86cd799439001",
      "date": "2025-01-26",
      "reason": "Personal leave",
      "createdAt": "2025-01-20T14:45:00Z"
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 400 | INVALID_INPUT | Validation failed: [field errors] |
| 400 | DUPLICATE_LEAVE | Doctor already has a leave on this date |
| 404 | DOCTOR_NOT_FOUND | Doctor not found |
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

---

### 12. Get Audit Logs

**Endpoint**: `GET /admin/audit-logs`

**Authentication**: Required (Bearer token) - ADMIN only

**Query Parameters**:
```
?entityType=string (optional, filter by entity type: Appointment, Patient, Doctor, etc.)
?actionType=string (optional, filter by action: CREATE, UPDATE, DELETE)
?userId=string (optional, filter by actor user ID)
?startDate=string (optional, YYYY-MM-DD)
?endDate=string (optional, YYYY-MM-DD)
?page=number (optional, default: 1)
?limit=number (optional, default: 100, max: 100)
```

**Request Example**:
```
GET /api/admin/audit-logs?entityType=Appointment&actionType=CREATE&page=1
```

**Success Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "907f1f77bcf86cd799439400",
        "actorUserId": {
          "_id": "507f1f77bcf86cd799439030",
          "name": "John Receptionist"
        },
        "actorRole": "RECEPTIONIST",
        "actionType": "CREATE",
        "entityType": "Appointment",
        "entityId": "507f1f77bcf86cd799439051",
        "oldValue": null,
        "newValue": {
          "patientId": "507f1f77bcf86cd799439012",
          "doctorId": "507f1f77bcf86cd799439001",
          "startTime": "2025-01-25T10:00:00Z",
          "endTime": "2025-01-25T10:30:00Z",
          "status": "SCHEDULED"
        },
        "timestamp": "2025-01-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 100,
      "totalCount": 150,
      "totalPages": 2
    }
  }
}
```

**Error Responses**:

| Status | Code | Message |
|--------|------|---------|
| 401 | UNAUTHORIZED | Token missing or invalid |
| 403 | FORBIDDEN | Insufficient permissions for this action |
| 500 | SERVER_ERROR | Internal server error |

**Notes**:
- Latest 100 logs per page (sorted by timestamp descending)
- Shows old and new values for UPDATE actions
- oldValue is null for CREATE actions
- Tracks all CRUD operations

---

## Error Responses

### Standard Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {} // Optional, contains additional context
}
```

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Request successful (GET, PATCH) |
| 201 | Resource created (POST) |
| 400 | Bad request (validation error, invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found (resource doesn't exist) |
| 409 | Conflict (duplicate, constraint violation) |
| 500 | Internal server error |

### Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| INVALID_INPUT | 400 | Request validation failed |
| INVALID_CREDENTIALS | 401 | Login credentials incorrect |
| UNAUTHORIZED | 401 | Missing or invalid token |
| TOKEN_EXPIRED | 401 | JWT token has expired |
| FORBIDDEN | 403 | User role insufficient |
| NOT_FOUND | 404 | Resource not found |
| DUPLICATE_PATIENT | 409 | Patient already exists |
| DUPLICATE_EMAIL | 409 | Email already in use |
| DUPLICATE_SCHEDULE | 409 | Schedule already exists for this doctor/day |
| DUPLICATE_LEAVE | 409 | Leave already exists for this doctor/date |
| DUPLICATE_NAME | 409 | Appointment type name already exists |
| DOUBLE_BOOKING | 400 | Doctor has conflicting appointment |
| BACKDATED_BOOKING | 400 | Cannot book past appointments |
| ALREADY_IN_QUEUE | 400 | Appointment already queued |
| APPOINTMENT_COMPLETED | 400 | Cannot modify completed appointment |
| APPOINTMENT_ALREADY_CANCELLED | 400 | Appointment already cancelled |
| SERVER_ERROR | 500 | Internal server error |

---

## Data Models

### User Model
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string (unique)",
  "passwordHash": "string (bcrypt hashed)",
  "role": "enum(ADMIN, RECEPTIONIST, DOCTOR)",
  "doctorId": "ObjectId (optional, if user is a doctor)",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Patient Model
```json
{
  "_id": "ObjectId",
  "patientName": "string",
  "fatherName": "string",
  "email": "string",
  "phone": "string (10 digits)",
  "address": "string",
  "age": "number",
  "gender": "enum(MALE, FEMALE, OTHER)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Doctor Model
```json
{
  "_id": "ObjectId",
  "name": "string",
  "specialization": "string",
  "defaultSlotDurationMinutes": "number",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Appointment Model
```json
{
  "_id": "ObjectId",
  "patientId": "ObjectId (ref: Patient)",
  "doctorId": "ObjectId (ref: Doctor)",
  "appointmentTypeId": "ObjectId (ref: AppointmentType)",
  "startTime": "Date",
  "endTime": "Date",
  "status": "enum(SCHEDULED, CHECKED_IN, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW)",
  "cancellationReason": "string (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Appointment Type Model
```json
{
  "_id": "ObjectId",
  "name": "string (unique)",
  "isActive": "boolean",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Doctor Schedule Template Model
```json
{
  "_id": "ObjectId",
  "doctorId": "ObjectId (ref: Doctor)",
  "dayOfWeek": "number (0-6, Monday-Sunday)",
  "startTime": "string (HH:mm format)",
  "endTime": "string (HH:mm format)",
  "breakSlots": [
    {
      "start": "string (HH:mm)",
      "end": "string (HH:mm)"
    }
  ],
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Doctor Leave Model
```json
{
  "_id": "ObjectId",
  "doctorId": "ObjectId (ref: Doctor)",
  "date": "string (YYYY-MM-DD format)",
  "reason": "string",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Queue Token Model
```json
{
  "_id": "ObjectId",
  "appointmentId": "ObjectId (ref: Appointment)",
  "patientId": "ObjectId (ref: Patient)",
  "doctorId": "ObjectId (ref: Doctor)",
  "date": "string (YYYY-MM-DD format)",
  "tokenNumber": "number",
  "queuePosition": "number",
  "status": "enum(WAITING, SERVING, DONE, CANCELLED)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Appointment Status History Model
```json
{
  "_id": "ObjectId",
  "appointmentId": "ObjectId (ref: Appointment)",
  "previousStatus": "string",
  "newStatus": "string",
  "changedBy": "ObjectId (ref: User)",
  "reason": "string (optional)",
  "createdAt": "Date"
}
```

### Audit Log Model
```json
{
  "_id": "ObjectId",
  "actorUserId": "ObjectId (ref: User)",
  "actorRole": "string",
  "actionType": "enum(CREATE, READ, UPDATE, DELETE)",
  "entityType": "string (Patient, Appointment, Doctor, etc.)",
  "entityId": "ObjectId",
  "oldValue": "object (optional)",
  "newValue": "object (optional)",
  "timestamp": "Date"
}
```

### Notification Outbox Model
```json
{
  "_id": "ObjectId",
  "notificationType": "enum(APPOINTMENT_CREATED, APPOINTMENT_RESCHEDULED, APPOINTMENT_CANCELLED)",
  "recipientId": "ObjectId (ref: Patient or User)",
  "channel": "enum(EMAIL, SMS)",
  "content": "string",
  "isProcessed": "boolean",
  "processedAt": "Date (optional)",
  "failureReason": "string (optional)",
  "createdAt": "Date"
}
```

---

## Authentication Flow

1. **Login Request**: POST `/api/auth/login` with email and password
2. **Token Generation**: Server generates JWT token valid for 30 days
3. **Token Usage**: Include token in Authorization header: `Bearer <token>`
4. **Token Validation**: Server validates token on each protected endpoint
5. **Token Expiry**: Expired token returns 401 UNAUTHORIZED

---

## Important Notes

### Timezone Handling
- All datetime values in API are in ISO 8601 format with UTC timezone (Z suffix)
- Backend automatically converts to Asia/Kolkata (IST) for database operations and logic
- Frontend should convert to user's local timezone for display

### Unique Constraints
- **Patient**: (patientName, fatherName, phone)
- **User**: email
- **AppointmentType**: name
- **DoctorSchedule**: (doctorId, dayOfWeek)
- **DoctorLeave**: (doctorId, date)

### Pagination
- Default limit: 20 items per page
- Maximum limit: 100 items per page
- Pages are 1-indexed

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <jwt-token>  // For protected endpoints
```

### Validation Rules
- Email: Valid email format (RFC 5322 standard)
- Phone: Exactly 10 digits
- Name fields: Max 100 characters
- Time format: HH:mm (24-hour format)
- Date format: YYYY-MM-DD
- DateTime format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)

---

## Rate Limiting
Currently no rate limiting implemented. Consider adding in production.

## CORS
Configure CORS to allow requests from frontend domain in production.

---

**Document Version**: 1.0  
**Last Updated**: January 20, 2026
