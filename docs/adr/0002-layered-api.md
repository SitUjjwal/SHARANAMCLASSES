# ADR 0002: Layered Express API with integration adapters

## Status

Accepted

## Context

The backend integrates Supabase, Cloudflare R2, Razorpay, FCM, and YouTube. Mixing SDK calls into route handlers would couple HTTP to vendors.

## Decision

Adopt a layered architecture:

`routes → controllers → services → repositories | integrations`

Third-party SDKs live only under `src/integrations/*`.

## Consequences

- Easier to mock vendors in tests
- Clear ownership of business rules in `services`
- Slightly more files per feature (acceptable for enterprise maintainability)
