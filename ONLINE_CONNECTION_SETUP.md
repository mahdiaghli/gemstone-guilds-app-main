# 🌐 Online Connection Setup Guide | راهنمای تنظیم اتصال آنلاین

## Your Setup
- **Laptop IP**: `192.168.254.3`
- **Subnet**: `192.168.254.0/24`
- **Gateway**: `192.168.254.1`
- **Port**: `3001`

---

## ✅ Step-by-Step Setup

### **Step 1: Start the Server**

On your laptop, open Terminal/PowerShell:

```bash
npm run dev:server
```

You should see:
```
🎮 [SERVER] Splendor Server started!
📡 [CONNECT] Available connection URLs:
   • http://localhost:3001
   • http://127.0.0.1:3001
   • http://192.168.254.3:3001 (Local Network - Use for phone!)
✅ [READY] Server ready for connections
```

### **Step 2: Start the Client (Laptop)**

In another Terminal/PowerShell:

```bash
npm run dev
```

This runs on `http://localhost:3173` (or similar)

### **Step 3: Connect Mobile Phone**

**Important**: Mobile MUST be on same WiFi network!

#### Option A: Direct IP Entry (Recommended for Debugging)

On mobile browser, go to:
```
http://192.168.254.3:5173
```

Then click **"🌐 Online Play"** to start a room.

#### Option B: Using .env Configuration

Edit `.env` file (already set to your IP):
```dotenv
VITE_SOCKET_URL=http://192.168.254.3:3001
```

Then rebuild:
```bash
npm run build
```

### **Step 4: Test Connection**

**On Mobile Browser Console** (F12):

You should see logs like:
```
✅ [INIT] Starting Socket.IO Connection...
📍 Server URL: http://192.168.254.3:3001
✅ [CONNECTED] Socket successfully connected!
🔌 Socket ID: abc123xyz
📡 Transport: websocket
```

---

## 🔴 **Troubleshooting: "xhr poll error"**

### **Error Message in Console:**
```
❌ [CONNECTION ERROR]
📍 Server: http://192.168.254.3:3001
❌ Error: xhr poll error
```

### **Solution Checklist:**

1. **Check Server is Running**
   ```bash
   # Should see: "Server ready for connections"
   npm run dev:server
   ```

2. **Verify WiFi Connection**
   - Both laptop and phone on same WiFi
   - Check laptop for `192.168.254.3` IP
   - Mobile should be in `192.168.254.x` range

3. **Test URL in Mobile Browser**
   ```
   http://192.168.254.3:3001
   ```
   Should show JSON response:
   ```json
   {"message":"Socket.IO Server Running","port":3001}
   ```

4. **Check Windows Firewall**
   ```powershell
   # Allow port 3001
   netsh advfirewall firewall add rule name="Socket.IO Server 3001" dir=in action=allow protocol=tcp localport=3001
   ```

5. **Verify No VPN/Proxy**
   - Disable any VPN on mobile
   - Check no proxy is set

6. **Restart Everything**
   ```bash
   # Kill all node servers
   Get-Process node | Stop-Process
   
   # Restart
   npm run dev:server
   npm run dev
   ```

---

## 📊 **Monitor Connection in Real-Time**

### **On Laptop (Dev Console)**
Open DevTools (F12) → Console Tab

You'll see logs like:
```
🔌 [INIT] Starting Socket.IO Connection...
✅ [CONNECTED] Socket successfully connected!
👥 [PLAYERS] Updated in room P1OQX0 | بازیکنان بروزرسانی: 2
🎮 [GAME] Started in room P1OQX0 | بازی شروع شد
```

### **On Mobile (Log Panel)**
In-game:
1. Click `📊 Logs (X)` button (bottom right)
2. Expand the panel to see all messages
3. Copy logs if needed for debugging

---

## 🎯 **Typical Connection Flow**

```
Mobile Opens Game
    ↓
Console: "🔌 [INIT] Starting Socket.IO Connection..."
    ↓
Connecting... (may try websocket first, fallback to polling)
    ↓
✅ "🔌 Socket ID: abc123xyz"
    ↓
"📍 Server URL: http://192.168.254.3:3001"
    ↓
"📡 Transport: websocket" (or "polling" if WebSocket fails)
    ↓
"👥 [PLAYERS] Updated in room..." 
    ↓
✅ Connected! Ready to Play
```

---

## 🔍 **Advanced Debugging**

### **Check Network in DevTools**

1. F12 → Network Tab
2. Look for connections to `192.168.254.3:3001`
3. Should see `EventSource` or `WebSocket` connection

### **Monitor Server**

Watch server logs for each action:
```
[CONNECTION] Player connected | Socket ID: abc123
[JOIN-ROOM] Player joining room P1OQX0
[PLAYERS] Room P1OQX0 now has 2 players
[START-GAME] Game starting...
[SYNC] Game state synced
```

---

## ❌ **Common Issues**

| Issue | Cause | Fix |
|-------|-------|-----|
| `xhr poll error` | Server not running | Run `npm run dev:server` |
| `xhr poll error` | Wrong IP | Use `192.168.254.3:3001` |
| `xhr poll error` | Different WiFi | Connect to same WiFi |
| `xhr poll error` | Firewall blocked | Allow port 3001 in firewall |
| Connection hangs | Slow network | Wait longer, check signal |
| Reconnects repeatedly | Unstable WiFi | Move closer to router |

---

## 📱 **Mobile Phone Checklist**

- [ ] On same WiFi as laptop
- [ ] WiFi is 2.4GHz (not 5GHz only)
- [ ] No VPN enabled
- [ ] Browser cache cleared (optional)
- [ ] Can ping laptop: `ping 192.168.254.3`
- [ ] Can open `http://192.168.254.3:3001` in browser
- [ ] Server shows "Player connected" message

---

## 🚀 **Quick Start Command**

```bash
# Terminal 1: Start Server
npm run dev:server

# Terminal 2: Start Client
npm run dev

# Mobile: Visit
http://192.168.254.3:5173
```

---

## 💡 **Tips**

1. **Keep terminal windows open** - You'll see real-time logs
2. **Check logs on both ends** - Laptop AND mobile should show success
3. **Use LogPanel** - Always check the in-game log panel for errors
4. **Network is critical** - 90% of issues are network-related
5. **Restart if unsure** - Stop servers, restart, try again

---

## 📞 **Need Help?**

1. Check LogPanel in game (📊 Logs button)
2. Check browser console (F12)
3. Check server terminal for connection logs
4. Verify IP configuration matches `192.168.254.3`
5. Test URL directly in mobile browser first

Good luck! 🎮
