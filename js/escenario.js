// ============================================================
//  ESCENARIO: dibuja el fondo, las plataformas, los carteles,
//  los adornos, las terminales, los inyectores y la salida
// ============================================================

// Un número "al azar" entre 0 y 1, pero siempre igual para el mismo n.
// Sirve para que el fondo tenga variedad sin cambiar en cada cuadro.
function azar(n) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

// Los colores y las formas de cada tipo de escenario.
//   cielo: degradé de arriba a abajo
//   lejana / cercana: colores de las dos capas del fondo (cuerpo y lucecitas)
//   forma: qué se dibuja en el fondo ('columnas', 'edificios', 'arboles', 'rocas', 'cristales', 'tanques', 'reactor')
//   piso: colores de las plataformas sólidas (cuerpo, borde) · fina: plataformas finas (cuerpo, borde)
const TEMAS = {
  prueba: {
    cielo: ['#0b1222', '#04060b'], lejana: ['#0d1628', '#1d3552'], cercana: ['#111c31', '#2a6a80'],
    forma: 'columnas', liquido: '80, 255, 200', piso: ['#1a2233', '#3b4d6e'], fina: ['#22304a', '#5fd4ff'],
  },
  laboratorio: {
    cielo: ['#120e18', '#050407'], lejana: ['#19141f', '#3a2030'], cercana: ['#1f1a27', '#6a2a35'],
    forma: 'columnas', liquido: '120, 255, 140', alarma: true, piso: ['#1a2233', '#3b4d6e'], fina: ['#22304a', '#5fd4ff'],
  },
  industrial: {
    cielo: ['#2a160c', '#0a0605'], lejana: ['#24160f', '#7a3a18'], cercana: ['#2e1d14', '#c0601e'],
    forma: 'fabrica', piso: ['#2b2420', '#8a5a2a'], fina: ['#3a2c22', '#ffb347'], rayas: true,
  },
  muralla: {
    cielo: ['#0a1020', '#020308'], lejana: ['#121a2e', '#ffe08a'], cercana: ['#182238', '#5fd4ff'],
    forma: 'edificios', reflectores: true, piso: ['#2a2e36', '#6a7282'], fina: ['#30384a', '#9fb0c8'],
  },
  bosque: {
    cielo: ['#06141a', '#020606'], lejana: ['#0a2224', '#3affd0'], cercana: ['#0c2a22', '#c05aff'],
    forma: 'arboles', luna: true, piso: ['#1e1a14', '#3d7a2a'], fina: ['#3a2a1a', '#7ac74f'],
  },
  pantano: {
    cielo: ['#0e1a12', '#040806'], lejana: ['#14241a', '#6aa86a'], cercana: ['#18281c', '#a6ff4d'],
    forma: 'arbolesSecos', piso: ['#1c1e14', '#4a5a2a'], fina: ['#3a2e1e', '#8a9a4a'],
  },
  barranco: {
    cielo: ['#3a1a3a', '#0e0610'], lejana: ['#2a1426', '#ff8a4a'], cercana: ['#321a22', '#ffb347'],
    forma: 'rocas', luna: true, piso: ['#3a2c26', '#7a6458'], fina: ['#4a382c', '#c09a7a'],
  },
  nieve: {
    cielo: ['#2a3444', '#0c1018'], lejana: ['#3a4658', '#bfefff'], cercana: ['#46546a', '#9fe8ff'],
    forma: 'cristales', piso: ['#3a4250', '#e8f4ff'], fina: ['#4a5466', '#bfefff'],
  },
  clones: {
    cielo: ['#06120e', '#020604'], lejana: ['#0c1c18', '#2affa0'], cercana: ['#10241e', '#7dff5a'],
    forma: 'tanques', liquido: '90, 255, 160', alarma: true, piso: ['#16201e', '#3a6a5a'], fina: ['#1e2c28', '#7dff5a'],
  },
  nucleo: {
    cielo: ['#1a0624', '#06020a'], lejana: ['#220a30', '#c060ff'], cercana: ['#2a0c3a', '#ff4dd2'],
    forma: 'reactor', piso: ['#1c1424', '#a050ff'], fina: ['#2a1a36', '#ff4dd2'],
  },
  // El Expreso Génesis
  estacion: {
    cielo: ['#0c1426', '#03050a'], lejana: ['#141c30', '#ffe08a'], cercana: ['#1a2236', '#ffb347'],
    forma: 'estacion', piso: ['#2a2e36', '#8a929f'], fina: ['#30384a', '#ffd166'], rayas: true,
  },
  trenExterior: {
    cielo: ['#3a2440', '#120a1c'], lejana: ['#2a1a34', '#ff9a6a'], cercana: ['#1e1428', '#ffb347'],
    forma: 'montanas', luna: true, velocidad: 1100, tren: true,
    piso: ['#4a2a2a', '#c9ced8'], fina: ['#3a3f4a', '#ffd166'],
  },
  trenInterior: {
    cielo: ['#1a1410', '#0a0806'], lejana: ['#241c16', '#ffcf8a'], cercana: ['#2c221a', '#ffb347'],
    forma: 'vagon', velocidad: 1100, piso: ['#3a2c22', '#8a6a4a'], fina: ['#4a3828', '#ffd166'],
  },
};

// El fondo tiene capas que se mueven más lento que el nivel.
// Eso se llama PARALLAX y da sensación de profundidad.
function dibujarFondo(ctx, camX, camY, nombreTema, tiempo) {
  const tema = TEMAS[nombreTema] || TEMAS.prueba;
  const cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
  cielo.addColorStop(0, tema.cielo[0]);
  cielo.addColorStop(1, tema.cielo[1]);
  ctx.fillStyle = cielo;
  ctx.fillRect(0, 0, ANCHO, ALTO);

  if (tema.luna) dibujarLuna(ctx, tema, camX);
  if (tema.forma === 'reactor') dibujarReactorDeFondo(ctx, camX, camY, tiempo);
  // Si el escenario "se mueve" (el tren), el fondo corre aunque la cámara esté quieta
  const corrida = tema.velocidad ? tiempo * tema.velocidad : 0;
  dibujarCapaFondo(ctx, camX * 0.2 + corrida * 0.15, camY * 0.1, 260, tema, 0, tiempo); // lejana
  dibujarCapaFondo(ctx, camX * 0.5 + corrida * 0.5, camY * 0.3, 380, tema, 1, tiempo); // cercana
  if (tema.forma === 'vagon') dibujarVentanasDelVagon(ctx, camX, corrida, tiempo);
}

// Adentro del vagón: por las ventanas pasan las luces de afuera, rapidísimo
function dibujarVentanasDelVagon(ctx, camX, corrida, tiempo) {
  const separacion = 240;
  const desplaz = camX * 0.9;
  const primera = Math.floor(desplaz / separacion) - 1;
  for (let i = primera; i < primera + 6; i++) {
    const x = i * separacion - desplaz;
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(x + 40, 150, 120, 70);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 40, 150, 120, 70);
    ctx.clip();
    ctx.fillStyle = 'rgba(255, 200, 120, 0.7)';
    for (let k = 0; k < 4; k++) {
      const lx = x + 40 + ((-(corrida * 1.4) + k * 97 + i * 31) % 160 + 160) % 160;
      ctx.fillRect(lx, 170 + k * 11, 40, 2);
    }
    ctx.restore();
    ctx.strokeStyle = '#5a4430';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 40, 150, 120, 70);
  }
}

function dibujarLuna(ctx, tema, camX) {
  const x = 760 - camX * 0.03;
  ctx.save();
  ctx.shadowColor = tema.forma === 'rocas' ? '#ffb090' : '#d8fff4';
  ctx.shadowBlur = 40;
  ctx.fillStyle = tema.forma === 'rocas' ? '#ffcfa0' : '#e8fff8';
  ctx.beginPath();
  ctx.arc(x, 90, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// El gran reactor del Núcleo Génesis, que late detrás de todo
function dibujarReactorDeFondo(ctx, camX, camY, tiempo) {
  const x = ANCHO / 2 - ((camX * 0.05) % 200);
  const y = 230 - camY * 0.05;
  const late = 0.5 + Math.sin(tiempo * 2) * 0.5;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 10, x, y, 260);
  g.addColorStop(0, `rgba(255, 120, 255, ${0.55 + late * 0.2})`);
  g.addColorStop(0.3, 'rgba(160, 60, 255, 0.35)');
  g.addColorStop(1, 'rgba(60, 0, 90, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, ANCHO, ALTO);
  ctx.strokeStyle = 'rgba(255, 150, 255, 0.35)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y, 90 + i * 40, 24 + i * 10, tiempo * (0.3 + i * 0.2), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// Una capa del fondo, repetida a lo ancho. La forma depende del tema.
function dibujarCapaFondo(ctx, desplazX, desplazY, separacion, tema, capa, tiempo) {
  const [color, colorLuz] = capa === 0 ? tema.lejana : tema.cercana;
  const base = ALTO + 120 - desplazY;
  const primera = Math.floor(desplazX / separacion) - 1;
  const ultima = primera + Math.ceil(ANCHO / separacion) + 2;

  for (let i = primera; i <= ultima; i++) {
    const n = i + capa * 1000;
    const x = i * separacion - desplazX;
    const alto = 160 + azar(n) * 220;
    const ancho = separacion * (0.35 + azar(n * 3) * 0.3);
    ctx.fillStyle = color;
    switch (tema.forma) {
      case 'fabrica': dibujarFabrica(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo); break;
      case 'edificios': dibujarEdificio(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, tema); break;
      case 'arboles': dibujarArbolDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, false); break;
      case 'arbolesSecos': dibujarArbolDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, true); break;
      case 'rocas': dibujarRocaDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa); break;
      case 'cristales': dibujarCristalDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa); break;
      case 'tanques': dibujarTanqueDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, tema); break;
      case 'reactor': dibujarTorreDeReactor(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo); break;
      case 'estacion': dibujarEstacionDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa); break;
      case 'montanas': dibujarMontanaDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa); break;
      case 'vagon': dibujarCargaDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa); break;
      default: dibujarColumna(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, tema);
    }
  }
}

function dibujarColumna(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, tema) {
  ctx.fillRect(x, base - alto, ancho, alto + 200);
  // Lucecitas de la columna
  ctx.fillStyle = colorLuz;
  for (let j = 0; j < 3; j++) ctx.fillRect(x + 12 + j * 16, base - alto + 18, 6, 4);
  // Luces de alarma que titilan
  if (tema.alarma && capa === 0) {
    const brillo = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(tiempo * 4 + n));
    ctx.fillStyle = `rgba(255, 50, 50, ${brillo})`;
    ctx.beginPath();
    ctx.arc(x + ancho / 2, base - alto - 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  // En la capa cercana, algunos tanques con líquido brillante
  if (capa === 1 && azar(n * 7) > 0.5) {
    const tx = x + ancho + 30;
    ctx.fillStyle = `rgba(${tema.liquido}, 0.07)`;
    ctx.fillRect(tx, base - 230, 70, 150);
    ctx.strokeStyle = `rgba(${tema.liquido}, 0.25)`;
    ctx.lineWidth = 2;
    ctx.strokeRect(tx, base - 230, 70, 150);
  }
}

// Galpones con chimeneas que echan humo
function dibujarFabrica(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo) {
  const altoGalpon = alto * 0.55;
  ctx.fillRect(x, base - altoGalpon, ancho * 1.4, altoGalpon + 200);
  // Techo en serrucho
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const px = x + k * ancho * 0.46;
    ctx.moveTo(px, base - altoGalpon);
    ctx.lineTo(px + ancho * 0.46, base - altoGalpon - 30);
    ctx.lineTo(px + ancho * 0.46, base - altoGalpon);
  }
  ctx.fill();
  // Chimenea
  const cx = x + ancho * 0.2;
  ctx.fillRect(cx, base - alto - 40, 22, alto);
  // Humo
  ctx.save();
  ctx.fillStyle = 'rgba(120, 100, 90, 0.06)';
  for (let k = 0; k < 4; k++) {
    const sube = (tiempo * 14 + k * 30 + n * 7) % 120;
    ctx.beginPath();
    ctx.arc(cx + 11 + Math.sin(sube * 0.05 + n) * 10, base - alto - 50 - sube, 12 + sube * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // Ventanas encendidas
  ctx.fillStyle = colorLuz;
  ctx.globalAlpha = 0.6;
  for (let k = 0; k < 4; k++) if (azar(n * 11 + k) > 0.4) ctx.fillRect(x + 14 + k * 22, base - altoGalpon + 24, 12, 8);
  ctx.globalAlpha = 1;
}

// Edificios de la ciudad con ventanas, y reflectores que barren el cielo
function dibujarEdificio(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, tema) {
  ctx.fillRect(x, base - alto, ancho, alto + 200);
  ctx.fillStyle = colorLuz;
  ctx.globalAlpha = capa === 0 ? 0.35 : 0.5;
  for (let fy = 0; fy < alto - 30; fy += 22) {
    for (let fx = 8; fx < ancho - 10; fx += 16) {
      if (azar(n * 13 + fx + fy) > 0.55) ctx.fillRect(x + fx, base - alto + 14 + fy, 7, 9);
    }
  }
  ctx.globalAlpha = 1;
  if (tema.reflectores && capa === 0 && azar(n * 5) > 0.6) {
    const angulo = Math.sin(tiempo * 0.7 + n) * 0.6 - Math.PI / 2;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x + ancho / 2, base - alto, x + ancho / 2 + Math.cos(angulo) * 500, base - alto + Math.sin(angulo) * 500);
    g.addColorStop(0, 'rgba(255, 240, 180, 0.18)');
    g.addColorStop(1, 'rgba(255, 240, 180, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x + ancho / 2, base - alto);
    ctx.lineTo(x + ancho / 2 + Math.cos(angulo - 0.08) * 600, base - alto + Math.sin(angulo - 0.08) * 600);
    ctx.lineTo(x + ancho / 2 + Math.cos(angulo + 0.08) * 600, base - alto + Math.sin(angulo + 0.08) * 600);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Árboles del bosque (con plantas que brillan) o árboles secos del pantano
function dibujarArbolDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, seco) {
  const tx = x + ancho / 2;
  ctx.fillRect(tx - 8, base - alto, 16, alto + 200);
  if (seco) {
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 5;
    for (let k = 0; k < 4; k++) {
      const y = base - alto + 20 + k * 30;
      const lado = k % 2 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(tx, y);
      ctx.lineTo(tx + lado * (30 + azar(n + k) * 30), y - 25);
      ctx.stroke();
    }
  } else {
    // Copa en capas
    for (let k = 0; k < 3; k++) {
      ctx.beginPath();
      ctx.moveTo(tx - ancho * 0.6 + k * 10, base - alto * (0.45 - k * 0.15));
      ctx.lineTo(tx, base - alto - 60 - k * 10);
      ctx.lineTo(tx + ancho * 0.6 - k * 10, base - alto * (0.45 - k * 0.15));
      ctx.fill();
    }
  }
  // Puntitos que brillan (hongos, luciérnagas, ojos...)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const brillo = 0.3 + 0.3 * Math.sin(tiempo * 2 + n + k);
    ctx.fillStyle = colorLuz;
    ctx.globalAlpha = brillo * (capa === 0 ? 0.6 : 1);
    ctx.beginPath();
    ctx.arc(tx - 30 + azar(n * 3 + k) * 60, base - 60 - azar(n * 5 + k) * alto * 0.6, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Paredes de roca del barranco
function dibujarRocaDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa) {
  ctx.beginPath();
  ctx.moveTo(x - 40, base + 200);
  ctx.lineTo(x - 10, base - alto * 0.7);
  ctx.lineTo(x + ancho * 0.3, base - alto);
  ctx.lineTo(x + ancho * 0.7, base - alto * 0.85);
  ctx.lineTo(x + ancho + 40, base - alto * 0.4);
  ctx.lineTo(x + ancho + 60, base + 200);
  ctx.fill();
  ctx.strokeStyle = colorLuz;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 10, base - alto * 0.7);
  ctx.lineTo(x + ancho * 0.3, base - alto);
  ctx.lineTo(x + ancho * 0.7, base - alto * 0.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Torres de cristal de la Citadel
function dibujarCristalDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa) {
  ctx.beginPath();
  ctx.moveTo(x, base + 200);
  ctx.lineTo(x, base - alto);
  ctx.lineTo(x + ancho / 2, base - alto - 50);
  ctx.lineTo(x + ancho, base - alto);
  ctx.lineTo(x + ancho, base + 200);
  ctx.fill();
  ctx.strokeStyle = colorLuz;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + ancho / 2, base - alto - 50);
  ctx.lineTo(x + ancho / 2, base);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Tanques de clonación con siluetas adentro
function dibujarTanqueDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo, tema) {
  ctx.fillRect(x, base - alto, ancho * 0.25, alto + 200);   // caños
  const tx = x + ancho * 0.4;
  const altoTanque = 150;
  const ty = base - 120 - altoTanque;
  ctx.fillStyle = `rgba(${tema.liquido}, ${capa === 0 ? 0.06 : 0.1})`;
  ctx.fillRect(tx, ty, 70, altoTanque);
  ctx.strokeStyle = `rgba(${tema.liquido}, 0.3)`;
  ctx.lineWidth = 2;
  ctx.strokeRect(tx, ty, 70, altoTanque);
  // Silueta de un clon flotando
  ctx.fillStyle = `rgba(0, 0, 0, ${capa === 0 ? 0.25 : 0.4})`;
  const flota = Math.sin(tiempo + n) * 4;
  ctx.beginPath();
  ctx.arc(tx + 35, ty + 40 + flota, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(tx + 27, ty + 50 + flota, 16, 50);
  // Burbujas
  ctx.fillStyle = `rgba(${tema.liquido}, 0.35)`;
  for (let k = 0; k < 3; k++) {
    const by = ty + altoTanque - ((tiempo * 30 + k * 40 + n * 13) % altoTanque);
    ctx.fillRect(tx + 12 + k * 18, by, 3, 3);
  }
}

// Torres de energía del Núcleo Génesis
function dibujarTorreDeReactor(ctx, x, base, alto, ancho, colorLuz, n, capa, tiempo) {
  ctx.fillRect(x + ancho * 0.3, base - alto, ancho * 0.4, alto + 200);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const late = 0.4 + 0.4 * Math.sin(tiempo * 3 + n);
  ctx.fillStyle = colorLuz;
  ctx.globalAlpha = late * (capa === 0 ? 0.4 : 0.7);
  ctx.fillRect(x + ancho * 0.48, base - alto, ancho * 0.04, alto);
  ctx.restore();
}

// La estación: columnas con lámparas colgando
function dibujarEstacionDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa) {
  if (capa === 0) {
    ctx.fillRect(x, base - alto, ancho, alto + 200);              // edificios de atrás
    ctx.fillStyle = colorLuz;
    ctx.globalAlpha = 0.3;
    for (let fy = 20; fy < alto - 20; fy += 26) if (azar(n + fy) > 0.5) ctx.fillRect(x + 10, base - alto + fy, ancho - 20, 4);
    ctx.globalAlpha = 1;
    return;
  }
  ctx.fillRect(x, base - 420, 22, 600);                            // columna
  ctx.fillRect(x - 60, base - 430, 400, 16);                       // techo del andén
  ctx.strokeStyle = ctx.fillStyle;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 120, base - 414);
  ctx.lineTo(x + 120, base - 360);
  ctx.stroke();
  ctx.save();
  ctx.shadowColor = colorLuz;
  ctx.shadowBlur = 16;
  ctx.fillStyle = colorLuz;
  ctx.beginPath();
  ctx.arc(x + 120, base - 356, 7, 0, Math.PI * 2);                  // lámpara
  ctx.fill();
  ctx.restore();
}

// Montañas y árboles que pasan rápido detrás del tren
function dibujarMontanaDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa) {
  if (capa === 0) {
    ctx.beginPath();
    ctx.moveTo(x - 80, base + 200);
    ctx.lineTo(x + ancho * 0.5, base - alto - 40);
    ctx.lineTo(x + ancho + 120, base + 200);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';                    // nieve en la punta
    ctx.beginPath();
    ctx.moveTo(x + ancho * 0.5, base - alto - 40);
    ctx.lineTo(x + ancho * 0.5 - 22, base - alto);
    ctx.lineTo(x + ancho * 0.5 + 24, base - alto);
    ctx.fill();
    return;
  }
  // Pinos y postes cerquita, que pasan volando
  ctx.beginPath();
  ctx.moveTo(x, base - 60);
  ctx.lineTo(x + 30, base - 200 - azar(n) * 80);
  ctx.lineTo(x + 60, base - 60);
  ctx.fill();
  ctx.fillRect(x + 200, base - 260, 6, 260);
  ctx.fillRect(x + 186, base - 252, 34, 4);
}

// Cajas y bolsas de la carga, adentro del vagón
function dibujarCargaDeFondo(ctx, x, base, alto, ancho, colorLuz, n, capa) {
  if (capa === 0) {
    ctx.fillRect(x, base - 520, ancho + 140, 700);                  // la pared del vagón
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x, base - 520, 8, 700);                            // costillas de metal
    return;
  }
  const altoCaja = 60 + azar(n) * 60;
  ctx.fillRect(x, base - 120 - altoCaja, 90, altoCaja);
  ctx.strokeStyle = colorLuz;
  ctx.globalAlpha = 0.25;
  ctx.strokeRect(x + 4, base - 116 - altoCaja, 82, altoCaja - 8);
  ctx.globalAlpha = 1;
}

// ---------- Plataformas ----------

function dibujarPlataformas(ctx, plataformas, tiempo, nombreTema) {
  const tema = TEMAS[nombreTema] || TEMAS.prueba;
  for (const p of plataformas) {
    if (p.puerta) {
      // Puerta de energía (sala del jefe o emboscada)
      ctx.fillStyle = 'rgba(255, 50, 50, 0.25)';
      ctx.fillRect(p.x, p.y, p.ancho, p.alto);
      ctx.fillStyle = 'rgba(255, 90, 90, 0.6)';
      for (let y = p.y + ((tiempo * 120) % 24); y < p.y + p.alto; y += 24) ctx.fillRect(p.x, y, p.ancho, 3);
    } else if (p.tipo === 'solida' && p.vagon) {
      dibujarVagon(ctx, p, tema, tiempo);
    } else if (p.tipo === 'solida') {
      ctx.fillStyle = tema.piso[0];
      ctx.fillRect(p.x, p.y, p.ancho, p.alto);
      ctx.fillStyle = tema.piso[1];                     // borde de arriba más claro
      ctx.fillRect(p.x, p.y, p.ancho, nombreTema === 'nieve' ? 6 : 4);
      if (tema.rayas && p.alto > 40) dibujarRayasDePeligro(ctx, p);
      if (p.fragil) dibujarGrietas(ctx, p, tiempo);
    } else {
      ctx.fillStyle = tema.fina[0];
      ctx.fillRect(p.x, p.y, p.ancho, p.alto);
      ctx.fillStyle = tema.fina[1];                     // borde de color: "esta se atraviesa"
      ctx.fillRect(p.x, p.y, p.ancho, 3);
      if (p.fragil) dibujarGrietas(ctx, p, tiempo);
    }
  }
}

function dibujarRayasDePeligro(ctx, p) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(p.x, p.y + 4, p.ancho, 8);
  ctx.clip();
  ctx.fillStyle = 'rgba(255, 210, 63, 0.35)';
  for (let x = p.x - 20; x < p.x + p.ancho; x += 24) {
    ctx.beginPath();
    ctx.moveTo(x, p.y + 12);
    ctx.lineTo(x + 12, p.y + 4);
    ctx.lineTo(x + 20, p.y + 4);
    ctx.lineTo(x + 8, p.y + 12);
    ctx.fill();
  }
  ctx.restore();
}

// Un vagón del tren (el piso de la etapa 2): techo, ventanas y ruedas que giran
function dibujarVagon(ctx, p, tema, tiempo) {
  const sacudon = Math.sin(tiempo * 30 + p.x) * 0.8;   // el tren se sacude un poquito
  ctx.save();
  ctx.translate(0, sacudon);
  ctx.fillStyle = tema.piso[0];
  ctx.fillRect(p.x, p.y, p.ancho, p.alto + 40);
  ctx.fillStyle = tema.piso[1];
  ctx.fillRect(p.x - 4, p.y - 2, p.ancho + 8, 6);       // el techo
  ctx.fillStyle = '#2a1818';
  for (let x = p.x + 30; x < p.x + p.ancho - 50; x += 70) {
    ctx.fillStyle = '#1a1014';
    ctx.fillRect(x, p.y + 18, 44, 26);                  // ventanas
    ctx.fillStyle = 'rgba(255, 200, 120, 0.35)';
    ctx.fillRect(x + 2, p.y + 20, 40, 22);
  }
  ctx.fillStyle = '#e0343c';
  ctx.fillRect(p.x, p.y + 50, p.ancho, 4);              // franja de Genesis
  ctx.restore();
  // Las ruedas
  ctx.fillStyle = '#16181e';
  for (const x of [p.x + 50, p.x + 110, p.x + p.ancho - 110, p.x + p.ancho - 50]) {
    ctx.beginPath();
    ctx.arc(x, p.y + 78, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5d6574';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const giro = tiempo * 25;
    ctx.moveTo(x + Math.cos(giro) * 12, p.y + 78 + Math.sin(giro) * 12);
    ctx.lineTo(x - Math.cos(giro) * 12, p.y + 78 - Math.sin(giro) * 12);
    ctx.stroke();
  }
}

// Las plataformas frágiles tienen grietas (y tiemblan cuando alguien está encima)
function dibujarGrietas(ctx, p, tiempo) {
  const temblor = p.pisada > 0 ? Math.sin(tiempo * 80) * 1.5 : 0;
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = p.x + 10; x < p.x + p.ancho - 10; x += 34) {
    ctx.moveTo(x + temblor, p.y + 2);
    ctx.lineTo(x + 6 + temblor, p.y + p.alto * 0.5);
    ctx.lineTo(x + 2 + temblor, p.y + p.alto);
  }
  ctx.stroke();
}

// Cambia {ataque}, {saltar}, etc. por las teclas o botones que usa el Jugador 1
function reemplazarTeclas(texto) {
  const dispositivo = Juego.dispositivos.j1;
  const n = nombresDeAtaques(dispositivo, 'j1');
  const t = TECLAS.j1;
  const mando = mandoDe(dispositivo);
  const esTeclado = dispositivo === 'teclado';
  const valores = {
    mover: esTeclado ? `${nombreTecla(t.izquierda)} ${nombreTecla(t.derecha)}` : 'Stick',
    saltar: esTeclado ? nombreTecla(t.saltar) : NOMBRES_BOTONES[mando ? mando.tipo : 'xbox'][BOTON.SUR],
    bajar: esTeclado ? nombreTecla(t.bajar) : 'Abajo',
    ataque: n.ataque,
    hab1: n.habilidad1,
    hab2: n.habilidad2,
    definitiva: n.definitiva,
    mochila: n.mochila,
    esquivar: n.esquivar,
    disparar: n.disparar,
  };
  return texto.replace(/\{(\w+)\}/g, (todo, clave) => valores[clave] ?? todo);
}

function dibujarCarteles(ctx, carteles) {
  ctx.font = '14px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const c of carteles) {
    const contenido = reemplazarTeclas(c.texto);
    const ancho = ctx.measureText(contenido).width + 24;

    // El panel va alto, para que no tape a los personajes ni sus etiquetas
    ctx.fillStyle = '#2b3448';                  // poste
    ctx.fillRect(c.x - 3, c.y - 100, 6, 100);

    ctx.fillStyle = 'rgba(8, 16, 30, 0.92)';    // panel
    ctx.fillRect(c.x - ancho / 2, c.y - 130, ancho, 30);
    ctx.strokeStyle = '#5fd4ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(c.x - ancho / 2 + 0.5, c.y - 129.5, ancho - 1, 29);

    ctx.fillStyle = '#d7f4ff';
    ctx.fillText(contenido, c.x, c.y - 115);
  }
}

// ---------- Adornos ----------

function dibujarDecoracion(ctx, decoracion, tiempo) {
  for (const d of decoracion) {
    const piso = d.y ?? PISO;
    switch (d.tipo) {
      case 'capsula': dibujarCapsula(ctx, d.x, PISO, tiempo); break;
      case 'tanque': dibujarTanque(ctx, d.x, piso, d.roto, tiempo); break;
      case 'consola': dibujarConsola(ctx, d.x, piso, tiempo); break;
      case 'logo': dibujarLogo(ctx, d.x, d.y); break;
      case 'tuberia': dibujarTuberia(ctx, d.x, piso, d.alto || 200, tiempo); break;
      case 'barril': dibujarBarril(ctx, d.x, piso); break;
      case 'caja': dibujarCaja(ctx, d.x, piso); break;
      case 'reflector': dibujarReflector(ctx, d.x, piso, tiempo); break;
      case 'bandera': dibujarBandera(ctx, d.x, piso, tiempo); break;
      case 'arbol': dibujarArbol(ctx, d.x, piso, d.alto || 240, tiempo); break;
      case 'hongo': dibujarHongo(ctx, d.x, piso, tiempo); break;
      case 'arbolSeco': dibujarArbolSeco(ctx, d.x, piso, d.alto || 200); break;
      case 'ruina': dibujarRuina(ctx, d.x, piso, d.alto || 160); break;
      case 'estatua': dibujarEstatua(ctx, d.x, piso); break;
      case 'cristal': dibujarCristal(ctx, d.x, piso, d.alto || 120); break;
      case 'tanqueClon': dibujarTanqueClon(ctx, d.x, piso, tiempo, d.roto); break;
      case 'pantalla': dibujarPantalla(ctx, d.x, d.y, tiempo); break;
      case 'cartel': dibujarCartelDeFondo(ctx, d.x, d.y, d.texto, d.color); break;
    }
  }
}

// La cápsula rota donde despertó Jax (el "Sujeto Cero")
function dibujarCapsula(ctx, x, piso, tiempo) {
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(x - 40, piso - 16, 80, 16);                // base
  ctx.fillRect(x - 36, piso - 150, 72, 12);               // tapa
  ctx.strokeStyle = 'rgba(160, 220, 255, 0.35)';          // vidrio roto
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 32, piso - 16);
  ctx.lineTo(x - 32, piso - 70);
  ctx.lineTo(x - 20, piso - 95);
  ctx.moveTo(x + 32, piso - 16);
  ctx.lineTo(x + 32, piso - 60);
  ctx.lineTo(x + 18, piso - 80);
  ctx.moveTo(x - 32, piso - 138);
  ctx.lineTo(x - 26, piso - 120);
  ctx.moveTo(x + 32, piso - 138);
  ctx.lineTo(x + 24, piso - 112);
  ctx.stroke();
  ctx.fillStyle = 'rgba(120, 255, 140, 0.25)';            // líquido derramado
  ctx.beginPath();
  ctx.ellipse(x + 30, piso - 1, 70, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe14d';                              // chispas del cable cortado
  if (Math.sin(tiempo * 13) > 0.6) ctx.fillRect(x + 30 + Math.random() * 6, piso - 140 + Math.random() * 6, 2, 2);
  texto(ctx, 'SUJETO 0', x, piso - 158, { tamano: 10, color: '#7a8496' });
}

function dibujarTanque(ctx, x, piso, roto, tiempo) {
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(x - 28, piso - 14, 56, 14);
  ctx.fillRect(x - 28, piso - 136, 56, 10);
  const nivelLiquido = roto ? 0.25 : 0.85;
  ctx.fillStyle = 'rgba(120, 255, 140, 0.18)';
  ctx.fillRect(x - 24, piso - 14 - 112 * nivelLiquido, 48, 112 * nivelLiquido);
  if (!roto) {                                            // burbujas
    ctx.fillStyle = 'rgba(200, 255, 210, 0.5)';
    for (let i = 0; i < 4; i++) {
      const by = piso - 20 - ((tiempo * 30 + i * 28) % 100);
      ctx.fillRect(x - 12 + i * 8, by, 3, 3);
    }
  }
  ctx.strokeStyle = 'rgba(160, 220, 255, 0.35)';
  ctx.lineWidth = 2;
  if (roto) {
    ctx.beginPath();
    ctx.moveTo(x - 26, piso - 14);
    ctx.lineTo(x - 26, piso - 60);
    ctx.lineTo(x - 10, piso - 75);
    ctx.moveTo(x + 26, piso - 14);
    ctx.lineTo(x + 26, piso - 90);
    ctx.stroke();
  } else {
    ctx.strokeRect(x - 26, piso - 126, 52, 112);
  }
}

function dibujarConsola(ctx, x, piso, tiempo) {
  ctx.fillStyle = '#2b3448';
  ctx.fillRect(x - 30, piso - 40, 60, 40);
  ctx.fillStyle = '#121a2a';
  ctx.fillRect(x - 24, piso - 62, 48, 24);
  ctx.fillStyle = Math.sin(tiempo * 3) > 0 ? '#ff5050' : '#7a2a35';   // pantalla con error
  ctx.fillRect(x - 20, piso - 58, 40, 3);
  ctx.fillRect(x - 20, piso - 52, 26, 3);
  ctx.fillRect(x - 20, piso - 46, 33, 3);
}

function dibujarLogo(ctx, x, y) {
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#e0343c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 9, y + 8);
  ctx.lineTo(x, y - 10);
  ctx.lineTo(x + 9, y + 8);
  ctx.stroke();
  ctx.restore();
  texto(ctx, 'GENESIS', x, y + 32, { tamano: 12, negrita: true, color: 'rgba(224, 52, 60, 0.55)' });
}

function dibujarTuberia(ctx, x, piso, alto, tiempo) {
  ctx.fillStyle = '#4a3a30';
  ctx.fillRect(x - 10, piso - alto, 20, alto);
  ctx.fillStyle = '#6a5040';
  for (let y = piso - alto + 20; y < piso; y += 50) ctx.fillRect(x - 13, y, 26, 6);   // uniones
  ctx.fillRect(x - 10, piso - alto, 60, 20);                                            // codo
  // Una gotita de vapor
  ctx.fillStyle = 'rgba(220, 230, 240, 0.3)';
  const sube = (tiempo * 20 + x) % 40;
  ctx.beginPath();
  ctx.arc(x + 46, piso - alto - sube, 4 + sube * 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function dibujarBarril(ctx, x, piso) {
  ctx.fillStyle = '#3a5a8a';
  ctx.beginPath();
  ctx.roundRect(x - 14, piso - 38, 28, 38, 4);
  ctx.fill();
  ctx.fillStyle = '#2a4066';
  ctx.fillRect(x - 14, piso - 28, 28, 3);
  ctx.fillRect(x - 14, piso - 12, 28, 3);
}

function dibujarCaja(ctx, x, piso) {
  ctx.fillStyle = '#5a4630';
  ctx.fillRect(x - 22, piso - 40, 44, 40);
  ctx.strokeStyle = '#3a2c1c';
  ctx.lineWidth = 3;
  ctx.strokeRect(x - 20, piso - 38, 40, 36);
  ctx.beginPath();
  ctx.moveTo(x - 20, piso - 38);
  ctx.lineTo(x + 20, piso - 2);
  ctx.stroke();
}

function dibujarReflector(ctx, x, piso, tiempo) {
  ctx.fillStyle = '#3a4250';
  ctx.fillRect(x - 4, piso - 180, 8, 180);
  const angulo = -Math.PI / 2 + Math.sin(tiempo * 0.8 + x) * 0.7;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x, piso - 180, x + Math.cos(angulo) * 400, piso - 180 + Math.sin(angulo) * 400);
  g.addColorStop(0, 'rgba(255, 240, 180, 0.25)');
  g.addColorStop(1, 'rgba(255, 240, 180, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, piso - 180);
  ctx.lineTo(x + Math.cos(angulo - 0.12) * 420, piso - 180 + Math.sin(angulo - 0.12) * 420);
  ctx.lineTo(x + Math.cos(angulo + 0.12) * 420, piso - 180 + Math.sin(angulo + 0.12) * 420);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#ffe08a';
  ctx.beginPath();
  ctx.arc(x, piso - 182, 8, 0, Math.PI * 2);
  ctx.fill();
}

function dibujarBandera(ctx, x, piso, tiempo) {
  ctx.fillStyle = '#4a5160';
  ctx.fillRect(x - 2, piso - 200, 4, 200);
  ctx.fillStyle = '#e0343c';
  ctx.beginPath();
  ctx.moveTo(x + 2, piso - 198);
  for (let i = 0; i <= 6; i++) ctx.lineTo(x + 2 + i * 10, piso - 198 + Math.sin(tiempo * 4 + i) * 3);
  for (let i = 6; i >= 0; i--) ctx.lineTo(x + 2 + i * 10, piso - 160 + Math.sin(tiempo * 4 + i) * 3);
  ctx.closePath();
  ctx.fill();
  dibujarLogo(ctx, x + 32, piso - 180);
}

function dibujarArbol(ctx, x, piso, alto, tiempo) {
  ctx.fillStyle = '#1a140e';
  ctx.fillRect(x - 12, piso - alto, 24, alto);
  ctx.fillStyle = '#0e2a20';
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(x - 70 + k * 12, piso - alto * (0.5 - k * 0.14));
    ctx.lineTo(x, piso - alto - 50 - k * 10);
    ctx.lineTo(x + 70 - k * 12, piso - alto * (0.5 - k * 0.14));
    ctx.fill();
  }
  // Lianas que brillan
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = `rgba(60, 255, 210, ${0.25 + Math.sin(tiempo * 2 + x) * 0.1})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 20, piso - alto * 0.5);
  ctx.quadraticCurveTo(x + 30 + Math.sin(tiempo + x) * 4, piso - alto * 0.3, x + 24, piso - alto * 0.15);
  ctx.stroke();
  ctx.restore();
}

function dibujarHongo(ctx, x, piso, tiempo) {
  ctx.fillStyle = '#c8b8a0';
  ctx.fillRect(x - 3, piso - 18, 6, 18);
  ctx.save();
  ctx.shadowColor = '#c05aff';
  ctx.shadowBlur = 10 + Math.sin(tiempo * 2 + x) * 4;
  ctx.fillStyle = '#b05aef';
  ctx.beginPath();
  ctx.ellipse(x, piso - 18, 13, 8, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function dibujarArbolSeco(ctx, x, piso, alto) {
  ctx.strokeStyle = '#2a2418';
  ctx.lineCap = 'round';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(x, piso);
  ctx.lineTo(x + 6, piso - alto);
  ctx.stroke();
  ctx.lineWidth = 5;
  for (let k = 0; k < 4; k++) {
    const y = piso - alto * (0.4 + k * 0.15);
    const lado = k % 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x + 3, y);
    ctx.lineTo(x + lado * 45, y - 30);
    ctx.stroke();
  }
  // Musgo colgando
  ctx.strokeStyle = 'rgba(120, 160, 90, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 30, piso - alto * 0.7);
  ctx.lineTo(x - 32, piso - alto * 0.55);
  ctx.moveTo(x + 36, piso - alto * 0.62);
  ctx.lineTo(x + 34, piso - alto * 0.45);
  ctx.stroke();
}

function dibujarRuina(ctx, x, piso, alto) {
  ctx.fillStyle = '#4a4a42';
  ctx.fillRect(x - 18, piso - alto, 36, alto);
  ctx.fillStyle = '#5a5a50';
  ctx.fillRect(x - 24, piso - alto, 48, 12);
  ctx.fillRect(x - 24, piso - 12, 48, 12);
  // Parte rota de arriba
  ctx.fillStyle = TEMAS.pantano.cielo[1];
  ctx.beginPath();
  ctx.moveTo(x - 24, piso - alto);
  ctx.lineTo(x - 4, piso - alto + 18);
  ctx.lineTo(x + 10, piso - alto + 4);
  ctx.lineTo(x + 24, piso - alto);
  ctx.fill();
  ctx.fillStyle = 'rgba(100, 150, 80, 0.5)';     // musgo
  ctx.fillRect(x - 18, piso - alto * 0.5, 10, alto * 0.3);
}

function dibujarEstatua(ctx, x, piso) {
  ctx.fillStyle = '#5a5a50';
  ctx.fillRect(x - 30, piso - 30, 60, 30);       // pedestal
  ctx.fillStyle = '#6a6a5e';
  ctx.beginPath();
  ctx.arc(x, piso - 130, 16, 0, Math.PI * 2);    // cabeza
  ctx.fill();
  ctx.fillRect(x - 22, piso - 114, 44, 84);      // cuerpo
  ctx.fillStyle = 'rgba(100, 150, 80, 0.5)';
  ctx.fillRect(x - 22, piso - 60, 44, 8);
}

function dibujarCristal(ctx, x, piso, alto) {
  ctx.save();
  ctx.fillStyle = 'rgba(190, 240, 255, 0.35)';
  ctx.strokeStyle = 'rgba(230, 250, 255, 0.8)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 16, piso);
  ctx.lineTo(x - 10, piso - alto);
  ctx.lineTo(x, piso - alto - 20);
  ctx.lineTo(x + 10, piso - alto);
  ctx.lineTo(x + 16, piso);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function dibujarTanqueClon(ctx, x, piso, tiempo, roto) {
  ctx.fillStyle = '#26302c';
  ctx.fillRect(x - 32, piso - 16, 64, 16);
  ctx.fillRect(x - 32, piso - 176, 64, 14);
  ctx.fillStyle = roto ? 'rgba(90, 255, 160, 0.08)' : 'rgba(90, 255, 160, 0.16)';
  ctx.fillRect(x - 28, piso - 162, 56, 146);
  // El clon adentro (la silueta de Jax) o vacío si se rompió
  if (!roto) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const flota = Math.sin(tiempo * 1.5 + x) * 4;
    if (!dibujarSprite(ctx, 'jax-frente', x, piso - 24 + flota, 120, { tinte: { color: '#2affa0', fuerza: 0.6 } })) {
      ctx.fillStyle = '#0a2018';
      ctx.fillRect(x - 10, piso - 140, 20, 100);
    }
    ctx.restore();
    ctx.fillStyle = 'rgba(200, 255, 220, 0.5)';
    for (let i = 0; i < 4; i++) ctx.fillRect(x - 18 + i * 12, piso - 20 - ((tiempo * 30 + i * 33) % 130), 3, 3);
  }
  ctx.strokeStyle = 'rgba(160, 255, 200, 0.4)';
  ctx.lineWidth = 2;
  if (roto) {
    ctx.beginPath();
    ctx.moveTo(x - 28, piso - 16);
    ctx.lineTo(x - 28, piso - 80);
    ctx.lineTo(x - 10, piso - 100);
    ctx.moveTo(x + 28, piso - 16);
    ctx.lineTo(x + 28, piso - 120);
    ctx.stroke();
  } else {
    ctx.strokeRect(x - 28, piso - 162, 56, 146);
  }
}

function dibujarPantalla(ctx, x, y, tiempo) {
  ctx.fillStyle = '#121a2a';
  ctx.fillRect(x - 40, y - 26, 80, 52);
  ctx.strokeStyle = '#3b4d6e';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 40, y - 26, 80, 52);
  ctx.strokeStyle = '#7dff5a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= 70; i += 5) {
    const v = Math.sin(i * 0.3 + tiempo * 5) * 8 * (i % 20 < 5 ? 1.8 : 0.4);
    if (i === 0) ctx.moveTo(x - 35 + i, y + v);
    else ctx.lineTo(x - 35 + i, y + v);
  }
  ctx.stroke();
}

// Un cartel pintado en la pared (no se lee como ayuda: es parte del escenario)
function dibujarCartelDeFondo(ctx, x, y, contenido, color = '#ffd23f') {
  ctx.font = `bold 13px ${FUENTE}`;
  const ancho = ctx.measureText(contenido).width + 20;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(x - ancho / 2, y - 12, ancho, 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - ancho / 2, y - 12, ancho, 24);
  texto(ctx, contenido, x, y, { tamano: 13, negrita: true, color });
}

// ---------- Clima: lo que cae o flota delante de todo ----------

function dibujarClima(ctx, camX, camY, nombreTema, tiempo) {
  if (nombreTema === 'nieve') {
    // Copos que caen en diagonal (más rápido con el viento)
    const viento = Juego.viento ? Juego.viento.fuerza : 0;
    ctx.fillStyle = 'rgba(240, 250, 255, 0.8)';
    for (let i = 0; i < 90; i++) {
      const velocidad = 60 + azar(i) * 80;
      const y = (azar(i + 3) * ALTO + tiempo * velocidad) % ALTO;
      const x = ((azar(i + 9) * ANCHO + tiempo * (viento * 1.5 - 20) - camX * 0.6) % ANCHO + ANCHO) % ANCHO;
      const tamano = 1.5 + azar(i + 5) * 2;
      ctx.fillRect(x, y, tamano, tamano);
    }
  } else if (nombreTema === 'bosque' || nombreTema === 'pantano') {
    // Luciérnagas o esporas que flotan
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 24; i++) {
      const x = ((azar(i) * 1400 - camX * 0.8 + Math.sin(tiempo * 0.7 + i) * 30) % 1400 + 1400) % 1400 - 200;
      const y = azar(i + 50) * ALTO * 0.8 + Math.sin(tiempo + i * 2) * 20;
      ctx.fillStyle = nombreTema === 'bosque' ? 'rgba(120, 255, 200, 0.6)' : 'rgba(200, 255, 120, 0.4)';
      ctx.globalAlpha = 0.4 + 0.4 * Math.sin(tiempo * 3 + i);
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (nombreTema === 'nucleo' || nombreTema === 'industrial') {
    // Chispas que suben
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 30; i++) {
      const velocidad = 30 + azar(i + 20) * 50;
      const y = ALTO - ((tiempo * velocidad + azar(i + 99) * ALTO) % (ALTO + 20));
      const x = ((azar(i) * 1200 - camX * 0.7) % 1200 + 1200) % 1200 - 120;
      ctx.fillStyle = nombreTema === 'nucleo' ? 'rgba(220, 120, 255, 0.6)' : 'rgba(255, 150, 60, 0.5)';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.restore();
  }
}

// ---------- Terminales (checkpoints) ----------

function dibujarCheckpoints(ctx, checkpoints, activo, tiempo) {
  checkpoints.forEach((cp, i) => {
    const encendida = i <= activo;
    const color = encendida ? '#7dff5a' : '#ff5050';
    ctx.fillStyle = '#2b3448';
    ctx.fillRect(cp.x - 4, cp.y - 52, 8, 52);                 // poste
    ctx.fillRect(cp.x - 18, cp.y - 78, 36, 28);               // pantalla
    ctx.save();
    ctx.shadowColor = color;
    ctx.shadowBlur = encendida ? 14 : 6;
    ctx.fillStyle = color;
    if (encendida) {
      // Una tilde
      ctx.lineWidth = 3;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(cp.x - 8, cp.y - 64);
      ctx.lineTo(cp.x - 2, cp.y - 58);
      ctx.lineTo(cp.x + 9, cp.y - 71);
      ctx.stroke();
    } else if (Math.sin(tiempo * 5) > 0) {
      ctx.fillRect(cp.x - 9, cp.y - 66, 18, 4);
    }
    ctx.restore();
  });
}

// ---------- Inyectores para agarrar ----------

function dibujarObjetos(ctx, objetos, tiempo) {
  for (const o of objetos) {
    if (o.agarrado) continue;
    if (o.tipo === 'archivo') {
      dibujarArchivo(ctx, o, tiempo);
      continue;
    }
    const y = o.y - 26 + Math.sin(tiempo * 3 + o.x) * 4;   // flota
    ctx.save();
    ctx.translate(o.x, y);
    ctx.rotate(-0.6);
    ctx.shadowColor = '#7dff5a';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#7dff5a';
    ctx.fillRect(-4, -10, 8, 17);           // tubo
    ctx.fillStyle = '#d7f4ff';
    ctx.fillRect(-6, -13, 12, 3);           // émbolo
    ctx.fillRect(-1, 7, 2, 7);              // aguja
    ctx.restore();
  }
}

// ---------- La salida del nivel ----------

function dibujarSalida(ctx, salida, abierta, tiempo) {
  const x = salida.x + 40;
  ctx.fillStyle = '#121a2a';
  ctx.fillRect(x, PISO - 120, 50, 120);                        // hueco de la puerta
  if (abierta) {
    ctx.fillStyle = `rgba(125, 255, 90, ${0.15 + 0.1 * Math.sin(tiempo * 4)})`;
    ctx.fillRect(x, PISO - 120, 50, 120);
  } else {
    ctx.fillStyle = '#3b4d6e';
    ctx.fillRect(x + 2, PISO - 118, 46, 118);                  // puerta cerrada
  }
  ctx.save();
  ctx.shadowColor = abierta ? '#7dff5a' : '#ff5050';
  ctx.shadowBlur = 10;
  texto(ctx, 'SALIDA', x + 25, PISO - 134, { tamano: 13, negrita: true, color: abierta ? '#7dff5a' : '#ff5050' });
  ctx.restore();
}

// Modo "ver cajas" (tecla H): muestra los rectángulos que usa el juego.
// Violeta = plataformas · verde = cuerpos · rojo = ataques que están lastimando
function dibujarCajasDeChoque(ctx, plataformas, cuerpos, ataques, alfa) {
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#ff3df0';
  for (const p of plataformas) {
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.ancho - 1, p.alto - 1);
  }
  ctx.strokeStyle = '#7dff5a';
  for (const c of cuerpos) {
    const { x, y } = posicionDibujo(c, alfa);
    ctx.strokeRect(x + 0.5, y + 0.5, c.ancho - 1, c.alto - 1);
  }
  ctx.strokeStyle = '#ff3b3b';
  ctx.lineWidth = 2;
  for (const caja of ataques) {
    ctx.strokeRect(caja.x, caja.y, caja.ancho, caja.alto);
  }
}
