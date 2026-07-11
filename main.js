let chart = null;

function scrollToForm() {
  document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
}

function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  const edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const capitalActual = Number(document.getElementById('capitalActual').value);
  const ahorroMensual = Number(document.getElementById('ahorroMensual').value);
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
    `Si ahorras ${Math.round(ahorroMensualNecesario)} € al mes, llegarás a tiempo.`;

  const li2 = document.createElement('li');
  li2.textContent =
    `Si ahorras un 10% más (${Math.round(ahorroMensual * 1.1)} €), llegarás antes.`;

  const li3 = document.createElement('li');
  li3.textContent =
    `Si ahorras un 20% más (${Math.round(ahorroMensual * 1.2)} €), adelantas varios años tu libertad.`;

  accionesLista.appendChild(li1);
  accionesLista.appendChild(li2);
  accionesLista.appendChild(li3);

  dibujarGrafica(
    edadActual,
    edadObjetivo,
    capitalActual,
    capitalNecesario,
    ahorroMensual,
    rentabilidad,
    años
  );
}

function dibujarGrafica(edadActual, edadObjetivo, capitalActual, capitalNecesario, ahorroMensual, rentabilidad, años) {
  const edades = [];
  const capitalBase = [];
  const capital10 = [];
  const capital20 = [];
  const necesarios = [];

  let capBase = capitalActual;
  let cap10 = capitalActual;
  let cap20 = capitalActual;

  const ahorroAnual = ahorroMensual * 12;
  const ahorroAnual10 = ahorroMensual * 1.1 * 12;
  const ahorroAnual20 = ahorroMensual * 1.2 * 12;

  for (let edad = edadActual; edad <= edadObjetivo; edad++) {
    edades.push(edad);

    capitalBase.push(Math.round(capBase));
    capital10.push(Math.round(cap10));
    capital20.push(Math.round(cap20));
    necesarios.push(Math.round(capitalNecesario));

    capBase += ahorroAnual;
    capBase *= (1 + rentabilidad);

    cap10 += ahorroAnual10;
    cap10 *= (1 + rentabilidad);

    cap20 += ahorroAnual20;
    cap20 *= (1 + rentabilidad);
  }

  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: edades,
      datasets: [
        {
          label: 'Capital actual proyectado',
          data: capitalBase,
          borderColor: '#0071e3',
          backgroundColor: 'rgba(0, 113, 227, 0.08)',
          tension: 0.25,
          fill: true
        },
        {
          label: 'Ahorrando +10%',
          data: capital10,
          borderColor: '#34c759',
          backgroundColor: 'rgba(52, 199, 89, 0.08)',
          tension: 0.25,
          fill: false
        },
        {
          label: 'Ahorrando +20%',
          data: capital20,
          borderColor: '#ff9500',
          backgroundColor: 'rgba(255, 149, 0, 0.08)',
          tension: 0.25,
          fill: false
        },
        {
          label: 'Capital necesario',
          data: necesarios,
          borderColor: '#ff3b30',
          backgroundColor: 'rgba(255, 59, 48, 0.08)',
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
