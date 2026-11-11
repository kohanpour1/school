# سامانه مدیریت مدرسه بشری

مؤسسه آموزشی غیر دولتی بشری — حضور، نمره عددی، ایتا، همگام‌سازی چند موبایل

## ساختار

```
web/                 رابط کاربری وب + نسخه ادمین
server/              سرور Node برای همگام‌سازی چنددستگاهی
android/             اسکلت اپ اندروید (WebView)
.github/workflows/   بیلد Release اندروید
```

## اجرای سریع با همگام‌سازی چند موبایل

```bash
cd server
npm install
npm start
```

مرورگر / موبایل: http://localhost:3847  
ورود با همان حساب روی چند دستگاه → داده مشترک روی سرور.

### حساب‌ها
| کاربر | رمز | نقش |
|--------|------|------|
| admin | admin123 | مدیر سامانه |
| modir | modir123 | مدیر (مشاهده) |
| moaven | m123 | معاون (مشاهده) |
| teacher1 | t123 | معلم (ثبت) |

### استقرار سرور (اینترنت)
- Render / Railway / VPS: `node server/server.js` با `PORT`
- در صفحه ورود می‌توانید آدرس عمومی سرور را وارد کنید
- پوشه Drive: https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx

## اندروید / کافه‌بازار
- اسکلت در `android/`
- Workflow ریلیز: `.github/workflows/android-release.yml`
- APK امضاشده نیاز به keystore در GitHub Secrets دارد

## قابلیت‌ها
نمره عددی، معدل نوبت‌ها، کسر غیبت، مثبت/منفی، عکس دانش‌آموز، اعلان ایتا، جلسات، اکسل، نقش‌ها، همگام‌سازی سرور
