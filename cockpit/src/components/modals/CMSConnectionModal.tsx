// ═══════════════════════════════════════════════════════════════
// CMS Connection Modal Component
// Connect WordPress / Shopify / Webflow
// Phase 4.1 - CMS Connector Frontend UI
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Globe,
  ShoppingBag,
  Layout,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useCurrentProject } from '../../store/useHiveStore';
import type {
  CMSType,
  CMSConnectionFormData,
  CMSTestResult,
} from '../../types/cms.types';

export interface CMSConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCMSType?: CMSType;
  onConnectionSuccess?: (cmsType: CMSType) => void;
}

export default function CMSConnectionModal({
  isOpen,
  onClose,
  initialCMSType = 'wordpress',
  onConnectionSuccess,
}: CMSConnectionModalProps) {
  const currentProject = useCurrentProject();
  const [selectedCMS, setSelectedCMS] = useState<CMSType>(initialCMSType);
  const [formData, setFormData] = useState<CMSConnectionFormData>({
    site_url: '',
    username: '',
    app_password: '',
    api_key: '',
    site_id: '',
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<CMSTestResult | null>(null);

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────
  // Test Connection
  // ─────────────────────────────────────────────────────────────────

  const testConnection = async () => {
    if (!formData.site_url) {
      setTestResult({ success: false, message: 'Veuillez entrer l\'URL du site' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      // Build credentials based on CMS type
      const credentials: any = {
        cms_type: selectedCMS,
        site_url: formData.site_url,
        auth: {},
      };

      if (selectedCMS === 'wordpress') {
        if (!formData.username || !formData.app_password) {
          setTestResult({
            success: false,
            message: 'Username et Application Password requis pour WordPress',
          });
          setTesting(false);
          return;
        }
        credentials.auth = {
          username: formData.username,
          app_password: formData.app_password,
        };
      } else if (selectedCMS === 'shopify') {
        if (!formData.api_key) {
          setTestResult({
            success: false,
            message: 'API Key requise pour Shopify',
          });
          setTesting(false);
          return;
        }
        credentials.auth = {
          api_key: formData.api_key,
        };
      } else if (selectedCMS === 'webflow') {
        if (!formData.api_key || !formData.site_id) {
          setTestResult({
            success: false,
            message: 'API Key et Site ID requis pour Webflow',
          });
          setTesting(false);
          return;
        }
        credentials.auth = {
          api_key: formData.api_key,
          site_id: formData.site_id,
        };
      }

      // Call MCP Bridge to validate credentials
      const response = await fetch('http://localhost:3456/api/cms-connector/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'validate_cms_credentials',
          arguments: { credentials },
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setTestResult({
          success: true,
          message: '✅ Connexion réussie !',
          site_info: result.site_info,
        });
      } else {
        setTestResult({
          success: false,
          message: `❌ Erreur : ${result.error || 'Échec de la connexion'}`,
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Erreur réseau : ${error.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Save Connection
  // ─────────────────────────────────────────────────────────────────

  const saveConnection = async () => {
    if (!testResult?.success) {
      alert('Veuillez d\'abord tester la connexion avec succès');
      return;
    }

    if (!currentProject) {
      alert('Aucun projet sélectionné');
      return;
    }

    setSaving(true);

    try {
      // Build credentials
      const credentials: any = {
        cms_type: selectedCMS,
        site_url: formData.site_url,
        auth: {},
      };

      if (selectedCMS === 'wordpress') {
        credentials.auth = {
          username: formData.username,
          app_password: formData.app_password,
        };
      } else if (selectedCMS === 'shopify') {
        credentials.auth = {
          api_key: formData.api_key,
        };
      } else if (selectedCMS === 'webflow') {
        credentials.auth = {
          api_key: formData.api_key,
          site_id: formData.site_id,
        };
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert('Utilisateur non authentifié');
        setSaving(false);
        return;
      }

      // Save to user_integrations
      const { error: insertError } = await supabase.from('user_integrations').insert({
        user_id: user.id,
        project_id: currentProject.id,
        integration_type: selectedCMS,
        integration_name: `${selectedCMS} - ${formData.site_url}`,
        status: 'connected',
        encrypted_credentials: credentials, // TODO: Encrypt in production
        connected_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // Update state_flags
      const { error: updateError } = await supabase
        .from('projects')
        .update({
          state_flags: {
            ...currentProject.state_flags,
            [`${selectedCMS}_connected`]: true,
          },
        })
        .eq('id', currentProject.id);

      if (updateError) throw updateError;

      // Success
      if (onConnectionSuccess) {
        onConnectionSuccess(selectedCMS);
      }

      // Reset form
      setFormData({
        site_url: '',
        username: '',
        app_password: '',
        api_key: '',
        site_id: '',
      });
      setTestResult(null);
      onClose();
    } catch (error: any) {
      console.error('Save connection error:', error);
      alert(`Erreur sauvegarde : ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Connecter un CMS</h2>
            <p className="text-sm text-slate-500 mt-1">
              WordPress, Shopify ou Webflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* CMS Type Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setSelectedCMS('wordpress')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
              selectedCMS === 'wordpress'
                ? 'bg-blue-50 border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium">WordPress</span>
          </button>
          <button
            onClick={() => setSelectedCMS('shopify')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
              selectedCMS === 'shopify'
                ? 'bg-green-50 border-b-2 border-green-600 text-green-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">Shopify</span>
          </button>
          <button
            onClick={() => setSelectedCMS('webflow')}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
              selectedCMS === 'webflow'
                ? 'bg-purple-50 border-b-2 border-purple-600 text-purple-600'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layout className="w-5 h-5" />
            <span className="font-medium">Webflow</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-300px)]">
          {/* Site URL - Common for all */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              URL du site
            </label>
            <input
              type="url"
              value={formData.site_url}
              onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
              placeholder="https://votre-site.com"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* WordPress Fields */}
          {selectedCMS === 'wordpress' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="admin"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Application Password
                </label>
                <input
                  type="password"
                  value={formData.app_password}
                  onChange={(e) =>
                    setFormData({ ...formData, app_password: e.target.value })
                  }
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Générez un Application Password dans WordPress → Utilisateurs → Profil
                  → Application Passwords
                </p>
              </div>
            </>
          )}

          {/* Shopify Fields */}
          {selectedCMS === 'shopify' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="shppa_xxxxxxxxxxxxx"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-2">
                Générez une API Key dans Shopify Admin → Apps → Develop apps
              </p>
            </div>
          )}

          {/* Webflow Fields */}
          {selectedCMS === 'webflow' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  API Key
                </label>
                <input
                  type="password"
                  value={formData.api_key}
                  onChange={(e) =>
                    setFormData({ ...formData, api_key: e.target.value })
                  }
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Site ID
                </label>
                <input
                  type="text"
                  value={formData.site_id}
                  onChange={(e) =>
                    setFormData({ ...formData, site_id: e.target.value })
                  }
                  placeholder="5f7d8e9c1234567890abcdef"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Trouvez votre Site ID dans Webflow → Site Settings → General
                </p>
              </div>
            </>
          )}

          {/* Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 mb-4 ${
                testResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    testResult.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {testResult.message}
                </p>
                {testResult.site_info && (
                  <div className="mt-2 text-xs text-green-700">
                    <p>Site : {testResult.site_info.name}</p>
                    <p>Version : {testResult.site_info.version}</p>
                    {testResult.site_info.theme && (
                      <p>Thème : {testResult.site_info.theme}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={testConnection}
            disabled={testing || !formData.site_url}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {testing && <Loader2 className="w-4 h-4 animate-spin" />}
            {testing ? 'Test en cours...' : 'Tester la connexion'}
          </button>
          <button
            onClick={saveConnection}
            disabled={saving || !testResult?.success}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Sauvegarde...' : 'Connecter'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
