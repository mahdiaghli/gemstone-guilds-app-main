# Gemstone Guilds - Software Project Management Plan (SPMP)

**Document Version:** 1.0  
**Last Updated:** May 2, 2026  
**Project:** Gemstone Guilds Multiplayer Card Game Platform  
**Status:** Active Development

---

## 1. Project Overview

### 1.1 Project Title
Gemstone Guilds - Multiplayer Card Game Platform

### 1.2 Project Purpose
To develop and launch a web-based multiplayer card gaming platform featuring engaging turn-based games (Splendor, Dead Man's Draw) with real-time synchronization, social features, and sustainable monetization through cosmetics.

### 1.3 Project Goals
1. **Technical Excellence:** Build a scalable, well-architected platform with 99.5%+ uptime
2. **User Engagement:** Achieve 500+ DAU within 3 months of alpha launch
3. **Community Building:** Foster active community with 40%+ guild participation
4. **Revenue Generation:** Target $2-5 ARPU with 5-10% F2P conversion
5. **Quality Assurance:** Maintain <0.1% crash rate and 70%+ test coverage
6. **Accessibility:** Support English and Persian languages, mobile-responsive design

### 1.4 Success Criteria
- [ ] Public alpha launch by July 2026
- [ ] 50-100 DAU by August 2026
- [ ] 40%+ D1 retention achieved
- [ ] 99.5%+ uptime maintained
- [ ] Payment system processing transactions
- [ ] <0.5% error rate
- [ ] Community active (500+ Discord members)

---

## 2. Project Organization

### 2.1 Team Structure

#### Core Team (Current)
- **Product Owner/Manager:** 1 person
  - Responsibilities: Requirements, prioritization, stakeholder communication
  - Works 40 hours/week

- **Tech Lead/Senior Developer:** 1 person
  - Responsibilities: Architecture, code quality, technical decisions
  - Works 40 hours/week

- **Backend Developer(s):** 2 persons
  - Responsibilities: Server logic, APIs, WebSocket, database
  - Works 40 hours/week each

- **Frontend Developer(s):** 2 persons
  - Responsibilities: UI components, state management, client logic
  - Works 40 hours/week each

- **QA Engineer:** 1 person
  - Responsibilities: Testing, bug tracking, quality metrics
  - Works 40 hours/week

- **Part-time Support:**
  - Game Designer (contract): Balance, mechanics, new features
  - DevOps Engineer (contract): Deployment, monitoring, infrastructure

**Total: 7-8 full-time equivalents**

#### Expanded Team (Phase 3)
- Add Community Manager
- Add UX/UI Designer
- Add Data Analyst
- Expand dev team by 2-3 engineers

### 2.2 Organizational Chart

```
Project Sponsor/Executive
    │
Product Owner/Manager
    │
    ├─── Tech Lead
    │       ├─ Backend Lead
    │       │   ├─ Backend Dev 1
    │       │   └─ Backend Dev 2
    │       │
    │       └─ Frontend Lead
    │           ├─ Frontend Dev 1
    │           └─ Frontend Dev 2
    │
    ├─── QA Lead
    │       └─ QA Engineers
    │
    └─── Contractors
            ├─ Game Designer
            ├─ DevOps Engineer
            └─ Community Manager (future)
```

### 2.3 Roles & Responsibilities

| Role | Primary Responsibilities | Time % |
|------|--------------------------|--------|
| Product Owner | Requirements gathering, roadmap, prioritization, stakeholder management | 100% |
| Tech Lead | Architecture, code reviews, technical decisions, mentoring | 100% |
| Backend Lead | Server design, API contracts, database, performance optimization | 100% |
| Backend Dev 1 | Game logic, server endpoints, WebSocket handlers | 100% |
| Backend Dev 2 | User management, shop, social features, integrations | 100% |
| Frontend Lead | Component architecture, state management, performance | 100% |
| Frontend Dev 1 | Game components, UI/UX, responsive design | 100% |
| Frontend Dev 2 | Pages, routing, animations, accessibility | 100% |
| QA Engineer | Test planning, automation, bug tracking, metrics | 100% |
| Game Designer | Balance, mechanics, new games, content (retainer) | 20% |
| DevOps Engineer | CI/CD, deployment, monitoring, infrastructure (retainer) | 20% |

### 2.4 Key Stakeholders

| Stakeholder | Interest | Impact |
|-------------|----------|--------|
| Executive Sponsor | ROI, timeline, resource allocation | High |
| Product Owner | Requirements, success metrics | High |
| Players/Users | Gameplay, features, balance | High |
| Development Team | Technical solutions, tools, processes | High |
| Community | Game health, updates, support | Medium |
| Investors (if applicable) | Growth, metrics, profitability | High |
| Business Partners | Integrations, revenue sharing | Medium |

---

## 3. Project Scope

### 3.1 Scope Statement

**In Scope (MVP - Phase 1-2):**
- ✓ Splendor game (fully implemented)
- ✓ Dead Man's Draw game (fully implemented)
- ✓ Single-player with AI opponents (3 difficulties)
- ✓ Multiplayer matchmaking and real-time gameplay
- ✓ Player authentication and account management
- ✓ Progression system (coins, gems, ranks)
- ✓ Cosmetics shop (30-50 items)
- ✓ Friend system and basic messaging
- ✓ Guild/group creation and management
- ✓ Challenge modes (daily challenges, AI survival)
- ✓ Tutorial system
- ✓ Bilingual support (English + Persian)
- ✓ Audio system (background music, SFX)
- ✓ Mobile-responsive UI
- ✓ Analytics and monitoring

**Out of Scope (Phase 3+):**
- Native mobile apps (iOS/Android)
- Tournament/ladder systems
- Seasonal battle passes (Phase 3)
- Advanced ML-based AI
- Voice chat (optional)
- Advanced analytics dashboard
- Cross-game cosmetics (Phase 5+)
- Third/fourth games (Phase 3+)

### 3.2 Deliverables

**Functional Deliverables:**
1. Web Application (React + TypeScript)
2. Backend Server (Node.js + Express)
3. WebSocket Server (Socket.IO)
4. Database (MongoDB)
5. Game Logic Library
6. AI Player System
7. Payment Processing Integration
8. Analytics Integration

**Documentation Deliverables:**
1. Software Requirements Specification (SRS)
2. Architecture Document (ARCHITECTURE.md)
3. API Documentation (Swagger/OpenAPI)
4. Deployment Guide
5. User Documentation/FAQ
6. Code Documentation

**Process Deliverables:**
1. CI/CD Pipelines
2. Performance Monitoring
3. Error Tracking Setup
4. Test Suites
5. Release Notes

---

## 4. Project Schedule

### 4.1 Phase Timeline

| Phase | Duration | Start | End | Key Deliverables |
|-------|----------|-------|-----|-----------------|
| **Phase 1: Stabilization** | 6 weeks | May 6 | Jun 16 | Polished MVP, monitoring setup |
| **Phase 2: Alpha Launch** | 12 weeks | Jun 17 | Sep 8 | Public alpha, community, retention features |
| **Phase 3: Expansion** | 16 weeks | Sep 9 | Jan 5 | Third game, guild system, seasons |
| **Phase 4: Optimization** | 16 weeks | Jan 6 | May 4 | Monetization refinement, scaling |
| **Phase 5: Scale** | 24 weeks | May 5 | Nov 3 | Mobile exploration, fourth game |
| **Phase 6: Leadership** | Ongoing | Nov 4 | ~2028 | Market leadership, growth |

### 4.2 Milestone Schedule

```
Phase 1 (May - Jun 2026):
  ✓ Week 1-2:   Core stabilization & balancing
  ✓ Week 3-4:   Performance optimization & monitoring setup
  ✓ Week 5-6:   Final polish & soft launch prep

Phase 2 (Jul - Sep 2026):
  ✓ Week 1:     Alpha launch (July 6)
  ✓ Week 2-8:   User feedback integration & balance patches
  ✓ Week 9-12:  Community features & retention mechanics

Phase 3 (Oct 2026 - Jan 2027):
  ✓ Week 1-8:   Third game development
  ✓ Week 9-12:  Guild system, seasonal features
  ✓ Week 13-16: Testing & launch preparation

Phase 4 (Feb - May 2027):
  ✓ Week 1-8:   Monetization optimization
  ✓ Week 9-12:  Player retention features
  ✓ Week 13-16: Scaling & infrastructure

Phase 5 (Jun - Nov 2027):
  ✓ Week 1-16:  Mobile app development (evaluation/beta)
  ✓ Week 17-24: Fourth game or major feature expansion
```

### 4.3 Critical Path

```
Requirements → Design → Development → Testing → Launch → Live Ops

Critical tasks (high dependency):
1. Game logic implementation (blocks all testing)
2. WebSocket server setup (blocks multiplayer features)
3. Payment integration (blocks monetization)
4. Analytics setup (blocks KPI tracking)
5. Infrastructure/DevOps (blocks scaling)
```

### 4.4 Schedule Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Scope creep in Phase 1 | Delay launch by 2-4 weeks | Medium | Strict scope control, change log |
| Team member absent | Development slowdown | Low | Cross-training, documentation |
| Third-party service down | Blocking issue | Low | Fallbacks, service redundancy |
| Performance bottleneck | Delayed scaling | Medium | Early load testing, optimization |
| Market shift/competitor | Viability question | Medium | Continuous market research |

---

## 5. Project Estimates & Resources

### 5.1 Budget Estimate (USD)

**Phase 1-2 (6 months):**
- Personnel (7-8 FTE): $300,000 - $400,000
- Infrastructure/Hosting: $5,000 - $10,000
- Tools/Services (monitoring, CDN, etc): $3,000 - $5,000
- Marketing (soft launch): $2,000 - $5,000
- Contingency (10%): $31,000 - $42,000
- **Phase Total: $341,000 - $462,000**

**Phase 3-6 (18 months):**
- Personnel expansion (12-15 FTE): $720,000 - $950,000
- Infrastructure scaling: $15,000 - $25,000
- Tools/Services expansion: $8,000 - $12,000
- Marketing/Events: $15,000 - $30,000
- Third-party integrations: $5,000 - $10,000
- Contingency (10%): $76,800 - $102,700
- **Phase Total: $839,800 - $1,129,700**

**Total Project Cost (2 years): ~$1.2M - $1.6M**

### 5.2 Resource Allocation

**Core Development Team:**
- Backend Engineers: 1,440 hours/phase (2 FTE × 20 weeks × 40 hrs)
- Frontend Engineers: 1,440 hours/phase (2 FTE × 20 weeks × 40 hrs)
- QA: 720 hours/phase (1 FTE × 20 weeks × 40 hrs)
- Product Owner: 720 hours/phase (1 FTE × 20 weeks × 40 hrs)
- Tech Lead: 720 hours/phase (1 FTE × 20 weeks × 40 hrs)

**Infrastructure & Tools:**
- Cloud Hosting: AWS/GCP/Azure ($500-1000/month)
- Database: MongoDB Atlas (~$500/month)
- Redis Cache: $100-200/month
- CDN: Cloudflare ($50-200/month)
- Monitoring: Sentry, DataDog ($300-500/month)
- CI/CD: GitHub Actions (free)

### 5.3 Effort Estimation (Person-Days)

| Activity | Backend | Frontend | QA | Design | Total |
|----------|---------|----------|-----|--------|-------|
| **Phase 1** | | | | | |
| Architecture/Setup | 10 | 8 | 5 | 2 | 25 |
| Core Game Logic | 20 | 15 | 10 | - | 45 |
| API Development | 15 | - | 5 | - | 20 |
| UI Components | - | 30 | - | 10 | 40 |
| Testing/QA | - | - | 30 | - | 30 |
| DevOps/Monitoring | 10 | - | - | - | 10 |
| Deployment prep | 5 | 5 | 5 | - | 15 |
| **Phase 1 Total** | **60** | **58** | **55** | **12** | **185** |
| | | | | | |
| **Phase 2** | | | | | |
| Community Features | 20 | 25 | 8 | 5 | 58 |
| Retention Mechanics | 15 | 15 | 5 | 3 | 38 |
| Analytics/Monitoring | 10 | 5 | - | - | 15 |
| Bug Fixes/Polish | 15 | 15 | 20 | - | 50 |
| Performance Optimization | 15 | 10 | - | - | 25 |
| Content Updates | - | 10 | - | 10 | 20 |
| **Phase 2 Total** | **75** | **80** | **33** | **18** | **206** |

---

## 6. Technical Approach

### 6.1 Development Methodology

**Agile Scrum with modifications:**
- **Sprints:** 2-week sprints
- **Daily Standups:** 15 minutes (9:00 AM)
- **Sprint Planning:** Every 2 weeks (Monday)
- **Sprint Review:** Every 2 weeks (Friday)
- **Retrospective:** Every 2 weeks (Friday)
- **Backlog Grooming:** 1 hour/week

**Key Metrics Tracked:**
- Velocity (story points completed per sprint)
- Burndown (tasks remaining per sprint)
- Bug escape rate (bugs found in production)
- Code coverage (test coverage %)
- Cycle time (days from feature start to live)

### 6.2 Development Practices

**Source Control:**
- Git + GitHub
- Branch strategy: Feature branches + main/dev
- Code review mandatory (2 approvals for critical)
- Automated linting & formatting (ESLint, Prettier)

**Testing:**
- Unit tests (Jest, Vitest) - target 70%+ coverage
- Integration tests (Supertest for API)
- End-to-end tests (Cypress/Playwright)
- Manual QA testing (regression, exploratory)
- Performance testing (load testing before launches)
- User acceptance testing (UAT with stakeholders)

**Continuous Integration/Deployment:**
- GitHub Actions for CI/CD
- Automated tests on every PR
- Linting checks on every commit
- Staging environment deployment on merge to dev
- Production deployment via manual or automated release

**Code Quality:**
- ESLint configuration (strict rules)
- TypeScript strict mode
- No console.log in production code
- Error handling on all async operations
- Logging structured (JSON format)

### 6.3 Technology Stack (Finalized)

**Frontend:**
- React 18.x + TypeScript
- Vite (build tool)
- Tailwind CSS + PostCSS
- shadcn/ui (component library)
- React Router (navigation)
- React Hook Form (forms)
- Socket.io-client (WebSocket)
- axios/fetch (HTTP)

**Backend:**
- Node.js 18+ LTS
- Express.js 4.x
- TypeScript
- Socket.IO (WebSocket)
- MongoDB (database)
- Redis (caching)
- JWT (authentication)
- bcryptjs (password hashing)

**DevOps/Infrastructure:**
- Docker (containerization)
- GitHub Actions (CI/CD)
- AWS/GCP/Azure (hosting)
- Cloudflare (CDN)
- Sentry (error tracking)
- DataDog/CloudWatch (monitoring)
- MongoDB Atlas (managed database)

**Testing:**
- Vitest (unit testing)
- Jest (unit testing alternative)
- React Testing Library
- Supertest (API testing)
- Cypress (E2E testing) - optional

---

## 7. Risk Management

### 7.1 Risk Register

| # | Risk | Probability | Impact | Score | Mitigation Strategy | Owner |
|---|------|-------------|--------|-------|---------------------|-------|
| 1 | Slow user adoption | Med | High | 6 | Early marketing, influencer partnerships, generous rewards | PM |
| 2 | Server outages | Med | High | 6 | Load testing, geographic redundancy, monitoring alerts | Tech Lead |
| 3 | Competitive game launches | High | Med | 6 | Unique features, strong community, frequent updates | PM |
| 4 | Payment processor issues | Low | High | 3 | Multiple payment providers, backup systems | Backend Lead |
| 5 | Key developer leaves | Low-Med | High | 3 | Cross-training, documentation, knowledge sharing | Tech Lead |
| 6 | Security breach | Low | High | 3 | Regular audits, penetration testing, secure coding | Tech Lead |
| 7 | Database corruption | Low | High | 3 | Regular backups, replication, disaster recovery plan | DevOps |
| 8 | Regulatory issues | Low | High | 3 | Legal review, GDPR compliance, age verification | PM |
| 9 | Third-party API down | Med | Med | 4 | Fallback integrations, graceful degradation | Backend Lead |
| 10 | Budget overrun | Med | Med | 4 | Regular tracking, scope control, contingency reserve | PM |

### 7.2 Issue Management Process

1. **Issue Logging:** Any team member can log issues
2. **Triage:** Weekly triage meeting (Tue 2 PM)
3. **Prioritization:** High/Medium/Low (use impact × probability)
4. **Assignment:** Assign owner and target resolution date
5. **Resolution:** Implement fix, verify, document
6. **Closure:** Close when resolved and verified

### 7.3 Change Control

**Change Request Process:**
1. Submit change request form (scope, effort, risk)
2. Assess impact on timeline & budget
3. Review with stakeholders
4. Approve/defer (only Product Owner can approve)
5. Update schedule & documents
6. Communicate to team

**Change Categories:**
- **Scope creep:** New features (defer to next phase)
- **Bug fixes:** Production issues (immediate priority)
- **Optimizations:** Performance improvements (backlog)
- **Technical debt:** Code quality (2-3 items per sprint)

---

## 8. Quality Assurance Plan

### 8.1 Quality Standards

| Metric | Target | Monitoring |
|--------|--------|-----------|
| Uptime | 99.5%+ | 24/7 monitoring |
| Error Rate | <0.5% requests | Application metrics |
| Crash Rate | <0.1% sessions | Error tracking (Sentry) |
| Load Time | <2s page load, <1s API | Web Vitals, APM |
| Test Coverage | 70%+ game logic | CI/CD integration |
| Bug Escape | <2 per 1000 sessions | QA tracking |
| Code Review | 100% of commits | GitHub branch protection |

### 8.2 Testing Strategy

**Unit Testing (70% coverage target):**
- Game logic functions
- Utility functions
- Validation logic
- Tool: Vitest/Jest

**Integration Testing (30% coverage target):**
- API endpoints
- Database operations
- External service calls
- Tool: Supertest, custom integration tests

**End-to-End Testing (critical paths only):**
- User signup → login → game play → payment
- Multiplayer game flow
- Friend invite flow
- Tool: Cypress/Playwright

**Manual Testing:**
- Exploratory testing (2 hours/week)
- Regression testing (before releases)
- Device/browser testing
- Load/stress testing (monthly)

### 8.3 Bug Severity Levels

| Severity | Definition | Response Time | Fix Timeline |
|----------|-----------|----------------|-------------|
| **Critical** | Game unplayable, data loss, security breach | 30 min | <4 hours |
| **Major** | Core feature broken, frequent crashes | 2 hours | <24 hours |
| **Minor** | UI issue, non-critical feature broken | 1 day | <1 week |
| **Trivial** | Cosmetic issue, typo, enhancement | 1 week | <2 weeks |

---

## 9. Communication Plan

### 9.1 Communication Strategy

**Internal Communications:**
- Daily Standup: 15 min (dedicated Slack channel)
- Sprint Planning: 2 hours (bi-weekly Monday)
- Sprint Review: 1 hour (bi-weekly Friday)
- Retrospective: 1 hour (bi-weekly Friday)
- Weekly Sync: 30 min (PM + Tech Lead + key stakeholders)

**External Communications:**
- Weekly update email (stakeholders)
- Monthly community newsletter
- Discord #announcements updates (daily)
- Social media updates (2-3x/week)

### 9.2 Status Reporting

**Daily:**
- Slack standup summary
- Known blockers highlighted

**Weekly:**
- Status Report Email
  - Completed tasks
  - In-progress work
  - Blockers
  - Key metrics (DAU, uptime, errors)
  - Next week's focus

**Monthly:**
- Executive Report
  - Progress vs. roadmap
  - Key metrics (KPIs)
  - Risks and issues
  - Budget tracking
  - Roadmap adjustments

### 9.3 Escalation Path

```
Individual Issue
    ↓
Team Lead (1 business day)
    ↓
Tech Lead / PM (2 business days)
    ↓
Executive Sponsor (3 business days)
```

---

## 10. Project Assumptions & Constraints

### 10.1 Assumptions

- [ ] Team members available full-time as planned
- [ ] No major platform changes (React, Node.js upgrades compatible)
- [ ] Third-party services (payment processor, hosting) remain stable
- [ ] Market demand for card games remains strong
- [ ] Players willing to spend $2-5/month on cosmetics
- [ ] No major regulatory changes affecting gaming
- [ ] Internet connectivity sufficient for real-time multiplayer

### 10.2 Constraints

**Technical:**
- Browser compatibility: Chrome, Firefox, Safari, Edge (latest versions)
- Mobile support: iOS Safari, Android Chrome (responsive web)
- Game servers: Single region initially (AWS us-east-1), multi-region Phase 5
- Database: MongoDB (not relational)
- Maximum concurrent players: 500 Phase 2, 5000 Phase 5

**Organizational:**
- Budget: $1.2M - $1.6M for 2-year project
- Team size: 7-8 FTE expanding to 20-25 in Phase 5
- Timeline: Launch by July 2026 (fixed)

**Business:**
- F2P model (no required payment)
- Cosmetics-only monetization (no pay-to-win)
- Bilingual (English + Persian)
- GDPR/privacy compliance mandatory

---

## 11. Tools & Infrastructure

### 11.1 Development Tools

| Tool | Purpose | Cost |
|------|---------|------|
| GitHub | Version control & CI/CD | Free (Team) |
| Visual Studio Code | IDE | Free |
| Postman | API testing | Free (Team) |
| Figma | UI design | $45/month (Team) |
| Jira | Project management | $10/user/month |
| Slack | Communication | $8/user/month |
| Linear | Issue tracking | Free (Team) |
| Docker | Containerization | Free |

### 11.2 Infrastructure Services

| Service | Purpose | Cost | Scaling |
|---------|---------|------|---------|
| AWS EC2 | Server hosting | $100-500/mo | Auto-scaling |
| MongoDB Atlas | Database | $100-500/mo | Automatic scaling |
| CloudFlare | CDN + DDoS protection | $50-200/mo | Per usage |
| Sentry | Error tracking | $29-99/mo | Per event |
| DataDog | Application monitoring | $15-50/day | Per metric |
| Socket.IO | Real-time comms | Free (self-hosted) | Included in EC2 |

### 11.3 Third-Party Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| Stripe/PayPal | Payments | Planned Phase 2 |
| Auth0 | Authentication | Optional |
| SendGrid | Email notifications | Phase 2 |
| Firebase Analytics | User tracking | Current (GA4) |
| Twilio | SMS (optional) | Future |

---

## 12. Project Success Criteria

### 12.1 Success Metrics

**Technical:**
- [ ] 99.5%+ uptime maintained
- [ ] <0.5% error rate
- [ ] <0.1% crash rate
- [ ] <2 sec page load times
- [ ] 70%+ code test coverage
- [ ] <30 min MTTR for critical issues

**Business:**
- [ ] 500+ DAU by Month 3
- [ ] $2-5 ARPU by Month 6
- [ ] 5-10% F2P conversion
- [ ] 40%+ D1 retention
- [ ] 10%+ D30 retention

**User-Centric:**
- [ ] 80%+ tutorial completion
- [ ] 60%+ friend adoption
- [ ] 40%+ guild participation
- [ ] 4.0+ app store rating
- [ ] <2% negative reviews

**Project Management:**
- [ ] On-time delivery (within 1 week)
- [ ] Within budget (±10%)
- [ ] Zero scope creep to launch
- [ ] 100% sprint commitment met
- [ ] <2 critical production issues

### 12.2 Exit Criteria (Per Phase)

**Phase 1 Complete When:**
- [ ] All critical bugs resolved
- [ ] Performance targets met
- [ ] Monitoring operational
- [ ] Documentation complete
- [ ] Team trained & ready

**Phase 2 Complete When:**
- [ ] 100+ DAU achieved
- [ ] Core community established (500+ Discord)
- [ ] Payment system working
- [ ] 40%+ D1 retention
- [ ] <0.1% crash rate maintained

**Launch/Go-Live Criteria:**
- [ ] All acceptance tests passing
- [ ] Capacity planning complete
- [ ] Runbooks prepared
- [ ] Support team trained
- [ ] Marketing ready
- [ ] Stakeholder sign-off

---

## 13. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | May 2, 2026 | AI Assistant | Initial SPMP creation |
| | | | |

---

## Appendix: Project Documents Reference

- **SRS.md** - Detailed requirements
- **ROADMAP.md** - Phased roadmap & milestones
- **KPI.md** - Performance metrics & targets
- **ARCHITECTURE.md** - Technical architecture
- **INTERVIEWS.md** - Stakeholder interview guide

---

*This SPMP is a living document. Review and update quarterly or when major changes occur.*
