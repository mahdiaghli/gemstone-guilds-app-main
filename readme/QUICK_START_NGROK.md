# 🎮 بازی انلاین - شروع سریع با Ngrok

اگر روش IP محلی کار نمی‌کنه، این روش 100% کار می‌کنه! ✅

---

## ⚡ **5 قدم ساده**

### 1️⃣ نصب Ngrok
```powershell
npm install -g ngrok
```

### 2️⃣ شروع سرور
```powershell
npm run dev:server
```
منتظر مثل این بمون:
```
🎮 [SERVER] Splendor Server running on http://localhost:3001
```

**Terminal 2:**
```powershell
ngrok http 3001
```
میبینی:
```
Forwarding: https://4f1f-abc123.ngrok.io -> http://localhost:3001
```

کپی کن: `https://4f1f-abc123.ngrok.io`

### 3️⃣ تنظیم کد
فایل `src/pages/OnlineMatchmaking.tsx` بازش کن، این خط رو پیدا کن:
```typescript
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://192.168.254.3:3001';
```

تغییر بده:
```typescript
const SOCKET_SERVER_URL = 'https://4f1f-abc123.ngrok.io'; // اینجا رو نصب کن!
```

### 4️⃣ شروع React
**Terminal 3:**
```powershell
npm run dev
```

### 5️⃣ تست روی گوشی
گوشی رو گذاشت روی **هر WiFi** (یا موبایل داده هم کار می‌کنه!)

مرورگر: `http://localhost:5173`
- بازی انلاین → Find Match
- نام بنویس
- ✅ کار می‌کنه!

---

## 🎯 **کافی نیست؟**

| مشکل | حل |
|------|-----|
| هر بار Ngrok URL عوض می‌شه | از `.env` استفاده کن |
| می‌خوای دقیق‌تر تست کنی | دو تب مرورگر بساز |
| می‌خوای production درست کنی | Render.com یا Azure استفاده کن |

---

## 🔧 **استفاده از `.env` (توصیه شده)**

فایل `.env` رو ریشه پروژه درست کن:
```env
VITE_SOCKET_URL=https://4f1f-abc123.ngrok.io
```

سپس `OnlineMatchmaking.tsx`:
```typescript
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
```

**مزایا:**
- ✅ نیازی نیست کد رو دستی تغییر بدی
- ✅ Ngrok URL عوض شد؟ فقط `.env` رو اپدیت کن
- ✅ شبیه production است

---

## 🚀 **خودکار کن**

فایل PowerShell درست کن: `run-ngrok.ps1`
```powershell
# Terminal 1: Socket Server
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev:server"

# Terminal 2: Ngrok
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "ngrok http 3001"

# Terminal 3: React
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "تمام چیز شروع شد!"
Write-Host "وارد localhost:5173 شو"
```

**اجرا کن:**
```powershell
./run-ngrok.ps1
```

---

## 📊 **بررسی کن همه چیز کار کنه**

✅ `npm run dev:server` شروع شد  
✅ `ngrok http 3001` شروع شد  
✅ `npm run dev` شروع شد  
✅ کد `.env` یا `OnlineMatchmaking.tsx` اپدیت شد  
✅ گوشی وصل شد `http://localhost:5173`  
✅ "Find Match" کار می‌کنه!

---

## 💡 **حتی ساده‌تر؟**

اگر می‌خوای دو بازیکن رو تست کنی **بدون** گوشی:

```powershell
npm run dev
```

بازش کن:
- Tab 1: `http://localhost:5173` (بازیکن 1)
- Tab 2: `http://localhost:5173` (بازیکن 2)

هر دو "Find Match" رو کلیک کنند = **بازی شروع می‌شه!** 🎮

---

**نتیجه:** بازی انلاین 100% کار می‌کنه + شبیه production است + تست روی گوشی ممکن! ✅

