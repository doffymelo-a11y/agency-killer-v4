// ============================================
// THE HIVE OS V5 - Onboarding Wizard
// First-run wizard for new users
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, Rocket, Target, Palette, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase, getCurrentUser } from '../../lib/supabase';

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    objectives: [] as string[],
    industry: '',
    budget: '',
    timeline: '',
    brandColors: '',
    logoUrl: '',
  });
  const navigate = useNavigate();

  const steps = [
    { id: 'welcome', title: 'Bienvenue', icon: Rocket },
    { id: 'setup', title: 'Configuration', icon: Target },
    { id: 'brand', title: 'Identité visuelle', icon: Palette },
    { id: 'action', title: 'Premier pas', icon: Zap },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      const user = await getCurrentUser();
      if (user) {
        // Save onboarding completion to Supabase
        await supabase.from('user_preferences').upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
          onboarding_data: formData,
        });

        // Save to localStorage
        localStorage.setItem('hive_onboarding_completed', 'true');

        onComplete();
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Fallback: just mark as completed
      localStorage.setItem('hive_onboarding_completed', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hive_onboarding_completed', 'true');
    onSkip();
  };

  const toggleObjective = (objective: string) => {
    setFormData(prev => ({
      ...prev,
      objectives: prev.objectives.includes(objective)
        ? prev.objectives.filter(o => o !== objective)
        : [...prev.objectives, objective]
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Bienvenue sur Hive OS V5</h2>
            <button
              onClick={handleSkip}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Passer l'onboarding"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex-1">
                  <div className={`flex items-center gap-2 ${index !== 0 ? 'ml-2' : ''}`}>
                    {index !== 0 && (
                      <div className={`flex-1 h-1 rounded ${isCompleted ? 'bg-white' : 'bg-white/30'}`} />
                    )}
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      isActive ? 'bg-white text-purple-600' :
                      isCompleted ? 'bg-white/30 text-white' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium hidden md:inline">{step.title}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Welcome */}
              {currentStep === 0 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Quels sont vos objectifs ?
                    </h3>
                    <p className="text-gray-600">
                      Sélectionnez les domaines dans lesquels vous souhaitez être accompagné par nos 4 agents IA.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'seo', label: 'SEO & Référencement', description: 'Luna vous aide à optimiser votre visibilité', color: 'blue' },
                      { id: 'paid-ads', label: 'Publicité Payante', description: 'Marcus gère vos campagnes Google/Meta Ads', color: 'purple' },
                      { id: 'social', label: 'Médias Sociaux', description: 'Milo crée vos contenus créatifs', color: 'pink' },
                      { id: 'analytics', label: 'Analytics & Tracking', description: 'Sora analyse vos performances', color: 'green' },
                    ].map((objective) => (
                      <button
                        key={objective.id}
                        onClick={() => toggleObjective(objective.id)}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          formData.objectives.includes(objective.id)
                            ? `border-${objective.color}-600 bg-${objective.color}-50`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{objective.label}</h4>
                          {formData.objectives.includes(objective.id) && (
                            <div className={`w-6 h-6 rounded-full bg-${objective.color}-600 flex items-center justify-center`}>
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{objective.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Project Setup */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Parlez-nous de votre projet
                    </h3>
                    <p className="text-gray-600">
                      Ces informations nous aideront à mieux personnaliser l'accompagnement.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secteur d'activité
                      </label>
                      <select
                        value={formData.industry}
                        onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Sélectionnez un secteur</option>
                        <option value="ecommerce">E-commerce</option>
                        <option value="saas">SaaS B2B</option>
                        <option value="local">Service local (plombier, avocat, etc.)</option>
                        <option value="elearning">E-learning / Formation</option>
                        <option value="finance">Finance / Assurance</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Budget marketing mensuel
                      </label>
                      <select
                        value={formData.budget}
                        onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Sélectionnez un budget</option>
                        <option value="<500">Moins de 500€</option>
                        <option value="500-2000">500€ - 2,000€</option>
                        <option value="2000-5000">2,000€ - 5,000€</option>
                        <option value="5000-10000">5,000€ - 10,000€</option>
                        <option value=">10000">Plus de 10,000€</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Horizon temps
                      </label>
                      <select
                        value={formData.timeline}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      >
                        <option value="">Sélectionnez un horizon</option>
                        <option value="30-days">30 jours (Sprint)</option>
                        <option value="90-days">90 jours (Trimestre)</option>
                        <option value="6-months">6 mois</option>
                        <option value="1-year">1 an et +</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Brand Identity */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Identité visuelle
                    </h3>
                    <p className="text-gray-600">
                      (Optionnel) Ces éléments aideront Milo à créer des visuels cohérents avec votre marque.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Couleurs principales (HEX)
                      </label>
                      <input
                        type="text"
                        value={formData.brandColors}
                        onChange={(e) => setFormData(prev => ({ ...prev, brandColors: e.target.value }))}
                        placeholder="#FF5733, #0066CC"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Séparées par des virgules (ex: #FF5733, #0066CC)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL du logo (optionnel)
                      </label>
                      <input
                        type="url"
                        value={formData.logoUrl}
                        onChange={(e) => setFormData(prev => ({ ...prev, logoUrl: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Astuce:</strong> Vous pourrez enrichir ces informations plus tard dans les paramètres du projet.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: First Action */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Prêt à démarrer !
                    </h3>
                    <p className="text-gray-600">
                      Que souhaitez-vous faire en premier ?
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => {
                        handleComplete();
                        navigate('/genesis');
                      }}
                      className="p-6 text-left border-2 border-purple-200 hover:border-purple-600 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                          <Rocket className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Créer un projet complet</h4>
                      <p className="text-sm text-gray-600">
                        Lancez Genesis pour définir un projet marketing complet avec tous les agents.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        handleComplete();
                      }}
                      className="p-6 text-left border-2 border-gray-200 hover:border-gray-300 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-600 flex items-center justify-center">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">Explorer d'abord</h4>
                      <p className="text-sm text-gray-600">
                        Découvrez l'interface et les fonctionnalités à votre rythme.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={handleSkip}
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            Passer
          </button>

          <div className="flex items-center gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                disabled={currentStep === 0 && formData.objectives.length === 0}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                Continuer
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors"
              >
                Terminer
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
