let chart = null;

function scrollToForm() {
  const form = document.getElementById('form');
  if (form) form.scrollIntoView({ behavior: 'smooth' });
}

function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  let edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const gastoAnual = Number(document.getElementById('gastoAnual').value);
  const inflacion = Number(document.getElementById('inflacion').value) / 100;
  const rentabilidad = Number(document.getElementById('rentabilidad').value) / 100;
  let capital = Number(document.getElementById('capitalActual').value);
  const aportacionAnual = Number(document.getElementById('aportacionAnual').value);
  const loteria = Number(document.getElementById('loteria').value);
  const ingresosPasivos = Number(document.getElementById('ingresosPasivos').value);
  const pensionPublica = Number(document.getElementById('pensionPublica').value);

  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const accionesLista = document.getElementById('accionesLista');

  accionesLista.innerHTML = '';

  // Proyección de capital año a año
  const edades = [];
  const capitales = [];

  let edad = edadActual;
  let herenciaAplicada = false;
  let edadMax = 75; // límite razonable

  let edadJubilacionReal = null;

  while (edad <= edadMax) {
    edades.push(edad);
    capitales.push(Math.round(capital));

    // Aplicar herencia una sola vez al llegar a la edad objetivo
    if (!herenciaAplicada && edad >= edadObjetivo && loteria > 0) {
      capital += loteria;
      herenciaAplicada = true;
    }

    // Aportación anual mientras no estás jubilado
    if (edad < edadObjetivo) {
      capital += aportacionAnual;
    }

    // Crecimiento del capital
    capital *= (1 + rentabilidad);

    // Cálculo del gasto ajustado por inflación a esa edad
    const añosHastaEdad = edad - edadActual;
    const gastoAjustado = gastoAnual * Math.pow(1 + inflacion, añosHastaEdad);

    // Ingresos recurrentes (pensión + pasivos)
    const ingresosRecurrentes = ingresosPasivos + pensionPublica;

    // Necesidad neta de capital (regla del 4%)
    const gastoNeto = Math.max(gastoAjustado - ingresosRecurrentes, 0);
    const capitalNecesario = gastoNeto * 25;

    if (capital >= capitalNecesario && edadJubilacionReal === null) {
      edadJubilacionReal = edad;
    }

    edad++;
  }

  const añoActual = new Date().getFullYear();
  let mensajePrincipal = '';
  let mensajeSecundario = '';

  if (edadJubilacionReal) {
    const añoJubilacion = añoActual + (edadJubilacionReal - edadActual);
    mensajePrincipal = `Puedes jubilarte aproximadamente en el año ${añoJubilacion}, a los ${edadJubilacionReal} años.`;
    mensajeSecundario = `Tu capital podría sostener tu nivel de gasto ajustado por inflación usando la regla del 4%.`;
  } else {
    mensajePrincipal = `Con los datos actuales, no alcanzas un nivel de capital suficiente antes de los ${edadMax} años.`;
    mensajeSecundario = `Prueba aumentando tu ahorro anual, reduciendo tu gasto objetivo o ajustando la rentabilidad esperada.`;
  }

  resultadoTexto.textContent = mensajePrincipal;
  subResultado.textContent = mensajeSecundario;

  // Acciones sugeridas
  const acciones = [];

  if (!edadJubilacionReal || edadJubilacionReal > edadObjetivo) {
    acciones.push(
      `• Aumentar tu ahorro anual un 20% podría adelantar varios años tu jubilación.`,
      `• Reducir tu gasto anual objetivo un 10% disminuye el capital necesario.`,
      `• Revisar tu estrategia de inversión para acercarte a la rentabilidad esperada del ${Math.round(rentabilidad * 100)}%.`
    );
  } else {
    acciones.push(
      `• Mantener tu nivel de ahorro te ayuda a consolidar la jubilación anticipada.`,
      `• Considera diversificar tus ingresos pasivos para reducir dependencia de la pensión pública.`
    );
  }

  acciones.forEach(texto => {
    const li = document.createElement('li');
    li.textContent = texto;
    accionesLista.appendChild(li);
  });

  // Gráfica
  const ctx = document.getElementById('grafica').getContext('2d');

  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: edades,
      datasets: [{
        label: 'Capital estimado (€)',
        data: capitales,
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        tension: 0.2,
        fill: true
      }]
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: '#e5e7eb'
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
