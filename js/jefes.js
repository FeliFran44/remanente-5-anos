// ============================================================
//  JEFES: los enemigos grandes del final de cada nivel
// ============================================================

// ------------------------------------------------------------
//  INFILTRADOR MECH-01 (jefe del Nivel 1)
//  Un robot pesado con escudo frontal. Cómo ganarle:
//    - pegarle por la espalda,
//    - romperle la guardia (3er golpe del combo, Furia o la Torreta PEM de Elena),
//    - o aprovechar cuando queda abierto: después de pegar y cuando choca contra la pared.
//  Con la mitad de la vida entra en SOBRECARGA: es más rápido y su golpe manda ondas por el piso.
// ------------------------------------------------------------
TIPOS_ENEMIGOS.mech01 = {
  nombre: 'Infiltrador Mech-01',
  COMPORTAMIENTO: 'mech',
  JEFE: true,
  ANCHO: 70,
  ALTO: 92,
  VIDA: 320,
  ESCUDO: true,
  TIEMPO_GUARDIA_ROTA: 2.5,
  PESADO: 0,                    // no se lo puede empujar
  RESISTENCIA_HIELO: 0.4,       // el hielo le dura menos
  TIEMPO_ATURDIDO: 0,
  VELOCIDAD: 55,
  ALCANCE_GOLPE: 36,
  DANIO_GOLPE: 18,
  PREPARAR_GOLPE: 0.6,          // levanta el puño: es el aviso
  ABIERTO: 1.1,                 // después de pegar queda sin escudo este tiempo
  DISTANCIA_CARGA: 240,         // si estás más lejos que esto, te embiste
  PREPARAR_CARGA: 0.8,
  VELOCIDAD_CARGA: 430,
  DURACION_CARGA: 1.3,
  DANIO_CARGA: 15,
  MAREADO: 1.8,                 // si choca contra la pared queda mareado (y sin escudo)
  ESPERA_ENTRE_CARGAS: 3,
  DANIO_PULSO: 12,
  VELOCIDAD_PULSO: 300,
};

function actualizarMech(e, jugadores, nivel, dt) {
  const t = e.t;

  // Sobrecarga: con la mitad de la vida se pone más rápido
  if (e.vida <= t.VIDA / 2 && !e.sobrecarga && e.estado !== 'derrotado') {
    e.sobrecarga = true;
    textoFlotante(centroDe(e).x, e.y - 30, '¡SOBRECARGA!', '#ff5050');
    Sonido.alarma();
    temblar(8);
  }
  const rapidez = e.sobrecarga ? 1.35 : 1;
  e.esperaCarga = Math.max(0, (e.esperaCarga ?? 1.5) - dt);
  e.escudoAbajo = e.estado === 'abierto' || e.estado === 'mareado';

  const objetivo = jugadorMasCercano(e, jugadores);
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  let velocidad = 0;

  switch (e.estado) {
    case 'dormido':
      break;

    case 'presentacion':
      if (e.tiempoEstado >= 1.6) cambiarEstado(e, 'camina');
      break;

    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      if (distancia <= t.ALCANCE_GOLPE) cambiarEstado(e, 'preparaGolpe');
      else if (distancia > t.DISTANCIA_CARGA && e.esperaCarga <= 0) cambiarEstado(e, 'preparaCarga');
      else velocidad = e.mirando * t.VELOCIDAD * rapidez;
      // Pisadas pesadas
      if (Math.floor(e.pasos / 45) !== Math.floor((e.pasos + Math.abs(velocidad) * dt) / 45)) {
        Sonido.jefePaso();
        polvo(centroDe(e).x, e.y + e.alto, 3);
      }
      break;
    }

    case 'preparaGolpe':
      if (e.tiempoEstado >= t.PREPARAR_GOLPE / rapidez) {
        cambiarEstado(e, 'golpe');
        e.golpeados = new Set();
        Sonido.golpeFuerte();
        temblar(6);
        if (e.sobrecarga) lanzarPulsos(e);
      }
      break;

    case 'golpe':
      e.cajaAtaque = cajaDelante(e, 60, 64, 24);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_GOLPE, jugadores);
      if (e.tiempoEstado >= 0.18) cambiarEstado(e, 'abierto');
      break;

    case 'abierto':
      if (e.tiempoEstado >= t.ABIERTO) cambiarEstado(e, 'camina');
      break;

    case 'preparaCarga':
      if (objetivo && e.tiempoEstado < t.PREPARAR_CARGA * 0.6) e.mirando = hacia;   // apunta, y después se queda quieto
      if (e.tiempoEstado >= t.PREPARAR_CARGA / rapidez) {
        cambiarEstado(e, 'carga');
        e.golpeados = new Set();
        Sonido.jefeCarga();
      }
      break;

    case 'carga':
      velocidad = e.mirando * t.VELOCIDAD_CARGA * rapidez;
      e.cajaAtaque = { x: e.x - 4, y: e.y + 10, ancho: e.ancho + 8, alto: e.alto - 10 };
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_CARGA, jugadores);
      if (Math.random() < dt * 30) polvo(centroDe(e).x - e.mirando * 30, e.y + e.alto, 2);
      if (e.chocoPared && e.tiempoEstado > 0.05) {
        // ¡Se dio contra la pared!
        cambiarEstado(e, 'mareado');
        e.esperaCarga = t.ESPERA_ENTRE_CARGAS;
        chispas(centroDe(e).x + e.mirando * 35, centroDe(e).y, '#ffe14d', 24, 360);
        temblar(12);
        Sonido.golpeFuerte();
      } else if (e.tiempoEstado >= t.DURACION_CARGA) {
        cambiarEstado(e, 'abierto');
        e.esperaCarga = t.ESPERA_ENTRE_CARGAS;
      }
      break;

    case 'mareado':
      if (e.tiempoEstado >= t.MAREADO) cambiarEstado(e, 'camina');
      break;

    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'camina');
      break;

    case 'derrotado':
      // Explota de a poco y después desaparece en una gran explosión
      if (Math.random() < dt * 14) {
        chispas(e.x + Math.random() * e.ancho, e.y + Math.random() * e.alto, '#ffb347', 10, 300);
      }
      if (Math.random() < dt * 4) Sonido.golpeFuerte();
      if (e.tiempoEstado >= 2) {
        e.eliminar = true;
        const centro = centroDe(e);
        chispas(centro.x, centro.y, '#ffb347', 50, 600);
        chispas(centro.x, centro.y, '#ff3b3b', 30, 500);
        ondaExpansiva(centro.x, centro.y, 220, '#ffb347', 1);
        temblar(16);
        Sonido.explosion();
      }
      break;
  }

  // Física: camina, embiste o se queda quieto
  const controla = !['congelado', 'derrotado', 'mareado'].includes(e.estado);
  if (controla) e.vx = velocidad * (e.lento ? 0.4 : 1);
  else e.vx = 0;
  e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

function golpearJugadoresEn(e, caja, danio, jugadores) {
  for (const p of jugadores) {
    if (e.golpeados.has(p) || !seTocan(caja, p)) continue;
    if (golpearJugador(p, danio, e.mirando)) e.golpeados.add(p);
  }
}

// En sobrecarga, el golpe al suelo manda una onda para cada lado: ¡hay que saltarla!
function lanzarPulsos(e) {
  const t = e.t;
  const centro = centroDe(e).x;
  const pies = e.y + e.alto;
  for (const lado of [-1, 1]) {
    lanzarProyectil({
      tipo: 'pulso', deEnemigo: true, danio: t.DANIO_PULSO, ancho: 26, alto: 24, vida: 3,
      x: centro + lado * 40, y: pies - 12, vx: lado * t.VELOCIDAD_PULSO, vy: 0,
    });
  }
  ondaExpansiva(centro, pies, 80, '#ff5a28');
}

// ============================================================
//  DIBUJO
// ============================================================

function dibujarMech(ctx, e, alfa) {
  const { x, y } = posicionDibujo(e, alfa);
  const t = e.tiempo;
  const caminando = e.estado === 'camina' && Math.abs(e.vx) > 5;
  const paso = caminando ? Math.sin(e.pasos * 0.08) : 0;

  ctx.save();
  ctx.translate(x + e.ancho / 2, y + e.alto);
  ctx.scale(e.mirando, 1);
  if (e.estado === 'derrotado') {
    ctx.translate(Math.sin(t * 60) * 2, 0);   // tiembla
    ctx.globalAlpha = Math.max(0.3, 1 - e.tiempoEstado / 2);
  }
  if (e.estado === 'carga' || e.estado === 'preparaCarga') ctx.rotate(0.12);   // se inclina para embestir
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 1.5})`;

  // Fuego de los propulsores al embestir
  if (e.estado === 'carga') {
    ctx.fillStyle = `rgba(255, 140, 40, ${0.6 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(-30, -60);
    ctx.lineTo(-58 - Math.random() * 14, -52);
    ctx.lineTo(-30, -44);
    ctx.closePath();
    ctx.fill();
  }

  // Piernas
  ctx.fillStyle = '#4a5160';
  ctx.fillRect(-24 + paso * 4, -32, 16, 32);
  ctx.fillRect(6 - paso * 4, -32, 16, 32);
  ctx.fillStyle = '#2b3040';
  ctx.fillRect(-28 + paso * 4, -6, 22, 6);
  ctx.fillRect(4 - paso * 4, -6, 22, 6);

  // Brazo del puño (detrás del cuerpo)
  let anguloPuno = 0.3;
  if (e.estado === 'preparaGolpe') anguloPuno = -2.6 + Math.sin(t * 40) * 0.05;   // lo levanta
  else if (e.estado === 'golpe') anguloPuno = 1.9;
  else if (e.estado === 'abierto') anguloPuno = 1.5;
  else if (e.estado === 'carga') anguloPuno = 1.2;
  ctx.strokeStyle = '#5d6574';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  const puno = dibujarExtremidad(ctx, -14, -70, anguloPuno, 34);
  ctx.save();
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = e.estado === 'preparaGolpe' ? 18 : 0;
  ctx.fillStyle = e.estado === 'preparaGolpe' ? '#ff6b5a' : '#3a4050';
  ctx.beginPath();
  ctx.arc(puno.x, puno.y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cuerpo
  ctx.fillStyle = '#6f7787';
  ctx.beginPath();
  ctx.roundRect(-30, -80, 60, 50, 8);
  ctx.fill();
  ctx.fillStyle = '#e0343c';                       // franja de Genesis
  ctx.fillRect(-30, -50, 60, 4);
  // Núcleo del pecho: late, y más fuerte en sobrecarga
  ctx.save();
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = e.sobrecarga ? 20 : 10;
  ctx.fillStyle = e.sobrecarga ? '#ff8080' : '#ff4040';
  ctx.beginPath();
  ctx.arc(-4, -64, 5 + Math.sin(t * (e.sobrecarga ? 14 : 6)) * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Cabeza con visor
  ctx.fillStyle = '#5d6574';
  ctx.fillRect(-12, -96, 28, 18);
  ctx.fillStyle = '#2b3040';
  ctx.fillRect(-2, -104, 3, 8);                    // antena
  ctx.save();
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#ff5050';
  ctx.fillRect(2, -91, 13, 4);
  ctx.restore();

  // Escudo: adelante si está activo; bajo y titilando si está abierto, roto o apagado por la PEM
  const escudoArriba = escudoActivo(e);
  ctx.save();
  if (escudoArriba) {
    ctx.translate(30, -84);
  } else {
    ctx.translate(26, -46);
    ctx.rotate(0.9);
    ctx.globalAlpha *= 0.5 + Math.random() * 0.3;
  }
  ctx.fillStyle = '#3d4658';
  ctx.fillRect(0, 0, 12, 72);
  ctx.strokeStyle = escudoArriba ? '#5fd4ff' : '#5b6578';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#5fd4ff';
  ctx.shadowBlur = escudoArriba ? 10 : 0;
  ctx.strokeRect(0, 0, 12, 72);
  ctx.restore();

  // Mareado: estrellitas que dan vueltas sobre la cabeza
  if (e.estado === 'mareado') {
    ctx.fillStyle = '#ffe14d';
    for (let i = 0; i < 3; i++) {
      const a = t * 6 + i * 2.1;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 22, -112 + Math.sin(a) * 6, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // En sobrecarga echa humo
  if (e.sobrecarga && e.estado !== 'derrotado' && Math.random() < 0.15) {
    polvo(x + e.ancho / 2, y + 10, 1);
  }
}
