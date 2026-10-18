// ============================================================
//  ACTO 2: LA CACERÍA EN EL BOSQUE BIOSINTÉTICO (niveles 4, 5 y 6)
// ============================================================

// ------------------------------------------------------------
//  NIVEL 4: "EMBOSCADA Y ESCAPE"
//  ¡Persecución! La Abominación X-0 viene desde la izquierda:
//  si alcanza a alguien, es derrota. Hay que correr hasta el puente.
// ------------------------------------------------------------
NIVELES.nivel4 = {
  id: 'nivel4',
  nombre: 'Emboscada y Escape',
  acto: 'Acto 2 · Nivel 4',
  tema: 'bosque',
  musica: 'acto2',
  escena: 'acto2',
  ancho: 7600,
  alto: 900,
  inicio: { x: 400, y: PISO },

  // velocidad: lo que avanza el monstruo · rapida: cuando quedó muy atrás (más de "distanciaRapida")
  // retraso: segundos hasta que arranca · hasta: en ese lugar se termina la persecución
  persecucion: { velocidad: 205, rapida: 340, distanciaRapida: 900, retraso: 3, hasta: 7150 },

  plataformas: [
    suelo(0, 1400),
    suelo(1560, 1240),
    suelo(2960, 1340),
    suelo(4450, 1450),
    suelo(6060, 1540),

    bloque(700, 80, 70),          // rocas y troncos caídos: hay que saltarlos
    bloque(1900, 70, 100),
    bloque(2300, 90, 60),
    fina(2830, 90, 90),           // un tronco sobre el pozo
    bloque(3400, 80, 110),
    bloque(3900, 60, 70),
    fina(4320, 100, 100),
    bloque(5000, 90, 90),
    fina(5480, 70, 70),
    bloque(5600, 70, 120),
    fina(5930, 90, 90),
    bloque(6500, 80, 80),
    pared(7540),
  ],

  enemigos: [
    { tipo: 'sabueso', x: 1150, y: PISO, patrulla: 60 },
    { tipo: 'mutante', x: 2100, y: PISO, patrulla: 40 },
    { tipo: 'sabueso', x: 2620, y: PISO, patrulla: 60 },
    { tipo: 'mutante', x: 3200, y: PISO, patrulla: 40 },
    { tipo: 'sabueso', x: 3700, y: PISO, patrulla: 60 },
    { tipo: 'sabueso', x: 4800, y: PISO, patrulla: 60 },
    { tipo: 'mutante', x: 5300, y: PISO, patrulla: 40 },
    { tipo: 'sabueso', x: 6300, y: PISO, patrulla: 60 },
    { tipo: 'mutante', x: 6850, y: PISO, patrulla: 40 },
  ],

  checkpoints: [
    { x: 2450, y: PISO },
    { x: 4560, y: PISO },
    { x: 6200, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 450 }, { x: 1930, altura: 100 }, { x: 3440, altura: 110, dorado: true }, { x: 5040, altura: 90 }, { x: 6800 }],

  objetos: [
    { tipo: 'archivo', id: 'a4', x: 5635, y: PISO - 120 },   // archivo secreto
    { tipo: 'inyector', x: 1700, y: PISO },
    { tipo: 'inyector', x: 4100, y: PISO },
    { tipo: 'inyector', x: 6420, y: PISO },
  ],

  salida: { x: 7450 },

  carteles: [
    { x: 7200, y: PISO, texto: 'PUENTE · peso máximo: 1 persona (¡no monstruos!)' },
  ],

  radio: [
    { x: 0, solo: '¡Ahí viene, Jax! ¡Corré hacia la derecha y no pares!', juntos: '¡Ahí viene! ¡Corramos hacia la derecha y no paremos!' },
    { x: 1000, texto: 'Los Sabuesos saltan encima. Cuando se agachan, apartate; cuando caen quedan mareados: ¡ahí pegales!' },
    { x: 2000, texto: 'Los Mutantes escupen ácido que deja charcos. ¡No te quedes parado encima!' },
    { x: 4500, texto: '¡Veo un puente más adelante! Es muy angosto para la Abominación. ¡Llegá hasta ahí!' },
    { x: 6900, texto: '¡Ya casi! ¡Cruzá el puente!' },
  ],

  decoracion: [
    { tipo: 'arbol', x: 250, alto: 260 },
    { tipo: 'hongo', x: 520 },
    { tipo: 'arbol', x: 1000, alto: 300 },
    { tipo: 'hongo', x: 1300 },
    { tipo: 'arbol', x: 1800, alto: 240 },
    { tipo: 'hongo', x: 2200 },
    { tipo: 'arbol', x: 2700, alto: 280 },
    { tipo: 'arbol', x: 3300, alto: 250 },
    { tipo: 'hongo', x: 3600 },
    { tipo: 'arbol', x: 4200, alto: 300 },
    { tipo: 'hongo', x: 4700 },
    { tipo: 'arbol', x: 5200, alto: 260 },
    { tipo: 'arbol', x: 5800, alto: 240 },
    { tipo: 'hongo', x: 6150 },
    { tipo: 'arbol', x: 6700, alto: 280 },
    { tipo: 'hongo', x: 7050 },
  ],
};

// ------------------------------------------------------------
//  NIVEL 5: "LA NIEBLA TÁCTICA"
//  Un pantano con niebla tóxica: solo se ve cerca de los jugadores.
//  Acechadores invisibles, plantas trampa y, al final, el Guardián de las Ruinas.
// ------------------------------------------------------------
NIVELES.nivel5 = {
  id: 'nivel5',
  nombre: 'La Niebla Táctica',
  acto: 'Acto 2 · Nivel 5',
  tema: 'pantano',
  musica: 'acto2',
  escena: 'campamento',
  ancho: 7000,
  alto: 900,
  inicio: { x: 150, y: PISO },
  niebla: { radio: 240, hasta: 6000 },   // la niebla termina en las ruinas

  plataformas: [
    suelo(0, 1200),
    suelo(1380, 1220),
    suelo(2780, 1420),
    suelo(4360, 2640),

    fina(1250, 80, 80),           // troncos sobre el agua
    bloque(1700, 80, 70),
    fina(2650, 100, 80),
    bloque(3100, 90, 90),
    fina(3500, 140, 160),
    fina(4230, 90, 90),
    bloque(4800, 70, 60),
    bloque(5400, 100, 100),
    pared(6940),
  ],

  trampas: [
    { tipo: 'pinchos', x: 2050, ancho: 70 },
    { tipo: 'pinchos', x: 4950, ancho: 84 },
  ],

  enemigos: [
    { tipo: 'planta', x: 700, y: PISO },
    { tipo: 'acechador', x: 1000, y: PISO, patrulla: 80 },
    { tipo: 'mutante', x: 1600, y: PISO, patrulla: 40 },
    { tipo: 'planta', x: 1950, y: PISO },
    { tipo: 'acechador', x: 2350, y: PISO, patrulla: 80 },
    { tipo: 'sabueso', x: 3000, y: PISO, patrulla: 60 },
    { tipo: 'planta', x: 3320, y: PISO },
    { tipo: 'acechador', x: 3700, y: PISO, patrulla: 80 },
    { tipo: 'mutante', x: 3560, y: PISO - 140, patrulla: 30 },
    { tipo: 'acechador', x: 4700, y: PISO, patrulla: 80 },
    { tipo: 'planta', x: 5100, y: PISO },
    { tipo: 'sabueso', x: 5250, y: PISO, patrulla: 60 },
    { tipo: 'mutante', x: 5430, y: PISO - 100, patrulla: 20 },
    { tipo: 'acechador', x: 5750, y: PISO, patrulla: 60 },
    { tipo: 'guardian', x: 6600, y: PISO, mirando: -1 },
  ],

  checkpoints: [
    { x: 1450, y: PISO },
    { x: 2850, y: PISO },
    { x: 4450, y: PISO },
    { x: 5900, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 600 }, { x: 1740, altura: 70 }, { x: 3140, altura: 90, dorado: true }, { x: 4500 }, { x: 5450, altura: 100 }],

  objetos: [
    { tipo: 'archivo', id: 'a5', x: 3640, y: PISO - 140 },   // archivo secreto
    { tipo: 'inyector', x: 2200, y: PISO },
    { tipo: 'inyector', x: 3580, y: PISO - 140 },
    { tipo: 'inyector', x: 5820, y: PISO },
  ],

  arena: {
    puertaX: 6000,
    activarEn: 6120,
    hasta: 6940,
    radio: '¡El Guardián de las Ruinas! Cuando levanta el garrote, alejate. Si embiste contra la pared queda mareado. Y mirá las sombras del piso: ¡caen rocas!',
    quien: 'elena',
    radioFinal: '¡Lo derrotaste! Más allá de las ruinas está el barranco... y la Abominación nos espera.',
  },
  salida: { x: 6850 },

  radio: [
    { x: 0, texto: 'Esta niebla es tóxica y no deja ver nada. Solo se ve lo que está cerca. Andá despacio.' },
    { x: 560, texto: 'Cuidado con las plantas trampa: cuando abren la boca, alejate. Después de morder quedan abiertas: ¡ahí pegales!' },
    { x: 900, texto: 'Hay Acechadores en la niebla. Son casi invisibles: solo se les ven los ojos rojos. Si brillan fuerte, ¡va a atacar!' },
    { x: 1990, quien: 'jax', texto: '¡Pinchos! ¿Quién pone pinchos en un pantano?' },
    { x: 4400, texto: 'Esas ruinas son muy antiguas... Genesis construyó el bosque encima de una ciudad perdida.' },
    { x: 5850, texto: 'La niebla se termina en las ruinas. Algo grande se mueve ahí adentro...' },
  ],

  decoracion: [
    { tipo: 'arbolSeco', x: 300, alto: 220 },
    { tipo: 'ruina', x: 900, alto: 140 },
    { tipo: 'arbolSeco', x: 1500, alto: 200 },
    { tipo: 'arbolSeco', x: 2400, alto: 240 },
    { tipo: 'ruina', x: 3300, alto: 180 },
    { tipo: 'arbolSeco', x: 4000, alto: 200 },
    { tipo: 'estatua', x: 4600 },
    { tipo: 'ruina', x: 5300, alto: 220 },
    { tipo: 'ruina', x: 6200, alto: 260 },
    { tipo: 'estatua', x: 6450 },
    { tipo: 'ruina', x: 6800, alto: 240 },
  ],
};

// ------------------------------------------------------------
//  NIVEL 6: "EL BARRANCO DEL CAZADOR"
//  Un puente de piedra roto sobre un cañón (algunas partes se derrumban)
//  y la pelea contra la Abominación X-0.
// ------------------------------------------------------------
NIVELES.nivel6 = {
  id: 'nivel6',
  nombre: 'El Barranco del Cazador',
  acto: 'Acto 2 · Nivel 6',
  tema: 'barranco',
  musica: 'acto2',
  ancho: 5600,
  alto: 900,
  inicio: { x: 150, y: PISO },

  plataformas: [
    suelo(0, 900),                // el borde del barranco
    // El puente roto: los pedazos frágiles se caen si te quedás parado encima
    puente(900, 200),
    puente(1100, 150, 0, true),
    puente(1360, 200),
    puente(1560, 140, 0, true),
    puente(1700, 140, 0, true),
    puente(1960, 240),
    puente(2200, 150, 0, true),
    puente(2470, 230),
    puente(2700, 150, 0, true),
    puente(2850, 250),
    suelo(3100, 2500),            // el otro lado del barranco
    bloque(3450, 80, 70),
    pared(5540),
  ],

  enemigos: [
    { tipo: 'sabueso', x: 1440, y: PISO, patrulla: 50 },
    { tipo: 'mutante', x: 2060, y: PISO, patrulla: 30 },
    { tipo: 'sabueso', x: 2560, y: PISO, patrulla: 50 },
    { tipo: 'mutante', x: 3300, y: PISO, patrulla: 30 },
    { tipo: 'sabueso', x: 3600, y: PISO, patrulla: 60 },
    { tipo: 'abominacion', x: 5100, y: PISO, mirando: -1 },
  ],

  checkpoints: [
    { x: 800, y: PISO },
    { x: 3200, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 500 }, { x: 2010 }, { x: 2560 }, { x: 3490, altura: 70, dorado: true }],

  objetos: [
    { tipo: 'archivo', id: 'a6', x: 2650, y: PISO },   // archivo secreto
    { tipo: 'inyector', x: 2080, y: PISO },
    { tipo: 'inyector', x: 3350, y: PISO },
    { tipo: 'inyector', x: 3650, y: PISO },
  ],

  arena: {
    puertaX: 3700,
    activarEn: 3820,
    hasta: 5540,
    escena: 'abominacion',
    radio: '¡Pegale en el LOMO! Cuando embista contra la pared o aterrice de un salto, te queda de espaldas.',
    radioFinal: '¡La venciste! Jax... ¡lo logramos! Del otro lado del barranco está la Citadel Génesis.',
  },
  salida: { x: 5450 },

  carteles: [
    { x: 760, y: PISO, texto: 'Las piedras rajadas se caen: ¡no te quedes quieto encima!' },
  ],

  radio: [
    { x: 0, texto: 'El Barranco del Cazador. El puente de piedra está roto: las partes rajadas se caen si te quedás encima. ¡No te detengas!' },
    { x: 1300, texto: 'Si una piedra se cae, vuelve a su lugar en unos segundos.' },
    { x: 3150, texto: 'Llegamos al otro lado. Siento que el suelo tiembla... Prepárate.' },
  ],

  decoracion: [
    { tipo: 'arbolSeco', x: 300, alto: 200 },
    { tipo: 'ruina', x: 600, alto: 160 },
    { tipo: 'ruina', x: 3250, alto: 200 },
    { tipo: 'arbolSeco', x: 3900, alto: 240 },
    { tipo: 'estatua', x: 4500 },
    { tipo: 'arbolSeco', x: 5200, alto: 220 },
  ],
};
