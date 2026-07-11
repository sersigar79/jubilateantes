let chart = null;

function scrollToForm() {
  document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
}

function scrollToLead() {
  document.getElementById('lead').scrollIntoView({ behavior: 'smooth' });
}

function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  const edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const capitalActual = Number(document.getElementById('capitalActual').value);

  const años = edadObjetivo - edadActual;
  if (años <= 0 || !edadActual || !edadObjetivo) {
    document.getElementById('resultadoTexto').textContent =
      'Introduce una edad actual y una edad de jubilación coherentes.';
    document.getElementById('subResultado').textContent = '';
    return;
  }

  const gastoAnualDeseado = 24000; // objetivo de vida decente
  const inflacion = 0.025;
  const rentabilidad = 0.06;

  const gastoAjustado = gastoAnualDeseado * Math.pow(1 + inflacion, años);
  const capitalNecesario = gastoAjustado * 25;

  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const accionesLista = document.getElementById('accionesLista');
  accionesLista.innerHTML = '';

  const falta = Math.max(capitalNecesario - capitalActual, 0);

  resultadoTexto.textContent =
    `Para jubilarte a los ${edadObjetivo}, necesitarás aproximadamente ${Math.round(capitalNecesario)} €.`;

  if (falta === 0) {
    subResultado.textContent =
      `Ya tienes el capital objetivo (${Math.round(capitalActual)} €). Podrías estar mucho más cerca de dejar tu trabajo.`;
  } else {
    subResultado.textContent =
      `Actualmente tienes ${Math.round(capitalActual)} €. Te faltan unos ${Math.round(falta)} € para ese objetivo.`;
  }

  const ahorroMensualNecesario = falta / (años * 12);

  const li1 = document.createElement('li');
  li1.textContent =
    `Si ahorras unos ${Math.round(ahorroMensualNecesario)} € al mes, llegarías a tu objetivo a los ${edadObjetivo}.`;

  const li2 = document.createElement('li');
  li2.textContent =
    `Reducir tu gasto mensual en esa cantidad te acerca igual de rápido, sin necesidad de ganar más.`;

  const li3 = document.createElement('li');
  li3.textContent =
    `Si aumentas tus ingresos en ${Math.round(ahorroMensualNecesario)} € al mes (side projects, ventas, consultoría), puedes acelerar aún más tu libertad.`;

  accionesLista.appendChild(li1);
  accionesLista.appendChild(li2);
  accionesLista.appendChild(li3);

  dibujarGrafica(edadActual, edadObjetivo, capitalActual, capitalNecesario, rentabilidad, años);
}

function dibujarGrafica(edadActual, edadObjetivo, capitalActual, capitalNecesario, rentabilidad, años) {
  const edades = [];
  const capitales = [];
  const necesarios = [];

  let capital = capitalActual;
  const ahorroMensual = (capitalNecesario - capitalActual) / (años * 12);
  const ahorroAnual = ahorroMensual * 12;

  for (let edad = edadActual; edad <= edadObjetivo; edad++) {
    edades.push(edad);
    capitales.push(Math.round(capital));

    const añosHasta = edad - edadActual;
    const gastoAjustado = 24000 * Math.pow(1 + 0.025, añosHasta);
    const necesario = gastoAjustado * 25;
    necesarios.push(Math.round(necesario));

    capital += ahorroAnual;
    capital *= (1 + rentabilidad);
  }

  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: edades,
      datasets: [
        {
          label: 'Capital estimado (€)',
          data: capitales,
          borderColor: '#0071e3',
          backgroundColor: 'rgba(0, 113, 227, 0.08)',
          tension: 0.25,
          fill: true
        },
        {
          label: 'Capital necesario (€)',
          data: necesarios,
          borderColor: '#ff9500',
          backgroundColor: 'rgba(255, 149, 0, 0.05)',
          tension: 0.25,
          fill: false
        }
      ]
    },
    options: {
      plugins: {
        legend: { labels: { color: '#333' } }
      },
      scales: {
        x: {
          ticks: { color: '#666' },
          grid: { color: '#e5e5ea' }
        },
        y: {
          ticks: { color: '#666' },
          grid: { color: '#e5e5ea' }
        }
      }
    }
  });
}

function enviarLead() {
  const email = document.getElementById('email').value;
  const leadMensaje = document.getElementById('leadMensaje');

  if (!email || !email.includes('@')) {
    leadMensaje.textContent = 'Introduce un email válido.';
    return;
  }

  // Aquí iría la integración real (Zapier, API, etc.)
  leadMensaje.textContent =
    'Perfecto. Imagina aquí que recibes un plan en tu correo. En producción, este botón capturaría leads reales.';
}
