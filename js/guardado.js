// ============================================================
//  GUARDADO: las partidas se guardan en el navegador (localStorage)
//  Es una pequeña base de datos que queda en esta PC: no va a internet.
//  Ojo: queda atada a la dirección http://localhost:8080
//  (con otra dirección o puerto, las partidas no aparecen).
//
//  Cada partida guardada tiene:
//    version, ranura, modo, nivelId, checkpoint (-1 = desde el principio),
//    jax y elena (cómo estaban al pasar por el último checkpoint),
//    estadisticas, completados (niveles terminados), decisiones (para los finales), fecha
// ============================================================

const VERSION_GUARDADO = 1;
const CANTIDAD_DE_RANURAS = 3;

function claveDeRanura(numero) {
  return `remanente.ranura${numero}`;
}

function partidaNueva(ranura, modo) {
  return {
    version: VERSION_GUARDADO,
    ranura,                         // 0 = partida de prueba que no se guarda
    modo,
    nivelId: ORDEN_DE_NIVELES[0],
    checkpoint: -1,
    jax: null,
    elena: null,
    estadisticas: { tiempoJugado: 0, enemigosDerrotados: 0, muertes: 0, jefesVencidos: 0 },
    completados: [],
    decisiones: {},
    escenasVistas: [],              // las escenas de historia que ya se mostraron
    finales: [],                    // los finales conseguidos: 'bueno', 'perfecto', 'oscuro'
    terminado: false,               // ¿ya se terminó el juego alguna vez?
    nucleos: 0,                     // núcleos de energía para el Taller de Elena
    mejoras: {},                    // las mejoras compradas: { punos: 2, corazon: 1, ... }
    balas: 15,                      // las balas del Pulsor de Jax (pasan de un nivel al otro)
    archivos: [],                   // los archivos secretos encontrados
    fecha: new Date().toISOString(),
  };
}

// Si una partida guardada con una versión vieja del juego no tiene algún dato nuevo,
// se completa con los valores de una partida nueva. Así las partidas viejas siguen andando.
function completarPartida(datos) {
  if (!datos || typeof datos !== 'object') return null;
  const base = partidaNueva(datos.ranura || 1, datos.modo || 1);
  const partida = { ...base, ...datos, estadisticas: { ...base.estadisticas, ...(datos.estadisticas || {}) } };
  // Las partidas de antes de que existiera la historia ya pasaron la escena del principio
  if (!Array.isArray(datos.escenasVistas)) partida.escenasVistas = datos.nivelId && datos.nivelId !== 'nivel1' ? ['intro'] : [];
  if (!Array.isArray(partida.finales)) partida.finales = [];
  if (!partida.decisiones || typeof partida.decisiones !== 'object') partida.decisiones = {};
  if (!partida.mejoras || typeof partida.mejoras !== 'object') partida.mejoras = {};
  if (!Array.isArray(partida.archivos)) partida.archivos = [];
  if (typeof partida.nucleos !== 'number') partida.nucleos = 0;
  if (typeof partida.balas !== 'number') partida.balas = 15;
  if (!NIVELES[partida.nivelId]) partida.nivelId = ORDEN_DE_NIVELES[0];
  partida.version = VERSION_GUARDADO;
  return partida;
}

function leerRanura(numero) {
  try {
    const texto = localStorage.getItem(claveDeRanura(numero));
    return texto ? completarPartida(JSON.parse(texto)) : null;
  } catch (error) {
    return null;
  }
}

function escribirRanura(numero, partida) {
  try {
    const datos = { ...partida, ranura: numero, version: VERSION_GUARDADO, fecha: new Date().toISOString() };
    localStorage.setItem(claveDeRanura(numero), JSON.stringify(datos));
    return true;
  } catch (error) {
    avisar('No se pudo guardar: el navegador no lo permite');
    return false;
  }
}

function borrarRanura(numero) {
  try {
    localStorage.removeItem(claveDeRanura(numero));
  } catch (error) { /* si no se puede, no pasa nada */ }
}

function todasLasRanuras() {
  const lista = [];
  for (let n = 1; n <= CANTIDAD_DE_RANURAS; n++) lista.push(leerRanura(n));
  return lista;
}

function partidaMasReciente() {
  const partidas = todasLasRanuras().filter(Boolean);
  partidas.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
  return partidas[0] || null;
}

// Guarda la partida que se está jugando (si tiene ranura)
function guardarPartida() {
  const partida = Juego.partida;
  if (!partida || !partida.ranura) return;
  escribirRanura(partida.ranura, partida);
}

// Una "foto" de Jax y Elena para guardar en el checkpoint
function fotoDeJax(jax) {
  return { vida: jax.vida, degradacion: jax.degradacion, inyectores: jax.inyectores, carga: jax.carga, balas: jax.balas };
}

function fotoDeElena(elena) {
  return elena ? { vida: elena.vida, carga: elena.carga } : null;
}

// Texto corto para mostrar en las ranuras
function resumenDePartida(partida) {
  const nivel = NIVELES[partida.nivelId];
  const minutos = Math.floor(partida.estadisticas.tiempoJugado / 60);
  const fecha = new Date(partida.fecha).toLocaleDateString('es');
  const finales = partida.finales.length > 0 ? ` · ★ ${partida.finales.length}/3 finales` : '';
  return `${nivel.acto}: ${nivel.nombre} · Modo ${partida.modo} · ${minutos} min${finales} · ${fecha}`;
}

// ---------- Copia de seguridad en un archivo ----------

// Descarga la partida como archivo .json (queda en la carpeta Descargas)
function exportarRanura(numero) {
  const partida = leerRanura(numero);
  if (!partida) {
    avisar('Esa ranura está vacía');
    return;
  }
  const archivo = new Blob([JSON.stringify(partida, null, 2)], { type: 'application/json' });
  const enlace = document.createElement('a');
  enlace.href = URL.createObjectURL(archivo);
  enlace.download = `remanente-ranura${numero}.json`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(enlace.href), 2000);
  avisar(`Partida de la ranura ${numero} exportada: mirá en Descargas`);
}

// Abre la ventana para elegir un archivo .json y lo guarda en la ranura
function importarEnRanura(numero) {
  const selector = document.createElement('input');
  selector.type = 'file';
  selector.accept = '.json,application/json';
  selector.onchange = () => {
    const archivo = selector.files[0];
    if (!archivo) return;
    archivo.text()
      .then((texto) => {
        const datos = completarPartida(JSON.parse(texto));
        if (!datos) throw new Error('no es una partida');
        escribirRanura(numero, datos);
        avisar(`Partida importada en la ranura ${numero}`);
      })
      .catch(() => avisar('Ese archivo no es una partida de Remanente'));
  };
  selector.click();
}
