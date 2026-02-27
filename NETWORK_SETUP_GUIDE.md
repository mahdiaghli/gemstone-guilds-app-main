# 🌐 Network & Matchmaking Setup Guide

## ⚠️ Your Current Issue

You ran the command in **CMD** (`C:\Windows\system32>`), but PowerShell cmdlets only work in **PowerShell**.

### ✅ Fix: Open PowerShell Properly

1. **Press:** `Windows Key + X`
2. **Select:** `Windows PowerShell (Admin)` ⭐ *Make sure it says "Admin"*
3. **Paste the command:**
   ```powershell
   New-NetFirewallRule -DisplayName "Socket.IO Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   ```

---

## 🎯 Complete Setup Checklist

### Step 1: Open PowerShell as Administrator ⭐ CRITICAL

```
Windows Key + X → Windows PowerShell (Admin)
```

**You should see:** `PS C:\Windows\system32>` (NOT `C:\Windows\system32>`)

---

### Step 2: Allow Firewall (In PowerShell Admin)

```powershell
New-NetFirewallRule -DisplayName "Socket.IO Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

**Expected Output:**
```
True
```

---

### Step 3: Find Your Laptop's IP Address

**In PowerShell (any terminal):**
```powershell
ipconfig
```

**Look for:**
```
Ethernet adapter / WiFi adapter:
  IPv4 Address . . . . . . . . . . . : 192.168.x.x
```

**Save this IP** (e.g., `192.168.254.3`)

---

### Step 4: Start the Socket.IO Server

**In a new PowerShell terminal:**
```powershell
npm run dev:server
```

**You should see:**
```
🎮 [SERVER] Splendor Server running on http://localhost:3001
📡 [SERVER] سرور Splendor در حال کار است

📱 [MOBILE] For mobile/remote connection, use your laptop IP:
   http://YOUR_LAPTOP_IP:3001

💡 [TIP] Find your IP: Run 'ipconfig' and look for IPv4 Address
```

**Keep this terminal OPEN** ✅

---

### Step 5: Start Your React Dev Server

**In another PowerShell terminal:**
```powershell
npm run dev
```

**You should see:**
```
Local:   http://localhost:5173/
```

---

## 🔌 Network Connection Test

### Test 1: From Your Laptop
1. Open browser: `http://localhost:5173/`
2. Click **Play Online** → **Find Match**
3. Enter name and search

**Expected:** Should work fine (no connection errors)

### Test 2: From Your Phone
1. **Make sure:** Phone is on same WiFi as laptop ✅
2. **Open phone browser:**
   ```
   http://YOUR_LAPTOP_IP:5173/
   ```
   (Replace `YOUR_LAPTOP_IP` with actual IP from `ipconfig`)

3. Click **Play Online** → **Find Match**
4. Select player count and enter name
5. **Look at laptop server logs** - should show:
   ```
   ✅ [CONNECTION] Player connected
   📱 Client address: 192.168.x.x
   ```

---

## ❌ Troubleshooting Common Errors

### Error: "Failed to connect to matchmaking server"

**Cause:** Phone can't reach laptop socket server

**Fix:**
1. Verify server is running: `npm run dev:server` ✅
2. Check your IP with `ipconfig` ✅
3. Test in phone browser:
   ```
   http://YOUR_LAPTOP_IP:3001
   ```
   (Should show JSON response)
4. Check Windows Firewall allowed port 3001 ✅

---

### Error: "'New-NetFirewallRule' is not recognized"

**Cause:** You're in CMD instead of PowerShell

**Fix:**
- Press `Windows Key + X`
- Select `Windows PowerShell (Admin)` ⭐
- Then run the command

---

### Error: "Cannot find module 'socket.io-client'"

**Cause:** Dependencies not installed

**Fix:**
```powershell
npm install
npm install socket.io-client
```

---

### Error: TransportError (repeated in logs)

**Cause:** Phone can't reach socket server IP

**Fix:**
1. Double-check laptop IP with `ipconfig`
2. Verify phone and laptop on **same WiFi**
3. Test direct connection:
   ```
   http://YOUR_LAPTOP_IP:3001
   ```
   in phone browser
4. Check firewall allows port 3001

---

## 📋 Server Logs Explained

### ✅ Good Connection
```
✅ [CONNECTION] Player connected | بازیکن متصل شد: abc123
📱 Client address: 192.168.1.105
🌍 Headers: { agent: 'Mozilla..', origin: 'http://192.168.1.50:5173' }
```

### ❌ Bad Connection (Never Reaches Server)
Phone shows error but **nothing appears in server logs**
- Means: Phone can't even reach the IP address
- Check: Firewall, WiFi, IP address

---

## 📱 Client Logs in Browser (Log Panel)

### Expected Log Sequence (Good Connection)

**When page loads:**
```
🔌 [INIT] Connecting to socket server...
serverUrl: http://192.168.254.3:3001
```

**When socket connects:**
```
✅ [CONNECTED] Socket connected successfully!
socketId: abc123xyz
transport: websocket
```

**When searching for match:**
```
🔍 [MATCHMAKING] Starting search
playerName: YourName
playerCount: 2
socketId: abc123xyz
```

**Server processing:**
```
⏳ [WAITING] Searching for 2-player game
currentPlayers: 1/2
```

**When match found:**
```
🎉 [MATCH FOUND] Transferring to game room!
roomId: MM-ABC123
players: 2
```

### ❌ Problem Logs (Bad Connection)

**If firewall blocked:**
```
❌ [CONNECTION ERROR] TransportError
type: TransportError
cause: Server unreachable
```
→ Check Windows Firewall allows port 3001

**If wrong IP:**
```
❌ [CONNECTION ERROR] TransportError
message: Connection timeout
```
→ Check laptop IP with `ipconfig`

**If server not running:**
```
❌ [CONNECTION ERROR] TransportError  (repeated many times)
```
→ Start server with `npm run dev:server`

**If using wrong WiFi:**
```
❌ [CONNECTION ERROR] TransportError
```
→ Verify phone and laptop on same WiFi network

---

## 🎮 How Matchmaking Works

1. **Player A** opens app on phone, enters name, clicks "Find Match" for 2 players
   - Server adds to `2-player queue`
   
2. **Player B** opens app on laptop, enters name, clicks "Find Match" for 2 players
   - Server adds to `2-player queue`

3. **Server sees:** 2 players waiting for 2-player game = **MATCH FOUND!**
   - Creates room: `MM-ABC123`
   - Sends both players: `match-found` event
   
4. **Both players** automatically redirect to game
   - They join room `MM-ABC123`
   - Game starts with both players

---

## 🔧 Terminal Windows Setup

You should have **3-4 terminals running:**

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `npm run dev:server` | Socket.IO server (keeps port 3001 open) |
| 2 | `npm run dev` | React dev server (keeps port 5173 open) |
| 3 | Phone browser | Opens app at `http://YOUR_IP:5173/` |
| 4 | Monitor logs | Watch server logs for connections |

---

## ✅ Quick Setup Command Sequence

```powershell
# Open PowerShell as Admin (Windows Key + X)

# Add firewall rule
New-NetFirewallRule -DisplayName "Socket.IO Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Find your IP
ipconfig

# Terminal 1: Start socket server
npm run dev:server

# Terminal 2: Start React app
npm run dev

# Phone: Open browser and navigate to
http://YOUR_LAPTOP_IP:5173/
```

---

## 📱 Device Requirements

- ✅ Phone and laptop on **same WiFi network**
- ✅ Laptop firewall **allows port 3001**
- ✅ Socket.IO server **running** (`npm run dev:server`)
- ✅ React dev server **running** (`npm run dev`)
- ✅ Correct **IP address** used in phone browser

---

## 🆘 Still Not Working?

### ❌ Your Specific Issue (TransportError)

**You're seeing:**
```
❌ [CONNECTION ERROR] TransportError (repeated many times)
Failed to connect to matchmaking server.
```

**What this means:**
Your phone **cannot reach** the socket server on your laptop.

**Causes (in order of likelihood):**
1. ❌ **Server not running** - `npm run dev:server` not started
2. ❌ **Wrong IP address** - Using 192.168.254.3 but laptop has different IP
3. ❌ **Different WiFi networks** - Phone on WiFi, laptop on ethernet (or different WiFi)
4. ❌ **Firewall blocking port 3001** - Even with rule added, might still be blocked
5. ❌ **Firewall software** - Third-party firewall (not Windows Firewall) blocking connection

### 🔍 Debugging Steps (In Order)

**Step 1: Verify Server is Running**
```powershell
npm run dev:server
```
Should show:
```
🎮 [SERVER] Splendor Server running on http://localhost:3001
```
✅ If you see this, server is running
❌ If you don't, start it and wait 5 seconds

**Step 2: Get Correct Laptop IP**
```powershell
ipconfig
```
Look for all IPv4 addresses:
```
Ethernet adapter:
  IPv4 Address: 192.168.1.X

WiFi adapter:
  IPv4 Address: 192.168.1.Y
```
**Use the IP matching your connection method** (WiFi or Ethernet)

**Step 3: Test Direct Connection from Phone**
1. Get a phone
2. Make sure it's on **same WiFi** as laptop
3. Open phone browser and go to:
   ```
   http://YOUR_LAPTOP_IP:3001
   ```
   (Replace IP from Step 2)

4. **Expected result:** Should see JSON response:
   ```json
   {"message":"Socket.IO Server Running", "port":3001}
   ```

**If you see this:**
✅ Network connection is working
→ Problem is somewhere else in the code

**If you DON'T see this:**
❌ Network is blocked
→ Check firewall and WiFi

**Step 4: Check Windows Firewall Again**
Open **Windows Defender Firewall**:
- Settings → Privacy & Security → Windows Security → Firewall
- Click "Allow an app through firewall"
- Look for app with port **3001**
- Make sure it's checked for **Private** (and **Public** if needed)

**Step 5: Try Alternate Firewall Command**
```powershell
# Delete old rule
Remove-NetFirewallRule -DisplayName "Socket.IO Port 3001"

# Add new rule
New-NetFirewallRule -DisplayName "Socket.IO Port 3001" -Direction Inbound -LocalPort 3001 -Protocol Both -Action Allow -Profile Any
```

**Step 6: Check Antivirus**
Third-party antivirus (McAfee, Norton, etc.) might block port 3001.
- Check your antivirus settings
- Temporarily disable and test
- If it works, add exception for port 3001

1. **Check server logs** - Does it show connection from phone?
2. **Test IP directly** - `http://YOUR_IP:3001` in phone browser
3. **Restart everything** - Kill terminals and start fresh
4. **Check Windows Firewall** - Settings → Firewall → Allow app → Port 3001
5. **Try wired connection** - If WiFi issues, use USB tethering

---

## 📝 Variables to Remember

- **Laptop Socket Server:** `http://localhost:3001` (laptop only)
- **Remote Socket Server:** `http://YOUR_LAPTOP_IP:3001` (phone)
- **React App:** `http://localhost:5173` (laptop) or `http://YOUR_LAPTOP_IP:5173` (phone)
- **Matchmaking Queue:** In-memory on socket server
- **Game Rooms:** Created dynamically (ID format: `MM-XXXXXX`)

---

## 🎯 Expected Behavior

### Step 1: Both players connect
- Server logs show: `✅ [CONNECTION]` from both

### Step 2: Both search for same player count
- Server logs show: `🔍 [MATCHMAKING]` for both
- Logs show: `📊 [MATCHMAKING] Queue for 2-player games: 2 player(s)`

### Step 3: Match found
- Server logs show: `🎮 [MATCHMAKING] Match found! 2 players in room MM-XXXXX`
- Both phones get: `match-found` event
- Both redirect to `/online-game/MM-XXXXX`

### Step 4: Players join room
- Server logs show: `👤 [JOIN-ROOM]` for both players
- Game starts automatically

---

## 💡 Pro Tips

- **Multiple windows:** Open player A and player B in laptop + phone for testing
- **Check logs:** Server logs are your best friend - watch them closely
- **Firewall issues?** Try disabling firewall temporarily (just for testing)
- **Wrong IP?** Most issues are caused by wrong IP address in phone browser

---

## 🚀 اگر روش IP محلی کار نمی‌کنه؟

اگر `TransportError` رو دیدی و گوشی نمی‌تونه سرور رو پیدا کنه، این روش‌ها رو امتحان کن:

### **روش 1: Ngrok (بهترین)**
```powershell
npm install -g ngrok
ngrok http 3001
# کپی کن: https://xxxxx.ngrok.io
```
سپس `.env`:
```env
VITE_SOCKET_URL=https://xxxxx.ngrok.io
```

### **روش 2: CloudFlare Tunnel (رایگان)**
```powershell
cloudflared tunnel --url http://localhost:3001
```

### **روش 3: دو تب مرورگر روی لبتاپ**
- Tab 1: `http://localhost:5173` (بازیکن 1)
- Tab 2: `http://localhost:5173` (بازیکن 2)
- هر دو "Find Match" رو کلیک کنند

📖 **مراجعه کن به:** `ALTERNATIVE_TESTING_METHODS.md` برای تفاصیل کامل!
