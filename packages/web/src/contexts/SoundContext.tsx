import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";

interface SoundContextType {
  soundEnabled: boolean;
  musicEnabled: boolean;
  toggleSound: () => void;
  toggleMusic: () => void;
  startBackgroundMusic: () => void;
  stopBackgroundMusic: () => void;
  playClick: () => void;
  playCorrect: () => void;
  playWrong: () => void;
  playTick: () => void;
  playCoin: () => void;
  playGameStart: () => void;
  playWhoosh: () => void;
  playSuccess: () => void;
  playNotification: () => void;
  playVictory: () => void;
  playPowerUp: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

// Create retro 8-bit sounds using Web Audio API
const createAudioContext = () => {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
};

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem("soundEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem("musicEnabled");
    return saved !== null ? JSON.parse(saved) : true;
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorsRef = useRef<OscillatorNode[]>([]);
  const musicGainRef = useRef<GainNode | null>(null);
  const musicIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem("soundEnabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("musicEnabled", JSON.stringify(musicEnabled));
  }, [musicEnabled]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = createAudioContext();
    }
    return audioContextRef.current;
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev: boolean) => !prev);
  }, []);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev: boolean) => !prev);
  }, []);

  // Background music - retro chiptune loop
  const stopBackgroundMusic = useCallback(() => {
    if (musicIntervalRef.current) {
      clearInterval(musicIntervalRef.current);
      musicIntervalRef.current = null;
    }
    musicOscillatorsRef.current.forEach((osc) => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    musicOscillatorsRef.current = [];
  }, []);

  const startBackgroundMusic = useCallback(() => {
    if (!musicEnabled) return;

    const ctx = getAudioContext();

    // Stop any existing music
    stopBackgroundMusic();

    // Create master gain for music
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.5, ctx.currentTime); // Low volume for background
    masterGain.connect(ctx.destination);
    musicGainRef.current = masterGain;

    // Simple retro melody pattern (C major pentatonic)
    const melody = [262, 294, 330, 392, 440, 392, 330, 294]; // C4, D4, E4, G4, A4...
    const bass = [131, 131, 165, 165, 196, 196, 165, 165]; // C3, C3, E3, E3, G3...
    let noteIndex = 0;

    const playNote = () => {
      if (!musicEnabled) {
        stopBackgroundMusic();
        return;
      }

      const currentTime = ctx.currentTime;

      // Melody oscillator
      const melodyOsc = ctx.createOscillator();
      const melodyGain = ctx.createGain();
      melodyOsc.type = "square";
      melodyOsc.frequency.setValueAtTime(melody[noteIndex], currentTime);
      melodyGain.gain.setValueAtTime(0.06, currentTime);
      melodyGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
      melodyOsc.connect(melodyGain);
      melodyGain.connect(masterGain);
      melodyOsc.start(currentTime);
      melodyOsc.stop(currentTime + 0.35);

      // Bass oscillator
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "triangle";
      bassOsc.frequency.setValueAtTime(bass[noteIndex], currentTime);
      bassGain.gain.setValueAtTime(0.04, currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
      bassOsc.connect(bassGain);
      bassGain.connect(masterGain);
      bassOsc.start(currentTime);
      bassOsc.stop(currentTime + 0.35);

      musicOscillatorsRef.current.push(melodyOsc, bassOsc);

      noteIndex = (noteIndex + 1) % melody.length;
    };

    // Play first note immediately
    playNote();

    // Continue playing notes
    musicIntervalRef.current = setInterval(playNote, 400);
  }, [musicEnabled, getAudioContext, stopBackgroundMusic]);

  // Retro click sound (short blip)
  const playClick = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [soundEnabled, getAudioContext]);

  // Correct answer sound (ascending arpeggio)
  const playCorrect = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + i * 0.1 + 0.15,
      );

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
  }, [soundEnabled, getAudioContext]);

  // Wrong answer sound (descending buzz)
  const playWrong = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.3);
  }, [soundEnabled, getAudioContext]);

  // Timer tick sound
  const playTick = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(1000, ctx.currentTime);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }, [soundEnabled, getAudioContext]);

  // Coin/token sound (Mario-like)
  const playCoin = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = "square";
    osc2.type = "square";

    osc1.frequency.setValueAtTime(988, ctx.currentTime); // B5
    osc2.frequency.setValueAtTime(1319, ctx.currentTime + 0.08); // E6

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.2);
  }, [soundEnabled, getAudioContext]);

  // Game start fanfare
  const playGameStart = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const notes = [262, 330, 392, 523, 659, 784]; // C4 to G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + i * 0.08 + 0.15,
      );

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.15);
    });
  }, [soundEnabled, getAudioContext]);

  // Whoosh sound for transitions
  const playWhoosh = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sawtooth";
    filter.type = "lowpass";

    osc.frequency.setValueAtTime(100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.15);

    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  }, [soundEnabled, getAudioContext]);

  // Success sound (form submission, registration complete) - LOUDER
  const playSuccess = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    const notes = [392, 523.25, 659.25]; // G4, C5, E5 - happy chord

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);

      gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + i * 0.05 + 0.4,
      );

      osc.start(ctx.currentTime + i * 0.05);
      osc.stop(ctx.currentTime + i * 0.05 + 0.4);
    });
  }, [soundEnabled, getAudioContext]);

  // Notification sound (team approved, game starting soon) - LOUDER
  const playNotification = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();

    // Play two oscillators for richer sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.type = "sine";
    osc2.type = "triangle";

    // Bell-like notification
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // D6
    osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.3); // E6

    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.15);
    osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.5);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.5);
  }, [soundEnabled, getAudioContext]);

  // Victory fanfare (winner announcement) - LOUDER & LONGER
  const playVictory = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();
    // Zelda-like victory fanfare
    const notes = [392, 392, 392, 523.25, 659.25, 783.99, 1046.5]; // G4, G4, G4, C5, E5, G5, C6
    const durations = [0.15, 0.15, 0.15, 0.2, 0.2, 0.2, 0.5];
    let time = 0;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "square";
      osc2.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + time);
      osc2.frequency.setValueAtTime(freq / 2, ctx.currentTime + time); // Octave lower

      gain.gain.setValueAtTime(0.3, ctx.currentTime + time);
      gain.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + time + durations[i],
      );

      osc.start(ctx.currentTime + time);
      osc.stop(ctx.currentTime + time + durations[i]);
      osc2.start(ctx.currentTime + time);
      osc2.stop(ctx.currentTime + time + durations[i]);

      time += durations[i] * 0.8;
    });
  }, [soundEnabled, getAudioContext]);

  // Power-up sound (bonus, special event) - LOUDER
  const playPowerUp = useCallback(() => {
    if (!soundEnabled) return;
    const ctx = getAudioContext();

    const osc = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "square";
    osc2.type = "sawtooth";

    // Rapid ascending sweep
    osc.frequency.setValueAtTime(200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
    osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.35);

    osc2.frequency.setValueAtTime(100, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25);
    osc2.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
    osc2.start(ctx.currentTime);
    osc2.stop(ctx.currentTime + 0.5);
  }, [soundEnabled, getAudioContext]);

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        musicEnabled,
        toggleSound,
        toggleMusic,
        startBackgroundMusic,
        stopBackgroundMusic,
        playClick,
        playCorrect,
        playWrong,
        playTick,
        playCoin,
        playGameStart,
        playWhoosh,
        playSuccess,
        playNotification,
        playVictory,
        playPowerUp,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
};
