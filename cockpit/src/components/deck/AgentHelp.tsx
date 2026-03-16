// ============================================
// THE HIVE OS V4 - Agent Help Component
// Affiche les capacites et requetes types
// ============================================

import { motion } from 'framer-motion';
import { X, Sparkles, MessageSquare, Zap, Copy, Check, Clock, Wrench } from 'lucide-react';
import { useState } from 'react';
import { AGENTS, type AgentRole } from '../../types';

// ============================================
// AGENT CAPABILITIES DATA
// ============================================
interface Capability {
  name: string;
  description: string;
  queries: string[];
  status: 'active' | 'dev' | 'planned';
}

const AGENT_CAPABILITIES: Record<AgentRole, Capability[]> = {
  sora: [
    {
      name: 'Conseil KPIs & Metriques',
      description: 'Expertise sur ROAS, CPA, LTV, taux de conversion et benchmarks industrie',
      queries: [
        "C'est quoi un bon ROAS pour ma marge ?",
        'Comment calculer mon CPA optimal ?',
        'Quels KPIs suivre en priorite ?',
      ],
      status: 'active',
    },
    {
      name: 'Analyse Theorique',
      description: 'Reponses expertes sur les metriques et strategies data',
      queries: [
        'Explique-moi la difference entre ROAS et ROI',
        'Comment interpreter un taux de rebond eleve ?',
        'Quelle est la formule du LTV ?',
      ],
      status: 'active',
    },
    {
      name: 'Detection Anomalies',
      description: 'Identification des variations suspectes (>20%) dans vos donnees',
      queries: [
        'Y a-t-il des anomalies dans mes donnees ?',
        'Pourquoi mon trafic a-t-il chute ?',
        'Analyse cette variation de performance',
      ],
      status: 'active',
    },
    {
      name: 'Analyse de Screenshots',
      description: 'Analyse visuelle de dashboards et captures (Vision AI)',
      queries: [
        '[Joindre une capture de dashboard Analytics]',
        '[Joindre un screenshot de vos KPIs]',
        'Analyse ce graphique de performance',
      ],
      status: 'active',
    },
  ],

  luna: [
    {
      name: 'Audit SEO Automatique',
      description: 'Analyse complete d\'un site web via scan automatique',
      queries: [
        'Analyse le SEO de https://monsite.com',
        'Quels sont les problemes SEO de mon site ?',
        'Audit technique de [url]',
      ],
      status: 'active',
    },
    {
      name: 'Veille Concurrentielle',
      description: 'Recherche et analyse des concurrents en temps reel',
      queries: [
        'Analyse mes concurrents',
        'Que font mes concurrents sur le web ?',
        'Compare ma strategie a celle de [concurrent]',
      ],
      status: 'active',
    },
    {
      name: 'Conseil Strategique',
      description: 'Expertise en positionnement, differenciation et growth',
      queries: [
        'Comment me differencier de mes concurrents ?',
        'Quelle strategie de contenu adopter ?',
        'Affine mon positionnement marche',
      ],
      status: 'active',
    },
    {
      name: 'Planning Editorial',
      description: 'Creation de calendriers de contenu et identification des sujets',
      queries: [
        'Propose un calendrier editorial',
        'Quels sujets dois-je couvrir ?',
        'Idees de contenu pour mon audience',
      ],
      status: 'active',
    },
  ],

  marcus: [
    {
      name: 'Regles de Trading',
      description: 'Decisions automatiques CUT/SCALE/OPTIMIZE basees sur le ROAS',
      queries: [
        'Quelles campagnes dois-je couper ?',
        'Quelles campagnes scaler ?',
        'Applique les regles de trading',
      ],
      status: 'active',
    },
    {
      name: 'Conseil Budget Ads',
      description: 'Expertise sur l\'allocation et l\'optimisation des budgets publicitaires',
      queries: [
        'Comment repartir mon budget pub ?',
        'Quel budget pour demarrer sur Meta ?',
        'Strategie d\'encheres recommandee',
      ],
      status: 'active',
    },
    {
      name: 'Analyse Theorique Ads',
      description: 'Reponses expertes sur Google Ads, Meta Ads et optimisation',
      queries: [
        'Difference entre CPC et CPM ?',
        'Comment optimiser mon Quality Score ?',
        'Meilleure structure de campagne Meta',
      ],
      status: 'active',
    },
    {
      name: 'Connexion Meta Ads',
      description: 'Analyse en temps reel de vos campagnes Facebook/Instagram',
      queries: [
        'Analyse mes campagnes Meta',
        'Performance de mes ads Facebook',
        'ROAS de chaque campagne Meta',
      ],
      status: 'planned',
    },
  ],

  milo: [
    {
      name: 'Generation Images',
      description: 'Creation de visuels marketing avec IA (Flux/Midjourney)',
      queries: [
        'Cree une image pour ma pub Meta',
        'Genere un visuel pour [produit]',
        'Cree une banniere LinkedIn',
      ],
      status: 'active',
    },
    {
      name: 'Copywriting & Articles',
      description: 'Redaction de textes marketing, articles de blog et scripts',
      queries: [
        'Redige un article de blog sur [sujet]',
        'Ecris un headline accrocheur',
        'Cree une description produit',
      ],
      status: 'active',
    },
    {
      name: 'Brainstorming Creatif',
      description: 'Exploration d\'angles, hooks et concepts publicitaires',
      queries: [
        'Propose 3 angles creatifs pour ma campagne',
        'Quels hooks utiliser pour [audience] ?',
        'Idees de pub originales pour [produit]',
      ],
      status: 'active',
    },
    {
      name: 'Pub Complete',
      description: 'Creation integrale: visuel + texte + CTA prets a publier',
      queries: [
        'Cree une pub complete pour [offre]',
        'Genere une publicite Meta prete',
        'Cree une pub avec image et texte',
      ],
      status: 'active',
    },
    {
      name: 'Generation Videos',
      description: 'Creation de videos courtes avec IA (multi-clips)',
      queries: [
        'Genere une video de 8 secondes',
        'Cree un reel Instagram anime',
        'Anime cette image en video',
      ],
      status: 'dev',
    },
  ],

  doffy: [
    {
      name: 'Calendrier Editorial',
      description: 'Creation de planning de contenu multi-plateformes',
      queries: [
        'Cree un calendrier de contenu pour la semaine',
        'Planifie mes posts LinkedIn et Instagram',
        'Programme mes reseaux sociaux',
      ],
      status: 'active',
    },
    {
      name: 'Redaction Posts',
      description: 'Creation de posts optimises par plateforme avec hashtags',
      queries: [
        'Redige un post LinkedIn pour promouvoir [service]',
        'Cree un post Instagram engageant',
        'Ecris un tweet viral sur [sujet]',
      ],
      status: 'active',
    },
    {
      name: 'Strategie Hashtags',
      description: 'Recherche de hashtags tendance et optimisation engagement',
      queries: [
        'Quels hashtags utiliser pour toucher mon audience ?',
        'Trouve des hashtags tendance dans [secteur]',
        'Optimise mes hashtags LinkedIn',
      ],
      status: 'active',
    },
    {
      name: 'Analyse Performance',
      description: 'Metriques engagement et recommandations social media',
      queries: [
        'Analyse mes performances sur LinkedIn',
        'Quels posts fonctionnent le mieux ?',
        'Comment augmenter mon engagement ?',
      ],
      status: 'active',
    },
  ],

  orchestrator: [
    {
      name: 'Routing Intelligent',
      description: 'Dirige vers le bon expert selon votre besoin',
      queries: [
        'Je veux lancer une campagne Meta',
        'J\'ai besoin d\'aide pour mon SEO',
        'Comment ameliorer mes performances ?',
      ],
      status: 'active',
    },
  ],
};

// ============================================
// STATUS BADGE COMPONENT
// ============================================
function StatusBadge({ status }: { status: 'active' | 'dev' | 'planned' }) {
  if (status === 'active') {
    return (
      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Actif
      </span>
    );
  }

  if (status === 'dev') {
    return (
      <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
        <Wrench className="w-2.5 h-2.5" />
        En dev
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
      <Clock className="w-2.5 h-2.5" />
      Bientot
    </span>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
interface AgentHelpProps {
  agentId: AgentRole;
  onClose: () => void;
}

export default function AgentHelp({ agentId, onClose }: AgentHelpProps) {
  const agent = AGENTS[agentId];
  const capabilities = AGENT_CAPABILITIES[agentId];
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const handleCopyQuery = (query: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(query);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  const activeCapabilities = capabilities.filter(c => c.status === 'active');
  const devCapabilities = capabilities.filter(c => c.status === 'dev');
  const plannedCapabilities = capabilities.filter(c => c.status === 'planned');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="h-full flex flex-col"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: agent.color.light }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-2"
            style={{ ringColor: agent.color.primary }}
          >
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              {agent.name}
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: agent.color.light,
                  color: agent.color.primary,
                }}
              >
                {agent.role}
              </span>
            </h2>
            <p className="text-xs text-slate-500">{agent.expertise.slice(0, 2).join(', ')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Specialties Tags */}
      <div className="px-4 py-3 flex flex-wrap gap-2 border-b border-slate-100">
        {agent.expertise.map((specialty) => (
          <span
            key={specialty}
            className="text-[10px] px-2 py-1 rounded-full font-medium"
            style={{
              backgroundColor: agent.color.light,
              color: agent.color.primary,
            }}
          >
            {specialty}
          </span>
        ))}
      </div>

      {/* Capabilities List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-premium">
        {/* Active Capabilities */}
        {activeCapabilities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Fonctionnalites Actives
              </h3>
            </div>
            {activeCapabilities.map((capability, index) => (
              <CapabilityCard
                key={capability.name}
                capability={capability}
                agent={agent}
                index={index}
                copiedQuery={copiedQuery}
                onCopyQuery={handleCopyQuery}
              />
            ))}
          </div>
        )}

        {/* Dev Capabilities */}
        {devCapabilities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-3 h-3 text-amber-500" />
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                En Developpement
              </h3>
            </div>
            {devCapabilities.map((capability, index) => (
              <CapabilityCard
                key={capability.name}
                capability={capability}
                agent={agent}
                index={index}
                copiedQuery={copiedQuery}
                onCopyQuery={handleCopyQuery}
                disabled
              />
            ))}
          </div>
        )}

        {/* Planned Capabilities */}
        {plannedCapabilities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 text-slate-400" />
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Prochainement
              </h3>
            </div>
            {plannedCapabilities.map((capability, index) => (
              <CapabilityCard
                key={capability.name}
                capability={capability}
                agent={agent}
                index={index}
                copiedQuery={copiedQuery}
                onCopyQuery={handleCopyQuery}
                disabled
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-3 border-t flex items-center justify-center gap-2"
        style={{ backgroundColor: agent.color.light, borderColor: agent.color.light }}
      >
        <Sparkles className="w-3.5 h-3.5" style={{ color: agent.color.primary }} />
        <span className="text-xs" style={{ color: agent.color.primary }}>
          Cliquez sur une requete pour la copier
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// CAPABILITY CARD COMPONENT
// ============================================
interface CapabilityCardProps {
  capability: Capability;
  agent: typeof AGENTS[AgentRole];
  index: number;
  copiedQuery: string | null;
  onCopyQuery: (query: string) => void;
  disabled?: boolean;
}

function CapabilityCard({
  capability,
  agent,
  index,
  copiedQuery,
  onCopyQuery,
  disabled = false
}: CapabilityCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
        disabled ? 'opacity-60 border-slate-200' : 'border-slate-100'
      }`}
    >
      {/* Capability Header */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-3"
        style={{ backgroundColor: disabled ? '#f8fafc' : agent.color.light }}
      >
        <div className="flex items-center gap-2">
          <Zap
            className="w-4 h-4"
            style={{ color: disabled ? '#94a3b8' : agent.color.primary }}
          />
          <h3
            className="font-semibold text-sm"
            style={{ color: disabled ? '#64748b' : agent.color.primary }}
          >
            {capability.name}
          </h3>
        </div>
        <StatusBadge status={capability.status} />
      </div>

      {/* Description */}
      <p className="px-4 py-2 text-xs text-slate-600">
        {capability.description}
      </p>

      {/* Example Queries */}
      <div className="px-4 pb-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase font-medium">
          <MessageSquare className="w-3 h-3" />
          Requetes types
        </div>
        {capability.queries.map((query) => (
          <button
            key={query}
            onClick={() => !disabled && onCopyQuery(query)}
            disabled={disabled}
            className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg transition-colors group ${
              disabled
                ? 'bg-slate-50 cursor-not-allowed'
                : 'bg-slate-50 hover:bg-slate-100 cursor-pointer'
            }`}
          >
            <span className={`flex-1 text-xs font-medium ${disabled ? 'text-slate-400' : 'text-slate-700'}`}>
              "{query}"
            </span>
            {!disabled && (
              copiedQuery === query ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
              )
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
