// ============================================================
//  HISTORIA: escenas con dibujos y diálogos, la elección final,
//  los 3 finales y los créditos.
//  La historia está basada en la que escribió el creador del juego:
//  una persona normal que quería poderes, fue muñeco de entrenamiento,
//  tomó una poción, ¡consiguió poderes!... pero le quedaron 5 años de vida,
//  y la cura la tiene Zephyrus.
//
//  Cada escena es una lista de "cuadros". Cada cuadro tiene:
//    quien: quién habla ('narrador', 'jax', 'elena', 'zephyrus', 'vane')
//    texto: lo que dice
//    fondo: el escenario de atrás (los mismos temas de los niveles)
//    actores: quiénes se ven: [{ dibujo, x, alto, mirando, tinte, brillo }]
//    efecto: 'temblor', 'destello', 'explosion' u 'oscuro' (opcional)
// ============================================================

// ¡Poné acá tu nombre para que salga en los créditos!
const CREADOR_DEL_JUEGO = 'el creador del juego';

const QUIENES = {
  narrador: { nombre: 'NARRADOR', color: '#cfd6e4' },
  jax: { nombre: 'JAX', color: '#ff7a2f' },
  elena: { nombre: 'DRA. ELENA VANE', color: '#5fd4ff' },
  zephyrus: { nombre: 'ZEPHYRUS', color: '#c08aff' },
  vane: { nombre: 'COMANDANTE MARCUS VANE', color: '#ff8080' },
  kira: { nombre: 'KIRA, LA CAZADORA', color: '#ff5a7a' },
};

// Actores que se repiten
const ACTOR_JAX = (x, extra = {}) => ({ dibujo: 'jax-frente', x, alto: 230, ...extra });
const ACTOR_JAX_PELEA = (x, extra = {}) => ({ dibujo: 'jax-pelea', x, alto: 220, ...extra });
const ACTOR_JAX_BRAZOS = (x, extra = {}) => ({ dibujo: 'jax-brazos', x, alto: 230, ...extra });
const ACTOR_ELENA = (x, mirando = 1) => ({ dibujo: 'elena', x, alto: 200, mirando });
const ACTOR_ZEPHYRUS = (x, extra = {}) => ({ dibujo: 'zephyrus-brazos', x, alto: 250, mirando: -1, ...extra });
const ACTOR_VANE = (x, extra = {}) => ({ dibujo: 'vane', x, alto: 230, mirando: -1, ...extra });
const ACTOR_KIRA = (x, extra = {}) => ({ dibujo: 'kira', x, alto: 220, mirando: -1, ...extra });

const ESCENAS = {
  // ---------- Al empezar el juego ----------
  intro: [
    { fondo: 'muralla', quien: 'narrador', actores: [ACTOR_JAX(480, { alto: 200 })],
      texto: 'Esta es la historia de Jax: una persona normal que vivía en la gran ciudad de Genesis.' },
    { fondo: 'muralla', quien: 'jax', actores: [ACTOR_JAX_BRAZOS(480)],
      texto: 'Un día, mientras caminaba, pensó algo: "¿Por qué yo no puedo tener poderes...? ¿O sí?"' },
    { fondo: 'laboratorio', quien: 'narrador', actores: [ACTOR_JAX(380, { alto: 210 }), { dibujo: 'muneco', x: 600, alto: 130 }],
      texto: 'Jax decidió hacer DE TODO para conseguirlos: les pagó a científicos, estudió un montón... ¡y hasta fue muñeco de entrenamiento en los laboratorios de Genesis!' },
    { fondo: 'laboratorio', quien: 'narrador', actores: [ACTOR_JAX_BRAZOS(480, { tinte: { color: '#3a4a6a', fuerza: 0.35 } })],
      texto: 'Pero parecía que nada funcionaba... ¿o sí?' },
    { fondo: 'laboratorio', quien: 'elena', actores: [ACTOR_ELENA(330), { dibujo: 'suero', x: 480, alto: 60 }, ACTOR_JAX(640, { mirando: -1 })],
      texto: 'Jax, soy la Dra. Elena Vane. Tengo algo nuevo: el suero Némesis. Es una poción experimental... nunca se probó en una persona.' },
    { fondo: 'laboratorio', quien: 'jax', actores: [ACTOR_ELENA(330), ACTOR_JAX_PELEA(600, { mirando: -1 })],
      texto: '¡Dámela! ¡Quiero poderes!' },
    { fondo: 'laboratorio', quien: 'narrador', efecto: 'destello', actores: [ACTOR_JAX_PELEA(480, { brillo: '#ff6a1f' })],
      texto: 'Jax tomó la poción y... ¡FUNCIONÓ! ¡Consiguió una fuerza increíble! Se puso tan contento que...' },
    { fondo: 'laboratorio', quien: 'narrador', efecto: 'explosion', actores: [{ dibujo: 'capsula', x: 480, alto: 150 }],
      texto: '¡BUUUM! La energía del suero hizo explotar el laboratorio entero.' },
    { fondo: 'laboratorio', quien: 'elena', actores: [ACTOR_ELENA(360), ACTOR_JAX(620, { mirando: -1 })],
      texto: 'Jax... hay un problema. El suero te dio poderes, pero también te está gastando por dentro. Te quedan solo 5 años de vida.' },
    { fondo: 'nucleo', quien: 'zephyrus', actores: [ACTOR_ZEPHYRUS(480, { mirando: 1 }), { dibujo: 'cura', x: 640, alto: 60 }],
      texto: 'La única cura está en mis manos. Soy Zephyrus, el dueño de Genesis. ¿La querés? Vas a tener que venir a buscarla, Sujeto Cero.' },
    { fondo: 'muralla', quien: 'narrador', actores: [ACTOR_ELENA(380), ACTOR_JAX_PELEA(580, { brillo: '#ff6a1f' })],
      texto: 'Para conseguir la cura, Jax tendrá que cruzar ciudades y biomas... y enfrentarse a Zephyrus. ¡El reloj ya empezó a correr!' },
  ],

  // ---------- Nivel 3: el Comandante Vane ----------
  vane: [
    { fondo: 'muralla', quien: 'vane', actores: [ACTOR_JAX_PELEA(300), ACTOR_ELENA(170), ACTOR_VANE(700)],
      texto: 'Alto ahí. Nadie cruza la muralla de Genesis sin mi permiso.' },
    { fondo: 'muralla', quien: 'elena', actores: [ACTOR_JAX_PELEA(300), ACTOR_ELENA(170), ACTOR_VANE(700)],
      texto: '¿Marcus? ¡Hermano! ¿Qué te hicieron?' },
    { fondo: 'muralla', quien: 'vane', actores: [ACTOR_JAX_PELEA(300), ACTOR_ELENA(170), ACTOR_VANE(700)],
      texto: 'Elena... Genesis me hizo más fuerte. Igual que a tu amigo. Zephyrus me ordenó atraparlos a los dos.' },
    { fondo: 'muralla', quien: 'jax', actores: [ACTOR_JAX_PELEA(300), ACTOR_ELENA(170), ACTOR_VANE(700)],
      texto: 'Tu hermana me ayudó a escapar. No quiero pelear con vos... pero no me voy a dejar atrapar.' },
    { fondo: 'muralla', quien: 'vane', efecto: 'temblor', actores: [ACTOR_JAX_PELEA(300), ACTOR_ELENA(170), ACTOR_VANE(700, { estado: 'preparaMazazo' })],
      texto: 'Entonces demostrame que ese suero vale algo, Sujeto Cero. ¡En guardia!' },
  ],
  'vane-derrota': [
    { fondo: 'muralla', quien: 'vane', actores: [ACTOR_JAX_BRAZOS(320), ACTOR_ELENA(180), ACTOR_VANE(680, { estado: 'derrotado' })],
      texto: 'Sos... más fuerte de lo que pensaba.' },
    { fondo: 'muralla', quien: 'elena', actores: [ACTOR_JAX_BRAZOS(320), ACTOR_ELENA(180), ACTOR_VANE(680, { estado: 'derrotado' })],
      texto: 'Marcus, vení con nosotros. Todavía podés dejar Genesis.' },
    { fondo: 'muralla', quien: 'vane', actores: [ACTOR_JAX_BRAZOS(320), ACTOR_ELENA(180), ACTOR_VANE(680, { estado: 'derrotado' })],
      texto: 'No puedo, Elena... Pero escuchen: la cura de Zephyrus tiene un chip escondido. Quien la tome, va a quedar bajo su control para siempre.' },
    { fondo: 'muralla', quien: 'jax', actores: [ACTOR_JAX_BRAZOS(320), ACTOR_ELENA(180), ACTOR_VANE(680, { estado: 'derrotado' })],
      texto: '¿Un chip de control mental? Entonces vamos a tener que tener mucho cuidado con esa cura.' },
    { fondo: 'muralla', quien: 'vane', actores: [ACTOR_JAX_BRAZOS(320), ACTOR_ELENA(180), ACTOR_VANE(680, { estado: 'derrotado' })],
      texto: 'Crucen el Bosque Biosintético... y corran. Zephyrus soltó a la Abominación X-0 para cazarlos.' },
  ],

  // ---------- Acto 2 ----------
  acto2: [
    { fondo: 'bosque', quien: 'narrador', actores: [ACTOR_ELENA(400), ACTOR_JAX(560)],
      texto: 'ACTO 2: LA CACERÍA. Jax y Elena escaparon de la ciudad y llegaron al Bosque Biosintético, un bosque que Genesis creó en sus laboratorios.' },
    { fondo: 'bosque', quien: 'elena', actores: [ACTOR_ELENA(400), ACTOR_JAX(560)],
      texto: 'Las plantas brillan en la oscuridad... Es hermoso. Y muy peligroso.' },
    { fondo: 'bosque', quien: 'narrador', efecto: 'temblor', actores: [ACTOR_ELENA(400), ACTOR_JAX(560), { dibujo: 'monstruo', x: 120, alto: 260, oscuro: true }],
      texto: 'De pronto, un rugido sacudió todos los árboles...' },
    { fondo: 'bosque', quien: 'jax', actores: [ACTOR_ELENA(400), ACTOR_JAX_PELEA(560, { mirando: -1 })],
      texto: '¿Qué fue eso?' },
    { fondo: 'bosque', quien: 'elena', efecto: 'temblor', actores: [ACTOR_ELENA(400, -1), ACTOR_JAX_PELEA(560, { mirando: -1 }), { dibujo: 'monstruo', x: 140, alto: 300 }],
      texto: '¡La Abominación X-0! ¡Corré, Jax! ¡Corré hacia la derecha y no mires atrás!' },
  ],

  // ---------- Antes del Nivel 5: la fogata ----------
  campamento: [
    { fondo: 'bosque', quien: 'narrador', actores: [ACTOR_ELENA(330), { dibujo: 'fogata', x: 480, alto: 60 }, ACTOR_JAX_BRAZOS(630, { mirando: -1 })],
      texto: 'Esa noche, escondidos en el bosque, Jax y Elena prendieron una fogata chiquita para que nadie los viera.' },
    { fondo: 'bosque', quien: 'jax', actores: [ACTOR_ELENA(330), { dibujo: 'fogata', x: 480, alto: 60 }, ACTOR_JAX(630, { mirando: -1 })],
      texto: 'Elena... ¿por qué trabajabas para Genesis?' },
    { fondo: 'bosque', quien: 'elena', actores: [ACTOR_ELENA(330), { dibujo: 'fogata', x: 480, alto: 60 }, ACTOR_JAX(630, { mirando: -1 })],
      texto: 'Cuando era chica me enfermé mucho. Marcus entró a Genesis para pagar mi tratamiento. Yo estudié para ser científica y poder ayudar a otros.' },
    { fondo: 'bosque', quien: 'elena', actores: [ACTOR_ELENA(330), { dibujo: 'fogata', x: 480, alto: 60 }, ACTOR_JAX(630, { mirando: -1 })],
      texto: 'Pero Zephyrus usó todo lo que yo investigaba para hacer armas. Y después... el suero. Perdoname, Jax.' },
    { fondo: 'bosque', quien: 'jax', actores: [ACTOR_ELENA(330), { dibujo: 'fogata', x: 480, alto: 60 }, ACTOR_JAX_PELEA(630, { mirando: -1, brillo: '#ff6a1f' })],
      texto: 'No fue tu culpa. Además, ¡ahora tengo superfuerza! Lo vamos a arreglar juntos.' },
    { fondo: 'bosque', quien: 'narrador', efecto: 'oscuro', actores: [{ dibujo: 'fogata', x: 480, alto: 60 }, { dibujo: 'sombra', x: 820, alto: 120, mirando: -1 }],
      texto: 'Mientras dormían, entre la niebla del pantano, un par de ojos rojos los observaba...' },
  ],

  // ---------- Nivel 6: la Abominación ----------
  abominacion: [
    { fondo: 'barranco', quien: 'narrador', efecto: 'temblor', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330), { dibujo: 'monstruo', x: 700, alto: 300, mirando: -1 }],
      texto: 'En el Barranco del Cazador, la Abominación X-0 los acorraló sobre el viejo puente de piedra.' },
    { fondo: 'barranco', quien: 'elena', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330), { dibujo: 'monstruo', x: 700, alto: 300, mirando: -1 }],
      texto: '¡Mirá su lomo, Jax! Esa bolsa violeta que brilla es su PUNTO DÉBIL. De frente es durísima: hay que pegarle por detrás.' },
    { fondo: 'barranco', quien: 'jax', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330, { brillo: '#ff6a1f' }), { dibujo: 'monstruo', x: 700, alto: 300, mirando: -1 }],
      texto: 'Cuando embista y se dé contra la pared, le voy a dar con todo. ¡Vamos!' },
  ],

  // ---------- Acto 3: el tren ----------
  acto3: [
    { fondo: 'estacion', quien: 'narrador', actores: [ACTOR_ELENA(400), ACTOR_JAX(560)],
      texto: 'ACTO 3: LA CITADEL GÉNESIS. La fortaleza de Zephyrus está en lo alto de las montañas heladas. Para llegar hay un solo camino rápido: el Expreso Génesis.' },
    { fondo: 'estacion', quien: 'vane', actores: [ACTOR_ELENA(250), ACTOR_JAX(400), ACTOR_VANE(720, { holograma: true })],
      texto: 'Elena, soy Marcus. No tengo mucho tiempo. Ese tren lleva provisiones a la Citadel: es la única forma de entrar sin que los vean.' },
    { fondo: 'estacion', quien: 'elena', actores: [ACTOR_ELENA(250, 1), ACTOR_JAX(400), ACTOR_VANE(720, { holograma: true })],
      texto: '¡Marcus! ¿Nos estás ayudando?' },
    { fondo: 'estacion', quien: 'vane', actores: [ACTOR_ELENA(250), ACTOR_JAX(400), ACTOR_VANE(720, { holograma: true })],
      texto: 'Les debo una. Pero cuidado: Kira, la Cazadora, viaja en la locomotora. Es la mejor agente de Zephyrus. Nunca se le escapó nadie.' },
    { fondo: 'estacion', quien: 'jax', actores: [ACTOR_ELENA(250), ACTOR_JAX_PELEA(400, { brillo: '#ff6a1f' })],
      texto: 'Un tren blindado, una cazadora y un montón de soldados. ¡Suena divertido! ¡Vamos!' },
  ],

  // ---------- Nivel 7: Kira ----------
  kira: [
    { fondo: 'trenExterior', quien: 'narrador', actores: [ACTOR_ELENA(180), ACTOR_JAX_PELEA(330), ACTOR_KIRA(720)],
      texto: 'Sobre la locomotora, en medio del viento, los esperaba una figura con un látigo de energía.' },
    { fondo: 'trenExterior', quien: 'kira', actores: [ACTOR_ELENA(180), ACTOR_JAX_PELEA(330), ACTOR_KIRA(720)],
      texto: 'Así que vos sos el famoso Sujeto Cero. Te imaginaba más alto.' },
    { fondo: 'trenExterior', quien: 'jax', actores: [ACTOR_ELENA(180), ACTOR_JAX_BRAZOS(330), ACTOR_KIRA(720)],
      texto: 'Y yo me imaginaba un viaje tranquilo. Parece que los dos nos equivocamos.' },
    { fondo: 'trenExterior', quien: 'kira', efecto: 'temblor', actores: [ACTOR_ELENA(180), ACTOR_JAX_PELEA(330), ACTOR_KIRA(720, { estado: 'preparaLatigo' })],
      texto: 'Zephyrus me sacó de la calle y me dio un hogar. No voy a dejar que nadie lo toque. ¡En guardia!' },
    { fondo: 'trenExterior', quien: 'elena', actores: [ACTOR_ELENA(180), ACTOR_JAX_PELEA(330), ACTOR_KIRA(720)],
      texto: 'Jax, cuidado: cuando salte muy alto va a caer en picada. ¡Mirá la sombra en el piso!' },
  ],
  'kira-derrota': [
    { fondo: 'trenExterior', quien: 'kira', actores: [ACTOR_ELENA(180), ACTOR_JAX_BRAZOS(330), ACTOR_KIRA(700, { estado: 'derrotado' })],
      texto: 'Nadie... nunca me había ganado.' },
    { fondo: 'trenExterior', quien: 'elena', actores: [ACTOR_ELENA(180), ACTOR_JAX_BRAZOS(330), ACTOR_KIRA(700, { estado: 'derrotado' })],
      texto: 'Kira, Zephyrus te está usando. La cura que tiene esconde un chip que controla la mente de quien la toma.' },
    { fondo: 'trenExterior', quien: 'kira', actores: [ACTOR_ELENA(180), ACTOR_JAX_BRAZOS(330), ACTOR_KIRA(700)],
      texto: '...Mentira. Zephyrus nunca haría eso. Pero esto no termina acá, Sujeto Cero.' },
    { fondo: 'trenExterior', quien: 'narrador', actores: [ACTOR_ELENA(180), ACTOR_JAX(330)],
      texto: 'Kira saltó del tren y desapareció en la tormenta. A lo lejos, la Citadel Génesis brillaba entre las nubes.' },
  ],

  // ---------- Nivel 8: llegada a la Citadel ----------
  citadel: [
    { fondo: 'nieve', quien: 'narrador', actores: [ACTOR_ELENA(400), ACTOR_JAX(560)],
      texto: 'El Expreso Génesis los dejó al pie de la Citadel. Solo faltaba cruzar la Muralla de Cristal... bajo una tormenta de nieve.' },
    { fondo: 'nieve', quien: 'zephyrus', actores: [ACTOR_ELENA(250), ACTOR_JAX(400), ACTOR_ZEPHYRUS(720, { holograma: true })],
      texto: 'Impresionante, Sujeto Cero. Llegaste hasta mi puerta. Pero la Citadel es mi casa... y acá mando yo.' },
    { fondo: 'nieve', quien: 'jax', actores: [ACTOR_ELENA(250), ACTOR_JAX_PELEA(400), ACTOR_ZEPHYRUS(720, { holograma: true })],
      texto: 'Vine por la cura, Zephyrus. Y me la voy a llevar.' },
    { fondo: 'nieve', quien: 'elena', actores: [ACTOR_ELENA(400), ACTOR_JAX(560)],
      texto: 'Jax, el suero ya está muy avanzado. Esta es nuestra última oportunidad. ¡Adelante!' },
  ],

  // ---------- Nivel 8: Proto-Jax Alfa ----------
  protojax: [
    { fondo: 'clones', quien: 'narrador', efecto: 'temblor', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330), ACTOR_JAX_PELEA(700, { mirando: -1, tinte: { color: '#ff1f3a', fuerza: 0.4 }, alto: 260 })],
      texto: 'En el fondo del Salón de los Clones, un tanque gigante se rompió en mil pedazos...' },
    { fondo: 'clones', quien: 'zephyrus', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330), ACTOR_JAX_PELEA(700, { mirando: -1, tinte: { color: '#ff1f3a', fuerza: 0.4 }, alto: 260 })],
      texto: 'Te presento a Proto-Jax Alfa: mi primer clon con TU suero. Más grande, más fuerte... y me obedece.' },
    { fondo: 'clones', quien: 'jax', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330, { brillo: '#ff6a1f' }), ACTOR_JAX_PELEA(700, { mirando: -1, tinte: { color: '#ff1f3a', fuerza: 0.4 }, alto: 260 })],
      texto: 'Puede ser una copia mía... pero yo tengo algo que él no tiene.' },
    { fondo: 'clones', quien: 'elena', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330), ACTOR_JAX_PELEA(700, { mirando: -1, tinte: { color: '#ff1f3a', fuerza: 0.4 }, alto: 260 })],
      texto: '¿Qué cosa?' },
    { fondo: 'clones', quien: 'jax', actores: [ACTOR_ELENA(200), ACTOR_JAX_PELEA(330, { brillo: '#ff6a1f' }), ACTOR_JAX_PELEA(700, { mirando: -1, tinte: { color: '#ff1f3a', fuerza: 0.4 }, alto: 260 })],
      texto: '¡Una amiga que me cuida la espalda! ¡Vamos!' },
  ],

  // ---------- Nivel 9: Zephyrus ----------
  zephyrus: [
    { fondo: 'nucleo', quien: 'zephyrus', actores: [ACTOR_ELENA(170), ACTOR_JAX(320), ACTOR_ZEPHYRUS(700), { dibujo: 'cura', x: 820, alto: 60 }],
      texto: 'Bienvenido al Núcleo Génesis, Jax. Acá está lo que viniste a buscar.' },
    { fondo: 'nucleo', quien: 'jax', actores: [ACTOR_ELENA(170), ACTOR_JAX_PELEA(320), ACTOR_ZEPHYRUS(700), { dibujo: 'cura', x: 820, alto: 60 }],
      texto: 'La cura. Dámela, Zephyrus.' },
    { fondo: 'nucleo', quien: 'zephyrus', actores: [ACTOR_ELENA(170), ACTOR_JAX_PELEA(320), ACTOR_ZEPHYRUS(700), { dibujo: 'cura', x: 820, alto: 60 }],
      texto: '¿Dártela? Ja, ja, ja. Con el chip de esta cura, todos los que la tomen me van a obedecer para siempre. ¡Incluso vos!' },
    { fondo: 'nucleo', quien: 'elena', actores: [ACTOR_ELENA(170), ACTOR_JAX_PELEA(320), ACTOR_ZEPHYRUS(700)],
      texto: 'Jax, si durante la pelea consigo hackear las consolas del reactor, puedo reprogramar ese chip. ¡Distraelo!' },
    { fondo: 'nucleo', quien: 'zephyrus', efecto: 'temblor', actores: [ACTOR_ELENA(170), ACTOR_JAX_PELEA(320, { brillo: '#ff6a1f' }), { dibujo: 'mecha', x: 700, alto: 300 }],
      texto: 'Basta de charla. ¡Que empiece la pelea final!' },
  ],

  // ---------- Si se acaba el Cronómetro Mortal ----------
  'final-tiempo': [
    { fondo: 'nucleo', quien: 'narrador', efecto: 'oscuro', actores: [ACTOR_JAX_BRAZOS(360, { tinte: { color: '#7a30ff', fuerza: 0.35 } }), ACTOR_ZEPHYRUS(680)],
      texto: 'El cronómetro llegó a cero... y el cuerpo de Jax ya no aguantaba más.' },
    { fondo: 'nucleo', quien: 'zephyrus', actores: [ACTOR_JAX_BRAZOS(360, { tinte: { color: '#7a30ff', fuerza: 0.35 } }), ACTOR_ZEPHYRUS(680), { dibujo: 'cura', x: 520, alto: 60 }],
      texto: 'Se acabó el tiempo, Sujeto Cero. Tomá la cura... si querés vivir.' },
  ],

  // ---------- Los 3 finales ----------
  'final-bueno': [
    { fondo: 'nucleo', quien: 'narrador', efecto: 'destello', actores: [ACTOR_JAX_PELEA(480, { brillo: '#ff6a1f' })],
      texto: 'Jax aplastó el chip con su puño. ¡CRACK! El control mental de Zephyrus desapareció para siempre.' },
    { fondo: 'nucleo', quien: 'zephyrus', actores: [{ dibujo: 'zephyrus-perfil', x: 640, alto: 210, mirando: -1, rotar: 0.25 }, ACTOR_JAX_BRAZOS(330)],
      texto: '¡NOOO! ¡Mi plan perfecto...!' },
    { fondo: 'nucleo', quien: 'jax', actores: [ACTOR_ELENA(200), ACTOR_JAX_BRAZOS(380)],
      texto: 'Prefiero vivir 5 años libre que 100 años obedeciéndote.' },
    { fondo: 'bosque', quien: 'elena', actores: [ACTOR_ELENA(400), ACTOR_JAX(560, { mirando: -1 })],
      texto: 'Jax... ¿estás seguro?' },
    { fondo: 'bosque', quien: 'jax', actores: [ACTOR_ELENA(400), ACTOR_JAX_PELEA(560, { mirando: -1 })],
      texto: 'Sí. Voy a vivir cada día a full. Y vamos a defender los biomas juntos.' },
    { fondo: 'bosque', quien: 'vane', actores: [ACTOR_ELENA(330), ACTOR_JAX(500), ACTOR_VANE(720)],
      texto: 'Genesis cayó, hermanita. Y yo ya no tengo que obedecer a nadie. ¿Les vendría bien alguien con un brazo de metal?' },
    { fondo: 'bosque', quien: 'narrador', actores: [ACTOR_ELENA(400), ACTOR_JAX(560)],
      texto: 'Y así, Jax y Elena recorrieron el mundo protegiendo los bosques y las ciudades. Cinco años de aventuras... que valieron por mil.' },
  ],
  'final-perfecto': [
    { fondo: 'nucleo', quien: 'elena', actores: [ACTOR_ELENA(330), ACTOR_JAX(620, { mirando: -1 }), { dibujo: 'cura', x: 480, alto: 60, limpia: true }],
      texto: '¡Lo logré, Jax! Reprogramé el chip durante la pelea: la cura ya está limpia.' },
    { fondo: 'nucleo', quien: 'jax', actores: [ACTOR_ELENA(330), ACTOR_JAX(620, { mirando: -1 }), { dibujo: 'cura', x: 480, alto: 60, limpia: true }],
      texto: '¿Entonces...?' },
    { fondo: 'nucleo', quien: 'elena', actores: [ACTOR_ELENA(330), ACTOR_JAX(620, { mirando: -1 }), { dibujo: 'cura', x: 480, alto: 60, limpia: true }],
      texto: 'Entonces tomala. Sin chip, sin control. Solo la cura.' },
    { fondo: 'nucleo', quien: 'narrador', efecto: 'destello', actores: [ACTOR_JAX_PELEA(480, { brillo: '#7dff5a' })],
      texto: 'Jax tomó la cura. La energía del suero se calmó... ¡y la degradación bajó a CERO!' },
    { fondo: 'nucleo', quien: 'jax', actores: [ACTOR_ELENA(330), ACTOR_JAX_PELEA(600, { brillo: '#ff6a1f' })],
      texto: '¡ME CURÉ! ¡Y todavía tengo mis poderes!' },
    { fondo: 'nucleo', quien: 'zephyrus', actores: [{ dibujo: 'zephyrus-perfil', x: 640, alto: 210, mirando: -1, rotar: 0.25 }],
      texto: 'Imposible... vencido por una científica y un muñeco de entrenamiento...' },
    { fondo: 'muralla', quien: 'narrador', actores: [ACTOR_ELENA(330), ACTOR_JAX_BRAZOS(480), ACTOR_VANE(640, { mirando: -1 }), ACTOR_KIRA(800)],
      texto: 'Marcus dejó Genesis para siempre. Y Kira, cuando descubrió la verdad sobre el chip, también. Dicen que ahora protege la ciudad... a su manera.' },
    { fondo: 'muralla', quien: 'narrador', actores: [ACTOR_ELENA(400), ACTOR_JAX_BRAZOS(560)],
      texto: 'Sin la cura y sin su ejército, Genesis cayó. Jax y Elena se convirtieron en los héroes de la ciudad. ¡Y Jax tiene toda la vida por delante!' },
  ],
  'final-oscuro': [
    { fondo: 'nucleo', quien: 'narrador', efecto: 'oscuro', actores: [ACTOR_JAX(480, { tinte: { color: '#7a30ff', fuerza: 0.3 } }), { dibujo: 'cura', x: 600, alto: 60 }],
      texto: 'Jax tomó la cura... y el chip de control se encendió dentro de su cabeza.' },
    { fondo: 'nucleo', quien: 'zephyrus', actores: [ACTOR_JAX(330, { tinte: { color: '#ff1f3a', fuerza: 0.35 } }), ACTOR_ZEPHYRUS(660)],
      texto: 'Ja, ja, ja... Bienvenido a Genesis, Sujeto Cero. Desde hoy, me obedecés.' },
    { fondo: 'nucleo', quien: 'elena', actores: [ACTOR_ELENA(200), ACTOR_JAX(420, { tinte: { color: '#ff1f3a', fuerza: 0.35 } }), ACTOR_ZEPHYRUS(700)],
      texto: '¡Jax, no! ¡Despertá! ¡Soy yo, Elena!' },
    { fondo: 'nucleo', quien: 'jax', actores: [ACTOR_JAX_BRAZOS(480, { tinte: { color: '#ff1f3a', fuerza: 0.45 } })],
      texto: '...Sí, señor Zephyrus.' },
    { fondo: 'nucleo', quien: 'narrador', efecto: 'oscuro', actores: [ACTOR_ELENA(480, -1)],
      texto: 'Jax se salvó de la degradación... pero perdió su libertad. ¿Algún día Elena encontrará la forma de liberarlo? Tal vez... en otra partida.' },
  ],
};

const NOMBRES_DE_FINALES = {
  bueno: 'FINAL BUENO',
  perfecto: 'FINAL PERFECTO',
  oscuro: 'FINAL OSCURO',
};

// ============================================================
//  MOSTRAR UNA ESCENA
// ============================================================

const Escena = { id: '', cuadros: [], numero: 0, tiempo: 0, alTerminar: null, temblor: 0, saltar: 0 };
const LETRAS_POR_SEGUNDO_ESCENA = 40;

function mostrarEscena(id, alTerminar) {
  Escena.id = id;
  Escena.cuadros = ESCENAS[id];
  Escena.numero = 0;
  Escena.tiempo = 0;
  Escena.saltar = 0;
  Escena.alTerminar = alTerminar;
  empezarCuadro();
  if (id.startsWith('final-oscuro') || id === 'final-tiempo') Musica.tocar('oscura');
  else if (id.startsWith('final')) Musica.tocar('victoria');
  else Musica.tocar('menu');
  Juego.estado = 'escena';
}

function empezarCuadro() {
  const cuadro = Escena.cuadros[Escena.numero];
  Escena.tiempo = 0;
  Escena.destello = 0;
  if (cuadro.efecto === 'temblor') {
    Escena.temblor = 10;
    Sonido.rugidoMonstruo();
  } else if (cuadro.efecto === 'explosion') {
    Escena.temblor = 16;
    Escena.destello = 1;
    Sonido.explosion();
  } else if (cuadro.efecto === 'destello') {
    Escena.destello = 1;
    Sonido.furia();
  } else {
    Sonido.radio();
  }
}

function terminarEscena() {
  const alTerminar = Escena.alTerminar;
  Escena.alTerminar = null;
  if (alTerminar) alTerminar();
}

function actualizarEscena(menu, dt) {
  Escena.tiempo += dt;
  Escena.temblor = Math.max(0, Escena.temblor - 25 * dt);
  Escena.destello = Math.max(0, (Escena.destello || 0) - dt * 1.5);
  const cuadro = Escena.cuadros[Escena.numero];
  const escribiendo = Escena.tiempo * LETRAS_POR_SEGUNDO_ESCENA < cuadro.texto.length;

  // ESC (o mantener B) saltea toda la escena
  const manteniendoB = Entrada.mandos.some((m) => m.botones[BOTON.ESTE]);
  Escena.saltar = manteniendoB ? Escena.saltar + dt : 0;
  if (Entrada.seAcabaDeApretar('Escape') || Escena.saltar > 0.8) {
    terminarEscena();
    return;
  }
  const seguir = menu.aceptar || Entrada.seAcabaDeApretar('KeyZ') || Entrada.mandos.some((m) => botonRecien(m, BOTON.OESTE));
  if (!seguir) return;
  if (escribiendo) {
    Escena.tiempo = cuadro.texto.length / LETRAS_POR_SEGUNDO_ESCENA;   // muestra todo el texto de una
    return;
  }
  Escena.numero++;
  if (Escena.numero >= Escena.cuadros.length) terminarEscena();
  else empezarCuadro();
}

function dibujarEscena(ctx) {
  const cuadro = Escena.cuadros[Math.min(Escena.numero, Escena.cuadros.length - 1)];
  const t = Juego.tiempo;
  ctx.save();
  if (Escena.temblor > 0) ctx.translate((Math.random() * 2 - 1) * Escena.temblor, (Math.random() * 2 - 1) * Escena.temblor);

  // Fondo que se mueve despacito y un piso
  dibujarFondo(ctx, 800 + t * 12, 300, cuadro.fondo, t);
  const tema = TEMAS[cuadro.fondo] || TEMAS.prueba;
  ctx.fillStyle = tema.piso[0];
  ctx.fillRect(-20, 405, ANCHO + 40, 160);
  ctx.fillStyle = tema.piso[1];
  ctx.fillRect(-20, 405, ANCHO + 40, 4);
  if (cuadro.fondo === 'laboratorio' && cuadro.efecto !== 'explosion') dibujarCapsula(ctx, 110, 405, t);

  for (const actor of cuadro.actores || []) dibujarActor(ctx, actor, t);
  ctx.restore();

  if (cuadro.efecto === 'oscuro') {
    ctx.fillStyle = 'rgba(10, 0, 20, 0.45)';
    ctx.fillRect(0, 0, ANCHO, ALTO);
  }
  if (Escena.destello > 0) {
    ctx.fillStyle = cuadro.efecto === 'explosion' ? `rgba(255, 200, 120, ${Escena.destello})` : `rgba(255, 255, 255, ${Escena.destello * 0.8})`;
    ctx.fillRect(0, 0, ANCHO, ALTO);
  }

  // El cuadro de texto
  const yCaja = 420;
  ctx.fillStyle = 'rgba(4, 6, 11, 0.92)';
  ctx.fillRect(10, yCaja, ANCHO - 20, ALTO - yCaja - 10);
  const quien = QUIENES[cuadro.quien] || QUIENES.narrador;
  ctx.strokeStyle = quien.color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(10.5, yCaja + 0.5, ANCHO - 21, ALTO - yCaja - 11);
  dibujarRetrato(ctx, cuadro.quien, 22, yCaja + 12, 86);
  texto(ctx, quien.nombre, 124, yCaja + 18, { tamano: 14, negrita: true, alinear: 'left', color: quien.color });
  ctx.font = `17px ${FUENTE}`;
  const renglones = partirEnRenglones(ctx, cuadro.texto, ANCHO - 160);
  let quedan = Math.floor(Escena.tiempo * LETRAS_POR_SEGUNDO_ESCENA);
  renglones.forEach((renglon, i) => {
    const visible = renglon.slice(0, Math.max(0, quedan));
    quedan -= renglon.length + 1;
    texto(ctx, visible, 124, yCaja + 44 + i * 22, { tamano: 17, alinear: 'left', color: COLORES.blanco });
  });
  const listo = Escena.tiempo * LETRAS_POR_SEGUNDO_ESCENA >= cuadro.texto.length;
  if (listo && Math.floor(t * 2) % 2 === 0) texto(ctx, '▼ ENTER', ANCHO - 60, ALTO - 26, { tamano: 12, negrita: true, color: quien.color });
  texto(ctx, `${Escena.numero + 1}/${Escena.cuadros.length} · ESC saltear`, ANCHO - 18, 18, { tamano: 12, alinear: 'right', color: COLORES.apagado });
}

// Dibuja a un actor parado en el piso de la escena
function dibujarActor(ctx, actor, t) {
  const piso = 412;
  const mirando = actor.mirando || 1;
  ctx.save();
  if (actor.holograma) {
    ctx.globalAlpha = 0.55 + Math.sin(t * 20) * 0.1;
  }
  if (actor.brillo) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(actor.x, piso - actor.alto / 2, 10, actor.x, piso - actor.alto / 2, actor.alto * 0.7);
    g.addColorStop(0, actor.brillo + '88');
    g.addColorStop(1, actor.brillo + '00');
    ctx.fillStyle = g;
    ctx.fillRect(actor.x - actor.alto, piso - actor.alto * 1.3, actor.alto * 2, actor.alto * 1.4);
    ctx.restore();
  }
  const respira = 1 + Math.sin(t * 2 + actor.x) * 0.01;
  switch (actor.dibujo) {
    case 'elena':
      dibujarElenaGrande(ctx, actor.x, piso, actor.alto / 60, mirando);
      break;
    case 'vane':
      ctx.translate(actor.x, piso);
      ctx.scale(actor.alto / 100, actor.alto / 100);
      dibujarFiguraVane(ctx, 0, 0, mirando, actor.estado || 'quieto', t, actor.estado === 'derrotado' ? 2 : 0);
      break;
    case 'muneco':
      ctx.translate(actor.x, piso);
      ctx.scale(actor.alto / 66, actor.alto / 66);
      dibujarMuneco(ctx, { x: -15, y: -66, ancho: 30, alto: 66, estado: 'quieto', destello: 0, mirando: 1 });
      break;
    case 'suero':
      dibujarFrasco(ctx, actor.x, piso - 120, '#ff6a1f', t);
      break;
    case 'cura':
      dibujarFrasco(ctx, actor.x, piso - 130, '#7dff5a', t, !actor.limpia);
      break;
    case 'capsula':
      dibujarCapsula(ctx, actor.x, piso, t);
      break;
    case 'kira':
      ctx.translate(actor.x, piso);
      ctx.scale(actor.alto / 86, actor.alto / 86);
      dibujarFiguraKira(ctx, 0, 0, mirando, actor.estado || 'quieto', t, actor.estado === 'derrotado' ? 2 : 0, { enElSuelo: true });
      break;
    case 'fogata':
      dibujarFogata(ctx, actor.x, piso, t);
      break;
    case 'mecha':
      ctx.translate(actor.x, piso);
      ctx.scale(actor.alto / 140, actor.alto / 140);
      dibujarMecha(ctx, {
        x: -55, y: -130, ancho: 110, alto: 130, mirando: -1, estado: 'camina', tiempo: t, tiempoEstado: 0,
        pasos: 0, destello: 0,
      }, -55, -130);
      break;
    default:
      if (actor.dibujo === 'monstruo' && actor.oscuro) ctx.globalAlpha *= 0.5;
      dibujarSprite(ctx, actor.dibujo, actor.x, piso, actor.alto, {
        mirando, tinte: actor.tinte, estirarY: respira, rotar: actor.rotar || 0,
      });
  }
  ctx.restore();
}

// Una fogata con llamas que bailan
function dibujarFogata(ctx, x, piso, t) {
  ctx.save();
  ctx.fillStyle = '#4a2a18';
  ctx.fillRect(x - 30, piso - 8, 60, 8);
  ctx.globalCompositeOperation = 'lighter';
  const luz = ctx.createRadialGradient(x, piso - 30, 5, x, piso - 30, 180);
  luz.addColorStop(0, 'rgba(255, 150, 60, 0.35)');
  luz.addColorStop(1, 'rgba(255, 150, 60, 0)');
  ctx.fillStyle = luz;
  ctx.fillRect(x - 180, piso - 210, 360, 210);
  for (let i = 0; i < 5; i++) {
    const alto = 40 + Math.sin(t * 9 + i * 1.7) * 12;
    ctx.fillStyle = i % 2 ? 'rgba(255, 200, 80, 0.8)' : 'rgba(255, 110, 40, 0.8)';
    ctx.beginPath();
    ctx.moveTo(x - 20 + i * 10, piso - 6);
    ctx.quadraticCurveTo(x - 24 + i * 10 + Math.sin(t * 7 + i) * 6, piso - alto * 0.6, x - 16 + i * 8, piso - alto);
    ctx.quadraticCurveTo(x - 8 + i * 8, piso - alto * 0.5, x - 10 + i * 10, piso - 6);
    ctx.fill();
  }
  ctx.restore();
}

// Elena dibujada con su dibujo de siempre, pero más grande
function dibujarElenaGrande(ctx, x, piso, escala, mirando) {
  ctx.save();
  ctx.translate(x, piso);
  ctx.scale(escala, escala);
  const maniqui = {
    x: -15, y: -60, xAntes: -15, yAntes: -60, ancho: 30, alto: 60, mirando, aplastado: 0, enElSuelo: true,
    vx: 0, pasos: 0, tiempo: Juego.tiempo, disparo: 1, parpadeo: 0, invulnerable: 0, relajada: true,
  };
  dibujarElena(ctx, maniqui, 1);
  ctx.restore();
}

// Un frasco que brilla: el suero Némesis (naranja) o la cura (verde, con el chip rojo)
function dibujarFrasco(ctx, x, y, color, t, conChip = false) {
  const flota = Math.sin(t * 2.5) * 6;
  ctx.save();
  ctx.translate(x, y + flota);
  ctx.shadowColor = color;
  ctx.shadowBlur = 30;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-14, -26, 28, 46, 9);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#d7f4ff';
  ctx.fillRect(-9, -36, 18, 10);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(-9, -20, 4, 26);
  if (conChip) {
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(-5, -2, 10, 8);
    ctx.fillStyle = '#ffd0d0';
    ctx.fillRect(-3, 0, 2, 2);
  }
  ctx.restore();
}

// La "foto" de quien habla, en el cuadro de texto (y en la radio)
function dibujarRetrato(ctx, quien, x, y, tam) {
  ctx.save();
  ctx.fillStyle = '#1d2638';
  ctx.fillRect(x, y, tam, tam);
  ctx.beginPath();
  ctx.rect(x, y, tam, tam);
  ctx.clip();
  const sprites = { jax: 'jax-frente', zephyrus: 'zephyrus-frente' };
  if (sprites[quien] && hayImagen(sprites[quien])) {
    // La cabeza del sprite: se dibuja grande y se ve solo la parte de arriba
    const alto = tam * 3.3;
    dibujarSprite(ctx, sprites[quien], x + tam / 2, y + alto - tam * 0.02, alto);
  } else if (quien === 'elena' || quien === 'jax') {
    const c = tam / 40;
    ctx.translate(x, y);
    ctx.scale(c, c);
    ctx.fillStyle = '#26324a';
    ctx.fillRect(0, 0, 40, 40);
    ctx.fillStyle = quien === 'elena' ? '#e0b394' : '#c98e64';
    ctx.beginPath();
    ctx.arc(20, 18, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = quien === 'elena' ? '#3b2417' : '#7a3a18';
    ctx.beginPath();
    ctx.arc(20, 15, 10, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = quien === 'elena' ? '#cfd8e6' : '#9aa3b5';
    ctx.fillRect(8, 29, 24, 11);
  } else if (quien === 'kira') {
    ctx.translate(x + tam / 2, y + tam * 2.5);
    ctx.scale(tam / 40, tam / 40);
    dibujarFiguraKira(ctx, 0, 0, 1, 'quieto', Juego.tiempo, 0, { enElSuelo: true });
  } else if (quien === 'vane') {
    ctx.translate(x + tam / 2, y + tam * 2.54);
    ctx.scale(tam / 45, tam / 45);
    dibujarFiguraVane(ctx, 0, 0, 1, 'quieto', Juego.tiempo, 0);
  } else {
    // Narrador: un libro abierto
    ctx.fillStyle = '#2b3448';
    ctx.fillRect(x, y, tam, tam);
    ctx.fillStyle = '#e8dcc0';
    ctx.beginPath();
    ctx.moveTo(x + tam * 0.15, y + tam * 0.3);
    ctx.lineTo(x + tam * 0.5, y + tam * 0.38);
    ctx.lineTo(x + tam * 0.85, y + tam * 0.3);
    ctx.lineTo(x + tam * 0.85, y + tam * 0.72);
    ctx.lineTo(x + tam * 0.5, y + tam * 0.8);
    ctx.lineTo(x + tam * 0.15, y + tam * 0.72);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7a6a4a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x + tam * 0.5, y + tam * 0.38);
    ctx.lineTo(x + tam * 0.5, y + tam * 0.8);
    ctx.stroke();
  }
  ctx.restore();
  ctx.strokeStyle = (QUIENES[quien] || QUIENES.narrador).color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 0.5, y + 0.5, tam - 1, tam - 1);
}

// ============================================================
//  LA ELECCIÓN FINAL
// ============================================================

let opcionEleccion = 0;

function opcionesEleccion() {
  const opciones = [
    { titulo: 'Destruir el chip de control', final: 'bueno', descripcion: 'Jax se queda con sus 5 años de vida... pero libre.' },
    { titulo: 'Tomar la cura así como está', final: 'oscuro', descripcion: 'Jax se cura... pero el chip de Zephyrus sigue adentro.' },
  ];
  if (Juego.chipHackeado || (Juego.partida && Juego.partida.decisiones.chipHackeado)) {
    opciones.push({ titulo: 'Tomar la cura reprogramada', final: 'perfecto', descripcion: 'Elena hackeó el chip: la cura está limpia. ¡Sin trampas!' });
  }
  return opciones;
}

function abrirEleccion() {
  opcionEleccion = 0;
  Musica.tocar('menu');
  Juego.estado = 'eleccion';
}

function actualizarEleccion(menu) {
  const opciones = opcionesEleccion();
  opcionEleccion = moverOpcion(opcionEleccion, opciones.length, menu);
  if (!menu.aceptar) return;
  const elegido = opciones[opcionEleccion].final;
  Sonido.boton();
  mostrarEscena('final-' + elegido, () => terminarJuego(elegido));
}

function dibujarEleccion(ctx) {
  const t = Juego.tiempo;
  dibujarFondo(ctx, 900 + t * 8, 300, 'nucleo', t);
  ctx.fillStyle = 'rgba(4, 6, 11, 0.55)';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.fillStyle = TEMAS.nucleo.piso[0];                 // el piso
  ctx.fillRect(0, 330, 300, 8);
  ctx.fillRect(660, 330, 300, 8);
  // Zephyrus de rodillas (más bajito e inclinado) y Jax parado
  dibujarSprite(ctx, 'zephyrus-perfil', 150, 334, 190, { mirando: 1, rotar: 0.18, estirarY: 0.82, tinte: { color: '#3a2a4a', fuerza: 0.3 } });
  dibujarFrasco(ctx, ANCHO / 2, 190, '#7dff5a', t, !(Juego.chipHackeado || (Juego.partida && Juego.partida.decisiones.chipHackeado)));
  dibujarSprite(ctx, 'jax-frente', 820, 334, 210, { mirando: -1 });

  ctx.save();
  ctx.shadowColor = '#7dff5a';
  ctx.shadowBlur = 16;
  texto(ctx, 'ZEPHYRUS CAYÓ', ANCHO / 2, 50, { tamano: 40, negrita: true, color: COLORES.blanco });
  ctx.restore();
  texto(ctx, 'La cura está en tus manos. ¿Qué hace Jax?', ANCHO / 2, 92, { tamano: 18, color: COLORES.texto });

  const opciones = opcionesEleccion();
  opciones.forEach((o, i) => {
    const y = 300 + i * 54;
    const elegida = i === opcionEleccion;
    if (elegida) dibujarResaltado(ctx, ANCHO / 2 - 230, y - 22, 460, 44);
    texto(ctx, o.titulo, ANCHO / 2, y, { tamano: 20, negrita: elegida, color: elegida ? COLORES.blanco : COLORES.apagado });
  });
  texto(ctx, opciones[opcionEleccion].descripcion, ANCHO / 2, 300 + opciones.length * 54 + 6, { tamano: 15, color: COLORES.celeste });
  if (opciones.length < 3) {
    texto(ctx, 'Pista: si Elena hackea las 3 consolas en la última fase, aparece otra opción...', ANCHO / 2, ALTO - 44, { tamano: 13, color: COLORES.apagado });
  }
  dibujarPie(ctx, '↑↓ elegir · ENTER o A aceptar');
}

// ============================================================
//  FIN DEL JUEGO Y CRÉDITOS
// ============================================================

const Creditos = { final: '', tiempo: 0 };

function terminarJuego(final) {
  const partida = Juego.partida;
  if (partida) {
    if (!partida.finales.includes(final)) partida.finales.push(final);
    partida.terminado = true;
    if (!partida.completados.includes(partida.nivelId)) partida.completados.push(partida.nivelId);
    guardarPartida();
  }
  Creditos.final = final;
  Creditos.tiempo = 0;
  Musica.tocar(final === 'oscuro' ? 'oscura' : 'victoria');
  Juego.estado = 'creditos';
}

function lineasDeCreditos() {
  const partida = Juego.partida;
  const lineas = [
    { texto: NOMBRES_DE_FINALES[Creditos.final], tamano: 40, color: Creditos.final === 'oscuro' ? '#c08aff' : '#7dff5a' },
    { texto: '' },
    { texto: 'REMANENTE: 5 AÑOS', tamano: 30, color: COLORES.blanco },
    { texto: '' },
    { texto: 'Idea, historia y personajes', tamano: 15, color: COLORES.apagado },
    { texto: CREADOR_DEL_JUEGO, tamano: 22, color: COLORES.naranja },
    { texto: '' },
    { texto: 'Programado con la ayuda de', tamano: 15, color: COLORES.apagado },
    { texto: 'Claude', tamano: 22, color: COLORES.celeste },
    { texto: '' },
    { texto: 'Protagonista: Jax · El Sujeto Cero', tamano: 16 },
    { texto: 'Dra. Elena Vane · La científica', tamano: 16 },
    { texto: 'Zephyrus · El dueño de Genesis', tamano: 16 },
    { texto: 'Comandante Marcus Vane · Kira, la Cazadora', tamano: 16 },
    { texto: 'La Abominación X-0 · El Guardián de las Ruinas · Proto-Jax Alfa', tamano: 16 },
    { texto: '' },
  ];
  if (partida) {
    const e = partida.estadisticas;
    const minutos = Math.floor(e.tiempoJugado / 60);
    lineas.push(
      { texto: 'TU PARTIDA', tamano: 18, color: COLORES.naranja },
      { texto: `Tiempo jugado: ${minutos} minutos`, tamano: 16 },
      { texto: `Enemigos derrotados: ${e.enemigosDerrotados}`, tamano: 16 },
      { texto: `Jefes vencidos: ${e.jefesVencidos} · Caídas: ${e.muertes}`, tamano: 16 },
      { texto: `Finales conseguidos: ${partida.finales.length} de 3 (${partida.finales.map((f) => NOMBRES_DE_FINALES[f].toLowerCase()).join(', ')})`, tamano: 16 },
      { texto: '' },
    );
    if (partida.finales.length < 3) {
      lineas.push({ texto: 'Con "Continuar" podés volver a pelear contra Zephyrus y buscar los otros finales.', tamano: 14, color: COLORES.celeste });
      lineas.push({ texto: '' });
    }
  }
  lineas.push({ texto: '¡GRACIAS POR JUGAR!', tamano: 30, color: COLORES.blanco });
  return lineas;
}

function actualizarCreditos(menu, dt) {
  Creditos.tiempo += dt;
  const total = lineasDeCreditos().length * 34 + ALTO;
  const terminaron = Creditos.tiempo * 40 > total - ALTO / 2;
  if ((menu.aceptar && Creditos.tiempo > 1.5) || menu.volver || terminaron) salirAlMenu();
}

function dibujarCreditos(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  const lineas = lineasDeCreditos();
  let y = ALTO + 20 - Creditos.tiempo * 40;
  for (const l of lineas) {
    if (y > -40 && y < ALTO + 40) {
      texto(ctx, l.texto, ANCHO / 2, y, { tamano: l.tamano || 16, negrita: (l.tamano || 16) >= 20, color: l.color || COLORES.texto });
    }
    y += 34;
  }
  // Jax y Elena al costado
  dibujarSprite(ctx, Creditos.final === 'oscuro' ? 'jax-brazos' : 'jax-pelea', 110, ALTO - 20, 220, {
    tinte: Creditos.final === 'oscuro' ? { color: '#ff1f3a', fuerza: 0.35 } : null,
  });
  dibujarElenaGrande(ctx, ANCHO - 110, ALTO - 20, 3.2, -1);
  dibujarPie(ctx, 'ENTER: volver al menú');
}
