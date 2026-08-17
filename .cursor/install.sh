#!/usr/bin/env bash
# Idempotent bootstrap for the Senyoro Cloud Agent environment.
# Installs the system tooling required to run a fully local Supabase stack
# (Docker + fuse-overlayfs + Supabase CLI) and project dependencies.
# Safe to run repeatedly; it skips work that is already done.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\n[install] %s\n' "$*"; }

# --- Docker Engine -----------------------------------------------------------
if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine"
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sudo sh /tmp/get-docker.sh
else
  log "Docker already installed ($(docker --version))"
fi

# --- fuse-overlayfs (nested-container storage driver) ------------------------
if ! command -v fuse-overlayfs >/dev/null 2>&1; then
  log "Installing fuse-overlayfs"
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends fuse-overlayfs
  # apt may leave conffile prompts pending in this base image; resolve them.
  sudo DEBIAN_FRONTEND=noninteractive dpkg --configure -a --force-confold || true
else
  log "fuse-overlayfs already installed"
fi

# --- Supabase CLI ------------------------------------------------------------
if ! command -v supabase >/dev/null 2>&1; then
  log "Installing Supabase CLI"
  ARCH="$(dpkg --print-architecture)"
  TAG="$(curl -fsSL https://api.github.com/repos/supabase/cli/releases/latest | grep -oP '"tag_name": "v\K[^"]+')"
  curl -fsSL -o /tmp/supabase.deb \
    "https://github.com/supabase/cli/releases/download/v${TAG}/supabase_${TAG}_linux_${ARCH}.deb"
  sudo dpkg -i /tmp/supabase.deb
else
  log "Supabase CLI already installed ($(supabase --version))"
fi

# --- Docker daemon configuration for nested containers -----------------------
# Docker's default (overlay-on-overlay / nftables) does not work inside the
# Cloud Agent VM. Use the fuse-overlayfs storage driver and the legacy iptables
# backend so bridge networking and container mounts function.
log "Configuring Docker daemon (fuse-overlayfs + legacy iptables)"
sudo mkdir -p /etc/docker
printf '%s\n' '{
  "storage-driver": "fuse-overlayfs",
  "features": { "containerd-snapshotter": false }
}' | sudo tee /etc/docker/daemon.json >/dev/null
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy >/dev/null 2>&1 || true
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy >/dev/null 2>&1 || true

# Allow the current user to talk to the Docker socket without sudo.
sudo groupadd -f docker
sudo usermod -aG docker "$(id -un)" || true

# --- Node dependencies -------------------------------------------------------
log "Installing Node dependencies (npm ci)"
npm ci

log "Install complete"
