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
- Credentials: incomplete-step blocking, validation, email conflict, final success.
- Happy path: freelance onboarding from welcome screen to final validation screen.

## Follow-Up Checklist

- Add full-stack Symfony/Postgres onboarding E2E once deterministic fixtures exist for invite tokens, vendor types, reference tables, and email side effects.
- Add happy paths for `traiteur`, `lieu`, and `createurs` once their expected MVP journeys are stable.
- Add portfolio upload coverage after deciding whether E2E should use mocked Cloudinary responses or a backend fixture.
- Add a frontend CI workflow that runs lint and the Playwright suite.
