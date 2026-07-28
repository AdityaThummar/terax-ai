#!/usr/bin/env bash
set -euo pipefail

TAURI_DIR="src-tauri"
CONF="$TAURI_DIR/tauri.conf.json"
BACKUP="$TAURI_DIR/tauri.prod-backup.json"

if [ ! -f "$BACKUP" ]; then
  echo "Error: No prod backup found at $BACKUP" >&2
  exit 1
fi

mv "$BACKUP" "$CONF"
echo "Restored prod identity to $CONF"
