#!/usr/bin/env node
/**
 * Script to replace console.log/info/debug with logger equivalents
 * Automatically adds logger import where needed
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, relative, dirname } from 'path';
import { glob } from 'glob';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcDir = resolve(__dirname, '../src');

// Find all TypeScript files
const files = glob.sync('**/*.ts', {
  cwd: srcDir,
  absolute: true,
  ignore: ['**/*.d.ts', '**/node_modules/**'],
});

let totalReplacements = 0;
let filesModified = 0;

for (const filePath of files) {
  let content = readFileSync(filePath, 'utf8');
  let modified = false;
  let replacements = 0;

  // Skip files that already import logger
  const hasLoggerImport = content.includes("from '../lib/logger") ||
                          content.includes("from './lib/logger") ||
                          content.includes("from '../../lib/logger");

  // Count console.log/info/debug occurrences
  const logMatches = content.match(/console\.(log|info|debug)/g);
  if (!logMatches || logMatches.length === 0) {
    continue; // Skip files without console.log/info/debug
  }

  // Calculate relative import path to logger
  const relativeToSrc = relative(dirname(filePath), srcDir);
  const loggerImportPath = relativeToSrc ? `${relativeToSrc}/lib/logger.js` : './lib/logger.js';

  // Add logger import if not present
  if (!hasLoggerImport) {
    // Find the last import statement
    const importRegex = /^import .* from .*;\s*$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);

      // Insert logger import after last import
      const before = content.substring(0, lastImportIndex + lastImport.length);
      const after = content.substring(lastImportIndex + lastImport.length);

      content = `${before}\nimport { logger } from '${loggerImportPath}';\n${after}`;
      modified = true;
    }
  }

  // Replace console.log → logger.log
  const newContent = content
    .replace(/console\.log\(/g, () => {
      replacements++;
      return 'logger.log(';
    })
    .replace(/console\.info\(/g, () => {
      replacements++;
      return 'logger.info(';
    })
    .replace(/console\.debug\(/g, () => {
      replacements++;
      return 'logger.debug(';
    });

  if (newContent !== content || modified) {
    writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    totalReplacements += replacements;
    console.log(`✓ ${relative(srcDir, filePath)}: ${replacements} replacements`);
  }
}

console.log(`\n✅ Done!`);
console.log(`   Files modified: ${filesModified}`);
console.log(`   Total replacements: ${totalReplacements}`);
console.log(`\nVerify with: grep -r "console\\.log\\|console\\.info\\|console\\.debug" --include="*.ts" backend/src/ | wc -l`);
