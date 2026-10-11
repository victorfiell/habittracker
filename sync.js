// Sincronização com o Supabase. Se não houver configuração ou conexão, o app segue só com o localStorage.
(() => {
  'use strict';
  const P = window.PMRR;
  const URL_ = window.SUPABASE_URL;
  const KEY_ = window.SUPABASE_ANON_KEY;
  const configured = !!(URL_ && KEY_ && !/COLE_/.test(URL_ + KEY_) && window.supabase);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let client = null;
  let session = null;
  let status = 'idle'; // idle | syncing | ok | pending | error
  let lastOk = null;
  let message = '';
  let timer = null;
  let dirty = false;
  let pulling = false;

  if (configured) {
    client = window.supabase.createClient(URL_, KEY_, { auth: { persistSession: true, autoRefreshToken: true } });
  }

  const label = () => {
    if (status === 'syncing') return 'Sincronizando…';
    if (status === 'ok') return `Sincronizado${lastOk ? ' às ' + lastOk.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}.`;
    if (status === 'pending') return 'Alterações aguardando conexão. Serão enviadas assim que possível.';
    if (status === 'error') return 'Erro ao sincronizar: ' + message;
    return '';
  };

  function paint() {
    const box = document.getElementById('syncBox');
    if (!box) return;
    if (!configured) {
      box.innerHTML = `<h3 class="sub">Conta e nuvem</h3><p class="small muted">Supabase não configurado${window.supabase ? '' : ' (ou sem internet para carregar a biblioteca)'}. Os dados ficam só neste navegador. Preencha <b>config.js</b> para ativar.</p>`;
      return;
    }
    if (session) {
      box.innerHTML = `<h3 class="sub">Conta e nuvem</h3>
        <p class="small">Conectado como <b>${esc(session.user.email)}</b>.</p>
        <p class="small ${status === 'error' ? '' : 'muted'}" ${status === 'error' ? 'style="color:var(--warn)"' : ''}>${esc(label())}</p>
        <div class="actions" style="display:flex;gap:8px;flex-wrap:wrap">
          <button type="button" class="btn sm" data-sync="now">Sincronizar agora</button>
          <button type="button" class="btn sm" data-sync="out">Sair</button>
        </div>`;
    } else {
      box.innerHTML = `<h3 class="sub">Conta e nuvem</h3>
        <p class="small muted">Entre para guardar seus dados na nuvem e usar no celular e no computador.</p>
        <form data-sync-form class="fields">
          <div><label for="sy-email">E-mail</label><input id="sy-email" name="email" type="email" autocomplete="email" required></div>
          <div><label for="sy-pass">Senha (mín. 8 caracteres)</label><input id="sy-pass" name="password" type="password" autocomplete="current-password" minlength="8" required></div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn primary" type="submit" data-sync-mode="in">Entrar</button>
            <button class="btn" type="submit" data-sync-mode="up">Criar conta</button>
          </div>
          <p class="small" id="sy-msg" style="color:var(--warn)">${esc(message)}</p>
        </form>`;
    }
  }

  function setStatus(s, msg) {
    status = s;
    message = msg || '';
    if (s === 'ok') lastOk = new Date();
    paint();
  }

  async function push() {
    if (!client || !session) return;
    clearTimeout(timer);
    if (!navigator.onLine) { setStatus('pending'); return; }
    const snapshot = P.getState();
    setStatus('syncing');
    const { error } = await client.from('tracker').upsert({
      user_id: session.user.id,
      data: snapshot,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      dirty = true;
      setStatus('error', error.message);
    } else {
      dirty = P.getState().updatedAt !== snapshot.updatedAt; // mudou durante o envio
      setStatus('ok');
      if (dirty) schedule();
    }
  }

  function schedule() {
    dirty = true;
    if (!client || !session || pulling) return;
    clearTimeout(timer);
    timer = setTimeout(push, 1500);
  }

  async function pull() {
    if (!client || !session) return;
    pulling = true;
    setStatus('syncing');
    const { data, error } = await client.from('tracker').select('data').eq('user_id', session.user.id).maybeSingle();
    pulling = false;
    if (error) { setStatus('error', error.message); return; }
    const local = P.getState();
    const remote = data && data.data;
    if (remote && (remote.updatedAt || 0) > (local.updatedAt || 0)) {
      P.replaceState(remote); // a nuvem é mais nova
      setStatus('ok');
      P.toast('Dados carregados da nuvem.');
    } else {
      await push(); // local mais novo ou nuvem vazia
    }
  }

  P.onSaved = () => schedule();
  P.afterRender = paint;

  document.addEventListener('click', async (ev) => {
    const t = ev.target.closest('[data-sync]');
    if (!t || !client) return;
    if (t.dataset.sync === 'now') { await pull(); }
    if (t.dataset.sync === 'out') {
      if (dirty && !confirm('Há alterações ainda não enviadas. Sair mesmo assim? Elas continuam salvas neste navegador.')) return;
      await client.auth.signOut();
    }
  });

  document.addEventListener('submit', async (ev) => {
    const form = ev.target.closest('form[data-sync-form]');
    if (!form || !client) return;
    ev.preventDefault();
    const mode = (ev.submitter && ev.submitter.dataset.syncMode) || 'in';
    const email = form.email.value.trim();
    const password = form.password.value;
    message = '';
    const res = mode === 'up'
      ? await client.auth.signUp({ email, password })
      : await client.auth.signInWithPassword({ email, password });
    if (res.error) {
      message = /Invalid login/i.test(res.error.message) ? 'E-mail ou senha incorretos.' : res.error.message;
      paint();
    } else if (mode === 'up' && !res.data.session) {
      message = 'Conta criada. Confirme o e-mail recebido e depois clique em Entrar.';
      paint();
    }
    // sucesso: onAuthStateChange cuida do resto
  });

  if (client) {
    client.auth.onAuthStateChange((event, s) => {
      const was = !!session;
      session = s;
      P.loggedIn = !!s;
      if (s && !was) setTimeout(pull, 0); // evita chamar o Supabase dentro do callback
      if (!s) { dirty = false; setStatus('idle'); }
      else paint();
    });
    client.auth.getSession().then(({ data }) => {
      if (data.session && !session) { session = data.session; P.loggedIn = true; pull(); }
      paint();
    });
    window.addEventListener('online', () => { if (dirty) push(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && dirty) push();
      else if (document.visibilityState === 'visible' && session && !dirty) pull();
    });
  }

  paint();
})();
