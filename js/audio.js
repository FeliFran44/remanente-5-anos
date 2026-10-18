// ============================================================
//  AUDIO: todos los sonidos se fabrican con código (Web Audio)
//  No hay archivos de sonido: cada efecto mezcla "tonos" (una onda
//  que suena a cierta frecuencia) y "ruido" (como la estática de la tele).
// ============================================================

const VOLUMEN_GENERAL = 0.35;

// Volúmenes que se eligen en el menú de pausa (de 0 a 10). Se recuerdan en el navegador.
const Volumenes = { efectos: 8, musica: 5 };
try {
  const guardados = JSON.parse(localStorage.getItem('remanente.volumenes'));
  if (guardados) Object.assign(Volumenes, guardados);
} catch (error) { /* si no se puede leer, quedan los de siempre */ }

const Sonido = {
  contexto: null,
  volumen: null,        // el volumen general (la tecla M lo apaga)
  efectos: null,        // por acá pasan los efectos de sonido
  musica: null,         // y por acá la música (js/musica.js)
  ruidoBlanco: null,
  silenciado: false,

  // Los navegadores no dejan sonar nada hasta que el jugador aprieta algo
  iniciar() {
    if (!this.contexto) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return;
      this.contexto = new Contexto();
      this.volumen = this.contexto.createGain();
      this.volumen.gain.value = this.silenciado ? 0 : VOLUMEN_GENERAL;
      this.volumen.connect(this.contexto.destination);
      this.efectos = this.contexto.createGain();
      this.efectos.connect(this.volumen);
      this.musica = this.contexto.createGain();
      this.musica.connect(this.volumen);
      this.aplicarVolumenes();
      // Un segundo de ruido al azar, que se reutiliza en todos los efectos
      const muestras = this.contexto.sampleRate;
      this.ruidoBlanco = this.contexto.createBuffer(1, muestras, muestras);
      const datos = this.ruidoBlanco.getChannelData(0);
      for (let i = 0; i < muestras; i++) datos[i] = Math.random() * 2 - 1;
    }
    if (this.contexto.state === 'suspended') this.contexto.resume();
  },

  // Prende o apaga el sonido. Devuelve true si quedó apagado.
  alternarSilencio() {
    this.silenciado = !this.silenciado;
    if (this.volumen) this.volumen.gain.value = this.silenciado ? 0 : VOLUMEN_GENERAL;
    return this.silenciado;
  },

  // Aplica los volúmenes de efectos y música (y los recuerda para la próxima vez)
  aplicarVolumenes() {
    if (this.efectos) this.efectos.gain.value = Volumenes.efectos / 8;
    if (this.musica) this.musica.gain.value = (Volumenes.musica / 10) * 0.55;
    try {
      localStorage.setItem('remanente.volumenes', JSON.stringify(Volumenes));
    } catch (error) { /* no pasa nada */ }
  },

  listo() {
    return this.contexto && this.contexto.state === 'running';
  },

  // Un tono que va de una frecuencia a otra y se apaga solo
  tono(desde, hasta, duracion, forma, fuerza) {
    if (!this.listo()) return;
    const ahora = this.contexto.currentTime;
    const oscilador = this.contexto.createOscillator();
    const ganancia = this.contexto.createGain();
    oscilador.type = forma;
    oscilador.frequency.setValueAtTime(desde, ahora);
    oscilador.frequency.exponentialRampToValueAtTime(hasta, ahora + duracion);
    ganancia.gain.setValueAtTime(fuerza, ahora);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);
    oscilador.connect(ganancia).connect(this.efectos);
    oscilador.start(ahora);
    oscilador.stop(ahora + duracion);
  },

  // Ruido pasado por un filtro: según las frecuencias suena a golpe seco o a "fiuuu"
  ruido(desde, hasta, duracion, fuerza, filtro = 'lowpass') {
    if (!this.listo()) return;
    const ahora = this.contexto.currentTime;
    const fuente = this.contexto.createBufferSource();
    fuente.buffer = this.ruidoBlanco;
    const filtroDeFrecuencias = this.contexto.createBiquadFilter();
    filtroDeFrecuencias.type = filtro;
    filtroDeFrecuencias.frequency.setValueAtTime(desde, ahora);
    filtroDeFrecuencias.frequency.exponentialRampToValueAtTime(hasta, ahora + duracion);
    const ganancia = this.contexto.createGain();
    ganancia.gain.setValueAtTime(fuerza, ahora);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);
    fuente.connect(filtroDeFrecuencias).connect(ganancia).connect(this.efectos);
    fuente.start(ahora, Math.random() * 0.5);
    fuente.stop(ahora + duracion);
  },

  // ---------- Los sonidos del juego ----------
  swing() { this.ruido(2500, 900, 0.07, 0.12, 'bandpass'); },
  golpe() { this.ruido(1800, 300, 0.09, 0.5); this.tono(160, 60, 0.1, 'sine', 0.5); },
  golpeFuerte() { this.ruido(1400, 150, 0.16, 0.7); this.tono(120, 40, 0.2, 'sine', 0.7); },
  onda() { this.tono(90, 28, 0.55, 'sine', 0.9); this.ruido(700, 60, 0.45, 0.6); },
  embestida() { this.ruido(400, 3200, 0.22, 0.4, 'bandpass'); this.tono(110, 220, 0.2, 'sawtooth', 0.08); },
  cargaPorra() { this.tono(300, 900, 0.4, 'sawtooth', 0.04); },
  porrazo() { this.tono(900, 180, 0.14, 'square', 0.12); this.ruido(5000, 1500, 0.1, 0.15, 'highpass'); },
  danio() { this.tono(320, 110, 0.22, 'square', 0.18); },
  enemigoDerrotado() { this.tono(420, 70, 0.4, 'triangle', 0.3); this.ruido(900, 100, 0.3, 0.25); },
  derrota() { this.tono(300, 50, 1.2, 'sawtooth', 0.15); },
  furia() { this.ruido(300, 60, 0.7, 0.7); this.tono(90, 40, 0.7, 'sawtooth', 0.25); this.tono(60, 30, 0.8, 'sine', 0.8); },
  curar() { this.tono(520, 1040, 0.18, 'sine', 0.25); this.tono(780, 1560, 0.25, 'triangle', 0.12); },
  critico() { this.tono(880, 660, 0.15, 'square', 0.08); },
  plasma() { this.tono(1500, 450, 0.09, 'square', 0.07); },
  impactoPlasma() { this.ruido(4000, 1200, 0.05, 0.15, 'bandpass'); },
  hielo() { this.tono(2400, 900, 0.18, 'triangle', 0.12); this.ruido(7000, 3000, 0.12, 0.1, 'highpass'); },
  congelar() { this.ruido(6000, 2000, 0.2, 0.3, 'highpass'); this.tono(3000, 1500, 0.15, 'sine', 0.1); },
  dardo() { this.tono(700, 1100, 0.12, 'sine', 0.12); },
  pem() { this.tono(150, 900, 0.5, 'sawtooth', 0.12); this.ruido(800, 4000, 0.4, 0.2, 'bandpass'); },
  explosion() { this.golpeFuerte(); this.onda(); this.ruido(3000, 200, 0.5, 0.5); },
  cambio() { this.tono(440, 880, 0.1, 'triangle', 0.15); },
  bloqueo() { this.tono(1800, 1200, 0.12, 'square', 0.08); this.ruido(6000, 3000, 0.08, 0.2, 'highpass'); },
  guardiaRota() { this.ruido(2500, 300, 0.3, 0.5); this.tono(900, 200, 0.3, 'sawtooth', 0.12); },
  alarma() { this.tono(700, 1000, 0.18, 'square', 0.08); this.tono(1000, 700, 0.18, 'square', 0.06); },
  rayoDron() { this.tono(1200, 300, 0.2, 'sawtooth', 0.08); },
  jefePaso() { this.tono(70, 40, 0.15, 'sine', 0.5); },
  jefeCarga() { this.ruido(200, 1200, 0.5, 0.4, 'bandpass'); this.tono(80, 160, 0.5, 'sawtooth', 0.15); },
  guardar() { this.tono(660, 660, 0.1, 'sine', 0.2); this.tono(990, 990, 0.25, 'sine', 0.15); },
  recoger() { this.tono(880, 1760, 0.12, 'triangle', 0.18); },
  radio() { this.ruido(3000, 1500, 0.06, 0.06, 'bandpass'); },
  nivelCompletado() { this.tono(523, 523, 0.15, 'triangle', 0.25); this.tono(659, 659, 0.3, 'triangle', 0.2); this.tono(784, 1046, 0.5, 'triangle', 0.2); },
  // Sonidos de los enemigos, trampas y jefes nuevos
  disparo() { this.ruido(3000, 600, 0.06, 0.25, 'bandpass'); this.tono(600, 200, 0.06, 'square', 0.06); },
  disparoSniper() { this.ruido(5000, 400, 0.25, 0.45); this.tono(1400, 100, 0.25, 'sawtooth', 0.1); },
  apuntarLaser() { this.tono(1800, 1900, 0.12, 'sine', 0.05); },
  fuego() { this.ruido(900, 500, 0.25, 0.22, 'bandpass'); },
  explosionChica() { this.ruido(2400, 120, 0.4, 0.6); this.tono(110, 35, 0.35, 'sine', 0.7); },
  escupir() { this.ruido(1200, 3000, 0.12, 0.2, 'bandpass'); this.tono(300, 600, 0.1, 'sine', 0.08); },
  grunido() { this.tono(120, 70, 0.35, 'sawtooth', 0.16); this.ruido(500, 150, 0.3, 0.25); },
  rugidoMonstruo() { this.tono(90, 45, 1.1, 'sawtooth', 0.3); this.ruido(600, 80, 1.1, 0.5); this.tono(140, 60, 0.9, 'square', 0.08); },
  mordida() { this.ruido(2000, 300, 0.12, 0.5); this.tono(220, 90, 0.12, 'square', 0.12); },
  planta() { this.tono(200, 500, 0.08, 'square', 0.08); this.ruido(1500, 600, 0.1, 0.25); },
  aparecer() { this.tono(200, 1200, 0.25, 'sine', 0.1); this.ruido(4000, 1000, 0.2, 0.12, 'highpass'); },
  teletransporte() { this.tono(1500, 300, 0.2, 'sine', 0.14); this.ruido(6000, 2000, 0.15, 0.15, 'highpass'); },
  misil() { this.ruido(800, 2500, 0.5, 0.2, 'bandpass'); },
  pitido() { this.tono(1500, 1500, 0.07, 'square', 0.08); },
  prensa() { this.ruido(1500, 100, 0.25, 0.7); this.tono(80, 30, 0.3, 'sine', 0.9); },
  vapor() { this.ruido(6000, 2500, 0.6, 0.18, 'highpass'); },
  crujido() { this.ruido(3000, 400, 0.2, 0.3); },
  viento() { this.ruido(400, 900, 1.2, 0.18, 'bandpass'); },
  pilar() { this.tono(80, 400, 0.4, 'sawtooth', 0.14); this.ruido(1000, 5000, 0.4, 0.25, 'bandpass'); },
  hackeo() { this.tono(1200, 1600, 0.05, 'square', 0.05); },
  hackeoListo() { this.tono(800, 800, 0.1, 'square', 0.12); this.tono(1200, 1200, 0.1, 'square', 0.12); this.tono(1600, 2400, 0.3, 'square', 0.1); },
  reloj() { this.tono(2000, 2000, 0.03, 'square', 0.06); },
  puerta() { this.tono(200, 120, 0.4, 'sawtooth', 0.12); this.ruido(800, 200, 0.4, 0.3); },
  risa() { this.tono(180, 140, 0.15, 'sawtooth', 0.12); this.tono(170, 120, 0.18, 'sawtooth', 0.1); },
  boton() { this.tono(700, 900, 0.05, 'triangle', 0.1); },
  dobleSalto() { this.ruido(1500, 4000, 0.12, 0.18, 'bandpass'); this.tono(400, 900, 0.12, 'triangle', 0.1); },
  esquiva() { this.ruido(3000, 800, 0.16, 0.25, 'bandpass'); },
  esquivaPerfecta() { this.tono(1200, 2400, 0.25, 'sine', 0.15); this.tono(1800, 3600, 0.3, 'triangle', 0.08); },
  patada() { this.ruido(2200, 700, 0.1, 0.2, 'bandpass'); },
  nucleo() { this.tono(1300 + Math.random() * 300, 2200, 0.08, 'sine', 0.08); },
  comprar() { this.tono(600, 600, 0.08, 'square', 0.1); this.tono(900, 900, 0.08, 'square', 0.1); this.tono(1200, 1600, 0.2, 'triangle', 0.12); },
  archivo() { this.tono(500, 1500, 0.3, 'sine', 0.15); this.tono(750, 2250, 0.4, 'triangle', 0.08); },
  latigo() { this.ruido(6000, 1200, 0.18, 0.4, 'highpass'); this.tono(2000, 300, 0.15, 'sawtooth', 0.08); },
  tren() { this.ruido(300, 200, 0.4, 0.12); },
  // El Pulsor: cuanto más nivel, más grave y más fuerte
  pulsor(nivel) {
    this.tono(1700 - nivel * 260, 380 - nivel * 60, 0.09 + nivel * 0.02, 'square', 0.06 + nivel * 0.01);
    this.ruido(5000, 1200, 0.06, 0.12 + nivel * 0.04, 'bandpass');
    if (nivel >= 3) this.tono(160, 50, 0.15, 'sine', 0.35);
  },
  sinBalas() { this.tono(300, 280, 0.05, 'square', 0.08); this.tono(250, 230, 0.05, 'square', 0.06); },
  municion() { this.tono(700, 1400, 0.07, 'square', 0.07); this.ruido(4000, 2500, 0.05, 0.12, 'highpass'); },
  cofre() { this.ruido(2000, 300, 0.2, 0.4); this.tono(500, 1000, 0.15, 'triangle', 0.15); this.tono(750, 1500, 0.3, 'triangle', 0.12); },
  subirArma() { this.tono(400, 800, 0.2, 'square', 0.1); this.tono(600, 1200, 0.3, 'square', 0.08); this.tono(900, 1800, 0.5, 'triangle', 0.12); },
};

window.addEventListener('keydown', () => Sonido.iniciar());
window.addEventListener('pointerdown', () => Sonido.iniciar());
