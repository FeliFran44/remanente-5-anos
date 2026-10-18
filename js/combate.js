// ============================================================
//  COMBATE: golpes, daño, empujones y la sinergia entre Jax y Elena
//  Un "ataque" es una caja que lastima a lo que toca.
//  "golpeados" recuerda a quién ya le pegó: así cada ataque pega una sola vez.
// ============================================================

const Combate = {
  pausa: 0,   // segundos que el juego se congela después de un golpe: da sensación de impacto
  lento: 0,   // segundos de cámara lenta (esquiva perfecta, el golpe final a un jefe)
  combo: { cuenta: 0, tiempo: 0, mejor: 0 },   // golpes seguidos sin que te peguen
};

// Cuánto dura el combo si no seguís pegando
const TIEMPO_DE_COMBO = 2.4;

function camaraLenta(segundos) {
  Combate.lento = Math.max(Combate.lento, segundos);
}

function sumarAlCombo() {
  const c = Combate.combo;
  c.cuenta++;
  c.tiempo = TIEMPO_DE_COMBO;
  c.mejor = Math.max(c.mejor, c.cuenta);
}

function actualizarCombo(dt) {
  const c = Combate.combo;
  c.tiempo = Math.max(0, c.tiempo - dt);
  if (c.tiempo <= 0) c.cuenta = 0;
}

// Cuánto se carga la definitiva por cada punto de daño que hace un personaje
const CARGA_POR_DANIO = 0.8;

// Puño de Plasma Conductor: Embestida de Jax contra un enemigo congelado o recién alcanzado por el plasma
const SINERGIA = { danio: 30, radio: 130, empujeX: 520, empujeY: 380 };

function congelarPorGolpe(segundos) {
  Combate.pausa = Math.max(Combate.pausa, segundos);
}

function centroDe(cuerpo) {
  return { x: cuerpo.x + cuerpo.ancho / 2, y: cuerpo.y + cuerpo.alto / 2 };
}

// Una caja delante de un personaje o enemigo (para golpes y porrazos)
function cajaDelante(p, ancho, alto, desdeArriba) {
  const x = p.mirando > 0 ? p.x + p.ancho - 6 : p.x - ancho + 6;
  return { x, y: p.y + desdeArriba, ancho, alto };
}

// Una caja cuadrada alrededor de un punto (para ondas y explosiones)
function cajaAlrededor(x, y, radio) {
  return { x: x - radio, y: y - radio, ancho: radio * 2, alto: radio * 2 };
}

function crearAtaque(caja, datos, direccion, golpeados) {
  return {
    caja,
    danio: datos.danio,
    empujeX: datos.empujeX || 0,
    empujeY: datos.empujeY || 0,
    direccion,               // 1 o -1; 0 = empuja hacia afuera del centro (ondas y explosiones)
    golpeados,
    fuerte: !!datos.fuerte,  // golpe fuerte: más temblor y más pausa
    rompeGuardia: !!datos.rompeGuardia,   // atraviesa los escudos (y los deja rotos un rato)
    liviano: false,          // golpe liviano (el plasma): no aturde ni hace temblar
    aturde: 0,               // segundos de aturdimiento (0 = lo normal del enemigo)
    esEmbestida: false,
    duenio: null,            // quién atacó: se le carga la definitiva
  };
}

// Un ataque contra todos los enemigos que toque
function golpearEnemigos(ataque, enemigos) {
  for (const e of enemigos) {
    if (e.estado === 'derrotado' || ataque.golpeados.has(e)) continue;
    if (!seTocan(ataque.caja, e)) continue;
    ataque.golpeados.add(e);
    golpearEnemigo(e, ataque, enemigos);
  }
}

// Devuelve true si el golpe entró, o false si lo frenó un escudo
function golpearEnemigo(e, ataque, enemigos) {
  const t = e.t;
  const centro = centroDe(e);

  // Algunos jefes no reciben daño un ratito (por ejemplo, cuando cambian de fase)
  if (e.inmune) {
    if (!ataque.liviano) {
      numeroDeDanio(centro.x, e.y, e.textoInmune || 'INMUNE', '#9fb0c8');
      Sonido.bloqueo();
    }
    return false;
  }

  // ¿Lo frena el escudo? Solo de frente, y no si el ataque rompe la guardia
  if (escudoActivo(e) && vieneDeFrente(e, ataque)) {
    if (!ataque.rompeGuardia) {
      bloquearGolpe(e, ataque);
      return false;
    }
    romperGuardia(e);
  }

  const sinergia = ataque.esEmbestida && (e.estado === 'congelado' || e.marcaPlasma > 0);

  // Hacia dónde sale volando
  let direccion = ataque.direccion;
  if (!direccion) direccion = centro.x >= ataque.caja.x + ataque.caja.ancho / 2 ? 1 : -1;

  // Punto débil en la espalda y armadura adelante (la Limpiadora, la Abominación X-0...)
  let danio = ataque.danio;
  const deFrente = vieneDeFrente(e, ataque);
  if (danio > 0 && t.DEBIL_ESPALDA && !deFrente) {
    danio *= t.DEBIL_ESPALDA;
    if (!(e.avisoDebil > 0)) {
      textoFlotante(centro.x, e.y - 20, '¡PUNTO DÉBIL!', '#c99bff');
      e.avisoDebil = 1.2;
    }
  }
  if (danio > 0 && t.ARMADURA_FRENTE && deFrente) danio *= t.ARMADURA_FRENTE;

  if (!t.INMORTAL) e.vida -= danio;
  if (danio > 0) {
    numeroDeDanio(centro.x, e.y, Math.max(1, Math.round(danio)), ataque.fuerte ? '#ffd166' : '#ffffff', ataque.fuerte);
    if (ataque.duenio && !t.OBJETO) {
      sumarAlCombo();
      cargarDefinitiva(ataque.duenio, danio);
    }
  }
  if (t.alRecibirGolpe) t.alRecibirGolpe(e, ataque);
  e.destello = 1;
  if (!t.FIJO && !ataque.liviano && e.estado !== 'derrotado') {
    const peso = t.PESADO ?? 1;      // a los pesados casi no se los puede empujar
    if (!t.JEFE) e.mirando = -direccion;   // se da vuelta hacia quien le pegó
    e.vx = direccion * ataque.empujeX * peso;
    if (ataque.empujeY && peso > 0) e.vy = -ataque.empujeY * peso;
  }

  if (ataque.liviano) {
    Sonido.impactoPlasma();
  } else if (ataque.fuerte) {
    chispas(centro.x - direccion * 6, centro.y - 6, '#ffb347', 18);
    Sonido.golpeFuerte();
    congelarPorGolpe(0.08);
    temblar(6);
  } else {
    chispas(centro.x - direccion * 6, centro.y - 6, '#ffb347', 10);
    Sonido.golpe();
    congelarPorGolpe(0.045);
    temblar(2);
  }

  if (e.vida <= 0) {
    derrotarEnemigo(e);
  } else if (!ataque.liviano && e.estado !== 'congelado' && !t.JEFE && !t.NO_SE_ATURDE) {
    // (los jefes no se quedan aturdidos por un golpe cualquiera)
    cambiarEstado(e, 'aturdido');
    e.duracionAturdido = ataque.aturde || t.TIEMPO_ATURDIDO;
  }

  if (sinergia) explosionConductora(centro, enemigos, ataque.duenio);
  return true;
}

// ---------- Escudos ----------

function escudoActivo(e) {
  return !!e.t.ESCUDO && !(e.escudoRoto > 0) && !e.sinEscudo && !e.escudoAbajo &&
         e.estado !== 'congelado' && e.estado !== 'derrotado';
}

// ¿El ataque viene del lado al que mira el enemigo?
function vieneDeFrente(e, ataque) {
  const centroAtaque = ataque.caja.x + ataque.caja.ancho / 2;
  const desdeLaDerecha = centroAtaque >= centroDe(e).x;
  return (desdeLaDerecha ? 1 : -1) === e.mirando;
}

function bloquearGolpe(e, ataque) {
  const centro = centroDe(e);
  const x = centro.x + e.mirando * (e.ancho / 2);
  chispas(x, centro.y, '#9fe8ff', ataque.liviano ? 3 : 8, 220);
  if (ataque.liviano) return;   // a los disparos de plasma alcanza con una chispita
  numeroDeDanio(x, e.y, 'BLOQUEADO', '#9fb0c8');
  Sonido.bloqueo();
  if (e.t.alBloquear) e.t.alBloquear(e, ataque);   // algunos jefes contraatacan
  // El que pegó rebota contra el escudo
  if (ataque.duenio && !ataque.liviano) {
    ataque.duenio.forzado = null;
    ataque.duenio.vx = e.mirando * 260;
    congelarPorGolpe(0.03);
  }
}

function romperGuardia(e) {
  const centro = centroDe(e);
  e.escudoRoto = e.t.TIEMPO_GUARDIA_ROTA || 3;
  chispas(centro.x + e.mirando * (e.ancho / 2), centro.y, '#9fe8ff', 20, 340);
  textoFlotante(centro.x, e.y - 24, '¡GUARDIA ROTA!', '#9fe8ff');
  Sonido.guardiaRota();
}

// ¡Puño de Plasma Conductor! Una explosión que lastima a todos alrededor
function explosionConductora(centro, enemigos, duenio) {
  const S = SINERGIA;
  const ataque = crearAtaque(cajaAlrededor(centro.x, centro.y, S.radio), { ...S, fuerte: true }, 0, new Set());
  ataque.duenio = duenio;

  ondaExpansiva(centro.x, centro.y, S.radio, '#5fd4ff', 1);
  ondaExpansiva(centro.x, centro.y, S.radio * 0.7, '#ff7a2f', 1);
  chispas(centro.x, centro.y, '#5fd4ff', 30, 520);
  chispas(centro.x, centro.y, '#ff7a2f', 30, 460);
  textoFlotante(centro.x, centro.y - 50, '¡PUÑO DE PLASMA!', '#9fe8ff');
  temblar(14);
  congelarPorGolpe(0.12);
  Sonido.explosion();

  golpearEnemigos(ataque, enemigos);
}

// Con un combo largo, la definitiva se carga más rápido
function cargarDefinitiva(p, danio) {
  if (p.carga === undefined || p.furia > 0) return;
  const bonus = 1 + Math.min(20, Combate.combo.cuenta) * 0.04;
  p.carga = Math.min(100, p.carga + danio * CARGA_POR_DANIO * bonus);
}

function puedeRecibirGolpe(p) {
  return !p.seCayo && p.vida > 0 && !p.intocable && p.invulnerable <= 0 && p.parpadeo <= 0 && !(p.esquivando > 0);
}

// Un enemigo le pega a un jugador. Devuelve true si el golpe entró.
function golpearJugador(p, danio, direccion) {
  // ¡Esquiva perfecta! El ataque pasó justo mientras esquivaba: cámara lenta y carga extra
  if (p.esquivando > 0 && !p.seCayo && !p.esquivaPerfecta) {
    p.esquivaPerfecta = true;
    const centro = centroDe(p);
    textoFlotante(centro.x, p.y - 30, '¡ESQUIVA PERFECTA!', '#9fe8ff');
    chispas(centro.x, centro.y, '#9fe8ff', 16, 260);
    camaraLenta(0.6);
    cargarDefinitiva(p, 20);
    Sonido.esquivaPerfecta();
  }
  if (!puedeRecibirGolpe(p)) return false;
  if (p.tipo === 'jax') Combate.combo.cuenta = 0;   // si le pegan a Jax, se corta el combo

  p.vida = Math.max(0, p.vida - danio);
  p.invulnerable = 1;     // un segundo sin recibir daño (mientras, parpadea)
  p.aturdido = 0.3;
  p.vx = direccion * 300;
  p.vy = -320;
  // El golpe interrumpe lo que estaba haciendo
  p.accion = null;
  p.ataqueActivo = null;
  p.forzado = null;

  const centro = centroDe(p);
  chispas(centro.x, centro.y - 6, '#ff5a6a', 12);
  numeroDeDanio(centro.x, p.y, danio, '#ff5a6a');
  Sonido.danio();
  temblar(5);
  congelarPorGolpe(0.06);
  return true;
}

// Cura a un personaje (inyectores de la mochila y dardo de Elena)
function curar(p, vida, degradacion) {
  p.vida = Math.min(p.stats.VIDA, p.vida + vida);
  if (p.degradacion !== undefined) p.degradacion = Math.max(0, p.degradacion - degradacion);
  const centro = centroDe(p);
  chispas(centro.x, centro.y, '#7dff5a', 16, 220);
  numeroDeDanio(centro.x, p.y, '+' + vida, '#7dff5a');
  Sonido.curar();
}

// Una explosión de los enemigos o de las trampas: lastima a los jugadores que estén cerca
// (y, si "lastimaEnemigos" es true, también a los enemigos: ¡sirve para usarla a favor!)
function explosion(x, y, radio, danio, opciones = {}) {
  const { lastimaEnemigos = false, color = '#ffb347', danioEnemigos = danio * 2 } = opciones;
  ondaExpansiva(x, y, radio, color, 1);
  chispas(x, y, color, 26, 420);
  chispas(x, y, '#ff3b1f', 14, 300);
  polvo(x, y, 8);
  temblar(10);
  Sonido.explosionChica();
  const caja = cajaAlrededor(x, y, radio);
  for (const p of personajes()) {
    if (danio <= 0 || !seTocan(caja, p)) continue;
    golpearJugador(p, danio, centroDe(p).x >= x ? 1 : -1);
  }
  if (lastimaEnemigos) {
    const ataque = crearAtaque(caja, { danio: danioEnemigos, empujeX: 380, empujeY: 300, fuerte: true }, 0, new Set());
    golpearEnemigos(ataque, Juego.enemigos);
  }
}
