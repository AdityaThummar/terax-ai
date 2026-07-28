#!/usr/bin/env bash
set -euo pipefail

TAURI_DIR="src-tauri"
CONF="$TAURI_DIR/tauri.conf.json"
BETA_CONF="$TAURI_DIR/tauri.beta.conf.json"
BACKUP="$TAURI_DIR/tauri.prod-backup.json"

if [ ! -f "$CONF" ]; then
  echo "Error: $CONF not found" >&2
  exit 1
fi

if [ ! -f "$BETA_CONF" ]; then
  echo "Error: $BETA_CONF not found" >&2
  exit 1
fi

if [ -f "$BACKUP" ]; then
  echo "Warning: prod backup already exists at $BACKUP, skipping backup" >&2
else
  cp "$CONF" "$BACKUP"
  echo "Backed up prod config to $BACKUP"
fi

jq -s '.[0] * .[1]' "$CONF" "$BETA_CONF" > "$CONF.tmp" && mv "$CONF.tmp" "$CONF"
echo "Applied beta identity to $CONF"
