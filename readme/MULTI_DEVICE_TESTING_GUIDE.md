# 🎮 راهنمای تست بازی روی چندین دستگاه
# 📱 Multi-Device Testing Guide

## 📋 فهرست | Table of Contents
1. [آماده‌سازی | Preparation](#آماده‌سازی)
2. [روش اول: تست روی لپ‌تاپ | Laptop Testing](#روش-اول-تست-روی-لپ‌تاپ)
3. [روش دوم: تست روی گوشی‌های موبایل | Mobile Phone Testing](#روش-دوم-تست-روی-گوشی‌های-موبایل)
4. [مشکل‌گیری | Troubleshooting](#مشکل‌گیری)

---

## آماده‌سازی | Preparation

### مرحله 1: IP آدرس لپ‌تاپ را پیدا کنید
### Step 1: Find Your Laptop's IP Address

**روی Windows:**
```powershell
ipconfig
```

دنبال **IPv4 Address** بگردید (مثلا: `192.168.1.100` یا `10.0.0.50`)
Look for **IPv4 Address** (e.g., `192.168.1.100` or `10.0.0.50`)

### مرحله 2: فایل‌های تنظیمات را ویرایش کنید
### Step 2: Edit Configuration Files

#### فایل `.env` (برای تست روی لپ‌تاپ)
```env
VITE_SOCKET_URL=http://localhost:3001
```

#### فایل `.env.mobile` (برای تست روی موبایل)
```env
VITE_SOCKET_URL=http://192.168.1.100:3001
```

⚠️ **مهم | IMPORTANT:** `192.168.1.100` را با IP واقعی لپ‌تاپ خود جایگزین کنید!

---

## روش اول: تست روی لپ‌تاپ
## Method 1: Testing on Laptop

### مرحله 1: دو ترمینال باز کنید
Open two terminal windows:

**ترمینال 1 - سرور Socket.IO | Terminal 1 - Socket.IO Server:**
```bash
npm run dev:server
# یا | or
node server.js
```
✅ پیام زیر باید نمایش داده شود:
```
Socket.IO Server is running on port 3001
سرور Socket.IO در پورت 3001 اجرا می‌شود
```

**ترمینال 2 - سرور Vite | Terminal 2 - Vite Server:**
```bash
npm run dev
# یا | or
npm run dev:client
```
✅ پیام زیر باید نمایش داده شود:
```
VITE v... ready in ... ms

➜  Local:   http://localhost:8080/
```

### مرحله 2: بازی را باز کنید
Open your game in the browser:

```
http://localhost:8080
```

✨ اکنون می‌توانید بازی را روی لپ‌تاپ تست کنید!
✨ Now you can test the game on your laptop!

---

## روش دوم: تست روی گوشی‌های موبایل
## Method 2: Testing on Mobile Phones

### مرحله 1: مطمئن شوید گوشی در شبکه Wi-Fi برابر است
### Step 1: Make Sure Phone is on Same Wi-Fi Network

گوشی و لپ‌تاپ باید روی **یک شبکه Wi-Fi** متصل باشند!
Phone and laptop must be on the **same Wi-Fi network**!

### مرحله 2: سرورها را شروع کنید
### Step 2: Start Servers

همانند روش لپ‌تاپ، دو سرور را اجرا کنید:

**Terminal 1:**
```bash
npm run dev:server
```

**Terminal 2:**
```bash
npm run dev
```

### مرحله 3: بر روی گوشی، URL را وارد کنید
### Step 3: On Mobile Phone, Enter the URL

**به‌جای `localhost`، از IP لپ‌تاپ استفاده کنید:**

```
http://192.168.1.100:8080
```

⚠️ `192.168.1.100` را با IP واقعی لپ‌تاپ خود جایگزین کنید!

### مرحله 4: تست بازی آنلاین
### Step 4: Test Online Game

1. روی لپ‌تاپ، بر روی **"بازی آنلاین | Online Play"** کلیک کنید
2. روی گوشی، همینکار را انجام دهید
3. **Room ID** یکسان وارد کنید
4. بازی را شروع کنید! 🎮

**On laptop:** Click "بازی آنلاین | Online Play"
**On phone:** Do the same thing
**Enter the same Room ID**
**Start the game!** 🎮

---

## مشکل‌گیری | Troubleshooting

### مشکل 1: گوشی نمی‌تواند به سرور متصل شود
### Issue 1: Phone Cannot Connect to Server

**راه‌حل | Solution:**
- ✅ Laptop و گوشی روی یک Wi-Fi هستند؟
- ✅ Firewall اجازه می‌دهد؟ (اگر صحیح نیست، تست خود را فعال/غیرفعال کنید)
- ✅ IP آدرس درست است؟ `ipconfig` را دوباره بررسی کنید
- ✅ Port 3001 مسدود نیست؟ (Firewall تنظیمات بررسی کنید)

### مشکل 2: بازی بیش از حد آهسته است
### Issue 2: Game Lag

**راه‌حل | Solution:**
- Wi-Fi را نزدیک‌تر به router بکشید
- دستگاه‌های دیگری که Wi-Fi استفاده می‌کنند را خاموش کنید
- Router را restart کنید

### مشکل 3: صحبت چت کار نمی‌کند
### Issue 3: Chat Doesn't Work

**راه‌حل | Solution:**
- مطمئن شوید هر دو دستگاه بر روی یک Room ID وارد شده‌اند
- صفحه بازی را بارگذاری مجدد کنید (F5)
- Console را برای خطاها بررسی کنید (F12)

---

## 🎯 خلاصه | Summary

| دستگاه | URL | تنظیمات | Device | URL | Settings |
|--------|-----|---------|--------|-----|----------|
| لپ‌تاپ | `http://localhost:8080` | `.env` | Laptop | `http://localhost:8080` | `.env` |
| گوشی | `http://192.168.x.x:8080` | `.env.mobile` | Phone | `http://192.168.x.x:8080` | `.env.mobile` |

**مهم | Important:**
- سرور Socket.IO باید در هر دو تست اجرا شود
- Socket.IO Server must run in both tests
- گوشی و لپ‌تاپ باید در یک شبکه Wi-Fi باشند
- Phone and laptop must be on same Wi-Fi

---

## 📱 تست گروهی | Group Testing Example

**مریزم براي تست بازی چند نفره:**

1. **لپ‌تاپ (میزبان | Host):**
   - Room ID: `room-001` وارد کنید
   - "بازی آنلاین" را کلیک کنید

2. **گوشی 1:**
   - Room ID: `room-001` وارد کنید
   - "بازی آنلاین" را کلیک کنید

3. **گوشی 2:**
   - Room ID: `room-001` وارد کنید
   - "بازی آنلاین" را کلیک کنید

4. **شروع کردن:**
   - هنگام آماده شدن، "شروع بازی" را کلیک کنید ✨

---

✅ تمام مراحل انجام شد!
✅ All steps completed! حالا می‌توانید بازی را چند نفره تست کنید! 🎮
