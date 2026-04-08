# AUDIT DE SECURITE COMPLET — The Hive OS V5

**Date :** 2026-04-06
**Niveau de risque global : CRITIQUE**
**Resultat : 15 CRITIQUES | 8 HAUTES | 6 MOYENNES | 4 BASSES**

---

## RESUME EXECUTIF

L'audit de securite revele des vulnerabilites graves qui **BLOQUENT tout deploiement en production**. Les 3 plus dangereuses :

1. **Credentials exposes dans les fichiers .env commites dans git** (cles API Anthropic, Supabase, Meta OAuth, Google OAuth, mot de passe DB)
2. **Middleware d'authentification desactive** sur les routes critiques (chat, CMS, genesis) — n'importe qui peut appeler les agents
3. **XSS dans UIComponentRenderer** — injection de code JavaScript via les reponses agents

---

## VULNERABILITES CRITIQUES (15)

### CRIT-01 : Secrets exposes dans fichiers .env commites

**Fichiers :** `backend/.env`, `cockpit/.env`, `mcp-bridge/.env`
**Severite :** CRITIQUE

**Credentials exposes :**
- Supabase Anon Key + Service Role Key
- Anthropic API Key (`sk-ant-api03-...`)
- Meta OAuth Client ID + Secret
- Google OAuth Client ID + Secret
- Mot de passe base de donnees
- Chemin Google Cloud credentials

**Exploitation :** Acces complet a la DB, facturation API Claude, hijack OAuth, acces Google Cloud

**Action :**
1. REVOQUER immediatement TOUS les credentials exposes
2. Supprimer les .env de l'historique git (`git filter-branch` ou BFG Repo-Cleaner)
3. Regenerer TOUTES les cles API
4. Ne commiter QUE les `.env.example`
5. Ajouter `.env` au `.gitignore` si ce n'est pas deja fait

---

### CRIT-02 : Auth middleware desactivee sur routes production

**Fichiers :**
- `backend/src/routes/chat.routes.ts` (ligne ~21)
- `backend/src/routes/cms.routes.ts` (lignes ~27, 49, 71)
- `backend/src/routes/phase-transition.routes.ts`

**Code problematique :**
```typescript
router.post('/',
  // authMiddleware, // TODO: Re-enable after Phase 2.5 testing
  chatRateLimiter,
  ...
)
```

**Aggravant — fallback test-user :**
```typescript
const userId = (req as any).user?.id || 'test-user';
```

**Exploitation :** Tout utilisateur non authentifie peut executer des taches, acceder aux projets, modifier le CMS, manipuler les phases

**Action :**
1. Decommenter `authMiddleware` sur TOUTES les routes
2. Supprimer le fallback `'test-user'`
3. Retourner 401 si pas de userId

---

### CRIT-03 : XSS dans UIComponentRenderer

**Fichier :** `cockpit/src/components/chat/UIComponentRenderer.tsx` (~ligne 386)

**Code problematique :**
```typescript
<div dangerouslySetInnerHTML={{ __html: htmlContent }} />
```

La fonction `parseMarkdownToHTML()` (lignes 46-91) fait des remplacements regex SANS sanitisation DOMPurify.

**Vecteur d'attaque :**
```
Input: **Bold <img src=x onerror="alert('XSS')"> text**
Resultat: <strong>Bold <img src=x onerror="alert('XSS')"> text</strong>
```

**Action :**
```typescript
import DOMPurify from 'dompurify';
const sanitized = DOMPurify.sanitize(htmlContent);
<div dangerouslySetInnerHTML={{ __html: sanitized }} />
```

---

### CRIT-04 : Bypass rate limiting (routes non authentifiees)

**Fichier :** `backend/src/middleware/rate-limit.middleware.ts` (~ligne 46-50)

**Probleme :** Sans auth, le rate limiting tombe sur l'IP. Contournable par rotation d'IP (proxy, VPN, botnet) ou spoofing `X-Forwarded-For`.

**Action :** Exiger l'authentification AVANT le rate limiting. Utiliser IP + fingerprinting comme fallback.

---

### CRIT-05 : Upload Cloudinary sans validation

**Fichier :** `mcp-servers/web-intelligence-server/src/lib/cloudinary.ts` (~ligne 52-93)

**Manquant :**
- Validation taille fichier (pas de limite)
- Validation type fichier (magic numbers)
- Scan malware
- Sanitisation nom de fichier (path traversal possible)

**Action :**
- Limite 10MB
- Validation magic numbers PNG/JPEG
- Sanitisation `path.basename()` + regex `[^a-zA-Z0-9._-]`

---

### CRIT-06 : Injection Write-Back Commands

**Fichier :** `backend/src/shared/write-back.processor.ts` (~ligne 16-35)

**Probleme :** Les WriteBackCommands des agents modifient directement la DB sans verifier :
- Source legitime (agent autorise ?)
- Autorisation utilisateur (ce projet est le sien ?)
- Validite structurelle
- Absence de duplication/spoofing

**Exploitation :** Une reponse Claude compromised peut envoyer `UPDATE_PROJECT_PHASE: completed` et marquer tout le projet comme termine.

**Action :**
1. Whitelist de commandes autorisees par agent
2. Verification ownership projet + userId
3. Audit logging de chaque commande
4. Limite de 100 commandes par requete

---

### CRIT-07 : Risque injection SQL (WordPress Adapter)

**Fichier :** `mcp-servers/cms-connector-server/src/adapters/wordpress.adapter.ts` (~ligne 50)

**Probleme :** Concatenation de `site_url` dans l'URL base sans validation

**Action :** Utiliser `new URL('wp-json/wp/v2', credentials.site_url)` au lieu de template string

---

### CRIT-08 : Absence protection CSRF

**Fichier :** `backend/src/index.ts` (~ligne 48-52)

**Probleme :** CORS configure mais aucun token CSRF. Un attaquant peut forger un formulaire sur son site qui POST vers `/api/chat` avec les cookies de l'utilisateur.

**Action :** Implementer `csurf` middleware ou token CSRF custom dans les headers

---

### CRIT-09 a CRIT-15 : Autres critiques

| # | Issue | Fichier |
|---|-------|---------|
| CRIT-09 | Pas de validation `exp` sur les JWT | `auth.middleware.ts` |
| CRIT-10 | Tokens stockes dans localStorage (vulnerable au XSS) | Frontend Supabase client |
| CRIT-11 | Pas d'invalidation de session/logout server-side | Auth middleware |
| CRIT-12 | MCP servers partagent les variables d'env (un server compromis = acces a tout) | `mcp-bridge/config.ts` |
| CRIT-13 | Pas de chiffrement supplementaire des credentials OAuth dans `user_integrations` | Supabase table |
| CRIT-14 | `parseMarkdownToHTML()` ne valide pas les URLs dans les liens markdown (javascript: protocol possible) | `UIComponentRenderer.tsx` |
| CRIT-15 | Pas de Content-Security-Policy stricte | Backend headers |

---

## VULNERABILITES HAUTES (8)

| # | Issue | Fichier | Action |
|---|-------|---------|--------|
| HIGH-01 | Headers securite par defaut (Helmet config minimale) | `backend/src/index.ts` | Configurer CSP, Referrer-Policy, Permissions-Policy strictes |
| HIGH-02 | Fuite d'information dans les erreurs (stack traces + details) | `error.middleware.ts` | Ne jamais exposer stack/details en production |
| HIGH-03 | Pas de validation fichier upload (ChatInput) | `ChatInput.tsx` | Limite 5MB + magic numbers + type MIME |
| HIGH-04 | Bypass SSRF IPv6 dans url-validator | `url-validator.ts` | `::1` (localhost IPv6) non bloque, fc00::/fd00:: incomplet |
| HIGH-05 | Pas de timeout/refresh token | `auth.middleware.ts` | Valider `exp` claim, implementer refresh |
| HIGH-06 | Injection de prompt agent via input utilisateur | `agent-executor.ts` | Sanitiser les caracteres speciaux, limiter longueur |
| HIGH-07 | Pas d'authentification entre Bridge et MCP servers | `mcpClient.ts` | Ajouter shared secret ou mutual TLS |
| HIGH-08 | Console.log en production avec donnees sensibles | `chat.routes.ts` | Conditionner sur `NODE_ENV === 'development'` |

---

## VULNERABILITES MOYENNES (6)

| # | Issue | Action |
|---|-------|--------|
| MED-01 | Pas de validation JWT locale (depend uniquement de Supabase) | Valider signature localement aussi |
| MED-02 | Pas de rate limiting sur write-back (bulk DB updates) | Limiter a 100 commandes/requete, 1000/minute |
| MED-03 | Pas d'isolation tenant dans write-back processor | Verifier ownership projet avant chaque update |
| MED-04 | Pas d'audit logging des operations sensibles | Logger who/what/when/where pour CMS, write-backs, approvals |
| MED-05 | Pas de detection de bots (CAPTCHA/honeypot) | Implementer reCAPTCHA sur endpoints publics |
| MED-06 | Pas de request ID pour tracing cross-services | Ajouter correlation ID dans headers |

---

## VULNERABILITES BASSES (4)

| # | Issue | Action |
|---|-------|--------|
| LOW-01 | Logging excessif en production | Conditionner sur env |
| LOW-02 | Pas d'audit `npm audit` documente | Executer npm audit regulierement |
| LOW-03 | Pas de rate limiting sur login/signup | Ajouter limites brute force |
| LOW-04 | Pas de mecanisme de ban IP | Implementer apres X echecs |

---

## COMPLIANCE RGPD

| Requirement | Status | Action |
|------------|--------|--------|
| Privacy Policy | EXISTE | OK |
| Terms of Service | EXISTE | OK |
| Cookie consent banner | **MANQUANT** | Implementer banner avec choix |
| Droit a l'oubli (suppression donnees) | **MANQUANT** | API endpoint DELETE /api/user/data |
| Portabilite des donnees (export) | **MANQUANT** | API endpoint GET /api/user/export |
| Contact DPO | **MANQUANT** | Ajouter sur Privacy Policy |
| Registre des traitements | **MANQUANT** | Documenter les traitements |
| Base legale des traitements | **MANQUANT** | Consentement explicite |

---

## PLAN DE REMEDIATION PRIORITISE

### Phase 1 : URGENT (Jour 1-2) — Avant tout deploiement

| # | Action | Effort | Fichiers |
|---|--------|--------|----------|
| 1 | Revoquer TOUS les credentials exposes | 2h | Supabase, Anthropic, Meta, Google, DB |
| 2 | Supprimer .env de l'historique git | 1h | BFG Repo-Cleaner |
| 3 | Regenerer TOUTES les cles API | 2h | Tous services |
| 4 | Decommenter authMiddleware partout | 30min | Toutes les routes backend |
| 5 | Supprimer fallback 'test-user' | 15min | Routes backend |
| 6 | Fix XSS UIComponentRenderer | 1h | UIComponentRenderer.tsx |
| 7 | Fix XSS parseMarkdownToHTML | 1h | UIComponentRenderer.tsx |

### Phase 2 : HAUTE PRIORITE (Jours 3-5)

| # | Action | Effort | Fichiers |
|---|--------|--------|----------|
| 8 | Protection CSRF | 4h | backend/src/index.ts |
| 9 | Validation upload fichiers | 2h | ChatInput.tsx, cloudinary.ts |
| 10 | Fix SSRF IPv6 bypass | 2h | url-validator.ts |
| 11 | Headers securite stricts (CSP) | 2h | backend/src/index.ts (Helmet config) |
| 12 | Masquer erreurs en production | 1h | error.middleware.ts |
| 13 | Validation write-back commands | 4h | write-back.processor.ts |
| 14 | Isolation tenant dans write-backs | 3h | write-back.processor.ts |

### Phase 3 : CONSOLIDATION (Jours 6-10)

| # | Action | Effort |
|---|--------|--------|
| 15 | Audit logging (qui fait quoi quand) | 1 jour |
| 16 | JWT validation locale + expiration | 4h |
| 17 | Token refresh automatique | 4h |
| 18 | Rate limiting sur login/signup | 2h |
| 19 | Sanitisation prompt injection | 4h |
| 20 | Nettoyage console.log production | 2h |
| 21 | npm audit + fix vulnerabilites | 2h |

### Phase 4 : RGPD (Jours 11-15)

| # | Action | Effort |
|---|--------|--------|
| 22 | Cookie consent banner | 1 jour |
| 23 | API suppression donnees utilisateur | 1 jour |
| 24 | API export donnees (portabilite) | 1 jour |
| 25 | Page DPO + registre traitements | 4h |
| 26 | Consentement explicite au signup | 2h |

---

## CHECKLIST DE VERIFICATION POST-REMEDIATION

```bash
# 1. Aucun secret dans le code
grep -r "sk-ant\|sk-proj\|eyJhbGci\|password.*=" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" .

# 2. Auth active partout
grep -r "// authMiddleware\|// TODO.*auth" --include="*.ts" backend/src/routes/

# 3. Pas de dangerouslySetInnerHTML sans DOMPurify
grep -r "dangerouslySetInnerHTML" --include="*.tsx" cockpit/src/ | grep -v "DOMPurify"

# 4. Pas de eval
grep -r "eval(" --include="*.ts" --include="*.tsx" .

# 5. Pas de console.log hors dev
grep -r "console.log\|console.error\|console.warn" --include="*.ts" --include="*.tsx" backend/src/ | grep -v "import.meta.env.DEV\|process.env.NODE_ENV"

# 6. TypeScript strict
cd cockpit && npx tsc --noEmit
cd backend && npx tsc --noEmit

# 7. npm audit
cd cockpit && npm audit --production
cd backend && npm audit --production
cd mcp-bridge && npm audit --production

# 8. Build OK
cd cockpit && npm run build
cd backend && npm run build
```
