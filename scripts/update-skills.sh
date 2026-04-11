#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/alirezarezvani/claude-skills.git"
TMP_DIR=$(mktemp -d)
SKILLS_DIR="$(cd "$(dirname "$0")/.." && pwd)/.cursor/skills"

SKILLS=(
  "engineering-team/senior-fullstack"
  "engineering-team/senior-frontend"
  "engineering/database-schema-designer"
  "engineering/statistical-analyst"
  "engineering/data-quality-auditor"
  "product-team/ui-design-system"
  "engineering-team/code-reviewer"
)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "Cloning claude-skills (shallow)..."
git clone --depth 1 "$REPO_URL" "$TMP_DIR" 2>/dev/null

echo "Updating skills in $SKILLS_DIR..."
mkdir -p "$SKILLS_DIR"

for skill_path in "${SKILLS[@]}"; do
  skill_name=$(basename "$skill_path")
  if [ -d "$TMP_DIR/$skill_path" ]; then
    rm -rf "$SKILLS_DIR/$skill_name"
    cp -r "$TMP_DIR/$skill_path" "$SKILLS_DIR/$skill_name"
    echo "  ✓ $skill_name"
  else
    echo "  ✗ $skill_name — not found in repo"
  fi
done

echo ""
echo "Done. $(ls -d "$SKILLS_DIR"/*/ 2>/dev/null | wc -l | tr -d ' ') skills updated."
