// ============================================================
//  JEFE DEL ACTO 1: COMANDANTE MARCUS VANE (Nivel 3)
//  Un cíborg pesado con un mazo de energía. Es el hermano mayor de Elena.
//  Cómo ganarle:
//    - Cuando levanta el mazo (brilla), alejate: pega dos veces seguidas.
//    - Después de pegar o de aterrizar de un salto queda ABIERTO: ¡ahí pegale!
//    - Cuando se cubre con el mazo (guardia), no le pegues de frente: contraataca.
//      Pegale por la espalda o rompele la guardia con el gancho (3er golpe del combo).
//    - Al saltar, cae con una onda que corre por el piso: ¡saltala!
//    - Con la mitad de la vida entra en MODO ASEDIO: llama a la artillería
//      (círculos rojos en el piso: ¡salí de ahí!).
// ============================================================

TIPOS_ENEMIGOS.vane = {
  nombre: 'Comandante Vane',
  JEFE: true,
  TEXTO_OBJETIVO: '¡NADIE CRUZA LA MURALLA!',
  ANCHO: 50,
  ALTO: 88,
  VIDA: 460,
  ESCUDO: true,                 // solo cuando se cubre (guardia)
  TIEMPO_GUARDIA_ROTA: 2,
  PESADO: 0,
  RESISTENCIA_HIELO: 0.4,
  TIEMPO_ATURDIDO: 0,
  VELOCIDAD: 85,
  ALCANCE: 46,
  PREPARAR_MAZAZO: 0.55,        // el mazo brilla: ¡es el aviso!
  DANIO_MAZAZO: 16,
  ABIERTO: 0.9,
  DISTANCIA_SALTO: 250,
  PREPARAR_SALTO: 0.5,
  DANIO_ONDA: 12,
  VELOCIDAD_ONDA: 320,
  GUARDIA: 1.4,
  ARTILLERIA_MARCAS: 3,
  DANIO_ARTILLERIA: 14,
  actualizar: actualizarVane,
  dibujar: dibujarVane,
  alBloquear: (e) => {
    // Si le pegás de frente mientras se cubre, contraataca enseguida
    if (e.estado === 'guardia') {
      e.combo = 0;
      e.contraataque = true;
      cambiarEstado(e, 'preparaMazazo');
    }
  },
};

// ---------- Ayudantes que comparten los jefes ----------

// Ondas que corren por el piso para los dos lados (hay que saltarlas)
function lanzarPulsosDesde(x, pies, danio, velocidad, color) {
  for (const lado of [-1, 1]) {
    lanzarProyectil({
      tipo: 'pulso', deEnemigo: true, danio, ancho: 26, alto: 24, vida: 3, color,
      x: x + lado * 40, y: pies - 12, vx: lado * velocidad, vy: 0,
    });
  }
  ondaExpansiva(x, pies, 90, '#ff5a28');
}

// Marcas rojas en el piso: unos instantes después cae un misil en cada una
function pedirArtilleria(e, xs, danio) {
  e.marcas = e.marcas || [];
  for (const x of xs) e.marcas.push({ x, tiempo: 0, lanzado: false });
  Sonido.alarma();
}

function actualizarMarcas(e, dt, danio) {
  if (!e.marcas) return;
  for (const m of e.marcas) {
    m.tiempo += dt;
    if (!m.lanzado && m.tiempo >= 0.55) {
      m.lanzado = true;
      lanzarProyectil({
        tipo: 'misil', deEnemigo: true, danio, ancho: 10, alto: 20, vida: 3, atraviesa: true,
        x: m.x, y: PISO - 640, vx: 0, vy: 820, explota: 62, pisoY: PISO - 6,
      });
      Sonido.misil();
    }
  }
  e.marcas = e.marcas.filter((m) => m.tiempo < 1.4);
}

function dibujarMarcas(ctx, e) {
  if (!e.marcas) return;
  for (const m of e.marcas) {
    const pulso = 0.5 + Math.sin(m.tiempo * 20) * 0.5;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 50, 50, ${0.5 + pulso * 0.4})`;
    ctx.fillStyle = `rgba(255, 50, 50, ${0.12 + pulso * 0.12})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(m.x, PISO - 2, 62, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(m.x - 10, PISO - 2);
    ctx.lineTo(m.x + 10, PISO - 2);
    ctx.moveTo(m.x, PISO - 10);
    ctx.lineTo(m.x, PISO + 6);
    ctx.stroke();
    ctx.restore();
  }
}

// Un salto que cae justo en un lugar (calcula la velocidad de costado)
function saltarHacia(e, xDestino, fuerza = 900) {
  const vuelo = (2 * fuerza) / GRAVEDAD;
  e.vy = -fuerza;
  e.vxSalto = (xDestino - centroDe(e).x) / vuelo;
}

// Los límites de la sala del jefe (para no saltar afuera)
function limitesDeArena() {
  const arena = Juego.nivel.arena;
  return { desde: arena.puertaX + 60, hasta: (arena.hasta || Juego.nivel.ancho) - 60 };
}

// Mitad de la vida: el jefe se enoja
function revisarSegundaFase(e, texto) {
  if (e.vida <= e.vidaMax / 2 && !e.sobrecarga && e.estado !== 'derrotado') {
    e.sobrecarga = true;
    textoFlotante(centroDe(e).x, e.y - 30, texto, '#ff5050');
    Sonido.alarma();
    temblar(8);
    return true;
  }
  return false;
}

// ---------- Comandante Vane ----------

function actualizarVane(e, jugadores, nivel, dt) {
  const t = e.t;
  revisarSegundaFase(e, '¡MODO ASEDIO!');
  const rapidez = e.sobrecarga ? 1.25 : 1;
  e.esperaSalto = Math.max(0, (e.esperaSalto ?? 2) - dt);
  e.esperaGuardia = Math.max(0, (e.esperaGuardia ?? 3) - dt);
  e.esperaArtilleria = Math.max(0, (e.esperaArtilleria ?? 1) - dt);
  e.escudoAbajo = e.estado !== 'guardia';
  actualizarMarcas(e, dt, t.DANIO_ARTILLERIA);

  const objetivo = jugadorMasCercano(e, jugadores);
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  let velocidad = 0;
  let enElAire = false;

  switch (e.estado) {
    case 'dormido':
      break;
    case 'presentacion':
      if (e.tiempoEstado >= 1.4) cambiarEstado(e, 'camina');
      break;

    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      if (distancia <= t.ALCANCE) {
        // Cerca: a veces se cubre, casi siempre pega
        if (e.esperaGuardia <= 0 && Math.random() < 0.35) {
          cambiarEstado(e, 'guardia');
          e.esperaGuardia = 4;
        } else {
          e.combo = 0;
          e.contraataque = false;
          cambiarEstado(e, 'preparaMazazo');
        }
      } else if (e.sobrecarga && e.esperaArtilleria <= 0) {
        cambiarEstado(e, 'llamaArtilleria');
      } else if (distancia > t.DISTANCIA_SALTO && e.esperaSalto <= 0) {
        cambiarEstado(e, 'preparaSalto');
      } else {
        velocidad = e.mirando * t.VELOCIDAD * rapidez;
        if (Math.floor(e.pasos / 50) !== Math.floor((e.pasos + Math.abs(velocidad) * dt) / 50)) Sonido.jefePaso();
      }
      break;
    }

    case 'preparaMazazo':
      if (e.tiempoEstado >= (e.contraataque ? 0.22 : t.PREPARAR_MAZAZO) / rapidez) {
        cambiarEstado(e, 'mazazo');
        e.golpeados = new Set();
        Sonido.golpeFuerte();
        temblar(5);
      }
      break;

    case 'mazazo':
      e.cajaAtaque = cajaDelante(e, 74, 70, 14);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_MAZAZO, jugadores);
      if (e.tiempoEstado >= 0.18) {
        e.combo = (e.combo || 0) + 1;
        if (e.combo < 2) {
          e.contraataque = true;     // el segundo golpe sale más rápido
          if (objetivo) e.mirando = hacia;
          cambiarEstado(e, 'preparaMazazo');
        } else {
          cambiarEstado(e, 'abierto');
        }
      }
      break;

    case 'abierto':
      if (e.tiempoEstado >= t.ABIERTO) cambiarEstado(e, 'camina');
      break;

    case 'guardia':
      if (objetivo) e.mirando = hacia;
      if (e.tiempoEstado >= t.GUARDIA) cambiarEstado(e, 'camina');
      break;

    case 'preparaSalto':
      if (e.tiempoEstado >= t.PREPARAR_SALTO / rapidez) {
        const { desde, hasta } = limitesDeArena();
        const destino = objetivo ? Math.max(desde, Math.min(hasta, centroDe(objetivo).x)) : centroDe(e).x;
        saltarHacia(e, destino);
        cambiarEstado(e, 'salto');
        Sonido.jefeCarga();
      }
      break;

    case 'salto':
      enElAire = true;
      velocidad = e.vxSalto;
      e.cajaAtaque = { x: e.x, y: e.y, ancho: e.ancho, alto: e.alto };
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_MAZAZO, jugadores);
      if (e.enElSuelo && e.tiempoEstado > 0.15) {
        lanzarPulsosDesde(centroDe(e).x, e.y + e.alto, t.DANIO_ONDA, t.VELOCIDAD_ONDA * rapidez);
        polvo(centroDe(e).x, e.y + e.alto, 20);
        temblar(12);
        Sonido.onda();
        e.esperaSalto = e.sobrecarga ? 4 : 5.5;
        cambiarEstado(e, 'abierto');
      }
      break;

    case 'llamaArtilleria':
      if (e.tiempoEstado >= 0.7) {
        const xs = [];
        const { desde, hasta } = limitesDeArena();
        for (const p of jugadores) if (!p.seCayo) xs.push(centroDe(p).x);
        while (xs.length < t.ARTILLERIA_MARCAS) xs.push(desde + Math.random() * (hasta - desde));
        pedirArtilleria(e, xs.slice(0, t.ARTILLERIA_MARCAS), t.DANIO_ARTILLERIA);
        e.esperaArtilleria = 7;
        cambiarEstado(e, 'abierto');
      }
      break;

    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'camina');
      break;

    case 'derrotado':
      // Cae de rodillas: no explota (es una persona, con partes de robot)
      if (Math.random() < dt * 8) chispas(e.x + Math.random() * e.ancho, e.y + 20 + Math.random() * 30, '#5fd4ff', 4, 160);
      break;
  }

  const quieto = ['congelado', 'derrotado', 'guardia', 'abierto', 'preparaMazazo', 'preparaSalto', 'llamaArtilleria'].includes(e.estado);
  e.vx = quieto ? 0 : velocidad * (e.lento ? 0.5 : 1);
  if (enElAire && e.lento) e.vx = velocidad;
  e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

function dibujarVane(ctx, e, alfa) {
  dibujarMarcas(ctx, e);
  const { x, y } = posicionDibujo(e, alfa);
  dibujarFiguraVane(ctx, x + e.ancho / 2, y + e.alto, e.mirando, e.estado, e.tiempo, e.tiempoEstado, {
    pasos: e.pasos, destello: e.destello, sobrecarga: e.sobrecarga, escudoRoto: e.escudoRoto > 0,
    preparar: e.t.PREPARAR_MAZAZO,
  });
}

// El dibujo de Vane (también se usa en las escenas de historia)
function dibujarFiguraVane(ctx, x, piso, mirando, estado, tiempo, tiempoEstado, extra = {}) {
  const caminando = estado === 'camina';
  const paso = caminando ? Math.sin((extra.pasos || 0) * 0.07) : 0;

  ctx.save();
  ctx.translate(x, piso);
  ctx.scale(mirando, 1);
  if (estado === 'derrotado') {
    ctx.translate(0, 18 * Math.min(1, tiempoEstado * 2));   // cae de rodillas
    ctx.rotate(0.15 * Math.min(1, tiempoEstado * 2));
  }
  if (estado === 'preparaSalto') ctx.scale(1.05, 0.88);    // se agacha
  if (estado === 'salto') ctx.rotate(-0.1);
  if (extra.destello > 0) ctx.filter = `brightness(${1 + extra.destello * 1.5})`;
  ctx.lineCap = 'round';

  // Capa (detrás de todo)
  ctx.fillStyle = '#4a1418';
  ctx.beginPath();
  ctx.moveTo(-10, -78);
  ctx.lineTo(-30 - paso * 3, -14);
  ctx.lineTo(-8, -20);
  ctx.closePath();
  ctx.fill();

  // Piernas (una es robótica)
  ctx.lineWidth = 11;
  ctx.strokeStyle = '#2b2f3a';
  dibujarExtremidad(ctx, -8, -36, paso * 0.5, 34);
  ctx.strokeStyle = '#6f7787';
  dibujarExtremidad(ctx, 8, -36, -paso * 0.5, 34);

  // Brazo de atrás
  ctx.lineWidth = 9;
  ctx.strokeStyle = '#3a3f4a';
  dibujarExtremidad(ctx, -12, -72, -0.3 + paso * 0.4, 26);

  // Torso con armadura
  ctx.fillStyle = '#3d4350';
  ctx.beginPath();
  ctx.roundRect(-18, -84, 36, 50, 8);
  ctx.fill();
  ctx.fillStyle = '#e0343c';
  ctx.fillRect(-18, -56, 36, 4);
  ctx.fillStyle = '#5d6574';
  ctx.fillRect(4, -82, 14, 16);           // hombrera metálica
  // Núcleo del pecho
  ctx.save();
  ctx.shadowColor = '#5fd4ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = extra.sobrecarga ? '#ff6060' : '#9fe8ff';
  ctx.beginPath();
  ctx.arc(-4, -70, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cabeza: pelo castaño (como Elena) y medio rostro de metal
  ctx.fillStyle = '#d5a684';
  ctx.beginPath();
  ctx.arc(2, -94, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8c94a3';
  ctx.beginPath();
  ctx.arc(2, -94, 10, -Math.PI / 2, Math.PI / 2);
  ctx.fill();
  ctx.fillStyle = '#3b2417';
  ctx.beginPath();
  ctx.arc(1, -98, 10.5, Math.PI * 1.05, Math.PI * 2.05);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(6, -96, 4, 3);              // ojo robótico
  ctx.restore();

  // El mazo de energía
  let angulo = 0.5 + paso * 0.2;
  const preparando = estado === 'preparaMazazo';
  if (preparando) angulo = -2.6 + Math.sin(tiempo * 40) * 0.06;
  else if (estado === 'mazazo') angulo = 1.9;
  else if (estado === 'abierto') angulo = 1.5;
  else if (estado === 'guardia') angulo = 1.57;
  else if (estado === 'salto') angulo = -2.8;
  else if (estado === 'llamaArtilleria') angulo = 3.1;
  else if (estado === 'derrotado') angulo = 1.2;
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#6f7787';
  const mano = dibujarExtremidad(ctx, 12, -72, angulo, 26);

  if (estado === 'guardia') {
    // Se cubre: el mango cruzado adelante, con un escudo de energía
    ctx.save();
    ctx.strokeStyle = extra.escudoRoto ? '#6b7486' : '#ffb347';
    ctx.shadowColor = '#ffb347';
    ctx.shadowBlur = extra.escudoRoto ? 0 : 14;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(20, -56, 34, -1.2, 1.2);
    ctx.stroke();
    ctx.restore();
  }
  // Mango y cabeza del mazo
  const finX = mano.x + Math.sin(angulo) * 34;
  const finY = mano.y + Math.cos(angulo) * 34;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#2b2f3a';
  ctx.beginPath();
  ctx.moveTo(mano.x, mano.y);
  ctx.lineTo(finX, finY);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = '#ff7a2f';
  ctx.shadowBlur = preparando ? 24 : 10;
  ctx.fillStyle = preparando ? '#ffe0a0' : '#ff7a2f';
  ctx.beginPath();
  ctx.roundRect(finX - 11, finY - 11, 22, 22, 5);
  ctx.fill();
  ctx.restore();

  // Llamando a la artillería: una luz roja en la mano
  if (estado === 'llamaArtilleria') {
    ctx.save();
    ctx.shadowColor = '#ff3b3b';
    ctx.shadowBlur = 20;
    ctx.fillStyle = Math.sin(tiempo * 30) > 0 ? '#ff5050' : '#ffb0b0';
    ctx.beginPath();
    ctx.arc(finX, finY - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
