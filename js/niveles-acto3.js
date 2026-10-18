// ============================================================
//  ACTO 3: LA CITADEL GÉNESIS (niveles 7, 8 y 9)
// ============================================================

// ------------------------------------------------------------
//  NIVEL 7: "LA MURALLA DE CRISTAL"
//  El patio de armas de la fortaleza, bajo una tormenta de nieve:
//  las ráfagas de viento empujan hacia atrás.
// ------------------------------------------------------------
NIVELES.nivel7 = {
  id: 'nivel7',
  nombre: 'La Muralla de Cristal',
  acto: 'Acto 3 · Nivel 8',
  tema: 'nieve',
  musica: 'acto3',
  escena: 'citadel',
  ancho: 7400,
  alto: 900,
  inicio: { x: 150, y: PISO },
  viento: { fuerza: 150, cada: 8, dura: 2.6 },   // cada 8 segundos, una ráfaga de 2,6 segundos

  plataformas: [
    suelo(0, 1600),
    suelo(1760, 1540),
    suelo(3460, 1740),
    suelo(5360, 2040),

    bloque(1440, 120, 100),       // base de una torreta de plasma
    fina(1620, 100, 120),         // ayuda sobre el primer pozo
    bloque(2200, 80, 70),
    fina(2730, 120, 110),         // escalones a la torre del francotirador
    fina(2850, 240, 140),
    fina(3340, 110, 80),
    bloque(4100, 90, 90),
    fina(5230, 110, 110),
    bloque(6250, 120, 110),       // base de otra torreta
    pared(7340),
  ],

  enemigos: [
    { tipo: 'soldadoRed', x: 900, y: PISO, patrulla: 60 },
    { tipo: 'dronV2', x: 1250, y: PISO, patrulla: 150 },
    { tipo: 'torretaPlasma', x: 1482, y: PISO - 100 },
    { tipo: 'soldadoRed', x: 2050, y: PISO, patrulla: 60 },
    { tipo: 'riot', x: 2450, y: PISO, patrulla: 60 },
    { tipo: 'francotirador', x: 2905, y: PISO - 240 },
    { tipo: 'dronV2', x: 3700, y: PISO, patrulla: 150 },
    { tipo: 'soldadoRed', x: 3950, y: PISO, patrulla: 60 },
    { tipo: 'torretaPlasma', x: 4500, y: PISO },
    { tipo: 'riot', x: 4800, y: PISO, patrulla: 60 },
    { tipo: 'soldadoRed', x: 5650, y: PISO, patrulla: 60 },
    { tipo: 'dronV2', x: 5950, y: PISO, patrulla: 150 },
    { tipo: 'torretaPlasma', x: 6292, y: PISO - 110 },
  ],

  emboscadas: [
    {
      desde: 6500, hasta: 7080,
      aparecen: [
        { tipo: 'soldadoRed', x: 6600 },
        { tipo: 'soldadoRed', x: 6980 },
        { tipo: 'riot', x: 6950 },
        { tipo: 'dronV2', x: 6800 },
      ],
      radio: '¡La guardia de la puerta! Primero los soldados con granadas: son los más peligrosos.',
    },
  ],

  checkpoints: [
    { x: 1820, y: PISO },
    { x: 3520, y: PISO },
    { x: 5420, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 800 }, { x: 1500, altura: 100 }, { x: 4600 }, { x: 6310, altura: 110, dorado: true }],

  objetos: [
    { tipo: 'archivo', id: 'a8', x: 2965, y: PISO - 240 },   // archivo secreto
    { tipo: 'inyector', x: 2920, y: PISO - 240 },
    { tipo: 'inyector', x: 4140, y: PISO - 90 },
    { tipo: 'inyector', x: 7150, y: PISO },
  ],

  salida: { x: 7250 },

  radio: [
    { x: 0, texto: 'La Citadel Génesis. Mirá esa muralla de cristal... y esta tormenta. Cuando sople el viento, te va a empujar para atrás.' },
    { x: 780, texto: 'Soldados Genesis Red: la élite de Zephyrus. Disparan ráfagas y tiran granadas. Cuando ves una granada volando, ¡salí de ahí!' },
    { x: 1180, texto: 'Drones V-2: disparan tres rayos en abanico. Cuanto más cerca estés, más fácil esquivarlos.' },
    { x: 1350, texto: 'Una torreta de plasma: dispara dos bolas seguidas. Esperá a que recargue y subí a romperla.' },
    { x: 2700, texto: 'Otro francotirador en la torre. Subí por las plataformas y agarralo de cerca.' },
    { x: 5400, texto: 'La puerta de la Citadel está cerca. Zephyrus debe estar mirándonos...' },
  ],

  decoracion: [
    { tipo: 'cristal', x: 300, alto: 140 },
    { tipo: 'bandera', x: 700 },
    { tipo: 'cristal', x: 1150, alto: 100 },
    { tipo: 'cristal', x: 1950, alto: 160 },
    { tipo: 'tuberia', x: 2920, alto: 230 },
    { tipo: 'bandera', x: 3600 },
    { tipo: 'cristal', x: 4300, alto: 120 },
    { tipo: 'cristal', x: 5000, alto: 180 },
    { tipo: 'bandera', x: 5600 },
    { tipo: 'cristal', x: 6100, alto: 140 },
    { tipo: 'logo', x: 6800, y: PISO - 320 },
    { tipo: 'bandera', x: 7180 },
  ],
};

// ------------------------------------------------------------
//  NIVEL 8: "EL SALÓN DE LOS CLONES"
//  La fábrica subterránea de soldados: clones defectuosos que explotan,
//  peleas contra Clones de Jax y el minijefe Proto-Jax Alfa.
// ------------------------------------------------------------
NIVELES.nivel8 = {
  id: 'nivel8',
  nombre: 'El Salón de los Clones',
  acto: 'Acto 3 · Nivel 9',
  tema: 'clones',
  musica: 'acto3',
  ancho: 6800,
  alto: 900,
  inicio: { x: 150, y: PISO },

  plataformas: [
    suelo(0, 2000),
    suelo(2150, 1850),
    suelo(4160, 2640),

    fina(600, 130, 180),
    bloque(1300, 80, 80),
    fina(2020, 100, 100),         // ayuda sobre el primer pozo
    fina(2900, 140, 200),
    bloque(3400, 90, 100),
    fina(4040, 100, 90),
    pared(6740),
  ],

  trampas: [
    { tipo: 'pinchos', x: 2650, ancho: 70 },
    { tipo: 'vapor', x: 3800, alto: 180 },
  ],

  enemigos: [
    // Un grupito de clones defectuosos: si uno explota, ¡explotan todos!
    { tipo: 'clon', x: 900, y: PISO, patrulla: 30 },
    { tipo: 'clon', x: 960, y: PISO, patrulla: 30 },
    { tipo: 'clon', x: 1020, y: PISO, patrulla: 30 },
    { tipo: 'clonJax', x: 1700, y: PISO, patrulla: 80 },
    { tipo: 'clon', x: 2400, y: PISO, patrulla: 40 },
    { tipo: 'clon', x: 2470, y: PISO, patrulla: 40 },
    { tipo: 'soldadoRed', x: 2980, y: PISO - 140, patrulla: 50 },
    { tipo: 'clonJax', x: 3250, y: PISO, patrulla: 80 },
    { tipo: 'clon', x: 3600, y: PISO, patrulla: 30 },
    { tipo: 'clon', x: 3660, y: PISO, patrulla: 30 },
    { tipo: 'clon', x: 3720, y: PISO, patrulla: 30 },
    { tipo: 'clonJax', x: 4500, y: PISO, patrulla: 80 },
    { tipo: 'protojax', x: 6400, y: PISO, mirando: -1 },
  ],

  emboscadas: [
    {
      desde: 4700, hasta: 5300,
      aparecen: [
        { tipo: 'clonJax', x: 4800 },
        { tipo: 'clonJax', x: 5200 },
        { tipo: 'clon', x: 5150 },
        { tipo: 'clon', x: 4850 },
      ],
      radio: '¡Se abrieron los tanques! Clones de Jax y clones defectuosos... ¡Que los defectuosos exploten cerca de los otros!',
    },
  ],

  checkpoints: [
    { x: 1850, y: PISO },
    { x: 3880, y: PISO },
    { x: 5420, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 300 }, { x: 1340, altura: 80 }, { x: 2400 }, { x: 3440, altura: 100, dorado: true }, { x: 4600 }],

  objetos: [
    { tipo: 'archivo', id: 'a9', x: 3080, y: PISO - 140 },   // archivo secreto
    { tipo: 'inyector', x: 690, y: PISO - 130 },
    { tipo: 'inyector', x: 3000, y: PISO - 140 },
    { tipo: 'inyector', x: 5500, y: PISO },
  ],

  arena: {
    puertaX: 5600,
    activarEn: 5720,
    hasta: 6740,
    escena: 'protojax',
    radio: 'Proto-Jax usa tus mismos golpes. Cuando se agacha y brilla, va a embestir. Cuando salta, ¡va a caer con una onda!',
    radioFinal: '¡Bien, Jax! El original siempre es mejor. Vamos: el Núcleo Génesis está arriba.',
  },
  salida: { x: 6650 },

  radio: [
    { x: 0, texto: 'El Salón de los Clones... Genesis está fabricando soldados con TU suero, Jax.' },
    { x: 700,
      solo: '¡Clones defectuosos! Corren hacia vos y EXPLOTAN. Pegales y alejate rápido... o hacé que exploten al lado de otros enemigos.',
      juntos: '¡Clones defectuosos! Corren y EXPLOTAN. Los derribo con plasma de lejos. Si explotan juntos, ¡explotan todos!' },
    { x: 1500, quien: 'jax', texto: '¿Ese... soy yo? ¡Un clon mío! Igual que yo, pero con los ojos vacíos.' },
    { x: 1560, texto: 'Usa tus mismos golpes: cuando se agacha y brilla, va a embestir. ¡Esquivalo y contraatacá!' },
    { x: 5450, texto: 'Ese tanque gigante del fondo... hay algo enorme ahí adentro.' },
  ],

  decoracion: [
    { tipo: 'tanqueClon', x: 300 },
    { tipo: 'tanqueClon', x: 480, roto: true },
    { tipo: 'pantalla', x: 800, y: PISO - 260 },
    { tipo: 'tanqueClon', x: 1150 },
    { tipo: 'tanqueClon', x: 1550 },
    { tipo: 'tanqueClon', x: 2300, roto: true },
    { tipo: 'pantalla', x: 2700, y: PISO - 280 },
    { tipo: 'tanqueClon', x: 3100 },
    { tipo: 'tanqueClon', x: 4300 },
    { tipo: 'tanqueClon', x: 4500, roto: true },
    { tipo: 'tanqueClon', x: 5100 },
    { tipo: 'pantalla', x: 5500, y: PISO - 260 },
    { tipo: 'tanqueClon', x: 6200, roto: true },
    { tipo: 'logo', x: 6000, y: PISO - 320 },
  ],
};

// ------------------------------------------------------------
//  NIVEL 9: "EL NÚCLEO GÉNESIS" (el final)
//  Plataformas flotantes sobre el reactor y la pelea contra Zephyrus en 3 fases.
// ------------------------------------------------------------
NIVELES.nivel9 = {
  id: 'nivel9',
  nombre: 'El Núcleo Génesis',
  acto: 'Acto 3 · Nivel 10',
  tema: 'nucleo',
  musica: 'acto3',
  ancho: 4800,
  alto: 900,
  inicio: { x: 150, y: PISO },

  plataformas: [
    suelo(0, 900),
    // Plataformas flotantes sobre el reactor (¡no te caigas!)
    puente(1000, 200),
    puente(1300, 180, 60),
    puente(1580, 200),
    fina(1880, 80, 180),
    puente(2150, 250),
    puente(2500, 180, 40),
    suelo(2780, 2020),
    pared(4740),
  ],

  enemigos: [
    { tipo: 'pretoriano', x: 600, y: PISO, patrulla: 80 },
    { tipo: 'soldadoRed', x: 1100, y: PISO, patrulla: 40 },
    { tipo: 'dronV2', x: 1650, y: PISO, patrulla: 120 },
    { tipo: 'pretoriano', x: 2250, y: PISO, patrulla: 50 },
    { tipo: 'dronV2', x: 2550, y: PISO, patrulla: 100 },
    { tipo: 'pretoriano', x: 3000, y: PISO, patrulla: 60 },
    { tipo: 'soldadoRed', x: 3150, y: PISO, patrulla: 40 },
    { tipo: 'zephyrus', x: 4300, y: PISO, mirando: -1 },
  ],

  checkpoints: [
    { x: 760, y: PISO },
    { x: 2850, y: PISO },
    { x: 3240, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 400 }, { x: 1340, altura: 60 }, { x: 2590, altura: 40, dorado: true }, { x: 3000 }],

  objetos: [
    { tipo: 'archivo', id: 'a10', x: 1450, y: PISO - 60 },   // archivo secreto
    { tipo: 'inyector', x: 1680, y: PISO },
    { tipo: 'inyector', x: 3100, y: PISO },
    { tipo: 'inyector', x: 3200, y: PISO },
  ],

  arena: {
    puertaX: 3300,
    activarEn: 3420,
    hasta: 4740,
    escena: 'zephyrus',
    radio: 'Fase 1: la armadura. Mirá los círculos rojos (¡misiles!) y el aviso del láser: si es bajo, saltalo; si es alto, quedate en el piso.',
  },

  radio: [
    { x: 0, texto: 'El Núcleo Génesis: el reactor que le da energía a toda la Citadel. ¡No te caigas: abajo está el reactor!' },
    { x: 420, texto: 'La Guardia Pretoriana: escudo dorado y alabarda larga. Pegan desde lejos: rompeles la guardia o rodealos.' },
    { x: 2800, texto: 'Zephyrus está detrás de esa puerta. Es ahora o nunca, Jax.' },
    { x: 3150, quien: 'jax', texto: 'Cinco años... o toda la vida. Vamos a ver qué pasa.' },
  ],

  decoracion: [
    { tipo: 'pantalla', x: 400, y: PISO - 260 },
    { tipo: 'logo', x: 800, y: PISO - 300 },
    { tipo: 'cartel', x: 1500, y: PISO - 360, texto: '⚠ REACTOR ACTIVO', color: '#ff4dd2' },
    { tipo: 'pantalla', x: 3000, y: PISO - 260 },
    { tipo: 'logo', x: 4000, y: PISO - 360 },
  ],
};
