# LoginGoogle Component Usage Guide

## Tổng Quan
Component `LoginGoogle` được tạo để xử lý Google OAuth authentication và trả về email của người dùng.

## Cài Đặt Dependencies

Các packages sau đã được cài đặt:
- `@react-oauth/google` - Google OAuth client library
- `jwt-decode` - Decode JWT tokens từ Google

```bash
npm install @react-oauth/google jwt-decode
```

## Cấu Trúc File

### 1. LoginGoogle Component (`src/components/ui/LoginGoogle.jsx`)
Component chính xử lý Google OAuth.

**Props:**
- `onSuccess` (Function): Callback được gọi khi đăng nhập thành công
  - Nhận object với các thông tin:
    - `email`: Email của người dùng
    - `name`: Tên người dùng
    - `picture`: Avatar URL
    - `credential`: JWT token từ Google
    - `response`: Response từ backend

- `onError` (Function, tùy chọn): Callback xử lý lỗi

**Ví dụ sử dụng:**
```jsx
<LoginGoogle 
  onSuccess={(data) => {
    console.log('Email:', data.email);
    // Xử lý email
  }}
  onError={(error) => {
    console.error('Error:', error);
  }}
/>
```

### 2. Login Component (`src/components/auth/Login.jsx`)
Trang đăng nhập chính sử dụng LoginGoogle component.

**Tính năng:**
- Gọi LoginGoogle component
- Xử lý kết quả trả về email
- Lưu trữ thông tin người dùng
- Hiển thị thông tin sau khi đăng nhập thành công

## Quy Trình Đăng Nhập

1. **Người dùng nhấp nút Google Login**
   - Component render nút Google Login

2. **Người dùng xác thực với Google**
   - Google trả về credential (JWT token)

3. **Component decode JWT token**
   - Lấy email, name, picture từ token

4. **Gọi backend API**
   - Gọi `signin(email)` từ AuthService
   - Backend xác nhận hoặc tạo mới user

5. **Trả về email và dữ liệu**
   - Callback `onSuccess` được gọi với email
   - Ứng dụng xử lý email (lưu, redirect, etc.)

## Tích Hợp Vào App

### Bước 1: Setup GoogleOAuthProvider
Bạn cần wrap app với `GoogleOAuthProvider` trong `main.jsx`:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
```

### Bước 2: Lấy Google Client ID
1. Đi đến [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo OAuth 2.0 Client ID
3. Thêm Authorized JavaScript origins và Authorized redirect URIs
4. Sao chép Client ID

### Bước 3: Sử dụng Login Component
```jsx
import Login from './components/auth/Login'

function App() {
  return (
    <div>
      <Login />
    </div>
  )
}
```

## API Integration

Component tự động gọi backend endpoint:
```
POST /auth/login
Body: { email: "user@example.com" }
```

Đảm bảo backend endpoint này đã được implement trong `AuthService.jsx`.

## Xử Lý Email Trả Về

Sau khi đăng nhập thành công, email được trả về qua callback:

```jsx
const handleLoginSuccess = (data) => {
  const { email, name, picture, response } = data
  
  // Lưu vào state
  setUserEmail(email)
  
  // Gửi đi xử lý
  // Ví dụ: lưu vào localStorage, redirect, update global state, etc.
}
```

## Error Handling

Component xử lý các lỗi:
- Lỗi decode JWT
- Lỗi API call
- Lỗi xác thực Google

```jsx
const handleLoginError = (error) => {
  console.error('Login error:', error.message)
}
```

## Styling

Component sử dụng các CSS classes sau (bạn có thể customize):
- `.login-google-container` - Container chính
- `.google-login-wrapper` - Wrapper cho nút Google
- `.error-message` - Hiển thị lỗi
- `.loading-message` - Hiển thị loading

Thêm CSS vào `src/styles/index.css`:

```css
.login-google-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.google-login-wrapper {
  padding: 1rem;
}

.error-message {
  color: #d32f2f;
  padding: 1rem;
  border-radius: 4px;
  background-color: #ffebee;
}

.loading-message {
  color: #1976d2;
  padding: 1rem;
}
```

## Troubleshooting

### Lỗi: "clientId not found"
- Đảm bảo bạn đã setup `GoogleOAuthProvider` với Client ID hợp lệ

### Lỗi: "CORS issue"
- Kiểm tra Authorized origins trong Google Cloud Console

### Email không được trả về
- Kiểm tra backend API `/auth/login` response
- Kiểm tra console.log để debug

## File Structure Summary

```
src/
├── components/
│   ├── auth/
│   │   └── Login.jsx (trang đăng nhập)
│   └── ui/
│       └── LoginGoogle.jsx (component Google OAuth)
├── services/
│   └── AuthService.jsx (API calls)
└── ...
```

## Hành động tiếp theo

1. Cài đặt Google Client ID
2. Setup GoogleOAuthProvider trong main.jsx
3. Customize styling
4. Test đăng nhập
5. Xử lý email trả về (redirect, lưu state, etc.)

