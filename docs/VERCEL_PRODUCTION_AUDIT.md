# Vercel Production Launch Audit (Songine)

_Last updated: 2026-04-17_

This audit maps the project against Vercel's Production Checklist for the current setup:

- **Plan:** Hobby
- **Account type:** Personal
- **Frontend hosting:** Vercel (Next.js)
- **Backend hosting:** Not deployed yet
- **Domain:** `*.vercel.app` only
- **Expected launch traffic:** Low

---

## What was implemented in this repo

### Security / reliability hardening (code-level)

- ✅ Added security headers and CSP in `frontend/next.config.ts`
  - `Content-Security-Policy`
  - `Referrer-Policy`
  - `X-Content-Type-Options`
  - `X-Frame-Options`
  - `Permissions-Policy`
  - `Cross-Origin-Opener-Policy`
  - `Strict-Transport-Security` (production only)
- ✅ Added no-store cache policy for proxy API routes in `frontend/next.config.ts`
- ✅ Added lightweight per-IP rate limiting for expensive proxy endpoints:
  - `frontend/app/api/local-pipeline/generate/route.ts`
  - `frontend/app/api/local-pipeline/generate/stream/route.ts`
  - Shared utility: `frontend/lib/server/rate-limit.ts`
- ✅ Added Vercel Speed Insights to layout:
  - `frontend/app/layout.tsx`
- ✅ Added OpenTelemetry instrumentation bootstrap:
  - `frontend/instrumentation.ts`
  - Dependency: `@vercel/otel`

### Existing good signals

- ✅ Lockfiles are committed (`pnpm-lock.yaml` at root and `frontend/pnpm-lock.yaml`)
- ✅ Font optimization in use (`next/font` via Geist in `frontend/app/layout.tsx`)
- ✅ Build passes after changes (`pnpm --dir frontend build`)

---

## Checklist status by category

## Operational excellence

- ❌ Incident response plan with escalation + comms + rollback
  - **Action:** Use the incident runbook template below and store in your team docs.
- ⚠️ Stage/promote/rollback familiarity not documented as a team process
  - **Action:** Practice one preview deploy promotion and one instant rollback before launch.
- ➖ Monorepo build caching (Turborepo) not applicable currently
  - **Reason:** This project is not using Turborepo.
- ⚠️ Zero-downtime DNS migration not started
  - **Action:** Required only when moving to a custom domain and DNS provider cutover.

## Security

- ✅ CSP + security headers implemented in code
- ⚠️ Deployment Protection needs dashboard configuration
  - **Hobby guidance:** Use **Standard Protection + Vercel Authentication** for previews/deployment URLs.
- ⚠️ WAF rules need dashboard configuration
  - **Action:** Add custom rules + IP blocking + bot mitigation template in Firewall UI.
- ❌ Log Drains not enabled
  - **Plan note:** Requires Pro/Enterprise.
- ⚠️ SSL certificate checks pending (once custom domain added)
- ⚠️ Preview Deployment Suffix with custom domain not configured
  - **Plan note:** Usually relevant with custom domains.
- ✅ Lockfiles committed
- ✅ Basic app-level rate limiting implemented for high-cost routes
- ⚠️ Team access roles review not applicable yet (personal account)
- ➖ SAML/SCIM (Enterprise only) not applicable on Hobby
- ➖ Audit Logs (Enterprise only) not applicable on Hobby
- ➖ Allowed cookie policy rule (Enterprise-only conformance) not applicable on Hobby
- ⚠️ Bot blocking rule in WAF not yet configured in dashboard

## Reliability

- ➖ Observability Plus unavailable on Hobby (Pro/Enterprise)
- ➖ Automatic Function failover unavailable on Hobby (Enterprise)
- ➖ Secure Compute passive failover unavailable on Hobby (Enterprise)
- ✅ Cache behavior configured for dynamic proxy routes (no-store)
- ⚠️ Static/function caching strategy should be reviewed route-by-route before scaling
- ⚠️ ISR vs caching headers strategy not explicitly defined
- ✅ Tracing bootstrap added (`@vercel/otel` + instrumentation)
- ➖ Vercel enterprise load testing policy item not applicable on Hobby

## Performance

- ✅ Speed Insights integrated
- ⚠️ TTFB should be reviewed from Speed Insights after traffic arrives
- ⚠️ Image optimization not yet adopted (`next/image` not currently used)
- ⚠️ Script optimization (`next/script`) not currently used (may be N/A if no external scripts)
- ✅ Font optimization in use (`next/font`)
- ❌ Function region alignment not set
  - **Action:** set `regions` in `frontend/vercel.json` to match backend/API region once backend is deployed.
- ➖ Third-party proxy enterprise coordination not applicable on Hobby

## Cost optimization

- ⚠️ Fluid compute setting not verified in dashboard
- ⚠️ Spend Management unavailable on Hobby (Pro required)
- ✅ Function maxDuration reviewed for stream route (`300s`)
- ⚠️ Function memory not explicitly tuned in project settings
- ⚠️ ISR revalidation policy not defined (app currently dynamic/no-store path)
- ➖ Legacy image pricing opt-in likely not applicable (newer team); verify if needed
- ⚠️ Large media storage strategy should move to object/blob storage before scale

---

## Launch blockers for your current setup

1. **Backend is not deployed in production**
   - Your frontend proxy routes depend on `BACKEND_API_URL`; deploy backend first.
2. **Deployment Protection + WAF not configured**
   - These are dashboard-level controls and should be enabled before public launch.
3. **No incident response runbook documented for the launch team**

---

## Recommended next 48-hour launch plan

1. **Deploy backend production service** and set `BACKEND_API_URL` in Vercel env vars.
2. **Set Function region** in `frontend/vercel.json` to match backend region.
3. **Enable Deployment Protection (Standard + Vercel Auth)** for preview safety.
4. **Configure WAF baseline**:
   - one bot-blocking rule,
   - one IP block rule,
   - one custom rate/challenge rule for abusive paths.
5. **Create incident response runbook** (template below) and share escalation contacts.
6. **Smoke test rollback** by promoting a known-good deployment and validating recovery.

---

## Incident response runbook template (copy/paste)

### Severity levels

- **SEV-1:** Full outage or data/security impact
- **SEV-2:** Major feature degraded, workaround exists
- **SEV-3:** Minor issue, no critical user impact

### Escalation path

1. **On-call engineer** acknowledges within 5 minutes
2. **Incident lead** assigned (single decision owner)
3. **Comms owner** posts status updates every 15 minutes for SEV-1/2

### Communication channels

- Primary: team chat incident channel
- External status updates: Vercel status page + customer channel (if applicable)
- Internal timeline document maintained during incident

### Immediate rollback strategy

- If deployment-related: use **instant rollback** to previous stable deployment
- If WAF-related regression: use Firewall **instant rollback** to prior ruleset
- If backend regressions: switch `BACKEND_API_URL` to last stable backend and redeploy

### Recovery checklist

- Validate HTTP health, key user flows, and API errors
- Confirm logs show error rate normalization
- Publish incident summary and follow-up action items within 24 hours

---

## Notes

For Hobby plan, some checklist items are intentionally marked not applicable due to plan constraints. If you plan to launch with stricter security/compliance and persistent observability, moving to **Pro** is the most impactful next step.
