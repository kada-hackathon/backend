# NEBWORK Backend Development Guide

## Project Overview
NEBWORK is a work logging and collaboration platform with integrated chatbot capabilities. The backend is structured to handle employee management, authentication, work logs, and AI-powered chat interactions.

## Core Architecture

### Directory Structure
```
backend-nebwork/
└── src/
    ├── config/        # Environment and configuration settings
    ├── controllers/   # Request handlers and business logic
    ├── models/        # Database models and schemas
    ├── routes/        # API route definitions
    ├── middlewares/   # Auth and request processing middleware
    ├── services/      # Business logic and external service integration
    └── utils/         # Helper functions and utilities
```

## Key Components

### Authentication & Authorization
- JWT-based authentication system
- Role-based access control (Admin, Head, Employee)
- Password reset flow with email verification

### Data Models
- User/Employee: email, name, division, role, join_date, profile_photo
- WorkLog: title, content, tags, media_attachments, collaborators, edit_permissions
- VersionHistory: references parent work log, tracks content changes
- ChatSession: manages AI interactions and conversation context

### API Patterns
- RESTful endpoints follow `/api/v1/[resource]` structure
- POST requests require authentication token in Authorization header
- File uploads use multipart/form-data content type
- Pagination parameters: `page` and `limit`

### Common Workflows
1. Employee Management (Admin)
   - CRUD operations for employee data
   - Bulk employee operations supported

2. Work Log Creation
   - Media upload to cloud storage
   - Collaborator invitation system
   - Version history tracking

3. Dashboard Filtering
   - Date range filtering
   - Multi-tag support
   - Multiple employee selection

4. Chatbot Integration
   - Async message processing
   - Context preservation
   - Error handling for AI service outages

## Development Guidelines

### Error Handling
- Use standard error response format:
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "User-friendly message",
  "details": {} // Optional debug info
}
```

### Authentication
- All routes except /auth/login and /auth/forgot-password require JWT
- Token format: Bearer [JWT]
- Roles: ADMIN, HEAD, EMPLOYEE

### File Upload
- Supported formats: images/*, .pdf, .doc, .docx
- Max file size: 10MB
- Store file metadata in database, actual files in cloud storage

### Search Implementation
- Full-text search on work log title and content
- Tag-based filtering
- Date range queries use ISO 8601 format