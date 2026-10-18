// ============================================================
//  ENEMIGOS: cómo se comportan y cómo se dibujan
//  Cada tipo de enemigo tiene sus números. Para poner enemigos
//  en un nivel, se agregan a la lista "enemigos" de niveles.js.
// ============================================================

const TIPOS_ENEMIGOS = {
  recluta: {
    nombre: 'Recluta de Genesis',
    SPRITE: 'ninja',           // el dibujo (está en img/); si no carga, se dibuja con formas
    ANCHO: 30,
    ALTO: 60,
    VIDA: 40,                  // un combo completo de Jax (10 + 10 + 20) lo derrota
    VELOCIDAD_PATRULLA: 70,
    VELOCIDAD_PERSECUCION: 150,
    VISION: 320,               // a qué distancia te ve (si lo tenés de frente)
    ALCANCE: 30,               // a qué distancia empieza a atacar
    DANIO: 10,
    TIEMPO_PREPARAR: 0.45,     // levanta la porra: ¡es tu aviso para pegarle primero o alejarte!
    TIEMPO_ATAQUE: 0.15,
    TIEMPO_RECUPERAR: 0.6,
    TIEMPO_ATURDIDO: 0.35,
  },
  muneco: {
    nombre: 'Muñeco de práctica',
    ANCHO: 30,
    ALTO: 66,
    VIDA: 1,
    INMORTAL: true,            // no pierde vida
    FIJO: true,                // no se mueve ni ataca
    TIEMPO_ATURDIDO: 0.4,
  },
  dron: {
    nombre: 'Dron de vigilancia',
    COMPORTAMIENTO: 'dron',
    ANCHO: 30,
    ALTO: 20,
    VIDA: 20,
    ALTURA: 110,               // a qué altura vuela, sobre el piso donde está
    VELOCIDAD: 90,
    VISION: 300,
    TIEMPO_APUNTAR: 0.7,       // la línea roja: ¡es el aviso de que va a disparar!
    TIEMPO_RECUPERAR: 1.4,     // después de disparar baja un poco: ahí se lo puede golpear sin saltar tanto
    BAJADA: 50,
    DANIO: 8,
    VELOCIDAD_RAYO: 340,
    TIEMPO_ATURDIDO: 0.5,
  },
};

function crearEnemigos(nivel) {
  return (nivel.enemigos || []).map(crearEnemigo);
}

// "datos" viene del nivel: { tipo, x, y (donde apoya los pies), patrulla, mirando }
function crearEnemigo(datos) {
  const t = TIPOS_ENEMIGOS[datos.tipo];
  // Los que vuelan aparecen a su altura de vuelo, sobre el piso indicado
  const y = t.ALTURA ? datos.y - t.ALTURA - t.ALTO / 2 : datos.y - t.ALTO;
  return {
    tipo: datos.tipo,
    t,
    x: datos.x, y,
    ancho: t.ANCHO,
    alto: t.ALTO,
    vx: 0,
    vy: 0,
    mirando: datos.mirando || -1,
    vida: t.VIDA,
    vidaMax: t.VIDA,
    estado: t.FIJO ? 'quieto' : t.JEFE ? 'dormido' : 'patrulla',   // los jefes esperan a que entres a su sala
    tiempoEstado: 0,
    origenX: datos.x,                    // camina alrededor de este lugar
    radioPatrulla: datos.patrulla ?? 120,
    enElSuelo: false,
    sueloEsFino: false,
    chocoPared: false,
    golpeados: new Set(),
    cajaAtaque: null,
    eliminar: false,
    recienDerrotado: false,              // main.js lo usa para contar enemigos derrotados
    alturaBase: y,                       // los que vuelan vuelven a esta altura
    escudoRoto: 0,
    alerta: 0,                           // muestra un "!" cuando un dron avisó que te vio
    // Solo para dibujar:
    xAntes: datos.x,
    yAntes: y,
    tiempo: Math.random() * 10,
    pasos: 0,
    destello: 0,                         // se pone blanco un instante al recibir un golpe
    datos,                               // lo que dice el nivel sobre este enemigo (algunos usan datos extra)
  };
}

function cambiarEstado(e, estado) {
  e.estado = estado;
  e.tiempoEstado = 0;
  if (estado === 'prepara') Sonido.cargaPorra();
}

function derrotarEnemigo(e) {
  cambiarEstado(e, 'derrotado');
  e.recienDerrotado = true;
  e.cajaAtaque = null;
  if (!e.t.JEFE && !e.t.OBJETO && !e.t.FIJO && (e.t.PESADO ?? 1) > 0 && !e.t.VUELA) {
    e.vy = -380;
    e.vx = (e.vx || -e.mirando * 100) * 1.3;
    e.vueloGiro = Math.sign(e.vx) || 1;
  }
  if (!e.t.OBJETO) Sonido.enemigoDerrotado();
  if (e.t.alDerrotar) e.t.alDerrotar(e);
}

// El Rayo Congelante de Elena: no se mueve ni ataca, pero se le puede seguir pegando.
// A los jefes los congela menos tiempo.
function congelarEnemigo(e, segundos) {
  cambiarEstado(e, 'congelado');
  e.duracionCongelado = segundos * (e.t.RESISTENCIA_HIELO ?? 1);
  e.vx = 0;
  Sonido.congelar();
}

// Cuánto dura el estado actual (aturdido o congelado)
function duracionDelEstado(e) {
  if (e.estado === 'congelado') return e.duracionCongelado;
  return e.duracionAturdido || e.t.TIEMPO_ATURDIDO;
}

function piesDe(cuerpo) {
  return cuerpo.y + cuerpo.alto;
}

// Espacio libre entre dos cuerpos, de costado (0 si se tocan)
function separacion(a, b) {
  const distancia = Math.abs(centroDe(a).x - centroDe(b).x);
  return Math.max(0, distancia - (a.ancho + b.ancho) / 2);
}

function haySueloAdelante(e, nivel) {
  const x = centroDe(e).x + e.mirando * (e.ancho / 2 + 8);
  return hayPlataformaDebajo(x, piesDe(e), nivel.plataformas, 24);
}

function jugadorMasCercano(e, jugadores) {
  let elegido = null;
  let mejor = Infinity;
  for (const p of jugadores) {
    if (p.seCayo || p.vida <= 0) continue;
    const distancia = Math.abs(centroDe(p).x - centroDe(e).x) + Math.abs(piesDe(p) - piesDe(e));
    if (distancia < mejor) {
      mejor = distancia;
      elegido = p;
    }
  }
  return elegido;
}

// Te ve si estás cerca y a su altura, y lo tenés de frente (o muy, muy cerca)
function loVe(e, p) {
  const dx = centroDe(p).x - centroDe(e).x;
  const deFrente = Math.sign(dx) === e.mirando;
  const aSuAltura = Math.abs(piesDe(p) - piesDe(e)) < 100;
  return aSuAltura && Math.abs(dx) < e.t.VISION && (deFrente || Math.abs(dx) < 120);
}

// Camina de un lado a otro alrededor de su lugar, dándose vuelta en paredes y bordes
function patrullar(e, nivel) {
  if (e.x < e.origenX - e.radioPatrulla) e.mirando = 1;
  else if (e.x > e.origenX + e.radioPatrulla) e.mirando = -1;
  if (e.enElSuelo && (e.chocoPared || !haySueloAdelante(e, nivel))) e.mirando *= -1;
  return e.mirando * e.t.VELOCIDAD_PATRULLA;
}

function actualizarEnemigos(enemigos, jugadores, nivel, dt) {
  for (const e of enemigos) actualizarEnemigo(e, jugadores, nivel, dt, enemigos);
}

// "todos" es la lista de enemigos: el dron la usa para avisarles a los reclutas
function actualizarEnemigo(e, jugadores, nivel, dt, todos) {
  const t = e.t;
  e.xAntes = e.x;
  e.yAntes = e.y;
  const ritmo = e.lento ? 0.5 : 1;   // dentro de una Torreta PEM todo le pasa más despacio
  e.tiempo += dt;
  e.tiempoEstado += dt * ritmo;
  e.destello = Math.max(0, e.destello - dt * 6);
  e.marcaPlasma = Math.max(0, (e.marcaPlasma || 0) - dt);
  e.escudoRoto = Math.max(0, e.escudoRoto - dt);
  e.alerta = Math.max(0, e.alerta - dt);
  e.avisoDebil = Math.max(0, (e.avisoDebil || 0) - dt);
  e.cajaAtaque = null;

  if (t.FIJO) {
    const termino = e.tiempoEstado >= duracionDelEstado(e);
    if ((e.estado === 'aturdido' || e.estado === 'congelado') && termino) cambiarEstado(e, 'quieto');
    return;
  }
  if (t.COMPORTAMIENTO === 'dron') return actualizarDron(e, jugadores, nivel, dt, todos);
  if (t.COMPORTAMIENTO === 'mech') return actualizarMech(e, jugadores, nivel, dt);
  // Los enemigos nuevos (enemigos-acto1.js, etc.) traen su propia función "actualizar"
  if (t.actualizar) return t.actualizar(e, jugadores, nivel, dt, todos);

  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidadDeseada = 0;

  switch (e.estado) {
    case 'patrulla':
      velocidadDeseada = patrullar(e, nivel);
      if (objetivo && loVe(e, objetivo)) cambiarEstado(e, 'persigue');
      break;

    case 'persigue': {
      if (!objetivo || Math.abs(centroDe(objetivo).x - centroDe(e).x) > t.VISION * 1.5) {
        cambiarEstado(e, 'patrulla');
        break;
      }
      e.mirando = centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
      const cerca = separacion(e, objetivo) <= t.ALCANCE && Math.abs(piesDe(objetivo) - piesDe(e)) < 50;
      if (cerca) cambiarEstado(e, 'prepara');
      else if (haySueloAdelante(e, nivel)) velocidadDeseada = e.mirando * t.VELOCIDAD_PERSECUCION;
      break;
    }

    case 'prepara':
      if (e.tiempoEstado >= t.TIEMPO_PREPARAR) {
        cambiarEstado(e, 'ataca');
        e.golpeados = new Set();
        Sonido.porrazo();
      }
      break;

    case 'ataca':
      e.cajaAtaque = cajaDelante(e, t.ALCANCE_GOLPE || 44, 34, 8);
      for (const p of jugadores) {
        if (e.golpeados.has(p) || !seTocan(e.cajaAtaque, p)) continue;
        if (golpearJugador(p, t.DANIO, e.mirando)) e.golpeados.add(p);
      }
      if (e.tiempoEstado >= t.TIEMPO_ATAQUE) cambiarEstado(e, 'recupera');
      break;

    case 'recupera':
      if (e.tiempoEstado >= t.TIEMPO_RECUPERAR) cambiarEstado(e, 'persigue');
      break;

    case 'aturdido':
    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e) && e.enElSuelo) cambiarEstado(e, 'persigue');
      break;

    case 'derrotado':
      if (e.tiempoEstado >= 0.9) {
        e.eliminar = true;
        const centro = centroDe(e);
        chispas(centro.x, centro.y, '#ff3b3b', 14, 260);
        chispas(centro.x, centro.y, '#8c94a3', 10, 200);
      }
      break;
  }

  // --- Física ---
  const controla = !['aturdido', 'congelado', 'derrotado'].includes(e.estado);
  if (controla) {
    e.vx = velocidadDeseada * (e.lento ? 0.4 : 1);
  } else if (e.enElSuelo) {
    // Después de un golpe se va frenando por el roce con el suelo
    const frenado = 900 * dt;
    e.vx = Math.abs(e.vx) <= frenado ? 0 : e.vx - Math.sign(e.vx) * frenado;
  }
  e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.y > nivel.alto + 200) e.eliminar = true;   // se cayó a un pozo
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

// ============================================================
//  DRON DE VIGILANCIA
// ============================================================

function dronVe(e, p) {
  const piso = e.alturaBase + e.t.ALTO / 2 + e.t.ALTURA;   // el piso sobre el que vuela
  return Math.abs(centroDe(p).x - centroDe(e).x) < e.t.VISION && Math.abs(piesDe(p) - piso) < 120;
}

// Cuando te ve por primera vez, los reclutas cercanos salen a buscarte
function darAlarma(dron, todos, objetivo) {
  dron.alerta = 1.2;
  Sonido.alarma();
  for (const r of todos) {
    if (r.t.COMPORTAMIENTO || r.t.FIJO || r.t.OBJETO || r.estado !== 'patrulla' || Math.abs(r.x - dron.x) > 500) continue;
    cambiarEstado(r, 'persigue');
    r.mirando = centroDe(objetivo).x > centroDe(r).x ? 1 : -1;
    r.alerta = 1.2;
  }
}

function dispararRayo(e, objetivo) {
  const t = e.t;
  const desde = centroDe(e);
  const hacia = centroDe(objetivo);
  const angulo = Math.atan2(hacia.y - desde.y, hacia.x - desde.x);
  // El Dron V-2 dispara en abanico: 3 rayos
  const desvios = t.ABANICO ? [-t.ABANICO, 0, t.ABANICO] : [0];
  for (const desvio of desvios) {
    lanzarProyectil({
      tipo: 'rayo', deEnemigo: true, danio: t.DANIO, ancho: 14, alto: 14, vida: 2.5,
      x: desde.x, y: desde.y + 6,
      vx: Math.cos(angulo + desvio) * t.VELOCIDAD_RAYO, vy: Math.sin(angulo + desvio) * t.VELOCIDAD_RAYO,
    });
  }
  Sonido.rayoDron();
}

function actualizarDron(e, jugadores, nivel, dt, todos) {
  const t = e.t;
  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  let altura = e.alturaBase;

  switch (e.estado) {
    case 'patrulla':
      if (e.x < e.origenX - e.radioPatrulla) e.mirando = 1;
      else if (e.x > e.origenX + e.radioPatrulla) e.mirando = -1;
      velocidad = e.mirando * t.VELOCIDAD;
      if (objetivo && dronVe(e, objetivo)) {
        if (!e.dioAlarma) {
          darAlarma(e, todos, objetivo);
          e.dioAlarma = true;
        }
        cambiarEstado(e, 'apunta');
      }
      break;

    case 'apunta':
      e.objetivo = objetivo;
      if (!objetivo || !dronVe(e, objetivo)) {
        cambiarEstado(e, 'patrulla');
        break;
      }
      e.mirando = centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
      if (e.tiempoEstado >= t.TIEMPO_APUNTAR) {
        dispararRayo(e, objetivo);
        cambiarEstado(e, 'recupera');
      }
      break;

    case 'recupera':
      altura = e.alturaBase + t.BAJADA;
      if (e.tiempoEstado >= t.TIEMPO_RECUPERAR) cambiarEstado(e, 'patrulla');
      break;

    case 'aturdido':
    case 'congelado':
      altura = e.alturaBase + t.BAJADA;
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'patrulla');
      break;

    case 'derrotado':
      // Cae dando vueltas y explota al tocar el suelo
      e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
      moverConChoques(e, nivel.plataformas, dt, false);
      if (e.enElSuelo || e.tiempoEstado > 1.5 || e.y > nivel.alto) {
        e.eliminar = true;
        const centro = centroDe(e);
        chispas(centro.x, centro.y, '#ffb347', 20, 320);
        polvo(centro.x, centro.y + 10, 8);
      }
      return;
  }

  // Vuela: se acerca suavemente a su altura, con un vaivén
  e.y += (altura + Math.sin(e.tiempo * 3) * 6 - e.y) * Math.min(1, 4 * dt);
  if (e.estado === 'aturdido' || e.estado === 'congelado') {
    e.vx -= e.vx * Math.min(1, 5 * dt);   // el empujón del golpe se va frenando
  } else {
    e.vx = velocidad * (e.lento ? 0.4 : 1);
  }
  e.x += e.vx * dt;
  e.vy = 0;
}

// ============================================================
//  DIBUJOS
// ============================================================

function dibujarEnemigos(ctx, enemigos, alfa) {
  for (const e of enemigos) {
    if (e.t.dibujar) e.t.dibujar(ctx, e, alfa);
    else if (e.tipo === 'muneco') dibujarMuneco(ctx, e);
    else if (e.tipo === 'dron') dibujarDron(ctx, e, alfa);
    else if (e.t.COMPORTAMIENTO === 'mech') dibujarMech(ctx, e, alfa);
    else dibujarRecluta(ctx, e, alfa);
    if (e.invisible) continue;   // el Acechador en la niebla: no se le ve nada

    const { x, y } = posicionDibujo(e, alfa);
    if (e.estado === 'congelado') dibujarHielo(ctx, x, y, e);
    if (e.marcaPlasma > 0 && e.estado !== 'derrotado') dibujarMarcaPlasma(ctx, x, y, e);
    if (e.alerta > 0 && e.estado !== 'derrotado') {
      texto(ctx, '!', x + e.ancho / 2, y - 22, { tamano: 20, negrita: true, color: '#ffe14d' });
    }

    // Barra de vida chiquita arriba de la cabeza, cuando ya recibió algún golpe (los jefes tienen la suya)
    if (!e.t.INMORTAL && !e.t.JEFE && !e.t.OBJETO && e.vida < e.vidaMax && e.estado !== 'derrotado') {
      ctx.fillStyle = '#1d2638';
      ctx.fillRect(x - 2, y - 12, e.ancho + 4, 4);
      ctx.fillStyle = '#ff5a6a';
      ctx.fillRect(x - 2, y - 12, (e.ancho + 4) * Math.max(0, e.vida / e.vidaMax), 4);
    }
  }
}

// Un bloque de hielo alrededor del enemigo congelado
function dibujarHielo(ctx, x, y, e) {
  ctx.save();
  ctx.globalAlpha = Math.min(1, (duracionDelEstado(e) - e.tiempoEstado) * 3);   // se derrite al final
  ctx.fillStyle = 'rgba(160, 225, 255, 0.35)';
  ctx.strokeStyle = 'rgba(220, 245, 255, 0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 5, y - 6, e.ancho + 10, e.alto + 6, 4);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';   // brillitos
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + 9, y + 1);
  ctx.moveTo(x + 2, y + 22);
  ctx.lineTo(x + 15, y + 9);
  ctx.stroke();
  ctx.restore();
}

// Chispitas celestes que giran: el enemigo está "cargado de plasma"
function dibujarMarcaPlasma(ctx, x, y, e) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = Math.min(1, e.marcaPlasma * 2);
  ctx.fillStyle = '#5fd4ff';
  for (let i = 0; i < 3; i++) {
    const a = e.tiempo * 8 + i * 2.1;
    ctx.beginPath();
    ctx.arc(x + e.ancho / 2 + Math.cos(a) * 20, y + e.alto / 2 + Math.sin(a) * 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function dibujarRecluta(ctx, e, alfa) {
  if (hayImagen(e.t.SPRITE)) {
    dibujarEnemigoSprite(ctx, e, alfa, { alto: 64 });
    dibujarPorraDeSprite(ctx, e, alfa);
    return;
  }
  const { x, y } = posicionDibujo(e, alfa);
  ctx.save();
  ctx.translate(x + e.ancho / 2, y + e.alto);
  ctx.scale(e.mirando, 1);

  if (e.estado === 'derrotado') {
    ctx.rotate(-1.45 * Math.min(1, e.tiempoEstado / 0.35));            // cae de espaldas
    ctx.globalAlpha = 1 - Math.max(0, (e.tiempoEstado - 0.5) / 0.4);   // y se desvanece
  }
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 2})`;
  ctx.lineCap = 'round';

  const caminando = e.enElSuelo && Math.abs(e.vx) > 10;
  const vaiven = caminando ? Math.sin(e.pasos * 0.06) : 0;

  // Piernas
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#2a2f3a';
  dibujarExtremidad(ctx, -4, -22, vaiven * 0.6, 22);
  dibujarExtremidad(ctx, 4, -22, -vaiven * 0.6, 22);

  // Brazo de atrás
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#6f7787';
  dibujarExtremidad(ctx, -2, -44, -vaiven * 0.5, 17);

  // Cuerpo: armadura gris con la franja roja de Genesis
  ctx.fillStyle = '#8c94a3';
  ctx.beginPath();
  ctx.roundRect(-10, -48, 20, 27, 4);
  ctx.fill();
  ctx.fillStyle = '#e0343c';
  ctx.fillRect(-10, -38, 20, 3);

  // Casco con visor rojo
  ctx.fillStyle = '#5d6574';
  ctx.beginPath();
  ctx.arc(1, -55, 8.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(2, -57, 7, 3);
  ctx.restore();

  // Brazo con la porra: su ángulo depende de lo que esté haciendo
  let angulo = 0.5 + vaiven * 0.3;
  if (e.estado === 'prepara') angulo = -2.5 + Math.sin(e.tiempo * 40) * 0.08;   // la levanta y tiembla
  else if (e.estado === 'ataca') angulo = 1.7;
  else if (e.estado === 'recupera') angulo = 1.2;
  else if (e.estado === 'aturdido' || e.estado === 'derrotado') angulo = -0.6;

  ctx.lineWidth = 6;
  ctx.strokeStyle = '#8c94a3';
  const mano = dibujarExtremidad(ctx, 2, -44, angulo, 16);
  dibujarPorra(ctx, mano, angulo, e.estado === 'prepara' || e.estado === 'ataca');

  ctx.restore();
}

function dibujarPorra(ctx, mano, angulo, cargada) {
  const finX = mano.x + Math.sin(angulo) * 20;
  const finY = mano.y + Math.cos(angulo) * 20;
  ctx.strokeStyle = '#30343e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(mano.x, mano.y);
  ctx.lineTo(finX, finY);
  ctx.stroke();

  // La punta eléctrica brilla más cuando está por pegar
  ctx.save();
  ctx.shadowColor = '#ffe14d';
  ctx.shadowBlur = cargada ? 16 : 6;
  ctx.fillStyle = cargada ? '#fff6b0' : '#ffe14d';
  ctx.beginPath();
  ctx.arc(finX, finY, cargada ? 4 : 3, 0, Math.PI * 2);
  ctx.fill();
  if (cargada) {
    ctx.strokeStyle = '#ffe14d';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(finX, finY);
      ctx.lineTo(finX + Math.cos(a) * 9, finY + Math.sin(a) * 9);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function dibujarDron(ctx, e, alfa) {
  const { x, y } = posicionDibujo(e, alfa);
  const cx = x + e.ancho / 2;
  const cy = y + e.alto / 2;

  // Mientras apunta, una línea roja hacia su objetivo: ¡va a disparar!
  if (e.estado === 'apunta' && e.objetivo) {
    const hacia = centroDe(e.objetivo);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 59, 59, ${0.35 + 0.35 * Math.sin(e.tiempo * 30)})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(hacia.x, hacia.y);
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, cy);
  if (e.estado === 'derrotado') ctx.rotate(e.tiempoEstado * 9);   // cae dando vueltas
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 2})`;

  // Brazos y hélices (giran rapidísimo)
  ctx.strokeStyle = '#4a5468';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -6);
  ctx.lineTo(18, -6);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(200, 210, 230, 0.7)';
  ctx.lineWidth = 2;
  const giro = Math.abs(Math.sin(e.tiempo * 40)) * 9;
  for (const lado of [-18, 18]) {
    ctx.beginPath();
    ctx.moveTo(lado - giro, -9);
    ctx.lineTo(lado + giro, -9);
    ctx.stroke();
  }

  // Cuerpo (el Dron V-2 es rojo con franja amarilla)
  ctx.fillStyle = e.t.COLOR_CUERPO || '#5d6574';
  ctx.beginPath();
  ctx.roundRect(-15, -6, 30, 14, 6);
  ctx.fill();
  ctx.fillStyle = e.t.COLOR_FRANJA || '#e0343c';
  ctx.fillRect(-15, 0, 30, 2);

  // Ojo: rojo; brilla más mientras apunta
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = e.estado === 'apunta' ? 14 : 6;
  ctx.fillStyle = e.estado === 'apunta' ? '#ffb0b0' : '#ff3b3b';
  ctx.beginPath();
  ctx.arc(e.mirando * 6, 3, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarMuneco(ctx, e) {
  const t = e.t;
  // Cuando recibe un golpe se bambolea, cada vez menos
  let bamboleo = 0;
  if (e.estado === 'aturdido') {
    const queda = Math.max(0, 1 - e.tiempoEstado / duracionDelEstado(e));
    bamboleo = Math.sin(e.tiempoEstado * 30) * 0.25 * queda * -e.mirando;
  }

  ctx.save();
  ctx.translate(e.x + e.ancho / 2, e.y + e.alto);

  // Poste y base
  ctx.fillStyle = '#4a3a2a';
  ctx.fillRect(-3, -30, 6, 30);
  ctx.fillRect(-14, -4, 28, 4);

  ctx.rotate(bamboleo);
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 1.5})`;

  // Bolsa
  ctx.fillStyle = '#b08a5a';
  ctx.beginPath();
  ctx.roundRect(-14, -66, 28, 40, 10);
  ctx.fill();
  ctx.strokeStyle = '#7a5c38';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-14, -58);
  ctx.lineTo(14, -58);
  ctx.stroke();

  // Blanco de tiro
  for (const [radio, color] of [[9, '#e0343c'], [6, '#f4f6fb'], [3, '#e0343c']]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -44, radio, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ============================================================
//  ENEMIGOS CON SPRITE (los dibujos del creador del juego)
// ============================================================

// Dibuja a un enemigo con su sprite: lo da vuelta según hacia dónde mira, da pasitos
// al caminar (sus piernas se mueven por separado), tiembla cuando prepara un ataque,
// se pone blanco al recibir un golpe y, al ser derrotado, sale volando dando vueltas.
// opciones: { alto, sprite, tinte, alfa, rotar, adelante, estirarX, estirarY }
function dibujarEnemigoSprite(ctx, e, alfa, opciones = {}) {
  const { x, y } = posicionDibujo(e, alfa);
  const alto = (opciones.alto || e.alto + 4) * ESCALA_ENEMIGOS;
  const nombre = opciones.sprite || e.t.SPRITE;
  const caminando = e.enElSuelo && Math.abs(e.vx) > 10;
  let subir = caminando ? Math.abs(Math.sin(e.pasos * 0.07)) * 2 : Math.sin(e.tiempo * 3) * 0.6;
  let rotar = opciones.rotar || 0;
  let temblor = 0;
  let transparencia = opciones.alfa ?? 1;

  if (e.estado.startsWith('prepara')) temblor = Math.sin(e.tiempo * 50) * 1.4;
  if (e.estado === 'ataca') rotar += 0.15;
  if (e.estado === 'aturdido') rotar -= 0.2;
  if (e.estado === 'derrotado') {
    // Sale volando y da vueltas mientras se desvanece
    rotar = -e.tiempoEstado * 11 * (e.vueloGiro || 1);
    transparencia *= 1 - Math.max(0, (e.tiempoEstado - 0.45) / 0.45);
    subir = 0;
  }

  ctx.save();
  ctx.translate(x + e.ancho / 2 + temblor + (opciones.adelante || 0) * e.mirando, y + e.alto - subir);
  const destello = e.destello;
  if (tienePiezas(nombre) && e.estado !== 'derrotado' && !opciones.estirarX) {
    // Por piezas: las piernitas dan pasos
    ctx.scale(e.mirando, opciones.estirarY || 1);
    if (Math.abs(rotar) > 0.01) {
      ctx.translate(0, -alto / 2);
      ctx.rotate(rotar);
      ctx.translate(0, alto / 2);
    }
    const mov = caminando ? movimientoPasitos(e.pasos * 0.09) : {};
    if (e.estado === 'ataca') mov.adelante = -0.4;
    dibujarPorPiezas(ctx, nombre, alto, mov, { tinte: opciones.tinte, destello, alfa: Math.max(0, transparencia) });
  } else {
    if (e.estado === 'derrotado') {
      ctx.translate(0, -alto / 2);
      ctx.rotate(rotar * e.mirando);
      ctx.translate(0, alto / 2);
      rotar = 0;
    }
    dibujarSprite(ctx, nombre, 0, 0, alto, {
      mirando: e.mirando, rotar, alfa: Math.max(0, transparencia), destello, tinte: opciones.tinte,
      estirarX: opciones.estirarX || 1, estirarY: opciones.estirarY || 1,
    });
  }
  ctx.restore();
}

// Los enemigos chiquitos se dibujan un poco más grandes que su caja de choque, para que se vean bien
const ESCALA_ENEMIGOS = 1.18;

// La porra eléctrica del recluta, en su mano
function dibujarPorraDeSprite(ctx, e, alfa) {
  if (e.estado === 'derrotado') return;
  const { x, y } = posicionDibujo(e, alfa);
  let angulo = 0.9;
  if (e.estado === 'prepara') angulo = -2.4 + Math.sin(e.tiempo * 40) * 0.08;   // la levanta y tiembla
  else if (e.estado === 'ataca') angulo = 1.8;
  else if (e.estado === 'recupera') angulo = 1.3;
  ctx.save();
  ctx.translate(x + e.ancho / 2, y + e.alto);
  ctx.scale(e.mirando, 1);
  dibujarPorra(ctx, { x: 10, y: -30 }, angulo, e.estado === 'prepara' || e.estado === 'ataca');
  ctx.restore();
}
