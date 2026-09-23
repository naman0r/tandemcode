# Production roadmap

Where TandemCode stands after the September 2026 hardening pass, and what comes
next. `docs/deploy.md` covers getting it running. This file covers what to do
after that.

## Before or on launch day (needs you)

These need an account, a payment method or a product call, so an agent cannot
do them.

- [ ] **AWS**: a personal account (not the student org), root MFA, a $15 budget
      alert, the Lightsail instance with a static IP and port 443, and
      automatic snapshots. See `docs/deploy.md` steps 1-2.
- [ ] **DNS at Namecheap**: `api` A record, plus the records Vercel and Clerk
      show you.
- [ ] **Clerk production instance** for `tandemcode.space`, with your own OAuth
      credentials for each social login you offer and the allowed origins set.
      Sign-up stays open, as decided.
- [ ] **Vercel project** with root `apps/web` and the two `VITE_*` variables.
- [ ] **Turn the CSP on**: after a clean session with no CSP reports in the
      console, rename `Content-Security-Policy-Report-Only` in
      `apps/web/vercel.json` to `Content-Security-Policy`.
- [ ] **Retention policy**: how long to keep chat, editor history
      (`room_updates`) and submissions. Nothing is ever deleted today.
- [ ] **Terms and privacy page**: open sign-up means storing strangers' emails
      and code. A short page saying what is kept and for how long.

## Soon after launch

- **Close abandoned rooms.** A room only closes when its owner leaves it empty,
  so rooms whose owner just closed the tab stay open forever. They are hidden
  from the list but still rows. A periodic sweep that closes rooms with nobody
  present for an hour would fix it.
- **Bundle Monaco instead of loading it from jsdelivr.** `@monaco-editor/react`
  fetches Monaco 0.52 from a CDN at runtime while `y-monaco` imports the
  bundled 0.55.1. Configuring the loader with the bundled copy
  (`loader.config({ monaco })` plus Vite worker imports) removes a third-party
  script dependency, tightens the CSP, and makes the two agree.
- **Websocket ticket endpoint.** The Clerk token rides in the websocket query
  string. Caddy writes no access log and the API strips tokens from its own
  log, but a short-lived single-use ticket would keep it out of URLs entirely.
- **Error monitoring and uptime.** Nothing pages anyone today. A free uptime
  check on `https://api.tandemcode.space/health` and Sentry (or similar) on the
  API and web app would cover the basics.
- **Room creation limit is not atomic.** The hourly limit is a count followed
  by an insert, so a burst of parallel requests can exceed it. An advisory
  lock per user in the insert transaction would close that.
- **Cursor labels come from the peer.** A peer can put any name on their
  editor cursor. It is escaped, so the worst case is impersonating a label;
  mapping each cursor's user id to the server's presence roster would stop it.
- **Bump the pinned sandbox image.** `infra/docker-compose.prod.yml` pins
  `python:3.11-slim` by digest; refresh it when Python ships security fixes.
- **Upgrade the local compose to Postgres 17.** Production and CI run 17; the
  local compose still runs 13 so existing dev volumes keep working. Switching
  means a dump and restore of the dev database.

## When there is traffic

- **Move Postgres to RDS** (or another managed Postgres) for point-in-time
  recovery. At that point backups stop depending on one disk.
- **Move judging off the API host.** The runner holds the host's Docker socket,
  which makes it as trusted as the host, and it judges one submission at a
  time. A separate judge box, or the SQS plus Fargate design in #33, isolates
  it and lets it scale.
- **More than one runner.** The queue already supports it
  (`FOR UPDATE SKIP LOCKED`), but `requeue_running` on startup assumes a single
  runner. It needs a lease or heartbeat first.
- **More languages.** The judge is Python-only; each language needs its own
  sandbox image.

## Product

- **Invite-only rooms**, if unlisted links turn out not to be private enough.
- **Search and tags on the rooms page** (from `docs/TODO.md`).
- **Profiles** (from `docs/TODO.md`).
- Frontend improvements tracked in #16.

## Accepted risks

- **DOMPurify advisories via Monaco.** Monaco vendors its own copy and calls
  it with `RETURN_DOM_FRAGMENT` on its own hover and markdown content, none of
  the configurations the advisories are about. There is no fix short of a
  Monaco upgrade that `y-monaco` does not support yet.
- **Any signed-in user can enter any room they have the id of.** Public rooms
  are listed; unlisted ones rely on the id (a random UUID) staying in the
  invite link.
