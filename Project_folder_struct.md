src/main/java/com/pmec/studentportal/

├── StudentPortalApplication.java
│
├── config/
│   ├── SecurityConfig.java
│   └── CorsConfig.java
│
├── security/
│   ├── JwtService.java
│   ├── JwtAuthenticationFilter.java
│   └── CustomUserDetailsService.java
│
├── auth/
│   ├── controller/
│   │   └── AuthController.java
│   │
│   ├── dto/
│   │   ├── LoginRequest.java
│   │   ├── LoginResponse.java
│   │   └── RegisterRequest.java
│   │
│   └── service/
│       ├── AuthService.java
│       └── AuthServiceImpl.java
│
├── user/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── semester/
│   ├── controller/
│   ├── dto/
│   │   ├── SemesterRegistrationRequest.java
│   │   └── SemesterRegistrationResponse.java
│   ├── entity/
│   │   └── SemesterRegistration.java
│   ├── repository/
│   │   └── SemesterRegistrationRepository.java
│   └── service/
│       ├── SemesterRegistrationService.java
│       └── SemesterRegistrationServiceImpl.java
│
├── bonafide/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   ├── service/
│   └── pdf/
│
├── service_request/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── document/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── approval/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── repository/
│   └── service/
│
├── admin/
│   ├── controller/
│   ├── dto/
│   ├── service/
│   └── service/
│
└── exception/
├── GlobalExceptionHandler.java
├── ResourceNotFoundException.java
└── BadRequestException.java



Request
↓
Controller
↓
Request DTO
↓
Service
↓
ServiceImpl
↓
Repository
↓
Entity
↓
PostgreSQL


