import React, { useState } from 'react';
import { apiUrl } from '../../config/api';

// ─── PANAS 20 items ───────────────────────────────────────────────────────────
export const PANAS = [
    // Positive Affect
    { id: 'Interested',   emoji: '🧐', pa: true  },
    { id: 'Excited',      emoji: '🤩', pa: true  },
    { id: 'Strong',       emoji: '💪', pa: true  },
    { id: 'Enthusiastic', emoji: '🎉', pa: true  },
    { id: 'Proud',        emoji: '🏆', pa: true  },
    { id: 'Alert',        emoji: '⚡', pa: true  },
    { id: 'Inspired',     emoji: '💡', pa: true  },
    { id: 'Determined',   emoji: '🔥', pa: true  },
    { id: 'Attentive',    emoji: '👀', pa: true  },
    { id: 'Active',       emoji: '🏃', pa: true  },
    // Negative Affect
    { id: 'Distressed',   emoji: '😫', pa: false },
    { id: 'Upset',        emoji: '😞', pa: false },
    { id: 'Guilty',       emoji: '😣', pa: false },
    { id: 'Ashamed',      emoji: '😳', pa: false },
    { id: 'Afraid',       emoji: '😱', pa: false },
    { id: 'Scared',       emoji: '😨', pa: false },
    { id: 'Hostile',      emoji: '😡', pa: false },
    { id: 'Irritable',    emoji: '😒', pa: false },
    { id: 'Nervous',      emoji: '😰', pa: false },
    { id: 'Jittery',      emoji: '😬', pa: false },
];

/** Quick id → emoji lookup used by the admin log table. */
export const PANAS_EMOJI = Object.fromEntries(PANAS.map(e => [e.id, e.emoji]));

// Scale anchor labels (standard PANAS wording)
const SCALE_LABELS = ['', 'Not at all', 'A little', 'Moderately', 'Quite a bit', 'Extremely'];

const PA_ITEMS = PANAS.filter(e =>  e.pa);
const NA_ITEMS = PANAS.filter(e => !e.pa);

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * EmotionQuestionnaire — Full PANAS rating grid.
 *
 * Students rate all 20 emotions on a 1–5 scale.
 * Submit is disabled until every emotion has a score.
 */
export default function EmotionQuestionnaire({ elapsedSeconds, sessionId, onSubmit }) {
    // scores: { [emotionId]: 1|2|3|4|5 }
    const [scores, setScores]         = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [saveError, setSaveError]   = useState(null);

    const scored   = Object.keys(scores).length;
    const total    = PANAS.length;
    const canSubmit = scored === total;

    const setScore = (id, value) =>
        setScores(prev => ({ ...prev, [id]: value }));

    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setSaveError(null);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiUrl(`/sessions/${sessionId}/emotion`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    scores,
                    elapsed_seconds: elapsedSeconds,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || `Server error ${res.status}`);
            }
            onSubmit();
        } catch (err) {
            console.error('Failed to save emotion response:', err);
            setSaveError(err.message || 'Failed to save. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[96vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl select-none">💭</div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight">Emotion Check-In</h2>
                                <p className="text-blue-200 text-xs mt-0.5">
                                    Simulation paused — rate all emotions to continue
                                </p>
                            </div>
                        </div>
                        {/* Progress badge */}
                        <div className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                            canSubmit ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                        }`}>
                            {scored}/{total}
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${(scored / total) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Scale legend */}
                <div className="px-6 pt-3 pb-1 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <span className="mr-1 font-medium text-gray-500">Scale:</span>
                        {[1,2,3,4,5].map(n => (
                            <span key={n} className="px-2 py-0.5 bg-gray-100 rounded font-medium text-gray-600">
                                {n} = {SCALE_LABELS[n]}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Emotion grid */}
                <div className="flex-1 overflow-y-auto px-6 py-3">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">

                        {/* Positive Affect column header */}
                        <div className="flex items-center gap-1.5 pb-1 border-b border-emerald-100">
                            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Positive Affect</span>
                        </div>
                        {/* Negative Affect column header */}
                        <div className="flex items-center gap-1.5 pb-1 border-b border-rose-100">
                            <span className="text-xs font-bold text-rose-500 uppercase tracking-wide">Negative Affect</span>
                        </div>

                        {/* Paired rows */}
                        {PA_ITEMS.map((pa, i) => {
                            const na = NA_ITEMS[i];
                            return (
                                <React.Fragment key={pa.id}>
                                    <EmotionRow emotion={pa} score={scores[pa.id]} onScore={setScore} />
                                    <EmotionRow emotion={na} score={scores[na.id]} onScore={setScore} />
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 pb-5 pt-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    {saveError && (
                        <p className="text-xs text-red-600 text-center mb-3 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            ❌ {saveError}
                        </p>
                    )}
                    {!canSubmit && (
                        <p className="text-xs text-amber-600 text-center mb-3 font-medium">
                            ⚠️ {total - scored} emotion{total - scored !== 1 ? 's' : ''} still need a score
                        </p>
                    )}
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className={`w-full py-4 rounded-xl font-bold text-base transition-all ${
                            canSubmit && !submitting
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl active:scale-[0.99]'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {submitting ? 'Saving…' : 'Submit & Resume Simulation'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Single emotion row ───────────────────────────────────────────────────────
function EmotionRow({ emotion, score, onScore }) {
    const isPA     = emotion.pa;
    const selected = score != null;

    return (
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
            selected
                ? isPA ? 'bg-emerald-50' : 'bg-rose-50'
                : 'hover:bg-gray-50'
        }`}>
            {/* Emoji + name */}
            <span className="text-base leading-none select-none">{emotion.emoji}</span>
            <span className={`text-xs font-medium w-[88px] shrink-0 ${
                selected
                    ? isPA ? 'text-emerald-700' : 'text-rose-700'
                    : 'text-gray-600'
            }`}>
                {emotion.id}
            </span>

            {/* Score buttons 1–5 */}
            <div className="flex gap-0.5 ml-auto">
                {[1, 2, 3, 4, 5].map(n => {
                    const active = score === n;
                    let cls = 'w-7 h-7 rounded text-xs font-bold transition-all ';
                    if (active) {
                        cls += isPA
                            ? 'bg-emerald-500 text-white shadow-sm scale-110'
                            : 'bg-rose-500   text-white shadow-sm scale-110';
                    } else {
                        cls += isPA
                            ? 'bg-white border border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600'
                            : 'bg-white border border-gray-200 text-gray-500 hover:border-rose-400   hover:text-rose-600';
                    }
                    return (
                        <button key={n} onClick={() => onScore(emotion.id, n)} className={cls}>
                            {n}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
