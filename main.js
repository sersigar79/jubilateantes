const PENSION_MAX_MENSUAL = 3359.60;
const BASE_MAX_MENSUAL = 5101.20;
const PENSION_MIN_ANUAL_SIN_CONYUGE = 12441.80;
const UMBRAL_ANOS_EDAD_ORDINARIA = 38 + 3/12;
const EDAD_ORDINARIA_CORTA = 65;
const EDAD_ORDINARIA_LARGA = 66 + 10/12;
const MIN_ANOS_JUB_ANTICIPADA = 35;
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
function pctBaseReguladora(a){
  const m=a*12; if(m<=0)return 0; if(m<=180)return (m/180)*50;
  const e1=Math.min(m-180,49); let pct=50+e1*0.21;
  const e2=Math.max(0,m-180-49); pct+=e2*0.19; return Math.min(100,pct);
}
function coeficienteReductor(mesesAdelanto,anios){
  const m=Math.max(0,Math.min(MAX_MESES_ANTICIPO,Math.round(mesesAdelanto)));
  if(m===0)return 0; return COEF_TABLE[m][tramoIndex(anios)]/100;
}
function calcularPension({edadJubilacion,aniosCotizados,salarioBrutoAnual}){
  const baseMensual=Math.min(salarioBrutoAnual/12,BASE_MAX_MENSUAL);
  const pct=pctBaseReguladora(aniosCotizados);
  const eOrd=edadOrdinaria(aniosCotizados);
  const mesesAdelanto=Math.max(0,Math.round((eOrd-edadJubilacion)*12));
  const cumple=aniosCotizados>=MIN_ANOS_JUB_ANTICIPADA && mesesAdelanto<=MAX_MESES_ANTICIPO;
  const coef=edadJubilacion<eOrd?coeficienteReductor(mesesAdelanto,aniosCotizados):0;
  let pensionMensual=baseMensual*(pct/100)*(1-coef);
  pensionMensual=Math.min(pensionMensual,PENSION_MAX_MENSUAL);
  return {baseMensual,pct,eOrd,mesesAdelanto,cumple,coef,pensionMensual,pensionAnual:pensionMensual*14,
    bajoMinimo: aniosCotizados>=15 && pensionMensual*14<PENSION_MIN_ANUAL_SIN_CONYUGE};
}
const fmtEUR=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(Math.round(n))+' €';
const fmt1=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:1}).format(n);

const S = {
  edadActual:46, edadObjetivo:55, gastoMensual:3333,
  ahorroLiquido:90000, accionesEEUU:28000, accionesGSK:18000, planPensiones:25000,
  aportacionAnual:20000, accionesGSKAnual:6000, aportacionPlan:1500,
  rentCartera:6, rentGSK:4, inflacion:2.5,
  valorInmuebles:0, alquilerMensualNeto:0, revalorizacionInmuebles:2,
  valorOro:0, revalorizacionOro:2, incluirOtrosEnComparativa:false,
  aniosCotizados:22, salarioBrutoAnual:55000, sigueCotizando:true, pagaConvenio:false, baseConvenio:1500,
  incluirIngresosPasivos:true,
  modoObjetivo:'perpetuo', edadFinDinero:90,

  loteriaEdadActual:46, loteriaCapital:500000, loteriaGastoMensual:2500,
  loteriaRentabilidad:4, loteriaInflacion:2.5, loteriaEdadMax:100,
};

let currentTab='patrimonio';
let charts={};

function field(key,label,suffix,step,hint){
  return `<div class="field"><label>${label}</label><div class="row">
    <input type="number" data-field="${key}" step="${step||1}" value="${S[key]}" oninput="update('${key}',this.value)" onblur="flushUpdate()">
    ${suffix?`<span class="suffix">${suffix}</span>`:''}
  </div>${hint?`<div class="hint">${hint}</div>`:''}</div>`;
}
function toggle(key,label,hint){
  return `<div class="toggle-row"><div><p>${label}</p>${hint?`<p class="hint">${hint}</p>`:''}</div>
    <button class="switch ${S[key]?'on':''}" onclick="updateToggle('${key}')"><span></span></button></div>`;
}
let renderTimer=null;
window.update=function(key,val){
  const parsed = val==='' ? 0 : parseFloat(val);
  S[key] = isNaN(parsed) ? S[key] : parsed;
  if(renderTimer) clearTimeout(renderTimer);
  renderTimer = setTimeout(()=>{ renderTimer=null; render(); }, 600);
}
window.flushUpdate=function(){
  if(renderTimer){ clearTimeout(renderTimer); renderTimer=null; }
  render();
}
window.updateToggle=function(key){ S[key]=!S[key]; render(); }
window.setModo=function(m){ S.modoObjetivo=m; render(); }
window.toggleLegal=function(){
  const el=document.getElementById('legal-full');
  el.style.display = el.style.display==='block' ? 'none' : 'block';
}

function simularDuracion(capitalInicial, gastoMensual, rentabilidad, inflacion, edadInicio, edadMax){
  let capital = capitalInicial;
  const serie = [{edad:edadInicio, capital}];
  for(let edad=edadInicio+1; edad<=edadMax; edad++){
    const gastoAnual = gastoMensual*12*Math.pow(1+inflacion/100, edad-edadInicio);
    capital = capital*(1+rentabilidad/100) - gastoAnual;
    serie.push({edad, capital: Math.max(0,capital)});
    if(capital<=0){ return {seAgota:true, edadAgota:edad, serie}; }
  }
  return {seAgota:false, edadAgota:null, serie};
}

function computeLoteria(){
  const res = simularDuracion(S.loteriaCapital, S.loteriaGastoMensual, S.loteriaRentabilidad, S.loteriaInflacion, S.loteriaEdadActual, S.loteriaEdadMax);
  // Capital que haría falta para que dure exactamente hasta loteriaEdadMax (o para siempre si rentabilidad>0 y gasto<=capital*rentabilidad)
  const gastoAnualHoy = S.loteriaGastoMensual*12;
  const capitalParaSiempre = S.loteriaRentabilidad>0 ? gastoAnualHoy/(S.loteriaRentabilidad/100) : Infinity;
  return {...res, capitalParaSiempre};
}

function edadOrdinariaProyectada(aniosCotizadosActuales, edadActual){
  const a65 = aniosCotizadosActuales + (65 - edadActual);
  return a65 >= UMBRAL_ANOS_EDAD_ORDINARIA ? EDAD_ORDINARIA_CORTA : EDAD_ORDINARIA_LARGA;
}

function computeAll(){
  const aniosHasta=Math.max(0,S.edadObjetivo-S.edadActual);
  const escA=calcularPension({edadJubilacion:S.edadObjetivo,aniosCotizados:S.aniosCotizados,salarioBrutoAnual:S.salarioBrutoAnual});
  const aniosSiSigue=S.aniosCotizados+aniosHasta;
  const escB=calcularPension({edadJubilacion:S.edadObjetivo,aniosCotizados:aniosSiSigue,salarioBrutoAnual:S.salarioBrutoAnual});
  const eOrdProyectada = edadOrdinariaProyectada(S.aniosCotizados, S.edadActual);
  const aniosSiEsperaOrdinaria = S.aniosCotizados + (eOrdProyectada - S.edadActual);
  const escC = calcularPension({edadJubilacion:eOrdProyectada, aniosCotizados:aniosSiEsperaOrdinaria, salarioBrutoAnual:S.salarioBrutoAnual});
  const costeConvenioAnual=S.baseConvenio*12*0.295;
  const usaB = S.sigueCotizando || S.pagaConvenio;
  const escU = usaB?escB:escA;
  const edadPension = escU.cumple ? S.edadObjetivo : escU.eOrd;
  const alquilerAnual = S.alquilerMensualNeto*12;

  function gastoInfladoEn(edad){ return S.gastoMensual*12*Math.pow(1+S.inflacion/100, edad-S.edadActual); }
  function ingresosEn(edad, incluir){
    if(!incluir) return 0;
    let ing=0;
    if(edad>=S.edadObjetivo) ing+=alquilerAnual;
    if(edad>=edadPension) ing+=escU.pensionAnual;
    return ing;
  }
  function gapEn(edad, incluir){ return Math.max(0, gastoInfladoEn(edad)-ingresosEn(edad,incluir)); }

  function objetivoCapital(edadInicio, incluir){
    if(S.modoObjetivo==='consumible'){
      const nMax = Math.max(0, Math.round(S.edadFinDinero-edadInicio));
      let cap=0;
      for(let n=0;n<nMax;n++){ cap += gapEn(edadInicio+n, incluir)/Math.pow(1+S.rentCartera/100, n); }
      return cap;
    } else {
      const finBridge = incluir ? Math.max(edadInicio, edadPension) : edadInicio;
      let cap=0;
      const nBridge = Math.round(finBridge-edadInicio);
      for(let n=0;n<nBridge;n++){ cap += gapEn(edadInicio+n, incluir)/Math.pow(1+S.rentCartera/100, n); }
      const tailGap = gapEn(finBridge, incluir);
      cap += (25*tailGap)/Math.pow(1+S.rentCartera/100, nBridge);
      return cap;
    }
  }

  // Proyección de patrimonio
  const rows=[]; let ahorro=S.ahorroLiquido, eeuu=S.accionesEEUU, gsk=S.accionesGSK, inmuebles=S.valorInmuebles, oro=S.valorOro;
  const horizonte = S.modoObjetivo==='consumible' ? Math.max(S.edadFinDinero, S.edadObjetivo)+5 - S.edadActual : Math.max(45,aniosHasta+35);
  for(let i=0;i<=horizonte;i++){
    const edad=S.edadActual+i;
    if(i>0){
      ahorro=ahorro*(1+S.rentCartera/100)+S.aportacionAnual;
      eeuu=eeuu*(1+S.rentCartera/100);
      gsk=gsk*(1+S.rentGSK/100)+S.accionesGSKAnual;
      inmuebles=inmuebles*(1+S.revalorizacionInmuebles/100);
      oro=oro*(1+S.revalorizacionOro/100);
    }
    const patrimonioInvertible = ahorro+eeuu+gsk;
    const patrimonioTotal = patrimonioInvertible + inmuebles + oro;
    const patrimonioComparado = S.incluirOtrosEnComparativa ? patrimonioTotal : patrimonioInvertible;
    rows.push({
      edad, patrimonioInvertible, patrimonioTotal, patrimonioComparado,
      objetivoSinAyudas: objetivoCapital(edad, false),
      objetivoConAyudas: objetivoCapital(edad, S.incluirIngresosPasivos),
    });
  }

  const filaObjetivo = rows.find(r=>r.edad===S.edadObjetivo) || rows[0];
  return {aniosHasta,escA,escB,escC,eOrdProyectada,aniosSiEsperaOrdinaria,costeConvenioAnual,usaB,escU,edadPension,alquilerAnual,rows,filaObjetivo};
}

function renderTabs(){
  const tabs=[['patrimonio','Tu patrimonio'],['ingresos','Ingresos y pensión'],['objetivo','Tu objetivo'],['combinado','Proyección'],['escenarios','Comparar escenarios'],['loteria','Lotería / herencia']];
  document.getElementById('tabs').innerHTML = tabs.map(([id,label])=>
    `<button class="${currentTab===id?'active':''}" onclick="setTab('${id}')">${label}</button>`).join('');
}
window.setTab=function(id){ currentTab=id; render(); }

function renderPatrimonio(D){
  document.getElementById('panel-patrimonio').innerHTML = `
  <div class="grid">
    <div class="card"><h2><span class="tag">Invertible</span>Cartera financiera</h2>
      ${field('ahorroLiquido','Ahorro / cuenta líquida','€',1000)}
      ${field('accionesEEUU','Acciones / fondos diversificados','€',1000)}
      ${field('accionesGSK','Otra cartera concentrada (ej. acciones de empresa)','€',1000)}
      ${field('planPensiones','Plan de pensiones','€',1000,'No disponible hasta la jubilación legal — no cuenta para el objetivo anticipado')}
      ${field('aportacionAnual','Aportación anual a inversión','€',500)}
      ${field('accionesGSKAnual','Aportación anual a cartera concentrada','€',500)}
      ${field('aportacionPlan','Aportación anual a plan de pensiones','€',100)}
      ${field('rentCartera','Rentabilidad esperada cartera diversificada','%/año',0.1)}
      ${field('rentGSK','Rentabilidad esperada cartera concentrada','%/año',0.1)}
    </div>
    <div class="card"><h2><span class="tag">Otros activos</span>Inmuebles, oro y valores</h2>
      ${field('valorInmuebles','Valor de inmuebles en alquiler','€',5000)}
      ${field('alquilerMensualNeto','Alquiler neto mensual que recibes','€/mes',50,'Se cuenta como ingreso pasivo desde tu edad de jubilación')}
      ${field('revalorizacionInmuebles','Revalorización anual estimada','%/año',0.1)}
      <div style="height:8px;"></div>
      ${field('valorOro','Oro, joyas u otros activos de valor','€',1000)}
      ${field('revalorizacionOro','Revalorización anual estimada','%/año',0.1)}
      ${toggle('incluirOtrosEnComparativa','Incluir inmuebles y oro en el patrimonio comparado con el objetivo','Si lo desactivas, solo cuentan como colchón informativo — no como capital del que vives')}
    </div>
    <div class="card" style="grid-column:1/-1;">
      <h2>Tu patrimonio a los ${S.edadObjetivo} años</h2>
      <div class="stat-grid">
        <div class="stat"><p class="l">Cartera financiera</p><p class="v">${fmtEUR(D.filaObjetivo.patrimonioInvertible)}</p></div>
        <div class="stat"><p class="l">Inmuebles + oro</p><p class="v">${fmtEUR(D.filaObjetivo.patrimonioTotal-D.filaObjetivo.patrimonioInvertible)}</p></div>
        <div class="stat"><p class="l">Patrimonio total</p><p class="v">${fmtEUR(D.filaObjetivo.patrimonioTotal)}</p></div>
        <div class="stat"><p class="l">Patrimonio comparado con tu objetivo</p><p class="v good">${fmtEUR(D.filaObjetivo.patrimonioComparado)}</p></div>
      </div>
    </div>
  </div>`;
}

function renderIngresos(D){
  document.getElementById('panel-ingresos').innerHTML = `
  <div class="grid">
    <div class="card"><h2><span class="tag">Seguridad Social</span>Tu pensión pública</h2>
      ${field('aniosCotizados','Años cotizados hasta hoy','años',0.5)}
      ${field('salarioBrutoAnual','Salario bruto anual medio (proxy de base reguladora)','€',1000,`Se limita a la base máxima 2026: ${fmtEUR(BASE_MAX_MENSUAL*12)}/año. Aproximación, no la base reguladora real.`)}
      ${toggle('sigueCotizando','Sigo trabajando y cotizando hasta la edad objetivo',`Sumarías ${fmt1(D.aniosHasta)} años más de cotización`)}
      ${toggle('pagaConvenio','Si dejo de trabajar, pago convenio especial con la SS','Sigues sumando años cotizados de tu bolsillo aunque no trabajes')}
      ${S.pagaConvenio? field('baseConvenio','Base mensual elegida para el convenio especial','€/mes',50)+`<div class="hint">Coste aproximado: ${fmtEUR(D.costeConvenioAnual)}/año (28,3% contingencias comunes + 0,9% MEI, todo a tu cargo)</div>` : ''}
      <div class="note">Edad ordinaria que te correspondería: <b>${fmt1(D.escU.eOrd)} años</b>. Pensión mensual estimada a los ${S.edadObjetivo}: <b>${fmtEUR(D.escU.pensionMensual)}</b> (14 pagas).</div>
      ${!D.escU.cumple? `<div class="note danger">A los ${S.edadObjetivo} años no cumplirías los requisitos de jubilación anticipada voluntaria (mínimo 35 años cotizados y máximo 24 meses de adelanto). No cobrarías hasta los ${fmt1(D.escU.eOrd)}.</div>`:''}
    </div>
    <div class="card"><h2>Cómo se combinan tus ingresos</h2>
      ${toggle('incluirIngresosPasivos','Contar mi pensión pública y alquiler como ingresos que reducen lo que necesito ahorrar','Si lo desactivas, tu objetivo se calcula como si vivieras solo de tu cartera')}
      <ul class="rules" style="margin-top:14px;">
        <li><b>Alquiler neto:</b> ${fmtEUR(D.alquilerAnual)}/año, empieza el mismo día que te jubilas.</li>
        <li><b>Pensión pública:</b> ${fmtEUR(D.escU.pensionAnual)}/año, empieza a los ${fmt1(D.edadPension)} años.</li>
        <li>Entre tu jubilación y el cobro de la pensión hay un <b>tramo puente</b> que solo cubren tu cartera y el alquiler.</li>
      </ul>
    </div>
  </div>`;
}

function fvAnnuityFactor(n,r){ if(n<=0) return 0; return r===0? n : (Math.pow(1+r,n)-1)/r; }

function calcularPalancas(D){
  const objetivoActual = S.incluirIngresosPasivos ? D.filaObjetivo.objetivoConAyudas : D.filaObjetivo.objetivoSinAyudas;
  const patrimonioActual = D.filaObjetivo.patrimonioComparado;
  const shortfall = Math.max(0, objetivoActual - patrimonioActual);
  if(shortfall<=0){
    let edadPosible = S.edadObjetivo;
    for(const row of D.rows){
      const obj = S.incluirIngresosPasivos ? row.objetivoConAyudas : row.objetivoSinAyudas;
      if(row.patrimonioComparado>=obj){ edadPosible=row.edad; break; }
    }
    return {yaLoAlcanzas:true, edadPosible};
  }

  const n = Math.max(1, Math.round(S.edadObjetivo-S.edadActual));
  const r = S.rentCartera/100;
  const extraAnual = shortfall / fvAnnuityFactor(n,r);

  function patrimonioMenosObjetivoConRent(rNuevo){
    const back=S.rentCartera; S.rentCartera=rNuevo;
    const DD=computeAll(); S.rentCartera=back;
    const obj = S.incluirIngresosPasivos? DD.filaObjetivo.objetivoConAyudas : DD.filaObjetivo.objetivoSinAyudas;
    return DD.filaObjetivo.patrimonioComparado - obj;
  }
  let rentNecesaria=null;
  if(patrimonioMenosObjetivoConRent(40)>=0){
    let lo=S.rentCartera, hi=40;
    for(let it=0; it<40; it++){ const mid=(lo+hi)/2; if(patrimonioMenosObjetivoConRent(mid)>=0) hi=mid; else lo=mid; }
    rentNecesaria=hi;
  }

  function patrimonioMenosObjetivoConGasto(gNuevo){
    const back=S.gastoMensual; S.gastoMensual=gNuevo;
    const DD=computeAll(); S.gastoMensual=back;
    const obj = S.incluirIngresosPasivos? DD.filaObjetivo.objetivoConAyudas : DD.filaObjetivo.objetivoSinAyudas;
    return DD.filaObjetivo.patrimonioComparado - obj;
  }
  let gastoNecesario=null;
  if(patrimonioMenosObjetivoConGasto(0)>=0){
    let lo=0, hi=S.gastoMensual;
    for(let it=0; it<40; it++){ const mid=(lo+hi)/2; if(patrimonioMenosObjetivoConGasto(mid)>=0) lo=mid; else hi=mid; }
    gastoNecesario=lo;
  }

  let edadNecesaria=null;
  for(const row of D.rows){
    if(row.edad<S.edadObjetivo) continue;
    const obj = S.incluirIngresosPasivos? row.objetivoConAyudas : row.objetivoSinAyudas;
    if(row.patrimonioComparado>=obj){ edadNecesaria=row.edad; break; }
  }

  return {yaLoAlcanzas:false, shortfall, extraAnual, rentNecesaria, gastoNecesario, edadNecesaria};
}

function renderPalancas(D){
  const P = calcularPalancas(D);
  if(P.yaLoAlcanzas){
    return `<div class="card" style="margin-top:16px;">
      <h2>Cómo alcanzarlo</h2>
      <div class="note">Ya tienes capital suficiente a los ${S.edadObjetivo} años. De hecho, con estos números podrías plantearte jubilarte desde los <b>${fmt1(P.edadPosible)} años</b>.</div>
    </div>`;
  }
  return `<div class="card" style="margin-top:16px;">
    <h2>Cómo alcanzarlo — te faltan ${fmtEUR(P.shortfall)}</h2>
    <p class="hint" style="margin-bottom:14px;">Cuatro formas distintas de cerrar ese hueco. No hace falta hacerlas todas: elige la que más te encaje, o combina un poco de cada una.</p>
    <div class="stat-grid">
      <div class="stat"><p class="l">Ahorra esto de más cada año</p><p class="v good">+${fmtEUR(P.extraAnual)}/año</p></div>
      <div class="stat"><p class="l">O sube tu rentabilidad a</p><p class="v ${P.rentNecesaria!==null?'good':'bad'}">${P.rentNecesaria!==null?fmt1(P.rentNecesaria)+'%/año':'no es realista solo con esto'}</p></div>
      <div class="stat"><p class="l">O baja tu gasto mensual a</p><p class="v ${P.gastoNecesario!==null?'good':'bad'}">${P.gastoNecesario!==null?fmtEUR(P.gastoNecesario)+'/mes':'no alcanza ni a coste cero'}</p></div>
      <div class="stat"><p class="l">O retrasa tu jubilación hasta</p><p class="v ${P.edadNecesaria!==null?'good':'bad'}">${P.edadNecesaria!==null?fmt1(P.edadNecesaria)+' años':'más de 30 años vista'}</p></div>
    </div>
    <div class="note" style="margin-top:14px;">Estas cuatro cifras son alternativas independientes entre sí (cada una asume que solo cambias esa variable). En la vida real seguramente te compense mover un poco de varias a la vez.</div>
  </div>`;
}

function renderObjetivo(D){
  const edadPensionRound = Math.round(D.edadPension*10)/10;
  const finLinea = S.modoObjetivo==='consumible' ? S.edadFinDinero : Math.max(S.edadObjetivo+20, D.edadPension+15);
  const total = Math.max(1, finLinea - S.edadActual);
  const pTrabajo = Math.min(100, ((S.edadObjetivo-S.edadActual)/total)*100);
  const pPuente = Math.min(100-pTrabajo, ((D.edadPension-S.edadObjetivo)/total)*100);
  const pPension = Math.max(0, 100-pTrabajo-pPuente);

  document.getElementById('panel-objetivo').innerHTML = `
  <div class="card">
    <h2>Tu línea de tiempo</h2>
    <div class="timeline">
      <div class="bar">
        <div class="seg trabajo" style="width:${pTrabajo}%"></div>
        <div class="seg puente" style="width:${pPuente}%"></div>
        <div class="seg pension" style="width:${pPension}%"></div>
      </div>
      <div class="marks">
        <div class="mark" style="left:0%"><b>${fmt1(S.edadActual)}</b>hoy</div>
        <div class="mark" style="left:${pTrabajo}%"><b>${fmt1(S.edadObjetivo)}</b>jubilación</div>
        ${pPuente>0.5?`<div class="mark" style="left:${pTrabajo+pPuente}%"><b>${edadPensionRound}</b>pensión</div>`:''}
        <div class="mark" style="left:100%"><b>${S.modoObjetivo==='consumible'?fmt1(S.edadFinDinero):'∞'}</b>${S.modoObjetivo==='consumible'?'fin':'indefinido'}</div>
      </div>
    </div>
    <div class="legend-row">
      <span><i style="background:var(--gold)"></i>Trabajando / ahorrando</span>
      <span><i style="background:#d9c27a"></i>Jubilado, sin pensión aún (tramo puente)</span>
      <span><i style="background:var(--emerald)"></i>Jubilado y cobrando pensión${S.alquilerMensualNeto>0?' / alquiler':''}</span>
    </div>
  </div>

  <div class="grid" style="margin-top:16px;">
    <div class="card">
      <h2>¿Cómo quieres que dure tu dinero?</h2>
      <div class="segmented">
        <button class="${S.modoObjetivo==='perpetuo'?'active':''}" onclick="setModo('perpetuo')">Cartera que reinvierte<br><span style="font-weight:400;opacity:.85;">dura indefinidamente, regla del 4%</span></button>
        <button class="${S.modoObjetivo==='consumible'?'active':''}" onclick="setModo('consumible')">Capital que se consume<br><span style="font-weight:400;opacity:.85;">te lo vas gastando hasta una edad</span></button>
      </div>
      ${S.modoObjetivo==='consumible'? field('edadFinDinero','¿Hasta qué edad quieres que te dure el dinero?','años',1,'Se suma cada año de gasto futuro, descontado a la rentabilidad que hayas puesto en tu cartera (0% si no vas a invertir más)') : ''}
      <div class="note">
        ${S.modoObjetivo==='perpetuo'
          ? 'Asumimos que tu capital sigue invertido y retiras un 4% al año — el dinero, en la mayoría de escenarios históricos, no se agota nunca. Es el modelo clásico FIRE.'
          : 'Sumamos, año a año, el gasto que tendrás que cubrir hasta la edad que has puesto, descontando el crecimiento de tu cartera. Si pones 0% de rentabilidad, es literalmente la suma de todos los gastos futuros — sin magia de interés compuesto.'}
      </div>
    </div>
    <div class="card">
      <h2>Objetivo de capital a los ${S.edadObjetivo} años</h2>
      <div class="stat-grid">
        <div class="stat"><p class="l">Sin pensión ni alquiler</p><p class="v">${fmtEUR(D.filaObjetivo.objetivoSinAyudas)}</p></div>
        <div class="stat"><p class="l">Con pensión y alquiler</p><p class="v">${fmtEUR(D.filaObjetivo.objetivoConAyudas)}</p></div>
      </div>
      <div class="kv" style="margin-top:14px;"><span class="k">Tu patrimonio comparado</span><span class="v strong">${fmtEUR(D.filaObjetivo.patrimonioComparado)}</span></div>
      <div class="kv"><span class="k">Objetivo aplicado (según tu interruptor de ingresos)</span><span class="v strong">${fmtEUR(S.incluirIngresosPasivos?D.filaObjetivo.objetivoConAyudas:D.filaObjetivo.objetivoSinAyudas)}</span></div>
      <div class="kv"><span class="k">¿Lo alcanzas?</span><span class="v strong" style="color:${D.filaObjetivo.patrimonioComparado>=(S.incluirIngresosPasivos?D.filaObjetivo.objetivoConAyudas:D.filaObjetivo.objetivoSinAyudas)?'var(--emerald)':'var(--coral)'}">${D.filaObjetivo.patrimonioComparado>=(S.incluirIngresosPasivos?D.filaObjetivo.objetivoConAyudas:D.filaObjetivo.objetivoSinAyudas)?'Sí':'No'}</span></div>
    </div>
  </div>
  ${renderPalancas(D)}`;
}

function areaGradient(ctx, chartArea, rgb){
  if(!chartArea) return `rgba(${rgb},0.18)`;
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, `rgba(${rgb},0.42)`);
  g.addColorStop(1, `rgba(${rgb},0.02)`);
  return g;
}

function renderCombinado(D){
  const okSinAyudas = D.filaObjetivo.patrimonioComparado >= D.filaObjetivo.objetivoSinAyudas;
  const okConAyudas = D.filaObjetivo.patrimonioComparado >= D.filaObjetivo.objetivoConAyudas;
  document.getElementById('panel-combinado').innerHTML = `
  <div class="card" style="background:var(--paper-2);border:none;">
    <p style="margin:0;font-size:13.5px;line-height:1.6;">
      Estas dos gráficas comparan la misma línea verde (tu patrimonio, creciendo con tus aportaciones y rentabilidad) contra dos objetivos distintos: uno que ignora la pensión pública y el alquiler, y otro que sí los cuenta. Donde la línea verde cruza por encima de la de puntos, ya tendrías capital suficiente para jubilarte a esa edad.
    </p>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>1 · Contando solo tu cartera (sin pensión ni alquiler)</h2>
    <div style="position:relative;height:300px;"><canvas id="chartSinAyudas" role="img" aria-label="Patrimonio frente al objetivo sin contar pensión ni alquiler"></canvas></div>
    <div class="legend-row" style="margin-top:14px;">
      <span><i style="background:#0ea975"></i>Tu patrimonio (crece con tus aportaciones)</span>
      <span><i style="background:#e08a1e"></i>Capital que necesitarías a cada edad, viviendo solo de tu cartera</span>
    </div>
    <div class="note ${okSinAyudas?'':'danger'}" style="margin-top:12px;">
      A los ${S.edadObjetivo} años: tendrías <b>${fmtEUR(D.filaObjetivo.patrimonioComparado)}</b> y necesitarías <b>${fmtEUR(D.filaObjetivo.objetivoSinAyudas)}</b> —
      ${okSinAyudas ? `te sobrarían ${fmtEUR(D.filaObjetivo.patrimonioComparado-D.filaObjetivo.objetivoSinAyudas)}.` : `te faltarían ${fmtEUR(D.filaObjetivo.objetivoSinAyudas-D.filaObjetivo.patrimonioComparado)}.`}
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>2 · Contando también tu pensión y alquiler</h2>
    <div style="position:relative;height:300px;"><canvas id="chartConAyudas" role="img" aria-label="Patrimonio frente al objetivo contando pensión y alquiler"></canvas></div>
    <div class="legend-row" style="margin-top:14px;">
      <span><i style="background:#0ea975"></i>Tu patrimonio (crece con tus aportaciones)</span>
      <span><i style="background:#7c5cf0"></i>Capital que necesitarías, ya con pensión pública y alquiler cubriendo parte del gasto</span>
    </div>
    <div class="note ${okConAyudas?'':'danger'}" style="margin-top:12px;">
      A los ${S.edadObjetivo} años: tendrías <b>${fmtEUR(D.filaObjetivo.patrimonioComparado)}</b> y necesitarías <b>${fmtEUR(D.filaObjetivo.objetivoConAyudas)}</b> —
      ${okConAyudas ? `te sobrarían ${fmtEUR(D.filaObjetivo.patrimonioComparado-D.filaObjetivo.objetivoConAyudas)}.` : `te faltarían ${fmtEUR(D.filaObjetivo.objetivoConAyudas-D.filaObjetivo.patrimonioComparado)}.`}
      Normalmente este objetivo es más bajo que el de arriba, porque parte del gasto ya lo cubren tu pensión y tu alquiler.
    </div>
  </div>`;

  const data=D.rows.filter(r=>r.edad<=(S.modoObjetivo==='consumible'?S.edadFinDinero:S.edadObjetivo+30));
  const commonScales = { x:{title:{display:true,text:'Edad'}, grid:{color:'#eee9d8'}}, y:{ticks:{callback:v=>(v/1000)+'k €'}, grid:{color:'#eee9d8'}} };

  const ctx1=document.getElementById('chartSinAyudas');
  if(charts.sinAyudas) charts.sinAyudas.destroy();
  charts.sinAyudas = new Chart(ctx1,{
    type:'line',
    data:{ labels:data.map(r=>r.edad),
      datasets:[
        {label:'Tu patrimonio', data:data.map(r=>r.patrimonioComparado), borderColor:'#0ea975', backgroundColor:(c)=>areaGradient(c.chart.ctx,c.chart.chartArea,'14,169,117'), fill:true, tension:.15, pointRadius:0, borderWidth:3.5},
        {label:'Objetivo sin ayudas', data:data.map(r=>r.objetivoSinAyudas), borderColor:'#e08a1e', borderDash:[7,4], pointRadius:0, borderWidth:3.5, fill:false},
      ]},
    options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
      scales: commonScales,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmtEUR(c.parsed.y)}} } }
  });

  const ctx2=document.getElementById('chartConAyudas');
  if(charts.conAyudas) charts.conAyudas.destroy();
  charts.conAyudas = new Chart(ctx2,{
    type:'line',
    data:{ labels:data.map(r=>r.edad),
      datasets:[
        {label:'Tu patrimonio', data:data.map(r=>r.patrimonioComparado), borderColor:'#0ea975', backgroundColor:(c)=>areaGradient(c.chart.ctx,c.chart.chartArea,'14,169,117'), fill:true, tension:.15, pointRadius:0, borderWidth:3.5},
        {label:'Objetivo con pensión y alquiler', data:data.map(r=>r.objetivoConAyudas), borderColor:'#7c5cf0', borderDash:[7,4], pointRadius:0, borderWidth:3.5, fill:false},
      ]},
    options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
      scales: commonScales,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>c.dataset.label+': '+fmtEUR(c.parsed.y)}} } }
  });
}

function renderEscenarios(D){
  document.getElementById('panel-escenarios').innerHTML = `
  <div class="card" style="background:var(--paper-2);border:none;">
    <p style="margin:0;font-size:13.5px;line-height:1.6;">
      Partimos de esto: hoy tienes <b>${fmt1(S.edadActual)} años</b> y llevas <b>${fmt1(S.aniosCotizados)} años cotizados</b> a la Seguridad Social.
      Comparamos qué pasa con tu pensión según qué decidas hacer entre hoy y tu jubilación.
    </p>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>Tres caminos posibles</h2>
    <div style="position:relative;height:280px;"><canvas id="chartEscenarios" role="img" aria-label="Comparación de pensión mensual estimada en tres escenarios distintos"></canvas></div>
  </div>

  <div class="grid" style="margin-top:16px;grid-template-columns:1fr 1fr 1fr;">
    <div class="card"><h2><span class="tag">Camino A</span>Dejas de cotizar ya</h2>
      <p class="hint" style="margin-bottom:10px;">Dejas de trabajar y de cotizar hoy mismo (${fmt1(S.edadActual)} años), y te jubilas a los ${S.edadObjetivo} con lo que ya llevas acumulado.</p>
      <div class="kv"><span class="k">Edad de jubilación</span><span class="v">${S.edadObjetivo} años</span></div>
      <div class="kv"><span class="k">Años cotizados en ese momento</span><span class="v">${fmt1(S.aniosCotizados)}</span></div>
      <div class="kv"><span class="k">Edad ordinaria que te toca</span><span class="v">${fmt1(D.escA.eOrd)}</span></div>
      <div class="kv"><span class="k">Meses de adelanto</span><span class="v">${D.escA.mesesAdelanto}</span></div>
      <div class="kv"><span class="k">Coeficiente reductor</span><span class="v">-${fmt1(D.escA.coef*100)}%</span></div>
      <div class="kv"><span class="k">Pensión mensual</span><span class="v strong">${fmtEUR(D.escA.pensionMensual)}</span></div>
    </div>
    <div class="card"><h2><span class="tag">Camino B</span>Cotizas hasta jubilarte</h2>
      <p class="hint" style="margin-bottom:10px;">Sigues trabajando (o pagando convenio especial) desde tus ${fmt1(S.edadActual)} hasta los ${S.edadObjetivo} años, y te jubilas anticipadamente ahí.</p>
      <div class="kv"><span class="k">Edad de jubilación</span><span class="v">${S.edadObjetivo} años</span></div>
      <div class="kv"><span class="k">Años cotizados en ese momento</span><span class="v">${fmt1(S.aniosCotizados+D.aniosHasta)}</span></div>
      <div class="kv"><span class="k">Edad ordinaria que te toca</span><span class="v">${fmt1(D.escB.eOrd)}</span></div>
      <div class="kv"><span class="k">Meses de adelanto</span><span class="v">${D.escB.mesesAdelanto}</span></div>
      <div class="kv"><span class="k">Coeficiente reductor</span><span class="v">-${fmt1(D.escB.coef*100)}%</span></div>
      <div class="kv"><span class="k">Pensión mensual</span><span class="v strong">${fmtEUR(D.escB.pensionMensual)}</span></div>
      ${S.pagaConvenio? `<div class="hint" style="margin-top:8px;">Convenio especial: ${fmtEUR(D.costeConvenioAnual)}/año × ${fmt1(D.aniosHasta)} años = ${fmtEUR(D.costeConvenioAnual*D.aniosHasta)} en total.</div>`:''}
    </div>
    <div class="card"><h2><span class="tag">Camino C</span>Esperas a la edad ordinaria</h2>
      <p class="hint" style="margin-bottom:10px;">Sigues trabajando y cotizando sin jubilarte antes de tiempo, hasta los ${fmt1(D.eOrdProyectada)} años — tu edad ordinaria. Sin coeficiente reductor.</p>
      <div class="kv"><span class="k">Edad de jubilación</span><span class="v">${fmt1(D.eOrdProyectada)} años</span></div>
      <div class="kv"><span class="k">Años cotizados en ese momento</span><span class="v">${fmt1(D.aniosSiEsperaOrdinaria)}</span></div>
      <div class="kv"><span class="k">Edad ordinaria que te toca</span><span class="v">${fmt1(D.escC.eOrd)}</span></div>
      <div class="kv"><span class="k">Coeficiente reductor</span><span class="v">0% (sin adelanto)</span></div>
      <div class="kv"><span class="k">Pensión mensual</span><span class="v strong">${fmtEUR(D.escC.pensionMensual)}</span></div>
    </div>
  </div>

  <div class="card" style="margin-top:16px;">
    <h2>La diferencia, en limpio</h2>
    <div class="stat-grid">
      <div class="stat"><p class="l">B vs. A (seguir cotizando hasta los ${S.edadObjetivo})</p><p class="v good">+${fmtEUR(D.escB.pensionMensual-D.escA.pensionMensual)}/mes</p></div>
      <div class="stat"><p class="l">C vs. A (esperar a la edad ordinaria)</p><p class="v good">+${fmtEUR(D.escC.pensionMensual-D.escA.pensionMensual)}/mes</p></div>
      <div class="stat"><p class="l">C vs. B (esperar en vez de jubilarte a los ${S.edadObjetivo})</p><p class="v">+${fmtEUR(D.escC.pensionMensual-D.escB.pensionMensual)}/mes, pero ${fmt1(D.eOrdProyectada-S.edadObjetivo)} años más trabajando</p></div>
    </div>
  </div>`;

  const ctx=document.getElementById('chartEscenarios');
  if(charts.escenarios) charts.escenarios.destroy();
  charts.escenarios = new Chart(ctx,{
    type:'bar',
    data:{ labels:[`A · Dejas de cotizar ya (${S.edadObjetivo} años)`, `B · Cotizas hasta los ${S.edadObjetivo}`, `C · Esperas a los ${fmt1(D.eOrdProyectada)}`],
      datasets:[{label:'Pensión mensual estimada', data:[D.escA.pensionMensual,D.escB.pensionMensual,D.escC.pensionMensual], backgroundColor:['#e2462b','#e0a020','#12b57a'], borderRadius:10}]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>fmtEUR(c.parsed.y)+' / mes'}} },
      scales:{ y:{ticks:{callback:v=>fmtEUR(v)}}, x:{ticks:{font:{size:11}}} } }
  });
}

function renderLoteria(){
  const L = computeLoteria();
  document.getElementById('panel-loteria').innerHTML = `
  <div class="card">
    <h2><span class="tag">Golpe de suerte</span>¿Te ha tocado la lotería, una herencia o una indemnización?</h2>
    <p style="font-size:13px;color:var(--muted);margin:-6px 0 16px;line-height:1.6;">Mete la cantidad que has recibido de golpe y cuánto quieres gastar al mes. Te decimos hasta qué edad te dura, sin necesidad de que sigas trabajando ni aportando nada más.</p>
    <div class="grid">
      <div>
        ${field('loteriaEdadActual','Tu edad actual','años')}
        ${field('loteriaCapital','Capital recibido de golpe','€',5000)}
        ${field('loteriaGastoMensual','Gasto mensual que quieres mantener','€/mes',50)}
        ${field('loteriaRentabilidad','Rentabilidad esperada si lo inviertes','%/año',0.1,'Pon 0% si vas a dejarlo en una cuenta corriente sin invertir')}
        ${field('loteriaInflacion','Inflación estimada','%/año',0.1)}
        ${field('loteriaEdadMax','Hasta qué edad quieres comprobar','años',1)}
      </div>
      <div>
        <div class="stat" style="margin-bottom:18px;">
          <p class="l">Resultado</p>
          <p class="v ${L.seAgota?'bad':'good'}" style="font-size:26px;">${L.seAgota ? `Se agota a los ${L.edadAgota} años` : `No se agota antes de los ${S.loteriaEdadMax} años`}</p>
        </div>
        <div class="kv"><span class="k">Años que dura</span><span class="v strong">${L.seAgota ? (L.edadAgota-S.loteriaEdadActual)+' años' : `${S.loteriaEdadMax-S.loteriaEdadActual}+ años`}</span></div>
        <div class="kv"><span class="k">Capital para que dure "para siempre" (4%-style)</span><span class="v strong">${isFinite(L.capitalParaSiempre)?fmtEUR(L.capitalParaSiempre):'—'}</span></div>
        ${L.seAgota ? `<div class="note danger">Con estos supuestos, tu capital no llega a cubrir el gasto que quieres mantener durante toda tu esperanza de vida. O bajas el gasto mensual, o buscas más rentabilidad, o cuentas con una pensión pública/otros ingresos que lo complementen.</div>` : `<div class="note">Con estos supuestos, el dinero te dura al menos hasta los ${S.loteriaEdadMax} años. Si quieres estar más tranquilo, prueba a subir la edad máxima de comprobación.</div>`}
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:16px;">
    <h2>Cómo evoluciona el capital</h2>
    <div style="position:relative;height:300px;"><canvas id="chartLoteria" role="img" aria-label="Evolución del capital recibido a lo largo de los años"></canvas></div>
  </div>`;

  const ctx=document.getElementById('chartLoteria');
  if(charts.loteria) charts.loteria.destroy();
  charts.loteria = new Chart(ctx,{
    type:'line',
    data:{ labels:L.serie.map(r=>r.edad),
      datasets:[{label:'Capital restante', data:L.serie.map(r=>r.capital), borderColor: L.seAgota?'#e2462b':'#0ea975', backgroundColor:(c)=>areaGradient(c.chart.ctx,c.chart.chartArea, L.seAgota?'226,70,43':'14,169,117'), fill:true, tension:.2, pointRadius:0, borderWidth:3}]},
    options:{ responsive:true, maintainAspectRatio:false,
      scales:{ x:{title:{display:true,text:'Edad'}}, y:{ticks:{callback:v=>(v/1000)+'k €'}} },
      plugins:{ legend:{display:false}, tooltip:{callbacks:{label:c=>fmtEUR(c.parsed.y)}} } }
  });
}

function render(){
  renderTabs();
  const D = computeAll();
  renderPatrimonio(D);
  renderIngresos(D);
  renderObjetivo(D);
  renderCombinado(D);
  renderEscenarios(D);
  renderLoteria();
  ['patrimonio','ingresos','objetivo','combinado','escenarios','loteria'].forEach(id=>{
    document.getElementById('panel-'+id).classList.toggle('active', id===currentTab);
  });
}
render();
