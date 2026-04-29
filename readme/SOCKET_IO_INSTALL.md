
## ⚙️ Socket.IO بغیر npm install کے Manual Setup

### **Current State:**

* ✅ Vite client در حال اجرا است: [http://localhost:8083](http://localhost:8083)
* ⚠️ پکیج‌های Socket.IO هنوز install نشده‌اند
* ✅ کد پروژه آماده است

---

## 📦 Manual Installation Steps:

### **Option 1: اجرای مستقیم در Windows Command Prompt**

```cmd
cd C:\Users\ASUS\Desktop\splendor\gemstone-guilds-app-main\gemstone-guilds-app-main

REM نصب جداگانه:
npm install socket.io
npm install socket.io-client

REM یا نصب هر دو باهم:
npm install socket.io socket.io-client
```

---

### **Option 2: اگر روش بالا کار نکرد**

```cmd
REM پاک کردن npm cache:
npm cache clean --force

REM سپس دوباره تلاش کنید:
npm install socket.io socket.io-client --force
```

---

### **Option 3: اگر مشکل Timeout وجود دارد**

```cmd
REM افزایش timeout در npm:
npm config set fetch-timeout 120000

REM سپس install کنید:
npm install socket.io socket.io-client
```

---

## 🚀 Installation کے بعد:

### **Terminal 1 - Socket.IO Server (Port 3001):**

```bash
npm run dev:server
```

✅ صبر کنید تا این پیام نمایش داده شود:

```
🎮 Splendor Server running on http://localhost:3001
```

---

### **Terminal 2 - Vite Client (Port 8083):**

```bash
npm run dev
```

یا اگر هر بار port تغییر می‌کند:

```bash
npm run dev:client
```

---

## 🧪 Testing:

### **Tab 1 (Player 1):**

1. [http://localhost:8083](http://localhost:8083)
2. "🎮 Online Play"
3. نام: "Ali"
4. "🎲 Create Room"
5. کد Room را کپی کنید

---

### **Tab 2 (Player 2):**

1. [http://localhost:8083](http://localhost:8083)
2. "🎮 Online Play"
3. نام: "Bob"
4. کد را paste کنید
5. "✅ Join Room"

---

### ✅ Expected:

```
Room: X7K9M2
Waiting for players...

Players (2/4)
🟢 Ali (You)
🟢 Bob
```

* در هر دو تب بازیکنان sync شوند
* مقدار **(2/4)** نمایش داده شود
* دکمه **"🎮 Start Game"** فعال باشد
* بازی بتواند شروع شود

---

## 🔧 فایل‌هایی که آماده هستند:

✅ **`server.js`** — سرور Node.js + Socket.IO
✅ **`useOnlineGame.ts`** — React Hook مبتنی بر Socket.IO
✅ **`OnlineGame.tsx`** — مدیریت session بازی
✅ **`OnlineLobby.tsx`** — رابط ساخت/ورود Room
✅ **`.env.local`** — تنظیم آدرس سرور
✅ **`package.json`** — وابستگی‌ها تعریف شده‌اند

---

## 📋 Troubleshooting:

### **"Cannot GET /socket.io/..."**

* سرور اجرا نشده است
* **راه‌حل:** اجرا کنید:

```bash
npm run dev:server
```

---

### **"Connection refused"**

* مشکل firewall یا port

**راه‌حل:**

```bash
PORT=3002 npm run dev:server
```

سپس در `.env.local` تغییر دهید:

```
VITE_SOCKET_URL=http://localhost:3002
```

---

### **npm install hang ہو رہی ہے**

* مشکل شبکه (Network issue)

**راه‌حل:**

```bash
npm config set fetch-timeout 300000
npm install
```

---

### **"Socket.IO library not loaded"**

* پکیج‌ها نصب نشده‌اند

**راه‌حل:** نصب دستی مطابق مراحل بالا انجام دهید.

---

## 💡 اگر Installation fail ہو رہے ہو:

### **Plan B: استفاده از Socket.IO از طریق CDN**

در فایل `src/index.html` اضافه کنید:

```html
<script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
```

و در `useOnlineGame.ts`:

```typescript
const io = (window as any).io;
```

---

## 🎯 Next Steps:

1. اجرای کامل npm install
2. اجرای هر دو Server
3. تست در دو Tab مرورگر
4. شروع بازی 🎮

---

## 📞 اگر مشکلی پیش آمد:

1. کلید F12 → بررسی Console
2. بررسی logهای Server console
3. اجرای دوباره commandها
4. بررسی Windows firewall

---

## ✨ Architecture:

```
┌─────────────────┐         ┌─────────────────┐
│   Browser Tab 1 │         │   Browser Tab 2 │
│   (Player 1)    │         │   (Player 2)    │
│ :8083           │         │ :8083           │
└────────┬────────┘         └────────┬────────┘
         │                          │
         └──────────┬───────────────┘
                    │ WebSocket
                    ↓
            ┌──────────────────┐
            │  Socket.IO Server│
            │    :3001         │
            │ ┌──────────────┐ │
            │ │ Rooms Map    │ │
            │ │ Game States  │ │
            │ │ Player Data  │ │
            │ └──────────────┘ │
            └──────────────────┘
```

---

**Happy playing! 🎮💎**
