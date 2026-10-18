// ============================================================
//  ANIMACIÓN POR PIEZAS
//  Los dibujos del creador del juego son una sola pose. Para que se muevan
//  de verdad, el juego los corta en piezas (como un muñeco de papel con
//  broches): el torso, la pierna de atrás, la pierna de adelante y el brazo
//  del puño. Después mueve cada pieza por separado:
//    - las piernas giran desde la cadera (caminar, saltar, patear),
//    - el brazo se estira hacia adelante (los golpes),
//    - el torso sube y baja (respirar, correr).
//
//  Las medidas de cada sprite van de 0 a 1 (0 = izquierda o arriba, 1 = derecha o abajo):
//    cadera: a qué altura están las caderas · corte: dónde se separan las dos piernas
//    brazo: [izquierda, arriba, derecha, abajo] del rectángulo del brazo que pega
//  Los enemigos chiquitos solo tienen "cadera": sus piernitas dan pasitos.
// ============================================================

const PARTES_SPRITES = {
  'jax-pelea': { cadera: 0.515, corte: 0.52, brazo: [0.74, 0.155, 1, 0.42] },
  'zephyrus-pelea': { cadera: 0.507, corte: 0.57, brazo: [0.715, 0.14, 1, 0.42] },
  // Enemigos chiquitos: las piernas son el último pedacito de abajo
  ninja: { cadera: 0.8, corte: 0.5 },
  chico: { cadera: 0.8, corte: 0.5 },
  caperucita: { cadera: 0.82, corte: 0.5 },
  caballero: { cadera: 0.8, corte: 0.5 },
  vampiro: { cadera: 0.82, corte: 0.5 },
  goblin: { cadera: 0.8, corte: 0.5 },
  esqueleto: { cadera: 0.78, corte: 0.5 },
  demonio: { cadera: 0.8, corte: 0.5 },
  orco: { cadera: 0.8, corte: 0.5 },
};

const Piezas = {};   // nombre + tinte → las piezas ya cortadas

// Corta un sprite en piezas (una sola vez; después se reutilizan)
function piezasDe(nombre, tinte) {
  const clave = tinte ? `${nombre}|${tinte.color}|${tinte.fuerza}` : nombre;
  if (Piezas[clave]) return Piezas[clave];
  const partes = PARTES_SPRITES[nombre];
  const fuente = tinte ? spriteTenido(nombre, tinte.color, tinte.fuerza) : imagenDe(nombre);
  if (!partes || !fuente) return null;
  const w = fuente.width, h = fuente.height;
  const caderaY = Math.round(h * partes.cadera);
  const corteX = Math.round(w * partes.corte);
  const solapa = Math.max(2, Math.round(h * 0.03));   // las piernas empiezan un poquito más arriba (se tapan con el torso)

  // Recorta un rectángulo de la imagen en un lienzo nuevo
  const recortar = (x, y, ancho, alto, sacar) => {
    const lienzoPieza = document.createElement('canvas');
    lienzoPieza.width = Math.max(1, ancho);
    lienzoPieza.height = Math.max(1, alto);
    const c = lienzoPieza.getContext('2d');
    c.drawImage(fuente, x, y, ancho, alto, 0, 0, ancho, alto);
    if (sacar) c.clearRect(sacar.x - x, sacar.y - y, sacar.ancho, sacar.alto);
    return { lienzo: lienzoPieza, x, y, ancho, alto };
  };

  const brazo = partes.brazo ? {
    x: Math.round(partes.brazo[0] * w), y: Math.round(partes.brazo[1] * h),
    ancho: Math.round((partes.brazo[2] - partes.brazo[0]) * w), alto: Math.round((partes.brazo[3] - partes.brazo[1]) * h),
  } : null;
  const piezas = {
    w, h, caderaY, corteX, partes,
    torso: recortar(0, 0, w, caderaY + solapa, brazo),
    atras: recortar(0, caderaY - solapa, corteX, h - caderaY + solapa),
    adelante: recortar(corteX, caderaY - solapa, w - corteX, h - caderaY + solapa),
    brazo: brazo ? recortar(brazo.x, brazo.y, brazo.ancho, brazo.alto) : null,
  };
  Piezas[clave] = piezas;
  return piezas;
}

function tienePiezas(nombre) {
  return !!PARTES_SPRITES[nombre] && hayImagen(nombre);
}

// Dibuja un sprite por piezas, con los pies en (0, 0) del lienzo actual (que ya está dado vuelta si hace falta).
// mov: {
//   atras, adelante: ángulo de cada pierna (0 = como en el dibujo; positivo = el pie va para atrás)
//   pasoAtras, pasoAdelante: cuánto se levanta cada pie (para los chiquitos)
//   estirarPiernas: 1 = normal · subir: cuánto sube el torso · inclinar: ángulo del torso
//   brazoX, brazoY: cuánto se mueve el brazo del puño (en píxeles de la imagen)
// }
function dibujarPorPiezas(ctx, nombre, alto, mov = {}, opciones = {}) {
  const tinte = opciones.destello > 0.4 ? { color: '#ffffff', fuerza: 0.85 } : opciones.tinte;
  const p = piezasDe(nombre, tinte);
  if (!p) return false;
  const datos = LISTA_SPRITES[nombre];
  const e = alto / p.h;                         // escala: de píxeles de la imagen a píxeles del juego
  const izquierda = -p.w * datos.centro * e;
  const arriba = -alto;
  const caderaX = izquierda + p.corteX * e;
  const caderaY = arriba + p.caderaY * e;

  ctx.save();
  ctx.globalAlpha *= opciones.alfa ?? 1;
  ctx.imageSmoothingEnabled = !datos.pixelado;
  ctx.imageSmoothingQuality = 'high';

  // Una pierna: gira desde la cadera
  const pierna = (pieza, angulo, levantar) => {
    ctx.save();
    ctx.translate(caderaX, caderaY - (levantar || 0));
    ctx.rotate(angulo || 0);
    ctx.scale(1, mov.estirarPiernas || 1);
    ctx.drawImage(pieza.lienzo, izquierda + pieza.x * e - caderaX, arriba + pieza.y * e - caderaY, pieza.ancho * e, pieza.alto * e);
    ctx.restore();
  };
  pierna(p.atras, mov.atras, mov.pasoAtras);
  pierna(p.adelante, mov.adelante, mov.pasoAdelante);

  // El torso (y el brazo) suben, bajan y se inclinan desde la cadera
  ctx.translate(caderaX, caderaY - (mov.subir || 0));
  ctx.rotate(mov.inclinar || 0);
  ctx.translate(-caderaX, -caderaY);
  const t = p.torso;
  ctx.drawImage(t.lienzo, izquierda, arriba, t.ancho * e, t.alto * e);

  if (p.brazo) {
    const b = p.brazo;
    const dx = (mov.brazoX || 0) * e;
    const dy = (mov.brazoY || 0) * e;
    const bx = izquierda + b.x * e;
    const by = arriba + b.y * e;
    // Si el brazo se mueve rápido, deja copias que se desvanecen (como en los dibujos animados)
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      for (const [parte, transparencia] of [[0.35, 0.35], [0.7, 0.6]]) {
        ctx.save();
        ctx.globalAlpha *= transparencia;
        ctx.drawImage(b.lienzo, bx + dx * parte, by + dy * parte, b.ancho * e, b.alto * e);
        ctx.restore();
      }
    }
    ctx.drawImage(b.lienzo, bx + dx, by + dy, b.ancho * e, b.alto * e);
  }
  ctx.restore();
  return true;
}

// ---------- Movimientos que se repiten ----------

// Caminar o correr: las piernas van y vienen. "fase" avanza con la distancia caminada.
function movimientoCaminar(fase, fuerza = 0.45) {
  const s = Math.sin(fase);
  return { atras: s * fuerza, adelante: -s * fuerza, subir: Math.abs(Math.cos(fase)) * 3 };
}

// Pasitos de los enemigos chiquitos: un pie arriba, el otro abajo
function movimientoPasitos(fase) {
  const s = Math.sin(fase);
  return { pasoAtras: Math.max(0, s) * 4, pasoAdelante: Math.max(0, -s) * 4, atras: s * 0.15, adelante: -s * 0.15 };
}
