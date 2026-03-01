// ============================================
// THE HIVE OS V4 - Error Message Component
// Reusable error display with different types
// ============================================

interface ErrorMessageProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onDismiss?: () => void;
}

export default function ErrorMessage({ message, type = 'error', onDismiss }: ErrorMessageProps) {
  const styles = {
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    warning: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    info: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
  };

  const icons = {
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${styles[type]} text-sm`}>
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>
      <div className="flex-1">{message}</div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 opacity-70 hover:opacity-100 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
