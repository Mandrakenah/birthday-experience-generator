import { useRef, useState, useCallback, useEffect } from 'react';

interface UseMicrophoneOptions {
  onBlow: () => void;
  blowThreshold?: number;   // 0..1, default 0.15
  sustainMs?: number;       // ms a blow must sustain, default 250
}

function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

/** Spec 20.1: when Web Audio / getUserMedia is unavailable, skip mic UI entirely. */
export function isMicrophoneSupported(): boolean {
  return Boolean(getAudioContextCtor() && navigator.mediaDevices?.getUserMedia);
}

export function useMicrophone({
  onBlow,
  blowThreshold = 0.15,
  sustainMs = 250,
}: UseMicrophoneOptions) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const blowStartRef = useRef<number | null>(null);
  const frameRef = useRef<number>(0);
  const onBlowRef = useRef(onBlow);

  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onBlowRef.current = onBlow;
  }, [onBlow]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    blowStartRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      setHasPermission(true);

      const AudioCtx = getAudioContextCtor();
      if (!AudioCtx) throw new Error('Web Audio API is not supported');
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      // iPhone Safari: context starts suspended until resumed from a user gesture
      // (startListening is always called from a tap — spec 19.3).
      if (audioContext.state === 'suspended') await audioContext.resume();

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);

      const dataArray = new Float32Array(analyser.frequencyBinCount);

      const detect = () => {
        analyser.getFloatFrequencyData(dataArray);

        // Blow = broadband, low-mid frequency energy
        const lowMid = dataArray.slice(2, 50);
        const avgDb = lowMid.reduce((sum, v) => sum + v, 0) / lowMid.length;

        // dB scale typically -100 (silence) to 0 (loud) → normalize to 0..1
        const normalised = Math.max(0, (avgDb + 90) / 90);

        if (normalised > blowThreshold) {
          if (blowStartRef.current === null) {
            blowStartRef.current = performance.now();
          } else if (performance.now() - blowStartRef.current >= sustainMs) {
            blowStartRef.current = null;
            onBlowRef.current();
          }
        } else {
          blowStartRef.current = null;
        }

        frameRef.current = requestAnimationFrame(detect);
      };

      frameRef.current = requestAnimationFrame(detect);
    } catch (err) {
      setHasPermission(false);
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, [blowThreshold, sustainMs]);

  useEffect(() => () => stopListening(), [stopListening]);

  return { startListening, stopListening, isListening, hasPermission, error };
}
