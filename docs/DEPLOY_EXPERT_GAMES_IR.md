# استقرار Expert Games روی expert-games.ir

کد فعلی شامل کلاینت React/Vite و سرور Node.js/Socket.IO است. برای بازی آنلاین، سرور باید همیشه روشن باشد و دامنه با HTTPS به آن reverse proxy شود.

## معماری نهایی

```text
کاربر https://expert-games.ir
          │
          ▼
       Nginx :443
       ├── فایل‌های dist و React Router
       ├── /socket.io/  ──► Node.js :3001
       └── /auth, /users, /social, /groups, /health ──► Node.js :3001
```

`src/lib/socketConfig.ts` در حالت production مرورگر، خودکار از همان origin استفاده می‌کند؛ بنابراین Socket.IO و API روی `https://expert-games.ir` قرار می‌گیرند و نیازی به پورت عمومی 3001 نیست.

## پیش‌نیازهای VPS

- Ubuntu/Debian با IP عمومی ثابت
- Node.js 20 یا جدیدتر
- PostgreSQL
- Nginx و Certbot
- رکوردهای DNS نوع A برای `expert-games.ir` و `www.expert-games.ir` به IP VPS

## اجرای پیشنهادی

```bash
sudo mkdir -p /var/www/expert-games /etc/expert-games
sudo chown -R "$USER":"$USER" /var/www/expert-games
# سورس پروژه را در /var/www/expert-games قرار دهید
cd /var/www/expert-games
npm ci
cp .env.production.example /etc/expert-games/gemstone-guilds.env
nano /etc/expert-games/gemstone-guilds.env
npm run build
```

در فایل env مقدار `AUTH_SECRET`، `DATABASE_URL` و `CLIENT_ORIGINS` را واقعی کنید. مقدارهای `VITE_*` و secrets را در فایل public یا داخل `dist` قرار ندهید.

سپس Nginx و HTTPS:

```bash
sudo mkdir -p /var/www/certbot
# ابتدا گواهی را با روش standalone بگیرید؛ در این مرحله Nginx باید متوقف باشد.
sudo systemctl stop nginx
sudo certbot certonly --standalone -d expert-games.ir -d www.expert-games.ir
sudo systemctl start nginx
sudo cp deploy/nginx/expert-games.ir.conf /etc/nginx/sites-available/expert-games.ir
sudo ln -s /etc/nginx/sites-available/expert-games.ir /etc/nginx/sites-enabled/expert-games.ir
sudo nginx -t
sudo systemctl reload nginx
```

بعد از صدور گواهی، فایل Nginx باید با بخش HTTPS موجود در همین repo فعال باشد. اجرای سرور Node:

```bash
sudo cp deploy/systemd/gemstone-guilds.service /etc/systemd/system/gemstone-guilds.service
sudo systemctl daemon-reload
sudo systemctl enable --now gemstone-guilds
curl https://expert-games.ir/health
```

پاسخ health باید شبیه `{"ok":true,"service":"splendor-server"}` باشد. سپس در دو دستگاه وارد `https://expert-games.ir` شوید و ساخت/ورود به یک room را تست کنید.

## Android/iOS

برای build موبایل، آدرس عمومی Socket.IO را هنگام build بدهید:

```powershell
$env:VITE_SOCKET_URL = "https://expert-games.ir"
npm run build:mobile
npx cap sync android
```

برای اپ منتشرشده، `localhost` یا IP شبکهٔ داخلی نباید در build باقی بماند.
