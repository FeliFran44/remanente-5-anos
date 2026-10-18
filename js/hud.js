// ============================================================
//  HUD: lo que se ve encima del juego (vida, suero, recargas)
// ============================================================

const COLOR_SUERO = '#b56cff';
const COLOR_CARGA = '#ffd166';

function dibujarHUD(ctx) {
  const { jax, elena } = Juego;
  const altoJax = dibujarPanelJax(ctx, 10, 10, jax);
  if (elena) dibujarPanelElena(ctx, 10, 18 + altoJax, elena);
  if (jefeEnPantalla()) dibujarBarraDeJefe(ctx, Juego.jefe);
  if (Juego.persecucion && !Juego.persecucion.termino) dibujarMedidorDePersecucion(ctx, Juego.persecucion);
  dibujarCombo(ctx);
  dibujarContadorDeNucleos(ctx);
  dibujarCartelDeArma(ctx);
  if (Juego.cronometro !== null) dibujarCronometro(ctx);
  else if (Juego.emboscadas.some((em) => em.estado === 'activa')) dibujarEmboscada(ctx);
}

// El contador de golpes seguidos (aparece a partir de 3)
const RANGOS_DE_COMBO = [[50, '¡LEYENDA!', '#ff3bd5'], [30, '¡IMPARABLE!', '#ff3b3b'], [20, '¡BRUTAL!', '#ff7a2f'],
  [10, '¡GENIAL!', '#ffd166'], [5, '¡BIEN!', '#9fe8ff']];

function dibujarCombo(ctx) {
  const c = Combate.combo;
  if (c.cuenta < 3) return;
  const x = ANCHO - 30;
  const y = 150;
  const rango = RANGOS_DE_COMBO.find(([minimo]) => c.cuenta >= minimo);
  const salto = 1 + Math.max(0, c.tiempo - (TIEMPO_DE_COMBO - 0.12)) * 3;   // el número "salta" con cada golpe
  ctx.save();
  ctx.globalAlpha = Math.min(1, c.tiempo * 2);
  ctx.shadowColor = rango ? rango[2] : '#ffffff';
  ctx.shadowBlur = 12;
  texto(ctx, String(c.cuenta), x, y, { tamano: Math.round(40 * salto), negrita: true, alinear: 'right', color: COLORES.blanco });
  ctx.shadowBlur = 0;
  texto(ctx, 'GOLPES', x, y + 28, { tamano: 13, negrita: true, alinear: 'right', color: COLORES.texto });
  if (rango) texto(ctx, rango[1], x, y + 48, { tamano: 16, negrita: true, alinear: 'right', color: rango[2] });
  // Barrita del tiempo que queda para seguir el combo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fillRect(x - 80, y + 60, 80, 3);
  ctx.fillStyle = rango ? rango[2] : '#ffffff';
  ctx.fillRect(x - 80, y + 60, 80 * (c.tiempo / TIEMPO_DE_COMBO), 3);
  ctx.restore();
}

// La persecución: qué tan cerca está la Abominación
function dibujarMedidorDePersecucion(ctx, per) {
  const distancia = Math.max(0, Juego.jax.x - per.x);
  const peligro = 1 - Math.min(1, distancia / 900);
  const x = ANCHO / 2 - 150;
  const y = ALTO - 30;
  texto(ctx, per.espera > 0 ? '¡PREPARATE!' : '¡CORRÉ! LA ABOMINACIÓN X-0 SE ACERCA', ANCHO / 2, y - 14, {
    tamano: 13, negrita: true, color: peligro > 0.7 && Math.floor(Juego.tiempo * 6) % 2 ? '#ff3b3b' : '#ff8080',
  });
  ctx.fillStyle = 'rgba(4, 6, 11, 0.8)';
  ctx.fillRect(x - 3, y - 3, 306, 16);
  ctx.fillStyle = '#3a1418';
  ctx.fillRect(x, y, 300, 10);
  ctx.fillStyle = peligro > 0.7 ? '#ff3b3b' : '#c060ff';
  ctx.fillRect(x, y, 300 * peligro, 10);
}

// El Cronómetro Mortal (y cuántas consolas faltan hackear)
function dibujarCronometro(ctx) {
  const segundos = Math.ceil(Juego.cronometro);
  const urgente = segundos <= 10;
  ctx.save();
  ctx.shadowColor = urgente ? '#ff3b3b' : '#a050ff';
  ctx.shadowBlur = 16;
  const escala = urgente ? 1 + (Juego.cronometro % 1) * 0.15 : 1;
  texto(ctx, `0:${String(segundos).padStart(2, '0')}`, ANCHO / 2, 124, {
    tamano: Math.round(40 * escala), negrita: true, color: urgente ? '#ff5050' : '#e2c4ff',
  });
  ctx.restore();
  texto(ctx, 'CRONÓMETRO MORTAL', ANCHO / 2, 94, { tamano: 12, negrita: true, color: '#c08aff' });
  if (Juego.consolas) {
    const listas = Juego.consolas.filter((c) => c.lista).length;
    const quien = Juego.modo === 1 ? 'Jax' : 'Elena';
    const mensaje = listas === Juego.consolas.length
      ? '✓ Chip reprogramado'
      : `Consolas hackeadas: ${listas} / ${Juego.consolas.length} (${quien} tiene que quedarse al lado)`;
    texto(ctx, mensaje, ANCHO / 2, 154, { tamano: 13, color: listas === Juego.consolas.length ? COLORES.verde : '#ffd166' });
  }
}

function dibujarEmboscada(ctx) {
  const em = Juego.emboscadas.find((e) => e.estado === 'activa');
  const quedan = em.enemigos.filter((e) => !e.eliminar && e.estado !== 'derrotado').length;
  texto(ctx, `¡EMBOSCADA! Quedan ${quedan}`, ANCHO / 2, 96, { tamano: 18, negrita: true, color: '#ff8080' });
}

// ¿Hay que mostrar la barra del jefe? (desde que se cierra su sala hasta que cae)
function jefeEnPantalla() {
  const jefe = Juego.jefe;
  return !!jefe && Juego.arenaCerrada && jefe.estado !== 'derrotado' && !jefe.eliminar &&
         (Juego.estado === 'jugando' || Juego.estado === 'derrota');
}

// Barra grande abajo de todo, con una marca a la mitad (ahí entra en sobrecarga)
function dibujarBarraDeJefe(ctx, jefe) {
  const ancho = 420;
  const x = ANCHO / 2 - ancho / 2;
  const y = ALTO - 34;
  const proporcion = Math.max(0, jefe.vida / jefe.vidaMax);
  texto(ctx, (jefe.nombreFase || jefe.t.nombre).toUpperCase(), ANCHO / 2, y - 12, { tamano: 13, negrita: true, color: '#ff8080' });
  ctx.fillStyle = 'rgba(4, 6, 11, 0.8)';
  ctx.fillRect(x - 3, y - 3, ancho + 6, 18);
  ctx.fillStyle = '#3a1418';
  ctx.fillRect(x, y, ancho, 12);
  ctx.fillStyle = jefe.sobrecarga ? '#ff3b3b' : '#e0343c';
  ctx.fillRect(x, y, ancho * proporcion, 12);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillRect(x + ancho / 2 - 1, y - 2, 2, 16);
}

// En el Modo 2 se marca a quién maneja el jugador
function etiquetaDeControl(p) {
  if (Juego.modo !== 2) return '';
  return Juego.controlado === p.tipo ? '  ◆ VOS' : '  · IA';
}

// De qué jugador son las teclas que manejan a este personaje (para mostrarlas en los íconos)
function teclasDe(p) {
  if (Juego.modo === 3 && p.tipo === 'elena') return nombresDeAtaques(Juego.dispositivos.j2, 'j2');
  return nombresDeAtaques(Juego.dispositivos.j1, 'j1');
}

function dibujarPanelJax(ctx, x, y, jax) {
  const H = HABILIDADES_JAX;
  const teclas = teclasDe(jax);
  const conMochila = Juego.modo === 1;
  const alto = 104;

  ctx.fillStyle = 'rgba(4, 6, 11, 0.7)';
  ctx.fillRect(x, y, 300, alto);

  dibujarBarra(ctx, x + 8, y + 8, 'JAX' + etiquetaDeControl(jax), jax.vida, jax.stats.VIDA, COLORES.naranja,
    `${Math.ceil(Math.max(0, jax.vida))} / ${jax.stats.VIDA}`);

  // Degradación del suero: parpadea en rojo cuando está al 100 %
  const critico = jax.degradacion >= 100;
  const textoSuero = critico ? (Math.floor(Juego.tiempo * 4) % 2 ? '¡CRÍTICO!' : '') : `${Math.floor(jax.degradacion)} %`;
  dibujarBarra(ctx, x + 8, y + 30, 'SUERO', jax.degradacion, 100, critico ? COLORES.rojo : COLOR_SUERO, textoSuero);

  const iconos = [
    { tecla: teclas.ataque, dibujo: dibujarIconoGolpe },
    { tecla: teclas.habilidad1, dibujo: dibujarIconoOnda, falta: jax.recargas.onda, total: H.ONDA.recarga },
    { tecla: teclas.habilidad2, dibujo: dibujarIconoEmbestida, falta: jax.recargas.embestida, total: H.EMBESTIDA.recarga },
    { tecla: teclas.definitiva, dibujo: dibujarIconoFuria, carga: jax.carga, activa: jax.furia },
  ];
  if (conMochila) iconos.push({ tecla: teclas.mochila, dibujo: dibujarIconoInyector, cantidad: jax.inyectores });
  // El Pulsor: cuántas balas quedan, su nivel y cuánto falta para el siguiente
  iconos.push({
    tecla: teclas.disparar === 'Espacio' ? 'Esp' : teclas.disparar, dibujo: dibujarIconoArma, cantidad: jax.balas,
    etiqueta: 'N' + ((jax.nivelArma || 0) + 1), barra: progresoDelArma(), colorBarra: ARMA.NIVELES[jax.nivelArma || 0].color,
  });
  dibujarIconos(ctx, x + 8, y + 56, iconos, COLORES.naranja);
  return alto;
}

function dibujarPanelElena(ctx, x, y, elena) {
  const H = HABILIDADES_ELENA;
  const teclas = teclasDe(elena);

  ctx.fillStyle = 'rgba(4, 6, 11, 0.7)';
  ctx.fillRect(x, y, 300, 82);

  dibujarBarra(ctx, x + 8, y + 8, 'ELENA' + etiquetaDeControl(elena), elena.vida, elena.stats.VIDA, COLORES.celeste,
    `${Math.ceil(Math.max(0, elena.vida))} / ${elena.stats.VIDA}`);

  dibujarIconos(ctx, x + 8, y + 34, [
    { tecla: teclas.ataque, dibujo: dibujarIconoPlasma },
    { tecla: teclas.habilidad1, dibujo: dibujarIconoHielo, falta: elena.recargas.hielo, total: H.HIELO.recarga },
    { tecla: teclas.habilidad2, dibujo: dibujarIconoCura, falta: elena.recargas.cura, total: H.CURA.recarga },
    { tecla: teclas.definitiva, dibujo: dibujarIconoTorreta, carga: elena.carga },
  ], COLORES.celeste);
}

// Una barra con su nombre a la izquierda y un texto a la derecha
function dibujarBarra(ctx, x, y, nombre, valor, maximo, color, textoDerecha) {
  const ancho = 124;
  const bx = x + 92;   // lugar para el nombre (y la marca "◆ VOS" / "· IA" del Modo 2)
  texto(ctx, nombre, x, y + 7, { tamano: 12, negrita: true, alinear: 'left', color });
  ctx.fillStyle = '#1d2638';
  ctx.fillRect(bx, y + 1, ancho, 12);
  const proporcion = Math.max(0, Math.min(1, valor / maximo));
  ctx.fillStyle = color === COLOR_SUERO || proporcion > 0.3 ? color : COLORES.rojo;   // la vida se pone roja si queda poca
  ctx.fillRect(bx, y + 1, ancho * proporcion, 12);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, y + 1.5, ancho - 1, 11);
  texto(ctx, textoDerecha, bx + ancho + 8, y + 7, { tamano: 12, alinear: 'left' });
}

// Fila de cuadraditos de habilidades.
// Cada ícono puede tener: falta/total (recarga), carga (0 a 100), activa (segundos), cantidad
function dibujarIconos(ctx, x, y, iconos, colorListo) {
  iconos.forEach((h, i) => {
    const ix = x + i * 46;
    const lado = 40;
    const recargando = h.falta > 0;
    const cargando = h.carga !== undefined && h.carga < 100 && !(h.activa > 0);
    const sinUsos = h.cantidad !== undefined && h.cantidad <= 0;
    const listo = !recargando && !cargando && !sinUsos;
    const pulso = h.carga >= 100 ? 0.5 + Math.sin(Juego.tiempo * 8) * 0.5 : 0;

    ctx.fillStyle = 'rgba(4, 6, 11, 0.85)';
    ctx.fillRect(ix, y, lado, lado);

    // La carga de la definitiva se llena desde abajo
    if (h.carga !== undefined && !(h.activa > 0)) {
      ctx.fillStyle = 'rgba(255, 209, 102, 0.25)';
      ctx.fillRect(ix, y + lado * (1 - h.carga / 100), lado, lado * (h.carga / 100));
    }

    ctx.strokeStyle = listo ? (pulso ? COLOR_CARGA : colorListo) : '#2f3b55';
    ctx.lineWidth = listo && pulso ? 2 + pulso : 1.5;
    ctx.strokeRect(ix + 0.75, y + 0.75, lado - 1.5, lado - 1.5);
    h.dibujo(ctx, ix + lado / 2, y + lado / 2 - 1, listo ? colorListo : COLORES.apagado);

    if (recargando) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(ix, y, lado, lado);
      ctx.clip();
      ctx.fillStyle = 'rgba(4, 6, 11, 0.6)';
      ctx.beginPath();
      ctx.moveTo(ix + lado / 2, y + lado / 2);
      ctx.arc(ix + lado / 2, y + lado / 2, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (h.falta / h.total));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      texto(ctx, String(Math.ceil(h.falta)), ix + lado / 2, y + lado / 2, { tamano: 15, negrita: true, color: COLORES.blanco });
    }
    if (h.activa > 0) texto(ctx, String(Math.ceil(h.activa)), ix + lado / 2, y + lado / 2, { tamano: 15, negrita: true, color: COLORES.blanco });
    if (h.cantidad !== undefined) texto(ctx, '×' + h.cantidad, ix + 4, y + (h.barra !== undefined ? 11 : 9), { tamano: 10, negrita: true, alinear: 'left', color: COLORES.blanco });
    if (h.tecla) texto(ctx, h.tecla, ix + lado - 4, y + lado - 7, { tamano: 10, negrita: true, alinear: 'right', color: COLORES.blanco });
    if (h.etiqueta) texto(ctx, h.etiqueta, ix + 4, y + lado - 7, { tamano: 10, negrita: true, alinear: 'left', color: h.colorBarra || COLORES.blanco });
    // Una barrita arriba de todo (en el arma: cuánto falta para el próximo nivel)
    if (h.barra !== undefined) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(ix + 3, y + 2, lado - 6, 2);
      ctx.fillStyle = h.colorBarra || colorListo;
      ctx.fillRect(ix + 3, y + 2, (lado - 6) * Math.min(1, h.barra), 2);
    }
  });
}

// ---------- Íconos (dibujos simples con formas) ----------

function dibujarIconoArma(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 11, y - 4, 20, 7);        // cuerpo
  ctx.fillRect(x + 9, y - 2, 5, 3);          // cañón
  ctx.save();
  ctx.translate(x - 7, y + 2);
  ctx.rotate(0.3);
  ctx.fillRect(0, 0, 5, 9);                  // empuñadura
  ctx.restore();
}

function dibujarIconoGolpe(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 2, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (const dy of [-6, 0, 6]) {   // rayitas de velocidad
    ctx.beginPath();
    ctx.moveTo(x - 13, y + dy);
    ctx.lineTo(x - 7, y + dy);
    ctx.stroke();
  }
}

function dibujarIconoOnda(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (const radio of [5, 10, 15]) {
    ctx.beginPath();
    ctx.ellipse(x, y + 6, radio, radio * 0.45, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.fillRect(x - 15, y + 6, 30, 2);
}

function dibujarIconoEmbestida(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + 13, y);
  ctx.lineTo(x + 1, y - 9);
  ctx.lineTo(x + 1, y - 4);
  ctx.lineTo(x - 13, y - 4);
  ctx.lineTo(x - 13, y + 4);
  ctx.lineTo(x + 1, y + 4);
  ctx.lineTo(x + 1, y + 9);
  ctx.closePath();
  ctx.fill();
}

function dibujarIconoFuria(ctx, x, y, color) {
  // Una llama
  ctx.fillStyle = color === COLORES.apagado ? color : '#ff3b1f';
  ctx.beginPath();
  ctx.moveTo(x, y - 12);
  ctx.quadraticCurveTo(x + 11, y - 2, x + 7, y + 8);
  ctx.quadraticCurveTo(x, y + 13, x - 7, y + 8);
  ctx.quadraticCurveTo(x - 11, y - 2, x, y - 12);
  ctx.fill();
  ctx.fillStyle = color === COLORES.apagado ? '#1d2638' : COLOR_CARGA;
  ctx.beginPath();
  ctx.ellipse(x, y + 5, 3.5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function dibujarIconoInyector(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.7);
  ctx.fillStyle = color === COLORES.apagado ? color : '#7dff5a';
  ctx.fillRect(-4, -9, 8, 15);          // tubo
  ctx.fillStyle = color;
  ctx.fillRect(-6, -12, 12, 3);         // émbolo
  ctx.fillRect(-1, 6, 2, 7);            // aguja
  ctx.restore();
}

function dibujarIconoPlasma(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x + 3, y, 9, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 13, y - 1, 6, 2);
}

function dibujarIconoHielo(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {   // copo de nieve
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * 11, y - Math.sin(a) * 11);
    ctx.lineTo(x + Math.cos(a) * 11, y + Math.sin(a) * 11);
    ctx.stroke();
  }
}

function dibujarIconoCura(ctx, x, y, color) {
  ctx.fillStyle = color === COLORES.apagado ? color : '#7dff5a';
  ctx.fillRect(x - 3, y - 10, 6, 20);   // una cruz
  ctx.fillRect(x - 10, y - 3, 20, 6);
}

function dibujarIconoTorreta(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 8, y + 4, 16, 6);
  ctx.fillRect(x - 1.5, y - 6, 3, 10);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  for (const radio of [5, 9]) {
    ctx.beginPath();
    ctx.arc(x, y - 7, radio, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
}

// El cartel que presenta al jefe cuando se cierra la puerta (como en los juegos de pelea):
// una franja que entra de costado con el nombre bien grande
function dibujarCartelDeJefe(ctx) {
  const t = Juego.cartelJefe || 0;
  if (t <= 0 || !Juego.jefe) return;
  const total = 2.8;
  const edad = total - t;
  const entra = Math.min(1, edad / 0.25);              // entra rápido...
  const sale = Math.min(1, t / 0.35);                  // ...y se va al final
  const desplaz = (1 - entra) * ANCHO;
  const nombre = Juego.jefe.t.nombre.toUpperCase();
  ctx.save();
  ctx.globalAlpha = sale;
  ctx.translate(desplaz, 0);
  ctx.fillStyle = 'rgba(20, 4, 8, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(ANCHO, 270);
  ctx.lineTo(ANCHO, 350);
  ctx.lineTo(0, 380);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e0343c';
  ctx.fillRect(0, 296, ANCHO, 3);
  ctx.fillRect(0, 374, ANCHO, 3);
  texto(ctx, Juego.jefe.t.FINAL ? 'JEFE FINAL' : 'JEFE', ANCHO / 2, 312, { tamano: 14, negrita: true, color: '#ff8080' });
  ctx.shadowColor = '#ff3b3b';
  ctx.shadowBlur = 18;
  texto(ctx, nombre, ANCHO / 2 + Math.sin(edad * 30) * Math.max(0, 0.4 - edad) * 10, 344, { tamano: 40, negrita: true, color: COLORES.blanco });
  ctx.restore();
}
