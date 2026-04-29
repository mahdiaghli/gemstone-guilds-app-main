

# Socket.IO Setup for Splendor Guilds

---

## مراحل:

### **Step 1: Dependencies Install (اگر `npm install` با خطا مواجه شد)**

```powershell
npm install socket.io socket.io-client express cors
npm install --save-dev @types/express @types/node
```

---

### **Step 2: دو Terminal باز کنید**

**Terminal 1 - Socket.IO سرور (Port 3001):**

```powershell
npm run dev:server
```

یا مستقیم اجرا کنید:

```powershell
node server.js
```

---

**Terminal 2 - Vite Client (Port 8082):**

```powershell
npm run dev:client
```

---

## 🎯 نحوه کار سیستم:

### **Architecture:**

```
┌─────────────────┐         ┌─────────────────┐
│   Browser Tab 1 │         │   Browser Tab 2 │
│   (Player 1)    │         │   (Player 2)    │
└────────┬────────┘         └────────┬────────┘
         │                          │
         └──────────┬───────────────┘
                    │ WebSocket
                    ↓
            ┌──────────────────┐
            │  Socket.IO Server│
            │    (Port 3001)   │
            │ ┌──────────────┐ │
            │ │ Rooms Map    │ │
            │ │ GameStates   │ │
            │ │ Player Data  │ │
            │ └──────────────┘ │
            └──────────────────┘
```

---

### **Real-time Sync Flow:**

1. **Player 1 یک Room ایجاد می‌کند**

   * `/online-lobby` → "Create Room"
   * یک `room` جدید در Server ساخته می‌شود
   * `socket.emit('join-room')` → Server ارسال می‌شود

2. **Player 2 وارد Room می‌شود**

   * `/online-lobby` → "Join Room" + Room Code
   * Server room موجود را پیدا می‌کند
   * `socket.emit('join-room')` → Server
   * Server رویداد `players-updated` را برای هر دو بازیکن broadcast می‌کند

3. **Server Broadcasts**

   ```javascript
   io.to(roomId).emit('players-updated', {
     players: [{...P1}, {...P2}],
     roomStatus: 'waiting'
   })
   ```

4. **هر دو Tab به‌روزرسانی می‌شوند**

   * `useState` همگام‌سازی می‌شود
   * لیست بازیکنان refresh می‌شود
   * دکمه "Start Game" فعال می‌شود

---

## ⚡ Events:

### **Client → Server:**

* `join-room` — بازیکن وارد room می‌شود
* `leave-room` — بازیکن از room خارج می‌شود
* `start-game` — شروع بازی
* `sync-game-state` — بروزرسانی وضعیت بازی
* `end-game` — پایان بازی

---

### **Server → Client:**

* `players-updated` — بروزرسانی لیست بازیکنان
* `game-started` — بازی شروع شد
* `game-state-updated` — وضعیت بازی تغییر کرد
* `game-ended` — بازی پایان یافت

---

## 🚀 شروع اجرا:

```bash
# اگر npm install با خطا مواجه می‌شود:

# **Option A: نصب جداگانه پکیج‌ها**
npm install socket.io
npm install socket.io-client
npm install express
npm install cors

# **Option B: اضافه کردن دستی در Package.json**
# "dependencies": {
#   ...
#   "socket.io-client": "^4.7.2",
#   "cors": "^2.8.5"
# },
# "devDependencies": {
#   ...
#   "socket.io": "^4.7.2",
#   "express": "^4.18.2"
# }
# سپس اجرا کنید: npm install

# حالا هر دو server را اجرا کنید:
npm run dev:server  # Terminal 1
npm run dev:client   # Terminal 2
```

---

## 🧪 Testing:

در هر دو tab باز کنید:

```
http://localhost:8082
```

---

### Tab 1:

1. "Online Play"
2. نام: "Ali"
3. "Create Room"
4. کد Room را کپی کنید

---

### Tab 2:

1. "Online Play"
2. نام: "Bob"
3. کد را paste کنید
4. "Join Room"

---

✅ در هر دو tab باید مشاهده کنید:

* Player 1 و Player 2 در لیست بازیکنان هستند
* شمارنده **(2/4)** نمایش داده می‌شود
* دکمه **"🎮 Start Game"** فعال است

---

## 🔧 Troubleshooting:

---

### **"Cannot find module 'socket.io'"**

```bash
npm install socket.io
```

---

### **"Port 3001 already in use"**

```bash
# استفاده از port دیگر:
PORT=3002 npm run dev:server
```

---

### **Tabs sync نمی‌شوند**

موارد زیر را بررسی کنید:

* خطاهای Browser console (کلید F12)
* پیام‌های Server console
* وضعیت WebSocket connection

