// ============================================================
//  ENEMIGOS DEL ACTO 2 (el Bosque Biosintético)
//    mutante    → el slime verde: escupe ácido que deja charcos
//    sabueso    → el goblin: corre rápido y salta encima
//    acechador  → la sombra: casi invisible en la niebla (se ve de cerca o cuando ataca)
//    planta     → planta trampa: muerde si te acercás
// ============================================================

// ============================================================
//  MUTANTE (el slime): salta despacito y escupe ácido
// ============================================================
TIPOS_ENEMIGOS.mutante = {
  nombre: 'Mutante',
  SPRITE: 'slime',
  ANCHO: 40,
  ALTO: 30,
  VIDA: 30,
  VISION: 420,
  PREPARAR: 0.6,            // se infla antes de escupir: ¡es el aviso!
  DANIO: 10,
  GRAVEDAD_ACIDO: 900,
  RECARGA: 2.2,
  SALTITO: 1.3,             // cada cuánto da un saltito al patrullar
  TIEMPO_ATURDIDO: 0.4,
  actualizar: actualizarMutante,
  dibujar: dibujarMutante,
};

// Calcula cómo tirar algo para que caiga en un punto (un "tiro parabólico")
function tiroHacia(desde, hacia, gravedad, tiempoVuelo) {
  return {
    vx: (hacia.x - desde.x) / tiempoVuelo,
    vy: (hacia.y - desde.y - 0.5 * gravedad * tiempoVuelo * tiempoVuelo) / tiempoVuelo,
  };
}

// Cuando el ácido toca el piso, deja un charco
function charcoDondeCae(p) {
  const nivel = Juego.nivel;
  const piso = nivel.plataformas.find((pl) => p.x >= pl.x && p.x <= pl.x + pl.ancho && pl.y >= p.y - 14 && pl.y <= p.y + 30);
  if (piso) crearCharco(p.x, piso.y);
}

function escupirAcido(e, objetivo, gravedad, danio) {
  const desde = { x: centroDe(e).x + e.mirando * 14, y: e.y + 6 };
  const hacia = { x: centroDe(objetivo).x, y: piesDe(objetivo) - 10 };
  lanzarAcido(desde, hacia, gravedad, danio);
}

// Un chorro de ácido que vuela en curva desde un punto hasta otro
function lanzarAcido(desde, hacia, gravedad, danio) {
  const vuelo = Math.max(0.45, Math.min(1.1, Math.abs(hacia.x - desde.x) / 320));
  const v = tiroHacia(desde, hacia, gravedad, vuelo);
  lanzarProyectil({
    tipo: 'acido', deEnemigo: true, danio, ancho: 12, alto: 12, vida: 3,
    x: desde.x, y: desde.y, vx: v.vx, vy: v.vy, gravedad, colorChispa: '#a6ff4d', alTerminar: charcoDondeCae,
  });
  Sonido.escupir();
}

function actualizarMutante(e, jugadores, nivel, dt) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  if (desaparecer(e, ['#a6ff4d', '#3d8a30']) || seRecupera(e, 'patrulla')) return moverEnemigo(e, nivel, dt, 0);

  switch (e.estado) {
    case 'patrulla':
      // Da saltitos de un lado al otro
      if (e.enElSuelo && e.tiempoEstado >= t.SALTITO) {
        e.tiempoEstado = 0;
        patrullar(e, nivel);
        e.vy = -300;
        e.saltando = true;
      }
      if (!e.enElSuelo && e.saltando) velocidad = e.mirando * 80;
      if (e.enElSuelo) e.saltando = false;
      if (veA(e, objetivo, t.VISION, 200, false) && e.enElSuelo) cambiarEstado(e, 'prepara');
      break;
    case 'prepara':
      mirarHacia(e, objetivo);
      if (e.tiempoEstado >= t.PREPARAR) {
        if (objetivo) escupirAcido(e, objetivo, t.GRAVEDAD_ACIDO, t.DANIO);
        cambiarEstado(e, 'recarga');
      }
      break;
    case 'recarga':
      if (e.tiempoEstado >= t.RECARGA) cambiarEstado(e, 'patrulla');
      break;
  }
  moverEnemigo(e, nivel, dt, velocidad);
}

function dibujarMutante(ctx, e, alfa) {
  // Se infla antes de escupir y se aplasta al caer
  let estirarX = 1, estirarY = 1;
  if (e.estado === 'prepara') {
    const inflado = Math.min(1, e.tiempoEstado / e.t.PREPARAR);
    estirarX = 1 + inflado * 0.15 + Math.sin(e.tiempo * 40) * 0.03;
    estirarY = 1 + inflado * 0.2;
  } else if (!e.enElSuelo) {
    estirarX = 0.9;
    estirarY = 1.12;
  } else {
    estirarY = 1 + Math.sin(e.tiempo * 4) * 0.05;
  }
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 36, estirarX, estirarY });
}

// ============================================================
//  SABUESO BIOMECÁNICO (el goblin): corre y salta encima
// ============================================================
TIPOS_ENEMIGOS.sabueso = {
  nombre: 'Sabueso',
  SPRITE: 'goblin',
  ANCHO: 34,
  ALTO: 46,
  VIDA: 30,
  VELOCIDAD_PATRULLA: 90,
  VELOCIDAD_PERSECUCION: 230,
  VISION: 400,
  DISTANCIA_SALTO: 210,
  PREPARAR: 0.4,            // se agacha antes de saltar
  SALTO_X: 480,
  SALTO_Y: 430,
  DANIO: 12,
  MAREADO: 0.8,             // después de saltar queda un ratito quieto: ¡ahí pegale!
  TIEMPO_ATURDIDO: 0.35,
  actualizar: actualizarSabueso,
  dibujar: dibujarSabueso,
};

function actualizarSabueso(e, jugadores, nivel, dt) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  if (desaparecer(e, ['#7ac74f', '#3a5a2a']) || seRecupera(e, 'persigue')) return moverEnemigo(e, nivel, dt, 0);

  switch (e.estado) {
    case 'patrulla':
      velocidad = patrullar(e, nivel);
      if (veA(e, objetivo, t.VISION)) {
        cambiarEstado(e, 'persigue');
        Sonido.grunido();
      }
      break;
    case 'persigue':
      if (!veA(e, objetivo, t.VISION * 1.6, 160, false)) {
        cambiarEstado(e, 'patrulla');
        break;
      }
      mirarHacia(e, objetivo);
      if (separacion(e, objetivo) < t.DISTANCIA_SALTO && e.enElSuelo) cambiarEstado(e, 'prepara');
      else if (haySueloAdelante(e, nivel)) velocidad = e.mirando * t.VELOCIDAD_PERSECUCION;
      break;
    case 'prepara':
      mirarHacia(e, objetivo);
      if (e.tiempoEstado >= t.PREPARAR) {
        cambiarEstado(e, 'salta');
        e.golpeados = new Set();
        e.vy = -t.SALTO_Y;
        Sonido.mordida();
      }
      break;
    case 'salta':
      velocidad = e.mirando * t.SALTO_X;
      e.cajaAtaque = { x: e.x - 4, y: e.y, ancho: e.ancho + 8, alto: e.alto };
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO, e.mirando)) e.golpeados.add(p);
      }
      if (e.enElSuelo && e.tiempoEstado > 0.1) cambiarEstado(e, 'mareado');
      break;
    case 'mareado':
      if (e.tiempoEstado >= t.MAREADO) cambiarEstado(e, 'persigue');
      break;
  }
  // En el aire no frena (para que el salto llegue lejos)
  if (e.estado === 'salta') {
    e.vx = velocidad;
    e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
    moverConChoques(e, nivel.plataformas, dt, false);
    if (e.y > nivel.alto + 200) e.eliminar = true;
    return;
  }
  moverEnemigo(e, nivel, dt, velocidad);
}

function dibujarSabueso(ctx, e, alfa) {
  let rotar = 0, estirarY = 1;
  if (e.estado === 'prepara') estirarY = 0.82;           // agachado
  if (e.estado === 'salta') rotar = 0.35;                 // de cabeza hacia vos
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 52, rotar, estirarY });
  const { x, y } = posicionDibujo(e, alfa);
  if (e.estado === 'prepara') {
    // Ojos rojos que brillan: ¡va a saltar!
    ctx.save();
    ctx.shadowColor = '#ff2a2a';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff5050';
    ctx.fillRect(x + e.ancho / 2 + e.mirando * 4 - 5, y + 14, 3, 3);
    ctx.fillRect(x + e.ancho / 2 + e.mirando * 4 + 3, y + 14, 3, 3);
    ctx.restore();
  }
  if (e.estado === 'mareado') dibujarEstrellitas(ctx, x + e.ancho / 2, y - 6, e.tiempo);
}

// Estrellitas que dan vueltas sobre la cabeza (mareado)
function dibujarEstrellitas(ctx, x, y, tiempo) {
  ctx.fillStyle = '#ffe14d';
  for (let i = 0; i < 3; i++) {
    const a = tiempo * 6 + i * 2.1;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 16, y + Math.sin(a) * 4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================
//  ACECHADOR (la sombra): invisible en la niebla
//  Se ve cuando estás cerca, cuando va a atacar (le brillan los ojos)
//  o cuando le pegan. Después de atacar, a veces aparece detrás tuyo.
// ============================================================
TIPOS_ENEMIGOS.acechador = {
  nombre: 'Acechador',
  SPRITE: 'sombra',
  ANCHO: 32,
  ALTO: 56,
  VIDA: 35,
  VELOCIDAD_PATRULLA: 50,
  VELOCIDAD_PERSECUCION: 150,
  VISION: 320,
  SE_VE_A: 130,             // a esta distancia ya se lo ve
  ALCANCE: 26,
  PREPARAR: 0.55,
  DANIO: 12,
  RECUPERAR: 0.7,
  TIEMPO_ATURDIDO: 0.4,
  actualizar: actualizarAcechador,
  dibujar: dibujarAcechador,
};

function actualizarAcechador(e, jugadores, nivel, dt) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;

  // ¿Se lo ve?
  const centro = centroDe(e);
  const atacando = ['prepara', 'ataca', 'recupera'].includes(e.estado);
  const marcado = e.destello > 0 || e.estado === 'congelado' || e.estado === 'aturdido' || e.marcaPlasma > 0 || e.estado === 'derrotado';
  const visible = atacando || marcado || !lejosDeLosJugadores(centro.x, centro.y, t.SE_VE_A);
  e.visibilidad = (e.visibilidad ?? 0) + ((visible ? 1 : 0.05) - (e.visibilidad ?? 0)) * Math.min(1, 6 * dt);
  e.invisible = e.visibilidad < 0.15;

  if (desaparecer(e, ['#6a3aa0', '#1a1020']) || seRecupera(e, 'persigue')) return moverEnemigo(e, nivel, dt, 0);

  switch (e.estado) {
    case 'patrulla':
      velocidad = patrullar(e, nivel);
      if (veA(e, objetivo, t.VISION, 120, false)) cambiarEstado(e, 'persigue');
      break;
    case 'persigue':
      if (!veA(e, objetivo, t.VISION * 1.5, 140, false)) {
        cambiarEstado(e, 'patrulla');
        break;
      }
      mirarHacia(e, objetivo);
      if (separacion(e, objetivo) <= t.ALCANCE && Math.abs(piesDe(objetivo) - piesDe(e)) < 50) {
        cambiarEstado(e, 'prepara');
        Sonido.aparecer();
      } else if (haySueloAdelante(e, nivel)) {
        velocidad = e.mirando * t.VELOCIDAD_PERSECUCION;
      }
      break;
    case 'prepara':
      if (e.tiempoEstado >= t.PREPARAR) {
        cambiarEstado(e, 'ataca');
        e.golpeados = new Set();
        Sonido.mordida();
      }
      break;
    case 'ataca':
      e.cajaAtaque = cajaDelante(e, 40, 40, 6);
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO, e.mirando)) e.golpeados.add(p);
      }
      if (e.tiempoEstado >= 0.16) cambiarEstado(e, 'recupera');
      break;
    case 'recupera':
      if (e.tiempoEstado >= t.RECUPERAR) {
        if (objetivo && Math.random() < 0.45) aparecerDetras(e, objetivo, nivel);
        cambiarEstado(e, 'persigue');
      }
      break;
  }
  moverEnemigo(e, nivel, dt, velocidad);
}

// Se esfuma y aparece detrás del jugador (si ahí hay piso)
function aparecerDetras(e, p, nivel) {
  const x = centroDe(p).x - p.mirando * 90 - e.ancho / 2;
  const caja = { x, y: piesDe(p) - e.alto, ancho: e.ancho, alto: e.alto };
  const libre = !nivel.plataformas.some((pl) => pl.tipo === 'solida' && seTocan(caja, pl));
  if (!libre || !hayPlataformaDebajo(x + e.ancho / 2, piesDe(p), nivel.plataformas, 10)) return;
  chispas(centroDe(e).x, centroDe(e).y, '#6a3aa0', 12, 200);
  e.x = e.xAntes = x;
  e.y = e.yAntes = caja.y;
  e.mirando = centroDe(p).x > x ? 1 : -1;
  chispas(centroDe(e).x, centroDe(e).y, '#6a3aa0', 12, 200);
  Sonido.teletransporte();
}

function dibujarAcechador(ctx, e, alfa) {
  const visibilidad = e.visibilidad ?? 1;
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 60, alfa: visibilidad });
  // Los ojos siempre brillan un poquito: es la única pista en la niebla
  const { x, y } = posicionDibujo(e, alfa);
  const preparando = e.estado === 'prepara';
  ctx.save();
  ctx.shadowColor = '#ff2040';
  ctx.shadowBlur = preparando ? 14 : 6;
  ctx.fillStyle = `rgba(255, 60, 90, ${preparando ? 1 : 0.25 + visibilidad * 0.6})`;
  const ojo = x + e.ancho / 2 + e.mirando * 3;
  ctx.fillRect(ojo - 6, y + 13, 3, 3);
  ctx.fillRect(ojo + 3, y + 13, 3, 3);
  ctx.restore();
}

// ============================================================
//  PLANTA TRAMPA: espera quieta y muerde si te acercás
// ============================================================
TIPOS_ENEMIGOS.planta = {
  nombre: 'Planta trampa',
  ANCHO: 40,
  ALTO: 50,
  VIDA: 40,
  PESADO: 0,
  NO_SE_ATURDE: true,
  DISTANCIA: 66,             // si te acercás así, se prepara para morder
  PREPARAR: 0.45,           // abre la boca: ¡alejate!
  DANIO: 14,
  RECUPERAR: 1.3,           // después de morder queda abierta: ¡ahí pegale!
  actualizar: actualizarPlanta,
  dibujar: dibujarPlanta,
};

function actualizarPlanta(e, jugadores, nivel, dt) {
  const t = e.t;
  e.vx = 0;
  if (e.estado === 'derrotado') {
    if (e.tiempoEstado >= 0.7 && !e.eliminar) {
      e.eliminar = true;
      chispas(centroDe(e).x, centroDe(e).y, '#c45ad8', 16, 240);
      chispas(centroDe(e).x, centroDe(e).y, '#5aa83a', 10, 200);
    }
    return;
  }
  if (e.estado === 'patrulla') e.estado = 'quieto';
  const objetivo = jugadorMasCercano(e, jugadores);
  const cerca = objetivo && separacion(e, objetivo) < t.DISTANCIA && Math.abs(piesDe(objetivo) - piesDe(e)) < 90;
  switch (e.estado) {
    case 'quieto':
    case 'aturdido':
      if (cerca) {
        mirarHacia(e, objetivo);
        cambiarEstado(e, 'prepara');
        Sonido.planta();
      }
      break;
    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'quieto');
      break;
    case 'prepara':
      if (e.tiempoEstado >= t.PREPARAR) {
        cambiarEstado(e, 'muerde');
        e.golpeados = new Set();
        Sonido.mordida();
      }
      break;
    case 'muerde':
      e.cajaAtaque = { x: e.x - 60, y: e.y - 24, ancho: e.ancho + 120, alto: e.alto + 24 };
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO, centroDe(p).x > centroDe(e).x ? 1 : -1)) e.golpeados.add(p);
      }
      if (e.tiempoEstado >= 0.15) cambiarEstado(e, 'recupera');
      break;
    case 'recupera':
      if (e.tiempoEstado >= t.RECUPERAR) cambiarEstado(e, 'quieto');
      break;
  }
}

function dibujarPlanta(ctx, e, alfa) {
  const x = e.x + e.ancho / 2;
  const piso = e.y + e.alto;
  ctx.save();
  if (e.estado === 'derrotado') ctx.globalAlpha = Math.max(0, 1 - e.tiempoEstado / 0.7);
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 2})`;
  // Hojas y tallo
  const vaiven = Math.sin(e.tiempo * 2) * 0.1;
  ctx.fillStyle = '#3d7a2a';
  for (const lado of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + lado * 16, piso - 6, 18, 6, lado * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#4f9a36';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x, piso);
  const cabezaX = x + Math.sin(vaiven) * 20 + (e.estado === 'muerde' ? e.mirando * 18 : 0);
  const cabezaY = piso - 38 - (e.estado === 'muerde' ? 10 : 0);
  ctx.quadraticCurveTo(x - 10, piso - 20, cabezaX, cabezaY);
  ctx.stroke();
  // La cabeza: se abre para morder
  let apertura = 0.12;
  if (e.estado === 'prepara') apertura = 0.12 + (e.tiempoEstado / e.t.PREPARAR) * 0.7 + Math.sin(e.tiempo * 40) * 0.05;
  else if (e.estado === 'muerde') apertura = 0.05;
  else if (e.estado === 'recupera') apertura = 0.6;
  ctx.translate(cabezaX, cabezaY);
  ctx.scale(e.mirando, 1);
  for (const lado of [-1, 1]) {
    ctx.save();
    ctx.rotate(lado * apertura);
    ctx.fillStyle = '#b8448f';
    ctx.beginPath();
    ctx.ellipse(8, 0, 20, 11, 0, lado > 0 ? 0 : Math.PI, lado > 0 ? Math.PI : Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f4f6fb';                  // dientes
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(-6 + i * 8, 0);
      ctx.lineTo(-2 + i * 8, lado * 6);
      ctx.lineTo(2 + i * 8, 0);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.fillStyle = '#e07ac0';                    // manchitas
  ctx.beginPath();
  ctx.arc(2, -6, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
