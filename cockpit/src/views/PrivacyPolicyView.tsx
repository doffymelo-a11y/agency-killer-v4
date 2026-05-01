// ============================================
// THE HIVE OS V4 - Privacy Policy Page
// GDPR-compliant privacy policy
// ============================================

import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar';

export default function PrivacyPolicyView() {
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
          <h1 className="text-4xl font-bold text-white mb-2">Politique de Confidentialité</h1>
          <p className="text-slate-400">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
        </div>

        {/* Content */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 space-y-8 text-slate-300">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="mb-4">
              Bienvenue sur <strong>The Hive OS</strong>. Nous attachons une grande importance à la protection de vos données personnelles et nous nous engageons à respecter votre vie privée.
            </p>
            <p>
              Cette politique de confidentialité décrit comment nous collectons, utilisons, partageons et protégeons vos informations personnelles lorsque vous utilisez notre plateforme SaaS de gestion marketing assistée par IA.
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Données Collectées</h2>

            <h3 className="text-xl font-semibold text-white mb-3">2.1 Informations d'inscription</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Adresse email</li>
              <li>Mot de passe (crypté)</li>
              <li>Nom d'entreprise (optionnel)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.2 Données d'utilisation</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Projets créés et leur configuration</li>
              <li>Tâches et leur statut</li>
              <li>Messages de chat avec nos agents IA</li>
              <li>Fichiers téléchargés (briefs, créatifs)</li>
              <li>Historique des interactions avec la plateforme</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">2.3 Données de paiement</h3>
            <ul className="list-disc list-inside space-y-2">
              <li>Informations de facturation (via Stripe)</li>
              <li>Historique des transactions</li>
              <li>Statut d'abonnement</li>
            </ul>
            <p className="text-sm text-slate-400 mt-2">
              Note : Nous n'enregistrons jamais vos numéros de carte bancaire. Tous les paiements sont traités de manière sécurisée par Stripe.
            </p>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Utilisation des Données</h2>
            <p className="mb-4">Nous utilisons vos données pour :</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Fournir le service</strong> : Exécuter vos projets, générer des stratégies marketing, créer des campagnes</li>
              <li><strong>Améliorer l'IA</strong> : Entraîner et améliorer nos modèles d'agents intelligents (de manière anonymisée)</li>
              <li><strong>Support client</strong> : Répondre à vos questions et résoudre les problèmes</li>
              <li><strong>Facturation</strong> : Gérer votre abonnement et vos paiements</li>
              <li><strong>Conformité légale</strong> : Respecter nos obligations légales et réglementaires</li>
              <li><strong>Communications</strong> : Vous envoyer des mises à jour importantes sur le service</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Partage des Données</h2>
            <p className="mb-4">Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :</p>

            <h3 className="text-xl font-semibold text-white mb-3">4.1 Fournisseurs de services</h3>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Supabase</strong> : Hébergement de base de données (Europe)</li>
              <li><strong>Google Cloud</strong> : Services d'IA (Vertex AI)</li>
              <li><strong>Stripe</strong> : Traitement des paiements</li>
              <li><strong>n8n</strong> : Orchestration des workflows</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">4.2 Obligations légales</h3>
            <p>
              Nous pouvons divulguer vos informations si la loi l'exige ou pour protéger nos droits, votre sécurité ou celle d'autrui.
            </p>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Sécurité des Données</h2>
            <p className="mb-4">Nous mettons en œuvre des mesures de sécurité robustes :</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Chiffrement</strong> : SSL/TLS pour toutes les communications</li>
              <li><strong>Authentification</strong> : Gestion sécurisée des mots de passe via Supabase Auth</li>
              <li><strong>Isolation</strong> : Row-Level Security (RLS) pour séparer les données entre utilisateurs</li>
              <li><strong>Sauvegardes</strong> : Sauvegardes automatiques régulières</li>
              <li><strong>Surveillance</strong> : Monitoring 24/7 de notre infrastructure</li>
            </ul>
          </section>

          {/* Your Rights (GDPR) */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Vos Droits (RGPD)</h2>
            <p className="mb-4">Conformément au RGPD, vous avez le droit de :</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Accès</strong> : Demander une copie de vos données personnelles</li>
              <li><strong>Rectification</strong> : Corriger des données inexactes</li>
              <li><strong>Suppression</strong> : Demander la suppression de vos données ("droit à l'oubli")</li>
              <li><strong>Portabilité</strong> : Recevoir vos données dans un format structuré</li>
              <li><strong>Opposition</strong> : Vous opposer au traitement de vos données</li>
              <li><strong>Limitation</strong> : Demander la limitation du traitement</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, rendez-vous dans <strong>Paramètres du compte</strong> ou contactez-nous à{' '}
              <a href="mailto:privacy@thehive.com" className="text-cyan-400 hover:text-cyan-300">
                privacy@thehive.com
              </a>
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Conservation des Données</h2>
            <p className="mb-4">Nous conservons vos données tant que votre compte est actif ou aussi longtemps que nécessaire pour vous fournir nos services.</p>
            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Compte actif</strong> : Données conservées indéfiniment</li>
              <li><strong>Obligations légales</strong> : Certaines données peuvent être conservées plus longtemps si requis par la loi (ex: données de facturation)</li>
            </ul>

            <div className="bg-slate-900 border border-cyan-500/30 rounded-lg p-6 mt-4">
              <h3 className="text-xl font-semibold text-white mb-3">Procédure de suppression de compte (RGPD Article 17)</h3>
              <p className="mb-4">Vous pouvez demander la suppression de votre compte à tout moment depuis vos paramètres.</p>

              <div className="space-y-3 text-slate-300">
                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">1.</span>
                  <p>
                    <strong className="text-white">Demande de suppression</strong> : Vous demandez la suppression de votre compte via l'interface.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">2.</span>
                  <p>
                    <strong className="text-white">Période de grâce de 30 jours</strong> : Vos données sont marquées comme "à supprimer" mais restent conservées pendant 30 jours. Durant cette période, vous pouvez <strong>annuler la demande en vous reconnectant simplement</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-cyan-400 font-bold">3.</span>
                  <p>
                    <strong className="text-white">Suppression définitive automatique</strong> : Après 30 jours, vos données sont <strong>définitivement effacées automatiquement</strong> par notre système (cron job quotidien). Cette suppression est irréversible.
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong className="text-cyan-400">Important :</strong> Pour annuler une demande de suppression, reconnectez-vous avant l'expiration des 30 jours. Après ce délai, il ne sera plus possible de récupérer vos données.
                </p>
              </div>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">8. Cookies et Technologies Similaires</h2>

            <h3 className="text-xl font-semibold text-white mb-3">8.1 Cookies essentiels (toujours actifs)</h3>
            <p className="mb-4">Ces cookies sont nécessaires au fonctionnement du site :</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Maintenir votre session connectée</li>
              <li>Sauvegarder vos préférences d'interface</li>
              <li>Assurer la sécurité de votre compte</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">8.2 Cookies analytics (optionnels)</h3>
            <p className="mb-4">Avec votre consentement, nous utilisons Google Analytics 4 pour :</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Comprendre comment vous utilisez le site (pages visitées, temps passé)</li>
              <li>Améliorer l'expérience utilisateur</li>
              <li>Analyser les performances de la plateforme</li>
            </ul>
            <p className="text-sm text-slate-400 mb-4">Les données sont anonymisées.</p>

            <h3 className="text-xl font-semibold text-white mb-3">8.3 Cookies marketing (optionnels)</h3>
            <p className="mb-4">Avec votre consentement, nous utilisons :</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Meta Pixel</strong> : Suivi des conversions publicitaires</li>
              <li><strong>Google Ads remarketing</strong> : Affichage de publicités pertinentes</li>
            </ul>

            <p className="mt-4">
              <strong className="text-white">Gérer vos préférences :</strong> Vous pouvez modifier vos choix de cookies à tout moment en cliquant sur le bouton "Paramètres des cookies" en bas de page, ou dans vos paramètres de compte.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">9. Transferts Internationaux</h2>
            <p>
              Vos données sont principalement hébergées en Europe (Supabase EU). Certains services tiers (Google Cloud Vertex AI) peuvent traiter vos données aux États-Unis, avec des garanties appropriées (clauses contractuelles types approuvées par la Commission européenne).
            </p>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">10. Mineurs</h2>
            <p>
              Notre service n'est pas destiné aux personnes de moins de 18 ans. Nous ne collectons pas sciemment d'informations personnelles auprès de mineurs.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">11. Modifications de cette Politique</h2>
            <p>
              Nous pouvons mettre à jour cette politique de confidentialité. Nous vous informerons de tout changement important par email ou via une notification dans l'application.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Nous Contacter</h2>
            <p className="mb-4">Pour toute question concernant cette politique de confidentialité ou vos données personnelles :</p>
            <div className="bg-slate-900 border border-slate-600 rounded-lg p-4">
              <p className="font-semibold text-white mb-2">The Hive OS - Data Protection Officer</p>
              <p>Email : <a href="mailto:privacy@thehive.com" className="text-cyan-400 hover:text-cyan-300">privacy@thehive.com</a></p>
              <p className="text-sm text-slate-400 mt-2">
                Vous pouvez également déposer une plainte auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) si vous estimez que vos droits ne sont pas respectés.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
