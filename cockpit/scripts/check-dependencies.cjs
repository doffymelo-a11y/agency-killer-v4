/**
 * Dependency Checker - Verify all imports have corresponding package.json entries
 * Run: node scripts/check-dependencies.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Analyzing project dependencies...\n');

// Get all TypeScript/JavaScript files
const files = execSync('find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js"', {
  encoding: 'utf8',
  cwd: path.join(__dirname, '..')
}).trim().split('\n');

// Extract all imports
const externalImports = new Set();
const builtInModules = new Set(['react', 'react-dom', 'react/jsx-runtime']);

files.forEach(file => {
  const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

  // Match import statements
  const importRegex = /import\s+.*?\s+from\s+['"](.*?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // Skip relative imports (./ or ../) and @/ aliases
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      continue;
    }

    // Extract package name (handle scoped packages like @supabase/supabase-js)
    let packageName;
    if (importPath.startsWith('@')) {
      // Scoped package: @scope/package or @scope/package/subpath
      const parts = importPath.split('/');
      packageName = `${parts[0]}/${parts[1]}`;
    } else {
      // Regular package: package or package/subpath
      packageName = importPath.split('/')[0];
    }

    if (!builtInModules.has(packageName)) {
      externalImports.add(packageName);
    }
  }
});

// Read package.json
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
);

const installedPackages = new Set([
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {})
]);

// Check for missing packages
const missingPackages = [];
const unusedPackages = [];

externalImports.forEach(pkg => {
  if (!installedPackages.has(pkg)) {
    missingPackages.push(pkg);
  }
});

// Check for potentially unused packages (excluding build tools and types)
const excludeFromUnused = new Set([
  'typescript',
  'vite',
  'eslint',
  'prettier',
  '@types/node',
  '@types/react',
  '@types/react-dom',
  '@vitejs/plugin-react',
  'autoprefixer',
  'postcss',
  'tailwindcss',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser'
]);

installedPackages.forEach(pkg => {
  if (!externalImports.has(pkg) && !excludeFromUnused.has(pkg)) {
    unusedPackages.push(pkg);
  }
});

// Report results
console.log('📦 Imported Packages:', externalImports.size);
console.log('📥 Installed Packages:', installedPackages.size);
console.log('');

if (missingPackages.length > 0) {
  console.log('❌ MISSING PACKAGES (imported but not installed):\n');
  missingPackages.forEach(pkg => {
    console.log(`   - ${pkg}`);
  });
  console.log('\n💡 Install with: npm install ' + missingPackages.join(' '));
  console.log('');
}

if (unusedPackages.length > 0) {
  console.log('⚠️  POTENTIALLY UNUSED PACKAGES:\n');
  unusedPackages.forEach(pkg => {
    console.log(`   - ${pkg}`);
  });
  console.log('\n💡 These packages might be safe to remove (verify first!)');
  console.log('');
}

if (missingPackages.length === 0 && unusedPackages.length === 0) {
  console.log('✅ All dependencies are correctly installed!\n');
  process.exit(0);
} else {
  if (missingPackages.length > 0) {
    console.log('❌ Fix missing packages before running the app!\n');
    process.exit(1);
  }
  process.exit(0);
}
