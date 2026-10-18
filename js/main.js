// ============================================================
//  MAIN: arranca el juego y lo hace funcionar
// ============================================================

// Tamaño "interno" del juego: todo se dibuja en 960 × 540
// y después se agranda para llenar la ventana sin deformarse.
const ANCHO = 960;
const ALTO = 540;

const lienzo = document.getElementById('juego');
const ctx = lienzo.getContext('2d');
let escalaDibujo = 1;

function ajustarTamano() {
  const escala = Math.min(window.innerWidth / ANCHO, window.innerHeight / ALTO);
  const densidad = window.devicePixelRatio || 1;   // para que se vea nítido en cualquier pantalla
  lienzo.style.width = Math.floor(ANCHO * escala) + 'px';
  lienzo.style.height = Math.floor(ALTO * escala) + 'px';
  lienzo.width = Math.floor(ANCHO * escala * densidad);
  lienzo.height = Math.floor(ALTO * escala * densidad);
  escalaDibujo = lienzo.width / ANCHO;
}
window.addEventListener('resize', ajustarTamano);
ajustarTamano();

// En el celular: al tocar la pantalla, el juego se pone en pantalla completa y acostado
window.addEventListener('pointerdown', (evento) => {
  if (evento.pointerType !== 'touch' || document.fullscreenElement) return;
  if (!document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen()
    .then(() => screen.orientation?.lock?.('landscape'))
    .catch(() => { /* si el celular no deja, se juega igual */ });
});

// --- Todo lo que el juego necesita recordar ---
const Juego = {
  // Pantalla actual: 'titulo', 'menu', 'ranuras', 'modos', 'controles', 'prueba',
  // 'jugando', 'pausa', 'derrota', 'completado', 'escena', 'eleccion' o 'creditos'
  estado: 'titulo',
  modo: 1,              // 1: Jax Solo · 2: Acompañado · 3: Co-op
  dispositivos: { j1: 'teclado', j2: 'teclado' },   // 'teclado', 'mando1' o 'mando2'
  controlado: 'jax',    // Modo 2: a quién maneja el jugador ('jax' o 'elena')
  destino: 'practica',  // 'historia' (los niveles, con guardado) o 'practica'
  partida: null,        // la partida guardada que se está jugando (null en la práctica)
  nivel: null,
  checkpoint: -1,       // última terminal activada (-1 = ninguna)
  jax: null,
  elena: null,          // solo en los Modos 2 y 3
  enemigos: [],
  objetos: [],          // inyectores para agarrar
  radioDicha: new Set(),// qué mensajes de Elena ya se dijeron
  jefe: null,
  arenaCerrada: false,
  salidaAbierta: false,
  siguienteNivel: null,
  estadisticasNivel: { tiempo: 0, enemigos: 0, caidas: 0 },
  tarjeta: 0,           // segundos que se muestra el nombre del nivel
  tiempoDerrota: 0,     // cuando Jax cae, cuenta hasta mostrar la pantalla de derrota
  causaDerrota: '',     // 'golpes', 'suero' o 'atrapado'
  tiempo: 0,            // segundos desde que arrancó el juego
  verCajas: false,      // la tecla H muestra las cajas de choque
  ayudaVisible: true,   // la tecla I esconde la ayuda
  // Mecánicas especiales (js/mecanicas.js)
  emboscadas: [],
  persecucion: null,
  viento: { fuerza: 0, tiempo: 0 },
  consolas: null,       // las consolas del Núcleo Génesis (fase 3 de Zephyrus)
  cronometro: null,     // segundos del Cronómetro Mortal (null = no está corriendo)
  chipHackeado: false,
  escenaDelJefeVista: false,
  esperaFinal: 0,       // cuando cae Zephyrus, cuenta hasta la elección del final
};

// ============================================================
//  EMPEZAR UN NIVEL (desde el principio o desde la última terminal)
// ============================================================

function empezarNivel({ reiniciarEstadisticas }) {
  const datos = Juego.destino === 'historia' ? NIVELES[Juego.partida.nivelId] : NIVEL_PRUEBA;
  const partida = Juego.partida;

  // Si el nivel tiene una escena de historia que todavía no se vio, va primero
  const desdeElPrincipio = !partida || partida.checkpoint < 0;
  if (Juego.destino === 'historia' && desdeElPrincipio && datos.escena && !partida.escenasVistas.includes(datos.escena)) {
    mostrarEscena(datos.escena, () => {
      partida.escenasVistas.push(datos.escena);
      guardarPartida();
      empezarNivel({ reiniciarEstadisticas });
    });
    return;
  }

  const nivel = prepararNivel(datos);
  Juego.nivel = nivel;
  Juego.checkpoint = partida ? partida.checkpoint : -1;
  const inicio = puntoDeReaparicion();

  Juego.jax = crearJax(inicio.x, inicio.y);
  Juego.elena = Juego.modo === 1 ? null : crearElena(inicio.x - 50, inicio.y);
  aplicarMejoras(Juego.jax, Juego.elena);   // lo que se compró en el Taller de Elena
  restaurarDesdeCheckpoint();
  prepararArma(Juego.jax);                  // las balas y el nivel del Pulsor

  // Lo que quedó atrás de la terminal ya se pasó: no vuelve a aparecer
  const desde = Juego.checkpoint >= 0 ? inicio.x + 60 : -Infinity;
  Juego.enemigos = crearEnemigos(nivel).filter((e) => e.origenX > desde);
  // (los archivos secretos que ya se encontraron no vuelven a aparecer)
  const archivosVistos = partida ? partida.archivos : [];
  Juego.objetos = nivel.objetos
    .filter((o) => o.x > desde && !(o.tipo === 'archivo' && archivosVistos.includes(o.id)))
    .map((o) => ({ ...o, agarrado: false }));
  limpiarNucleos();
  limpiarMunicion();
  prepararCofres(nivel, desde);
  Juego.cartelArma = null;
  Juego.radioDicha = new Set();
  nivel.radio.forEach((r, i) => { if (Juego.checkpoint >= 0 && r.x < inicio.x) Juego.radioDicha.add(i); });

  Juego.jefe = Juego.enemigos.find((e) => e.t.JEFE) || null;
  Juego.arenaCerrada = false;
  Juego.salidaAbierta = !!nivel.salida && !Juego.jefe;
  Juego.siguienteNivel = null;
  if (reiniciarEstadisticas) {
    Juego.estadisticasNivel = { tiempo: 0, enemigos: 0, caidas: 0 };
    Combate.combo = { cuenta: 0, tiempo: 0, mejor: 0 };
  }
  Juego.controlado = 'jax';
  Juego.tiempoDerrota = 0;
  Juego.causaDerrota = '';
  Juego.tarjeta = Juego.checkpoint < 0 ? 3 : 0;
  Juego.consolas = null;
  Juego.cronometro = null;
  Juego.chipHackeado = false;
  if (partida) partida.decisiones.chipHackeado = false;
  Juego.escenaDelJefeVista = false;
  Juego.cartelJefe = 0;
  Juego.escenaFinalVista = false;
  Juego.esperaFinal = 0;
  crearTrampas(nivel);
  prepararEmboscadas(nivel, desde);
  prepararPersecucion(nivel, inicio.x);
  prepararViento();
  prepararBarreras(nivel);
  prepararEtapas(nivel, inicio.x);
  Combate.pausa = 0;
  Camara.temblor = 0;
  limpiarEfectos();
  limpiarProyectiles();
  limpiarRadio();
  Camara.colocar(seguidosPorLaCamara(), nivel);
  const etapa = nivel.etapas && nivel.etapas[Juego.etapa];
  Musica.tocar(nivel.persecucion ? 'persecucion' : (etapa && etapa.musica) || nivel.musica || 'acto1');
  Juego.estado = 'jugando';
}

// El tema del escenario: algunos niveles cambian de tema en cada etapa
function temaActual() {
  const nivel = Juego.nivel;
  if (!nivel.etapas) return nivel.tema;
  const x = Camara.x + Camara.vistaAncho() / 2;
  let tema = nivel.tema;
  for (const etapa of nivel.etapas) if (x >= etapa.desde && etapa.tema) tema = etapa.tema;
  return tema;
}

function puntoDeReaparicion() {
  const { nivel, checkpoint } = Juego;
  return checkpoint >= 0 ? nivel.checkpoints[checkpoint] : nivel.inicio;
}

// Al volver a una terminal, Jax y Elena están como cuando pasaron por ella.
// Para no quedar atrapado en una derrota tras otra, la vida vuelve al menos a la mitad
// y la degradación a lo sumo al 60 %.
function restaurarDesdeCheckpoint() {
  const partida = Juego.partida;
  if (!partida || Juego.checkpoint < 0 || !partida.jax) return;
  const { jax, elena } = Juego;
  jax.vida = Math.min(jax.stats.VIDA, Math.max(partida.jax.vida, jax.stats.VIDA / 2));
  jax.degradacion = Math.min(partida.jax.degradacion, 60);
  jax.carga = partida.jax.carga;
  if (Juego.modo === 1) jax.inyectores = partida.jax.inyectores;
  if (elena && partida.elena) {
    elena.vida = Math.min(elena.stats.VIDA, Math.max(partida.elena.vida, elena.stats.VIDA / 2));
    elena.carga = partida.elena.carga;
  }
}

function salirAlMenu() {
  guardarPartida();   // guarda el tiempo jugado y las estadísticas (la posición queda en la última terminal)
  opcionMenu = 0;
  Musica.tocar('menu');
  Juego.estado = 'menu';
}

// Los personajes de la partida (Elena primero, así se dibuja detrás de Jax)
function personajes() {
  return Juego.elena ? [Juego.elena, Juego.jax] : [Juego.jax];
}

// Modo 1 y 3: la cámara sigue a los jugadores · Modo 2: al que maneja el jugador
function seguidosPorLaCamara() {
  let lista = [Juego.jax];
  if (Juego.modo === 3) lista = [Juego.jax, Juego.elena];
  if (Juego.modo === 2 && Juego.controlado === 'elena') lista = [Juego.elena];
  const enJuego = lista.filter((p) => !p.seCayo);
  return enJuego.length > 0 ? enJuego : [Juego.jax];
}

// ============================================================
//  CADA PASO DEL JUEGO
// ============================================================

// Un paso del juego: mueve todo un poquito (1/60 de segundo).
// Devuelve false si el juego estaba congelado (así las teclas apretadas no se pierden).
function actualizar(dt) {
  Juego.tiempo += dt;

  // Después de un golpe, todo se congela un instante: da sensación de impacto
  if (Juego.estado === 'jugando' && Combate.pausa > 0) {
    Combate.pausa -= dt;
    congelarDibujo();
    return false;
  }

  Entrada.leerMandos();
  actualizarAvisos(dt);
  const menu = leerMenu();

  switch (Juego.estado) {
    case 'titulo': actualizarTitulo(menu); break;
    case 'menu': actualizarMenu(menu); break;
    case 'ranuras': actualizarRanuras(menu, dt); break;
    case 'modos': actualizarModos(menu); break;
    case 'controles': actualizarControles(menu); break;
    case 'prueba': actualizarPrueba(dt); break;
    case 'jugando': actualizarPartida(dt); break;
    case 'pausa': actualizarPausa(menu); break;
    case 'derrota': actualizarDerrota(menu); break;
    case 'completado': actualizarCompletado(menu); break;
    case 'escena': actualizarEscena(menu, dt); break;
    case 'eleccion': actualizarEleccion(menu); break;
    case 'creditos': actualizarCreditos(menu, dt); break;
    case 'taller': actualizarTaller(menu); break;
    case 'archivos': actualizarArchivos(menu); break;
  }
  return true;
}

function actualizarPartida(dt) {
  const apretoStart = Entrada.mandos.some((m) => botonRecien(m, BOTON.START));
  if (Entrada.seAcabaDeApretar('Escape') || Entrada.seAcabaDeApretar('KeyP') || apretoStart) {
    abrirPausa();
    return;
  }
  if (Entrada.seAcabaDeApretar('KeyH')) Juego.verCajas = !Juego.verCajas;
  if (Entrada.seAcabaDeApretar('KeyI')) Juego.ayudaVisible = !Juego.ayudaVisible;
  if (Entrada.seAcabaDeApretar('KeyM')) avisar(Sonido.alternarSilencio() ? 'Sonido apagado' : 'Sonido prendido');
  Juego.tarjeta = Math.max(0, Juego.tarjeta - dt);
  Juego.tarjetaEtapa = Math.max(0, (Juego.tarjetaEtapa || 0) - dt);
  Juego.cartelJefe = Math.max(0, (Juego.cartelJefe || 0) - dt);
  actualizarRadio(dt);

  // Jax cayó: unos instantes y aparece la pantalla de derrota
  if (Juego.tiempoDerrota > 0) {
    Juego.tiempoDerrota -= dt;
    actualizarEfectos(dt);
    Camara.actualizarTemblor(dt);
    congelarDibujo();
    if (Juego.tiempoDerrota <= 0) {
      opcionDerrota = 0;
      Juego.estado = 'derrota';
    }
    return;
  }

  const { jax, elena, nivel, modo, enemigos } = Juego;
  const controlesJ1 = leerControles(Juego.dispositivos.j1, TECLAS.j1);
  if (modo === 2 && controlesJ1.cambiarRecien) cambiarPersonaje();

  // Cronómetro Mortal (fase 3 de Zephyrus): Furia sin fin para Jax
  if (Juego.cronometro !== null) actualizarCronometro(dt);
  if (Juego.estado !== 'jugando') return;

  // ¿Quién maneja a cada uno?
  const manejaElena = modo === 2 && Juego.controlado === 'elena';
  if (!jax.seCayo) {
    const controlesJax = manejaElena ? controlesJaxBot(jax, elena, enemigos, nivel) : controlesJ1;
    actualizarJax(jax, controlesJax, nivel, dt);
  }
  if (elena && !elena.seCayo) {
    let controlesElena;
    if (modo === 3) controlesElena = leerControles(Juego.dispositivos.j2, TECLAS.j2);
    else if (manejaElena) controlesElena = controlesJ1;
    else controlesElena = controlesElenaBot(elena, jax, enemigos, nivel);
    actualizarElena(elena, controlesElena, nivel, dt, jax);
  }

  aplicarTorretas(enemigos, dt);
  actualizarEnemigos(enemigos, personajes(), nivel, dt);
  if (jax.ataqueActivo) {
    golpearEnemigos(jax.ataqueActivo, Juego.enemigos);
    golpearCofres(jax.ataqueActivo.caja);
  }
  actualizarProyectiles(Juego.enemigos, personajes(), nivel, dt);
  actualizarTrampas(nivel, personajes(), Juego.enemigos, dt);
  actualizarNucleos(nivel, personajes(), dt);
  actualizarMunicion(nivel, jax, dt);
  actualizarCofres(dt);
  contarDerrotados();
  Juego.enemigos = Juego.enemigos.filter((e) => !e.eliminar);

  if (modo === 3) mantenerJuntos(jax, elena);
  if (modo === 2) traerAlBot(dt);
  actualizarViento(nivel, dt);
  actualizarBarreras(dt);
  actualizarPersecucion(dt);
  actualizarConsolas(dt);
  revisarFueraDeCombate();
  manejarCaidas(dt);
  revisarCheckpoints();
  revisarObjetos();
  revisarArchivos();
  revisarRadio();
  revisarEmboscadas();
  revisarEtapas();
  revisarArena();
  revisarJefeCaido(dt);
  revisarSalida();
  contarTiempo(dt);
  actualizarEfectos(dt);
  actualizarCombo(dt);
  Camara.actualizarTemblor(dt);

  const seguidos = seguidosPorLaCamara();
  if (seguidos.every((p) => p.acabaDeReaparecer)) Camara.colocar(seguidos, nivel);
  else Camara.seguir(seguidos, nivel, dt);
  for (const p of personajes()) p.acabaDeReaparecer = false;
}

// ---------- Estadísticas ----------

function contarTiempo(dt) {
  Juego.estadisticasNivel.tiempo += dt;
  if (Juego.partida) Juego.partida.estadisticas.tiempoJugado += dt;
}

function contarDerrotados() {
  for (const e of Juego.enemigos) {
    if (!e.recienDerrotado) continue;
    e.recienDerrotado = false;
    if (e.t.OBJETO) continue;   // los tubos de gas no son enemigos
    soltarNucleos(e);
    soltarMunicionDeEnemigo(e);
    Juego.estadisticasNivel.enemigos++;
    if (Juego.partida) Juego.partida.estadisticas.enemigosDerrotados++;
    contarBajaDelArma();   // el Pulsor aprende con cada enemigo derrotado
    if (e.t.JEFE) jefeDerrotado(e);
  }
}

// ---------- Terminales (checkpoints) ----------

function revisarCheckpoints() {
  const { nivel, jax } = Juego;
  nivel.checkpoints.forEach((cp, i) => {
    if (i > Juego.checkpoint && !jax.seCayo && centroDe(jax).x > cp.x - 30) activarCheckpoint(i);
  });
}

function activarCheckpoint(i) {
  const cp = Juego.nivel.checkpoints[i];
  Juego.checkpoint = i;
  chispas(cp.x, cp.y - 64, '#7dff5a', 20, 260);
  Sonido.guardar();
  if (Juego.partida) {
    const partida = Juego.partida;
    partida.checkpoint = i;
    partida.jax = fotoDeJax(Juego.jax);
    partida.elena = fotoDeElena(Juego.elena);
    guardarPartida();
    avisar(partida.ranura ? 'Terminal activada: partida guardada' : 'Terminal activada');
  } else {
    avisar('Terminal activada');
  }
}

// ---------- Inyectores para agarrar ----------

function revisarObjetos() {
  for (const o of Juego.objetos) {
    if (o.agarrado || o.tipo !== 'inyector') continue;
    const caja = { x: o.x - 14, y: o.y - 44, ancho: 28, alto: 40 };
    const quien = personajes().find((p) => !p.seCayo && p.vida > 0 && seTocan(caja, p));
    if (!quien) continue;
    o.agarrado = true;
    Sonido.recoger();
    chispas(o.x, o.y - 26, '#7dff5a', 14, 200);
    // En el Modo 1 va a la mochila; si no, cura a Jax en el momento
    if (Juego.modo === 1) {
      Juego.jax.inyectores = Math.min(5, Juego.jax.inyectores + 1);
      avisar('+1 inyector en la mochila');
    } else {
      curar(Juego.jax, HABILIDADES_JAX.MOCHILA.vida + (Juego.jax.curaExtra || 0), HABILIDADES_JAX.MOCHILA.degradacion);
    }
  }
}

// ---------- Lo que dicen por radio ----------

function revisarRadio() {
  const x = centroDe(Juego.jax).x;
  Juego.nivel.radio.forEach((mensaje, i) => {
    if (Juego.radioDicha.has(i) || x < mensaje.x) return;
    Juego.radioDicha.add(i);
    decirPorRadio(reemplazarTeclas(textoDeRadio(mensaje)), mensaje.quien || 'elena');
  });
}

function textoDeRadio(mensaje) {
  return (Juego.modo === 1 ? mensaje.solo : mensaje.juntos) || mensaje.texto;
}

// ---------- La sala del jefe y la salida ----------

function revisarArena() {
  const { nivel, jax, jefe } = Juego;
  if (!nivel.arena || !jefe || Juego.arenaCerrada || jefe.estado === 'derrotado') return;
  if (jax.x < nivel.arena.activarEn) return;

  // Algunos jefes tienen una escena antes de pelear (por ejemplo, Vane y Zephyrus)
  const partida = Juego.partida;
  const yaLaVio = Juego.escenaDelJefeVista || (partida && partida.escenasVistas.includes(nivel.arena.escena));
  if (nivel.arena.escena && !yaLaVio && !Juego.sinEscenas) {
    Juego.escenaDelJefeVista = true;
    if (partida) {
      partida.escenasVistas.push(nivel.arena.escena);
      guardarPartida();
    }
    mostrarEscena(nivel.arena.escena, () => {
      Juego.estado = 'jugando';
      cerrarArena();
    });
    return;
  }
  cerrarArena();
}

function cerrarArena() {
  const { nivel, jax, elena, jefe } = Juego;
  // Se cierra la puerta detrás y el jefe se despierta
  Juego.arenaCerrada = true;
  nivel.plataformas.push({ x: nivel.arena.puertaX, y: 0, ancho: 40, alto: nivel.inicio.y, tipo: 'solida', puerta: true });
  cambiarEstado(jefe, 'presentacion');
  textoFlotante(centroDe(jefe).x, jefe.y - 30, jefe.t.TEXTO_OBJETIVO || 'OBJETIVO: SUJETO CERO', '#ff5050');
  Sonido.alarma();
  temblar(8);
  Musica.tocar('jefe');
  Juego.cartelJefe = 2.8;   // el cartel con el nombre del jefe
  if (nivel.arena.radio) decirPorRadio(nivel.arena.radio, nivel.arena.quien || 'elena');
  // Si Elena quedó del otro lado de la puerta, entra con Jax
  if (elena && !elena.seCayo && elena.x < nivel.arena.puertaX + 40) reaparecerJunto(elena, jax, nivel);
}

function jefeDerrotado(jefe) {
  const { nivel } = Juego;
  if (Juego.partida) Juego.partida.estadisticas.jefesVencidos++;
  // ¡El golpe final! Cámara lenta y un destello
  camaraLenta(1.5);
  Juego.flash = 0.9;
  textoFlotante(centroDe(jefe).x, jefe.y - 40, '¡K.O.!', '#ffd166');
  // Zephyrus: se termina el cronómetro y, en un ratito, se elige el final
  if (jefe.t.FINAL) {
    Juego.cronometro = null;
    Juego.esperaFinal = 3;
    Musica.tocar('victoria');
    return;
  }
  nivel.plataformas = nivel.plataformas.filter((p) => !p.puerta || p.emboscada !== undefined);
  Juego.salidaAbierta = true;
  Musica.tocar(nivel.musica || 'acto1');
  if (nivel.arena && nivel.arena.radioFinal && !nivel.arena.escenaFinal) decirPorRadio(nivel.arena.radioFinal, 'elena');
  avisar('¡La salida está abierta!');
}

// Después de que cae el jefe: la escena del final de la pelea (o la elección del final del juego)
function revisarJefeCaido(dt) {
  const { jefe, nivel } = Juego;
  if (Juego.esperaFinal > 0) {
    Juego.esperaFinal -= dt;
    if (Juego.esperaFinal <= 0) abrirEleccion();
    return;
  }
  if (!jefe || jefe.estado !== 'derrotado' || !nivel.arena || !nivel.arena.escenaFinal || Juego.escenaFinalVista) return;
  if (Juego.sinEscenas) {
    jefe.eliminar = true;
    return;
  }
  if (jefe.tiempoEstado < 2.2) return;
  Juego.escenaFinalVista = true;
  mostrarEscena(nivel.arena.escenaFinal, () => {
    Juego.estado = 'jugando';
    // El jefe se retira (se teletransporta)
    if (!jefe.eliminar) {
      jefe.eliminar = true;
      chispas(centroDe(jefe).x, centroDe(jefe).y, '#5fd4ff', 30, 300);
      Sonido.teletransporte();
    }
    if (nivel.arena.radioFinal) decirPorRadio(nivel.arena.radioFinal, 'elena');
  });
}

function revisarSalida() {
  const { nivel, jax } = Juego;
  if (!Juego.salidaAbierta || !nivel.salida || jax.seCayo) return;
  if (jax.x + jax.ancho >= nivel.salida.x) completarNivel();
}

function completarNivel() {
  const partida = Juego.partida;
  if (partida) {
    partida.estadisticas.mejorCombo = Math.max(partida.estadisticas.mejorCombo || 0, Combate.combo.mejor);
    if (!partida.completados.includes(partida.nivelId)) partida.completados.push(partida.nivelId);
    const posicion = ORDEN_DE_NIVELES.indexOf(partida.nivelId);
    const siguiente = ORDEN_DE_NIVELES[posicion + 1] || null;
    Juego.siguienteNivel = siguiente;
    // El próximo "Continuar" arranca el nivel siguiente (o este de nuevo, si es el último que hay)
    if (siguiente) partida.nivelId = siguiente;
    partida.checkpoint = -1;
    partida.balas = Juego.jax.balas;   // las balas pasan al nivel siguiente
    partida.jax = null;
    partida.elena = null;
    guardarPartida();
  }
  Sonido.nivelCompletado();
  Musica.tocar('victoria');
  opcionCompletado = 0;
  Juego.estado = 'completado';
}

// ---------- El Cronómetro Mortal (fase 3 de Zephyrus) ----------

function actualizarCronometro(dt) {
  const antes = Juego.cronometro;
  Juego.cronometro = Math.max(0, Juego.cronometro - dt);
  // Jax tiene Furia todo el tiempo (y su vida baja de a poco)
  Juego.jax.furia = Math.max(Juego.jax.furia, 0.5);
  Juego.jax.degradacion = Math.min(Juego.jax.degradacion, 95);
  if (Math.ceil(Juego.cronometro) !== Math.ceil(antes) && Juego.cronometro <= 10) Sonido.reloj();
  if (Juego.cronometro <= 0) {
    // ¡Se acabó el tiempo! Zephyrus activa el chip...
    Juego.cronometro = null;
    if (Juego.partida) Juego.partida.decisiones.finalPorTiempo = true;
    mostrarEscena('final-tiempo', () => terminarJuego('oscuro'));
  }
}

// ---------- Modo 2 ----------

// El jugador pasa a manejar al otro personaje, y la computadora al que dejó
function cambiarPersonaje() {
  const otro = Juego.controlado === 'jax' ? Juego.elena : Juego.jax;
  if (otro.seCayo || otro.vida <= 0) return;
  Juego.controlado = otro.tipo;
  avisar(`Ahora manejás a ${otro.tipo === 'jax' ? 'Jax' : 'Elena'}`);
  Sonido.cambio();
}

// Si el que maneja la computadora quedó muy lejos, aparece junto al jugador
function traerAlBot(dt) {
  const { jax, elena, nivel } = Juego;
  const [bot, lider] = Juego.controlado === 'jax' ? [elena, jax] : [jax, elena];
  if (bot.seCayo || lider.seCayo) return;
  // Mientras hackea una consola, Elena puede alejarse
  if (bot === elena && Juego.consolas && consolaSinHackear(centroDe(elena).x)) return;
  if (botSePerdio(bot, lider, dt) && lider.enElSuelo) {
    reaparecerJunto(bot, lider, nivel);
    bot.tiempoLejos = 0;
  }
}

// Mientras el juego está congelado, que el dibujo no "tiemble" entre dos posiciones
function congelarDibujo() {
  for (const cuerpo of [...personajes(), ...Juego.enemigos]) {
    cuerpo.xAntes = cuerpo.x;
    cuerpo.yAntes = cuerpo.y;
  }
  Camara.xAntes = Camara.x;
  Camara.yAntes = Camara.y;
}

// Si alguien se queda sin vida
function revisarFueraDeCombate() {
  const { jax, elena } = Juego;

  if (jax.vida <= 0) {
    const centro = centroDe(jax);
    chispas(centro.x, centro.y, COLORES.naranja, 30, 420);
    Sonido.derrota();
    if (Juego.causaDerrota !== 'atrapado') Juego.causaDerrota = jax.degradacion >= 100 ? 'suero' : 'golpes';
    Juego.tiempoDerrota = 1.2;
    Juego.estadisticasNivel.caidas++;
    if (Juego.partida) {
      Juego.partida.estadisticas.muertes++;
      guardarPartida();
    }
    return;
  }

  // Elena se retira un ratito y vuelve junto a Jax
  if (elena && elena.vida <= 0 && !elena.seCayo) {
    const centro = centroDe(elena);
    chispas(centro.x, centro.y, COLORES.celeste, 24, 380);
    elena.seCayo = true;
    elena.esperaReaparecer = 2;
    avisar('Elena quedó fuera de combate: vuelve en 2 segundos');
    if (Juego.modo === 2 && Juego.controlado === 'elena') Juego.controlado = 'jax';
  }
}

// En co-op los dos jugadores no se pueden separar más que el ancho de la pantalla.
// Al que se aleja lo frena una "pared invisible", pero nunca más atrás de donde
// estaba en el paso anterior (así no termina metido dentro de una pared de verdad).
function mantenerJuntos(a, b) {
  const SEPARACION_MAXIMA = Camara.vistaAncho() - 140;
  for (const [p, otro] of [[a, b], [b, a]]) {
    if (p.seCayo || otro.seCayo) continue;
    const minimo = otro.x - SEPARACION_MAXIMA;
    const maximo = otro.x + SEPARACION_MAXIMA;
    if (p.x < minimo) {
      p.x = Math.min(minimo, Math.max(p.x, p.xAntes));
      p.vx = Math.max(0, p.vx);
    } else if (p.x > maximo) {
      p.x = Math.max(maximo, Math.min(p.x, p.xAntes));
      p.vx = Math.min(0, p.vx);
    }
  }
}

// Si alguien se cae a un pozo (o queda fuera de combate), reaparece junto a su
// compañero cuando el compañero está parado en el suelo. Si no hay compañero
// (o se cayeron los dos), vuelven a la última terminal (o al principio del nivel).
// Caerse a un pozo cuesta un poquito de vida.
const DANIO_POR_CAIDA = 10;

function manejarCaidas(dt) {
  const { jax, elena, nivel } = Juego;
  const lugar = puntoDeReaparicion();
  for (const [p, companero] of [[jax, elena], [elena, jax]]) {
    if (!p || !p.seCayo) continue;
    p.esperaReaparecer -= dt;
    if (p.esperaReaparecer > 0) continue;

    const cayoAUnPozo = p.vida > 0;
    if (companero && !companero.seCayo) {
      if (!companero.enElSuelo) continue;
      reaparecerJunto(p, companero, nivel);
    } else {
      reaparecerEn(p, lugar.x, lugar.y);
      if (companero) reaparecerEn(companero, lugar.x - 50, lugar.y);
      // En la persecución, el monstruo queda un poco más atrás
      if (Juego.persecucion) Juego.persecucion.x = Math.min(Juego.persecucion.x, lugar.x - 600);
    }
    if (p.vida <= 0) p.vida = p.stats.VIDA;
    else if (cayoAUnPozo) {
      p.vida = Math.max(1, p.vida - DANIO_POR_CAIDA);
      numeroDeDanio(centroDe(p).x, p.y, DANIO_POR_CAIDA, '#ff5a6a');
    }
  }
}

// ============================================================
//  DIBUJAR
// ============================================================

// Dibuja todo. "alfa" dice qué tan cerca estamos del próximo paso (de 0 a 1).
function dibujar(alfa) {
  ctx.setTransform(escalaDibujo, 0, 0, escalaDibujo, 0, 0);

  switch (Juego.estado) {
    case 'titulo': dibujarTitulo(ctx); break;
    case 'menu': dibujarMenu(ctx); break;
    case 'ranuras': dibujarRanuras(ctx); break;
    case 'modos': dibujarModos(ctx); break;
    case 'controles': dibujarControles(ctx); break;
    case 'prueba': dibujarPrueba(ctx); break;
    case 'jugando': dibujarPartida(alfa); break;
    case 'pausa': dibujarPartida(1); dibujarPausa(ctx); break;
    case 'derrota': dibujarPartida(alfa); dibujarDerrota(ctx); break;
    case 'completado': dibujarPartida(alfa); dibujarCompletado(ctx); break;
    case 'escena': dibujarEscena(ctx); break;
    case 'eleccion': dibujarEleccion(ctx); break;
    case 'creditos': dibujarCreditos(ctx); break;
    case 'taller': dibujarTaller(ctx); break;
    case 'archivos': dibujarArchivos(ctx); break;
  }
  dibujarAvisos(ctx);
}

function dibujarPartida(alfa) {
  const { nivel, jax, enemigos } = Juego;

  // Redondeamos la cámara a píxeles reales de la pantalla para que nada tiemble
  let camX = Camara.xAntes + (Camara.x - Camara.xAntes) * alfa;
  let camY = Camara.yAntes + (Camara.y - Camara.yAntes) * alfa;
  camX = Math.round(camX * escalaDibujo) / escalaDibujo;
  camY = Math.round(camY * escalaDibujo) / escalaDibujo;

  // El temblor mueve todo el nivel unos píxeles al azar
  const temblorX = (Math.random() * 2 - 1) * Camara.temblor;
  const temblorY = (Math.random() * 2 - 1) * Camara.temblor;

  dibujarFondo(ctx, camX, camY, temaActual(), Juego.tiempo);

  ctx.save();
  ctx.translate(temblorX, temblorY);
  ctx.scale(Camara.zoom, Camara.zoom);
  ctx.translate(-camX, -camY);
  dibujarDecoracion(ctx, nivel.decoracion, Juego.tiempo, nivel.tema);
  if (nivel.salida) dibujarSalida(ctx, nivel.salida, Juego.salidaAbierta, Juego.tiempo);
  dibujarPlataformas(ctx, nivel.plataformas, Juego.tiempo, temaActual());
  dibujarTrampas(ctx, Juego.tiempo);
  dibujarBarreras(ctx);
  dibujarCarteles(ctx, nivel.carteles);
  dibujarCheckpoints(ctx, nivel.checkpoints, Juego.checkpoint, Juego.tiempo);
  dibujarConsolas(ctx, Juego.tiempo);
  dibujarCofres(ctx, Juego.tiempo);
  dibujarObjetos(ctx, Juego.objetos, Juego.tiempo);
  dibujarNucleos(ctx, Juego.tiempo);
  dibujarMunicion(ctx, Juego.tiempo);
  dibujarEnemigos(ctx, enemigos, alfa);
  for (const p of personajes()) {
    if (p.seCayo || p.vida <= 0) continue;
    if (p.tipo === 'jax') dibujarJax(ctx, p, alfa);
    else dibujarElena(ctx, p, alfa);
  }
  dibujarProyectiles(ctx);
  dibujarEfectos(ctx);
  dibujarPersecucion(ctx, Juego.tiempo);
  dibujarEtiquetas(ctx, alfa);
  if (Juego.verCajas) {
    const ataques = [jax.ataqueActivo && jax.ataqueActivo.caja, ...enemigos.map((e) => e.cajaAtaque),
      ...Proyectiles.lista.map(cajaDeProyectil)];
    dibujarCajasDeChoque(ctx, nivel.plataformas, [...personajes(), ...enemigos], ataques.filter(Boolean), alfa);
  }
  ctx.restore();

  dibujarClima(ctx, camX, camY, temaActual(), Juego.tiempo);
  // Un destello blanco en la pantalla (cuando cae un jefe)
  if (Juego.flash > 0) {
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.8, Juego.flash)})`;
    ctx.fillRect(0, 0, ANCHO, ALTO);
  }
  dibujarNiebla(ctx, camX, camY, alfa);
  dibujarFlechas(ctx, personajes(), camX, camY, alfa);
  dibujarHUD(ctx);
  dibujarAyuda(ctx);
  dibujarRadio(ctx);
  dibujarTarjetaDeNivel(ctx);
  dibujarTarjetaDeEtapa(ctx);
  dibujarCartelDeJefe(ctx);
  dibujarAvisoDeBarrera(ctx);
}

// ============================================================
//  EL BUCLE PRINCIPAL
// ============================================================

// La pantalla se dibuja cada vez que el monitor se actualiza (60 o 100 veces
// por segundo, según la pantalla), pero el juego SIEMPRE avanza en pasos
// fijos de 1/60 de segundo. Así todo va igual de rápido en cualquier pantalla.
const PASO = 1 / 60;
let acumulado = 0;
let ultimoMomento = performance.now();

function bucle(ahora) {
  let transcurrido = Math.max(0, (ahora - ultimoMomento) / 1000);
  ultimoMomento = ahora;
  // Si la pestaña estuvo escondida, no intentamos ponernos al día de golpe
  if (transcurrido > 0.25) transcurrido = 0.25;

  // Cámara lenta: el juego avanza más despacio que el reloj
  const ritmo = Combate.lento > 0 && Juego.estado === 'jugando' ? 0.3 : 1;
  Combate.lento = Math.max(0, Combate.lento - transcurrido);
  Juego.flash = Math.max(0, (Juego.flash || 0) - transcurrido * 2);
  acumulado += transcurrido * ritmo;
  while (acumulado >= PASO) {
    if (actualizar(PASO)) Entrada.finDelPaso();
    acumulado -= PASO;
  }

  Musica.actualizar();
  dibujar(acumulado / PASO);
  requestAnimationFrame(bucle);
}

// Atajos para desarrollar (no guardan nada):
//   index.html?modo=3                          → zona de práctica en ese modo, con teclado
//   index.html?modo=1&nivel=nivel4             → un nivel de la historia
//   index.html?modo=1&nivel=nivel1&cp=2        → ...desde una terminal
//   index.html?modo=1&x=1880                   → y además pone a Jax en ese lugar
//   index.html?escena=intro                    → muestra una escena de la historia
//   index.html?pantalla=controles&modo=3       → abre directo esa pantalla (menu, controles o prueba)
const parametros = new URLSearchParams(location.search);
const modoDeLaDireccion = Number(parametros.get('modo'));
const pantallaDeLaDireccion = parametros.get('pantalla');
if ([1, 2, 3].includes(modoDeLaDireccion)) Juego.modo = modoDeLaDireccion;
if (parametros.has('escena') && ESCENAS[parametros.get('escena')]) {
  mostrarEscena(parametros.get('escena'), () => { Juego.estado = 'menu'; });
} else if (['menu', 'controles', 'prueba'].includes(pantallaDeLaDireccion)) {
  Juego.estado = pantallaDeLaDireccion;
} else if ([1, 2, 3].includes(modoDeLaDireccion)) {
  const nivelId = parametros.get('nivel');
  if (NIVELES[nivelId]) {
    Juego.destino = 'historia';
    Juego.partida = partidaNueva(0, Juego.modo);   // ranura 0: no se guarda
    Juego.partida.nivelId = nivelId;
    Juego.partida.checkpoint = parametros.has('cp') ? Number(parametros.get('cp')) : -1;
    Juego.partida.escenasVistas = Object.keys(ESCENAS);   // los atajos no muestran escenas
    Juego.sinEscenas = true;
  }
  // ?arma=1 a 4: empieza con el Pulsor en ese nivel (para probar)
  const nivelArma = ARMA.NIVELES[Number(parametros.get('arma')) - 1];
  if (nivelArma && Juego.partida) Juego.partida.estadisticas.enemigosDerrotados = nivelArma.bajas;
  else if (nivelArma) Juego.armaPractica = { balas: ARMA.BALAS_MAXIMAS, bajas: nivelArma.bajas };
  empezarNivel({ reiniciarEstadisticas: true });
  const xInicial = Number(parametros.get('x'));
  if (xInicial > 0) {
    for (const [p, x] of [[Juego.jax, xInicial], [Juego.elena, xInicial - 50]]) {
      if (!p) continue;
      reaparecerEn(p, x, Juego.nivel.inicio.y);
      p.parpadeo = 0;
    }
    // Los mensajes de lo que quedó atrás no se dicen, y las emboscadas de atrás ya se ganaron
    Juego.nivel.radio.forEach((r, i) => { if (r.x < xInicial) Juego.radioDicha.add(i); });
    for (const em of Juego.emboscadas) if (em.hasta < xInicial) em.estado = 'ganada';
    if (Juego.persecucion) Juego.persecucion.x = xInicial - 650;
    limpiarRadio();
    Camara.colocar(seguidosPorLaCamara(), Juego.nivel);
  }
}

requestAnimationFrame(bucle);
