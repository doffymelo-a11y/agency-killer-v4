// ═══════════════════════════════════════════════════════════════
// CMS Adapter Factory
// Route credentials.cms_type vers le bon adapter
// ═══════════════════════════════════════════════════════════════

import type { CMSAdapter } from './adapter.interface.js';
import type { CMSCredentials } from '../types.js';
import { WordPressAdapter } from './wordpress.adapter.js';
import { CMSError } from '../types.js';

/**
 * Factory qui crée le bon adapter selon le cms_type
 * @param credentials - Credentials CMS avec cms_type
 * @returns Instance de l'adapter approprié
 */
export function createAdapter(credentials: CMSCredentials): CMSAdapter {
  switch (credentials.cms_type) {
    case 'wordpress':
      return new WordPressAdapter(credentials);

    case 'shopify':
      // TODO Phase 2 : ShopifyAdapter
      throw new CMSError(
        'Shopify adapter not yet implemented',
        'NOT_IMPLEMENTED',
        501
      );

    case 'webflow':
      // TODO Phase 3 : WebflowAdapter
      throw new CMSError(
        'Webflow adapter not yet implemented',
        'NOT_IMPLEMENTED',
        501
      );

    default:
      throw new CMSError(
        `Unknown CMS type: ${credentials.cms_type}`,
        'INVALID_CMS_TYPE',
        400
      );
  }
}
