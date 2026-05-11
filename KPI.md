# Gemstone Guilds - Key Performance Indicators (KPIs)

**Last Updated:** May 2, 2026  
**Project:** Gemstone Guilds Multiplayer Card Game Platform

---

## Overview

This document defines the key performance indicators to measure the success and health of the Gemstone Guilds platform across user engagement, technical performance, monetization, and quality metrics.

---

## 1. User Engagement KPIs

### 1.1 Daily Active Users (DAU)
- **Target:** 500+ DAU within 3 months of public launch
- **Measurement:** Unique users who log in and play at least one game per day
- **Acceptance Criteria:**
  - Track via authentication system
  - Exclude test accounts
  - Minimum 1 game session per user per day

### 1.2 Weekly Active Users (WAU)
- **Target:** 1,500+ WAU within 3 months
- **Measurement:** Unique users with at least one session per week
- **Acceptance Criteria:**
  - Track via session management
  - Include all game modes

### 1.3 Monthly Active Users (MAU)
- **Target:** 3,000+ MAU within 6 months
- **Measurement:** Unique users with at least one session per month
- **Acceptance Criteria:**
  - Track via authentication logs
  - Monitor growth rate (target: 15% MoM growth)

### 1.4 Average Session Duration
- **Target:** 15+ minutes per session
- **Measurement:** Time from login to logout (or idle timeout)
- **Acceptance Criteria:**
  - Include all game modes and activities
  - Exclude idle sessions > 30 minutes

### 1.5 Session Frequency per User
- **Target:** 3+ sessions per week per active user
- **Measurement:** Average number of sessions per DAU
- **Acceptance Criteria:**
  - Count both multiplayer and single-player sessions
  - Track seasonality patterns

---

## 2. Game Performance KPIs

### 2.1 Game Completion Rate
- **Target:** 85%+ completion rate for started games
- **Measurement:** % of games played to completion vs. abandoned games
- **Acceptance Criteria:**
  - Track per game mode (Splendor, Dead Man's Draw, Challenges)
  - Exclude disconnected sessions

### 2.2 Win Rate Distribution (Single Player)
- **Target:** 40-60% win rate against AI across difficulty levels
- **Measurement:** Player victories vs. total games played
- **Acceptance Criteria:**
  - Track by difficulty level (Easy, Medium, Hard)
  - Ensure consistent AI challenge

### 2.3 Multiplayer Match Success Rate
- **Target:** 95%+ successful match completions
- **Measurement:** % of multiplayer games completed without critical errors
- **Acceptance Criteria:**
  - Track disconnections and re-connections
  - Log sync failures
  - Measure network latency impact

### 2.4 Average Game Duration by Mode
- **Splendor:**
  - **Target:** 8-12 minutes per game
  - **Measurement:** Time from game start to end
  
- **Dead Man's Draw:**
  - **Target:** 5-8 minutes per game
  - **Measurement:** Time from game start to end

---

## 3. Monetization KPIs

### 3.1 Average Revenue Per User (ARPU)
- **Target:** $2-5 per active user per month
- **Measurement:** Total monthly revenue / MAU
- **Acceptance Criteria:**
  - Include cosmetics shop revenue
  - Include premium currency sales
  - Track by user cohort

### 3.2 Conversion Rate (F2P to Paying)
- **Target:** 5-10% conversion rate
- **Measurement:** % of users who make at least one purchase
- **Acceptance Criteria:**
  - Track first-time purchase within 30 days
  - Segment by acquisition channel

### 3.3 Average Transaction Value (ATV)
- **Target:** $3-8 per transaction
- **Measurement:** Total revenue / total transactions
- **Acceptance Criteria:**
  - Include cosmetics and currency packs
  - Track bundle vs. individual purchases

### 3.4 Repeat Purchase Rate
- **Target:** 30%+ of paying users make repeat purchases
- **Measurement:** % of one-time buyers who purchase again within 60 days
- **Acceptance Criteria:**
  - Track by purchase type (cosmetics vs. currency)
  - Monitor seasonal trends

### 3.5 Churn Rate (Paying Users)
- **Target:** <10% monthly churn for paying users
- **Measurement:** % of paying users inactive in current month
- **Acceptance Criteria:**
  - Count users with no login for 30+ days
  - Investigate drop-off patterns

---

## 4. Social & Community KPIs

### 4.1 Friend List Adoption Rate
- **Target:** 60%+ of new users add at least 1 friend within 7 days
- **Measurement:** Users with ≥1 friend / total new users
- **Acceptance Criteria:**
  - Track friend invites and accepts
  - Measure by-date cohort

### 4.2 Guild/Group Participation
- **Target:** 40%+ of active users are members of a guild/group
- **Measurement:** Users in guilds / MAU
- **Acceptance Criteria:**
  - Track guild size distribution
  - Monitor group activity levels

### 4.3 Group Engagement Multiplier
- **Target:** Guild members have 2x higher session frequency
- **Measurement:** Session frequency (guild members) / (non-members)
- **Acceptance Criteria:**
  - Verify statistical significance
  - Track by guild size cohort

### 4.4 Social Feature Usage
- **Target:** 50%+ of users interact with friends in-game
- **Measurement:** % of users who play against friends or message friends
- **Acceptance Criteria:**
  - Track friend challenges
  - Log chat/message activity

---

## 5. Technical Performance KPIs

### 5.1 Application Uptime
- **Target:** 99.5%+ uptime
- **Measurement:** (Total Time - Downtime) / Total Time
- **Acceptance Criteria:**
  - Measured continuously via monitoring
  - Exclude planned maintenance windows

### 5.2 Page Load Time
- **Target:** <2 seconds for main pages, <1 second for game state
- **Measurement:** Time to interactive (TTI) for critical pages
- **Acceptance Criteria:**
  - Test on 4G network (simulated)
  - Include asset loading
  - Monitor Core Web Vitals (LCP, FID, CLS)

### 5.3 API Response Time
- **Target:** <200ms p95 for game state updates
- **Measurement:** Server response time for critical endpoints
- **Acceptance Criteria:**
  - Measure end-to-end from client to server
  - Track multiplayer sync latency

### 5.4 Error Rate
- **Target:** <0.5% of requests result in errors
- **Measurement:** Failed requests / total requests
- **Acceptance Criteria:**
  - Exclude client-side errors (network timeouts)
  - Log and categorize by endpoint

### 5.5 WebSocket Connection Stability
- **Target:** 99%+ successful Socket.io connections
- **Measurement:** Successful connections / connection attempts
- **Acceptance Criteria:**
  - Track reconnection success rate
  - Monitor across different network conditions

---

## 6. Quality & Reliability KPIs

### 6.1 Bug Report Rate
- **Target:** <2 bugs per 1,000 sessions
- **Measurement:** Critical + Major bugs reported / total sessions
- **Acceptance Criteria:**
  - Severity level: Critical + Major only
  - Report within 1 week of discovery

### 6.2 Test Coverage
- **Target:** 70%+ code coverage for game logic
- **Measurement:** Lines covered by tests / total lines (game logic)
- **Acceptance Criteria:**
  - Focus on core game mechanics
  - Exclude UI components from initial target

### 6.3 Crash Rate
- **Target:** <0.1% of sessions result in application crash
- **Measurement:** Sessions with unhandled exceptions / total sessions
- **Acceptance Criteria:**
  - Track browser-level crashes
  - Report stack traces and affected users

### 6.4 Mean Time to Recovery (MTTR)
- **Target:** <30 minutes for critical production issues
- **Measurement:** Time from incident detection to resolution
- **Acceptance Criteria:**
  - Critical incidents only
  - Document resolution steps
  - Post-incident review

---

## 7. User Acquisition & Retention KPIs

### 7.1 Day 1 Retention (D1)
- **Target:** 40%+ users return after 1 day
- **Measurement:** % of day-1 cohort active on day 2
- **Acceptance Criteria:**
  - Track new user cohorts daily
  - Measure 24-48 hour window

### 7.2 Day 7 Retention (D7)
- **Target:** 20%+ users return after 1 week
- **Measurement:** % of day-1 cohort active on day 8
- **Acceptance Criteria:**
  - Track new user cohorts weekly
  - Segment by acquisition channel

### 7.3 Day 30 Retention (D30)
- **Target:** 10%+ users remain active after 30 days
- **Measurement:** % of day-1 cohort active on day 31
- **Acceptance Criteria:**
  - Measure across all platforms
  - Compare to industry benchmarks (5-10%)

### 7.4 Viral Coefficient
- **Target:** 0.3+ (each user brings 0.3 new users)
- **Measurement:** Invites sent × conversion rate
- **Acceptance Criteria:**
  - Track referral links
  - Monitor organic growth contribution

---

## 8. Language & Internationalization KPIs

### 8.1 non-English User Adoption
- **Target:** 30%+ of DAU use Persian/non-English language
- **Measurement:** Sessions in non-English / total sessions
- **Acceptance Criteria:**
  - Track language selection per user
  - Monitor localization quality feedback

### 8.2 Localization Quality
- **Target:** <2% of users report translation issues
- **Measurement:** Bug reports related to translations / MAU
- **Acceptance Criteria:**
  - Gather feedback via in-app surveys
  - Fast-track fixes for critical issues

---

## 9. Mobile Responsiveness KPIs

### 9.1 Mobile Traffic Percentage
- **Target:** 50%+ of traffic from mobile devices
- **Measurement:** Mobile visits / total visits
- **Acceptance Criteria:**
  - iOS and Android browsers
  - Exclude app traffic (future)

### 9.2 Mobile Conversion Rate
- **Target:** 4-8% conversion (mobile) vs 6-10% (desktop)
- **Measurement:** Mobile transactions / mobile MAU
- **Acceptance Criteria:**
  - Compare to desktop baseline
  - Optimize for mobile UX

### 9.3 Mobile Bounce Rate
- **Target:** <50% bounce rate on mobile
- **Measurement:** Sessions that exit without purchase / total mobile sessions
- **Acceptance Criteria:**
  - Exclude tutorial completions
  - Track by acquisition source

---

## 10. Tutorial & Onboarding KPIs

### 10.1 Tutorial Completion Rate
- **Target:** 80%+ of new users complete tutorial
- **Measurement:** Users who finish tutorial / new users
- **Acceptance Criteria:**
  - Track full tutorial completion
  - Identify drop-off points

### 10.2 Time to First Game
- **Target:** <2 minutes from signup to first playable game
- **Measurement:** Time from account creation to game start
- **Acceptance Criteria:**
  - Exclude tutorial time
  - Measure for quick-start path

### 10.3 Onboarding Effectiveness
- **Target:** 70%+ of tutorial completers play 3+ games in week 1
- **Measurement:** Games played by week-1 cohort
- **Acceptance Criteria:**
  - Measure engagement correlation
  - Compare tutorials vs. no-tutorial experience

---

## Measurement & Reporting

### Reporting Cadence
- **Daily:** DAU, Session metrics, Error rates, Uptime
- **Weekly:** Engagement metrics, Conversion rates, Retention cohorts
- **Monthly:** MAU, ARPU, Churn, Overall health metrics
- **Quarterly:** Strategic KPI review, Goal adjustments

### Tools & Infrastructure
- **Analytics:** Google Analytics 4, Custom backend logging
- **Error Tracking:** Sentry or similar
- **Performance:** Web Vitals, Custom monitoring
- **A/B Testing:** Future platform for feature optimization

### Dashboard Access
- Real-time KPI dashboard available to core team
- Weekly digest reports to stakeholders
- Monthly strategy review with full leadership

---

## Success Criteria - First Milestones (6 Months)

- [ ] 500+ DAU achieved
- [ ] 85%+ game completion rate maintained
- [ ] 5%+ F2P to paying conversion
- [ ] 99.5%+ uptime maintained
- [ ] <2 second page load times
- [ ] 40%+ D1 retention on cohorts
- [ ] <0.1% crash rate
- [ ] 50%+ friend adoption rate

---

## Notes

- All KPIs should be reviewed and adjusted quarterly based on market feedback and competitive analysis
- Industry benchmarks for mobile games show 5-10% D30 retention; our target of 10%+ is ambitious but achievable with strong retention mechanics
- Social features are key differentiators; prioritize metrics that indicate community health


در حد همین مرحله‌ای که پروژه‌ات هست، یک **KPI ساده، متمرکز و عملی** برایت می‌نویسم که هم با صحبت‌های قبلی‌مان (فری‌تو‌پلی، چند بازی رایگان/پریمیوم، بازار ایران) جور باشد، هم با داکی که خودت نوشتی.

این را می‌توانی به‌عنوان «نسخه مینیمال KPI» برای ۳–۶ ماه اول لانچ استفاده کنی:

---

## Gemstone Guilds – MVP KPI Set (نسخه ساده و عملی برای ۶ ماه اول)

### 1. رشد و درگیری کاربر (User Engagement)

1. **Daily Active Users (DAU)**  
   - تعریف: تعداد یکتای کاربرانی که در یک روز حداقل **۱ بازی** انجام می‌دهند.  
   - هدف ۳ ماه اول:  
     - ماه ۱: حداقل ۵۰ DAU  
     - ماه ۲: حداقل ۲۰۰ DAU  
     - ماه ۳: حداقل **۵۰۰+ DAU**  
   - نکته مهم:  
     - فقط کاربرانی که واقعاً بازی می‌کنند؛ ورود بدون بازی شمرده نشود.

2. **Day 1 / Day 7 Retention (D1 / D7)**  
   - D1: درصد کاربرانی که روز بعد از نصب / ثبت‌نام، برمی‌گردند و بازی می‌کنند.  
   - D7: درصدی از همان کاربران که تا ۷ روز بعد حداقل ۱ بار برگردند.  
   - هدف:
     - D1 ≥ **۴۰٪**  
     - D7 ≥ **۲۰٪**  
   - اگر این دو پایین باشند، یعنی یا **بازی سخت فهمیده می‌شود** یا **زود خسته‌کننده است**.

3. **Average Session Duration**  
   - تعریف: میانگین زمانی که کاربر در یک جلسه داخل بازی است (از ورود تا خروج یا تایم‌اوت).  
   - هدف: **۱۰–۱۵ دقیقه**  
   - توضیح:  
     - اگر خیلی کم باشد (مثلا ۳ دقیقه)، یعنی یا سریع خسته می‌شوند یا مشکل فنی هست.  
     - اگر خیلی زیاد باشد، ممکن است بازی طولانی و خسته‌کننده باشد.

---

### 2. عملکرد بازی (Game Performance)

4. **Game Completion Rate**  
   - تعریف: درصد بازی‌هایی که از لحظه شروع، **به‌طور کامل تمام می‌شوند** (نه ترک می‌شود، نه کرش، نه دیسکانکت بدون برگشت).  
   - هدف: حداقل **۸۵٪**  
   - اگر زیر این عدد باشد، یعنی یا بازی طولانی/خسته‌کننده است، یا مشکل اتصال/باگ جدی داریم.

5. **Average Game Duration (به‌خصوص برای ۲ بازی اصلی)**  
   - Splendor (کهربا): هدف **۸–۱۲ دقیقه**  
   - Dead Man’s Draw (زیرخاکی): هدف **۵–۸ دقیقه**  
   - اگر از این بازه‌ها خیلی بیشتر شد، باید قوانین/انیمیشن‌ها/UX را برای سرعت بیشتر تنظیم کنی.

---

### 3. درآمد و مدل Free/Premium (Monetization & Unlocks)

6. **Conversion Rate (F2P → Paying)**  
   - تعریف: درصد کاربرانی که در ۳۰ روز اول، **حداقل یک خرید درون‌برنامه‌ای (IAP)** انجام می‌دهند.  
   - هدف در ۶ ماه اول: **۵٪ یا بیشتر**  
   - شامل:
     - خرید Gem / Coin  
     - خرید باز کردن بازی پریمیوم با پول واقعی (اگر پیاده‌سازی کنی).

7. **Gem Unlock Rate برای بازی‌های پولی/پریمیوم**  
   (مرتبط با ایده‌ات: چند بازی رایگان، چندتا قفل با جم/پول)  
   - تعریف: درصد کاربرانی که با **جم**، یک بازی پریمیوم را باز می‌کنند.  
   - هدف: حداقل **۱۰٪ از کاربران فعال** در ۶ ماه اول، حداقل یک بازی پریمیوم را با جم باز کرده باشند.  
   - این عدد کمک می‌کند بفهمی:
     - قیمت‌گذاری Gem معقول است یا خیلی سخت‌گیرانه.  
     - کاربر حاضر هست برای باز کردن بازی تلاش کند (grind) یا پول بدهد.

8. **Average Revenue Per Paying User (ARPPU)**  
   - تعریف: میانگین درآمد از **هر کاربر پرداخت‌کننده** (نه همه کاربرها).  
   - هدف: حداقل معادل **۱.۵–۳ دلار در ماه به تومان** برای هر کاربر پرداخت‌کننده.  
   - مثال:  
     - اگر ۱۰۰ نفر پرداخت‌کننده داری و در ماه ۱۰ میلیون تومان درآمد:  
       - ARPPU ≈ ۱۰۰,۰۰۰ تومان = حدود ۲ دلار (بسته به نرخ).

---

### 4. اجتماعی و نگه‌داشت (Social & Retention)

9. **Friend Adoption Rate**  
   - تعریف: درصد کاربران جدیدی که در ۷ روز اول، **حداقل ۱ نفر را به لیست دوستان‌شان اضافه می‌کنند** یا با دوست بازی می‌کنند.  
   - هدف: **۵۰٪+**  
   - چون بازی تو ذاتاً اجتماعی است، اگر این پایین باشد یعنی:
     - یا سیستم Friend پیچیده است  
     - یا کاربر نمی‌داند می‌شود با دوست بازی کرد.

10. **Guild/Group Participation**  
   - تعریف: درصد MAU که عضو یک گروه/گيلد هستند.  
   - هدف بعد از فعال شدن گروه‌ها: **حداقل ۳۰–۴۰٪**  
   - چون ساختن گروه ۱۰۰ جم هزینه دارد، باید ببینی:
     - آیا تعداد گروه‌ها و اعضا رشد می‌کند یا نه.  
     - اگر خیلی کم باشد، شاید هزینه ۱۰۰ جم زیاد است یا فیچر جذابیت کافی ندارد.

---

### 5. کیفیت فنی (Technical Quality)

11. **Crash Rate / Critical Error Rate**  
   - تعریف: درصد جلسه‌هایی که با **کرش یا ارور جدی** تمام می‌شوند.  
   - هدف: **کمتر از ۰.۱٪**  
   - هرچه این عدد بالاتر برود، retention و درآمد افت می‌کند.

12. **Application Uptime**  
   - تعریف: درصد زمانی که سرور و بازی بالا و قابل استفاده است.  
   - هدف: **۹۹.۵٪+**  
   - با هر داون‌تایم بزرگ، مستقیم روی اعتماد کاربر تاثیر منفی می‌گذارد.

---

### ۶. یک KPI ترکیبی خیلی مهم (اگر فقط یکی را بخواهی دنبال کنی)

اگر بخواهی فقط یک معیار «سلامت کلی» برای خودت داشته باشی که هم به رشد و هم به پول ربط دارد، این را پیشنهاد می‌کنم:

> **۶۰-Day LTV / CAC Ratio**  
>  
> - LTV (ارزش طول عمر ۶۰ روزه کاربر):  
>   میانگین درآمدی که از هر کاربر در ۶۰ روز اول می‌سازی.  
> - CAC (هزینه جذب کاربر):  
>   میانگین هزینه تبلیغ/مارکتینگ برای آوردن هر کاربر جدید.  
>  
> **هدف:**  
>  - LTV (60-day) ≥ **۳ × CAC**  
>  
> اگر LTV/CAC کوچک‌تر از ۱ باشد، یعنی هر کاربر برایت ضرر است.  
> اگر ۳ به بالا باشد، بازی از نظر مالی «مقیاس‌پذیر» می‌شود؛ یعنی اگر تبلیغ را زیاد کنی، هنوز سودده هستی.

(در مراحل اولیه که مارکتینگ کم است، می‌توانی CAC را خیلی ساده بگیری یا حتی نزدیک صفر و بیشتر روی LTV و Retention تمرکز کنی.)

---

### جمع‌بندی مختصر به زبان خودت

برای ۳–۶ ماه اول، اگر بخواهم KPIها را در یک خط جمع کنم:

- **DAU ≥ ۵۰۰**  
- **D1 ≥ ۴۰٪ ، D7 ≥ ۲۰٪**  
- **۸۵٪+ بازی‌ها تا انتها تمام شوند**  
- **۵٪+ از کاربران، حداقل یک خرید Gem/Coin یا Unlock انجام دهند**  
- **۲۰–۳۰٪ کاربران حداقل یک بازی پریمیوم را با جم یا پول باز کنند**  
- **۵۰٪ کاربرها در هفته اول با دوست یا در گروه/گيلد تعامل داشته باشند**  
- **کرش/ارور جدی < ۰.۱٪**  
- در بلندمدت: **LTV (۶۰ روز) حداقل ۳ برابر CAC**.

اگر دوست داشته باشی، در پیام بعدی می‌توانم این KPIها را تبدیل کنم به یک جدول خیلی کوتاه (مثلاً ۱۰ ردیف) که مستقیم بتوانی در Notion / Google Sheet وارد کنی و هر هفته تیک بزنی که وضعیت چطور است.