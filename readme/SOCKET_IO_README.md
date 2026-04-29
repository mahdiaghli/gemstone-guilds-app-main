

# 🎯 راه‌اندازی Socket.IO WebSocket در **Splendor Guilds**

---

## ✅ چه چیزهایی انجام شده:

### **1. Server-side**

* ✔️ `server.js` — سرور **Express + Socket.IO** (روی port 3001)
* ✔️ سیستم مدیریت Room
* ✔️ رویدادهای همگام‌سازی بازیکنان
* ✔️ Broadcast شدن وضعیت بازی (Game State)

### **2. Client-side**

* ✔️ `useOnlineGame.ts` — hook کلاینت Socket.IO
* ✔️ listenerهای real-time
* ✔️ اتصال و خروج خودکار از room
* ✔️ همگام‌سازی وضعیت بازی

### **3. Routes & Pages**

* ✔️ `/online-lobby` — ساخت یا ورود به Room
* ✔️ `/online-game/:roomId` — جلسه بازی آنلاین

### **4. Dependencies نصب شده**

* `socket.io v4.7.2`
* `socket.io-client v4.7.2`
* `express v4.18.2`
* `cors v2.8.5`

---

# 🚀 اجرای پروژه (دو روش)

---

## ✅ روش 1: دو Terminal جدا (پیشنهادی)

### Terminal 1 — اجرای Socket.IO Server

```bash
npm run dev:server
```

صبر کنید تا این پیام نمایش داده شود:

```
🎮 Splendor Server running on http://localhost:3001
```

---

### Terminal 2 — اجرای Vite Client

```bash
npm run dev:client
```

صبر کنید تا این پیام نمایش داده شود:

```
VITE v7.3.1  ready in XXX ms
Local: http://localhost:8082/
```

---

## ✅ روش 2: اجرای همزمان با یک دستور

(اگر در پروژه تنظیم شده باشد)

```bash
npm run dev
```

این دستور هر دو سرور را همزمان اجرا می‌کند.

---

# 🧪 تست بازی آنلاین

## تست با دو Browser Tab

---

### Tab 1 (Player 1)

1. باز کنید:

```
http://localhost:8082
```

2. روی **🎮 Online Play** کلیک کنید
3. نام وارد کنید:

```
Ali
```

4. روی **🎲 Create Room** کلیک کنید
5. کد Room را کپی کنید (مثلاً `X7K9M2`)

---

### Tab 2 (Player 2)

1. باز کنید:

```
http://localhost:8082
```

2. روی **🎮 Online Play** کلیک کنید
3. نام وارد کنید:

```
Bob
```

4. کد Room را Paste کنید:

```
X7K9M2
```

5. روی **✅ Join Room** کلیک کنید

---

## ✅ نتیجه مورد انتظار (در هر دو تب)

```
Room: X7K9M2
Waiting for players...

Players (2/4)
🟢 Ali (You)
🟢 Bob
```

در هر دو تب باید:

* ✅ لیست بازیکنان خودکار آپدیت شود
* ✅ تعداد بازیکنان `(2/4)` نمایش داده شود
* ✅ دکمه **🎮 Start Game** فعال شود
* ✅ بازی بتواند شروع شود

---

# 🔍 Troubleshooting (رفع مشکلات)

---

## 1️⃣ خطای:

```
Cannot GET /socket.io/?...
```

✅ علت: `server.js` اجرا نشده است.

اجرا کنید:

```bash
npm run dev:server
```

---

## 2️⃣ خطای:

```
Connection refused
```

یا

```
localhost:3001 unreachable
```

✅ احتمال مشکل firewall یا port.

اجرا کنید:

```bash
PORT=3002 npm run dev:server
```

سپس فایل `.env.local` را تغییر دهید:

```
VITE_SOCKET_URL=http://localhost:3002
```

---

## 3️⃣ پیام "Room not found"

✅ طبیعی است؛ حدود ۱ ثانیه صبر کنید.

اگر ادامه داشت:

```bash
# هر دو server را restart کنید
```

---

## 4️⃣ لیست بازیکنان آپدیت نمی‌شود

موارد زیر را بررسی کنید:

1. خطاهای Browser Console (کلید F12)
2. پیام‌های Server Console
3. اجرا بودن هر دو server
4. استفاده از Room Code یکسان

---

## 5️⃣ اگر `npm run dev` اجرا نشد

به صورت جدا اجرا کنید:

```bash
# Terminal 1
npm run dev:server
```

```bash
# Terminal 2
npm run dev:client
```

---

# 📊 معماری سیستم

```
Tab 1                          Tab 2
(Browser)                      (Browser)
   │                              │
   └──────── localhost:8082 ──────┘
                  │
                  │ WebSocket
                  ↓
         localhost:3001
         ┌──────────────┐
         │ Socket.IO    │
         │ Server       │
         ├──────────────┤
         │ Rooms Map    │
         │ Players Data │
         │ Game States  │
         └──────────────┘
```

---

# 📝 Server Events

## Client → Server

* `join-room` — ورود بازیکن به room
* `leave-room` — خروج بازیکن
* `start-game` — شروع بازی
* `sync-game-state` — ارسال وضعیت بازی
* `end-game` — پایان بازی

---

## Server → Client

* `players-updated` — بروزرسانی لیست بازیکنان
* `game-started` — شروع بازی
* `game-state-updated` — تغییر وضعیت بازی
* `game-ended` — پایان بازی

---

# 🎯 مراحل بعدی (Next Steps)

✅ اضافه کردن persistence (Database) در سرور
✅ اضافه کردن Authentication
✅ Deploy در production (Heroku / Railway)

---

# 💡 اگر مشکلی پیش آمد

1. Browser Console را بررسی کنید (F12)
2. Server Console را بررسی کنید
3. مطمئن شوید هر دو server در حال اجرا هستند
4. مطمئن شوید portها conflict ندارند (`3001` و `8082`)


