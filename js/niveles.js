// ============================================================
//  NIVELES: cada nivel es una lista de datos
//  Para cambiar un escenario no hace falta tocar el motor:
//  alcanza con cambiar estos números.
// ============================================================

// Las medidas están en píxeles. Ojo: la "y" crece hacia ABAJO
// (y = 0 es lo más alto del nivel).
// Jax mide 64 de alto y salta unos 150 como máximo.
const PISO = 820;

// En los carteles, las palabras entre llaves se cambian por la tecla (o botón)
// que usa el Jugador 1: {mover} {saltar} {bajar} {ataque} {hab1} {hab2} {definitiva} {mochila} {esquivar} {disparar}

// ------------------------------------------------------------
//  AYUDANTES para escribir los niveles más fácil.
//  "altura" se mide desde el piso: altura 100 = 100 píxeles más arriba que el piso.
// ------------------------------------------------------------
function suelo(x, ancho) { return { x, y: PISO, ancho, alto: 80, tipo: 'solida' }; }
function bloque(x, ancho, alto) { return { x, y: PISO - alto, ancho, alto, tipo: 'solida' }; }   // apoyado en el piso
function fina(x, altura, ancho) { return { x, y: PISO - altura, ancho, alto: 14, tipo: 'fina' }; }
function pared(x) { return { x, y: 0, ancho: 60, alto: PISO, tipo: 'solida' }; }
// Un pedazo de puente o plataforma flotante (con fragil: true, se derrumba si te quedás encima)
function puente(x, ancho, altura = 0, fragil = false) { return { x, y: PISO - altura, ancho, alto: 30, tipo: 'solida', fragil }; }

// ------------------------------------------------------------
//  ZONA DE PRÁCTICA (el escenario de prueba; no se guarda nada)
// ------------------------------------------------------------
const NIVEL_PRUEBA = {
  id: 'practica',
  nombre: 'Zona de práctica',
  tema: 'prueba',
  ancho: 4200,
  alto: 900,
  inicio: { x: 120, y: PISO },   // dónde aparece: "y" es donde apoya los pies
  cofres: [{ x: 300 }, { x: 2530, altura: 130 }, { x: 3600, dorado: true }],

  plataformas: [
    // --- El piso, con pozos entre los pedazos ---
    { x: 0,    y: PISO, ancho: 1100, alto: 80, tipo: 'solida' },
    { x: 1250, y: PISO, ancho: 850,  alto: 80, tipo: 'solida' },
    { x: 2300, y: PISO, ancho: 1000, alto: 80, tipo: 'solida' },
    { x: 3450, y: PISO, ancho: 750,  alto: 80, tipo: 'solida' },

    // --- Cajas para practicar saltos ---
    { x: 480, y: PISO - 70,  ancho: 80, alto: 70,  tipo: 'solida' },
    { x: 640, y: PISO - 140, ancho: 80, alto: 140, tipo: 'solida' },

    // --- Plataformas finas (celestes): se atraviesan desde abajo ---
    { x: 800,  y: PISO - 230, ancho: 200, alto: 14, tipo: 'fina' },
    { x: 1080, y: PISO - 330, ancho: 200, alto: 14, tipo: 'fina' },
    { x: 1360, y: PISO - 250, ancho: 180, alto: 14, tipo: 'fina' },

    // --- Una pared baja ---
    { x: 1750, y: PISO - 110, ancho: 60, alto: 110, tipo: 'solida' },

    // --- Ayuda para cruzar el pozo grande ---
    { x: 2140, y: PISO - 120, ancho: 120, alto: 14, tipo: 'fina' },

    // --- La torre: para probar la cámara hacia arriba ---
    { x: 2450, y: PISO - 130, ancho: 160, alto: 14, tipo: 'fina' },
    { x: 2680, y: PISO - 250, ancho: 160, alto: 14, tipo: 'fina' },
    { x: 2450, y: PISO - 370, ancho: 160, alto: 14, tipo: 'fina' },
    { x: 2680, y: PISO - 490, ancho: 160, alto: 14, tipo: 'fina' },
    { x: 2900, y: PISO - 600, ancho: 260, alto: 24, tipo: 'solida' },

    // --- Pasillo con techo bajo ---
    { x: 3600, y: PISO - 150, ancho: 320, alto: 50, tipo: 'solida' },

    // --- Pared del final ---
    { x: 4160, y: 0, ancho: 40, alto: PISO, tipo: 'solida' },
  ],

  // Enemigos: "y" es donde apoyan los pies; "patrulla" es cuánto caminan para cada lado
  enemigos: [
    { tipo: 'muneco',  x: 1480, y: PISO },
    { tipo: 'recluta', x: 1960, y: PISO, patrulla: 80 },
    { tipo: 'recluta', x: 2600, y: PISO, patrulla: 150 },
    { tipo: 'dron',    x: 3000, y: PISO, patrulla: 150 },
    { tipo: 'recluta', x: 3100, y: PISO, patrulla: 120 },
    { tipo: 'recluta', x: 3800, y: PISO, patrulla: 150 },
  ],

  carteles: [
    { x: 150,  y: PISO, texto: '{mover} moverte · {saltar} saltar · {ataque} {hab1} {hab2} atacar' },
    { x: 440,  y: PISO, texto: 'Mantené {saltar} para saltar más alto' },
    { x: 930,  y: PISO, texto: 'Lo celeste se atraviesa desde abajo · {bajar} para bajar' },
    { x: 1450, y: PISO, texto: 'Muñeco de práctica: {ataque} {ataque} {ataque}, {hab1} y {hab2}' },
    { x: 1950, y: PISO, texto: 'Pozo grande: corré y saltá' },
    { x: 2380, y: PISO, texto: 'Subí a la torre' },
    { x: 3030, y: PISO - 600, texto: '¡Llegaste arriba!' },
    { x: 3500, y: PISO, texto: 'Techo bajo: probá saltar' },
    { x: 4060, y: PISO, texto: 'Fin · ESC: volver al menú' },
  ],
};

// ------------------------------------------------------------
//  ACTO 1 · NIVEL 1: "SUJETO CERO"
//  El laboratorio clandestino, destruido después de que Jax se inyectó el suero.
// ------------------------------------------------------------
const NIVEL_1 = {
  id: 'nivel1',
  nombre: 'Sujeto Cero',
  acto: 'Acto 1 · Nivel 1',
  tema: 'laboratorio',
  musica: 'acto1',
  escena: 'intro',          // la escena de historia que se ve antes de empezar
  ancho: 5300,
  alto: 900,
  inicio: { x: 170, y: PISO },

  plataformas: [
    // Piso, con dos pozos (de 1650 a 1800 y de 3050 a 3200)
    { x: 0,    y: PISO, ancho: 1650, alto: 80, tipo: 'solida' },
    { x: 1800, y: PISO, ancho: 1250, alto: 80, tipo: 'solida' },
    { x: 3200, y: PISO, ancho: 2100, alto: 80, tipo: 'solida' },

    // Cajas del principio, como escalones
    { x: 560, y: PISO - 60,  ancho: 70, alto: 60,  tipo: 'solida' },
    { x: 760, y: PISO - 60,  ancho: 70, alto: 60,  tipo: 'solida' },
    { x: 830, y: PISO - 120, ancho: 70, alto: 120, tipo: 'solida' },

    // Pasarela sobre el primer pozo
    { x: 1610, y: PISO - 140, ancho: 230, alto: 14, tipo: 'fina' },

    // Pasarelas altas, con un inyector arriba de todo
    { x: 1950, y: PISO - 150, ancho: 200, alto: 14, tipo: 'fina' },
    { x: 2200, y: PISO - 260, ancho: 150, alto: 20, tipo: 'solida' },

    // Una caja en la zona de los reclutas
    { x: 2780, y: PISO - 50, ancho: 60, alto: 50, tipo: 'solida' },

    // Bloque alto con un recluta arriba
    { x: 3450, y: PISO - 120, ancho: 200, alto: 120, tipo: 'solida' },

    // Pared del final (ahí está la salida)
    { x: 5240, y: 0, ancho: 60, alto: PISO, tipo: 'solida' },
  ],

  enemigos: [
    { tipo: 'muneco',  x: 1150, y: PISO },
    { tipo: 'recluta', x: 2650, y: PISO, patrulla: 100 },
    { tipo: 'recluta', x: 2920, y: PISO, patrulla: 90 },
    { tipo: 'dron',    x: 3330, y: PISO, patrulla: 200 },
    { tipo: 'recluta', x: 3540, y: PISO - 120, patrulla: 60 },
    { tipo: 'dron',    x: 4150, y: PISO, patrulla: 150 },
    { tipo: 'recluta', x: 4260, y: PISO, patrulla: 80 },
    { tipo: 'mech01',  x: 5000, y: PISO, mirando: -1 },
  ],

  // Terminales de Genesis: al pasar cerca se activan y guardan la partida
  checkpoints: [
    { x: 2420, y: PISO },
    { x: 3900, y: PISO },
    { x: 4420, y: PISO },
  ],

  // Inyectores verdes para agarrar
  // Cofres de suministros: balas, núcleos y a veces un inyector (el dorado da mucho más)
  cofres: [{ x: 1300 }, { x: 2320, altura: 260, dorado: true }, { x: 3550, altura: 120 }, { x: 4150 }],

  objetos: [
    { tipo: 'archivo', id: 'a1', x: 1700, y: PISO - 140 },   // archivo secreto
    { tipo: 'inyector', x: 2270, y: PISO - 260 },
    { tipo: 'inyector', x: 3780, y: PISO },
    { tipo: 'inyector', x: 4360, y: PISO },
  ],

  // La sala del jefe: al pasar "activarEn", se cierra una puerta detrás
  arena: {
    puertaX: 4480,
    activarEn: 4600,
    hasta: 5240,
    radio: '¡Es el Infiltrador Mech-01! Su escudo frena los golpes de frente: pegale por la espalda, rompé su guardia con el 3er golpe del combo… o esperá a que ataque: después queda abierto.',
    radioFinal: '¡Lo lograste, Jax! La salida está abierta. Vamos: la ciudad nos espera.',
  },
  // Después de derrotar al jefe, se abre la salida
  salida: { x: 5150 },

  carteles: [
    { x: 330,  y: PISO, texto: '{mover} moverte · {saltar} saltar (mantené = más alto)' },
    { x: 1000, y: PISO, texto: 'Maniquí de entrenamiento: {ataque} golpe · 3 seguidos = combo' },
    { x: 1360, y: PISO, texto: '{hab1} Onda Sísmica · {hab2} Embestida · {definitiva} Furia' },
    { x: 1930, y: PISO, texto: 'Lo celeste se atraviesa desde abajo · {bajar} para bajar' },
    { x: 3330, y: PISO, texto: 'Saltá y golpeá a los drones' },
  ],

  // Lo que dice Elena (en el Modo 1, por radio). Aparece cuando Jax pasa por "x".
  // "solo" es para el Modo 1 y "juntos" para los Modos 2 y 3; si no hay, se usa "texto".
  radio: [
    { x: 0, texto: 'Jax… ¿me escuchás? Soy la Dra. Elena Vane. El suero Némesis funcionó, pero la explosión destruyó el laboratorio.' },
    { x: 420,
      solo: 'Tenemos que salir antes de que llegue Genesis. Seguí hacia la derecha: te guío desde la sala de control.',
      juntos: 'Tenemos que salir antes de que llegue Genesis. Seguime: conozco la salida.' },
    { x: 960, texto: 'Ese suero te dio una fuerza enorme. Probala con el maniquí de entrenamiento.' },
    { x: 1150, texto: '¡Jax! En el laboratorio había un Pulsor y te lo pasé. Con {disparar} disparás (mantené para seguir). Tiene pocas balas: los enemigos sueltan más, y los cofres también. ¡Pegale a ese cofre para abrirlo!' },
    { x: 1900, texto: 'El Pulsor tiene un chip que aprende: cuantos más enemigos derrotes, más sube de nivel. Mirá la rayita debajo del ícono del arma.' },
    { x: 1500,
      solo: 'La barra violeta es tu degradación celular: si llega al 100 %, el suero te lastima. Los inyectores verdes la bajan.',
      juntos: 'La barra violeta es tu degradación celular: si llega al 100 %, el suero te lastima. Mis dardos te la bajan.' },
    { x: 2360, texto: 'Esa terminal guarda tu progreso. Si caés, volvés desde la última que activaste.' },
    { x: 2520, texto: '¡Reclutas de Genesis! Cuando levantan la porra y saltan chispas, van a pegar: adelantate o alejate.' },
    { x: 3120, texto: 'Un dron de vigilancia: si te ve, avisa a los reclutas. Saltá y golpealo, o esperá a que baje después de disparar.' },
    { x: 4330, texto: 'Detrás de esa puerta hay algo grande. Respirá hondo, Jax.' },
  ],

  // Cosas de adorno (no chocan)
  decoracion: [
    { tipo: 'capsula', x: 110 },
    { tipo: 'consola', x: 690 },
    { tipo: 'logo', x: 1500, y: PISO - 230 },
    { tipo: 'tanque', x: 2000 },
    { tipo: 'tanque', x: 2090, roto: true },
    { tipo: 'consola', x: 3300 },
    { tipo: 'tanque', x: 3980 },
    { tipo: 'logo', x: 4300, y: PISO - 240 },
    { tipo: 'logo', x: 4880, y: PISO - 320 },
  ],
};

// Todos los niveles de la historia, en orden.
// Los niveles 2 a 9 están en niveles-acto1.js, niveles-acto2.js y niveles-acto3.js:
// cada archivo los agrega a esta lista con NIVELES.nivel2 = { ... }
const NIVELES = { nivel1: NIVEL_1 };
const ORDEN_DE_NIVELES = ['nivel1', 'nivel2', 'nivel3', 'nivel4', 'nivel5', 'nivel6', 'nivel7', 'nivel8', 'nivel9'];

// Una copia del nivel para jugar: así las puertas que se cierran no cambian los datos originales
function prepararNivel(datos) {
  return {
    checkpoints: [], objetos: [], radio: [], decoracion: [], carteles: [], enemigos: [], trampas: [], emboscadas: [],
    ...datos,
    plataformas: datos.plataformas.map((p) => ({ ...p })),
  };
}
