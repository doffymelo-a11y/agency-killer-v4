# Phase 4 - Frontend UI - Plan d'implémentation détaillé

**Objectif** : Créer l'UI complète pour connecter WordPress/Shopify/Webflow et approuver les changements CMS

---

## 🎯 Plan global (4-6 heures)

### 4.1 - CMSConnectionModal (2h)
- Créer `/cockpit/src/components/modals/CMSConnectionModal.tsx`
- 3 tabs : WordPress | Shopify | Webflow
- Formulaires credentials (site_url, username, app_password)
- Test connection via `cms-connector__validate_cms_credentials`
- Save encrypted credentials dans `user_integrations`

### 4.2 - Cards CMS dans IntegrationsView (1h)
- Ajouter WordPress/Shopify/Webflow à `INTEGRATIONS_CONFIG`
- Icônes custom (WordPress logo, Shopify logo, Webflow logo)
- Badge "Connecté" / "Non connecté"
- onClick → open CMSConnectionModal

### 4.3 - CMS_CHANGE_PREVIEW component (2-3h)
- Créer `/cockpit/src/components/cms/CMSChangePreview.tsx`
- Fetch pending changes : `GET /api/cms/pending`
- Diff viewer (before/after)
- Boutons "Approuver" / "Rejeter"
- Integration dans BoardView (pending notifications badge)

### 4.4 - State flags cms_connected (30min)
- Ajouter `wordpress_connected`, `shopify_connected`, `webflow_connected` dans state_flags
- Update après connexion réussie
- Conditionner UI components sur ces flags

---

## 📂 Fichiers à créer

```
cockpit/src/
├── components/
│   ├── modals/
│   │   └── CMSConnectionModal.tsx (NEW - 300 lignes)
│   └── cms/
│       ├── CMSChangePreview.tsx (NEW - 250 lignes)
│       └── CMSChangeCard.tsx (NEW - 100 lignes)
├── types/
│   └── cms.types.ts (NEW - 50 lignes)
└── views/
    └── IntegrationsView.tsx (MODIFY - add WordPress/Shopify/Webflow)
```

---

## 🔧 Phase 4.1 - CMSConnectionModal

### Étape 1.1 : Créer le composant principal

**Fichier** : `/cockpit/src/components/modals/CMSConnectionModal.tsx`

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConnectionSuccess: (cmsType: string) => void;
}

type CMSType = 'wordpress' | 'shopify' | 'webflow';

export default function CMSConnectionModal({ isOpen, onClose, onConnectionSuccess }: Props) {
  const [selectedCMS, setSelectedCMS] = useState<CMSType>('wordpress');
  const [formData, setFormData] = useState({
    site_url: '',
    username: '',
    app_password: '', // WordPress
    api_key: '', // Shopify
    site_id: '', // Webflow
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Tab switcher
  // Form fields par CMS type
  // Test connection
  // Save credentials
}
```

### Étape 1.2 : Form WordPress

```tsx
{selectedCMS === 'wordpress' && (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium mb-2">Site URL</label>
      <input
        type="url"
        value={formData.site_url}
        onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
        placeholder="https://votre-site.com"
        className="w-full px-4 py-2 border rounded-lg"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Username</label>
      <input
        type="text"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        placeholder="admin"
        className="w-full px-4 py-2 border rounded-lg"
      />
    </div>

    <div>
      <label className="block text-sm font-medium mb-2">Application Password</label>
      <input
        type="password"
        value={formData.app_password}
        onChange={(e) => setFormData({ ...formData, app_password: e.target.value })}
        placeholder="xxxx xxxx xxxx xxxx"
        className="w-full px-4 py-2 border rounded-lg"
      />
      <p className="text-xs text-slate-500 mt-1">
        Générez un Application Password dans WordPress → Utilisateurs → Profil → Application Passwords
      </p>
    </div>
  </div>
)}
```

### Étape 1.3 : Test Connection

```typescript
async function testConnection() {
  setTesting(true);
  setTestResult(null);

  try {
    const response = await fetch('http://localhost:3456/api/cms-connector/call', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'validate_cms_credentials',
        arguments: {
          credentials: {
            cms_type: selectedCMS,
            site_url: formData.site_url,
            auth: {
              username: formData.username,
              app_password: formData.app_password,
            },
          },
        },
      }),
    });

    const result = await response.json();

    if (result.valid) {
      setTestResult({ success: true, message: '✅ Connexion réussie !' });
    } else {
      setTestResult({ success: false, message: `❌ Erreur : ${result.error}` });
    }
  } catch (error) {
    setTestResult({ success: false, message: `❌ Erreur réseau : ${error.message}` });
  } finally {
    setTesting(false);
  }
}
```

### Étape 1.4 : Save Credentials

```typescript
async function saveConnection() {
  if (!testResult?.success) {
    alert('Veuillez d\'abord tester la connexion');
    return;
  }

  setSaving(true);

  try {
    // TODO: Encrypt credentials avant de sauvegarder
    const { data, error } = await supabase
      .from('user_integrations')
      .insert({
        user_id: currentUser.id,
        project_id: currentProject.id,
        integration_type: selectedCMS,
        integration_name: `${selectedCMS} - ${formData.site_url}`,
        status: 'connected',
        encrypted_credentials: {
          cms_type: selectedCMS,
          site_url: formData.site_url,
          auth: {
            username: formData.username,
            app_password: formData.app_password,
          },
        },
        connected_at: new Date().toISOString(),
      });

    if (error) throw error;

    // Update state_flags
    await supabase
      .from('projects')
      .update({
        state_flags: {
          ...currentProject.state_flags,
          [`${selectedCMS}_connected`]: true,
        },
      })
      .eq('id', currentProject.id);

    onConnectionSuccess(selectedCMS);
    onClose();
  } catch (error) {
    alert(`Erreur sauvegarde : ${error.message}`);
  } finally {
    setSaving(false);
  }
}
```

---

## 🔧 Phase 4.2 - Cards CMS dans IntegrationsView

### Étape 2.1 : Ajouter au INTEGRATIONS_CONFIG

**Fichier** : `/cockpit/src/views/IntegrationsView.tsx`

Ajouter après `tiktok_business` :

```typescript
{
  type: 'wordpress' as IntegrationType,
  name: 'WordPress',
  title: 'Blog & Site Web WordPress',
  description: 'Connectez votre site WordPress pour publier des articles, optimiser le SEO et gérer le contenu avec Luna et Doffy',
  icon: Globe, // TODO: Remplacer par WordPress icon
  color: 'text-blue-600',
  bgColor: 'bg-blue-600/10',
  requiredBy: ['Luna', 'Doffy'],
  setupGuide: {
    title: 'Connecter WordPress',
    steps: [
      'Accédez à votre admin WordPress (votre-site.com/wp-admin)',
      'Allez dans Utilisateurs → Profil',
      'Descendez jusqu\'à "Application Passwords"',
      'Créez un nouveau Application Password avec le nom "The Hive OS"',
      'Copiez le mot de passe généré (format: xxxx xxxx xxxx xxxx)',
      'Collez les informations dans le formulaire ci-dessous',
    ],
    docsUrl: 'https://wordpress.org/support/article/application-passwords/',
  },
},
{
  type: 'shopify' as IntegrationType,
  name: 'Shopify',
  title: 'E-commerce Shopify',
  description: 'Connectez votre boutique Shopify pour gérer les produits, optimiser les descriptions et suivre les ventes avec Luna et Doffy',
  icon: ShoppingCart, // TODO: Remplacer par Shopify icon
  color: 'text-green-600',
  bgColor: 'bg-green-600/10',
  requiredBy: ['Luna', 'Doffy'],
  setupGuide: {
    title: 'Connecter Shopify',
    steps: [
      'Accédez à votre admin Shopify',
      'Allez dans Apps → Develop apps',
      'Créez une nouvelle application "The Hive OS"',
      'Configurez les Admin API scopes : read_products, write_products, read_content, write_content',
      'Générez une API key et copiez-la',
      'Collez la clé API dans le formulaire ci-dessous',
    ],
    docsUrl: 'https://shopify.dev/docs/api/admin-rest',
  },
},
{
  type: 'webflow' as IntegrationType,
  name: 'Webflow',
  title: 'Design & CMS Webflow',
  description: 'Connectez votre site Webflow pour gérer le contenu CMS, publier des articles et optimiser le design avec Luna et Doffy',
  icon: Layout, // TODO: Remplacer par Webflow icon
  color: 'text-purple-600',
  bgColor: 'bg-purple-600/10',
  requiredBy: ['Luna', 'Doffy'],
  setupGuide: {
    title: 'Connecter Webflow',
    steps: [
      'Accédez à Webflow workspace settings',
      'Allez dans Integrations → API Access',
      'Générez une nouvelle API key avec le nom "The Hive OS"',
      'Copiez l\'API key et votre Site ID',
      'Collez les informations dans le formulaire ci-dessous',
    ],
    docsUrl: 'https://developers.webflow.com/',
  },
},
```

### Étape 2.2 : Modifier le type IntegrationType

```typescript
type IntegrationType =
  | 'meta_ads'
  | 'google_analytics_4'
  | 'google_search_console'
  | 'google_business_profile'
  | 'google_tag_manager'
  | 'looker_studio'
  | 'woocommerce'
  | 'webflow'
  | 'meta_business_suite'
  | 'linkedin_pages'
  | 'twitter_x'
  | 'tiktok_business'
  | 'wordpress'    // NEW
  | 'shopify';     // NEW
```

### Étape 2.3 : Gérer onClick différent pour CMS

Dans le render des cards, ajouter condition :

```typescript
onClick={() => {
  if (['wordpress', 'shopify', 'webflow'].includes(config.type)) {
    // Ouvrir CMSConnectionModal
    setShowCMSModal(true);
    setSelectedCMSType(config.type);
  } else {
    // OAuth flow existant
    handleOAuthConnect(config.type);
  }
}}
```

---

## 🔧 Phase 4.3 - CMS_CHANGE_PREVIEW

### Étape 3.1 : Créer le composant principal

**Fichier** : `/cockpit/src/components/cms/CMSChangePreview.tsx`

```typescript
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, RotateCcw, AlertTriangle } from 'lucide-react';

interface CMSChange {
  change_id: string;
  cms_type: string;
  site_url: string;
  content_type: string;
  content_id: string;
  action: string;
  previous_state: any;
  new_state: any;
  change_summary: {
    content_title: string;
    fields_changed: string[];
    changes: Array<{
      field: string;
      before: string;
      after: string;
    }>;
  };
  executed_by_agent: string;
  created_at: string;
}

export default function CMSChangePreview() {
  const [pendingChanges, setPendingChanges] = useState<CMSChange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingChanges();
  }, []);

  async function fetchPendingChanges() {
    const response = await fetch('/api/cms/pending');
    const data = await response.json();
    setPendingChanges(data.pending || []);
    setLoading(false);
  }

  // ...
}
```

### Étape 3.2 : Diff Viewer

```tsx
<div className="bg-slate-50 rounded-lg p-4 space-y-2">
  {change.change_summary.changes.map((diff, i) => (
    <div key={i} className="border-l-4 border-orange-500 pl-4">
      <p className="text-sm font-medium text-slate-700">{diff.field}</p>
      <div className="mt-1 space-y-1">
        <div className="flex items-start gap-2">
          <span className="text-xs text-red-600">−</span>
          <span className="text-sm text-red-600 line-through">{diff.before}</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="text-xs text-green-600">+</span>
          <span className="text-sm text-green-600">{diff.after}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

### Étape 3.3 : Actions (Approve/Reject)

```typescript
async function approveChange(changeId: string) {
  await supabase
    .from('cms_change_log')
    .update({ approved: true, approved_at: new Date().toISOString() })
    .eq('change_id', changeId);

  // Refresh list
  fetchPendingChanges();
}

async function rejectChange(changeId: string, reason: string) {
  await fetch('/api/cms/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ change_id: changeId, reason }),
  });

  // Refresh list
  fetchPendingChanges();
}
```

---

## 📋 Checklist Phase 4

- [ ] CMSConnectionModal créé avec 3 tabs (WordPress/Shopify/Webflow)
- [ ] Test connection fonctionne (validate_cms_credentials)
- [ ] Save credentials dans user_integrations (encrypted)
- [ ] WordPress/Shopify/Webflow ajoutés à INTEGRATIONS_CONFIG
- [ ] Cards CMS s'affichent dans IntegrationsView
- [ ] Badge "Connecté" / "Non connecté" fonctionne
- [ ] CMSChangePreview component créé
- [ ] GET /api/cms/pending fonctionne
- [ ] Diff viewer affiche before/after
- [ ] Boutons Approuver/Rejeter fonctionnent
- [ ] State flags cms_connected mis à jour après connexion
- [ ] Tests end-to-end WordPress
- [ ] Documentation Phase 4

---

**Créé le** : 22 Mars 2026
**Par** : Claude Code - CMS Phase 4 Plan
