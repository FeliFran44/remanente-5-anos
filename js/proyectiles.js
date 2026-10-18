// ============================================================
//  PROYECTILES Y TORRETAS: los disparos y la Torreta PEM
//  De Elena:
//    'plasma' → va derecho y lastima al primer enemigo que toca
//    'hielo'  → va derecho y congela al primer enemigo que toca
//    'cura'   → busca a Jax solo y lo cura
//  De los enemigos (deEnemigo: true):
//    'rayo'   → la bola eléctrica de los drones
//    'pulso'  → la onda que manda un jefe por el piso (se salta)
//    'bala', 'balaSniper', 'plasmaRojo' → disparos que van derecho
//    'acido', 'roca', 'granada' → caen con gravedad
//    'misil'  → cae del cielo y explota · 'orbe' → bola violeta que te sigue despacio
//  Opciones de los disparos enemigos:
//    gravedad: cuánto caen · explota: radio de la explosión al terminar (en vez de pegar directo)
//    alTerminar(p): qué pasa cuando se termina (por ejemplo, el ácido deja un charco)
//    persigue: a quién sigue (el orbe) · atraviesa: no lo frenan las paredes
// ============================================================

const Proyectiles = {
  lista: [],
  torretas: [],
};

function limpiarProyectiles() {
  Proyectiles.lista = [];
  Proyectiles.torretas = [];
}

// datos: { tipo, x, y, vx, vy, vida (segundos), duenio, objetivo, ... }
function lanzarProyectil(datos) {
  Proyectiles.lista.push({ ancho: 12, alto: 8, terminado: false, giro: 0, ...datos });
}

function cajaDeProyectil(p) {
  return { x: p.x - p.ancho / 2, y: p.y - p.alto / 2, ancho: p.ancho, alto: p.alto };
}

// La caja con la que un disparo le pega a los enemigos. Las balas de Jax tienen
// "altoGolpe": pegan desde la mano hasta la cintura, así no pasan por arriba de los bajitos.
function cajaDeGolpe(p) {
  if (!p.altoGolpe) return cajaDeProyectil(p);
  return { x: p.x - p.ancho / 2, y: p.y - 4, ancho: p.ancho, alto: p.altoGolpe };
}

function actualizarProyectiles(enemigos, jugadores, nivel, dt) {
  for (const p of Proyectiles.lista) {
    p.vida -= dt;
    p.giro += dt * 12;
    if (p.tipo === 'cura') guiarHacia(p, p.objetivo, dt);
    if (p.deEnemigo) {
      if (p.gravedad) p.vy = Math.min(p.vy + p.gravedad * dt, VELOCIDAD_MAX_CAIDA);
      if (p.persigue) guiarDespacio(p, p.persigue, dt);
    }
    const yAntes = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const caja = cajaDeProyectil(p);

    if (p.deEnemigo) {
      actualizarProyectilEnemigo(p, caja, yAntes, jugadores, nivel, dt);
      continue;
    }

    if (p.tipo === 'cura') {
      const objetivo = p.objetivo;
      if (!objetivo || objetivo.seCayo || objetivo.vida <= 0) p.terminado = true;
      else if (seTocan(caja, objetivo)) {
        const C = HABILIDADES_ELENA.CURA;
        curar(objetivo, C.vida, C.degradacion);
        cargarDefinitiva(p.duenio, C.vida);
        p.terminado = true;
      }
    } else {
      // Las paredes sólidas frenan el plasma, el hielo y las balas
      if (nivel.plataformas.some((pl) => pl.tipo === 'solida' && seTocan(caja, pl))) {
        chispas(p.x, p.y, p.tipo === 'hielo' ? '#cdf3ff' : p.color || '#5fd4ff', 5, 160);
        p.terminado = true;
        continue;
      }
      const cajaGolpe = cajaDeGolpe(p);
      // Los disparos también abren los cofres
      if (golpearCofres(cajaGolpe)) {
        p.terminado = true;
        continue;
      }
      for (const e of enemigos) {
        if (e.estado === 'derrotado' || e.inalcanzable || !seTocan(cajaGolpe, e)) continue;
        // Las balas del Cañón Némesis atraviesan: le pegan una vez a cada uno y siguen
        if (p.atraviesaEnemigos) {
          if (p.golpeados.has(e)) continue;
          p.golpeados.add(e);
          impactarProyectil(p, e, enemigos);
          continue;
        }
        impactarProyectil(p, e, enemigos);
        p.terminado = true;
        break;
      }
    }

    if (p.vida <= 0) p.terminado = true;
    if (p.tipo === 'cura' && Math.random() < 0.5) estela(p.x, p.y, '#7dff5a');
  }
  Proyectiles.lista = Proyectiles.lista.filter((p) => !p.terminado);
}

function actualizarProyectilEnemigo(p, caja, yAntes, jugadores, nivel, dt) {
  // Las paredes frenan los disparos. Lo que cae (ácido, rocas, granadas) también
  // se frena sobre las plataformas finas.
  const chocaSolida = !p.atraviesa && nivel.plataformas.some((pl) => pl.tipo === 'solida' && seTocan(caja, pl));
  const chocaFina = p.gravedad && p.vy > 0 &&
    nivel.plataformas.some((pl) => pl.tipo === 'fina' && seTocan(caja, pl) && yAntes + p.alto / 2 <= pl.y + 2);
  if (chocaSolida || chocaFina) {
    chispas(p.x, p.y, p.colorChispa || '#ffe14d', 5, 160);
    terminarProyectilEnemigo(p);
    return;
  }
  for (const j of jugadores) {
    if (!seTocan(caja, j)) continue;
    if (p.explota) {
      if (!puedeRecibirGolpe(j)) continue;
      terminarProyectilEnemigo(p);
      return;
    }
    if (golpearJugador(j, p.danio, Math.sign(p.vx) || 1)) {
      terminarProyectilEnemigo(p);
      return;
    }
  }
  // "pisoY": hasta dónde cae (los misiles atraviesan todo y explotan en el piso)
  if (p.vida <= 0 || p.y > nivel.alto + 100 || (p.pisoY !== undefined && p.y >= p.pisoY)) terminarProyectilEnemigo(p);
  if (p.tipo === 'misil' && Math.random() < 0.6) estela(p.x, p.y - 10, '#ff9a3c');
  if (p.tipo === 'orbe' && Math.random() < 0.4) estela(p.x, p.y, '#a050ff');
}

// Cuando termina un disparo enemigo: algunos explotan o dejan algo (un charco de ácido)
function terminarProyectilEnemigo(p) {
  if (p.terminado) return;
  p.terminado = true;
  if (p.explota) {
    explosion(p.x, p.y, p.explota, p.danio, { color: p.colorExplosion || '#ffb347', lastimaEnemigos: !!p.lastimaEnemigos });
  }
  if (p.alTerminar) p.alTerminar(p);
}

// El dardo curativo dobla solo hacia su objetivo
function guiarHacia(p, objetivo, dt) {
  if (!objetivo) return;
  const destino = centroDe(objetivo);
  const angulo = Math.atan2(destino.y - p.y, destino.x - p.x);
  const velocidad = HABILIDADES_ELENA.CURA.velocidad;
  p.vx += (Math.cos(angulo) * velocidad - p.vx) * Math.min(1, 8 * dt);
  p.vy += (Math.sin(angulo) * velocidad - p.vy) * Math.min(1, 8 * dt);
}

// El orbe de Zephyrus dobla despacito hacia su objetivo (así se puede esquivar)
function guiarDespacio(p, objetivo, dt) {
  if (!objetivo || objetivo.seCayo) return;
  const destino = centroDe(objetivo);
  const angulo = Math.atan2(destino.y - p.y, destino.x - p.x);
  const velocidad = Math.hypot(p.vx, p.vy);
  p.vx += (Math.cos(angulo) * velocidad - p.vx) * Math.min(1, 1.6 * dt);
  p.vy += (Math.sin(angulo) * velocidad - p.vy) * Math.min(1, 1.6 * dt);
}

function impactarProyectil(p, e, enemigos) {
  const H = HABILIDADES_ELENA;
  const direccion = Math.sign(p.vx) || 1;

  if (p.tipo === 'plasma') {
    const ataque = crearAtaque(cajaDeProyectil(p), H.PLASMA, direccion, new Set());
    ataque.liviano = true;
    ataque.duenio = p.duenio;
    ataque.danio *= (p.duenio && p.duenio.multDanio) || 1;   // mejora "Bláster mejorado"
    if (golpearEnemigo(e, ataque, enemigos)) e.marcaPlasma = H.PLASMA.marca;   // queda cargado de plasma un ratito (sinergia)
    chispas(p.x, p.y, '#5fd4ff', 6, 200);
  } else if (p.tipo === 'hielo') {
    const ataque = crearAtaque(cajaDeProyectil(p), H.HIELO, direccion, new Set());
    ataque.liviano = true;
    ataque.duenio = p.duenio;
    golpearEnemigo(e, ataque, enemigos);
    if (e.estado !== 'derrotado' && !e.inmune && !e.t.OBJETO) congelarEnemigo(e, H.HIELO.congela);
    chispas(p.x, p.y, '#cdf3ff', 14, 260);
  } else if (p.tipo === 'balaJax') {
    impactarBala(p, e, enemigos);   // (en js/arma.js)
  }
}

// ---------- Torreta PEM ----------

function desplegarTorreta(elena) {
  const P = HABILIDADES_ELENA.PEM;
  const centro = elena.x + elena.ancho / 2;
  const pies = elena.y + elena.alto;
  Proyectiles.torretas.push({ x: centro, y: pies, tiempo: P.duracion, duracion: P.duracion, radio: P.radio });
  ondaExpansiva(centro, pies - 20, P.radio, '#5fd4ff', 1);
  textoFlotante(centro, elena.y - 30, '¡TORRETA PEM!', '#9fe8ff');
  Sonido.pem();
}

// Los enemigos dentro del área de una torreta van más lentos (y pierden sus escudos)
function aplicarTorretas(enemigos, dt) {
  for (const e of enemigos) {
    e.lento = false;
    e.sinEscudo = false;
  }
  for (const t of Proyectiles.torretas) {
    t.tiempo -= dt;
    for (const e of enemigos) {
      const centro = centroDe(e);
      if (Math.hypot(centro.x - t.x, centro.y - (t.y - 30)) < t.radio) {
        e.lento = true;
        e.sinEscudo = true;
      }
    }
  }
  Proyectiles.torretas = Proyectiles.torretas.filter((t) => t.tiempo > 0);
}

// ---------- Dibujos ----------

function dibujarProyectiles(ctx) {
  for (const t of Proyectiles.torretas) dibujarTorreta(ctx, t);

  // Los disparos de energía brillan: se suman a lo que hay detrás
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of Proyectiles.lista) {
    if (p.tipo === 'balaJax') {
      dibujarBalaJax(ctx, p);
    } else if (p.tipo === 'plasma') {
      ctx.fillStyle = 'rgba(95, 212, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 11, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8fbff';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.tipo === 'hielo') {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = '#bfefff';
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(5, 0);
      ctx.lineTo(0, 8);
      ctx.lineTo(-5, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (p.tipo === 'cura') {
      ctx.fillStyle = 'rgba(125, 255, 90, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#eaffdf';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.tipo === 'rayo') {
      // Bola eléctrica con rayitos
      ctx.fillStyle = 'rgba(255, 225, 77, 0.45)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff6b0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffe14d';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 3; i++) {
        const a = p.giro + i * 2.1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + Math.cos(a) * 12, p.y + Math.sin(a) * 12);
        ctx.stroke();
      }
    } else if (p.tipo === 'pulso') {
      // Una onda de energía que corre pegada al piso
      ctx.fillStyle = p.color || 'rgba(255, 90, 40, 0.55)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + p.alto / 2, p.ancho / 2 + 4, p.alto, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd0a0';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + p.alto / 2, p.ancho / 4, p.alto * 0.6, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    } else if (p.tipo === 'bala' || p.tipo === 'balaSniper') {
      // Una rayita brillante en la dirección en que va
      const sniper = p.tipo === 'balaSniper';
      const largo = sniper ? 26 : 12;
      const angulo = Math.atan2(p.vy, p.vx);
      ctx.strokeStyle = sniper ? '#ff5050' : '#ffd166';
      ctx.lineWidth = sniper ? 4 : 3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - Math.cos(angulo) * largo, p.y - Math.sin(angulo) * largo);
      ctx.stroke();
      ctx.fillStyle = '#fff6d0';
      ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
    } else if (p.tipo === 'plasmaRojo') {
      ctx.fillStyle = 'rgba(255, 60, 90, 0.5)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd0da';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.tipo === 'acido') {
      ctx.fillStyle = 'rgba(140, 255, 60, 0.55)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e6ffb0';
      ctx.beginPath();
      ctx.arc(p.x - 2, p.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.tipo === 'orbe') {
      const radio = 11 + Math.sin(p.giro * 2) * 2;
      ctx.fillStyle = 'rgba(170, 80, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radio + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e2c4ff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, radio * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Los que no brillan: rocas, misiles y granadas
  for (const p of Proyectiles.lista) {
    if (p.tipo === 'roca') dibujarRoca(ctx, p);
    else if (p.tipo === 'misil') dibujarMisil(ctx, p);
    else if (p.tipo === 'granada') {
      ctx.fillStyle = '#3a4050';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = Math.sin(p.giro * 3) > 0 ? '#ff3b3b' : '#5a1a1a';   // lucecita que titila
      ctx.fillRect(p.x - 1.5, p.y - 8, 3, 3);
    }
  }
}

function dibujarRoca(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.giro * 0.3);
  ctx.fillStyle = '#6b6258';
  ctx.beginPath();
  ctx.moveTo(-p.ancho / 2, -2);
  ctx.lineTo(-4, -p.alto / 2);
  ctx.lineTo(p.ancho / 2, -4);
  ctx.lineTo(p.ancho / 2 - 2, p.alto / 2);
  ctx.lineTo(-p.ancho / 2 + 3, p.alto / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#8a8076';
  ctx.fillRect(-4, -4, 6, 4);
  ctx.restore();
}

function dibujarMisil(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.atan2(p.vy, p.vx) - Math.PI / 2);   // apunta hacia donde va
  ctx.fillStyle = `rgba(255, 150, 40, ${0.6 + Math.random() * 0.4})`;   // el fuego de atrás
  ctx.beginPath();
  ctx.moveTo(-4, -10);
  ctx.lineTo(0, -22 - Math.random() * 8);
  ctx.lineTo(4, -10);
  ctx.fill();
  ctx.fillStyle = '#c9ced8';
  ctx.fillRect(-4, -10, 8, 18);
  ctx.fillStyle = '#e0343c';
  ctx.beginPath();
  ctx.moveTo(-4, 8);
  ctx.lineTo(0, 14);
  ctx.lineTo(4, 8);
  ctx.fill();
  ctx.restore();
}

function dibujarTorreta(ctx, t) {
  const queda = t.tiempo / t.duracion;
  const pulso = 0.5 + Math.sin(t.tiempo * 10) * 0.5;

  // Área de efecto: una burbuja celeste
  ctx.save();
  ctx.fillStyle = `rgba(95, 212, 255, ${0.05 + pulso * 0.03})`;
  ctx.strokeStyle = `rgba(95, 212, 255, ${0.25 + pulso * 0.2})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(t.x, t.y - 30, t.radio, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // El aparato
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(t.x - 10, t.y - 12, 20, 12);
  ctx.fillRect(t.x - 2, t.y - 26, 4, 14);
  ctx.shadowColor = '#5fd4ff';
  ctx.shadowBlur = 12;
  ctx.fillStyle = '#9fe8ff';
  ctx.beginPath();
  ctx.arc(t.x, t.y - 28, 4 + pulso * 2, 0, Math.PI * 2);
  ctx.fill();

  // Cuánto tiempo le queda: un arco que se achica
  ctx.shadowBlur = 0;
  ctx.strokeStyle = '#5fd4ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(t.x, t.y - 6, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * queda);
  ctx.stroke();
  ctx.restore();
}
