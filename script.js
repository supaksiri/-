/* ════════════════════════════════════════════
   GAS LAW SOLVER LAB — script.js
   ════════════════════════════════════════════ */

'use strict';

// ── CONSTANTS ──────────────────────────────────────────────────
const R = 0.0821; // L·atm/mol·K

const GAS_COLORS = {
  O2:'#4fc3f7', N2:'#ab47bc', CO2:'#90a4ae',
  He:'#ffd54f', Ar:'#66bb6a', H2:'#f48fb1',
  CH4:'#ffb74d', NH3:'#4db6ac', SO2:'#ef9a9a',
  Cl2:'#c5e1a5', H2S:'#ffe082', HCl:'#80cbc4',
  default:'#90caf9'
};

const GAS_NAMES = ['O2','N2','CO2','He','Ar','H2','CH4','NH3','SO2','Cl2','H2S','HCl','Ne','H2O','Kr'];

// ── STATE ───────────────────────────────────────────────────────
let state = {
  ideal: { solveFor: 'P' },
  dalton: {
    mode: 'pressure',
    gases: [
      { name:'O2', value:0.21, color:'#4fc3f7' },
      { name:'N2', value:0.78, color:'#ab47bc' },
      { name:'Ar', value:0.01, color:'#66bb6a' },
    ],
    moles: [
      { name:'O2', mol:0.30, color:'#4fc3f7' },
      { name:'N2', mol:0.60, color:'#ab47bc' },
      { name:'CO2', mol:0.10, color:'#90a4ae' },
    ]
  },
  graham: {
    mode: 'race',
    M1: 32, M2: 2,
    name1: 'O2', name2: 'H2',
    raceRunning: false, raceT: 0, raceRaf: null,
    ratio: 1
  },
  charts: { ideal: null, dalton: null, graham: null },
  idealChartType: 'PV',
  daltonChartType: 'bar',
  grahamChartType: 'mass',
  solutionText: { ideal:'', dalton:'', graham:'' },
  worksheet: { current: null }
};

// ── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initBgParticles();
  initHeroMolecules();
  renderDaltonGasList();
  renderDaltonMolList();
  renderWorksheet();
  updateGasPicker(1);
  updateGasPicker(2);
  initGasCanvas();
  initDaltonCanvas();
  initRaceCanvas();
  initEffCanvas();
  buildIdealChart('PV');
  buildDaltonChart('bar');
  buildGrahamChart('mass');
});

// ── NAVIGATION ──────────────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const p = document.getElementById('page-' + name);
  if (p) { p.classList.add('active'); window.scrollTo(0,0); }
}

function toggleNav() {
  document.getElementById('mobileNav').classList.toggle('open');
}

// ════════════════════════════════════════════
// ── BACKGROUND PARTICLES ───────────────────
// ════════════════════════════════════════════
function initBgParticles() {
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * 1200, y: Math.random() * 800,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
      r: 2 + Math.random() * 4,
      opacity: 0.15 + Math.random() * 0.25,
      hue: 200 + Math.random() * 40
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `hsla(${p.hue},70%,65%,${p.opacity})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ── HERO MOLECULES ─────────────────────────────────────────────
function initHeroMolecules() {
  const canvas = document.getElementById('heroMolecules');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const particles = [];
  for (let i = 0; i < 18; i++) {
    particles.push({
      x: 50 + Math.random()*200, y: 50 + Math.random()*200,
      vx: (Math.random()-0.5)*1.2, vy: (Math.random()-0.5)*1.2,
      r: 4+Math.random()*8, hue: 195+Math.random()*60
    });
  }
  function draw() {
    ctx.clearRect(0,0,300,300);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < p.r || p.x > 300-p.r) p.vx *= -1;
      if (p.y < p.r || p.y > 300-p.r) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      const g = ctx.createRadialGradient(p.x-p.r*0.3,p.y-p.r*0.3,1,p.x,p.y,p.r);
      g.addColorStop(0,`hsla(${p.hue},90%,80%,0.9)`);
      g.addColorStop(1,`hsla(${p.hue},70%,55%,0.6)`);
      ctx.fillStyle = g;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ════════════════════════════════════════════
// ── IDEAL GAS SOLVER ───────────────────────
// ════════════════════════════════════════════

function selectSolveFor(v, page) {
  state.ideal.solveFor = v;
  document.querySelectorAll('#page-ideal .solve-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('sf-' + v);
  if (btn) btn.classList.add('active');
  // Disable the solved-for input
  ['P','V','n','T','m','Mol'].forEach(k => {
    const grp = document.getElementById('ig-' + k);
    if (grp) grp.classList.toggle('disabled', k === v);
    const inp = document.getElementById('i-' + k);
    if (inp) inp.disabled = (k === v);
  });
}

function getIdealValues() {
  const P_raw = parseFloat(document.getElementById('i-P').value);
  const V_raw = parseFloat(document.getElementById('i-V').value);
  const n     = parseFloat(document.getElementById('i-n').value);
  const T_raw = parseFloat(document.getElementById('i-T').value);
  const m     = parseFloat(document.getElementById('i-m').value);
  const Mol   = parseFloat(document.getElementById('i-Mol').value);

  const uP = document.getElementById('u-P').value;
  const uV = document.getElementById('u-V').value;
  const uT = document.getElementById('u-T').value;

  let P = P_raw;
  if (uP === 'mmHg') P = P_raw / 760;
  if (uP === 'kPa')  P = P_raw / 101.325;

  let V = V_raw;
  if (uV === 'mL') V = V_raw / 1000;

  let T = T_raw;
  if (uT === 'C') T = T_raw + 273;

  return { P, V, n, T, m, Mol, P_raw, V_raw, T_raw, uP, uV, uT };
}

function calcIdeal() {
  const sf = state.ideal.solveFor;
  const vals = getIdealValues();
  let { P, V, n, T, m, Mol } = vals;

  // if mass given but n not, derive n
  if (isNaN(n) && !isNaN(m) && !isNaN(Mol)) n = m / Mol;

  const warnings = [];
  const steps = [];
  let answer = '';

  // Step 1: read given
  const givenList = [];
  if (!isNaN(vals.P_raw)) givenList.push(`P = ${vals.P_raw} ${vals.uP}`);
  if (!isNaN(vals.V_raw)) givenList.push(`V = ${vals.V_raw} ${vals.uV}`);
  if (!isNaN(parseFloat(document.getElementById('i-n').value))) givenList.push(`n = ${document.getElementById('i-n').value} mol`);
  if (!isNaN(vals.T_raw)) givenList.push(`T = ${vals.T_raw} ${vals.uT === 'C' ? '°C' : 'K'}`);
  if (!isNaN(m)) givenList.push(`m = ${m} g`);
  if (!isNaN(Mol)) givenList.push(`M = ${Mol} g/mol`);

  steps.push({ title:'ขั้นที่ 1 — อ่านโจทย์', content: givenList.join(' | '), formula:'' });

  // Step 2: unit conversion
  const convList = [];
  if (vals.uT === 'C' && !isNaN(vals.T_raw)) {
    convList.push(`T = ${vals.T_raw}°C + 273 = <strong>${T.toFixed(0)} K</strong>`);
    if (vals.T_raw < -273) warnings.push('อุณหภูมิต่ำกว่า -273°C ไม่ถูกต้องทางฟิสิกส์');
  }
  if (vals.uP === 'mmHg' && !isNaN(vals.P_raw)) convList.push(`P = ${vals.P_raw} mmHg ÷ 760 = <strong>${P.toFixed(4)} atm</strong>`);
  if (vals.uP === 'kPa'  && !isNaN(vals.P_raw)) convList.push(`P = ${vals.P_raw} kPa ÷ 101.325 = <strong>${P.toFixed(4)} atm</strong>`);
  if (vals.uV === 'mL'   && !isNaN(vals.V_raw)) convList.push(`V = ${vals.V_raw} mL ÷ 1000 = <strong>${V.toFixed(4)} L</strong>`);
  if (!isNaN(m) && !isNaN(Mol)) convList.push(`n = m/M = ${m}/${Mol} = <strong>${(m/Mol).toFixed(4)} mol</strong>`);
  steps.push({ title:'ขั้นที่ 2 — แปลงหน่วย', content: convList.length ? convList.join('<br>') : 'ไม่ต้องแปลงหน่วย — ทุกค่าอยู่ในหน่วยที่ถูกต้องแล้ว', formula:'' });

  // Step 3: formula
  steps.push({ title:'ขั้นที่ 3 — เลือกสูตร', content:'กฎแก๊สอุดมคติ', formula:'PV = nRT' });

  // Step 4-6: solve
  let result = NaN;
  let rearranged = '', substituted = '';

  if (sf === 'P') {
    if (isNaN(V)||isNaN(n)||isNaN(T)) { showError('กรุณากรอก V, n และ T'); return; }
    rearranged = 'P = nRT / V';
    result = n * R * T / V;
    substituted = `P = (${n.toFixed(4)} × ${R} × ${T.toFixed(2)}) / ${V.toFixed(4)}`;
    answer = `P = ${result.toFixed(4)} atm`;
  } else if (sf === 'V') {
    if (isNaN(P)||isNaN(n)||isNaN(T)) { showError('กรุณากรอก P, n และ T'); return; }
    rearranged = 'V = nRT / P';
    result = n * R * T / P;
    substituted = `V = (${n.toFixed(4)} × ${R} × ${T.toFixed(2)}) / ${P.toFixed(4)}`;
    answer = `V = ${result.toFixed(4)} L`;
  } else if (sf === 'n') {
    if (isNaN(P)||isNaN(V)||isNaN(T)) { showError('กรุณากรอก P, V และ T'); return; }
    rearranged = 'n = PV / RT';
    result = P * V / (R * T);
    substituted = `n = (${P.toFixed(4)} × ${V.toFixed(4)}) / (${R} × ${T.toFixed(2)})`;
    answer = `n = ${result.toFixed(4)} mol`;
  } else if (sf === 'T') {
    if (isNaN(P)||isNaN(V)||isNaN(n)) { showError('กรุณากรอก P, V และ n'); return; }
    rearranged = 'T = PV / nR';
    result = P * V / (n * R);
    substituted = `T = (${P.toFixed(4)} × ${V.toFixed(4)}) / (${n.toFixed(4)} × ${R})`;
    answer = `T = ${result.toFixed(2)} K  (หรือ ${(result-273).toFixed(2)} °C)`;
  } else if (sf === 'm') {
    if (isNaN(P)||isNaN(V)||isNaN(T)||isNaN(Mol)) { showError('กรุณากรอก P, V, T และ M (มวลโมเลกุล)'); return; }
    const nCalc = P * V / (R * T);
    result = nCalc * Mol;
    rearranged = 'n = PV/RT  แล้ว  m = n × M';
    substituted = `n = (${P.toFixed(4)} × ${V.toFixed(4)}) / (${R} × ${T.toFixed(2)}) = ${nCalc.toFixed(4)} mol<br>m = ${nCalc.toFixed(4)} × ${Mol}`;
    answer = `m = ${result.toFixed(4)} g`;
  } else if (sf === 'M') {
    if (isNaN(P)||isNaN(V)||isNaN(T)||isNaN(m)) { showError('กรุณากรอก P, V, T และ m (มวล)'); return; }
    const nCalc = P * V / (R * T);
    result = m / nCalc;
    rearranged = 'n = PV/RT  แล้ว  M = m/n';
    substituted = `n = (${P.toFixed(4)} × ${V.toFixed(4)}) / (${R} × ${T.toFixed(2)}) = ${nCalc.toFixed(4)} mol<br>M = ${m} / ${nCalc.toFixed(4)}`;
    answer = `M = ${result.toFixed(2)} g/mol`;
  }

  steps.push({ title:'ขั้นที่ 4 — จัดรูปสูตร', content:'', formula: rearranged });
  steps.push({ title:'ขั้นที่ 5 — แทนค่า', content: substituted, formula:'' });
  steps.push({ title:'ขั้นที่ 6 — คำนวณ', content: `ผลลัพธ์ = ${!isNaN(result) ? result.toFixed(4) : '—'}`, formula:'' });
  steps.push({ title:'ขั้นที่ 7 — คำตอบพร้อมหน่วย', content: answer, formula:'' });

  // Sanity check
  const sanity = [];
  if (sf === 'P' && result < 0) sanity.push('⚠️ ความดันติดลบ — ตรวจสอบค่า T ว่าเป็น K หรือยัง');
  if (sf === 'T' && result < 0) sanity.push('⚠️ อุณหภูมิเป็น K ติดลบ — ผิดพลาดทางฟิสิกส์ ตรวจหน่วยใหม่');
  if (sf === 'n' && result < 0) sanity.push('⚠️ จำนวนโมลติดลบ — ตรวจสอบค่าที่กรอก');
  if (sf === 'V' && result > 10000) sanity.push('💡 ปริมาตรสูงมาก — ตรวจหน่วย P ว่าเป็น atm แล้วหรือยัง');
  steps.push({ title:'ขั้นที่ 8 — ตรวจความสมเหตุสมผล', content: sanity.length ? sanity.join('<br>') : '✅ ค่าที่ได้อยู่ในช่วงที่สมเหตุสมผล', formula:'' });

  renderSteps('ideal', steps, answer);
  updateGasPressureGauges(P, T, n);
  updateGasAnimation(T, n, V);
  updateIdealChart(P, V, n, T);

  // Save solution text
  state.solutionText.ideal = steps.map(s => `${s.title}\n${s.content || s.formula}`).join('\n\n') + `\n\nคำตอบ: ${answer}`;
  updateSummaryLastAnswer(answer, 'PV = nRT');
}

function renderSteps(page, steps, answer) {
  const container = document.getElementById(`${page}-steps`);
  const solDiv = document.getElementById(`${page}-solution`);
  const ansBox = document.getElementById(`${page}-answer`);
  const warnBox = document.getElementById(`${page}-warning`);

  container.innerHTML = '';
  solDiv.style.display = 'block';

  steps.forEach((s, i) => {
    const el = document.createElement('div');
    el.className = 'step-item';
    el.style.animationDelay = `${i * 0.08}s`;
    el.innerHTML = `
      <div class="step-num">${i+1}</div>
      <div class="step-body">
        <div class="step-title">${s.title}</div>
        ${s.formula ? `<div class="step-formula">${s.formula}</div>` : ''}
        ${s.content ? `<div class="step-content">${s.content}</div>` : ''}
      </div>`;
    container.appendChild(el);
  });

  ansBox.innerHTML = `✅ ${answer}`;

  if (warnBox) {
    const warn = steps.find(s => s.content && s.content.includes('⚠️'));
    if (warn) {
      warnBox.innerHTML = warn.content;
      warnBox.classList.add('show');
    } else {
      warnBox.classList.remove('show');
    }
  }
}

function resetIdeal() {
  ['i-P','i-V','i-n','i-T','i-m','i-Mol'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.disabled = false; el.classList.remove('error-input'); }
  });
  document.getElementById('ideal-solution').style.display = 'none';
  document.getElementById('unit-result').textContent = '';
  selectSolveFor('P','ideal');
}

function randomIdeal() {
  const examples = [
    { P:'', V:'5.00', n:'2.00', T:'27', uP:'atm', uV:'L', uT:'C', sf:'P' },
    { P:'2.00', V:'', n:'1.50', T:'127', uP:'atm', uV:'L', uT:'C', sf:'V' },
    { P:'3.00', V:'10.0', n:'', T:'57', uP:'atm', uV:'L', uT:'C', sf:'n' },
    { P:'1.50', V:'8.20', n:'0.500', T:'', uP:'atm', uV:'L', uT:'C', sf:'T' },
    { P:'', V:'12.0', n:'', T:'27', uP:'atm', uV:'L', uT:'C', sf:'P', m:'22.0', Mol:'44' },
  ];
  const ex = examples[Math.floor(Math.random() * examples.length)];
  document.getElementById('i-P').value = ex.P;
  document.getElementById('i-V').value = ex.V;
  document.getElementById('i-n').value = ex.n;
  document.getElementById('i-T').value = ex.T;
  document.getElementById('i-m').value = ex.m || '';
  document.getElementById('i-Mol').value = ex.Mol || '';
  document.getElementById('u-P').value = ex.uP;
  document.getElementById('u-V').value = ex.uV;
  document.getElementById('u-T').value = ex.uT;
  selectSolveFor(ex.sf,'ideal');
}

function liveUpdate(page) {
  if (page === 'ideal') {
    const vals = getIdealValues();
    updateGasAnimation(vals.T, vals.n, vals.V);
  }
}

// ── UNIT CONVERTER ─────────────────────────────────────────────
function convertUnit(type) {
  const result = document.getElementById('unit-result');
  let val, res;
  if (type === 'CtoK') {
    val = prompt('กรอกอุณหภูมิ (°C):');
    if (val === null) return;
    res = `${parseFloat(val)}°C = ${parseFloat(val)+273} K`;
  } else if (type === 'KtoC') {
    val = prompt('กรอกอุณหภูมิ (K):');
    if (val === null) return;
    res = `${parseFloat(val)} K = ${parseFloat(val)-273}°C`;
  } else if (type === 'mmHgtoAtm') {
    val = prompt('กรอกความดัน (mmHg):');
    if (val === null) return;
    res = `${parseFloat(val)} mmHg = ${(parseFloat(val)/760).toFixed(4)} atm`;
  } else if (type === 'mLtoL') {
    val = prompt('กรอกปริมาตร (mL):');
    if (val === null) return;
    res = `${parseFloat(val)} mL = ${(parseFloat(val)/1000).toFixed(4)} L`;
  }
  result.textContent = res || '';
}

// ── GAS CANVAS ANIMATION ───────────────────────────────────────
let gasParticles = [];
let gasAnimId = null;

function initGasCanvas() {
  const canvas = document.getElementById('gasCanvas');
  gasParticles = [];
  for (let i = 0; i < 20; i++) {
    gasParticles.push(makeGasParticle(canvas.width, canvas.height, 1.0));
  }
  animateGas();
}

function makeGasParticle(W, H, speedMult) {
  const angle = Math.random() * Math.PI * 2;
  const speed = (0.5 + Math.random() * 1.5) * speedMult;
  return {
    x: 20 + Math.random() * (W-40),
    y: 20 + Math.random() * (H-40),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: 4 + Math.random() * 4,
    hue: 200 + Math.random() * 60
  };
}

function animateGas() {
  const canvas = document.getElementById('gasCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0,0,W,H);
  // draw container
  ctx.strokeStyle = '#4A90D9';
  ctx.lineWidth = 2;
  ctx.strokeRect(4,4,W-8,H-8);

  gasParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x - p.r < 4)   { p.x = 4 + p.r;   p.vx = Math.abs(p.vx); }
    if (p.x + p.r > W-4) { p.x = W-4-p.r;   p.vx = -Math.abs(p.vx); }
    if (p.y - p.r < 4)   { p.y = 4 + p.r;   p.vy = Math.abs(p.vy); }
    if (p.y + p.r > H-4) { p.y = H-4-p.r;   p.vy = -Math.abs(p.vy); }

    const grad = ctx.createRadialGradient(p.x-p.r*0.3, p.y-p.r*0.3, 1, p.x, p.y, p.r);
    grad.addColorStop(0, `hsla(${p.hue},90%,80%,0.95)`);
    grad.addColorStop(1, `hsla(${p.hue},70%,55%,0.5)`);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fillStyle = grad;
    ctx.fill();
  });

  gasAnimId = requestAnimationFrame(animateGas);
}

function updateGasAnimation(T, n, V) {
  const canvas = document.getElementById('gasCanvas');
  if (!canvas) return;
  const W = canvas.width, H = canvas.height;

  // speed proportional to sqrt(T), default T=300K
  const speedMult = isNaN(T) ? 1 : Math.sqrt(Math.max(T,1) / 300);
  const count = isNaN(n) ? 20 : Math.max(5, Math.min(50, Math.round(n * 10)));

  gasParticles = [];
  for (let i = 0; i < count; i++) {
    gasParticles.push(makeGasParticle(W, H, speedMult));
  }

  // Update status
  const status = document.getElementById('gasStatus');
  if (status) {
    if (!isNaN(T) && T > 0) {
      const Tc = T - 273;
      if (Tc > 200) status.textContent = `อุณหภูมิสูง (${T.toFixed(0)} K) — อนุภาคเคลื่อนที่เร็ว ชนผนังบ่อยขึ้น`;
      else if (Tc < 0) status.textContent = `อุณหภูมิต่ำ (${T.toFixed(0)} K) — อนุภาคเคลื่อนที่ช้า`;
      else status.textContent = `T = ${T.toFixed(0)} K | อนุภาค ${count} ตัว`;
    }
  }
}

function updateGasPressureGauges(P, T, n) {
  const setGauge = (id, valId, pct, val, unit) => {
    const fill = document.getElementById(id);
    const valEl = document.getElementById(valId);
    if (fill) fill.style.height = Math.max(5, Math.min(95, pct)) + '%';
    if (valEl) valEl.textContent = isNaN(val) ? '—' : `${val.toFixed(2)} ${unit}`;
  };
  setGauge('g-P-fill','g-P-val', isNaN(P)?30:Math.min(95,P*20), P, 'atm');
  setGauge('g-T-fill','g-T-val', isNaN(T)?30:Math.min(95,(T/600)*95), T, 'K');
  setGauge('g-n-fill','g-n-val', isNaN(n)?30:Math.min(95,n*20), n, 'mol');
}

// ── IDEAL GAS CHARTS ──────────────────────────────────────────
let idealChartInstance = null;

function buildIdealChart(type) {
  state.idealChartType = type;
  const ctx = document.getElementById('idealChart').getContext('2d');
  if (idealChartInstance) idealChartInstance.destroy();

  let labels = [], data = [], curPt = null;
  const vals = getIdealValues();
  const { P, V, n, T } = vals;
  const desc = document.getElementById('ideal-chart-desc');

  if (type === 'PV') {
    const nUse = isNaN(n) ? 1 : n;
    const TUse = isNaN(T) ? 300 : T;
    labels = [0.5,1,1.5,2,2.5,3,3.5,4,4.5,5].map(v => v.toFixed(1));
    data = labels.map(l => nUse*R*TUse/parseFloat(l));
    if (!isNaN(P) && !isNaN(V)) curPt = { x: P, y: V };
    if (desc) desc.textContent = 'กฎของบอยล์: P และ V เป็นสัดส่วนผกผัน (T และ n คงที่)';
  } else if (type === 'VT') {
    const nUse = isNaN(n) ? 1 : n;
    const PUse = isNaN(P) ? 1 : P;
    labels = [200,250,300,350,400,450,500];
    data = labels.map(t => nUse*R*t/PUse);
    if (!isNaN(T) && !isNaN(V)) curPt = { x: T, y: V };
    if (desc) desc.textContent = 'กฎของชาร์ล: V และ T เป็นสัดส่วนตรง (P และ n คงที่)';
  } else {
    const nUse = isNaN(n) ? 1 : n;
    const VUse = isNaN(V) ? 1 : V;
    labels = [200,250,300,350,400,450,500];
    data = labels.map(t => nUse*R*t/VUse);
    if (!isNaN(T) && !isNaN(P)) curPt = { x: T, y: P };
    if (desc) desc.textContent = 'กฎของเกย์-ลุสซัก: P และ T เป็นสัดส่วนตรง (V และ n คงที่)';
  }

  const datasets = [{
    label: type === 'PV' ? 'V (L)' : type === 'VT' ? 'V (L)' : 'P (atm)',
    data: data,
    borderColor: '#2E6DB4', backgroundColor: 'rgba(46,109,180,0.1)',
    borderWidth: 2, fill: true, tension: 0.4, pointRadius: 2
  }];

  if (curPt) {
    const xIdx = labels.findIndex((l, i) => {
      return i === labels.length-1 || (parseFloat(l) <= curPt.x && curPt.x < parseFloat(labels[i+1]));
    });
    datasets.push({
      label: 'ค่าปัจจุบัน',
      data: labels.map((l,i) => i === xIdx ? curPt.y : null),
      borderColor: '#E07B39', backgroundColor: '#E07B39',
      pointRadius: 8, type: 'scatter', showLine: false
    });
  }

  idealChartInstance = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'top'} }, scales:{ x:{title:{display:true,text: type==='PV'?'P (atm)':'T (K)'}}, y:{title:{display:true,text: type==='PV'||type==='VT'?'V (L)':'P (atm)'},beginAtZero:false} } }
  });
}

function updateIdealChart(P, V, n, T) { buildIdealChart(state.idealChartType); }

function switchChart(page, type) {
  document.querySelectorAll(`#page-${page} .chart-tab`).forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (page === 'ideal') buildIdealChart(type);
  if (page === 'dalton') buildDaltonChart(type);
  if (page === 'graham') buildGrahamChart(type);
}

// ════════════════════════════════════════════
// ── DALTON LAB ─────────────────────────────
// ════════════════════════════════════════════

let daltonChartInstance = null;
let daltonAnimId = null;
let daltonParticles = [];

function renderDaltonGasList() {
  const list = document.getElementById('dalton-gas-list');
  list.innerHTML = '';
  state.dalton.gases.forEach((g, i) => {
    const row = document.createElement('div');
    row.className = 'dalton-gas-row';
    row.innerHTML = `
      <div class="gas-dot" style="background:${g.color}"></div>
      <select onchange="updateDaltonName(${i},'pressure',this.value)" style="width:80px">
        ${GAS_NAMES.map(n => `<option value="${n}" ${n===g.name?'selected':''}>${n}</option>`).join('')}
      </select>
      <input type="number" value="${g.value}" step="any" placeholder="P (atm)" oninput="updateDaltonVal(${i},'pressure',this.value)" style="flex:1" />
      <span style="font-size:0.8rem;color:#888">atm</span>
      <button onclick="removeDaltonGas(${i},'pressure')">✕</button>`;
    list.appendChild(row);
  });
}

function renderDaltonMolList() {
  const list = document.getElementById('dalton-mol-list');
  list.innerHTML = '';
  state.dalton.moles.forEach((g, i) => {
    const row = document.createElement('div');
    row.className = 'dalton-gas-row';
    row.innerHTML = `
      <div class="gas-dot" style="background:${g.color}"></div>
      <select onchange="updateDaltonName(${i},'mole',this.value)" style="width:80px">
        ${GAS_NAMES.map(n => `<option value="${n}" ${n===g.name?'selected':''}>${n}</option>`).join('')}
      </select>
      <input type="number" value="${g.mol}" step="any" placeholder="mol" oninput="updateDaltonVal(${i},'mole',this.value)" style="flex:1" />
      <span style="font-size:0.8rem;color:#888">mol</span>
      <button onclick="removeDaltonGas(${i},'mole')">✕</button>`;
    list.appendChild(row);
  });
}

function updateDaltonName(i, mode, val) {
  const color = GAS_COLORS[val] || GAS_COLORS.default;
  if (mode === 'pressure') { state.dalton.gases[i].name = val; state.dalton.gases[i].color = color; renderDaltonGasList(); }
  else { state.dalton.moles[i].name = val; state.dalton.moles[i].color = color; renderDaltonMolList(); }
}

function updateDaltonVal(i, mode, val) {
  if (mode === 'pressure') state.dalton.gases[i].value = parseFloat(val) || 0;
  else state.dalton.moles[i].mol = parseFloat(val) || 0;
  updateDaltonCanvas();
  calcDaltonLive();
}

function addDaltonGas() {
  const names = GAS_NAMES.filter(n => !state.dalton.gases.find(g => g.name===n));
  const name = names[0] || 'He';
  state.dalton.gases.push({ name, value:0, color: GAS_COLORS[name]||GAS_COLORS.default });
  renderDaltonGasList();
}

function addDaltonMol() {
  const names = GAS_NAMES.filter(n => !state.dalton.moles.find(g => g.name===n));
  const name = names[0] || 'He';
  state.dalton.moles.push({ name, mol:0, color: GAS_COLORS[name]||GAS_COLORS.default });
  renderDaltonMolList();
}

function removeDaltonGas(i, mode) {
  if (mode === 'pressure') { state.dalton.gases.splice(i,1); renderDaltonGasList(); }
  else { state.dalton.moles.splice(i,1); renderDaltonMolList(); }
  updateDaltonCanvas();
}

function switchDaltonMode(mode) {
  state.dalton.mode = mode;
  document.getElementById('dt-mode-pressure').classList.toggle('active', mode==='pressure');
  document.getElementById('dt-mode-mole').classList.toggle('active', mode==='mole');
  document.getElementById('dalton-mode-pressure').style.display = mode==='pressure'?'block':'none';
  document.getElementById('dalton-mode-mole').style.display = mode==='mole'?'block':'none';
}

function calcDaltonLive() { if (state.dalton.mode === 'pressure') calcDalton(); else calcDaltonMol(); }

function calcDalton() {
  const gases = state.dalton.gases;
  if (!gases.length) return;
  const total = gases.reduce((s, g) => s + g.value, 0);

  const steps = [];
  steps.push({ title:'ขั้นที่ 1 — ค่าที่กำหนด', content: gases.map(g=>`P(${g.name}) = ${g.value} atm`).join(' | '), formula:'' });
  steps.push({ title:'ขั้นที่ 2 — สูตร', content:'กฎความดันย่อยของดาลตัน', formula:'P<sub>total</sub> = P₁ + P₂ + P₃ + ...' });
  steps.push({ title:'ขั้นที่ 3 — แทนค่า', content: gases.map(g=>`${g.value}`).join(' + ') + ` = <strong>${total.toFixed(4)} atm</strong>`, formula:'' });
  steps.push({ title:'ขั้นที่ 4 — % แต่ละแก๊ส', content: gases.map(g=>`${g.name}: ${((g.value/total)*100).toFixed(1)}%`).join('<br>'), formula:'' });

  const answer = `P<sub>total</sub> = ${total.toFixed(4)} atm`;
  renderSteps('dalton', steps, answer);
  buildDaltonChart(state.daltonChartType || 'bar');
  updateDaltonCanvas();
  state.solutionText.dalton = steps.map(s=>`${s.title}\n${s.content||s.formula}`).join('\n\n') + `\n\nคำตอบ: P total = ${total.toFixed(4)} atm`;
}

function calcDaltonMol() {
  const moles = state.dalton.moles;
  const Ptotal = parseFloat(document.getElementById('i-Ptotal').value);
  if (!moles.length || isNaN(Ptotal)) return;

  const ntotal = moles.reduce((s, g) => s + g.mol, 0);
  const steps = [];
  steps.push({ title:'ขั้นที่ 1 — ค่าที่กำหนด', content: moles.map(g=>`n(${g.name}) = ${g.mol} mol`).join(' | ') + ` | P<sub>total</sub> = ${Ptotal} atm`, formula:'' });
  steps.push({ title:'ขั้นที่ 2 — หา n รวม', content:'', formula:`n<sub>total</sub> = ${moles.map(g=>g.mol).join(' + ')} = ${ntotal.toFixed(4)} mol` });
  steps.push({ title:'ขั้นที่ 3 — สูตรเศษส่วนโมล', content:'', formula:'X<sub>i</sub> = n<sub>i</sub> / n<sub>total</sub>' });

  const molFracs = moles.map(g => ({ ...g, X: g.mol/ntotal, P: (g.mol/ntotal)*Ptotal }));
  steps.push({ title:'ขั้นที่ 4 — เศษส่วนโมล', content: molFracs.map(g=>`X(${g.name}) = ${g.mol}/${ntotal.toFixed(4)} = ${g.X.toFixed(4)}`).join('<br>'), formula:'' });
  steps.push({ title:'ขั้นที่ 5 — ความดันย่อย (P<sub>i</sub> = X<sub>i</sub> × P<sub>total</sub>)', content: molFracs.map(g=>`P(${g.name}) = ${g.X.toFixed(4)} × ${Ptotal} = <strong>${g.P.toFixed(4)} atm</strong>`).join('<br>'), formula:'' });

  const verify = molFracs.reduce((s,g)=>s+g.P,0);
  steps.push({ title:'ตรวจสอบ', content:`ΣP<sub>i</sub> = ${verify.toFixed(4)} atm ${Math.abs(verify-Ptotal)<0.001?'✅':'⚠️'}`, formula:'' });

  const answer = molFracs.map(g=>`P(${g.name}) = ${g.P.toFixed(4)} atm`).join(' | ');
  renderSteps('dalton', steps, answer);

  // Update gases for chart
  state.dalton.gases = molFracs.map(g=>({ name:g.name, value:g.P, color:GAS_COLORS[g.name]||GAS_COLORS.default }));
  buildDaltonChart(state.daltonChartType||'bar');
  updateDaltonCanvas();
}

function resetDalton() {
  state.dalton.gases = [
    { name:'O2', value:0.21, color:'#4fc3f7' },
    { name:'N2', value:0.78, color:'#ab47bc' },
    { name:'Ar', value:0.01, color:'#66bb6a' },
  ];
  state.dalton.moles = [
    { name:'O2', mol:0.30, color:'#4fc3f7' },
    { name:'N2', mol:0.60, color:'#ab47bc' },
    { name:'CO2', mol:0.10, color:'#90a4ae' },
  ];
  renderDaltonGasList();
  renderDaltonMolList();
  document.getElementById('i-Ptotal').value = '';
  document.getElementById('dalton-solution').style.display = 'none';
  updateDaltonCanvas();
}

// ── DALTON CANVAS ─────────────────────────────────────────────
function initDaltonCanvas() {
  updateDaltonCanvas();
}

function updateDaltonCanvas() {
  const canvas = document.getElementById('daltonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  if (daltonAnimId) cancelAnimationFrame(daltonAnimId);

  const gases = state.dalton.gases;
  const total = gases.reduce((s,g)=>s+g.value,0) || 1;

  daltonParticles = [];
  gases.forEach(g => {
    const count = Math.max(2, Math.round((g.value/total) * 50));
    for (let i = 0; i < count; i++) {
      const speed = 0.6 + Math.random() * 0.8;
      const angle = Math.random() * Math.PI * 2;
      daltonParticles.push({
        x: 10+Math.random()*(W-20), y:10+Math.random()*(H-20),
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
        r: 4+Math.random()*3, color: g.color, name: g.name
      });
    }
  });

  // Legend
  const legend = document.getElementById('daltonLegend');
  if (legend) {
    legend.innerHTML = gases.map(g=>`<div class="legend-item"><div class="legend-dot" style="background:${g.color}"></div>${g.name}: ${g.value.toFixed(3)} atm</div>`).join('');
  }

  animateDalton();
}

function animateDalton() {
  const canvas = document.getElementById('daltonCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle = '#4A90D9'; ctx.lineWidth = 2;
  ctx.strokeRect(4,4,W-8,H-8);

  daltonParticles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x-p.r<4) { p.x=4+p.r; p.vx=Math.abs(p.vx); }
    if (p.x+p.r>W-4) { p.x=W-4-p.r; p.vx=-Math.abs(p.vx); }
    if (p.y-p.r<4) { p.y=4+p.r; p.vy=Math.abs(p.vy); }
    if (p.y+p.r>H-4) { p.y=H-4-p.r; p.vy=-Math.abs(p.vy); }
    ctx.beginPath();
    ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = p.color + 'CC';
    ctx.fill();
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  daltonAnimId = requestAnimationFrame(animateDalton);
}

// ── DALTON CHARTS ─────────────────────────────────────────────
function buildDaltonChart(type) {
  state.daltonChartType = type;
  const ctx = document.getElementById('daltonChart').getContext('2d');
  if (daltonChartInstance) daltonChartInstance.destroy();

  const gases = state.dalton.gases;
  const labels = gases.map(g=>g.name);
  const vals = gases.map(g=>g.value);
  const colors = gases.map(g=>g.color);

  if (type === 'bar') {
    daltonChartInstance = new Chart(ctx, {
      type:'bar', data:{ labels, datasets:[{ label:'ความดันย่อย (atm)', data:vals, backgroundColor:colors.map(c=>c+'99'), borderColor:colors, borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, title:{display:true,text:'P (atm)'}}} }
    });
  } else {
    const total = vals.reduce((a,b)=>a+b,0)||1;
    daltonChartInstance = new Chart(ctx, {
      type:'pie', data:{ labels, datasets:[{ data:vals, backgroundColor:colors.map(c=>c+'CC'), borderColor:colors, borderWidth:2 }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{position:'right'}, tooltip:{ callbacks:{ label: ctx=>` ${ctx.label}: ${ctx.raw.toFixed(3)} atm (${((ctx.raw/total)*100).toFixed(1)}%)` } } } }
    });
  }
}

// ════════════════════════════════════════════
// ── GRAHAM / GAS RACE ──────────────────────
// ════════════════════════════════════════════

let grahamChartInstance = null;
let raceAnimId = null;
let effAnimId = null;

function updateGasPicker(num) {
  const sel = document.getElementById(`gas${num}-select`);
  const inp = document.getElementById(`gas${num}-M`);
  const val = sel.value;
  if (val !== 'custom') inp.value = val;
  updateGraham();
}

function updateGraham() {
  const M1 = parseFloat(document.getElementById('gas1-M').value) || 32;
  const M2 = parseFloat(document.getElementById('gas2-M').value) || 2;
  state.graham.M1 = M1; state.graham.M2 = M2;
  const sel1 = document.getElementById('gas1-select');
  const sel2 = document.getElementById('gas2-select');
  state.graham.name1 = sel1.value !== 'custom' ? sel1.options[sel1.selectedIndex].text.split(' ')[0] : `Gas1(M=${M1})`;
  state.graham.name2 = sel2.value !== 'custom' ? sel2.options[sel2.selectedIndex].text.split(' ')[0] : `Gas2(M=${M2})`;
  state.graham.ratio = Math.sqrt(M1/M2); // r2/r1 if M1>M2 means gas2 is faster
  buildGrahamChart(state.grahamChartType);
}

function switchGrahamMode(mode) {
  state.graham.mode = mode;
  document.getElementById('gr-mode-race').classList.toggle('active', mode==='race');
  document.getElementById('gr-mode-eff').classList.toggle('active', mode==='effusion');
  document.getElementById('race-anim-card').style.display = mode==='race'?'block':'none';
  document.getElementById('effusion-anim-card').style.display = mode==='effusion'?'block':'none';
  document.getElementById('effusion-inputs').style.display = mode==='effusion'?'block':'none';
}

function calcGraham() {
  const M1 = state.graham.M1, M2 = state.graham.M2;
  const name1 = state.graham.name1, name2 = state.graham.name2;

  if (isNaN(M1)||isNaN(M2)||M1<=0||M2<=0) { showError('กรุณากรอก M ของแก๊สทั้งสองชนิด'); return; }

  const ratio12 = Math.sqrt(M2/M1); // r1/r2
  const faster = ratio12 > 1 ? name1 : name2;
  const fasterRatio = Math.max(ratio12, 1/ratio12);

  const steps = [];
  steps.push({ title:'ขั้นที่ 1 — ค่าที่กำหนด', content:`${name1}: M₁ = ${M1} g/mol | ${name2}: M₂ = ${M2} g/mol`, formula:'' });
  steps.push({ title:'ขั้นที่ 2 — สูตรกฎของเกรแฮม', content:'', formula:'r₁/r₂ = √(M₂/M₁)' });
  steps.push({ title:'ขั้นที่ 3 — แทนค่า', content:'', formula:`r(${name1})/r(${name2}) = √(${M2}/${M1}) = √${(M2/M1).toFixed(4)} = ${ratio12.toFixed(4)}` });
  steps.push({ title:'ขั้นที่ 4 — สรุป', content:`${faster} แพร่เร็วกว่า <strong>${fasterRatio.toFixed(4)} เท่า</strong><br>เพราะมวลโมเลกุลน้อยกว่า = เคลื่อนที่ได้เร็วกว่าที่อุณหภูมิเดียวกัน`, formula:'' });

  const answer = `r(${name1})/r(${name2}) = ${ratio12.toFixed(4)} — ${faster} แพร่เร็วกว่า ${fasterRatio.toFixed(4)} เท่า`;
  renderSteps('graham', steps, answer);
  buildGrahamChart(state.grahamChartType);
  initRaceCanvas();

  state.solutionText.graham = steps.map(s=>`${s.title}\n${s.content||s.formula}`).join('\n\n')+`\n\nคำตอบ: ${answer}`;
  updateSummaryLastAnswer(answer, 'r₁/r₂ = √(M₂/M₁)');
}

function calcEffusion() {
  const vol1 = parseFloat(document.getElementById('eff-vol1').value);
  const t = parseFloat(document.getElementById('eff-time').value);
  if (isNaN(vol1)||isNaN(t)) return;

  const M1 = state.graham.M1, M2 = state.graham.M2;
  const ratio = Math.sqrt(M1/M2); // r2/r1
  const vol2 = vol1 / Math.sqrt(M2/M1);
  const res = document.getElementById('effusion-result');
  if (res) {
    res.style.display = 'block';
    res.innerHTML = `✅ ${state.graham.name2} แพร่ได้ ${vol2.toFixed(2)} mL ในเวลา ${t} นาที`;
  }
}

function findUnknownM() {
  const ratio = parseFloat(document.getElementById('unknown-ratio').value);
  const Mknown = parseFloat(document.getElementById('unknown-M').value);
  if (isNaN(ratio)||isNaN(Mknown)) { showError('กรอกค่าให้ครบ'); return; }
  const Munknown = Mknown / (ratio * ratio);
  const res = document.getElementById('unknown-result');
  res.style.display = 'block';
  res.innerHTML = `✅ M ของแก๊สปริศนา = ${Munknown.toFixed(2)} g/mol<br><small>จาก: r₁/r₂ = √(M₂/M₁) → ${ratio}² = M<sub>known</sub>/M<sub>x</sub></small>`;
}

function resetGraham() {
  document.getElementById('gas1-M').value = 32;
  document.getElementById('gas2-M').value = 2;
  document.getElementById('gas1-select').value = '32';
  document.getElementById('gas2-select').value = '2';
  document.getElementById('unknown-ratio').value = '';
  document.getElementById('unknown-M').value = '';
  document.getElementById('unknown-result').style.display = 'none';
  document.getElementById('graham-solution').style.display = 'none';
  updateGraham();
}

function randomGraham() {
  const pairs = [[2,32,'2','32'],[4,28,'4','28'],[17,36.5,'17','36.5'],[16,44,'16','44'],[34,64,'34','64']];
  const p = pairs[Math.floor(Math.random()*pairs.length)];
  document.getElementById('gas1-M').value = p[0];
  document.getElementById('gas2-M').value = p[1];
  document.getElementById('gas1-select').value = p[2];
  document.getElementById('gas2-select').value = p[3];
  updateGraham();
  calcGraham();
}

// ── RACE CANVAS ───────────────────────────────────────────────
let raceMolecules = [];

function initRaceCanvas() {
  const canvas = document.getElementById('raceCanvas');
  if (!canvas) return;
  if (raceAnimId) cancelAnimationFrame(raceAnimId);

  state.graham.raceRunning = false;
  state.graham.raceT = 0;
  document.getElementById('race-play-btn').textContent = '▶ เริ่มแข่ง';

  const M1 = state.graham.M1 || 32;
  const M2 = state.graham.M2 || 2;
  const r1 = 1 / Math.sqrt(M1); // relative speed
  const r2 = 1 / Math.sqrt(M2);
  const norm = Math.max(r1, r2);

  raceMolecules = [
    { x:20, y:55, speed:(r1/norm)*3, color:'#4fc3f7', label:state.graham.name1||'Gas1', r:9 },
    { x:20, y:125, speed:(r2/norm)*3, color:'#a78bfa', label:state.graham.name2||'Gas2', r:9 }
  ];

  document.getElementById('race-status').textContent = `${state.graham.name1} (M=${M1}) vs ${state.graham.name2} (M=${M2}) — กด ▶ เพื่อเริ่มแข่ง`;
  drawRace();
}

function drawRace() {
  const canvas = document.getElementById('raceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  ctx.clearRect(0,0,W,H);

  // Track
  [55, 125].forEach(y => {
    ctx.strokeStyle = '#e0e7ef'; ctx.lineWidth = 28; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(20,y); ctx.lineTo(W-30,y); ctx.stroke();
    ctx.strokeStyle = '#c7d8ee'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20,y-14); ctx.lineTo(W-30,y-14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(20,y+14); ctx.lineTo(W-30,y+14); ctx.stroke();
  });

  // Finish line
  ctx.strokeStyle = '#E07B39'; ctx.lineWidth = 3; ctx.setLineDash([4,4]);
  ctx.beginPath(); ctx.moveTo(W-30,30); ctx.lineTo(W-30,H-30); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#E07B39'; ctx.font = 'bold 11px Arial';
  ctx.fillText('FINISH', W-60, 24);

  raceMolecules.forEach(m => {
    const grad = ctx.createRadialGradient(m.x-3,m.y-3,2,m.x,m.y,m.r);
    grad.addColorStop(0,'white'); grad.addColorStop(1,m.color);
    ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
    ctx.fillStyle = grad; ctx.fill();
    ctx.strokeStyle = m.color; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#333'; ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(m.label, m.x, m.y+m.r+12);
  });
  ctx.textAlign = 'left';
}

function animateRace() {
  if (!state.graham.raceRunning) return;
  const W = document.getElementById('raceCanvas').width;
  const finish = W - 30;
  let done = false;

  raceMolecules.forEach(m => {
    if (m.x < finish) m.x += m.speed;
    else done = true;
  });

  drawRace();

  if (done) {
    state.graham.raceRunning = false;
    const winner = raceMolecules.reduce((a,b)=>a.x>b.x?a:b);
    document.getElementById('race-status').innerHTML = `🏆 <strong>${winner.label}</strong> ชนะ! แพร่เร็วกว่าเพราะมวลโมเลกุลน้อยกว่า`;
    document.getElementById('race-play-btn').textContent = '↺ แข่งใหม่';
  } else {
    raceAnimId = requestAnimationFrame(animateRace);
  }
}

function toggleRace() {
  if (state.graham.raceRunning) {
    state.graham.raceRunning = false;
    document.getElementById('race-play-btn').textContent = '▶ เริ่มต่อ';
  } else {
    // Reset if at finish
    const W = document.getElementById('raceCanvas').width;
    if (raceMolecules.every(m => m.x >= W-30)) initRaceCanvas();
    state.graham.raceRunning = true;
    document.getElementById('race-play-btn').textContent = '⏸ หยุด';
    animateRace();
  }
}

function resetRace() { initRaceCanvas(); }

// ── EFFUSION CANVAS ───────────────────────────────────────────
let effParticles = [];

function initEffCanvas() {
  const canvas = document.getElementById('effCanvas');
  if (!canvas) return;
  effParticles = [];
  animateEff();
}

function updateEffusion(t) {
  document.getElementById('eff-t-display').textContent = t;
  updateDaltonCanvas();
}

function animateEff() {
  const canvas = document.getElementById('effCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const M1 = state.graham.M1||32, M2 = state.graham.M2||2;

  ctx.clearRect(0,0,W,H);

  // Container
  ctx.fillStyle = 'rgba(214,232,248,0.4)';
  ctx.fillRect(10,20,W/2-20,H-40);
  ctx.strokeStyle = '#4A90D9'; ctx.lineWidth = 2;
  ctx.strokeRect(10,20,W/2-20,H-40);

  // Hole
  ctx.fillStyle = '#fff';
  ctx.fillRect(W/2-22,H/2-8,4,16);

  // Particles
  if (Math.random() < 0.08) {
    const speed1 = 1.5 / Math.sqrt(M1);
    const speed2 = 1.5 / Math.sqrt(M2);
    effParticles.push({ x:W/2-22, y:H/2, vx:speed1*3, vy:(Math.random()-0.5)*1.5, color:'#4fc3f7', r:5 });
    effParticles.push({ x:W/2-22, y:H/2, vx:speed2*3, vy:(Math.random()-0.5)*1.5, color:'#a78bfa', r:5 });
  }

  effParticles = effParticles.filter(p=>{
    p.x += p.vx; p.y += p.vy;
    if (p.x > W+20 || p.y < 0 || p.y > H) return false;
    ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
    ctx.fillStyle = p.color+'CC'; ctx.fill();
    return true;
  });

  // Inside particles
  for (let i=0;i<12;i++){
    const x=15+Math.random()*(W/2-30), y=25+Math.random()*(H-50);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2);
    ctx.fillStyle = (Math.random()<0.5?'#4fc3f7':'#a78bfa')+'88'; ctx.fill();
  }

  effAnimId = requestAnimationFrame(animateEff);
}

// ── GRAHAM CHARTS ─────────────────────────────────────────────
function buildGrahamChart(type) {
  state.grahamChartType = type;
  const ctx = document.getElementById('grahamChart').getContext('2d');
  if (grahamChartInstance) grahamChartInstance.destroy();

  const M1=state.graham.M1||32, M2=state.graham.M2||2;
  const n1=state.graham.name1||'Gas1', n2=state.graham.name2||'Gas2';
  const r1=1/Math.sqrt(M1), r2=1/Math.sqrt(M2);
  const norm=Math.max(r1,r2);

  if (type==='mass') {
    grahamChartInstance = new Chart(ctx, {
      type:'bar', data:{labels:[n1,n2],datasets:[{label:'มวลโมเลกุล (g/mol)',data:[M1,M2],backgroundColor:['#4fc3f799','#a78bfa99'],borderColor:['#4fc3f7','#a78bfa'],borderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,title:{display:true,text:'M (g/mol)'}}}}
    });
  } else if (type==='rate') {
    grahamChartInstance = new Chart(ctx, {
      type:'bar', data:{labels:[n1,n2],datasets:[{label:'อัตราการแพร่ (relative)',data:[(r1/norm).toFixed(4),(r2/norm).toFixed(4)],backgroundColor:['#4fc3f799','#a78bfa99'],borderColor:['#4fc3f7','#a78bfa'],borderWidth:2}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:1.1,title:{display:true,text:'อัตราสัมพัทธ์'}}}}
    });
  } else {
    const times=[0,2,4,6,8,10,12,14,16,18,20];
    const data1=times.map(t=>t*(r1/norm)*50);
    const data2=times.map(t=>t*(r2/norm)*50);
    grahamChartInstance = new Chart(ctx, {
      type:'line', data:{labels:times,datasets:[{label:n1,data:data1,borderColor:'#4fc3f7',backgroundColor:'rgba(79,195,247,0.1)',fill:true,tension:0.4},{label:n2,data:data2,borderColor:'#a78bfa',backgroundColor:'rgba(167,139,250,0.1)',fill:true,tension:0.4}]},
      options:{responsive:true,maintainAspectRatio:false,scales:{x:{title:{display:true,text:'เวลา (นาที)'}},y:{beginAtZero:true,title:{display:true,text:'ปริมาตร (mL)'}}}}
    });
  }
}

// ════════════════════════════════════════════
// ── WORKSHEET MODE ─────────────────────────
// ════════════════════════════════════════════

const WORKSHEET = {
  part1: [
    { id:'1-1', text:'N₂ 2.00 mol ที่ 27°C บรรจุในภาชนะ 5.00 L จงหาความดัน P', given:{n:'2.00',V:'5.00',T:'27',uT:'C'}, find:'P', solver:'ideal', hints:['ใช้สูตร P = nRT/V','แปลง T: 27 + 273 = 300 K','P = (2.00 × 0.0821 × 300) / 5.00'] },
    { id:'1-2', text:'O₂ 1.50 mol ที่ 2.00 atm และ 127°C จงหาปริมาตร V', given:{n:'1.50',P:'2.00',T:'127',uT:'C'}, find:'V', solver:'ideal', hints:['ใช้สูตร V = nRT/P','แปลง T: 127 + 273 = 400 K','V = (1.50 × 0.0821 × 400) / 2.00'] },
    { id:'1-3', text:'แก๊สบรรจุในถัง 10.0 L ที่ 3.00 atm อุณหภูมิ 57°C จงหา n', given:{P:'3.00',V:'10.0',T:'57',uT:'C'}, find:'n', solver:'ideal', hints:['ใช้สูตร n = PV/RT','แปลง T: 57 + 273 = 330 K','n = (3.00 × 10.0) / (0.0821 × 330)'] },
    { id:'1-4', text:'แก๊ส 0.500 mol ที่ 1.50 atm บรรจุใน 8.20 L จงหา T เป็น °C', given:{n:'0.500',P:'1.50',V:'8.20'}, find:'T', solver:'ideal', hints:['ใช้สูตร T = PV/nR','ผลลัพธ์เป็น K ต้องแปลงเป็น °C','T(°C) = T(K) - 273'] },
    { id:'1-5', text:'CO₂ มวล 22.0 g บรรจุใน 12.0 L ที่ 27°C จงหาความดัน (M(CO₂)=44)', given:{m:'22.0',Mol:'44',V:'12.0',T:'27',uT:'C'}, find:'P', solver:'ideal', hints:['หา mol ก่อน: n = m/M = 22.0/44','แปลง T = 300 K','แทนค่าใน P = nRT/V'] },
    { id:'1-6', text:'C₃H₈ 3.00 mol ที่ 5.00 atm อุณหภูมิ 17°C จงหา V', given:{n:'3.00',P:'5.00',T:'17',uT:'C'}, find:'V', solver:'ideal', hints:['ใช้ V = nRT/P','แปลง T = 290 K','ชนิดแก๊สไม่มีผล ใช้ n ได้เลย'] },
    { id:'1-7', text:'He ที่ 1.20 atm, 3.00 L, 20°C จงหามวล (M(He)=4)', given:{P:'1.20',V:'3.00',T:'20',uT:'C',Mol:'4'}, find:'m', solver:'ideal', hints:['หา n จาก n = PV/RT','แปลง T = 293 K','m = n × M'] },
    { id:'1-8', text:'แก๊ส 0.250 mol บรรจุใน 6.14 L ที่ 1.00 atm จงหา T (K และ °C)', given:{n:'0.250',V:'6.14',P:'1.00'}, find:'T', solver:'ideal', hints:['ใช้ T = PV/nR','ผลลัพธ์เป็น K','T(°C) = T(K) - 273'] },
  ],
  part2: [
    { id:'2-1', text:'O₂=0.21 atm, N₂=0.78 atm, Ar=0.01 atm จงหา P total', gases:[{name:'O2',value:0.21,color:'#4fc3f7'},{name:'N2',value:0.78,color:'#ab47bc'},{name:'Ar',value:0.01,color:'#66bb6a'}], mode:'pressure', solver:'dalton', hints:['ใช้ P_total = P1 + P2 + P3','บวกความดันย่อยทั้งหมด','ผลลัพธ์ควรเท่ากับ 1.00 atm'] },
    { id:'2-2', text:'O₂ 0.30 mol, N₂ 0.60 mol, CO₂ 0.10 mol, P_total=2.00 atm หาความดันย่อย', moles:[{name:'O2',mol:0.30,color:'#4fc3f7'},{name:'N2',mol:0.60,color:'#ab47bc'},{name:'CO2',mol:0.10,color:'#90a4ae'}], Ptotal:2.00, mode:'mole', solver:'dalton', hints:['หา X_i = n_i/n_total','P_i = X_i × P_total','ตรวจสอบ: ΣP_i = P_total'] },
    { id:'2-3', text:'อากาศ O₂ 21%, N₂ 79%, P_total=1.50 atm หา P(O₂) และ P(N₂)', moles:[{name:'O2',mol:21,color:'#4fc3f7'},{name:'N2',mol:79,color:'#ab47bc'}], Ptotal:1.50, mode:'mole', solver:'dalton', hints:['เปอร์เซ็นต์ ≈ เศษส่วนโมล','X(O2)=0.21, X(N2)=0.79','P_i = X_i × 1.50'] },
    { id:'2-4', text:'นักดำน้ำมีส่วนผสม: O₂=0.40, He=1.20, N₂=0.80 atm หา P_total', gases:[{name:'O2',value:0.40,color:'#4fc3f7'},{name:'He',value:1.20,color:'#ffd54f'},{name:'N2',value:0.80,color:'#ab47bc'}], mode:'pressure', solver:'dalton', hints:['บวกความดันย่อยทุกชนิด','ตรวจสอบหน่วยเป็น atm','คำนวณ %He ด้วย'] },
    { id:'2-5', text:'H₂ 2.00 mol, O₂ 1.00 mol, N₂ 3.00 mol, T=27°C, V=10.0 L หาความดันย่อย', gases:[{name:'H2',value:0,color:'#f48fb1'},{name:'O2',value:0,color:'#4fc3f7'},{name:'N2',value:0,color:'#ab47bc'}], mode:'pressure', solver:'dalton', hints:['ใช้ P_i = n_i RT/V แยกแต่ละชนิด','T = 300 K, R = 0.0821','ทางลัด: P_total = n_total RT/V'] },
    { id:'2-6', text:'แก๊ส A=380 mmHg, B=190 mmHg หา P_total เป็น atm', gases:[{name:'O2',value:0.50,color:'#4fc3f7'},{name:'N2',value:0.25,color:'#ab47bc'}], mode:'pressure', solver:'dalton', hints:['บวก mmHg ก่อน: 380+190=570','แปลง: 570/760=? atm','ทำหน่วยให้เหมือนกันก่อนบวก'] },
  ],
  part3: [
    { id:'3-1', text:'น้ำหอม A (M=100) และ B (M=25) ตัวใดแพร่เร็วกว่า', M1:100, M2:25, name1:'น้ำหอมA', name2:'น้ำหอมB', solver:'graham', hints:['r1/r2 = √(M2/M1)','M น้อยกว่า → แพร่เร็วกว่า','√(25/100) = ?'] },
    { id:'3-2', text:'กลิ่นอาหาร M=64 และกลิ่นน้ำหอม M=16 ตัวใดถึงก่อน', M1:64, M2:16, name1:'กลิ่นอาหาร', name2:'กลิ่นน้ำหอม', solver:'graham', hints:['ตัวใด M น้อยกว่าแพร่เร็วกว่า','r(น้ำหอม)/r(อาหาร) = √(64/16)','= √4 = 2'] },
    { id:'3-3', text:'He M=4 และ N₂ M=28 รั่วจากรูเดียวกัน เปรียบเทียบอัตรา', M1:4, M2:28, name1:'He', name2:'N₂', solver:'graham', hints:['r(He)/r(N2) = √(M(N2)/M(He))','= √(28/4) = √7 ≈ ?','He แพร่เร็วกว่า √7 เท่า'] },
    { id:'3-4', text:'แก๊ส X แพร่เร็วกว่า O₂ (M=32) เป็น 2 เท่า หา M(X)', M1:null, M2:32, name1:'GasX', name2:'O₂', solver:'graham', hints:['r(X)/r(O2) = 2 = √(M(O2)/M(X))','2² = 32/M(X)','M(X) = 32/4 = 8'] },
    { id:'3-5', text:'จัดอันดับ H₂ M=2, CH₄ M=16, CO₂ M=44, Cl₂ M=71 (เร็ว→ช้า)', M1:2, M2:71, name1:'H₂', name2:'Cl₂', solver:'graham', hints:['M น้อย → แพร่เร็ว','เรียง M จากน้อยไปมาก','H₂ < CH₄ < CO₂ < Cl₂ → H₂ เร็วสุด'] },
    { id:'3-6', text:'NH₃ (M=17) และ HCl (M=36.5) ปลายท่อสองข้าง ยาว 1.00 m', M1:17, M2:36.5, name1:'NH₃', name2:'HCl', solver:'graham', hints:['r(NH3)/r(HCl) = √(36.5/17) ≈ 1.46','NH3 เดิน x เมตร, HCl เดิน (1-x)','x/(1-x) = 1.46 → x ≈ 0.59 m'] },
    { id:'3-7', text:'แก๊ส A (M=36) ช้ากว่า B โดย r(B)/r(A)=3 หา M(B)', M1:null, M2:36, name1:'GasB', name2:'GasA', solver:'graham', hints:['r(B)/r(A) = 3 = √(M(A)/M(B))','3² = 36/M(B)','M(B) = 36/9 = 4'] },
    { id:'3-8', text:'SO₂ (M=64) และ H₂S (M=34) แก๊สใดถึงก่อน', M1:64, M2:34, name1:'SO₂', name2:'H₂S', solver:'graham', hints:['คำนวณ r(H2S)/r(SO2) = √(64/34)','M น้อยกว่า → เร็วกว่า','H₂S มี M น้อยกว่า → ถึงก่อน'] },
    { id:'3-9', text:'X แพร่ 200 mL ใน 5 min, Y แพร่ 100 mL ใน 5 min, M(Y)=128 หา M(X)', M1:null, M2:128, name1:'GasX', name2:'GasY', solver:'graham', hints:['r(X)/r(Y) = 200/100 = 2','2 = √(128/M(X))','M(X) = 128/4 = 32'] },
  ]
};

function renderWorksheet() {
  const render = (partKey, containerId) => {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    WORKSHEET[partKey].forEach(p => {
      const btn = document.createElement('button');
      btn.className = 'ws-prob-btn';
      btn.textContent = `ข้อ ${p.id.split('-')[1]}: ${p.text.substring(0,50)}...`;
      btn.onclick = () => loadWorksheetProblem(p, btn);
      el.appendChild(btn);
    });
  };
  render('part1','ws-part1');
  render('part2','ws-part2');
  render('part3','ws-part3');
}

function loadWorksheetProblem(prob, btn) {
  state.worksheet.current = prob;
  document.querySelectorAll('.ws-prob-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');

  const display = document.getElementById('ws-problem-display');
  display.innerHTML = `
    <div class="ws-problem-detail">
      <div class="ws-problem-title">📌 ${prob.text}</div>
      <div class="ws-find">🎯 จงหา: ${prob.find || 'ดูในโจทย์'}</div>
      <div class="ws-given">
        <div class="ws-given-title">ค่าที่กำหนด:</div>
        <div class="ws-given-list">${formatGiven(prob)}</div>
      </div>
      <button class="ws-open-solver" onclick="openSolverFromWorksheet()">🚀 เปิด Solver พร้อมค่าเริ่มต้น</button>
    </div>`;

  const hintCard = document.getElementById('hint-card');
  hintCard.style.display = 'block';
  document.getElementById('hint-display').classList.remove('show');
  document.getElementById('hint-display').innerHTML = '';
}

function formatGiven(prob) {
  if (prob.given) return Object.entries(prob.given).map(([k,v])=>`<span>${k} = ${v}</span>`).join('<br>');
  if (prob.gases) return prob.gases.map(g=>`P(${g.name}) = ${g.value} atm`).join('<br>');
  if (prob.moles) return prob.moles.map(g=>`n(${g.name}) = ${g.mol} mol`).join('<br>');
  if (prob.M1 || prob.M2) return `M₁ = ${prob.M1||'?'} g/mol | M₂ = ${prob.M2||'?'} g/mol`;
  return '—';
}

function openSolverFromWorksheet() {
  const prob = state.worksheet.current;
  if (!prob) return;

  if (prob.solver === 'ideal') {
    showPage('ideal');
    resetIdeal();
    const g = prob.given;
    if (g.P) { document.getElementById('i-P').value = g.P; if(g.uP) document.getElementById('u-P').value=g.uP; }
    if (g.V) document.getElementById('i-V').value = g.V;
    if (g.n) document.getElementById('i-n').value = g.n;
    if (g.T) { document.getElementById('i-T').value = g.T; if(g.uT) document.getElementById('u-T').value=g.uT; }
    if (g.m) document.getElementById('i-m').value = g.m;
    if (g.Mol) document.getElementById('i-Mol').value = g.Mol;
    selectSolveFor(prob.find, 'ideal');
  } else if (prob.solver === 'dalton') {
    showPage('dalton');
    if (prob.mode === 'pressure') {
      switchDaltonMode('pressure');
      if (prob.gases) { state.dalton.gases = JSON.parse(JSON.stringify(prob.gases)); renderDaltonGasList(); }
    } else {
      switchDaltonMode('mole');
      if (prob.moles) { state.dalton.moles = JSON.parse(JSON.stringify(prob.moles)); renderDaltonMolList(); }
      if (prob.Ptotal) document.getElementById('i-Ptotal').value = prob.Ptotal;
    }
  } else if (prob.solver === 'graham') {
    showPage('graham');
    if (prob.M1) document.getElementById('gas1-M').value = prob.M1;
    if (prob.M2) document.getElementById('gas2-M').value = prob.M2;
    updateGraham();
  }
}

function showHint(level) {
  const prob = state.worksheet.current;
  if (!prob || !prob.hints) return;
  const hint = prob.hints[level-1] || '—';
  const hintDisplay = document.getElementById('hint-display');
  hintDisplay.innerHTML = `<strong>💡 Hint ${level}:</strong> ${hint}`;
  hintDisplay.classList.add('show');
}

// ════════════════════════════════════════════
// ── SUMMARY CARD ───────────────────────────
// ════════════════════════════════════════════

let lastAnswer = '', lastFormula = '', lastProblem = '';

function updateSummaryLastAnswer(ans, formula) {
  lastAnswer = ans;
  lastFormula = formula;
}

function openSummary() {
  document.getElementById('summaryModal').style.display = 'flex';
  document.getElementById('sc-date').textContent = new Date().toLocaleDateString('th-TH');
  document.getElementById('sc-prob').textContent = state.worksheet.current ? state.worksheet.current.text.substring(0,60)+'...' : lastProblem || '—';
  document.getElementById('sc-formula').textContent = lastFormula || '—';
  document.getElementById('sc-ans').textContent = lastAnswer || '—';
}

function closeSummary() {
  document.getElementById('summaryModal').style.display = 'none';
}

function generateCard() {
  document.getElementById('sc-name').textContent = document.getElementById('sc-in-name').value || '—';
  document.getElementById('sc-class').textContent = document.getElementById('sc-in-class').value || '—';
  document.getElementById('sc-num').textContent = document.getElementById('sc-in-num').value || '—';
}

function captureCard() {
  const el = document.getElementById('summary-card');
  alert('💡 วิธีบันทึกภาพ:\n1. กด Ctrl+Shift+S (Windows) หรือ Cmd+Shift+4 (Mac)\n2. หรือใช้ฟังก์ชัน Screenshot ของเบราว์เซอร์\n3. หรือ Print → Save as PDF');
}

// ── COPY SOLUTION ──────────────────────────────────────────────
function copySolution(page) {
  const text = state.solutionText[page] || 'ยังไม่มีวิธีทำ';
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(()=>showToast('คัดลอกวิธีทำแล้ว!'));
  } else {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('คัดลอกแล้ว!');
  }
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;bottom:80px;right:24px;background:#1A3A6B;color:white;padding:10px 18px;border-radius:10px;font-family:Prompt,sans-serif;font-size:0.9rem;z-index:300;opacity:0;transition:opacity 0.3s;box-shadow:0 4px 16px rgba(0,0,0,0.2)';
  document.body.appendChild(t);
  setTimeout(()=>t.style.opacity=1,10);
  setTimeout(()=>{t.style.opacity=0;setTimeout(()=>document.body.removeChild(t),300)},2000);
}

function showError(msg) {
  showToast('⚠️ ' + msg);
}

// ── CLICK OUTSIDE MODAL ────────────────────────────────────────
document.addEventListener('click', e => {
  if (e.target.id === 'summaryModal') closeSummary();
});
