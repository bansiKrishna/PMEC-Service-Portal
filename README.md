# PMEC College Service Portal

<p align="center">
  <strong>A modern digital platform for streamlined college student services, workflow automation, and certificate management.</strong>
</p>

<p align="center">
  React · TypeScript · Java · Spring Boot · Spring Security · PostgreSQL · shadcn/ui
</p>

---

## 📌 Overview

The **PMEC College Service Portal** is a full-stack web application designed to digitize and streamline essential college administrative services.

The platform provides a centralized environment where students can access college services online, while authorized staff members can review, process, approve, reject, and manage service requests through role-based workflows.

The system is designed around secure authentication, role-based authorization, structured approval workflows, and automated certificate generation.

### Core Objectives

- Digitize student service requests
- Reduce manual paperwork and administrative processing
- Provide role-based access to college services
- Implement secure authentication and authorization
- Track applications throughout their complete lifecycle
- Automate certificate generation
- Provide administrators with centralized system management
- Improve transparency between students and college authorities

---

## ✨ Key Features

### 🔐 Authentication & Security

- College email-based student registration with email OTP verification
- JWT-based authentication
- Spring Security integration
- Role-based authorization
- Protected API endpoints
- Protected frontend routes
- Automatic JWT handling through Axios
- Unauthorized access handling
- Secure password storage using password hashing

### 👨‍🎓 Student Services

Students can:

- Register using their official college email
- Login securely
- Access their personalized dashboard
- Apply for Bonafide Certificates
- View submitted applications
- Track application status
- View approval/rejection information
- View generated certificates
- Download certificates
- Manage their profile

### 🧑‍💼 Staff & Administration

System administrators can:

- Manage staff accounts
- Create authorized staff users
- Manage staff roles
- Enable or disable accounts
- Manage certificate templates
- Upload e-signatures
- Configure certificate generation
- Manage system-level settings
- Configure the Gmail account used for portal email and send a test message

### 🏛️ Role-Based Workflow

The portal supports multiple system roles:

| Role | Responsibility |
|------|----------------|
| **ADMIN** | System and staff management |
| **STUDENT** | Submit and track service applications |
| **DSW** | Review and process student applications |
| **PRINCIPAL** | Final approval and certificate authorization |
| **LIBRARIAN** | Library-related services and future workflows |

---

# 📄 Bonafide Certificate Workflow

The Bonafide Certificate module follows a structured multi-level approval process.

```text
                    STUDENT
                       │
                       ▼
             Submit Application
                       │
                       ▼
                PENDING_DSW
                       │
                 ┌─────┴─────┐
                 │           │
              APPROVE      REJECT
                 │           │
                 ▼           ▼
       PENDING_PRINCIPAL  DSW_REJECTED
                 │
                 ▼
              PRINCIPAL
                 │
          ┌──────┴──────┐
          │             │
       APPROVE        REJECT
          │             │
          ▼             ▼
 PRINCIPAL_APPROVED  PRINCIPAL_REJECTED
          │
          ▼
 Generate Certificate
          │
          ▼
 Certificate Generated
          │
          ▼
 Student Download

---

## Project structure and how the application works

This guide describes the code that is in this repository now. In simple terms, the
project has two applications:

- **`frontend/`** is the website people see and use. It is React and TypeScript.
- **`backend/`** is the Java/Spring Boot server. It checks requests, applies the
  business rules, and reads or writes the database.

The browser does not normally talk to PostgreSQL directly. It sends HTTP requests
to the backend; the backend is responsible for accessing the database and files.

### At a glance

```text
Browser
  └─ frontend/src/pages (screen the user is viewing)
       └─ frontend/src/api (typed request for a backend operation)
            └─ frontend/src/api/axios.ts (server URL, JWT header, error messages)
                 └─ backend controller (HTTP endpoint)
                      └─ backend service (business rules)
                           └─ backend repository (database query)
                                └─ PostgreSQL / local uploaded files
```

The backend sends a response back along the same path. The page then updates what
the user sees.

### Main folders

| Path | What it is for |
| --- | --- |
| `frontend/` | The React website, its npm dependencies, routes, screens, styles, and API clients. |
| `backend/` | The Spring Boot server, business logic, database entities, security, and certificate generation. |
| `frontend/src/pages/` | Full screens, grouped by the user role or purpose. |
| `frontend/src/components/` | Reusable interface pieces used by several screens. |
| `frontend/src/api/` | Frontend functions that call backend endpoints. |
| `frontend/src/routes/` | URL-to-screen mapping and frontend access checks. |
| `frontend/src/store/` | Shared browser state, such as the signed-in user and theme. |
| `frontend/src/types/` | TypeScript shapes for data exchanged with the backend. |
| `backend/src/main/java/com/` | Java code, grouped into authentication, bonafide, user, admin, and support packages. |
| `backend/src/main/resources/` | Backend configuration, certificate template, and database migration scripts. |
| `backend/src/test/` | Backend automated tests. |

### What happens when you use the site

1. `frontend/index.html` contains the page's root element. `frontend/src/main.tsx`
   starts React and loads `App.tsx`.
2. `App.tsx` sets up browser navigation and notifications. `AppRoutes.tsx`
   decides which page belongs to each URL.
3. For signed-in screens, `ProtectedRoute.tsx` checks that a user is logged in,
   and `RoleGuard.tsx` checks that their role is allowed to see that screen.
   These are user-interface checks; backend authorization is also important.
4. A screen calls a function from the matching file in `frontend/src/api/`.
   `axios.ts` adds the API base URL and, when available, the user's JWT token.
5. A Spring controller in `backend/src/main/java/com/` receives that URL and
   delegates the work to a service. DTOs describe and validate request/response
   data; repositories load or save entities in PostgreSQL.
6. The response is returned to the frontend. Shared components, state, and
   notifications help show the result.

### Authentication and access

- Login and registration screens are in `frontend/src/pages/auth/`; their
  requests go through `frontend/src/api/authApi.ts`.
- The backend's `/api/auth` endpoints are in `backend/src/main/java/com/auth/controller/AuthController.java`.
- After login the frontend stores the token and basic user details in browser
  local storage through `frontend/src/store/authStore.ts`.
- `frontend/src/api/axios.ts` attaches the token to API requests. The backend
  `JwtAuthenticationFilter.java` checks it, and `SecurityConfig.java` defines
  which endpoints need authentication and which roles are allowed.
- The roles represented in the project are `ADMIN`, `STUDENT`, `DSW`,
  `PRINCIPAL`, and `LIBRARIAN`.
- OTP send/verify endpoints and OTP-related backend classes exist. The current
  registration screen calls the registration endpoint directly; it does not
  call the OTP endpoints as part of that screen's flow.

### Bonafide application flow

The main service is a bonafide certificate request:

```text
Student creates a request
  → DRAFT
  → student submits it
  → PENDING_DSW
  → DSW approves: PENDING_PRINCIPAL
      or DSW rejects: DSW_REJECTED
  → Principal approves: certificate is generated
      or Principal rejects: PRINCIPAL_REJECTED
  → student can download the PDF
```

The statuses are declared in
`backend/src/main/java/com/bonafide/entity/BonafideStatus.java`. The student,
DSW, and Principal screens are under `frontend/src/pages/student/`,
`frontend/src/pages/dsw/`, and `frontend/src/pages/principal/`. Their API
functions are in `studentApi.ts`, `dswApi.ts`, and `principalApi.ts`.

On approval, the backend uses the certificate template and signature, fills in
application and student details, renders a PDF, and stores the generated file.
The relevant code is under `backend/src/main/java/com/bonafide/service/`,
`serviceImpl/`, and `file/`. The active default HTML template is
`backend/src/main/resources/bonafide-template.html`; uploaded files are stored
under the backend's local `uploads/` directories.

## File-by-file guide

### Repository root

| File/folder | Purpose |
| --- | --- |
| `.gitattributes` | Git settings for consistent handling of text files. |
| `.gitignore` | Tells Git which generated, local, or temporary files not to track. |
| `README.md` | This project overview and code-navigation guide. |
| `package-lock.json` | npm lockfile at the repository root. The frontend's actual npm manifest is `frontend/package.json`. |
| `frontend/` | Frontend application (details below). |
| `backend/` | Backend application (details below). |

### Frontend files

#### Frontend setup and configuration

| File/folder | Purpose |
| --- | --- |
| `frontend/package.json` | Frontend dependencies and commands: `dev`, `build`, `lint`, and `preview`. |
| `frontend/package-lock.json` | Exact npm dependency tree used by `npm ci`. |
| `frontend/index.html` | HTML shell loaded by Vite; includes the `root` element where React starts. |
| `frontend/vite.config.ts` | Vite development/build setup, React and Tailwind plugins, and the `@` alias for `src/`. |
| `frontend/eslint.config.js` | ESLint rules for JavaScript, TypeScript, and React hooks. |
| `frontend/tsconfig.json` | Shared TypeScript project configuration. |
| `frontend/tsconfig.app.json` | TypeScript settings for the browser application under `src/`. |
| `frontend/tsconfig.node.json` | TypeScript settings for Node-side configuration such as `vite.config.ts`. |
| `frontend/.gitignore` | Frontend-specific generated files and local files ignored by Git. |
| `frontend/README.md` | Vite starter-template notes; it is not the main PMEC project guide. |
| `frontend/public/favicon.svg` | Browser tab/site icon served as a static file. |
| `frontend/public/icons.svg` | Static SVG icon resource. |
| `frontend/src/assets/react.svg`, `vite.svg` | Starter-template artwork; these are not the main application features. |

#### Frontend startup, styles, and reusable components

| File/folder | Purpose |
| --- | --- |
| `frontend/src/main.tsx` | Browser entry point: creates the React root and loads global CSS and `App`. |
| `frontend/src/App.tsx` | Sets up the router, notification toaster, and route tree. |
| `frontend/src/index.css` | Global styles and Tailwind CSS entry point. |
| `frontend/src/App.css` | Additional app stylesheet; check whether it is imported before relying on it. |
| `frontend/src/components/common/ApprovalTimeline.tsx` | Reusable display of approval/history steps. |
| `frontend/src/components/common/EmptyState.tsx` | Reusable view for a screen with no records to show. |
| `frontend/src/components/common/ErrorState.tsx` | Reusable error display. |
| `frontend/src/components/common/FileUpload.tsx` | Reusable file selection/upload interface. |
| `frontend/src/components/common/LoadingState.tsx` | Reusable loading display. |
| `frontend/src/components/common/StatusBadge.tsx` | Reusable application-status label. |
| `frontend/src/components/layout/Header.tsx` | Shared top bar for dashboard pages. |
| `frontend/src/components/layout/PMECLogo.tsx` | Shared PMEC logo/branding component. |
| `frontend/src/components/layout/ProfileMenu.tsx` | User profile/account menu in the shared layout. |
| `frontend/src/components/layout/Sidebar.tsx` | Role-aware dashboard navigation. |
| `frontend/src/components/layout/ThemeToggle.tsx` | Control for choosing the display theme. |
| `frontend/src/components/ui/` | Small reusable UI building blocks: `alert-dialog.tsx` (confirmation dialog), `alert.tsx` (message panel), `avatar.tsx` (user image/initials), `badge.tsx` (label), `button.tsx` (button), `card.tsx` (content card), `dialog.tsx` (modal), `dropdown-menu.tsx` (menu), `input.tsx` (text input), `label.tsx` (form label), `select.tsx` (selection control), `separator.tsx` (divider), `skeleton.tsx` (loading placeholder), `table.tsx` (table elements), `tabs.tsx` (tab controls), and `textarea.tsx` (multi-line input), `tooltip.tsx` (hint popup). |
| `frontend/src/lib/utils.ts` | Shared UI/class-name utility functions. |
| `frontend/src/layouts/AuthLayout.tsx` | Shared visual frame around login and registration screens. |
| `frontend/src/layouts/DashboardLayout.tsx` | Shared signed-in frame containing the header, sidebar, and active page. |

#### Frontend state, routing, API, and data types

| File/folder | Purpose |
| --- | --- |
| `frontend/src/routes/AppRoutes.tsx` | Declares application URLs, pages, role checks, and the default redirect. |
| `frontend/src/routes/ProtectedRoute.tsx` | Redirects signed-out users away from protected screens. |
| `frontend/src/routes/RoleGuard.tsx` | Allows only the listed role(s) to render a page. |
| `frontend/src/hooks/useAuth.ts` | Convenient access to the logged-in user, role, and auth actions. |
| `frontend/src/store/authStore.ts` | Shared login state and local-storage persistence for user/token. |
| `frontend/src/hooks/useTheme.ts` | Connects React components to the theme store. |
| `frontend/src/store/themeStore.ts` | Saves the selected theme and applies its CSS class. |
| `frontend/src/api/axios.ts` | Shared HTTP client: base URL, auth header, and common error handling. |
| `frontend/src/api/authApi.ts` | Login, registration, password, and current-user API calls. |
| `frontend/src/api/adminApi.ts` | Staff-account management calls for administrators. |
| `frontend/src/api/certificateApi.ts` | Certificate template and signature calls. |
| `frontend/src/api/studentApi.ts` | Student bonafide application, status, and PDF calls. |
| `frontend/src/api/dswApi.ts` | DSW review and decision calls. |
| `frontend/src/api/principalApi.ts` | Principal review and decision calls. |
| `frontend/src/api/librarianApi.ts` | API boundary reserved for librarian functionality. |
| `frontend/src/api/API_MAP.md` | Human-readable endpoint reference; if anything disagrees, compare with the current frontend API call and Java controller. |
| `frontend/src/types/auth.ts` | TypeScript shapes for login, registration, password, and auth state. |
| `frontend/src/types/admin.ts` | TypeScript shapes for staff administration. |
| `frontend/src/types/bonafide.ts` | Application request/response, status, rejection, and approval-history shapes. |
| `frontend/src/types/certificate.ts` | Certificate template and generated-certificate shapes. |
| `frontend/src/types/common.ts` | Shared types such as themes and API error data. |
| `frontend/src/types/user.ts` | User and role types shared by screens and auth state. |

#### Frontend screens

The page folders align with the roles allowed to use those pages. The route
definitions in `frontend/src/routes/AppRoutes.tsx` connect each URL to these
components.

| File/folder | Purpose |
| --- | --- |
| `frontend/src/pages/auth/LoginPage.tsx` | Sign-in form. |
| `frontend/src/pages/auth/RegisterPage.tsx` | Student registration form. |
| `frontend/src/pages/auth/UnauthorizedPage.tsx` | Message shown when the signed-in role cannot access a page. |
| `frontend/src/pages/admin/AdminDashboard.tsx` | Admin landing/dashboard screen. |
| `frontend/src/pages/admin/StaffManagementPage.tsx` | Create, list, and manage staff accounts. |
| `frontend/src/pages/admin/CertificateTemplatesPage.tsx` | Manage certificate templates/signature assets. |
| `frontend/src/pages/admin/AdminSettingsPage.tsx` | Admin settings screen. |
| `frontend/src/pages/student/StudentDashboard.tsx` | Student landing screen and service summary. |
| `frontend/src/pages/student/ApplyBonafidePage.tsx` | Create a bonafide application. |
| `frontend/src/pages/student/StudentApplicationsPage.tsx` | List the student's applications. |
| `frontend/src/pages/student/ApplicationDetailsPage.tsx` | Show one application and its status/history. |
| `frontend/src/pages/student/StudentCertificatesPage.tsx` | View/download available certificates. |
| `frontend/src/pages/student/StudentProfilePage.tsx` | Student profile screen. |
| `frontend/src/pages/dsw/DswDashboard.tsx` | DSW landing/review summary. |
| `frontend/src/pages/dsw/DswApplicationsPage.tsx` | List applications awaiting DSW review. |
| `frontend/src/pages/dsw/DswApplicationDetailsPage.tsx` | Inspect and decide one DSW application. |
| `frontend/src/pages/principal/PrincipalDashboard.tsx` | Principal landing/review summary. |
| `frontend/src/pages/principal/PrincipalApplicationsPage.tsx` | List applications awaiting Principal review. |
| `frontend/src/pages/principal/PrincipalApplicationDetailsPage.tsx` | Inspect and decide one Principal application. |
| `frontend/src/pages/librarian/LibrarianDashboard.tsx` | Librarian landing screen; the librarian service area is comparatively small and can be extended. |

### Backend files

#### Backend setup and documentation

| File/folder | Purpose |
| --- | --- |
| `backend/pom.xml` | Maven project definition, Java version, Spring dependencies, and build plugins. |
| `backend/mvnw`, `backend/mvnw.cmd` | Unix and Windows Maven Wrapper launch scripts. |
| `backend/.mvn/wrapper/maven-wrapper.properties` | Maven Wrapper distribution configuration. |
| `backend/.gitignore` | Backend-specific generated/local files ignored by Git. |
| `backend/flow.md` | Older prose notes about the authentication flow; check against current code before treating as current behavior. |
| `backend/Project_folder_struct.md` | Earlier folder-structure notes; the actual source layout is the `src/main/java/com/` tree listed below. |
| `backend/bonafide-template.html` | Template copy at the backend project root; the runtime default template is the one under `src/main/resources/`. |
| `backend/studentsDetails.md` | Local notes file that may contain personal or credential-like data. Do not publish its contents; remove real secrets/credentials from source control and rotate them if exposed. |

#### Backend source code (`backend/src/main/java/com/`)

| Package/file | Purpose |
| --- | --- |
| `CollegeServicePortalApplication.java` | Spring Boot application entry point; starts the backend server. |
| `admin/controller/AdminStaffController.java` | Admin-only HTTP endpoints for managing staff users. |
| `admin/dto/CreateStaffRequest.java` | Input data needed to create a staff account. |
| `admin/dto/SetStaffPasswordRequest.java` | Input data for changing a staff password. |
| `admin/dto/SetStaffRoleRequest.java` | Input data for changing a staff role. |
| `admin/dto/StaffResponse.java` | Staff data returned by admin endpoints. |
| `admin/service/StaffManagementService.java` | Contract for staff-management business operations. |
| `admin/service/StaffManagementServiceImpl.java` | Implementation of staff-management operations. |
| `auth/controller/AuthController.java` | Registration, login, password change, and current-user HTTP endpoints. |
| `auth/controller/OtpController.java` | Endpoints to send and verify an email OTP. |
| `auth/dto/ChangePasswordRequest.java` | Password-change request shape. |
| `auth/dto/LoginRequest.java`, `LoginResponse.java` | Login input and successful-login response. |
| `auth/dto/RegisterRequest.java`, `RegisterResponse.java` | Registration input and response. |
| `auth/entity/OtpVerification.java` | Database entity holding OTP verification data. |
| `auth/repository/OtpVerificationRepository.java` | Database queries for OTP records. |
| `auth/service/AuthService.java`, `AuthServiceImpl.java` | Authentication business-operation contract and implementation. |
| `auth/service/EmailService.java`, `EmailValidationService.java`, `OtpService.java` | Contracts for sending email, checking college email, and handling OTPs. |
| `auth/serviceImpl/EmailServiceImpl.java` | Email-sending implementation. |
| `auth/serviceImpl/EmailValidationServiceImpl.java` | College email validation implementation. |
| `auth/serviceImpl/OtpServiceImpl.java` | OTP generation, delivery, expiry, and verification logic. |
| `bonafide/controller/BonafideController.java` | Student application/status/PDF endpoints and DSW/Principal workflow endpoints. |
| `bonafide/controller/DswBonafideController.java` | DSW-specific application review endpoints. |
| `bonafide/controller/PrincipalBonafideController.java` | Principal-specific application review endpoints. |
| `bonafide/controller/CertificateTemplateController.java` | Admin endpoints for certificate templates and signature uploads. |
| `bonafide/dto/BonafideApplicationRequestDto.java` | Input fields for a new bonafide application. |
| `bonafide/dto/BonafideApplicationResponseDto.java` | Application details returned to the frontend. |
| `bonafide/dto/BonafideStatusResponseDto.java` | Smaller response for checking application status. |
| `bonafide/dto/RejectBonafideRequestDto.java` | Rejection reason supplied by a reviewer. |
| `bonafide/dto/CertificateResponseDto.java` | Certificate information returned by certificate endpoints. |
| `bonafide/dto/CertificateTemplateResponseDto.java` | Template metadata returned to the admin UI. |
| `bonafide/entity/BonafideApplication.java` | Database record for a student's application. |
| `bonafide/entity/BonafideApprovalHistory.java` | Database record of approval/rejection actions. |
| `bonafide/entity/BonafideStatus.java` | The workflow status values. |
| `bonafide/entity/CertificateSignature.java` | Database metadata for a stored certificate signature. |
| `bonafide/entity/CertificateTemplate.java` | Database metadata for a stored HTML template/version. |
| `bonafide/entity/GeneratedCertificate.java` | Database metadata for a generated certificate. |
| `bonafide/repository/BonafideApplicationRepository.java` | Database queries for applications. |
| `bonafide/repository/BonafideApprovalHistoryRepository.java` | Database queries for approval history. |
| `bonafide/repository/CertificateSignatureRepository.java` | Database queries for signature metadata. |
| `bonafide/repository/CertificateTemplateRepository.java` | Database queries for template metadata and active versions. |
| `bonafide/repository/GeneratedCertificateRepository.java` | Database queries for generated certificate metadata. |
| `bonafide/service/BonafideService.java`, `CertificateGenerationService.java`, `CertificateTemplateService.java` | Contracts for application workflow, PDF generation, and template management. |
| `bonafide/serviceImpl/BonafideServiceImpl.java` | Application ownership, status transitions, reviewer decisions, and certificate trigger. |
| `bonafide/serviceImpl/CertificateGenerationServiceImpl.java` | Fills an HTML template with application data and renders/stores the PDF. |
| `bonafide/serviceImpl/CertificateTemplateServiceImpl.java` | Validates, stores, activates, and lists templates/signatures. |
| `config/DataInitializer.java` | Seeds initial application data, including an initial admin and default certificate template. Review its initialization policy before deploying to a real environment. |
| `config/JwtAuthenticationFilter.java` | Reads a bearer token and establishes the authenticated request context. |
| `config/SecurityConfig.java` | Configures password encoding, CORS, stateless sessions, and endpoint/role permissions. |
| `config/ThymeleafConfig.java` | Configures Thymeleaf, used to render certificate HTML. |
| `config/UserDetailsServiceImpl.java` | Loads a user and authorities for Spring Security. |
| `exception/BadRequestException.java`, `ResourceNotFoundException.java`, `UnauthorizedException.java` | Application-specific error types. |
| `exception/GlobalExceptionHandler.java` | Converts backend exceptions into HTTP error responses. |
| `file/FileStorageService.java` | Contract for saving/reading uploaded templates, signatures, and PDFs. |
| `file/LocalFileStorageService.java` | Local-disk implementation of file storage. |
| `security/JwtService.java` | Creates and verifies JWTs. |
| `user/entity/Role.java`, `User.java` | User role values and the user database entity. |
| `user/repository/UserRepository.java` | Database queries for user accounts. |
| `user/service/CurrentUserService.java` | Finds the account belonging to the currently authenticated request. |

#### Backend resources and tests

| File/folder | Purpose |
| --- | --- |
| `backend/src/main/resources/application.yaml` | Server, PostgreSQL, JWT, and college-email configuration. Values such as `SUPABASE_DB_PASSWORD` and `JWT_SECRET` are read from environment variables. |
| `backend/src/main/resources/bonafide-template.html` | Default HTML certificate template copied into local storage at startup if none is active. |
| `backend/src/main/resources/db/migration/V1__add_email_verification.sql` | Flyway database migration adding email-verification-related schema. |
| `backend/src/main/resources/db/migration/V2__remove_email_otp_columns.sql` | Flyway migration removing older OTP-related user columns. |
| `backend/src/main/resources/db/migration/V4__add_dynamic_email_service_settings.sql` | Adds encrypted admin-managed Gmail settings and the OTP resend timestamp. |
| `backend/src/test/java/com/collegeServicePortal/College/Service/Portal/CollegeServicePortalApplicationTests.java` | Backend application test; more focused workflow/service tests can be added alongside it. |

## Run it locally

You need Node.js/npm, Java 21, and a PostgreSQL database. Configure the backend
connection values in `backend/.env`, which is excluded by `.gitignore`. Spring
Boot imports this properties-format file when the backend starts from its
directory; a plain `.env` file is not loaded automatically by Spring Boot.

Set these variables in `backend/.env` using values from your Supabase project:

- `SUPABASE_DB_URL` — full JDBC URL in the form
  `jdbc:postgresql://HOST:PORT/DATABASE`, including Supabase's required SSL
  options from the selected connection method.
- `SUPABASE_DB_USERNAME`
- `SUPABASE_DB_PASSWORD`
- `JWT_SECRET` — Base64-encoded signing key.
- `EMAIL_SETTINGS_ENCRYPTION_KEY` — Base64-encoded random 32-byte key. Keep it
  outside the database and do not change it after email settings have been saved.

Generate the email encryption key in PowerShell without printing or storing any
other credentials:

```powershell
$keyBytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($keyBytes)
[Convert]::ToBase64String($keyBytes)
```

Alternatively, set or override these values as environment variables in the
PowerShell session used to run the backend. Environment variables take
precedence over values imported from `backend/.env`.

1. In PowerShell, start the backend from the backend directory:

   ```powershell
   Set-Location "E:\PMEC service Portal\backend"
   .\mvnw.cmd spring-boot:run
   ```

2. In another terminal, start the frontend:

   ```powershell
   cd frontend
   npm ci
   npm run dev
   ```

After signing in as an administrator, open **Email Service Settings** and enter
a Gmail address and its Google App Password. Gmail SMTP uses `smtp.gmail.com`,
port `587`, authentication, and STARTTLS. The email App Password is encrypted
with `EMAIL_SETTINGS_ENCRYPTION_KEY` in the database and is never returned by
the API. The Flyway migration creates the settings table automatically.

The frontend defaults to the backend at `http://localhost:8080`. To use another
backend URL, set `VITE_API_BASE_URL` for the Vite frontend environment. Useful
frontend checks are `npm run build` and `npm run lint`; the backend tests can be
run with `.\mvnw.cmd test` from `backend/`.

## How to add a feature later

For a typical new service feature, work through the layers instead of putting all
the code in one page:

1. **Decide who uses it** and what the user should be able to do.
2. **Backend data:** if it needs saved data, add/update an entity and repository
   under the relevant backend package. Add a Flyway migration under
   `backend/src/main/resources/db/migration/` when the database schema changes.
3. **Backend behavior:** define request/response DTOs, implement the business
   rules in a service, and expose them through a controller endpoint. Add
   authentication and role checks on the backend as well as the frontend.
4. **Frontend contract:** add matching TypeScript types in `frontend/src/types/`
   and a request function in the appropriate `frontend/src/api/` file. Use the
   shared `apiClient` rather than creating a one-off HTTP client.
5. **Frontend screen:** add a page under `frontend/src/pages/<role>/`, reuse
   components/layouts where appropriate, and connect the URL in
   `frontend/src/routes/AppRoutes.tsx` with its role guard.
6. **Verify:** test the backend behavior and role restrictions, then run the
   frontend build/linter and backend tests. Update the API map/docs if endpoints
   or workflow behavior changed.

Before changing a status, API path, or request/response field, check both sides:
the Java controller/service and the matching TypeScript API/types/page. The
frontend and backend are separate applications, so a change in only one side can
leave them speaking different contracts.

### A few current implementation notes

- `backend/src/main/java/com/config/DataInitializer.java` provisions an initial
  admin account and default certificate template. Do not deploy with development
  credentials; use a safe provisioning process and rotate any exposed secrets.
- `backend/flow.md` and `backend/Project_folder_struct.md` are notes, not the
  runtime source of truth. In particular, the registration screen currently
  does not call the OTP endpoints.
- Some roles/screens (especially librarian) are smaller extension points; the
  presence of a route or API file does not necessarily mean the whole service
  workflow is implemented.
- Uploaded templates, signatures, and PDFs use local disk storage in the
  current implementation. A multi-server/cloud deployment would need shared or
  object storage and corresponding configuration changes.
