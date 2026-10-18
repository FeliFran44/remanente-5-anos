// ============================================================
//  MOVIMIENTO: caminar, saltar y caer
//  Lo comparten Jax y Elena. Cada uno tiene sus propios números
//  (sus "stats"), que están en jax.js y en elena.js.
// ============================================================

// Controles vacíos: nadie aprieta nada
function sinControles() {
  return {
    izquierda: false, derecha: false, saltar: false, saltarRecien: false, bajar: false,
    ataque: false, ataqueRecien: false, habilidad1Recien: false, habilidad2Recien: false,
    definitivaRecien: false, mochilaRecien: false, cambiarRecien: false, esquivarRecien: false,
    disparar: false, dispararRecien: false,
    apuntar: 0,   // solo lo usa la IA: hacia dónde mirar al disparar (-1 o 1; 0 = no cambia)
  };
}

// Crea un personaje parado con los pies en (x, yPies)
function crearPersonaje(tipo, stats, x, yPies) {
  const y = yPies - stats.ALTO;
  return {
    tipo,                 // 'jax' o 'elena'
    stats,
    x, y,                 // posición: esquina de arriba a la izquierda de su caja
    ancho: stats.ANCHO,
    alto: stats.ALTO,
    vx: 0,                // velocidad horizontal
    vy: 0,                // velocidad vertical (negativa = sube)
    mirando: 1,           // 1 = derecha, -1 = izquierda
    vida: stats.VIDA,
    enElSuelo: false,
    sueloEsFino: false,
    chocoPared: false,
    seCayo: false,        // se cayó a un pozo (o quedó fuera de combate) y espera reaparecer
    esperaReaparecer: 0,  // segundos que faltan para reaparecer
    acabaDeReaparecer: false,
    tiempoCoyote: 0,
    recuerdoSalto: 0,
    tiempoAtravesar: 0,
    // Combate:
    accion: null,         // lo que está haciendo: 'golpe', 'onda', 'embestida'... o null
    tiempoAccion: 0,
    ataqueActivo: null,   // la caja que lastima a los enemigos en este momento
    forzado: null,        // movimiento forzado, como la Embestida: { vx, vy, tiempo }
    intocable: false,     // no recibe daño (por ejemplo, durante la Embestida)
    invulnerable: 0,      // segundos sin recibir daño después de un golpe
    aturdido: 0,          // segundos sin poder moverse después de un golpe
    usoDobleSalto: false, // ¿ya usó el doble salto en este salto?
    dobleSalto: 0,        // segundos de la voltereta del doble salto (para el dibujo)
    esquivando: 0,        // segundos de esquiva: nada lo lastima
    recargaEsquiva: 0,
    esquivoEnElAire: false,
    // Solo para dibujar:
    xAntes: x,
    yAntes: y,
    tiempo: 0,
    pasos: 0,             // distancia caminada: mueve piernas y brazos
    aplastado: 0,         // > 0 aplastado (al caer), < 0 estirado (al saltar)
    parpadeo: 0,          // segundos que parpadea después de reaparecer
  };
}

// ESQUIVA: una carrerita muy rápida (también en el aire, una vez por salto).
// Mientras dura, nada lo lastima. Si un ataque iba a pegarle justo, es una "esquiva perfecta".
const ESQUIVA = { velocidad: 640, duracion: 0.24, invulnerable: 0.32, recarga: 0.75 };

function intentarEsquivar(p, c) {
  if (!c.esquivarRecien || p.recargaEsquiva > 0 || p.forzado || p.aturdido > 0) return false;
  if (!p.enElSuelo && p.esquivoEnElAire) return false;
  const direccion = c.izquierda ? -1 : c.derecha ? 1 : p.mirando;
  p.mirando = direccion;
  p.forzado = { vx: direccion * ESQUIVA.velocidad, vy: p.enElSuelo ? 1 : 0, tiempo: ESQUIVA.duracion };
  p.esquivando = ESQUIVA.invulnerable;
  p.esquivaPerfecta = false;
  p.recargaEsquiva = ESQUIVA.recarga;
  if (!p.enElSuelo) p.esquivoEnElAire = true;
  Sonido.esquiva();
  return true;
}

// Lo vuelve a poner parado, con los pies en (x, yPies)
function reaparecerEn(p, x, yPies, mirando = 1) {
  p.x = p.xAntes = x;
  p.y = p.yAntes = yPies - p.alto;
  p.vx = 0;
  p.vy = 0;
  p.mirando = mirando;
  p.seCayo = false;
  p.acabaDeReaparecer = true;
  p.parpadeo = 1;
  p.accion = null;
  p.ataqueActivo = null;
  p.forzado = null;
  p.intocable = false;
  p.aturdido = 0;
}

// Lo pone junto a otro personaje: primero prueba detrás de él y, si ahí hay
// una pared, en el mismo lugar. Si tampoco se puede, al principio del nivel.
function reaparecerJunto(p, otro, nivel) {
  const centro = otro.x + otro.ancho / 2;
  const yPies = otro.y + otro.alto;
  for (const x of [centro - otro.mirando * 40 - p.ancho / 2, centro - p.ancho / 2]) {
    const caja = { x, y: yPies - p.alto, ancho: p.ancho, alto: p.alto };
    const libre = !nivel.plataformas.some((pl) => pl.tipo === 'solida' && seTocan(caja, pl));
    if (libre) {
      reaparecerEn(p, x, yPies, otro.mirando);
      return;
    }
  }
  reaparecerEn(p, nivel.inicio.x, nivel.inicio.y);
}

function actualizarMovimiento(p, controles, nivel, dt) {
  p.xAntes = p.x;
  p.yAntes = p.y;
  p.tiempo += dt;

  p.esquivando = Math.max(0, p.esquivando - dt);
  p.recargaEsquiva = Math.max(0, p.recargaEsquiva - dt);
  p.dobleSalto = Math.max(0, p.dobleSalto - dt);
  if (p.enElSuelo) p.esquivoEnElAire = false;

  // Mientras está aturdido por un golpe, no responde a los controles
  if (p.aturdido > 0) {
    p.aturdido -= dt;
    controles = sinControles();
  }

  if (p.forzado) {
    // Movimiento forzado: velocidad fija y sin gravedad
    p.vx = p.forzado.vx;
    p.vy = p.forzado.vy;
    p.forzado.tiempo -= dt;
    if (p.forzado.tiempo <= 0) p.forzado = null;
  } else {
    caminar(p, controles, dt);
    saltar(p, controles, dt);
    caer(p, controles, dt);
  }

  // Moverse y chocar
  const estabaEnElSuelo = p.enElSuelo;
  const velocidadDeCaida = p.vy;
  moverConChoques(p, nivel.plataformas, dt, p.tiempoAtravesar > 0);
  if (p.forzado && p.chocoPared) p.forzado = null;   // una pared frena la Embestida

  if (p.enElSuelo && !estabaEnElSuelo && velocidadDeCaida > 400) {
    p.aplastado = Math.min(0.28, velocidadDeCaida / 3500);   // se aplasta al caer
  }

  // Bordes del nivel
  p.x = Math.max(0, Math.min(p.x, nivel.ancho - p.ancho));
  if (p.y > nivel.alto + 200) p.seCayo = true;   // se cayó a un pozo

  // Polvo al aterrizar fuerte y al correr
  if (p.enElSuelo && !estabaEnElSuelo && velocidadDeCaida > 500) polvo(p.x + p.ancho / 2, p.y + p.alto, 6);
  if (p.enElSuelo && Math.abs(p.vx) > 300 && Math.random() < dt * 8) polvo(p.x + p.ancho / 2 - Math.sign(p.vx) * 10, p.y + p.alto, 1);
  if (p.esquivando > 0 && Math.random() < 0.6) estela(p.x + p.ancho / 2, p.y + 10 + Math.random() * (p.alto - 20), p.tipo === 'elena' ? '#5fd4ff' : '#9fe8ff');

  // Animación y tiempos
  if (p.enElSuelo) p.pasos += Math.abs(p.vx) * dt;
  p.aplastado -= p.aplastado * Math.min(1, 14 * dt);
  p.parpadeo = Math.max(0, p.parpadeo - dt);
  p.invulnerable = Math.max(0, p.invulnerable - dt);
}

function caminar(p, controles, dt) {
  const s = p.stats;
  let direccion = 0;
  if (controles.izquierda) direccion -= 1;
  if (controles.derecha) direccion += 1;
  const control = p.enElSuelo ? 1 : s.CONTROL_EN_EL_AIRE;

  if (direccion !== 0) {
    // Si cambia de dirección, frena más fuerte: así se da vuelta rápido
    const girando = Math.sign(p.vx) === -direccion;
    const fuerza = girando ? s.FRENADO : s.ACELERACION;
    p.vx += direccion * fuerza * control * dt;
    p.vx = Math.max(-s.VELOCIDAD_MAX, Math.min(s.VELOCIDAD_MAX, p.vx));
    p.mirando = direccion;
  } else {
    const frenado = s.FRENADO * control * dt;
    if (Math.abs(p.vx) <= frenado) p.vx = 0;
    else p.vx -= Math.sign(p.vx) * frenado;
  }
}

function saltar(p, controles, dt) {
  const s = p.stats;
  // "Tiempo coyote": como en los dibujos animados, por un instante
  // se puede saltar aunque ya hayas salido del borde.
  if (p.enElSuelo) p.tiempoCoyote = s.TIEMPO_COYOTE;
  else p.tiempoCoyote -= dt;

  if (controles.saltarRecien) p.recuerdoSalto = s.RECUERDO_DE_SALTO;
  else p.recuerdoSalto -= dt;

  if (p.recuerdoSalto > 0 && p.tiempoCoyote > 0) {
    p.vy = -s.FUERZA_SALTO;
    p.tiempoCoyote = 0;
    p.recuerdoSalto = 0;
    p.aplastado = -0.18;
  } else if (controles.saltarRecien && !p.enElSuelo && s.DOBLE_SALTO && !p.usoDobleSalto && !p.forzado) {
    // ¡Doble salto! Un impulso en el aire, con una voltereta
    p.vy = -s.FUERZA_SALTO * 0.88;
    p.usoDobleSalto = true;
    p.recuerdoSalto = 0;
    p.dobleSalto = 0.4;
    const pies = { x: p.x + p.ancho / 2, y: p.y + p.alto };
    ondaExpansiva(pies.x, pies.y, 34, p.tipo === 'elena' ? '#5fd4ff' : '#ff9a3c', 0.35);
    Sonido.dobleSalto();
  }
  if (p.enElSuelo) p.usoDobleSalto = false;

  // Bajar de una plataforma fina
  if (controles.bajar && p.enElSuelo && p.sueloEsFino) p.tiempoAtravesar = 0.25;
  p.tiempoAtravesar -= dt;
}

function caer(p, controles, dt) {
  // Si suelta el botón de saltar mientras sube, la gravedad tira más fuerte y el salto queda corto
  const cortarSalto = p.vy < 0 && !controles.saltar;
  const gravedad = cortarSalto ? GRAVEDAD * p.stats.CORTE_DE_SALTO : GRAVEDAD;
  p.vy = Math.min(p.vy + gravedad * dt, VELOCIDAD_MAX_CAIDA);
}

// ---------- Ayudantes para dibujar ----------

// Dónde dibujarlo: "entre" el paso anterior y el actual, para que se vea suave
function posicionDibujo(p, alfa) {
  return {
    x: p.xAntes + (p.x - p.xAntes) * alfa,
    y: p.yAntes + (p.y - p.yAntes) * alfa,
  };
}

// Datos de la animación que usan los dibujos de Jax y Elena
function calcularPose(p) {
  const caminando = p.enElSuelo && Math.abs(p.vx) > 20;
  const quieto = p.enElSuelo && !caminando;
  return {
    caminando,
    quieto,
    vaiven: caminando ? Math.sin(p.pasos * 0.045) : 0,
    respiro: quieto ? Math.sin(p.tiempo * 3) * 0.8 : 0,
  };
}

// Después de reaparecer o de recibir un golpe, se esconde en algunos cuadros: así parpadea
function estaParpadeando(p) {
  const tiempo = Math.max(p.parpadeo, p.invulnerable);
  return tiempo > 0 && Math.floor(tiempo * 12) % 2 === 0;
}

// Dibuja una línea (pierna o brazo) que sale de (x, y) con un ángulo.
// Ángulo 0 = hacia abajo; positivo = hacia adelante. Devuelve dónde termina.
function dibujarExtremidad(ctx, x, y, angulo, largo) {
  const finX = x + Math.sin(angulo) * largo;
  const finY = y + Math.cos(angulo) * largo;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(finX, finY);
  ctx.stroke();
  return { x: finX, y: finY };
}
