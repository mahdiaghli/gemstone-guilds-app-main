# 🚀 روش های جایگزین برای تست بازی انلاین

اگر روش IP محلی کار نمی‌کنه، این راه‌ها رو امتحان کن!

---

## ✅ **روش 1: استفاده از Ngrok (بهترین و ساده‌ترین)**

Ngrok یک تونل ایجاد می‌کند که سرور محلی‌ات رو به اینترنت عمومی درمی‌آورد.

### 📥 **نصب Ngrok**

1. دانلود از: https://ngrok.com/download
2. یا اگر npm دارید:
   ```powershell
   npm install -g ngrok
   ```

### 🚀 **استفاده از Ngrok**

**Terminal 1: شروع Socket.IO سرور**
```powershell
npm run dev:server
```
(معمولاً روی پورت 3001)

**Terminal 2: شروع Ngrok تونل**
```powershell
ngrok http 3001
```

**You see:**
```
ngrok by @inconshreveable                                       (Ctrl+C to quit)

Session Status                online
Session Expires               2 hours, 59 minutes
Version                       3.0.0
Region                        jp (Japan)
Forwarding                    http://4f1f-2409-4072-98e5-1234-5678-9.ngrok.io -> http://localhost:3001
Forwarding                    https://4f1f-2409-4072-98e5-1234-5678-9.ngrok.io -> http://localhost:3001
```

**Terminal 3: شروع React سرور**
```powershell
npm run dev
```

### 🔧 **تنظیم در کد**

فایل `.env`:
```env
VITE_SOCKET_URL=https://4f1f-2409-4072-98e5-1234-5678-9.ngrok.io
```

یا در `src/pages/OnlineMatchmaking.tsx`:
```typescript
const SOCKET_SERVER_URL = 'https://4f1f-2409-4072-98e5-1234-5678-9.ngrok.io';
```

### 📱 **تست روی گوشی**

1. گوشی رو به **هر WiFi** وصل کن (نیازی نیست همون WiFi باشه!)
2. مرورگر گوشی:
   ```
   http://localhost:5173
   ```
   یا اگر Ngrok برای React هم استفاده کنی:
   ```
   https://YOUR_NGROK_URL:5173
   ```

3. بازی انلاین رو تست کن!

### ✅ **مزایا:**
- ✅ کار می‌کنه روی WiFi های مختلف
- ✅ کار می‌کنه روی موبایل داده
- ✅ شبیه production است
- ✅ ساده و سریع

### ⚠️ **نکات:**
- ⚠️ هر بار که ngrok رو شروع می‌کنی URL عوض می‌شه
- ⚠️ اگر .env استفاده کنی باید restart کنی
- ⚠️ Ngrok رایگان محدودیت داره

---

## ✅ **روش 2: استفاده از متغیرهای محیطی (Environment Variables)**

### 📝 **فایل `.env`**

پروژه ریشه‌ات میں `.env` فایل درست کن:

```env
VITE_SOCKET_URL=https://your-ngrok-url.ngrok.io
```

یا برای توسعه:
```env
VITE_SOCKET_URL=http://localhost:3001
```

### 🔄 **استفاده در کد**

فایل `src/pages/OnlineMatchmaking.tsx`:
```typescript
const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
```

**برنامه انجام می‌دهد:**
1. اگر `.env` دارای `VITE_SOCKET_URL` بود، اونو استفاده کن
2. اگر نبود، از `localhost:3001` استفاده کن

### ✅ **مزایا:**
- ✅ یک کد برای همه
- ✅ آسان برای تغییر
- ✅ شبیه production

---

## ✅ **روش 3: استفاده از چند Instance مختلف**

اگر می‌خوای دو بازیکن رو روی **یک لبتاپ** تست کنی:

### 🖥️ **تست 1: دو تب مرورگر**

1. `http://localhost:5173` - بازیکن 1
2. `http://localhost:5173` - بازیکن 2 (تب دیگر)
3. هر دو "Find Match" رو کلیک کنند
4. سرور آنها رو match می‌کنه!

**مزایا:**
- ✅ Firewall مسئله نیست
- ✅ IP مسئله نیست
- ✅ سریع تست کن

---

## ✅ **روش 4: CloudFlare Tunnel (رایگان و بهتر از Ngrok)**

CloudFlare یک راه رایگان و قابل‌اعتماد‌تر ارائه می‌دهد.

### 📥 **نصب Cloudflared**

```powershell
# Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
# یا اگر چocolatey دارید:
choco install cloudflared
```

### 🚀 **استفاده**

```powershell
cloudflared tunnel --url http://localhost:3001
```

**نتیجه:**
```
Your quick tunnel has been created! Visit it at:
https://random-name.trycloudflare.com
```

### ✅ **مزایا:**
- ✅ رایگان و نامحدود
- ✅ بیشتر قابل‌اعتماد
- ✅ بهتر برای production

---

## ✅ **روش 5: Deploy به سرویس رایگان (تست واقعی)**

اگر می‌خوای بازی رو در production واقعی تست کنی:

### 🔵 **Azure (رایگان برای یک سال)**

1. نیاز‌های:
   - .NET Runtime
   - Node.js
   - Azure Account (رایگان)

2. Deploy سرور:
   ```powershell
   # ابتدا لاگین کن
   az login
   
   # App Service درست کن
   az appservice plan create --name SplendorPlan --resource-group myResourceGroup --sku F1
   ```

3. یا استفاده از **Azure Container Registry**

### 🟢 **Render.com (راحت‌تر)**

1. روی render.com ثبت نام کن
2. Backend رو deploy کن:
   - Repository گیت رو وصل کن
   - Start command: `npm run dev:server`
   - نتیجه: `https://splendor-server.onrender.com`

3. Frontend رو deploy کن:
   - Start command: `npm run dev`
   - .env تنظیم کن:
     ```env
     VITE_SOCKET_URL=https://splendor-server.onrender.com
     ```

### 🟠 **Vercel (برای React)**

1. روی vercel.com ثبت نام کن
2. Import کن
3. Environment variables:
   ```env
   VITE_SOCKET_URL=your-backend-url
   ```

---

## 📊 **مقایسه روش‌ها**

| روش | سختی | سرعت | رایگان | Production-Like |
|-----|------|------|--------|-----------------|
| **Ngrok** | آسان | فوری | بله | خوب |
| **CloudFlare Tunnel** | آسان | فوری | بله | بسیار خوب |
| **دو تب مرورگر** | خیلی آسان | فوری | بله | نه |
| **Render.com** | متوسط | 1-2 دقیقه | بله | عالی |
| **Vercel + Render** | متوسط | 1-2 دقیقه | بله (محدود) | عالی |
| **Azure** | سخت | 5-10 دقیقه | بله (سال اول) | عالی |

---

## 🎯 **توصیه من برایت**

### برای تست سریع:
```powershell
# Terminal 1
npm run dev:server

# Terminal 2
ngrok http 3001
# کپی کن: https://xxxxx.ngrok.io

# Terminal 3
npm run dev

# گوشی: http://localhost:5173 (همه جا کار می‌کنه!)
```

### برای تست دقیق:
```powershell
# Deploy به Render.com
# Backend و Frontend دونی رو deploy کن
# ایمیل بفرست به دوستات
# نهایی تست کن
```

---

## 🔧 **تنظیمات برای Ngrok**

فایل `server.js` رو به‌روز کن:

```javascript
const io = new Server(httpServer, {
  cors: {
    origin: function (origin, callback) {
      const allowedPatterns = [
        /^http:\/\/localhost/,
        /^http:\/\/127\.0\.0\.1/,
        /^http:\/\/192\.168\./,
        /^http:\/\/10\./,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\./,
        /^https:\/\/.*\.ngrok\.io/, // ✅ اضافه کن
        /^https:\/\/.*\.trycloudflare\.com/, // ✅ اضافه کن
      ];
      
      if (!origin || allowedPatterns.some(pattern => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});
```

---

## 📋 **مراحل سریع Ngrok**

### 1️⃣ نصب
```powershell
npm install -g ngrok
```

### 2️⃣ شروع
```powershell
# Terminal 1
npm run dev:server

# Terminal 2
ngrok http 3001
# کپی URL

# Terminal 3
npm run dev
```

### 3️⃣ تنظیم URL
```typescript
// src/pages/OnlineMatchmaking.tsx
const SOCKET_SERVER_URL = 'https://4f1f-2409...ngrok.io';
```

### 4️⃣ تست روی گوشی
```
http://localhost:5173
↓
Play Online → Find Match
↓
بازی انلاین! 🎮
```

---

## 💡 **نکات حیاتی**

✅ **HTTPS استفاده کن** - Ngrok/CloudFlare https می‌دن  
✅ **CORS بروز کن** - برای تونل URLs  
✅ **Environment variables استفاده کن** - برای آسانی  
✅ **پورت مشخص کن** - `npm run dev:server -- --port 3001`  

---

## 🆘 **مشکلات رایج**

### "404 Not Found"
- ✅ `npm run dev` رو شروع کن (frontend)
- ✅ socket URL رو درست کن

### "CORS Error"
- ✅ `server.js` میں ngrok URL اضافه کن
- ✅ HTTPS استفاده کن

### "Connection Timeout"
- ✅ Ngrok رو restart کن
- ✅ بازی رو refresh کن

---

**راه‌حل خود من:** از Ngrok استفاده کن - ساده‌ترین و سریع‌ترین! 🚀

