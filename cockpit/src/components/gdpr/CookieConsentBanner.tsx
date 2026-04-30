// ============================================
// THE HIVE OS V5 - Cookie Consent Banner
// GDPR-compliant cookie consent management
// ============================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X, Check } from 'lucide-react';

interface CookieConsent {
  essential: boolean; // Always true (required for app to work)
  analytics: boolean; // GA4, tracking
  marketing: boolean; // Meta Pixel, Google Ads remarketing
  timestamp: string;
}

const DEFAULT_CONSENT: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: new Date().toISOString(),
};

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>(DEFAULT_CONSENT);

  useEffect(() => {
    // Check if user has already consented
    const savedConsent = localStorage.getItem('hive_cookie_consent');
    if (!savedConsent) {
      // Show banner after 1 second delay (better UX)
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      // Load saved consent and apply it
      const parsedConsent: CookieConsent = JSON.parse(savedConsent);
      setConsent(parsedConsent);
      applyConsent(parsedConsent);
    }
  }, []);

  const saveConsent = (newConsent: CookieConsent) => {
    const consentWithTimestamp = {
      ...newConsent,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('hive_cookie_consent', JSON.stringify(consentWithTimestamp));
    setConsent(consentWithTimestamp);
    applyConsent(consentWithTimestamp);
    setIsVisible(false);
  };

  const applyConsent = (consentData: CookieConsent) => {
    // Initialize or block tracking scripts based on consent

    // Google Analytics 4
    if (consentData.analytics) {
      // Enable GA4 tracking
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted',
        });
      }
    } else {
      // Disable GA4 tracking
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
        });
      }
    }

    // Marketing pixels (Meta, Google Ads)
    if (consentData.marketing) {
      // Enable marketing tracking
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted',
        });
      }
      // Enable Meta Pixel if available
      if (window.fbq) {
        window.fbq('consent', 'grant');
      }
    } else {
      // Disable marketing tracking
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
        });
      }
      // Disable Meta Pixel
      if (window.fbq) {
        window.fbq('consent', 'revoke');
      }
    }

    // Save consent to backend (optional, for GDPR audit trail)
    saveConsentToBackend(consentData);
  };

  const saveConsentToBackend = async (_consentData: CookieConsent) => {
    try {
      // Optional: Send consent to backend for audit trail
      // await fetch('/api/gdpr/consent', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(_consentData),
      // });
    } catch (error) {
      console.error('Error saving consent to backend:', error);
    }
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSaveCustom = () => {
    saveConsent(consent);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-[9998] bg-white border-t border-gray-200 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto p-6">
          {!showCustomize ? (
            // Simplified view (default)
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Nous utilisons des cookies
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Nous utilisons des cookies essentiels pour le fonctionnement du site, et des cookies optionnels pour améliorer votre expérience et analyser les performances. Vous pouvez personnaliser vos préférences.{' '}
                    <a href="/privacy-policy" className="text-purple-600 hover:underline">
                      En savoir plus
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => setShowCustomize(true)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Personnaliser
                </button>

                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Tout refuser
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Tout accepter
                </button>
              </div>
            </div>
          ) : (
            // Customized view
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Paramètres des cookies
                </h3>
                <button
                  onClick={() => setShowCustomize(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Essential Cookies */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">Cookies essentiels</h4>
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Toujours actifs
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Nécessaires au fonctionnement du site (authentification, session, sécurité). Ne peuvent pas être désactivés.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-6 bg-green-600 rounded-full flex items-center px-1">
                      <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1 pr-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Cookies analytics</h4>
                    <p className="text-sm text-gray-600">
                      Google Analytics 4 pour comprendre comment vous utilisez le site (pages visitées, temps passé, etc.). Anonymisé.
                    </p>
                  </div>
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, analytics: !prev.analytics }))}
                    className="flex-shrink-0"
                    aria-label="Toggle analytics cookies"
                  >
                    <div className={`w-12 h-6 rounded-full transition-colors ${consent.analytics ? 'bg-purple-600' : 'bg-gray-300'} flex items-center px-1`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${consent.analytics ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </button>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-start justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex-1 pr-4">
                    <h4 className="font-semibold text-gray-900 mb-1">Cookies marketing</h4>
                    <p className="text-sm text-gray-600">
                      Meta Pixel, Google Ads remarketing pour afficher des publicités pertinentes. Utilisés pour le suivi des conversions.
                    </p>
                  </div>
                  <button
                    onClick={() => setConsent(prev => ({ ...prev, marketing: !prev.marketing }))}
                    className="flex-shrink-0"
                    aria-label="Toggle marketing cookies"
                  >
                    <div className={`w-12 h-6 rounded-full transition-colors ${consent.marketing ? 'bg-purple-600' : 'bg-gray-300'} flex items-center px-1`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${consent.marketing ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors flex-1 sm:flex-initial"
                >
                  Tout refuser
                </button>

                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors flex-1 sm:flex-initial"
                >
                  Tout accepter
                </button>

                <button
                  onClick={handleSaveCustom}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 flex-1 sm:flex-initial"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer mes choix
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Type declarations for window objects
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}
