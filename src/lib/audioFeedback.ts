// Utilitário de feedback sonoro usando a Web Audio API nativa
// Funciona 100% offline em celulares (Android, iOS) e PC sem depender de arquivos .mp3 externos

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * a) HEMOGRAMA + GLICADA: Tom de alerta duplo (chama a atenção para fracionar a alíquota)
 */
export function tocarSomHemogramaGlicada() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;

    // 1º Beep (880 Hz - Lá5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, agora);
    gain1.gain.setValueAtTime(0.25, agora);
    gain1.gain.exponentialRampToValueAtTime(0.01, agora + 0.12);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(agora);
    osc1.stop(agora + 0.13);

    // 2º Beep mais agudo (1320 Hz - Mi6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, agora + 0.15);
    gain2.gain.setValueAtTime(0.3, agora + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, agora + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(agora + 0.15);
    osc2.stop(agora + 0.36);
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

/**
 * b) APENAS HEMOGRAMA: Tom claro e suave de envio direto (660 Hz subindo para 880 Hz)
 */
export function tocarSomApenasHemograma() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Beep simples e limpo
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, agora);

    gain.gain.setValueAtTime(0.25, agora);
    gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(agora);
    osc.stop(agora + 0.19);
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

/**
 * c) FOLHA SEM EDTA / NÃO LOCALIZADA: Som ultra sutil / discreto (neutro)
 */
export function tocarSomSutil() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(440, agora);

    gain.gain.setValueAtTime(0.03, agora);
    gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(agora);
    osc.stop(agora + 0.07);
  } catch (_) {}
}

/**
 * c) APENAS GLICADA: Tom encorpado de retenção na bancada (523 Hz - Dó5)
 */
export function tocarSomApenasGlicada() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, agora);
    osc.frequency.setValueAtTime(659.25, agora + 0.1);

    gain.gain.setValueAtTime(0.25, agora);
    gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(agora);
    osc.stop(agora + 0.3);
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

/**
 * Confirmação de ação (clique em [Na Grade] / [Confirmado])
 */
export function tocarSomConfirmado() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1046.5, agora); // Dó6

    gain.gain.setValueAtTime(0.2, agora);
    gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(agora);
    osc.stop(agora + 0.11);
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

/**
 * Alerta de prontuário não encontrado
 */
export function tocarSomNaoEncontrado() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const agora = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(220, agora);
    osc.frequency.setValueAtTime(180, agora + 0.15);

    gain.gain.setValueAtTime(0.2, agora);
    gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(agora);
    osc.stop(agora + 0.36);
  } catch (e) {
    console.warn("AudioContext error:", e);
  }
}

