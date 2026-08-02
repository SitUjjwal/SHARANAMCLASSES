# Docs index

| Section | Description |
| --- | --- |
| [Architecture overview](architecture/overview.md) | System context & trust boundaries |
| [Folder structure](architecture/folder-structure.md) | Naming & layering rules |
| [API conventions](api/conventions.md) | Response envelope, auth, versioning |
| [Catalog API](api/catalog.md) | Courses, chapters, categories (flat REST) |
| [Videos API](api/videos.md) | YouTube video management (URL-only storage) |
| [Test Series API](api/tests.md) | Chapter / subject / mock / previous-year / daily quiz |
| [Tests API map](api/tests-api-map.md) | Canonical: /tests CRUD, /submit-test, /results, /leaderboard |
| [Questions API](api/questions.md) | MCQ bank, marks, Excel bulk import |
| [Test Screen API](api/test-screen.md) | Student attempt UI: timer, palette, auto-save |
| [Timer](api/timer.md) | Reusable countdown: pause, low-time warning, auto-submit |
| [Test Results](api/test-results.md) | Score, pass/fail, chart, review answers |
| [Review Screen](api/test-review.md) | Selected vs correct, explanation, green/red |
| [Leaderboard](api/leaderboard.md) | Top 100: rank, score, %, time; course/test/date filters |
| [Analytics](api/analytics.md) | Avg score, pass %, strong/weak subjects, charts |
| [FCM / Push notifications](api/notifications-fcm.md) | Device tokens, permission, foreground/background/killed |
| [Notification Service](api/notification-service.md) | Save, audience fan-out, FCM send, delivery status |
| [Notification Center](api/notification-center.md) | Inbox, unread badge, mark read, delete, pagination |
| [Banner Management](api/banner-management.md) | Admin CRUD, image upload, typed redirects, sort, enable |
| [Announcements](api/announcements.md) | Home notices: rich text, image, schedule, pin |
| [Deep linking](../apps/mobile/docs/deep-linking.md) | Notification / banner tap → Course, Live, Test, Announcement |
| [Notification Dashboard](api/notification-dashboard.md) | Admin KPIs: delivered, opened, failed, click rate, export |
| [Payments API](api/payments.md) | Razorpay create order + verify signature |
| [Payment verification](api/payment-verification.md) | Signature → store → purchased_courses → unlock |
| [Purchase History](api/purchase-history.md) | History list + download receipt |
| [Buy Course flow](guides/buy-course-payment-flow.md) | Mobile checkout UI + payment sequence |
| [My Courses](guides/my-courses.md) | Owned courses, progress, Continue Learning |
| [Local development](guides/local-development.md) | Setup steps |
| [Test Series testing checklist](guides/test-series-testing-checklist.md) | Admin / student / analytics / code smoke |
| [Module 3 — Home & courses](guides/module-3-home-courses.md) | Mobile home, course list, chapters, admin |
| [ADRs](adr/) | Architecture decision records |
