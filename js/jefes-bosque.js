// ============================================================
//  JEFES DEL ACTO 2 (el Bosque Biosintético)
//
//  GUARDIÁN DE LAS RUINAS (minijefe del Nivel 5): el orco gigante
//    - Levanta el garrote (aviso) y pega fuerte adelante: después queda abierto.
//    - Si estás lejos, embiste: si choca contra la pared queda mareado.
//    - Ruge y caen rocas del techo: mirá las sombras en el piso.
//
//  ABOMINACIÓN X-0 (jefe del Nivel 6): el monstruo
//    - Adelante es durísimo: los golpes de frente casi no le hacen nada.
//    - Su PUNTO DÉBIL está en el LOMO (la bolsa violeta que brilla): pegale por detrás.
//    - Cuando embiste y choca contra la pared, o cuando aterriza de un salto,
//      te queda de espaldas: ¡aprovechá!
//    - Con la mitad de la vida escupe ácido y hace caer rocas.
// ============================================================

// ---------- Rocas que caen del techo (con su sombra de aviso) ----------

function anunciarRocas(e, xs) {
  e.rocas = e.rocas || [];
  for (const x of xs) e.rocas.push({ x, tiempo: 0, cayo: false });
}

function actualizarRocas(e, dt, danio) {
  if (!e.rocas) return;
  for (const r of e.rocas) {
    r.tiempo += dt;
    if (!r.cayo && r.tiempo >= 0.6) {
      r.cayo = true;
      lanzarProyectil({
        tipo: 'roca', deEnemigo: true, danio, ancho: 22, alto: 22, vida: 3, gravedad: 1600,
        x: r.x, y: PISO - 600, vx: 0, vy: 200, colorChispa: '#8a8076',
        alTerminar: (p) => polvo(p.x, p.y, 6),
      });
    }
  }
  e.rocas = e.rocas.filter((r) => r.tiempo < 1.3);
}

function dibujarSombrasDeRocas(ctx, e) {
  if (!e.rocas) return;
  for (const r of e.rocas) {
    const tamano = 8 + Math.min(1, r.tiempo / 1.1) * 18;
    ctx.fillStyle = `rgba(0, 0, 0, ${0.25 + Math.min(1, r.tiempo) * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(r.x, PISO - 1, tamano, tamano * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Rocas al azar dentro de la sala, más una sobre cada jugador
function lugaresDeRocas(jugadores, cantidad) {
  const { desde, hasta } = limitesDeArena();
  const xs = jugadores.filter((p) => !p.seCayo).map((p) => centroDe(p).x);
  while (xs.length < cantidad) xs.push(desde + Math.random() * (hasta - desde));
  return xs;
}

// ============================================================
//  GUARDIÁN DE LAS RUINAS
// ============================================================
TIPOS_ENEMIGOS.guardian = {
  nombre: 'Guardián de las Ruinas',
  JEFE: true,
  TEXTO_OBJETIVO: '¡GRRROOOAAAR!',
  ANCHO: 64,
  ALTO: 118,
  VIDA: 400,
  PESADO: 0,
  RESISTENCIA_HIELO: 0.4,
  TIEMPO_ATURDIDO: 0,
  VELOCIDAD: 70,
  ALCANCE: 42,
  PREPARAR_GARROTE: 0.7,
  DANIO_GARROTE: 18,
  ABIERTO: 1.0,
  DISTANCIA_CARGA: 260,
  PREPARAR_CARGA: 0.8,
  VELOCIDAD_CARGA: 440,
  DURACION_CARGA: 1.5,
  DANIO_CARGA: 16,
  MAREADO: 2,
  ROCAS: 5,
  DANIO_ROCA: 12,
  actualizar: actualizarGuardian,
  dibujar: dibujarGuardian,
};

function actualizarGuardian(e, jugadores, nivel, dt) {
  const t = e.t;
  if (revisarSegundaFase(e, '¡FURIA ANCESTRAL!')) {
    cambiarEstado(e, 'rugido');
    Sonido.rugidoMonstruo();
  }
  const rapidez = e.sobrecarga ? 1.3 : 1;
  e.esperaCarga = Math.max(0, (e.esperaCarga ?? 2) - dt);
  e.esperaRugido = Math.max(0, (e.esperaRugido ?? 6) - dt);
  actualizarRocas(e, dt, t.DANIO_ROCA);

  const objetivo = jugadorMasCercano(e, jugadores);
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  let velocidad = 0;

  switch (e.estado) {
    case 'dormido':
      break;
    case 'presentacion':
      if (e.tiempoEstado < dt * 1.5) Sonido.rugidoMonstruo();
      if (e.tiempoEstado >= 1.6) cambiarEstado(e, 'camina');
      break;
    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      if (distancia <= t.ALCANCE) cambiarEstado(e, 'preparaGarrote');
      else if (e.esperaRugido <= 0) cambiarEstado(e, 'rugido');
      else if (distancia > t.DISTANCIA_CARGA && e.esperaCarga <= 0) cambiarEstado(e, 'preparaCarga');
      else velocidad = e.mirando * t.VELOCIDAD * rapidez;
      if (Math.floor(e.pasos / 55) !== Math.floor((e.pasos + Math.abs(velocidad) * dt) / 55)) {
        Sonido.jefePaso();
        polvo(centroDe(e).x, e.y + e.alto, 3);
      }
      break;
    }
    case 'preparaGarrote':
      if (e.tiempoEstado >= t.PREPARAR_GARROTE / rapidez) {
        cambiarEstado(e, 'garrote');
        e.golpeados = new Set();
        Sonido.golpeFuerte();
        temblar(8);
        if (e.sobrecarga) lanzarPulsosDesde(centroDe(e).x + e.mirando * 50, e.y + e.alto, 12, 300);
      }
      break;
    case 'garrote':
      e.cajaAtaque = cajaDelante(e, 96, 100, 20);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_GARROTE, jugadores);
      if (e.tiempoEstado >= 0.2) cambiarEstado(e, 'abierto');
      break;
    case 'abierto':
      if (e.tiempoEstado >= t.ABIERTO) cambiarEstado(e, 'camina');
      break;
    case 'preparaCarga':
      if (objetivo && e.tiempoEstado < t.PREPARAR_CARGA * 0.6) e.mirando = hacia;
      if (Math.random() < dt * 20) polvo(centroDe(e).x - e.mirando * 20, e.y + e.alto, 1);
      if (e.tiempoEstado >= t.PREPARAR_CARGA / rapidez) {
        cambiarEstado(e, 'carga');
        e.golpeados = new Set();
        Sonido.jefeCarga();
      }
      break;
    case 'carga':
      velocidad = e.mirando * t.VELOCIDAD_CARGA * rapidez;
      e.cajaAtaque = { x: e.x - 4, y: e.y + 20, ancho: e.ancho + 8, alto: e.alto - 20 };
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_CARGA, jugadores);
      if (Math.random() < dt * 30) polvo(centroDe(e).x - e.mirando * 30, e.y + e.alto, 2);
      if (e.chocoPared && e.tiempoEstado > 0.05) {
        cambiarEstado(e, 'mareado');
        e.esperaCarga = 4;
        chispas(centroDe(e).x + e.mirando * 35, centroDe(e).y, '#ffe14d', 24, 360);
        temblar(14);
        Sonido.golpeFuerte();
        anunciarRocas(e, lugaresDeRocas(jugadores, 3));   // ¡se caen piedras del techo!
      } else if (e.tiempoEstado >= t.DURACION_CARGA) {
        cambiarEstado(e, 'abierto');
        e.esperaCarga = 4;
      }
      break;
    case 'mareado':
      if (e.tiempoEstado >= t.MAREADO) cambiarEstado(e, 'camina');
      break;
    case 'rugido':
      if (e.tiempoEstado < dt * 1.5) Sonido.rugidoMonstruo();
      if (e.tiempoEstado >= 0.5 && !e.rugio) {
        e.rugio = true;
        temblar(12);
        anunciarRocas(e, lugaresDeRocas(jugadores, e.sobrecarga ? t.ROCAS + 2 : t.ROCAS));
      }
      if (e.tiempoEstado >= 1.2) {
        e.rugio = false;
        e.esperaRugido = e.sobrecarga ? 6 : 9;
        cambiarEstado(e, 'camina');
      }
      break;
    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'camina');
      break;
    case 'derrotado':
      if (Math.random() < dt * 10) polvo(e.x + Math.random() * e.ancho, e.y + e.alto, 2);
      if (e.tiempoEstado >= 2 && !e.eliminar) {
        e.eliminar = true;
        const centro = centroDe(e);
        chispas(centro.x, centro.y, '#7ac74f', 40, 500);
        chispas(centro.x, centro.y, '#8a8076', 30, 400);
        temblar(14);
        Sonido.explosion();
      }
      break;
  }
  const controla = ['camina', 'carga'].includes(e.estado);
  e.vx = controla ? velocidad * (e.lento ? 0.5 : 1) : 0;
  e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

function dibujarGuardian(ctx, e, alfa) {
  dibujarSombrasDeRocas(ctx, e);
  const { x, y } = posicionDibujo(e, alfa);
  const alto = 132;
  let rotar = 0, estirarY = 1, temblor = 0, transparencia = 1;
  if (e.estado === 'preparaGarrote' || e.estado === 'preparaCarga') temblor = Math.sin(e.tiempo * 50) * 1.5;
  if (e.estado === 'carga') rotar = 0.15;
  if (e.estado === 'rugido') estirarY = 1.06;
  if (e.estado === 'camina') estirarY = 1 + Math.abs(Math.sin(e.pasos * 0.04)) * 0.03;
  if (e.estado === 'derrotado') {
    rotar = -0.3 * Math.min(1, e.tiempoEstado);
    transparencia = Math.max(0.2, 1 - e.tiempoEstado / 2);
  }
  // El garrote (detrás del cuerpo cuando lo levanta)
  let angulo = 0.6;
  if (e.estado === 'preparaGarrote') angulo = -2.5;
  else if (e.estado === 'garrote') angulo = 1.8;
  else if (e.estado === 'abierto') angulo = 1.6;
  else if (e.estado === 'carga') angulo = 1.2;
  else if (e.estado === 'rugido') angulo = -2.9;
  ctx.save();
  ctx.globalAlpha = transparencia;
  ctx.translate(x + e.ancho / 2 + temblor, y + e.alto);
  ctx.scale(e.mirando, 1);
  const hombro = { x: 18, y: -82 };
  const punta = { x: hombro.x + Math.sin(angulo) * 64, y: hombro.y + Math.cos(angulo) * 64 };
  ctx.strokeStyle = '#6b4a2a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hombro.x, hombro.y);
  ctx.lineTo(punta.x, punta.y);
  ctx.stroke();
  ctx.fillStyle = '#5a3d22';
  ctx.beginPath();
  ctx.arc(punta.x, punta.y, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#c9ced8';                     // pinchos del garrote
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26 + angulo;
    ctx.fillRect(punta.x + Math.cos(a) * 14 - 2, punta.y + Math.sin(a) * 14 - 2, 4, 4);
  }
  ctx.restore();

  ctx.save();
  ctx.translate(x + e.ancho / 2 + temblor, y + e.alto);
  const tinte = e.sobrecarga ? { color: '#ff3020', fuerza: 0.18 } : null;
  if (!dibujarSprite(ctx, 'orco', 0, 0, alto, { mirando: e.mirando, rotar, estirarY, alfa: transparencia, destello: e.destello, tinte })) {
    ctx.fillStyle = '#4a7a3a';
    ctx.fillRect(-e.ancho / 2, -e.alto, e.ancho, e.alto);
  }
  ctx.restore();
  if (e.estado === 'mareado') dibujarEstrellitas(ctx, x + e.ancho / 2, y - 10, e.tiempo);
}

// ============================================================
//  ABOMINACIÓN X-0
// ============================================================
TIPOS_ENEMIGOS.abominacion = {
  nombre: 'Abominación X-0',
  JEFE: true,
  TEXTO_OBJETIVO: '¡LA ABOMINACIÓN TE ENCONTRÓ!',
  ANCHO: 150,
  ALTO: 118,
  VIDA: 650,
  PESADO: 0,
  RESISTENCIA_HIELO: 0.3,
  TIEMPO_ATURDIDO: 0,
  DEBIL_ESPALDA: 2.2,           // ¡el lomo!
  ARMADURA_FRENTE: 0.35,        // de frente casi no le hacés nada
  VELOCIDAD: 95,
  ALCANCE: 40,
  PREPARAR_MORDIDA: 0.55,
  DANIO_MORDIDA: 18,
  ABIERTO: 0.9,
  PREPARAR_CARGA: 0.9,
  VELOCIDAD_CARGA: 560,
  DANIO_CARGA: 20,
  MAREADO: 2.3,
  PREPARAR_SALTO: 0.5,
  DANIO_ONDA: 14,
  DANIO_ACIDO: 10,
  DANIO_ROCA: 12,
  actualizar: actualizarAbominacion,
  dibujar: dibujarAbominacion,
};

function actualizarAbominacion(e, jugadores, nivel, dt) {
  const t = e.t;
  if (revisarSegundaFase(e, '¡FASE 2: FRENESÍ!')) {
    cambiarEstado(e, 'rugido');
    e.ataquesSeguidos = 0;
  }
  const rapidez = e.sobrecarga ? 1.25 : 1;
  e.espera = Math.max(0, (e.espera ?? 1.5) - dt);
  actualizarRocas(e, dt, t.DANIO_ROCA);

  const objetivo = jugadorMasCercano(e, jugadores);
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  let velocidad = 0;
  let enElAire = false;

  switch (e.estado) {
    case 'dormido':
      break;
    case 'presentacion':
      if (e.tiempoEstado < dt * 1.5) Sonido.rugidoMonstruo();
      temblar(4);
      if (e.tiempoEstado >= 1.8) cambiarEstado(e, 'camina');
      break;
    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      if (distancia <= t.ALCANCE) {
        cambiarEstado(e, 'preparaMordida');
      } else if (e.espera <= 0) {
        // Elige un ataque: embestir, saltar o (en la fase 2) escupir ácido
        const opciones = ['preparaCarga', 'preparaSalto'];
        if (e.sobrecarga) opciones.push('escupe', 'rugido');
        cambiarEstado(e, opciones[Math.floor(Math.random() * opciones.length)]);
      } else {
        velocidad = e.mirando * t.VELOCIDAD * rapidez;
        if (Math.floor(e.pasos / 60) !== Math.floor((e.pasos + Math.abs(velocidad) * dt) / 60)) {
          Sonido.jefePaso();
          temblar(2);
        }
      }
      break;
    }
    case 'preparaMordida':
      if (e.tiempoEstado >= t.PREPARAR_MORDIDA / rapidez) {
        cambiarEstado(e, 'mordida');
        e.golpeados = new Set();
        Sonido.mordida();
      }
      break;
    case 'mordida':
      velocidad = e.mirando * 480;
      e.cajaAtaque = cajaDelante(e, 70, 80, 20);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_MORDIDA, jugadores);
      if (e.tiempoEstado >= 0.28) cambiarEstado(e, 'abierto');
      break;
    case 'abierto':
      if (e.tiempoEstado >= t.ABIERTO) {
        cambiarEstado(e, 'camina');
        e.espera = e.sobrecarga ? 1 : 1.8;
      }
      break;
    case 'preparaCarga':
      if (objetivo && e.tiempoEstado < t.PREPARAR_CARGA * 0.6) e.mirando = hacia;
      if (e.tiempoEstado < dt * 1.5) Sonido.grunido();
      if (Math.random() < dt * 25) polvo(centroDe(e).x - e.mirando * 50, e.y + e.alto, 2);
      if (e.tiempoEstado >= t.PREPARAR_CARGA / rapidez) {
        cambiarEstado(e, 'carga');
        e.golpeados = new Set();
        Sonido.jefeCarga();
      }
      break;
    case 'carga':
      velocidad = e.mirando * t.VELOCIDAD_CARGA * rapidez;
      e.cajaAtaque = { x: e.x - 4, y: e.y + 30, ancho: e.ancho + 8, alto: e.alto - 30 };
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_CARGA, jugadores);
      if (Math.random() < dt * 30) polvo(centroDe(e).x - e.mirando * 60, e.y + e.alto, 2);
      if (e.chocoPared && e.tiempoEstado > 0.05) {
        // ¡Choca contra la pared y queda de espaldas!
        cambiarEstado(e, 'mareado');
        chispas(centroDe(e).x + e.mirando * 70, centroDe(e).y, '#ffe14d', 26, 380);
        temblar(16);
        Sonido.golpeFuerte();
        if (e.sobrecarga) anunciarRocas(e, lugaresDeRocas(jugadores, 4));
      } else if (e.tiempoEstado >= 2.5) {
        cambiarEstado(e, 'abierto');
      }
      break;
    case 'mareado':
      if (e.tiempoEstado >= t.MAREADO) {
        cambiarEstado(e, 'camina');
        e.espera = 1.5;
      }
      break;
    case 'preparaSalto':
      if (e.tiempoEstado >= t.PREPARAR_SALTO / rapidez) {
        // Salta POR ENCIMA del jugador, al otro lado
        const { desde, hasta } = limitesDeArena();
        const xJugador = objetivo ? centroDe(objetivo).x : centroDe(e).x;
        let destino = xJugador + hacia * 230;
        destino = Math.max(desde + e.ancho / 2, Math.min(hasta - e.ancho / 2, destino));
        saltarHacia(e, destino, 1000);
        cambiarEstado(e, 'salto');
        Sonido.grunido();
      }
      break;
    case 'salto':
      enElAire = true;
      velocidad = e.vxSalto;
      if (e.enElSuelo && e.tiempoEstado > 0.15) {
        // Aterriza mirando para el mismo lado: ¡el jugador queda detrás!
        lanzarPulsosDesde(centroDe(e).x, e.y + e.alto, t.DANIO_ONDA, 300, 'rgba(170, 80, 255, 0.55)');
        polvo(centroDe(e).x, e.y + e.alto, 26);
        temblar(16);
        Sonido.onda();
        cambiarEstado(e, 'abierto');
      }
      break;
    case 'escupe':
      if (objetivo) e.mirando = hacia;
      for (const momento of [0.4, 0.65, 0.9]) {
        if (e.tiempoEstado >= momento && e.tiempoEstado - dt < momento && objetivo) {
          // Tres chorros: uno hacia el jugador y dos un poco al costado
          const boca = { x: centroDe(e).x + e.mirando * 50, y: e.y + 50 };
          const hacia = { x: centroDe(objetivo).x + (Math.random() - 0.5) * 180, y: piesDe(objetivo) - 10 };
          lanzarAcido(boca, hacia, 900, t.DANIO_ACIDO);
        }
      }
      if (e.tiempoEstado >= 1.2) {
        cambiarEstado(e, 'camina');
        e.espera = 1.5;
      }
      break;
    case 'rugido':
      if (e.tiempoEstado < dt * 1.5) Sonido.rugidoMonstruo();
      temblar(5);
      if (e.tiempoEstado >= 0.6 && !e.rugio) {
        e.rugio = true;
        anunciarRocas(e, lugaresDeRocas(jugadores, 6));
      }
      if (e.tiempoEstado >= 1.4) {
        e.rugio = false;
        cambiarEstado(e, 'camina');
        e.espera = 1.2;
      }
      break;
    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'camina');
      break;
    case 'derrotado':
      // Se deshace en partículas violetas
      if (Math.random() < dt * 30) {
        chispas(e.x + Math.random() * e.ancho, e.y + Math.random() * e.alto, Math.random() < 0.5 ? '#a050ff' : '#3a1030', 4, 200);
      }
      if (e.tiempoEstado < dt * 1.5) Sonido.rugidoMonstruo();
      if (e.tiempoEstado >= 2.5 && !e.eliminar) {
        e.eliminar = true;
        const centro = centroDe(e);
        chispas(centro.x, centro.y, '#a050ff', 60, 600);
        ondaExpansiva(centro.x, centro.y, 260, '#a050ff', 1);
        temblar(18);
        Sonido.explosion();
      }
      break;
  }
  const controla = ['camina', 'carga', 'mordida', 'salto'].includes(e.estado);
  e.vx = controla ? velocidad * (e.lento && !enElAire ? 0.5 : 1) : 0;
  e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

function dibujarAbominacion(ctx, e, alfa) {
  dibujarSombrasDeRocas(ctx, e);
  const { x, y } = posicionDibujo(e, alfa);
  const cx = x + e.ancho / 2;
  const piso = y + e.alto;
  let estirarX = 1, estirarY = 1, rotar = 0, temblor = 0, transparencia = 1;
  const respira = Math.sin(e.tiempo * 3) * 0.03;
  estirarY += respira;
  if (e.estado === 'preparaMordida') { estirarX = 1.1; estirarY = 1.08; temblor = Math.sin(e.tiempo * 50) * 2; }
  if (e.estado === 'mordida') { rotar = 0.15; estirarX = 1.12; }
  if (e.estado === 'preparaCarga' || e.estado === 'preparaSalto') { estirarY = 0.85; estirarX = 1.1; temblor = Math.sin(e.tiempo * 40) * 2; }
  if (e.estado === 'carga') rotar = 0.12;
  if (e.estado === 'salto') { estirarY = 1.1; estirarX = 0.92; }
  if (e.estado === 'rugido' || e.estado === 'escupe') { estirarY = 1.1; temblor = Math.sin(e.tiempo * 60) * 2; }
  if (e.estado === 'mareado') rotar = Math.sin(e.tiempo * 4) * 0.08;
  if (e.estado === 'derrotado') {
    transparencia = Math.max(0, 1 - e.tiempoEstado / 2.5);
    estirarY = 1 - Math.min(0.5, e.tiempoEstado * 0.2);
    temblor = Math.sin(e.tiempo * 70) * 3;
  }

  // El PUNTO DÉBIL del lomo: una bolsa violeta que late (del lado de atrás)
  const espalda = cx - e.mirando * (e.ancho / 2 - 6);
  if (e.estado !== 'derrotado') {
    const late = 0.5 + Math.sin(e.tiempo * (e.sobrecarga ? 10 : 5)) * 0.5;
    ctx.save();
    ctx.shadowColor = '#c060ff';
    ctx.shadowBlur = 14 + late * 10;
    ctx.fillStyle = `rgba(190, 100, 255, ${0.7 + late * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(espalda, piso - 76, 20 + late * 4, 26 + late * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0d8ff';
    ctx.beginPath();
    ctx.ellipse(espalda - e.mirando * 4, piso - 82, 6, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx + temblor, piso);
  const tinte = e.sobrecarga ? { color: '#ff1040', fuerza: 0.2 } : null;
  const dibujado = dibujarSprite(ctx, 'monstruo', 0, 6, 175, {
    mirando: e.mirando, rotar, estirarX, estirarY, alfa: transparencia, destello: e.destello, tinte,
  });
  if (!dibujado) {
    ctx.fillStyle = '#2a1320';
    ctx.beginPath();
    ctx.arc(0, -70, 80, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Boca brillando antes de morder o de escupir
  if (e.estado === 'preparaMordida' || e.estado === 'escupe') {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = e.estado === 'escupe' ? 'rgba(140, 255, 60, 0.5)' : 'rgba(255, 60, 60, 0.45)';
    ctx.beginPath();
    ctx.arc(cx + e.mirando * 10, piso - 55, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (e.estado === 'mareado') dibujarEstrellitas(ctx, cx, y - 14, e.tiempo);
}
