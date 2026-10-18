// ============================================================
//  CÁMARA: decide qué parte del nivel se ve en la pantalla
//  Sigue a uno o a varios personajes (en co-op, a los dos).
// ============================================================

const Camara = {
  x: 0,
  y: 0,
  xAntes: 0,     // dónde estaba en el paso anterior (para dibujar suave)
  yAntes: 0,
  adelante: 0,   // cuánto se adelanta hacia donde mira el personaje
  temblor: 0,    // cuánto tiembla la pantalla (en píxeles); baja solo
  zoom: 1.22,    // qué tan cerca está: con 1.22 los personajes se ven un 22 % más grandes

  // Cuánto del nivel entra en la pantalla (con el zoom, entra menos)
  vistaAncho() {
    return ANCHO / this.zoom;
  },
  vistaAlto() {
    return ALTO / this.zoom;
  },

  actualizarTemblor(dt) {
    this.temblor = Math.max(0, this.temblor - 40 * dt);
  },

  // Pone la cámara de golpe sobre los objetivos (al empezar o al reaparecer)
  colocar(objetivos, nivel) {
    this.adelante = this.adelanteDeseado(objetivos);
    const centro = this.centro(objetivos);
    this.x = centro.x + this.adelante - this.vistaAncho() / 2;
    this.y = centro.y - this.vistaAlto() * 0.58;
    this.limitar(nivel);
    this.xAntes = this.x;
    this.yAntes = this.y;
  },

  // Sigue a los objetivos suavemente: en cada paso recorre una parte del camino
  seguir(objetivos, nivel, dt) {
    this.xAntes = this.x;
    this.yAntes = this.y;
    this.adelante += (this.adelanteDeseado(objetivos) - this.adelante) * Math.min(1, 3 * dt);
    const centro = this.centro(objetivos);
    const destinoX = centro.x + this.adelante - this.vistaAncho() / 2;
    const destinoY = centro.y - this.vistaAlto() * 0.58;
    this.x += (destinoX - this.x) * Math.min(1, 8 * dt);
    this.y += (destinoY - this.y) * Math.min(1, 5 * dt);
    this.limitar(nivel);
  },

  // Con un solo personaje mira un poco hacia adelante, para que se vea lo que viene.
  // Con dos, se queda en el medio.
  adelanteDeseado(objetivos) {
    return objetivos.length === 1 ? objetivos[0].mirando * 110 : 0;
  },

  // El centro del rectángulo que encierra a todos los objetivos
  centro(objetivos) {
    const izquierda = Math.min(...objetivos.map((o) => o.x));
    const derecha = Math.max(...objetivos.map((o) => o.x + o.ancho));
    const arriba = Math.min(...objetivos.map((o) => o.y));
    const abajo = Math.max(...objetivos.map((o) => o.y + o.alto));
    return { x: (izquierda + derecha) / 2, y: (arriba + abajo) / 2 };
  },

  // La cámara nunca muestra lo que hay fuera del nivel
  limitar(nivel) {
    this.x = Math.max(0, Math.min(this.x, nivel.ancho - this.vistaAncho()));
    this.y = Math.max(0, Math.min(this.y, nivel.alto - this.vistaAlto()));
  },
};

// Hace temblar la pantalla (golpes fuertes, la Onda Sísmica...)
function temblar(intensidad) {
  Camara.temblor = Math.max(Camara.temblor, intensidad);
}

// La cámara que eligió el jugador en la pausa (se recuerda en este navegador)
try {
  const zoomGuardado = Number(localStorage.getItem('remanente.zoom'));
  if (zoomGuardado >= 1 && zoomGuardado <= 1.5) Camara.zoom = zoomGuardado;
} catch (error) { /* si no se puede leer, queda el de siempre */ }
