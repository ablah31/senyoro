#!/usr/bin/env bash
# Per-boot startup for the Senyoro Cloud Agent environment.
# Brings up the Docker daemon and a local Supabase stack, applies the demo
# seed, ensures an admin login exists, and writes .env.local for Next.js.
# Idempotent: detects already-running services and returns once ready.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

log() { printf '\n[start] %s\n' "$*"; }

# Local Supabase demo values are deterministic and public (never secrets).
SUPABASE_URL="http://127.0.0.1:54321"
PUBLISHABLE_KEY="sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
ADMIN_EMAIL="admin@senyoro.local"
ADMIN_PASSWORD="Senyoro2026!"

# --- Docker daemon -----------------------------------------------------------
if ! sudo docker info >/dev/null 2>&1; then
  log "Starting Docker daemon"
  sudo rm -f /var/run/docker.pid || true
  nohup sudo dockerd >/tmp/dockerd.log 2>&1 &
  for _ in $(seq 1 30); do
    if sudo docker info >/dev/null 2>&1; then break; fi
    sleep 1
  done
else
  log "Docker daemon already running"
fi
# Make the socket reachable without relying on docker-group membership being
# active in this shell session (single-user dev VM).
sudo chmod 666 /var/run/docker.sock 2>/dev/null || true

# --- Supabase stack ----------------------------------------------------------
# Realtime/analytics/pooler/edge-runtime are unused by the app and excluded to
# keep the stack lean.
if ! supabase status >/dev/null 2>&1; then
  log "Starting local Supabase stack"
  supabase start -x realtime,logflare,vector,supavisor,edge-runtime
else
  log "Supabase stack already running"
fi

# Wait for the REST/Auth gateway to answer.
for _ in $(seq 1 30); do
  if curl -sf "${SUPABASE_URL}/rest/v1/" -H "apikey: ${PUBLISHABLE_KEY}" >/dev/null 2>&1; then break; fi
  sleep 1
done

# --- .env.local --------------------------------------------------------------
log "Writing .env.local"
cat > .env.local <<EOF
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${PUBLISHABLE_KEY}
EOF

# --- Admin login (idempotent) ------------------------------------------------
# The on_auth_user_created trigger attaches the profile to the Senyoro org.
log "Ensuring admin user ${ADMIN_EMAIL} exists"
curl -s -o /dev/null -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"Administrateur Senyoro\"}}" || true

# --- Demo seed (idempotent) --------------------------------------------------
if [ -f supabase/seed/demo.sql ]; then
  log "Applying demo seed"
  docker exec -i supabase_db_senyoro psql -U postgres -q < supabase/seed/demo.sql || true
fi

log "Environment ready"
log "App:      http://localhost:3000  (login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD})"
log "Supabase: Studio http://127.0.0.1:54323 | API ${SUPABASE_URL}"
