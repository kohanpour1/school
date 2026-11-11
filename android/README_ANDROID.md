# اپ اندروید بشری — بیلد ریلیز برای کافه‌بازار

## مهم
امضای ریلیز با **keystore خودتان**. Secrets:
- KEYSTORE_BASE64
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD

Workflow: `.github/workflows/android-release.yml`

پروژه کامل Gradle را در Android Studio بسازید و `gradlew` را به ریشه ریپو اضافه کنید تا Action موفق شود.
