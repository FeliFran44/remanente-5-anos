// ============================================================
//  FÍSICA: gravedad y choques con las plataformas
// ============================================================

const GRAVEDAD = 2200;             // cuánto aumenta la velocidad de caída en cada segundo
const VELOCIDAD_MAX_CAIDA = 1100;  // más rápido que esto no se cae

// ¿Se superponen dos rectángulos? (cada uno tiene x, y, ancho y alto)
function seTocan(a, b) {
  return a.x < b.x + b.ancho && a.x + a.ancho > b.x &&
         a.y < b.y + b.alto && a.y + a.alto > b.y;
}

// ¿Hay alguna plataforma para pisar justo debajo del punto (x, y)?
// Mira hasta "profundidad" píxeles hacia abajo. La IA lo usa para ver pozos.
function hayPlataformaDebajo(x, y, plataformas, profundidad) {
  return plataformas.some((p) =>
    x >= p.x && x <= p.x + p.ancho && p.y >= y - 1 && p.y <= y + profundidad);
}

// Mueve un cuerpo según su velocidad (vx, vy) y lo frena contra las plataformas.
// Hay dos tipos de plataforma:
//   'solida' → choca por todos lados
//   'fina'   → solo se pisa desde arriba (desde abajo se atraviesa saltando)
// Primero se mueve en horizontal y se corrige, y después en vertical.
// Separar los dos movimientos evita que el personaje se trabe en las esquinas.
function moverConChoques(cuerpo, plataformas, dt, atravesarFinas) {
  cuerpo.enElSuelo = false;
  cuerpo.sueloEsFino = false;
  cuerpo.chocoPared = false;

  // --- Movimiento horizontal ---
  cuerpo.x += cuerpo.vx * dt;
  for (const p of plataformas) {
    if (p.tipo !== 'solida' || !seTocan(cuerpo, p)) continue;
    if (cuerpo.vx > 0) cuerpo.x = p.x - cuerpo.ancho;   // chocó yendo a la derecha
    else if (cuerpo.vx < 0) cuerpo.x = p.x + p.ancho;   // chocó yendo a la izquierda
    cuerpo.vx = 0;
    cuerpo.chocoPared = true;
  }

  // --- Movimiento vertical ---
  const piesAntes = cuerpo.y + cuerpo.alto;
  cuerpo.y += cuerpo.vy * dt;
  for (const p of plataformas) {
    if (!seTocan(cuerpo, p)) continue;

    if (p.tipo === 'fina') {
      // Solo frena si venía cayendo y los pies estaban arriba de la plataforma
      const veniaDeArriba = piesAntes <= p.y + 1;
      if (cuerpo.vy >= 0 && veniaDeArriba && !atravesarFinas) {
        cuerpo.y = p.y - cuerpo.alto;
        cuerpo.vy = 0;
        cuerpo.enElSuelo = true;
        cuerpo.sueloEsFino = true;
      }
      continue;
    }

    if (cuerpo.vy > 0) {          // cayendo: aterriza
      cuerpo.y = p.y - cuerpo.alto;
      cuerpo.vy = 0;
      cuerpo.enElSuelo = true;
    } else if (cuerpo.vy < 0) {   // subiendo: se golpea la cabeza
      cuerpo.y = p.y + p.alto;
      cuerpo.vy = 0;
    }
  }
}
