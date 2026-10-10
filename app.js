'use strict';
/* HD (Heavy Duty) V5 — app personal de registro de entrenamiento.
   Estructura: Programa › Fases › Días › Ejercicios.
   Todo se guarda en este teléfono (localStorage). Respalda desde Ajustes. */

const KEY = 'hd.v1';
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const TECHS = ['Normal', 'Forzadas', 'Rest-pause', 'Negativas'];
const PRESETS = ['Fase 1', 'Fase 2', 'Fase 3', 'Fase 4', 'Fase 5', 'Fase 6'];
const APP_NAME = 'HD';
const APP_VER = 'V5';
const DEF_SETTINGS = { step: 2.5, stepLb: 5, restWarm: 60, restEff: 120 };

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
// Clave para comparar nombres sin importar mayúsculas, acentos, espacios ni signos
const normKey = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const normSearch = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const pad2 = n => String(n).padStart(2, '0');
const fmtDur = sec => { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`; };
const fmtMin = sec => Math.round(sec / 60) + ' min';
const fmtTime = ms => new Date(ms).toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit' });

const LB = 0.45359237;
const conv = (w, from, to) => from === to ? w : from === 'lb' ? w * LB : w / LB;
const other = u => u === 'lb' ? 'kg' : 'lb';
const unitOf = x => (x && x.unit) || 'kg';
const stepFor = u => u === 'lb' ? (db.settings.stepLb || 5) : db.settings.step;
const wLabel = (w, u) => w > 0 ? `${u} · ≈ ${fmt(r1(conv(w, u, other(u))))} ${other(u)}` : u;
const lastEffIn = (l, u) => ({ w: r1(conv(l.eff.w, unitOf(l), u)), r: l.eff.r });

/* ---------- datos ---------- */
function seed() {
  const names = ['Hombro y bícep', 'Pecho y trícep', 'Pecho y hombro', 'Espalda y trícep', 'Pierna completa'];
  const hb = ['Press militar agarre amplio en máquina', 'Elevación lateral en polea baja', 'Jalón a la cara en polea con soga',
    'Curl de bíceps araña con mancuernas', 'Curl de bíceps con soga en polea baja', 'Curl drag con mancuernas'];
  const exercises = hb.map((x, k) => ({ id: uid() + 'e' + k, name: x, unit: 'kg' }));
  const routines = names.map((n, i) => ({ id: uid() + i, name: n, exercises: i === 0 ? exercises.map(x => ({ id: x.id, warmups: 1 })) : [] }));
  return {
    v: 3, programName: 'Mi programa', exercises,
    programs: [{ id: uid(), name: 'Fase 1', weeks: 8, cycles: 8, days: 3, start: todayISO(), routineIds: routines.map(r => r.id), state: 'active' }],
    routines, sessions: [], current: null, settings: Object.assign({}, DEF_SETTINGS)
  };
}
// Convierte datos de versiones anteriores sin perder nada
function migrate(d) {
  if (!d || !Array.isArray(d.routines) || !Array.isArray(d.sessions)) return null;
  if (d.v === 1) {
    const old = ['1er bimestre', '2do bimestre', '3er bimestre', '4to bimestre', '5to bimestre', '6to bimestre'];
    (d.programs || []).forEach(p => {
      p.state = p.active ? 'active' : 'done';
      delete p.active;
      const i = old.indexOf(p.name);
      if (i >= 0) p.name = 'Fase ' + (i + 1);
    });
    d.programName = d.programName || 'Mi programa';
    d.v = 2;
  }
  if (d.v === 2) {
    // v3: catálogo único de ejercicios; los días solo apuntan a ellos
    const cat = [], byNorm = {}, remap = {};
    const addCat = (id, name, unit) => {
      const k = normKey(name);
      if (byNorm[k]) { if (byNorm[k].id !== id) remap[id] = byNorm[k].id; return; }
      const e = { id, name: name || 'Ejercicio', unit: unit || 'kg' };
      cat.push(e); byNorm[k] = e;
    };
    d.routines.forEach(r => r.exercises.forEach(x => addCat(x.id, x.name, x.unit)));
    d.sessions.forEach(s => s.entries.forEach(e => { if (!cat.some(c => c.id === e.exerciseId) && !remap[e.exerciseId]) addCat(e.exerciseId, e.name, e.unit); }));
    d.routines.forEach(r => {
      const seen = new Set();
      r.exercises = r.exercises.map(x => { const id = remap[x.id] || x.id; return { id, warmups: x.warmups || 1, repMin: x.repMin || null, repMax: x.repMax || null, notes: x.notes || '' }; })
        .filter(x => !seen.has(x.id) && seen.add(x.id));
    });
    d.sessions.forEach(s => s.entries.forEach(e => { if (remap[e.exerciseId]) e.exerciseId = remap[e.exerciseId]; }));
    if (d.current) d.current.entries.forEach(e => { if (remap[e.exerciseId]) e.exerciseId = remap[e.exerciseId]; });
    d.exercises = cat;
    d.v = 3;
  }
  if (d.v !== 3) return null;
  d.exercises = d.exercises || [];
  d.programs = d.programs || [];
  d.settings = Object.assign({}, DEF_SETTINGS, d.settings);
  return d;
}
function load() {
  try { const raw = localStorage.getItem(KEY); if (raw) { const d = migrate(JSON.parse(raw)); if (d) return d; } } catch (e) { /* sin acceso */ }
  return seed();
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { toast('No se pudo guardar en este teléfono'); }
}

let db = load();
save();
const ui = { view: db.current ? 'train' : 'home', planId: null, form: null, exId: null, summary: null, rest: null, tick: null, keep: false };

const routine = id => db.routines.find(r => r.id === id);
const phaseById = id => db.programs.find(p => p.id === id);
const activePhase = () => db.programs.find(p => p.state === 'active') || null;
const plannedPhases = () => db.programs.filter(p => p.state === 'planned');
const phaseDays = p => p ? p.routineIds.map(routine).filter(Boolean) : [];
const beats = (a, b) => a.w > b.w || (a.w === b.w && a.r > b.r);

function stats(p) {
  const ss = db.sessions.filter(s => s.programId === p.id);
  const rs = phaseDays(p);
  const counts = rs.map(r => ss.filter(s => s.routineId === r.id).length);
  const cyclesDone = rs.length ? Math.min.apply(null, counts) : 0;
  const elapsed = Math.max(0, daysBetween(p.start || todayISO(), todayISO()));
  const byTime = elapsed >= p.weeks * 7;
  const byCycles = cyclesDone >= p.cycles;
  return {
    counts, cyclesDone, byTime, byCycles, done: byTime || byCycles,
    week: Math.min(p.weeks, Math.floor(elapsed / 7) + 1),
    timePct: Math.min(100, elapsed / (p.weeks * 7) * 100),
    cyclePct: Math.min(100, cyclesDone / p.cycles * 100)
  };
}
// El día que toca es el primero del ciclo actual que todavía no haces
function nextDay(p) {
  const rs = phaseDays(p);
  if (!rs.length) return null;
  const st = stats(p);
  const i = st.counts.findIndex(c => c <= st.cyclesDone);
  return rs[i >= 0 ? i : 0];
}
const dayNum = rid => { const p = activePhase(); const i = p ? p.routineIds.indexOf(rid) : -1; return i >= 0 ? i + 1 : null; };
function lastEntry(exId) {
  for (let i = db.sessions.length - 1; i >= 0; i--) {
    const s = db.sessions[i];
    const e = s.entries.find(x => x.exerciseId === exId);
    if (e) return Object.assign({ date: s.date }, e);
  }
  return null;
}
function lastSessionOf(rid) {
  for (let i = db.sessions.length - 1; i >= 0; i--) if (db.sessions[i].routineId === rid) return db.sessions[i];
  return null;
}
function lastInfo(rid) {
  const s = lastSessionOf(rid);
  if (!s) return '';
  return ' · última vez ' + fdate(s.date) + (s.durationSec ? ' · duró ' + fmtMin(s.durationSec) : '');
}
function history(exId) {
  const out = [];
  db.sessions.forEach(s => s.entries.forEach(e => { if (e.exerciseId === exId) out.push({ date: s.date, w: e.eff.w, r: e.eff.r, tech: e.eff.tech, unit: unitOf(e) }); }));
  return out;
}
/* ---------- catálogo de ejercicios ---------- */
const exMeta = id => db.exercises.find(e => e.id === id) || null;
function findExName(id) { const m = exMeta(id); if (m) return m.name; const l = lastEntry(id); return l ? l.name : 'Ejercicio'; }
const slotOf = (rid, id) => { const r = routine(rid); return r ? r.exercises.find(x => x.id === id) || null : null; };
function anySlot(id) {
  for (const r of db.routines) { const x = r.exercises.find(e => e.id === id); if (x) return x; }
  return null;
}
const sesTxt = n => n + (n === 1 ? ' sesión' : ' sesiones');
const daysUsing = id => db.routines.filter(r => r.exercises.some(x => x.id === id));
const sessionsCount = id => db.sessions.reduce((n, s) => n + (s.entries.some(e => e.exerciseId === id) ? 1 : 0), 0);
function usageText(id) {
  const ds = daysUsing(id), n = sessionsCount(id), l = lastEntry(id);
  const parts = [ds.length ? 'en ' + ds.map(r => r.name).join(', ') : 'sin día'];
  parts.push(n + (n === 1 ? ' sesión' : ' sesiones'));
  if (l) parts.push(`último ${fmt(l.eff.w)} ${unitOf(l)} × ${l.eff.r}`);
  return parts.join(' · ');
}
// Ejercicios con nombre muy parecido (posibles duplicados)
function similarTo(id) {
  const m = exMeta(id); if (!m) return [];
  const k = normKey(m.name);
  return db.exercises.filter(e => e.id !== id && k.length > 2 && (normKey(e.name) === k || normKey(e.name).includes(k) || k.includes(normKey(e.name))));
}
function duplicatePairs() {
  const out = [], seen = new Set();
  db.exercises.forEach(e => similarTo(e.id).forEach(o => { const key = [e.id, o.id].sort().join('|'); if (!seen.has(key)) { seen.add(key); out.push([e, o]); } }));
  return out;
}
function mergeExercise(srcId, dstId) {
  db.routines.forEach(r => {
    const hasDst = r.exercises.some(x => x.id === dstId);
    r.exercises = r.exercises.filter(x => !(x.id === srcId && hasDst)).map(x => x.id === srcId ? Object.assign(x, { id: dstId }) : x);
  });
  db.sessions.forEach(s => s.entries.forEach(e => { if (e.exerciseId === srcId) e.exerciseId = dstId; }));
  if (db.current) db.current.entries.forEach(e => { if (e.exerciseId === srcId) e.exerciseId = dstId; });
  db.exercises = db.exercises.filter(e => e.id !== srcId);
}
function exResultsHtml(q) {
  const r = routine(ui.planId); if (!r) return '';
  const inDay = new Set(r.exercises.map(x => x.id));
  const nq = normSearch(q.trim());
  let list = db.exercises.filter(e => !inDay.has(e.id) && (!nq || normSearch(e.name).includes(nq)));
  list.sort((a, b) => sessionsCount(b.id) - sessionsCount(a.id) || a.name.localeCompare(b.name));
  list = list.slice(0, nq ? 8 : 5);
  const exact = nq && db.exercises.some(e => normKey(e.name) === normKey(q));
  let h = `<span class="muted sm">${nq ? (list.length ? 'Coincidencias en tus ejercicios' : 'No hay coincidencias') : (list.length ? 'Tus ejercicios más usados' : '')}</span>`;
  h += list.map(e => `<button class="pick" data-a="exPick" data-id="${e.id}"><span class="col"><span class="pick-n">${esc(e.name)}</span><span class="muted sm">${esc(usageText(e.id))}</span></span><span class="pick-plus">+</span></button>`).join('');
  if (nq && !exact) h += `<button class="btn dashed" data-a="exAdd">+ Crear “${esc(q.trim())}” como ejercicio nuevo</button>`;
  return h;
}
const ejs = n => n + (n === 1 ? ' ejercicio' : ' ejercicios');
const cur = () => db.current.entries[db.current.idx];

/* ---------- entrenamiento ---------- */
function startTraining(rid) {
  const r = routine(rid);
  if (!r || !r.exercises.length) { toast('Primero agrega ejercicios a este día'); ui.planId = rid; go('plan'); return; }
  const p = activePhase();
  db.current = {
    routineId: r.id, routineName: r.name, programId: p ? p.id : null, idx: 0, startedAt: Date.now(),
    entries: r.exercises.map(ex => {
      const meta = exMeta(ex.id) || { name: 'Ejercicio', unit: 'kg' };
      const last = lastEntry(ex.id);
      const u = unitOf(meta), lu = last ? unitOf(last) : u, step = stepFor(u);
      const cw = w => r1(conv(w, lu, u));
      const ew = last ? cw(last.eff.w) : 0;
      const er = last ? last.eff.r : (ex.repMin || 8);
      const warm = [];
      for (let k = 0; k < (ex.warmups || 1); k++) {
        const lw = last && last.warm && last.warm[k];
        warm.push(lw ? { w: cw(lw.w), r: lw.r, done: false } : { w: roundTo(ew * (k === 0 ? 0.5 : 0.75), step), r: k === 0 ? 12 : 6, done: false });
      }
      return { exerciseId: ex.id, name: meta.name, unit: u, warm, eff: { w: ew, r: er, done: false, tech: 'Normal' } };
    })
  };
  save(); go('train');
}
function finishTraining() {
  const c = db.current;
  const done = c.entries.filter(e => e.eff.done);
  if (!done.length) {
    if (!confirm('No registraste ninguna serie efectiva. ¿Cerrar el entreno sin guardar?')) return;
  } else {
    const end = Date.now();
    let dur = Math.round((end - c.startedAt) / 1000);
    if (dur > 4 * 3600 && !confirm(`El cronómetro marca ${fmtDur(dur)}. ¿Guardar esa duración?\n\nSi eliges Cancelar, el entreno se guarda sin duración.`)) dur = null;
    const prev = lastSessionOf(c.routineId);
    const prs = [], firsts = [];
    done.forEach(e => { const l = lastEntry(e.exerciseId); if (!l) firsts.push(e.name); else if (beats(e.eff, lastEffIn(l, unitOf(e)))) prs.push(e.name); });
    db.sessions.push({
      id: uid(), date: todayISO(), at: end, startedAt: c.startedAt, endedAt: end, durationSec: dur,
      programId: c.programId, routineId: c.routineId, routineName: c.routineName,
      entries: done.map(e => ({ exerciseId: e.exerciseId, name: e.name, unit: unitOf(e), warm: e.warm.map(w => ({ w: w.w, r: w.r })), eff: { w: e.eff.w, r: e.eff.r, tech: e.eff.tech } }))
    });
    ui.summary = {
      routineName: c.routineName, total: done.length, of: c.entries.length, prs, firsts,
      dur, startedAt: c.startedAt, endedAt: end, prevDur: prev && prev.durationSec,
      phaseName: (phaseById(c.programId) || {}).name || ''
    };
  }
  db.current = null; stopRest(); save();
  go(done.length ? 'summary' : 'home');
}
function compare(eff, last, u) {
  if (!last) return { cls: '', text: 'Primera vez: esta serie será tu referencia' };
  const l = lastEffIn(last, u);
  if (beats(eff, l)) {
    const d = eff.w > l.w ? '+' + fmt(r1(eff.w - l.w)) + ' ' + u : '+' + (eff.r - l.r) + (eff.r - l.r === 1 ? ' rep' : ' reps');
    return { cls: 'up', text: d + ' vs. la vez pasada · progresaste' };
  }
  if (eff.w === l.w && eff.r === l.r) return { cls: '', text: 'Igual que la vez pasada · busca 1 rep más' };
  return { cls: 'down', text: 'Por debajo de la vez pasada' };
}

/* ---------- cronómetro y descanso ---------- */
const elapsedText = () => db.current ? fmtDur(Math.max(0, Math.floor((Date.now() - db.current.startedAt) / 1000))) : '0:00';
function restText() {
  const left = ui.rest ? Math.max(0, Math.ceil((ui.rest.end - Date.now()) / 1000)) : 0;
  return Math.floor(left / 60) + ':' + pad2(left % 60);
}
function startRest(sec) { ui.rest = { end: Date.now() + sec * 1000 }; }
function stopRest() { ui.rest = null; }
function tick() {
  const c = document.getElementById('clockT'); if (c) c.textContent = elapsedText();
  if (!ui.rest) return;
  if (Date.now() >= ui.rest.end) {
    stopRest();
    try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (e) { /* sin vibración */ }
    toast('¡Descanso terminado!');
    rerender(); return;
  }
  const el = document.getElementById('restT'); if (el) el.textContent = restText();
}
function ensureTick() {
  clearInterval(ui.tick); ui.tick = null;
  if (ui.view === 'train' && db.current) ui.tick = setInterval(tick, 1000);
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
  const V = { home: vHome, train: vTrain, plan: vPlan, programa: vPrograma, phase: vPhase, progress: vProgress, settings: vSettings, summary: vSummary, catalog: vCatalog, exEdit: vExEdit };
  $('#app').innerHTML = (V[ui.view] || vHome)();
  const m = $('.main'); if (m) m.scrollTop = top;
  ui.keep = false;
  ensureTick();
  wake(ui.view === 'train');
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 2400);
}
function screen(o) {
  const backBtn = o.back ? `<button class="icon-btn" data-a="${o.backA || 'go'}" data-v="${o.back}" aria-label="Volver">${ICON.back}</button>` : '';
  return `<header class="hdr">${backBtn}<div class="hdr-t">${o.sub ? `<span class="eyebrow">${esc(o.sub)}</span>` : ''}<h1>${esc(o.title)}</h1></div>${o.right || ''}</header>
<main class="main">${o.body}</main>
${ui.view === 'train' && ui.rest ? `<div class="rest"><div class="col"><span class="eyebrow">Descanso</span><span class="num" id="restT">${restText()}</span></div><button class="btn" data-a="skipRest">Saltar</button></div>` : ''}
${o.foot ? `<footer class="foot">${o.foot}</footer>` : ''}
${o.nav ? navBar(o.nav) : ''}`;
}
function navBar(c) {
  const it = [['home', 'Inicio', ICON.list], ['progress', 'Progreso', ICON.chart], ['settings', 'Ajustes', ICON.gear]];
  return `<nav class="nav">${it.map(([v, l, ic]) => `<button class="${c === v ? 'on' : ''}" data-a="go" data-v="${v}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
}
const bar = (label, val, pct) => `<div class="col" style="gap:6px"><div class="row-sb sm"><span class="muted">${label}</span><span style="font-weight:600">${val}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
const dayRow = (r, label, extra) => `<div class="card rrow"><div class="col">${label ? `<span class="muted sm" style="font-weight:600">${label}</span>` : ''}<span class="rname">${esc(r.name)}</span><span class="muted sm">${ejs(r.exercises.length)}${extra || ''}</span></div>
  <div class="row"><button class="btn ghost" data-a="plan" data-id="${r.id}">Planear</button><button class="icon-btn hl" data-a="train" data-id="${r.id}" aria-label="Entrenar ${esc(r.name)}">${ICON.play}</button></div></div>`;

function vHome() {
  const p = activePhase();
  let b = '';
  if (db.current) b += `<button class="card resume" data-a="go" data-v="train"><span class="eyebrow hl">Entreno en curso · ${elapsedText()}</span><span class="big">${esc(db.current.routineName)}</span><span class="muted">Toca para continuar</span></button>`;
  if (p) {
    const st = stats(p);
    b += `<button class="card" data-a="go" data-v="programa">
      <div class="row-sb"><span class="eyebrow">Fase activa</span><span class="link">Ver programa</span></div>
      <span class="big">${esc(p.name)}</span>
      <div class="grid2">${bar('Tiempo', `Sem ${st.week} de ${p.weeks}`, st.timePct)}${bar('Ciclos', `${st.cyclesDone} de ${p.cycles}`, st.cyclePct)}</div>
      <span class="muted sm">Termina con lo que se cumpla primero</span></button>`;
    if (st.done) {
      const nx = plannedPhases()[0];
      b += `<div class="card win"><span class="big">¡${esc(p.name)} terminada!</span><span class="muted">Se cumplió ${st.byCycles ? `el número de ciclos (${p.cycles})` : `el tiempo (${p.weeks} semanas)`}.</span>
        ${nx ? `<button class="btn acc" data-a="activate" data-id="${nx.id}">Empezar ${esc(nx.name)}</button>` : `<button class="btn acc" data-a="newPhase">Crear siguiente fase</button>`}</div>`;
    } else if (!db.current) {
      const nd = nextDay(p);
      if (nd) b += `<div class="card today"><span class="eyebrow hl">Toca hoy · Día ${dayNum(nd.id)}</span><span class="big">${esc(nd.name)}</span><span class="muted sm">${ejs(nd.exercises.length)}${lastInfo(nd.id)}</span><button class="btn acc lg" data-a="train" data-id="${nd.id}">${ICON.play} Empezar a entrenar</button></div>`;
    }
    const days = phaseDays(p);
    b += `<span class="eyebrow mt">Días de ${esc(p.name)}</span>`;
    b += days.length ? days.map((r, i) => dayRow(r, 'DÍA ' + (i + 1))).join('') : `<div class="card muted">Esta fase no tiene días. Agrégalos desde Ver programa.</div>`;
    b += `<button class="btn dashed" data-a="newDay">+ Nuevo día</button><span class="muted sm" style="text-align:center">Solo aparecen los días de esta fase. Los demás están en Ver programa.</span>`;
  } else {
    b += `<div class="card"><span class="big">Sin fase activa</span><span class="muted sm">Crea o activa una fase para llevar la cuenta de semanas y ciclos.</span><button class="btn acc" data-a="go" data-v="programa">Ir al programa</button></div>`;
    b += `<span class="eyebrow mt">Días</span>` + db.routines.map(r => dayRow(r)).join('');
    b += `<button class="btn dashed" data-a="newDay">+ Nuevo día</button>`;
  }
  return screen({ title: db.programName || 'Mi programa', sub: 'Programa', body: b, nav: 'home' });
}

function stepper(set, f, val, unit, big) {
  return `<div class="stepper ${big ? 'big' : ''}"><button data-a="step" data-s="${set}" data-f="${f}" data-d="-1" aria-label="Menos">−</button>
  <label class="val"><input type="number" inputmode="decimal" step="any" min="0" value="${fmt(val)}" data-s="${set}" data-f="${f}" aria-label="${esc(unit)}"><span class="u">${esc(unit)}</span></label>
  <button data-a="step" data-s="${set}" data-f="${f}" data-d="1" aria-label="Más">+</button></div>`;
}
function vTrain() {
  const c = db.current;
  if (!c) { ui.view = 'home'; return vHome(); }
  const e = cur(), n = c.entries.length, last = lastEntry(e.exerciseId), u = unitOf(e), cmp = compare(e.eff, last, u);
  const ex = slotOf(c.routineId, e.exerciseId) || anySlot(e.exerciseId) || {};
  const range = ex.repMin && ex.repMax ? `${ex.repMin}–${ex.repMax} reps` : ex.repMin ? `mín. ${ex.repMin} reps` : ex.repMax ? `máx. ${ex.repMax} reps` : '';
  const topHit = ex.repMax && e.eff.r >= ex.repMax;
  const dn = dayNum(c.routineId);
  let b = `<div class="segs" style="grid-template-columns:repeat(${n},1fr)">${c.entries.map((x, i) => `<i class="${i === c.idx ? 'cur' : x.eff.done ? 'ok' : ''}"></i>`).join('')}</div>
  <h2 class="exname">${esc(findExName(e.exerciseId))}</h2>
  ${range || ex.notes ? `<div class="card notes">${range ? `<span class="eyebrow hl">Objetivo · ${range}</span>` : ''}${ex.notes ? `<span class="note-t">${esc(ex.notes)}</span>` : ''}</div>` : ''}
  <div class="card row-sb" style="flex-direction:row"><div class="col"><span class="eyebrow">La vez pasada${last ? ' · ' + fdate(last.date) : ''}</span><span class="num md">${last ? `${fmt(last.eff.w)} ${unitOf(last)} × ${last.eff.r} reps` : 'Sin registro'}</span>${last && last.eff.w > 0 ? `<span class="muted sm">≈ ${fmt(r1(conv(last.eff.w, unitOf(last), other(unitOf(last)))))} ${other(unitOf(last))}</span>` : ''}</div><span class="muted sm">${last && last.eff.tech && last.eff.tech !== 'Normal' ? esc(last.eff.tech) : 'serie al fallo'}</span></div>
  <span class="eyebrow mt">Calentamiento</span>`;
  b += e.warm.map((w, k) => `<div class="card set ${w.done ? 'is-done' : ''}"><div class="row-sb"><span class="lbl">Calentamiento ${k + 1}</span><button class="check ${w.done ? 'on' : ''}" data-a="toggleWarm" data-k="${k}" aria-label="Marcar calentamiento ${k + 1}">${ICON.check}</button></div><div class="grid2">${stepper(k, 'w', w.w, wLabel(w.w, u))}${stepper(k, 'r', w.r, 'reps')}</div></div>`).join('');
  b += e.warm.length < 2 ? `<button class="btn dashed" data-a="addWarm">+ Agregar 2.º calentamiento</button>` : `<button class="btn text" data-a="delWarm">Quitar 2.º calentamiento</button>`;
  b += `<div class="card eff ${e.eff.done ? 'is-done' : ''}"><span class="eff-t">Serie efectiva · al fallo</span>
    ${stepper('e', 'w', e.eff.w, wLabel(e.eff.w, u), true)}${stepper('e', 'r', e.eff.r, 'reps al fallo', true)}
    <div class="cmp ${cmp.cls}">${cmp.text}</div>
    ${topHit ? `<div class="cmp up">Llegaste al tope de ${ex.repMax} reps: la próxima vez sube el peso</div>` : ''}
    <span class="eyebrow">Técnica de intensidad</span>
    <div class="chips">${TECHS.map(t => `<button class="chip ${e.eff.tech === t ? 'on' : ''}" data-a="tech" data-t="${t}">${t}</button>`).join('')}</div>
    <button class="btn ${e.eff.done ? '' : 'acc'} lg" data-a="toggleEff">${e.eff.done ? 'Serie registrada · tocar para editar' : 'Registrar serie al fallo'}</button></div>
  <button class="btn ghost" data-a="finish">Cerrar entreno ahora</button>
  <button class="btn text danger" data-a="discard">Descartar entreno</button>`;
  const lastEx = c.idx === n - 1;
  const foot = `<button class="btn" data-a="prevEx" ${c.idx === 0 ? 'disabled' : ''}>Anterior</button><button class="btn acc" data-a="${lastEx ? 'finish' : 'nextEx'}">${lastEx ? 'Cerrar entreno' : 'Siguiente ejercicio'}</button>`;
  const right = `<div class="clock" role="timer" aria-label="Tiempo de entrenamiento"><span class="eyebrow">Entreno</span><span class="num" id="clockT">${elapsedText()}</span></div>`;
  return screen({ title: c.routineName, sub: `${dn ? 'Día ' + dn + ' · ' : ''}ejercicio ${c.idx + 1} de ${n}`, back: 'home', body: b, foot, right });
}

function vSummary() {
  const s = ui.summary || { total: 0, of: 0, prs: [], firsts: [] };
  let b = '';
  if (s.dur) {
    let diff = '';
    if (s.prevDur) { const d = Math.round((s.dur - s.prevDur) / 60); diff = d === 0 ? 'igual que la vez pasada' : (d > 0 ? '+' : '−') + Math.abs(d) + ' min vs. la vez pasada'; }
    b += `<div class="card win" style="align-items:center;text-align:center;gap:4px"><span class="eyebrow">Duración total</span><span class="dur">${fmtDur(s.dur)}</span><span class="muted sm">${fmtTime(s.startedAt)} → ${fmtTime(s.endedAt)}${diff ? ' · ' + diff : ''}</span></div>`;
  }
  b += `<div class="card"><span class="big">¡Entreno cerrado!</span><span class="muted">${s.total} de ${s.of} series efectivas registradas</span></div>`;
  if (s.prs.length) b += `<span class="eyebrow mt">Le ganaste a la vez pasada</span>` + s.prs.map(n => `<div class="card rrow"><span>${esc(n)}</span><span class="tag">Progreso</span></div>`).join('');
  if (s.firsts.length) b += `<span class="eyebrow mt">Primera vez registrado</span>` + s.firsts.map(n => `<div class="card">${esc(n)}</div>`).join('');
  if (!s.prs.length && s.total > s.firsts.length) b += `<div class="card muted">Hoy no superaste tus marcas. En Heavy Duty la recuperación cuenta: descansa bien y vuelve por una rep más.</div>`;
  return screen({ title: s.routineName || 'Resumen', sub: 'Entreno cerrado' + (s.phaseName ? ' · ' + s.phaseName : ''), body: b, foot: `<button class="btn acc lg full" data-a="go" data-v="home">Listo</button>` });
}

function vPlan() {
  const r = routine(ui.planId);
  if (!r) { ui.view = 'home'; return vHome(); }
  let b = `<div class="card"><label class="eyebrow" for="rname">Nombre del día</label><input id="rname" class="inp" value="${esc(r.name)}" data-f="rname"></div>
  <span class="eyebrow mt">Ejercicios, en orden</span>`;
  b += r.exercises.length ? r.exercises.map((x, i) => `<div class="card">
    <div class="row"><span class="badge">${i + 1}</span><span class="col" style="flex:1"><span class="pick-n">${esc(findExName(x.id))}</span><span class="muted sm">${daysUsing(x.id).length > 1 ? 'compartido con ' + esc(daysUsing(x.id).filter(d => d.id !== r.id).map(d => d.name).join(', ')) : sesTxt(sessionsCount(x.id))}</span></span><button class="btn text hl-t" data-a="exEdit" data-id="${x.id}" data-back="plan">Renombrar</button></div>
    <div class="row"><span class="muted sm" style="flex:1">Reps objetivo</span>
      <input class="inp mini" type="number" inputmode="numeric" min="0" placeholder="mín" value="${x.repMin || ''}" data-f="repMin" data-i="${i}" aria-label="Reps mínimas">
      <span class="muted">a</span>
      <input class="inp mini" type="number" inputmode="numeric" min="0" placeholder="máx" value="${x.repMax || ''}" data-f="repMax" data-i="${i}" aria-label="Reps máximas"></div>
    <textarea class="inp ta" rows="2" placeholder="Notas: enlazar con…, al fallo, cuidar la zona lumbar…" data-f="exnotes" data-i="${i}" aria-label="Notas del ejercicio ${i + 1}">${esc(x.notes || '')}</textarea>
    <div class="seg"><span class="muted sm" style="flex:1">Unidad de peso</span>
      <button class="chip ${unitOf(exMeta(x.id)) === 'kg' ? 'on' : ''}" data-a="unit" data-id="${x.id}" data-u="kg">kg</button>
      <button class="chip ${unitOf(exMeta(x.id)) === 'lb' ? 'on' : ''}" data-a="unit" data-id="${x.id}" data-u="lb">lb</button></div>
    <div class="row-sb"><div class="seg"><span class="muted sm">Calent.</span>
      <button class="chip ${x.warmups === 1 ? 'on' : ''}" data-a="warmups" data-i="${i}" data-n="1">1</button>
      <button class="chip ${x.warmups === 2 ? 'on' : ''}" data-a="warmups" data-i="${i}" data-n="2">2</button></div>
      <div class="row"><button class="icon-btn" data-a="exMove" data-i="${i}" data-d="-1" aria-label="Subir" ${i === 0 ? 'disabled' : ''}>${ICON.up}</button>
      <button class="icon-btn" data-a="exMove" data-i="${i}" data-d="1" aria-label="Bajar" ${i === r.exercises.length - 1 ? 'disabled' : ''}>${ICON.down}</button>
      <button class="icon-btn" data-a="exDel" data-i="${i}" aria-label="Eliminar ejercicio">${ICON.trash}</button></div></div></div>`).join('')
    : `<div class="card muted">Todavía no hay ejercicios. Agrega el primero abajo.</div>`;
  b += `<div class="card today"><label class="eyebrow hl" for="newex">Agregar ejercicio</label><input id="newex" class="inp" placeholder="Busca o escribe uno nuevo…" enterkeyhint="done" autocomplete="off">
    <div id="exResults" class="col" style="gap:8px">${exResultsHtml('')}</div>
    <span class="muted sm">Si eliges uno existente, su historial se comparte entre todos los días donde lo uses.</span></div>
  <button class="btn text danger" data-a="delRoutine">Eliminar día</button>`;
  return screen({ title: 'Planear día', sub: r.name, back: ui.planBack || 'home', body: b, foot: `<button class="btn acc lg full" data-a="train" data-id="${r.id}">${ICON.play} Entrenar este día</button>` });
}

/* ---------- programa y fases ---------- */
function vPrograma() {
  const badge = { active: ['ACTIVA', 'b-acc'], planned: ['SIGUIENTE', 'b-gray'], done: ['TERMINADA', 'b-gray'] };
  const order = { active: 0, planned: 1, done: 2 };
  const phases = db.programs.slice().sort((a, b2) => order[a.state] - order[b2.state] || (a.state === 'done' ? (b2.start || '').localeCompare(a.start || '') : 0));
  let b = `<div class="card"><label class="eyebrow" for="progName">Nombre del programa</label><input id="progName" class="inp" value="${esc(db.programName || '')}" data-f="progName" placeholder="Ej. Heavy Duty 2026"><span class="muted sm">Es el nombre general. Adentro van tus fases, una tras otra.</span></div>
  <span class="eyebrow mt">Fases</span>`;
  b += phases.map(p => {
    const st = stats(p), days = phaseDays(p);
    const info = p.state === 'active' ? `va en semana ${st.week}, ciclo ${st.cyclesDone}` : p.state === 'planned' ? 'sin iniciar' : `desde ${fdateY(p.start)} · ${st.cyclesDone} ciclos`;
    return `<div class="card ${p.state === 'active' ? 'today' : ''}" style="${p.state === 'done' ? 'opacity:.7' : ''}">
      <div class="row-sb"><span class="big" style="font-size:24px">${esc(p.name)}</span><span class="badge2 ${badge[p.state][1]}">${badge[p.state][0]}</span></div>
      <span class="sm" style="color:#C9C7C2">${days.length} días · ${days.map(r => esc(r.name)).join(', ') || 'sin días'}</span>
      <span class="muted sm">${p.weeks} semanas o ${p.cycles} ciclos · ${info}</span>
      ${p.state !== 'done' ? `<div class="grid2"><button class="btn ghost" data-a="editPhase" data-id="${p.id}">Editar</button>${p.state === 'planned' ? `<button class="btn hl-t" data-a="activate" data-id="${p.id}">Activar ahora</button>` : `<button class="btn ghost" data-a="endPhase" data-id="${p.id}">Terminar</button>`}</div>` : ''}
    </div>`;
  }).join('');
  b += `<button class="btn dashed" data-a="newPhase">+ Nueva fase</button>`;
  b += `<span class="eyebrow mt">Todos los días</span><span class="muted sm">Un mismo día puede usarse en varias fases. Si lo editas, el cambio aplica en todas.</span>`;
  b += db.routines.map(r => {
    const inP = db.programs.filter(p => p.state !== 'done' && p.routineIds.includes(r.id)).map(p => p.name);
    return `<div class="card rrow"><div class="col"><span class="rname" style="font-size:16px">${esc(r.name)}</span><span class="muted sm">${ejs(r.exercises.length)} · ${inP.length ? 'en ' + esc(inP.join(', ')) : 'sin fase'}</span></div><button class="btn ghost" data-a="plan" data-id="${r.id}" data-back="programa">Planear</button></div>`;
  }).join('');
  b += `<button class="btn dashed" data-a="newDay" data-back="programa">+ Nuevo día</button>`;
  return screen({ title: 'Programa', sub: 'Configuración', back: 'home', body: b });
}
function openPhase(id) {
  const p = id ? phaseById(id) : null;
  if (p) ui.form = Object.assign({}, p, { routineIds: p.routineIds.slice(), isNew: false });
  else {
    const base = activePhase() || plannedPhases().slice(-1)[0] || db.programs.slice(-1)[0];
    const nums = db.programs.map(x => { const m = /^Fase (\d+)/.exec(x.name); return m ? +m[1] : 0; });
    const name = 'Fase ' + (Math.max(0, ...nums) + 1);
    ui.form = { id: uid(), name, weeks: base ? base.weeks : 8, cycles: base ? base.cycles : 8, days: base ? base.days : 3, start: todayISO(), routineIds: base ? base.routineIds.slice() : db.routines.map(r => r.id), isNew: true, state: activePhase() ? 'planned' : 'active' };
  }
  go('phase');
}
function pstep(k, v, unit) {
  return `<div class="stepper"><button data-a="pStep" data-k="${k}" data-d="-1" aria-label="Menos">−</button><div class="val"><span class="v">${v}</span><span class="u">${esc(unit)}</span></div><button data-a="pStep" data-k="${k}" data-d="1" aria-label="Más">+</button></div>`;
}
function vPhase() {
  const f = ui.form;
  if (!f) { ui.view = 'programa'; return vPrograma(); }
  const per = Math.max(1, f.routineIds.length);
  const wfc = f.cycles * per / f.days, cit = f.weeks * f.days / per;
  const verdict = wfc <= f.weeks ? `Termina primero por ciclos: ${f.cycles} ciclos en ~${Math.ceil(wfc)} semanas` : `Termina primero por tiempo: ${f.weeks} semanas, ~${r1(cit)} ciclos`;
  const showStart = f.state === 'active';
  let b = `<div class="card"><label class="eyebrow" for="pname">Nombre de la fase</label><input id="pname" class="inp" value="${esc(f.name)}" data-f="pname">
    <div class="chips">${PRESETS.map(n => `<button class="chip ${f.name === n ? 'on' : ''}" data-a="pPreset" data-n="${n}">${n}</button>`).join('')}</div>
    <span class="muted sm">Puedes agregarle un nombre libre, por ejemplo "Fase 2 · Fuerza".</span>
    ${showStart ? `<label class="eyebrow" for="pstart">Fecha de inicio</label><input id="pstart" type="date" class="inp" value="${f.start}" data-f="pstart">` : `<span class="muted sm">Empieza a contar el día que la actives.</span>`}</div>
  <div class="card"><div class="row-sb"><span class="eyebrow">Días de esta fase</span><span class="muted sm">${f.routineIds.length} seleccionados</span></div>
    ${db.routines.map(r => { const on = f.routineIds.includes(r.id); return `<button class="check-row ${on ? 'on' : ''}" data-a="pRoutine" data-id="${r.id}" aria-pressed="${on}"><span class="box">${on ? ICON.checkSm : ''}</span><span>${esc(r.name)}</span><span class="muted sm" style="margin-left:auto">${r.exercises.length} ej.</span></button>`; }).join('')}
    <span class="muted sm">Los días sin marcar no aparecen en Inicio mientras esta fase esté activa. Un ciclo cuenta cuando completas todos los días marcados.</span></div>
  <div class="card"><span class="eyebrow">Duración · termina con lo que se cumpla primero</span>
    <span class="lbl">Tiempo máximo</span>${pstep('weeks', f.weeks, 'semanas' + (showStart ? ' · hasta ' + fdateY(addDays(f.start, f.weeks * 7)) : ''))}
    <span class="lbl">Veces que completas todos los días</span>${pstep('cycles', f.cycles, `ciclos de ${per} días`)}
    <span class="lbl">Días que entrenas por semana</span>
    <div class="days">${[2, 3, 4, 5, 6].map(n => `<button class="chip ${f.days === n ? 'on' : ''}" data-a="pDays" data-n="${n}">${n}</button>`).join('')}</div>
    <div class="est"><span class="sm">Con ${f.days} días por semana, ${f.cycles} ciclos te toman unas ${r1(wfc)} semanas.</span><strong>${verdict}</strong></div></div>`;
  if (!f.isNew && f.state !== 'active') b += `<button class="btn text danger" data-a="delPhase">Eliminar fase</button>`;
  const title = f.isNew ? 'Nueva fase' : 'Fase';
  const sub = (db.programName || 'Programa') + (f.isNew && f.state === 'planned' ? ' · quedará como siguiente' : '');
  return screen({ title, sub, back: 'programa', body: b, foot: `<button class="btn acc lg full" data-a="savePhase">Guardar fase</button>` });
}
function savePhase() {
  const f = ui.form;
  if (!f.name.trim()) return toast('Ponle nombre a la fase');
  if (!f.routineIds.length) return toast('Elige al menos un día');
  const data = { id: f.id, name: f.name.trim(), weeks: f.weeks, cycles: f.cycles, days: f.days, start: f.state === 'active' ? (f.start || todayISO()) : null, routineIds: db.routines.map(r => r.id).filter(id => f.routineIds.includes(id)), state: f.state };
  if (f.endedOn) data.endedOn = f.endedOn;
  if (f.isNew) db.programs.push(data);
  else { const i = db.programs.findIndex(p => p.id === f.id); db.programs[i] = data; }
  save(); toast('Fase guardada'); go('programa');
}
function activatePhase(id) {
  const p = phaseById(id), a = activePhase();
  if (!p) return;
  if (a && !confirm(`¿Empezar ${p.name} hoy? ${a.name} quedará como terminada.`)) return;
  if (a) { a.state = 'done'; a.endedOn = todayISO(); }
  p.state = 'active'; p.start = todayISO();
  save(); toast(`${p.name} activa`); go('home');
}

/* ---------- progreso ---------- */
function vProgress() {
  if (ui.exId) return vExercise();
  let b = '';
  const timed = db.sessions.filter(s => s.durationSec).slice(-10);
  if (timed.length) {
    const avg = timed.reduce((a, s) => a + s.durationSec, 0) / timed.length;
    b += `<div class="card rrow"><div class="col"><span class="muted sm">Duración promedio del entreno</span><span class="num md">${fmtMin(avg)}</span></div><span class="muted sm">últimos ${timed.length}</span></div>`;
  }
  if (!db.sessions.length) b += `<div class="card muted">Aquí verás tu progresión cuando registres tu primer entreno.</div>`;
  const p = activePhase();
  const days = p ? phaseDays(p).concat(db.routines.filter(r => !p.routineIds.includes(r.id))) : db.routines;
  b += days.filter(r => r.exercises.length).map(r => `<span class="eyebrow mt">${esc(r.name)}</span>` + r.exercises.map(x => {
    const h = history(x.id), l = h[h.length - 1];
    return `<button class="card rrow" data-a="exHist" data-id="${x.id}"><div class="col"><span class="rname" style="font-size:16px">${esc(findExName(x.id))}</span><span class="muted sm">${h.length ? `${h.length} ${h.length === 1 ? 'sesión' : 'sesiones'} · último ${fmt(l.w)} ${l.unit} × ${l.r}` : 'Sin registros'}</span></div>${ICON.chev}</button>`;
  }).join('')).join('');
  const orphans = db.exercises.filter(e => !daysUsing(e.id).length && sessionsCount(e.id));
  if (orphans.length) b += `<span class="eyebrow mt">Sin día asignado</span>` + orphans.map(e => `<button class="card rrow" data-a="exHist" data-id="${e.id}"><div class="col"><span class="rname" style="font-size:16px">${esc(e.name)}</span><span class="muted sm">${sesTxt(sessionsCount(e.id))}</span></div>${ICON.chev}</button>`).join('');
  return screen({ title: 'Progreso', sub: 'Serie efectiva', body: b, nav: 'progress' });
}
function vExercise() {
  const h = history(ui.exId), ex = anySlot(ui.exId) || {}, cu = unitOf(exMeta(ui.exId));
  let b = '';
  if (h.length) {
    const ws = h.map(x => r1(conv(x.w, x.unit, cu))), n = ws.length;
    b += `<div class="grid3"><div class="card stat"><span class="muted sm">Inicio</span><span class="num md">${fmt(ws[0])} ${cu}</span></div><div class="card stat"><span class="muted sm">Actual</span><span class="num md">${fmt(ws[n - 1])} ${cu}</span></div><div class="card stat gain"><span class="sm">Ganancia</span><span class="num md">${ws[n - 1] - ws[0] >= 0 ? '+' : ''}${fmt(r1(ws[n - 1] - ws[0]))} ${cu}</span></div></div>`;
  }
  if (h.length >= 2) {
    const W = 320, H = 160, L = 34, R = 10, T = 14, B = 22, n = h.length;
    const ws = h.map(x => r1(conv(x.w, x.unit, cu)));
    let mn = Math.min.apply(null, ws), mx = Math.max.apply(null, ws);
    if (mx === mn) { mn -= 5; mx += 5; }
    const X = i => L + i * (W - L - R) / (n - 1), Y = w => H - B - (w - mn) / (mx - mn) * (H - T - B);
    const pts = ws.map((w, i) => `${r1(X(i))},${r1(Y(w))}`).join(' ');
    b += `<div class="card"><div class="row-sb"><span class="eyebrow">Peso de la serie efectiva</span><span class="muted sm">${cu}</span></div>
      <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Progresión de peso de ${fmt(ws[0])} a ${fmt(ws[n - 1])} ${cu}">
      <line x1="${L}" y1="${Y(mx)}" x2="${W - R}" y2="${Y(mx)}" stroke="#26272B"/><line x1="${L}" y1="${Y(mn)}" x2="${W - R}" y2="${Y(mn)}" stroke="#2E2F34"/>
      <text x="0" y="${Y(mx) + 4}" fill="#A3A3A8" font-size="11">${fmt(mx)}</text><text x="0" y="${Y(mn) + 4}" fill="#A3A3A8" font-size="11">${fmt(mn)}</text>
      <polyline fill="none" stroke="#FF6A1A" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/>
      ${ws.map((w, i) => `<circle cx="${r1(X(i))}" cy="${r1(Y(w))}" r="5" fill="${i > 0 && w > ws[i - 1] ? '#7EE2A8' : '#FF6A1A'}" stroke="#1C1D20" stroke-width="2"/>`).join('')}
      <text x="${L}" y="${H - 4}" fill="#A3A3A8" font-size="11">${fdate(h[0].date)}</text><text x="${W - R}" y="${H - 4}" fill="#A3A3A8" font-size="11" text-anchor="end">${fdate(h[n - 1].date)}</text></svg>
      <div class="legend"><span><i style="background:#7EE2A8"></i>Subiste peso</span><span><i style="background:#FF6A1A"></i>Mismo peso</span></div></div>`;
    const last = h.slice(-12), top = ex.repMax || Math.max.apply(null, last.map(x => x.r));
    const scale = 80 / (top + 2);
    b += `<div class="card"><div class="row-sb"><span class="eyebrow">Reps al fallo</span>${ex.repMax ? `<span class="muted sm">objetivo ${ex.repMin || '?'}–${ex.repMax}</span>` : ''}</div>
      <div class="reps" style="grid-template-columns:repeat(${last.length},minmax(0,1fr))">${ex.repMax ? `<div class="topline" style="bottom:${Math.round(ex.repMax * scale)}px"></div>` : ''}
      ${last.map(x => `<div class="rb"><span>${x.r}</span><i style="height:${Math.round(x.r * scale)}px;background:${ex.repMax && x.r >= ex.repMax ? '#7EE2A8' : '#FF6A1A'}"></i></div>`).join('')}</div>
      ${ex.repMax ? `<span class="muted sm">Cuando llegas al tope (línea punteada) sube peso: las reps bajan y vuelves a escalar.</span>` : `<span class="muted sm">Define reps objetivo en Planear para ver la línea de tope.</span>`}</div>`;
  }
  if (!h.length) b += `<div class="card muted">Sin registros todavía.</div>`;
  else b += `<span class="eyebrow mt">Historial</span><div class="card" style="gap:0">${h.map((x, i) => ({ x, up: i > 0 && beats({ w: r1(conv(x.w, x.unit, cu)), r: x.r }, { w: r1(conv(h[i - 1].w, h[i - 1].unit, cu)), r: h[i - 1].r }) })).reverse().map(({ x, up }) => `<div class="hist"><span class="muted">${fdateY(x.date)}</span><span class="row"><span class="num md">${fmt(x.w)} ${x.unit} × ${x.r}</span>${up ? '<span class="tag">↑</span>' : ''}</span></div>`).join('')}</div>`;
  return screen({ title: findExName(ui.exId), sub: 'Historial', back: 'progress', backA: 'exBack', body: b, nav: 'progress' });
}

function vSettings() {
  const s = db.settings;
  const chips = (k, opts, unit) => `<div class="chips">${opts.map(n => `<button class="chip ${s[k] === n ? 'on' : ''}" data-a="setNum" data-k="${k}" data-n="${n}">${n}${unit}</button>`).join('')}</div>`;
  const b = `<button class="card rrow" data-a="go" data-v="catalog"><div class="col"><span class="eyebrow">Mis ejercicios</span><span class="rname" style="font-size:16px">${db.exercises.length} ejercicios</span><span class="muted sm">Renombrar, cambiar unidad o fusionar duplicados${duplicatePairs().length ? ` · <span class="hl-txt">${duplicatePairs().length} posible${duplicatePairs().length === 1 ? '' : 's'} duplicado${duplicatePairs().length === 1 ? '' : 's'}</span>` : ''}</span></div>${ICON.chev}</button>
  <div class="card"><span class="eyebrow">Incremento con −/+ en kg</span>${chips('step', [1, 2.5, 5], ' kg')}
    <span class="eyebrow">Incremento con −/+ en lb</span>${chips('stepLb', [2.5, 5, 10], ' lb')}</div>
  <div class="card"><span class="eyebrow">Descanso después de calentamiento</span>${chips('restWarm', [45, 60, 90], ' s')}
    <span class="eyebrow">Descanso después de la serie efectiva</span>${chips('restEff', [90, 120, 180], ' s')}</div>
  <div class="card"><span class="eyebrow">Tus datos</span><span class="muted sm">Se guardan solo en este teléfono. Haz respaldo de vez en cuando.</span>
    <button class="btn acc" data-a="exportCsv">Exportar a Excel (.csv)</button>
    <button class="btn" data-a="backup">Descargar respaldo</button>
    <button class="btn" data-a="importBtn">Restaurar respaldo</button></div>
  <button class="btn text danger" data-a="reset">Borrar todos los datos</button>
  <span class="muted sm" style="text-align:center">${APP_NAME} · ${APP_VER}</span>`;
  return screen({ title: 'Ajustes', sub: db.programName || 'Heavy Duty', body: b, nav: 'settings' });
}

/* ---------- ajustes › mis ejercicios ---------- */
function catListHtml(q) {
  const nq = normSearch(q.trim());
  const list = db.exercises.filter(e => !nq || normSearch(e.name).includes(nq)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (!list.length) return `<div class="card muted">No hay ejercicios que coincidan.</div>`;
  return list.map(e => `<button class="card rrow" data-a="exEdit" data-id="${e.id}" data-back="catalog"><div class="col"><span class="rname" style="font-size:16px">${esc(e.name)}</span><span class="muted sm">${esc(usageText(e.id))}</span></div><span class="row"><span class="badge2 b-gray">${unitOf(e)}</span>${ICON.chev}</span></button>`).join('');
}
function vCatalog() {
  const dups = duplicatePairs();
  let b = `<input id="catq" class="inp" placeholder="Buscar ejercicio…" aria-label="Buscar ejercicio" autocomplete="off">`;
  if (dups.length) b += `<div class="card notes"><span class="eyebrow hl">Posibles duplicados</span>${dups.slice(0, 4).map(([a, c]) => `<button class="pick" data-a="exEdit" data-id="${a.id}" data-back="catalog"><span class="col"><span class="note-t">“${esc(a.name)}” y “${esc(c.name)}”</span><span class="muted sm">Toca para revisar y fusionar</span></span>${ICON.chev}</button>`).join('')}</div>`;
  b += `<span class="eyebrow mt">${db.exercises.length} ejercicios</span><div id="catList" class="col" style="gap:10px">${catListHtml('')}</div>`;
  return screen({ title: 'Mis ejercicios', sub: 'Ajustes', back: 'settings', body: b });
}
function vExEdit() {
  const e = exMeta(ui.editId);
  if (!e) { ui.view = 'catalog'; return vCatalog(); }
  const ds = daysUsing(e.id), n = sessionsCount(e.id), sim = similarTo(e.id);
  const others = db.exercises.filter(o => o.id !== e.id).sort((a, c) => a.name.localeCompare(c.name, 'es'));
  let b = `<div class="card"><label class="eyebrow" for="catName">Nombre</label><input id="catName" class="inp" value="${esc(e.name)}" data-f="catName">
    <span class="muted sm">El nuevo nombre aparece en todos los días, en el historial y en la exportación a Excel.</span>
    <div class="seg"><span class="muted sm" style="flex:1">Unidad de peso</span>
      <button class="chip ${unitOf(e) === 'kg' ? 'on' : ''}" data-a="unit" data-id="${e.id}" data-u="kg">kg</button>
      <button class="chip ${unitOf(e) === 'lb' ? 'on' : ''}" data-a="unit" data-id="${e.id}" data-u="lb">lb</button></div></div>
  <div class="card"><span class="eyebrow">Se usa en</span><span>${ds.length ? esc(ds.map(r => r.name).join(', ')) : 'Ningún día'}</span><span class="muted sm">${n} ${n === 1 ? 'sesión registrada' : 'sesiones registradas'}</span></div>`;
  if (others.length) {
    b += `<div class="card"><span class="eyebrow">¿Es el mismo que otro?</span><span class="sm" style="color:#C9C7C2">Fusionar junta los dos en uno solo: el historial se suma y los días quedan apuntando al mismo ejercicio. Se conserva el nombre del ejercicio que elijas.</span>
      ${sim.map(o => `<button class="pick" data-a="exMerge" data-id="${o.id}"><span class="col"><span class="pick-n">Fusionar con “${esc(o.name)}”</span><span class="muted sm">sugerido · ${sesTxt(sessionsCount(o.id))}</span></span>${ICON.chev}</button>`).join('')}
      <label class="muted sm" for="mergeSel">${sim.length ? 'O elige otro' : 'Elige con cuál fusionarlo'}</label>
      <select id="mergeSel" class="inp">${others.map(o => `<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select>
      <button class="btn ghost" data-a="exMergeSel">Fusionar con el seleccionado</button></div>`;
  }
  b += (!ds.length && !n) ? `<button class="btn text danger" data-a="exDelCat">Eliminar ejercicio</button>` : `<span class="muted sm" style="text-align:center">Solo se puede eliminar si no está en ningún día y no tiene historial.</span>`;
  return screen({ title: 'Editar ejercicio', sub: 'Mis ejercicios', back: ui.editBack || 'catalog', body: b });
}
function doMerge(dstId) {
  const src = exMeta(ui.editId), dst = exMeta(dstId);
  if (!src || !dst) return;
  if (!confirm(`¿Fusionar “${src.name}” con “${dst.name}”?\n\nSe queda el nombre “${dst.name}” y el historial de los dos se junta. No se puede deshacer.`)) return;
  mergeExercise(src.id, dst.id); save();
  toast('Ejercicios fusionados'); ui.editId = dst.id; go('exEdit');
}

/* ---------- exportar / respaldo ---------- */
function download(text, type, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
function exportCsv() {
  if (!db.sessions.length) return toast('Todavía no hay entrenos registrados');
  const rows = [['Fecha', 'Programa', 'Fase', 'Día', 'Ejercicio', 'Serie', 'Peso', 'Unidad', 'Reps', 'Técnica', 'Duración entreno (min)']];
  db.sessions.forEach(s => {
    const pn = (phaseById(s.programId) || {}).name || '';
    const dm = s.durationSec ? Math.round(s.durationSec / 60) : '';
    s.entries.forEach(e => {
      const en = findExName(e.exerciseId);
      (e.warm || []).forEach((w, k) => rows.push([s.date, db.programName || '', pn, s.routineName, en, 'Calentamiento ' + (k + 1), w.w, unitOf(e), w.r, '', dm]));
      rows.push([s.date, db.programName || '', pn, s.routineName, en, 'Efectiva', e.eff.w, unitOf(e), e.eff.r, e.eff.tech || '', dm]);
    });
  });
  const csv = '﻿' + rows.map(r => r.map(c => { const v = String(c); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
  download(csv, 'text/csv;charset=utf-8', `HD-entrenos-${todayISO()}.csv`);
}
function importFile(file) {
  if (!file) return;
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = migrate(JSON.parse(rd.result));
      if (!d) throw new Error('formato');
      if (!confirm('Esto reemplaza los datos de este teléfono con el respaldo. ¿Continuar?')) return;
      db = d; save(); toast('Respaldo restaurado'); go('home');
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
      if (!confirm('Tienes un entreno en curso. ¿Descartarlo y empezar otro?')) return;
      db.current = null; stopRest();
    }
    startTraining(d.id);
  },
  plan: d => { ui.planId = d.id; ui.planBack = d.back || 'home'; go('plan'); },
  newDay: d => {
    const r = { id: uid(), name: 'Nuevo día', exercises: [] };
    db.routines.push(r); const p = activePhase(); if (p) p.routineIds.push(r.id);
    save(); ui.planId = r.id; ui.planBack = d.back || 'home'; go('plan');
  },
  newPhase: () => openPhase(null),
  editPhase: d => openPhase(d.id),
  activate: d => activatePhase(d.id),
  endPhase: d => {
    const p = phaseById(d.id);
    if (!confirm(`¿Dar por terminada ${p.name}? Su historial se conserva.`)) return;
    p.state = 'done'; p.endedOn = todayISO(); save(); rerender();
  },
  delPhase: () => {
    const f = ui.form;
    if (!confirm(`¿Eliminar ${f.name}? Los entrenos registrados se conservan.`)) return;
    db.programs = db.programs.filter(p => p.id !== f.id); save(); go('programa');
  },

  step: d => {
    const e = cur(), t = d.s === 'e' ? e.eff : e.warm[+d.s], st = d.f === 'w' ? stepFor(unitOf(e)) : 1;
    t[d.f] = Math.max(0, Math.round((t[d.f] + st * +d.d) * 100) / 100); save(); rerender();
  },
  toggleWarm: d => { const w = cur().warm[+d.k]; w.done = !w.done; if (w.done) startRest(db.settings.restWarm); save(); rerender(); },
  addWarm: () => { const e = cur(); e.warm.push({ w: roundTo(e.eff.w * 0.75, stepFor(unitOf(e))), r: 6, done: false }); save(); rerender(); },
  delWarm: () => { cur().warm.length = 1; save(); rerender(); },
  tech: d => { cur().eff.tech = d.t; save(); rerender(); },
  toggleEff: () => { const e = cur(); e.eff.done = !e.eff.done; if (e.eff.done) startRest(db.settings.restEff); save(); rerender(); },
  prevEx: () => { db.current.idx--; save(); go('train'); },
  nextEx: () => { db.current.idx++; save(); go('train'); },
  finish: finishTraining,
  discard: () => { if (confirm('¿Descartar este entreno? No se guardará nada.')) { db.current = null; stopRest(); save(); go('home'); } },
  skipRest: () => { stopRest(); rerender(); },

  warmups: d => { routine(ui.planId).exercises[+d.i].warmups = +d.n; save(); rerender(); },
  unit: d => { const m = exMeta(d.id); if (m) { m.unit = d.u; save(); rerender(); } },
  exPick: d => {
    const r = routine(ui.planId);
    if (!r.exercises.some(x => x.id === d.id)) r.exercises.push({ id: d.id, warmups: 1 });
    save(); rerender(); toast('Agregado: ' + findExName(d.id));
  },
  exEdit: d => { ui.editId = d.id; ui.editBack = d.back || 'catalog'; go('exEdit'); },
  exMerge: d => doMerge(d.id),
  exMergeSel: () => { const s = $('#mergeSel'); if (s && s.value) doMerge(s.value); },
  exDelCat: () => {
    const e = exMeta(ui.editId);
    if (!confirm(`¿Eliminar “${e.name}”?`)) return;
    db.exercises = db.exercises.filter(x => x.id !== e.id); save(); go('catalog');
  },
  exMove: d => {
    const xs = routine(ui.planId).exercises, i = +d.i, j = i + +d.d;
    if (j < 0 || j >= xs.length) return;
    const t = xs[i]; xs[i] = xs[j]; xs[j] = t; save(); rerender();
  },
  exDel: d => {
    const xs = routine(ui.planId).exercises, i = +d.i;
    if (!confirm(`¿Quitar "${findExName(xs[i].id)}" de este día? Su historial y el ejercicio se conservan.`)) return;
    xs.splice(i, 1); save(); rerender();
  },
  exAdd: () => {
    const inp = $('#newex'), v = inp ? inp.value.trim() : '';
    if (!v) return toast('Escribe el nombre del ejercicio');
    const r = routine(ui.planId);
    let e = db.exercises.find(x => normKey(x.name) === normKey(v));
    if (e && r.exercises.some(x => x.id === e.id)) return toast('Ese ejercicio ya está en este día');
    if (!e) { e = { id: uid(), name: v, unit: 'kg' }; db.exercises.push(e); toast('Ejercicio nuevo creado'); }
    else toast('Ya existía: se usó “' + e.name + '”');
    r.exercises.push({ id: e.id, warmups: 1 }); save(); rerender();
  },
  delRoutine: () => {
    const r = routine(ui.planId);
    if (!confirm(`¿Eliminar el día "${r.name}"? Tu historial se conserva.`)) return;
    db.routines = db.routines.filter(x => x.id !== r.id);
    db.programs.forEach(p => { p.routineIds = p.routineIds.filter(id => id !== r.id); });
    save(); go(ui.planBack || 'home');
  },

  pPreset: d => { ui.form.name = d.n; rerender(); },
  pStep: d => { const f = ui.form, lim = { weeks: [1, 52], cycles: [1, 30] }[d.k]; f[d.k] = Math.min(lim[1], Math.max(lim[0], f[d.k] + +d.d)); rerender(); },
  pDays: d => { ui.form.days = +d.n; rerender(); },
  pRoutine: d => { const ids = ui.form.routineIds, i = ids.indexOf(d.id); if (i >= 0) ids.splice(i, 1); else ids.push(d.id); rerender(); },
  savePhase,

  exHist: d => { ui.exId = d.id; go('progress'); },
  exBack: () => { ui.exId = null; go('progress'); },

  setNum: d => { db.settings[d.k] = +d.n; save(); rerender(); },
  exportCsv,
  backup: () => download(JSON.stringify(db, null, 1), 'application/json', `HD-respaldo-${todayISO()}.json`),
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
  if (f === 'progName') { db.programName = t.value.trim() || 'Mi programa'; save(); return; }
  if (f === 'rname') { routine(ui.planId).name = t.value.trim() || 'Día'; save(); return; }
  if (f === 'catName') {
    const e = exMeta(ui.editId), v = t.value.trim();
    if (!e) return;
    if (!v) { t.value = e.name; return toast('El nombre no puede quedar vacío'); }
    const clash = db.exercises.find(x => x.id !== e.id && normKey(x.name) === normKey(v));
    e.name = v; save();
    toast(clash ? `Ya existe “${clash.name}”: considera fusionarlos` : 'Nombre actualizado');
    return;
  }
  if (f === 'exnotes') { routine(ui.planId).exercises[+t.dataset.i].notes = t.value.trim(); save(); return; }
  if (f === 'repMin' || f === 'repMax') { const v = Math.round(num(t.value, 0)); routine(ui.planId).exercises[+t.dataset.i][f] = v > 0 ? v : null; save(); return; }
  if (f === 'pstart' && t.value) { ui.form.start = t.value; rerender(); }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.dataset.f === 'pname') ui.form.name = t.value;
  if (t.id === 'newex') { const c = $('#exResults'); if (c) c.innerHTML = exResultsHtml(t.value); }
  if (t.id === 'catq') { const c = $('#catList'); if (c) c.innerHTML = catListHtml(t.value); }
});
document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target.id === 'newex') ACT.exAdd(); });
document.addEventListener('focusin', ev => { if (ev.target.matches('.stepper input')) ev.target.select(); });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') { wake(ui.view === 'train'); tick(); }
});

if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
