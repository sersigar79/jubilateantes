function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  const edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const gastoAnualHoy = Number(document.getElementById('gastoAnual').value);
  const inflacion = Number(document.getElementById('inflacion').value) / 100;
  const rentabilidad = Number(document.getElementById('rentabilidad').value) / 100;
  const capitalActual = Number(document.getElementById('capitalActual').value);
  const aportacionAnual = Number(document.getElementById('aportacionAnual').value);
  const loteria = Number(document.getElementById('loteria').value);
  const ingresosPasivos = Number(document.getElementById('ingresosPasivos').value);
  const pensionPublica = Number(document.getElementById('pensionPublica').value);

  const años = edadObjetivo - edadActual;

  const gastoFuturo = gastoAnualHoy * Math.pow(1 + inflacion, años);

  const gastoCubierto = gastoFuturo - pensionPublica - ingresosPasivos;
  const gastoFinal = Math.max(gastoCubierto, 0);

  const objetivo = gastoFinal * 25;

  const capitalInicial = capitalActual + loteria;

  const capitalFuturo =
    capitalInicial * Math.pow(1 + rentabilidad, años) +
    aportacionAnual * ((Math.pow(1 + rentabilidad, años) - 1) / rentabilidad);

  const texto =
    capitalFuturo >= objetivo
      ? `¡Lo consigues! Podrías jubilarte a los ${edadObjetivo}.`
      : `Te faltan ${(objetivo - capitalFuturo).toFixed(0)} € para jubilarte a los ${edadObjetivo}.`;

  document.getElementById('resultadoTexto').innerText = texto;

  const añosArray = [];
  const capitalArray = [];
  const objetivoArray = [];

  let capital = capitalInicial;

  for (let i = 0; i <= años; i++) {
    añosArray.push(edadActual + i);
    capitalArray.push(capital);
    objetivoArray.push(objetivo);
    capital = capital * (1 + rentabilidad) + aportacionAnual;
  }

  new Chart(document.getElementById('grafica'), {
    type: 'line',
    data: {
      labels: añosArray,
      datasets: [
        {
          label: 'Tu capital proyectado',
          data: capitalArray,
          borderColor: '#4a6cf7',
          borderWidth: 3,
          fill: false
        },
        {
          label: 'Objetivo necesario',
          data: objetivoArray,
          borderColor: '#ff4d4d',
          borderWidth: 3,
          borderDash: [5, 5],
          fill: false
        }
      ]
    }
  });
}
