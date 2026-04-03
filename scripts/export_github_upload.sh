#!/usr/bin/env bash
set -euo pipefail

# Gera uma pasta com o projeto pronto para upload manual no GitHub,
# removendo artefatos locais e segredos.
#
# Uso:
#   bash scripts/export_github_upload.sh
#   bash scripts/export_github_upload.sh v1.0.0
#   bash scripts/export_github_upload.sh v1.0.0 ./dist/upload-github-v1.0.0

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
VERSION="${1:-v1.0.0}"
DEFAULT_OUTPUT_DIR="${PROJECT_ROOT}/github-upload-${VERSION}-${TIMESTAMP}"
OUTPUT_DIR="${2:-$DEFAULT_OUTPUT_DIR}"

mkdir -p "$OUTPUT_DIR"

rsync -av --delete \
  --exclude ".git/" \
  --exclude ".next/" \
  --exclude "node_modules/" \
  --exclude ".DS_Store" \
  --exclude "*.log" \
  --exclude ".env" \
  --exclude ".env.local" \
  --exclude ".env.*.local" \
  --exclude ".env.test" \
  --exclude ".vscode/" \
  --exclude ".idea/" \
  --exclude "github-upload-*/" \
  "${PROJECT_ROOT}/" "${OUTPUT_DIR}/"

echo
echo "Pasta para upload criada em:"
echo "  ${OUTPUT_DIR}"
echo "Versao:"
echo "  ${VERSION}"
echo
echo "Conteudo pronto para enviar manualmente ao GitHub."
