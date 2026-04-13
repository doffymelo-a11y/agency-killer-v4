/**
 * ErrorAlertBanner - Displays critical errors banner
 * Sprint 2.2 - Admin Dashboard UI Components
 */

import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

interface ErrorAlertBannerProps {
  errorCount: number;
  timeframe: string;
  onDismiss?: () => void;
}

export default function ErrorAlertBanner({
  errorCount,
  timeframe,
  onDismiss,
}: ErrorAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || errorCount === 0) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-red-900">
            System Errors Detected
          </h3>
          <p className="mt-1 text-sm text-red-700">
            <span className="font-bold">{errorCount}</span> error
            {errorCount > 1 ? 's' : ''} occurred in the {timeframe}. Check the
            logs for details.
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-auto text-red-500 hover:text-red-700 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
