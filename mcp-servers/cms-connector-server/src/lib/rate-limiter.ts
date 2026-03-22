// ═══════════════════════════════════════════════════════════════
// Rate Limiter
// Évite le spam API WordPress/Shopify/Webflow
// ═══════════════════════════════════════════════════════════════

interface RateLimitConfig {
  maxRequests: number; // Max requêtes par fenêtre
  windowMs: number; // Taille de la fenêtre (ms)
}

interface RateLimitEntry {
  count: number;
  resetAt: number; // Timestamp de reset
}

/**
 * Rate limiter in-memory simple
 * Limite par site_url (évite le spam par site)
 */
export class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 60, windowMs: 60000 }) {
    this.config = config;

    // Cleanup périodique des entrées expirées (toutes les 5 minutes)
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Vérifie si une requête peut être exécutée
   * @param key - Clé unique (ex: site_url)
   * @returns true si autorisé, false si rate limit dépassé
   */
  check(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // Pas d'entrée ou entrée expirée
    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return { allowed: true };
    }

    // Limite atteinte
    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // Secondes
      return { allowed: false, retryAfter };
    }

    // Incrémenter le compteur
    entry.count++;
    return { allowed: true };
  }

  /**
   * Reset manuel d'une clé (utile pour testing)
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Nettoie les entrées expirées
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Retourne les stats actuelles (pour monitoring)
   */
  getStats(key: string): { count: number; remaining: number; resetAt: number } | null {
    const entry = this.limits.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }
}

// Instance singleton globale
export const globalRateLimiter = new RateLimiter({
  maxRequests: 60, // 60 requêtes
  windowMs: 60000, // Par minute
});
