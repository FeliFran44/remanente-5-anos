// ============================================================
//  MÚSICA: canciones fabricadas con código (Web Audio)
//  Cada canción tiene:
//    - un "tempo" (pulsos por minuto),
//    - acordes (uno por compás, en semitonos desde la nota base),
//    - patrones de 16 pasos para el bajo, el arpegio y la batería:
//        'x' = toca, '.' = silencio (para el bajo, 'o' = toca una octava más arriba)
//  El secuenciador va programando las notas un poquito antes de que suenen,
//  así la música no se traba aunque el juego esté ocupado.
// ============================================================

const CANCIONES = {
  menu: {
    tempo: 76, base: 45, menor: true,
    acordes: [0, -4, 3, -2],
    bajo: 'x.......x.......',
    arpegio: 'x...x...x...x...',
    bombo: '................', caja: '................', platillo: '................',
    pad: true,
  },
  acto1: {
    tempo: 118, base: 45, menor: true,
    acordes: [0, 0, -4, -2],
    bajo: 'x.xox.x.x.xox.x.',
    arpegio: 'x.x.x.x.x.x.x.x.',
    bombo: 'x.......x.......', caja: '....x.......x...', platillo: '..x...x...x...x.',
  },
  acto2: {
    tempo: 92, base: 50, menor: true,
    acordes: [0, -2, -4, -5],
    bajo: 'x.....x...x.....',
    arpegio: 'x..x..x...x..x..',
    bombo: 'x.........x.....', caja: '................', platillo: '....x.......x...',
    pad: true,
  },
  acto3: {
    tempo: 128, base: 52, menor: true,
    acordes: [0, -4, -2, -7],
    bajo: 'xoxoxoxoxoxoxoxo',
    arpegio: 'x.xxx.xxx.xxx.xx',
    bombo: 'x...x...x...x...', caja: '....x.......x..x', platillo: 'xxxxxxxxxxxxxxxx',
  },
  jefe: {
    tempo: 140, base: 48, menor: true,
    acordes: [0, 1, 0, -2],
    bajo: 'xxoxxxoxxxoxxxox',
    arpegio: 'x.x.xx.xx.x.xx.x',
    bombo: 'x..x..x.x..x..x.', caja: '....x.......x...', platillo: 'x.x.x.x.x.x.x.x.',
  },
  persecucion: {
    tempo: 160, base: 47, menor: true,
    acordes: [0, 0, 1, -1],
    bajo: 'xoxoxoxoxoxoxoxo',
    arpegio: 'xxxxxxxxxxxxxxxx',
    bombo: 'x.x.x.x.x.x.x.x.', caja: '....x.......x...', platillo: '..x...x...x...x.',
  },
  final: {
    tempo: 150, base: 40, menor: true,
    acordes: [0, 3, 1, -2],
    bajo: 'xxoxxoxxxxoxxoxx',
    arpegio: 'x.xxx.xxx.xxx.xx',
    bombo: 'x.x.x..xx.x.x..x', caja: '....x.......x.xx', platillo: 'xxxxxxxxxxxxxxxx',
  },
  // El tren: el ritmo de las ruedas sobre las vías ("ta-ca-ta-ca")
  tren: {
    tempo: 150, base: 45, menor: true,
    acordes: [0, 0, -2, -4],
    bajo: 'x.ox.ox.x.ox.ox.',
    arpegio: 'x...x.x.x...x.x.',
    bombo: 'x..x..x.x..x..x.', caja: '....x.......x...', platillo: 'x.xxx.xxx.xxx.xx',
  },
  victoria: {
    tempo: 100, base: 48, menor: false,
    acordes: [0, 5, 7, 5],
    bajo: 'x...x...x...x.o.',
    arpegio: 'x.x.x.x.x.x.x.x.',
    bombo: 'x.......x.......', caja: '....x.......x...', platillo: '..x...x...x...x.',
    pad: true,
  },
  oscura: {
    tempo: 66, base: 43, menor: true,
    acordes: [0, 1, 0, -1],
    bajo: 'x...............',
    arpegio: 'x.......x.......',
    bombo: '................', caja: '................', platillo: '................',
    pad: true,
  },
};

const Musica = {
  actual: null,        // nombre de la canción que suena
  paso: 0,             // en qué paso de 16 va
  compas: 0,
  proximaNota: 0,      // a qué hora (del reloj del audio) suena el próximo paso

  tocar(nombre) {
    if (this.actual === nombre) return;
    this.actual = nombre && CANCIONES[nombre] ? nombre : null;
    this.paso = 0;
    this.compas = 0;
    this.proximaNota = 0;
  },

  detener() {
    this.actual = null;
  },

  // Se llama en cada cuadro: programa las notas del próximo cuarto de segundo
  actualizar() {
    if (!this.actual || !Sonido.listo() || !Sonido.musica) return;
    const ctx = Sonido.contexto;
    const cancion = CANCIONES[this.actual];
    const duracionPaso = 60 / cancion.tempo / 4;   // cada paso es una semicorchea
    if (this.proximaNota < ctx.currentTime) this.proximaNota = ctx.currentTime + 0.05;
    while (this.proximaNota < ctx.currentTime + 0.25) {
      tocarPaso(cancion, this.paso, this.compas, this.proximaNota, duracionPaso);
      this.paso++;
      if (this.paso >= 16) {
        this.paso = 0;
        this.compas = (this.compas + 1) % cancion.acordes.length;
      }
      this.proximaNota += duracionPaso;
    }
  },
};

function frecuenciaDeNota(nota) {
  return 440 * Math.pow(2, (nota - 69) / 12);
}

// Las notas del acorde de cada compás (tríada mayor o menor, y la octava)
function notasDelAcorde(cancion, compas) {
  const raiz = cancion.base + cancion.acordes[compas];
  const tercera = cancion.menor ? 3 : 4;
  return [raiz, raiz + tercera, raiz + 7, raiz + 12];
}

function tocarPaso(cancion, paso, compas, cuando, duracionPaso) {
  const acorde = notasDelAcorde(cancion, compas);
  const bajo = cancion.bajo[paso];
  if (bajo === 'x' || bajo === 'o') {
    notaMusical(acorde[0] - 12 + (bajo === 'o' ? 12 : 0), cuando, duracionPaso * 1.6, 'sawtooth', 0.16, 700);
  }
  if (cancion.arpegio[paso] === 'x') {
    const nota = acorde[(paso / 2 | 0) % acorde.length] + 12;
    notaMusical(nota, cuando, duracionPaso * 0.9, 'square', 0.035, 2600);
  }
  if (cancion.pad && paso === 0) {
    for (const nota of acorde.slice(0, 3)) notaMusical(nota, cuando, duracionPaso * 15, 'triangle', 0.05, 1500, true);
  }
  if (cancion.bombo[paso] === 'x') bombo(cuando);
  if (cancion.caja[paso] === 'x') golpeDeRuido(cuando, 1800, 0.12, 0.22, 'bandpass');
  if (cancion.platillo[paso] === 'x') golpeDeRuido(cuando, 8000, 0.04, 0.06, 'highpass');
}

// Una nota con su forma de onda, pasada por un filtro para que no suene chillona.
// "suave" = entra despacito (para los acordes de fondo)
function notaMusical(nota, cuando, duracion, forma, fuerza, filtro, suave = false) {
  const ctx = Sonido.contexto;
  const oscilador = ctx.createOscillator();
  const filtroPasaBajos = ctx.createBiquadFilter();
  const ganancia = ctx.createGain();
  oscilador.type = forma;
  oscilador.frequency.setValueAtTime(frecuenciaDeNota(nota), cuando);
  filtroPasaBajos.type = 'lowpass';
  filtroPasaBajos.frequency.setValueAtTime(filtro, cuando);
  ganancia.gain.setValueAtTime(suave ? 0.0001 : fuerza, cuando);
  if (suave) ganancia.gain.exponentialRampToValueAtTime(fuerza, cuando + duracion * 0.3);
  ganancia.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
  oscilador.connect(filtroPasaBajos).connect(ganancia).connect(Sonido.musica);
  oscilador.start(cuando);
  oscilador.stop(cuando + duracion + 0.05);
}

function bombo(cuando) {
  const ctx = Sonido.contexto;
  const oscilador = ctx.createOscillator();
  const ganancia = ctx.createGain();
  oscilador.type = 'sine';
  oscilador.frequency.setValueAtTime(150, cuando);
  oscilador.frequency.exponentialRampToValueAtTime(40, cuando + 0.15);
  ganancia.gain.setValueAtTime(0.5, cuando);
  ganancia.gain.exponentialRampToValueAtTime(0.001, cuando + 0.18);
  oscilador.connect(ganancia).connect(Sonido.musica);
  oscilador.start(cuando);
  oscilador.stop(cuando + 0.2);
}

function golpeDeRuido(cuando, frecuencia, duracion, fuerza, tipoFiltro) {
  const ctx = Sonido.contexto;
  const fuente = ctx.createBufferSource();
  fuente.buffer = Sonido.ruidoBlanco;
  const filtro = ctx.createBiquadFilter();
  filtro.type = tipoFiltro;
  filtro.frequency.setValueAtTime(frecuencia, cuando);
  const ganancia = ctx.createGain();
  ganancia.gain.setValueAtTime(fuerza, cuando);
  ganancia.gain.exponentialRampToValueAtTime(0.001, cuando + duracion);
  fuente.connect(filtro).connect(ganancia).connect(Sonido.musica);
  fuente.start(cuando, Math.random() * 0.5);
  fuente.stop(cuando + duracion + 0.02);
}
