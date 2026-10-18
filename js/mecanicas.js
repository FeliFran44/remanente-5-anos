// ============================================================
//  MECÁNICAS ESPECIALES DE LOS NIVELES
//  Cada nivel puede tener (en sus datos):
//    emboscadas:   [{ desde, hasta, aparecen: [...enemigos], radio }] → se cierran las puertas
//                  hasta derrotar a todos los que aparecen
//    persecucion:  { velocidad, rapida, distanciaRapida, retraso, hasta } → la Abominación X-0
//                  avanza desde la izquierda: si alcanza a alguien, es derrota (Nivel 4)
//    niebla:       { radio, hasta } → solo se ve cerca de los jugadores (Nivel 5)
//    viento:       { fuerza, cada, dura } → ráfagas de la tormenta de nieve (Nivel 7)
//  Y las consolas del Núcleo Génesis, que aparecen en la última fase de Zephyrus.
// ============================================================

// ------------------------------------------------------------
//  EMBOSCADAS
// ------------------------------------------------------------

function prepararEmboscadas(nivel, desdeX) {
  Juego.emboscadas = (nivel.emboscadas || []).map((datos, i) => ({
    ...datos,
    numero: i,
    // Las que quedaron atrás de la terminal ya se ganaron
    estado: datos.hasta < desdeX ? 'ganada' : 'esperando',
    enemigos: [],
  }));
}

function revisarEmboscadas() {
  const { jax, elena, nivel } = Juego;
  for (const em of Juego.emboscadas) {
    if (em.estado === 'esperando' && !jax.seCayo && centroDe(jax).x > em.desde + 60 && centroDe(jax).x < em.hasta) {
      empezarEmboscada(em, nivel, jax, elena);
    } else if (em.estado === 'activa') {
      const quedan = em.enemigos.filter((e) => !e.eliminar && e.estado !== 'derrotado');
      if (quedan.length === 0) terminarEmboscada(em, nivel);
    }
  }
}

function empezarEmboscada(em, nivel, jax, elena) {
  em.estado = 'activa';
  // Puertas de energía a los dos lados
  for (const x of [em.desde, em.hasta]) {
    nivel.plataformas.push({ x, y: 0, ancho: 30, alto: PISO, tipo: 'solida', puerta: true, emboscada: em.numero });
  }
  // Aparecen los enemigos, ya alertas
  em.enemigos = [];
  for (const datos of em.aparecen) {
    const e = crearEnemigo({ ...datos, y: datos.y ?? PISO });
    e.alerta = 1.2;
    if (e.estado === 'patrulla') cambiarEstado(e, 'persigue');
    e.mirando = centroDe(jax).x > e.x ? 1 : -1;
    chispas(centroDe(e).x, centroDe(e).y, '#ff5050', 12, 240);
    Juego.enemigos.push(e);
    em.enemigos.push(e);
  }
  Sonido.alarma();
  Sonido.puerta();
  avisar('¡Emboscada! Derrotá a todos para seguir');
  if (em.radio) decirPorRadio(em.radio);
  // Si Elena quedó afuera, entra con Jax
  if (elena && !elena.seCayo && (elena.x < em.desde + 30 || elena.x > em.hasta - 30)) reaparecerJunto(elena, jax, nivel);
}

function terminarEmboscada(em, nivel) {
  em.estado = 'ganada';
  nivel.plataformas = nivel.plataformas.filter((p) => p.emboscada !== em.numero);
  Sonido.puerta();
  avisar('¡Zona despejada!');
}

// ------------------------------------------------------------
//  PERSECUCIÓN (Nivel 4): la Abominación X-0 viene detrás
// ------------------------------------------------------------

function prepararPersecucion(nivel, inicioX) {
  const datos = nivel.persecucion;
  Juego.persecucion = datos ? {
    ...datos,
    x: inicioX - 650,         // dónde está la boca del monstruo
    espera: datos.retraso,    // segundos hasta que arranca
    rugio: false,
    termino: false,
    tiempo: 0,
  } : null;
}

function actualizarPersecucion(dt) {
  const per = Juego.persecucion;
  if (!per || per.termino) return;
  const { jax, elena } = Juego;
  per.tiempo += dt;

  if (per.espera > 0) {
    per.espera -= dt;
    if (per.espera <= 0 && !per.rugio) {
      per.rugio = true;
      Sonido.rugidoMonstruo();
      temblar(14);
      avisar('¡LA ABOMINACIÓN X-0! ¡CORRÉ HACIA LA DERECHA!');
    }
    return;
  }

  // Si quedó muy atrás, acelera (así siempre está cerca y da miedo)
  const vivos = [jax, elena].filter((p) => p && !p.seCayo);
  const masAtras = Math.min(...vivos.map((p) => p.x));
  const velocidad = masAtras - per.x > per.distanciaRapida ? per.rapida : per.velocidad;
  per.x += velocidad * dt;

  // Va rompiendo cosas: piedritas y temblor
  if (Math.random() < dt * 6) {
    polvo(per.x + 20, PISO, 3);
    temblar(2);
  }
  if (Math.random() < dt * 0.4) Sonido.grunido();

  // Llegó al final: el puente es muy angosto para ella y se queda atrás
  if (jax.x > per.hasta) {
    per.termino = true;
    Sonido.rugidoMonstruo();
    avisar('¡Lo lograron! La Abominación no puede cruzar el puente');
    return;
  }

  // ¿Alcanzó a alguien?
  for (const p of vivos) {
    if (p.x > per.x) continue;
    // En el Modo 2, a Elena (la computadora) la salva un teletransporte
    if (p === elena && Juego.modo === 2) {
      reaparecerJunto(elena, jax, Juego.nivel);
      continue;
    }
    Juego.causaDerrota = 'atrapado';
    Juego.jax.vida = 0;
    return;
  }
}

function dibujarPersecucion(ctx, tiempo) {
  const per = Juego.persecucion;
  if (!per) return;
  const x = per.x;
  // Una "pared" oscura que avanza, con la boca del monstruo adelante
  ctx.save();
  const sombra = ctx.createLinearGradient(x - 500, 0, x + 40, 0);
  sombra.addColorStop(0, 'rgba(10, 0, 15, 0.95)');
  sombra.addColorStop(0.8, 'rgba(30, 5, 40, 0.85)');
  sombra.addColorStop(1, 'rgba(30, 5, 40, 0)');
  ctx.fillStyle = sombra;
  ctx.fillRect(x - 2000, 0, 2040, Juego.nivel.alto);
  const respira = Math.sin(tiempo * 5) * 6;
  const alto = 230 + respira;
  if (!dibujarSprite(ctx, 'monstruo', x - 70, PISO + 20, alto, { mirando: 1 })) {
    ctx.fillStyle = '#2a1320';
    ctx.beginPath();
    ctx.arc(x - 70, PISO - 100, 130, 0, Math.PI * 2);
    ctx.fill();
  }
  // Ojos que brillan
  ctx.shadowColor = '#ff2040';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#ff4060';
  ctx.beginPath();
  ctx.arc(x - 40, PISO - 170 - respira, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------
//  NIEBLA (Nivel 5): solo se ve alrededor de los jugadores
// ------------------------------------------------------------

let lienzoNiebla = null;

function hayNiebla() {
  const n = Juego.nivel.niebla;
  return !!n && centroDe(Juego.jax).x < n.hasta;
}

// Se dibuja encima del nivel, en coordenadas de la pantalla
function dibujarNiebla(ctx, camX, camY, alfa) {
  if (!hayNiebla()) return;
  const n = Juego.nivel.niebla;
  if (!lienzoNiebla) {
    lienzoNiebla = document.createElement('canvas');
    lienzoNiebla.width = ANCHO;
    lienzoNiebla.height = ALTO;
  }
  const c = lienzoNiebla.getContext('2d');
  c.globalCompositeOperation = 'source-over';
  c.clearRect(0, 0, ANCHO, ALTO);
  c.fillStyle = 'rgba(62, 82, 66, 0.96)';   // neblina verdosa: tapa casi todo
  c.fillRect(0, 0, ANCHO, ALTO);
  // Agujeros en la niebla alrededor de cada jugador
  c.globalCompositeOperation = 'destination-out';
  for (const p of personajes()) {
    if (p.seCayo) continue;
    const pos = posicionDibujo(p, alfa);
    const x = (pos.x + p.ancho / 2 - camX) * Camara.zoom;
    const y = (pos.y + p.alto / 2 - camY) * Camara.zoom;
    const radio = (n.radio + Math.sin(Juego.tiempo * 2) * 6) * Camara.zoom;
    const g = c.createRadialGradient(x, y, radio * 0.35, x, y, radio);
    g.addColorStop(0, 'rgba(0, 0, 0, 1)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0)');
    c.fillStyle = g;
    c.beginPath();
    c.arc(x, y, radio, 0, Math.PI * 2);
    c.fill();
  }
  ctx.drawImage(lienzoNiebla, 0, 0, ANCHO, ALTO);
  // Unas nubes que se mueven, para que se note que es niebla
  ctx.save();
  ctx.fillStyle = 'rgba(170, 200, 170, 0.05)';
  for (let i = 0; i < 6; i++) {
    const x = ((i * 260 - Juego.tiempo * 25 - camX * 0.3) % 1300 + 1300) % 1300 - 170;
    ctx.beginPath();
    ctx.ellipse(x, 150 + (i % 3) * 140, 200, 50, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ¿Este punto está lejos de todos los jugadores? (los Acechadores se esconden ahí)
function lejosDeLosJugadores(x, y, distancia) {
  return personajes().every((p) => p.seCayo || Math.hypot(centroDe(p).x - x, centroDe(p).y - y) > distancia);
}

// ------------------------------------------------------------
//  VIENTO (Nivel 7): ráfagas de la tormenta de nieve empujan hacia la izquierda
// ------------------------------------------------------------

function prepararViento() {
  Juego.viento = { fuerza: 0, tiempo: 0 };
}

function actualizarViento(nivel, dt) {
  const datos = nivel.viento;
  if (!datos) return;
  const v = Juego.viento;
  v.tiempo += dt;
  const enElCiclo = v.tiempo % datos.cada;
  const soplando = enElCiclo > datos.cada - datos.dura;
  if (soplando && enElCiclo - dt <= datos.cada - datos.dura) {
    Sonido.viento();
    avisar('¡Ráfaga de viento!');
  }
  // Sube y baja suave
  const objetivo = soplando ? -datos.fuerza : 0;
  v.fuerza += (objetivo - v.fuerza) * Math.min(1, 3 * dt);
  if (Math.abs(v.fuerza) < 2) return;
  for (const p of personajes()) {
    if (p.seCayo || p.forzado) continue;
    empujarDeCostado(p, v.fuerza * dt, nivel.plataformas);
  }
}

// Mueve un cuerpo de costado sin meterlo dentro de las paredes
function empujarDeCostado(cuerpo, dx, plataformas) {
  cuerpo.x += dx;
  for (const p of plataformas) {
    if (p.tipo !== 'solida' || !seTocan(cuerpo, p)) continue;
    cuerpo.x = dx > 0 ? p.x - cuerpo.ancho : p.x + p.ancho;
  }
  cuerpo.x = Math.max(0, cuerpo.x);
}

// ------------------------------------------------------------
//  CONSOLAS (Nivel 9): para hackear el chip de la cura
//  En la última fase de Zephyrus aparecen 3 consolas. Si alguien se queda
//  al lado de cada una el tiempo suficiente, el chip queda reprogramado.
//  En los Modos 2 y 3 lo hace Elena; en el Modo 1, Jax (Elena lo guía por radio).
// ------------------------------------------------------------

const HACKEO = { segundos: 2.5, distancia: 46 };

function crearConsolas(posiciones) {
  Juego.consolas = posiciones.map((x) => ({ x, progreso: 0, lista: false }));
}

// ¿Quién puede hackear?
function hacker() {
  return Juego.modo === 1 ? Juego.jax : Juego.elena;
}

function actualizarConsolas(dt) {
  if (!Juego.consolas) return;
  const h = hacker();
  if (!h || h.seCayo || h.vida <= 0) return;
  for (const c of Juego.consolas) {
    if (c.lista) continue;
    const cerca = Math.abs(centroDe(h).x - c.x) < HACKEO.distancia && h.enElSuelo;
    if (!cerca) continue;
    c.progreso += dt / HACKEO.segundos;
    if (Math.random() < dt * 10) Sonido.hackeo();
    if (c.progreso >= 1) {
      c.lista = true;
      Sonido.hackeoListo();
      chispas(c.x, PISO - 50, '#7dff5a', 20, 260);
      const listas = Juego.consolas.filter((otra) => otra.lista).length;
      if (listas < Juego.consolas.length) {
        avisar(`Consola hackeada: ${listas} de ${Juego.consolas.length}`);
      } else {
        if (Juego.partida) Juego.partida.decisiones.chipHackeado = true;
        Juego.chipHackeado = true;
        decirPorRadio('¡Lo logré! El chip de la cura está reprogramado: ya no puede controlar a nadie.', 'elena');
      }
    }
  }
}

function consolaSinHackear(desde) {
  if (!Juego.consolas) return null;
  let elegida = null;
  for (const c of Juego.consolas) {
    if (c.lista) continue;
    if (!elegida || Math.abs(c.x - desde) < Math.abs(elegida.x - desde)) elegida = c;
  }
  return elegida;
}

function dibujarConsolas(ctx, tiempo) {
  if (!Juego.consolas) return;
  for (const c of Juego.consolas) {
    const color = c.lista ? '#7dff5a' : '#ffd166';
    ctx.fillStyle = '#2b3448';
    ctx.fillRect(c.x - 18, PISO - 46, 36, 46);
    ctx.fillStyle = '#121a2a';
    ctx.fillRect(c.x - 14, PISO - 42, 28, 18);
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = color;
    if (c.lista) {
      texto(ctx, '✓', c.x, PISO - 33, { tamano: 16, negrita: true, color });
    } else {
      ctx.fillRect(c.x - 12, PISO - 38, 24 * c.progreso, 10);
      if (Math.sin(tiempo * 6) > 0) texto(ctx, 'HACKEAR', c.x, PISO - 60, { tamano: 11, negrita: true, color });
    }
    ctx.restore();
  }
}

// ------------------------------------------------------------
//  SEÑALES DEL TREN (El Expreso Génesis, etapa 2)
//  El tren va rapidísimo: las señales y las vigas pasan de derecha a izquierda.
//    'baja' → una barrera en el techo del vagón: ¡SALTALA!
//    'alta' → una viga a la altura de un salto: ¡NO SALTES!
//  Un cartel en el borde derecho avisa cuál viene.
//  Datos del nivel: barreras: { desde, hasta, cada, velocidad }
// ------------------------------------------------------------

const DANIO_BARRERA = 12;

function prepararBarreras(nivel) {
  Juego.barreras = nivel.barreras ? { ...nivel.barreras, lista: [], espera: 2.5, cuenta: 0, aviso: 0, proxima: 'baja' } : null;
}

function cajaDeBarrera(b) {
  return b.tipo === 'baja'
    ? { x: b.x, y: PISO - 34, ancho: 20, alto: 34 }
    : { x: b.x - 10, y: PISO - 150, ancho: 40, alto: 62 };
}

function actualizarBarreras(dt) {
  const B = Juego.barreras;
  if (!B) return;
  const x = centroDe(Juego.jax).x;
  const enLaZona = x > B.desde && x < B.hasta;
  if (enLaZona) {
    B.espera -= dt;
    // Un segundo antes, el aviso
    if (B.espera <= 1.1 && B.aviso <= 0) {
      B.proxima = B.cuenta % 3 === 2 ? 'alta' : 'baja';
      B.aviso = 1.1;
      Sonido.pitido();
    }
    if (B.espera <= 0) {
      B.lista.push({ x: Camara.x + Camara.vistaAncho() + 60, tipo: B.proxima, golpeados: new Set() });
      B.espera = B.cada;
      B.cuenta++;
      Sonido.tren();
    }
  }
  B.aviso = Math.max(0, B.aviso - dt);
  for (const b of B.lista) {
    b.x -= B.velocidad * dt;
    const caja = cajaDeBarrera(b);
    for (const p of personajes()) {
      if (b.golpeados.has(p) || !seTocan(caja, p)) continue;
      if (golpearJugador(p, DANIO_BARRERA, -1)) {
        b.golpeados.add(p);
        p.vx = -420;
      }
    }
  }
  B.lista = B.lista.filter((b) => b.x > Camara.x - 300);
}

function dibujarBarreras(ctx) {
  const B = Juego.barreras;
  if (!B) return;
  for (const b of B.lista) {
    if (b.tipo === 'baja') {
      // Una barrera con rayas rojas y blancas
      ctx.fillStyle = '#3a3f4a';
      ctx.fillRect(b.x + 6, PISO - 40, 8, 40);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#f4f6fb' : '#e0343c';
        ctx.fillRect(b.x, PISO - 34 + i * 7, 20, 7);
      }
      ctx.fillStyle = Math.sin(Juego.tiempo * 20) > 0 ? '#ff3b3b' : '#5a1a1a';
      ctx.beginPath();
      ctx.arc(b.x + 10, PISO - 44, 5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Una viga de un puente que pasa por arriba
      const c = cajaDeBarrera(b);
      ctx.fillStyle = '#4a5160';
      ctx.fillRect(c.x - 20, 0, 18, c.y + c.alto);
      ctx.fillStyle = '#5d6574';
      ctx.fillRect(c.x - 30, c.y, c.ancho + 40, c.alto);
      ctx.strokeStyle = '#2b3040';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k < 4; k++) {
        ctx.moveTo(c.x - 30 + k * 20, c.y);
        ctx.lineTo(c.x - 10 + k * 20, c.y + c.alto);
      }
      ctx.stroke();
      ctx.fillStyle = '#ffd23f';
      ctx.fillRect(c.x - 30, c.y + c.alto - 6, c.ancho + 40, 6);
    }
  }
}

// El aviso de la próxima señal (en el borde derecho de la pantalla)
function dibujarAvisoDeBarrera(ctx) {
  const B = Juego.barreras;
  if (!B || B.aviso <= 0) return;
  const parpadea = Math.floor(B.aviso * 8) % 2 === 0;
  const baja = B.proxima === 'baja';
  const y = baja ? ALTO - 110 : ALTO - 230;
  ctx.save();
  ctx.fillStyle = 'rgba(4, 6, 11, 0.8)';
  ctx.fillRect(ANCHO - 190, y - 22, 180, 44);
  ctx.strokeStyle = baja ? '#ffd23f' : '#ff5a8a';
  ctx.lineWidth = 2;
  ctx.strokeRect(ANCHO - 189, y - 21, 178, 42);
  texto(ctx, baja ? '¡SALTÁ! ▶' : '¡NO SALTES! ▶', ANCHO - 100, y, {
    tamano: 18, negrita: true, color: parpadea ? (baja ? '#ffd23f' : '#ff5a8a') : COLORES.blanco,
  });
  ctx.restore();
}

// ------------------------------------------------------------
//  ETAPAS: un nivel largo dividido en partes, cada una con su nombre
//  (y a veces su propio escenario y su música)
//  Datos del nivel: etapas: [{ desde, nombre, tema, musica, radio }]
// ------------------------------------------------------------

function prepararEtapas(nivel, x) {
  Juego.etapa = -1;
  Juego.tarjetaEtapa = 0;
  if (!nivel.etapas) return;
  nivel.etapas.forEach((e, i) => { if (x >= e.desde) Juego.etapa = i; });
}

function revisarEtapas() {
  const nivel = Juego.nivel;
  if (!nivel.etapas) return;
  const x = centroDe(Juego.jax).x;
  const siguiente = Juego.etapa + 1;
  const etapa = nivel.etapas[siguiente];
  if (!etapa || x < etapa.desde) return;
  Juego.etapa = siguiente;
  if (siguiente > 0 && !(Juego.tarjeta > 0)) Juego.tarjetaEtapa = 2.6;
  if (etapa.musica) Musica.tocar(etapa.musica);
  if (etapa.radio) decirPorRadio(etapa.radio.texto, etapa.radio.quien || 'elena');
}

function dibujarTarjetaDeEtapa(ctx) {
  if (!(Juego.tarjetaEtapa > 0)) return;
  const etapa = Juego.nivel.etapas[Juego.etapa];
  const visible = Math.min(1, Juego.tarjetaEtapa, 2.6 - Juego.tarjetaEtapa);
  ctx.save();
  ctx.globalAlpha = Math.max(0, visible);
  ctx.fillStyle = 'rgba(4, 6, 11, 0.55)';
  ctx.fillRect(0, 200, ANCHO, 90);
  texto(ctx, `ETAPA ${Juego.etapa + 1} DE ${Juego.nivel.etapas.length}`, ANCHO / 2, 226, { tamano: 15, negrita: true, color: COLORES.naranja });
  ctx.shadowColor = '#ff4d00';
  ctx.shadowBlur = 14;
  texto(ctx, etapa.nombre.toUpperCase(), ANCHO / 2, 262, { tamano: 34, negrita: true, color: COLORES.blanco });
  ctx.restore();
}
