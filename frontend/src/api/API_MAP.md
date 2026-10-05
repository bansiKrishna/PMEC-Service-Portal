# PMEC College Service Portal - API Map

This document maps all REST endpoints exposed by the Java Spring Boot backend (`http://localhost:8080`).

---

## 1. Authentication & User Profile (`/api/auth`)

### Register Student
- **Method**: `POST`
- **Endpoint**: `/api/auth/register`
- **Access**: `PUBLIC`
- **Request Body**:
  ```json
  {
    "fullName": "Student Name",
    "email": "student@pmec.ac.in",
    "password": "Password123",
    "rollNumber": "2101105001",
    "department": "Computer Science & Engineering",
    "semester": 6
  }
  ```
  *(Note: email must end with `@pmec.ac.in`)*
- **Response**: `RegisterResponse` (`id`, `fullName`, `email`, `rollNumber`, `role`, `message`)
- **Purpose**: Allows new students to self-register.

### Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Access**: `PUBLIC`
- **Request Body**:
  ```json
  {
    "email": "admin@pmec.ac.in",
    "password": "Admin@123"
  }
  ```
- **Response**: `LoginResponse` (`token`, `userId`, `name`, `email`, `role`)
- **Purpose**: Authenticates any user role (ADMIN, STUDENT, DSW, PRINCIPAL, LIBRARIAN) and returns JWT token.

### Change Password
- **Method**: `POST`
- **Endpoint**: `/api/auth/change-password`
- **Access**: `AUTHENTICATED` (Any logged-in user)
- **Request Body**:
  ```json
  {
    "oldPassword": "...",
    "newPassword": "..."
  }
  ```
- **Response**: `{ "message": "Password changed successfully" }`
- **Purpose**: Allows current authenticated user to change password.

### Current User Details
- **Method**: `GET`
- **Endpoint**: `/api/auth/me`
- **Access**: `AUTHENTICATED`
- **Response**: `{ "email": "...", "authorities": [...] }`
- **Purpose**: Fetch details for current authenticated session.

---

## 2. System Administrator Management (`/api/admin/users`)

### Create Staff Account
- **Method**: `POST`
- **Endpoint**: `/api/admin/users/staff`
- **Access**: `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "fullName": "Dr. DSW Name",
    "email": "dsw@pmec.ac.in",
    "role": "DSW",
    "password": "TemporaryPassword123"
  }
  ```
  *(Role options: `DSW`, `PRINCIPAL`, `LIBRARIAN`)*
- **Response**: `StaffResponse` (`id`, `fullName`, `email`, `role`, `enabled`, `emailVerified`)
- **Purpose**: Administrator provisions staff members.

### Get All Staff
- **Method**: `GET`
- **Endpoint**: `/api/admin/users/staff`
- **Access**: `ROLE_ADMIN`
- **Response**: `List<StaffResponse>`
- **Purpose**: Retrieves all staff accounts.

### Get Staff by ID
- **Method**: `GET`
- **Endpoint**: `/api/admin/users/staff/{id}`
- **Access**: `ROLE_ADMIN`
- **Response**: `StaffResponse`
- **Purpose**: Retrieves single staff profile.

### Disable Staff Account
- **Method**: `PATCH`
- **Endpoint**: `/api/admin/users/staff/{id}/disable`
- **Access**: `ROLE_ADMIN`
- **Response**: `204 No Content`
- **Purpose**: Disables a staff member's access.

### Enable Staff Account
- **Method**: `PATCH`
- **Endpoint**: `/api/admin/users/staff/{id}/enable`
- **Access**: `ROLE_ADMIN`
- **Response**: `204 No Content`
- **Purpose**: Enables a staff member's access.

### Change Staff Password
- **Method**: `PUT`
- **Endpoint**: `/api/admin/users/staff/{id}/password`
- **Access**: `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "password": "NewPassword123"
  }
  ```
- **Response**: `204 No Content`
- **Purpose**: Reset staff member password.

### Change Staff Role
- **Method**: `PUT`
- **Endpoint**: `/api/admin/users/staff/{id}/role`
- **Access**: `ROLE_ADMIN`
- **Request Body**:
  ```json
  {
    "role": "PRINCIPAL"
  }
  ```
- **Response**: `StaffResponse`
- **Purpose**: Change staff member's assigned role.

---

## 3. Certificate Templates Management (`/api/admin/certificate-templates`)

### Upload Template
- **Method**: `POST` (multipart/form-data)
- **Endpoint**: `/api/admin/certificate-templates/upload`
- **Access**: `ROLE_ADMIN`
- **Form Data**:
  - `file`: Multipart HTML template file
  - `templateName`: string
- **Response**: `CertificateTemplateResponseDto` (`id`, `templateName`, `fileName`, `version`, `active`, `uploadedAt`)
- **Purpose**: Upload a new HTML template for Bonafide certificates.

### Get All Templates
- **Method**: `GET`
- **Endpoint**: `/api/admin/certificate-templates`
- **Access**: `ROLE_ADMIN`
- **Response**: `List<CertificateTemplateResponseDto>`
- **Purpose**: List all uploaded certificate templates.

### Activate Template
- **Method**: `PUT`
- **Endpoint**: `/api/admin/certificate-templates/{id}/activate`
- **Access**: `ROLE_ADMIN`
- **Response**: `CertificateTemplateResponseDto`
- **Purpose**: Set a specific template as active.

### Delete Template
- **Method**: `DELETE`
- **Endpoint**: `/api/admin/certificate-templates/{id}`
- **Access**: `ROLE_ADMIN`
- **Response**: `204 No Content`
- **Purpose**: Remove a certificate template.

### Upload E-Signature
- **Method**: `POST` (multipart/form-data)
- **Endpoint**: `/api/admin/certificate-templates/signature`
- **Access**: `ROLE_ADMIN`
- **Form Data**:
  - `file`: Multipart image file (PNG/JPG signature)
- **Response**: `CertificateTemplateResponseDto`
- **Purpose**: Upload e-signature image used in certificate generation.

---

## 4. Student Bonafide Certificate Endpoints (`/api/bonafide`)

### Apply for Bonafide
- **Method**: `POST`
- **Endpoint**: `/api/bonafide`
- **Access**: `ROLE_STUDENT`
- **Request Body**:
  ```json
  {
    "phoneNumber": "9876543210",
    "hostelName": "APJ Abdul Kalam Hostel",
    "roomNumber": "302",
    "reason": "Scholarship Application",
    "parentName": "Father Name",
    "hostelAdmissionDate": "2023-08-01",
    "collegeAdmissionDate": "2022-07-15",
    "academicYear": "2024-2025"
  }
  ```
- **Response**: `BonafideApplicationResponseDto`
- **Purpose**: Student submits a new Bonafide certificate application.

### Get My Applications
- **Method**: `GET`
- **Endpoint**: `/api/bonafide/my`
- **Access**: `ROLE_STUDENT`
- **Response**: `List<BonafideApplicationResponseDto>`
- **Purpose**: Student retrieves list of their submitted applications.

### Get Application Details by ID
- **Method**: `GET`
- **Endpoint**: `/api/bonafide/{id}`
- **Access**: `ROLE_STUDENT`
- **Response**: `BonafideApplicationResponseDto`
- **Purpose**: Get details of specific application.

### Get Application Status
- **Method**: `GET`
- **Endpoint**: `/api/bonafide/{id}/status`
- **Access**: `ROLE_STUDENT`
- **Response**: `BonafideStatusResponseDto` (`applicationId`, `status`, `rejectionReason`, `createdAt`, `updatedAt`)
- **Purpose**: Quick check for application status.

### Submit Application Draft
- **Method**: `POST`
- **Endpoint**: `/api/bonafide/{id}/submit`
- **Access**: `ROLE_STUDENT`
- **Response**: `200 OK`
- **Purpose**: Explicitly mark application as submitted.

### Download / View Certificate PDF
- **Method**: `GET`
- **Endpoint**: `/api/bonafide/{id}/certificate`
- **Access**: `ROLE_STUDENT`
- **Response**: `byte[]` (`application/pdf`)
- **Purpose**: Downloads generated PDF bonafide certificate once approved.

---

## 5. DSW Endpoints (`/api/dsw/bonafide`)

### Get DSW Applications List
- **Method**: `GET`
- **Endpoint**: `/api/dsw/bonafide/applications` (or `/api/bonafide/dsw/pending`)
- **Access**: `ROLE_DSW`
- **Response**: `List<BonafideApplicationResponseDto>`
- **Purpose**: DSW views pending applications requiring review.

### DSW Approve Application
- **Method**: `POST`
- **Endpoint**: `/api/dsw/bonafide/applications/{id}/approve` (with optional `remarks` param)
- **Access**: `ROLE_DSW`
- **Response**: `BonafideApplicationResponseDto`
- **Purpose**: DSW approves application and forwards to Principal (`DSW_APPROVED` / `PENDING_PRINCIPAL`).

### DSW Reject Application
- **Method**: `POST`
- **Endpoint**: `/api/dsw/bonafide/applications/{id}/reject`
- **Access**: `ROLE_DSW`
- **Request Body**:
  ```json
  {
    "reason": "Incomplete hostel information"
  }
  ```
- **Response**: `200 OK`
- **Purpose**: DSW rejects application (`DSW_REJECTED`).

---

## 6. Principal Endpoints (`/api/principal/bonafide`)

### Get Principal Forwarded Applications
- **Method**: `GET`
- **Endpoint**: `/api/principal/bonafide/applications` (or `/api/bonafide/principal/pending`)
- **Access**: `ROLE_PRINCIPAL`
- **Response**: `List<BonafideApplicationResponseDto>`
- **Purpose**: Principal views applications approved by DSW.

### Principal Approve Application
- **Method**: `POST`
- **Endpoint**: `/api/principal/bonafide/applications/{id}/approve`
- **Access**: `ROLE_PRINCIPAL`
- **Response**: `200 OK`
- **Purpose**: Principal approves application (`PRINCIPAL_APPROVED`), triggering backend certificate generation (`CERTIFICATE_GENERATED`).

### Principal Reject Application
- **Method**: `POST`
- **Endpoint**: `/api/principal/bonafide/applications/{id}/reject`
- **Access**: `ROLE_PRINCIPAL`
- **Request Body**:
  ```json
  {
    "reason": "Academic criteria not met"
  }
  ```
- **Response**: `200 OK`
- **Purpose**: Principal rejects application (`PRINCIPAL_REJECTED`).

---

## 7. Librarian Endpoints (`/api/library/...`)

- Reserved for future Library module extensions. Protected for `ROLE_LIBRARIAN`.
