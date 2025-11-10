# คู่มือ Setup Facebook Login และ Verify Domain

## ขั้นตอนที่ 1: สร้าง Facebook App

### 1.1 เข้า Facebook Developers
1. ไปที่ https://developers.facebook.com/
2. คลิก **"My Apps"** หรือ **"เข้าสู่ระบบ"** ด้วยบัญชี Facebook ของคุณ
3. คลิก **"Create App"**

### 1.2 เลือกประเภท App
1. เลือก **"Consumer"** หรือ **"None"** (สำหรับ hobby project)
2. คลิก **"Next"**

### 1.3 กรอกข้อมูล App
1. **App Name**: ตั้งชื่อ เช่น `XO Arena` หรือ `Tic-tac-toe Game`
2. **App Contact Email**: ใส่อีเมลติดต่อของคุณ
3. คลิก **"Create App"**

### 1.4 ยืนยันตัวตน
- Facebook อาจขอให้ยืนยันตัวตนด้วยรหัส Security Check

---

## ขั้นตอนที่ 2: เพิ่ม Facebook Login Product

### 2.1 เลือก Product
1. ในหน้า Dashboard ของ App ให้หา **"Add Product"** ด้านซ้าย
2. หา **"Facebook Login"** แล้วคลิก **"Set Up"**

### 2.2 เลือก Platform
1. เลือก **"Web"**
2. ข้ามขั้นตอน Quick Start (คลิก Settings ซ้ายมือแทน)

---

## ขั้นตอนที่ 3: ตั้งค่า OAuth Redirect URIs

### 3.1 เข้า Facebook Login Settings
1. ด้านซ้ายมือ เลือก **"Facebook Login"** → **"Settings"**
2. หา **"Valid OAuth Redirect URIs"**

### 3.2 เพิ่ม Redirect URIs
เพิ่ม URL ต่อไปนี้ (แยกบรรทัด):

**สำหรับ Local Development:**
```
http://localhost:3000/auth/facebook/callback
```

**สำหรับ Production (Railway หรือ domain จริง):**
```
https://your-app-name.up.railway.app/auth/facebook/callback
https://yourdomain.com/auth/facebook/callback
```

3. คลิก **"Save Changes"**

---

## ขั้นตอนที่ 4: ดึง App ID และ App Secret

### 4.1 เข้า Basic Settings
1. ด้านซ้ายมือ เลือก **"Settings"** → **"Basic"**
2. คุณจะเห็น:
   - **App ID**: เลขประจำตัว App (เช่น `1234567890123456`)
   - **App Secret**: คลิก **"Show"** แล้วยืนยันรหัสผ่าน Facebook เพื่อดู

### 4.2 คัดลอกข้อมูล
- คัดลอก **App ID** และ **App Secret** ไว้

---

## ขั้นตอนที่ 5: ตั้งค่า Environment Variables

### 5.1 สำหรับ Local Development
สร้างหรือแก้ไขไฟล์ `.env` ในโปรเจกต์:

```env
# Google OAuth (เดิม)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth (ใหม่)
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# Session
SESSION_SECRET=your-session-secret

# Port
PORT=3000
```

### 5.2 สำหรับ Railway (Production)
1. ไปที่ Railway Dashboard → เลือก Project → **"Variables"**
2. เพิ่ม Environment Variables:
   - `FACEBOOK_APP_ID` = `1234567890123456`
   - `FACEBOOK_APP_SECRET` = `your-facebook-app-secret`
   - `FACEBOOK_CALLBACK_URL` = `https://your-app.up.railway.app/auth/facebook/callback`

---

## ขั้นตอนที่ 6: เพิ่ม App Domains (สำคัญ!)

### 6.1 เข้า Basic Settings
1. ด้านซ้ายมือ เลือก **"Settings"** → **"Basic"**
2. หา **"App Domains"**

### 6.2 เพิ่ม Domains
เพิ่ม domain (ไม่ต้องใส่ `http://` หรือ `https://`):

**Local Development:**
```
localhost
```

**Production:**
```
your-app-name.up.railway.app
yourdomain.com
```

3. คลิก **"Save Changes"**

---

## ขั้นตอนที่ 7: เพิ่ม Privacy Policy URL (บังคับสำหรับ Public App)

### 7.1 เข้า Basic Settings
1. ด้านซ้ายมือ เลือก **"Settings"** → **"Basic"**
2. หา **"Privacy Policy URL"** และ **"Terms of Service URL"** (ถ้ามี)

### 7.2 ใส่ URL
- **Privacy Policy URL**: ใส่ URL ของ Privacy Policy (ถ้าไม่มี ให้สร้างหน้า `/privacy` หรือใช้ template online)
  - ตัวอย่าง: `https://your-app.up.railway.app/privacy`
- **Terms of Service URL** (optional): `https://your-app.up.railway.app/terms`

3. คลิก **"Save Changes"**

---

## ขั้นตอนที่8: เปลี่ยนโหมดเป็น Public (ถ้าต้องการ)

### 8.1 เปลี่ยนโหมด
1. ด้านบนสุดของหน้า Dashboard ตรง App Mode จะเห็น **"Development"**
2. คลิกสวิตช์เป็น **"Live"** (สีเขียว)

### 8.2 ข้อกำหนด
ก่อนเปลี่ยนเป็น Live mode ต้องมี:
- ✅ Privacy Policy URL
- ✅ App Icon (ไปที่ Settings → Basic → App Icon)
- ✅ Category (เลือก Category ของ App เช่น "Games")

### 8.3 หมายเหตุสำหรับ Development Mode
- **Development Mode**: ใช้ได้เฉพาะ Facebook Accounts ที่เพิ่มเป็น **Roles** (Admin, Developer, Tester)
- **Live Mode**: ทุกคนใช้ได้

---

## ขั้นตอนที่ 9: เพิ่ม Test Users (สำหรับ Development Mode)

### 9.1 เข้า Roles
1. ด้านซ้ายมือ เลือก **"Roles"** → **"Test Users"** หรือ **"Roles"** → **"Roles"**
2. เพิ่ม Facebook Account ที่ต้องการให้ทดสอบ:
   - Admin (สิทธิ์เต็ม)
   - Developer (สิทธิ์พัฒนา)
   - Tester (สิทธิ์ทดสอบ)

### 9.2 วิธีเพิ่ม
- คลิก **"Add People"** แล้วใส่ Facebook User ID หรืออีเมล

---

## การทดสอบ

### ทดสอบ Local (http://localhost:3000)
1. รัน server:
   ```bash
   cd E:\TICTACTOE\XO
   $env:GOOGLE_CLIENT_ID='your-google-id'; $env:GOOGLE_CLIENT_SECRET='your-google-secret'; $env:FACEBOOK_APP_ID='your-fb-app-id'; $env:FACEBOOK_APP_SECRET='your-fb-app-secret'; $env:SESSION_SECRET='your-secret'; yarn start
   ```
   หรือใช้ไฟล์ `.env`
   ```bash
   yarn start
   ```

2. เปิด browser ไปที่ `http://localhost:3000`
3. คลิก **"Sign in with Facebook"**
4. ถ้าเป็น Development mode คุณต้องเป็น Admin/Developer/Tester เท่านั้น

### ทดสอบ Production (Railway)
1. Deploy ไปที่ Railway
2. ตั้งค่า Environment Variables บน Railway
3. เปิด browser ไปที่ `https://your-app.up.railway.app`
4. คลิก **"Sign in with Facebook"**

---

## การ Verify Domain (สำหรับ Production)

Facebook จะต้องการให้คุณ verify domain ก่อนใช้งาน Facebook Login ใน Live mode

### วิธี Verify Domain

#### Option 1: ใช้ Meta Tag (ง่ายที่สุด)
1. ไปที่ **"Settings"** → **"Basic"** → **"Add Platform"** → **"Website"**
2. คัดลอก Meta Tag ที่ Facebook ให้มา เช่น:
   ```html
   <meta name="facebook-domain-verification" content="abc123def456..." />
   ```
3. เพิ่ม meta tag ลงในไฟล์ `public/index.html` ระหว่าง `<head>...</head>`:
   ```html
   <head>
     <meta charset="UTF-8" />
     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
     <meta name="facebook-domain-verification" content="abc123def456..." />
     <title>XO Arena</title>
     ...
   </head>
   ```
4. Deploy โปรเจกต์ไปที่ Railway
5. กลับไปที่ Facebook Developers แล้วคลิก **"Verify Domain"**

#### Option 2: ใช้ DNS TXT Record
1. Facebook จะให้ DNS TXT Record เช่น:
   ```
   Type: TXT
   Name: @
   Value: facebook-domain-verification=abc123def456...
   ```
2. เข้าไปที่ DNS Provider ของคุณ (เช่น Cloudflare, GoDaddy, Namecheap)
3. เพิ่ม TXT Record ตามที่ Facebook ระบุ
4. รอ DNS propagate (5-30 นาที)
5. กลับไปที่ Facebook Developers แล้วคลิก **"Verify Domain"**

#### Option 3: อัปโหลดไฟล์ HTML
1. Facebook จะให้ไฟล์ HTML เช่น `facebookabcdef123.html`
2. ดาวน์โหลดไฟล์แล้ววางใน `public/` folder
3. Deploy แล้วเข้าที่ `https://yourdomain.com/facebookabcdef123.html` เพื่อทดสอบ
4. กลับไปที่ Facebook Developers แล้วคลิก **"Verify Domain"**

---

## สรุปสั้นๆ

1. **สร้าง Facebook App** ที่ https://developers.facebook.com/
2. **เพิ่ม Facebook Login Product**
3. **ตั้งค่า OAuth Redirect URIs**:
   - Local: `http://localhost:3000/auth/facebook/callback`
   - Production: `https://your-app.up.railway.app/auth/facebook/callback`
4. **เพิ่ม App Domains**: `localhost`, `your-app.up.railway.app`
5. **คัดลอก App ID และ App Secret** ไปใส่ใน `.env` หรือ Railway Variables
6. **เพิ่ม Privacy Policy URL** (บังคับสำหรับ Live mode)
7. **เปลี่ยนเป็น Live mode** (ถ้าต้องการให้ทุกคนใช้ได้)
8. **Verify Domain** (ใช้ Meta Tag วิธีที่ง่ายที่สุด)

---

## Troubleshooting

### ❌ "URL Blocked: This redirect failed because..."
- **สาเหตุ**: OAuth Redirect URI ไม่ตรงกับที่ตั้งไว้
- **แก้ไข**: ตรวจสอบ "Valid OAuth Redirect URIs" ใน Facebook Login Settings

### ❌ "Can't Load URL: The domain of this URL isn't included in the app's domains"
- **สาเหตุ**: App Domains ไม่มี domain ที่คุณใช้งาน
- **แก้ไข**: เพิ่ม domain ใน Settings → Basic → App Domains

### ❌ "This app is in Development Mode"
- **สาเหตุ**: App อยู่ใน Development mode แต่ผู้ใช้ไม่ได้อยู่ใน Roles
- **แก้ไข**: เพิ่ม user เป็น Tester หรือเปลี่ยน App เป็น Live mode

### ❌ "The email permission is required"
- **สาเหตุ**: User ไม่ยินยอมแชร์อีเมล
- **แก้ไข**: Code จัดการกรณี email เป็น `null` ได้แล้ว (ตามที่เราใช้ `?? ''`)

### ❌ ไม่สามารถ verify domain ได้
- **สาเหตุ**: Meta tag ยังไม่ถูก deploy หรือ DNS ยังไม่ propagate
- **แก้ไข**: รอสักครู่แล้วลองใหม่ หรือใช้ `curl` ตรวจสอบว่า meta tag ปรากฏหรือไม่:
  ```bash
  curl https://yourdomain.com | grep facebook-domain-verification
  ```

---

## ตัวอย่างไฟล์ `.env` ฉบับเต็ม

```env
# Google OAuth
GOOGLE_CLIENT_ID=137427417798-6cikn6pklfg0vv52prclqacm4lp0jtsa.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef0123456789abcdef0123456789
FACEBOOK_CALLBACK_URL=http://localhost:3000/auth/facebook/callback

# Session
SESSION_SECRET=supersecretkey12345

# Port
PORT=3000
```

---

## ตัวอย่าง Railway Environment Variables

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | `137427417798-...apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-9NcdLU-...` |
| `GOOGLE_CALLBACK_URL` | `https://xo-arena.up.railway.app/auth/google/callback` |
| `FACEBOOK_APP_ID` | `1234567890123456` |
| `FACEBOOK_APP_SECRET` | `abcdef0123456789abcdef0123456789` |
| `FACEBOOK_CALLBACK_URL` | `https://xo-arena.up.railway.app/auth/facebook/callback` |
| `SESSION_SECRET` | `supersecretkey12345` |
| `PORT` | `3000` |

---

เรียบร้อย! ตอนนี้คุณสามารถใช้ Facebook Login ได้แล้ว 🎉

