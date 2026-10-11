(() => {
  'use strict';

  /* ------------------------------------------------------------------ dados fixos */
  const KEY = 'pmrr-tracker-v1';
  const DEFAULT_START = '2026-10-12';
  const STREAK_MIN = 0.75; // fração das horas do dia para o dia contar na sequência

  const SUBJ = {
    mat: { n: 'Matemática', c: 'var(--c-mat)' },
    por: { n: 'Português', c: 'var(--c-por)' },
    dir: { n: 'Direito e Legislação', c: 'var(--c-dir)' },
    red: { n: 'Redação', c: 'var(--c-red)' },
    que: { n: 'Questões e revisão', c: 'var(--c-que)' },
    sim: { n: 'Simulado', c: 'var(--c-sim)' },
  };
  const SUBJ_ORDER = ['mat', 'por', 'dir', 'red', 'que', 'sim'];

  const b = (id, h, s, f) => ({ id, h, s, f });
  // chave = Date.getDay(): 0 dom, 1 seg ... 6 sáb
  const PLAN = {
    1: [
      b('seg1', 1.5, 'mat', 'Tópico da semana (aba Matemática): vídeo curto e questões'),
      b('seg2', 1.5, 'por', 'Interpretação de texto ou gramática aplicada'),
      b('seg3', 1.0, 'que', 'Questões mistas; anotar erros no caderno'),
    ],
    2: [
      b('ter1', 1.5, 'mat', 'Tópico da semana: questões do mesmo tema'),
      b('ter2', 1.5, 'dir', 'Legislação da PM RR, Penal e Penal Militar: revisão ativa e questões'),
      b('ter3', 1.0, 'que', 'Questões mistas; anotar erros no caderno'),
    ],
    3: [
      b('qua1', 1.5, 'por', 'Pontuação, concordância, regência e crase'),
      b('qua2', 1.5, 'red', 'Escrever 1 texto de 20 a 30 linhas, cronometrado'),
      b('qua3', 1.0, 'que', 'Revisar o caderno de erros'),
    ],
    4: [
      b('qui1', 1.5, 'mat', 'Tópico da semana: avançar ou fixar'),
      b('qui2', 1.5, 'dir', 'Constitucional, Administrativo e Direitos Humanos: questões'),
      b('qui3', 1.0, 'que', 'Questões mistas; anotar erros no caderno'),
    ],
    5: [
      b('sex1', 1.5, 'por', 'Interpretação de texto: textos longos'),
      b('sex2', 1.5, 'mat', 'Lista de questões do tópico; refazer as que errou'),
      b('sex3', 1.0, 'red', 'Corrigir o texto (professor ou plataforma) e reescrever'),
    ],
    6: [
      b('sab1', 1.5, 'sim', 'Simulado cronometrado (semana 1: diagnóstico, 20 a 30 questões por matéria)'),
      b('sab2', 1.5, 'sim', 'Correção completa, questão por questão'),
      b('sab3', 1.0, 'sim', 'Atualizar o caderno de erros e os simulados'),
    ],
    0: [
      b('dom1', 1.5, 'dir', 'Revisão da semana: legislação da PM RR e Penal Militar'),
      b('dom2', 1.0, 'mat', 'Refazer os erros da semana'),
      b('dom3', 1.0, 'por', 'Revisão de gramática e interpretação'),
      b('dom4', 0.5, 'red', 'Reescrita ou leitura de texto-modelo'),
    ],
  };
  const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
  const DAY_LONG = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  const MATH = [
    'Fundamentos: frações, decimais, potências, MMC e MDC',
    'Razão, proporção e regra de três',
    'Porcentagem',
    'Médias e juros simples',
    'Conjuntos',
    'Lógica proposicional: tabela-verdade e equivalências',
    'Sequências e problemas de lógica',
    'Análise combinatória e probabilidade básica',
    'Geometria básica: áreas e unidades de medida',
  ];
  const ERR_SUBJ = ['Matemática', 'Português', 'Direito e Legislação', 'Redação', 'Outra'];

  /* ------------------------------------------------------------------ utilidades */
  const pad2 = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
  const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const todayStr = () => ymd(new Date());
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const fmtDateBr = (s) => { const [y, m, d] = s.split('-'); return `${d}/${m}/${y}`; };
  const fmtLong = (d) => `${d.getDate()} de ${MONTHS[d.getMonth()]}`;
  const fmtH = (h) => {
    const whole = Math.floor(h);
    const min = Math.round((h - whole) * 60);
    if (!whole) return `${min}min`;
    return min ? `${whole}h${pad2(min)}` : `${whole}h`;
  };
  const fmtHoursNum = (h) => (Math.round(h * 10) / 10).toString().replace('.', ',');
  const fmtSecs = (s) => {
    s = Math.max(0, Math.floor(s));
    if (s < 60) return `${s}s`;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h) return `${h}h${pad2(m)}`;
    return `${m}min`;
  };
  const fmtClock = (s) => {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h ? `${h}:${pad2(m)}:${pad2(sec)}` : `${pad2(m)}:${pad2(sec)}`;
  };
  const pctOf = (a, t) => (t > 0 ? Math.round((100 * a) / t) : null);

  /* ------------------------------------------------------------------ estado */
  const defaults = () => ({
    v: 1,
    start: DEFAULT_START,
    done: {},
    secs: {},
    rest: {},
    math: {},
    errors: [],
    essays: [],
    sims: [],
    timer: null,
    lastExport: null,
    updatedAt: 0, // ms; usado para decidir qual cópia (local ou nuvem) é a mais nova
  });

  // ponte com sync.js (Supabase)
  const PMRR = (window.PMRR = {
    loggedIn: false,
    onSaved: null,
    afterRender: null,
    getState: () => state,
    replaceState(o) {
      state = normalize(o);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
      render();
    },
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaults();
      return normalize(JSON.parse(raw));
    } catch (e) {
      return defaults();
    }
  }
  function normalize(o) {
    const d = defaults();
    if (!o || typeof o !== 'object') return d;
    const out = Object.assign(d, o);
    ['done', 'secs', 'rest', 'math'].forEach((k) => { if (!out[k] || typeof out[k] !== 'object') out[k] = {}; });
    ['errors', 'essays', 'sims'].forEach((k) => { if (!Array.isArray(out[k])) out[k] = []; });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(out.start || '')) out.start = DEFAULT_START;
    if (typeof out.updatedAt !== 'number') out.updatedAt = 0;
    return out;
  }
  function save() {
    state.updatedAt = Date.now();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      toast('Não foi possível salvar neste navegador. Exporte um backup em Dados.');
    }
    if (PMRR.onSaved) PMRR.onSaved(state);
  }
  function hasData() {
    return Object.keys(state.done).length || state.errors.length || state.essays.length || state.sims.length || Object.keys(state.math).length;
  }

  /* ------------------------------------------------------------------ cálculos */
  const dayBlocks = (date) => PLAN[parseYmd(date).getDay()];
  const dayPlanned = (date) => dayBlocks(date).reduce((s, x) => s + x.h, 0);
  const isDone = (date, id) => !!(state.done[date] && state.done[date][id]);
  const dayDoneH = (date) => dayBlocks(date).reduce((s, x) => s + (isDone(date, x.id) ? x.h : 0), 0);
  const dayPct = (date) => dayDoneH(date) / dayPlanned(date);
  const secsOf = (date, id) => (state.secs[date] && state.secs[date][id]) || 0;
  const daySecs = (date) => dayBlocks(date).reduce((s, x) => s + secsOf(date, x.id), 0);
  function dayStatus(date) {
    if (state.rest[date]) return 'rest';
    return dayPct(date) >= STREAK_MIN ? 'ok' : 'no';
  }
  function streakInfo() {
    const today = new Date();
    const start = parseYmd(state.start);
    let cur = 0;
    let d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (dayStatus(ymd(d)) === 'no') d = addDays(d, -1);
    while (d >= start) {
      const s = dayStatus(ymd(d));
      if (s === 'ok') cur++;
      else if (s !== 'rest') break;
      d = addDays(d, -1);
    }
    let best = 0, run = 0;
    for (let x = new Date(start); x <= today; x = addDays(x, 1)) {
      const s = dayStatus(ymd(x));
      if (s === 'ok') { run++; best = Math.max(best, run); }
      else if (s === 'rest') { /* mantém */ }
      else if (ymd(x) !== ymd(today)) run = 0;
    }
    return { cur, best: Math.max(best, cur) };
  }
  function weekIndexFor(date) {
    const w0 = mondayOf(parseYmd(state.start));
    const diff = Math.round((mondayOf(date) - w0) / (7 * 24 * 3600 * 1000));
    return diff + 1;
  }

  /* ------------------------------------------------------------------ interface: estado de tela */
  const ui = { tab: 'hoje', date: todayStr(), weekOffset: 0, reg: 'erros', onlyPending: false };
  const app = document.getElementById('app');
  const navEl = document.getElementById('nav');
  const pill = document.getElementById('pill');
  const brandSub = document.getElementById('brandSub');
  const toastEl = document.getElementById('toast');
  let toastTimer = null;

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  PMRR.toast = toast;

  /* ------------------------------------------------------------------ cronômetro */
  const timerElapsed = () => (state.timer ? (Date.now() - state.timer.startedAt) / 1000 : 0);
  function startTimer(id, date) {
    if (state.timer) stopTimer(true);
    state.timer = { id, date, startedAt: Date.now() };
    save();
  }
  function stopTimer(silent) {
    if (!state.timer) return;
    const t = state.timer;
    const el = Math.round((Date.now() - t.startedAt) / 1000);
    state.secs[t.date] = state.secs[t.date] || {};
    state.secs[t.date][t.id] = (state.secs[t.date][t.id] || 0) + Math.max(0, el);
    state.timer = null;
    save();
    if (!silent) toast(`Registrado: ${fmtSecs(el)}`);
  }
  function blockLabel(id) {
    for (const k of Object.keys(PLAN)) {
      const f = PLAN[k].find((x) => x.id === id);
      if (f) return SUBJ[f.s].n;
    }
    return '';
  }
  function tick() {
    document.querySelectorAll('[data-live]').forEach((el) => {
      const [date, id] = el.getAttribute('data-live').split('|');
      let s = secsOf(date, id);
      if (state.timer && state.timer.id === id && state.timer.date === date) s += timerElapsed();
      el.textContent = fmtSecs(s) + ' cronometrados';
    });
    document.querySelectorAll('[data-live-clock]').forEach((el) => {
      el.textContent = state.timer ? fmtClock(timerElapsed()) : '';
    });
    renderPill();
  }
  function renderPill() {
    if (state.timer) {
      pill.hidden = false;
      pill.textContent = `${blockLabel(state.timer.id)} ${fmtClock(timerElapsed())}`;
    } else {
      pill.hidden = true;
    }
  }
  setInterval(() => { if (state.timer) tick(); }, 1000);

  /* ------------------------------------------------------------------ telas */
  const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function viewHoje() {
    const date = ui.date;
    const d = parseYmd(date);
    const blocks = dayBlocks(date);
    const rest = !!state.rest[date];
    const doneH = dayDoneH(date);
    const planned = dayPlanned(date);
    const st = streakInfo();
    const isToday = date === todayStr();
    const before = date < state.start;
    const slots = blocks.map((x) => `<span class="slot ${isDone(date, x.id) ? 'is-done' : ''}" style="--sc:${SUBJ[x.s].c}"></span>`).join('');

    let notices = '';
    if (before) notices += `<p class="notice">A rotina começa em ${fmtDateBr(state.start)}. Você pode adiantar os blocos, mas estes dias não entram na sequência.</p>`;
    if (needsBackup()) notices += `<p class="notice warn">Seus dados ficam só neste navegador. Entre na sua conta ou faça um backup em Dados.</p>`;

    const cards = blocks.map((x) => {
      const done = isDone(date, x.id);
      const running = state.timer && state.timer.id === x.id && state.timer.date === date;
      const secs = secsOf(date, x.id) + (running ? timerElapsed() : 0);
      return `
      <article class="block ${done ? 'is-done' : ''}" style="--sc:${SUBJ[x.s].c}">
        <button type="button" class="check" data-act="toggle" data-id="${x.id}" aria-pressed="${done}" aria-label="${done ? 'Desmarcar' : 'Marcar como feito'}: ${esc(SUBJ[x.s].n)}">${CHECK_SVG}</button>
        <div>
          <h3>${esc(SUBJ[x.s].n)}</h3>
          <p class="foco">${esc(x.f)}</p>
          <p class="b-meta"><span>${fmtH(x.h)} planejado</span><span data-live="${date}|${x.id}">${fmtSecs(secs)} cronometrados</span></p>
        </div>
        <button type="button" class="timer-btn ${running ? 'running' : ''}" data-act="timer" data-id="${x.id}">${running ? 'Parar' : 'Iniciar'}</button>
      </article>`;
    }).join('');

    return `
    <div class="stack">
      <div class="daynav">
        <button type="button" class="btn sm" data-act="day" data-n="-1" aria-label="Dia anterior">Anterior</button>
        <button type="button" class="btn sm" data-act="day" data-n="1" aria-label="Próximo dia">Próximo</button>
        ${isToday ? '' : '<button type="button" class="btn sm ghost" data-act="today">Voltar para hoje</button>'}
      </div>
      <section class="hero">
        <div class="hero-row">
          <div>
            <h1>${DAY_LONG[d.getDay()]}</h1>
            <p class="date">${fmtLong(d)}${isToday ? ', hoje' : ''}</p>
          </div>
          <div class="hero-stat"><strong>${rest ? 'Folga' : fmtHoursNum(doneH)}</strong><span>${rest ? 'dia sem estudo' : `de ${fmtHoursNum(planned)} h`}</span></div>
        </div>
        <div class="slots" aria-hidden="true">${slots}</div>
        <p class="streak"><span>Sequência: <b>${st.cur}</b> ${st.cur === 1 ? 'dia' : 'dias'}</span><span>Melhor: <b>${st.best}</b></span><span>Dia vale com ${Math.round(STREAK_MIN * 100)}% das horas</span></p>
      </section>
      ${notices}
      ${rest ? '<p class="notice">Dia de folga marcado. Ele não quebra a sequência e não conta como estudado.</p>' : ''}
      ${rest ? '' : cards}
      <button type="button" class="btn ${rest ? '' : 'ghost'}" data-act="rest">${rest ? 'Desfazer folga' : 'Marcar este dia como folga'}</button>
    </div>`;
  }

  function weekData(offset) {
    const mon = addDays(mondayOf(new Date()), 7 * offset);
    const days = WEEK_ORDER.map((_, i) => addDays(mon, i));
    const per = {};
    SUBJ_ORDER.forEach((k) => { per[k] = { plan: 0, done: 0 }; });
    let totalPlan = 0, totalDone = 0, totalSecs = 0;
    days.forEach((dt) => {
      const ds = ymd(dt);
      dayBlocks(ds).forEach((x) => {
        per[x.s].plan += x.h;
        totalPlan += x.h;
        if (isDone(ds, x.id)) { per[x.s].done += x.h; totalDone += x.h; }
      });
      totalSecs += daySecs(ds);
    });
    return { mon, days, per, totalPlan, totalDone, totalSecs };
  }

  function viewSemana() {
    const w = weekData(ui.weekOffset);
    const todayS = todayStr();
    const idx = weekIndexFor(w.mon);
    const sun = addDays(w.mon, 6);
    const chips = w.days.map((dt) => {
      const ds = ymd(dt);
      const st = dayStatus(ds);
      const p = Math.round(dayPct(ds) * 100);
      const cls = ['wd', ds === todayS ? 'today' : '', st === 'rest' ? 'rest' : '', st === 'ok' ? 'ok' : ''].join(' ');
      return `<button type="button" class="${cls}" data-act="goto" data-date="${ds}" aria-label="${DAY_LONG[dt.getDay()]}, ${fmtLong(dt)}: ${st === 'rest' ? 'folga' : p + '%'}">
        <span class="n">${DAY_SHORT[dt.getDay()]}</span>
        <span class="p">${st === 'rest' ? 'folga' : p + '%'}</span>
        <span class="bar"><i style="width:${st === 'rest' ? 0 : p}%"></i></span>
      </button>`;
    }).join('');
    const bars = SUBJ_ORDER.map((k) => {
      const v = w.per[k];
      const pct = v.plan ? Math.round((100 * v.done) / v.plan) : 0;
      return `<div class="row-bar" style="--sc:${SUBJ[k].c}">
        <span>${esc(SUBJ[k].n)}</span><span class="val">${fmtHoursNum(v.done)} de ${fmtHoursNum(v.plan)} h</span>
        <span class="track"><i style="width:${pct}%"></i></span>
      </div>`;
    }).join('');
    const title = idx >= 1 ? `Semana ${idx}` : 'Antes do início';
    return `
    <div class="stack">
      <div class="daynav">
        <button type="button" class="btn sm" data-act="week" data-n="-1">Semana anterior</button>
        <button type="button" class="btn sm" data-act="week" data-n="1">Próxima</button>
        ${ui.weekOffset ? '<button type="button" class="btn sm ghost" data-act="week" data-n="0">Esta semana</button>' : ''}
      </div>
      <h2 class="sec">${title}<span class="muted small"> &nbsp;${w.mon.getDate()}/${pad2(w.mon.getMonth() + 1)} a ${sun.getDate()}/${pad2(sun.getMonth() + 1)}</span></h2>
      <div class="week-days">${chips}</div>
      <div class="chips">
        <div class="chip"><strong>${fmtHoursNum(w.totalDone)} h</strong><span>feitas, de ${fmtHoursNum(w.totalPlan)} h planejadas</span></div>
        <div class="chip"><strong>${pctOf(w.totalDone, w.totalPlan) || 0}%</strong><span>da meta da semana</span></div>
        <div class="chip"><strong>${fmtSecs(w.totalSecs)}</strong><span>cronometradas</span></div>
      </div>
      <section class="card"><h3 class="sub">Horas por matéria</h3>${bars}</section>
    </div>`;
  }

  function viewMat() {
    const dom = MATH.filter((_, i) => (state.math[i] || {}).status === 'Dominado').length;
    const rows = MATH.map((t, i) => {
      const m = state.math[i] || { status: 'Não iniciado', pct: '' };
      const cls = m.status === 'Dominado' ? 'dominado' : m.status === 'Estudando' ? 'estudando' : '';
      return `<div class="item mt-row ${cls}">
        <span class="nm">${i + 1}. ${esc(t)}</span>
        <div class="ctl">
          <div><label for="ms${i}">Status</label>
            <select id="ms${i}" data-act="math-status" data-i="${i}">
              ${['Não iniciado', 'Estudando', 'Dominado'].map((o) => `<option ${o === m.status ? 'selected' : ''}>${o}</option>`).join('')}
            </select></div>
          <div><label for="mp${i}">% acerto</label>
            <input id="mp${i}" type="number" inputmode="numeric" min="0" max="100" value="${esc(m.pct)}" data-act="math-pct" data-i="${i}"></div>
        </div>
      </div>`;
    }).join('');
    return `
    <div class="stack">
      <h2 class="sec">Matemática e Raciocínio Lógico</h2>
      <div class="chips"><div class="chip"><strong>${dom} de ${MATH.length}</strong><span>tópicos dominados</span></div></div>
      <p class="muted small">Ordem sugerida de partida. Quando o edital sair, o programa real manda: corte o que não for cobrado. Sugestão para marcar Dominado: 80% de acerto ou mais em 20 questões seguidas.</p>
      ${rows}
    </div>`;
  }

  function viewReg() {
    const seg = `<div class="seg" role="group" aria-label="Tipo de registro">
      ${[['erros', 'Erros'], ['redacao', 'Redação'], ['sim', 'Simulados']].map(([k, n]) => `<button type="button" data-act="reg" data-v="${k}" aria-pressed="${ui.reg === k}">${n}</button>`).join('')}
    </div>`;
    if (ui.reg === 'erros') return `<div class="stack">${seg}${viewErros()}</div>`;
    if (ui.reg === 'redacao') return `<div class="stack">${seg}${viewRedacao()}</div>`;
    return `<div class="stack">${seg}${viewSim()}</div>`;
  }

  function viewErros() {
    const list = state.errors.filter((e) => !ui.onlyPending || !e.reviewed);
    const items = list.map((e) => `
      <article class="item">
        <div class="item-head"><strong>${esc(e.subj)}${e.topic ? ' · ' + esc(e.topic) : ''}</strong><span class="meta">${fmtDateBr(e.date)}</span></div>
        <p><b>Errei:</b> ${esc(e.wrong)}</p>
        <p><b>Regra certa:</b> ${esc(e.rule)}</p>
        <div class="actions">
          <button type="button" class="btn sm ${e.reviewed ? '' : 'primary'}" data-act="err-review" data-id="${e.id}">${e.reviewed ? 'Revisado, desfazer' : 'Marcar como revisado'}</button>
          <button type="button" class="btn sm danger" data-act="err-del" data-id="${e.id}">Excluir</button>
        </div>
      </article>`).join('');
    const pend = state.errors.filter((e) => !e.reviewed).length;
    return `
      <details class="card" ${state.errors.length ? '' : 'open'}>
        <summary>Novo erro</summary>
        <form data-form="error" class="fields">
          <div class="fields two">
            <div><label for="e-subj">Matéria</label><select id="e-subj" name="subj">${ERR_SUBJ.map((s) => `<option>${s}</option>`).join('')}</select></div>
            <div><label for="e-topic">Tópico</label><input id="e-topic" name="topic" type="text" placeholder="Ex.: Porcentagem" maxlength="80"></div>
          </div>
          <div><label for="e-wrong">O que errei</label><textarea id="e-wrong" name="wrong" required placeholder="Ex.: Somei o desconto em vez de subtrair"></textarea></div>
          <div><label for="e-rule">Regra ou resposta certa</label><textarea id="e-rule" name="rule" required placeholder="Ex.: Desconto de 20% é multiplicar por 0,8"></textarea></div>
          <button class="btn primary" type="submit">Salvar erro</button>
        </form>
      </details>
      <div class="chips"><div class="chip"><strong>${pend}</strong><span>para revisar</span></div><div class="chip"><strong>${state.errors.length}</strong><span>no caderno</span></div></div>
      <label style="display:flex;gap:8px;align-items:center;font-weight:400"><input type="checkbox" data-act="only-pending" ${ui.onlyPending ? 'checked' : ''} style="width:20px;height:20px"> Mostrar só os não revisados</label>
      ${items || '<p class="empty">Nenhum erro por aqui. Anote o erro e a regra certa assim que errar uma questão.</p>'}`;
  }

  function viewRedacao() {
    const scored = state.essays.filter((e) => e.score !== '' && e.max > 0);
    const avg = scored.length ? Math.round(scored.reduce((s, e) => s + (100 * e.score) / e.max, 0) / scored.length) : null;
    const items = state.essays.map((e) => {
      const p = e.score !== '' && e.max > 0 ? Math.round((100 * e.score) / e.max) : null;
      return `<article class="item" style="--sc:var(--c-red)">
        <div class="item-head"><strong>${esc(e.theme)}</strong><span class="meta">${fmtDateBr(e.date)}</span></div>
        <p class="meta">${e.lines ? esc(e.lines) + ' linhas · ' : ''}${p === null ? 'sem nota ainda' : `nota ${esc(e.score)} de ${esc(e.max)} (${p}%)`}</p>
        ${e.note ? `<p><b>Ajustar:</b> ${esc(e.note)}</p>` : ''}
        <div class="actions">
          <button type="button" class="btn sm ${e.rewritten ? '' : 'primary'}" data-act="es-rewrite" data-id="${e.id}">${e.rewritten ? 'Reescrito, desfazer' : 'Marcar como reescrito'}</button>
          <button type="button" class="btn sm danger" data-act="es-del" data-id="${e.id}">Excluir</button>
        </div>
      </article>`;
    }).join('');
    return `
      <details class="card" ${state.essays.length ? '' : 'open'}>
        <summary>Nova redação</summary>
        <form data-form="essay" class="fields">
          <div><label for="r-theme">Tema</label><input id="r-theme" name="theme" type="text" required maxlength="140" placeholder="Ex.: Segurança pública e uso da tecnologia"></div>
          <div class="fields three">
            <div><label for="r-lines">Linhas</label><input id="r-lines" name="lines" type="number" inputmode="numeric" min="0" max="100"></div>
            <div><label for="r-score">Nota</label><input id="r-score" name="score" type="number" inputmode="decimal" min="0" step="0.5"></div>
            <div><label for="r-max">Nota máxima</label><input id="r-max" name="max" type="number" inputmode="decimal" min="0" step="0.5" value="40"></div>
          </div>
          <div><label for="r-note">Principal erro ou o que ajustar</label><textarea id="r-note" name="note" placeholder="Ex.: Proposta de intervenção genérica"></textarea></div>
          <button class="btn primary" type="submit">Salvar redação</button>
        </form>
      </details>
      <div class="chips"><div class="chip"><strong>${state.essays.length}</strong><span>textos escritos</span></div><div class="chip"><strong>${avg === null ? '-' : avg + '%'}</strong><span>média da nota</span></div></div>
      ${items || '<p class="empty">Nenhuma redação registrada. Escreva a primeira na quarta e registre a nota da correção.</p>'}`;
  }

  function simTotals(s) {
    const a = s.pa + s.ma + s.da, t = s.pt + s.mt + s.dt;
    return { a, t, p: pctOf(a, t) };
  }
  function simChart() {
    const pts = state.sims.map((s) => simTotals(s).p).filter((p) => p !== null);
    if (pts.length < 2) return '<p class="empty">Registre 2 simulados para ver a evolução.</p>';
    const W = 320, H = 150, L = 30, R = 10, T = 10, B = 22;
    const x = (i) => L + ((W - L - R) * i) / (pts.length - 1);
    const y = (p) => T + (H - T - B) * (1 - p / 100);
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p).toFixed(1)}`).join(' ');
    const dots = pts.map((p, i) => `<circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(p).toFixed(1)}" r="3.5"/>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolução do percentual geral nos simulados: ${pts.join('%, ')}%">
      <line class="axis" x1="${L}" y1="${y(0)}" x2="${W - R}" y2="${y(0)}"/>
      <line class="axis" x1="${L}" y1="${y(100)}" x2="${W - R}" y2="${y(100)}"/>
      <line class="ref" x1="${L}" y1="${y(60)}" x2="${W - R}" y2="${y(60)}"/>
      <text x="2" y="${y(100) + 4}">100%</text><text x="8" y="${y(60) + 4}">60%</text><text x="14" y="${y(0) + 4}">0%</text>
      <path class="ln" d="${path}"/>${dots}
      <text x="${L}" y="${H - 6}">1º</text><text x="${W - R - 14}" y="${H - 6}">${pts.length}º</text>
    </svg>`;
  }
  function viewSim() {
    const items = state.sims.slice().reverse().map((s) => {
      const tt = simTotals(s);
      const f = (a, t) => (t > 0 ? `${a}/${t} (${pctOf(a, t)}%)` : '-');
      return `<article class="item" style="--sc:var(--c-sim)">
        <div class="item-head"><strong>${esc(s.name)}</strong><span class="meta">${fmtDateBr(s.date)}</span></div>
        <p><b>Geral: ${tt.p === null ? '-' : tt.p + '%'}</b> <span class="meta">(${tt.a}/${tt.t})</span></p>
        <p class="meta">Português ${f(s.pa, s.pt)} · Matemática ${f(s.ma, s.mt)} · Direito ${f(s.da, s.dt)}</p>
        <div class="actions"><button type="button" class="btn sm danger" data-act="sim-del" data-id="${s.id}">Excluir</button></div>
      </article>`;
    }).join('');
    return `
      <details class="card" ${state.sims.length ? '' : 'open'}>
        <summary>Novo simulado</summary>
        <form data-form="sim" class="fields">
          <div><label for="s-name">Nome</label><input id="s-name" name="name" type="text" required maxlength="80" placeholder="Ex.: Diagnóstico"></div>
          <div class="fields two"><div><label for="s-pa">Português: acertos</label><input id="s-pa" name="pa" type="number" inputmode="numeric" min="0" required></div><div><label for="s-pt">Português: total</label><input id="s-pt" name="pt" type="number" inputmode="numeric" min="0" required></div></div>
          <div class="fields two"><div><label for="s-ma">Matemática: acertos</label><input id="s-ma" name="ma" type="number" inputmode="numeric" min="0" required></div><div><label for="s-mt">Matemática: total</label><input id="s-mt" name="mt" type="number" inputmode="numeric" min="0" required></div></div>
          <div class="fields two"><div><label for="s-da">Direito: acertos</label><input id="s-da" name="da" type="number" inputmode="numeric" min="0" required></div><div><label for="s-dt">Direito: total</label><input id="s-dt" name="dt" type="number" inputmode="numeric" min="0" required></div></div>
          <button class="btn primary" type="submit">Salvar simulado</button>
        </form>
      </details>
      <section class="card"><h3 class="sub">Evolução do percentual geral</h3>${simChart()}<p class="muted small">A linha tracejada marca 60%, um limite sugerido por mim. Ajuste ao critério do edital.</p></section>
      ${items || ''}`;
  }

  function needsBackup() {
    if (PMRR.loggedIn) return false;
    if (!hasData()) return false;
    if (!state.lastExport) return Object.keys(state.done).length >= 3;
    return Date.now() - new Date(state.lastExport).getTime() > 7 * 24 * 3600 * 1000;
  }

  function viewDados() {
    const last = state.lastExport ? new Date(state.lastExport).toLocaleString('pt-BR') : 'nunca';
    return `
    <div class="stack">
      <h2 class="sec">Dados e backup</h2>
      <section class="card stack" id="syncBox" aria-live="polite"></section>
      <p class="notice ${needsBackup() ? 'warn' : ''}">Uma cópia fica sempre neste navegador. Com a conta conectada, os dados também são guardados na nuvem (Supabase). Último backup em arquivo: <b>${last}</b>.</p>
      <section class="card stack">
        <h3 class="sub">Backup em arquivo</h3>
        <button type="button" class="btn primary" data-act="export">Baixar backup (arquivo JSON)</button>
        <div><label for="imp">Restaurar de um backup</label><input id="imp" type="file" accept="application/json,.json" data-act="import"></div>
      </section>
      <section class="card stack">
        <h3 class="sub">Início da rotina</h3>
        <div><label for="start">Primeira segunda-feira da rotina</label><input id="start" type="date" value="${esc(state.start)}" data-act="start"></div>
        <p class="muted small">Define a Semana 1 e de onde a sequência começa a contar.</p>
      </section>
      <section class="card stack">
        <h3 class="sub">Instalar no celular</h3>
        <p class="small">No Chrome (Android), abra o menu e escolha Instalar app ou Adicionar à tela inicial. No Safari (iPhone), toque em Compartilhar e depois em Adicionar à Tela de Início.</p>
      </section>
      <section class="card stack">
        <h3 class="sub">Apagar tudo</h3>
        <p class="small muted">Remove todos os registros deste navegador e, se a conta estiver conectada, também da nuvem. Baixe um backup antes.</p>
        <button type="button" class="btn danger" data-act="reset">Apagar todos os dados</button>
      </section>
    </div>`;
  }

  /* ------------------------------------------------------------------ render */
  function render() {
    let html = '';
    if (ui.tab === 'hoje') html = viewHoje();
    else if (ui.tab === 'semana') html = viewSemana();
    else if (ui.tab === 'mat') html = viewMat();
    else if (ui.tab === 'reg') html = viewReg();
    else html = viewDados();
    app.innerHTML = html;
    navEl.querySelectorAll('button').forEach((bt) => {
      if (bt.dataset.tab === ui.tab) bt.setAttribute('aria-current', 'page');
      else bt.removeAttribute('aria-current');
    });
    const idx = weekIndexFor(new Date());
    brandSub.textContent = idx >= 1 ? `Semana ${idx}` : `Começa em ${fmtDateBr(state.start)}`;
    renderPill();
    if (PMRR.afterRender) PMRR.afterRender();
  }

  /* ------------------------------------------------------------------ eventos */
  navEl.addEventListener('click', (ev) => {
    const bt = ev.target.closest('button[data-tab]');
    if (!bt) return;
    ui.tab = bt.dataset.tab;
    if (ui.tab === 'hoje') ui.date = todayStr();
    render();
    window.scrollTo(0, 0);
  });
  pill.addEventListener('click', () => {
    if (!state.timer) return;
    ui.tab = 'hoje';
    ui.date = state.timer.date;
    render();
  });

  app.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return; // tratados no evento change
    const id = t.dataset.id;
    switch (act) {
      case 'toggle': {
        const date = ui.date;
        state.done[date] = state.done[date] || {};
        if (state.done[date][id]) delete state.done[date][id];
        else state.done[date][id] = true;
        save();
        render();
        const el = app.querySelector(`.check[data-id="${id}"]`);
        if (el && el.getAttribute('aria-pressed') === 'true') { el.classList.add('just'); el.focus(); }
        break;
      }
      case 'timer': {
        if (state.timer && state.timer.id === id && state.timer.date === ui.date) stopTimer();
        else startTimer(id, ui.date);
        render();
        break;
      }
      case 'day': ui.date = ymd(addDays(parseYmd(ui.date), Number(t.dataset.n))); render(); break;
      case 'today': ui.date = todayStr(); render(); break;
      case 'rest': {
        if (state.rest[ui.date]) delete state.rest[ui.date]; else state.rest[ui.date] = true;
        save(); render(); break;
      }
      case 'week': {
        const n = Number(t.dataset.n);
        ui.weekOffset = n === 0 ? 0 : ui.weekOffset + n;
        render(); break;
      }
      case 'goto': ui.tab = 'hoje'; ui.date = t.dataset.date; render(); window.scrollTo(0, 0); break;
      case 'reg': ui.reg = t.dataset.v; render(); break;
      case 'err-review': {
        const e = state.errors.find((x) => x.id === id);
        if (e) { e.reviewed = !e.reviewed; save(); render(); }
        break;
      }
      case 'err-del':
        if (confirm('Excluir este erro do caderno?')) { state.errors = state.errors.filter((x) => x.id !== id); save(); render(); }
        break;
      case 'es-rewrite': {
        const e = state.essays.find((x) => x.id === id);
        if (e) { e.rewritten = !e.rewritten; save(); render(); }
        break;
      }
      case 'es-del':
        if (confirm('Excluir esta redação do registro?')) { state.essays = state.essays.filter((x) => x.id !== id); save(); render(); }
        break;
      case 'sim-del':
        if (confirm('Excluir este simulado do registro?')) { state.sims = state.sims.filter((x) => x.id !== id); save(); render(); }
        break;
      case 'export': exportData(); break;
      case 'reset':
        if (confirm('Apagar todos os dados? Isso não pode ser desfeito.')) {
          state = defaults(); save(); render(); toast('Dados apagados.');
        }
        break;
      default: break;
    }
  });

  app.addEventListener('change', (ev) => {
    const t = ev.target;
    const act = t.dataset && t.dataset.act;
    if (!act) return;
    if (act === 'math-status') {
      const i = t.dataset.i;
      state.math[i] = Object.assign({ status: 'Não iniciado', pct: '' }, state.math[i], { status: t.value });
      save(); render();
    } else if (act === 'math-pct') {
      const i = t.dataset.i;
      let v = t.value === '' ? '' : Math.max(0, Math.min(100, Number(t.value)));
      state.math[i] = Object.assign({ status: 'Não iniciado', pct: '' }, state.math[i], { pct: v });
      save();
    } else if (act === 'start') {
      if (t.value) { state.start = t.value; save(); render(); toast('Início da rotina atualizado.'); }
    } else if (act === 'import') {
      importData(t.files && t.files[0]);
      t.value = '';
    } else if (act === 'only-pending') {
      ui.onlyPending = t.checked; render();
    }
  });

  app.addEventListener('submit', (ev) => {
    const form = ev.target.closest('form[data-form]');
    if (!form) return;
    ev.preventDefault();
    const f = new FormData(form);
    const kind = form.dataset.form;
    const today = todayStr();
    if (kind === 'error') {
      state.errors.unshift({ id: uid(), date: today, subj: f.get('subj'), topic: (f.get('topic') || '').trim(), wrong: (f.get('wrong') || '').trim(), rule: (f.get('rule') || '').trim(), reviewed: false });
      toast('Erro salvo.');
    } else if (kind === 'essay') {
      const score = f.get('score') === '' ? '' : Number(f.get('score'));
      const max = Number(f.get('max')) || 0;
      if (score !== '' && max > 0 && score > max) { toast('A nota não pode ser maior que a nota máxima.'); return; }
      state.essays.unshift({ id: uid(), date: today, theme: (f.get('theme') || '').trim(), lines: f.get('lines') || '', score, max, note: (f.get('note') || '').trim(), rewritten: false });
      toast('Redação salva.');
    } else if (kind === 'sim') {
      const n = (k) => Math.max(0, Number(f.get(k)) || 0);
      const s = { id: uid(), date: today, name: (f.get('name') || '').trim(), pa: n('pa'), pt: n('pt'), ma: n('ma'), mt: n('mt'), da: n('da'), dt: n('dt') };
      if (s.pa > s.pt || s.ma > s.mt || s.da > s.dt) { toast('Os acertos não podem passar do total da matéria.'); return; }
      state.sims.push(s);
      toast('Simulado salvo.');
    }
    save();
    render();
  });

  /* ------------------------------------------------------------------ backup */
  function exportData() {
    state.lastExport = new Date().toISOString();
    save();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pmrr-tracker-backup-${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    render();
    toast('Backup baixado.');
  }
  function importData(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const o = JSON.parse(String(r.result));
        if (!o || o.v !== 1 || typeof o.done !== 'object') throw new Error('formato');
        if (!confirm('Restaurar este backup? Os dados atuais serão substituídos.')) return;
        state = normalize(o);
        save();
        render();
        toast('Backup restaurado.');
      } catch (e) {
        toast('Arquivo inválido. Use um backup baixado por este site.');
      }
    };
    r.readAsText(file);
  }

  /* ------------------------------------------------------------------ início */
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  render();
})();
