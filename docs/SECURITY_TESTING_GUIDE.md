# SULTAN Security Testing Guide

Panduan lengkap untuk menguji keamanan sistem autentikasi SULTAN Dashboard.

---

## 📋 Daftar Isi

1. [Setup Testing Environment](#1-setup-testing-environment)
2. [Login Security Testing](#2-login-security-testing)
3. [JWT Token Security](#3-jwt-token-security)
4. [Cookie Security Verification](#4-cookie-security-verification)
5. [CSRF Protection Testing](#5-csrf-protection-testing)
6. [API Endpoint Security](#6-api-endpoint-security)
7. [Social Authentication Testing](#7-social-authentication-testing)
8. [Token Refresh Flow](#8-token-refresh-flow)
9. [Logout & Token Blacklisting](#9-logout--token-blacklisting)
10. [Django Admin Social App Setup](#10-django-admin-social-app-setup)

---

## 1. Setup Testing Environment

### Prerequisites
```bash
# Backend (Django)
cd project_sultan
env\Scripts\activate  # Windows
python manage.py runserver

# Frontend (Vue)
cd frontend-sultan-vue
npm run dev
```

### Tools Yang Dibutuhkan
- **Browser DevTools** (F12) - Network, Application, Console tabs
- **Thunder Client** atau **Postman** - API testing
- **Django Admin** - http://127.0.0.1:8000/admin/

---

## 2. Login Security Testing

### Test Case 2.1: Login dengan Username
```http
POST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
    "username": "admin",
    "password": "your_password"
}
```

**Expected Response:**
```json
{
    "access": "eyJ0eXAiOiJ...",
    "refresh": "eyJ0eXAiOiJ...",
    "user": {
        "pk": 1,
        "username": "admin",
        "email": "admin@example.com",
        "first_name": "",
        "last_name": ""
    },
    "access_expiration": "2026-01-16T16:00:00.000000Z",
    "refresh_expiration": "2026-01-23T15:45:00.000000Z"
}
```

### Test Case 2.2: Login dengan Email
```http
POST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
    "email": "admin@example.com",
    "password": "your_password"
}
```

### Test Case 2.3: Login Gagal (Credentials Salah)
```http
POST http://127.0.0.1:8000/api/auth/login/
Content-Type: application/json

{
    "username": "admin",
    "password": "wrong_password"
}
```

**Expected Response (400):**
```json
{
    "non_field_errors": ["Unable to log in with provided credentials."]
}
```

### Test Case 2.4: Rate Limiting (Optional)
Lakukan 10+ login gagal berturut-turut → Seharusnya ada throttling

---

## 3. JWT Token Security

### Test Case 3.1: Decode JWT Token
Salin access token dari response login, lalu decode di [jwt.io](https://jwt.io)

**Expected Payload:**
```json
{
    "token_type": "access",
    "exp": 1737039600,
    "iat": 1737038700,
    "jti": "unique-token-id",
    "user_id": 1
}
```

**Verify:**
- [ ] `exp` is ~15 minutes from `iat`
- [ ] `token_type` is "access"
- [ ] Token uses HS256 algorithm

### Test Case 3.2: Token Storage Verification
1. Buka Browser DevTools → Application → Local Storage
2. **VERIFY:** Tidak ada token tersimpan di localStorage (XSS protection)

### Test Case 3.3: Access Token Expiration
1. Login, simpan access token
2. Tunggu 15 menit (atau ubah `ACCESS_TOKEN_LIFETIME` untuk testing)
3. Gunakan token expired untuk API request

**Expected Response (401):**
```json
{
    "detail": "Given token not valid for any token type",
    "code": "token_not_valid"
}
```

---

## 4. Cookie Security Verification

### Test Case 4.1: Inspect Cookies
1. Login via frontend
2. Buka Browser DevTools → Application → Cookies
3. Cari cookies:
   - `sultan-access` 
   - `sultan-refresh`

**Verify Cookie Attributes:**
| Attribute | Expected Value |
|-----------|----------------|
| HttpOnly | ✅ true (untuk refresh) |
| SameSite | Lax |
| Secure | false (dev), true (production) |
| Path | / |

### Test Case 4.2: HttpOnly Protection
1. Buka Console (F12)
2. Jalankan: `document.cookie`
3. **VERIFY:** Refresh token TIDAK muncul (karena HttpOnly)

---

## 5. CSRF Protection Testing

### Test Case 5.1: CSRF Token Check
1. Login via browser
2. Buka Network tab, lihat request ke `/api/auth/login/`
3. **VERIFY:** Request menyertakan `X-CSRFToken` header atau cookie

### Test Case 5.2: Cross-Origin Request Block
```bash
# Dari terminal berbeda, coba request tanpa credentials
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"pass"}'
```

**Expected:** Request tetap berjalan tapi cookies tidak di-set

---

## 6. API Endpoint Security

### Test Case 6.1: Protected Endpoint Without Token
```http
GET http://127.0.0.1:8000/api/kamar/
```

**Expected Response (401):**
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### Test Case 6.2: Protected Endpoint With Valid Token
```http
GET http://127.0.0.1:8000/api/kamar/
Authorization: Bearer eyJ0eXAiOiJ...
```

**Expected Response (200):** Data kamar

### Test Case 6.3: Invalid Token Format
```http
GET http://127.0.0.1:8000/api/kamar/
Authorization: Bearer invalid_token_here
```

**Expected Response (401):**
```json
{
    "detail": "Given token not valid for any token type",
    "code": "token_not_valid"
}
```

---

## 7. Social Authentication Testing

### Test Case 7.1: Google OAuth Flow
1. Klik tombol "Masuk dengan Google" di login page
2. Redirect ke Google consent screen
3. Pilih akun Google
4. Redirect kembali ke aplikasi dengan user logged in

**Troubleshooting:**
- Error "redirect_uri_mismatch" → Tambahkan redirect URI di Google Cloud Console
- Required redirect URI: `http://127.0.0.1:8000/accounts/google/login/callback/`

### Test Case 7.2: Facebook OAuth Flow
1. Klik tombol "Masuk dengan Facebook" di login page
2. Redirect ke Facebook login
3. Grant permissions
4. Redirect kembali ke aplikasi

**Troubleshooting:**
- Required redirect URI di Facebook App: `http://127.0.0.1:8000/accounts/facebook/login/callback/`

---

## 8. Token Refresh Flow

### Test Case 8.1: Manual Token Refresh
```http
POST http://127.0.0.1:8000/api/auth/token/refresh/
Cookie: sultan-refresh=eyJ0eXAiOiJ...
```

**Expected Response (200):**
```json
{
    "access": "new_access_token_here",
    "access_expiration": "2026-01-16T16:15:00.000000Z"
}
```

### Test Case 8.2: Automatic Refresh (Frontend)
1. Login, biarkan access token expire (15 min)
2. Lakukan action yang memerlukan API call
3. **VERIFY:** Frontend otomatis refresh token dan retry request

### Test Case 8.3: Expired Refresh Token
1. Tunggu 7 hari (atau ubah `REFRESH_TOKEN_LIFETIME`)
2. Coba refresh token

**Expected Response (401):**
```json
{
    "detail": "Token is invalid or expired",
    "code": "token_not_valid"
}
```

---

## 9. Logout & Token Blacklisting

### Test Case 9.1: Logout Request
```http
POST http://127.0.0.1:8000/api/auth/logout/
Cookie: sultan-refresh=eyJ0eXAiOiJ...
```

**Expected Response (200):**
```json
{
    "detail": "Successfully logged out."
}
```

### Test Case 9.2: Token Blacklist Verification
1. Logout
2. Gunakan refresh token yang sama untuk refresh

**Expected Response (401):**
```json
{
    "detail": "Token is blacklisted",
    "code": "token_not_valid"
}
```

### Test Case 9.3: Cookie Cleared After Logout
1. Logout via frontend
2. Cek cookies di Browser DevTools

**VERIFY:** 
- [ ] `sultan-access` cookie dihapus
- [ ] `sultan-refresh` cookie dihapus

---

## 10. Django Admin Social App Setup

### Langkah-langkah Menambahkan Social App

1. **Buka Django Admin:**
   ```
   http://127.0.0.1:8000/admin/
   ```

2. **Login dengan superuser**

3. **Tambah Site (jika belum ada):**
   - Buka `Sites` → `Add Site`
   - Domain: `127.0.0.1:8000`
   - Display name: `SULTAN Dashboard`

4. **Tambah Social Application untuk Google:**
   - Buka `Social Applications` → `Add`
   - Provider: `Google`
   - Name: `Google OAuth`
   - Client ID: _(dari .env: GOOGLE_CLIENT_ID)_
   - Secret Key: _(dari .env: GOOGLE_CLIENT_SECRET)_
   - Sites: Pilih `127.0.0.1:8000`
   - Save

5. **Tambah Social Application untuk Facebook:**
   - Buka `Social Applications` → `Add`
   - Provider: `Facebook`
   - Name: `Facebook OAuth`
   - Client ID: _(dari .env: FACEBOOK_APP_ID)_
   - Secret Key: _(dari .env: FACEBOOK_APP_SECRET)_
   - Sites: Pilih `127.0.0.1:8000`
   - Save

### Google Cloud Console Setup

1. Buka https://console.cloud.google.com/apis/credentials
2. Create OAuth 2.0 Client ID
3. Application type: `Web application`
4. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `http://127.0.0.1:8000`
5. Authorized redirect URIs:
   - `http://127.0.0.1:8000/accounts/google/login/callback/`

### Facebook Developer Setup

1. Buka https://developers.facebook.com/apps/
2. Pilih App → Settings → Basic
3. App Domains: `127.0.0.1`
4. Buka Products → Facebook Login → Settings
5. Valid OAuth Redirect URIs:
   - `http://127.0.0.1:8000/accounts/facebook/login/callback/`

---

## ✅ Security Checklist

### Authentication
- [ ] Login dengan username berfungsi
- [ ] Login dengan email berfungsi
- [ ] Login gagal menampilkan error yang tepat
- [ ] Password tidak terlihat di network request (selain POST body)

### JWT Tokens
- [ ] Access token expire dalam 15 menit
- [ ] Refresh token expire dalam 7 hari
- [ ] Token tidak disimpan di localStorage
- [ ] Token decode menunjukkan struktur yang benar

### Cookies
- [ ] Refresh token cookie adalah HttpOnly
- [ ] SameSite attribute diset ke Lax
- [ ] Cookies dihapus saat logout

### API Security
- [ ] API menolak request tanpa token (401)
- [ ] API menolak token invalid (401)
- [ ] API menerima token valid (200)

### Logout
- [ ] Logout menghapus cookies
- [ ] Refresh token di-blacklist setelah logout
- [ ] User redirect ke login page

### Social Auth
- [ ] Google OAuth flow berfungsi
- [ ] Facebook OAuth flow berfungsi
- [ ] User baru dari social auth terdaftar di database

---

## 🔧 Troubleshooting

### "CSRF Failed" Error
```python
# settings.py
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
```

### "No 'Access-Control-Allow-Credentials'" Error
```python
# settings.py
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
]
```

### Social Auth Redirect Error
1. Pastikan Site ID = 1 di database
2. Pastikan Social Application terhubung ke Site yang benar
3. Pastikan redirect URI cocok persis (termasuk trailing slash)

### Token Refresh Gagal
1. Cek apakah cookie `sultan-refresh` ada
2. Cek apakah `withCredentials: true` di axios config
3. Cek CORS settings allow credentials
