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
  let aniosCotizados = Number(document.getElementById('aniosCotizados').value);

  if (!aniosCotizados || aniosCotizados <= 0) {
    aniosCotizados = Math.max(edadActual - edadInicioTrabajo, 0);
    document.getElementById('aniosCotizados').value = aniosCotizados;
  }

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

  let edad = edadActual;
  let herenciaAplicada = false;
  const edadMax = 80;

  let edadJubilacionReal = null;
  let capitalEnJubilacion = null;
  let gastoAjustadoEnJubilacion = null;
  let ingresosRecurrentesEnJubilacion = null;

  while (edad <= edadMax) {
    edades.push(edad);
    capitales.push(Math.round(capital));

    if (!herenciaAplicada && loteria > 0 && edad >= edadObjetivo) {
      capital += loteria;
      herenciaAplicada = true;
    }

    if (edad < edadObjetivo) {
      capital += ahorroAnualTotal;
    }

    capital *= (1 + rentabilidad);

    const añosHastaEdad = edad - edadActual;
    const gastoAjustado = gastoAnualJubilacion * Math.pow(1 + inflacion, añosHastaEdad);
    const ingresosRecurrentes = ingresosPasivos + pensionPublica;
    const gastoNeto = Math.max(gastoAjustado - ingresosRecurrentes, 0);
    const capitalNecesario = gastoNeto * 25;

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
      mensajePrincipal = `Con tus datos, podrías alcanzar la jubilación alrededor del año ${añoJubilacion}, a los ${edadJubilacionReal} años.`;
      mensajeSecundario =
        `En esa edad, tus ingresos estimados serían unos ` +
        `${Math.round(ingresoMensualTotal).toLocaleString('es-ES')} € al mes ` +
        `frente a un gasto deseado de ` +
        `${Math.round(gastoMensualJubilacion).toLocaleString('es-ES')} € al mes.`;
      mensajeVeredicto = puede
        ? `✅ Sí, con estas estimaciones podrías jubilarte a esa edad.`
        : `❌ No, con estas estimaciones no podrías mantener tu nivel de gasto a esa edad.`;
    } else {
      mensajePrincipal = `With your data, you could reach retirement around ${añoJubilacion}, at age ${edadJubilacionReal}.`;
      mensajeSecundario =
        `At that age, your estimated income would be about ` +
        `${Math.round(ingresoMensualTotal).toLocaleString('en-US')} € per month ` +
        `against a desired spending of ` +
        `${Math.round(gastoMensualJubilacion).toLocaleString('en-US')} € per month.`;
      mensajeVeredicto = puede
        ? `✅ Yes, with these estimates you could retire at that age.`
        : `❌ No, with these estimates you could not maintain your spending level at that age.`;
    }
  } else {
    if (currentLang === 'es') {
      mensajePrincipal = `Con los datos actuales, no alcanzas un nivel de capital suficiente antes de los ${edadMax} años.`;
      mensajeSecundario = `Prueba aumentando tu ahorro mensual, reduciendo tu gasto en jubilación o ajustando la rentabilidad esperada.`;
      mensajeVeredicto = `❌ No, con estas estimaciones no es viable jubilarte a la edad objetivo.`;
    } else {
      mensajePrincipal = `With the current data, you do not reach sufficient capital before age ${edadMax}.`;
      mensajeSecundario = `Try increasing your monthly savings, reducing your retirement spending or adjusting expected returns.`;
      mensajeVeredicto = `❌ No, with these estimates it is not viable to retire at the target age.`;
    }
  }

  resultadoTexto.textContent = mensajePrincipal;
  subResultado.textContent = mensajeSecundario;
  veredicto.textContent = mensajeVeredicto;

  const acciones = [];

  if (!edadJubilacionReal || edadJubilacionReal > edadObjetivo) {
    if (currentLang === 'es') {
      acciones.push(
        `• Caso 1: Aumentar tu ahorro mensual en 200 € podría adelantar varios años tu jubilación.`,
        `• Caso 2: Reducir tu gasto anual deseado en jubilación un 10% baja el capital necesario.`,
        `• Caso 3: Mejorar tu rentabilidad esperada del ${Math.round(rentabilidad * 100)}% al ${Math.round((rentabilidad + 0.02) * 100)}% tiene un impacto enorme a largo plazo.`
      );
    } else {
      acciones.push(
        `• Case 1: Increasing your monthly savings by 200 € could bring your retirement forward several years.`,
        `• Case 2: Reducing your desired annual spending in retirement by 10% lowers the required capital.`,
        `• Case 3: Improving your expected return from ${Math.round(rentabilidad * 100)}% to ${Math.round((rentabilidad + 0.02) * 100)}% has a huge long‑term impact.`
      );
    }
  } else {
    if (currentLang === 'es') {
      acciones.push(
        `• Ejemplo: Mantener tu ahorro mensual y evitar subidas fuertes de gasto te ayuda a consolidar esa jubilación anticipada.`,
        `• Ejemplo: Añadir nuevas fuentes de ingresos pasivos reduce tu dependencia de la pensión pública.`
      );
    } else {
      acciones.push(
        `• Example: Maintaining your monthly savings and avoiding strong spending increases helps consolidate early retirement.`,
        `• Example: Adding new sources of passive income reduces your dependence on public pension.`
      );
    }
  }

  acciones.forEach(texto => {
    const li = document.createElement('li');
    li.textContent = texto;
    accionesLista.appendChild(li);
  });

  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: edades,
      datasets: [{
        label: currentLang === 'es' ? 'Capital estimado (€)' : 'Estimated capital (€)',
        data: capitales,
        borderColor: '#facc15',
        backgroundColor: 'rgba(250, 204, 21, 0.15)',
        tension: 0.25,
        fill: true
      }]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#e5e7eb' } }
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

function estimarPension(pais, ingresos, aniosTotales) {
  let factorBase = 0.5;
  if (aniosTotales >= 35) factorBase = 0.7;
  else if (aniosTotales >= 25) factorBase = 0.6;

  switch (pais) {
    case 'es':
      return ingresos * factorBase * 0.6;
    case 'uk':
      return ingresos * factorBase * 0.5;
    case 'us':
      return ingresos * factorBase * 0.4;
    case 'de':
      return ingresos * factorBase * 0.55;
    default:
      return ingresos * factorBase * 0.5;
  }
}
