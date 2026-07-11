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
  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const accionesLista = document.getElementById('accionesLista');

  if (años <= 0) {
    resultadoTexto.textContent =
      'La edad de jubilación debe ser mayor que la edad actual.';
    subResultado.textContent = '';
    accionesLista.innerHTML = '';
    return;
  }

  const inflacion = 0.025;
  const rentabilidad = 0.06;

  // Capital necesario a la edad objetivo (referencia)
  const dineroMensualAjustadoObjetivo = dineroMensual * Math.pow(1 + inflacion, años);
  const pensionAplicadaObjetivo = edadObjetivo >= 67 ? pensionMensual : 0;
  const dineroNetoMensualObjetivo = Math.max(dineroMensualAjustadoObjetivo - pensionAplicadaObjetivo, 0);
  const dineroNetoAnualObjetivo = dineroNetoMensualObjetivo * 12;
  const capitalNecesarioObjetivo = dineroNetoAnualObjetivo * 25;

  const faltaObjetivo = Math.max(capitalNecesarioObjetivo - capitalActual, 0);

  resultadoTexto.textContent =
    `Para jubilarte a los ${edadObjetivo}, necesitarás aproximadamente ${Math.round(capitalNecesarioObjetivo)} €.`;

  subResultado.textContent =
    `Actualmente tienes ${Math.round(capitalActual)} €. Te faltan unos ${Math.round(faltaObjetivo)} € para recibir ${dineroMensual} €/mes (ajustado a inflación), teniendo en cuenta que la pensión pública a partir de los 67 años reduce lo que necesitas ahorrar tú.`;

  // Escenarios de ahorro
  const ahorroMensualBase = ahorroMensual;
  const ahorroMensual10 = ahorroMensual * 1.1;
  const ahorroMensual20 = ahorroMensual * 1.2;

  const edades = [];
  const capitalBase = [];
  const capital10 = [];
  const capital20 = [];
  const necesarios = [];

  let capBase = capitalActual;
  let cap10 = capitalActual;
  let cap20 = capitalActual;

  let edadLlegadaBase = null;
  let edadLlegada10 = null;
  let edadLlegada20 = null;

  for (let edad = edadActual; edad <= edadObjetivo; edad++) {
    const añosHasta = edad - edadActual;

    // Ajustamos el ingreso deseado por inflación hasta esa edad
    const dineroMensualAjustado = dineroMensual * Math.pow(1 + inflacion, añosHasta);

    // Pensión solo a partir de los 67
    const pensionAplicada = edad >= 67 ? pensionMensual : 0;

    const dineroNetoMensual = Math.max(dineroMensualAjustado - pensionAplicada, 0);
    const dineroNetoAnual = dineroNetoMensual * 12;

    const capitalNecesarioEdad = dineroNetoAnual * 25;

    edades.push(edad);
    necesarios.push(Math.round(capitalNecesarioEdad));

    // Proyección capital con ahorro base
    capBase += ahorroMensualBase * 12;
    capBase *= (1 + rentabilidad);
    capitalBase.push(Math.round(capBase));

    // Proyección capital con ahorro +10%
    cap10 += ahorroMensual10 * 12;
    cap10 *= (1 + rentabilidad);
    capital10.push(Math.round(cap10));

    // Proyección capital con ahorro +20%
    cap20 += ahorroMensual20 * 12;
    cap20 *= (1 + rentabilidad);
    capital20.push(Math.round(cap20));

    // Detectar primera edad en la que se alcanza el capital necesario
    if (!edadLlegadaBase && capBase >= capitalNecesarioEdad) {
      edadLlegadaBase = edad;
    }
    if (!edadLlegada10 && cap10 >= capitalNecesarioEdad) {
      edadLlegada10 = edad;
    }
    if (!edadLlegada20 && cap20 >= capitalNecesarioEdad) {
      edadLlegada20 = edad;
    }
  }

  // Explicaciones claras
  accionesLista.innerHTML = '';

  const li1 = document.createElement('li');
  if (edadLlegadaBase) {
    li1.textContent =
      `Con tu ahorro actual (${Math.round(ahorroMensualBase)} € al mes), llegarías al capital necesario alrededor de los ${edadLlegadaBase} años.`;
  } else {
    li1.textContent =
      `Con tu ahorro actual (${Math.round(ahorroMensualBase)} € al mes), no alcanzas el capital necesario antes de los ${edadObjetivo} años.`;
  }

  const li2 = document.createElement('li');
  if (edadLlegada10) {
    li2.textContent =
      `Si ahorras un 10% más (${Math.round(ahorroMensual10)} € al mes), alcanzarías el objetivo aproximadamente a los ${edadLlegada10} años.`;
  } else {
    li2.textContent =
      `Ni siquiera ahorrando un 10% más (${Math.round(ahorroMensual10)} € al mes) llegas al objetivo antes de los ${edadObjetivo} años.`;
  }

  const li3 = document.createElement('li');
  if (edadLlegada20) {
    li3.textContent =
      `Si ahorras un 20% más (${Math.round(ahorroMensual20)} € al mes), podrías llegar alrededor de los ${edadLlegada20} años.`;
  } else {
    li3.textContent =
      `Ni siquiera ahorrando un 20% más (${Math.round(ahorroMensual20)} € al mes) alcanzas el objetivo antes de los ${edadObjetivo} años.`;
  }

  const li4 = document.createElement('li');
  li4.textContent =
    `La diferencia viene de tres factores: lo que quieres cobrar al mes, la inflación hasta esa edad y el hecho de que a partir de los 67 la pensión pública cubre parte de ese ingreso y reduce el capital que necesitas ahorrar tú.`;

  accionesLista.appendChild(li1);
  accionesLista.appendChild(li2);
  accionesLista.appendChild(li3);
  accionesLista.appendChild(li4);

  dibujarGrafica(edades, capitalBase, capital10, capital20, necesarios);
}

function dibujarGrafica(edades, capitalBase, capital10, capital20, necesarios) {
  const ctx = document.getElementById('grafica').getContext('2d');
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: edades,
      datasets: [
        {
          label: 'Capital con ahorro actual',
          data: capitalBase,
          borderColor: '#0071e3',
          backgroundColor: 'rgba(0, 113, 227, 0.08)',
          tension: 0.25,
          fill: true
        },
        {
          label: 'Capital ahorrando +10%',
          data: capital10,
          borderColor: '#34c759',
          backgroundColor: 'rgba(52, 199, 89, 0.08)',
          tension: 0.25,
          fill: false
        },
        {
          label: 'Capital ahorrando +20%',
          data: capital20,
          borderColor: '#ff9500',
          backgroundColor: 'rgba(255, 149, 0, 0.08)',
          tension: 0.25,
          fill: false
        },
        {
          label: 'Capital necesario por edad',
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
