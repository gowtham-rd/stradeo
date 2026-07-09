# Stradeo — Cost Analysis

## Executive Summary

| Phase | Monthly Cost | One-Time Cost |
|---|---|---|
| MVP Launch (0–500 users) | **€0–5/mo** | **€25** |
| Growth (500–5,000 users) | **€25–50/mo** | — |
| Scale (5,000–50,000 users) | **€100–300/mo** | — |

Stradeo can launch and run profitably at near-zero cost, scaling expenses only as revenue grows.

---

## 1. Infrastructure Costs

### 1.1 Hosting — Vercel

| Tier | Cost | Includes | When to Use |
|---|---|---|---|
| Hobby (Free) | €0/mo | 100 GB bandwidth, 1 project, no commercial use | Development only |
| Pro | ~€18/mo (~$20) | 1 TB bandwidth, unlimited projects, commercial OK | **MVP launch** |
| Enterprise | Custom | SLA, support | 50K+ users |

**Recommendation:** Start on Pro from day one (€18/mo). The free tier prohibits commercial use.

### 1.2 Database & Auth — Supabase

| Tier | Cost | Includes | When to Use |
|---|---|---|---|
| Free | €0/mo | 500 MB database, 1 GB storage, 50K auth MAU, 2M edge function invocations | **MVP launch** |
| Pro | ~€23/mo (~$25) | 8 GB database, 100 GB storage, 100K MAU, 2M edge functions | 500+ users |
| Team | ~€580/mo (~$599) | Priority support, SOC2 | Enterprise |

**Recommendation:** Free tier is sufficient for MVP. The 500 MB database easily holds progress data for 10,000+ users. The 1 GB storage holds all 413 road sign images (~50 MB total). Upgrade to Pro only when approaching limits.

### 1.3 Domain Name

| Domain | Estimated Cost | Registrar |
|---|---|---|
| stradeo.app | ~€12–15/year | Namecheap, Google Domains |
| stradeo.it | ~€8–10/year | Aruba.it, Register.it |
| stradeo.com | ~€10–12/year | Namecheap |

**Recommendation:** Register `stradeo.app` (€12/year = €1/mo). It's modern, memorable, and signals a mobile app.

---

## 2. AI Costs (Claude API)

This is the most variable cost. Stradeo uses Claude for three features:

### 2.1 Per-Request Costs (claude-sonnet-4-6)

| Feature | Input Tokens | Output Tokens | Cost per Request |
|---|---|---|---|
| Wrong answer explanation | ~200 | ~150 | ~€0.0015 |
| Question translation | ~100 | ~80 | ~€0.0008 |
| Theory lesson generation | ~300 | ~800 | ~€0.0055 |

*Based on Anthropic pricing: $3/M input tokens, $15/M output tokens for Sonnet.*

### 2.2 Monthly Usage Scenarios

**Conservative (100 active users, light usage):**

| Feature | Requests/User/Month | Total Requests | Cost |
|---|---|---|---|
| Explanations | 30 | 3,000 | €4.50 |
| Translations | 20 | 2,000 | €1.60 |
| Theory lessons | 5 | 500 | €2.75 |
| **Total** | | **5,500** | **~€9/mo** |

**Moderate (1,000 active users):**

| Feature | Requests/User/Month | Total Requests | Cost |
|---|---|---|---|
| Explanations | 30 | 30,000 | €45 |
| Translations | 20 | 20,000 | €16 |
| Theory lessons | 5 | 5,000 | €27.50 |
| **Total** | | **55,000** | **~€90/mo** |

**High (5,000 active users):**

| Feature | Requests/User/Month | Total Requests | Cost |
|---|---|---|---|
| Explanations | 30 | 150,000 | €225 |
| Translations | 20 | 100,000 | €80 |
| Theory lessons | 5 | 25,000 | €137.50 |
| **Total** | | **275,000** | **~€445/mo** |

### 2.3 Cost Optimization Strategies

| Strategy | Savings | Effort |
|---|---|---|
| **Cache theory lessons** in Supabase (25 topics × 4 languages = 100 lessons total) | Eliminates ~50% of theory costs after first generation | Low |
| **Batch pre-generate translations** for all 7,139 questions (one-time) | Eliminates 100% of translation API costs | Medium (one-time ~€15–20) |
| **Batch pre-generate explanations** for all 7,139 questions | Eliminates 100% of explanation API costs | Medium (one-time ~€20–30) |
| **Use Claude Haiku** instead of Sonnet for translations | ~80% cheaper per translation | Low |
| **Rate limit** AI features (e.g., 50 explanations/day per user) | Prevents abuse | Low |

**With full optimization (pre-generated translations + explanations, cached theory):**
- API costs drop to near €0/mo for existing content
- Only new/updated questions and first-time theory generation incur costs
- Estimated: **€0–5/mo** at any user count

---

## 3. Google Play Store

| Item | Cost | Frequency |
|---|---|---|
| Developer account registration | €25 | One-time |
| App review | €0 | Per submission |
| Google Play commission (on in-app purchases) | 15% (first €1M/year) | Ongoing |

**Note:** If monetizing with ads only (no subscriptions), there is no Google Play commission.

---

## 4. Advertising Revenue (Google AdMob)

### 4.1 Expected Ad Revenue

| Metric | Conservative | Moderate | Optimistic |
|---|---|---|---|
| Daily Active Users | 100 | 1,000 | 5,000 |
| Sessions/User/Day | 2 | 2 | 2 |
| Banner impressions/session | 5 | 5 | 5 |
| Banner eCPM (Italy) | €1.50 | €2.00 | €2.50 |
| **Daily banner revenue** | €1.50 | €20 | €125 |
| Interstitial ads/session | 1 | 1 | 1 |
| Interstitial eCPM | €5 | €8 | €10 |
| **Daily interstitial revenue** | €1 | €16 | €100 |
| **Monthly total** | **~€75** | **~€1,080** | **~€6,750** |

*eCPM = effective cost per 1,000 impressions. Italian eCPM is in the mid-range for European markets.*

### 4.2 AdMob Implementation Cost

| Item | Cost |
|---|---|
| AdMob account | Free |
| Capacitor AdMob plugin | Free (open source) |
| Ad mediation setup | Free |

---

## 5. Optional: Subscription Model (Alternative to Ads)

If switching from ads to freemium subscriptions:

| Plan | Price | Features |
|---|---|---|
| Free | €0 | Quiz (limited to 20 questions/day), no AI |
| Premium | €4.99/mo | Unlimited quiz, AI explanations, translations, theory, no ads |
| Yearly | €29.99/year | Same as Premium, 50% discount |

**Revenue projection (1,000 users, 10% conversion):**

| Metric | Monthly | Annual |
|---|---|---|
| Free users | 900 | — |
| Premium monthly | 50 @ €4.99 | €2,995 |
| Premium yearly | 50 @ €2.50/mo | €1,500 |
| **Total** | **~€375/mo** | **~€4,495/year** |

**After Google Play's 15% cut:** ~€320/mo

---

## 6. One-Time Development Costs

| Item | Cost | Notes |
|---|---|---|
| Batch translate 7,139 questions (Claude API) | ~€15–20 | One-time, 4 languages |
| Batch generate explanations (Claude API) | ~€20–30 | One-time, per question |
| Generate theory lessons (Claude API) | ~€3–5 | 25 topics × 4 languages |
| Domain registration | ~€12/year | stradeo.app |
| Google Play developer account | €25 | One-time |
| **Total one-time** | **~€75–92** | |

---

## 7. Total Cost Summary

### MVP Launch (Month 1)

| Item | Cost |
|---|---|
| Vercel Pro | €18 |
| Supabase Free | €0 |
| Domain | €1 (€12/year) |
| Claude API (with caching) | €5–10 |
| Google Play registration | €25 (one-time) |
| Batch content generation | €40–55 (one-time) |
| **Month 1 total** | **~€89–109** |
| **Ongoing monthly** | **~€24–29** |

### Steady State (500 Users, Ads)

| Item | Monthly Cost | Monthly Revenue |
|---|---|---|
| Vercel Pro | €18 | — |
| Supabase Free | €0 | — |
| Domain | €1 | — |
| Claude API (optimized) | €0–5 | — |
| AdMob revenue | — | €200–400 |
| **Net** | | **+€175–375/mo** |

### Growth (5,000 Users, Ads)

| Item | Monthly Cost | Monthly Revenue |
|---|---|---|
| Vercel Pro | €18 | — |
| Supabase Pro | €23 | — |
| Domain | €1 | — |
| Claude API (optimized) | €5–10 | — |
| AdMob revenue | — | €3,000–6,000 |
| **Net** | | **+€2,950–5,950/mo** |

---

## 8. Break-Even Analysis

| Scenario | Monthly Costs | Users Needed for Break-Even |
|---|---|---|
| Ads only (no AI optimization) | €30 + API costs | ~50 DAU |
| Ads only (AI optimized) | €24–29 | ~30 DAU |
| Subscriptions (no ads) | €24–29 | 6 premium subscribers |

**Stradeo breaks even with approximately 30–50 daily active users.**

---

## 9. Risk Factors

| Risk | Impact | Mitigation |
|---|---|---|
| Claude API price increase | Higher AI costs | Pre-generate all content, cache aggressively |
| Low eCPM in Italy | Lower ad revenue | Add interstitial ads between quiz sessions, not just banners |
| Supabase free tier limits | Forced upgrade at ~500 users | Budget €23/mo for Pro tier |
| Google Play policy changes | App removal | Maintain web PWA as fallback |
| Competition from free apps | Slower user growth | Differentiate with multilingual support (Tamil, Hindi) for immigrant community |

---

## 10. Recommendation

**Launch strategy:** Ad-supported free app with zero subscription barriers.

1. **Pre-generate all AI content** before launch (~€40–55 one-time) to eliminate ongoing API costs
2. **Start on free tiers** everywhere (Supabase, keep Vercel Pro for commercial use)
3. **Total launch cost: ~€90** (one-time) + **~€25/mo** (ongoing)
4. **Break-even at ~30–50 daily active users** — achievable within first month of marketing
5. **Consider subscriptions later** only if user base exceeds 5,000 and ad revenue plateaus

The app is financially viable from day one with minimal investment.
