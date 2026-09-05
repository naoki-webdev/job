#!/bin/bash
set -e

rm -f /app/tmp/pids/server.pid

if [ "${RUN_DB_PREPARE:-true}" = "true" ]; then
  ruby bin/rails db:prepare
fi

if [ "${RUN_DB_SEED_IF_EMPTY:-false}" = "true" ]; then
  if ruby bin/rails runner 'exit((Job.exists? || Position.exists? || Location.exists? || TechStack.exists? || ScoringPreference.exists?) ? 1 : 0)'; then
    echo "Database is empty. Running db:seed..."
    ruby bin/rails db:seed
  else
    echo "Skipping db:seed because application data already exists."
  fi
fi

if [ -n "${ADMIN_USER_EMAIL:-}" ] && [ -n "${ADMIN_USER_PASSWORD:-}" ]; then
  ruby bin/rails runner 'AdminUserProvisioner.call'
fi

exec "$@"
