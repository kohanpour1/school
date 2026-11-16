@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo === سرور مدیریت کلاس بشری ۱.۶.۲ ===
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js یافت نشد. در حال تلاش برای نصب با winget...
  winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
  if errorlevel 1 (
    echo نصب خودکار ناموفق بود. لطفاً Node.js را از https://nodejs.org نصب کنید.
    pause
    exit /b 1
  )
  echo پس از نصب، این فایل را دوباره اجرا کنید.
  pause
  exit /b 0
)
if not exist node_modules (
  echo نصب وابستگی‌ها...
  call npm install --omit=dev
)
echo راه‌اندازی سرور و باز شدن صفحه وضعیت...
node server.js
pause
