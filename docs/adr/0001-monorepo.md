# ADR 0001: Monorepo with npm workspaces

## Status

Accepted

## Context

SHARANAM CLASSES needs a mobile app, admin panel, and API that share domain types and evolve together.

## Decision

Use a single git repository with **npm workspaces**:

- `apps/*` — deployable applications
- `packages/*` — shared libraries and tooling configs

## Consequences

- One PR can update API + clients + shared types atomically
- Requires disciplined package boundaries and CI matrix per app
- Local `npm install` at root links all workspaces
