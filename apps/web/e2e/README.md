# Onboarding E2E Coverage

## Commands

- `npm run test:e2e`: runs the full Playwright suite.
- `npm run test:e2e:happy-path`: runs only the main onboarding happy path.
- `npm run test:e2e:ui`: opens Playwright UI mode.
- `npm run test:e2e:debug`: runs Playwright debug mode.

## Current Coverage

- Token states: valid, expired, already completed.
- Professions: required service selection and PATCH payload.
- Consent:
  - accept sensitive-data consent and continue to experiences.
  - refuse consent as a freelance vendor and skip experiences.
  - refuse consent as a catering vendor and keep catering characteristics available.
- Experiences: culture and confession selection flow.
- Portfolio: required step continuation with a mocked prefilled portfolio.
- Credentials: incomplete-step blocking, validation, email conflict, final success.
- Happy paths:
  - freelance onboarding from welcome screen to final validation screen.
  - catering onboarding including catering characteristics.
  - venue onboarding including venue characteristics.
  - creator onboarding with creator-specific zones/pricing behavior.
- CI: `.github/workflows/web-ci.yml` runs lint and Playwright E2E for frontend changes.

## Follow-Up Checklist

- Add full-stack Symfony/Postgres onboarding E2E once deterministic fixtures exist for invite tokens, vendor types, reference tables, and email side effects.
- Add real crop/upload portfolio coverage after choosing a stable strategy for the canvas cropper and upload files. The current suite covers the portfolio step with prefilled mocked images because direct crop automation is fragile.
