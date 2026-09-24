# Self-hosting

tandemcode.space runs this way, and you can run your own copy the same way. The API, the runner, Postgres and Caddy share one Linux host. The web app is static files on any host that can send every path to `index.html`.

## What you need

- A host running Ubuntu 24.04 with at least 2 GB of memory, reachable on ports 22, 80 and 443. tandemcode.space uses an AWS Lightsail instance. Use a machine that runs nothing else, because the runner controls its Docker daemon (see [judge and sandbox](judge-and-sandbox.md)).
- A domain, with an `A` record for the API's hostname pointing at the host.
- A Clerk production instance for that domain. Clerk lists the DNS records it needs. Social sign-in in production needs your own OAuth credentials for each provider.
- A static host for the web app. `apps/web/vercel.json` configures Vercel, including the security headers. `apps/web/nginx.conf` serves the app from nginx with a shorter set of headers, and has no Content Security Policy beyond refusing to be framed.

## The API host

```bash
git clone https://github.com/naman0r/tandemcode.git && cd tandemcode
./infra/bootstrap.sh
```

`bootstrap.sh` installs Docker, swap, gVisor and a nightly database dump, then writes `infra/.env` with generated database passwords. Log out and back in once so your user can reach Docker. If the script stopped at its gVisor check the first time, run it again after logging back in. It is safe to rerun.

Fill in the rest of `infra/.env`. `infra/.env.example` explains each setting. Then start everything:

```bash
./infra/deploy.sh
```

Caddy gets a TLS certificate for `API_DOMAIN` on its own once DNS points at the host. `curl https://<api-domain>/health` should print `{"status":"ok"}`.

## The web app

Build `apps/web` with two variables set: `VITE_BACKEND_URL`, the API's `https://` origin, and `VITE_CLERK_PUBLISHABLE_KEY`. Both are baked into the bundle and neither is secret. The site's origins must be listed in `CORS_ORIGINS` in `infra/.env`, because the API refuses tokens minted for any other origin.

## Checking a deployment

```bash
make smoke SITE=https://<site> API=https://<api-domain>
```

This checks that the API is up and refuses anonymous calls and foreign origins, and that the site serves the app with its security headers. Then sign in, open a room with a second account in a private window, and run a solution.

## Shipping changes

The web app and the API ship separately:

- The web app. On Vercel, every push to `main` builds and deploys it.
- The API and runner. Run `./infra/deploy.sh` on the host. It pulls `main`, dumps the database, and rebuilds whatever changed. The API applies new migrations as it starts, and migrations cannot be undone, which is why the dump comes first.

When a change touches both, deploy the API first, so the new web app never talks to an old API.

## Backups

`infra/backup.sh` runs nightly from cron and before every deploy. It writes a gzipped `pg_dump` to `/var/backups/tandemcode` and keeps two weeks of them. Those dumps are on the same disk as the database, so also copy the disk off the host; on Lightsail, turn on automatic snapshots. The restore steps are at the top of `infra/backup.sh`.

## Moving hosts

Bootstrap the new host, restore the latest dump into it, run `deploy.sh`, and point the API's `A` record at the new address.
