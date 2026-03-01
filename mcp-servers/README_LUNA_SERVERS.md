# 🔮 LUNA MCP Servers - SEO & Keyword Research

**Agent:** LUNA (Strategist)
**Purpose:** SEO Strategy, Keyword Research, Content Strategy

---

## 📦 Serveurs créés pour LUNA

### 1. **seo-audit-server**

Audit SEO technique et sémantique complet.

**Fonctions disponibles :**
- `technical_seo_audit` - Audit technique (HTTPS, mobile, vitesse, indexabilité)
- `pagespeed_insights` - Scores Google PageSpeed + Core Web Vitals
- `semantic_audit` - Analyse on-page (meta tags, headings, keywords, contenu)
- `site_health_check` - Crawl pour trouver liens cassés, 404s, redirects
- `schema_markup_check` - Vérification structured data (JSON-LD)

**APIs utilisées :**
- Google PageSpeed Insights API
- Custom web crawling (Cheerio + Axios)

**Credentials requises :**
- `GOOGLE_API_KEY` (pour PageSpeed Insights) - Optionnel

---

### 2. **keyword-research-server**

Recherche de mots-clés et stratégie de contenu.

**Fonctions disponibles :**
- `keyword_suggestions` - Suggestions de mots-clés depuis un seed keyword
- `serp_analysis` - Analyse de la page de résultats Google (top 10)
- `related_questions` - Questions "People Also Ask" + recherches associées
- `trending_keywords` - Découverte de tendances via Google Trends
- `keyword_difficulty` - Estimation de difficulté de ranking

**APIs utilisées :**
- Google Autocomplete API (suggestions)
- Google Trends API
- Custom SERP scraping

**Credentials requises :**
- Aucune (fonctionne sans API keys)
- `GOOGLE_API_KEY` améliore certaines fonctions (optionnel)

---

## 🚀 Installation et Build

Les serveurs ont déjà été installés et buildés :

```bash
# SEO Audit Server
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/seo-audit-server
npm install  # ✅ Déjà fait
npm run build  # ✅ Déjà fait

# Keyword Research Server
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/keyword-research-server
npm install  # ✅ Déjà fait
npm run build  # ✅ Déjà fait
```

---

## 🔧 Configuration dans MCP Bridge

Les serveurs ont été **automatiquement ajoutés** à la config du bridge :

**Dans `/mcp-bridge/src/config.ts` :**

```typescript
'seo-audit': {
  name: 'SEO Audit (LUNA)',
  serverPath: path.join(config.mcpServersPath, 'seo-audit-server'),
  command: 'node',
  args: ['dist/index.js'],
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  },
},
'keyword-research': {
  name: 'Keyword Research (LUNA)',
  serverPath: path.join(config.mcpServersPath, 'keyword-research-server'),
  command: 'node',
  args: ['dist/index.js'],
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
  },
},
```

---

## 🧪 Test des serveurs

### Via MCP Bridge

```bash
# Démarrer le bridge
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm run dev

# Dans un autre terminal, tester SEO Audit
curl -X POST http://localhost:3456/api/seo-audit/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "technical_seo_audit",
    "arguments": {
      "url": "https://example.com",
      "include_pagespeed": true
    }
  }' | jq

# Tester Keyword Research
curl -X POST http://localhost:3456/api/keyword-research/call \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "keyword_suggestions",
    "arguments": {
      "seed_keyword": "marketing digital",
      "language": "fr",
      "limit": 20
    }
  }' | jq
```

---

## 📖 Utilisation dans n8n (LUNA Workflow)

### Exemple : Audit SEO Technique

**Nœud HTTP Request :**

- **URL :** `http://localhost:3456/api/seo-audit/call`
- **Method :** POST
- **Body :**
  ```json
  {
    "tool": "technical_seo_audit",
    "arguments": {
      "url": "{{ $json.website_url }}",
      "include_pagespeed": true
    }
  }
  ```

**Réponse :**
```json
{
  "success": true,
  "audit": {
    "https": true,
    "mobile_friendly": true,
    "canonical_tag": true,
    "title_tag": "Example Domain",
    "meta_description": "Example domain...",
    "h1_count": 1,
    "images_without_alt": 0
  },
  "pagespeed": {
    "scores": {
      "performance": 95,
      "accessibility": 98,
      "best_practices": 100,
      "seo": 90
    }
  },
  "recommendations": []
}
```

### Exemple : Recherche de mots-clés

**Nœud HTTP Request :**

- **URL :** `http://localhost:3456/api/keyword-research/call`
- **Method :** POST
- **Body :**
  ```json
  {
    "tool": "keyword_suggestions",
    "arguments": {
      "seed_keyword": "{{ $json.topic }}",
      "language": "fr",
      "country": "FR",
      "limit": 50
    }
  }
  ```

**Réponse :**
```json
{
  "success": true,
  "seed_keyword": "marketing digital",
  "suggestions": [
    {
      "keyword": "marketing digital formation",
      "relevance": 100,
      "type": "related"
    },
    {
      "keyword": "marketing digital stratégie",
      "relevance": 98,
      "type": "related"
    }
  ],
  "total": 50
}
```

---

## 🔑 Credentials (Optionnelles)

### Google API Key (pour PageSpeed Insights)

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **API Key**
4. Restreignez la clé aux APIs :
   - PageSpeed Insights API
   - (Optionnel) Google Trends API
5. Copiez la clé et ajoutez-la au `.env` du bridge :

```env
GOOGLE_API_KEY=AIzaSy...votre-cle-ici
```

**Note :** Les serveurs fonctionnent SANS API key, mais certaines fonctions sont améliorées avec.

---

## 📊 Récapitulatif

| Serveur | Fonctions | APIs | Build |
|---------|-----------|------|-------|
| **seo-audit-server** | 5 | PageSpeed Insights | ✅ |
| **keyword-research-server** | 5 | Google Trends, Autocomplete | ✅ |

**Total pour LUNA :** 10 fonctions SEO & Keyword Research

---

## ✅ Statut

- ✅ Serveurs créés et buildés
- ✅ Ajoutés à la config du MCP Bridge
- ✅ Prêts à être utilisés dans les workflows LUNA

**Prochaine étape :** Tester les serveurs via le bridge et les intégrer au workflow LUNA dans n8n.

---

**Créé le :** 2026-02-16
**Agent :** LUNA (Strategist)
**Serveurs :** seo-audit-server, keyword-research-server
