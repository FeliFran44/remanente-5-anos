// ============================================================
//  ENTRADA: lee el teclado y los mandos
// ============================================================

// Botones del mando con el "mapeo estándar" de los navegadores.
// Sur, Este, Oeste y Norte son los 4 botones de la derecha:
// en Xbox son A, B, X, Y · en PlayStation son ✕, ○, □, △
const BOTON = { SUR: 0, ESTE: 1, OESTE: 2, NORTE: 3, L1: 4, R1: 5, L2: 6, R2: 7, SELECT: 8, START: 9 };
const DIRECCION = { ARRIBA: 0, ABAJO: 1, IZQUIERDA: 2, DERECHA: 3 };

const NOMBRES_BOTONES = {
  xbox: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'L3', 'R3', '↑', '↓', '←', '→'],
  ps: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', 'L3', 'R3', '↑', '↓', '←', '→'],
};

// Las teclas de cada jugador. Usamos event.code, que es la POSICIÓN de la
// tecla y no la letra: así funcionan igual con teclado en español o en inglés.
// (El Jugador 1 usa las flechas y ataca con la mano izquierda, a pedido del creador del juego)
const TECLAS = {
  j1: {
    izquierda: 'ArrowLeft', derecha: 'ArrowRight', saltar: 'ArrowUp', bajar: 'ArrowDown',
    ataque: 'KeyZ', habilidad1: 'KeyX', habilidad2: 'KeyC', definitiva: 'KeyV',
    mochila: 'KeyE',     // solo en el Modo 1
    cambiar: 'Tab',      // solo en el Modo 2
    esquivar: 'ShiftLeft',
    disparar: 'Space',   // el Pulsor (solo Jax)
  },
  j2: {
    izquierda: 'KeyA', derecha: 'KeyD', saltar: 'KeyW', bajar: 'KeyS',
    ataque: 'KeyJ', habilidad1: 'KeyK', habilidad2: 'KeyL', definitiva: 'Semicolon',
    mochila: null,
    cambiar: null,
    esquivar: 'KeyO',
    disparar: null,
  },
};

// Cómo se muestra una tecla en pantalla: 'ArrowLeft' → '←', 'KeyZ' → 'Z'
function nombreTecla(codigo) {
  const especiales = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Semicolon: 'Ñ', ShiftLeft: 'Shift', Space: 'Espacio' };
  return especiales[codigo] || codigo.replace('Key', '');
}

const Entrada = {
  apretadas: new Set(),       // teclas que están apretadas ahora
  recienApretadas: new Set(), // teclas que se apretaron desde el último paso del juego
  ultimaTecla: '',            // para la pantalla de prueba de controles
  mandos: [],                 // mandos conectados: mandos[0] es el "Mando 1"
  anteriores: new Map(),      // cómo estaban los botones de cada mando en el paso anterior

  estaApretada(codigo) {
    return this.apretadas.has(codigo);
  },

  seAcabaDeApretar(codigo) {
    return this.recienApretadas.has(codigo);
  },

  // Se llama al principio de cada paso: mira cómo están los mandos ahora
  leerMandos() {
    const lista = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    lista.sort((a, b) => a.index - b.index);

    this.mandos = lista.map((pad) => {
      const valores = pad.buttons.map((b) => b.value);
      const botones = pad.buttons.map((b) => b.pressed || b.value > 0.5);
      const ejes = Array.from(pad.axes);
      const x = ejes[0] || 0;
      const y = ejes[1] || 0;
      // La cruceta y el stick izquierdo hacen lo mismo: los juntamos en 4 direcciones
      const direcciones = [
        y < -0.5 || !!botones[12],
        y > 0.5 || !!botones[13],
        x < -0.35 || !!botones[14],
        x > 0.35 || !!botones[15],
      ];
      const antes = this.anteriores.get(pad.index) || { botones: [], direcciones: [] };
      this.anteriores.set(pad.index, { botones, direcciones });
      if (botones.some(Boolean)) Sonido.iniciar();

      return {
        nombre: nombreCorto(pad.id),
        tipo: tipoDeMando(pad.id),
        estandar: pad.mapping === 'standard',
        valores,
        botones,
        ejes,
        direcciones,
        botonesAntes: antes.botones,
        direccionesAntes: antes.direcciones,
      };
    });
  },

  // Se llama al final de cada paso del juego
  finDelPaso() {
    this.recienApretadas.clear();
  },
};

// Teclas a las que les sacamos su efecto normal en el navegador
// (las flechas y el espacio mueven la página, TAB salta a otro elemento)
const TECLAS_BLOQUEADAS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'ShiftLeft'];

window.addEventListener('keydown', (evento) => {
  if (!evento.repeat) Entrada.recienApretadas.add(evento.code);
  Entrada.apretadas.add(evento.code);
  Entrada.ultimaTecla = evento.code;
  if (TECLAS_BLOQUEADAS.includes(evento.code)) evento.preventDefault();
});

window.addEventListener('keyup', (evento) => {
  Entrada.apretadas.delete(evento.code);
});

// Si la ventana pierde el foco soltamos todo; si no, el personaje seguiría caminando solo
window.addEventListener('blur', () => {
  Entrada.apretadas.clear();
});

window.addEventListener('gamepadconnected', (evento) => {
  avisar(`Mando conectado: ${nombreCorto(evento.gamepad.id)}`);
});

window.addEventListener('gamepaddisconnected', (evento) => {
  Entrada.anteriores.delete(evento.gamepad.index);
  avisar(`Mando desconectado: ${nombreCorto(evento.gamepad.id)}`);
});

// ---------- Ayudantes ----------

function botonRecien(mando, boton) {
  return !!mando.botones[boton] && !mando.botonesAntes[boton];
}

function direccionRecien(mando, direccion) {
  return mando.direcciones[direccion] && !mando.direccionesAntes[direccion];
}

// "Xbox 360 Controller (XInput STANDARD GAMEPAD)" → "Xbox 360 Controller"
function nombreCorto(id) {
  const nombre = id.replace(/\(.*?\)/g, '').replace(/\s+/g, ' ').trim();
  return (nombre || 'Mando').slice(0, 32);
}

// Para mostrar ✕ ○ □ △ en los de PlayStation y A B X Y en los demás
function tipoDeMando(id) {
  if (/xbox|xinput/i.test(id)) return 'xbox';
  if (/054c|playstation|dualsense|dualshock|wireless controller/i.test(id)) return 'ps';
  return 'xbox';
}

// dispositivo: 'teclado', 'mando1' o 'mando2'
function mandoDe(dispositivo) {
  if (dispositivo === 'mando1') return Entrada.mandos[0] || null;
  if (dispositivo === 'mando2') return Entrada.mandos[1] || null;
  return null;
}

function nombreDispositivo(dispositivo) {
  return { teclado: 'Teclado', mando1: 'Mando 1', mando2: 'Mando 2' }[dispositivo];
}

// Traduce teclas o botones a lo que el jugador QUIERE hacer.
// Los personajes no saben qué control se usa: solo reciben "izquierda", "saltar", etc.
function leerControles(dispositivo, teclas) {
  if (dispositivo === 'teclado') {
    return {
      izquierda: Entrada.estaApretada(teclas.izquierda),
      derecha: Entrada.estaApretada(teclas.derecha),
      saltar: Entrada.estaApretada(teclas.saltar),
      saltarRecien: Entrada.seAcabaDeApretar(teclas.saltar),
      bajar: Entrada.estaApretada(teclas.bajar),
      ataque: Entrada.estaApretada(teclas.ataque),
      ataqueRecien: Entrada.seAcabaDeApretar(teclas.ataque),
      habilidad1Recien: Entrada.seAcabaDeApretar(teclas.habilidad1),
      habilidad2Recien: Entrada.seAcabaDeApretar(teclas.habilidad2),
      definitivaRecien: Entrada.seAcabaDeApretar(teclas.definitiva),
      mochilaRecien: Entrada.seAcabaDeApretar(teclas.mochila),
      cambiarRecien: Entrada.seAcabaDeApretar(teclas.cambiar),
      esquivarRecien: Entrada.seAcabaDeApretar(teclas.esquivar),
      disparar: Entrada.estaApretada(teclas.disparar),
      dispararRecien: Entrada.seAcabaDeApretar(teclas.disparar),
    };
  }

  const mando = mandoDe(dispositivo);
  if (!mando) return sinControles();
  return {
    izquierda: mando.direcciones[DIRECCION.IZQUIERDA],
    derecha: mando.direcciones[DIRECCION.DERECHA],
    saltar: !!mando.botones[BOTON.SUR],
    saltarRecien: botonRecien(mando, BOTON.SUR),
    bajar: mando.direcciones[DIRECCION.ABAJO],
    ataque: !!mando.botones[BOTON.OESTE],
    ataqueRecien: botonRecien(mando, BOTON.OESTE),
    habilidad1Recien: botonRecien(mando, BOTON.NORTE),
    habilidad2Recien: botonRecien(mando, BOTON.R1),
    definitivaRecien: botonRecien(mando, BOTON.R2),
    mochilaRecien: botonRecien(mando, BOTON.L1),
    cambiarRecien: botonRecien(mando, BOTON.SELECT),
    esquivarRecien: botonRecien(mando, BOTON.L2),
    disparar: !!mando.botones[BOTON.ESTE],
    dispararRecien: botonRecien(mando, BOTON.ESTE),
  };
}

// En los menús sirve cualquier teclado o mando
function leerMenu() {
  const tecla = (...codigos) => codigos.some((codigo) => Entrada.seAcabaDeApretar(codigo));
  const mando = (prueba) => Entrada.mandos.some(prueba);
  return {
    arriba: tecla('ArrowUp', 'KeyW') || mando((m) => direccionRecien(m, DIRECCION.ARRIBA)),
    abajo: tecla('ArrowDown', 'KeyS') || mando((m) => direccionRecien(m, DIRECCION.ABAJO)),
    izquierda: tecla('ArrowLeft', 'KeyA') || mando((m) => direccionRecien(m, DIRECCION.IZQUIERDA)),
    derecha: tecla('ArrowRight', 'KeyD') || mando((m) => direccionRecien(m, DIRECCION.DERECHA)),
    aceptar: tecla('Enter', 'Space') || mando((m) => botonRecien(m, BOTON.SUR) || botonRecien(m, BOTON.START)),
    volver: tecla('Escape', 'Backspace') || mando((m) => botonRecien(m, BOTON.ESTE)),
  };
}

// El texto de ayuda con los controles de cada jugador
function resumenControles(dispositivo, jugador) {
  if (dispositivo === 'teclado') {
    const t = TECLAS[jugador];
    return `${nombreTecla(t.izquierda)}/${nombreTecla(t.derecha)} moverse · ` +
           `${nombreTecla(t.saltar)} saltar · ${nombreTecla(t.bajar)} bajar`;
  }
  const mando = mandoDe(dispositivo);
  const saltar = mando ? NOMBRES_BOTONES[mando.tipo][BOTON.SUR] : 'A';
  return `stick o cruceta moverse · ${saltar} saltar · abajo para bajar`;
}

// Cómo se llaman las teclas o botones de ataque de un jugador (para la ayuda y el HUD)
function nombresDeAtaques(dispositivo, jugador) {
  if (dispositivo === 'teclado') {
    const t = TECLAS[jugador];
    const nombre = (codigo) => (codigo ? nombreTecla(codigo) : '');
    return {
      ataque: nombre(t.ataque), habilidad1: nombre(t.habilidad1), habilidad2: nombre(t.habilidad2),
      definitiva: nombre(t.definitiva), mochila: nombre(t.mochila), cambiar: nombre(t.cambiar),
      esquivar: nombre(t.esquivar), disparar: nombre(t.disparar),
    };
  }
  const mando = mandoDe(dispositivo);
  const nombres = NOMBRES_BOTONES[mando ? mando.tipo : 'xbox'];
  return {
    ataque: nombres[BOTON.OESTE], habilidad1: nombres[BOTON.NORTE], habilidad2: nombres[BOTON.R1],
    definitiva: nombres[BOTON.R2], mochila: nombres[BOTON.L1], cambiar: nombres[BOTON.SELECT],
    esquivar: nombres[BOTON.L2], disparar: nombres[BOTON.ESTE],
  };
}

function resumenAtaquesJax(dispositivo, jugador, conMochila) {
  const n = nombresDeAtaques(dispositivo, jugador);
  const mochila = conMochila ? ` · ${n.mochila} inyector` : '';
  return `${n.ataque} golpe (en el aire: patada) · ${n.habilidad1} Onda · ${n.habilidad2} Embestida · ${n.definitiva} Furia · ${n.disparar} disparar · ${n.esquivar} esquivar${mochila}`;
}

function resumenAtaquesElena(dispositivo, jugador) {
  const n = nombresDeAtaques(dispositivo, jugador);
  return `${n.ataque} plasma (mantené) · ${n.habilidad1} hielo · ${n.habilidad2} curar a Jax · ${n.definitiva} Torreta PEM · ${n.esquivar} esquivar`;
}
