# Clean Structure Guidelines

## Frontend (React)

- Keep runtime configuration in one place: `client/src/config/env.js`.
- Never hardcode backend hosts in components or services.
- Keep route guards simple:
  - Unauthenticated users must be redirected before role checks.
  - Role checks should only run when a user exists.
- Use `services/api.js` as the single HTTP base client.
- Place feature APIs under `services/<feature>/...` and avoid duplicate service names.

## Backend (Spring Boot)

- Never store secrets directly in `application.properties`.
- Load secrets from environment variables with `${ENV_VAR:}` syntax.
- Keep non-sensitive defaults in `application.properties` for local development.
- Use clear provider naming in code (for example, `mistralChatModel` instead of legacy names).

## Shared Practices

- Keep one source of truth for URLs and credentials.
- Prefer small, behavior-preserving refactors over large rewrites.
- Remove duplicate routes and dead code paths early.
- Add example env files for onboarding:
  - `client/.env.example`
  - `server/.env.example`
