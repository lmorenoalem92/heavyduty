'use strict';
/* Heavy Duty — app personal de registro de entrenamiento.
   Todo se guarda en este teléfono (localStorage). Respalda desde Ajustes. */

const KEY = 'hd.v1';
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TECHS = ['Normal', 'Forzadas', 'Rest-pause', 'Negativas'];
const PRESETS = ['1er bimestre', '2do bimestre', '3er bimestre', '4to bimestre', '5to bimestre', '6to bimestre'];

const ICON = {
  back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  checkSm: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  up: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>',
  down: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
  trash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
  chev: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  list: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h10"/></svg>',
  chart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19l5-6 4 3 7-9"/></svg>',
  gear: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>'
};

/* ---------- utilidades ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = (v, d) => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) ? n : d; };
const fmt = n => String(Math.round(n * 100) / 100);
const r1 = n => Math.round(n * 10) / 10;
const roundTo = (n, s) => Math.max(0, Math.round(n / s) * s);
const isoOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayISO = () => isoOf(new Date());
const parseISO = iso => { const [y, m, d] = iso.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
const fdate = iso => { const d = parseISO(iso); return d.getDate() + ' ' + MESES[d.getMonth()]; };
const fdateY = iso => fdate(iso) + ' ' + parseISO(iso).getFullYear();
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return isoOf(d); };
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const $ = s => document.querySelector(s);

/* ---------- datos ---------- */
function seed() {
  const names = ['Hombro y bícep', 'Pecho y trícep', 'Pecho y hombro', 'Espalda y trícep', 'Pierna completa'];
  const hb = ['Press militar agarre amplio en máquina', 'Elevación lateral en polea baja', 'Jalón a la cara en polea con soga',
    'Curl de bíceps araña con mancuernas', 'Curl de bíceps con soga en polea baja', 'Curl drag con mancuernas'];
  const routines = names.map((n, i) => ({ id: uid() + i, name: n, exercises: i === 0 ? hb.map((x, k) => ({ id: uid() + 'e' + k, name: x, warmups: 1 })) : [] }));
  return {
    v: 1,
    programs: [{ id: uid(), name: '1er bimestre', weeks: 8, cycles: 8, days: 3, start: todayISO(), routineIds: routines.map(r => r.id), active: true }],
    routines, sessions: [], current: null,
    settings: { step: 2.5, restWarm: 60, restEff: 120 }
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); if (d && d.v === 1) { d.settings = Object.assign({ step: 2.5, restWarm: 60, restEff: 120 }, d.settings); return d; } }
  } catch (e) { /* sin acceso a almacenamiento */ }
  return seed();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('No se pudo guardar en este teléfono'); }
}

let db = load();
const ui = { view: db.current ? 'train' : 'home', planId: null, form: null, exId: null, summary: null, rest: null, restTimer: null, keep: false };

const routine = id => db.routines.find(r => r.id === id);
const activeProgram = () => db.programs.find(p => p.active) || null;
const progRoutines = p => p ? p.routineIds.map(routine).filter(Boolean) : [];
const beats = (a, b) => a.w > b.w || (a.w === b.w && a.r > b.r);

function stats(p) {
  const ss = db.sessions.filter(s => s.programId === p.id);
  const rs = progRoutines(p);
  const counts = rs.map(r => ss.filter(s => s.routineId === r.id).length);
  const cyclesDone = rs.length ? Math.min.apply(null, counts) : 0;
  const elapsed = Math.max(0, daysBetween(p.start, todayISO()));
  const byTime = elapsed >= p.weeks * 7;
  const byCycles = cyclesDone >= p.cycles;
  return {
    counts, cyclesDone, byTime, byCycles, done: byTime || byCycles,
    week: Math.min(p.weeks, Math.floor(elapsed / 7) + 1),
    timePct: Math.min(100, elapsed / (p.weeks * 7) * 100),
    cyclePct: Math.min(100, cyclesDone / p.cycles * 100)
  };
}
// La siguiente rutina es la primera del ciclo actual que todavía no haces.
function nextRoutine(p) {
  const rs = progRoutines(p);
  if (!rs.length) return null;
  const st = stats(p);
  const i = st.counts.findIndex(c => c <= st.cyclesDone);
  return rs[i >= 0 ? i : 0];
}
function lastEntry(exId) {
  for (let i = db.sessions.length - 1; i >= 0; i--) {
    const s = db.sessions[i];
    const e = s.entries.find(x => x.exerciseId === exId);
    if (e) return Object.assign({ date: s.date }, e);
  }
  return null;
}
function history(exId) {
  const out = [];
  db.sessions.forEach(s => s.entries.forEach(e => { if (e.exerciseId === exId) out.push({ date: s.date, w: e.eff.w, r: e.eff.r, tech: e.eff.tech }); }));
  return out;
}
function findExName(id) {
  for (const r of db.routines) { const x = r.exercises.find(e => e.id === id); if (x) return x.name; }
  const l = lastEntry(id); return l ? l.name : 'Ejercicio';
}
function lastDateOf(rid) {
  for (let i = db.sessions.length - 1; i >= 0; i--) if (db.sessions[i].routineId === rid) return ' · última vez ' + fdate(db.sessions[i].date);
  return '';
}
const cur = () => db.current.entries[db.current.idx];

/* ---------- entrenamiento ---------- */
function startTraining(rid) {
  const r = routine(rid);
  if (!r || !r.exercises.length) { toast('Primero agrega ejercicios a esta rutina'); ui.planId = rid; go('plan'); return; }
  const p = activeProgram();
  const step = db.settings.step;
  db.current = {
    routineId: r.id, routineName: r.name, programId: p ? p.id : null, idx: 0, startedAt: Date.now(),
    entries: r.exercises.map(ex => {
      const last = lastEntry(ex.id);
      const ew = last ? last.eff.w : 0;
      const er = last ? last.eff.r : 8;
      const warm = [];
      for (let k = 0; k < (ex.warmups || 1); k++) {
        const lw = last && last.warm && last.warm[k];
        warm.push(lw ? { w: lw.w, r: lw.r, done: false } : { w: roundTo(ew * (k === 0 ? 0.5 : 0.75), step), r: k === 0 ? 12 : 6, done: false });
      }
      return { exerciseId: ex.id, name: ex.name, warm, eff: { w: ew, r: er, done: false, tech: 'Normal' } };
    })
  };
  save(); go('train');
}
function finishTraining() {
  const c = db.current;
  const done = c.entries.filter(e => e.eff.done);
  if (!done.length) {
    if (!confirm('No registraste ninguna serie efectiva. ¿Terminar sin guardar?')) return;
  } else {
    const prs = [], firsts = [];
    done.forEach(e => { const l = lastEntry(e.exerciseId); if (!l) firsts.push(e.name); else if (beats(e.eff, l.eff)) prs.push(e.name); });
    db.sessions.push({
      id: uid(), date: todayISO(), at: Date.now(), programId: c.programId, routineId: c.routineId, routineName: c.routineName,
      entries: done.map(e => ({ exerciseId: e.exerciseId, name: e.name, warm: e.warm.map(w => ({ w: w.w, r: w.r })), eff: { w: e.eff.w, r: e.eff.r, tech: e.eff.tech } }))
    });
    ui.summary = { routineName: c.routineName, total: done.length, of: c.entries.length, prs, firsts };
  }
  db.current = null; stopRest(); save();
  go(done.length ? 'summary' : 'home');
}
function compare(eff, last) {
  if (!last) return { cls: '', text: 'Primera vez: esta serie será tu referencia' };
  const l = last.eff;
  if (beats(eff, l)) {
    const d = eff.w > l.w ? '+' + fmt(eff.w - l.w) + ' kg' : '+' + (eff.r - l.r) + (eff.r - l.r === 1 ? ' rep' : ' reps');
    return { cls: 'up', text: d + ' vs. la vez pasada · progresaste' };
  }
  if (eff.w === l.w && eff.r === l.r) return { cls: '', text: 'Igual que la vez pasada · busca 1 rep más' };
  return { cls: 'down', text: 'Por debajo de la vez pasada' };
}

/* ---------- descanso ---------- */
function restText() {
  const left = ui.rest ? Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000)) : 0;
  return Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0');
}
function startRest(sec) { ui.rest = { end: Date.now() + sec * 1000 }; clearInterval(ui.restTimer); ui.restTimer = setInterval(tickRest, 500); }
function stopRest() { clearInterval(ui.restTimer); ui.rest = null; }
function tickRest() {
  if (!ui.rest) return;
  if (Date.now() >= ui.rest.end) {
    stopRest();
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) { /* sin vibración */ }
    toast('¡Descanso terminado!');
    rerender(); return;
  }
  const el = document.getElementById('restT'); if (el) el.textContent = restText();
}

/* ---------- pantalla encendida durante el entrenamiento ---------- */
let wl = null;
async function wake(on) {
  try {
    if (on && !wl && 'wakeLock' in navigator) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); }
    else if (!on && wl) { await wl.release(); wl = null; }
  } catch (e) { /* no disponible */ }
}

/* ---------- render ---------- */
function go(v) { ui.view = v; ui.keep = false; render(); }
function rerender() { ui.keep = true; render(); }
function render() {
  const m0 = $('.main'); const top = ui.keep && m0 ? m0.scrollTop : 0;
  const V = { home: vHome, train: vTrain, plan: vPlan, program: vProgram, progress: vProgress, settings: vSettings, summary: vSummary };
  $('#app').innerHTML = (V[ui.view] || vHome)();
  const m = $('.main'); if (m) m.scrollTop = top;
  ui.keep = false;
  wake(ui.view === 'train');
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}
function screen(o) {
  const backBtn = o.back ? `<button class="icon-btn" data-a="${o.backA || 'go'}" data-v="${o.back}" aria-label="Volver">${ICON.back}</button>` : '';
  return `<header class="hdr">${backBtn}<div class="hdr-t">${o.sub ? `<span class="eyebrow">${esc(o.sub)}</span>` : ''}<h1>${esc(o.title)}</h1></div></header>
<main class="main">${o.body}</main>
${ui.view === 'train' && ui.rest ? `<div class="rest"><div class="col"><span class="eyebrow">Descanso</span><span class="num" id="restT">${restText()}</span></div><button class="btn" data-a="skipRest">Saltar</button></div>` : ''}
${o.foot ? `<footer class="foot">${o.foot}</footer>` : ''}
${o.nav ? navBar(o.nav) : ''}`;
}
function navBar(c) {
  const it = [['home', 'Rutinas', ICON.list], ['progress', 'Progreso', ICON.chart], ['settings', 'Ajustes', ICON.gear]];
  return `<nav class="nav">${it.map(([v, l, ic]) => `<button class="${c === v ? 'on' : ''}" data-a="go" data-v="${v}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
}
const bar = (label, val, pct) => `<div class="col" style="gap:6px"><div class="row-sb sm"><span class="muted">${label}</span><span style="font-weight:600">${val}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;

function vHome() {
  const p = activeProgram();
  let b = '';
  if (db.current) b += `<button class="card resume" data-a="go" data-v="train"><span class="eyebrow hl">Entrenamiento en curso</span><span class="big">${esc(db.current.routineName)}</span><span class="muted">Toca para continuar</span></button>`;
  if (p) {
    const st = stats(p);
    b += `<button class="card" data-a="editProgram">
      <div class="row-sb"><span class="eyebrow">Programa activo</span><span class="link">Configurar</span></div>
      <span class="big">${esc(p.name)}</span>
      <div class="grid2">${bar('Tiempo', `Sem ${st.week} de ${p.weeks}`, st.timePct)}${bar('Ciclos', `${st.cyclesDone} de ${p.cycles}`, st.cyclePct)}</div>
      <span class="muted sm">Termina con lo que se cumpla primero</span></button>`;
    if (st.done) {
      b += `<div class="card win"><span class="big">¡${esc(p.name)} terminado!</span><span class="muted">Se cumplió ${st.byCycles ? `el número de ciclos (${p.cycles})` : `el tiempo (${p.weeks} semanas)`}.</span><button class="btn acc" data-a="newProgram">Crear siguiente programa</button></div>`;
    } else if (!db.current) {
      const nx = nextRoutine(p);
      if (nx) b += `<div class="card today"><span class="eyebrow hl">Toca hoy</span><span class="big">${esc(nx.name)}</span><span class="muted sm">${nx.exercises.length} ejercicios${lastDateOf(nx.id)}</span><button class="btn acc lg" data-a="train" data-id="${nx.id}">${ICON.play} Empezar a entrenar</button></div>`;
    }
  } else {
    b += `<div class="card"><span class="big">Sin programa activo</span><span class="muted sm">Crea uno para llevar la cuenta de semanas y ciclos.</span><button class="btn acc" data-a="newProgram">Crear programa</button></div>`;
  }
  b += `<span class="eyebrow mt">Rutinas</span>`;
  b += db.routines.map(r => `<div class="card rrow"><div class="col"><span class="rname">${esc(r.name)}</span><span class="muted sm">${r.exercises.length} ejercicios${p && !p.routineIds.includes(r.id) ? ' · fuera del programa' : ''}</span></div>
    <div class="row"><button class="btn ghost" data-a="plan" data-id="${r.id}">Planear</button><button class="icon-btn hl" data-a="train" data-id="${r.id}" aria-label="Entrenar ${esc(r.name)}">${ICON.play}</button></div></div>`).join('');
  b += `<button class="btn dashed" data-a="newRoutine">+ Nueva rutina</button>`;
  return screen({ title: 'Mis rutinas', sub: 'Heavy Duty', body: b, nav: 'home' });
}

function stepper(set, f, val, unit, big) {
  return `<div class="stepper ${big ? 'big' : ''}"><button data-a="step" data-s="${set}" data-f="${f}" data-d="-1" aria-label="Menos ${unit}">−</button>
  <label class="val"><input type="number" inputmode="decimal" step="any" min="0" value="${fmt(val)}" data-s="${set}" data-f="${f}" aria-label="${unit}"><span class="u">${unit}</span></label>
  <button data-a="step" data-s="${set}" data-f="${f}" data-d="1" aria-label="Más ${unit}">+</button></div>`;
}
function vTrain() {
  const c = db.current;
  if (!c) { ui.view = 'home'; return vHome(); }
  const e = cur(), n = c.entries.length, last = lastEntry(e.exerciseId), cmp = compare(e.eff, last);
  let b = `<div class="segs" style="grid-template-columns:repeat(${n},1fr)">${c.entries.map((x, i) => `<i class="${i === c.idx ? 'cur' : x.eff.done ? 'ok' : ''}"></i>`).join('')}</div>
  <h2 class="exname">${esc(e.name)}</h2>
  <div class="card row-sb" style="flex-direction:row"><div class="col"><span class="eyebrow">La vez pasada${last ? ' · ' + fdate(last.date) : ''}</span><span class="num md">${last ? `${fmt(last.eff.w)} kg × ${last.eff.r} reps` : 'Sin registro'}</span></div><span class="muted sm">${last && last.eff.tech && last.eff.tech !== 'Normal' ? esc(last.eff.tech) : 'serie al fallo'}</span></div>
  <span class="eyebrow mt">Calentamiento</span>`;
  b += e.warm.map((w, k) => `<div class="card set ${w.done ? 'is-done' : ''}"><div class="row-sb"><span class="lbl">Calentamiento ${k + 1}</span><button class="check ${w.done ? 'on' : ''}" data-a="toggleWarm" data-k="${k}" aria-label="Marcar calentamiento ${k + 1}">${ICON.check}</button></div><div class="grid2">${stepper(k, 'w', w.w, 'kg')}${stepper(k, 'r', w.r, 'reps')}</div></div>`).join('');
  b += e.warm.length < 2 ? `<button class="btn dashed" data-a="addWarm">+ Agregar 2.º calentamiento</button>` : `<button class="btn text" data-a="delWarm">Quitar 2.º calentamiento</button>`;
  b += `<div class="card eff ${e.eff.done ? 'is-done' : ''}"><span class="eff-t">Serie efectiva · al fallo</span>
    ${stepper('e', 'w', e.eff.w, 'kg', true)}${stepper('e', 'r', e.eff.r, 'reps al fallo', true)}
    <div class="cmp ${cmp.cls}">${cmp.text}</div>
    <span class="eyebrow">Técnica de intensidad</span>
    <div class="chips">${TECHS.map(t => `<button class="chip ${e.eff.tech === t ? 'on' : ''}" data-a="tech" data-t="${t}">${t}</button>`).join('')}</div>
    <button class="btn ${e.eff.done ? '' : 'acc'} lg" data-a="toggleEff">${e.eff.done ? 'Serie registrada · tocar para editar' : 'Registrar serie al fallo'}</button></div>
  <button class="btn text danger" data-a="discard">Descartar entrenamiento</button>`;
  const lastEx = c.idx === n - 1;
  const foot = `<button class="btn" data-a="prevEx" ${c.idx === 0 ? 'disabled' : ''}>Anterior</button><button class="btn acc" data-a="${lastEx ? 'finish' : 'nextEx'}">${lastEx ? 'Terminar rutina' : 'Siguiente ejercicio'}</button>`;
  return screen({ title: c.routineName, sub: `Ejercicio ${c.idx + 1} de ${n}`, back: 'home', body: b, foot });
}

function vSummary() {
  const s = ui.summary || { total: 0, of: 0, prs: [], firsts: [] };
  let b = `<div class="card win"><span class="big">¡Rutina terminada!</span><span class="muted">${s.total} de ${s.of} series efectivas registradas</span></div>`;
  if (s.prs.length) b += `<span class="eyebrow mt">Le ganaste a la vez pasada</span>` + s.prs.map(n => `<div class="card rrow"><span>${esc(n)}</span><span class="tag">Progreso</span></div>`).join('');
  if (s.firsts.length) b += `<span class="eyebrow mt">Primera vez registrado</span>` + s.firsts.map(n => `<div class="card">${esc(n)}</div>`).join('');
  if (!s.prs.length && s.total > s.firsts.length) b += `<div class="card muted">Hoy no superaste tus marcas. En Heavy Duty la recuperación cuenta: descansa bien y vuelve por una rep más.</div>`;
  return screen({ title: s.routineName || 'Resumen', sub: 'Resumen', body: b, foot: `<button class="btn acc lg full" data-a="go" data-v="home">Listo</button>` });
}

function vPlan() {
  const r = routine(ui.planId);
  if (!r) { ui.view = 'home'; return vHome(); }
  let b = `<div class="card"><label class="eyebrow" for="rname">Nombre de la rutina</label><input id="rname" class="inp" value="${esc(r.name)}" data-f="rname"></div>
  <span class="eyebrow mt">Ejercicios, en orden</span>`;
  b += r.exercises.length ? r.exercises.map((x, i) => `<div class="card">
    <div class="row"><span class="badge">${i + 1}</span><input class="inp" value="${esc(x.name)}" data-f="exname" data-i="${i}" aria-label="Nombre del ejercicio ${i + 1}"></div>
    <div class="row-sb"><div class="seg"><span class="muted sm">Calent.</span>
      <button class="chip ${x.warmups === 1 ? 'on' : ''}" data-a="warmups" data-i="${i}" data-n="1">1</button>
      <button class="chip ${x.warmups === 2 ? 'on' : ''}" data-a="warmups" data-i="${i}" data-n="2">2</button></div>
      <div class="row"><button class="icon-btn" data-a="exMove" data-i="${i}" data-d="-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
      <button class="icon-btn" data-a="exMove" data-i="${i}" data-d="1" aria-label="Bajar" ${i === r.exercises.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
      <button class="icon-btn" data-a="exDel" data-i="${i}" aria-label="Eliminar ejercicio">${ICON.trash}</button></div></div></div>`).join('')
    : `<div class="card muted">Todavía no hay ejercicios. Agrega el primero abajo.</div>`;
  b += `<div class="card"><label class="eyebrow" for="newex">Agregar ejercicio</label><div class="row"><input id="newex" class="inp" placeholder="Ej. Press de banca plano" enterkeyhint="done"><button class="btn acc" data-a="exAdd">Agregar</button></div></div>
  <button class="btn text danger" data-a="delRoutine">Eliminar rutina</button>`;
  return screen({ title: 'Planear', sub: r.name, back: 'home', body: b, foot: `<button class="btn acc lg full" data-a="train" data-id="${r.id}">${ICON.play} Entrenar esta rutina</button>` });
}

function openProgram(isNew) {
  const p = activeProgram();
  if (!isNew && p) ui.form = Object.assign({}, p, { routineIds: p.routineIds.slice(), isNew: false });
  else {
    const i = p ? PRESETS.indexOf(p.name) : -1;
    const name = !p ? PRESETS[0] : i >= 0 && i < PRESETS.length - 1 ? PRESETS[i + 1] : p.name + ' (2)';
    ui.form = { id: uid(), name, weeks: p ? p.weeks : 8, cycles: p ? p.cycles : 8, days: p ? p.days : 3, start: todayISO(), routineIds: p ? p.routineIds.slice() : db.routines.map(r => r.id), isNew: true };
  }
  go('program');
}
function pstep(k, v, unit) {
  return `<div class="stepper"><button data-a="pStep" data-k="${k}" data-d="-1" aria-label="Menos">−</button><div class="val"><span class="v">${v}</span><span class="u">${esc(unit)}</span></div><button data-a="pStep" data-k="${k}" data-d="1" aria-label="Más">+</button></div>`;
}
function vProgram() {
  const f = ui.form;
  if (!f) { ui.view = 'home'; return vHome(); }
  const per = Math.max(1, f.routineIds.length);
  const wfc = f.cycles * per / f.days, cit = f.weeks * f.days / per;
  const verdict = wfc <= f.weeks ? `Termina primero por ciclos: ${f.cycles} ciclos en ~${Math.ceil(wfc)} semanas` : `Termina primero por tiempo: ${f.weeks} semanas, ~${r1(cit)} ciclos`;
  let b = `<div class="card"><label class="eyebrow" for="pname">Nombre del programa</label><input id="pname" class="inp" value="${esc(f.name)}" data-f="pname">
    <div class="chips">${PRESETS.map(n => `<button class="chip ${f.name === n ? 'on' : ''}" data-a="pPreset" data-n="${n}">${n}</button>`).join('')}</div>
    <label class="eyebrow" for="pstart">Fecha de inicio</label><input id="pstart" type="date" class="inp" value="${f.start}" data-f="pstart"></div>
  <div class="card"><span class="eyebrow">Duración · termina con lo que se cumpla primero</span>
    <span class="lbl">Tiempo máximo</span>${pstep('weeks', f.weeks, 'semanas · hasta ' + fdateY(addDays(f.start, f.weeks * 7)))}
    <span class="lbl">Veces la rutina completa</span>${pstep('cycles', f.cycles, `ciclos de ${per} rutinas`)}
    <span class="lbl">Días que entrenas por semana</span>
    <div class="days">${[2, 3, 4, 5, 6].map(n => `<button class="chip ${f.days === n ? 'on' : ''}" data-a="pDays" data-n="${n}">${n}</button>`).join('')}</div>
    <div class="est"><span class="sm">Con ${f.days} días por semana, ${f.cycles} ciclos te toman unas ${r1(wfc)} semanas.</span><strong>${verdict}</strong></div></div>
  <div class="card"><span class="eyebrow">Rutinas del ciclo</span>
    ${db.routines.map(r => { const on = f.routineIds.includes(r.id); return `<button class="check-row ${on ? 'on' : ''}" data-a="pRoutine" data-id="${r.id}" aria-pressed="${on}"><span class="box">${on ? ICON.checkSm : ''}</span><span>${esc(r.name)}</span><span class="muted sm" style="margin-left:auto">${r.exercises.length} ej.</span></button>`; }).join('')}
    <span class="muted sm">Un ciclo cuenta cuando completas todas las rutinas marcadas.</span></div>`;
  const past = db.programs.filter(p => !p.active);
  if (past.length) b += `<span class="eyebrow mt">Programas anteriores</span>` + past.slice().reverse().map(p => { const st = stats(p); return `<div class="card rrow"><div class="col"><span class="rname">${esc(p.name)}</span><span class="muted sm">Desde ${fdateY(p.start)} · ${st.cyclesDone} ciclos</span></div></div>`; }).join('');
  if (!f.isNew) b += `<button class="btn dashed" data-a="newProgram">+ Empezar un programa nuevo</button>`;
  return screen({ title: f.isNew ? 'Nuevo programa' : 'Programa', sub: 'Configuración', back: 'home', body: b, foot: `<button class="btn acc lg full" data-a="saveProgram">Guardar programa</button>` });
}
function saveProgram() {
  const f = ui.form;
  if (!f.name.trim()) return toast('Ponle nombre al programa');
  if (!f.routineIds.length) return toast('Elige al menos una rutina');
  const data = { id: f.id, name: f.name.trim(), weeks: f.weeks, cycles: f.cycles, days: f.days, start: f.start || todayISO(), routineIds: db.routines.map(r => r.id).filter(id => f.routineIds.includes(id)), active: true };
  if (f.isNew) { db.programs.forEach(p => { p.active = false; }); db.programs.push(data); }
  else { const i = db.programs.findIndex(p => p.id === f.id); db.programs[i] = data; }
  save(); toast('Programa guardado'); go('home');
}

function vProgress() {
  if (ui.exId) return vExercise();
  let b = '';
  if (!db.sessions.length) b += `<div class="card muted">Aquí verás tu progresión cuando registres tu primer entrenamiento.</div>`;
  b += db.routines.filter(r => r.exercises.length).map(r => `<span class="eyebrow mt">${esc(r.name)}</span>` + r.exercises.map(x => {
    const h = history(x.id), l = h[h.length - 1];
    return `<button class="card rrow" data-a="exHist" data-id="${x.id}"><div class="col"><span class="rname" style="font-size:16px">${esc(x.name)}</span><span class="muted sm">${h.length ? `${h.length} ${h.length === 1 ? 'sesión' : 'sesiones'} · último ${fmt(l.w)} kg × ${l.r}` : 'Sin registros'}</span></div>${ICON.chev}</button>`;
  }).join('')).join('');
  return screen({ title: 'Progreso', sub: 'Serie efectiva', body: b, nav: 'progress' });
}
function vExercise() {
  const h = history(ui.exId);
  let b = '';
  if (h.length >= 2) {
    const W = 320, H = 150, P = 24, ws = h.map(x => x.w), mn = Math.min.apply(null, ws), mx = Math.max.apply(null, ws), rg = mx - mn || 1;
    const pts = h.map((x, i) => [P + i * (W - 2 * P) / (h.length - 1), H - P - (x.w - mn) / rg * (H - 2 * P)].map(v => Math.round(v * 10) / 10));
    b += `<div class="card"><span class="eyebrow">Peso de la serie efectiva</span><svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progresión de peso, de ${fmt(h[0].w)} a ${fmt(h[h.length - 1].w)} kg">
      <line x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}" stroke="#2E2F34"/>
      <polyline fill="none" stroke="#FF6A1A" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => p.join(',')).join(' ')}"/>
      ${pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#FF6A1A"/>`).join('')}
      <text x="${W - P}" y="14" fill="#A3A3A8" font-size="12" text-anchor="end">máx ${fmt(mx)} kg</text></svg></div>`;
  }
  if (!h.length) b += `<div class="card muted">Sin registros todavía.</div>`;
  else b += `<div class="card" style="gap:0">${h.map((x, i) => ({ x, up: i > 0 && beats(x, h[i - 1]) })).reverse().map(({ x, up }) => `<div class="hist"><span class="muted">${fdateY(x.date)}</span><span class="row"><span class="num md">${fmt(x.w)} kg × ${x.r}</span>${up ? '<span class="tag">↑</span>' : ''}</span></div>`).join('')}</div>`;
  return screen({ title: findExName(ui.exId), sub: 'Historial', back: 'progress', backA: 'exBack', body: b, nav: 'progress' });
}

function vSettings() {
  const s = db.settings;
  const chips = (k, opts, unit) => `<div class="chips">${opts.map(n => `<button class="chip ${s[k] === n ? 'on' : ''}" data-a="setNum" data-k="${k}" data-n="${n}">${n}${unit}</button>`).join('')}</div>`;
  const b = `<div class="card"><span class="eyebrow">Incremento de peso con −/+</span>${chips('step', [1, 2.5, 5], ' kg')}</div>
  <div class="card"><span class="eyebrow">Descanso después de calentamiento</span>${chips('restWarm', [45, 60, 90], ' s')}
    <span class="eyebrow">Descanso después de la serie efectiva</span>${chips('restEff', [90, 120, 180], ' s')}</div>
  <div class="card"><span class="eyebrow">Tus datos</span><span class="muted sm">Se guardan solo en este teléfono. Haz respaldo de vez en cuando.</span>
    <button class="btn acc" data-a="exportCsv">Exportar a Excel (.csv)</button>
    <button class="btn" data-a="backup">Descargar respaldo</button>
    <button class="btn" data-a="importBtn">Restaurar respaldo</button></div>
  <button class="btn text danger" data-a="reset">Borrar todos los datos</button>`;
  return screen({ title: 'Ajustes', sub: 'Heavy Duty', body: b, nav: 'settings' });
}

/* ---------- exportar / respaldo ---------- */
function download(text, type, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function exportCsv() {
  if (!db.sessions.length) return toast('Todavía no hay entrenamientos registrados');
  const rows = [['Fecha', 'Programa', 'Rutina', 'Ejercicio', 'Serie', 'Peso (kg)', 'Reps', 'Técnica']];
  db.sessions.forEach(s => {
    const pn = (db.programs.find(p => p.id === s.programId) || {}).name || '';
    s.entries.forEach(e => {
      (e.warm || []).forEach((w, k) => rows.push([s.date, pn, s.routineName, e.name, 'Calentamiento ' + (k + 1), w.w, w.r, '']));
      rows.push([s.date, pn, s.routineName, e.name, 'Efectiva', e.eff.w, e.eff.r, e.eff.tech || '']);
    });
  });
  const csv = '﻿' + rows.map(r => r.map(c => { const v = String(c); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
  download(csv, 'text/csv;charset=utf-8', `entrenamientos-${todayISO()}.csv`);
}
function importFile(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!d || d.v !== 1 || !Array.isArray(d.routines) || !Array.isArray(d.sessions)) throw new Error('formato');
      if (!confirm('Esto reemplaza los datos de este teléfono con el respaldo. ¿Continuar?')) return;
      db = d; db.settings = Object.assign({ step: 2.5, restWarm: 60, restEff: 120 }, db.settings);
      save(); toast('Respaldo restaurado'); go('home');
    } catch (e) { toast('Ese archivo no es un respaldo válido'); }
  };
  rd.readAsText(file);
}

/* ---------- acciones ---------- */
const ACT = {
  go: d => { if (d.v === 'progress') ui.exId = null; go(d.v); },
  train: d => {
    if (db.current) {
      if (db.current.routineId === d.id) return go('train');
      if (!confirm('Tienes un entrenamiento en curso. ¿Descartarlo y empezar otro?')) return;
      db.current = null; stopRest();
    }
    startTraining(d.id);
  },
  plan: d => { ui.planId = d.id; go('plan'); },
  newRoutine: () => {
    const r = { id: uid(), name: 'Nueva rutina', exercises: [] };
    db.routines.push(r); const p = activeProgram(); if (p) p.routineIds.push(r.id);
    save(); ui.planId = r.id; go('plan');
  },
  editProgram: () => openProgram(false),
  newProgram: () => openProgram(true),

  step: d => {
    const e = cur(), t = d.s === 'e' ? e.eff : e.warm[+d.s], st = d.f === 'w' ? db.settings.step : 1;
    t[d.f] = Math.max(0, Math.round((t[d.f] + st * +d.d) * 100) / 100); save(); rerender();
  },
  toggleWarm: d => { const w = cur().warm[+d.k]; w.done = !w.done; if (w.done) startRest(db.settings.restWarm); save(); rerender(); },
  addWarm: () => { const e = cur(); e.warm.push({ w: roundTo(e.eff.w * 0.75, db.settings.step), r: 6, done: false }); save(); rerender(); },
  delWarm: () => { cur().warm.length = 1; save(); rerender(); },
  tech: d => { cur().eff.tech = d.t; save(); rerender(); },
  toggleEff: () => { const e = cur(); e.eff.done = !e.eff.done; if (e.eff.done) startRest(db.settings.restEff); save(); rerender(); },
  prevEx: () => { db.current.idx--; save(); go('train'); },
  nextEx: () => { db.current.idx++; save(); go('train'); },
  finish: finishTraining,
  discard: () => { if (confirm('¿Descartar este entrenamiento? No se guardará nada.')) { db.current = null; stopRest(); save(); go('home'); } },
  skipRest: () => { stopRest(); rerender(); },

  warmups: d => { routine(ui.planId).exercises[+d.i].warmups = +d.n; save(); rerender(); },
  exMove: d => {
    const xs = routine(ui.planId).exercises, i = +d.i, j = i + +d.d;
    if (j < 0 || j >= xs.length) return;
    const t = xs[i]; xs[i] = xs[j]; xs[j] = t; save(); rerender();
  },
  exDel: d => {
    const xs = routine(ui.planId).exercises, i = +d.i;
    if (!confirm(`¿Quitar "${xs[i].name}" de la rutina? Su historial se conserva.`)) return;
    xs.splice(i, 1); save(); rerender();
  },
  exAdd: () => {
    const inp = $('#newex'), v = inp ? inp.value.trim() : '';
    if (!v) return toast('Escribe el nombre del ejercicio');
    routine(ui.planId).exercises.push({ id: uid(), name: v, warmups: 1 }); save(); rerender();
    const n = $('#newex'); if (n) n.focus();
  },
  delRoutine: () => {
    const r = routine(ui.planId);
    if (!confirm(`¿Eliminar la rutina "${r.name}"? Tu historial se conserva.`)) return;
    db.routines = db.routines.filter(x => x.id !== r.id);
    db.programs.forEach(p => { p.routineIds = p.routineIds.filter(id => id !== r.id); });
    save(); go('home');
  },

  pPreset: d => { ui.form.name = d.n; rerender(); },
  pStep: d => { const f = ui.form, lim = { weeks: [1, 52], cycles: [1, 30] }[d.k]; f[d.k] = Math.min(lim[1], Math.max(lim[0], f[d.k] + +d.d)); rerender(); },
  pDays: d => { ui.form.days = +d.n; rerender(); },
  pRoutine: d => { const ids = ui.form.routineIds, i = ids.indexOf(d.id); if (i >= 0) ids.splice(i, 1); else ids.push(d.id); rerender(); },
  saveProgram,

  exHist: d => { ui.exId = d.id; go('progress'); },
  exBack: () => { ui.exId = null; go('progress'); },

  setNum: d => { db.settings[d.k] = +d.n; save(); rerender(); },
  exportCsv,
  backup: () => download(JSON.stringify(db, null, 1), 'application/json', `respaldo-heavyduty-${todayISO()}.json`),
  importBtn: () => $('#importFile').click(),
  reset: () => {
    if (confirm('¿Borrar TODOS los datos? Descarga un respaldo antes.') && confirm('¿Seguro? Esto no se puede deshacer.')) { db = seed(); save(); go('home'); }
  }
};

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-a]');
  if (!b || b.disabled) return;
  const fn = ACT[b.dataset.a];
  if (fn) fn(b.dataset);
});
document.addEventListener('change', ev => {
  const t = ev.target, f = t.dataset.f;
  if (t.id === 'importFile') { importFile(t.files[0]); t.value = ''; return; }
  if (ui.view === 'train' && t.dataset.s !== undefined) {
    const e = cur(), tg = t.dataset.s === 'e' ? e.eff : e.warm[+t.dataset.s];
    tg[f] = Math.max(0, num(t.value, tg[f])); if (f === 'r') tg.r = Math.round(tg.r);
    save(); rerender(); return;
  }
  if (f === 'rname') { routine(ui.planId).name = t.value.trim() || 'Rutina'; save(); return; }
  if (f === 'exname') { const v = t.value.trim(); if (v) { routine(ui.planId).exercises[+t.dataset.i].name = v; save(); } return; }
  if (f === 'pstart' && t.value) { ui.form.start = t.value; rerender(); }
});
document.addEventListener('input', ev => { if (ev.target.dataset.f === 'pname') ui.form.name = ev.target.value; });
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'newex') ACT.exAdd(); });
document.addEventListener('focusin', ev => { if (ev.target.matches('.stepper input')) ev.target.select(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wake(ui.view === 'train'); if (ui.rest) tickRest(); }
});

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
