// ============================================================
//  IA: personajes manejados por la computadora (Modo 2)
//  La IA "aprieta botones" igual que un jugador: devuelve los mismos
//  controles que leerControles(), así se mueve y pelea con las mismas reglas.
//    - Elena bot: sigue a Jax, dispara, congela al que está por pegarle, lo cura y pone la torreta.
//    - Jax bot (cuando el jugador maneja a Elena): pelea cerca de ella.
// ============================================================

const IA = {
  TOLERANCIA: 24,         // si está así de cerca de su lugar, se queda quieto
  CERCA: 200,             // a menos de esto "está cerca" del líder
  DISTANCIA_MAXIMA: 700,  // más lejos que esto se teletransporta junto al líder
};

const IA_ELENA = {
  DISTANCIA: 70,          // qué tan detrás de Jax se queda
  ALCANCE_DISPARO: 450,
};

const IA_JAX = {
  DISTANCIA: -60,         // negativo = se pone DELANTE de Elena, para protegerla
  VISION: 380,            // a qué distancia va a buscar enemigos
  CORREA: 450,            // no se aleja de Elena más que esto
};

// Caminar hasta un lugar cerca del líder, saltando paredes y pozos
function controlesSeguir(bot, lider, nivel, distancia) {
  const c = sinControles();
  const centroBot = bot.x + bot.ancho / 2;
  const centroLider = lider.x + lider.ancho / 2;
  const piesBot = bot.y + bot.alto;
  const piesLider = lider.y + lider.alto;
  const cerca = Math.abs(centroLider - centroBot) < IA.CERCA;

  // 1. Caminar hacia su lugar
  const destino = centroLider - lider.mirando * distancia;
  const falta = destino - centroBot;
  if (Math.abs(falta) > IA.TOLERANCIA) {
    c.derecha = falta > 0;
    c.izquierda = falta < 0;
  }
  saltarSiHaceFalta(bot, c, nivel, piesLider);

  // 2. Si el líder está más arriba y cerca, salta para alcanzarlo
  if (bot.enElSuelo && cerca && lider.enElSuelo && piesLider < piesBot - 40) c.saltarRecien = true;
  c.saltar = c.saltarRecien || bot.vy < 0;   // mantiene apretado para saltar alto

  // 3. Si el líder está más abajo, se baja de las plataformas finas
  if (cerca && piesLider > piesBot + 40 && bot.sueloEsFino) c.bajar = true;
  return c;
}

// Si camina contra una pared, o hacia un pozo (y el líder no está abajo), salta
function saltarSiHaceFalta(bot, c, nivel, piesLider) {
  const direccion = c.derecha ? 1 : c.izquierda ? -1 : 0;
  if (!bot.enElSuelo || direccion === 0) return;
  const piesBot = bot.y + bot.alto;
  const adelante = bot.x + bot.ancho / 2 + direccion * (bot.ancho / 2 + 16);
  const hayPozo = !hayPlataformaDebajo(adelante, piesBot, nivel.plataformas, 200);
  const liderNoEstaAbajo = piesLider <= piesBot + 20;
  if ((hayPozo && liderNoEstaAbajo) || bot.chocoPared) c.saltarRecien = true;
}

// Enemigos que vale la pena atacar (el muñeco de práctica no)
// (tampoco los tubos de gas, ni los que están invisibles o fuera de alcance)
function enemigosDeVerdad(enemigos) {
  return enemigos.filter((e) => e.estado !== 'derrotado' && !e.t.INMORTAL && !e.t.OBJETO && !e.invisible && !e.inalcanzable);
}

// El enemigo más cercano a la altura del personaje, dentro de un alcance
function enemigoMasCercano(p, enemigos, alcance) {
  let elegido = null;
  let mejor = alcance;
  for (const e of enemigosDeVerdad(enemigos)) {
    const distancia = Math.abs(centroDe(e).x - centroDe(p).x);
    const aSuAltura = Math.abs(piesDe(e) - piesDe(p)) < 70;
    if (aSuAltura && distancia < mejor) {
      mejor = distancia;
      elegido = e;
    }
  }
  return elegido;
}

function contarEnemigosCerca(p, enemigos, radio) {
  return enemigosDeVerdad(enemigos).filter((e) => separacion(p, e) < radio && Math.abs(piesDe(e) - piesDe(p)) < 80).length;
}

function lado(desde, hacia) {
  return centroDe(hacia).x >= centroDe(desde).x ? 1 : -1;
}

// ---------- Elena bot ----------

function controlesElenaBot(elena, jax, enemigos, nivel) {
  // En la pelea final, lo más importante es hackear las consolas
  const consola = consolaParaHackear(elena);
  const c = consola ? controlesIrA(elena, consola.x, nivel) : controlesSeguir(elena, jax, nivel, IA_ELENA.DISTANCIA);
  if (jax.seCayo || jax.vida <= 0) return c;

  // Dispara al enemigo más cercano. Si Jax está cerca, se planta para disparar tranquila.
  const objetivo = enemigoMasCercano(elena, enemigos, IA_ELENA.ALCANCE_DISPARO);
  if (objetivo) {
    c.apuntar = lado(elena, objetivo);
    c.ataque = true;
    if (!consola && Math.abs(centroDe(jax).x - centroDe(elena).x) < 220) {
      c.izquierda = false;
      c.derecha = false;
    }
  }

  // Congela al enemigo que está por pegarle a Jax
  const peligro = enemigosDeVerdad(enemigos).find((e) =>
    e.estado === 'prepara' && separacion(e, jax) < 60 && Math.abs(centroDe(e).x - centroDe(elena).x) < 500);
  if (peligro && elena.recargas.hielo <= 0) {
    c.habilidad1Recien = true;
    c.apuntar = lado(elena, peligro);
  }

  // Cura a Jax si le queda poca vida o el suero está muy alto
  const jaxMal = jax.vida < jax.stats.VIDA * 0.35 || jax.degradacion > 80;
  if (jaxMal && elena.recargas.cura <= 0) c.habilidad2Recien = true;

  // Pone la torreta si hay al menos 2 enemigos cerca
  if (elena.carga >= 100 && contarEnemigosCerca(elena, enemigos, 250) >= 2) c.definitivaRecien = true;
  return c;
}

// La consola sin hackear más cercana (solo en la última fase de Zephyrus)
function consolaParaHackear(elena) {
  if (typeof Juego === 'undefined' || !Juego.consolas) return null;
  return consolaSinHackear(centroDe(elena).x);
}

// Caminar hasta un lugar (saltando paredes) y quedarse ahí
function controlesIrA(bot, x, nivel) {
  const c = sinControles();
  const falta = x - centroDe(bot).x;
  if (Math.abs(falta) > 14) {
    c.derecha = falta > 0;
    c.izquierda = falta < 0;
  }
  saltarSiHaceFalta(bot, c, nivel, piesDe(bot));
  c.saltar = c.saltarRecien || bot.vy < 0;
  return c;
}

// ---------- Jax bot ----------

function controlesJaxBot(jax, elena, enemigos, nivel) {
  const lejosDeElena = Math.abs(centroDe(jax).x - centroDe(elena).x) > IA_JAX.CORREA;
  const objetivo = enemigoMasCercano(jax, enemigos, IA_JAX.VISION);
  if (!objetivo || lejosDeElena || elena.seCayo) return controlesSeguir(jax, elena, nivel, IA_JAX.DISTANCIA);

  const c = sinControles();
  const hacia = lado(jax, objetivo);
  const distancia = separacion(jax, objetivo);

  // Acercarse (o darse vuelta) hasta tenerlo al alcance del puño
  if (distancia > 24 || jax.mirando !== hacia) {
    c.derecha = hacia > 0;
    c.izquierda = hacia < 0;
  }
  saltarSiHaceFalta(jax, c, nivel, piesDe(objetivo));
  c.saltar = c.saltarRecien || jax.vy < 0;

  const deFrente = jax.mirando === hacia;
  if (distancia <= 24 && deFrente) c.ataqueRecien = true;

  // Si el enemigo está lejos, enfrente y a su altura, le dispara con el Pulsor
  const aSuAltura = Math.abs(piesDe(objetivo) - piesDe(jax)) < 50;
  if (deFrente && aSuAltura && distancia > 140 && distancia < 480 && jax.balas > 4) c.disparar = true;

  // Onda Sísmica si hay 2 o más enemigos cerca
  if (jax.recargas.onda <= 0 && contarEnemigosCerca(jax, enemigos, 100) >= 2) c.habilidad1Recien = true;

  // Embestida contra un enemigo congelado o cargado de plasma: ¡sinergia!
  const preparado = objetivo.estado === 'congelado' || objetivo.marcaPlasma > 0;
  if (preparado && deFrente && distancia > 40 && distancia < 220 && jax.recargas.embestida <= 0) c.habilidad2Recien = true;

  // Furia si está cargada y hay pelea
  if (jax.carga >= 100 && contarEnemigosCerca(jax, enemigos, 150) >= 1) c.definitivaRecien = true;
  return c;
}

// ¿El bot quedó muy lejos de su líder? Si está lejísimos, o un poco lejos
// durante 2 segundos seguidos, se teletransporta junto a él.
function botSePerdio(bot, lider, dt) {
  const distancia = Math.hypot(bot.x - lider.x, bot.y - lider.y);
  bot.tiempoLejos = distancia > 350 ? (bot.tiempoLejos || 0) + dt : 0;
  return distancia > IA.DISTANCIA_MAXIMA || bot.tiempoLejos > 2;
}
