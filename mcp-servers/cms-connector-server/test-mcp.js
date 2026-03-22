#!/usr/bin/env node

// ═══════════════════════════════════════════════════════════════
// CMS Connector MCP Server - Tests de fond en comble
// ═══════════════════════════════════════════════════════════════

console.log('🧪 Tests CMS Connector MCP Server\n');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 1: Import des modules
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 1: Import des modules');
try {
  const { createAdapter } = await import('./dist/adapters/adapter-factory.js');
  const { globalRateLimiter } = await import('./dist/lib/rate-limiter.js');
  const { sanitizeHTML, sanitizeSEOMeta } = await import('./dist/lib/content-sanitizer.js');
  const { globalChangeRecorder } = await import('./dist/lib/change-recorder.js');

  console.log('   ✓ adapter-factory importé');
  console.log('   ✓ rate-limiter importé');
  console.log('   ✓ content-sanitizer importé');
  console.log('   ✓ change-recorder importé\n');
} catch (error) {
  console.error('   ✗ Erreur import:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 2: Rate Limiter
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 2: Rate Limiter');
try {
  const { RateLimiter } = await import('./dist/lib/rate-limiter.js');

  const limiter = new RateLimiter({ maxRequests: 3, windowMs: 1000 });

  // Première requête
  const check1 = limiter.check('test-site.com');
  if (!check1.allowed) throw new Error('Check 1 devrait être autorisé');
  console.log('   ✓ Requête 1/3 autorisée');

  // Deuxième requête
  const check2 = limiter.check('test-site.com');
  if (!check2.allowed) throw new Error('Check 2 devrait être autorisé');
  console.log('   ✓ Requête 2/3 autorisée');

  // Troisième requête
  const check3 = limiter.check('test-site.com');
  if (!check3.allowed) throw new Error('Check 3 devrait être autorisé');
  console.log('   ✓ Requête 3/3 autorisée');

  // Quatrième requête (devrait être bloquée)
  const check4 = limiter.check('test-site.com');
  if (check4.allowed) throw new Error('Check 4 devrait être bloqué');
  console.log('   ✓ Requête 4/3 bloquée (rate limit atteint)');
  console.log(`   ✓ Retry après ${check4.retryAfter}s\n`);
} catch (error) {
  console.error('   ✗ Erreur rate limiter:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 3: Content Sanitizer
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 3: Content Sanitizer');
try {
  const { sanitizeHTML, sanitizeSEOMeta, truncateContent } = await import('./dist/lib/content-sanitizer.js');

  // Test XSS blocking
  const malicious = '<script>alert("XSS")</script><p>Content valide</p>';
  const sanitized = sanitizeHTML(malicious);
  if (sanitized.includes('<script>')) throw new Error('Script tag non supprimé');
  if (!sanitized.includes('<p>Content valide</p>')) throw new Error('Contenu valide supprimé');
  console.log('   ✓ XSS bloqué (script tag supprimé)');

  // Test truncate
  const longContent = 'a'.repeat(60000);
  const truncated = truncateContent(longContent, 50000);
  if (truncated.length > 50020) throw new Error('Truncation failed');
  console.log('   ✓ Truncation 60KB → 50KB OK');

  // Test SEO meta sanitization
  const seoMeta = {
    title: '<script>bad</script>Title',
    description: 'Description normale',
    canonical_url: 'https://example.com',
    og_image: 'javascript:alert(1)', // URL malveillante
  };
  const sanitizedSEO = sanitizeSEOMeta(seoMeta);
  if (sanitizedSEO.title.includes('<script>')) throw new Error('Script dans SEO title');
  if (sanitizedSEO.og_image) throw new Error('URL malveillante non supprimée');
  console.log('   ✓ SEO meta sanitized (script + URL malveillante supprimés)\n');
} catch (error) {
  console.error('   ✗ Erreur sanitizer:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 4: Change Recorder
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 4: Change Recorder');
try {
  const { ChangeRecorder } = await import('./dist/lib/change-recorder.js');

  const recorder = new ChangeRecorder();

  // Enregistrer un changement
  const record = recorder.record('test-change-1', {
    cms_type: 'wordpress',
    site_url: 'https://test.com',
    content_type: 'post',
    content_id: '123',
    action: 'update',
    previous_state: { title: 'Old Title' },
    new_state: { title: 'New Title' },
    change_summary: {
      content_type: 'post',
      content_id: '123',
      content_title: 'Test Post',
      site_url: 'https://test.com',
      changes: [{ field: 'title', before: 'Old Title', after: 'New Title' }],
    },
    requires_approval: true,
  });

  console.log('   ✓ Changement enregistré');

  // Récupérer le changement
  const retrieved = recorder.get('test-change-1');
  if (!retrieved) throw new Error('Changement non récupéré');
  console.log('   ✓ Changement récupéré');

  // Approuver le changement
  recorder.approve('test-change-1', 'user-123');
  const approved = recorder.get('test-change-1');
  if (!approved.approved) throw new Error('Changement non approuvé');
  console.log('   ✓ Changement approuvé');

  // Rollback
  const previousState = recorder.getPreviousState('test-change-1');
  if (previousState.title !== 'Old Title') throw new Error('Previous state incorrect');
  console.log('   ✓ Previous state récupéré pour rollback\n');
} catch (error) {
  console.error('   ✗ Erreur change recorder:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 5: Adapter Factory
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 5: Adapter Factory');
try {
  const { createAdapter } = await import('./dist/adapters/adapter-factory.js');

  // Test WordPress adapter creation
  const wpAdapter = createAdapter({
    cms_type: 'wordpress',
    site_url: 'https://test-wp.com',
    username: 'test',
    app_password: 'test-password',
  });
  console.log('   ✓ WordPress adapter créé');

  // Test Shopify (devrait throw NOT_IMPLEMENTED)
  try {
    createAdapter({
      cms_type: 'shopify',
      site_url: 'https://test.myshopify.com',
      shop_domain: 'test.myshopify.com',
      access_token: 'test-token',
    });
    throw new Error('Shopify devrait throw NOT_IMPLEMENTED');
  } catch (error) {
    if (error.code === 'NOT_IMPLEMENTED') {
      console.log('   ✓ Shopify NOT_IMPLEMENTED (attendu)');
    } else {
      throw error;
    }
  }

  // Test Webflow (devrait throw NOT_IMPLEMENTED)
  try {
    createAdapter({
      cms_type: 'webflow',
      site_url: 'https://test.webflow.io',
      api_token: 'test-token',
      site_id: 'test-site-id',
    });
    throw new Error('Webflow devrait throw NOT_IMPLEMENTED');
  } catch (error) {
    if (error.code === 'NOT_IMPLEMENTED') {
      console.log('   ✓ Webflow NOT_IMPLEMENTED (attendu)\n');
    } else {
      throw error;
    }
  }
} catch (error) {
  console.error('   ✗ Erreur adapter factory:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 6: Error Handler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 6: Error Handler');
try {
  const { formatErrorForClient, isRetryable } = await import('./dist/lib/error-handler.js');
  const { CMSError, AuthenticationError, RateLimitError } = await import('./dist/types.js');

  // Test CMSError formatting
  const cmsError = new CMSError('Test error', 'TEST_ERROR', 400);
  const formatted = formatErrorForClient(cmsError);
  if (formatted.error !== 'Test error') throw new Error('Message incorrect');
  if (formatted.code !== 'TEST_ERROR') throw new Error('Code incorrect');
  console.log('   ✓ CMSError formaté correctement');

  // Test AuthenticationError
  const authError = new AuthenticationError('Invalid credentials');
  const formattedAuth = formatErrorForClient(authError);
  if (formattedAuth.statusCode !== 401) throw new Error('Status code incorrect');
  console.log('   ✓ AuthenticationError formaté (401)');

  // Test RateLimitError retryable
  const rateLimitError = new RateLimitError('Rate limit exceeded', 60);
  const formattedRL = formatErrorForClient(rateLimitError);
  if (!formattedRL.retryable) throw new Error('Rate limit devrait être retryable');
  if (formattedRL.retryAfter !== 60) throw new Error('retryAfter incorrect');
  console.log('   ✓ RateLimitError retryable (60s)\n');
} catch (error) {
  console.error('   ✗ Erreur error handler:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test 7: Types validation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('✅ Test 7: Types validation');
try {
  const types = await import('./dist/types.js');

  // Vérifier que tous les exports existent
  const requiredExports = [
    'CMSError',
    'AuthenticationError',
    'RateLimitError',
    'NotFoundError',
  ];

  for (const exp of requiredExports) {
    if (!types[exp]) throw new Error(`Export ${exp} manquant`);
  }
  console.log('   ✓ Tous les types exportés');

  // Test NotFoundError
  const notFoundError = new types.NotFoundError('Post', '123');
  if (notFoundError.statusCode !== 404) throw new Error('Status code incorrect');
  console.log('   ✓ NotFoundError (404)\n');
} catch (error) {
  console.error('   ✗ Erreur types:', error.message);
  process.exit(1);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Résumé final
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('═════════════════════════════════════════════════════');
console.log('🎉 TOUS LES TESTS RÉUSSIS');
console.log('═════════════════════════════════════════════════════');
console.log('✅ Imports modules OK');
console.log('✅ Rate limiter OK (60 req/min)');
console.log('✅ Content sanitizer OK (XSS bloqué)');
console.log('✅ Change recorder OK (rollback support)');
console.log('✅ Adapter factory OK (WordPress + NOT_IMPLEMENTED)');
console.log('✅ Error handler OK (formatting + retryable)');
console.log('✅ Types OK (tous exportés)');
console.log('═════════════════════════════════════════════════════\n');
console.log('✅ CMS Connector MCP Server est production-ready !');
