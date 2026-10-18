// ============================================================
//  JAX: el protagonista
// ============================================================

// Estos números deciden cómo se siente controlar a Jax.
// ¡Probá cambiarlos, guardá y recargá la página para ver qué pasa!
const JAX = {
  ANCHO: 34,                // tamaño de su caja de choque
  ALTO: 64,
  VIDA: 100,
  VELOCIDAD_MAX: 330,       // qué tan rápido corre (píxeles por segundo)
  ACELERACION: 2600,        // qué tan rápido llega a la velocidad máxima
  FRENADO: 3200,            // qué tan rápido frena al soltar las teclas o al darse vuelta
  CONTROL_EN_EL_AIRE: 0.7,  // en el aire se controla un poco menos (1 = igual que en el suelo)
  FUERZA_SALTO: 820,        // qué tan alto salta
  CORTE_DE_SALTO: 2.5,      // si soltás saltar mientras sube, cae así de más fuerte (salto corto)
  TIEMPO_COYOTE: 0.1,       // segundos en que todavía podés saltar después de salir de un borde
  RECUERDO_DE_SALTO: 0.12,  // si apretás saltar justo antes de tocar el suelo, igual salta
  DOBLE_SALTO: true,        // en el aire puede saltar una vez más (con una voltereta)
};

// El suero Némesis: la degradación celular sube sola.
// Al llegar a 100 % Jax entra en estado crítico y pierde vida.
const SUERO = {
  DEGRADACION_POR_SEGUNDO: 0.5,   // tarda 200 segundos en llenarse
  DANIO_CRITICO_POR_SEGUNDO: 2,
};

// Los ataques de Jax. ¡También se pueden cambiar!
// (los tiempos están en segundos y las distancias en píxeles)
const HABILIDADES_JAX = {
  // Combo Némesis: hasta 3 golpes seguidos; el tercero es un gancho más fuerte
  COMBO: [
    { danio: 10, empujeX: 160, empujeY: 0, duracion: 0.24, activoDesde: 0.05, activoHasta: 0.13, avance: 140, ancho: 44 },
    { danio: 10, empujeX: 160, empujeY: 0, duracion: 0.24, activoDesde: 0.05, activoHasta: 0.13, avance: 140, ancho: 44 },
    { danio: 20, empujeX: 420, empujeY: 280, duracion: 0.38, activoDesde: 0.10, activoHasta: 0.20, avance: 220, ancho: 56, fuerte: true,
      rompeGuardia: true },   // el gancho rompe los escudos
  ],
  VENTANA_COMBO: 0.35,      // después de un golpe, tiempo para apretar otra vez y seguir el combo

  // Patada aérea: golpe en el aire. Si le pega a alguien, Jax rebota hacia arriba
  // y recupera el doble salto (¡se pueden encadenar patadas sin tocar el piso!)
  AEREO: { danio: 12, empujeX: 300, empujeY: 120, duracion: 0.32, activoDesde: 0.05, activoHasta: 0.24, rebote: 560 },

  // Onda Sísmica: golpe al suelo que lastima y empuja a todos los que están cerca.
  // Si la usás en el aire, Jax se tira en picada y la onda sale al tocar el suelo.
  ONDA: { danio: 25, radio: 150, empujeX: 460, empujeY: 380, recarga: 6, preparacion: 0.15, picada: 1000, fuerte: true },

  // Embestida Irascible: carrera muy rápida hacia adelante; mientras dura, nada lo lastima
  EMBESTIDA: { danio: 20, velocidad: 950, duracion: 0.22, empujeX: 520, empujeY: 220, recarga: 8, fuerte: true },

  // Modo Furia (la definitiva): la barra se carga pegando. Al activarla, Jax ruge y empuja
  // a los que están cerca. Durante 8 segundos su daño se triplica y sus golpes aturden más,
  // pero va perdiendo vida (la Furia sola nunca lo deja en 0).
  FURIA: { duracion: 8, multiplicador: 3, aturdimiento: 1.2, drenaje: 1.5, radioRugido: 220 },

  // Mochila de inyectores (solo en el Modo 1)
  MOCHILA: { inyectores: 3, vida: 20, degradacion: 30 },
};

function crearJax(x, yPies) {
  const jax = crearPersonaje('jax', JAX, x, yPies);
  jax.golpeCombo = 0;           // qué golpe del combo está dando (0, 1 o 2)
  jax.siguienteGolpe = false;   // apretó golpe durante un golpe: el combo sigue solo
  jax.ventanaCombo = 0;
  jax.ondaEnElAire = false;
  jax.ondaHecha = false;
  jax.rugidoHecho = false;
  jax.golpeados = new Set();
  jax.usoAereo = false;         // ya pateó en este salto (se recupera al tocar el piso o al rebotar)
  jax.recargas = { onda: 0, embestida: 0 };   // segundos que faltan para volver a usarlas
  jax.degradacion = 0;          // degradación celular, de 0 a 100 %
  jax.carga = 0;                // carga de la Furia, de 0 a 100
  jax.furia = 0;                // segundos que le quedan de Furia
  jax.inyectores = 0;           // inyectores en la mochila (solo Modo 1)
  // El Pulsor (js/arma.js)
  jax.balas = ARMA.BALAS_INICIALES;
  jax.balasMax = ARMA.BALAS_MAXIMAS;
  jax.nivelArma = 0;
  jax.recargaDisparo = 0;       // segundos que faltan para el próximo disparo
  jax.disparo = 0;              // el retroceso del último disparo (solo cambia el dibujo)
  jax.armaFuera = 0;            // mientras sea más que 0, tiene el arma en la mano
  return jax;
}

function actualizarJax(jax, controles, nivel, dt) {
  jax.ataqueActivo = null;
  jax.recargas.onda = Math.max(0, jax.recargas.onda - dt);
  jax.recargas.embestida = Math.max(0, jax.recargas.embestida - dt);
  jax.ventanaCombo = Math.max(0, jax.ventanaCombo - dt);
  actualizarSuero(jax, dt);

  if (jax.enElSuelo) jax.usoAereo = false;
  if (jax.aturdido <= 0) {
    // La esquiva corta los golpes comunes (no las habilidades)
    if (controles.esquivarRecien && (!jax.accion || jax.accion === 'golpe' || jax.accion === 'aereo')) {
      if (intentarEsquivar(jax, controles)) jax.accion = null;
    }
    empezarAccionesJax(jax, controles);
  }
  actualizarArma(jax, controles, dt);

  // Mientras pega en el suelo, prepara la Onda o ruge, Jax se planta en el lugar
  const c = { ...controles };
  const plantado = (jax.accion === 'golpe' && jax.enElSuelo) || jax.accion === 'onda' || jax.accion === 'rugido';
  if (plantado) {
    c.izquierda = false;
    c.derecha = false;
  }
  if (jax.accion === 'onda' || jax.accion === 'rugido') c.saltarRecien = false;

  actualizarMovimiento(jax, c, nivel, dt);
  avanzarAccionJax(jax, dt);
  // Si se queda quieto un rato, se cruza de brazos (solo cambia el dibujo)
  const quieto = jax.enElSuelo && Math.abs(jax.vx) < 5 && !jax.accion && jax.aturdido <= 0;
  jax.tiempoQuieto = quieto ? (jax.tiempoQuieto || 0) + dt : 0;
}

function actualizarSuero(jax, dt) {
  const F = HABILIDADES_JAX.FURIA;
  const yaEstabaCritico = jax.degradacion >= 100;
  jax.degradacion = Math.min(100, jax.degradacion + SUERO.DEGRADACION_POR_SEGUNDO * (jax.multSuero || 1) * dt);
  if (jax.degradacion >= 100) {
    if (!yaEstabaCritico) {
      Sonido.critico();
      avisar('¡Degradación al 100 %! Jax pierde vida: buscá un inyector o que Elena lo cure');
    }
    jax.vida -= SUERO.DANIO_CRITICO_POR_SEGUNDO * dt;
  }

  if (jax.furia > 0) {
    jax.furia = Math.max(0, jax.furia - dt);
    if (jax.vida > 1) jax.vida = Math.max(1, jax.vida - F.drenaje * dt);
    // Brasas que suben mientras dura la Furia
    if (Math.random() < dt * 25) {
      chispas(jax.x + Math.random() * jax.ancho, jax.y + Math.random() * jax.alto, '#ff3b1f', 1, 80);
    }
  }
}

// Un ataque de Jax: con la Furia hace el triple de daño y aturde más
function ataqueDeJax(jax, caja, datos, direccion) {
  const F = HABILIDADES_JAX.FURIA;
  const ataque = crearAtaque(caja, datos, direccion, jax.golpeados);
  ataque.duenio = jax;
  ataque.danio *= jax.multDanio || 1;   // mejora "Puños de titanio"
  if (jax.furia > 0) {
    ataque.danio *= F.multiplicador;
    ataque.aturde = F.aturdimiento;
    ataque.fuerte = true;
    ataque.rompeGuardia = true;
  }
  return ataque;
}

// Mira qué botones se apretaron y empieza la acción que corresponda
function empezarAccionesJax(jax, c) {
  const H = HABILIDADES_JAX;

  // Mochila: un inyector cura y baja la degradación (no interrumpe nada)
  if (c.mochilaRecien && jax.inyectores > 0) {
    jax.inyectores--;
    curar(jax, H.MOCHILA.vida + (jax.curaExtra || 0), H.MOCHILA.degradacion);
  }

  // Modo Furia, si la barra está llena
  if (c.definitivaRecien && jax.carga >= 100 && jax.furia <= 0 && jax.accion !== 'embestida') {
    jax.accion = 'rugido';
    jax.tiempoAccion = 0;
    jax.rugidoHecho = false;
    jax.golpeados = new Set();
    jax.forzado = null;
    jax.furia = H.FURIA.duracion;
    jax.carga = 0;
    const centro = centroDe(jax);
    ondaExpansiva(centro.x, centro.y, H.FURIA.radioRugido, '#ff3b1f', 1);
    chispas(centro.x, centro.y, '#ff3b1f', 30, 420);
    textoFlotante(centro.x, jax.y - 30, '¡FURIA!', '#ff7a2f');
    temblar(12);
    Sonido.furia();
    return;
  }

  // Embestida: se puede usar en cualquier momento, si está cargada
  if (c.habilidad2Recien && jax.recargas.embestida <= 0 && jax.accion !== 'embestida') {
    if (c.izquierda) jax.mirando = -1;
    if (c.derecha) jax.mirando = 1;
    jax.accion = 'embestida';
    jax.tiempoAccion = 0;
    jax.golpeados = new Set();
    jax.recargas.embestida = H.EMBESTIDA.recarga * (jax.multRecarga || 1);
    // vy: 1 en vez de 0, para que si está en el suelo lo siga tocando
    jax.forzado = { vx: jax.mirando * H.EMBESTIDA.velocidad, vy: 1, tiempo: H.EMBESTIDA.duracion };
    jax.intocable = true;
    Sonido.embestida();
    return;
  }

  // Onda Sísmica
  if (c.habilidad1Recien && jax.recargas.onda <= 0 && !['embestida', 'onda', 'rugido'].includes(jax.accion)) {
    jax.accion = 'onda';
    jax.tiempoAccion = 0;
    jax.ondaHecha = false;
    jax.golpeados = new Set();
    jax.recargas.onda = H.ONDA.recarga * (jax.multRecarga || 1);
    jax.forzado = null;
    jax.ondaEnElAire = !jax.enElSuelo;
    if (jax.ondaEnElAire) jax.vy = H.ONDA.picada;   // se tira en picada contra el suelo
    return;
  }

  // ¿Está en el aire de verdad? (recién salido de un borde o recién aparecido, todavía cuenta como piso)
  const enElAire = !jax.enElSuelo && jax.tiempoCoyote <= 0 && jax.tiempo > 0.1;

  // Patada aérea (en el aire)
  if (c.ataqueRecien && enElAire && !jax.accion && !jax.usoAereo && !jax.forzado) {
    jax.accion = 'aereo';
    jax.tiempoAccion = 0;
    jax.golpeados = new Set();
    jax.usoAereo = true;
    jax.reboto = false;
    Sonido.patada();
    return;
  }

  // Combo Némesis
  if (c.ataqueRecien && !enElAire) {
    if (jax.accion === 'golpe') {
      jax.siguienteGolpe = true;   // lo guarda para cuando termine este golpe
    } else if (!jax.accion) {
      const sigueElCombo = jax.ventanaCombo > 0 && jax.golpeCombo < H.COMBO.length - 1;
      empezarGolpe(jax, sigueElCombo ? jax.golpeCombo + 1 : 0);
    }
  }
}

function empezarGolpe(jax, numero) {
  jax.accion = 'golpe';
  jax.golpeCombo = numero;
  jax.tiempoAccion = 0;
  jax.siguienteGolpe = false;
  jax.golpeados = new Set();
  // En el suelo da un pasito hacia adelante con cada golpe
  if (jax.enElSuelo) jax.forzado = { vx: jax.mirando * HABILIDADES_JAX.COMBO[numero].avance, vy: 1, tiempo: 0.06 };
  Sonido.swing();
}

// Hace avanzar la acción en curso y arma la caja de ataque cuando corresponde
function avanzarAccionJax(jax, dt) {
  const H = HABILIDADES_JAX;
  if (!jax.accion) return;
  jax.tiempoAccion += dt;
  const t = jax.tiempoAccion;

  if (jax.accion === 'golpe') {
    const golpe = H.COMBO[jax.golpeCombo];
    if (t >= golpe.activoDesde && t <= golpe.activoHasta) {
      jax.ataqueActivo = ataqueDeJax(jax, cajaDelante(jax, golpe.ancho, 34, 10), golpe, jax.mirando);
    }
    if (t >= golpe.duracion) {
      jax.accion = null;
      const ultimo = jax.golpeCombo >= H.COMBO.length - 1;
      if (jax.siguienteGolpe && !ultimo) {
        empezarGolpe(jax, jax.golpeCombo + 1);
      } else {
        jax.ventanaCombo = ultimo ? 0 : H.VENTANA_COMBO;
        if (ultimo) jax.golpeCombo = 0;
      }
    }
  } else if (jax.accion === 'aereo') {
    const A = H.AEREO;
    if (t >= A.activoDesde && t <= A.activoHasta) {
      const caja = { x: jax.mirando > 0 ? jax.x + jax.ancho - 10 : jax.x - 46, y: jax.y + 22, ancho: 56, alto: 54 };
      jax.ataqueActivo = ataqueDeJax(jax, caja, A, jax.mirando);
    }
    // ¡Le pegó! Rebota y recupera el doble salto
    if (jax.golpeados.size > 0 && !jax.reboto) {
      jax.reboto = true;
      jax.vy = -A.rebote;
      jax.usoDobleSalto = false;
      jax.usoAereo = false;
    }
    if (t >= A.duracion || jax.enElSuelo) jax.accion = null;
  } else if (jax.accion === 'onda') {
    if (!jax.ondaHecha) {
      const listo = jax.ondaEnElAire ? jax.enElSuelo : t >= H.ONDA.preparacion;
      if (listo) {
        impactoOnda(jax);
        jax.ondaHecha = true;
        jax.tiempoAccion = 0;
      } else if (t > 2) {
        jax.accion = null;   // por si nunca llega al suelo
      }
    } else if (t >= 0.25) {
      jax.accion = null;
    }
  } else if (jax.accion === 'embestida') {
    const caja = { x: jax.mirando > 0 ? jax.x : jax.x - 20, y: jax.y + 4, ancho: jax.ancho + 20, alto: jax.alto - 8 };
    jax.ataqueActivo = ataqueDeJax(jax, caja, H.EMBESTIDA, jax.mirando);
    jax.ataqueActivo.esEmbestida = true;
    estela(jax.x + jax.ancho / 2, jax.y + 20 + Math.random() * 30, '#ff7a2f');
    if (!jax.forzado) {
      jax.accion = null;
      jax.intocable = false;
      // Al terminar sigue a velocidad normal, así no patina
      jax.vx = Math.max(-JAX.VELOCIDAD_MAX, Math.min(JAX.VELOCIDAD_MAX, jax.vx));
    }
  } else if (jax.accion === 'rugido') {
    // El rugido no lastima: empuja y aturde a los que están cerca
    if (!jax.rugidoHecho) {
      const centro = centroDe(jax);
      const datos = { danio: 0, empujeX: 380, empujeY: 260 };
      jax.ataqueActivo = ataqueDeJax(jax, cajaAlrededor(centro.x, centro.y, H.FURIA.radioRugido), datos, 0);
      jax.ataqueActivo.aturde = 1.5;
      jax.rugidoHecho = true;
    }
    if (t >= 0.35) jax.accion = null;
  }
}

function impactoOnda(jax) {
  const O = HABILIDADES_JAX.ONDA;
  const centro = jax.x + jax.ancho / 2;
  const pies = jax.y + jax.alto;
  const caja = { x: centro - O.radio, y: pies - 80, ancho: O.radio * 2, alto: 84 };
  jax.ataqueActivo = ataqueDeJax(jax, caja, O, 0);
  ondaExpansiva(centro, pies, O.radio, jax.furia > 0 ? '#ff3b1f' : '#ff7a2f');
  polvo(centro, pies, 24);
  temblar(10);
  Sonido.onda();
}

// ============================================================
//  DIBUJO
// ============================================================

function dibujarPuno(ctx, punto, brillo, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = brillo;
  ctx.fillStyle = color === '#ff4d00' ? '#ff7a2f' : '#ff5a3a';
  ctx.beginPath();
  ctx.arc(punto.x, punto.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Hacia dónde apuntan los brazos según lo que esté haciendo Jax.
// Ángulo 0 = brazo colgando; 1.6 = estirado hacia adelante; 3 = arriba.
function angulosBrazosJax(jax, pose) {
  const H = HABILIDADES_JAX;
  if (jax.accion === 'golpe') {
    const golpe = H.COMBO[jax.golpeCombo];
    const t = jax.tiempoAccion;
    // Antes de pegar tira el brazo para atrás; al pegar lo estira
    let puno = t < golpe.activoDesde ? -0.5 : t <= golpe.activoHasta ? 1.6 : 1.0;
    if (jax.golpeCombo === 2) puno = t < golpe.activoDesde ? 0.2 : t <= golpe.activoHasta ? 2.7 : 2.2;   // gancho
    // El segundo golpe es con el otro brazo
    return jax.golpeCombo === 1 ? { atras: puno, adelante: -0.3 } : { atras: 0.2, adelante: puno };
  }
  if (jax.accion === 'onda') {
    return jax.ondaHecha ? { atras: 0.5, adelante: 0.6 } : { atras: 2.9, adelante: 2.7 };
  }
  if (jax.accion === 'rugido') return { atras: 2.4, adelante: 2.2 };   // brazos abiertos hacia arriba
  if (jax.accion === 'embestida') return { atras: -1.2, adelante: 1.5 };
  if (!jax.enElSuelo) return { atras: -0.8, adelante: 2.2 };
  if (pose.caminando) return { atras: pose.vaiven * 0.8, adelante: -pose.vaiven * 0.8 };
  return { atras: 0.15, adelante: 0.35 };   // quieto, con los puños listos
}

// Un brillo de color alrededor del cuerpo (Furia o estado crítico)
function dibujarAura(ctx, color, intensidad) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const aura = ctx.createRadialGradient(0, -34, 4, 0, -34, 46);
  aura.addColorStop(0, color.replace('ALFA', String(0.45 * intensidad)));
  aura.addColorStop(1, color.replace('ALFA', '0'));
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.ellipse(0, -34, 34, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// El dibujo de repuesto, hecho con formas (por si no cargan las imágenes de img/)
function dibujarJaxConFormas(ctx, jax, alfa) {
  const { x, y } = posicionDibujo(jax, alfa);
  const pose = calcularPose(jax);
  const embistiendo = jax.accion === 'embestida';
  const enFuria = jax.furia > 0;
  const critico = jax.degradacion >= 100;
  const brillo = embistiendo || enFuria ? 22 : 10 + Math.sin(jax.tiempo * 6) * 4;   // la energía del suero late
  const colorPuno = enFuria ? '#ff1f1f' : '#ff4d00';

  ctx.save();
  ctx.translate(x + jax.ancho / 2, y + jax.alto);     // el origen queda entre los pies
  // Darlo vuelta según hacia dónde mira, y aplastarlo o estirarlo
  ctx.scale(jax.mirando * (1 + jax.aplastado), 1 - jax.aplastado);

  if (enFuria) dibujarAura(ctx, 'rgba(255, 60, 30, ALFA)', 0.8 + Math.sin(jax.tiempo * 12) * 0.2);
  else if (critico) dibujarAura(ctx, 'rgba(181, 108, 255, ALFA)', 0.5 + Math.sin(jax.tiempo * 8) * 0.5);

  if (embistiendo) ctx.rotate(0.35);                  // se inclina hacia adelante
  ctx.lineCap = 'round';

  // --- Piernas ---
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#1a1f2b';
  if (embistiendo) {
    dibujarExtremidad(ctx, -5, -24, -0.7, 24);
    dibujarExtremidad(ctx, 5, -24, 0.6, 22);
  } else if (jax.enElSuelo) {
    dibujarExtremidad(ctx, -5, -24, pose.vaiven * 0.6, 24);
    dibujarExtremidad(ctx, 5, -24, -pose.vaiven * 0.6, 24);
  } else {
    dibujarExtremidad(ctx, -5, -24, -0.5, 22);   // en el aire: una pierna atrás
    dibujarExtremidad(ctx, 5, -24, 0.4, 20);     // y la otra adelante
  }

  ctx.translate(0, pose.respiro);
  const brazos = angulosBrazosJax(jax, pose);

  // --- Brazo de atrás (se dibuja antes que el cuerpo, para que quede detrás) ---
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#262c3a';
  dibujarPuno(ctx, dibujarExtremidad(ctx, -2, -46, brazos.atras, 20), brillo, colorPuno);

  // --- Cuerpo ---
  ctx.fillStyle = '#2d3445';
  ctx.beginPath();
  ctx.roundRect(-10, -50, 20, 28, 5);
  ctx.fill();
  ctx.fillStyle = enFuria ? '#ff2a1f' : '#ff6a1f';   // franja del traje
  ctx.fillRect(-10, -30, 20, 3);

  // --- Cabeza ---
  ctx.fillStyle = '#c98e64';
  ctx.beginPath();
  ctx.arc(1, -57, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#141414';               // pelo
  ctx.beginPath();
  ctx.arc(0, -59, 8.5, Math.PI * 1.05, Math.PI * 2.1);
  ctx.fill();
  ctx.save();                              // ojo que brilla por el suero (rojo en la Furia)
  ctx.shadowColor = enFuria ? '#ff1f1f' : critico ? '#b56cff' : '#ff8a3d';
  ctx.shadowBlur = enFuria ? 10 : 6;
  ctx.fillStyle = enFuria ? '#ff8080' : critico ? '#e2c4ff' : '#ffd0a0';
  ctx.fillRect(4, -58, 3, 2);
  ctx.restore();

  // --- Brazo de adelante ---
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#3a4357';
  dibujarPuno(ctx, dibujarExtremidad(ctx, 2, -46, brazos.adelante, 20), brillo, colorPuno);

  ctx.restore();
}

// ============================================================
//  DIBUJO CON EL SPRITE DEL CREADOR DEL JUEGO
//  El sprite se dibuja por piezas (js/animacion.js): las piernas caminan,
//  patean y se encogen, el puño se estira al pegar y el torso respira.
// ============================================================

const ALTO_SPRITE_JAX = 86;   // el dibujo es más alto que su caja de choque (64)

// Dónde quedan los puños en el dibujo "jax-pelea" (medido con 80 de alto, con los pies en 0,0)
const PUNOS_SPRITE_JAX = { adelante: { x: 20, y: -61 }, atras: { x: 0, y: -59 } };

// Una pose: cómo poner el cuerpo entero (rotar, adelante, estirarY) y cómo mover
// cada pieza (mov: las piernas, el torso y el brazo; ver dibujarPorPiezas)
function poseNueva(nombre) {
  return { nombre, rotar: 0, adelante: 0, subir: 0, estirarY: 1, golpe: null, mov: {} };
}

// Cómo poner el sprite según lo que esté haciendo
function poseSpriteJax(p) {
  const H = HABILIDADES_JAX;
  const pose = poseNueva('jax-pelea');
  const correr = Math.min(1, Math.abs(p.vx) / JAX.VELOCIDAD_MAX);
  const caminando = p.enElSuelo && Math.abs(p.vx) > 20;

  if (caminando) {
    pose.mov = movimientoCaminar(p.pasos * 0.05, 0.2 + 0.35 * correr);
    pose.rotar = 0.03 + 0.07 * correr;               // corriendo se inclina hacia adelante
  } else if (!p.enElSuelo) {
    if (p.dobleSalto > 0) {
      // Voltereta del doble salto: una vuelta entera, todo encogido
      pose.rotar = -(1 - p.dobleSalto / 0.4) * Math.PI * 2;
      pose.subir = 30;
      pose.mov = { atras: 0.9, adelante: -0.9, estirarPiernas: 0.75 };
    } else if (p.vy < 0) {
      pose.rotar = -0.05;
      pose.mov = { atras: 0.45, adelante: -0.6, estirarPiernas: 0.9 };   // sube con una rodilla adelante
    } else {
      pose.rotar = 0.06;
      pose.mov = { atras: 0.2, adelante: -0.3 };                         // cae con las piernas listas
    }
  } else {
    pose.mov = { subir: Math.sin(p.tiempo * 3) * 1.2, atras: Math.sin(p.tiempo * 1.5) * 0.02 };   // respira
    if (p.tiempoQuieto > 5) pose.nombre = 'jax-brazos';
  }

  if (p.aturdido > 0) {
    pose.rotar = -0.2;
    pose.mov = { atras: -0.3, adelante: 0.25 };
  }

  if (p.accion === 'golpe') {
    const golpe = H.COMBO[p.golpeCombo];
    const t = p.tiempoAccion;
    const gancho = p.golpeCombo === 2;
    const firme = { atras: 0.32, adelante: -0.22 };   // las piernas abiertas, bien plantado
    if (t < golpe.activoDesde) {          // toma impulso: el puño va para atrás
      pose.mov = { ...firme, brazoX: -8, inclinar: -0.06 };
      pose.estirarY = gancho ? 0.94 : 1;
    } else if (t <= golpe.activoHasta) {   // ¡pega! el puño se estira
      pose.adelante = 5;
      if (gancho) pose.mov = { ...firme, brazoX: 16, brazoY: -34, inclinar: -0.12, subir: 5 };
      else pose.mov = { ...firme, brazoX: p.golpeCombo === 1 ? 22 : 26, brazoY: p.golpeCombo === 1 ? 10 : 0, inclinar: 0.16 };
      pose.golpe = gancho ? 'gancho' : 'adelante';
    } else {
      pose.adelante = 2;
      pose.mov = { ...firme, brazoX: 10, inclinar: 0.05 };
    }
  } else if (p.accion === 'aereo') {
    // Patada voladora: la pierna de adelante se estira
    const A = H.AEREO;
    const pegando = p.tiempoAccion >= A.activoDesde && p.tiempoAccion <= A.activoHasta;
    pose.rotar = pegando ? 0.3 : 0.1;
    pose.mov = pegando ? { atras: 0.6, adelante: -1.35, inclinar: -0.2 } : { atras: 0.7, adelante: -0.2, estirarPiernas: 0.8 };
    if (pegando) pose.golpe = 'patada';
  } else if (p.accion === 'onda') {
    if (!p.ondaHecha) {
      if (p.ondaEnElAire) {
        pose.rotar = 0.25;
        pose.mov = { atras: -0.1, adelante: 0.1, brazoY: -20 };   // en picada
      } else {
        pose.mov = { atras: 0.5, adelante: -0.5, estirarPiernas: 0.82, brazoY: -26, subir: -4 };
      }
    } else {
      pose.mov = { atras: 0.6, adelante: -0.6, estirarPiernas: 0.75, subir: -8, brazoX: 10, brazoY: 20, inclinar: 0.2 };
    }
  } else if (p.accion === 'embestida') {
    pose.rotar = 0.3;
    pose.adelante = 4;
    pose.mov = { atras: 0.85, adelante: -0.45, brazoX: 30, inclinar: 0.1 };
  } else if (p.accion === 'rugido') {
    pose.nombre = 'jax-frente';
    pose.estirarY = 1.04;
  }

  if (p.esquivando > 0 && p.forzado) {
    // Esquiva: bien agachado, casi deslizándose
    pose.rotar = 0.4;
    pose.estirarY = 0.86;
    pose.mov = { atras: 0.9, adelante: -0.5 };
  }
  if (p.tiempoQuieto > 5 && pose.nombre === 'jax-brazos') pose.mov = {};

  // El Pulsor en la mano: el brazo apunta hacia adelante (y "patea" para atrás en cada disparo)
  if (p.armaFuera > 0 && !p.accion && p.aturdido <= 0 && !(p.esquivando > 0 && p.forzado)) {
    const retroceso = p.disparo > 0 ? p.disparo / 0.14 : 0;
    pose.nombre = 'jax-pelea';
    pose.mov = { ...pose.mov, brazoX: 16 - retroceso * 9, brazoY: 12 - retroceso * 4,
      inclinar: (pose.mov.inclinar || 0) - retroceso * 0.05 };
    pose.arma = true;
  }
  return pose;
}

// Un brillo de color: la energía del suero en los puños
function brilloDePuno(ctx, x, y, radio, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, radio);
  g.addColorStop(0, color.replace('ALFA', '0.9'));
  g.addColorStop(0.4, color.replace('ALFA', '0.45'));
  g.addColorStop(1, color.replace('ALFA', '0'));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radio, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Un "zas" curvo delante del puño (o del pie)
function dibujarZas(ctx, x, y, tipo, color) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 5;
  ctx.beginPath();
  if (tipo === 'gancho') ctx.arc(x - 6, y + 18, 28, -2.3, -0.3);
  else if (tipo === 'patada') ctx.arc(x - 18, y - 10, 30, -0.2, 1.4);
  else ctx.arc(x - 16, y, 26, -0.75, 0.75);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff3d0';
  ctx.stroke();
  ctx.restore();
}

// Dibuja un sprite entero o por piezas (si se puede)
function dibujarPoseSprite(ctx, pose, alto, opciones) {
  if (tienePiezas(pose.nombre)) return dibujarPorPiezas(ctx, pose.nombre, alto, pose.mov, opciones);
  return dibujarSprite(ctx, pose.nombre, 0, 0, alto, opciones);
}

// Dibuja a un luchador con un sprite que se anima por piezas. Lo usan Jax, sus clones y Zephyrus.
// cuerpo: { x, y, ancho, alto, mirando, aplastado, tiempo }, pose: lo de poseSpriteJax
// opciones: { alto, tinte, colorEnergia, aura, destello, fantasmas, punos, colorFantasma, arma }
// (arma: { nivel, fogonazo } dibuja el Pulsor: en la mano si pose.arma, si no en la cintura)
function dibujarLuchadorJax(ctx, cuerpo, x, y, pose, opciones) {
  const alto = opciones.alto || ALTO_SPRITE_JAX;
  const escala = alto / 80;
  const energia = opciones.colorEnergia || 'rgba(255, 110, 30, ALFA)';
  const aplastado = cuerpo.aplastado || 0;
  const mov = pose.mov || {};

  ctx.save();
  ctx.translate(x + cuerpo.ancho / 2, y + cuerpo.alto);
  ctx.scale(cuerpo.mirando * (1 + aplastado), 1 - aplastado);
  if (opciones.aura) dibujarAura(ctx, opciones.aura.color, opciones.aura.intensidad);

  // Fantasmas detrás (la Embestida y la esquiva dejan una estela del cuerpo)
  if (opciones.fantasmas) {
    for (const [dx, alfa] of [[-34, 0.16], [-18, 0.3]]) {
      ctx.save();
      ctx.translate(dx + pose.adelante, -pose.subir);
      ctx.rotate(pose.rotar);
      ctx.scale(1, pose.estirarY);
      dibujarPoseSprite(ctx, pose, alto, { alfa, tinte: { color: opciones.colorFantasma || '#ff7a2f', fuerza: 0.85 } });
      ctx.restore();
    }
  }

  // Para las volteretas, el cuerpo gira desde el medio (no desde los pies)
  ctx.translate(pose.adelante, -pose.subir);
  if (Math.abs(pose.rotar) > 1) {
    ctx.translate(0, -alto / 2);
    ctx.rotate(pose.rotar);
    ctx.translate(0, alto / 2);
  } else {
    ctx.rotate(pose.rotar);
  }
  ctx.scale(1, pose.estirarY);
  dibujarPoseSprite(ctx, pose, alto, { tinte: opciones.tinte, destello: opciones.destello || 0 });
  // El Pulsor guardado en la pierna (apuntando para abajo)
  if (opciones.arma && !pose.arma) {
    ctx.save();
    ctx.translate(-3 * escala, -37 * escala);
    ctx.rotate(1.62);
    dibujarPulsor(ctx, 0, 0, opciones.arma.nivel, escala * 1.05, false);
    ctx.restore();
  }

  // La energía de los puños (solo en la pose de pelea)
  const punos = opciones.punos || (pose.nombre === 'jax-pelea' ? PUNOS_SPRITE_JAX : null);
  if (punos && pose.nombre.endsWith('-pelea')) {
    const late = 0.5 + Math.sin(cuerpo.tiempo * 6) * 0.5;
    const imagen = imagenDe(pose.nombre);
    const k = imagen ? 80 / imagen.height : 0.4;          // de píxeles de la imagen a "unidades de 80"
    const pa = punos.adelante, pt = punos.atras;
    const ax = (pa.x + (mov.brazoX || 0) * k) * escala;
    const ay = (pa.y + (mov.brazoY || 0) * k - (mov.subir || 0)) * escala;
    if (pose.arma && opciones.arma) {
      // Con el arma en la mano: el Pulsor en el puño de adelante
      dibujarPulsor(ctx, ax, ay, opciones.arma.nivel, escala * 1.4, opciones.arma.fogonazo);
      brilloDePuno(ctx, pt.x * escala, (pt.y - (mov.subir || 0)) * escala, (5 + late * 2) * escala, energia);
    } else if (pose.golpe === 'patada') {
      // El pie de adelante: abajo y adelante
      brilloDePuno(ctx, 26 * escala, -22 * escala, 16 * escala, energia);
      dibujarZas(ctx, 30 * escala, -22 * escala, 'patada', energia.replace('ALFA', '0.9'));
    } else if (pose.golpe) {
      brilloDePuno(ctx, ax + 4, ay, 18 * escala, energia);
      dibujarZas(ctx, ax + 10, ay, pose.golpe, energia.replace('ALFA', '0.9'));
    } else {
      brilloDePuno(ctx, ax, ay, (7 + late * 3) * escala, energia);
      brilloDePuno(ctx, pt.x * escala, (pt.y - (mov.subir || 0)) * escala, (5 + late * 2) * escala, energia);
    }
  }
  ctx.restore();
}

function dibujarJax(ctx, jax, alfa) {
  if (estaParpadeando(jax) && !(jax.esquivando > 0)) return;
  if (!hayImagen('jax-pelea')) {
    dibujarJaxConFormas(ctx, jax, alfa);
    return;
  }
  const { x, y } = posicionDibujo(jax, alfa);
  const enFuria = jax.furia > 0;
  const critico = jax.degradacion >= 100;
  let aura = null;
  if (enFuria) aura = { color: 'rgba(255, 60, 30, ALFA)', intensidad: 0.8 + Math.sin(jax.tiempo * 12) * 0.2 };
  else if (critico) aura = { color: 'rgba(181, 108, 255, ALFA)', intensidad: 0.5 + Math.sin(jax.tiempo * 8) * 0.5 };

  const esquivando = jax.esquivando > 0 && jax.forzado;
  dibujarLuchadorJax(ctx, jax, x, y, poseSpriteJax(jax), {
    arma: { nivel: jax.nivelArma || 0, fogonazo: jax.disparo > 0.07 },
    aura,
    tinte: enFuria ? { color: '#ff3020', fuerza: 0.28 } : critico ? { color: '#b56cff', fuerza: 0.22 } : null,
    colorEnergia: enFuria ? 'rgba(255, 40, 20, ALFA)' : 'rgba(255, 110, 30, ALFA)',
    fantasmas: jax.accion === 'embestida' || esquivando,
    colorFantasma: esquivando ? '#5fd4ff' : '#ff7a2f',
  });
}
