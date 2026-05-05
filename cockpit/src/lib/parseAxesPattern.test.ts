/**
 * V4 B2.5p2 — parseAxesPattern unit tests
 *
 * Locks the markdown decoration tolerance added in this iteration:
 *   - Test 1 uses the EXACT Luna ICP payload from the live debug session
 *     (no reconstruction; copy-pasted verbatim from the user's console).
 *   - Test 2 covers the bare nominal form (no markdown wrapping).
 *   - Test 3 verifies non-detection (no false positive on free text).
 *   - Test 4 locks R1: heading + bold mid-line + bold outro all combined.
 */

import { describe, expect, it } from 'vitest';
import { parseAxesPattern } from './parseAxesPattern';

// ─────────────────────────────────────────────────────────────────
// Test 1 — exact Luna ICP payload from user console (B2.5p2 debug)
// ─────────────────────────────────────────────────────────────────

const LUNA_ICP_REAL_PAYLOAD =
  "Bonjour ! Je suis Luna 🎯\n\nJe vais créer ton **Avatar Client Idéal (ICP)** pour maximiser l'impact de tes campagnes paid ads. \n\nVoici ton **ICP V1**, basé sur le contexte projet :\n\n---\n\n## 👤 PROFIL DÉMOGRAPHIQUE\n\n**Âge :** 28-45 ans (cœur de cible : 32-38 ans)  \n**Genre :** 60% femmes / 40% hommes  \n**Localisation :** France métropolitaine, zones urbaines et péri-urbaines (Paris, Lyon, Bordeaux, Nantes, Lille)  \n**Revenu annuel :** 35 000 - 65 000 € (CSP+, salariés qualifiés ou indépendants)  \n**Situation professionnelle :** Cadres intermédiaires, entrepreneurs débutants, freelances établis  \n\n**Hypothèse :** Cible des actifs avec pouvoir d'achat moyen-élevé, sensibles à l'optimisation de leur quotidien professionnel ou personnel. À confirmer selon ton secteur.\n\n---\n\n## 🧠 PROFIL PSYCHOGRAPHIQUE\n\n**Valeurs dominantes :**  \n- Autonomie et liberté (choix, flexibilité)  \n- Efficacité et gain de temps  \n- Reconnaissance sociale (statut, accomplissement)  \n\n**Croyances clés :**  \n- \"Je mérite une solution qui me simplifie la vie\"  \n- \"Investir dans [ta solution] = investir en moi-même\"  \n- \"Les solutions génériques ne fonctionnent pas pour moi\"  \n\n**Aspirations :**  \n- Atteindre un meilleur équilibre vie pro/perso  \n- Gagner en crédibilité dans son domaine  \n- Éliminer les frictions quotidiennes (procrastination, désorganisation, manque de résultats)  \n\n**Hypothèse :** Profil \"aspirational pragmatique\" – cherche du concret, pas du rêve inaccessible. À affiner selon ton offre.\n\n---\n\n## 🛒 COMPORTEMENTS D'ACHAT\n\n**Où achète-t-il ?**  \n- En ligne (70% des achats) : sites e-commerce, landing pages, webinaires  \n- Mobile-first (65% des conversions sur smartphone)  \n- Rarement en magasin physique (sauf secteurs spécifiques)  \n\n**Quand achète-t-il ?**  \n- **Déclencheurs émotionnels :** frustration face à un problème récurrent, sentiment d'urgence (\"offre limitée\"), validation sociale (témoignages)  \n- **Moments clés :** lundi matin (reprise motivation), jeudi-vendredi soir (planning week-end), dimanches 20h-22h (préparation semaine)  \n\n**Budget moyen par achat :**  \n- Ticket moyen : 50-300 € (produits/services récurrents)  \n- Accepte de payer + cher SI bénéfice clair et immédiat  \n\n**Hypothèse :** Acheteur \"considéré rapide\" – 2-7 jours entre découverte et achat (cycle court). Si B2B complexe, ajuster vers 14-30 jours.\n\n---\n\n## 🚨 PAIN POINTS SPÉCIFIQUES (ordre d'importance)\n\n1. **Manque de temps** → \"Je n'arrive pas à tout gérer\"  \n2. **Résultats insuffisants** → \"J'ai essayé X solutions, rien ne marche durablement\"  \n3. **Surcharge informationnelle** → \"Trop d'options, je ne sais pas par où commencer\"  \n4. **Peur de l'échec** → \"Et si j'investis pour rien ?\"  \n5. **Isolement/manque de soutien** → \"Je fais tout seul(e), c'est épuisant\"  \n\n---\n\n## ⛔ OBJECTIONS PRINCIPALES\n\n1. **Prix :** \"C'est trop cher pour moi en ce moment\"  \n   → *Contre-argument :* Calcul ROI, paiement fractionné, garantie satisfait ou remboursé  \n\n2. **Crédibilité :** \"Pourquoi vous et pas [concurrent] ?\"  \n   → *Contre-argument :* Témoignages vidéo, études de cas chiffrées, certifications  \n\n3. **Timing :** \"Je n'ai pas le temps maintenant\"  \n   → *Contre-argument :* \"Justement, [ta solution] te fait gagner X heures/semaine\"  \n\n4. **Scepticisme :** \"J'ai déjà essayé, ça ne marche pas\"  \n   → *Contre-argument :* Différenciation claire (méthode unique), preuve de concept rapide  \n\n---\n\n## 📱 PLATEFORMES & FORMATS PRÉFÉRÉS\n\n**Plateformes prioritaires :**  \n1. **Instagram** (65% de la cible) → Reels, Stories, carrousels  \n2. **Facebook** (50% de la cible) → Vidéos + articles longs (audience 35-45 ans)  \n3. **LinkedIn** (si B2B) → Posts texte + carrousels PDF  \n\n**Formats qui convertissent le mieux :**  \n- **Vidéo courte (15-30 sec)** : accroche émotionnelle + CTA direct  \n- **Carrousels (5-8 slides)** : éducation, storytelling, avant/après  \n- **UGC (User Generated Content)** : témoignages authentiques, \"real people\"  \n- **Visuels statiques** : infographies chiffrées, citations impactantes  \n\n**Ton de communication qui résonne :**  \n- **Direct & empathique** (pas de jargon, parler à \"toi\")  \n- **Preuve sociale** (chiffres, témoignages, logos clients)  \n- **Urgence soft** (\"Dernières places\" plutôt que \"PROMO -80%\")  \n- **Storytelling personnel** (founder story, client success stories)  \n\n**Hypothèse :** Ton \"ami expert\" – ni trop corporate, ni trop casual. À tester en A/B.\n\n---\n\n## 🎯 DÉCLENCHEURS D'ACHAT (par ordre d'impact)\n\n1. **Témoignage vidéo d'un pair** (client similaire qui raconte sa transformation)  \n2. **Garantie risque zéro** (essai gratuit, remboursement 30j)  \n3. **Offre limitée dans le temps** (deadline claire, stock limité)  \n4. **Bonus exclusif** (ressource gratuite + achat)  \n5. **Simplicité du processus** (1 clic, pas de friction)  \n\n---\n\n## 3 axes où je peux affiner :\n\n1. **Créer 3 sous-personas distincts** (ex: \"Julie l'entrepreneure débordée\" vs \"Marc le cadre ambitieux\") avec messaging spécifique par segment ?  \n2. **Analyser les audiences des 3 concurrents** (via Facebook Ads Library + SEMrush) pour identifier des niches sous-exploitées ?  \n3. **Générer 10 accroches publicitaires** testables immédiatement, calibrées sur les pain points identifiés ?  \n\n**Lequel je lance ?**";

describe('parseAxesPattern', () => {
  it('Test 1 — parses the exact Luna ICP payload from B2.5p2 debug session', () => {
    const result = parseAxesPattern(LUNA_ICP_REAL_PAYLOAD);
    expect(result).not.toBeNull();
    expect(result?.axes).toHaveLength(3);
    expect(result?.outro.toLowerCase()).toContain('lequel je lance');
    // Bodies must be flattened (no leftover **bold** markers).
    expect(result?.axes[0]).toContain('Créer 3 sous-personas distincts');
    expect(result?.axes[0]).not.toContain('**');
    expect(result?.axes[1]).toContain('Analyser les audiences des 3 concurrents');
    expect(result?.axes[2]).toContain('Générer 10 accroches publicitaires');
    // beforeAxes must keep the bulk of the deliverable for normal markdown rendering.
    expect(result?.beforeAxes).toContain('PROFIL DÉMOGRAPHIQUE');
    expect(result?.beforeAxes).toContain('OBJECTIONS PRINCIPALES');
  });

  it('Test 2 — parses the bare nominal form (no markdown wrapping)', () => {
    const payload =
      'Voici ton plan V1 base sur le contexte.\n\n' +
      '3 axes ou je peux affiner :\n' +
      '1. Affiner la cible demographique ?\n' +
      '2. Generer 5 angles supplementaires ?\n' +
      '3. Calibrer le budget par audience ?\n' +
      'Lequel je lance ?';
    const result = parseAxesPattern(payload);
    expect(result).not.toBeNull();
    expect(result?.axes).toHaveLength(3);
    expect(result?.axes[0]).toBe('Affiner la cible demographique');
    expect(result?.outro.toLowerCase()).toContain('lequel je lance');
    expect(result?.beforeAxes).toContain('Voici ton plan V1');
  });

  it('Test 3 — returns null when the pattern is absent', () => {
    const payload =
      'Voici un audit SEO complet de ton site.\n\n' +
      "## Performance\nPage speed score : 72/100\n\n" +
      '## Indexation\n42 pages indexees, 3 erreurs detectees.\n';
    const result = parseAxesPattern(payload);
    expect(result).toBeNull();
  });

  it('Test 4 — locks R1: heading + bold mid-line intro + bold outro', () => {
    const payload =
      '## **3** axes ou je peux affiner :\n' +
      '1. **Foo** un axe ?\n' +
      '2. Bar ?\n' +
      '3. Baz ?\n' +
      '**Lequel je lance ?**';
    const result = parseAxesPattern(payload);
    expect(result).not.toBeNull();
    expect(result?.axes).toHaveLength(3);
    expect(result?.outro.length).toBeGreaterThan(0);
    expect(result?.outro.toLowerCase()).toContain('lequel je lance');
    // Body of axe 1 must have its inline bold flattened.
    expect(result?.axes[0]).toBe('Foo un axe');
    expect(result?.axes[1]).toBe('Bar');
    expect(result?.axes[2]).toBe('Baz');
  });
});
