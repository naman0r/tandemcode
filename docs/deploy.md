# Deploying TandemCode

The web app runs on Vercel at `tandemcode.space`. The API, runner, Postgres and
Caddy run on one AWS Lightsail instance at `api.tandemcode.space`. DNS stays at
Namecheap.

Expected cost: the Lightsail $12 plan (free for the first 3 months on a new
account), snapshot storage, and the domain. Vercel Hobby and Clerk's free tier
cost nothing at this size. There are no load balancers, NAT gateways or managed
databases, which is where surprise AWS bills come from.

Do the steps in order. Anything in `<angle brackets>` is yours to fill in.

## 1. AWS account

1. Sign in to the AWS console with your personal account, not a student-org
   one. Turn on MFA for the root user (IAM -> Security credentials).
2. Billing -> Budgets -> Create budget -> Monthly cost budget, $15, email alerts
   at 50%, 80% and 100%.
3. On this Mac, keep that account separate from any other AWS CLI profile:

   ```bash
   aws configure --profile tandemcode
   aws sts get-caller-identity --profile tandemcode
   ```

   The CLI is optional; everything below can be done in the console.

## 2. Lightsail instance

1. Lightsail -> Create instance: Linux, **Ubuntu 24.04 LTS**, region
   `us-east-1` (Virginia), the **$12** plan (2 GB, 2 vCPU, 60 GB). Name it
   `tandemcode`.
2. Networking -> Create static IP and attach it to the instance. It is free
   while attached.
3. Networking -> IPv4 firewall: allow **HTTPS (443)** alongside the default SSH
   (22) and HTTP (80). Optionally restrict SSH to your own IP.
4. Snapshots -> enable **automatic snapshots**. This is the off-box copy of the
   database dumps.

## 3. Namecheap DNS

Domain List -> `tandemcode.space` -> Advanced DNS. Add:

| Type | Host | Value |
|---|---|---|
| A | `api` | the Lightsail static IP |

Vercel (step 5) and Clerk (step 4) each show more records to add here. Add them
exactly as shown when you get there.

## 4. Clerk production instance

1. Clerk dashboard -> your app -> switch to **Production** and set the domain
   to `tandemcode.space`.
2. Add the DNS records Clerk lists (CNAMEs such as `clerk`, `accounts`, and
   the mail records) in Namecheap. Wait for Clerk to show them as verified.
3. For each social login you offer, production needs your own OAuth
   credentials (for example a Google Cloud OAuth client). Clerk's shared dev
   credentials do not work in production.
4. Paths -> allowed origins: `https://tandemcode.space` and
   `https://www.tandemcode.space`.
5. From API keys, note the **publishable key** (`pk_live_...`), the **secret
   key** (`sk_live_...`) and the **Frontend API URL** (the issuer, likely
   `https://clerk.tandemcode.space`).

## 5. Server

SSH in from the Lightsail console, or with the key it gave you:

```bash
git clone https://github.com/naman0r/tandemcode.git && cd tandemcode
./infra/bootstrap.sh          # Docker, 2 GB swap, gVisor, infra/.env, nightly backup
exit                          # log back in so the docker group applies
cd tandemcode
nano infra/.env               # set CLERK_ISSUER and CLERK_SECRET_KEY
./infra/deploy.sh
```

Once the `api` A record resolves, Caddy fetches a TLS certificate by itself.
`curl https://api.tandemcode.space/health` should print `{"status":"ok"}`.

## 6. Vercel

1. New project -> import `naman0r/tandemcode`, root directory `apps/web`.
   Vercel detects Vite.
2. Environment variables:
   - `VITE_BACKEND_URL` = `https://api.tandemcode.space`
   - `VITE_CLERK_PUBLISHABLE_KEY` = the `pk_live_...` key
3. Deploy, then Settings -> Domains: add `tandemcode.space` and
   `www.tandemcode.space`, and add the records Vercel shows in Namecheap.

`apps/web/vercel.json` sends the security headers. The Content Security
Policy ships as **report-only**: open the site, sign in, join a room, run
code, and check the browser console for CSP reports. When there are none,
rename `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

## 7. Check it

From anywhere:

```bash
./infra/smoke.sh https://tandemcode.space https://api.tandemcode.space
```

Then by hand: sign in, create a room, open the invite link in a private window
with a second account, type in the editor, run a solution.

## Day to day

- **Ship main**: `ssh` in, `cd tandemcode && ./infra/deploy.sh`. Migrations
  run when the API starts. Vercel deploys the web app on every push to main.
- **Logs**: `docker compose -f infra/docker-compose.prod.yml logs -f api runner`
- **Backups**: `/var/backups/tandemcode`, one gzipped dump a night, 14 kept.
  Restore with
  `gunzip -c <file> | docker compose -f infra/docker-compose.prod.yml exec -T db psql -U tandemcode tandemcode`.
- **Moving hosts**: restore a dump on the new box, run `deploy.sh`, and point
  the `api` A record at it.
