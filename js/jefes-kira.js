// ============================================================
//  JEFA DEL EXPRESO GÉNESIS: KIRA, LA CAZADORA
//  La mejor agente de Zephyrus. Rápida, con un látigo de plasma.
//  Cómo ganarle:
//    - Cuando echa el látigo para atrás (brilla), alejate o saltá: después queda abierta.
//    - Cuando salta muy alto, mirá la SOMBRA en el piso: va a caer en picada ahí.
//      Al aterrizar queda clavada un momento: ¡pegale!
//    - A veces esquiva tus golpes con una voltereta ("¡ESQUIVÓ!"): no te desesperes.
//    - Con 60 % de vida llama a dos drones. Con la mitad, hace girar el látigo
//      alrededor suyo: ¡saltá por encima!
// ============================================================

TIPOS_ENEMIGOS.kira = {
  nombre: 'Kira, la Cazadora',
  JEFE: true,
  TEXTO_OBJETIVO: '¡ESTE ES MI TREN!',
  ANCHO: 34,
  ALTO: 72,
  VIDA: 520,
  PESADO: 0.1,
  RESISTENCIA_HIELO: 0.4,
  TIEMPO_ATURDIDO: 0,
  VELOCIDAD: 210,
  DISTANCIA_LATIGO: 150,      // desde esta distancia te alcanza el látigo
  PREPARAR_LATIGO: 0.45,
  DANIO_LATIGO: 14,
  ABIERTO: 0.6,
  DANIO_PICADA: 16,
  DANIO_ONDA: 11,
  DANIO_GIRO: 10,
  PROBABILIDAD_ESQUIVA: 0.3,
  actualizar: actualizarKira,
  dibujar: dibujarKira,
};

function actualizarKira(e, jugadores, nivel, dt) {
  const t = e.t;
  if (revisarSegundaFase(e, '¡LÁTIGO ELÉCTRICO!')) {
    cambiarEstado(e, 'preparaGiro');
    Sonido.latigo();
  }
  const rapidez = e.sobrecarga ? 1.25 : 1;
  e.espera = Math.max(0, (e.espera ?? 1.2) - dt);
  e.inmune = e.estado === 'voltereta';
  e.textoInmune = '¡ESQUIVÓ!';
  const objetivo = jugadorMasCercano(e, jugadores);
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  let velocidad = 0;
  let enElAire = false;

  // Llama a los drones una vez, con 60 % de vida
  if (!e.llamoDrones && e.vida <= e.vidaMax * 0.6 && e.estado === 'camina') {
    e.llamoDrones = true;
    const { desde, hasta } = limitesDeArena();
    for (const x of [desde + 80, hasta - 80]) {
      const dron = crearEnemigo({ tipo: 'dronV2', x, y: PISO, patrulla: 120 });
      dron.alerta = 1.2;
      Juego.enemigos.push(dron);
      chispas(x, PISO - 120, '#ff5050', 16, 260);
    }
    textoFlotante(centroDe(e).x, e.y - 30, '¡DRONES, ATAQUEN!', '#ff5a7a');
    Sonido.alarma();
  }

  switch (e.estado) {
    case 'dormido':
      break;
    case 'presentacion':
      if (e.tiempoEstado < dt * 1.5) Sonido.latigo();
      if (e.tiempoEstado >= 1.5) cambiarEstado(e, 'camina');
      break;

    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      // Si un golpe está por pegarle, a veces lo esquiva con una voltereta
      const golpeCerca = jugadores.some((p) => p.ataqueActivo && seTocan(p.ataqueActivo.caja, { x: e.x - 20, y: e.y, ancho: e.ancho + 40, alto: e.alto }));
      if (golpeCerca && Math.random() < t.PROBABILIDAD_ESQUIVA) {
        cambiarEstado(e, 'voltereta');
        e.vy = -620;
        Sonido.esquiva();
        break;
      }
      if (e.espera <= 0 && distancia > 220) {
        cambiarEstado(e, 'preparaSalto');
      } else if (e.espera <= 0 && e.sobrecarga && distancia < 140 && Math.random() < 0.4) {
        cambiarEstado(e, 'preparaGiro');
      } else if (distancia <= t.DISTANCIA_LATIGO && distancia > 40 && Math.abs(piesDe(objetivo) - piesDe(e)) < 80) {
        cambiarEstado(e, 'preparaLatigo');
      } else if (distancia <= 40) {
        // Muy cerca: retrocede para tener espacio para el látigo
        velocidad = -e.mirando * t.VELOCIDAD * 0.8;
      } else {
        velocidad = e.mirando * t.VELOCIDAD * rapidez;
      }
      break;
    }

    case 'voltereta':
      enElAire = true;
      velocidad = -e.mirando * 300;
      if (e.enElSuelo && e.tiempoEstado > 0.15) cambiarEstado(e, 'camina');
      break;

    case 'preparaLatigo':
      if (objetivo) e.mirando = hacia;
      if (e.tiempoEstado >= t.PREPARAR_LATIGO / rapidez) {
        cambiarEstado(e, 'latigo');
        e.golpeados = new Set();
        Sonido.latigo();
      }
      break;

    case 'latigo':
      e.cajaAtaque = cajaDelante(e, 190, 26, 24);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_LATIGO, jugadores);
      if (e.tiempoEstado >= 0.22) {
        cambiarEstado(e, 'abierto');
        e.espera = e.sobrecarga ? 0.8 : 1.4;
      }
      break;

    case 'abierto':
      if (e.tiempoEstado >= t.ABIERTO) cambiarEstado(e, 'camina');
      break;

    case 'preparaSalto':
      if (e.tiempoEstado >= 0.35 / rapidez) {
        cambiarEstado(e, 'subiendo');
        e.vy = -1150;
        Sonido.jefeCarga();
      }
      break;

    case 'subiendo':
      enElAire = true;
      // Vuela hacia arriba del jugador
      if (objetivo) velocidad = Math.max(-650, Math.min(650, (centroDe(objetivo).x - centroDe(e).x) * 2.2));
      if (e.vy >= -60) {
        cambiarEstado(e, 'acecho');
        e.vy = 0;
      }
      break;

    case 'acecho':
      // Se queda flotando arriba un instante, siguiendo al jugador (¡mirá la sombra!)
      enElAire = true;
      e.vy = 0;
      if (objetivo) velocidad = Math.max(-500, Math.min(500, (centroDe(objetivo).x - centroDe(e).x) * 4));
      if (e.tiempoEstado >= 0.5 / rapidez) {
        cambiarEstado(e, 'picada');
        e.golpeados = new Set();
        e.vy = 1400;
      }
      break;

    case 'picada':
      enElAire = true;
      e.vy = 1400;
      e.cajaAtaque = { x: e.x - 6, y: e.y, ancho: e.ancho + 12, alto: e.alto };
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_PICADA, jugadores);
      if (e.enElSuelo) {
        lanzarPulsosDesde(centroDe(e).x, e.y + e.alto, t.DANIO_ONDA, 320, 'rgba(255, 90, 130, 0.55)');
        polvo(centroDe(e).x, e.y + e.alto, 18);
        temblar(12);
        Sonido.onda();
        cambiarEstado(e, 'clavada');
        e.espera = 1.5;
      }
      break;

    case 'clavada':
      if (e.tiempoEstado >= 0.95) cambiarEstado(e, 'camina');
      break;

    case 'preparaGiro':
      if (e.tiempoEstado >= 0.55) {
        cambiarEstado(e, 'giro');
        e.golpeados = new Set();
        e.ultimoGiro = 0;
      }
      break;

    case 'giro':
      // El látigo da vueltas: lastima a los que estén a la altura del cuerpo (¡saltá!)
      e.cajaAtaque = { x: centroDe(e).x - 120, y: e.y + 16, ancho: 240, alto: e.alto - 16 };
      if (e.tiempoEstado - e.ultimoGiro > 0.35) {
        e.golpeados = new Set();
        e.ultimoGiro = e.tiempoEstado;
        Sonido.latigo();
      }
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_GIRO, jugadores);
      if (objetivo) velocidad = hacia * 70;
      if (e.tiempoEstado >= 1.4) {
        cambiarEstado(e, 'abierto');
        e.espera = 1.6;
      }
      break;

    case 'congelado':
      if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'camina');
      break;

    case 'derrotado':
      if (Math.random() < dt * 6) chispas(e.x + Math.random() * e.ancho, e.y + 20 + Math.random() * 30, '#ff5a7a', 3, 140);
      break;
  }

  const quieta = ['dormido', 'presentacion', 'preparaLatigo', 'latigo', 'abierto', 'preparaSalto', 'clavada', 'preparaGiro', 'congelado', 'derrotado'].includes(e.estado);
  e.vx = quieta ? 0 : velocidad * (e.lento && !enElAire ? 0.5 : 1);
  if (e.estado !== 'acecho' && e.estado !== 'picada') e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  // No se va de la sala
  const { desde, hasta } = limitesDeArena();
  e.x = Math.max(desde - 40, Math.min(hasta + 40 - e.ancho, e.x));
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

// ============================================================
//  DIBUJO DE KIRA (hecho con código)
// ============================================================

function dibujarKira(ctx, e, alfa) {
  const { x, y } = posicionDibujo(e, alfa);
  // La sombra de la picada: dónde va a caer
  if (e.estado === 'acecho' || e.estado === 'subiendo' || e.estado === 'picada') {
    const cx = x + e.ancho / 2;
    const pulso = 0.5 + Math.sin(e.tiempo * 25) * 0.5;
    ctx.fillStyle = `rgba(255, 60, 100, ${0.25 + pulso * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(cx, PISO - 2, 46, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 120, 160, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  dibujarFiguraKira(ctx, x + e.ancho / 2, y + e.alto, e.mirando, e.estado, e.tiempo, e.tiempoEstado, {
    pasos: e.pasos, destello: e.destello, vy: e.vy, enElSuelo: e.enElSuelo, sobrecarga: e.sobrecarga,
    preparar: e.t.PREPARAR_LATIGO,
  });
}

// El dibujo de Kira (también se usa en las escenas de historia)
function dibujarFiguraKira(ctx, x, piso, mirando, estado, tiempo, tiempoEstado, extra = {}) {
  const caminando = estado === 'camina' && extra.enElSuelo !== false;
  const fase = (extra.pasos || 0) * 0.07;
  const paso = caminando ? Math.sin(fase) : 0;
  const escala = 1.18;

  ctx.save();
  ctx.translate(x, piso);
  ctx.scale(mirando * escala, escala);
  if (extra.destello > 0.4) ctx.filter = 'brightness(2.6) saturate(0.2)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Posturas especiales
  if (estado === 'voltereta') {
    ctx.translate(0, -34);
    ctx.rotate(-tiempoEstado * 14);
    ctx.translate(0, 34);
  } else if (estado === 'picada' || estado === 'acecho') {
    ctx.translate(0, -30);
    ctx.rotate(estado === 'picada' ? 0.6 : 0.2);
    ctx.translate(0, 30);
  } else if (estado === 'giro') {
    ctx.scale(Math.cos(tiempoEstado * 20) > 0 ? 1 : -1, 1);   // da vueltas
  } else if (estado === 'derrotado') {
    ctx.translate(0, 12);
    ctx.rotate(0.15);
  } else if (estado === 'clavada' || estado === 'preparaSalto') {
    ctx.scale(1.06, 0.86);                                      // agachada
  }

  // Cola de caballo blanca (flamea con el viento del tren)
  const viento = Math.sin(tiempo * 12) * 2;
  ctx.strokeStyle = '#f0f0f8';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-4, -60);
  ctx.quadraticCurveTo(-18, -62 + viento, -28, -50 + viento * 1.5);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-24, -52 + viento);
  ctx.lineTo(-34, -44 + viento * 2);
  ctx.stroke();

  // Piernas con rodillas (botas negras)
  let muslos = [paso * 0.6, -paso * 0.6];
  let rodillas = [Math.max(0, -paso) * 0.9, Math.max(0, paso) * 0.9];
  if (estado === 'latigo' || estado === 'preparaLatigo') { muslos = [0.5, -0.45]; rodillas = [0.2, 0.3]; }
  if (estado === 'subiendo' || estado === 'acecho' || estado === 'voltereta') { muslos = [-0.9, 0.6]; rodillas = [1.5, 1.2]; }
  if (estado === 'picada') { muslos = [0.1, -0.1]; rodillas = [0.2, 0.2]; }
  if (estado === 'clavada') { muslos = [0.9, -0.9]; rodillas = [0.9, 0.6]; }
  ctx.lineWidth = 6;
  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = i === 0 ? '#1a1018' : '#2a1824';
    const pie = extremidadDoble(ctx, i === 0 ? -3 : 3, -30, -muslos[i], 15, rodillas[i], 15);
    ctx.fillStyle = '#0e0a10';
    ctx.fillRect(pie.x - 3, pie.y - 3, 10, 5);
  }

  // Brazo de atrás
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#3a1a28';
  extremidadDoble(ctx, -3, -52, -0.3 - paso * 0.5, 11, -0.6, 10);

  // Torso: armadura roja oscura con detalles fucsia
  ctx.fillStyle = '#5a1024';
  ctx.beginPath();
  ctx.moveTo(-9, -56);
  ctx.lineTo(9, -56);
  ctx.lineTo(8, -30);
  ctx.lineTo(-8, -30);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff3d7a';
  ctx.fillRect(-9, -45, 18, 2);
  ctx.fillStyle = '#2a0a14';
  ctx.fillRect(-9, -33, 18, 4);                                  // cinturón
  // Hombrera
  ctx.fillStyle = '#7a1a34';
  ctx.beginPath();
  ctx.arc(4, -54, 6, Math.PI, Math.PI * 2);
  ctx.fill();

  // Cabeza con visor brillante
  ctx.fillStyle = '#e8c0a0';
  ctx.beginPath();
  ctx.arc(1, -63, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0f0f8';                                     // flequillo blanco
  ctx.beginPath();
  ctx.arc(0, -65, 8, Math.PI * 1.05, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#5fd4ff';
  ctx.shadowBlur = 8;
  ctx.fillStyle = extra.sobrecarga ? '#ff5a7a' : '#7fe6ff';
  ctx.fillRect(-1, -65, 10, 3);                                  // visor
  ctx.restore();

  // Brazo del látigo y el látigo
  let anguloBrazo = 1.1 + paso * 0.3;
  const preparando = estado === 'preparaLatigo' || estado === 'preparaGiro';
  if (preparando) anguloBrazo = -2.4 + Math.sin(tiempo * 40) * 0.08;
  else if (estado === 'latigo') anguloBrazo = 1.7;
  else if (estado === 'giro') anguloBrazo = 1.57;
  else if (estado === 'acecho' || estado === 'subiendo') anguloBrazo = -2.8;
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#5a1024';
  const mano = extremidadDoble(ctx, 3, -52, anguloBrazo, 11, estado === 'latigo' ? 0 : -0.3, 10);
  dibujarLatigo(ctx, mano, estado, tiempo, tiempoEstado, preparando);
  ctx.restore();
}

// El látigo de plasma: una curva brillante hecha de puntitos
function dibujarLatigo(ctx, mano, estado, tiempo, tiempoEstado, preparando) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = preparando ? '#ffd0e0' : '#ff5a8a';
  ctx.shadowColor = '#ff3d7a';
  ctx.shadowBlur = preparando ? 18 : 10;
  ctx.lineWidth = preparando ? 4 : 3;
  ctx.beginPath();
  ctx.moveTo(mano.x, mano.y);
  if (estado === 'latigo') {
    // ¡Látigo estirado hacia adelante!
    const largo = 160 * Math.min(1, tiempoEstado / 0.08);
    ctx.quadraticCurveTo(mano.x + largo * 0.5, mano.y - 18, mano.x + largo, mano.y + Math.sin(tiempo * 60) * 4);
  } else if (estado === 'giro') {
    const a = tiempoEstado * 20;
    ctx.quadraticCurveTo(mano.x + Math.cos(a) * 60, mano.y + Math.sin(a) * 20 - 10, mano.x + Math.cos(a + 0.6) * 100, mano.y + 8);
  } else if (preparando) {
    ctx.quadraticCurveTo(mano.x - 40, mano.y - 30, mano.x - 70 + Math.sin(tiempo * 30) * 5, mano.y - 10);
  } else {
    // Colgando y moviéndose
    const balanceo = Math.sin(tiempo * 4) * 8;
    ctx.quadraticCurveTo(mano.x + 10, mano.y + 20, mano.x - 6 + balanceo, mano.y + 30);
  }
  ctx.stroke();
  ctx.restore();
}
