/**
 * Satisfaction Survey Component (CSAT)
 * Displayed when a ticket is resolved to collect user feedback
 */

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Star, ThumbsUp, ThumbsDown, Send, CheckCircle2 } from 'lucide-react';

interface SatisfactionSurveyProps {
  ticketId: string;
  onSubmit?: () => void;
}

const POSITIVE_TAGS = [
  'Réponse rapide',
  'Solution efficace',
  'Bonne communication',
  'Professionnel',
  'Au-delà des attentes',
];

const NEGATIVE_TAGS = [
  'Temps d\'attente long',
  'Solution incomplète',
  'Communication confuse',
  'Problème non résolu',
  'Réponse inadaptée',
];

export default function SatisfactionSurvey({ ticketId, onSubmit }: SatisfactionSurveyProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [positiveTags, setPositiveTags] = useState<string[]>([]);
  const [negativeTags, setNegativeTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStarClick = (value: number) => {
    setRating(value);
  };

  const togglePositiveTag = (tag: string) => {
    setPositiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleNegativeTag = (tag: string) => {
    setNegativeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const { error: insertError } = await supabase.from('ticket_satisfaction').insert({
        ticket_id: ticketId,
        user_id: user.id,
        rating,
        feedback: feedback.trim() || null,
        positive_tags: positiveTags.length > 0 ? positiveTags : null,
        negative_tags: negativeTags.length > 0 ? negativeTags : null,
      });

      if (insertError) throw insertError;

      setSubmitted(true);
      onSubmit?.();
    } catch (err: any) {
      console.error('[SatisfactionSurvey] Error submitting:', err);
      setError(err.message || 'Erreur lors de l\'envoi. Veuillez réessayer.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Merci pour votre retour!
        </h3>
        <p className="text-sm text-green-700">
          Votre avis nous aide à améliorer la qualité de notre support.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Comment évaluez-vous notre support?
        </h3>
        <p className="text-sm text-blue-700">
          Votre avis nous aide à nous améliorer
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarClick(value)}
            onMouseEnter={() => setHoverRating(value)}
            onMouseLeave={() => setHoverRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
          >
            <Star
              className={`w-10 h-10 ${
                value <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Labels */}
      {rating > 0 && (
        <div className="text-center mb-6">
          <p className="text-sm font-medium text-slate-700">
            {rating === 5 && '⭐ Excellent!'}
            {rating === 4 && '😊 Très satisfait'}
            {rating === 3 && '😐 Satisfaisant'}
            {rating === 2 && '😞 Peu satisfait'}
            {rating === 1 && '😠 Très insatisfait'}
          </p>
        </div>
      )}

      {/* Tags - Only show after rating */}
      {rating > 0 && (
        <>
          {/* Positive Tags (for rating >= 4) */}
          {rating >= 4 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-slate-700">
                  Qu'est-ce qui vous a plu?
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POSITIVE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => togglePositiveTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      positiveTags.includes(tag)
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-green-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Negative Tags (for rating <= 3) */}
          {rating <= 3 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <ThumbsDown className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-slate-700">
                  Comment pourrions-nous nous améliorer?
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {NEGATIVE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleNegativeTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      negativeTags.includes(tag)
                        ? 'bg-red-600 text-white'
                        : 'bg-white text-slate-700 border border-slate-300 hover:border-red-500'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Partagez-nous vos commentaires..."
              maxLength={2000}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-slate-500 mt-1">{feedback.length}/2000</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Envoyer mon avis
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
