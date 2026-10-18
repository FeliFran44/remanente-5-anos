// ============================================================
//  ACTO 1: HUIDA DEL LABORATORIO Y LA METRÓPOLIS (niveles 2 y 3)
//  (El Nivel 1 está en niveles.js)
// ============================================================

// ------------------------------------------------------------
//  NIVEL 2: "COMPLEJO INDUSTRIAL"
//  Almacenes, tubos de gas explosivos, prensas hidráulicas y vapor.
// ------------------------------------------------------------
NIVELES.nivel2 = {
  id: 'nivel2',
  nombre: 'Complejo Industrial',
  acto: 'Acto 1 · Nivel 2',
  tema: 'industrial',
  musica: 'acto1',
  ancho: 6400,
  alto: 900,
  inicio: { x: 150, y: PISO },

  plataformas: [
    // Piso, con tres pozos
    suelo(0, 1500),
    suelo(1650, 1250),
    suelo(3060, 1540),
    suelo(4760, 1640),

    bloque(420, 70, 60),          // una caja
    fina(640, 140, 200),          // pasarelas
    fina(900, 250, 200),          // (arriba hay un inyector)
    fina(1470, 120, 220),         // pasarela sobre el primer pozo
    bloque(2600, 60, 60),         // caja junto a los tubos de gas
    fina(2920, 100, 110),         // ayuda para el segundo pozo
    bloque(3300, 200, 110),       // plataforma alta con un soldado
    fina(4620, 110, 110),         // ayuda para el tercer pozo
    fina(5100, 150, 160),
    bloque(5350, 200, 100),       // base de una torreta
    pared(6340),
  ],

  trampas: [
    { tipo: 'vapor', x: 1250, alto: 190 },
    // El pasillo de las prensas: bajan una detrás de la otra
    { tipo: 'prensa', x: 1850, ancho: 90, techo: PISO - 300, desfase: 0 },
    { tipo: 'prensa', x: 2100, ancho: 90, techo: PISO - 300, desfase: 0.8 },
    { tipo: 'prensa', x: 2350, ancho: 90, techo: PISO - 300, desfase: 1.6 },
    { tipo: 'vapor', x: 3900, alto: 180, desfase: 1 },
    { tipo: 'vapor', x: 4950, alto: 180, desfase: 0.5 },
    { tipo: 'prensa', x: 5750, ancho: 90, techo: PISO - 300, desfase: 0 },
    { tipo: 'prensa', x: 5950, ancho: 90, techo: PISO - 300, desfase: 1 },
  ],

  enemigos: [
    { tipo: 'recluta', x: 760, y: PISO, patrulla: 80 },
    { tipo: 'soldado', x: 1150, y: PISO, patrulla: 60 },
    { tipo: 'recluta', x: 2230, y: PISO, patrulla: 100 },
    { tipo: 'tuboGas', x: 2700, y: PISO },
    { tipo: 'soldado', x: 2790, y: PISO, patrulla: 30 },
    { tipo: 'soldado', x: 2860, y: PISO, patrulla: 20 },
    { tipo: 'soldado', x: 3380, y: PISO - 110, patrulla: 60 },
    { tipo: 'limpiadora', x: 3700, y: PISO, patrulla: 80 },
    { tipo: 'recluta', x: 3850, y: PISO, patrulla: 60 },
    { tipo: 'tuboGas', x: 4000, y: PISO },
    { tipo: 'tuboGas', x: 4350, y: PISO },
    { tipo: 'torreta', x: 5000, y: PISO },
    { tipo: 'torreta', x: 5432, y: PISO - 100 },
    { tipo: 'soldado', x: 5650, y: PISO, patrulla: 50 },
    { tipo: 'limpiadora', x: 6050, y: PISO, patrulla: 60 },
    { tipo: 'recluta', x: 6150, y: PISO, patrulla: 40 },
  ],

  // Al entrar a esta zona se cierran puertas y aparecen enemigos
  emboscadas: [
    {
      desde: 4140, hasta: 4560,
      aparecen: [
        { tipo: 'recluta', x: 4220 },
        { tipo: 'recluta', x: 4480 },
        { tipo: 'limpiadora', x: 4500 },
        { tipo: 'soldado', x: 4250 },
      ],
      radio: '¡Nos rodearon! ¿Ves el tubo de gas del medio? Si les pegás cuando están cerca... ¡BUM!',
    },
  ],

  checkpoints: [
    { x: 1700, y: PISO },
    { x: 3120, y: PISO },
    { x: 4820, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 300 }, { x: 1060, altura: 250, dorado: true }, { x: 3370, altura: 110 }, { x: 5440, altura: 100 }],

  objetos: [
    { tipo: 'archivo', id: 'a2', x: 700, y: PISO - 140 },   // archivo secreto
    { tipo: 'inyector', x: 1000, y: PISO - 250 },
    { tipo: 'inyector', x: 3450, y: PISO - 110 },
    { tipo: 'inyector', x: 6200, y: PISO },
  ],

  salida: { x: 6250 },

  carteles: [
    { x: 1760, y: PISO, texto: 'Cuando la luz de la prensa se pone ROJA, ¡baja!' },
    { x: 2560, y: PISO, texto: 'Pegale al tubo de gas y alejate: ¡explota!' },
  ],

  radio: [
    { x: 0, texto: 'Salimos del laboratorio... Esto es el Complejo Industrial de Genesis. Acá fabrican sus armas: cuidado.' },
    { x: 560, texto: 'Mirá: cajas y pasarelas. Arriba de todo hay un inyector, si te animás a subir.' },
    { x: 1050, texto: 'Esos son Soldados tácticos: disparan ráfagas de 3 balas. Cuando apuntan con la mira roja, saltá o acercate rápido.' },
    { x: 1180, texto: '¡Un chorro de vapor! Quema y te empuja para arriba. Esperá a que se apague para pasar.' },
    { x: 1720, texto: 'Prensas hidráulicas. Cuando la luz se pone roja, bajan de golpe... ¡y aplastan a los enemigos también!' },
    { x: 2600, texto: 'Esos tubos rojos tienen gas. Si les pegás, explotan: ¡usalos contra los soldados, pero alejate rápido!' },
    { x: 3560, texto: '¡Una Limpiadora con lanzallamas! El tanque de su espalda es su punto débil: pegale por detrás y hace el doble de daño.' },
    { x: 4840, texto: 'Torretas automáticas: apuntan con un láser antes de disparar. Rompelas o pasá cuando recargan.' },
    { x: 6000, texto: '¡Ya casi! Por esa puerta salimos hacia la muralla de la ciudad.' },
  ],

  decoracion: [
    { tipo: 'tuberia', x: 300, alto: 260 },
    { tipo: 'logo', x: 560, y: PISO - 300 },
    { tipo: 'barril', x: 1100 },
    { tipo: 'barril', x: 1130 },
    { tipo: 'caja', x: 1380 },
    { tipo: 'cartel', x: 2100, y: PISO - 340, texto: '⚠ ZONA DE PRENSAS', color: '#ffd23f' },
    { tipo: 'tuberia', x: 2550, alto: 300 },
    { tipo: 'caja', x: 3200 },
    { tipo: 'barril', x: 3620 },
    { tipo: 'tuberia', x: 4060, alto: 220 },
    { tipo: 'logo', x: 4350, y: PISO - 280 },
    { tipo: 'caja', x: 4900 },
    { tipo: 'cartel', x: 5850, y: PISO - 340, texto: '⚠ PELIGRO', color: '#ffd23f' },
    { tipo: 'barril', x: 6150 },
  ],
};

// ------------------------------------------------------------
//  NIVEL 3: "LA SALIDA DE LA METRÓPOLIS"
//  El muro fronterizo de la ciudad: torres con francotiradores, guardias Riot
//  y, en la puerta, el Comandante Marcus Vane.
// ------------------------------------------------------------
NIVELES.nivel3 = {
  id: 'nivel3',
  nombre: 'La Salida de la Metrópolis',
  acto: 'Acto 1 · Nivel 3',
  tema: 'muralla',
  musica: 'acto1',
  ancho: 7200,
  alto: 900,
  inicio: { x: 150, y: PISO },

  plataformas: [
    suelo(0, 1900),
    suelo(2040, 1460),
    suelo(3650, 3550),

    // Torre 1: escalones finos y el nido del francotirador arriba
    fina(1180, 120, 110),
    fina(1300, 240, 140),
    bloque(1600, 70, 70),
    // Torre 2
    fina(2560, 125, 110),
    fina(2690, 250, 150),
    bloque(3150, 80, 90),
    fina(3520, 110, 110),         // ayuda sobre el pozo
    // Torre 3
    fina(4180, 120, 110),
    fina(4300, 240, 140),
    bloque(4700, 70, 80),
    pared(7140),
  ],

  enemigos: [
    { tipo: 'recluta', x: 800, y: PISO, patrulla: 80 },
    { tipo: 'soldado', x: 1050, y: PISO, patrulla: 40 },
    { tipo: 'francotirador', x: 1355, y: PISO - 240 },
    { tipo: 'riot', x: 1750, y: PISO, patrulla: 80 },
    { tipo: 'dron', x: 2150, y: PISO, patrulla: 180 },
    { tipo: 'recluta', x: 2350, y: PISO, patrulla: 80 },
    { tipo: 'riot', x: 2480, y: PISO, patrulla: 60 },
    { tipo: 'francotirador', x: 2750, y: PISO - 250 },
    { tipo: 'soldado', x: 3250, y: PISO, patrulla: 60 },
    { tipo: 'riot', x: 3950, y: PISO, patrulla: 80 },
    { tipo: 'francotirador', x: 4355, y: PISO - 240 },
    { tipo: 'recluta', x: 4600, y: PISO, patrulla: 60 },
    { tipo: 'soldado', x: 4850, y: PISO, patrulla: 50 },
    { tipo: 'vane', x: 6800, y: PISO, mirando: -1 },
  ],

  emboscadas: [
    {
      desde: 5150, hasta: 5650,
      aparecen: [
        { tipo: 'riot', x: 5250 },
        { tipo: 'riot', x: 5560 },
        { tipo: 'soldado', x: 5590 },
        { tipo: 'recluta', x: 5220 },
      ],
      radio: '¡Una emboscada en la puerta! Los guardias Riot se cubren de frente: rodealos o rompeles la guardia.',
    },
  ],

  checkpoints: [
    { x: 2100, y: PISO },
    { x: 3720, y: PISO },
    { x: 5750, y: PISO },
  ],

  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 900 }, { x: 2720, altura: 250, dorado: true }, { x: 3190, altura: 90 }, { x: 4735, altura: 80 }, { x: 5500 }],

  objetos: [
    { tipo: 'archivo', id: 'a3', x: 2815, y: PISO - 250 },   // archivo secreto
    { tipo: 'inyector', x: 2765, y: PISO - 250 },
    { tipo: 'inyector', x: 4900, y: PISO },
    { tipo: 'inyector', x: 5850, y: PISO },
  ],

  arena: {
    puertaX: 5900,
    activarEn: 6020,
    hasta: 7140,
    escena: 'vane',
    escenaFinal: 'vane-derrota',
    radio: 'Jax, ¡cuidado con su mazo! Pega dos veces seguidas y después queda abierto. Cuando se cubre, no le pegues de frente.',
    radioFinal: '¡La puerta de la muralla está abierta! Afuera nos espera el bosque... vamos.',
  },
  salida: { x: 7050 },

  carteles: [
    { x: 1150, y: PISO, texto: 'Subí por las plataformas finas para llegar a la torre' },
  ],

  radio: [
    { x: 0, texto: 'Esta es la muralla de la ciudad. Del otro lado está la libertad... y un montón de guardias.' },
    { x: 900, texto: '¿Ves ese láser rojo? ¡Un francotirador en la torre! Cuando el láser se queda quieto y brilla, va a disparar: ¡movete!' },
    { x: 1550,
      solo: 'Un Guardia Riot: su escudo para todo de frente. Rompelo con el 3er golpe del combo, o pegale por la espalda.',
      juntos: 'Un Guardia Riot: su escudo para todo de frente. Rompelo con el 3er golpe del combo... o congelalo con mi rayo: congelado no se cubre.' },
    { x: 2050, texto: 'Un dron de vigilancia. Si te ve, avisa a todos los guardias.' },
    { x: 3600, texto: 'Esa torre tiene otro francotirador. Si subís, lo agarrás de cerca: de cerca solo puede arañar.' },
    { x: 5000, texto: 'Ahí está la puerta principal de la muralla. Seguro está muy custodiada...' },
    { x: 5800, texto: 'Detrás de esa puerta está el comandante de la muralla. Tengo un mal presentimiento...' },
  ],

  decoracion: [
    { tipo: 'reflector', x: 500 },
    { tipo: 'bandera', x: 900 },
    { tipo: 'tuberia', x: 1370, alto: 230 },   // el pilar de la torre 1
    { tipo: 'reflector', x: 2000 },
    { tipo: 'tuberia', x: 2770, alto: 240 },   // el pilar de la torre 2
    { tipo: 'bandera', x: 3400 },
    { tipo: 'tuberia', x: 4370, alto: 230 },   // el pilar de la torre 3
    { tipo: 'reflector', x: 5100 },
    { tipo: 'bandera', x: 5880 },
    { tipo: 'logo', x: 6500, y: PISO - 330 },
    { tipo: 'bandera', x: 7000 },
  ],
};
