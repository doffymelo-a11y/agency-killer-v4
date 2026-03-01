// ============================================================
// MCP SERVER: GTM MANAGER
// Gère Google Tag Manager - Crée tags, déclencheurs, variables
// API: Google Tag Manager API v2
// ============================================================

/**
 * @typedef {Object} GTMCredentials
 * @property {string} access_token - Google OAuth2 access token
 * @property {string} account_id - GTM Account ID
 */

/**
 * @typedef {Object} GTMFunctionInput
 * @property {string} function_name - Nom de la fonction à appeler
 * @property {Object} parameters - Paramètres de la fonction
 * @property {GTMCredentials} credentials - Credentials OAuth2
 */

const GTM_API_BASE = 'https://tagmanager.googleapis.com/tagmanager/v2';

// ═══════════════════════════════════════════════════════════════
// FONCTION PRINCIPALE: Router
// ═══════════════════════════════════════════════════════════════

async function gtm_manager(input) {
  const { function_name, parameters, credentials } = input;

  if (!credentials || !credentials.access_token) {
    return {
      success: false,
      error: 'Access token manquant. Connecter Google OAuth2 dans Intégrations.'
    };
  }

  try {
    switch (function_name) {
      case 'list_containers':
        return await listContainers(credentials, parameters);
      case 'list_tags':
        return await listTags(credentials, parameters);
      case 'create_tag':
        return await createTag(credentials, parameters);
      case 'create_trigger':
        return await createTrigger(credentials, parameters);
      case 'create_variable':
        return await createVariable(credentials, parameters);
      case 'publish_version':
        return await publishVersion(credentials, parameters);
      case 'preview_mode':
        return await enablePreviewMode(credentials, parameters);
      default:
        return {
          success: false,
          error: `Fonction inconnue: ${function_name}`
        };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
      details: error.toString()
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 1. LIST CONTAINERS
// ═══════════════════════════════════════════════════════════════

async function listContainers(credentials, params) {
  const { account_id } = params;

  if (!account_id) {
    return { success: false, error: 'account_id requis' };
  }

  const url = `${GTM_API_BASE}/accounts/${account_id}/containers`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `GTM API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();

  return {
    success: true,
    function: 'list_containers',
    output: {
      containers: data.container || [],
      count: (data.container || []).length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 2. LIST TAGS
// ═══════════════════════════════════════════════════════════════

async function listTags(credentials, params) {
  const { container_id } = params;

  if (!container_id) {
    return { success: false, error: 'container_id requis' };
  }

  // Format: accounts/{account_id}/containers/{container_id}/workspaces/{workspace_id}
  // On utilise le workspace par défaut (workspace_id = 1)
  const pathParts = container_id.split('/');
  const accountId = pathParts[1];
  const containerId = pathParts[3];
  const workspaceId = params.workspace_id || '1';

  const url = `${GTM_API_BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `GTM API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();

  return {
    success: true,
    function: 'list_tags',
    output: {
      tags: data.tag || [],
      count: (data.tag || []).length
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. CREATE TAG
// ═══════════════════════════════════════════════════════════════

async function createTag(credentials, params) {
  const { container_id, tag_config } = params;

  if (!container_id || !tag_config) {
    return { success: false, error: 'container_id et tag_config requis' };
  }

  const pathParts = container_id.split('/');
  const accountId = pathParts[1];
  const containerId = pathParts[3];
  const workspaceId = params.workspace_id || '1';

  const url = `${GTM_API_BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/tags`;

  // Structure du tag GTM
  const tagBody = {
    name: tag_config.name,
    type: tag_config.type, // Ex: 'gaawe' pour GA4, 'gclidw' pour Conversion Linker
    parameter: tag_config.parameters || [],
    firingTriggerId: tag_config.firing_trigger_ids || [],
    blockingTriggerId: tag_config.blocking_trigger_ids || [],
    tagFiringOption: tag_config.tag_firing_option || 'ONCE_PER_EVENT',
    monitoringMetadata: tag_config.monitoring_metadata || {}
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(tagBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `GTM API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();

  return {
    success: true,
    function: 'create_tag',
    output: {
      tag: data,
      tag_id: data.tagId,
      name: data.name,
      type: data.type,
      message: `Tag "${data.name}" créé avec succès`
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. CREATE TRIGGER
// ═══════════════════════════════════════════════════════════════

async function createTrigger(credentials, params) {
  const { container_id, trigger_config } = params;

  if (!container_id || !trigger_config) {
    return { success: false, error: 'container_id et trigger_config requis' };
  }

  const pathParts = container_id.split('/');
  const accountId = pathParts[1];
  const containerId = pathParts[3];
  const workspaceId = params.workspace_id || '1';

  const url = `${GTM_API_BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/triggers`;

  const triggerBody = {
    name: trigger_config.name,
    type: trigger_config.type, // Ex: 'PAGE_VIEW', 'CLICK', 'FORM_SUBMISSION'
    filter: trigger_config.filters || [],
    autoEventFilter: trigger_config.auto_event_filter || []
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(triggerBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `GTM API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();

  return {
    success: true,
    function: 'create_trigger',
    output: {
      trigger: data,
      trigger_id: data.triggerId,
      name: data.name,
      type: data.type,
      message: `Déclencheur "${data.name}" créé avec succès`
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 5. CREATE VARIABLE
// ═══════════════════════════════════════════════════════════════

async function createVariable(credentials, params) {
  const { container_id, variable_config } = params;

  if (!container_id || !variable_config) {
    return { success: false, error: 'container_id et variable_config requis' };
  }

  const pathParts = container_id.split('/');
  const accountId = pathParts[1];
  const containerId = pathParts[3];
  const workspaceId = params.workspace_id || '1';

  const url = `${GTM_API_BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/variables`;

  const variableBody = {
    name: variable_config.name,
    type: variable_config.type, // Ex: 'v' pour built-in, 'jsm' pour custom JavaScript
    parameter: variable_config.parameters || []
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(variableBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `GTM API Error: ${response.status}`,
      details: errorData
    };
  }

  const data = await response.json();

  return {
    success: true,
    function: 'create_variable',
    output: {
      variable: data,
      variable_id: data.variableId,
      name: data.name,
      type: data.type,
      message: `Variable "${data.name}" créée avec succès`
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 6. PUBLISH VERSION
// ═══════════════════════════════════════════════════════════════

async function publishVersion(credentials, params) {
  const { container_id, version_name } = params;

  if (!container_id) {
    return { success: false, error: 'container_id requis' };
  }

  const pathParts = container_id.split('/');
  const accountId = pathParts[1];
  const containerId = pathParts[3];
  const workspaceId = params.workspace_id || '1';

  // Créer une version du workspace
  const createVersionUrl = `${GTM_API_BASE}/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/create_version`;

  const versionBody = {
    name: version_name || `Version ${new Date().toISOString()}`,
    notes: params.notes || 'Published via Sora MCP'
  };

  const response = await fetch(createVersionUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(versionBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    return {
      success: false,
      error: `GTM API Error: ${response.status}`,
      details: errorData
    };
  }

  const versionData = await response.json();
  const versionId = versionData.containerVersion.containerVersionId;

  // Publier la version
  const publishUrl = `${GTM_API_BASE}/accounts/${accountId}/containers/${containerId}/versions/${versionId}/publish`;

  const publishResponse = await fetch(publishUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!publishResponse.ok) {
    const errorData = await publishResponse.json();
    return {
      success: false,
      error: `GTM Publish Error: ${publishResponse.status}`,
      details: errorData
    };
  }

  const publishData = await publishResponse.json();

  return {
    success: true,
    function: 'publish_version',
    output: {
      version: publishData.containerVersion,
      version_id: versionId,
      version_name: publishData.containerVersion.name,
      fingerprint: publishData.containerVersion.fingerprint,
      message: `Version "${publishData.containerVersion.name}" publiée avec succès`
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. ENABLE PREVIEW MODE
// ═══════════════════════════════════════════════════════════════

async function enablePreviewMode(credentials, params) {
  const { container_id } = params;

  if (!container_id) {
    return { success: false, error: 'container_id requis' };
  }

  const pathParts = container_id.split('/');
  const accountId = pathParts[1];
  const containerId = pathParts[3];
  const workspaceId = params.workspace_id || '1';

  // Note: GTM Preview Mode est généralement activé via l'UI
  // L'API ne fournit pas d'endpoint direct pour activer Preview Mode
  // On retourne un lien direct vers GTM Preview

  const previewUrl = `https://tagmanager.google.com/#/container/accounts/${accountId}/containers/${containerId}/workspaces/${workspaceId}/preview`;

  return {
    success: true,
    function: 'preview_mode',
    output: {
      preview_url: previewUrl,
      message: 'Ouvrir ce lien pour activer le mode Preview dans GTM',
      instructions: [
        '1. Cliquer sur le lien preview_url',
        '2. Dans GTM, cliquer sur "Preview"',
        '3. Entrer l\'URL de ton site',
        '4. Vérifier que les tags se déclenchent correctement'
      ]
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

module.exports = { gtm_manager };
