# 🌐 Bilingual Logging & Multi-Tab Support Guide

## Overview | خلاصه

This guide explains the bilingual (English + Farsi) logging system and how each browser tab gets a unique player ID for online multiplayer testing.

این راهنما سیستم logging دو زبانه (انگلیسی + فارسی) و نحوه دریافت ID منحصربه‌فرد برای هر تب مرورگر را توضیح می‌دهد.

---

## 🎯 Features Implemented | ویژگی‌های پیاده‌شده

### 1. **Per-Tab Player ID (sessionStorage)**
Each browser tab gets a unique player ID that:
- ✅ Persists across page refreshes within the same tab
- ✅ Is stored in `sessionStorage` (not `localStorage`)
- ✅ Automatically generated as: `Date.now()-RandomNumber`

هر تب مرورگر یک ID منحصربه‌فرد دارد:
- ✅ بعد از refresh کردن صفحه در همان تب ثابت می‌ماند
- ✅ در `sessionStorage` ذخیره می‌شود (نه `localStorage`)
- ✅ خودکار تولید می‌شود: `Date.now()-RandomNumber`

### 2. **Bilingual Console Logging**
All system messages appear in both English and Farsi:

```
✅ [TAB-ID] New tab ID created | ID تب جدید ایجاد شد: 1737691234567-456789
🔌 [SOCKET] Connected to server | متصل به سرور: xyz123
👤 [PLAYER] Tab ID: 1737691234567-456789, Player ID: unique-id, Name: Ali
```

تمام پیام‌های سیستم به انگلیسی و فارسی ظاهر می‌شوند.

### 3. **Socket Server Bilingual Logging**
Server logs show which player (by Tab ID) joined which room:

```
👤 [JOIN-ROOM] Ali (Tab-ID: 1737691234567-456789) joining room game-123
   Socket ID: abc123 | نام: علی
📊 [PLAYERS] Room game-123 now has 2 players | تعداد بازیکنان: 2
```

---

## 📱 Testing with Multiple Tabs | تست با چندین تب

### Setup
1. **Start Dev Server**: `npm run dev` (runs on http://localhost:8082)
2. **Start Socket Server**: `node server.js` (runs on http://localhost:3001)
3. **Open DevTools Console**: F12 or Right-click → Inspect → Console tab

### Test Scenario | سناریوی تست

#### Tab 1: Alice
```bash
# In browser DevTools Console
sessionStorage.getItem('splendor_tab_player_id')
# Output: "1737691234567-111111"
```

#### Tab 2: Bob (New Tab)
```bash
# Open NEW browser tab to http://localhost:8082
# In browser DevTools Console (Tab 2)
sessionStorage.getItem('splendor_tab_player_id')
# Output: "1737691234568-222222"  ← Different from Tab 1!
```

#### Tab 2 Refresh (Same ID)
```bash
# Refresh the same tab (F5)
sessionStorage.getItem('splendor_tab_player_id')
# Output: "1737691234568-222222"  ← Still same, persists!
```

---

## 🔍 Console Log Examples | مثال‌های Console Log

### Client-Side Logs | لاگ‌های Client

```
✅ [TAB-ID] New tab ID created | ID تب جدید ایجاد شد: 1737691234567-111111
✅ [TAB-ID] Using existing tab ID | استفاده از ID تب موجود: 1737691234567-111111

🔌 [SOCKET] Connected to server | متصل به سرور: socket-xyz-123
👤 [PLAYER] Tab ID: 1737691234567-111111, Player ID: alice, Name: Alice

➡️  [JOIN-ROOM] Emitting join event | درخواست پیوستن به اتاق
   Room: game-room-1, Tab-ID: 1737691234567-111111, Player: alice, Name: Alice
✅ [JOIN-ROOM] Successfully emitted | با موفقیت ارسال شد

📡 [SYNC] Syncing game state | بروزرسانی وضعیت بازی
📤 [SYNC] Game state updated from server | وضعیت بازی بروزرسانی شد

🚀 [START-GAME] Starting game in room game-room-1 | شروع بازی
🎮 [GAME] Started in room game-room-1 | بازی شروع شد

💳 [CARD] Player 0 purchasing card 42 | خریداری کارت
🪙 [TOKEN] Player 0 taking 3 tokens | گرفتن سکه‌ها

🏁 [GAME] Ended in room game-room-1 | بازی پایان یافت
```

### Server-Side Logs | لاگ‌های Server

```
✅ [CONNECTION] Player connected | بازیکن متصل شد: socket-abc-123

👤 [JOIN-ROOM] Alice (Tab-ID: 1737691234567-111111) joining room game-room-1
   Socket ID: socket-abc-123 | نام: Alice
📊 [PLAYERS] Room game-room-1 now has 1 players | تعداد بازیکنان: 1

🎮 [START-GAME] Starting game in room game-room-1 | شروع بازی
✅ [START-GAME] Game started with 2 players | بازی آغاز شد

💳 [CARD] Card 42 purchased by player 0 (1737691234567-111111) | خریداری کارت
🪙 [TOKEN] Tokens ruby,emerald taken by player 0 (1737691234567-111111) | گرفتن سکه‌ها

💬 [CHAT] Room game-room-1 - Alice: Hello everyone!
🎤 [MIC] Microphone ON 🎤 for 1737691234567-111111 in room game-room-1 | میکروفون روشن

🏁 [END-GAME] Ending game in room game-room-1 | پایان بازی
✅ [END-GAME] Game ended | بازی پایان یافت

👋 [LEAVE-ROOM] Player 1737691234567-111111 leaving room game-room-1 | بازیکن ترک اتاق
🗑️  [CLEANUP] Room game-room-1 deleted (empty) | اتاق حذف شد

❌ [DISCONNECT] Player disconnected | قطع شده: socket-abc-123
```

---

## 🔧 Implementation Details | جزئیات پیاده‌سازی

### In `useOnlineGame_v2.ts`
```typescript
// Create unique player ID for this tab
function createTabPlayerId(): string {
  const key = 'splendor_tab_player_id';
  let id = sessionStorage.getItem(key);
  
  if (!id) {
    id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    sessionStorage.setItem(key, id);
    console.log(`✅ [TAB-ID] New tab ID created | ID تب جدید ایجاد شد: ${id}`);
  }
  return id;
}

// In joinRoom callback
const tabPlayerId = tabPlayerIdRef.current || createTabPlayerId();
socketRef.current.emit('join-room', {
  roomId,
  playerId: tabPlayerId,  // ← USE TAB-SPECIFIC ID
  playerName,
  playerCount,
  isHost: true,
});
```

### In `server.js`
```javascript
socket.on('join-room', (data) => {
  const { roomId, playerId, playerName, ... } = data;
  console.log(`👤 [JOIN-ROOM] ${playerName} (Tab-ID: ${playerId}) joining room ${roomId}`);
  
  // Map player by Tab ID (not socket ID)
  room.players.set(playerId, {
    id: playerId,
    name: playerName,
    socketId: socket.id,  // Different per connection
    connected: true,
    joinedAt: Date.now(),
  });
});
```

---

## 🎮 Chat Component Bilingual Support | پشتیبانی دو زبانه Chat

Chat component now shows messages in both languages:

```tsx
// Header
{language === 'fa' ? 'چت بازی' : 'Game Chat'}

// Placeholder
{lang === 'fa' ? 'پیام بنویسید...' : 'Type message...'}

// Send button
{lang === 'fa' ? 'ارسال' : 'Send'}
```

---

## ✅ Quick Checklist | لیست‌بررسی سریع

- [x] Each tab gets unique player ID via sessionStorage
- [x] Tab ID persists across page refresh
- [x] Tab ID changes when opening new tab
- [x] Client logs in English + Farsi
- [x] Server logs in English + Farsi
- [x] Chat UI bilingual (header, placeholder, buttons)
- [x] All socket events use Tab ID as playerId
- [x] Proper logging for each action (join, sync, cards, tokens, chat, etc.)

---

## 🧪 Testing Checklist | بررسی تست

1. Open Tab 1: http://localhost:8082
   - Check console: `sessionStorage.getItem('splendor_tab_player_id')`
   - Should see ID like `1737691234567-111111`

2. Open Tab 2: http://localhost:8082
   - Check console: `sessionStorage.getItem('splendor_tab_player_id')`
   - Should be DIFFERENT from Tab 1

3. Refresh Tab 1
   - Check console: Should see SAME ID as before refresh
   - Check server logs: Should see join-room with same Tab-ID

4. Test Chat
   - Send message from Tab 1
   - Should see in both Tab 1 and Tab 2 with bilingual UI

5. Test Multiplayer
   - Start game with 2 players (Tab 1 + Tab 2)
   - Verify server logs show both Tab-IDs
   - Take token action on Tab 1
   - Verify Tab 2 sees updated state
   - Check chat shows bilingual text

---

## 📝 FAQ

**Q: Why sessionStorage and not localStorage?**
A: sessionStorage is tab-isolated but persists across refreshes. localStorage would be shared across all tabs.

**Q: What if I want to test with incognito?**
A: Incognito tabs also have separate sessionStorage, so you can test 2 players with 1 normal + 1 incognito.

**Q: Can I see the socket.id in console?**
A: Yes! In client console: `document.querySelector('[data-socket-id]')?.value` or check logs.

---

## 🚀 Next Steps | مراحل بعدی

1. Open two browser tabs
2. Make sure socket server is running: `node server.js`
3. Navigate to http://localhost:8082 in both tabs
4. Enter lobby → Create room → Start game
5. Check console for bilingual logs
6. Test game actions and chat
7. Verify socket server shows proper Tab-IDs

---

Good luck testing! 🎉 موفق باشید! 🎉
