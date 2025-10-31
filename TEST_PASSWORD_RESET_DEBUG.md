# Password Reset Debug Guide

## Step 1: Test forgotPassword endpoint

```bash
# Send reset email
curl -X POST http://localhost:5000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"sayou13@gmail.com"}'

# Expected Response:
# {"message": "Email sent successfully"}

# Save the token from the email you receive (in the reset link)
# Example link: http://localhost:8080/new-password/abc123xyz...
# Token = abc123xyz...
```

## Step 2: Test resetPassword endpoint

```bash
# Replace TOKEN_FROM_EMAIL with actual token from email
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_EMAIL","newPassword":"newpassword123"}'

# Expected Response:
# {"message": "Password reset successfully"}
```

## Step 3: Test login with new password

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sayou13@gmail.com","password":"newpassword123"}'

# Expected Response:
# {
#   "message": "Login successful",
#   "token": "eyJhbGc...",
#   "user": {
#     "id": "...",
#     "email": "sayou13@gmail.com",
#     "name": "...",
#     ...
#   }
# }
```

## Common Issues:

### Issue 1: "Invalid or expired reset token"
- **Cause**: Token already used or expired (1 hour limit)
- **Solution**: Request new reset email

### Issue 2: Login still fails after password reset
- **Cause**: Password not properly hashed
- **Solution**: Check backend logs and verify password reset returned "Password reset successfully"

### Issue 3: Email not received
- **Cause**: DISABLE_EMAIL=true or EMAIL credentials wrong
- **Solution**: Check backend console for errors, verify .env EMAIL_USER and EMAIL_PASS

## Frontend Console Checks:

Open DevTools (F12) in browser and check Console for errors like:
- `Failed to fetch` - Backend not running or CORS issue
- `Invalid or expired reset token` - Token problem from backend
- Actual error message - Shows what backend returned

## Backend Console Checks:

Look for logs in terminal running `npm run dev`:
- "Forgot Password error:" - Error sending email
- "Reset Password error:" - Error resetting password
- Stack trace - Detailed error info
