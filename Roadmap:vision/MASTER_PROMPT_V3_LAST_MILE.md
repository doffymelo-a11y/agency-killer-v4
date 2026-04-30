# MASTER PROMPT V3 — Last Mile vers 100% Production

**Date :** 2026-04-28
**Etat actuel :** 85% production-ready (apres MASTER_PROMPT_V2)
**Issues bloquantes restantes :** 4
**Effort total :** 2 semaines pour atteindre 100%

**Ordre obligatoire :** G1 → G2 → G3 → G4 → G5 (les 4 fixes bloquants en G1-G4 puis polish G5)

---

## PHASE G1 : FIX WRITE-BACK ADD_FILE (URGENT — 30 min)

**Probleme :** Les agents generent des fichiers (rapports, images, videos) mais ils ne sont JAMAIS sauvegardes en base. FilesView reste vide pour le client. Bug invisible mais critique.

```
Tu es le dev senior de The Hive OS. Il y a un bug critique dans le write-back processor : la fonction qui sauvegarde les fichiers generes par les agents ecrit dans une table inexistante.

REFERENCE :
- /Users/azzedinezazai/Documents/Agency-Killer-V4/Roadmap:vision/AUDIT_FINAL_SATISFACTION_CLIENT_28_AVRIL.md (Partie 3)
- /backend/src/shared/write-back.processor.ts (le fichier a corriger)
- /supabase/migrations/037_project_files.sql (le schema reel)

TACHE :

1. Lis /backend/src/shared/write-back.processor.ts EN ENTIER. Identifie la fonction qui gere la commande ADD_FILE (vers ligne 180-200).

2. Lis /supabase/migrations/037_project_files.sql pour comprendre le schema reel de la table project_files.

3. Corrige le code BUGGY actuel qui ressemble a :
   ```typescript
   const { error } = await supabaseAdmin.from('files').insert({
     project_id: projectId,
     name: file.name,
     url: file.url,
     type: file.type,
     size: file.size,
     created_at: new Date().toISOString(),
   });
   ```

   Le remplacer par :
   ```typescript
   const { error } = await supabaseAdmin.from('project_files').insert({
     project_id: projectId,
     task_id: command.task_id || null,
     agent_id: file.agent_id || command.agent_id || 'orchestrator',
     filename: file.name || file.filename,
     url: file.url,
     file_type: file.file_type || file.type || 'document',
     mime_type: file.mime_type || 'application/octet-stream',
     size_bytes: file.size_bytes || file.size || 0,
     tags: file.tags || [file.agent_id, command.phase].filter(Boolean),
     metadata: {
       task_id: command.task_id,
       generated_by: file.agent_id,
       ...file.metadata
     },
     created_at: new Date().toISOString(),
   });
   ```

4. Verifie le typage TypeScript :
   - L'interface AddFileCommand doit inclure : agent_id, task_id, file (avec filename, url, file_type, mime_type, size_bytes, tags, metadata)
   - Si necessaire, mets a jour /backend/src/types/write-back.types.ts ou equivalent

5. Verifie que les agents (Milo, Luna) envoient les bons champs dans leurs write-backs ADD_FILE :
   - Cherche dans /backend/src/agents/ les patterns "ADD_FILE" et "type: 'ADD_FILE'"
   - Si les agents envoient `name` au lieu de `filename`, soit corrige les agents, soit ajoute le mapping dans le processor

6. Test manuel :
   - Verifie que TypeScript compile : `cd backend && npx tsc --noEmit`
   - Si possible, simule un write-back ADD_FILE pour verifier l'insert

VERIFICATION :
- TypeScript compile sans erreur
- Le code utilise `project_files` (pas `files`)
- Tous les champs obligatoires de la table sont remplis
- agent_id est present (sinon RLS peut echouer)
```

---

## PHASE G2 : FIX RGPD DELETE-ACCOUNT BACKEND (URGENT — 4h)

**Probleme :** Le frontend appelle `POST /api/gdpr/delete-account` mais l'endpoint n'existe pas cote backend. Toute demande de suppression de compte retourne 404. **Non-conformite RGPD critique.**

```
Tu es le dev senior de The Hive OS. Il y a une faille RGPD critique : le bouton "Supprimer mon compte" appelle un endpoint qui n'existe pas. C'est une non-conformite Article 17 du RGPD (droit a l'effacement). Risque legal et amendes possibles.

REFERENCES :
- /Users/azzedinezazai/Documents/Agency-Killer-V4/Roadmap:vision/AUDIT_FINAL_SATISFACTION_CLIENT_28_AVRIL.md (Partie 7)
- /cockpit/src/components/gdpr/DeleteAccountSection.tsx (le frontend qui appelle l'endpoint)

TACHE :

1. Lis /cockpit/src/components/gdpr/DeleteAccountSection.tsx pour comprendre :
   - Quel endpoint exact il appelle (`/api/gdpr/delete-account` ?)
   - Quel format de body il envoie
   - Quel format de reponse il attend

2. Cree le fichier /backend/src/routes/gdpr.routes.ts avec les endpoints :

   **POST /api/gdpr/delete-account** (soft delete avec retention 30 jours) :
   - authMiddleware OBLIGATOIRE (l'utilisateur doit etre authentifie)
   - Verifier que le body contient confirmation "SUPPRIMER" (anti-fraude)
   - Marquer l'utilisateur comme `deleted_at = NOW()` dans la table profiles ou auth metadata
   - Marquer TOUS les projects de l'utilisateur comme `deleted_at = NOW()`
   - Marquer toutes les ressources liees (tasks, project_memory, chat_sessions, project_files, integrations, support_tickets) avec un flag deleted ou trigger CASCADE
   - Logger l'action dans system_logs avec niveau 'info', source 'gdpr', action 'account_deletion_requested'
   - Retourner { success: true, message: "Suppression programmee dans 30 jours", scheduled_deletion_at: timestamp }

   **POST /api/gdpr/cancel-deletion** (annuler la suppression dans les 30j) :
   - authMiddleware
   - Si l'utilisateur a un deleted_at < 30 jours, le remettre a NULL
   - Logger l'action

   **GET /api/gdpr/deletion-status** :
   - authMiddleware
   - Retourner { has_pending_deletion: boolean, scheduled_deletion_at: timestamp | null }

3. Cree une migration SQL si necessaire :
   - /supabase/migrations/038_gdpr_soft_delete.sql
   - Ajouter colonne `deleted_at TIMESTAMPTZ NULL` sur les tables : projects, tasks, chat_sessions, project_files, user_integrations, support_tickets
   - Modifier les RLS policies pour que les ressources avec `deleted_at IS NOT NULL` ne soient PLUS visibles a l'utilisateur

4. Cree une Edge Function ou un cron qui execute la suppression definitive apres 30 jours :
   - Cherche les users avec `deleted_at < NOW() - INTERVAL '30 days'`
   - Pour chaque, supprime DEFINITIVEMENT toutes les donnees + le compte Supabase Auth
   - Si Edge Function : `/supabase/functions/gdpr-hard-delete/index.ts`
   - Si cron backend : ajoute dans /backend/src/cron/

5. Monte les routes dans /backend/src/index.ts :
   ```typescript
   import gdprRoutes from './routes/gdpr.routes';
   app.use('/api/gdpr', gdprRoutes);
   ```

6. Mets a jour /cockpit/src/views/PrivacyPolicyView.tsx si necessaire pour mentionner :
   - Soft delete 30 jours puis hard delete
   - Possibilite d'annuler dans les 30 jours
   - Donnees conservees plus longtemps si obligation legale (factures Stripe)

VERIFICATION :
- cd backend && npx tsc --noEmit
- Test manuel : dans Account Settings, cliquer "Supprimer mon compte" -> doit recevoir 200 (pas 404)
- Test manuel : se reconnecter sous 30 jours et voir un bouton "Annuler la suppression"
- Verifier les logs : l'action doit apparaitre dans system_logs
```

---

## PHASE G3 : CRON SCHEDULER POUR POSTS SOCIAL (URGENT — 1 jour)

**Probleme :** Les utilisateurs peuvent programmer des posts LinkedIn/Instagram via l'UI, mais aucun mecanisme ne les publie a l'heure programmee. Les posts restent en DB indefiniment.

```
Tu es le dev senior de The Hive OS. Doffy permet de programmer des posts social media, mais il n'y a aucun cron pour les publier. C'est une promesse non tenue critique : "programmez vos posts" mais rien n'est jamais publie.

REFERENCES :
- /Users/azzedinezazai/Documents/Agency-Killer-V4/Roadmap:vision/AUDIT_FINAL_SATISFACTION_CLIENT_28_AVRIL.md (Partie 5)
- /mcp-servers/social-media-server/src/providers/linkedin.provider.ts (provider LinkedIn reel)
- /mcp-servers/social-media-server/src/providers/instagram.provider.ts (provider Instagram reel)
- /backend/src/routes/social.routes.ts (route schedule existante)

TACHE :

1. Cree la migration explicite si elle n'existe pas :
   /supabase/migrations/039_scheduled_posts.sql
   ```sql
   CREATE TABLE IF NOT EXISTS scheduled_posts (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'twitter', 'tiktok', 'facebook')),
     content TEXT NOT NULL,
     media_urls TEXT[] DEFAULT '{}',
     hashtags TEXT[] DEFAULT '{}',
     scheduled_at TIMESTAMPTZ NOT NULL,
     published_at TIMESTAMPTZ,
     status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
     error_message TEXT,
     platform_post_id TEXT,
     retry_count INT NOT NULL DEFAULT 0,
     metadata JSONB DEFAULT '{}',
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_scheduled_posts_due ON scheduled_posts(scheduled_at) WHERE status = 'scheduled';
   CREATE INDEX idx_scheduled_posts_user ON scheduled_posts(user_id);

   ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users see own scheduled posts" ON scheduled_posts
     FOR SELECT USING (user_id = auth.uid());
   CREATE POLICY "Users insert own scheduled posts" ON scheduled_posts
     FOR INSERT WITH CHECK (user_id = auth.uid());
   CREATE POLICY "Users update own scheduled posts" ON scheduled_posts
     FOR UPDATE USING (user_id = auth.uid());
   ```

2. Cree le scheduler backend :
   /backend/src/cron/scheduled-posts-publisher.ts

   Le scheduler doit :
   a. Tourner toutes les 60 secondes (setInterval ou node-cron)
   b. SELECT les posts WHERE scheduled_at <= NOW() AND status = 'scheduled' LIMIT 10
   c. Pour CHAQUE post :
      - Mettre status = 'publishing' (lock pessimiste)
      - Recuperer les credentials de l'utilisateur depuis user_integrations
      - Appeler le provider correspondant (linkedin.provider.ts ou instagram.provider.ts)
      - Si succes : status = 'published', published_at = NOW(), platform_post_id = result.id
      - Si echec : status = 'failed', error_message = error.message, retry_count += 1
      - Si retry_count >= 3 : ne pas retry
   d. Logger chaque action dans system_logs

3. Demarre le scheduler dans /backend/src/index.ts :
   ```typescript
   import { startScheduledPostsPublisher } from './cron/scheduled-posts-publisher';

   if (process.env.ENABLE_SCHEDULER !== 'false') {
     startScheduledPostsPublisher();
     console.log('Scheduled posts publisher started');
   }
   ```

4. Ajoute un mecanisme de cancel :
   POST /api/social/cancel-scheduled/:postId
   - authMiddleware + ownership check
   - Si status = 'scheduled', le passer a 'cancelled'

5. Mets a jour le frontend (Doffy UI) :
   - Afficher la liste des posts programmes avec leur statut
   - Bouton "Annuler" sur chaque post 'scheduled'
   - Bouton "Reprogrammer" pour les 'failed'

ALTERNATIVE (si tu prefères Edge Function plutot que cron backend) :
- Cree /supabase/functions/publish-scheduled-posts/index.ts
- Configure un cron Supabase Vault qui invoke la fonction toutes les minutes :
  ```sql
  SELECT cron.schedule('publish-scheduled-posts', '* * * * *', $$
    SELECT net.http_post(url := '...edge-function-url...', ...)
  $$);
  ```

VERIFICATION :
- cd backend && npx tsc --noEmit
- Test : creer un post scheduled_at = NOW() + 2 minutes
- Attendre 2 minutes
- Verifier que le post apparait reellement sur LinkedIn/Instagram
- Verifier que status passe a 'published'
- Verifier le log dans system_logs
```

---

## PHASE G4 : NETTOYAGE FINAL (1 jour)

**Probleme :** 658 console.log non-gardes + 227 `any` TypeScript. Pas critique mais qualite professionnelle.

```
Tu es le dev senior de The Hive OS. La securite est OK mais il reste du nettoyage qualite professionnelle.

REFERENCES :
- /Users/azzedinezazai/Documents/Agency-Killer-V4/Roadmap:vision/AUDIT_FINAL_SATISFACTION_CLIENT_28_AVRIL.md (Partie 1)

TACHES :

--- CHANTIER 1 : Console.log production-safe (4h) ---

1. Cree un helper centralise /backend/src/lib/logger.ts :
   ```typescript
   const isDev = process.env.NODE_ENV === 'development';
   export const logger = {
     log: (...args) => isDev && console.log(...args),
     warn: (...args) => console.warn(...args),  // toujours en prod
     error: (...args) => console.error(...args), // toujours en prod
     debug: (...args) => isDev && console.debug(...args),
     info: (...args) => isDev && console.info(...args),
   };
   ```

2. Dans /backend/src/, remplace tous les `console.log` par `logger.log` (script ou manuel)
3. Pour les `console.error` qui leakent des donnees sensibles :
   - Verifie qu'il n'y a pas de userId, tokens, emails, project data en clair
   - Si oui, masque-les : `email.replace(/(.{2}).*(@.*)/, '$1***$2')`

4. Cote frontend, fais pareil dans /cockpit/src/lib/logger.ts avec `import.meta.env.DEV`

5. Verifie : grep -r "console\.log" --include="*.ts" backend/src/ | grep -v "logger\|NODE_ENV\|development" | wc -l
   Doit etre 0 ou < 5.

--- CHANTIER 2 : Eliminer les `any` (4h) ---

1. Dans /backend/src/, cherche les `any` les plus faciles a typer :
   - `(req as any).user` -> utiliser AuthenticatedRequest depuis auth.middleware
   - `catch (error: any)` -> `catch (error: unknown)` puis `error instanceof Error ? error.message : String(error)`
   - Reponses API non typees -> creer des interfaces dans /backend/src/types/

2. Cible : passer de 167 `any` a moins de 30 (les 30 restants doivent avoir un commentaire `// eslint-disable-next-line @typescript-eslint/no-explicit-any -- raison`)

3. Meme exercice dans /cockpit/src/

VERIFICATION :
- cd backend && npx tsc --noEmit (toujours OK)
- cd cockpit && npx tsc --noEmit && npm run build (toujours OK)
- grep -r ": any\|as any" --include="*.ts" --include="*.tsx" backend/src/ cockpit/src/ | wc -l
  Doit etre < 60 (vs 227 actuellement)
```

---

## PHASE G5 : LOAD TEST + VALIDATION FINALE (1 jour)

```
Tu es le dev senior de The Hive OS. Tous les bugs critiques sont fixes. Derniere etape : valider la capacite a 50 clients.

REFERENCES :
- /tests/load-test.yml (config existante)
- /tests/LOAD_TEST_RESULTS.md (template a remplir)

TACHES :

1. Lance les services en local :
   - Backend : cd backend && npm run dev
   - MCP Bridge : cd mcp-bridge && npm run dev
   - Cockpit : cd cockpit && npm run dev

2. Execute le load test :
   ```bash
   cd tests
   npx artillery run load-test.yml --output report.json
   npx artillery report report.json --output report.html
   ```

3. Analyse les resultats :
   - P50 < 2000ms ?
   - P95 < 5000ms ?
   - P99 < 10000ms ?
   - Error rate < 1% ?

4. Documente les resultats dans /tests/LOAD_TEST_RESULTS.md :
   - Latences mesurees par scenario
   - Taux d'erreur observe
   - Bottlenecks identifies (DB, API, MCP, Claude)
   - Optimisations appliquees si necessaire

5. Si bottleneck identifie, optimise :
   - Index Supabase manquants
   - Cache Redis sur les requetes frequentes (analytics, projets list)
   - Connection pooling sur le client Supabase

6. Re-execute le load test et valide :
   - 50 users simultanees : OK
   - 100 users en burst : OK
   - Pas de memory leak (RAM stable apres 5min)

7. Cree un rapport final /tests/PRODUCTION_READINESS_REPORT.md :
   - Score 100% production-ready (Yes/No)
   - Capacite validee : X clients simultanes
   - Recommendations infra (memory, cores, DB tier)

VERIFICATION FINALE END-TO-END :
- Auth flow complet : login -> token -> request authentifiee -> logout
- Genesis : creer projet -> taches generees
- Chat : envoyer message a Luna -> reponse avec skills
- Files : voir un fichier genere par un agent (test du fix G1)
- Schedule post : programmer un post LinkedIn pour +2min -> verifier publication (test du fix G3)
- Delete account : cliquer supprimer -> 200 OK -> reconnecter dans 30 jours et annuler (test du fix G2)
- Billing : checkout Stripe -> upgrade plan -> nouveau tier rate limit

Si tous les flows passent : declarer 100% PRODUCTION-READY pour 50 clients.
```

---

## RECAPITULATIF DES PHASES G1-G5

| Phase | Bug fix | Effort | Bloquant client ? |
|-------|---------|--------|-------------------|
| **G1** | Write-back ADD_FILE -> table project_files | 30 min | OUI (FilesView vide) |
| **G2** | Backend GDPR delete-account | 4h | OUI (404 + non-conformite RGPD) |
| **G3** | Cron scheduler posts social | 1 jour | OUI (posts jamais publies) |
| **G4** | Console.log + any TypeScript | 1 jour | NON (qualite) |
| **G5** | Load test + validation E2E | 1 jour | NON (validation) |

**Total : 3-4 jours pour les 4 issues bloquantes + 2 jours polish = 1 semaine**

**Apres G5 : 100% production-ready, valide pour 50 clients reels.**

---

## ORDRE OPTIMAL D'EXECUTION

```
JOUR 1 MATIN  : G1 (write-back fix) — 30 min, immediat
JOUR 1 APREM  : G2 (GDPR backend) — 4h, critique legal
JOUR 2-3      : G3 (cron scheduler) — 1 jour, tester avec posts reels
JOUR 4        : G4 (nettoyage qualite) — 1 jour
JOUR 5        : G5 (load test + E2E) — 1 jour, validation finale
```

**Timing realiste : 1 semaine de travail focus pour atteindre 100%.**

---

## QUOI FAIRE EN CAS DE PROBLEME

Si un prompt G1-G5 echoue ou produit des erreurs :

1. **Lis le code reel** - Les agents Claude Code peuvent voir des choses qui ont change. Verifie toujours le code avant d'editer.
2. **TypeScript first** - Si `tsc --noEmit` echoue, ne passe pas au prompt suivant. Fix d'abord.
3. **Migrations en dernier** - Avant d'appliquer une migration SQL en production, teste-la sur une copie de la DB.
4. **Sauvegarde** - Avant G2 (RGPD), sauvegarde la DB Supabase au cas ou.
5. **Reviens-moi si bloque** - Si une logique te semble incoherente, reviens-moi avec le contexte avant de coder.
