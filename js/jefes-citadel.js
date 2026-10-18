// ============================================================
//  JEFES DEL ACTO 3 (la Citadel Génesis)
//
//  PROTO-JAX ALFA (minijefe del Nivel 8): el primer clon de Jax, más grande y rojo.
//    Pelea con el combo, la Embestida (se agacha y brilla antes) y salta para hacer
//    su propia Onda Sísmica. Con la mitad de la vida entra en Furia.
//
//  ZEPHYRUS (jefe final, Nivel 9), en 3 fases:
//    1. ARMADURA MECHA: misiles (círculos rojos), láser (bajo: saltalo · alto: quedate
//       en el piso), pisotón con ondas y manotazo.
//    2. SUPERHUMANO: rapidísimo. Ráfagas que te atraviesan (brilla antes), combos,
//       orbes violetas que te siguen despacio. Si se cubre, no le pegues de frente.
//    3. CRONÓMETRO MORTAL: 60 segundos. Jax tiene Furia todo el tiempo (pero pierde vida).
//       Pilares de energía salen del piso (brillan antes). Aparecen 3 CONSOLAS:
//       si se hackean todas (Elena, o Jax en el Modo 1), se puede reprogramar el chip
//       de la cura → Final Perfecto. Si el tiempo llega a 0 → Final Oscuro.
// ============================================================

// ============================================================
//  PROTO-JAX ALFA
// ============================================================
TIPOS_ENEMIGOS.protojax = {
  ...TIPOS_ENEMIGOS.clonJax,
  nombre: 'Proto-Jax Alfa',
  JEFE: true,
  TEXTO_OBJETIVO: 'SOY LO QUE VOS DEBERÍAS HABER SIDO',
  ANCHO: 38,
  ALTO: 72,
  ALTO_SPRITE: 92,
  VIDA: 440,
  PESADO: 0.15,
  TIEMPO_ATURDIDO: 0,
  RESISTENCIA_HIELO: 0.5,
  VELOCIDAD_PERSECUCION: 230,
  ALCANCE: 28,
  GOLPES: 3,
  DANIO_GOLPE: 9,
  DANIO_EMBESTIDA: 15,
  RECARGA_EMBESTIDA: 3,
  DANIO_ONDA: 14,
  RECUPERAR: 0.65,
  TINTE: { color: '#ff1f3a', fuerza: 0.38 },
  ENERGIA: 'rgba(255, 50, 70, ALFA)',
  actualizar: actualizarProtoJax,
  dibujar: dibujarClonJax,
};

function actualizarProtoJax(e, jugadores, nivel, dt) {
  const t = e.t;
  if (e.estado === 'dormido') return moverEnemigo(e, nivel, dt, 0);
  if (e.estado === 'presentacion') {
    if (e.tiempoEstado >= 1.4) cambiarEstado(e, 'persigue');
    return moverEnemigo(e, nivel, dt, 0);
  }
  if (e.estado === 'derrotado') {
    if (Math.random() < dt * 25) chispas(e.x + Math.random() * e.ancho, e.y + Math.random() * e.alto, '#ff3b5a', 3, 180);
    if (e.tiempoEstado >= 2 && !e.eliminar) {
      e.eliminar = true;
      const centro = centroDe(e);
      chispas(centro.x, centro.y, '#ff3b5a', 50, 520);
      ondaExpansiva(centro.x, centro.y, 200, '#ff3b5a', 1);
      Sonido.explosion();
    }
    return moverEnemigo(e, nivel, dt, 0);
  }
  if (e.estado === 'congelado') {
    if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'persigue');
    return moverEnemigo(e, nivel, dt, 0);
  }

  // Con la mitad de la vida: ¡Furia!
  if (revisarSegundaFase(e, '¡PROTO-JAX ENTRA EN FURIA!')) {
    e.furia = true;
    Sonido.furia();
    ondaExpansiva(centroDe(e).x, centroDe(e).y, 200, '#ff3b1f', 1);
  }
  const rapidez = e.furia ? 1.35 : 1;
  e.esperaOnda = Math.max(0, (e.esperaOnda ?? 4) - dt);
  const objetivo = jugadorMasCercano(e, jugadores);

  // Su Onda Sísmica: salta y cae con una onda
  if (e.estado === 'persigue' && e.esperaOnda <= 0 && objetivo && separacion(e, objetivo) < 160 && e.enElSuelo) {
    cambiarEstado(e, 'preparaOnda');
  }
  if (e.estado === 'preparaOnda') {
    if (e.tiempoEstado >= 0.35 / rapidez && e.enElSuelo && !e.saltoOnda) {
      e.saltoOnda = true;
      e.vy = -760;
    }
    if (e.saltoOnda && e.enElSuelo && e.tiempoEstado > 0.5) {
      e.saltoOnda = false;
      const centro = e.x + e.ancho / 2;
      const pies = e.y + e.alto;
      const caja = { x: centro - 140, y: pies - 80, ancho: 280, alto: 84 };
      for (const p of jugadores) if (seTocan(caja, p)) golpearJugador(p, t.DANIO_ONDA, centroDe(p).x > centro ? 1 : -1);
      ondaExpansiva(centro, pies, 140, '#ff3b5a');
      polvo(centro, pies, 20);
      temblar(10);
      Sonido.onda();
      e.esperaOnda = e.furia ? 4 : 6;
      cambiarEstado(e, 'recupera');
    }
    return moverEnemigo(e, nivel, dt, 0);
  }

  const velocidad = actualizarLuchadorJax(e, jugadores, nivel, dt, rapidez);
  // En Furia, encadena una segunda Embestida
  if (e.furia && e.estado === 'recupera' && e.tiempoEstado < dt * 1.5 && e.ultimaFueEmbestida !== true && e.recargaEmbestida > 2) {
    e.ultimaFueEmbestida = true;
    mirarHacia(e, objetivo);
    cambiarEstado(e, 'preparaEmbestida');
  } else if (e.estado === 'persigue') {
    e.ultimaFueEmbestida = false;
  }
  moverEnemigo(e, nivel, dt, velocidad);
}

// ============================================================
//  ZEPHYRUS
// ============================================================
const FASES_ZEPHYRUS = [
  null,
  { nombre: 'Zephyrus · Fase 1: Armadura Mecha', vida: 520, ancho: 110, alto: 130 },
  { nombre: 'Zephyrus · Fase 2: Superhumano', vida: 440, ancho: 36, alto: 72 },
  { nombre: 'Zephyrus · Fase 3: Cronómetro Mortal', vida: 380, ancho: 36, alto: 72 },
];

// Dónde están los puños en el sprite "zephyrus-pelea" (en el tamaño de 80 de alto)
const PUNOS_SPRITE_ZEPHYRUS = { adelante: { x: 17, y: -63 }, atras: { x: -11, y: -48 } };
const TIEMPO_CRONOMETRO = 60;

TIPOS_ENEMIGOS.zephyrus = {
  nombre: 'Zephyrus',
  JEFE: true,
  FINAL: true,
  TEXTO_OBJETIVO: '¿LA CURA? VENÍ A BUSCARLA',
  ANCHO: 110,
  ALTO: 130,
  VIDA: 520,
  PESADO: 0,
  RESISTENCIA_HIELO: 0.3,
  TIEMPO_ATURDIDO: 0,
  ESCUDO: true,                 // solo cuando se cubre (en las fases 2 y 3)
  TIEMPO_GUARDIA_ROTA: 2,
  // Fase 1
  VELOCIDAD_MECHA: 60,
  DANIO_MANOTAZO: 16,
  DANIO_MISIL: 13,
  DANIO_LASER: 16,
  DANIO_PISOTON: 12,
  // Fases 2 y 3
  VELOCIDAD: 230,
  DANIO_GOLPE: 10,
  DANIO_RAFAGA: 14,
  DANIO_ORBE: 12,
  DANIO_PILAR: 14,
  actualizar: actualizarZephyrus,
  dibujar: dibujarZephyrus,
  alRecibirGolpe: (e) => {
    // En las fases 1 y 2 no muere: pasa a la fase siguiente
    if (e.fase < 3 && e.vida <= 0) {
      e.vida = 1;
      e.inmune = true;
      e.desdeFase = e.fase;   // de qué fase viene (la transición cambia "fase" a la mitad)
      e.marcas = [];
      cambiarEstado(e, 'transicion');
    }
  },
  alBloquear: (e) => {
    // Si le pegás de frente mientras se cubre, aparece detrás tuyo y contraataca
    if (e.estado !== 'guardia') return;
    const p = jugadorMasCercano(e, personajes());
    if (p) aparecerDetrasDe(e, p);
    e.golpeCombo = 0;
    cambiarEstado(e, 'preparaGolpe');
    e.contraataque = true;
  },
};

function cambiarDeFase(e, numero) {
  const fase = FASES_ZEPHYRUS[numero];
  const pies = e.y + e.alto;
  const centro = e.x + e.ancho / 2;
  e.fase = numero;
  e.nombreFase = fase.nombre;
  e.ancho = fase.ancho;
  e.alto = fase.alto;
  e.x = e.xAntes = centro - fase.ancho / 2;
  e.y = e.yAntes = pies - fase.alto;
  e.vida = e.vidaMax = fase.vida;
  e.inmune = false;
  e.sobrecarga = false;
}

// Se teletransporta detrás de un jugador
function aparecerDetrasDe(e, p) {
  const { desde, hasta } = limitesDeArena();
  const x = Math.max(desde, Math.min(hasta - e.ancho, centroDe(p).x - p.mirando * 70 - e.ancho / 2));
  chispas(centroDe(e).x, centroDe(e).y, '#a050ff', 14, 240);
  e.x = e.xAntes = x;
  e.mirando = centroDe(p).x > x ? 1 : -1;
  chispas(centroDe(e).x, centroDe(e).y, '#a050ff', 14, 240);
  Sonido.teletransporte();
}

function actualizarZephyrus(e, jugadores, nivel, dt) {
  if (!e.fase) cambiarDeFase(e, 1);
  e.espera = Math.max(0, (e.espera ?? 1.5) - dt);
  e.escudoAbajo = e.estado !== 'guardia';
  actualizarMarcas(e, dt, e.t.DANIO_MISIL);
  actualizarPilares(e, jugadores, dt);

  const objetivo = jugadorMasCercano(e, jugadores);
  let velocidad = 0;
  let quieto = false;

  if (e.estado === 'dormido') {
    quieto = true;
  } else if (e.estado === 'presentacion') {
    quieto = true;
    if (e.tiempoEstado >= 2) cambiarEstado(e, 'camina');
  } else if (e.estado === 'transicion') {
    quieto = true;
    actualizarTransicion(e, dt);
  } else if (e.estado === 'congelado') {
    quieto = true;
    if (e.tiempoEstado >= duracionDelEstado(e)) cambiarEstado(e, 'camina');
  } else if (e.estado === 'derrotado') {
    quieto = true;
    if (Math.random() < dt * 6) chispas(e.x + Math.random() * e.ancho, e.y + 20 + Math.random() * 40, '#a050ff', 3, 140);
  } else if (e.fase === 1) {
    velocidad = actualizarMecha(e, objetivo, jugadores, dt);
  } else {
    velocidad = actualizarSuperhumano(e, objetivo, jugadores, nivel, dt);
  }

  if (e.estado === 'rafaga') {
    e.vx = velocidad;
  } else {
    e.vx = quieto ? 0 : velocidad * (e.lento ? 0.5 : 1);
  }
  e.vy = Math.min(e.vy + GRAVEDAD * dt, VELOCIDAD_MAX_CAIDA);
  moverConChoques(e, nivel.plataformas, dt, false);
  if (e.enElSuelo) e.pasos += Math.abs(e.vx) * dt;
}

// ---------- Fase 1: la Armadura Mecha ----------

function actualizarMecha(e, objetivo, jugadores, dt) {
  const t = e.t;
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  const rapidez = e.vida < e.vidaMax / 2 ? 1.2 : 1;
  let velocidad = 0;

  switch (e.estado) {
    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      if (distancia < 40) {
        cambiarEstado(e, 'preparaManotazo');
      } else if (e.espera <= 0) {
        const opciones = ['misiles', 'preparaLaser', 'preparaPisoton'];
        cambiarEstado(e, opciones[Math.floor(Math.random() * opciones.length)]);
        if (e.estado === 'preparaLaser') e.laserBajo = Math.random() < 0.5;
      } else {
        velocidad = e.mirando * t.VELOCIDAD_MECHA * rapidez;
        if (Math.floor(e.pasos / 50) !== Math.floor((e.pasos + Math.abs(velocidad) * dt) / 50)) {
          Sonido.jefePaso();
          temblar(2);
        }
      }
      break;
    }
    case 'preparaManotazo':
      if (e.tiempoEstado >= 0.6 / rapidez) {
        cambiarEstado(e, 'manotazo');
        e.golpeados = new Set();
        Sonido.golpeFuerte();
      }
      break;
    case 'manotazo':
      e.cajaAtaque = cajaDelante(e, 90, 90, 30);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_MANOTAZO, jugadores);
      if (e.tiempoEstado >= 0.2) cambiarEstado(e, 'abierto');
      break;
    case 'misiles':
      if (e.tiempoEstado >= 0.8 && !e.lanzo) {
        e.lanzo = true;
        const xs = jugadores.filter((p) => !p.seCayo).map((p) => centroDe(p).x);
        const { desde, hasta } = limitesDeArena();
        while (xs.length < 4) xs.push(desde + Math.random() * (hasta - desde));
        pedirArtilleria(e, xs, t.DANIO_MISIL);
      }
      if (e.tiempoEstado >= 1.3) {
        e.lanzo = false;
        cambiarEstado(e, 'abierto');
      }
      break;
    case 'preparaLaser':
      if (e.tiempoEstado >= 1.0 / rapidez) {
        cambiarEstado(e, 'laser');
        e.golpeados = new Set();
        Sonido.disparoSniper();
        temblar(6);
      }
      break;
    case 'laser': {
      e.cajaAtaque = cajaDelLaser(e);
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_LASER, jugadores);
      if (Math.random() < 0.5) Sonido.hackeo();
      if (e.tiempoEstado >= 0.8) cambiarEstado(e, 'abierto');
      break;
    }
    case 'preparaPisoton':
      if (e.tiempoEstado >= 0.6 / rapidez) {
        lanzarPulsosDesde(centroDe(e).x, e.y + e.alto, t.DANIO_PISOTON, 330, 'rgba(170, 80, 255, 0.55)');
        polvo(centroDe(e).x, e.y + e.alto, 20);
        temblar(12);
        Sonido.onda();
        cambiarEstado(e, 'abierto');
      }
      break;
    case 'abierto':
      if (e.tiempoEstado >= 0.9) {
        cambiarEstado(e, 'camina');
        e.espera = 1.2 + Math.random();
      }
      break;
  }
  return velocidad;
}

// El rayo láser del brazo cañón: bajo (hay que saltarlo) o alto (hay que quedarse en el piso)
function alturaDelLaser(e) {
  return e.laserBajo ? PISO - 22 : PISO - 92;
}

function cajaDelLaser(e) {
  const { desde, hasta } = limitesDeArena();
  const y = alturaDelLaser(e);
  const inicio = centroDe(e).x + e.mirando * 60;
  const fin = e.mirando > 0 ? hasta + 60 : desde - 60;
  return { x: Math.min(inicio, fin), y: y - 10, ancho: Math.abs(fin - inicio), alto: 20 };
}

// ---------- Fases 2 y 3: superhumano ----------

function actualizarSuperhumano(e, objetivo, jugadores, nivel, dt) {
  const t = e.t;
  const hacia = objetivo && centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
  const rapidez = e.fase === 3 ? 1.25 : 1;
  let velocidad = 0;

  switch (e.estado) {
    case 'camina': {
      if (!objetivo) break;
      e.mirando = hacia;
      const distancia = separacion(e, objetivo);
      const mismaAltura = Math.abs(piesDe(objetivo) - piesDe(e)) < 60;
      if (distancia <= 30 && mismaAltura) {
        if (Math.random() < 0.25 && e.espera <= 0) {
          cambiarEstado(e, 'guardia');
          e.espera = 2;
        } else {
          e.golpeCombo = 0;
          e.contraataque = false;
          cambiarEstado(e, 'preparaGolpe');
        }
      } else if (e.espera <= 0) {
        const opciones = ['preparaRafaga', 'orbes'];
        if (e.fase === 3) opciones.push('pilares', 'preparaRafaga');
        cambiarEstado(e, opciones[Math.floor(Math.random() * opciones.length)]);
        e.rafagas = 0;
      } else {
        velocidad = e.mirando * t.VELOCIDAD * rapidez;
        if (e.enElSuelo && objetivo && piesDe(objetivo) < piesDe(e) - 50 && distancia < 200) e.vy = -880;
      }
      break;
    }
    case 'preparaGolpe':
      if (e.tiempoEstado >= (e.contraataque || e.golpeCombo > 0 ? 0.14 : 0.3) / rapidez) {
        cambiarEstado(e, 'golpe');
        e.golpeados = new Set();
        Sonido.swing();
      }
      break;
    case 'golpe': {
      const ultimo = e.golpeCombo >= 2;
      e.cajaAtaque = cajaDelante(e, ultimo ? 58 : 46, 36, 12);
      velocidad = e.mirando * 80;
      golpearJugadoresEn(e, e.cajaAtaque, ultimo ? t.DANIO_GOLPE * 1.6 : t.DANIO_GOLPE, jugadores);
      if (e.tiempoEstado >= 0.13) {
        if (ultimo) cambiarEstado(e, 'abierto');
        else {
          e.golpeCombo++;
          cambiarEstado(e, 'preparaGolpe');
        }
      }
      break;
    }
    case 'preparaRafaga':
      if (objetivo) e.mirando = hacia;
      if (e.tiempoEstado >= 0.45 / rapidez) {
        cambiarEstado(e, 'rafaga');
        e.golpeados = new Set();
        e.inicioRafaga = centroDe(e).x;
        e.objetivoRafaga = objetivo ? centroDe(objetivo).x + e.mirando * 170 : centroDe(e).x + e.mirando * 300;
        Sonido.teletransporte();
      }
      break;
    case 'rafaga': {
      velocidad = e.mirando * 950;
      e.cajaAtaque = { x: e.x - 6, y: e.y, ancho: e.ancho + 12, alto: e.alto };
      golpearJugadoresEn(e, e.cajaAtaque, t.DANIO_RAFAGA, jugadores);
      estela(centroDe(e).x, e.y + 10 + Math.random() * 50, '#a050ff');
      const paso = (centroDe(e).x - e.objetivoRafaga) * e.mirando >= 0;
      if (paso || e.chocoPared || e.tiempoEstado > 0.6) {
        e.rafagas++;
        const maximo = e.fase === 3 ? 3 : 2;
        if (e.rafagas < maximo && objetivo) {
          e.mirando = centroDe(objetivo).x > centroDe(e).x ? 1 : -1;
          cambiarEstado(e, 'preparaRafaga');
        } else {
          cambiarEstado(e, 'abierto');
        }
      }
      break;
    }
    case 'orbes':
      if (objetivo) e.mirando = hacia;
      for (const momento of [0.4, 0.75]) {
        if (e.tiempoEstado >= momento && e.tiempoEstado - dt < momento && objetivo) {
          const desde = { x: centroDe(e).x + e.mirando * 24, y: e.y + 20 };
          const angulo = Math.atan2(centroDe(objetivo).y - desde.y, centroDe(objetivo).x - desde.x) + (momento > 0.5 ? 0.4 : -0.4);
          lanzarProyectil({
            tipo: 'orbe', deEnemigo: true, danio: t.DANIO_ORBE, ancho: 20, alto: 20, vida: 4.5, atraviesa: true,
            x: desde.x, y: desde.y, vx: Math.cos(angulo) * 230, vy: Math.sin(angulo) * 230, persigue: objetivo,
          });
          Sonido.pem();
        }
      }
      if (e.tiempoEstado >= 1.1) {
        cambiarEstado(e, 'camina');
        e.espera = 1.5;
      }
      break;
    case 'pilares':
      if (e.tiempoEstado >= 0.5 && !e.lanzo) {
        e.lanzo = true;
        const xs = jugadores.filter((p) => !p.seCayo).map((p) => centroDe(p).x);
        const { desde, hasta } = limitesDeArena();
        while (xs.length < 4) xs.push(desde + Math.random() * (hasta - desde));
        e.pilares = (e.pilares || []).concat(xs.map((x) => ({ x, tiempo: 0, golpeados: new Set() })));
        Sonido.pilar();
      }
      if (e.tiempoEstado >= 1) {
        e.lanzo = false;
        cambiarEstado(e, 'camina');
        e.espera = 1.2;
      }
      break;
    case 'guardia':
      if (objetivo) e.mirando = hacia;
      if (e.tiempoEstado >= 1.1) cambiarEstado(e, 'camina');
      break;
    case 'abierto':
      if (e.tiempoEstado >= (e.fase === 3 ? 0.6 : 0.8)) {
        cambiarEstado(e, 'camina');
        e.espera = 1 + Math.random() * 0.8;
      }
      break;
  }
  return velocidad;
}

// Pilares de energía (fase 3): primero brillan en el piso, después salen
const PILAR = { aviso: 0.9, dura: 0.5, ancho: 52, alto: 300 };

function actualizarPilares(e, jugadores, dt) {
  if (!e.pilares) return;
  for (const pi of e.pilares) {
    pi.tiempo += dt;
    if (pi.tiempo < PILAR.aviso) continue;
    if (pi.tiempo - dt < PILAR.aviso) {
      temblar(4);
      Sonido.pilar();
    }
    const caja = { x: pi.x - PILAR.ancho / 2, y: PISO - PILAR.alto, ancho: PILAR.ancho, alto: PILAR.alto };
    for (const p of jugadores) {
      if (pi.golpeados.has(p) || !seTocan(caja, p)) continue;
      if (golpearJugador(p, e.t.DANIO_PILAR, centroDe(p).x > pi.x ? 1 : -1)) pi.golpeados.add(p);
    }
  }
  e.pilares = e.pilares.filter((pi) => pi.tiempo < PILAR.aviso + PILAR.dura);
}

// ---------- Cambios de fase ----------

function actualizarTransicion(e, dt) {
  if (e.desdeFase === 1) {
    // La armadura explota y Zephyrus salta afuera
    if (Math.random() < dt * 16) chispas(e.x + Math.random() * e.ancho, e.y + Math.random() * e.alto, '#ffb347', 8, 300);
    if (e.tiempoEstado >= 1.3 && !e.exploto) {
      e.exploto = true;
      const centro = centroDe(e);
      chispas(centro.x, centro.y, '#ffb347', 50, 600);
      chispas(centro.x, centro.y, '#a050ff', 30, 500);
      ondaExpansiva(centro.x, centro.y, 240, '#ffb347', 1);
      temblar(18);
      Sonido.explosion();
      cambiarDeFase(e, 2);
      e.inmune = true;
      e.vy = -700;
      decirPorRadio('¿Creen que necesito una armadura? ¡YO soy el arma de Genesis!', 'zephyrus');
    }
    if (e.tiempoEstado >= 2.4) {
      e.exploto = false;
      e.inmune = false;
      cambiarEstado(e, 'camina');
    }
  } else if (e.desdeFase === 2) {
    // Se arrodilla... y activa la sobrecarga del reactor
    if (e.tiempoEstado < dt * 1.5) {
      decirPorRadio('¡Si yo no puedo tener la cura, NADIE la va a tener! ¡Sobrecarga del reactor!', 'zephyrus');
      Sonido.risa();
    }
    if (e.tiempoEstado >= 2.2) {
      cambiarDeFase(e, 3);
      empezarCronometro();
      Sonido.alarma();
      temblar(14);
      ondaExpansiva(centroDe(e).x, centroDe(e).y, 300, '#a050ff', 1);
      cambiarEstado(e, 'camina');
      e.espera = 1;
    }
  }
}

// La fase 3: 60 segundos, consolas para hackear y Jax con Furia
function empezarCronometro() {
  Juego.cronometro = TIEMPO_CRONOMETRO;
  const { desde, hasta } = limitesDeArena();
  crearConsolas([desde + 40, (desde + hasta) / 2, hasta - 40]);
  Musica.tocar('final');
  avisar('¡CRONÓMETRO MORTAL! 60 segundos');
  decirPorRadio(Juego.modo === 1
    ? 'Jax, ¡el reactor va a explotar! Tu suero se volvió loco: tenés Furia sin límite. Si te quedás junto a las 3 consolas, puedo reprogramar el chip de la cura desde acá.'
    : '¡El reactor va a explotar! Jax, tenés Furia sin límite: ¡pegale con todo! Yo voy a hackear las 3 consolas para reprogramar el chip de la cura. ¡Cubrime!', 'elena');
}

// ============================================================
//  DIBUJO DE ZEPHYRUS
// ============================================================

function dibujarZephyrus(ctx, e, alfa) {
  dibujarMarcas(ctx, e);
  dibujarPilares(ctx, e);
  const { x, y } = posicionDibujo(e, alfa);
  if (e.fase === 1) {
    dibujarMecha(ctx, e, x, y);
  } else {
    dibujarZephyrusHumano(ctx, e, x, y);
  }
  if (e.estado === 'derrotado') dibujarLaCura(ctx, x + e.ancho / 2 + e.mirando * 50, PISO - 16, e.tiempo);
}

function dibujarPilares(ctx, e) {
  if (!e.pilares) return;
  for (const pi of e.pilares) {
    ctx.save();
    if (pi.tiempo < PILAR.aviso) {
      const fuerza = pi.tiempo / PILAR.aviso;
      ctx.fillStyle = `rgba(170, 80, 255, ${0.2 + fuerza * 0.4 + Math.sin(pi.tiempo * 30) * 0.1})`;
      ctx.beginPath();
      ctx.ellipse(pi.x, PISO - 2, PILAR.ancho / 2 + 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const queda = 1 - (pi.tiempo - PILAR.aviso) / PILAR.dura;
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(pi.x - PILAR.ancho / 2, 0, pi.x + PILAR.ancho / 2, 0);
      g.addColorStop(0, 'rgba(170, 80, 255, 0)');
      g.addColorStop(0.5, `rgba(230, 200, 255, ${0.9 * queda})`);
      g.addColorStop(1, 'rgba(170, 80, 255, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(pi.x - PILAR.ancho / 2, PISO - PILAR.alto, PILAR.ancho, PILAR.alto);
    }
    ctx.restore();
  }
}

// El frasco con la cura (aparece cuando Zephyrus cae)
function dibujarLaCura(ctx, x, y, tiempo) {
  const flota = Math.sin(tiempo * 3) * 4;
  ctx.save();
  ctx.translate(x, y + flota - 10);
  ctx.shadowColor = '#7dff5a';
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(125, 255, 90, 0.8)';
  ctx.beginPath();
  ctx.roundRect(-7, -14, 14, 24, 5);
  ctx.fill();
  ctx.fillStyle = '#d7f4ff';
  ctx.fillRect(-5, -20, 10, 6);
  ctx.fillStyle = '#ff3b3b';                // el chip
  ctx.fillRect(-3, -2, 6, 5);
  ctx.restore();
}

function dibujarMecha(ctx, e, x, y) {
  const t = e.tiempo;
  const cx = x + e.ancho / 2;
  const piso = y + e.alto;
  const paso = e.estado === 'camina' ? Math.sin(e.pasos * 0.06) : 0;
  const explotando = e.estado === 'transicion';

  // El láser: aviso (línea fina) o el rayo
  if (e.estado === 'preparaLaser' || e.estado === 'laser') {
    const caja = cajaDelLaser(e);
    const yLaser = alturaDelLaser(e);
    ctx.save();
    if (e.estado === 'preparaLaser') {
      ctx.strokeStyle = `rgba(255, 90, 150, ${0.6 + Math.sin(t * 30) * 0.35})`;
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 6]);
      ctx.beginPath();
      ctx.moveTo(caja.x, yLaser);
      ctx.lineTo(caja.x + caja.ancho, yLaser);
      ctx.stroke();
      texto(ctx, e.laserBajo ? '¡SALTÁ!' : '¡QUEDATE ABAJO!', cx, y - 40, { tamano: 14, negrita: true, color: '#ff5a8a' });
    } else {
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, yLaser - 12, 0, yLaser + 12);
      g.addColorStop(0, 'rgba(255, 40, 120, 0)');
      g.addColorStop(0.5, 'rgba(255, 220, 240, 0.95)');
      g.addColorStop(1, 'rgba(255, 40, 120, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(caja.x, yLaser - 12, caja.ancho, 24);
    }
    ctx.restore();
  }

  ctx.save();
  ctx.translate(cx, piso);
  ctx.scale(e.mirando, 1);
  if (explotando) ctx.translate(Math.sin(t * 60) * 3, 0);
  if (e.destello > 0) ctx.filter = `brightness(${1 + e.destello * 1.5})`;
  if (e.estado === 'preparaPisoton') ctx.translate(0, -8 * Math.min(1, e.tiempoEstado * 3));

  // Piernas gruesas
  ctx.fillStyle = '#2e2a3a';
  ctx.fillRect(-40 + paso * 5, -46, 24, 46);
  ctx.fillRect(14 - paso * 5, -46, 24, 46);
  ctx.fillStyle = '#1e1a28';
  ctx.fillRect(-46 + paso * 5, -10, 34, 10);
  ctx.fillRect(8 - paso * 5, -10, 34, 10);

  // Brazo de atrás (garra)
  ctx.strokeStyle = '#3a3448';
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  dibujarExtremidad(ctx, -30, -100, 0.4 + paso * 0.2, 36);

  // Torso
  ctx.fillStyle = '#433d55';
  ctx.beginPath();
  ctx.roundRect(-50, -118, 100, 74, 12);
  ctx.fill();
  ctx.fillStyle = '#a050ff';
  ctx.fillRect(-50, -60, 100, 4);
  // Lanzamisiles en los hombros (se abren al disparar)
  const abiertos = e.estado === 'misiles';
  ctx.fillStyle = '#2e2a3a';
  ctx.fillRect(-46, -134 - (abiertos ? 6 : 0), 30, 18);
  ctx.fillRect(16, -134 - (abiertos ? 6 : 0), 30, 18);
  if (abiertos) {
    ctx.fillStyle = '#ff5050';
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(-42 + i * 9, -138, 5, 5);
      ctx.fillRect(20 + i * 9, -138, 5, 5);
    }
  }

  // La cabina de vidrio con Zephyrus adentro (iluminada, para que se lo vea)
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, -114, 34, 34, 0, Math.PI, Math.PI * 2);
  ctx.clip();
  const luz = ctx.createRadialGradient(0, -124, 4, 0, -124, 40);
  luz.addColorStop(0, '#e8dcff');
  luz.addColorStop(1, '#7a5ac0');
  ctx.fillStyle = luz;
  ctx.fillRect(-36, -150, 72, 40);
  dibujarSprite(ctx, 'zephyrus-brazos', 0, -50, 100, { mirando: 1 });
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#ffffff';                     // reflejo del vidrio
  ctx.beginPath();
  ctx.ellipse(-12, -134, 8, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#c9b6ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -114, 34, 34, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  // Brazo cañón (adelante)
  let anguloCanon = 1.5;
  if (e.estado === 'preparaManotazo') anguloCanon = -2.4;
  else if (e.estado === 'manotazo') anguloCanon = 1.9;
  const yHombro = -96;
  if (e.estado === 'preparaLaser' || e.estado === 'laser') {
    // apunta derecho a la altura del láser
    const yLaser = alturaDelLaser(e) - piso;
    anguloCanon = Math.atan2(60, yLaser - yHombro);
  }
  ctx.strokeStyle = '#575070';
  ctx.lineWidth = 16;
  const punta = dibujarExtremidad(ctx, 36, yHombro, anguloCanon, 44);
  ctx.save();
  const cargando = e.estado === 'preparaLaser';
  ctx.shadowColor = '#ff3b8a';
  ctx.shadowBlur = cargando ? 20 + Math.sin(t * 30) * 8 : 6;
  ctx.fillStyle = cargando ? '#ffd0e4' : '#ff3b8a';
  ctx.beginPath();
  ctx.arc(punta.x, punta.y, cargando ? 10 : 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

function poseDeZephyrus(e) {
  const pose = poseNueva('zephyrus-pelea');
  const firme = { atras: 0.32, adelante: -0.22 };
  if (e.enElSuelo && Math.abs(e.vx) > 20 && e.estado !== 'rafaga') {
    pose.mov = movimientoCaminar(e.pasos * 0.05, 0.5);
    pose.rotar = 0.08;
  } else if (!e.enElSuelo) {
    pose.rotar = e.vy < 0 ? -0.07 : 0.08;
    pose.mov = e.vy < 0 ? { atras: 0.45, adelante: -0.6, estirarPiernas: 0.9 } : { atras: 0.2, adelante: -0.3 };
  } else {
    pose.mov = { subir: Math.sin(e.tiempo * 3) * 1.2 };
  }
  if (e.estado === 'preparaGolpe') { pose.mov = { ...firme, brazoX: -8, inclinar: -0.06 }; }
  else if (e.estado === 'golpe') {
    pose.adelante = 5;
    const gancho = e.golpeCombo === 2;
    pose.mov = gancho ? { ...firme, brazoX: 16, brazoY: -34, inclinar: -0.12, subir: 5 } : { ...firme, brazoX: 26, inclinar: 0.16 };
    pose.golpe = gancho ? 'gancho' : 'adelante';
  }
  else if (e.estado === 'preparaRafaga') { pose.estirarY = 0.9; pose.rotar = 0.2; pose.mov = { atras: 0.6, adelante: -0.5 }; }
  else if (e.estado === 'rafaga') { pose.rotar = 0.35; pose.adelante = 4; pose.mov = { atras: 0.85, adelante: -0.45, brazoX: 30 }; }
  else if (e.estado === 'guardia') pose.nombre = 'zephyrus-frente';
  else if (e.estado === 'orbes' || e.estado === 'pilares') { pose.nombre = 'zephyrus-frente'; pose.estirarY = 1.04; }
  else if (e.estado === 'transicion' || e.estado === 'derrotado') { pose.nombre = 'zephyrus-perfil'; pose.rotar = 0.25; pose.estirarY = 0.85; }
  else if (e.estado === 'presentacion' || e.estado === 'dormido') pose.nombre = 'zephyrus-brazos';
  return pose;
}

function dibujarZephyrusHumano(ctx, e, x, y) {
  const pose = poseDeZephyrus(e);
  const fase3 = e.fase === 3;
  const preparando = e.estado === 'preparaRafaga';
  let aura = null;
  if (fase3) aura = { color: 'rgba(160, 60, 255, ALFA)', intensidad: 0.7 + Math.sin(e.tiempo * 10) * 0.3 };
  else if (preparando) aura = { color: 'rgba(160, 60, 255, ALFA)', intensidad: 1 };
  ctx.save();
  if (e.inmune) ctx.globalAlpha = 0.6 + Math.sin(e.tiempo * 30) * 0.3;
  if (!hayImagen('zephyrus-pelea')) {
    ctx.fillStyle = '#4a2a20';
    ctx.fillRect(x, y, e.ancho, e.alto);
  } else {
    dibujarLuchadorJax(ctx, { ...e, aplastado: 0 }, x, y, pose, {
      alto: 90, punos: PUNOS_SPRITE_ZEPHYRUS, colorEnergia: 'rgba(170, 80, 255, ALFA)', aura,
      destello: e.destello, fantasmas: e.estado === 'rafaga', colorFantasma: '#a050ff',
      tinte: fase3 ? { color: '#7a30ff', fuerza: 0.15 } : null,
    });
  }
  // Escudo de energía cuando se cubre
  if (e.estado === 'guardia') {
    ctx.save();
    ctx.strokeStyle = e.escudoRoto > 0 ? '#5b5470' : '#c9a0ff';
    ctx.shadowColor = '#a050ff';
    ctx.shadowBlur = 14;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + e.ancho / 2 + e.mirando * 6, y + e.alto / 2, 46, e.mirando > 0 ? -1.2 : Math.PI - 1.2, e.mirando > 0 ? 1.2 : Math.PI + 1.2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
