#!/usr/bin/env bash
# One-time setup of a fresh Ubuntu 24.04 host (a Lightsail instance), run as
# the default sudo user from a clone of the repo:
#   git clone https://github.com/naman0r/tandemcode.git && cd tandemcode
#   ./infra/bootstrap.sh
# Safe to run again.
set -euo pipefail
cd "$(dirname "$0")/.."

# Docker Engine and the compose plugin, from Docker's apt repository.
if ! command -v docker > /dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER"
fi

# 2 GB of RAM holds Postgres, the API and one judge container, with little
# to spare; swap absorbs a spike instead of the OOM killer.
if ! swapon --show | grep -q /swapfile; then
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab > /dev/null
fi

command -v runsc > /dev/null || ./infra/install-gvisor.sh

if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env
  sed -i "s/^DB_PASSWORD=$/DB_PASSWORD=$(openssl rand -hex 24)/" infra/.env
  sed -i "s/^DB_ADMIN_PASSWORD=$/DB_ADMIN_PASSWORD=$(openssl rand -hex 24)/" infra/.env
  chmod 600 infra/.env
  echo "Wrote infra/.env. Fill in CLERK_ISSUER and CLERK_SECRET_KEY, then run ./infra/deploy.sh"
fi

# Nightly database dump at 03:15, kept for 14 days.
sudo mkdir -p /var/backups/tandemcode
# deploy.sh takes a dump as this user before migrating; cron runs as root.
sudo chown "$USER" /var/backups/tandemcode
echo "15 3 * * * root $(pwd)/infra/backup.sh" | sudo tee /etc/cron.d/tandemcode-backup > /dev/null

echo "Bootstrap done. Log out and back in once so the docker group applies."
