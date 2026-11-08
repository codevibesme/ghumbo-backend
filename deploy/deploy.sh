#!/usr/bin/env bash
# Runs on the EC2 host as root, from SSM Run Command (the Deploy workflow) or by hand in
# a Session Manager shell:
#
#   /opt/ghumbo/deploy.sh <account>.dkr.ecr.<region>.amazonaws.com/ghumbo-backend:<sha>
#
# Expects /opt/ghumbo/{docker-compose.yml,Caddyfile,.env}. Never writes .env.
set -euo pipefail

IMAGE="${1:?usage: deploy.sh <registry>/ghumbo-backend:<sha>}"
cd /opt/ghumbo

if [ ! -f .env ]; then
  echo "/opt/ghumbo/.env is missing. Create it by hand before deploying." >&2
  exit 1
fi

REGISTRY="${IMAGE%%/*}"
REGION="$(echo "$REGISTRY" | cut -d. -f4)"
aws ecr get-login-password --region "$REGION" |
  docker login --username AWS --password-stdin "$REGISTRY" >/dev/null

export IMAGE
echo "==> Pulling $IMAGE"
docker compose pull --quiet

echo "==> Running migrations"
docker compose run --rm --no-deps api node dist/migrate.js

echo "==> Starting services"
docker compose up -d --remove-orphans

echo "==> Waiting for the API to be healthy"
status=starting
for _ in $(seq 1 45); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$(docker compose ps -q api)")"
  [ "$status" = healthy ] && break
  sleep 2
done
if [ "$status" != healthy ]; then
  echo "API is $status after 90s" >&2
  docker compose logs --tail 50 api >&2
  exit 1
fi

echo "==> Checking Postgres and Redis from the API"
docker compose exec -T api node -e "
  fetch('http://127.0.0.1:8000/health/ready')
    .then(async (r) => { console.log(await r.text()); process.exit(r.ok ? 0 : 1); })
    .catch((e) => { console.error(e.message); process.exit(1); })"

echo "==> Smoke check through Caddy"
API_DOMAIN="$(grep -E '^API_DOMAIN=' .env | cut -d= -f2-)"
curl -fsS --retry 10 --retry-delay 3 --retry-all-errors \
  --resolve "$API_DOMAIN:443:127.0.0.1" -o /dev/null "https://$API_DOMAIN/"

echo "$IMAGE" > current_image
# Old images are removed; a rollback pulls them again from ECR.
docker image prune -af --filter until=168h >/dev/null
echo "==> Deployed $IMAGE"
