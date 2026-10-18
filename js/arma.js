// ============================================================
//  EL PULSOR: el arma de Jax
//  - Con {disparar} dispara (si lo mantenés apretado, sigue disparando).
//  - Cada disparo gasta 1 bala. Las balas se consiguen derrotando enemigos
//    y abriendo los COFRES de suministros (¡pegales o disparales para abrirlos!).
//  - El Pulsor "aprende": cuantos más enemigos derrotes, más sube de nivel.
//    Nivel 1 Pulsor · 2 Turbo (más rápido) · 3 Abanico (3 balas) · 4 Cañón Némesis (atraviesa)
// ============================================================

const ARMA = {
  BALAS_INICIALES: 15,   // con cuántas empieza una partida nueva
  BALAS_MINIMAS: 8,      // al empezar un nivel (o volver a una terminal) siempre hay por lo menos estas
  BALAS_MAXIMAS: 30,     // cuántas entran en el cargador (el Taller de Elena lo agranda)
  DANIO_A_JEFES: 0.45,   // los jefes tienen blindaje: las balas les hacen menos de la mitad
  // Los niveles del arma. "bajas" = cuántos enemigos hay que haber derrotado en la partida
  NIVELES: [
    { bajas: 0, nombre: 'Pulsor', danio: 6, cadencia: 0.32, balas: 1, velocidad: 950, color: '#ff9a3c', cuerpo: '#5a6478' },
    { bajas: 15, nombre: 'Pulsor Turbo', danio: 7, cadencia: 0.17, balas: 1, velocidad: 1100, color: '#5fd4ff', cuerpo: '#33618f' },
    { bajas: 45, nombre: 'Pulsor Abanico', danio: 5, cadencia: 0.24, balas: 3, velocidad: 1000, color: '#c99bff', cuerpo: '#5b3a8f' },
    { bajas: 90, nombre: 'Cañón Némesis', danio: 7, cadencia: 0.2, balas: 3, velocidad: 1200, color: '#ff4a2a', cuerpo: '#2a2d36',
      atraviesa: true },
  ],
};

// Lo que dice Elena cuando el arma sube de nivel
const MENSAJES_DEL_ARMA = [
  '',
  '¡El Pulsor aprendió de tus peleas! Nivel 2: PULSOR TURBO. Ahora dispara mucho más rápido.',
  '¡Nivel 3: PULSOR ABANICO! Tira tres balas por disparo... y gasta una sola.',
  '¡Nivel 4: CAÑÓN NÉMESIS! Las balas atraviesan a los enemigos. Es lo más fuerte que pude armar.',
];

const Cofres = { lista: [] };
const Municion = { sueltas: [] };

// ---------- Balas y bajas de la partida ----------

// En la práctica no hay partida: se guarda en el Juego mientras dure
function datosDelArma() {
  if (Juego.partida) return Juego.partida;
  if (!Juego.armaPractica) Juego.armaPractica = { balas: ARMA.BALAS_INICIALES, bajas: 0 };
  return Juego.armaPractica;
}

function bajasDelArma() {
  return Juego.partida ? Juego.partida.estadisticas.enemigosDerrotados || 0 : datosDelArma().bajas;
}

// Qué nivel tiene el arma con tantas bajas (0 = el primero)
function nivelDelArma(bajas) {
  let nivel = 0;
  ARMA.NIVELES.forEach((datos, i) => { if (bajas >= datos.bajas) nivel = i; });
  return nivel;
}

// De 0 a 1: cuánto falta para el próximo nivel (1 si ya está al máximo)
function progresoDelArma() {
  const bajas = bajasDelArma();
  const nivel = nivelDelArma(bajas);
  const siguiente = ARMA.NIVELES[nivel + 1];
  if (!siguiente) return 1;
  const desde = ARMA.NIVELES[nivel].bajas;
  return (bajas - desde) / (siguiente.bajas - desde);
}

// Al empezar un nivel: las balas que tenía, el tamaño del cargador y el nivel del arma
function prepararArma(jax) {
  const partida = Juego.partida;
  jax.balasMax = ARMA.BALAS_MAXIMAS + nivelDeMejora('cargador') * 10;
  let balas = datosDelArma().balas ?? ARMA.BALAS_INICIALES;
  if (partida && Juego.checkpoint >= 0 && partida.jax && typeof partida.jax.balas === 'number') balas = partida.jax.balas;
  jax.balas = Math.min(jax.balasMax, Math.max(ARMA.BALAS_MINIMAS, balas));
  jax.nivelArma = nivelDelArma(bajasDelArma());
}

// Se llama cada vez que cae un enemigo
function contarBajaDelArma() {
  if (!Juego.partida) datosDelArma().bajas++;
  const jax = Juego.jax;
  const nivel = nivelDelArma(bajasDelArma());
  if (jax && nivel > (jax.nivelArma || 0)) subirNivelDelArma(jax, nivel);
}

function subirNivelDelArma(jax, nivel) {
  const datos = ARMA.NIVELES[nivel];
  const centro = centroDe(jax);
  jax.nivelArma = nivel;
  jax.balas = jax.balasMax;   // de premio, el cargador se llena
  jax.armaFuera = 2;
  ondaExpansiva(centro.x, centro.y, 160, datos.color, 1);
  chispas(centro.x, centro.y, datos.color, 30, 380);
  camaraLenta(0.5);
  Sonido.subirArma();
  Juego.cartelArma = { nivel, hasta: Juego.tiempo + 3.5 };
  decirPorRadio(MENSAJES_DEL_ARMA[nivel], 'elena');
}

// ---------- Disparar ----------

function actualizarArma(jax, c, dt) {
  jax.recargaDisparo = Math.max(0, jax.recargaDisparo - dt);
  jax.disparo = Math.max(0, jax.disparo - dt);
  jax.armaFuera = Math.max(0, jax.armaFuera - dt);
  if (!c.disparar && !c.dispararRecien) return;
  // Mientras pega, esquiva o está aturdido, no puede disparar
  if (jax.accion || jax.aturdido > 0 || (jax.esquivando > 0 && jax.forzado)) return;
  if (jax.recargaDisparo > 0) return;
  if (jax.balas <= 0) {
    if (c.dispararRecien) {
      textoFlotante(centroDe(jax).x, jax.y - 20, '¡SIN BALAS!', '#ff8080');
      Sonido.sinBalas();
      jax.armaFuera = 0.6;
    }
    return;
  }
  dispararPulsor(jax);
}

// La punta del cañón (en el mundo): el Pulsor está en el puño de adelante
function bocaDelArma(jax) {
  return { x: jax.x + jax.ancho / 2 + jax.mirando * 52, y: jax.y + 1 };
}

function dispararPulsor(jax) {
  const datos = ARMA.NIVELES[jax.nivelArma || 0];
  jax.balas--;
  jax.recargaDisparo = datos.cadencia;
  jax.disparo = 0.14;      // el brazo "patea" para atrás un ratito
  jax.armaFuera = 1.4;     // cuánto tiempo sigue con el arma en la mano
  const boca = bocaDelArma(jax);
  const angulos = datos.balas === 3 ? [-0.09, 0, 0.09] : [0];
  for (const angulo of angulos) {
    lanzarProyectil({
      tipo: 'balaJax', x: boca.x, y: boca.y,
      vx: jax.mirando * Math.cos(angulo) * datos.velocidad, vy: Math.sin(angulo) * datos.velocidad,
      vida: 0.85, duenio: jax, danio: datos.danio, color: datos.color, nivelArma: jax.nivelArma || 0,
      ancho: 14, alto: 6,
      altoGolpe: 44,      // le pega a todo lo que esté entre la mano y la cintura (así no se pasa por arriba de los bajitos)
      atraviesaEnemigos: !!datos.atraviesa, golpeados: new Set(),
    });
  }
  chispas(boca.x, boca.y, datos.color, 4, 140);
  if (jax.nivelArma >= 3) temblar(1.5);
  Sonido.pulsor(jax.nivelArma || 0);
}

// Lo que pasa cuando una bala de Jax le pega a un enemigo (lo llama proyectiles.js)
function impactarBala(p, e, enemigos) {
  const danio = p.danio * (e.t.JEFE ? ARMA.DANIO_A_JEFES : 1);
  const ataque = crearAtaque(cajaDeGolpe(p), { danio }, Math.sign(p.vx) || 1, new Set());
  ataque.liviano = true;    // no aturde ni empuja: para eso están los puños
  ataque.duenio = p.duenio;
  golpearEnemigo(e, ataque, enemigos);
  chispas(p.x, p.y, p.color, 6, 200);
}

// ---------- Cofres de suministros ----------

// En los niveles: cofres: [{ x, altura, dorado }]  (altura: dónde apoya, medida desde el piso)
function prepararCofres(nivel, desde) {
  Cofres.lista = (nivel.cofres || [])
    .filter((c) => c.x > desde)
    .map((c) => ({ x: c.x, y: PISO - (c.altura || 0), dorado: !!c.dorado, abierto: false, tiempo: 0 }));
}

function cajaDeCofre(c) {
  const ancho = c.dorado ? 46 : 40;
  return { x: c.x - ancho / 2, y: c.y - 32, ancho, alto: 32 };
}

// Un golpe o un disparo que toca un cofre lo abre. Devuelve true si abrió alguno.
function golpearCofres(caja) {
  let abrio = false;
  for (const c of Cofres.lista) {
    if (c.abierto || !seTocan(caja, cajaDeCofre(c))) continue;
    abrirCofre(c);
    abrio = true;
  }
  return abrio;
}

function abrirCofre(c) {
  c.abierto = true;
  c.tiempo = 0;
  const extra = nivelDeMejora('cargador') * 2;
  const balas = (c.dorado ? 14 : 6) + extra + Math.floor(Math.random() * 3);
  soltarMunicion(c.x, c.y - 30, balas, c.dorado ? 4 : 2);
  lanzarNucleos(c.x, c.y - 30, c.dorado ? 14 : 5);
  // A veces (y siempre en los dorados) también hay un inyector
  if (c.dorado || Math.random() < 0.25) Juego.objetos.push({ tipo: 'inyector', x: c.x + 34, y: c.y, agarrado: false });
  const color = c.dorado ? '#ffd166' : '#ff9a3c';
  chispas(c.x, c.y - 30, color, c.dorado ? 34 : 20, 340);
  ondaExpansiva(c.x, c.y - 16, c.dorado ? 90 : 60, color, 1);
  textoFlotante(c.x, c.y - 96, c.dorado ? '¡COFRE DORADO!' : '¡COFRE!', color);
  temblar(c.dorado ? 5 : 3);
  Sonido.cofre();
}

// ---------- Balas para agarrar ----------

// Suelta "cantidad" balas repartidas en "paquetes" cajitas
function soltarMunicion(x, y, cantidad, paquetes = 1) {
  for (let i = 0; i < paquetes; i++) {
    const enEste = Math.floor(cantidad / paquetes) + (i < cantidad % paquetes ? 1 : 0);
    if (enEste <= 0) continue;
    Municion.sueltas.push({
      x, y, cantidad: enEste, tiempo: 0,
      vx: (Math.random() * 2 - 1) * 180, vy: -260 - Math.random() * 200,
    });
  }
}

// Los enemigos a veces sueltan balas (más seguido si te quedan pocas)
function soltarMunicionDeEnemigo(e) {
  if (e.t.OBJETO || e.t.INMORTAL) return;
  const centro = centroDe(e);
  if (e.t.JEFE) {
    soltarMunicion(centro.x, centro.y, 15, 3);
    return;
  }
  const pocas = Juego.jax && Juego.jax.balas < 6;
  if (Math.random() < (pocas ? 0.7 : 0.4)) soltarMunicion(centro.x, centro.y, 2 + Math.floor(Math.random() * 2));
}

function limpiarMunicion() {
  Municion.sueltas = [];
}

// Caen, rebotan y, si Jax está cerca (y tiene lugar en el cargador), vuelan hacia él
function actualizarMunicion(nivel, jax, dt) {
  for (const m of Municion.sueltas) {
    m.tiempo += dt;
    const c = centroDe(jax);
    const distancia = Math.hypot(c.x - m.x, c.y - m.y);
    const hayLugar = jax.balas < jax.balasMax;
    if (hayLugar && !jax.seCayo && jax.vida > 0 && distancia < 130 && m.tiempo > 0.35) {
      const angulo = Math.atan2(c.y - m.y, c.x - m.x);
      m.x += Math.cos(angulo) * 480 * dt;
      m.y += Math.sin(angulo) * 480 * dt;
      if (distancia < 24) {
        m.agarrada = true;
        const antes = jax.balas;
        jax.balas = Math.min(jax.balasMax, jax.balas + m.cantidad);
        textoFlotante(c.x, jax.y - 14, `+${jax.balas - antes} balas`, '#ffb347');
        Sonido.municion();
      }
      continue;
    }
    m.vy = Math.min(m.vy + GRAVEDAD * 0.7 * dt, 700);
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    const piso = nivel.plataformas.find((pl) => m.x >= pl.x && m.x <= pl.x + pl.ancho && m.y >= pl.y - 6 && m.y <= pl.y + 24);
    if (piso && m.vy > 0) {
      m.y = piso.y - 6;
      m.vy = -m.vy * 0.3;
      m.vx *= 0.5;
    }
  }
  Municion.sueltas = Municion.sueltas.filter((m) => !m.agarrada && m.tiempo < 16 && m.y < nivel.alto + 100);
}

// ============================================================
//  DIBUJOS
// ============================================================

// El Pulsor, apuntando hacia la derecha, con el puño en (x, y)
function dibujarPulsor(ctx, x, y, nivel, escala, fogonazo) {
  const datos = ARMA.NIVELES[nivel];
  const largo = [15, 17, 17, 21][nivel];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  // Empuñadura (la tapa el puño)
  ctx.fillStyle = '#1b1f28';
  ctx.save();
  ctx.rotate(0.3);
  ctx.fillRect(-3, -1, 6, 9);
  ctx.restore();
  // Cañones extra del Abanico y del Cañón Némesis
  if (nivel >= 2) {
    ctx.fillStyle = '#1b1f28';
    ctx.fillRect(largo - 9, -10, 9, 3);
    ctx.fillRect(largo - 9, 1, 9, 3);
  }
  // Cuerpo
  ctx.fillStyle = datos.cuerpo;
  ctx.beginPath();
  ctx.roundRect(-5, -8, largo, 9, 3);
  ctx.fill();
  // Cañón
  ctx.fillStyle = '#14171e';
  ctx.fillRect(largo - 6, -6, nivel === 3 ? 10 : 7, 5);
  // Franja de energía que brilla
  ctx.shadowColor = datos.color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = datos.color;
  ctx.fillRect(-2, -6, largo - 8, 2);
  if (nivel === 3) {
    ctx.beginPath();
    ctx.arc(2, -3.5, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  // El fogonazo al disparar
  if (fogonazo) {
    const punta = largo + (nivel === 3 ? 5 : 2);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = datos.color;
    ctx.beginPath();
    ctx.moveTo(punta, -3.5);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      const r = i % 2 ? 4 : 10;
      ctx.lineTo(punta + 3 + Math.cos(a) * r, -3.5 + Math.sin(a) * r * 0.7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6e0';
    ctx.beginPath();
    ctx.arc(punta + 3, -3.5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// La bala de Jax: un rayito con estela
function dibujarBalaJax(ctx, p) {
  const largo = p.nivelArma >= 3 ? 30 : 22;
  const direccion = Math.sign(p.vx) || 1;
  const angulo = Math.atan2(p.vy, Math.abs(p.vx));
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(direccion, 1);
  ctx.rotate(angulo);
  const estela = ctx.createLinearGradient(-largo, 0, 0, 0);
  estela.addColorStop(0, 'rgba(0, 0, 0, 0)');
  estela.addColorStop(1, p.color);
  ctx.fillStyle = estela;
  ctx.fillRect(-largo, -2.5, largo, 5);
  ctx.fillStyle = '#fff6e0';
  ctx.beginPath();
  ctx.ellipse(0, 0, p.nivelArma >= 3 ? 7 : 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarCofres(ctx, tiempo) {
  for (const c of Cofres.lista) dibujarCofre(ctx, c, tiempo);
}

function dibujarCofre(ctx, c, tiempo) {
  const caja = cajaDeCofre(c);
  const color = c.dorado ? '#ffd166' : '#ff9a3c';
  const x = caja.x, y = caja.y, ancho = caja.ancho;
  ctx.save();
  // El brillo de abajo (late, para que se note que se puede abrir)
  if (!c.abierto) {
    ctx.globalCompositeOperation = 'lighter';
    const luz = ctx.createRadialGradient(c.x, c.y - 10, 2, c.x, c.y - 10, 50);
    luz.addColorStop(0, c.dorado ? 'rgba(255, 209, 102, 0.35)' : 'rgba(255, 154, 60, 0.22)');
    luz.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = luz;
    ctx.globalAlpha = 0.7 + Math.sin(tiempo * 4 + c.x) * 0.3;
    ctx.fillRect(c.x - 50, c.y - 60, 100, 60);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  // La caja de abajo
  ctx.fillStyle = c.dorado ? '#6b4a12' : '#2c3546';
  ctx.fillRect(x, y + 10, ancho, 22);
  ctx.fillStyle = c.dorado ? '#a87a22' : '#46536b';
  ctx.fillRect(x + 3, y + 13, ancho - 6, 16);
  ctx.fillStyle = c.dorado ? '#4a3208' : '#1b2230';
  ctx.fillRect(x + 7, y + 10, 4, 22);
  ctx.fillRect(x + ancho - 11, y + 10, 4, 22);
  // La tapa (abierta: se va para atrás)
  ctx.save();
  ctx.translate(x, y + 10);
  if (c.abierto) ctx.rotate(-Math.min(1, c.tiempo * 6) * 1.9);
  ctx.fillStyle = c.dorado ? '#8a6418' : '#3a4558';
  ctx.beginPath();
  ctx.roundRect(0, -10, ancho, 10, [4, 4, 0, 0]);
  ctx.fill();
  ctx.fillStyle = c.dorado ? '#4a3208' : '#1b2230';
  ctx.fillRect(7, -10, 4, 10);
  ctx.fillRect(ancho - 11, -10, 4, 10);
  ctx.restore();
  // La cerradura con luz
  if (!c.abierto) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    ctx.fillRect(c.x - 4, y + 7, 8, 7);
    ctx.shadowBlur = 0;
    if (c.dorado) {
      texto(ctx, '★', c.x, y + 22, { tamano: 12, negrita: true, color: '#fff3c0' });
    }
  } else {
    // Abierto: sale una luz que se apaga despacito
    const alfa = Math.max(0, 1 - c.tiempo / 1.5);
    if (alfa > 0) {
      ctx.globalCompositeOperation = 'lighter';
      const haz = ctx.createLinearGradient(0, y + 10, 0, y - 70);
      haz.addColorStop(0, c.dorado ? `rgba(255, 209, 102, ${0.6 * alfa})` : `rgba(255, 154, 60, ${0.5 * alfa})`);
      haz.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = haz;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 10);
      ctx.lineTo(x + ancho - 4, y + 10);
      ctx.lineTo(x + ancho + 10, y - 70);
      ctx.lineTo(x - 10, y - 70);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function actualizarCofres(dt) {
  for (const c of Cofres.lista) if (c.abierto) c.tiempo += dt;
}

// Las cajitas de balas que se pueden agarrar
function dibujarMunicion(ctx, tiempo) {
  for (const m of Municion.sueltas) {
    if (m.tiempo > 13 && Math.floor(m.tiempo * 10) % 2) continue;   // titilan antes de desaparecer
    const y = m.y - 6 + Math.sin(tiempo * 5 + m.x) * 1.5;
    ctx.save();
    ctx.translate(m.x, y);
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#5a4020';
    ctx.fillRect(-8, -6, 16, 11);
    ctx.shadowBlur = 0;
    // Tres balitas asomando
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(-6 + i * 5, -11, 3, 6);
      ctx.fillStyle = '#ff7a2f';
      ctx.fillRect(-6 + i * 5, -12, 3, 2);
    }
    ctx.fillStyle = '#ffb347';
    ctx.fillRect(-8, -1, 16, 2);
    ctx.restore();
  }
}

// El cartel grande cuando el arma sube de nivel
function dibujarCartelDeArma(ctx) {
  const cartel = Juego.cartelArma;
  if (!cartel || Juego.tiempo > cartel.hasta) return;
  const datos = ARMA.NIVELES[cartel.nivel];
  const falta = cartel.hasta - Juego.tiempo;
  const alfa = Math.min(1, falta * 2, (3.5 - falta) * 4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, alfa);
  ctx.fillStyle = 'rgba(4, 6, 11, 0.75)';
  ctx.fillRect(ANCHO / 2 - 230, 186, 460, 84);
  ctx.strokeStyle = datos.color;
  ctx.lineWidth = 2;
  ctx.strokeRect(ANCHO / 2 - 229, 187, 458, 82);
  dibujarPulsor(ctx, ANCHO / 2 - 186, 236, cartel.nivel, 2.4, Math.floor(Juego.tiempo * 8) % 2 === 0);
  texto(ctx, `¡ARMA NIVEL ${cartel.nivel + 1}!`, ANCHO / 2 + 30, 212, { tamano: 15, negrita: true, color: COLORES.texto });
  ctx.shadowColor = datos.color;
  ctx.shadowBlur = 14;
  texto(ctx, datos.nombre.toUpperCase(), ANCHO / 2 + 30, 244, { tamano: 28, negrita: true, color: datos.color });
  ctx.restore();
}
