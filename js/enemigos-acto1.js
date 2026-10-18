// ============================================================
//  ENEMIGOS DEL ACTO 1 (la ciudad de Genesis)
//  Los dibujos son los que eligió el creador del juego (carpeta img/):
//    soldado       → el chico de remera amarilla, con pistola
//    limpiadora    → la caperucita roja, con lanzallamas (¡el tanque de la espalda es su punto débil!)
//    riot          → el caballero, con escudo antidisturbios
//    francotirador → el vampiro, con rifle láser
//  Y dos cosas de metal: la torreta y el tubo de gas (que explota).
// ============================================================

// ---------- Ayudantes que comparten todos los enemigos nuevos ----------

// ¿Ve a este jugador? (cerca, a una altura parecida y, si hace falta, de frente)
function veA(e, p, vision, alturaMaxima = 110, soloDeFrente = true) {
  if (!p) return false;
  const dx = centroDe(p).x - centroDe(e).x;
  const deFrente = Math.sign(dx) === e.mirando || Math.abs(dx) < 100;
  return Math.abs(dx) < vision && Math.abs(piesDe(p) - piesDe(e)) < alturaMaxima && (!soloDeFrente || deFrente);
}

function mirarHacia(e, p) {
  if (p) e.mirando = centroDe(p).x > centroDe(e).x ? 1 : -1;
}

// La física de siempre: frena al ser golpeado, cae con gravedad y choca con las plataformas
function moverEnemigo(e, nivel, dt, velocidadDeseada) {
  const controla = !['aturdido', 'congelado', 'derrotado'].includes(e.estado);
  if (controla) {
    e.vx = velocidadDeseada * (e.lento ? 0.4 : 1);
  } else if (e.enElSuelo) {
    const frenado = 900 * dt;
    e.vx = Math.abs(e.vx) <= frenado ? 0 : e.vx - Math.sign(e.vx) * frenado;
  }
  if (!e.t.VUELA) e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.y > nivel.alto + 200) e.eliminar = true;   // se cayó a un pozo
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

// Aturdido o congelado: cuando se le pasa, vuelve a "siguiente". Devuelve true si estaba así.
function seRecupera(e, siguiente) {
  if (e.estado !== 'aturdido' && e.estado !== 'congelado') return false;
  if (e.tiempoEstado >= duracionDelEstado(e) && (e.enElSuelo || e.t.VUELA)) cambiarEstado(e, siguiente);
  return true;
}

// Derrotado: espera un poquito y desaparece en chispas. Devuelve true si estaba derrotado.
function desaparecer(e, colores = ['#ff3b3b', '#8c94a3']) {
  if (e.estado !== 'derrotado') return false;
  if (e.tiempoEstado >= 0.9 && !e.eliminar) {
    e.eliminar = true;
    const centro = centroDe(e);
    chispas(centro.x, centro.y, colores[0], 14, 260);
    chispas(centro.x, centro.y, colores[1], 10, 200);
  }
  return true;
}

// Dispara una bala desde (x, y) hacia un punto
function dispararBala(e, desde, hacia, datos) {
  const angulo = Math.atan2(hacia.y - desde.y, hacia.x - desde.x);
  lanzarProyectil({
    tipo: 'bala', deEnemigo: true, ancho: 8, alto: 6, vida: 2, ...datos,
    x: desde.x, y: desde.y,
    vx: Math.cos(angulo) * datos.velocidad, vy: Math.sin(angulo) * datos.velocidad,
  });
}

// Línea de aviso (láser) desde un punto hacia otro
function dibujarMira(ctx, desde, hacia, color, ancho, tiempo, punteada = true) {
  ctx.save();
  ctx.strokeStyle = color.replace('ALFA', String(0.35 + 0.35 * Math.sin(tiempo * 30)));
  ctx.lineWidth = ancho;
  if (punteada) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(desde.x, desde.y);
  ctx.lineTo(hacia.x, hacia.y);
  ctx.stroke();
  ctx.restore();
}

// Un arma (rectángulo) en la mano de un enemigo con sprite
function dibujarArma(ctx, e, alfa, { largo, grueso, color, alturaMano = 30, angulo = 0, fogonazo = false }) {
  if (e.estado === 'derrotado') return null;
  const { x, y } = posicionDibujo(e, alfa);
  ctx.save();
  ctx.translate(x + e.ancho / 2 + e.mirando * 6, y + e.alto - alturaMano);
  ctx.scale(e.mirando, 1);
  ctx.rotate(angulo);
  ctx.fillStyle = color;
  ctx.fillRect(0, -grueso / 2, largo, grueso);
  ctx.fillStyle = '#1a1d24';
  ctx.fillRect(2, grueso / 2 - 1, 5, 5);   // empuñadura
  if (fogonazo) {
    ctx.fillStyle = '#fff3b0';
    ctx.shadowColor = '#ffd166';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(largo + 4, 0, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Devuelve dónde está la punta (en coordenadas del nivel)
  return {
    x: x + e.ancho / 2 + e.mirando * (6 + Math.cos(angulo) * largo),
    y: y + e.alto - alturaMano + Math.sin(angulo) * largo,
  };
}

// ============================================================
//  SOLDADO TÁCTICO (el chico): dispara ráfagas de 3 balas
// ============================================================
TIPOS_ENEMIGOS.soldado = {
  nombre: 'Soldado táctico',
  SPRITE: 'chico',
  ANCHO: 28,
  ALTO: 58,
  VIDA: 35,
  VELOCIDAD_PATRULLA: 60,
  VISION: 430,
  APUNTAR: 0.6,             // la mira roja: ¡aviso de que va a disparar!
  BALAS: 3,
  ENTRE_BALAS: 0.14,
  VELOCIDAD_BALA: 470,
  DANIO: 6,
  RECARGA: 1.5,
  MUY_CERCA: 110,           // si estás así de cerca, retrocede
  TIEMPO_ATURDIDO: 0.4,
  actualizar: actualizarSoldado,
  dibujar: dibujarSoldado,
};

function actualizarSoldado(e, jugadores, nivel, dt) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  if (desaparecer(e) || seRecupera(e, 'apunta')) return moverEnemigo(e, nivel, dt, 0);

  switch (e.estado) {
    case 'patrulla':
      velocidad = patrullar(e, nivel);
      if (veA(e, objetivo, t.VISION)) cambiarEstado(e, 'apunta');
      break;
    case 'apunta':
      if (!veA(e, objetivo, t.VISION * 1.2, 140, false)) {
        cambiarEstado(e, 'patrulla');
        break;
      }
      mirarHacia(e, objetivo);
      e.objetivo = objetivo;
      // Si estás muy cerca, da unos pasos para atrás
      if (separacion(e, objetivo) < t.MUY_CERCA) {
        e.mirando *= -1;
        if (haySueloAdelante(e, nivel)) velocidad = e.mirando * 110;
        e.mirando *= -1;
      }
      if (e.tiempoEstado >= t.APUNTAR) {
        // Los que tienen granadas las tiran una vez sí y otra no, si estás lejos
        e.turnoGranada = !e.turnoGranada;
        if (t.GRANADAS && e.turnoGranada && separacion(e, objetivo) > 200) {
          cambiarEstado(e, 'lanzaGranada');
        } else {
          cambiarEstado(e, 'dispara');
          e.balas = 0;
        }
      }
      break;
    case 'lanzaGranada':
      if (e.tiempoEstado >= 0.3 && !e.lanzada) {
        e.lanzada = true;
        if (e.objetivo) lanzarGranada(e, e.objetivo);
      }
      if (e.tiempoEstado >= 0.6) {
        e.lanzada = false;
        cambiarEstado(e, 'recarga');
      }
      break;
    case 'dispara':
      if (e.tiempoEstado >= e.balas * t.ENTRE_BALAS && e.balas < t.BALAS) {
        const punta = puntaDeArma(e, 24, 30);
        const hacia = e.objetivo ? centroDe(e.objetivo) : { x: punta.x + e.mirando * 100, y: punta.y };
        dispararBala(e, punta, hacia, { danio: t.DANIO, velocidad: t.VELOCIDAD_BALA });
        Sonido.disparo();
        e.balas++;
        e.fogonazo = 0.06;
      }
      if (e.balas >= t.BALAS) cambiarEstado(e, 'recarga');
      break;
    case 'recarga':
      if (e.tiempoEstado >= t.RECARGA) cambiarEstado(e, veA(e, objetivo, t.VISION, 140, false) ? 'apunta' : 'patrulla');
      break;
  }
  e.fogonazo = Math.max(0, (e.fogonazo || 0) - dt);
  moverEnemigo(e, nivel, dt, velocidad);
}

// Una granada que vuela en curva y explota al tocar el piso
function lanzarGranada(e, objetivo) {
  const desde = { x: centroDe(e).x, y: e.y + 10 };
  const hacia = { x: centroDe(objetivo).x, y: piesDe(objetivo) - 6 };
  const gravedad = 1100;
  const vuelo = Math.max(0.55, Math.min(1.1, Math.abs(hacia.x - desde.x) / 380));
  const v = tiroHacia(desde, hacia, gravedad, vuelo);
  lanzarProyectil({
    tipo: 'granada', deEnemigo: true, danio: e.t.DANIO_GRANADA, ancho: 12, alto: 12, vida: 2.5,
    x: desde.x, y: desde.y, vx: v.vx, vy: v.vy, gravedad, explota: 70, colorChispa: '#ffb347',
  });
  Sonido.swing();
}

// Dónde sale la bala (la punta del arma)
function puntaDeArma(e, largo, alturaMano) {
  return { x: e.x + e.ancho / 2 + e.mirando * (6 + largo), y: e.y + e.alto - alturaMano };
}

function dibujarSoldado(ctx, e, alfa) {
  if (e.estado === 'apunta' && e.objetivo) {
    const { x, y } = posicionDibujo(e, alfa);
    const desde = { x: x + e.ancho / 2 + e.mirando * 30, y: y + e.alto - 30 };
    const hacia = centroDe(e.objetivo);
    const corta = { x: desde.x + (hacia.x - desde.x) * 0.35, y: desde.y + (hacia.y - desde.y) * 0.35 };
    dibujarMira(ctx, desde, corta, 'rgba(255, 59, 59, ALFA)', 1.5, e.tiempo);
  }
  dibujarEnemigoSprite(ctx, e, alfa, { alto: e.t.ALTO_SPRITE || 62 });
  const lanzando = e.estado === 'lanzaGranada';
  dibujarArma(ctx, e, alfa, {
    largo: 22, grueso: 6, color: e.t.COLOR_ARMA || '#2b3040', fogonazo: e.fogonazo > 0, angulo: lanzando ? -1.2 : 0,
  });
}

// ============================================================
//  LIMPIADORA (la caperucita): lanzallamas de corto alcance
//  El tanque de combustible de la espalda es su punto débil: ¡pegale por detrás!
// ============================================================
TIPOS_ENEMIGOS.limpiadora = {
  nombre: 'Limpiadora',
  SPRITE: 'caperucita',
  ANCHO: 30,
  ALTO: 60,
  VIDA: 45,
  DEBIL_ESPALDA: 2,
  VELOCIDAD_PATRULLA: 60,
  VELOCIDAD_PERSECUCION: 120,
  VISION: 340,
  ALCANCE: 110,
  PREPARAR: 0.55,           // se prende la llamita piloto: es el aviso
  LLAMAS: 1.1,
  DANIO: 5,
  CADA: 0.35,               // las llamas lastiman cada este tiempo
  RECUPERAR: 1,
  TIEMPO_ATURDIDO: 0.4,
  actualizar: actualizarLimpiadora,
  dibujar: dibujarLimpiadora,
};

function cajaDeLlamas(e) {
  return cajaDelante(e, 120, 30, 16);
}

function actualizarLimpiadora(e, jugadores, nivel, dt) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  if (desaparecer(e, ['#ff7a2f', '#e0343c']) || seRecupera(e, 'persigue')) return moverEnemigo(e, nivel, dt, 0);

  switch (e.estado) {
    case 'patrulla':
      velocidad = patrullar(e, nivel);
      if (veA(e, objetivo, t.VISION)) cambiarEstado(e, 'persigue');
      break;
    case 'persigue':
      if (!veA(e, objetivo, t.VISION * 1.5, 120, false)) {
        cambiarEstado(e, 'patrulla');
        break;
      }
      mirarHacia(e, objetivo);
      if (separacion(e, objetivo) <= t.ALCANCE - 20 && Math.abs(piesDe(objetivo) - piesDe(e)) < 60) cambiarEstado(e, 'prepara');
      else if (haySueloAdelante(e, nivel)) velocidad = e.mirando * t.VELOCIDAD_PERSECUCION;
      break;
    case 'prepara':
      if (e.tiempoEstado >= t.PREPARAR) {
        cambiarEstado(e, 'llamas');
        e.golpeados = new Set();
        e.ultimaQuemadura = 0;
      }
      break;
    case 'llamas':
      e.cajaAtaque = cajaDeLlamas(e);
      if (e.tiempoEstado - e.ultimaQuemadura >= t.CADA) {
        e.golpeados = new Set();
        e.ultimaQuemadura = e.tiempoEstado;
        Sonido.fuego();
      }
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO, e.mirando)) e.golpeados.add(p);
      }
      // Chispas de fuego
      if (Math.random() < 0.7) {
        const c = e.cajaAtaque;
        agregarParticula({
          x: e.mirando > 0 ? c.x + 10 : c.x + c.ancho - 10, y: c.y + c.alto / 2,
          vx: e.mirando * (300 + Math.random() * 200), vy: (Math.random() - 0.5) * 120 - 40,
          vida: 0.3, vidaMax: 0.3, color: Math.random() < 0.5 ? '#ff7a2f' : '#ffd166',
          tamano: 4 + Math.random() * 5, gravedad: -200, brilla: true,
        });
      }
      if (e.tiempoEstado >= t.LLAMAS) cambiarEstado(e, 'recupera');
      break;
    case 'recupera':
      if (e.tiempoEstado >= t.RECUPERAR) cambiarEstado(e, 'persigue');
      break;
  }
  moverEnemigo(e, nivel, dt, velocidad);
}

function dibujarLimpiadora(ctx, e, alfa) {
  const { x, y } = posicionDibujo(e, alfa);
  // El tanque de combustible en la espalda (se dibuja detrás)
  if (e.estado !== 'derrotado') {
    ctx.save();
    ctx.translate(x + e.ancho / 2 - e.mirando * 14, y + e.alto - 44);
    ctx.fillStyle = '#b8322a';
    ctx.beginPath();
    ctx.roundRect(-7, 0, 14, 26, 5);
    ctx.fill();
    ctx.fillStyle = '#ffd23f';
    ctx.fillRect(-7, 10, 14, 3);
    ctx.restore();
  }
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 64 });
  const punta = dibujarArma(ctx, e, alfa, { largo: 20, grueso: 7, color: '#4a4f5a', alturaMano: 28 });
  if (!punta) return;
  // Llamita piloto (aviso) o la llamarada
  if (e.estado === 'prepara') {
    ctx.save();
    ctx.shadowColor = '#4dc3ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = Math.sin(e.tiempo * 40) > 0 ? '#9fe8ff' : '#4dc3ff';
    ctx.beginPath();
    ctx.arc(punta.x + e.mirando * 3, punta.y, 3 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (e.estado === 'llamas') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const largo = 120;
    const g = ctx.createLinearGradient(punta.x, 0, punta.x + e.mirando * largo, 0);
    g.addColorStop(0, 'rgba(255, 240, 160, 0.9)');
    g.addColorStop(0.4, 'rgba(255, 140, 40, 0.7)');
    g.addColorStop(1, 'rgba(255, 60, 20, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(punta.x, punta.y - 3);
    ctx.quadraticCurveTo(punta.x + e.mirando * largo * 0.6, punta.y - 22 - Math.random() * 6, punta.x + e.mirando * largo, punta.y - 6);
    ctx.lineTo(punta.x + e.mirando * largo, punta.y + 8);
    ctx.quadraticCurveTo(punta.x + e.mirando * largo * 0.6, punta.y + 20 + Math.random() * 6, punta.x, punta.y + 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// ============================================================
//  GUARDIA RIOT (el caballero): escudo de frente y empujón con el escudo
//  Usa el comportamiento del recluta (patrulla, persigue, prepara, ataca, recupera).
// ============================================================
TIPOS_ENEMIGOS.riot = {
  nombre: 'Guardia Riot',
  SPRITE: 'caballero',
  ANCHO: 32,
  ALTO: 60,
  VIDA: 60,
  ESCUDO: true,
  TIEMPO_GUARDIA_ROTA: 2.5,
  PESADO: 0.5,
  VELOCIDAD_PATRULLA: 50,
  VELOCIDAD_PERSECUCION: 105,
  VISION: 320,
  ALCANCE: 32,
  ALCANCE_GOLPE: 40,
  DANIO: 12,
  TIEMPO_PREPARAR: 0.55,
  TIEMPO_ATAQUE: 0.18,
  TIEMPO_RECUPERAR: 0.8,
  TIEMPO_ATURDIDO: 0.35,
  dibujar: dibujarRiot,
};

function dibujarRiot(ctx, e, alfa) {
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 64 });
  if (e.estado === 'derrotado') return;
  const { x, y } = posicionDibujo(e, alfa);
  const arriba = escudoActivo(e);
  let adelante = 12;
  if (e.estado === 'prepara') adelante = 6;
  else if (e.estado === 'ataca') adelante = 26;   // ¡empujón con el escudo!
  ctx.save();
  ctx.translate(x + e.ancho / 2 + e.mirando * adelante, y + e.alto - 4);
  ctx.scale(e.mirando, 1);
  if (!arriba) {
    ctx.rotate(0.9);
    ctx.globalAlpha = 0.5 + Math.random() * 0.2;
  }
  // Escudo transparente con borde de metal
  ctx.fillStyle = 'rgba(150, 200, 255, 0.28)';
  ctx.strokeStyle = arriba ? '#c9d6ea' : '#6b7486';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(0, -56, 9, 52, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ============================================================
//  FRANCOTIRADOR (el vampiro): desde lejos, con una línea láser de aviso
// ============================================================
TIPOS_ENEMIGOS.francotirador = {
  nombre: 'Francotirador',
  SPRITE: 'vampiro',
  ANCHO: 28,
  ALTO: 58,
  VIDA: 30,
  VISION: 720,
  APUNTAR: 1.3,             // el láser te sigue...
  FIJAR: 0.4,               // ...y se queda quieto un instante antes del disparo: ¡movete!
  DANIO: 15,
  VELOCIDAD_BALA: 950,
  RECARGA: 2.2,
  CERCA: 70,                // si estás así de cerca, te araña
  DANIO_ZARPAZO: 8,
  TIEMPO_ATURDIDO: 0.4,
  actualizar: actualizarFrancotirador,
  dibujar: dibujarFrancotirador,
};

function actualizarFrancotirador(e, jugadores, nivel, dt) {
  const t = e.t;
  if (desaparecer(e, ['#a01030', '#3a1020']) || seRecupera(e, 'quieto')) return moverEnemigo(e, nivel, dt, 0);
  const objetivo = jugadorMasCercano(e, jugadores);
  const loVeLejos = objetivo && Math.abs(centroDe(objetivo).x - centroDe(e).x) < t.VISION &&
                    Math.abs(centroDe(objetivo).y - centroDe(e).y) < 420;

  switch (e.estado) {
    case 'patrulla':
    case 'quieto':
    case 'persigue':
      if (objetivo && separacion(e, objetivo) < t.CERCA && Math.abs(piesDe(objetivo) - piesDe(e)) < 50) {
        mirarHacia(e, objetivo);
        cambiarEstado(e, 'preparaZarpazo');
      } else if (loVeLejos) {
        cambiarEstado(e, 'apunta');
        Sonido.apuntarLaser();
      }
      break;
    case 'apunta':
      if (!loVeLejos) {
        cambiarEstado(e, 'quieto');
        break;
      }
      mirarHacia(e, objetivo);
      e.mira = centroDe(objetivo);   // el láser sigue al jugador
      if (e.tiempoEstado >= t.APUNTAR) cambiarEstado(e, 'fija');
      break;
    case 'fija':
      if (e.tiempoEstado >= t.FIJAR) {
        const punta = puntaDeArma(e, 30, 30);
        dispararBala(e, punta, e.mira, { tipo: 'balaSniper', danio: t.DANIO, velocidad: t.VELOCIDAD_BALA, ancho: 10, alto: 6, colorChispa: '#ff5050' });
        Sonido.disparoSniper();
        e.fogonazo = 0.08;
        cambiarEstado(e, 'recarga');
      }
      break;
    case 'recarga':
      if (e.tiempoEstado >= t.RECARGA) cambiarEstado(e, 'quieto');
      break;
    case 'preparaZarpazo':
      if (e.tiempoEstado >= 0.35) {
        cambiarEstado(e, 'zarpazo');
        e.golpeados = new Set();
      }
      break;
    case 'zarpazo':
      e.cajaAtaque = cajaDelante(e, 36, 34, 10);
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO_ZARPAZO, e.mirando)) e.golpeados.add(p);
      }
      if (e.tiempoEstado >= 0.15) cambiarEstado(e, 'recarga');
      break;
  }
  e.fogonazo = Math.max(0, (e.fogonazo || 0) - dt);
  moverEnemigo(e, nivel, dt, 0);
}

function dibujarFrancotirador(ctx, e, alfa) {
  if ((e.estado === 'apunta' || e.estado === 'fija') && e.mira) {
    const desde = puntaDeArma(e, 30, 30);
    // Al fijar, el láser se pone más brillante y deja de moverse
    const color = e.estado === 'fija' ? 'rgba(255, 30, 30, 0.95)' : 'rgba(255, 50, 50, ALFA)';
    dibujarMira(ctx, desde, e.mira, color, e.estado === 'fija' ? 2.5 : 1.2, e.tiempo, false);
    ctx.save();
    ctx.fillStyle = '#ff3b3b';
    ctx.beginPath();
    ctx.arc(e.mira.x, e.mira.y, e.estado === 'fija' ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  dibujarEnemigoSprite(ctx, e, alfa, { alto: 62 });
  dibujarArma(ctx, e, alfa, { largo: 30, grueso: 5, color: '#262a33', fogonazo: e.fogonazo > 0 });
}

// ============================================================
//  TORRETA: no se mueve; apunta con un láser y dispara
//  La torreta de plasma del Acto 3 es igual, pero más fuerte.
// ============================================================
TIPOS_ENEMIGOS.torreta = {
  nombre: 'Torreta',
  ANCHO: 36,
  ALTO: 32,
  VIDA: 50,
  PESADO: 0,
  NO_SE_ATURDE: true,
  VISION: 460,
  APUNTAR: 0.8,
  DISPAROS: 1,
  ENTRE_DISPAROS: 0.2,
  DANIO: 8,
  VELOCIDAD_BALA: 430,
  TIPO_BALA: 'bala',
  RECARGA: 1.6,
  COLOR: '#e0343c',
  actualizar: actualizarTorreta,
  dibujar: dibujarTorretaEnemiga,
};

TIPOS_ENEMIGOS.torretaPlasma = {
  ...TIPOS_ENEMIGOS.torreta,
  nombre: 'Torreta de plasma',
  VIDA: 70,
  DISPAROS: 2,
  ENTRE_DISPAROS: 0.35,
  DANIO: 12,
  VELOCIDAD_BALA: 360,
  TIPO_BALA: 'plasmaRojo',
  RECARGA: 2,
  COLOR: '#ff3d7a',
};

function bocaDeTorreta(e) {
  return { x: e.x + e.ancho / 2, y: e.y + 10 };
}

function actualizarTorreta(e, jugadores, nivel, dt) {
  const t = e.t;
  if (e.estado === 'derrotado') {
    if (e.tiempoEstado >= 0.5 && !e.eliminar) {
      e.eliminar = true;
      explosion(centroDe(e).x, centroDe(e).y, 50, 0);
    }
    return;
  }
  if (e.estado === 'patrulla') e.estado = 'quieto';
  const objetivo = jugadorMasCercano(e, jugadores);
  const boca = bocaDeTorreta(e);
  const loVe = objetivo && Math.hypot(centroDe(objetivo).x - boca.x, centroDe(objetivo).y - boca.y) < t.VISION;
  if (objetivo) {
    const hacia = centroDe(objetivo);
    const deseado = Math.atan2(hacia.y - boca.y, hacia.x - boca.x);
    if (e.angulo === undefined) e.angulo = deseado;
    if (e.estado !== 'dispara') e.angulo += (deseado - e.angulo) * Math.min(1, 5 * dt);
  }
  switch (e.estado) {
    case 'quieto':
    case 'aturdido':
      if (loVe) cambiarEstado(e, 'apunta');
      break;
    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'quieto');
      break;
    case 'apunta':
      if (!loVe) cambiarEstado(e, 'quieto');
      else if (e.tiempoEstado >= t.APUNTAR) {
        cambiarEstado(e, 'dispara');
        e.balas = 0;
      }
      break;
    case 'dispara':
      if (e.tiempoEstado >= e.balas * t.ENTRE_DISPAROS && e.balas < t.DISPAROS) {
        const desde = { x: boca.x + Math.cos(e.angulo) * 22, y: boca.y + Math.sin(e.angulo) * 22 };
        const hacia = { x: desde.x + Math.cos(e.angulo) * 100, y: desde.y + Math.sin(e.angulo) * 100 };
        dispararBala(e, desde, hacia, { tipo: t.TIPO_BALA, danio: t.DANIO, velocidad: t.VELOCIDAD_BALA, vida: 2.5, ancho: 10, alto: 10 });
        Sonido.disparo();
        e.balas++;
      }
      if (e.balas >= t.DISPAROS) cambiarEstado(e, 'recarga');
      break;
    case 'recarga':
      if (e.tiempoEstado >= t.RECARGA) cambiarEstado(e, loVe ? 'apunta' : 'quieto');
      break;
  }
  e.vx = 0;
}

function dibujarTorretaEnemiga(ctx, e, alfa) {
  const t = e.t;
  const boca = bocaDeTorreta(e);
  if (e.estado === 'apunta' && e.angulo !== undefined) {
    const hasta = { x: boca.x + Math.cos(e.angulo) * 400, y: boca.y + Math.sin(e.angulo) * 400 };
    dibujarMira(ctx, boca, hasta, 'rgba(255, 59, 59, ALFA)', 1.2, e.tiempo);
  }
  ctx.save();
  if (e.estado === 'derrotado') ctx.globalAlpha = Math.max(0, 1 - e.tiempoEstado * 2);
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 2})`;
  // Base
  ctx.fillStyle = '#3a4050';
  ctx.beginPath();
  ctx.moveTo(e.x, e.y + e.alto);
  ctx.lineTo(e.x + 6, e.y + 12);
  ctx.lineTo(e.x + e.ancho - 6, e.y + 12);
  ctx.lineTo(e.x + e.ancho, e.y + e.alto);
  ctx.closePath();
  ctx.fill();
  // Cabeza que gira y el cañón
  ctx.translate(boca.x, boca.y);
  ctx.rotate(e.angulo ?? (e.mirando > 0 ? 0 : Math.PI));
  ctx.fillStyle = '#5d6574';
  ctx.fillRect(0, -4, 24, 8);
  ctx.fillStyle = '#4a5160';
  ctx.beginPath();
  ctx.arc(0, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowColor = t.COLOR;
  ctx.shadowBlur = e.estado === 'apunta' ? 14 : 6;
  ctx.fillStyle = t.COLOR;
  ctx.beginPath();
  ctx.arc(3, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ============================================================
//  TUBO DE GAS: ¡explota! Pegale cuando haya enemigos cerca (y alejate)
// ============================================================
TIPOS_ENEMIGOS.tuboGas = {
  nombre: 'Tubo de gas',
  OBJETO: true,             // no es un enemigo de verdad: no cuenta ni lo ataca la IA
  ANCHO: 26,
  ALTO: 56,
  VIDA: 1,
  PESADO: 0,
  NO_SE_ATURDE: true,
  MECHA: 0.5,               // segundos entre el golpe y la explosión
  RADIO: 115,
  DANIO: 15,                // a los jugadores
  DANIO_ENEMIGOS: 45,
  actualizar: actualizarTuboGas,
  dibujar: dibujarTuboGas,
};

function actualizarTuboGas(e) {
  e.vx = 0;
  if (e.estado === 'patrulla') e.estado = 'quieto';
  if (e.estado === 'congelado' || e.estado === 'aturdido') e.estado = 'quieto';
  if (e.estado === 'derrotado' && e.tiempoEstado >= e.t.MECHA && !e.eliminar) {
    e.eliminar = true;
    const centro = centroDe(e);
    explosion(centro.x, centro.y, e.t.RADIO, e.t.DANIO, { lastimaEnemigos: true, danioEnemigos: e.t.DANIO_ENEMIGOS, color: '#ffb347' });
  } else if (e.estado === 'derrotado' && Math.random() < 0.5) {
    estela(e.x + e.ancho / 2 + (Math.random() - 0.5) * 10, e.y, '#dfe6ee');   // silba y echa gas
  }
}

function dibujarTuboGas(ctx, e) {
  const peligro = e.estado === 'derrotado';
  ctx.save();
  if (peligro) ctx.translate(Math.sin(e.tiempo * 70) * 1.5, 0);
  if (e.destello > 0 || (peligro && Math.sin(e.tiempo * 40) > 0)) ctx.filter = 'brightness(1.8)';
  ctx.fillStyle = '#c8322a';
  ctx.beginPath();
  ctx.roundRect(e.x, e.y + 6, e.ancho, e.alto - 6, 8);
  ctx.fill();
  ctx.fillStyle = '#8c1f1a';
  ctx.fillRect(e.x + e.ancho - 7, e.y + 10, 4, e.alto - 14);
  ctx.fillStyle = '#5d6574';
  ctx.fillRect(e.x + e.ancho / 2 - 5, e.y, 10, 8);       // válvula
  // Cartel de peligro
  ctx.fillStyle = '#ffd23f';
  ctx.beginPath();
  ctx.moveTo(e.x + e.ancho / 2, e.y + 20);
  ctx.lineTo(e.x + e.ancho / 2 + 9, e.y + 36);
  ctx.lineTo(e.x + e.ancho / 2 - 9, e.y + 36);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(e.x + e.ancho / 2 - 1, e.y + 25, 2, 6);
  ctx.fillRect(e.x + e.ancho / 2 - 1, e.y + 32, 2, 2);
  ctx.restore();
}
