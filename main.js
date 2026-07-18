/* ===================== Constantes oficiales 2026 (España) ===================== */
const PENSION_MAX_MENSUAL = 3359.60;
const BASE_MAX_MENSUAL = 5101.20;
const PENSION_MIN_ANUAL_SIN_CONYUGE = 12441.80;
const UMBRAL_ANOS_EDAD_ORDINARIA = 38 + 3/12;
const EDAD_ORDINARIA_CORTA = 65;
const EDAD_ORDINARIA_LARGA = 66 + 10/12;
const MIN_ANOS_PENSION = 15;          // mínimo para tener derecho a CUALQUIER pensión contributiva
const MIN_ANOS_JUB_ANTICIPADA = 35;   // mínimo adicional para jubilación anticipada VOLUNTARIA
const MAX_MESES_ANTICIPO = 24;

const COEF_TABLE = {
  1:[3.26,3.11,2.96,2.81],2:[3.38,3.23,3.08,2.92],3:[3.52,3.36,3.20,3.04],
  4:[3.67,3.50,3.33,3.17],5:[3.83,3.65,3.48,3.30],6:[4.00,3.82,3.64,3.45],
  7:[4.19,4.00,3.81,3.61],8:[4.40,4.20,4.00,3.80],9:[4.63,4.42,4.21,4.00],
  10:[4.89,4.67,4.44,4.22],11:[5.18,4.94,4.71,4.47],12:[5.50,5.25,5.00,4.75],
  13:[5.87,5.60,5.33,5.07],14:[6.29,6.00,5.71,5.43],15:[7.00,6.46,6.15,5.83],
  16:[7.33,7.00,6.67,6.33],17:[8.00,7.64,7.27,6.91],18:[8.80,8.40,8.00,7.60],
  19:[9.78,9.33,8.89,8.40],20:[11.00,10.50,10.00,9.20],21:[12.57,12.00,11.43,10.00],
  22:[14.67,14.00,13.33,11.00],23:[17.60,16.50,15.00,12.00],24:[21.00,19.00,17.00,13.00],
};
function tramoIndex(a){ if(a<38+6/12)return 0; if(a<41+6/12)return 1; if(a<44+6/12)return 2; return 3; }
function edadOrdinaria(a){ return a>=UMBRAL_ANOS_EDAD_ORDINARIA?EDAD_ORDINARIA_CORTA:EDAD_ORDINARIA_LARGA; }
function edadOrdinariaProyectada(aniosCotizadosActuales, edadActual){
  const a65 = aniosCotizadosActuales + (65-edadActual);
  return a65 >= UMBRAL_ANOS_EDAD_ORDINARIA ? EDAD_ORDINARIA_CORTA : EDAD_ORDINARIA_LARGA;
}
function pctBaseReguladora(aniosCotizados){
  const meses = aniosCotizados*12;
  if(meses < MIN_ANOS_PENSION*12) return 0; // menos de 15 años: SIN derecho a pensión
  const extra1 = Math.min(meses-180, 49);
  let pct = 50 + extra1*0.21;
  const extra2 = Math.max(0, meses-180-49);
  pct += extra2*0.19;
  return Math.min(100, pct);
}
function coeficienteReductor(mesesAdelanto, aniosCotizados){
  const m = Math.max(0, Math.min(MAX_MESES_ANTICIPO, Math.round(mesesAdelanto)));
  if(m===0) return 0;
  return COEF_TABLE[m][tramoIndex(aniosCotizados)]/100;
}
function calcularPension({edadJubilacion, aniosCotizados, salarioBrutoAnual}){
  const baseMensual = Math.min(salarioBrutoAnual/12, BASE_MAX_MENSUAL);
  const eOrd = edadOrdinaria(aniosCotizados);
  const tieneMinimo = aniosCotizados >= MIN_ANOS_PENSION;
  const esAnticipada = edadJubilacion < eOrd - 0.01;
  const mesesAdelanto = esAnticipada ? Math.max(0, Math.round((eOrd-edadJubilacion)*12)) : 0;
  const cumpleAnticipada = !esAnticipada || (aniosCotizados >= MIN_ANOS_JUB_ANTICIPADA && mesesAdelanto <= MAX_MESES_ANTICIPO);
  const cumple = tieneMinimo && cumpleAnticipada;
  const pct = tieneMinimo ? pctBaseReguladora(aniosCotizados) : 0;
  const coef = (esAnticipada && cumpleAnticipada) ? coeficienteReductor(mesesAdelanto, aniosCotizados) : 0;
  const pensionMensual = cumple ? Math.min(baseMensual*(pct/100)*(1-coef), PENSION_MAX_MENSUAL) : 0;
  return {
    baseMensual, pct, eOrd, mesesAdelanto, esAnticipada, tieneMinimo, cumpleAnticipada, cumple, coef,
    pensionMensual, pensionAnual: pensionMensual*14,
    bajoMinimo: cumple && pensionMensual*14 < PENSION_MIN_ANUAL_SIN_CONYUGE,
  };
}
function fvAnnuityFactor(n,r){ if(n<=0) return 0; return r===0? n : (Math.pow(1+r,n)-1)/r; }

const fmtEUR = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(n))+' €';
const fmt1 = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(n);

/* ===================== Estado ===================== */
const S = {
  edadActual:45, edadObjetivo:60,
  patrimonioActual:60000, aportacionMensual:600,
  gastoMensual:1800,
  aniosCotizados:20, salarioBrutoMensual:2400,
  contarPension:true,
  rentabilidad:6, inflacion:2.5, edadFinDinero:90, ingresoPasivoMensual:0,
  pagaConvenio:false, baseConvenio:1200,
  loteriaEdadActual:45, loteriaCapital:300000, loteriaGastoMensual:1500,
  loteriaRentabilidad:4, loteriaInflacion:2.5, loteriaEdadMax:95,

  fechaInicioStr: (()=>{ const d=new Date(); d.setFullYear(d.getFullYear()-5); return d.toISOString().slice(0,10); })(),
  tipoCese:'improcedente', numPagasFiniquito:14, vacacionesPendientes:0,
};
const CUTOFF_TIME = new Date(2012,1,12).getTime(); // reforma laboral: 12/02/2012

function parseFechaInput(str){
  if(!str) return null;
  const [y,m,d] = str.split('-').map(Number);
  if(!y||!m||!d) return null;
  return new Date(y,m-1,d).getTime();
}
function segmentarDias(fechaInicioMs, fechaFinMs){
  if(fechaInicioMs>=fechaFinMs) return {diasAntes:0, diasDespues:0, diasTotal:0};
  let diasAntes=0, diasDespues=0;
  if(fechaInicioMs < CUTOFF_TIME){
    const finAntes = Math.min(fechaFinMs, CUTOFF_TIME);
    diasAntes = Math.max(0,(finAntes-fechaInicioMs)/86400000);
    if(fechaFinMs > CUTOFF_TIME) diasDespues = (fechaFinMs-CUTOFF_TIME)/86400000;
  } else {
    diasDespues = (fechaFinMs-fechaInicioMs)/86400000;
  }
  return {diasAntes, diasDespues, diasTotal:(fechaFinMs-fechaInicioMs)/86400000};
}
function diasDesdeUltimaPagaExtra(hoy){
  const year=hoy.getFullYear();
  const corte1=new Date(year,5,30).getTime(), corte2=new Date(year,11,31).getTime();
  const t=hoy.getTime();
  let ultimoCorte;
  if(t>corte2) ultimoCorte=corte2;
  else if(t>corte1) ultimoCorte=corte1;
  else ultimoCorte=new Date(year-1,11,31).getTime();
  return (t-ultimoCorte)/86400000;
}
function calcularDespido(){
  const hoy = Date.now();
  const inicio = parseFechaInput(S.fechaInicioStr);
  if(!inicio || inicio>=hoy) return null;
  const {diasAntes, diasDespues, diasTotal} = segmentarDias(inicio, hoy);
  const aniosAntes = diasAntes/365.25, aniosDespues = diasDespues/365.25, aniosTotal = diasTotal/365.25;
  const salarioDiario = (S.salarioBrutoMensual*S.numPagasFiniquito)/365;

  let diasIndem=0;
  if(S.tipoCese==='improcedente'){
    const diasTramo1 = aniosAntes>0 ? Math.min(aniosAntes*45, 42*30) : 0;
    if(diasTramo1 > 24*30){ diasIndem = diasTramo1; }
    else { diasIndem = Math.min(diasTramo1 + aniosDespues*33, 24*30); }
  } else if(S.tipoCese==='objetivo'){
    diasIndem = Math.min(aniosTotal*20, 12*30);
  } else {
    diasIndem = 0;
  }
  const indemnizacion = diasIndem*salarioDiario;
  const importeVacaciones = S.vacacionesPendientes*salarioDiario;
  const diasDesdeExtra = diasDesdeUltimaPagaExtra(new Date());
  const parteProporcionalExtra = S.numPagasFiniquito>12 ? (S.salarioBrutoMensual*2/365)*diasDesdeExtra : 0;
  const finiquito = importeVacaciones + parteProporcionalExtra;
  const total = finiquito + indemnizacion;

  return {aniosTotal, aniosAntes, aniosDespues, salarioDiario, diasIndem, indemnizacion, importeVacaciones, parteProporcionalExtra, finiquito, total};
}

/* ===================== Motor de cálculo ===================== */
function computeAll(){
  const aniosHasta = Math.max(0, S.edadObjetivo - S.edadActual);
  const aniosCotizadosFinal = S.aniosCotizados + aniosHasta;
  const pension = calcularPension({edadJubilacion:S.edadObjetivo, aniosCotizados:aniosCotizadosFinal, salarioBrutoAnual:S.salarioBrutoMensual*12});
  const edadPension = pension.cumple ? S.edadObjetivo : pension.eOrd;
  const ingresoPasivoAnual = S.ingresoPasivoMensual*12;

  function gastoInfladoEn(edad){ return S.gastoMensual*12*Math.pow(1+S.inflacion/100, edad-S.edadActual); }
  function ingresosEn(edad){
    let ing = edad>=S.edadObjetivo ? ingresoPasivoAnual : 0;
    if(S.contarPension && edad>=edadPension) ing += pension.pensionAnual;
    return ing;
  }
  function gapEn(edad){ return Math.max(0, gastoInfladoEn(edad)-ingresosEn(edad)); }

  function objetivoPerpetuo(edadInicio){
    const finBridge = (S.contarPension||S.ingresoPasivoMensual>0) ? Math.max(edadInicio, edadPension) : edadInicio;
    const nBridge = Math.max(0, Math.round(finBridge-edadInicio));
    let cap=0;
    for(let n=0;n<nBridge;n++) cap += gapEn(edadInicio+n)/Math.pow(1+S.rentabilidad/100, n);
    const tailGap = gapEn(finBridge);
    cap += (25*tailGap)/Math.pow(1+S.rentabilidad/100, nBridge);
    return cap;
  }
  function objetivoConsumible(edadInicio){
    const nMax = Math.max(0, Math.round(S.edadFinDinero-edadInicio));
    let cap=0;
    for(let n=0;n<nMax;n++) cap += gapEn(edadInicio+n)/Math.pow(1+S.rentabilidad/100, n);
    return cap;
  }

  const rows=[];
  let patrimonio = S.patrimonioActual;
  const horizonte = Math.max(S.edadFinDinero, S.edadObjetivo+30) - S.edadActual;
  for(let i=0;i<=horizonte;i++){
    const edad = S.edadActual+i;
    if(i>0) patrimonio = patrimonio*(1+S.rentabilidad/100) + S.aportacionMensual*12;
    rows.push({ edad, patrimonio, objetivoPerpetuo: objetivoPerpetuo(edad), objetivoConsumible: objetivoConsumible(edad) });
  }
  const filaObjetivo = rows.find(r=>r.edad===S.edadObjetivo) || rows[0];

  const escA = calcularPension({edadJubilacion:S.edadObjetivo, aniosCotizados:S.aniosCotizados, salarioBrutoAnual:S.salarioBrutoMensual*12});
  const escB = pension;
  const eOrdProy = edadOrdinariaProyectada(S.aniosCotizados, S.edadActual);
  const aniosSiEspera = S.aniosCotizados + (eOrdProy - S.edadActual);
  const escC = calcularPension({edadJubilacion:eOrdProy, aniosCotizados:aniosSiEspera, salarioBrutoAnual:S.salarioBrutoMensual*12});
  const costeConvenioAnual = S.baseConvenio*12*0.295;

  return {aniosHasta, aniosCotizadosFinal, pension, edadPension, ingresoPasivoAnual, rows, filaObjetivo,
    escA, escB, escC, eOrdProy, aniosSiEspera, costeConvenioAnual};
}

function calcularPalancas(D){
  const objetivo = D.filaObjetivo.objetivoPerpetuo;
  const patrimonio = D.filaObjetivo.patrimonio;
  const shortfall = Math.max(0, objetivo-patrimonio);
  if(shortfall<=0){
    let edadPosible = S.edadObjetivo;
    for(const row of D.rows){ if(row.patrimonio>=row.objetivoPerpetuo){ edadPosible=row.edad; break; } }
    return {yaLoAlcanzas:true, edadPosible};
  }
  const n = Math.max(1, Math.round(S.edadObjetivo-S.edadActual));
  const r = S.rentabilidad/100;
  const extraMensual = (shortfall/fvAnnuityFactor(n,r))/12;

  function diffConRent(rNuevo){ const back=S.rentabilidad; S.rentabilidad=rNuevo; const DD=computeAll(); S.rentabilidad=back; return DD.filaObjetivo.patrimonio-DD.filaObjetivo.objetivoPerpetuo; }
  let rentNecesaria=null;
  if(diffConRent(40)>=0){ let lo=S.rentabilidad,hi=40; for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(diffConRent(mid)>=0) hi=mid; else lo=mid; } rentNecesaria=hi; }

  function diffConGasto(gNuevo){ const back=S.gastoMensual; S.gastoMensual=gNuevo; const DD=computeAll(); S.gastoMensual=back; return DD.filaObjetivo.patrimonio-DD.filaObjetivo.objetivoPerpetuo; }
  let gastoNecesario=null;
  if(diffConGasto(0)>=0){ let lo=0,hi=S.gastoMensual; for(let i=0;i<40;i++){ const mid=(lo+hi)/2; if(diffConGasto(mid)>=0) lo=mid; else hi=mid; } gastoNecesario=lo; }

  let edadNecesaria=null;
  for(const row of D.rows){ if(row.edad<S.edadObjetivo) continue; if(row.patrimonio>=row.objetivoPerpetuo){ edadNecesaria=row.edad; break; } }

  return {yaLoAlcanzas:false, shortfall, extraMensual, rentNecesaria, gastoNecesario, edadNecesaria};
}

function simularDuracion(capitalInicial, gastoMensual, rentabilidad, inflacion, edadInicio, edadMax){
  let capital = capitalInicial;
  const serie=[{edad:edadInicio, capital}];
  for(let edad=edadInicio+1; edad<=edadMax; edad++){
    const gastoAnual = gastoMensual*12*Math.pow(1+inflacion/100, edad-edadInicio);
    capital = capital*(1+rentabilidad/100) - gastoAnual;
    serie.push({edad, capital:Math.max(0,capital)});
    if(capital<=0) return {seAgota:true, edadAgota:edad, serie};
  }
  return {seAgota:false, edadAgota:null, serie};
}
function computeLoteria(){
  const res = simularDuracion(S.loteriaCapital, S.loteriaGastoMensual, S.loteriaRentabilidad, S.loteriaInflacion, S.loteriaEdadActual, S.loteriaEdadMax);
  const gastoAnualHoy = S.loteriaGastoMensual*12;
  const capitalParaSiempre = S.loteriaRentabilidad>0 ? gastoAnualHoy/(S.loteriaRentabilidad/100) : Infinity;
  return {...res, capitalParaSiempre};
}

/* ===================== UI helpers ===================== */
function field(key,label,suffix,step,hint){
  return `<div class="field"><label>${label}</label><div class="row">
    <input type="number" inputmode="decimal" data-field="${key}" step="${step||1}" value="${S[key]}" oninput="onNum('${key}',this.value)">
    ${suffix?`<span class="suffix">${suffix}</span>`:''}
  </div>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
}
function toggle(key,label,hint){
  return `<div class="toggle-row"><div><p>${label}</p>${hint?`<p class="hint">${hint}</p>`:''}</div>
    <button class="switch ${S[key]?'on':''}" onclick="onToggle('${key}')"><span></span></button></div>`;
}
function fieldDate(key,label,hint){
  return `<div class="field"><label>${label}</label><div class="row">
    <input type="date" data-field="${key}" value="${S[key]}" oninput="onStr('${key}',this.value)">
  </div>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
}
function segButtons(key, options){
  return `<div class="segmented">` + options.map(([val,label])=>
    `<button class="${String(S[key])===String(val)?'active':''}" onclick="onSeg('${key}','${val}')">${label}</button>`).join('') + `</div>`;
}
window.onStr=function(key,val){ S[key]=val; refreshCurrentTab(); }
window.onSeg=function(key,val){ const n=Number(val); S[key] = isNaN(n)?val:n; showTab(currentTab); }
function out(id,val){ const el=document.getElementById(id); if(el) el.textContent=val; }
function outClass(id,cls){ const el=document.getElementById(id); if(el) el.className=cls; }
function outShow(id,show){ const el=document.getElementById(id); if(el) el.style.display = show?'':'none'; }

window.onNum=function(key,val){
  const parsed = val===''?0:parseFloat(val);
  S[key] = isNaN(parsed) ? S[key] : parsed;
  refreshCurrentTab();
}
window.onToggle=function(key){ S[key]=!S[key]; showTab(currentTab); }
window.toggleLegal=function(){
  const el=document.getElementById('legal-full');
  el.style.display = el.style.display==='block' ? 'none' : 'block';
}

let currentTab='patrimonio';
let charts={};

function renderNav(){
  const tabs=[['patrimonio','Patrimonio'],['ingresos','Ingresos y pensión'],['objetivo','Tu objetivo'],['comparar','Comparar caminos'],['finiquito','Finiquito y despido'],['loteria','Lotería o herencia']];
  document.getElementById('tabs').innerHTML = tabs.map(([id,label])=>
    `<button class="${currentTab===id?'active':''}" onclick="setTab('${id}')">${label}</button>`).join('');
}
window.setTab=function(id){ currentTab=id; renderNav(); showTab(id); }

function showTab(id){
  const D = computeAll();
  const content = document.getElementById('content');
  if(id==='patrimonio'){ content.innerHTML = buildPatrimonio(D); refreshPatrimonio(D); }
  else if(id==='ingresos'){ content.innerHTML = buildIngresos(D); refreshIngresos(D); }
  else if(id==='objetivo'){ content.innerHTML = buildObjetivo(D); initChart1(D); refreshObjetivo(D); updateChart1(D); }
  else if(id==='comparar'){ content.innerHTML = buildTab2(D); initChart2(D); refreshTab2(D); updateChart2(D); }
  else if(id==='finiquito'){ content.innerHTML = buildFiniquito(); refreshFiniquito(); }
  else { content.innerHTML = buildTab3(); initChart3(); refreshTab3(); }
}
function refreshCurrentTab(){
  const D = computeAll();
  if(currentTab==='patrimonio'){ refreshPatrimonio(D); }
  else if(currentTab==='ingresos'){ refreshIngresos(D); }
  else if(currentTab==='objetivo'){ refreshObjetivo(D); updateChart1(D); }
  else if(currentTab==='comparar'){ refreshTab2(D); updateChart2(D); }
  else if(currentTab==='finiquito'){ refreshFiniquito(); }
  else { refreshTab3(); }
}

/* ===================== Tab: Patrimonio ===================== */
function buildPatrimonio(D){
  return `
  <div class="card">
    <h2>Tu patrimonio</h2>
    <div class="grid2">
      ${field('edadActual','Tu edad actual','años')}
      ${field('edadObjetivo','Edad a la que te quieres jubilar','años')}
      ${field('patrimonioActual','Ahorros e inversiones que ya tienes','€',1000)}
      ${field('aportacionMensual','Cuánto ahorras o inviertes al mes','€/mes',50)}
      ${field('rentabilidad','Rentabilidad anual esperada de tu inversión','%/año',0.1)}
      ${field('inflacion','Inflación estimada','%/año',0.1)}
    </div>
  </div>
  <div class="card result-card">
    <p class="l">A los <span id="op-edad"></span> años, tu patrimonio invertido sería aproximadamente</p>
    <p id="op-patrimonio" class="v-xl good"></p>
    <p class="hint">Con estas aportaciones, en <span id="op-anios"></span> años habrás invertido tu propio dinero, y el resto será crecimiento por interés compuesto.</p>
  </div>`;
}
function refreshPatrimonio(D){
  out('op-edad', fmt1(S.edadObjetivo));
  out('op-patrimonio', fmtEUR(D.filaObjetivo.patrimonio));
  out('op-anios', fmt1(D.aniosHasta));
}

/* ===================== Tab: Ingresos y pensión ===================== */
function buildIngresos(D){
  return `
  <div class="card">
    <h2>Ingresos y pensión pública</h2>
    <div class="grid2">
      ${field('gastoMensual','Gasto mensual que quieres cubrir jubilado','€/mes',50)}
      ${field('aniosCotizados','Años que llevas cotizados a la Seg. Social','años',0.5)}
      ${field('salarioBrutoMensual','Tu salario bruto mensual medio','€/mes',100,'Para estimar tu pensión pública')}
      ${field('ingresoPasivoMensual','Otros ingresos mensuales (alquiler, etc.)','€/mes',50)}
    </div>
    ${toggle('contarPension','Contar mi pensión pública al calcular cuánto necesito','Si la desactivas, el cálculo asume que vives solo de tus ahorros')}
  </div>
  <div class="card result-card">
    <p class="l">Pensión pública estimada, cotizando hasta jubilarte</p>
    <p id="oi-pension" class="v-xl good"></p>
    <p class="hint">La cobrarías desde los <span id="oi-edadPension"></span> años (con <span id="oi-anios"></span> años cotizados)</p>
    <div id="oi-warnMinimo" class="note danger" style="display:none;"></div>
    <div id="oi-warnAnticipada" class="note danger" style="display:none;"></div>
  </div>`;
}
function refreshIngresos(D){
  out('oi-pension', fmtEUR(D.pension.pensionMensual)+'/mes');
  out('oi-edadPension', D.pension.cumple ? fmt1(D.edadPension)+'' : fmt1(D.pension.eOrd)+'');
  out('oi-anios', fmt1(D.aniosCotizadosFinal));
  outShow('oi-warnMinimo', D.aniosCotizadosFinal < MIN_ANOS_PENSION);
  out('oi-warnMinimo', `Con ${fmt1(D.aniosCotizadosFinal)} años cotizados a los ${S.edadObjetivo}, no llegarías al mínimo de ${MIN_ANOS_PENSION} años para tener derecho a pensión contributiva. Tu pensión sería 0€ a esa edad.`);
  outShow('oi-warnAnticipada', D.aniosCotizadosFinal>=MIN_ANOS_PENSION && !D.pension.cumpleAnticipada);
  out('oi-warnAnticipada', `Para jubilarte antes de tu edad ordinaria (${fmt1(D.pension.eOrd)} años) hace falta un mínimo de ${MIN_ANOS_JUB_ANTICIPADA} años cotizados y no adelantarte más de 24 meses. No cobrarías pensión hasta los ${fmt1(D.pension.eOrd)}.`);
}

/* ===================== Tab: Tu objetivo ===================== */
function buildObjetivo(D){
  return `
  <div class="card result-card">
    <div class="big-result">
      <div>
        <p class="l">A los <span id="o-edadObjetivo"></span> años tendrías</p>
        <p id="o-patrimonio" class="v-xl"></p>
      </div>
      <div><span id="o-badge" class="badge"></span></div>
    </div>
    <div class="stat-grid">
      <div class="stat"><p class="l">Para que te dure toda la vida (regla del 4%)</p><p id="o-objPerp" class="v"></p></div>
      <div class="stat"><p class="l">Para que te dure hasta una edad concreta</p><p id="o-objCons" class="v"></p></div>
    </div>
    <div class="field" style="max-width:220px;margin-top:12px;">${field('edadFinDinero','¿Hasta qué edad quieres asegurar el dinero?','años',1)}</div>
  </div>

  <div class="card">
    <h2>Tu patrimonio frente a lo que necesitas</h2>
    <div style="position:relative;height:300px;"><canvas id="chart1" role="img" aria-label="Evolución del patrimonio frente al objetivo de jubilación"></canvas></div>
    <div class="legend-row" style="margin-top:12px;">
      <span><i style="background:#0ea975"></i>Tu patrimonio</span>
      <span><i style="background:#e0a020"></i>Lo que necesitas para que te dure siempre</span>
    </div>
  </div>

  <div class="card" id="palancas-card"></div>
  `;
}
function refreshObjetivo(D){
  out('o-edadObjetivo', fmt1(S.edadObjetivo));
  out('o-patrimonio', fmtEUR(D.filaObjetivo.patrimonio));
  out('o-objPerp', fmtEUR(D.filaObjetivo.objetivoPerpetuo));
  out('o-objCons', fmtEUR(D.filaObjetivo.objetivoConsumible)+' (a los '+fmt1(S.edadFinDinero)+')');
  const ok = D.filaObjetivo.patrimonio >= D.filaObjetivo.objetivoPerpetuo;
  out('o-badge', ok? 'Vas bien encaminado' : 'Aún te falta capital');
  outClass('o-badge', 'badge '+(ok?'good':'bad'));
  document.getElementById('palancas-card').innerHTML = renderPalancasHTML(D);
}
function initChart1(D){
  const ctx=document.getElementById('chart1');
  if(charts.c1) charts.c1.destroy();
  charts.c1 = new Chart(ctx,{
    type:'line',
    data:{ labels:[], datasets:[
      {label:'Tu patrimonio', data:[], borderColor:'#0ea975', backgroundColor:(c)=>areaGradient(c.chart.ctx,c.chart.chartArea,'14,169,117'), fill:true, tension:.15, pointRadius:0, borderWidth:3.5},
      {label:'Objetivo (para siempre)', data:[], borderColor:'#e0a020', borderDash:[7,4], pointRadius:0, borderWidth:3, fill:false},
    ]},
    options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, animation:false,
      scales:{ x:{title:{display:true,text:'Edad'}, grid:{color:'#eee9d8'}}, y:{ticks:{callback:v=>(v/1000)+'k €'}, grid:{color:'#eee9d8'}} },
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmtEUR(c.parsed.y)}} } }
  });
}
function areaGradient(ctx, area, rgb){
  if(!area) return `rgba(${rgb},0.18)`;
  const g = ctx.createLinearGradient(0, area.top, 0, area.bottom);
  g.addColorStop(0, `rgba(${rgb},0.42)`); g.addColorStop(1, `rgba(${rgb},0.02)`);
  return g;
}
function updateChart1(D){
  const data = D.rows.filter(r=>r.edad<=Math.max(S.edadFinDinero,S.edadObjetivo+25));
  charts.c1.data.labels = data.map(r=>r.edad);
  charts.c1.data.datasets[0].data = data.map(r=>r.patrimonio);
  charts.c1.data.datasets[1].data = data.map(r=>r.objetivoPerpetuo);
  charts.c1.update('none');
}
function renderPalancasHTML(D){
  const P = calcularPalancas(D);
  if(P.yaLoAlcanzas){
    return `<h2>Cómo alcanzarlo</h2>
      <div class="note">Ya tienes capital suficiente a los ${S.edadObjetivo} años. Con estos números podrías plantearte jubilarte desde los <b>${fmt1(P.edadPosible)} años</b>.</div>`;
  }
  return `<h2>Cómo alcanzarlo — te faltan ${fmtEUR(P.shortfall)}</h2>
    <p class="hint" style="margin-bottom:14px;">Cuatro formas alternativas de cerrar ese hueco. No hace falta hacerlas todas.</p>
    <div class="stat-grid">
      <div class="stat"><p class="l">Ahorra esto de más cada mes</p><p class="v good">+${fmtEUR(P.extraMensual)}/mes</p></div>
      <div class="stat"><p class="l">O sube tu rentabilidad a</p><p class="v ${P.rentNecesaria!==null?'good':'bad'}">${P.rentNecesaria!==null?fmt1(P.rentNecesaria)+'%/año':'no es realista'}</p></div>
      <div class="stat"><p class="l">O baja tu gasto mensual a</p><p class="v ${P.gastoNecesario!==null?'good':'bad'}">${P.gastoNecesario!==null?fmtEUR(P.gastoNecesario)+'/mes':'no alcanza'}</p></div>
      <div class="stat"><p class="l">O retrasa tu jubilación hasta</p><p class="v ${P.edadNecesaria!==null?'good':'bad'}">${P.edadNecesaria!==null?fmt1(P.edadNecesaria)+' años':'muy lejos'}</p></div>
    </div>`;
}
/* ===================== Tab 2: Comparar caminos ===================== */
function buildTab2(D){
  return `
  <div class="card banner-card">
    <p>Hoy tienes <b>${fmt1(S.edadActual)} años</b> y llevas <b id="o2-anios">${fmt1(S.aniosCotizados)} años</b> cotizados. Comparamos tres caminos posibles con la Seguridad Social.</p>
  </div>

  <div class="card">
    <h2>Ajusta el convenio especial (opcional)</h2>
    ${toggle('pagaConvenio','Si dejaras de trabajar, ¿pagarías el convenio especial con la Seg. Social?','Sigues sumando años cotizados de tu bolsillo aunque no trabajes')}
    <div id="convenio-box" style="display:${S.pagaConvenio?'block':'none'};margin-top:10px;">
      ${field('baseConvenio','Base mensual elegida para el convenio especial','€/mes',50)}
      <p class="hint" id="o2-costeConvenio"></p>
    </div>
  </div>

  <div class="card">
    <h2>Tres caminos posibles</h2>
    <div style="position:relative;height:280px;"><canvas id="chart2" role="img" aria-label="Comparación de pensión mensual estimada en tres escenarios"></canvas></div>
  </div>

  <div class="grid3">
    <div class="card"><h3><span class="tag">Camino A</span>Dejas de cotizar ya</h3>
      <p class="hint" style="margin-bottom:10px;">Te jubilas a los ${S.edadObjetivo} con lo que ya llevas cotizado.</p>
      <div class="kv"><span class="k">Años cotizados</span><span class="v" id="o2-aA"></span></div>
      <div class="kv"><span class="k">Edad ordinaria que te toca</span><span class="v" id="o2-eordA"></span></div>
      <div class="kv"><span class="k">Coeficiente reductor</span><span class="v" id="o2-coefA"></span></div>
      <div class="kv"><span class="k">Pensión mensual</span><span class="v strong" id="o2-pA"></span></div>
    </div>
    <div class="card"><h3><span class="tag">Camino B</span>Cotizas hasta jubilarte</h3>
      <p class="hint" style="margin-bottom:10px;">Sigues cotizando hasta los ${S.edadObjetivo} y te jubilas ahí.</p>
      <div class="kv"><span class="k">Años cotizados</span><span class="v" id="o2-aB"></span></div>
      <div class="kv"><span class="k">Edad ordinaria que te toca</span><span class="v" id="o2-eordB"></span></div>
      <div class="kv"><span class="k">Coeficiente reductor</span><span class="v" id="o2-coefB"></span></div>
      <div class="kv"><span class="k">Pensión mensual</span><span class="v strong" id="o2-pB"></span></div>
    </div>
    <div class="card"><h3><span class="tag">Camino C</span>Esperas a tu edad ordinaria</h3>
      <p class="hint" style="margin-bottom:10px;">Sin coeficiente reductor, jubilación sin adelanto.</p>
      <div class="kv"><span class="k">Edad de jubilación</span><span class="v" id="o2-edadC"></span></div>
      <div class="kv"><span class="k">Años cotizados</span><span class="v" id="o2-aC"></span></div>
      <div class="kv"><span class="k">Coeficiente reductor</span><span class="v">0%</span></div>
      <div class="kv"><span class="k">Pensión mensual</span><span class="v strong" id="o2-pC"></span></div>
    </div>
  </div>
  `;
}
function initChart2(D){
  const ctx=document.getElementById('chart2');
  if(charts.c2) charts.c2.destroy();
  charts.c2 = new Chart(ctx,{
    type:'bar',
    data:{ labels:[], datasets:[{label:'Pensión mensual', data:[], backgroundColor:['#e2462b','#e0a020','#12b57a'], borderRadius:10}] },
    options:{ responsive:true, maintainAspectRatio:false, animation:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>fmtEUR(c.parsed.y)+'/mes'}} },
      scales:{ y:{ticks:{callback:v=>fmtEUR(v)}} } }
  });
}
function updateChart2(D){
  charts.c2.data.labels = [`A · Ya (${S.edadObjetivo} a.)`, `B · Cotizando (${S.edadObjetivo} a.)`, `C · Esperar (${fmt1(D.eOrdProy)} a.)`];
  charts.c2.data.datasets[0].data = [D.escA.pensionMensual, D.escB.pensionMensual, D.escC.pensionMensual];
  charts.c2.update('none');
}
function refreshTab2(D){
  out('o2-anios', fmt1(S.aniosCotizados));
  outShow('convenio-box', S.pagaConvenio);
  out('o2-costeConvenio', `Coste aproximado: ${fmtEUR(D.costeConvenioAnual)}/año`);

  out('o2-aA', fmt1(S.aniosCotizados)+' años');
  out('o2-eordA', fmt1(D.escA.eOrd)+' años');
  out('o2-coefA', D.escA.cumple? '-'+fmt1(D.escA.coef*100)+'%' : '—');
  out('o2-pA', D.escA.cumple? fmtEUR(D.escA.pensionMensual) : '0 € (no cumple requisitos)');

  out('o2-aB', fmt1(D.aniosCotizadosFinal)+' años');
  out('o2-eordB', fmt1(D.escB.eOrd)+' años');
  out('o2-coefB', D.escB.cumple? '-'+fmt1(D.escB.coef*100)+'%' : '—');
  out('o2-pB', D.escB.cumple? fmtEUR(D.escB.pensionMensual) : '0 € (no cumple requisitos)');

  out('o2-edadC', fmt1(D.eOrdProy)+' años');
  out('o2-aC', fmt1(D.aniosSiEspera)+' años');
  out('o2-pC', fmtEUR(D.escC.pensionMensual));
}

/* ===================== Tab: Finiquito y despido ===================== */
const TIPOS_CESE = {
  improcedente: {label:'Despido improcedente', desc:'La empresa no acredita una causa válida, o falla en la forma. Es el escenario con mayor indemnización.'},
  objetivo: {label:'Despido objetivo (procedente)', desc:'Causas económicas, técnicas, organizativas o de producción, reconocidas como válidas.'},
  disciplinario: {label:'Despido disciplinario (procedente)', desc:'La empresa acredita una falta grave tuya. No genera indemnización, solo finiquito.'},
  voluntaria: {label:'Baja voluntaria', desc:'Te vas tú. No hay indemnización, solo finiquito.'},
};
function buildFiniquito(){
  return `
  <div class="card banner-card">
    <p>El <b>finiquito</b> (vacaciones no disfrutadas + parte proporcional de pagas extra) te lo deben siempre, te vayas como te vayas. La <b>indemnización</b> solo aplica si es un despido, y su importe depende del tipo.</p>
  </div>
  <div class="card">
    <h2>Tu situación</h2>
    <div class="grid2">
      ${fieldDate('fechaInicioStr','Fecha de inicio en la empresa')}
      ${field('salarioBrutoMensual','Tu salario bruto mensual','€/mes',100)}
      ${field('vacacionesPendientes','Días de vacaciones pendientes de disfrutar','días',1)}
    </div>
    <div class="field"><label>Pagas al año</label>${segButtons('numPagasFiniquito',[[12,'12 pagas'],[14,'14 pagas (2 extra)']])}</div>
    <div class="field" style="margin-top:6px;"><label>Tipo de cese</label>
      ${segButtons('tipoCese',[['improcedente','Improcedente'],['objetivo','Objetivo'],['disciplinario','Disciplinario'],['voluntaria','Baja voluntaria']])}
      <p class="hint" id="fq-desc"></p>
    </div>
  </div>

  <div class="card result-card">
    <h2>Lo que te correspondería hoy</h2>
    <div id="fq-error" class="note danger" style="display:none;">Revisa la fecha de inicio: debe ser una fecha pasada.</div>
    <div id="fq-body">
      <div class="big-result">
        <div>
          <p class="l">Total estimado a recibir</p>
          <p id="fq-total" class="v-xl good"></p>
        </div>
      </div>
      <div class="stat-grid">
        <div class="stat"><p class="l">Finiquito (vacaciones + parte proporcional extra)</p><p id="fq-finiquito" class="v"></p></div>
        <div class="stat"><p class="l">Indemnización por el cese</p><p id="fq-indem" class="v"></p></div>
        <div class="stat"><p class="l">Antigüedad en la empresa</p><p id="fq-antiguedad" class="v"></p></div>
        <div class="stat"><p class="l">Días de indemnización aplicados</p><p id="fq-dias" class="v"></p></div>
      </div>
      <div id="fq-mixto" class="note" style="display:none;"></div>
      <div class="note">La indemnización por despido está exenta de IRPF hasta 180.000€, pero <b>solo si la improcedencia se reconoce en conciliación o en sentencia judicial</b> — si la empresa te la paga sin ese reconocimiento formal, tributa como salario. El finiquito real puede variar según tu convenio colectivo: usa esto como estimación de partida, no como cifra definitiva.</div>
    </div>
  </div>`;
}
function refreshFiniquito(){
  document.getElementById('fq-desc').textContent = TIPOS_CESE[S.tipoCese].desc;
  const R = calcularDespido();
  const err = !R;
  outShow('fq-error', err);
  outShow('fq-body', !err);
  if(err) return;

  out('fq-total', fmtEUR(R.total));
  out('fq-finiquito', fmtEUR(R.finiquito));
  out('fq-indem', fmtEUR(R.indemnizacion));
  out('fq-antiguedad', fmt1(R.aniosTotal)+' años');
  out('fq-dias', Math.round(R.diasIndem)+' días de salario');

  const mixto = S.tipoCese==='improcedente' && R.aniosAntes>0.05;
  outShow('fq-mixto', mixto);
  if(mixto) out('fq-mixto', `Como empezaste antes del 12/02/2012, tu indemnización se calcula en dos tramos: 45 días/año hasta esa fecha (${fmt1(R.aniosAntes)} años) y 33 días/año después (${fmt1(R.aniosDespues)} años), cada tramo con su propio tope legal.`);
}

/* ===================== Tab 3: Lotería / herencia ===================== */
function buildTab3(){
  return `
  <div class="card">
    <h2>¿Te ha tocado un pellizco de golpe?</h2>
    <p class="hint" style="margin:-4px 0 16px;">Lotería, herencia, indemnización... mete la cantidad y cuánto quieres gastar al mes. Te decimos hasta qué edad te dura.</p>
    <div class="grid2">
      ${field('loteriaEdadActual','Tu edad actual','años')}
      ${field('loteriaCapital','Capital recibido de golpe','€',5000)}
      ${field('loteriaGastoMensual','Gasto mensual que quieres mantener','€/mes',50)}
      ${field('loteriaRentabilidad','Rentabilidad esperada si lo inviertes','%/año',0.1,'0% si lo dejas en una cuenta sin invertir')}
      ${field('loteriaInflacion','Inflación estimada','%/año',0.1)}
      ${field('loteriaEdadMax','Edad hasta la que quieres comprobar','años',1)}
    </div>
  </div>
  <div class="card result-card">
    <h2>Resultado</h2>
    <p id="o3-resultado" class="v-xl"></p>
    <div class="stat-grid" style="margin-top:14px;">
      <div class="stat"><p class="l">Años que dura</p><p id="o3-anios" class="v"></p></div>
      <div class="stat"><p class="l">Capital para que dure "para siempre"</p><p id="o3-parasiempre" class="v"></p></div>
    </div>
    <div id="o3-nota" class="note"></div>
  </div>
  <div class="card">
    <h2>Cómo evoluciona el capital</h2>
    <div style="position:relative;height:280px;"><canvas id="chart3" role="img" aria-label="Evolución del capital recibido a lo largo de los años"></canvas></div>
  </div>
  `;
}
function initChart3(){
  const ctx=document.getElementById('chart3');
  if(charts.c3) charts.c3.destroy();
  charts.c3 = new Chart(ctx,{
    type:'line',
    data:{ labels:[], datasets:[{label:'Capital restante', data:[], borderColor:'#0ea975', backgroundColor:(c)=>areaGradient(c.chart.ctx,c.chart.chartArea,'14,169,117'), fill:true, tension:.2, pointRadius:0, borderWidth:3}] },
    options:{ responsive:true, maintainAspectRatio:false, animation:false,
      scales:{ x:{title:{display:true,text:'Edad'}, grid:{color:'#eee9d8'}}, y:{ticks:{callback:v=>(v/1000)+'k €'}, grid:{color:'#eee9d8'}} },
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>fmtEUR(c.parsed.y)}} } }
  });
}
function refreshTab3(){
  const L = computeLoteria();
  out('o3-resultado', L.seAgota ? `Se agota a los ${L.edadAgota} años` : `No se agota antes de los ${S.loteriaEdadMax} años`);
  outClass('o3-resultado', 'v-xl '+(L.seAgota?'bad':'good'));
  out('o3-anios', L.seAgota ? (L.edadAgota-S.loteriaEdadActual)+' años' : `${S.loteriaEdadMax-S.loteriaEdadActual}+ años`);
  out('o3-parasiempre', isFinite(L.capitalParaSiempre)? fmtEUR(L.capitalParaSiempre) : '—');
  outClass('o3-nota', 'note '+(L.seAgota?'danger':''));
  out('o3-nota', L.seAgota
    ? 'Con estos supuestos, tu capital no llega a cubrir el gasto que quieres mantener durante toda tu esperanza de vida. Baja el gasto mensual, busca más rentabilidad, o cuenta con una pensión pública u otro ingreso que lo complemente.'
    : `Con estos supuestos, el dinero te dura al menos hasta los ${S.loteriaEdadMax} años.`);

  charts.c3.data.labels = L.serie.map(r=>r.edad);
  charts.c3.data.datasets[0].data = L.serie.map(r=>r.capital);
  charts.c3.data.datasets[0].borderColor = L.seAgota?'#e2462b':'#0ea975';
  charts.c3.data.datasets[0].backgroundColor = (c)=>areaGradient(c.chart.ctx,c.chart.chartArea, L.seAgota?'226,70,43':'14,169,117');
  charts.c3.update('none');
}

/* ===================== Arranque ===================== */
renderNav();
showTab(currentTab);
