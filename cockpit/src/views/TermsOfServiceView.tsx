// ============================================
// THE HIVE OS V4 - Terms of Service Page
// Legal terms and conditions
// ============================================

import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';

export default function TermsOfServiceView() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <TopBar />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-white mb-4 flex items-center gap-2 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Conditions Générales d'Utilisation</h1>
          <p className="text-slate-400">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 space-y-8 text-slate-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptation des Conditions</h2>
            <p className="mb-4">
              En accédant et en utilisant <strong>The Hive OS</strong> (ci-après "le Service"), vous acceptez d'être lié par les présentes Conditions Générales d'Utilisation (CGU).
            </p>
            <p>
              Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser notre Service.
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description du Service</h2>
            <p className="mb-4">
              The Hive OS est une plateforme SaaS de gestion marketing assistée par IA. Le Service fournit :
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Agents IA spécialisés (PM, Stratège, Créatif, Media Buyer, etc.)</li>
              <li>Gestion de projets et workflows marketing</li>
              <li>Génération automatique de stratégies et créatifs</li>
              <li>Intégrations avec des plateformes tierces (Meta, Google, etc.)</li>
              <li>Tableaux de bord analytiques</li>
            </ul>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Compte Utilisateur</h2>

            <h3 className="text-xl font-semibold text-white mb-3">3.1 Création de compte</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Vous devez avoir au moins 18 ans pour créer un compte</li>
              <li>Vous devez fournir des informations exactes et à jour</li>
              <li>Vous êtes responsable de la confidentialité de votre mot de passe</li>
              <li>Vous êtes responsable de toutes les activités effectuées sous votre compte</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">3.2 Sécurité du compte</h3>
            <p>
              Vous devez nous informer immédiatement de toute utilisation non autorisée de votre compte. Nous ne serons pas responsables des pertes résultant d'un accès non autorisé à votre compte.
            </p>
          </section>

          {/* Subscription */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Abonnement et Paiement</h2>

            <h3 className="text-xl font-semibold text-white mb-3">4.1 Plans disponibles</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Free</strong> : Accès limité avec 1 projet</li>
              <li><strong>Pro (€79/mois)</strong> : 10 projets, agents illimités</li>
              <li><strong>Enterprise (€299/mois)</strong> : Projets illimités, API, white-label</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.2 Facturation</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Les abonnements sont facturés mensuellement ou annuellement</li>
              <li>Les paiements sont traités via Stripe</li>
              <li>Tous les prix sont en euros (EUR) et hors taxes</li>
              <li>Le renouvellement est automatique sauf annulation</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.3 Remboursements</h3>
            <p>
              Les paiements sont non remboursables sauf en cas d'erreur de notre part ou si la loi l'exige. Nous pouvons, à notre discrétion, offrir des remboursements partiels au cas par cas.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">4.4 Modifications de prix</h3>
            <p>
              Nous nous réservons le droit de modifier nos prix à tout moment. Les changements de prix seront communiqués au moins 30 jours à l'avance et prendront effet lors de votre prochain cycle de facturation.
            </p>
          </section>

          {/* Usage Limits */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Limites d'Utilisation</h2>
            <p className="mb-4">
              Chaque plan a des limites d'utilisation spécifiques (nombre de projets, messages, appels d'agents). Le dépassement de ces limites peut entraîner :
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Suspension temporaire du service</li>
              <li>Facturation supplémentaire (si activée)</li>
              <li>Obligation de passer à un plan supérieur</li>
            </ul>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Utilisation Acceptable</h2>
            <p className="mb-4">Vous vous engagez à ne PAS :</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Violer les lois</strong> : Utiliser le Service pour des activités illégales</li>
              <li><strong>Diffuser du contenu illicite</strong> : Contenus haineux, diffamatoires, pornographiques</li>
              <li><strong>Abuser du système</strong> : Tentatives de hack, scraping, spam</li>
              <li><strong>Contourner les limites</strong> : Utiliser plusieurs comptes pour contourner les quotas</li>
              <li><strong>Revendre le service</strong> : Sans notre autorisation écrite</li>
              <li><strong>Ingénierie inverse</strong> : Tenter de reproduire nos algorithmes IA</li>
            </ul>
            <p className="mt-4 text-yellow-400">
              ⚠️ La violation de ces règles peut entraîner la suspension ou la résiliation immédiate de votre compte sans remboursement.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Propriété Intellectuelle</h2>

            <h3 className="text-xl font-semibold text-white mb-3">7.1 Notre propriété</h3>
            <p className="mb-4">
              Le Service, y compris le code, les designs, les logos, les agents IA et tous les contenus associés, sont notre propriété exclusive ou celle de nos concédants de licence.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">7.2 Votre contenu</h3>
            <p className="mb-4">
              Vous conservez tous les droits sur le contenu que vous créez ou téléchargez sur le Service (briefs, créatifs, stratégies).
            </p>
            <p>
              Vous nous accordez une licence mondiale, non exclusive et gratuite pour utiliser, héberger, stocker et traiter votre contenu afin de fournir le Service.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">7.3 Contenu généré par IA</h3>
            <p>
              Les stratégies, créatifs et contenus générés par nos agents IA vous appartiennent. Vous pouvez les utiliser librement dans le cadre de vos activités marketing.
            </p>
          </section>

          {/* Warranty Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Garanties et Limitations</h2>

            <h3 className="text-xl font-semibold text-white mb-3">8.1 Service "tel quel"</h3>
            <p className="mb-4">
              Le Service est fourni "tel quel" et "selon disponibilité", sans aucune garantie expresse ou implicite. Nous ne garantissons pas que :
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Le Service sera ininterrompu ou sans erreur</li>
              <li>Les résultats générés par l'IA seront toujours précis ou adaptés</li>
              <li>Tous les bugs seront corrigés</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">8.2 Responsabilité des campagnes</h3>
            <p>
              Vous êtes seul responsable des campagnes marketing que vous lancez en utilisant notre Service. Nous ne sommes pas responsables des performances, ROI, ou résultats de vos campagnes.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">8.3 Limitation de responsabilité</h3>
            <p>
              Dans les limites autorisées par la loi, notre responsabilité totale ne dépassera pas le montant que vous avez payé au cours des 12 derniers mois.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Résiliation</h2>

            <h3 className="text-xl font-semibold text-white mb-3">9.1 Par vous</h3>
            <p className="mb-4">
              Vous pouvez annuler votre abonnement à tout moment via le portail de facturation. L'annulation prendra effet à la fin de votre période de facturation en cours.
            </p>

            <h3 className="text-xl font-semibold text-white mb-3">9.2 Par nous</h3>
            <p className="mb-4">
              Nous pouvons suspendre ou résilier votre compte immédiatement si :
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Vous violez ces CGU</li>
              <li>Votre paiement échoue de manière répétée</li>
              <li>Nous cessons de fournir le Service</li>
              <li>La loi nous y oblige</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">9.3 Effet de la résiliation</h3>
            <p>
              Après résiliation, vous perdrez l'accès à votre compte et à vos données. Nous conserverons vos données pendant 30 jours avant suppression définitive (sauf obligations légales).
            </p>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Protection des Données</h2>
            <p>
              L'utilisation de vos données personnelles est régie par notre{' '}
              <button
                onClick={() => navigate('/privacy')}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Politique de Confidentialité
              </button>
              .
            </p>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Modifications des CGU</h2>
            <p>
              Nous pouvons modifier ces CGU à tout moment. Les modifications importantes seront notifiées par email ou via l'application au moins 30 jours avant leur entrée en vigueur. Votre utilisation continue du Service après les modifications constitue votre acceptation des nouvelles conditions.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Droit Applicable</h2>
            <p>
              Ces CGU sont régies par le droit français. Tout litige sera soumis à la juridiction exclusive des tribunaux français.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
            <p className="mb-4">Pour toute question concernant ces CGU :</p>
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">The Hive OS - Support Legal</p>
              <p>Email : <a href="mailto:legal@thehive.com" className="text-cyan-400 hover:text-cyan-300">legal@thehive.com</a></p>
            </div>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">14. Divisibilité</h2>
            <p>
              Si une disposition de ces CGU est jugée invalide ou inapplicable, les autres dispositions resteront en vigueur.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">15. Intégralité de l'Accord</h2>
            <p>
              Ces CGU, ainsi que notre Politique de Confidentialité, constituent l'intégralité de l'accord entre vous et nous concernant l'utilisation du Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
