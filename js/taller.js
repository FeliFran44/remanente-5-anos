// ============================================================
//  NÚCLEOS, TALLER DE ELENA Y ARCHIVOS SECRETOS
//
//  NÚCLEOS DE ENERGÍA: los enemigos los sueltan al ser derrotados.
//    Vuelan hacia vos cuando estás cerca. Se guardan en la partida.
//  TALLER DE ELENA: entre nivel y nivel (y desde el menú), Elena usa
//    los núcleos para mejorar el equipo de Jax y el de ella.
//  ARCHIVOS SECRETOS: hay uno escondido en cada nivel. Cuentan partes
//    de la historia que no se ven en las escenas. Se leen desde el menú.
// ============================================================

// ---------- Las mejoras ----------
// costos: cuántos núcleos cuesta cada nivel de la mejora
const MEJORAS = [
  { id: 'punos', nombre: 'Puños de titanio', descripcion: 'Jax pega un 15 % más fuerte por nivel.', costos: [25, 50, 90] },
  { id: 'corazon', nombre: 'Corazón reforzado', descripcion: '+20 de vida máxima para Jax por nivel.', costos: [25, 50, 90] },
  { id: 'suero', nombre: 'Suero estabilizado', descripcion: 'La degradación sube un 20 % más despacio por nivel.', costos: [30, 60, 100] },
  { id: 'recarga', nombre: 'Recarga rápida', descripcion: 'Las habilidades de los dos se recargan un 15 % más rápido por nivel.', costos: [30, 60, 100] },
  { id: 'mochila', nombre: 'Mochila grande', descripcion: '+1 inyector en la mochila (Modo 1) y los inyectores curan +10.', costos: [35, 70] },
  { id: 'blaster', nombre: 'Bláster mejorado', descripcion: 'Elena hace un 20 % más de daño y tiene +15 de vida por nivel.', costos: [25, 50, 90] },
  { id: 'cargador', nombre: 'Cargador ampliado', descripcion: 'El Pulsor de Jax lleva +10 balas por nivel, y los cofres dan más.', costos: [20, 45] },
];

function nivelDeMejora(id) {
  const partida = Juego.partida;
  return partida && partida.mejoras ? partida.mejoras[id] || 0 : 0;
}

// Al empezar un nivel, las mejoras compradas cambian los números de Jax y Elena
function aplicarMejoras(jax, elena) {
  const n = nivelDeMejora;
  jax.stats = { ...JAX, VIDA: JAX.VIDA + n('corazon') * 20 };
  jax.vida = jax.stats.VIDA;
  jax.multDanio = 1 + n('punos') * 0.15;
  jax.multSuero = 1 - n('suero') * 0.2;
  jax.multRecarga = 1 - n('recarga') * 0.15;
  jax.curaExtra = n('mochila') * 10;
  if (Juego.modo === 1) jax.inyectores = HABILIDADES_JAX.MOCHILA.inyectores + n('mochila');
  if (elena) {
    elena.stats = { ...ELENA, VIDA: ELENA.VIDA + n('blaster') * 15 };
    elena.vida = elena.stats.VIDA;
    elena.multDanio = 1 + n('blaster') * 0.2;
    elena.multRecarga = 1 - n('recarga') * 0.15;
  }
}

// ---------- Núcleos de energía ----------

const Nucleos = { sueltos: [] };

function limpiarNucleos() {
  Nucleos.sueltos = [];
}

// Un enemigo derrotado suelta núcleos que saltan para todos lados
function soltarNucleos(e) {
  if (e.t.OBJETO || e.t.INMORTAL) return;
  const cantidad = e.t.NUCLEOS ?? (e.t.JEFE ? 30 : 2 + Math.floor(Math.random() * 3));
  const centro = centroDe(e);
  lanzarNucleos(centro.x, centro.y, cantidad);
}

// Núcleos que saltan para todos lados desde un punto (un enemigo, un cofre...)
function lanzarNucleos(x, y, cantidad) {
  const centro = { x, y };
  for (let i = 0; i < cantidad; i++) {
    Nucleos.sueltos.push({
      x: centro.x, y: centro.y,
      vx: (Math.random() * 2 - 1) * 220, vy: -200 - Math.random() * 300,
      tiempo: 0, quieto: false,
    });
  }
}

function actualizarNucleos(nivel, jugadores, dt) {
  for (const n of Nucleos.sueltos) {
    n.tiempo += dt;
    // El más cercano los atrae (como un imán) después de un ratito
    let cerca = null;
    let distancia = 150;
    for (const p of jugadores) {
      if (p.seCayo || p.vida <= 0) continue;
      const d = Math.hypot(centroDe(p).x - n.x, centroDe(p).y - n.y);
      if (d < distancia) { distancia = d; cerca = p; }
    }
    if (cerca && n.tiempo > 0.35) {
      const c = centroDe(cerca);
      const angulo = Math.atan2(c.y - n.y, c.x - n.x);
      n.x += Math.cos(angulo) * 520 * dt;
      n.y += Math.sin(angulo) * 520 * dt;
      if (distancia < 22) {
        n.agarrado = true;
        sumarNucleos(1);
        Sonido.nucleo();
      }
      continue;
    }
    // Si no, caen y rebotan en el piso
    n.vy = Math.min(n.vy + GRAVEDAD * 0.6 * dt, 600);
    n.x += n.vx * dt;
    n.y += n.vy * dt;
    const piso = nivel.plataformas.find((pl) => n.x >= pl.x && n.x <= pl.x + pl.ancho && n.y >= pl.y - 4 && n.y <= pl.y + 20);
    if (piso && n.vy > 0) {
      n.y = piso.y - 4;
      n.vy = -n.vy * 0.4;
      n.vx *= 0.6;
    }
  }
  Nucleos.sueltos = Nucleos.sueltos.filter((n) => !n.agarrado && n.tiempo < 14 && n.y < nivel.alto + 100);
}

function sumarNucleos(cantidad) {
  if (Juego.partida) Juego.partida.nucleos = (Juego.partida.nucleos || 0) + cantidad;
  else Juego.nucleosPractica = (Juego.nucleosPractica || 0) + cantidad;
}

function cantidadDeNucleos() {
  return Juego.partida ? Juego.partida.nucleos || 0 : Juego.nucleosPractica || 0;
}

function dibujarNucleos(ctx, tiempo) {
  ctx.save();
  for (const n of Nucleos.sueltos) {
    if (n.tiempo > 11 && Math.floor(n.tiempo * 10) % 2) continue;   // titilan antes de desaparecer
    const giro = tiempo * 6 + n.x;
    const ancho = 5 * Math.abs(Math.cos(giro));
    ctx.shadowColor = '#5fd4ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#9fe8ff';
    ctx.beginPath();
    ctx.moveTo(n.x, n.y - 7);
    ctx.lineTo(n.x + ancho + 1, n.y);
    ctx.lineTo(n.x, n.y + 7);
    ctx.lineTo(n.x - ancho - 1, n.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// El contador de núcleos (abajo a la izquierda)
function dibujarContadorDeNucleos(ctx) {
  const cantidad = cantidadDeNucleos();
  ctx.save();
  ctx.fillStyle = 'rgba(4, 6, 11, 0.6)';
  ctx.fillRect(10, ALTO - 34, 96, 24);
  ctx.shadowColor = '#5fd4ff';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#9fe8ff';
  ctx.beginPath();
  ctx.moveTo(24, ALTO - 30);
  ctx.lineTo(30, ALTO - 22);
  ctx.lineTo(24, ALTO - 14);
  ctx.lineTo(18, ALTO - 22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  texto(ctx, String(cantidad), 38, ALTO - 22, { tamano: 15, negrita: true, alinear: 'left', color: COLORES.blanco });
}

// ============================================================
//  EL TALLER DE ELENA
// ============================================================

let opcionTaller = 0;
let alSalirDelTaller = null;
let mensajeTaller = '';

const FRASES_TALLER = [
  'Con estos núcleos puedo mejorar tu equipo. ¿Qué te armo?',
  'La energía de Genesis, usada para algo bueno. ¡Me encanta!',
  'Elegí con cuidado: los núcleos no crecen en los árboles... bueno, en el Bosque Biosintético a veces sí.',
];

function abrirTaller(alSalir) {
  opcionTaller = 0;
  alSalirDelTaller = alSalir;
  mensajeTaller = FRASES_TALLER[Math.floor(Math.random() * FRASES_TALLER.length)];
  Juego.estado = 'taller';
}

function actualizarTaller(menu) {
  const total = MEJORAS.length + 1;   // las mejoras y "Listo"
  opcionTaller = moverOpcion(opcionTaller, total, menu);
  if (menu.volver || (menu.aceptar && opcionTaller === MEJORAS.length)) {
    guardarPartida();
    if (alSalirDelTaller) alSalirDelTaller();
    return;
  }
  if (!menu.aceptar) return;
  const mejora = MEJORAS[opcionTaller];
  const partida = Juego.partida;
  const nivel = nivelDeMejora(mejora.id);
  if (nivel >= mejora.costos.length) {
    mensajeTaller = '¡Esa mejora ya está al máximo!';
    Sonido.bloqueo();
    return;
  }
  const costo = mejora.costos[nivel];
  if ((partida.nucleos || 0) < costo) {
    mensajeTaller = `Me faltan ${costo - (partida.nucleos || 0)} núcleos para eso. ¡Derrotá más enemigos!`;
    Sonido.bloqueo();
    return;
  }
  partida.nucleos -= costo;
  partida.mejoras[mejora.id] = nivel + 1;
  mensajeTaller = `¡Listo! ${mejora.nombre} nivel ${nivel + 1}.`;
  Sonido.comprar();
  guardarPartida();
}

function dibujarTaller(ctx) {
  const t = Juego.tiempo;
  dibujarFondo(ctx, 400 + t * 6, 300, 'laboratorio', t);
  ctx.fillStyle = 'rgba(4, 6, 11, 0.7)';
  ctx.fillRect(0, 0, ANCHO, ALTO);
  dibujarElenaGrande(ctx, 120, 470, 4.2, 1);
  texto(ctx, 'TALLER DE ELENA', ANCHO / 2 + 80, 40, { tamano: 30, negrita: true, color: COLORES.celeste });
  texto(ctx, `Núcleos: ${Juego.partida.nucleos || 0}`, ANCHO / 2 + 80, 74, { tamano: 18, negrita: true, color: '#9fe8ff' });

  MEJORAS.forEach((m, i) => {
    const y = 116 + i * 47;
    const x = 280;
    const elegida = i === opcionTaller;
    const nivel = nivelDeMejora(m.id);
    if (elegida) dibujarResaltado(ctx, x - 10, y - 20, 650, 43);
    texto(ctx, m.nombre, x, y - 4, { tamano: 17, negrita: elegida, alinear: 'left', color: elegida ? COLORES.blanco : COLORES.texto });
    texto(ctx, m.descripcion, x, y + 15, { tamano: 12, alinear: 'left', color: COLORES.apagado });
    // Los puntitos del nivel
    for (let k = 0; k < m.costos.length; k++) {
      ctx.fillStyle = k < nivel ? '#5fd4ff' : '#2f3b55';
      ctx.fillRect(x + 440 + k * 18, y - 10, 12, 12);
    }
    const precio = nivel >= m.costos.length ? 'MÁXIMO' : `${m.costos[nivel]} ◆`;
    texto(ctx, precio, x + 630, y - 4, { tamano: 15, negrita: true, alinear: 'right', color: nivel >= m.costos.length ? COLORES.verde : '#9fe8ff' });
  });
  const yListo = 116 + MEJORAS.length * 47;
  if (opcionTaller === MEJORAS.length) dibujarResaltado(ctx, 270, yListo - 20, 650, 40);
  texto(ctx, 'Listo', 600, yListo, { tamano: 18, negrita: opcionTaller === MEJORAS.length, color: COLORES.blanco });

  // Lo que dice Elena
  ctx.fillStyle = 'rgba(8, 16, 30, 0.94)';
  ctx.fillRect(250, ALTO - 66, 680, 40);
  ctx.strokeStyle = COLORES.celeste;
  ctx.strokeRect(250.5, ALTO - 65.5, 679, 39);
  texto(ctx, mensajeTaller, 264, ALTO - 46, { tamano: 14, alinear: 'left', color: COLORES.blanco });
  dibujarPie(ctx, '↑↓ elegir · ENTER comprar · ESC salir');
}

// ============================================================
//  ARCHIVOS SECRETOS DE GENESIS
// ============================================================

const ARCHIVOS = [
  { id: 'a1', titulo: 'Informe 001: Proyecto Némesis',
    texto: 'El suero Némesis da fuerza sobrehumana usando la energía de las propias células. Efecto secundario: degradación celular acelerada. Esperanza de vida del sujeto: 5 años. Firmado: Dra. E. Vane. (Nota escrita a mano: "No quiero que esto se use en nadie.")' },
  { id: 'a2', titulo: 'Orden de producción',
    texto: 'Orden de Zephyrus: el Complejo Industrial debe fabricar armas de plasma y escudos para la Guardia. Prioridad máxima. Los empleados que hagan preguntas serán trasladados al Bosque Biosintético.' },
  { id: 'a3', titulo: 'Expediente: Marcus Vane',
    texto: 'Ex rescatista. Se unió a Genesis para pagar el tratamiento de su hermana menor, Elena, que estuvo muy enferma de chica. Mejoras cibernéticas: brazo, pierna y ojo derecho. Lealtad a Zephyrus: dudosa.' },
  { id: 'a4', titulo: 'Sujeto X-0',
    texto: 'El primer intento del suero... en un animal del bosque. Se volvió gigante y furioso. Zephyrus lo usa como perro guardián. Debilidad: el saco de energía de su lomo. Nota: NO darle de comer después de medianoche.' },
  { id: 'a5', titulo: 'La ciudad perdida',
    texto: 'Debajo del pantano hay ruinas de una ciudad de hace mil años. Sus habitantes construyeron guardianes gigantes para protegerse. Genesis despertó a uno con la energía del reactor.' },
  { id: 'a6', titulo: 'Diario de un cazador',
    texto: 'Día 12: el monstruo cruza el barranco todas las noches. Día 13: el puente cruje cada vez más. Día 14: me voy de este bosque. Si alguien encuentra este diario: ¡no te quedes parado sobre las piedras rajadas!' },
  { id: 'a7', titulo: 'Agente especial: Kira',
    texto: 'Kira, "La Cazadora". La mejor rastreadora de Genesis: nadie se le escapó nunca. Arma: látigo de plasma. Le debe la vida a Zephyrus, que la sacó de las calles de la ciudad cuando era chica.' },
  { id: 'a8', titulo: 'Planos de la Citadel',
    texto: 'La Citadel Génesis está hecha de cristal de energía. Sus muros se cargan con los rayos de la tormenta. Solo hay dos formas de llegar: el Expreso Génesis o la Muralla de Cristal.' },
  { id: 'a9', titulo: 'Clon Alfa',
    texto: 'Proto-Jax Alfa fue creado con una muestra de sangre de Jax, tomada cuando trabajaba como muñeco de entrenamiento en los laboratorios. ¡Por eso Genesis tenía su ADN!' },
  { id: 'a10', titulo: 'El diario de Zephyrus',
    texto: 'Nadie me creyó cuando dije que el mundo necesitaba orden. Hace años perdí a mi familia por culpa del caos de la ciudad. Con la cura y su chip, nadie más va a sufrir... porque nadie va a poder elegir. Si hace falta, seré el villano.' },
];

function archivoPorId(id) {
  return ARCHIVOS.find((a) => a.id === id);
}

// Los archivos del nivel (objetos para agarrar)
function revisarArchivos() {
  for (const o of Juego.objetos) {
    if (o.tipo !== 'archivo' || o.agarrado) continue;
    const caja = { x: o.x - 14, y: o.y - 44, ancho: 28, alto: 40 };
    if (!personajes().some((p) => !p.seCayo && seTocan(caja, p))) continue;
    o.agarrado = true;
    const archivo = archivoPorId(o.id);
    if (Juego.partida && !Juego.partida.archivos.includes(o.id)) Juego.partida.archivos.push(o.id);
    guardarPartida();
    Sonido.archivo();
    chispas(o.x, o.y - 26, '#ffd166', 18, 220);
    avisar(`¡Archivo secreto! «${archivo.titulo}» · Leelo en el menú`);
  }
}

function dibujarArchivo(ctx, o, tiempo) {
  const y = o.y - 28 + Math.sin(tiempo * 2.5 + o.x) * 5;
  ctx.save();
  ctx.translate(o.x, y);
  ctx.rotate(Math.sin(tiempo * 1.5) * 0.15);
  ctx.shadowColor = '#ffd166';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(-11, -14, 22, 28);
  ctx.fillStyle = '#ffd166';
  ctx.fillRect(-8, -10, 16, 3);
  ctx.fillRect(-8, -4, 12, 2);
  ctx.fillRect(-8, 1, 14, 2);
  ctx.fillRect(-8, 6, 9, 2);
  ctx.restore();
}

// ---------- La pantalla de los archivos (desde el menú) ----------

let opcionArchivos = 0;

function abrirArchivos() {
  opcionArchivos = 0;
  Juego.estado = 'archivos';
}

function archivosEncontrados() {
  const partida = partidaMasReciente();
  return partida ? partida.archivos : [];
}

function actualizarArchivos(menu) {
  opcionArchivos = moverOpcion(opcionArchivos, ARCHIVOS.length, menu);
  if (menu.volver || menu.aceptar) Juego.estado = 'menu';
}

function dibujarArchivos(ctx) {
  dibujarFondoMenu(ctx, Juego.tiempo);
  const encontrados = archivosEncontrados();
  texto(ctx, `ARCHIVOS SECRETOS DE GENESIS  (${encontrados.length} de ${ARCHIVOS.length})`, ANCHO / 2, 36, {
    tamano: 22, negrita: true, color: '#ffd166',
  });
  ARCHIVOS.forEach((a, i) => {
    const y = 80 + i * 40;
    const elegido = i === opcionArchivos;
    const lo = encontrados.includes(a.id);
    if (elegido) dibujarResaltado(ctx, 20, y - 16, 330, 32);
    texto(ctx, lo ? a.titulo : '??? (sin encontrar)', 34, y, {
      tamano: 14, negrita: elegido, alinear: 'left', color: lo ? (elegido ? COLORES.blanco : COLORES.texto) : COLORES.apagado,
    });
  });
  const a = ARCHIVOS[opcionArchivos];
  ctx.fillStyle = 'rgba(8, 16, 30, 0.94)';
  ctx.fillRect(370, 66, 570, 400);
  ctx.strokeStyle = '#ffd166';
  ctx.strokeRect(370.5, 66.5, 569, 399);
  if (encontrados.includes(a.id)) {
    texto(ctx, a.titulo, 390, 92, { tamano: 18, negrita: true, alinear: 'left', color: '#ffd166' });
    ctx.font = `16px ${FUENTE}`;
    partirEnRenglones(ctx, a.texto, 530).forEach((renglon, i) => {
      texto(ctx, renglon, 390, 130 + i * 26, { tamano: 16, alinear: 'left', color: COLORES.blanco });
    });
  } else {
    texto(ctx, 'Todavía no encontraste este archivo.', 655, 240, { tamano: 16, color: COLORES.apagado });
    texto(ctx, 'Hay uno escondido en cada nivel: buscá un papel dorado que brilla.', 655, 270, { tamano: 14, color: COLORES.apagado });
  }
  dibujarPie(ctx, '↑↓ elegir · ESC volver');
}
