// ============================================================
//  EFECTOS: chispas, polvo, números de daño y ondas expansivas
//  Son solo para la vista: no cambian nada del juego.
// ============================================================

const Efectos = {
  particulas: [],
  numeros: [],
  ondas: [],
};

const MAXIMO_DE_PARTICULAS = 500;

function agregarParticula(particula) {
  if (Efectos.particulas.length < MAXIMO_DE_PARTICULAS) Efectos.particulas.push(particula);
}

// Chispas que saltan para todos lados (brillan)
function chispas(x, y, color, cantidad, fuerza = 320) {
  for (let i = 0; i < cantidad; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const velocidad = fuerza * (0.3 + Math.random() * 0.7);
    const vida = 0.2 + Math.random() * 0.3;
    agregarParticula({
      x, y,
      vx: Math.cos(angulo) * velocidad,
      vy: Math.sin(angulo) * velocidad - 80,
      vida, vidaMax: vida,
      color, tamano: 2 + Math.random() * 2,
      gravedad: 900, brilla: true,
    });
  }
}

// Polvo que se levanta del suelo
function polvo(x, y, cantidad) {
  for (let i = 0; i < cantidad; i++) {
    const vida = 0.3 + Math.random() * 0.4;
    agregarParticula({
      x: x + (Math.random() * 2 - 1) * 20, y,
      vx: (Math.random() * 2 - 1) * 260,
      vy: -40 - Math.random() * 140,
      vida, vidaMax: vida,
      color: '#8a8f9c', tamano: 3 + Math.random() * 3,
      gravedad: 300, brilla: false,
    });
  }
}

// Una partícula quieta que se apaga: deja un rastro (la Embestida)
function estela(x, y, color) {
  agregarParticula({ x, y, vx: 0, vy: 0, vida: 0.25, vidaMax: 0.25, color, tamano: 5, gravedad: 0, brilla: true });
}

function numeroDeDanio(x, y, valor, color, grande = false) {
  Efectos.numeros.push({
    x: x + (Math.random() * 2 - 1) * 8, y, texto: String(valor), color, vida: 0.75, vidaMax: 0.75,
    tamano: grande ? 22 : 17, salta: true,
  });
}

// Un texto grande que sube y se desvanece ("¡PUÑO DE PLASMA!", "¡FURIA!")
function textoFlotante(x, y, texto, color) {
  Efectos.numeros.push({ x, y, texto, color, vida: 1.2, tamano: 22 });
}

// Un anillo que se agranda. "aplanado" 0.25 = sobre el suelo; 1 = círculo en el aire
function ondaExpansiva(x, y, radio, color, aplanado = 0.25) {
  Efectos.ondas.push({ x, y, radio, color, aplanado, vida: 0.35, vidaMax: 0.35 });
}

function actualizarEfectos(dt) {
  for (const p of Efectos.particulas) {
    p.vy += p.gravedad * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vida -= dt;
  }
  for (const n of Efectos.numeros) {
    n.y -= 50 * dt;
    n.vida -= dt;
  }
  for (const o of Efectos.ondas) o.vida -= dt;

  Efectos.particulas = Efectos.particulas.filter((p) => p.vida > 0);
  Efectos.numeros = Efectos.numeros.filter((n) => n.vida > 0);
  Efectos.ondas = Efectos.ondas.filter((o) => o.vida > 0);
}

function limpiarEfectos() {
  Efectos.particulas = [];
  Efectos.numeros = [];
  Efectos.ondas = [];
}

// Se dibuja con la cámara ya aplicada (en coordenadas del nivel)
function dibujarEfectos(ctx) {
  ctx.save();

  // Ondas: un anillo aplastado sobre el suelo que se agranda
  for (const o of Efectos.ondas) {
    const avance = 1 - o.vida / o.vidaMax;
    const radio = o.radio * (0.2 + 0.8 * avance);
    ctx.globalAlpha = o.vida / o.vidaMax;
    ctx.strokeStyle = o.color;
    ctx.lineWidth = 2 + 6 * (1 - avance);
    ctx.beginPath();
    ctx.ellipse(o.x, o.y, radio, radio * o.aplanado, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Partículas: las que "brillan" se suman a lo que hay detrás
  for (const p of Efectos.particulas) {
    ctx.globalCompositeOperation = p.brilla ? 'lighter' : 'source-over';
    ctx.globalAlpha = Math.max(0, p.vida / p.vidaMax);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - p.tamano / 2, p.y - p.tamano / 2, p.tamano, p.tamano);
  }

  // Números de daño y textos
  ctx.globalCompositeOperation = 'source-over';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#04060b';
  for (const n of Efectos.numeros) {
    // Los números de daño aparecen grandes y se achican (como un "¡pum!")
    const edad = n.vidaMax ? n.vidaMax - n.vida : 1;
    const crecer = n.salta && edad < 0.12 ? 1.6 - edad * 5 : 1;
    ctx.font = `bold ${Math.round(n.tamano * crecer)}px ${FUENTE}`;
    ctx.globalAlpha = Math.min(1, n.vida * 3);
    ctx.strokeText(n.texto, n.x, n.y);
    ctx.fillStyle = n.color;
    ctx.fillText(n.texto, n.x, n.y);
  }

  ctx.restore();
}
