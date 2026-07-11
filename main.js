function scrollToForm() {
  document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
}

function calcular() {
  const edadActual = Number(document.getElementById('edadActual').value);
  const edadObjetivo = Number(document.getElementById('edadObjetivo').value);
  const capitalActual = Number(document.getElementById('capitalActual').value);

  const años = edadObjetivo - edadActual;

  const gastoAnualDeseado = 20000;
  const inflacion = 0.025;
  const rentabilidad = 0.06;

  const gastoAjustado = gastoAnualDeseado * Math.pow(1 + inflacion, años);
  const capitalNecesario = gastoAjustado * 25;

  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const accionesLista = document.getElementById('accionesLista');
  accionesLista.innerHTML = '';

  resultadoTexto.textContent =
    `Para jubilarte a los ${edadObjetivo}, necesitarás aproximadamente ${Math.round(capitalNecesario)} €.`;

  subResultado.textContent =
    `Actualmente tienes ${capitalActual} €. Te faltan ${Math.round(capitalNecesario - capitalActual)} €.`;

  const ahorroMensualNecesario =
    (capitalNecesario - capitalActual) / (años * 12);

  const li1 = document.createElement('li');
  li1.textContent = `Ahorrar unos ${Math.round(ahorroMensualNecesario)} € al mes.`;

  const li2 = document.createElement('li');
  li2.textContent = `Reducir tu gasto mensual en unos ${Math.round(ahorroMensualNecesario)} €.`;

  const li3 = document.createElement('li');
  li3.textContent = `Aumentar tus ingresos en ${Math.round(ahorroMensualNecesario)} € al mes.`;

  accionesLista.appendChild(li1);
  accionesLista.appendChild(li2);
  accionesLista.appendChild(li3);
}
