// ============================================================
//  ENEMIGOS DEL ACTO 3 (la Citadel Génesis)
//    soldadoRed  → el demonio: dispara ráfagas y tira granadas
//    dronV2      → dron rojo que dispara 3 rayos en abanico
//    clon        → el esqueleto: un clon defectuoso que corre hacia vos y EXPLOTA
//                  (¡la explosión también lastima a los otros enemigos!)
//    clonJax     → un clon de Jax: pelea con sus mismos golpes
//    pretoriano  → el orco: guardia de élite con escudo y alabarda
//  (La torreta de plasma está en enemigos-acto1.js, junto a la torreta común.)
// ============================================================

// ============================================================
//  SOLDADO GENESIS RED (el demonio)
// ============================================================
TIPOS_ENEMIGOS.soldadoRed = {
  ...TIPOS_ENEMIGOS.soldado,
  nombre: 'Soldado Genesis Red',
  SPRITE: 'demonio',
  ALTO_SPRITE: 64,
  ANCHO: 30,
  ALTO: 60,
  VIDA: 50,
  VISION: 460,
  APUNTAR: 0.5,
  DANIO: 7,
  GRANADAS: true,
  DANIO_GRANADA: 14,
  COLOR_ARMA: '#5a1a22',
};

// ============================================================
//  DRON V-2: más resistente y dispara en abanico
// ============================================================
TIPOS_ENEMIGOS.dronV2 = {
  ...TIPOS_ENEMIGOS.dron,
  nombre: 'Dron V-2',
  VIDA: 30,
  DANIO: 8,
  ABANICO: 0.28,
  TIEMPO_APUNTAR: 0.8,
  VELOCIDAD: 110,
  COLOR_CUERPO: '#7a2a35',
  COLOR_FRANJA: '#ffd23f',
  dibujar: (ctx, e, alfa) => dibujarDron(ctx, e, alfa),
};

// ============================================================
//  CLON DEFECTUOSO (el esqueleto): ¡explota!
// ============================================================
TIPOS_ENEMIGOS.clon = {
  nombre: 'Clon defectuoso',
  SPRITE: 'esqueleto',
  ANCHO: 28,
  ALTO: 54,
  VIDA: 20,
  VELOCIDAD_PATRULLA: 50,
  VELOCIDAD_PERSECUCION: 170,
  VISION: 420,
  DISTANCIA_MECHA: 46,
  MECHA: 0.9,               // titila y pita antes de explotar: ¡alejate!
  RADIO: 85,
  DANIO: 16,
  DANIO_SI_LO_DERROTAN: 10, // si lo derrotás antes, explota igual pero más chiquito
  TIEMPO_ATURDIDO: 0.3,
  actualizar: actualizarClon,
  dibujar: dibujarClon,
  alDerrotar: (e) => { e.explotaPronto = true; },
};

function explotarClon(e, danio) {
  if (e.eliminar) return;
  e.eliminar = true;
  const centro = centroDe(e);
  explosion(centro.x, centro.y, e.t.RADIO, danio, { lastimaEnemigos: true, danioEnemigos: 30, color: '#9dff6a' });
  chispas(centro.x, centro.y, '#f4f6fb', 14, 300);
}

function actualizarClon(e, jugadores, nivel, dt) {
  const t = e.t;
  if (e.estado === 'derrotado') {
    if (e.tiempoEstado >= 0.35) explotarClon(e, t.DANIO_SI_LO_DERROTAN);
    return moverEnemigo(e, nivel, dt, 0);
  }
  if (seRecupera(e, 'persigue')) return moverEnemigo(e, nivel, dt, 0);
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;

  switch (e.estado) {
    case 'patrulla':
      velocidad = patrullar(e, nivel);
      if (veA(e, objetivo, t.VISION, 140, false)) cambiarEstado(e, 'persigue');
      break;
    case 'persigue':
      if (!objetivo) break;
      mirarHacia(e, objetivo);
      if (separacion(e, objetivo) < t.DISTANCIA_MECHA && Math.abs(piesDe(objetivo) - piesDe(e)) < 60) {
        cambiarEstado(e, 'mecha');
      } else if (haySueloAdelante(e, nivel)) {
        velocidad = e.mirando * t.VELOCIDAD_PERSECUCION;
      }
      break;
    case 'mecha':
      if (Math.floor(e.tiempoEstado * 8) !== Math.floor((e.tiempoEstado - dt) * 8)) Sonido.pitido();
      if (e.tiempoEstado >= t.MECHA) explotarClon(e, t.DANIO);
      break;
  }
  moverEnemigo(e, nivel, dt, velocidad);
}

function dibujarClon(ctx, e, alfa) {
  const mecha = e.estado === 'mecha' || (e.estado === 'derrotado' && e.explotaPronto);
  const titila = mecha && Math.floor(e.tiempo * 14) % 2 === 0;
  // Un brillo verde: el líquido de los tanques de clonación
  const { x, y } = posicionDibujo(e, alfa);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x + e.ancho / 2, y + e.alto / 2, 2, x + e.ancho / 2, y + e.alto / 2, mecha ? 46 : 30);
  g.addColorStop(0, mecha ? 'rgba(255, 80, 60, 0.5)' : 'rgba(120, 255, 140, 0.25)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 40, y - 30, e.ancho + 80, e.alto + 60);
  ctx.restore();
  dibujarEnemigoSprite(ctx, e, alfa, {
    alto: 58,
    tinte: titila ? { color: '#ff3b3b', fuerza: 0.7 } : null,
    estirarX: mecha ? 1 + Math.sin(e.tiempo * 30) * 0.06 : 1,
  });
}

// ============================================================
//  CLON DE JAX: pelea como Jax (combo y Embestida)
// ============================================================
TIPOS_ENEMIGOS.clonJax = {
  nombre: 'Clon de Jax',
  ANCHO: 34,
  ALTO: 64,
  VIDA: 70,
  VELOCIDAD_PATRULLA: 80,
  VELOCIDAD_PERSECUCION: 210,
  VISION: 460,
  ALCANCE: 26,
  PREPARAR_GOLPE: 0.28,
  GOLPES: 2,
  DANIO_GOLPE: 7,
  PREPARAR_EMBESTIDA: 0.45,
  VELOCIDAD_EMBESTIDA: 760,
  DURACION_EMBESTIDA: 0.28,
  DANIO_EMBESTIDA: 12,
  RECARGA_EMBESTIDA: 4,
  RECUPERAR: 0.7,
  TIEMPO_ATURDIDO: 0.3,
  TINTE: { color: '#7a3cff', fuerza: 0.42 },
  ENERGIA: 'rgba(170, 90, 255, ALFA)',
  ALTO_SPRITE: 78,
  actualizar: actualizarClonJax,
  dibujar: dibujarClonJax,
};

// El comportamiento de los que pelean como Jax (también lo usa Proto-Jax Alfa)
function actualizarLuchadorJax(e, jugadores, nivel, dt, rapidez = 1) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  e.recargaEmbestida = Math.max(0, (e.recargaEmbestida ?? 1.5) - dt);

  switch (e.estado) {
    case 'patrulla':
      velocidad = patrullar(e, nivel);
      if (veA(e, objetivo, t.VISION, 140, false)) cambiarEstado(e, 'persigue');
      break;
    case 'persigue': {
      if (!objetivo) break;
      mirarHacia(e, objetivo);
      const distancia = separacion(e, objetivo);
      const mismaAltura = Math.abs(piesDe(objetivo) - piesDe(e)) < 60;
      if (distancia <= t.ALCANCE && mismaAltura) {
        e.golpeCombo = 0;
        cambiarEstado(e, 'preparaGolpe');
      } else if (distancia > 130 && distancia < 340 && mismaAltura && e.recargaEmbestida <= 0) {
        cambiarEstado(e, 'preparaEmbestida');
      } else if (haySueloAdelante(e, nivel)) {
        velocidad = e.mirando * t.VELOCIDAD_PERSECUCION * rapidez;
      } else if (e.enElSuelo && objetivo && piesDe(objetivo) < piesDe(e) - 40) {
        e.vy = -820;   // salta para alcanzarte
      }
      break;
    }
    case 'preparaGolpe':
      if (e.tiempoEstado >= (e.golpeCombo === 0 ? t.PREPARAR_GOLPE : 0.12) / rapidez) {
        cambiarEstado(e, 'golpe');
        e.golpeados = new Set();
        Sonido.swing();
      }
      break;
    case 'golpe': {
      const ultimo = e.golpeCombo >= t.GOLPES - 1;
      e.cajaAtaque = cajaDelante(e, ultimo ? 54 : 44, 34, 10);
      velocidad = e.mirando * 60;
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, ultimo ? t.DANIO_GOLPE * 1.6 : t.DANIO_GOLPE, e.mirando)) e.golpeados.add(p);
      }
      if (e.tiempoEstado >= 0.14) {
        if (ultimo) cambiarEstado(e, 'recupera');
        else {
          e.golpeCombo++;
          cambiarEstado(e, 'preparaGolpe');
        }
      }
      break;
    }
    case 'preparaEmbestida':
      if (objetivo && e.tiempoEstado < t.PREPARAR_EMBESTIDA * 0.6) mirarHacia(e, objetivo);
      if (e.tiempoEstado >= t.PREPARAR_EMBESTIDA / rapidez) {
        cambiarEstado(e, 'embestida');
        e.golpeados = new Set();
        e.recargaEmbestida = t.RECARGA_EMBESTIDA;
        Sonido.embestida();
      }
      break;
    case 'embestida':
      velocidad = e.mirando * t.VELOCIDAD_EMBESTIDA;
      e.cajaAtaque = { x: e.x - 6, y: e.y + 4, ancho: e.ancho + 12, alto: e.alto - 8 };
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO_EMBESTIDA, e.mirando)) e.golpeados.add(p);
      }
      estela(centroDe(e).x, e.y + 20 + Math.random() * 30, '#a050ff');
      if (e.tiempoEstado >= t.DURACION_EMBESTIDA || e.chocoPared) cambiarEstado(e, 'recupera');
      break;
    case 'recupera':
      if (e.tiempoEstado >= t.RECUPERAR / rapidez) cambiarEstado(e, 'persigue');
      break;
  }
  return velocidad;
}

function actualizarClonJax(e, jugadores, nivel, dt) {
  if (desaparecer(e, ['#a050ff', '#3a2060']) || seRecupera(e, 'persigue')) return moverEnemigo(e, nivel, dt, 0);
  const velocidad = actualizarLuchadorJax(e, jugadores, nivel, dt);
  moverEnemigo(e, nivel, dt, velocidad);
}

// Traduce el estado del clon a una pose del sprite de Jax
function poseDeClon(e) {
  const pose = poseNueva('jax-pelea');
  const firme = { atras: 0.32, adelante: -0.22 };
  if (e.enElSuelo && Math.abs(e.vx) > 20) {
    pose.mov = movimientoCaminar(e.pasos * 0.05, 0.45);
    pose.rotar = 0.07;
  } else if (!e.enElSuelo) {
    pose.rotar = e.vy < 0 ? -0.07 : 0.08;
    pose.mov = e.vy < 0 ? { atras: 0.45, adelante: -0.6, estirarPiernas: 0.9 } : { atras: 0.2, adelante: -0.3 };
  } else {
    pose.mov = { subir: Math.sin(e.tiempo * 3) * 1.2 };
  }
  if (e.estado === 'preparaGolpe') pose.mov = { ...firme, brazoX: -8, inclinar: -0.06 };
  else if (e.estado === 'golpe') {
    pose.adelante = 5;
    pose.mov = { ...firme, brazoX: 24, brazoY: e.golpeCombo % 2 ? 10 : 0, inclinar: 0.16 };
    pose.golpe = 'adelante';
  }
  else if (e.estado === 'preparaEmbestida') { pose.estirarY = 0.9; pose.rotar = 0.15; pose.mov = { atras: 0.6, adelante: -0.5 }; }
  else if (e.estado === 'embestida') { pose.rotar = 0.32; pose.adelante = 4; pose.mov = { atras: 0.85, adelante: -0.45, brazoX: 30 }; }
  else if (e.estado === 'aturdido') { pose.rotar = -0.2; pose.mov = { atras: -0.3, adelante: 0.25 }; }
  else if (e.estado === 'preparaOnda') { pose.mov = { atras: 0.5, adelante: -0.5, estirarPiernas: 0.82, brazoY: -26 }; }
  return pose;
}

function dibujarClonJax(ctx, e, alfa) {
  const t = e.t;
  const { x, y } = posicionDibujo(e, alfa);
  ctx.save();
  if (e.estado === 'derrotado') {
    ctx.globalAlpha = Math.max(0, 1 - e.tiempoEstado / 0.9);
    ctx.translate(Math.sin(e.tiempo * 50) * 2, 0);
  }
  const preparando = e.estado === 'preparaEmbestida' || e.estado === 'preparaOnda';
  const aura = preparando || e.furia ? { color: e.furia ? 'rgba(255, 40, 60, ALFA)' : 'rgba(170, 90, 255, ALFA)', intensidad: 0.8 } : null;
  if (!hayImagen('jax-pelea')) {
    ctx.fillStyle = '#7a3cff';
    ctx.fillRect(x, y, e.ancho, e.alto);
  } else {
    dibujarLuchadorJax(ctx, { ...e, aplastado: 0 }, x, y, poseDeClon(e), {
      alto: t.ALTO_SPRITE, tinte: t.TINTE, colorEnergia: t.ENERGIA, aura,
      destello: e.destello, fantasmas: e.estado === 'embestida',
    });
  }
  ctx.restore();
}

// ============================================================
//  GUARDIA PRETORIANA (el orco): escudo dorado y alabarda larga
//  Usa el comportamiento del recluta, pero pega desde más lejos.
// ============================================================
TIPOS_ENEMIGOS.pretoriano = {
  nombre: 'Guardia Pretoriana',
  SPRITE: 'orco',
  ANCHO: 36,
  ALTO: 62,
  VIDA: 75,
  ESCUDO: true,
  TIEMPO_GUARDIA_ROTA: 2.5,
  PESADO: 0.4,
  VELOCIDAD_PATRULLA: 55,
  VELOCIDAD_PERSECUCION: 115,
  VISION: 380,
  ALCANCE: 56,              // empieza a atacar desde lejos...
  ALCANCE_GOLPE: 84,        // ...porque la alabarda es larga
  DANIO: 14,
  TIEMPO_PREPARAR: 0.6,
  TIEMPO_ATAQUE: 0.2,
  TIEMPO_RECUPERAR: 0.9,
  TIEMPO_ATURDIDO: 0.35,
  dibujar: dibujarPretoriano,
};

function dibujarPretoriano(ctx, e, alfa) {
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 68 });
  if (e.estado === 'derrotado') return;
  const { x, y } = posicionDibujo(e, alfa);
  // La alabarda: se echa para atrás al preparar y se estira al atacar
  let adelante = 0;
  if (e.estado === 'prepara') adelante = -14 + Math.sin(e.tiempo * 40) * 1.5;
  else if (e.estado === 'ataca') adelante = 34;
  ctx.save();
  ctx.translate(x + e.ancho / 2, y + e.alto - 32);
  ctx.scale(e.mirando, 1);
  ctx.fillStyle = '#6b4a2a';
  ctx.fillRect(-10 + adelante, -2, 62, 4);                 // palo
  ctx.fillStyle = e.estado === 'prepara' ? '#fff3c0' : '#d8dde6';
  ctx.beginPath();                                         // la hoja
  ctx.moveTo(52 + adelante, -8);
  ctx.lineTo(68 + adelante, 0);
  ctx.lineTo(52 + adelante, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Escudo de energía dorado
  const arriba = escudoActivo(e);
  ctx.save();
  ctx.translate(x + e.ancho / 2 + e.mirando * 16, y + e.alto - 6);
  ctx.scale(e.mirando, 1);
  if (!arriba) {
    ctx.rotate(0.9);
    ctx.globalAlpha = 0.45 + Math.random() * 0.2;
  }
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = arriba ? 10 : 0;
  ctx.fillStyle = 'rgba(255, 209, 102, 0.3)';
  ctx.strokeStyle = arriba ? '#ffd166' : '#7a6a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, -52, 9, 48, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
