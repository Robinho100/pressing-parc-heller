#!/bin/bash
# Sauvegarde de la base SQLite locale (Alwaysdata).
# À exécuter via une tâche planifiée Alwaysdata (1x/jour).
#
#   Panneau Alwaysdata -> Advanced -> Tasks -> Add a task
#   Command : bash /home/pressing-parc-heller/pressing-parc-heller/scripts/backup-db.sh
#   Fréquence : quotidienne (ex. 03:30)
#
# - copie horodatée dans ~/backups (HORS de public/, jamais servi par le web)
# - garde les 14 dernières, supprime les plus anciennes
# - permissions 600 (lisible par le seul compte)

set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="$APP_DIR/data/pressing.db"
DEST="$HOME/backups"
KEEP=14

[ -f "$DB" ] || { echo "Base introuvable : $DB" >&2; exit 1; }

mkdir -p "$DEST"
chmod 700 "$DEST"

STAMP="$(date +%Y-%m-%d_%H%M%S)"
OUT="$DEST/pressing_$STAMP.db"

# .backup = copie cohérente même si l'appli écrit pendant la sauvegarde
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "$DB" ".backup '$OUT'"
else
  cp "$DB" "$OUT"
fi
chmod 600 "$OUT"

# Rotation
ls -1t "$DEST"/pressing_*.db 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

echo "OK  $OUT  ($(du -h "$OUT" | cut -f1))"
