import React, { useState, useRef, useCallback, useEffect } from 'react';
import { apiUrl } from '../../config/api';

// ─── PANAS 20 items arranged around an oval ───────────────────────────────────
export const PANAS = [
    { id: 'Interested',   emoji: '🧐', angle:  -81, pa: true  },
    { id: 'Excited',      emoji: '🤩', angle:  -63, pa: true  },
    { id: 'Strong',       emoji: '💪', angle:  -45, pa: true  },
    { id: 'Enthusiastic', emoji: '🎉', angle:  -27, pa: true  },
    { id: 'Proud',        emoji: '🏆', angle:   -9, pa: true  },
    { id: 'Alert',        emoji: '⚡', angle:    9, pa: true  },
    { id: 'Inspired',     emoji: '💡', angle:   27, pa: true  },
    { id: 'Determined',   emoji: '🔥', angle:   45, pa: true  },
    { id: 'Attentive',    emoji: '👀', angle:   63, pa: true  },
    { id: 'Active',       emoji: '🏃', angle:   81, pa: true  },
    { id: 'Distressed',   emoji: '😫', angle:   99, pa: false },
    { id: 'Upset',        emoji: '😞', angle:  117, pa: false },
    { id: 'Guilty',       emoji: '😣', angle:  135, pa: false },
    { id: 'Ashamed',      emoji: '😳', angle:  153, pa: false },
    { id: 'Afraid',       emoji: '😱', angle:  171, pa: false },
    { id: 'Scared',       emoji: '😨', angle: -171, pa: false },
    { id: 'Hostile',      emoji: '😡', angle: -153, pa: false },
    { id: 'Irritable',    emoji: '😒', angle: -135, pa: false },
    { id: 'Nervous',      emoji: '😰', angle: -117, pa: false },
    { id: 'Jittery',      emoji: '😬', angle:  -99, pa: false },
];

export const PANAS_EMOJI = Object.fromEntries(PANAS.map(e => [e.id, e.emoji]));

// ─── SVG layout constants ─────────────────────────────────────────────────────
const W = 740, H = 580;
const CX = 370, CY = 295;
const RX = 215, RY = 135;
const LRX = 300, LRY = 210;
const ER = 19;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toRad = d => d * Math.PI / 180;

const angularDist = (a, b) => {
    const d = ((a - b) % 360 + 360) % 360;
    return d > 180 ? 360 - d : d;
};

const nearestEmotion = angleDeg =>
    PANAS.reduce((best, e) => {
        const d = angularDist(angleDeg, e.angle);
        return d < best.d ? { e, d } : best;
    }, { e: null, d: 360 }).e;

// ─── Component ────────────────────────────────────────────────────────────────
/**
 * EmotionQuestionnaire — PANAS Oval, 20-point rating.
 *
 * The user must place one dot per emotion (click/drag inside each emotion's
 * angular sector).  Distance from centre → intensity 1–5.
 * Submit is disabled until all 20 emotions have a dot.
 */
export default function EmotionQuestionnaire({ elapsedSeconds, sessionId, onSubmit }) {
    // points: { [emotionId]: { x, y, intensity } }
    const [points, setPoints]         = useState({});
    const [lastSet, setLastSet]       = useState(null); // most recently set emotion id
    const [submitting, setSubmitting] = useState(false);
    const [saveError, setSaveError]   = useState(null);

    const svgRef   = useRef(null);
    const dragging = useRef(false);

    const scored    = Object.keys(points).length;
    const canSubmit = scored === PANAS.length;

    // ── coordinate → nearest emotion + intensity ───────────────────────────────
    const applyClientXY = useCallback((clientX, clientY) => {
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const svgX = (clientX - rect.left) * (W / rect.width);
        const svgY = (clientY - rect.top)  * (H / rect.height);

        const dx = svgX - CX;
        const dy = svgY - CY;

        const normDist = Math.sqrt((dx / RX) ** 2 + (dy / RY) ** 2);
        const clamped  = Math.min(normDist, 1);
        const scale    = normDist > 1 ? 1 / normDist : 1;

        const px        = CX + dx * scale;
        const py        = CY + dy * scale;
        const intensity = Math.max(1, Math.min(5, Math.ceil(clamped * 5)));
        const angleDeg  = Math.atan2(dy, dx) * 180 / Math.PI;
        const emotion   = nearestEmotion(angleDeg);
        if (!emotion) return;

        setPoints(prev => ({ ...prev, [emotion.id]: { x: px, y: py, intensity } }));
        setLastSet(emotion.id);
    }, []);

    // ── global drag listeners ──────────────────────────────────────────────────
    useEffect(() => {
        const onMove = e => {
            if (!dragging.current) return;
            const t = e.touches ? e.touches[0] : e;
            applyClientXY(t.clientX, t.clientY);
        };
        const onUp = () => { dragging.current = false; };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup',   onUp);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend',  onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup',   onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend',  onUp);
        };
    }, [applyClientXY]);

    // ── submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!canSubmit || submitting) return;
        setSubmitting(true);
        setSaveError(null);

        // Build scores object: { emotionId: intensity }
        const scores = Object.fromEntries(
            Object.entries(points).map(([id, p]) => [id, p.intensity])
        );

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiUrl(`/sessions/${sessionId}/emotion`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ scores, elapsed_seconds: elapsedSeconds }),
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

    const remaining = PANAS.filter(e => !points[e.id]);

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl select-none">💭</div>
                            <div>
                                <h2 className="text-lg font-bold leading-tight">Emotion Check-In</h2>
                                <p className="text-blue-200 text-xs mt-0.5">
                                    Rate all 20 emotions — click inside each emotion's section of the oval
                                </p>
                            </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-sm font-bold tabular-nums ${
                            canSubmit ? 'bg-green-500 text-white' : 'bg-white/20 text-white'
                        }`}>
                            {scored}/20
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full transition-all duration-300"
                            style={{ width: `${(scored / 20) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Instruction */}
                <div className="px-6 pt-3 pb-1 shrink-0">
                    <p className="text-xs text-gray-500">
                        <span className="font-bold">How to use:</span> click or drag in the oval near each emotion.
                        Distance from centre = intensity (1 = mild · 5 = very intense). You can update any emotion by clicking its section again.
                    </p>
                </div>

                {/* ── PANAS Oval ── */}
                <div className="flex-1 overflow-hidden px-4 pb-1">
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${W} ${H}`}
                        className="w-full h-full cursor-crosshair select-none touch-none"
                        onMouseDown={e => { dragging.current = true; applyClientXY(e.clientX, e.clientY); }}
                        onTouchStart={e => { e.preventDefault(); dragging.current = true; applyClientXY(e.touches[0].clientX, e.touches[0].clientY); }}
                    >
                        <rect width={W} height={H} fill="white" />

                        {/* Divider */}
                        <line x1={CX} y1={CY - LRY - 55} x2={CX} y2={CY + LRY + 35}
                            stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6 4" />

                        {/* PA / NA labels */}
                        <text x={CX + 22} y={CY - LRY - 28} fontSize="12" fontWeight="700"
                            fill="#10b981" fontFamily="sans-serif"
                            stroke="white" strokeWidth="3" paintOrder="stroke">
                            Positive Affect →
                        </text>
                        <text x={CX - 22} y={CY - LRY - 28} fontSize="12" fontWeight="700"
                            fill="#f43f5e" fontFamily="sans-serif" textAnchor="end"
                            stroke="white" strokeWidth="3" paintOrder="stroke">
                            ← Negative Affect
                        </text>

                        {/* Concentric intensity rings */}
                        {[1, 2, 3, 4].map(i => (
                            <ellipse key={i} cx={CX} cy={CY}
                                rx={RX * i / 5} ry={RY * i / 5}
                                fill="none" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="5 5" />
                        ))}

                        {/* Outer oval */}
                        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
                            fill="#f8faff" stroke="#6366f1" strokeWidth="2.5" />

                        {/* Intensity ring numbers */}
                        {[1, 2, 3, 4, 5].map(i => (
                            <text key={i}
                                x={CX + RX * i / 5 - 6} y={CY + 4}
                                fontSize="10" fontFamily="sans-serif" fill="#94a3b8" textAnchor="end"
                                stroke="white" strokeWidth="2.5" paintOrder="stroke">
                                {i}
                            </text>
                        ))}

                        {/* Centre */}
                        <circle cx={CX} cy={CY} r="4" fill="#cbd5e1" />
                        <text x={CX} y={CY + 18} textAnchor="middle"
                            fontSize="10" fontFamily="sans-serif" fill="#94a3b8"
                            stroke="white" strokeWidth="2.5" paintOrder="stroke">
                            mild
                        </text>

                        {/* ── Emotion circles ── */}
                        {PANAS.map(e => {
                            const ex     = CX + LRX * Math.cos(toRad(e.angle));
                            const ey     = CY + LRY * Math.sin(toRad(e.angle));
                            const pt     = points[e.id];
                            const isSet  = !!pt;
                            const isLast = lastSet === e.id;
                            const accent = e.pa ? '#10b981' : '#f43f5e';
                            const bgSet  = e.pa ? '#d1fae5' : '#ffe4e6';

                            return (
                                <g key={e.id} transform={`translate(${ex.toFixed(1)},${ey.toFixed(1)})`}>
                                    {/* Glow for last-set */}
                                    {isLast && <circle r={ER + 7} fill={bgSet} opacity="0.8" />}

                                    {/* Circle */}
                                    <circle r={ER}
                                        fill={isSet ? accent : 'white'}
                                        stroke={isSet ? accent : '#d1d5db'}
                                        strokeWidth={isSet ? '2.5' : '1.5'}
                                        opacity={isSet ? 1 : 0.7}
                                    />

                                    {/* Emoji */}
                                    <text textAnchor="middle" dominantBaseline="central"
                                        fontSize="13" className="select-none"
                                        opacity={isSet ? 1 : 0.5}>
                                        {e.emoji}
                                    </text>

                                    {/* Intensity badge (top-right of circle) */}
                                    {isSet && (
                                        <g transform={`translate(${ER - 4}, ${-ER + 4})`}>
                                            <circle r="7" fill="#1e1b4b" />
                                            <text textAnchor="middle" dominantBaseline="central"
                                                fontSize="8" fontWeight="700" fill="white" fontFamily="sans-serif">
                                                {pt.intensity}
                                            </text>
                                        </g>
                                    )}

                                    {/* Name label */}
                                    <text y={ER + 13} textAnchor="middle"
                                        fontSize="9.5" fontFamily="sans-serif"
                                        fill={isSet ? accent : '#94a3b8'}
                                        fontWeight={isSet ? '700' : '400'}
                                        stroke="white" strokeWidth="3" paintOrder="stroke">
                                        {e.id}
                                    </text>
                                </g>
                            );
                        })}

                        {/* ── Placed dots (one per rated emotion) ── */}
                        {PANAS.map(e => {
                            const pt = points[e.id];
                            if (!pt) return null;
                            const color = e.pa ? '#10b981' : '#f43f5e';
                            return (
                                <g key={`dot-${e.id}`}>
                                    <circle cx={pt.x} cy={pt.y} r="7" fill={color} />
                                    <circle cx={pt.x} cy={pt.y} r="3" fill="white" />
                                </g>
                            );
                        })}

                        {/* Centre prompt when nothing placed */}
                        {scored === 0 && (
                            <text x={CX} y={CY - 10} textAnchor="middle"
                                fontSize="13" fontFamily="sans-serif" fill="#94a3b8"
                                stroke="white" strokeWidth="3" paintOrder="stroke">
                                Click near each emotion
                            </text>
                        )}
                    </svg>
                </div>

                {/* Remaining emotions hint */}
                <div className="px-6 py-2 shrink-0 min-h-[36px] flex items-center">
                    {canSubmit ? (
                        <p className="text-xs text-emerald-600 font-bold">
                            ✓ All 20 emotions rated — ready to submit
                        </p>
                    ) : (
                        <p className="text-xs text-amber-600">
                            Still needed:&nbsp;
                            {remaining.map(e => (
                                <span key={e.id} className="inline-flex items-center gap-0.5 mr-1">
                                    {e.emoji}
                                </span>
                            ))}
                            <span className="font-medium">({remaining.length} remaining)</span>
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 pb-5 pt-2 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    {saveError && (
                        <p className="text-xs text-red-600 text-center mb-3 font-medium bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            ❌ {saveError}
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
