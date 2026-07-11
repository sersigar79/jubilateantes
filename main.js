let chart = null;
let currentLang = 'es';

function scrollToForm() {
  const form = document.getElementById('form');
  if (form) form.scrollIntoView({ behavior: 'smooth' });
}

function cambiarIdioma() {
  const select = document.getElementById('lang');
  currentLang = select.value;

  const elements = document.querySelectorAll('[data-es]');
  elements.forEach(el => {
    const es = el.getAttribute('data-es');
    const en = el.getAttribute('data-en');
    el.textContent = currentLang === 'es' ? es : (en || es);
  });
}

function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  const edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const pais = document.getElementById('pais').value;

  const edadInicioTrabajo = Number(document.getElementById('edadInicioTrabajo').value);
  // Años cotizados SIEMPRE calculados por la herramienta
  const aniosCotizados = Math.max(edadActual - edadInicioTrabajo, 0);
  document.getElementById('aniosCotizados').value = aniosCotizados;

  const ingresosActuales = Number(document.getElementById('ingresosActuales').value);
  const ahorroMensual = Number(document.getElementById('ahorroMensual').value);
  let capital = Number(document.getElementById('capitalActual').value);

  const gastoAnualJubilacion = Number(document.getElementById('gastoAnualJubilacion').value);
  const ingresosPasivos = Number(document.getElementById('ingresosPasivos').value);
  let pensionPublica = Number(document.getElementById('pensionPublica').value);

  const inflacion = Number(document.getElementById('inflacion').value) / 100;
  const rentabilidad = Number(document.getElementById('rentabilidad').value) / 100;
  const loteria = Number(document.getElementById('loteria').value);

  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const veredicto = document.getElementById('veredicto');
  const accionesLista = document.getElementById('accionesLista');
  accionesLista.innerHTML = '';

  if (pensionPublica === 0) {
    pensionPublica = estimarPension(pais, ingresosActuales, aniosCotizados);
    document.getElementById('pensionPublica').value = Math.round(pensionPublica);
  }

  const ahorroAnualTotal = ahorroMensual * 12;

  const edades = [];
  const capitales = [];
  const necesarios = [];

  let edad = edadActual;
  let herenciaAplicada = false;
  const edadMax = 80;

  let edadJubilacionReal = null;
  let capitalEnJubilacion = null;
  let gastoAjustadoEnJubilacion = null;
  let ingresosRecurrentesEnJubilacion = null;

  while (edad <= edadMax) {
    const añosHastaEdad = edad - edadActual;
    const gastoAjustado = gastoAnualJubilacion * Math.pow(1 + inflacion, añosHastaEdad);
    const ingresosRecurrentes = ingresosPasivos + pensionPublica;
    const gastoNeto = Math.max(gastoAjustado - ingresosRecurrentes, 0);
    const capitalNecesario = gastoNeto * 25;

    edades.push(edad);
    capitales.push(Math.round(capital));
    necesarios.push(Math.round(capitalNecesario));

    if (!herenciaAplicada && loteria > 0 && edad >= edadObjetivo) {
      capital += loteria;
      herenciaAplicada = true;
    }

    if (edad < edadObjetivo) {
      capital += ahorroAnualTotal;
    }

    capital *= (1 + rentabilidad);

    if (capital >= capitalNecesario && edadJubilacionReal === null) {
      edadJubilacionReal = edad;
      capitalEnJubilacion = capital;
      gastoAjustadoEnJubilacion = gastoAjustado;
      ingresosRecurrentesEnJubilacion = ingresosRecurrentes;
    }

    edad++;
  }

  const añoActual = new Date().getFullYear();
  let mensajePrincipal = '';
  let mensajeSecundario = '';
  let mensajeVeredicto = '';

  if (edadJubilacionReal) {
    const añoJubilacion = añoActual + (edadJubilacionReal - edadActual);
    const ingresoAnualTotal = ingresosRecurrentesEnJubilacion + capitalEnJubilacion * 0.04;
    const ingresoMensualTotal = ingresoAnualTotal / 12;
    const gastoMensualJubilacion = gastoAjustadoEnJubilacion / 12;

    const puede = ingresoMensualTotal >= gastoMensualJubilacion;

    if (currentLang === 'es') {
      mensajePrincipal = `Podrías jubilarte alrededor del año ${añoJubilacion}, a los ${edadJubilacionReal} años.`;
      mensajeSecundario =
        `Ingresos estimados: ${Math.round(ingresoMensualTotal)} €/mes · ` +
        `Gasto deseado: ${Math.round(gastoMensualJubilacion)} €/mes.`;
      mensajeVeredicto = puede
        ? `✅ Sí, puedes jubilarte a esa edad.`
        : `❌ No, no puedes mantener tu nivel de gasto a esa edad.`;
    } else {
      mensajePrincipal = `You could retire around ${añoJubilacion}, at age ${edadJubilacionReal}.`;
      mensajeSecundario =
        `Estimated income: ${Math.round(ingresoMensualTotal)} €/month · ` +
        `Desired spending: ${Math.round(gastoMensualJubilacion)} €/month.`;
      mensajeVeredicto = puede
        ? `✅ Yes, you can retire at that age.`
        : `❌ No, you cannot maintain your spending level at that age.`;
    }

    // Casos cuando sí llegas
    generarAccionesCuandoSi(accionesLista, rentabilidad);
  } else {
    // No llega: calculamos qué tendría que cambiar
    const añosHastaObjetivo = Math.max(edadObjetivo - edadActual, 0);
    const gastoAjustadoObjetivo =
      gastoAnualJubilacion * Math.pow(1 + inflacion, añosHastaObjetivo);
    const ingresosRecurrentesObjetivo = ingresosPasivos + pensionPublica;
    const gastoNetoObjetivo = Math.max(gastoAjustadoObjetivo - ingresosRecurrentesObjetivo, 0);
    const capitalNecesarioObjetivo = gastoNetoObjetivo * 25;

    // Capital proyectado a la edad objetivo con el ahorro actual
    let capitalProyectado = capital;
    let edadTmp = edadActual;
    while (edadTmp < edadObjetivo) {
      capitalProyectado += ahorroAnualTotal;
      capitalProyectado *= (1 + rentabilidad);
      edadTmp++;
    }

    const ahorroMensualNecesario =
      calcularAhorroMensualNecesario(
        capital,
        capitalNecesarioObjetivo,
        rentabilidad,
        edadActual,
        edadObjetivo
      ) || 0;

    const gastoAnualReducidoNecesario =
      calcularGastoReducidoNecesario(
        capitalProyectado,
        ingresosRecurrentesObjetivo
      ) || gastoAnualJubilacion;

    const ingresoMensualNecesario =
      calcularIngresoMensualNecesario(
        capitalProyectado,
        gastoAnualJubilacion,
        inflacion,
        añosHastaObjetivo
      ) || ingresosActuales / 12;

    const rentabilidadNecesaria =
      calcularRentabilidadNecesaria(
        capital,
        capitalNecesarioObjetivo,
        ahorroAnualTotal,
        edadActual,
        edadObjetivo
      ) || rentabilidad;

    if (currentLang === 'es') {
      mensajePrincipal = `Con los datos actuales, no alcanzas el capital necesario antes de los ${edadMax} años.`;
      mensajeSecundario =
        `Para jubilarte a los ${edadObjetivo}, necesitarías aproximarte a uno de estos ajustes:`;
      mensajeVeredicto = `❌ No puedes jubilarte todavía con tu nivel de ahorro, gasto e ingresos actuales.`;
    } else {
      mensajePrincipal = `With the current data, you do not reach the required capital before age ${edadMax}.`;
      mensajeSecundario =
        `To retire at ${edadObjetivo}, you would need to move towards one of these adjustments:`;
      mensajeVeredicto = `❌ You cannot retire yet with your current savings, spending and income levels.`;
    }

    generarAccionesCuandoNo(
      accionesLista,
      ahorroMensualNecesario,
      gastoAnualReducidoNecesario,
      ingresoMensualNecesario,
      rentabilidadNecesaria,
      rentabilidad
    );
  }

  resultadoTexto.textContent = mensajePrincipal;
  subResultado.textContent = mensajeSecundario;
  veredicto.textContent = mensajeVeredicto;

  // Gráfica más clara: capital vs capital necesario y punto de cruce
  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: edades,
      datasets: [
        {
          label: currentLang === 'es' ? 'Capital estimado (€)' : 'Estimated capital (€)',
          data: capitales,
          borderColor: '#facc15',
          backgroundColor: 'rgba(250, 204, 21, 0.15)',
          tension: 0.25,
          fill: true
        },
        {
          label: currentLang === 'es' ? 'Capital necesario (€)' : 'Required capital (€)',
          data: necesarios,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.10)',
          tension: 0.25,
          fill: false
        }
      ]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#e5e7eb' } },
        tooltip: {
          callbacks: {
            afterBody: (items) => {
              const idx = items[0].dataIndex;
              const edad = edades[idx];
              return currentLang === 'es'
                ? `Edad: ${edad} años`
                : `Age: ${edad} years`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9ca3af' },
          grid: { color: '#1f2937' }
        },
        y: {
          ticks: { color: '#9ca3af' },
          grid: { color: '#1f2937' }
        }
      }
    }
  });
}

function generarAccionesCuandoSi(accionesLista, rentabilidad) {
  const acciones = [];
  if (currentLang === 'es') {
    acciones.push(
      `• Mantener tu ahorro mensual y evitar subidas fuertes de gasto consolida tu jubilación anticipada.`,
      `• Añadir nuevas fuentes de ingresos pasivos (acciones, inmuebles, proyectos online) reduce tu dependencia de la pensión.`,
      `• Diversificar tu inversión (mercado de acciones global, fondos indexados, inmuebles en alquiler) puede darte más estabilidad.`,
      `• Si tu trabajo actual no te aporta nada, puedes empezar a planificar una transición hacia trabajos mejor pagados o más alineados con tu vida.`,
      `• Explora sectores con mejores sueldos: tecnología, data, salud digital, consultoría, ventas especializadas, etc.`
    );
  } else {
    acciones.push(
      `• Keeping your monthly savings and avoiding strong spending increases consolidates early retirement.`,
      `• Adding new passive income sources (stocks, real estate, online projects) reduces dependence on public pension.`,
      `• Diversifying investments (global stock markets, index funds, rental properties) can give more stability.`,
      `• If your current job feels meaningless, start planning a transition to better‑paid or more aligned roles.`,
      `• Explore higher‑pay sectors: tech, data, digital health, consulting, specialized sales, etc.`
    );
  }

  acciones.forEach(texto => {
    const li = document.createElement('li');
    li.textContent = texto;
    accionesLista.appendChild(li);
  });
}

function generarAccionesCuandoNo(
  accionesLista,
  ahorroMensualNecesario,
  gastoAnualReducidoNecesario,
  ingresoMensualNecesario,
  rentabilidadNecesaria,
  rentabilidadActual
) {
  const acciones = [];

  if (currentLang === 'es') {
    acciones.push(
      `• Caso 1: Para llegar a tu objetivo, deberías ahorrar aproximadamente ${Math.round(ahorroMensualNecesario)} € al mes.`,
      `• Caso 2: Si reduces tu gasto anual en jubilación a unos ${Math.round(gastoAnualReducidoNecesario)} € al año, el capital necesario baja mucho.`,
      `• Caso 3: Si aumentas tus ingresos hasta unos ${Math.round(ingresoMensualNecesario)} € al mes, podrás ahorrar más sin sacrificar tanto tu vida actual.`,
      `• Caso 4: Subir tu rentabilidad esperada del ${Math.round(rentabilidadActual * 100)}% al entorno del ${Math.round(rentabilidadNecesaria * 100)}% (por ejemplo, usando fondos indexados globales, mercado de acciones, inmuebles en alquiler) acelera mucho el crecimiento.`,
      `• Ideas de nuevos ingresos: proyectos online, consultoría freelance, formación, ventas de alto valor, alquiler de habitaciones o inmuebles, invertir en acciones y ETFs.`,
      `• Si sientes que tu trabajo actual es una mierda, esta calculadora te da un mapa: cuánto necesitas cambiar para poder dejarlo antes y vivir mejor.`
    );
  } else {
    acciones.push(
      `• Case 1: To reach your goal, you would need to save about ${Math.round(ahorroMensualNecesario)} € per month.`,
      `• Case 2: If you reduce your annual retirement spending to around ${Math.round(gastoAnualReducidoNecesario)} € per year, the required capital drops a lot.`,
      `• Case 3: If you increase your income to about ${Math.round(ingresoMensualNecesario)} € per month, you can save more without sacrificing too much now.`,
      `• Case 4: Raising expected returns from ${Math.round(rentabilidadActual * 100)}% to around ${Math.round(rentabilidadNecesaria * 100)}% (e.g. global index funds, stock markets, rental properties) accelerates growth.`,
      `• New income ideas: online projects, freelance consulting, training, high‑value sales, renting rooms or properties, investing in stocks and ETFs.`,
      `• If your current job feels awful, this calculator gives you a map: how much you need to change to leave it earlier and live better.`
    );
  }

  acciones.forEach(texto => {
    const li = document.createElement('li');
    li.textContent = texto;
    accionesLista.appendChild(li);
  });
}

function estimarPension(pais, ingresos, aniosTotales) {
  let factorBase = 0.5;
  if (aniosTotales >= 35) factorBase = 0.7;
  else if (aniosTotales >= 25) factorBase = 0.6;

  switch (pais) {
    case 'es': return ingresos * factorBase * 0.6;
    case 'uk': return ingresos * factorBase * 0.5;
    case 'us': return ingresos * factorBase * 0.4;
    case 'de': return ingresos * factorBase * 0.55;
    default: return ingresos * factorBase * 0.5;
  }
}

// Cálculo aproximado del ahorro mensual necesario para llegar al capital objetivo
function calcularAhorroMensualNecesario(
  capitalInicial,
  capitalObjetivo,
  rentabilidad,
  edadActual,
  edadObjetivo
) {
  const años = Math.max(edadObjetivo - edadActual, 0);
  if (años <= 0) return null;

  const r = rentabilidad;
  const n = años;
  const factor = (Math.pow(1 + r, n) - 1) / r;
  const ahorroAnualNecesario = (capitalObjetivo - capitalInicial * Math.pow(1 + r, n)) / factor;
  return ahorroAnualNecesario / 12;
}

// Gasto anual máximo que podrías permitirte con el capital proyectado
function calcularGastoReducidoNecesario(capitalProyectado, ingresosRecurrentesObjetivo) {
  const retiroSeguro = capitalProyectado * 0.04;
  const gastoAnualMaximo = retiroSeguro + ingresosRecurrentesObjetivo;
  return gastoAnualMaximo;
}

// Ingreso mensual necesario para sostener el gasto deseado
function calcularIngresoMensualNecesario(
  capitalProyectado,
  gastoAnualJubilacion,
  inflacion,
  añosHastaObjetivo
) {
  const gastoAjustado = gastoAnualJubilacion * Math.pow(1 + inflacion, añosHastaObjetivo);
  const retiroSeguro = capitalProyectado * 0.04;
  const ingresosAnualesNecesarios = Math.max(gastoAjustado - retiroSeguro, 0);
  return ingresosAnualesNecesarios / 12;
}

// Rentabilidad necesaria para llegar al capital objetivo con el ahorro actual
function calcularRentabilidadNecesaria(
  capitalInicial,
  capitalObjetivo,
  ahorroAnual,
  edadActual,
  edadObjetivo
) {
  const años = Math.max(edadObjetivo - edadActual, 0);
  if (años <= 0) return null;

  // Búsqueda aproximada de rentabilidad (iterativa)
  let r = 0.01;
  let paso = 0.005;
  for (let i = 0; i < 200; i++) {
    let capital = capitalInicial;
    for (let j = 0; j < años; j++) {
      capital += ahorroAnual;
      capital *= (1 + r);
    }
    if (capital < capitalObjetivo) {
      r += paso;
    } else {
      r -= paso;
      paso /= 2;
    }
  }
  return r;
}
