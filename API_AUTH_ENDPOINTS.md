# Authentication API Endpoints

## Overview

Complete API reference for all authentication endpoints including login, logout, password reset, and profile management.

---

## 1. Login User

### POST `/api/auth/login`

Login user dengan email dan password untuk mendapatkan JWT token.

**Request:**
```json
{
  "email": "johndoe@gmail.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "johndoe@gmail.com",
    "name": "John Doe",
    "division": "Engineering",
    "role": "user",
    "profilePicture": "https://example.com/profile.jpg",
    "dateOfJoin": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400`: Email atau password kosong / domain tidak diizinkan
- `401`: Email atau password salah
- `500`: Internal server error

**Notes:**
- Email harus dari domain gmail.com atau yahoo.com
- Token berlaku 7 hari
- Token disimpan di localStorage client-side

---

## 2. Logout User

### POST `/api/auth/logout`

Logout user dan clear token dari cookie.

**Request:**
```json
{}
```

**Response (200 OK):**
```json
{
  "message": "Logout successfully"
}
```

---

## 3. Forgot Password (Request Reset)

### POST `/api/auth/forgot-password`

Kirim link reset password ke email user. Link berlaku 1 jam.

**Request:**
```json
{
  "email": "johndoe@gmail.com"
}
```

**Response (200 OK):**
```json
{
  "message": "Email sent successfully"
}
```

**Email Content:**
```
Subject: Password Reset Request

You are receiving this email because you (or someone else) has requested 
the reset of a password. Please reset your password by clicking the link 
below (Expire in one hour):

http://localhost:8080/new-password/{resetToken}
```

**Error Responses:**
- `400`: Email kosong
- `404`: User tidak ditemukan dengan email tersebut
- `500`: Gagal mengirim email

**Environment Variables Required:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

**Notes:**
- Reset token hanya berlaku 1 jam
- Token di-hash dengan SHA256 sebelum disimpan di database
- Link akan membuka halaman `/new-password/:token` di frontend

---

## 4. Reset Password (Verify Token & Update)

### POST `/api/auth/reset-password`

Reset password dengan token yang diterima dari email. Token di-verify dan password di-update.

**Request:**
```json
{
  "token": "abc123def456xyz789...",
  "newPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
  "message": "Password reset successfully"
}
```

**Error Responses:**
- `400`: Token tidak valid, sudah expired, atau parameter kurang
  ```json
  {
    "message": "Invalid or expired reset token"
  }
  ```
- `500`: Gagal mereset password
  ```json
  {
    "message": "Failed to reset password",
    "error": "error details..."
  }
  ```

**Flow:**
1. User menerima email dengan reset link: `http://localhost:8080/new-password/{token}`
2. Frontend extract token dari URL dan tampilkan form reset password
3. User masukkan password baru dan submit
4. Frontend POST ke endpoint ini dengan token + newPassword
5. Backend hash token dengan SHA256 dan cari user dengan token hash tersebut
6. Backend verify token belum expired (1 jam)
7. Backend hash password baru (pre-hook di User.js handle hashing)
8. Backend clear resetPasswordToken dan resetPasswordExpire
9. Frontend redirect ke login setelah sukses

**Notes:**
- Password hashing dilakukan oleh pre-hook di User.js
- Token di-hash sebelum disimpan (security best practice)
- Reset token di-clear setelah berhasil (token tidak bisa digunakan 2x)

---

## 5. Get Profile

### GET `/api/auth/profile`

Ambil profil user yang sedang login (memerlukan JWT token).

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "message": "Profile retrieved successfully",
  "user": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "johndoe@gmail.com",
    "name": "John Doe",
    "division": "Engineering",
    "role": "user",
    "profilePicture": "https://example.com/profile.jpg",
    "dateOfJoin": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Tidak ada token / user tidak terautentikasi
- `404`: User tidak ditemukan
- `500`: Internal server error

**Notes:**
- Memerlukan JWT token di header Authorization
- Token diperoleh dari login endpoint
- Password tidak di-return (di-exclude dengan `.select('-password')`)

---

## 6. Update Profile

### PUT `/api/auth/profile`

Update profil user yang sedang login. Hanya field profilePicture yang bisa di-update oleh user.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request:**
```json
{
  "profilePicture": "https://example.com/uploads/profile.jpg"
}
```

**Response (200 OK):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "64b25ff43c99d68dca99a3a5",
    "email": "johndoe@gmail.com",
    "name": "John Doe",
    "division": "Engineering",
    "role": "user",
    "profilePicture": "https://example.com/uploads/profile.jpg",
    "dateOfJoin": "2025-01-15T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Tidak ada token / user tidak terautentikasi
- `404`: User tidak ditemukan
- `500`: Internal server error

**Editable Fields:**
- ✅ profilePicture - URL atau base64 encoded image

**Non-Editable Fields (Admin only):**
- ❌ name
- ❌ email
- ❌ division
- ❌ role
- ❌ join_date

**Notes:**
- Hanya profilePicture yang bisa di-update oleh user
- Field lain (name, email, division) hanya bisa diubah oleh admin
- Password tidak bisa diubah melalui endpoint ini (gunakan forgot-password flow)

---

## Password Reset Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User lupa password                                       │
│    Go to: http://localhost:8080/reset-password              │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 2. POST /api/auth/forgot-password                           │
│    {email: "johndoe@gmail.com"}                             │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 3. Backend:                                                 │
│    - Find user                                              │
│    - Generate random token (20 bytes)                       │
│    - Hash token dengan SHA256                               │
│    - Simpan hash + expiry (1 jam) ke DB                     │
│    - Send email dengan reset link                           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 4. Email received                                           │
│    Click link: /new-password/{token}                        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 5. Frontend displays form                                   │
│    - Extract token dari URL                                 │
│    - Show NewPassword component                             │
│    - User enter new password + confirm                      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 6. POST /api/auth/reset-password                            │
│    {token: "...", newPassword: "newpass123"}                │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 7. Backend:                                                 │
│    - Hash token dengan SHA256                               │
│    - Find user dengan token hash                            │
│    - Check token belum expired                              │
│    - Set user.password = newPassword (plain)                │
│    - Save user (pre-hook hash password 1x)                  │
│    - Clear resetPasswordToken & Expire                      │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 8. Frontend:                                                │
│    - Show success message                                   │
│    - Redirect to /login after 3 seconds                     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 9. Login dengan password baru                               │
│    POST /api/auth/login                                     │
│    {email, password: "newpass123"}                          │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ 10. Backend:                                                │
│     - Find user                                             │
│     - Compare password dengan bcrypt                        │
│     - Return token + user profile                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Swagger UI

Akses API documentation di: `http://localhost:5000/api-docs`

---

## Testing

### cURL Examples

**1. Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@gmail.com",
    "password": "password123"
  }'
```

**2. Forgot Password:**
```bash
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "johndoe@gmail.com"
  }'
```

**3. Reset Password:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123def456xyz789...",
    "newPassword": "newPassword123"
  }'
```

**4. Get Profile (with token):**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**5. Update Profile (with token):**
```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "profilePicture": "https://example.com/profile.jpg"
  }'
```

---

## Security Best Practices

✅ **Implemented:**
- JWT tokens dengan 7-hari expiry
- Bcrypt password hashing (salt: 10 rounds)
- Email domain validation (gmail.com, yahoo.com)
- Reset token hashing (SHA256)
- Reset token expiry (1 jam)
- Password tidak di-return di response
- Pre-hook password hashing (hash 1x saat save)

⚠️ **Recommendations:**
- Gunakan HTTPS di production (bukan HTTP)
- Rotate JWT_SECRET regularly
- Implement rate limiting untuk login & forgot-password
- Monitor suspicious login attempts
- Implement email verification untuk new registrations
- Add password strength validation

---

## Last Updated

October 31, 2025

