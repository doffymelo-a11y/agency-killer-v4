#!/bin/bash
# Script to replace console.log/info/debug with logger equivalents
# Automatically adds logger import where needed

set -e

SRC_DIR="../src"
MODIFIED=0
TOTAL_REPLACEMENTS=0

echo "🔍 Finding TypeScript files with console.log/info/debug..."

# Find all .ts files (excluding .d.ts and node_modules)
FILES=$(find "$SRC_DIR" -name "*.ts" -not -name "*.d.ts" -not -path "*/node_modules/*" -type f)

for file in $FILES; do
  # Check if file contains console.log/info/debug
  if ! grep -q "console\.\(log\|info\|debug\)" "$file" 2>/dev/null; then
    continue
  fi

  # Count occurrences
  COUNT=$(grep -c "console\.\(log\|info\|debug\)" "$file" || echo "0")

  if [ "$COUNT" -eq 0 ]; then
    continue
  fi

  # Check if logger import already exists
  if ! grep -q "from.*logger" "$file"; then
    # Calculate relative path to src/lib/logger.ts
    FILE_DIR=$(dirname "$file")
    REL_PATH=$(python3 -c "import os.path; print(os.path.relpath('$SRC_DIR', '$FILE_DIR'))")

    # Add import after last existing import
    # Use awk to find last import line and insert logger import
    awk '
      /^import .* from/ { last_import = NR }
      { lines[NR] = $0 }
      END {
        for (i = 1; i <= NR; i++) {
          print lines[i]
          if (i == last_import) {
            print "import { logger } from '\'''"$REL_PATH"/lib/logger.js'\'';"
          }
        }
      }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  fi

  # Replace console.log → logger.log
  sed -i '' 's/console\.log(/logger.log(/g' "$file"
  sed -i '' 's/console\.info(/logger.info(/g' "$file"
  sed -i '' 's/console\.debug(/logger.debug(/g' "$file"

  MODIFIED=$((MODIFIED + 1))
  TOTAL_REPLACEMENTS=$((TOTAL_REPLACEMENTS + COUNT))

  echo "✓ $(basename $file): $COUNT replacements"
done

echo ""
echo "✅ Done!"
echo "   Files modified: $MODIFIED"
echo "   Total replacements: $TOTAL_REPLACEMENTS"
echo ""
echo "Verify with: grep -r \"console\\.log\\|console\\.info\\|console\\.debug\" --include=\"*.ts\" backend/src/ | wc -l"
