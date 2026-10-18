// ============================================================
//  SPRITES: los dibujos que eligió el creador del juego
//  Están en la carpeta img/ (se recortaron de sus fotos con
//  herramientas/recortar-sprites.js). Son archivos de esta PC:
//  no se baja nada de internet.
//
//  Si una imagen no carga, el juego no se rompe: cada personaje
//  tiene un dibujo "de repuesto" hecho con código.
// ============================================================

// Cada sprite: su archivo y dónde están los pies (de 0 a 1, medido desde la izquierda).
// "pixelado: true" = dibujo chiquito que se agranda: se ve mejor con píxeles bien marcados.
const LISTA_SPRITES = {
  // El protagonista (Jax)
  'jax-pelea':        { centro: 0.47 },
  'jax-frente':       { centro: 0.5 },
  'jax-brazos':       { centro: 0.5 },
  'jax-perfil':       { centro: 0.5 },
  // El villano (Zephyrus)
  'zephyrus-pelea':   { centro: 0.52 },
  'zephyrus-frente':  { centro: 0.5 },
  'zephyrus-brazos':  { centro: 0.5 },
  'zephyrus-perfil':  { centro: 0.5 },
  // Los enemigos
  caperucita: { centro: 0.5, pixelado: true },
  caballero:  { centro: 0.5, pixelado: true },
  ninja:      { centro: 0.5, pixelado: true },
  chico:      { centro: 0.5, pixelado: true },
  goblin:     { centro: 0.5, pixelado: true },
  esqueleto:  { centro: 0.5, pixelado: true },
  demonio:    { centro: 0.5, pixelado: true },
  vampiro:    { centro: 0.5, pixelado: true },
  monstruo:   { centro: 0.5, pixelado: true },
  slime:      { centro: 0.5, pixelado: true },
  sombra:     { centro: 0.5, pixelado: true },
  orco:       { centro: 0.5, pixelado: true },
};

const Sprites = {
  imagenes: {},   // nombre → imagen (cuando terminó de cargar)
  tenidos: {},    // copias pintadas de un color (para los clones, la Furia, etc.)
};

function cargarSprites() {
  for (const nombre in LISTA_SPRITES) cargarSprite(nombre, 0);
}

// Si una imagen no carga, lo vuelve a intentar unas veces
function cargarSprite(nombre, intento) {
  const imagen = new Image();
  imagen.onload = () => { Sprites.imagenes[nombre] = imagen; };
  imagen.onerror = () => {
    if (intento < 4) setTimeout(() => cargarSprite(nombre, intento + 1), 500);
  };
  imagen.src = `${window.CARPETA_IMAGENES || "img/"}${nombre}.png`;
}

// La imagen de un sprite, o null si todavía no cargó (o no existe)
function imagenDe(nombre) {
  return Sprites.imagenes[nombre] || null;
}

function hayImagen(nombre) {
  return !!Sprites.imagenes[nombre];
}

// Una copia del sprite pintada de un color: "fuerza" de 0 a 1 dice cuánto se pinta.
// Se fabrica una sola vez y se guarda, así no se pinta en cada cuadro.
function spriteTenido(nombre, color, fuerza) {
  const clave = `${nombre}|${color}|${fuerza}`;
  if (Sprites.tenidos[clave]) return Sprites.tenidos[clave];
  const imagen = imagenDe(nombre);
  if (!imagen) return null;
  const lienzoTenido = document.createElement('canvas');
  lienzoTenido.width = imagen.width;
  lienzoTenido.height = imagen.height;
  const c = lienzoTenido.getContext('2d');
  c.drawImage(imagen, 0, 0);
  c.globalCompositeOperation = 'source-atop';   // pinta solo donde hay dibujo
  c.globalAlpha = fuerza;
  c.fillStyle = color;
  c.fillRect(0, 0, imagen.width, imagen.height);
  Sprites.tenidos[clave] = lienzoTenido;
  return lienzoTenido;
}

// Dibuja un sprite parado con los pies en (x, yPies) y con un alto en píxeles del juego.
// Opciones:
//   mirando: 1 derecha, -1 izquierda (los dibujos originales miran a la derecha)
//   tinte: { color, fuerza } para pintarlo de un color
//   alfa: transparencia (1 = normal)
//   destello: de 0 a 1, lo pone blanco y brillante (al recibir un golpe)
//   rotar: inclinación en radianes · estirarX / estirarY: 1 = normal
// Devuelve false si la imagen no está (así se usa el dibujo de repuesto).
function dibujarSprite(ctx, nombre, x, yPies, alto, opciones = {}) {
  const imagen = imagenDe(nombre);
  if (!imagen) return false;
  const {
    mirando = 1, tinte = null, alfa = 1, destello = 0, rotar = 0, estirarX = 1, estirarY = 1,
  } = opciones;
  const datos = LISTA_SPRITES[nombre];
  const escala = alto / imagen.height;
  const ancho = imagen.width * escala;
  // Al recibir un golpe se pone blanco un instante (un "destello")
  const color = destello > 0.4 ? { color: '#ffffff', fuerza: 0.85 } : tinte;
  const fuente = color ? spriteTenido(nombre, color.color, color.fuerza) : imagen;

  ctx.save();
  ctx.translate(x, yPies);
  ctx.rotate(rotar * mirando);
  ctx.scale(mirando * estirarX, estirarY);
  ctx.globalAlpha *= alfa;
  // Los chiquitos se agrandan con píxeles marcados; los grandes se achican suave
  ctx.imageSmoothingEnabled = !datos.pixelado;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(fuente, -ancho * datos.centro, -alto, ancho, alto);
  ctx.restore();
  return true;
}

// Cuánto mide de ancho un sprite si se dibuja con cierto alto
function anchoDeSprite(nombre, alto) {
  const imagen = imagenDe(nombre);
  return imagen ? imagen.width * (alto / imagen.height) : alto * 0.5;
}

cargarSprites();
