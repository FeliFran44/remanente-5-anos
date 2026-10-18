// ============================================================
//  NIVEL ESPECIAL DEL ACTO 3: "EL EXPRESO GÉNESIS"
//  Un nivel largo con 4 ETAPAS:
//    1. La Estación: hay que llegar al tren antes de que arranque.
//    2. Sobre los vagones: el tren va a toda velocidad. Las señales pasan
//       rapidísimo (¡SALTÁ!) y las vigas también (¡NO SALTES!).
//    3. El vagón de carga: pelea en un lugar cerrado, con una emboscada.
//    4. La locomotora: Kira, la Cazadora.
// ============================================================

// Un vagón del tren (se dibuja con ventanas y ruedas)
function vagon(x, ancho) {
  return { x, y: PISO, ancho, alto: 80, tipo: 'solida', vagon: true };
}

NIVELES.tren = {
  id: 'tren',
  nombre: 'El Expreso Génesis',
  acto: 'Acto 3 · Nivel 7',
  tema: 'estacion',
  musica: 'acto3',
  escena: 'acto3',
  ancho: 9000,
  alto: 900,
  inicio: { x: 150, y: PISO },

  // Las etapas: dónde empieza cada una, su escenario y su música
  etapas: [
    { desde: 0, nombre: 'La Estación', tema: 'estacion' },
    { desde: 2480, nombre: 'Sobre los vagones', tema: 'trenExterior', musica: 'tren',
      radio: { texto: '¡Estamos arriba del tren! Mirá el cartel de la derecha: si dice SALTÁ, saltá la barrera. Si dice NO SALTES, quedate en el techo: ¡viene una viga!' } },
    { desde: 5200, nombre: 'El vagón de carga', tema: 'trenInterior', musica: 'acto3',
      radio: { texto: 'Adentro del vagón de carga. Acá no hay viento... pero hay soldados. Y cajas que explotan.' } },
    { desde: 7300, nombre: 'La locomotora', tema: 'trenExterior', musica: 'tren',
      radio: { texto: 'La locomotora. Ahí adelante hay alguien esperándonos...' } },
  ],

  // Las señales del tren (etapa 2)
  barreras: { desde: 2560, hasta: 5050, cada: 3, velocidad: 650 },

  plataformas: [
    // --- Etapa 1: la estación ---
    suelo(0, 2440),
    bloque(500, 80, 60),
    fina(800, 130, 220),
    bloque(1300, 90, 90),
    fina(1700, 120, 160),
    // --- Etapa 2: los vagones (entre uno y otro hay que saltar) ---
    vagon(2520, 560),
    bloque(2800, 100, 70),        // un contenedor sobre el vagón
    vagon(3190, 560),
    bloque(3400, 90, 110),        // contenedor alto con un francotirador
    vagon(3860, 560),
    vagon(4530, 560),
    bloque(4800, 80, 60),
    // --- Etapa 3: el vagón de carga (con techo) ---
    suelo(5200, 2100),
    { x: 5200, y: PISO - 230, ancho: 2100, alto: 30, tipo: 'solida' },   // el techo del vagón
    bloque(5500, 80, 80),
    bloque(5900, 120, 60),
    fina(6400, 110, 200),
    bloque(6850, 80, 90),
    // --- Etapa 4: la locomotora ---
    vagon(7300, 1700),
    pared(8940),
  ],

  enemigos: [
    // Etapa 1
    { tipo: 'recluta', x: 700, y: PISO, patrulla: 80 },
    { tipo: 'soldado', x: 1050, y: PISO, patrulla: 40 },
    { tipo: 'tuboGas', x: 1240, y: PISO },
    { tipo: 'riot', x: 1500, y: PISO, patrulla: 60 },
    { tipo: 'soldado', x: 1740, y: PISO - 120, patrulla: 40 },
    { tipo: 'torreta', x: 2300, y: PISO },
    // Etapa 2
    { tipo: 'soldado', x: 2960, y: PISO, patrulla: 50 },
    { tipo: 'sabueso', x: 3620, y: PISO, patrulla: 60 },
    { tipo: 'francotirador', x: 3430, y: PISO - 110 },
    { tipo: 'dronV2', x: 3950, y: PISO, patrulla: 120 },
    { tipo: 'soldadoRed', x: 4150, y: PISO, patrulla: 60 },
    { tipo: 'sabueso', x: 4650, y: PISO, patrulla: 60 },
    { tipo: 'dronV2', x: 4900, y: PISO, patrulla: 120 },
    // Etapa 3
    { tipo: 'limpiadora', x: 5650, y: PISO, patrulla: 60 },
    { tipo: 'soldado', x: 5780, y: PISO, patrulla: 40 },
    { tipo: 'riot', x: 6050, y: PISO, patrulla: 60 },
    { tipo: 'tuboGas', x: 6130, y: PISO },
    { tipo: 'limpiadora', x: 6950, y: PISO, patrulla: 50 },
    { tipo: 'soldadoRed', x: 7150, y: PISO, patrulla: 40 },
    // Etapa 4: la jefa
    { tipo: 'kira', x: 8500, y: PISO, mirando: -1 },
  ],

  emboscadas: [
    {
      desde: 1980, hasta: 2440,
      aparecen: [
        { tipo: 'recluta', x: 2050 },
        { tipo: 'sabueso', x: 2380 },
        { tipo: 'soldado', x: 2360 },
        { tipo: 'recluta', x: 2300 },
      ],
      radio: '¡Nos descubrieron en el andén! Rápido, que el tren está arrancando.',
    },
    {
      desde: 6250, hasta: 6800,
      aparecen: [
        { tipo: 'sabueso', x: 6320 },
        { tipo: 'sabueso', x: 6740 },
        { tipo: 'recluta', x: 6700 },
        { tipo: 'limpiadora', x: 6350 },
      ],
      radio: '¡Las jaulas de la carga se abrieron! ¡Sabuesos!',
    },
  ],

  checkpoints: [
    { x: 1150, y: PISO },
    { x: 2600, y: PISO },
    { x: 3940, y: PISO },
    { x: 5300, y: PISO },
    { x: 7360, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 540, altura: 60 }, { x: 1340, altura: 90, dorado: true }, { x: 4840, altura: 60 }, { x: 5960, altura: 60 }, { x: 6890, altura: 90 }],

  objetos: [
    { tipo: 'inyector', x: 900, y: PISO - 130 },
    { tipo: 'archivo', id: 'a7', x: 2850, y: PISO - 70 },   // archivo secreto
    { tipo: 'inyector', x: 3470, y: PISO - 110 },
    { tipo: 'inyector', x: 6500, y: PISO - 110 },
    { tipo: 'inyector', x: 7400, y: PISO },
  ],

  arena: {
    puertaX: 7450,
    activarEn: 7570,
    hasta: 8940,
    escena: 'kira',
    escenaFinal: 'kira-derrota',
    radio: 'Cuando salte alto, mirá la sombra en el piso: ¡ahí va a caer! Y cuando eche el látigo para atrás, alejate.',
    radioFinal: '¡Lo logramos! La Citadel ya se ve. Entremos por la cabina de la locomotora.',
  },
  salida: { x: 8850 },

  carteles: [
    { x: 2350, y: PISO, texto: 'EXPRESO GÉNESIS → CITADEL · ¡Saltá al tren!' },
  ],

  radio: [
    { x: 0, texto: 'La estación del Expreso Génesis. Ese tren blindado sube a la Citadel: si lo tomamos, entramos sin que nos vean.' },
    { x: 560, quien: 'jax', texto: 'Siempre quise viajar en tren. Aunque no así...' },
    { x: 1400, texto: 'Acordate: con {esquivar} esquivás. Si un ataque te iba a pegar justo, el tiempo se pone lento: ¡esquiva perfecta!' },
    { x: 3150, texto: 'Si te caés entre los vagones, perdés vida. ¡Usá el doble salto!' },
    { x: 7200, quien: 'jax', texto: 'Algo me dice que el conductor no nos va a vender boleto.' },
  ],

  decoracion: [
    { tipo: 'cartel', x: 300, y: PISO - 320, texto: 'ANDÉN 9', color: '#ffd166' },
    { tipo: 'reflector', x: 650 },
    { tipo: 'bandera', x: 1150 },
    { tipo: 'barril', x: 1400 },
    { tipo: 'caja', x: 1620 },
    { tipo: 'cartel', x: 2000, y: PISO - 330, texto: 'EXPRESO GÉNESIS', color: '#ff5a7a' },
    { tipo: 'caja', x: 5350 },
    { tipo: 'barril', x: 5800 },
    { tipo: 'caja', x: 6250 },
    { tipo: 'barril', x: 7000 },
    { tipo: 'logo', x: 8200, y: PISO - 300 },
  ],
};

// El Expreso va después del Barranco del Cazador
ORDEN_DE_NIVELES.splice(ORDEN_DE_NIVELES.indexOf('nivel7'), 0, 'tren');
