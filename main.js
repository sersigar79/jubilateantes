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
  const aniosCotizados = Number(document.getElementById('aniosCotizados').value);
  const aniosFuturosCotizados = Number(document.getElementById('aniosFuturosCotizados').value);

  const ingresosActuales = Number(document.getElementById('ingresosActuales').value);
  const gastoAnual = Number(document.getElementById('gastoAnual').value);
  const porcentajeAhorro = Number(document.getElementById('porcentajeAhorro').value) / 100;
  const ahorroExtra = Number(document.getElementById('aportacionAnual').value);

  const inflacion = Number(document.getElementById('inflacion').value) / 100;
  const rentabilidad = Number(document.getElementById('rentabilidad').value) / 100;
  let capital = Number(document.getElementById('capitalActual').value);
  const ingresosPasivos = Number(document.getElementById('ingresosPasivos').value);
  let pensionPublica = Number(document.getElementById('pensionPublica').value);
  const loteria = Number(document.getElementById('loteria').value);

  const resultadoTexto = document.getElementById('resultadoTexto');
  const subResultado = document.getElementById('subResultado');
  const accionesLista = document.getElementById('accionesLista');
  accionesLista.innerHTML = '';

  // Estimar pensión pública si el usuario no la ha puesto y está en un país soportado
  if (pensionPublica === 0) {
    pensionPublica = estimarPension(pais, ingresosActuales, aniosCotizados + aniosFuturosCotizados);
  }

  // Ahorro anual total derivado de ingresos + extra
  const ahorroDerivado = Math.max(ingresosActuales - gastoAnual, 0);
  const ahorroPorPorcentaje = ingresosActuales * porcentajeAhorro;
  const ahorroAnualTotal = Math.max(ahorroDerivado, ahorroPorPorcentaje) + ahorroExtra;

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
    const gastoAjustado = gastoAnual * Math.pow(1 + inflacion, añosHastaEdad);
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

  if (edadJubilacionReal) {
    const añoJubilacion = añoActual + (edadJubilacionReal - edadActual);
    const ingresoAnualTotal = ingresosRecurrentesEnJubilacion + capitalEnJubilacion * 0.04;
    const ingresoMensualTotal = ingresoAnualTotal / 12;

    if (currentLang === 'es') {
      mensajePrincipal = `Puedes jubilarte aproximadamente en el año ${añoJubilacion}, a los ${edadJubilacionReal} años.`;
      mensajeSecundario =
        `Con tus parámetros actuales, tu ingreso estimado en jubilación sería de unos ` +
        `${Math.round(ingresoAnualTotal).toLocaleString('es-ES')} € al año ` +
        `(${Math.round(ingresoMensualTotal).toLocaleString('es-ES')} € al mes).`;
    } else {
      mensajePrincipal = `You can approximately retire in ${añoJubilacion}, at age ${edadJubilacionReal}.`;
      mensajeSecundario =
        `With your current parameters, your estimated retirement income would be around ` +
        `${Math.round(ingresoAnualTotal).toLocaleString('en-US')} € per year ` +
        `(${Math.round(ingresoMensualTotal).toLocaleString('en-US')} € per month).`;
    }
  } else {
    if (currentLang === 'es') {
      mensajePrincipal = `Con los datos actuales, no alcanzas un nivel de capital suficiente antes de los ${edadMax} años.`;
      mensajeSecundario = `Prueba aumentando tu ahorro anual, reduciendo tu gasto objetivo o ajustando la rentabilidad esperada.`;
    } else {
      mensajePrincipal = `With the current data, you do not reach sufficient capital before age ${edadMax}.`;
      mensajeSecundario = `Try increasing your annual savings, reducing your target spending or adjusting expected returns.`;
    }
  }

  resultadoTexto.textContent = mensajePrincipal;
  subResultado.textContent = mensajeSecundario;

  const acciones = [];

  if (!edadJubilacionReal || edadJubilacionReal > edadObjetivo) {
    if (currentLang === 'es') {
      acciones.push(
        `• Aumentar tu ahorro anual un 20% podría adelantar varios años tu jubilación.`,
        `• Reducir tu gasto anual objetivo un 10% disminuye el capital necesario.`,
        `• Revisar tu estrategia de inversión para acercarte a una rentabilidad del ${Math.round(rentabilidad * 100)}%.`
      );
    } else {
      acciones.push(
        `• Increasing your annual savings by 20% could bring your retirement forward several years.`,
        `• Reducing your target annual spending by 10% lowers the required capital.`,
        `• Reviewing your investment strategy to reach an expected return of ${Math.round(rentabilidad * 100)}% can help.`
      );
    }
  } else {
    if (currentLang ===
