// ============================================================
//  TRAMPAS: cosas del escenario que lastiman
//  Se ponen en la lista "trampas" de cada nivel (niveles-acto1.js, etc.):
//    { tipo: 'prensa', x, ancho, techo, desfase }  → baja de golpe y aplasta (¡también a los enemigos!)
//    { tipo: 'vapor', x, alto, desfase }            → un chorro que quema y empuja para arriba
//    { tipo: 'pinchos', x, ancho, y }               → pinchos en el piso: lastiman y hacen rebotar
//  Además:
//    - los charcos de ácido que dejan los Mutantes (aparecen solos),
//    - las plataformas con "fragil: true", que se derrumban si te quedás parado encima.
//  Cada trampa avisa antes de lastimar: tiembla, titila o echa humito.
// ============================================================

const Trampas = {
  lista: [],
  charcos: [],
  caidas: [],      // plataformas frágiles que se cayeron (vuelven al rato)
};

// Cuánto dura cada parte del ciclo de una trampa (en segundos)
const CICLO_PRENSA = { arriba: 1.5, aviso: 0.55, baja: 0.12, abajo: 0.6, sube: 0.7 };
const CICLO_VAPOR = { quieto: 2.2, aviso: 0.8, chorro: 1.3 };
const DANIO_PRENSA = 25;
const DANIO_VAPOR = 8;
const DANIO_PINCHOS = 10;
const DANIO_ACIDO = 4;
const FRAGIL = { aguanta: 0.55, vuelve: 4 };   // segundos parado antes de caerse · segundos hasta que vuelve

function crearTrampas(nivel) {
  Trampas.lista = (nivel.trampas || []).map((datos) => ({
    ...datos,
    fase: datos.tipo === 'prensa' ? 'arriba' : 'quieto',
    tiempoFase: -(datos.desfase || 0),   // el desfase hace que no se muevan todas juntas
    golpeados: new Set(),
  }));
  Trampas.charcos = [];
  Trampas.caidas = [];
  for (const p of nivel.plataformas) p.pisada = 0;
}

function actualizarTrampas(nivel, jugadores, enemigos, dt) {
  for (const t of Trampas.lista) {
    t.tiempoFase += dt;
    if (t.tipo === 'prensa') actualizarPrensa(t, jugadores, enemigos);
    else if (t.tipo === 'vapor') actualizarVapor(t, jugadores);
    else if (t.tipo === 'pinchos') actualizarPinchos(t, jugadores);
  }
  actualizarCharcos(jugadores, dt);
  actualizarFragiles(nivel, jugadores, dt);
}

// Pasa a la siguiente parte del ciclo cuando se termina el tiempo de la actual
function avanzarCiclo(t, ciclo, orden) {
  if (t.tiempoFase < ciclo[t.fase]) return false;
  t.tiempoFase -= ciclo[t.fase];
  t.fase = orden[(orden.indexOf(t.fase) + 1) % orden.length];
  return true;
}

// ---------- Prensa hidráulica ----------

// Dónde está la cabeza de la prensa (el bloque que aplasta)
function cabezaDePrensa(t) {
  const recorrido = PISO - 40 - t.techo;   // cuánto baja
  let bajada = 0;
  if (t.fase === 'baja') bajada = Math.min(1, t.tiempoFase / CICLO_PRENSA.baja);
  else if (t.fase === 'abajo') bajada = 1;
  else if (t.fase === 'sube') bajada = 1 - t.tiempoFase / CICLO_PRENSA.sube;
  return { x: t.x, y: t.techo + recorrido * bajada, ancho: t.ancho, alto: 40 };
}

function actualizarPrensa(t, jugadores, enemigos) {
  if (avanzarCiclo(t, CICLO_PRENSA, ['arriba', 'aviso', 'baja', 'abajo', 'sube'])) {
    if (t.fase === 'baja') t.golpeados = new Set();
    if (t.fase === 'abajo' && cercaDeLaCamara(t.x)) {
      Sonido.prensa();
      temblar(5);
      polvo(t.x + t.ancho / 2, PISO, 10);
    }
  }
  if (t.fase !== 'baja' && t.fase !== 'abajo') return;
  if (t.fase === 'abajo' && t.tiempoFase > 0.1) return;   // solo lastima al bajar
  const cabeza = cabezaDePrensa(t);
  const zona = { x: cabeza.x + 4, y: cabeza.y, ancho: cabeza.ancho - 8, alto: PISO - cabeza.y };
  for (const p of jugadores) {
    if (t.golpeados.has(p) || !seTocan(zona, p)) continue;
    t.golpeados.add(p);
    golpearJugador(p, DANIO_PRENSA, centroDe(p).x < t.x + t.ancho / 2 ? -1 : 1);
  }
  // ¡Los enemigos también se aplastan!
  const ataque = crearAtaque(zona, { danio: 60, empujeX: 300, empujeY: 200, fuerte: true }, 0, t.golpeados);
  golpearEnemigos(ataque, enemigos);
}

// ---------- Chorro de vapor ----------

function zonaDeVapor(t) {
  return { x: t.x - 22, y: PISO - t.alto, ancho: 44, alto: t.alto };
}

function actualizarVapor(t, jugadores) {
  if (avanzarCiclo(t, CICLO_VAPOR, ['quieto', 'aviso', 'chorro'])) {
    if (t.fase === 'chorro') {
      t.golpeados = new Set();
      if (cercaDeLaCamara(t.x)) Sonido.vapor();
    }
  }
  if (t.fase !== 'chorro') return;
  const zona = zonaDeVapor(t);
  for (const p of jugadores) {
    if (!seTocan(zona, p)) continue;
    // Te empuja para arriba (y te quema una sola vez por chorro)
    if (!p.forzado) p.vy = Math.min(p.vy, -560);
    if (!t.golpeados.has(p) && golpearJugador(p, DANIO_VAPOR, centroDe(p).x < t.x ? -1 : 1)) t.golpeados.add(p);
  }
}

// ---------- Pinchos ----------

function actualizarPinchos(t, jugadores) {
  const zona = { x: t.x, y: (t.y ?? PISO) - 14, ancho: t.ancho, alto: 14 };
  for (const p of jugadores) {
    if (!seTocan(zona, p)) continue;
    if (golpearJugador(p, DANIO_PINCHOS, centroDe(p).x < t.x + t.ancho / 2 ? -1 : 1)) p.vy = -700;
  }
}

// ---------- Charcos de ácido ----------

function crearCharco(x, y) {
  Trampas.charcos.push({ x, y, ancho: 60, tiempo: 4, golpe: 0 });
}

function actualizarCharcos(jugadores, dt) {
  for (const c of Trampas.charcos) {
    c.tiempo -= dt;
    c.golpe -= dt;
    if (c.golpe > 0) continue;
    const zona = { x: c.x - c.ancho / 2, y: c.y - 8, ancho: c.ancho, alto: 10 };
    for (const p of jugadores) {
      if (!seTocan(zona, p) || !puedeRecibirGolpe(p)) continue;
      // El ácido lastima de a poquito y sin empujar fuerte
      p.vida = Math.max(0, p.vida - DANIO_ACIDO);
      numeroDeDanio(centroDe(p).x, p.y, DANIO_ACIDO, '#a6ff4d');
      Sonido.danio();
      c.golpe = 0.6;
    }
  }
  Trampas.charcos = Trampas.charcos.filter((c) => c.tiempo > 0);
}

// ---------- Plataformas frágiles ----------

function estaParadoEn(p, pl) {
  return p.enElSuelo && Math.abs(p.y + p.alto - pl.y) < 1 && p.x + p.ancho > pl.x && p.x < pl.x + pl.ancho;
}

function actualizarFragiles(nivel, jugadores, dt) {
  for (const pl of nivel.plataformas) {
    if (!pl.fragil) continue;
    const alguien = jugadores.some((p) => !p.seCayo && estaParadoEn(p, pl));
    if (alguien || pl.pisada > 0) pl.pisada += dt;   // una vez que cruje, se cae igual
    if (pl.pisada === dt) Sonido.crujido();
    if (pl.pisada >= FRAGIL.aguanta) {
      nivel.plataformas = nivel.plataformas.filter((otra) => otra !== pl);
      Trampas.caidas.push({ plataforma: pl, tiempo: 0, caida: 0 });
      polvo(pl.x + pl.ancho / 2, pl.y, 8);
      Sonido.crujido();
      pl.pisada = 0;
    }
  }
  // Las que se cayeron vuelven a su lugar al rato
  for (const c of Trampas.caidas) {
    c.tiempo += dt;
    c.caida += (200 + c.tiempo * 900) * dt;
    if (c.tiempo >= FRAGIL.vuelve) {
      nivel.plataformas.push(c.plataforma);
      c.volvio = true;
    }
  }
  Trampas.caidas = Trampas.caidas.filter((c) => !c.volvio);
}

// ¿Está cerca de lo que se ve? (para no hacer ruido con trampas lejanas)
function cercaDeLaCamara(x) {
  return x > Camara.x - 200 && x < Camara.x + Camara.vistaAncho() + 200;
}

// ============================================================
//  DIBUJOS
// ============================================================

function dibujarTrampas(ctx, tiempo) {
  for (const t of Trampas.lista) {
    if (t.tipo === 'prensa') dibujarPrensa(ctx, t, tiempo);
    else if (t.tipo === 'vapor') dibujarVapor(ctx, t, tiempo);
    else if (t.tipo === 'pinchos') dibujarPinchos(ctx, t);
  }
  for (const c of Trampas.charcos) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, c.tiempo);
    ctx.fillStyle = 'rgba(140, 255, 60, 0.55)';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 2, c.ancho / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8ffa0';
    if (Math.sin(tiempo * 9 + c.x) > 0.7) ctx.fillRect(c.x - 10 + ((tiempo * 30) % 20), c.y - 8, 3, 3);   // burbujitas
    ctx.restore();
  }
  for (const c of Trampas.caidas) {
    const pl = c.plataforma;
    if (c.caida > 900) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - c.caida / 900);
    ctx.translate(pl.x + pl.ancho / 2, pl.y + c.caida);
    ctx.rotate(c.tiempo * 0.8);
    ctx.fillStyle = '#5a4c40';
    ctx.fillRect(-pl.ancho / 2, 0, pl.ancho, pl.alto);
    ctx.restore();
  }
}

function dibujarPrensa(ctx, t, tiempo) {
  const cabeza = cabezaDePrensa(t);
  const temblor = t.fase === 'aviso' ? Math.sin(tiempo * 60) * 2 : 0;
  // El caño y el pistón
  ctx.fillStyle = '#2b3240';
  ctx.fillRect(t.x - 6, t.techo - 30, t.ancho + 12, 30);
  ctx.fillStyle = '#8a929f';
  ctx.fillRect(t.x + t.ancho / 2 - 8 + temblor, t.techo, 16, cabeza.y - t.techo);
  // La cabeza: amarilla y negra, como las máquinas peligrosas
  ctx.fillStyle = '#3a3f4a';
  ctx.fillRect(cabeza.x + temblor, cabeza.y, cabeza.ancho, cabeza.alto);
  ctx.save();
  ctx.beginPath();
  ctx.rect(cabeza.x + temblor, cabeza.y + cabeza.alto - 12, cabeza.ancho, 12);
  ctx.clip();
  for (let x = -20; x < cabeza.ancho + 20; x += 20) {
    ctx.fillStyle = '#ffd23f';
    ctx.beginPath();
    ctx.moveTo(cabeza.x + x + temblor, cabeza.y + cabeza.alto);
    ctx.lineTo(cabeza.x + x + 10 + temblor, cabeza.y + cabeza.alto - 12);
    ctx.lineTo(cabeza.x + x + 20 + temblor, cabeza.y + cabeza.alto - 12);
    ctx.lineTo(cabeza.x + x + 10 + temblor, cabeza.y + cabeza.alto);
    ctx.fill();
  }
  ctx.restore();
  // Luz de aviso: roja cuando está por bajar
  const peligro = t.fase === 'aviso' || t.fase === 'baja';
  ctx.save();
  ctx.shadowColor = peligro ? '#ff3b3b' : '#7dff5a';
  ctx.shadowBlur = peligro ? 14 : 4;
  ctx.fillStyle = peligro && Math.sin(tiempo * 30) > 0 ? '#ff5050' : peligro ? '#7a2020' : '#3d8a30';
  ctx.beginPath();
  ctx.arc(t.x + t.ancho / 2, t.techo - 15, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Marca en el piso: dónde va a aplastar
  ctx.fillStyle = peligro ? 'rgba(255, 60, 60, 0.35)' : 'rgba(255, 210, 63, 0.18)';
  ctx.fillRect(t.x, PISO - 4, t.ancho, 4);
}

function dibujarVapor(ctx, t, tiempo) {
  // El caño en el piso
  ctx.fillStyle = '#3a4250';
  ctx.fillRect(t.x - 16, PISO - 10, 32, 10);
  ctx.fillStyle = '#596273';
  ctx.fillRect(t.x - 20, PISO - 14, 40, 5);
  ctx.save();
  if (t.fase === 'aviso') {
    // Humito de aviso
    ctx.fillStyle = 'rgba(220, 230, 240, 0.35)';
    for (let i = 0; i < 3; i++) {
      const h = (tiempo * 60 + i * 13) % 30;
      ctx.beginPath();
      ctx.arc(t.x + Math.sin(tiempo * 7 + i) * 6, PISO - 16 - h, 4 + h * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (t.fase === 'chorro') {
    const final = Math.min(1, (CICLO_VAPOR.chorro - t.tiempoFase) * 3);   // se apaga al final
    for (let i = 0; i < 14; i++) {
      const avance = ((tiempo * 2.5 + i / 14) % 1);
      const y = PISO - 14 - avance * t.alto;
      const radio = 12 + avance * 16;
      ctx.fillStyle = `rgba(230, 238, 245, ${(0.45 - avance * 0.35) * final})`;
      ctx.beginPath();
      ctx.arc(t.x + Math.sin(i * 1.7 + tiempo * 5) * 6, y, radio, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function dibujarPinchos(ctx, t) {
  const y = t.y ?? PISO;
  ctx.fillStyle = '#9aa3b5';
  for (let x = t.x; x < t.x + t.ancho; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 7, y - 14);
    ctx.lineTo(x + 14, y);
    ctx.fill();
  }
  ctx.fillStyle = '#5b6578';
  ctx.fillRect(t.x, y - 2, t.ancho, 2);
}
