// ============================================================
//  PANTALLAS: título, menús, prueba de controles y ayudas
// ============================================================

const FUENTE = '"Segoe UI", system-ui, sans-serif';

const COLORES = {
  blanco: '#f4f6fb',
  texto: '#cfd6e4',
  apagado: '#5b6578',
  naranja: '#ff7a2f',
  celeste: '#5fd4ff',
  rojo: '#ff5a6a',
  verde: '#7dff5a',
};

// Cada personaje tiene su color en etiquetas, flechas y textos
const COLOR_PERSONAJE = { jax: COLORES.naranja, elena: COLORES.celeste };

// Escribe un texto con un solo llamado
function texto(ctx, contenido, x, y, opciones = {}) {
  const { tamano = 16, color = COLORES.texto, alinear = 'center', negrita = false } = opciones;
  ctx.font = `${negrita ? 'bold ' : ''}${tamano}px ${FUENTE}`;
  ctx.fillStyle = color;
  ctx.textAlign = alinear;
  ctx.textBaseline = 'middle';
  ctx.fillText(contenido, x, y);
}

// Recuadro que marca la opción elegida en los menús
function dibujarResaltado(ctx, x, y, ancho, alto) {
  ctx.fillStyle = 'rgba(255, 122, 47, 0.12)';
  ctx.fillRect(x, y, ancho, alto);
  ctx.strokeStyle = COLORES.naranja;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, ancho - 1, alto - 1);
}

// ---------- Avisos: mensajes cortos que aparecen abajo unos segundos ----------

const avisos = [];

function avisar(contenido) {
  avisos.push({ contenido, tiempo: 3 });
  if (avisos.length > 3) avisos.shift();
}

function actualizarAvisos(dt) {
  for (const aviso of avisos) aviso.tiempo -= dt;
  while (avisos.length > 0 && avisos[0].tiempo <= 0) avisos.shift();
}

function dibujarAvisos(ctx) {
  ctx.font = `15px ${FUENTE}`;
  avisos.forEach((aviso, i) => {
    const abajoOcupado = Juego.estado === 'jugando' && (jefeEnPantalla() || (Juego.persecucion && !Juego.persecucion.termino));
    const base = abajoOcupado ? ALTO - 84 : ALTO - 44;   // arriba de la barra del jefe (o de la persecución)
    const y = base - (avisos.length - 1 - i) * 38;
    const ancho = ctx.measureText(aviso.contenido).width + 32;
    ctx.globalAlpha = Math.min(1, aviso.tiempo * 2);   // se desvanece al final
    ctx.fillStyle = 'rgba(8, 16, 30, 0.95)';
    ctx.fillRect(ANCHO / 2 - ancho / 2, y - 15, ancho, 30);
    ctx.strokeStyle = COLORES.celeste;
    ctx.strokeRect(ANCHO / 2 - ancho / 2 + 0.5, y - 14.5, ancho - 1, 29);
    texto(ctx, aviso.contenido, ANCHO / 2, y, { tamano: 15 });
  });
  ctx.globalAlpha = 1;
}

// ---------- Fondo de los menús: chispas que suben, como la energía del suero ----------

function dibujarFondoMenu(ctx, tiempo) {
  ctx.fillStyle = '#04060b';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  for (let i = 0; i < 50; i++) {
    const x = azar(i) * ANCHO;
    const velocidad = 20 + azar(i + 50) * 40;
    const y = ALTO - ((tiempo * velocidad + azar(i + 99) * ALTO) % (ALTO + 20));
    ctx.fillStyle = `rgba(255, 110, 40, ${0.15 + azar(i + 7) * 0.45})`;
    ctx.fillRect(x, y, 2, 2);
  }
}

function dibujarPie(ctx, contenido) {
  texto(ctx, contenido, ANCHO / 2, ALTO - 18, { tamano: 13, color: COLORES.apagado });
}

// ============================================================
//  TÍTULO
// ============================================================

function actualizarTitulo(menu) {
  if (menu.aceptar) {
    opcionMenu = 0;
    Musica.tocar('menu');
    Juego.estado = 'menu';
  }
}

function dibujarTitulo(ctx) {
  const t = Juego.tiempo;
  dibujarFondoMenu(ctx, t);

  // Zephyrus en la sombra, a la derecha, y Jax con los puños brillando, a la izquierda
  ctx.save();
  ctx.globalAlpha = 0.55;
  dibujarSprite(ctx, 'zephyrus-brazos', 790, 560, 400, { mirando: -1, tinte: { color: '#1a0a2a', fuerza: 0.45 } });
  ctx.restore();
  const brillo = ctx.createRadialGradient(175, 300, 10, 175, 300, 220);
  brillo.addColorStop(0, `rgba(255, 100, 30, ${0.25 + Math.sin(t * 2) * 0.08})`);
  brillo.addColorStop(1, 'rgba(255, 100, 30, 0)');
  ctx.fillStyle = brillo;
  ctx.fillRect(0, 60, 400, 480);
  dibujarSprite(ctx, 'jax-pelea', 175, 540, 380, { estirarY: 1 + Math.sin(t * 3) * 0.008 });

  ctx.save();
  ctx.shadowColor = '#ff4d00';
  ctx.shadowBlur = 24;
  texto(ctx, 'REMANENTE', ANCHO / 2, 190, { tamano: 76, negrita: true, color: COLORES.blanco });
  texto(ctx, '5 AÑOS', ANCHO / 2, 256, { tamano: 40, negrita: true, color: COLORES.naranja });
  ctx.restore();

  // Texto que parpadea
  if (Math.floor(t * 2) % 2 === 0) {
    texto(ctx, 'Apretá ENTER (o A en el mando) para empezar', ANCHO / 2, 380, { tamano: 20 });
  }
  dibujarPie(ctx, 'Versión completa · 3 actos · 10 niveles · 7 jefes · 3 finales · solo local');
}

// Una lista de opciones con la elegida resaltada (la usan varios menús)
function dibujarListaDeOpciones(ctx, titulos, elegida, yInicial, separacion = 56) {
  titulos.forEach((titulo, i) => {
    const y = yInicial + i * separacion;
    const esLaElegida = i === elegida;
    if (esLaElegida) dibujarResaltado(ctx, ANCHO / 2 - 230, y - 22, 460, 44);
    texto(ctx, titulo, ANCHO / 2, y, {
      tamano: 22, negrita: esLaElegida, color: esLaElegida ? COLORES.blanco : COLORES.apagado,
    });
  });
}

function moverOpcion(opcion, total, menu) {
  if (menu.arriba) return (opcion + total - 1) % total;
  if (menu.abajo) return (opcion + 1) % total;
  return opcion;
}

// ============================================================
//  MENÚ PRINCIPAL
// ============================================================

const MODOS = [
  { titulo: 'Modo 1: Jax Solo', descripcion: 'Controlás solo a Jax. Elena te ayuda por radio. Tenés una mochila con inyectores.' },
  { titulo: 'Modo 2: Acompañado', descripcion: 'Controlás a Jax y la computadora maneja a Elena. Con TAB cambiás de personaje.' },
  { titulo: 'Modo 3: Co-op 2 Jugadores', descripcion: 'Uno maneja a Jax y otro a Elena, en la misma pantalla.' },
];

let opcionMenu = 0;

// Las opciones cambian según si hay partidas guardadas
function opcionesMenu() {
  const reciente = partidaMasReciente();
  const opciones = [];
  if (reciente) {
    opciones.push({ titulo: 'Continuar', accion: 'continuar', descripcion: `Ranura ${reciente.ranura} · ${resumenDePartida(reciente)}` });
  }
  opciones.push({ titulo: 'Nueva partida', accion: 'nueva', descripcion: 'Empezá la historia desde el principio.' });
  if (reciente) {
    opciones.push({ titulo: 'Cargar partida', accion: 'cargar', descripcion: 'Elegí una partida guardada (o exportala / importala a un archivo).' });
    opciones.push({ titulo: 'Taller de Elena', accion: 'taller', descripcion: `Mejorá a Jax y a Elena con núcleos de energía (tenés ${reciente.nucleos || 0}).` });
    opciones.push({ titulo: 'Archivos secretos', accion: 'archivos', descripcion: `Leé los secretos de Genesis que encontraste (${reciente.archivos.length} de ${ARCHIVOS.length}).` });
  }
  opciones.push({ titulo: 'Zona de práctica', accion: 'practica', descripcion: 'El escenario de prueba, con el muñeco. No se guarda nada.' });
  opciones.push({ titulo: 'Probar controles', accion: 'prueba', descripcion: 'Mirá qué teclas y botones detecta el juego.' });
  return opciones;
}

function actualizarMenu(menu) {
  const opciones = opcionesMenu();
  opcionMenu = moverOpcion(Math.min(opcionMenu, opciones.length - 1), opciones.length, menu);
  if (menu.volver) Juego.estado = 'titulo';
  if (!menu.aceptar) return;

  const accion = opciones[opcionMenu].accion;
  if (accion === 'continuar') {
    jugarPartidaGuardada(partidaMasReciente());
  } else if (accion === 'nueva' || accion === 'cargar') {
    abrirRanuras(accion);
  } else if (accion === 'practica') {
    Juego.destino = 'practica';
    Juego.partida = null;
    abrirModos();
  } else if (accion === 'prueba') {
    tiempoSalirPrueba = 0;
    Juego.estado = 'prueba';
  } else if (accion === 'taller') {
    Juego.partida = partidaMasReciente();
    abrirTaller(() => { Juego.estado = 'menu'; });
  } else if (accion === 'archivos') {
    abrirArchivos();
  }
}

function dibujarMenu(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  texto(ctx, 'REMANENTE · 5 AÑOS', ANCHO / 2, 64, { tamano: 30, negrita: true, color: COLORES.blanco });
  const opciones = opcionesMenu();
  const elegida = Math.min(opcionMenu, opciones.length - 1);
  dibujarListaDeOpciones(ctx, opciones.map((o) => o.titulo), elegida, 118, 42);
  texto(ctx, opciones[elegida].descripcion, ANCHO / 2, 420, { tamano: 15 });
  dibujarListaMandos(ctx, 450);
  dibujarPie(ctx, '↑↓ elegir · ENTER o A aceptar · ESC o B volver');
}

function jugarPartidaGuardada(partida) {
  Juego.destino = 'historia';
  Juego.partida = partida;
  Juego.modo = partida.modo;
  opcionControles = 0;
  Juego.estado = 'controles';
}

// ============================================================
//  RANURAS DE GUARDADO
// ============================================================

let opcionRanura = 0;
let confirmacionPendiente = '';   // las acciones peligrosas se confirman apretando dos veces
let tiempoConfirmacion = 0;

function abrirRanuras(accion) {
  Juego.accionRanuras = accion;   // 'nueva' o 'cargar'
  opcionRanura = 0;
  confirmacionPendiente = '';
  Juego.estado = 'ranuras';
}

function confirmar(clave, mensaje) {
  if (confirmacionPendiente === clave) {
    confirmacionPendiente = '';
    return true;
  }
  confirmacionPendiente = clave;
  tiempoConfirmacion = 3;
  avisar(mensaje);
  return false;
}

function actualizarRanuras(menu, dt) {
  const total = CANTIDAD_DE_RANURAS + 1;   // las ranuras y "Volver"
  opcionRanura = moverOpcion(opcionRanura, total, menu);
  tiempoConfirmacion = Math.max(0, tiempoConfirmacion - dt);
  if (tiempoConfirmacion <= 0) confirmacionPendiente = '';

  const enVolver = opcionRanura === CANTIDAD_DE_RANURAS;
  if (menu.volver || (menu.aceptar && enVolver)) {
    Juego.estado = 'menu';
    return;
  }
  if (enVolver) return;

  const numero = opcionRanura + 1;
  const partida = leerRanura(numero);
  if (Entrada.seAcabaDeApretar('KeyE')) exportarRanura(numero);
  if (Entrada.seAcabaDeApretar('KeyI')) importarEnRanura(numero);
  if (Entrada.seAcabaDeApretar('Delete') && partida &&
      confirmar(`borrar${numero}`, `¿Borrar la ranura ${numero}? Apretá SUPR otra vez`)) {
    borrarRanura(numero);
    avisar(`Ranura ${numero} borrada`);
  }

  if (!menu.aceptar) return;
  if (Juego.accionRanuras === 'cargar') {
    if (partida) jugarPartidaGuardada(partida);
    else avisar('Esa ranura está vacía');
  } else if (!partida || confirmar(`pisar${numero}`, `La ranura ${numero} tiene una partida: apretá ENTER otra vez para reemplazarla`)) {
    Juego.destino = 'historia';
    Juego.ranuraNueva = numero;
    abrirModos();
  }
}

function dibujarRanuras(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  const titulo = Juego.accionRanuras === 'nueva' ? 'Nueva partida: elegí una ranura' : 'Cargar partida';
  texto(ctx, titulo, ANCHO / 2, 60, { tamano: 26, negrita: true, color: COLORES.blanco });

  for (let i = 0; i <= CANTIDAD_DE_RANURAS; i++) {
    const y = 140 + i * 74;
    const elegida = i === opcionRanura;
    if (i === CANTIDAD_DE_RANURAS) {
      dibujarListaDeOpciones(ctx, ['Volver'], elegida ? 0 : -1, y);
      continue;
    }
    if (elegida) dibujarResaltado(ctx, ANCHO / 2 - 330, y - 30, 660, 60);
    const partida = leerRanura(i + 1);
    texto(ctx, `Ranura ${i + 1}`, ANCHO / 2 - 310, y - 10, { alinear: 'left', negrita: true, color: elegida ? COLORES.blanco : COLORES.texto });
    texto(ctx, partida ? resumenDePartida(partida) : 'Vacía', ANCHO / 2 - 310, y + 12, {
      alinear: 'left', tamano: 13, color: partida ? COLORES.verde : COLORES.apagado,
    });
  }
  texto(ctx, 'Las partidas se guardan en este navegador, en esta PC.', ANCHO / 2, ALTO - 50, { tamano: 13, color: COLORES.apagado });
  dibujarPie(ctx, 'ENTER elegir · E exportar a un archivo · I importar · SUPR borrar · ESC volver');
}

// ============================================================
//  ELEGIR EL MODO
// ============================================================

let opcionModo = 0;

function abrirModos() {
  opcionModo = Juego.modo - 1;
  Juego.estado = 'modos';
}

function actualizarModos(menu) {
  opcionModo = moverOpcion(opcionModo, MODOS.length + 1, menu);
  const enVolver = opcionModo === MODOS.length;
  if (menu.volver || (menu.aceptar && enVolver)) {
    Juego.estado = Juego.destino === 'historia' ? 'ranuras' : 'menu';
    return;
  }
  if (!menu.aceptar) return;

  Juego.modo = opcionModo + 1;
  if (Juego.destino === 'historia') {
    // Arranca una partida nueva en la ranura elegida y se guarda enseguida
    Juego.partida = partidaNueva(Juego.ranuraNueva, Juego.modo);
    guardarPartida();
  }
  opcionControles = 0;
  Juego.estado = 'controles';
}

function dibujarModos(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  const titulo = Juego.destino === 'historia' ? `Ranura ${Juego.ranuraNueva}: ¿cómo vas a jugar?` : 'Zona de práctica: ¿cómo vas a jugar?';
  texto(ctx, titulo, ANCHO / 2, 64, { tamano: 26, negrita: true, color: COLORES.blanco });
  dibujarListaDeOpciones(ctx, [...MODOS.map((m) => m.titulo), 'Volver'], opcionModo, 150);
  if (opcionModo < MODOS.length) texto(ctx, MODOS[opcionModo].descripcion, ANCHO / 2, 400, { tamano: 15 });
  dibujarListaMandos(ctx, 440);
  dibujarPie(ctx, '↑↓ elegir · ENTER o A aceptar · ESC o B volver');
}

function dibujarListaMandos(ctx, y) {
  const lista = Entrada.mandos.map((m, i) => `Mando ${i + 1}: ${m.nombre}`).join('   ·   ');
  texto(ctx, lista || 'Sin mandos · Conectá uno y apretá cualquier botón', ANCHO / 2, y, {
    tamano: 13, color: lista ? COLORES.verde : COLORES.apagado,
  });
}

// ============================================================
//  CONTROLES: qué usa cada jugador
// ============================================================

const OPCIONES_J1 = ['teclado', 'mando1'];
const OPCIONES_J2 = ['teclado', 'mando1', 'mando2'];
let opcionControles = 0;

// Las filas que se ven: el Jugador 2 solo aparece en el Modo 3
function filasControles() {
  return Juego.modo === 3 ? ['j1', 'j2', 'empezar', 'volver'] : ['j1', 'empezar', 'volver'];
}

// Si algo impide empezar, devuelve el motivo
function problemaDeControles() {
  const { j1, j2 } = Juego.dispositivos;
  const usados = Juego.modo === 3 ? [j1, j2] : [j1];
  for (const dispositivo of usados) {
    if (dispositivo !== 'teclado' && !mandoDe(dispositivo)) {
      return `El ${nombreDispositivo(dispositivo)} no está conectado`;
    }
  }
  if (Juego.modo === 3 && j1 === j2 && j1 !== 'teclado') {
    return 'Los dos jugadores no pueden usar el mismo mando';
  }
  return '';
}

function actualizarControles(menu) {
  const filas = filasControles();
  if (menu.arriba) opcionControles = (opcionControles + filas.length - 1) % filas.length;
  if (menu.abajo) opcionControles = (opcionControles + 1) % filas.length;
  const fila = filas[opcionControles];

  if (fila === 'j1' || fila === 'j2') {
    const opciones = fila === 'j1' ? OPCIONES_J1 : OPCIONES_J2;
    let i = opciones.indexOf(Juego.dispositivos[fila]);
    if (menu.izquierda) i = (i + opciones.length - 1) % opciones.length;
    if (menu.derecha || menu.aceptar) i = (i + 1) % opciones.length;
    Juego.dispositivos[fila] = opciones[i];
  }

  if (menu.volver || (menu.aceptar && fila === 'volver')) Juego.estado = 'menu';

  if (menu.aceptar && fila === 'empezar') {
    const problema = problemaDeControles();
    if (problema) avisar(problema);
    else empezarNivel({ reiniciarEstadisticas: true });
  }
}

function detalleDispositivo(dispositivo, jugador) {
  if (dispositivo === 'teclado') return resumenControles(dispositivo, jugador);
  const mando = mandoDe(dispositivo);
  return mando ? `${mando.nombre} · ${resumenControles(dispositivo, jugador)}`
               : 'No conectado: conectalo y apretá cualquier botón';
}

function dibujarControles(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  texto(ctx, `Controles · ${MODOS[Juego.modo - 1].titulo}`, ANCHO / 2, 60, {
    tamano: 26, negrita: true, color: COLORES.blanco,
  });

  const filas = filasControles();
  filas.forEach((fila, i) => {
    const y = 140 + i * 70;
    const elegida = i === opcionControles;
    if (elegida) dibujarResaltado(ctx, ANCHO / 2 - 300, y - 28, 600, 56);

    if (fila === 'j1' || fila === 'j2') {
      const quien = fila === 'j1' ? 'Jugador 1 · Jax' : 'Jugador 2 · Elena';
      const dispositivo = Juego.dispositivos[fila];
      texto(ctx, quien, ANCHO / 2 - 280, y - 9, {
        alinear: 'left', negrita: true, color: fila === 'j1' ? COLORES.naranja : COLORES.celeste,
      });
      texto(ctx, `◀  ${nombreDispositivo(dispositivo)}  ▶`, ANCHO / 2 + 180, y - 9, {
        tamano: 18, color: COLORES.blanco,
      });
      texto(ctx, detalleDispositivo(dispositivo, fila), ANCHO / 2 - 280, y + 14, {
        alinear: 'left', tamano: 13, color: COLORES.apagado,
      });
    } else {
      texto(ctx, fila === 'empezar' ? '¡Empezar!' : 'Volver', ANCHO / 2, y, {
        tamano: 20, negrita: elegida, color: elegida ? COLORES.blanco : COLORES.apagado,
      });
    }
  });

  const yInfo = 140 + filas.length * 70;
  const problema = problemaDeControles();
  const { j1, j2 } = Juego.dispositivos;
  if (problema) {
    texto(ctx, problema, ANCHO / 2, yInfo, { color: COLORES.rojo });
  } else if (Juego.modo === 3 && j1 === 'teclado' && j2 === 'teclado') {
    texto(ctx, 'Consejo: de a dos se juega más cómodo si al menos uno usa mando', ANCHO / 2, yInfo, {
      tamano: 14, color: COLORES.apagado,
    });
  }
  dibujarListaMandos(ctx, yInfo + 34);
  dibujarPie(ctx, '↑↓ elegir · ←→ cambiar · ENTER o A aceptar · ESC o B volver');
}

// ============================================================
//  PRUEBA DE CONTROLES
// ============================================================

let tiempoSalirPrueba = 0;   // cuánto tiempo se viene manteniendo B

function actualizarPrueba(dt) {
  if (Entrada.seAcabaDeApretar('Escape')) {
    Juego.estado = 'menu';
    return;
  }
  // En el mando hay que MANTENER B un segundo, así se puede probar B sin salir
  const manteniendoB = Entrada.mandos.some((m) => m.botones[BOTON.ESTE]);
  tiempoSalirPrueba = manteniendoB ? tiempoSalirPrueba + dt : 0;
  if (tiempoSalirPrueba >= 1) {
    tiempoSalirPrueba = 0;
    Juego.estado = 'menu';
  }
}

function dibujarPrueba(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  texto(ctx, 'Probar controles', ANCHO / 2, 40, { tamano: 26, negrita: true, color: COLORES.blanco });

  const teclas = [...Entrada.apretadas];
  texto(ctx, 'Teclado', 90, 90, { alinear: 'left', negrita: true, color: COLORES.naranja });
  texto(ctx, `Última tecla: ${Entrada.ultimaTecla || '(ninguna)'}`, 90, 116, { alinear: 'left' });
  texto(ctx, `Apretadas ahora: ${teclas.length ? teclas.join(', ') : '(ninguna)'}`, 90, 140, { alinear: 'left' });

  if (Entrada.mandos.length === 0) {
    texto(ctx, 'No hay mandos. Conectá uno y apretá cualquier botón.', ANCHO / 2, 300, { color: COLORES.apagado });
  }
  Entrada.mandos.slice(0, 2).forEach((mando, i) => dibujarMandoPrueba(ctx, mando, i, 90 + i * 420, 230));

  dibujarPie(ctx, 'ESC o mantené B / ○ para volver');
  if (tiempoSalirPrueba > 0) {
    ctx.fillStyle = COLORES.naranja;
    ctx.fillRect(ANCHO / 2 - 100, ALTO - 34, 200 * Math.min(1, tiempoSalirPrueba), 4);
  }
}

// Un dibujo del mando: cada botón se pinta de naranja mientras está apretado
function dibujarMandoPrueba(ctx, mando, numero, x, y) {
  const nombres = NOMBRES_BOTONES[mando.tipo];
  const b = mando.botones;
  const relleno = (apretado) => (apretado ? COLORES.naranja : '#1d2638');

  // Gatillos: se llenan según cuánto se aprietan
  for (const [indice, gx] of [[BOTON.L2, x + 30], [BOTON.R2, x + 240]]) {
    ctx.fillStyle = '#1d2638';
    ctx.fillRect(gx, y - 44, 90, 14);
    ctx.fillStyle = COLORES.naranja;
    ctx.fillRect(gx, y - 44, 90 * (mando.valores[indice] || 0), 14);
    texto(ctx, nombres[indice], gx + 45, y - 37, { tamano: 11, color: COLORES.blanco });
  }
  // Botones de arriba
  for (const [indice, bx] of [[BOTON.L1, x + 30], [BOTON.R1, x + 240]]) {
    ctx.fillStyle = relleno(b[indice]);
    ctx.fillRect(bx, y - 24, 90, 16);
    texto(ctx, nombres[indice], bx + 45, y - 16, { tamano: 11, color: COLORES.blanco });
  }

  // Cuerpo del mando
  ctx.fillStyle = '#121a2a';
  ctx.strokeStyle = '#2f3b55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, 360, 180, 40);
  ctx.fill();
  ctx.stroke();

  // Sticks
  dibujarStick(ctx, x + 80, y + 60, mando.ejes[0], mando.ejes[1], b[10]);
  dibujarStick(ctx, x + 230, y + 125, mando.ejes[2], mando.ejes[3], b[11]);

  // Cruceta
  for (const [indice, dx, dy] of [[12, 0, -18], [13, 0, 18], [14, -18, 0], [15, 18, 0]]) {
    ctx.fillStyle = relleno(b[indice]);
    ctx.fillRect(x + 130 + dx - 9, y + 125 + dy - 9, 18, 18);
  }

  // Los 4 botones de la derecha
  for (const [indice, dx, dy] of [[BOTON.SUR, 0, 24], [BOTON.ESTE, 24, 0], [BOTON.OESTE, -24, 0], [BOTON.NORTE, 0, -24]]) {
    ctx.fillStyle = relleno(b[indice]);
    ctx.beginPath();
    ctx.arc(x + 285 + dx, y + 60 + dy, 12, 0, Math.PI * 2);
    ctx.fill();
    texto(ctx, nombres[indice], x + 285 + dx, y + 61 + dy, { tamano: 12, negrita: true, color: COLORES.blanco });
  }

  // Select y Start
  for (const [indice, sx] of [[BOTON.SELECT, x + 150], [BOTON.START, x + 190]]) {
    ctx.fillStyle = relleno(b[indice]);
    ctx.beginPath();
    ctx.roundRect(sx, y + 50, 22, 12, 6);
    ctx.fill();
  }

  texto(ctx, `Mando ${numero + 1}: ${mando.nombre}`, x + 180, y + 205, { tamano: 14 });
  if (!mando.estandar) {
    texto(ctx, 'Mapeo no estándar: algunos botones pueden estar cambiados', x + 180, y + 225, {
      tamano: 11, color: COLORES.rojo,
    });
  }
}

function dibujarStick(ctx, x, y, ejeX, ejeY, apretado) {
  ctx.strokeStyle = '#2f3b55';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = apretado ? COLORES.naranja : COLORES.celeste;
  ctx.beginPath();
  ctx.arc(x + (ejeX || 0) * 16, y + (ejeY || 0) * 16, 11, 0, Math.PI * 2);
  ctx.fill();
}

// ============================================================
//  DERROTA
// ============================================================

let opcionDerrota = 0;

function opcionesDerrota() {
  return [Juego.checkpoint >= 0 ? 'Reintentar desde la terminal' : 'Reintentar', 'Menú principal'];
}

function actualizarDerrota(menu) {
  if (menu.arriba || menu.abajo) opcionDerrota = 1 - opcionDerrota;
  if (!menu.aceptar) return;
  if (opcionDerrota === 0) empezarNivel({ reiniciarEstadisticas: false });
  else salirAlMenu();
}

function dibujarDerrota(ctx) {
  ctx.fillStyle = 'rgba(4, 6, 11, 0.78)';
  ctx.fillRect(0, 0, ANCHO, ALTO);

  ctx.save();
  ctx.shadowColor = '#ff3b1f';
  ctx.shadowBlur = 20;
  texto(ctx, 'JAX CAYÓ', ANCHO / 2, 170, { tamano: 60, negrita: true, color: COLORES.blanco });
  ctx.restore();
  const causas = {
    suero: 'El suero Némesis lo consumió. Usá inyectores o pedile a Elena que lo cure.',
    atrapado: '¡La Abominación X-0 los alcanzó! No pares de correr hacia la derecha.',
    golpes: 'Lo derrotaron los enemigos de Genesis. ¡Mirá sus avisos antes de que ataquen!',
  };
  const causa = causas[Juego.causaDerrota] || causas.golpes;
  texto(ctx, causa, ANCHO / 2, 230, { tamano: 17 });
  dibujarListaDeOpciones(ctx, opcionesDerrota(), opcionDerrota, 310);
  dibujarPie(ctx, '↑↓ elegir · ENTER o A aceptar');
}

// ============================================================
//  NIVEL COMPLETADO
// ============================================================

let opcionCompletado = 0;

function opcionesCompletado() {
  const opciones = [Juego.siguienteNivel ? 'Siguiente nivel' : 'Jugar el nivel de nuevo'];
  if (Juego.partida) opciones.push('Taller de Elena');
  opciones.push('Menú principal');
  return opciones;
}

function actualizarCompletado(menu) {
  const opciones = opcionesCompletado();
  opcionCompletado = moverOpcion(opcionCompletado, opciones.length, menu);
  if (!menu.aceptar) return;
  const opcion = opciones[opcionCompletado];
  if (opcion === 'Menú principal') salirAlMenu();
  else if (opcion === 'Taller de Elena') abrirTaller(() => { Juego.estado = 'completado'; });
  else empezarNivel({ reiniciarEstadisticas: true });   // la partida ya apunta al nivel que sigue
}

function dibujarCompletado(ctx) {
  ctx.fillStyle = 'rgba(4, 6, 11, 0.82)';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  const { nivel, estadisticasNivel: e } = Juego;

  ctx.save();
  ctx.shadowColor = '#7dff5a';
  ctx.shadowBlur = 20;
  texto(ctx, '¡NIVEL COMPLETADO!', ANCHO / 2, 120, { tamano: 52, negrita: true, color: COLORES.blanco });
  ctx.restore();
  texto(ctx, `${nivel.acto}: ${nivel.nombre}`, ANCHO / 2, 175, { tamano: 20, color: COLORES.naranja });

  const minutos = Math.floor(e.tiempo / 60);
  const segundos = String(Math.floor(e.tiempo % 60)).padStart(2, '0');
  texto(ctx, `Tiempo: ${minutos}:${segundos}   ·   Enemigos derrotados: ${e.enemigos}   ·   Caídas: ${e.caidas}`,
    ANCHO / 2, 225, { tamano: 16 });
  if (Juego.siguienteNivel) {
    const siguiente = NIVELES[Juego.siguienteNivel];
    texto(ctx, `Siguiente: ${siguiente.acto} · ${siguiente.nombre}`, ANCHO / 2, 262, { tamano: 15, color: COLORES.celeste });
  }
  dibujarSprite(ctx, 'jax-brazos', 120, ALTO - 10, 260);
  texto(ctx, `Mejor combo: ${Combate.combo.mejor} golpes   ·   Núcleos: ${cantidadDeNucleos()} ◆`, ANCHO / 2, 292, { tamano: 15, color: '#9fe8ff' });
  dibujarListaDeOpciones(ctx, opcionesCompletado(), opcionCompletado, 340, 50);
  dibujarPie(ctx, Juego.partida && Juego.partida.ranura ? 'Partida guardada · ↑↓ elegir · ENTER aceptar' : '↑↓ elegir · ENTER aceptar');
}

// ============================================================
//  RADIO: lo que dice Elena (letra por letra)
// ============================================================

const Radio = { cola: [], actual: null, quien: 'elena', tiempo: 0 };
const LETRAS_POR_SEGUNDO = 45;

// quien: 'elena' (casi siempre), 'jax', 'zephyrus', 'vane' o 'narrador'
function decirPorRadio(contenido, quien = 'elena') {
  Radio.cola.push({ contenido, quien });
  Sonido.radio();
}

function limpiarRadio() {
  Radio.cola = [];
  Radio.actual = null;
}

function actualizarRadio(dt) {
  if (!Radio.actual && Radio.cola.length > 0) {
    const mensaje = Radio.cola.shift();
    Radio.actual = mensaje.contenido;
    Radio.quien = mensaje.quien;
    Radio.tiempo = 0;
  }
  if (!Radio.actual) return;
  Radio.tiempo += dt;
  const escribiendo = Radio.tiempo * LETRAS_POR_SEGUNDO < Radio.actual.length;
  // ENTER muestra todo el mensaje de una, o pasa al siguiente
  if (Entrada.seAcabaDeApretar('Enter')) {
    if (escribiendo) Radio.tiempo = Radio.actual.length / LETRAS_POR_SEGUNDO;
    else Radio.actual = null;
    return;
  }
  if (Radio.tiempo > Radio.actual.length / LETRAS_POR_SEGUNDO + 3.5) Radio.actual = null;
}

// Parte un texto en renglones que entren en un ancho
function partirEnRenglones(ctx, contenido, ancho) {
  const renglones = [];
  let renglon = '';
  for (const palabra of contenido.split(' ')) {
    const prueba = renglon ? renglon + ' ' + palabra : palabra;
    if (ctx.measureText(prueba).width > ancho && renglon) {
      renglones.push(renglon);
      renglon = palabra;
    } else {
      renglon = prueba;
    }
  }
  if (renglon) renglones.push(renglon);
  return renglones;
}

// El cuadro va arriba a la derecha (en el lugar de la ayuda, que se esconde mientras Elena habla),
// así nunca tapa a los personajes. Su alto depende de cuántos renglones tenga el mensaje.
function dibujarRadio(ctx) {
  if (!Radio.actual) return;
  const x = 322;
  const ancho = ANCHO - x - 10;
  const y = 10;
  ctx.font = `14px ${FUENTE}`;
  const renglones = partirEnRenglones(ctx, Radio.actual, ancho - 70);
  const alto = Math.max(56, 26 + renglones.length * 17);

  const datos = QUIENES[Radio.quien] || QUIENES.elena;
  ctx.fillStyle = 'rgba(8, 16, 30, 0.94)';
  ctx.fillRect(x, y, ancho, alto);
  ctx.strokeStyle = datos.color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, ancho - 1, alto - 1);

  // "Foto" de quien habla
  dibujarRetrato(ctx, Radio.quien, x + 8, y + 8, 40);

  const porRadio = Radio.quien === 'elena' && Juego.modo === 1 ? ' · RADIO' : '';
  texto(ctx, `${datos.nombre}${porRadio}   (ENTER: seguir)`, x + 58, y + 13, { tamano: 11, negrita: true, alinear: 'left', color: datos.color });
  // Las letras van apareciendo de a una
  let quedan = Math.floor(Radio.tiempo * LETRAS_POR_SEGUNDO);
  renglones.forEach((renglon, i) => {
    const visible = renglon.slice(0, Math.max(0, quedan));
    quedan -= renglon.length + 1;
    texto(ctx, visible, x + 58, y + 31 + i * 17, { tamano: 14, alinear: 'left' });
  });
}

// ============================================================
//  CARTEL CON EL NOMBRE DEL NIVEL (al empezar)
// ============================================================

function dibujarTarjetaDeNivel(ctx) {
  if (!(Juego.tarjeta > 0) || !Juego.nivel.acto) return;
  const visible = Math.min(1, Juego.tarjeta, 3 - Juego.tarjeta);   // aparece y se desvanece
  ctx.save();
  ctx.globalAlpha = Math.max(0, visible);
  ctx.fillStyle = 'rgba(4, 6, 11, 0.6)';
  ctx.fillRect(0, 190, ANCHO, 120);
  texto(ctx, Juego.nivel.acto.toUpperCase(), ANCHO / 2, 225, { tamano: 16, negrita: true, color: COLORES.naranja });
  ctx.shadowColor = '#ff4d00';
  ctx.shadowBlur = 16;
  texto(ctx, Juego.nivel.nombre.toUpperCase(), ANCHO / 2, 268, { tamano: 44, negrita: true, color: COLORES.blanco });
  ctx.restore();
}

// ============================================================
//  DURANTE LA PARTIDA
// ============================================================

// "J1" y "J2" arriba de cada jugador en co-op, e "IA" arriba del que maneja la computadora en el Modo 2
function dibujarEtiquetas(ctx, alfa) {
  const etiquetas = [];
  if (Juego.modo === 3) etiquetas.push([Juego.jax, 'J1'], [Juego.elena, 'J2']);
  if (Juego.modo === 2) etiquetas.push(Juego.controlado === 'jax' ? [Juego.elena, 'IA'] : [Juego.jax, 'IA']);
  for (const [p, nombre] of etiquetas) {
    if (p.seCayo || estaParpadeando(p)) continue;
    const { x, y } = posicionDibujo(p, alfa);
    texto(ctx, nombre, x + p.ancho / 2, y - 16, { tamano: 12, negrita: true, color: COLOR_PERSONAJE[p.tipo] });
  }
}

// Si un personaje queda fuera de la pantalla, una flecha en el borde muestra dónde está
function dibujarFlechas(ctx, lista, camX, camY, alfa) {
  const margen = 24;
  for (const p of lista) {
    if (p.seCayo) continue;
    const pos = posicionDibujo(p, alfa);
    const sx = (pos.x + p.ancho / 2 - camX) * Camara.zoom;
    const sy = (pos.y + p.alto / 2 - camY) * Camara.zoom;
    const seVe = sx > -p.ancho / 2 && sx < ANCHO + p.ancho / 2 && sy > -p.alto / 2 && sy < ALTO + p.alto / 2;
    if (seVe) continue;

    const bx = Math.max(margen, Math.min(ANCHO - margen, sx));
    const by = Math.max(margen, Math.min(ALTO - margen, sy));
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(Math.atan2(sy - by, sx - bx));
    ctx.fillStyle = COLOR_PERSONAJE[p.tipo];
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, -10);
    ctx.lineTo(-8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Recuadro de ayuda arriba a la derecha (se esconde mientras Elena habla por radio)
function dibujarAyuda(ctx) {
  if (Radio.actual) return;
  const { jax, elena, modo, dispositivos } = Juego;
  const lineas = [];
  const agregar = (personaje, dispositivo, jugador) => {
    const esJax = personaje === 'jax';
    const color = esJax ? COLORES.naranja : COLORES.celeste;
    const nombre = esJax ? 'Jax' : 'Elena';
    lineas.push({ contenido: `${nombre} (${nombreDispositivo(dispositivo)}): ${resumenControles(dispositivo, jugador)}`, color });
    lineas.push({
      contenido: esJax ? resumenAtaquesJax(dispositivo, jugador, modo === 1) : resumenAtaquesElena(dispositivo, jugador),
      color,
    });
  };

  if (modo === 2) {
    agregar(Juego.controlado, dispositivos.j1, 'j1');
    const cambiar = nombresDeAtaques(dispositivos.j1, 'j1').cambiar;
    lineas.push({ contenido: `${cambiar}: cambiar de personaje (la computadora maneja al otro)`, color: COLORES.texto });
  } else {
    agregar('jax', dispositivos.j1, 'j1');
    if (modo === 3) agregar('elena', dispositivos.j2, 'j2');
  }
  lineas.push({ contenido: 'I: ocultar esta ayuda · H: ver cajas · M: sonido · ESC o Start: pausa', color: COLORES.texto });
  if (!Juego.ayudaVisible) {
    texto(ctx, 'I: ayuda', ANCHO - 14, 20, { tamano: 12, alinear: 'right', color: COLORES.apagado });
    return;
  }
  if (Juego.verCajas) {
    for (const p of [jax, elena].filter(Boolean)) {
      lineas.push({
        contenido: `${p.tipo === 'jax' ? 'Jax' : 'Elena'}  x: ${Math.round(p.x)}  y: ${Math.round(p.y)}  ` +
                   `vx: ${Math.round(p.vx)}  vy: ${Math.round(p.vy)}  en el suelo: ${p.enElSuelo ? 'sí' : 'no'}`,
        color: COLORES.verde,
      });
    }
  }

  ctx.font = `12px ${FUENTE}`;
  const ancho = Math.max(...lineas.map((l) => ctx.measureText(l.contenido).width)) + 16;
  const x = ANCHO - 10 - ancho;
  ctx.fillStyle = 'rgba(4, 6, 11, 0.65)';
  ctx.fillRect(x, 10, ancho, lineas.length * 17 + 10);
  lineas.forEach((linea, i) => {
    texto(ctx, linea.contenido, x + 8, 23 + i * 17, { tamano: 12, alinear: 'left', color: linea.color });
  });
}

// ============================================================
//  PAUSA
// ============================================================

let opcionPausa = 0;
const OPCIONES_PAUSA = ['Seguir jugando', 'Música', 'Efectos de sonido', 'Cámara', 'Ver controles', 'Salir al menú'];
const ZOOMS = [{ valor: 1, nombre: 'Lejos' }, { valor: 1.22, nombre: 'Cerca' }, { valor: 1.4, nombre: 'Muy cerca' }];
let verControlesEnPausa = false;

function abrirPausa() {
  opcionPausa = 0;
  verControlesEnPausa = false;
  Sonido.boton();
  Juego.estado = 'pausa';
}

function actualizarPausa(menu) {
  if (verControlesEnPausa) {
    if (menu.aceptar || menu.volver) verControlesEnPausa = false;
    return;
  }
  const volverAJugar = menu.volver || Entrada.seAcabaDeApretar('KeyP') ||
    Entrada.mandos.some((m) => botonRecien(m, BOTON.START));
  if (volverAJugar) {
    Juego.estado = 'jugando';
    return;
  }
  opcionPausa = moverOpcion(opcionPausa, OPCIONES_PAUSA.length, menu);
  const opcion = OPCIONES_PAUSA[opcionPausa];
  // Volumen: ← → (o ENTER para subir de a uno y dar la vuelta)
  if (opcion === 'Música' || opcion === 'Efectos de sonido') {
    const clave = opcion === 'Música' ? 'musica' : 'efectos';
    let cambio = 0;
    if (menu.izquierda) cambio = -1;
    if (menu.derecha || menu.aceptar) cambio = 1;
    if (cambio) {
      Volumenes[clave] = (Volumenes[clave] + cambio + 11) % 11;
      Sonido.aplicarVolumenes();
      Sonido.boton();
    }
    return;
  }
  if (opcion === 'Cámara' && (menu.izquierda || menu.derecha || menu.aceptar)) {
    let i = ZOOMS.findIndex((z) => z.valor === Camara.zoom);
    i = (i + (menu.izquierda ? ZOOMS.length - 1 : 1)) % ZOOMS.length;
    Camara.zoom = ZOOMS[i].valor;
    try { localStorage.setItem('remanente.zoom', String(Camara.zoom)); } catch (error) { /* no pasa nada */ }
    Camara.colocar(seguidosPorLaCamara(), Juego.nivel);
    Sonido.boton();
    return;
  }
  if (!menu.aceptar) return;
  if (opcion === 'Seguir jugando') Juego.estado = 'jugando';
  else if (opcion === 'Ver controles') verControlesEnPausa = true;
  else if (opcion === 'Salir al menú') salirAlMenu();
}

function dibujarPausa(ctx) {
  ctx.fillStyle = 'rgba(4, 6, 11, 0.8)';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  if (verControlesEnPausa) {
    dibujarControlesEnPausa(ctx);
    return;
  }
  texto(ctx, 'PAUSA', ANCHO / 2, 90, { tamano: 44, negrita: true, color: COLORES.blanco });
  if (Juego.nivel && Juego.nivel.acto) {
    texto(ctx, `${Juego.nivel.acto}: ${Juego.nivel.nombre}`, ANCHO / 2, 134, { tamano: 16, color: COLORES.naranja });
  }
  OPCIONES_PAUSA.forEach((titulo, i) => {
    const y = 186 + i * 50;
    const elegida = i === opcionPausa;
    if (elegida) dibujarResaltado(ctx, ANCHO / 2 - 230, y - 20, 460, 40);
    let contenido = titulo;
    if (titulo === 'Música') contenido = `Música   ◀ ${barraDeVolumen(Volumenes.musica)} ▶`;
    if (titulo === 'Efectos de sonido') contenido = `Efectos   ◀ ${barraDeVolumen(Volumenes.efectos)} ▶`;
    if (titulo === 'Cámara') contenido = `Cámara   ◀ ${(ZOOMS.find((z) => z.valor === Camara.zoom) || ZOOMS[1]).nombre} ▶`;
    texto(ctx, contenido, ANCHO / 2, y, { tamano: 21, negrita: elegida, color: elegida ? COLORES.blanco : COLORES.apagado });
  });
  dibujarPie(ctx, '↑↓ elegir · ←→ cambiar · ENTER aceptar · ESC o Start: seguir jugando');
}

function barraDeVolumen(valor) {
  return '■'.repeat(valor) + '□'.repeat(10 - valor);
}

function dibujarControlesEnPausa(ctx) {
  texto(ctx, 'CONTROLES', ANCHO / 2, 60, { tamano: 32, negrita: true, color: COLORES.blanco });
  const { dispositivos, modo } = Juego;
  const filas = [];
  filas.push({ t: `Jax (${nombreDispositivo(dispositivos.j1)})`, c: COLORES.naranja, n: true });
  filas.push({ t: resumenControles(dispositivos.j1, 'j1'), c: COLORES.texto });
  filas.push({ t: resumenAtaquesJax(dispositivos.j1, 'j1', modo === 1), c: COLORES.texto });
  if (modo === 2) {
    filas.push({ t: `${nombresDeAtaques(dispositivos.j1, 'j1').cambiar}: cambiar entre Jax y Elena`, c: COLORES.texto });
  }
  if (modo !== 1) {
    const jugador = modo === 3 ? 'j2' : 'j1';
    const dispositivo = modo === 3 ? dispositivos.j2 : dispositivos.j1;
    filas.push({ t: '' });
    filas.push({ t: `Elena (${modo === 3 ? nombreDispositivo(dispositivo) : 'cuando la manejás'})`, c: COLORES.celeste, n: true });
    filas.push({ t: resumenControles(dispositivo, jugador), c: COLORES.texto });
    filas.push({ t: resumenAtaquesElena(dispositivo, jugador), c: COLORES.texto });
  }
  filas.push({ t: '' });
  filas.push({ t: 'Consejos', c: COLORES.verde, n: true });
  filas.push({ t: 'Los enemigos AVISAN antes de atacar: brillan, tiemblan o apuntan con un láser.', c: COLORES.texto });
  filas.push({ t: 'El 3er golpe del combo rompe los escudos. Los jefes quedan abiertos después de atacar.', c: COLORES.texto });
  filas.push({ t: 'La Embestida contra un enemigo congelado o con plasma hace el Puño de Plasma.', c: COLORES.texto });
  filas.forEach((f, i) => texto(ctx, f.t, ANCHO / 2, 120 + i * 28, { tamano: f.n ? 17 : 15, negrita: !!f.n, color: f.c }));
  dibujarPie(ctx, 'ENTER o ESC: volver');
}
