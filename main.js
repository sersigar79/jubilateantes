let chart = null;

function scrollToForm() {
  document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
}

function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  const edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const capitalActual = Number(document.getElementById('capitalActual').value);
  const dineroMensual = Number(document.getElementById('dineroMensual').value);
  const pensionMensual = Number(document.getElementById('pensionMensual').value);

  const años = edadObjetivo - edadActual;
  if (años <= 0) {
    document.getElementById('resultadoTexto').textContent =
      'La edad de jubilación debe ser mayor que la edad actual.';
    return;
  }

  const inflacion = 0.025;
  const rentabilidad = 0.06;

  const dineroMensualAjustado = dineroMensual * Math.pow(1 + inflacion, años);
  const dineroNetoMensual = Math.max(dineroMensualAjustado - pensionMensual, 0);
  const dineroNetoAnual = dineroNetoMensual * 12;

  const capitalNecesario = dineroNetoAnual * 25;

  const falta = Math.max(capitalNecesario - capitalActual, 0);

  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const accionesLista = document.getElementById('accionesLista');
  accionesLista.innerHTML = '';

  resultadoTexto.textContent =
    `Para jubilarte a los ${edadObjetivo}, necesitarás aproximadamente ${Math.round(capitalNecesario)} €.`;

  subResultado.textContent =
    `Actualmente tienes ${Math.round(capitalActual)} €. Te faltan ${Math.round(falta)} € para recibir ${dineroMensual} €/mes (ajustado a inflación).`;

  const ahorroMensualNecesario = falta / (años * 12);

  const li1 = document.createElement('li');
  li1.textContent =
    `Ahorrar unos ${Math.round(ahorroMensualNecesario)} € al mes te permite llegar a tiempo.`;

  const li2 = document.createElement('li');
  li2.textContent =
    `Reducir tu gasto mensual en esa cantidad también te acerca sin necesidad de ganar más.`;

  const li3 = document.createElement('li');
  li3.textContent =
    `Si aumentas tus ingresos en ${Math.round(ahorroMensualNecesario)} € al mes (side projects, ventas, consultoría), aceleras tu libertad.`;

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
    const necesario = capitalNecesario;
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
