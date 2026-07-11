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
      mensajePrincipal = `Podrías jubilarte alrededor del año ${añoJubilacion}, a los ${edadJubilacionReal} años.`;
      mensajeSecundario =
        `Ingresos estimados: ${Math.round(ingresoMensualTotal)} €/mes · ` +
        `Gasto deseado: ${Math.round(gastoMensualJubilacion)} €/mes`;
      mensajeVeredicto = puede
        ? `✅ Sí, puedes jubilarte a esa edad.`
        : `❌ No, no puedes mantener tu nivel de gasto a esa edad.`;
    } else {
      mensajePrincipal = `You could retire around ${añoJubilacion}, at age ${edadJubilacionReal}.`;
      mensajeSecundario =
        `Estimated income: ${Math.round(ingresoMensualTotal)} €/month · ` +
        `Desired spending: ${Math.round(gastoMensualJubilacion)} €/month`;
      mensajeVeredicto = puede
        ? `✅ Yes, you can retire at that age.`
        : `❌ No, you cannot maintain your spending level at that age.`;
    }
  } else {
    if (currentLang === 'es') {
      mensajePrincipal = `No alcanzas suficiente capital antes de los ${edadMax} años.`;
      mensajeSecundario = `Prueba aumentando ahorro mensual o reduciendo gasto en jubilación.`;
      mensajeVeredicto = `❌ No es viable jubilarte a la edad objetivo.`;
    } else {
      mensajePrincipal = `You do not reach sufficient capital before age ${edadMax}.`;
      mensajeSecundario = `Try increasing monthly savings or reducing retirement spending.`;
      mensajeVeredicto = `❌ It is not viable to retire at the target age.`;
    }
  }

  resultadoTexto.textContent = mensajePrincipal;
  subResultado.textContent = mensajeSecundario;
  veredicto.textContent = mensajeVeredicto;

  const acciones = [];

  if (!edadJubilacionReal || edadJubilacionReal > edadObjetivo) {
    acciones.push(
      `• Aumentar ahorro mensual en 200 € adelanta varios años la jubilación.`,
      `• Reducir gasto anual en jubilación un 10% baja el capital necesario.`,
      `• Subir rentabilidad del ${Math.round(rentabilidad * 100)}% al ${Math.round((rentabilidad + 0.02) * 100)}% tiene gran impacto.`
    );
  } else {
    acciones.push(
      `• Mantener ahorro mensual consolida la jubilación anticipada.`,
      `• Añadir ingresos pasivos reduce dependencia de la pensión.`
    );
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
    case 'es': return ingresos * factorBase * 0.6;
    case 'uk': return ingresos * factorBase * 0.5;
    case 'us': return ingresos * factorBase * 0.4;
    case 'de': return ingresos * factorBase * 0.55;
    default: return ingresos * factorBase * 0.5;
  }
}
