# ساخت اپ موبایل

تنظیمات Capacitor در [capacitor.config.ts](capacitor.config.ts) قرار دارد و آیکن از `src/assets/logo.webp` ساخته شده است. فایل `.env.mobile` عمداً در مخزن وجود ندارد؛ آدرس سرور را فقط هنگام build به‌صورت متغیر محیطی بدهید:

```bash
VITE_SOCKET_URL=https://YOUR_PUBLIC_SERVER_IP npm run build:mobile
npx cap sync android
npx cap open android
```

در PowerShell ویندوز:

```powershell
$env:VITE_SOCKET_URL = "https://YOUR_PUBLIC_SERVER_IP"
npm run build:mobile
npx cap sync android
```

سپس در Android Studio از مسیر `Build > Generate Signed App Bundle / APK` خروجی امضاشده بگیرید. آیکن‌های Android در `android/app/src/main/res/mipmap-*` و مجموعهٔ iOS در `ios/App/App/Assets.xcassets/AppIcon.appiconset` تولید شده‌اند. قبل از انتشار، `YOUR_PUBLIC_SERVER_IP` باید HTTPS واقعی و قابل دسترسی از اینترنت باشد؛ آدرس‌های `localhost` و LAN توسط build موبایل رد می‌شوند.
