/**
 * Alarm Audio Utilities
 * Web Audio API-based alarm sound generation
 */

// Create audio context (singleton)
let audioContext = null;

export const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Resume audio context if suspended (browser autoplay policy)
export const resumeAudioContext = async () => {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
};

/**
 * Create alarm tone oscillator
 * @param {number} frequency - Frequency in Hz (higher = more urgent)
 * @param {number} volume - Volume (0-1)
 * @returns {Object} Oscillator and gain node
 */
export const createAlarmTone = (frequency = 800, volume = 0.1) => {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = 'square'; // Square wave for classic beep sound
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  return { oscillator, gainNode };
};

/**
 * Play a single beep
 * @param {number} duration - Duration in seconds
 * @param {number} frequency - Frequency in Hz
 */
export const playBeep = (duration = 0.2, frequency = 800) => {
  const ctx = getAudioContext();
  const { oscillator, gainNode } = createAlarmTone(frequency, 0.15);
  
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
  
  // Fade out to avoid clicking
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
};

/**
 * Play continuous beeping pattern
 * @param {number} frequency - Base frequency
 * @returns {Function} Stop function
 */
export const playContinuousAlarm = (frequency = 800) => {
  const ctx = getAudioContext();
  const { oscillator, gainNode } = createAlarmTone(frequency, 0.1);
  
  oscillator.start();
  
  // Create beeping pattern (200ms on, 800ms off)
  const beepPattern = () => {
    const now = ctx.currentTime;
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.setValueAtTime(0, now + 0.2);
  };
  
  const intervalId = setInterval(beepPattern, 1000);
  
  // Return stop function
  return () => {
    clearInterval(intervalId);
    try {
      oscillator.stop();
    } catch (e) {
      // Already stopped
    }
  };
};

/**
 * Get frequency for alarm severity
 */
export const getFrequencyForSeverity = (severity = 'warning') => {
  switch (severity) {
    case 'critical':
      return 1000; // Higher pitch for critical
    case 'warning':
      return 800;  // Medium pitch for warning
    case 'info':
      return 600;  // Lower pitch for info
    default:
      return 800;
  }
};

/**
 * Play multi-tone alarm (more urgent sound)
 */
export const playUrgentAlarm = () => {
  playBeep(0.15, 800);
  setTimeout(() => playBeep(0.15, 1000), 200);
};
