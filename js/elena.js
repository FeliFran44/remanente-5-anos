// ============================================================
//  ELENA: la Dra. Elena Vane
// ============================================================

// Elena es más liviana que Jax: salta un poco más alto
// y se controla mejor en el aire.
const ELENA = {
  ANCHO: 30,
  ALTO: 60,
  VIDA: 70,
  VELOCIDAD_MAX: 330,
  ACELERACION: 2400,
  FRENADO: 3000,
  CONTROL_EN_EL_AIRE: 0.85,
  FUERZA_SALTO: 840,
  CORTE_DE_SALTO: 2.5,
  TIEMPO_COYOTE: 0.1,
  RECUERDO_DE_SALTO: 0.12,
  DOBLE_SALTO: true,
};

// Las armas de Elena (tiempos en segundos, distancias en píxeles)
const HABILIDADES_ELENA = {
  // Bláster de Plasma: manteniendo apretado dispara seguido.
  // El enemigo alcanzado queda "cargado de plasma" un ratito: ¡ahí entra la Embestida de Jax!
  PLASMA: { danio: 8, velocidad: 720, alcance: 520, cadencia: 0.28, marca: 1.5 },
  // Rayo Congelante: congela a un enemigo
  HIELO: { danio: 4, velocidad: 600, alcance: 600, congela: 3, recarga: 10 },
  // Inyección Curativa: un dardo que busca solo a Jax
  CURA: { vida: 15, degradacion: 20, velocidad: 520, recarga: 12 },
  // Torreta PEM (la definitiva): frena a los enemigos que estén cerca y les apaga los escudos
  PEM: { duracion: 6, radio: 200 },
};

function crearElena(x, yPies) {
  const elena = crearPersonaje('elena', ELENA, x, yPies);
  elena.recargas = { plasma: 0, hielo: 0, cura: 0 };
  elena.carga = 0;            // carga de la Torreta PEM, de 0 a 100
  elena.disparo = 0;          // segundos desde el último disparo (para el dibujo)
  return elena;
}

// "jax" hace falta para el dardo curativo, que lo busca a él
function actualizarElena(elena, controles, nivel, dt, jax) {
  for (const nombre in elena.recargas) elena.recargas[nombre] = Math.max(0, elena.recargas[nombre] - dt);
  elena.disparo += dt;
  if (elena.aturdido <= 0) {
    intentarEsquivar(elena, controles);
    accionesElena(elena, controles, jax);
  }
  actualizarMovimiento(elena, controles, nivel, dt);
}

function accionesElena(elena, c, jax) {
  const H = HABILIDADES_ELENA;
  if (c.apuntar) elena.mirando = c.apuntar;

  if (c.definitivaRecien && elena.carga >= 100) {
    desplegarTorreta(elena);
    elena.carga = 0;
  }
  if (c.habilidad2Recien && elena.recargas.cura <= 0 && jax && !jax.seCayo && jax.vida > 0) {
    disparar(elena, 'cura', jax);
    elena.recargas.cura = H.CURA.recarga * (elena.multRecarga || 1);
  }
  if (c.habilidad1Recien && elena.recargas.hielo <= 0) {
    disparar(elena, 'hielo');
    elena.recargas.hielo = H.HIELO.recarga * (elena.multRecarga || 1);
  }
  if ((c.ataque || c.ataqueRecien) && elena.recargas.plasma <= 0) {
    disparar(elena, 'plasma');
    elena.recargas.plasma = H.PLASMA.cadencia;
  }
}

// Sale un proyectil desde la punta del bláster
function disparar(elena, tipo, objetivo) {
  const H = HABILIDADES_ELENA;
  const x = elena.x + elena.ancho / 2 + elena.mirando * 22;
  const y = elena.y + 21;
  if (tipo === 'plasma') {
    lanzarProyectil({ tipo, x, y, vx: elena.mirando * H.PLASMA.velocidad, vy: 0,
      vida: H.PLASMA.alcance / H.PLASMA.velocidad, duenio: elena });
    Sonido.plasma();
  } else if (tipo === 'hielo') {
    lanzarProyectil({ tipo, x, y, vx: elena.mirando * H.HIELO.velocidad, vy: 0, ancho: 14, alto: 12,
      vida: H.HIELO.alcance / H.HIELO.velocidad, duenio: elena });
    Sonido.hielo();
  } else if (tipo === 'cura') {
    lanzarProyectil({ tipo, x, y, vx: elena.mirando * 200, vy: -250, vida: 3, duenio: elena, objetivo });
    Sonido.dardo();
  }
  elena.disparo = 0;
}

// El bláster de plasma, con la punta celeste que brilla (y un fogonazo al disparar)
function dibujarBlaster(ctx, mano, brillo, fogonazo) {
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(mano.x - 2, mano.y - 4, 13, 6);
  ctx.save();
  ctx.shadowColor = '#5fd4ff';
  ctx.shadowBlur = fogonazo ? 20 : brillo;
  ctx.fillStyle = fogonazo ? '#ffffff' : '#9fe8ff';
  ctx.beginPath();
  ctx.arc(mano.x + 12, mano.y - 1, fogonazo ? 5 : 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Una pierna o un brazo con articulación (rodilla o codo): dos tramos.
// a1: ángulo del primer tramo · a2: cuánto se dobla el segundo (0 = derecho)
function extremidadDoble(ctx, x, y, a1, l1, a2, l2) {
  const medioX = x + Math.sin(a1) * l1;
  const medioY = y + Math.cos(a1) * l1;
  const finX = medioX + Math.sin(a1 + a2) * l2;
  const finY = medioY + Math.cos(a1 + a2) * l2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(medioX, medioY);
  ctx.lineTo(finX, finY);
  ctx.stroke();
  return { x: finX, y: finY, medioX, medioY, angulo: a1 + a2 };
}

// Elena se dibuja con código (no tiene sprite). Es un poco más grande que su caja
// de choque, para que se vea parecida a Jax.
const ESCALA_DIBUJO_ELENA = 1.28;

function dibujarElena(ctx, elena, alfa) {
  if (estaParpadeando(elena) && !(elena.esquivando > 0)) return;
  const { x, y } = posicionDibujo(elena, alfa);
  const esquivando = elena.esquivando > 0 && elena.forzado;
  if (esquivando) {
    // Estela celeste de la esquiva
    for (const [dx, a] of [[-26, 0.15], [-13, 0.3]]) {
      ctx.save();
      ctx.globalAlpha *= a;
      dibujarCuerpoElena(ctx, elena, x + elena.mirando * dx, y, true);
      ctx.restore();
    }
  }
  dibujarCuerpoElena(ctx, elena, x, y, false);
}

function dibujarCuerpoElena(ctx, elena, x, y, fantasma) {
  const pose = calcularPose(elena);
  const brillo = 8 + Math.sin(elena.tiempo * 5) * 3;
  const apuntando = elena.disparo < 0.3;
  const enElAire = !elena.enElSuelo;
  const esquivando = elena.esquivando > 0 && elena.forzado;
  const fase = elena.pasos * 0.06;
  const correr = Math.min(1, Math.abs(elena.vx) / ELENA.VELOCIDAD_MAX);

  ctx.save();
  ctx.translate(x + elena.ancho / 2, y + elena.alto);
  ctx.scale(elena.mirando * (1 + elena.aplastado) * ESCALA_DIBUJO_ELENA, (1 - elena.aplastado) * ESCALA_DIBUJO_ELENA);
  if (fantasma) ctx.filter = 'brightness(1.6) saturate(0.4)';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Voltereta del doble salto o inclinación al esquivar / correr
  if (elena.dobleSalto > 0) {
    ctx.translate(0, -30);
    ctx.rotate(-(1 - elena.dobleSalto / 0.4) * Math.PI * 2);
    ctx.translate(0, 30);
  } else if (esquivando) {
    ctx.rotate(0.45);
  } else if (pose.caminando) {
    ctx.rotate(0.06 * correr);
  }

  // --- Piernas (con rodillas y botas) ---
  let muslos, rodillas;
  if (elena.dobleSalto > 0 || esquivando) {
    muslos = [-1.0, 0.8];
    rodillas = [1.6, 1.4];
  } else if (enElAire) {
    muslos = elena.vy < 0 ? [-0.6, 0.5] : [-0.3, 0.25];
    rodillas = elena.vy < 0 ? [0.9, 0.4] : [0.4, 0.2];
  } else if (pose.caminando) {
    const s = Math.sin(fase);
    muslos = [s * 0.6 * (0.5 + correr * 0.5), -s * 0.6 * (0.5 + correr * 0.5)];
    rodillas = [Math.max(0, -s) * 0.8, Math.max(0, s) * 0.8];
  } else {
    muslos = [0.08, -0.08];
    rodillas = [0, 0];
  }
  ctx.lineWidth = 6;
  for (let i = 0; i < 2; i++) {
    ctx.strokeStyle = i === 0 ? '#151924' : '#232a3a';
    const pie = extremidadDoble(ctx, i === 0 ? -3 : 3, -24, -muslos[i], 12, rodillas[i], 12);
    ctx.fillStyle = '#3a2a22';                               // bota
    ctx.save();
    ctx.translate(pie.x, pie.y);
    ctx.rotate(-pie.angulo * 0.5);
    ctx.fillRect(-3, -3, 9, 5);
    ctx.restore();
  }

  const respiro = pose.respiro;
  ctx.translate(0, respiro);

  // La cola de caballo y la bata flamean al moverse
  const vuelo = enElAire ? -4 : pose.vaiven * 2 - correr * 3;
  const flamea = Math.sin(elena.tiempo * 14) * correr * 2;

  // --- Cola de caballo (detrás de todo) ---
  ctx.strokeStyle = '#3b2417';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-5, -56);
  ctx.quadraticCurveTo(-15 - correr * 4, -56 + flamea, -17 + vuelo * 0.5 - correr * 5, -44 + vuelo * 0.5 + flamea);
  ctx.stroke();
  ctx.fillStyle = '#5fd4ff';                                 // gomita celeste
  ctx.fillRect(-8, -58, 3, 3);

  // Ángulos de los brazos
  let anguloAtras, anguloAdelante, codo = 0;
  if (enElAire) {
    anguloAtras = -0.8;
    anguloAdelante = 1.5;
  } else if (pose.caminando) {
    anguloAtras = pose.vaiven * 0.8;
    anguloAdelante = 1.2 + pose.vaiven * 0.15;
    codo = -0.4;
  } else {
    anguloAtras = 0.15;
    anguloAdelante = 1.35;     // quieta, apuntando con el bláster
  }
  if (apuntando) {
    anguloAdelante = 1.57;     // al disparar, el brazo bien derecho
    codo = 0;
  }
  if (elena.relajada) {        // en las escenas de historia, con los brazos tranquilos
    anguloAtras = 0.15;
    anguloAdelante = 0.3;
    codo = 0;
  }

  // --- Brazo de atrás ---
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#aab4c4';
  extremidadDoble(ctx, -2, -44, anguloAtras, 10, -0.5, 9);

  // --- Bata de laboratorio (con las puntas que flamean) ---
  ctx.fillStyle = '#dfe6f0';
  ctx.beginPath();
  ctx.moveTo(-8, -48);
  ctx.lineTo(8, -48);
  ctx.lineTo(11, -26);
  ctx.lineTo(9 - correr * 2, -13);
  ctx.lineTo(-13 - vuelo - correr * 6 + flamea, -12 + flamea);
  ctx.lineTo(-10, -28);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9aa6ba';                               // borde de la bata
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#26324a';                                 // camiseta entre las solapas
  ctx.fillRect(-2, -48, 5, 18);
  ctx.fillStyle = '#3a2a22';                                 // cinturón
  ctx.fillRect(-8, -29, 17, 3);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(0, -29, 3, 3);
  ctx.fillStyle = '#5fd4ff';                                 // insignia celeste
  ctx.fillRect(4, -42, 3, 3);

  // --- Cabeza: cara, pelo y gafas de científica ---
  ctx.fillStyle = '#e0b394';
  ctx.beginPath();
  ctx.arc(1, -54, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b2417';                                 // pelo
  ctx.beginPath();
  ctx.arc(0, -56, 8, Math.PI * 1.0, Math.PI * 2.05);
  ctx.fill();
  ctx.fillRect(-8, -57, 4, 7);
  ctx.fillStyle = '#2b3448';                                 // gafas en la frente
  ctx.fillRect(-4, -61, 11, 3);
  ctx.fillStyle = 'rgba(95, 212, 255, 0.8)';
  ctx.fillRect(3, -61, 4, 2);
  ctx.fillStyle = '#1a1a1a';                                 // ojo
  ctx.fillRect(4, -55, 2, 2);
  ctx.fillStyle = '#c47a6a';                                 // boca
  ctx.fillRect(4, -50, 2, 1);

  // --- Brazo de adelante, con el bláster ---
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#dfe6f0';
  const mano = extremidadDoble(ctx, 2, -44, anguloAdelante, 9, codo, 8);
  dibujarBlaster(ctx, mano, brillo, elena.disparo < 0.06);

  ctx.restore();
}
