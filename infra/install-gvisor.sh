#!/usr/bin/env bash
# Install gVisor's runsc and register it with Docker, on Ubuntu or Debian.
# Steps from https://gvisor.dev/docs/user_guide/install/
set -euo pipefail

sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg

curl -fsSL https://gvisor.dev/archive.key \
  | sudo gpg --dearmor --yes -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" \
  | sudo tee /etc/apt/sources.list.d/gvisor.list > /dev/null

sudo apt-get update
sudo apt-get install -y runsc

# Adds a "runsc" runtime to /etc/docker/daemon.json.
sudo runsc install
sudo systemctl reload docker

docker run --rm --runtime=runsc hello-world > /dev/null
echo "runsc is registered with Docker"
