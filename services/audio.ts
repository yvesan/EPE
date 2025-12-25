
// Simple synth for UI sounds using Web Audio API
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
let ctx: AudioContext | null = null;

const getCtx = () => {
    if (!ctx) {
        ctx = new AudioContextClass();
    }
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    return ctx;
};

export const playClick = () => {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    
    // Short high blip
    osc.frequency.setValueAtTime(800, c.currentTime);
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
    
    osc.start();
    osc.stop(c.currentTime + 0.1);
};

export const playConfirm = () => {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    
    // Ascending tone
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, c.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15);
    
    osc.start();
    osc.stop(c.currentTime + 0.15);
};

export const playOpen = () => {
    const c = getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain);
    gain.connect(c.destination);
    
    // Rushing noise-like sound (sawtooth dropping pitch)
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, c.currentTime + 0.6);
    
    gain.gain.setValueAtTime(0.05, c.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, c.currentTime + 0.6);
    
    osc.start();
    osc.stop(c.currentTime + 0.6);
};

export const playWin = () => {
    const c = getCtx();
    const now = c.currentTime;
    
    // Major chord arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        gain.gain.setValueAtTime(0.0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
    });
};
