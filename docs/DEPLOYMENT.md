# Deploying Guitar Dojo to a Hostinger KVM VPS

Target: **https://dojo.gagedorl.com**, self-hosted with Docker Compose on an existing VPS. Nothing here reinstalls the server or touches other services already running on it.

```
Internet ──443/80──▶ Caddy (TLS, HSTS) ──▶ app:3000 (Next.js) ──▶ db:5432 (PostgreSQL 17)
                      network "web"          "web" + "backend"      "backend" (internal, no internet)
```

- Only Caddy publishes ports. The app and database publish none; PostgreSQL sits on an internal Docker network with no route to the internet.
- A one-shot `migrate` container applies database migrations before every app start.
- Backups are `pg_dump`, encrypted with **age** (only the public key lives on the server), copied off-server with **rclone**.

Commands below assume Ubuntu/Debian (Hostinger's usual VPS images), a sudo user called `deploy`, and the app in `/opt/guitar-dojo`. Adjust names to taste.

---

## Current production deployment (live since 2026-10-23)

The general guide below covers several options. This section records what is **actually running**, so read it before changing anything that affects production.

| What | Value |
| --- | --- |
| URL | https://dojo.gagedorl.com (DNS: A `dojo` → `69.62.65.213`, no AAAA) |
| Server | Hostinger KVM VPS, Ubuntu 24.04, everything runs as `root` |
| Checkout | `/root/GuitarDojo` (not `/opt/guitar-dojo`), tracking `origin/main` on GitHub |
| Stack | Docker Compose, **Option B**: `.deploy.conf` sets `COMPOSE_FILES="compose.yaml compose.existing-proxy.yaml"`. Containers: `db` (Postgres 17, volume `guitar-dojo_pgdata`), `migrate`, `app`. The bundled Caddy is **not** used. |
| App port | `127.0.0.1:3003` (`APP_LOCAL_PORT=3003` in `.env`). Ports 3000–3002 and 4500 belong to other apps. |
| Reverse proxy | Host **nginx** (shared with other sites): `/etc/nginx/sites-available/dojo.gagedorl.com`, proxying to `127.0.0.1:3003` and *replacing* `X-Forwarded-For` with `$remote_addr`. |
| TLS | Let's Encrypt via `certbot --nginx`; renewal by the system `certbot.timer`. |
| Email | Hostinger SMTP (`smtp.hostinger.com:465`, `SMTP_SECURE=true`) as `admin@gagedorl.com`. SPF, DKIM and DMARC are already set on `gagedorl.com`. Registration is open. |
| Backups | **Not configured yet** (no age key, no rclone remote). Until they are, `scripts/deploy.sh` keeps a local, unencrypted pre-deploy dump in `backups/` instead of an off-site one. |

**Shared server.** The same VPS runs other unrelated sites and apps: nginx sites for `gagedorl.com`, `climbersden`, `heartsync` and `chewcheck.tech`, plus several pm2 processes. Guitar Dojo does **not** use pm2. Docker's `restart: unless-stopped` keeps it running across reboots. Never stop, restart or edit the other sites or pm2 apps. Don't install host-level services (for example a system PostgreSQL); dependencies run in Docker.

### Shipping changes (the normal workflow)

Development happens elsewhere and is pushed to `main` on GitHub. **Deploying is done on the server, only when the owner asks for it**:

```bash
cd /root/GuitarDojo
git pull --ff-only
scripts/deploy.sh      # pre-deploy dump → build image for HEAD → migrate → start app → health check
curl -fsS https://dojo.gagedorl.com/api/health
```

What that means for whoever writes the code:

- **Only committed code on `main` ships.** `deploy.sh` builds the checked-out commit and refuses to run with uncommitted changes. Don't make edits directly on the server; `git pull --ff-only` fails if the server's checkout has diverged.
- **New courses and lessons are content-only.** They're compiled into the app image, so a pull + `deploy.sh` is all they need. There's no database change, no restart of anything else, and no nginx change.
- **Run the quality gates before pushing** (`npm run check`, and the e2e suite for UI changes). The server builds with `npm ci` + `next build` inside Docker (Node 22). A type error fails the build there, and the old version keeps running.
- **Database changes** need a committed migration in `drizzle/` (`npm run db:generate`). The `migrate` container applies it automatically on deploy. It must stay backward compatible with the previous app version (expand, then contract), because rollback only switches the app image.
- **Never rename published course, lesson or exercise ids.** Live users' progress is keyed on them.
- **New environment variables** must be added to `.env.example`, to the `app` service's `environment:` in `compose.yaml` (the app only sees variables listed there), and to `src/server/env.ts`. The owner then has to add the real value to the server's `.env` before deploying. Say so in the hand-off.
- Anything needing a new port, domain or host-level change is a deployment change. Describe it rather than assume it.

**Rollback:** `scripts/rollback.sh` lists recent deploys; `scripts/rollback.sh <version>` switches back in seconds. A local pre-deploy dump (while off-site backups are unset) is restored with `docker compose -f compose.yaml -f compose.existing-proxy.yaml exec -T db pg_restore -U guitardojo -d guitardojo --clean --if-exists --no-owner --no-privileges --single-transaction < backups/<file>.dump`, with the app stopped first.

**Operating commands** in section 7 need both compose files on this server: `docker compose -f compose.yaml -f compose.existing-proxy.yaml ps` (or `logs -f app`, and so on). The scripts in `scripts/` pick them up from `.deploy.conf` automatically.

---

## 0. Decide three things first

1. **Who sends email?** Email verification and password reset need working SMTP; sign-up stays closed until it's configured. Use a transactional provider (Postmark, Resend, Brevo, Amazon SES) or Hostinger Email if you already have a mailbox on `gagedorl.com` (`smtp.hostinger.com`, port 465, `SMTP_SECURE=true`).
2. **Where do backups go?** Any rclone-supported storage that is *not this VPS*: Backblaze B2, Cloudflare R2, Wasabi, S3, Google Drive. Hostinger's VPS snapshots are a nice extra but are not a substitute: they live with the same provider and restore the whole machine, not a single database.
3. **Is something already listening on ports 80/443?** Check in step 2. If yes, use **Option B** (your existing proxy forwards to the app). If no, use **Option A** (bundled Caddy).

## 1. DNS

In the DNS zone for `gagedorl.com` (hPanel → Domains → DNS / Nameservers, or wherever the domain's DNS is hosted):

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| A | `dojo` | your VPS IPv4 (hPanel → VPS → Overview) | 300 |
| AAAA | `dojo` | your VPS IPv6, **only if** the VPS has one configured | 300 |

Optional but recommended: a CAA record allowing Let's Encrypt, `CAA 0 issue "letsencrypt.org"` on `gagedorl.com` (check you don't already have CAA records for another CA).

Check propagation from your own computer: `nslookup dojo.gagedorl.com` should return the VPS address. Raise the TTL to 3600 once everything works.

**Email DNS** (for deliverability, set up with your email provider): SPF, DKIM and DMARC records for `gagedorl.com` exactly as the provider tells you. Without them, verification emails land in spam.

## 2. Inspect and prepare the VPS

SSH in and look before changing anything:

```bash
ssh deploy@<vps-ip>
lsb_release -a; uname -m                         # OS + architecture
docker --version; docker compose version         # already installed?
sudo ss -tlnp | grep -E ':(80|443|3000|5432)\b'  # anything using our ports?
df -h /; free -h                                 # disk and memory
sudo ufw status verbose                          # firewall state
```

**Install Docker** only if it's missing (official repository; leaves other software alone):

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl git age rclone
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update && sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy   # log out and back in afterwards
```

(On Debian, replace `ubuntu` with `debian` in both URLs.) If Docker is already installed, just make sure `age`, `rclone`, `git` and `curl` are present.

### Firewall

Allow SSH **before** enabling the firewall so you don't lock yourself out:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp      # HTTP/3
sudo ufw enable             # only if it wasn't already enabled
```

Mirror the same rules in hPanel's VPS firewall if you use it. Note: Docker-published ports bypass UFW. That's why this stack publishes **only** Caddy's 80/443, and the database publishes nothing.

### SSH hardening (if not done already)

1. Make sure key login works for your user (`ssh-copy-id deploy@<vps-ip>` from your computer).
2. In `/etc/ssh/sshd_config` (or a file in `/etc/ssh/sshd_config.d/`): `PasswordAuthentication no`, `PermitRootLogin no` (or `prohibit-password`), `KbdInteractiveAuthentication no`.
3. `sudo sshd -t && sudo systemctl reload ssh`, then **open a second terminal and confirm you can still log in** before closing the first.
4. Keep the OS patched: `sudo apt-get install -y unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades`. Optional: `fail2ban`.

## 3. Get the code and configure secrets

```bash
sudo mkdir -p /opt/guitar-dojo && sudo chown deploy:deploy /opt/guitar-dojo
git clone https://github.com/GageDorl/GuitarDojo.git /opt/guitar-dojo
cd /opt/guitar-dojo
cp .env.example .env && chmod 600 .env
openssl rand -hex 32       # -> POSTGRES_PASSWORD
openssl rand -base64 48    # -> BETTER_AUTH_SECRET
nano .env                  # fill in every value
```

`.env` is ignored by git and excluded from Docker images. Keep a copy of it in your password manager: without `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` you can't run a restored server.

**Option B only** (existing reverse proxy): tell the scripts to use the override file:

```bash
echo 'COMPOSE_FILES="compose.yaml compose.existing-proxy.yaml"' > .deploy.conf
```

Sanity-check the configuration (prints the resolved config, catches missing variables):

```bash
docker compose config --quiet && echo OK
```

## 4. First deployment

```bash
cd /opt/guitar-dojo
chmod +x scripts/*.sh
scripts/deploy.sh
```

This builds the images on the VPS (a few minutes the first time), starts PostgreSQL, runs migrations, starts the app and waits until its health check passes.

- **Option A (bundled Caddy):** Caddy requests a Let's Encrypt certificate on first start. Watch it with `docker compose logs -f caddy` until you see the certificate obtained, then open https://dojo.gagedorl.com.
- **Option B (existing proxy):** the app listens on `127.0.0.1:3000` only. Add a site to your proxy:

  ```nginx
  # nginx (with certbot or your existing TLS setup)
  server {
      server_name dojo.gagedorl.com;
      client_max_body_size 1m;
      location / {
          proxy_pass http://127.0.0.1:3000;
          proxy_set_header Host $host;
          proxy_set_header X-Forwarded-For $remote_addr;   # REPLACE, don't append: rate limiting trusts it
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

  For a host-level Caddy: `dojo.gagedorl.com { reverse_proxy 127.0.0.1:3000 }`.

### Verify

```bash
curl -fsS https://dojo.gagedorl.com/api/health        # {"status":"ok"}
docker compose ps                                     # app/db/caddy healthy, migrate exited 0
docker compose exec db psql -U guitardojo -d guitardojo -c '\dt'   # tables exist
nc -zv <vps-ip> 5432 3000   # from YOUR computer: both must FAIL (closed)
```

Then, in a browser: open a lesson without an account; create an account with your own email; confirm the email; check that progress made before signing up appears; sign in on your phone and check that it syncs; use "Forgot password" once.

Registration opens automatically once SMTP is configured. To close it temporarily, set `AUTH_REGISTRATION=closed` in `.env` and run `docker compose up -d app`.

## 5. Backups

### One-time setup

On **your own computer** (not the server), create the encryption key pair:

```bash
age-keygen -o guitar-dojo-backup.key     # prints "Public key: age1..."
```

Store `guitar-dojo-backup.key` in your password manager **and** one offline place. Put only the public key (`age1...`) in the server's `.env` as `BACKUP_AGE_RECIPIENT`. A stolen server can then write backups but never read them.

On the server, configure the off-site remote and test a backup:

```bash
rclone config                 # create a remote, e.g. "offsite" (Backblaze B2 / S3 / R2 …)
# BACKUP_RCLONE_REMOTE in .env, e.g. offsite:guitar-dojo-backups/db
scripts/backup.sh manual
rclone ls offsite:guitar-dojo-backups/db
```

Tip: give rclone an access key restricted to that one bucket. For ransomware resistance, enable the bucket's versioning or object lock and let a lifecycle rule do the pruning (then remove the `rclone delete` line in `backup.sh`).

### Schedule

```bash
sudo tee /etc/cron.d/guitar-dojo-backup >/dev/null <<'EOF'
# Daily encrypted backups at 03:15 UTC and 15:15 UTC (worst case: ~12 h of data lost)
15 3,15 * * * deploy cd /opt/guitar-dojo && scripts/backup.sh scheduled >> /var/log/guitar-dojo-backup.log 2>&1
EOF
sudo touch /var/log/guitar-dojo-backup.log && sudo chown deploy /var/log/guitar-dojo-backup.log
```

To be alerted when backups stop, create a free check at healthchecks.io and append `&& curl -fsS -m 10 https://hc-ping.com/<your-uuid>` to the cron command.

### Restore

Monthly drill (restores into a scratch database, touches nothing live):

```bash
rclone copy offsite:guitar-dojo-backups/db/<file>.dump.age backups/
# copy the private key to the server temporarily, e.g. scp guitar-dojo-backup.key deploy@<vps>:/tmp/
scripts/restore.sh backups/<file>.dump.age /tmp/guitar-dojo-backup.key
shred -u /tmp/guitar-dojo-backup.key
```

Real recovery (replaces live data; takes a safety backup first and asks for confirmation):

```bash
scripts/restore.sh backups/<file>.dump.age /tmp/guitar-dojo-backup.key --production
```

**Rebuilding on a new server:** steps 2–3 with your saved `.env`, `scripts/deploy.sh`, then the production restore above.

## 6. Updating and rolling back

```bash
cd /opt/guitar-dojo
git pull --ff-only
scripts/deploy.sh        # backup → build → migrate → start → health check
```

Each deploy is tagged with its commit, and old images stay on disk.

```bash
scripts/rollback.sh               # show recent deploys
scripts/rollback.sh <version>     # switch the app back (seconds, no rebuild)
```

**Database changes and rollback.** Migrations are never reversed automatically. The rule for this codebase: a migration must keep the *previous* app version working ("expand, then contract": add columns/tables first, remove old ones only in a later release). Then rolling back the app is always safe. If a release ever has to break that rule, its pre-deploy backup (`backups/*pre-deploy-<version>*`) is the rollback path: `scripts/restore.sh … --production`.

Housekeeping every month or two: `docker image prune -a --filter "until=720h"` (keeps the last month of versions).

## 7. Operating it

| Task | Command |
| --- | --- |
| Status | `docker compose ps` |
| Logs | `docker compose logs -f --tail=100 app` (or `caddy`, `db`) |
| Restart app | `docker compose restart app` |
| Health | `curl -fsS https://dojo.gagedorl.com/api/health` |
| DB shell | `docker compose exec db psql -U guitardojo -d guitardojo` |
| Disk | `df -h /` and `docker system df` |

Point an uptime monitor (UptimeRobot, healthchecks.io, Better Stack) at `https://dojo.gagedorl.com/api/health`. It returns 503 if the database is unreachable.

Make yourself an administrator (a permission for future staff tools, not a subscription):
`docker compose exec db psql -U guitardojo -d guitardojo -c "update \"user\" set role = 'admin' where email = 'you@example.com';"`

---

## Security checklist

- [ ] `dojo` A (and AAAA, if used) records point at the VPS; HTTPS works and `http://` redirects to `https://`.
- [ ] `.env` exists only on the server (and in your password manager), `chmod 600`, never committed.
- [ ] `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` are freshly generated random values.
- [ ] From outside, ports 5432 and 3000 are closed (`nc -zv <vps-ip> 5432 3000` fails).
- [ ] UFW (and/or hPanel firewall) allows only SSH, 80 and 443.
- [ ] SSH: key-only login, no root password login, tested in a second session.
- [ ] Unattended security upgrades enabled.
- [ ] SMTP works: you received a verification email and a password-reset email, and they weren't in spam (SPF/DKIM/DMARC set).
- [ ] Registration is open only after email works (it closes itself otherwise).
- [ ] Rate limiting: six quick wrong-password sign-ins from one browser get "Too many attempts".
- [ ] Sign-out on one device and password resets revoke sessions immediately (no cookie cache).
- [ ] `UNSAFE_LOCAL_TEST_MODE` is **not** set anywhere on the server.
- [ ] Uptime monitor on `/api/health`.

## Backup checklist

- [ ] age private key stored in a password manager **and** offline; only the public key is on the server.
- [ ] rclone remote is off-server, with a bucket-restricted key; versioning/object lock considered.
- [ ] `scripts/backup.sh manual` succeeds and the file appears on the remote.
- [ ] Cron job installed; backup log rotates or stays small; a missed-backup alert exists.
- [ ] A test restore (`scripts/restore.sh <file> <key>`) has succeeded, and it's repeated monthly.
- [ ] `.env` is saved in your password manager (needed to rebuild a server).
- [ ] Hostinger VPS snapshots enabled as a second layer (not a replacement).

---

## Future: paid courses (not implemented)

Everything is free during the beta, and no payment code exists. When it's time:

1. **Entitlements table.** Add `entitlement (id, user_id, scope_kind 'course'|'product', scope_id, source 'subscription'|'purchase'|'promotion'|'complimentary'|'admin-grant', starts_at, expires_at, external_ref)` with a Drizzle migration. Implement `EntitlementProvider.getEntitlements` in `src/server/access.ts` as a query. Nothing else in the access layer changes.
2. **Mark content.** Add entries to `COURSE_ACCESS` in `src/content/access.ts` (for example a course needing product `premium`, with a free preview lesson). The lesson page and progress API already enforce it server-side; gated lessons simply stop being statically pre-rendered.
3. **Payments.** Add a webhook route, e.g. `src/app/api/webhooks/stripe/route.ts`. It verifies the provider's signature, then records the purchase or subscription in its own table (`stripe_customer`, `subscription`) and creates, extends or expires entitlement rows. Checkout pages call the provider; the app never handles card data.
4. **Admin grants.** Complimentary and promotional access are entitlement rows with `source = 'complimentary'` or `'promotion'`, created from an admin screen that checks `role = 'admin'`. Roles never imply paid access; admins see paid content through the separate staff-preview permission.
