// ===== Telefonens "operativsystem" =====
const Apps = {};
const OS = { cur: null, stack: [], timer: null, bannerQ: [], bannerBusy: false };

Apps.imgStyle = function (p) {
  if (p.color) return `background:radial-gradient(circle at 50% 40%, ${p.color} 0 38%, ${shade(p.color)} 70%)`;
  return `background:linear-gradient(135deg, hsl(${p.hue},70%,93%), hsl(${(p.hue + 40) % 360},55%,82%))`;
  function shade(hex) { const n = parseInt(hex.slice(1), 16); const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255; const l = (r * 299 + g * 587 + b * 114) / 1000; return l > 160 ? '#d9dde3' : '#eef0f3'; }
};

OS.HOME_APPS = [
  ['amazoom', 'elkjopt', 'zalandoo', 'taemu'],
  ['funn', 'bod', 'liste', 'trofeer'],
  ['settings'],
];
OS.DOCK = ['post', 'mail', 'bank', 'klarna'];

OS.boot = function () {
  G.load();
  OS.renderHome();
  OS.updateStatus();
  OS.timer = setInterval(OS.loop, 1000);
  setInterval(G.save, 4000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) G.save(); });
  const SB = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar;
  if (SB) { try { SB.hide(); } catch (e) { } }
  const CapApp = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App;
  if (CapApp) CapApp.addListener('backButton', () => { if (OS.cur || !U.$('#modal').classList.contains('hidden') || !U.$('#shade').classList.contains('hidden')) OS.back(); else CapApp.minimizeApp ? CapApp.minimizeApp() : CapApp.exitApp(); });
  if (!G.s.seenWelcome) {
    G.s.seenWelcome = true;
    setTimeout(() => OS.modal(`<div class="welcome"><div class="big">📱🛒📦</div><h2>Pakkeliv</h2><p>En netthandelsimulator.</p><p>Du har <b>8 450 kr</b> på konto, lønn den 20. og husleie den 1. Handle fornuftig. Eller ikke.</p><p class="small">Tiden går mens du spiller. Trykk på 🌙 for å hoppe til neste morgen.</p><button class="btn primary" onclick="OS.closeModal()">Start</button></div>`), 300);
  }
};

OS.loop = function () {
  if (G.s.speed > 0 && !OS.paused) {
    G.tick(G.s.speed * U.MIN);
    OS.updateStatus();
    if (!OS.cur) OS.renderHome(true);
    else if (OS.isLive()) OS.render(true, true);
  }
};
OS.isLive = function () {
  const top = OS.stack[OS.stack.length - 1]; if (!top) return false;
  const v = Apps[OS.cur].views[top.view];
  return v && v.live;
};

OS.updateStatus = function () {
  U.$('#sb-time').textContent = U.time(G.s.t);
  const h = new Date(G.s.t).getHours();
  U.$('#sb-batt').style.width = Math.max(8, 100 - ((h + 16) % 24) * 4) + '%';
  const unread = G.s.notifs.filter(n => !n.read).length;
  U.$('#sb-notif').textContent = unread ? '🔔' + unread : '';
};

// ---------- Hjemskjerm ----------
OS.iconHTML = function (id) {
  const a = Apps[id]; if (!a) return '';
  const b = a.badge ? a.badge() : 0;
  return `<div class="app-ico" onclick="OS.open('${id}')"><div class="ico ${a.icoClass || ''}" style="background:${a.bg}">${a.icon}${b ? `<span class="badge">${b > 99 ? '99+' : b}</span>` : ''}</div><div class="ico-name">${a.name}</div></div>`;
};
OS.renderHome = function (light) {
  const d = new Date(G.s.t);
  const el = U.$('#home');
  const weather = ['🌧️ 6° Regn', '🌦️ 5° Byger', '☁️ 4° Overskyet', '🌧️ 7° Regn', '🌨️ 1° Sludd', '💨 6° Kuling'][(d.getDate() + Math.floor(d.getHours() / 6)) % 6];
  const html = `
    <div class="widget">
      <div class="w-time">${U.time(G.s.t)}</div>
      <div class="w-date">${U.dateLong(G.s.t).replace(/^./, c => c.toUpperCase())} · ${weather}</div>
      <div class="w-row">
        <div class="w-cell" onclick="OS.open('bank')"><small>Brukskonto</small><b class="${G.s.bank.checking < 0 ? 'red' : ''}">${U.kr(G.s.bank.checking)}</b></div>
        <div class="w-cell" onclick="OS.open('post')"><small>Pakker på vei</small><b>${G.s.shipments.filter(s => s.status === 'transit' || s.status === 'created').length} 🚚 · ${G.s.shipments.filter(s => s.status === 'ready').length} 📦</b></div>
        <div class="w-cell sleep" onclick="OS.sleep()"><small>Sov</small><b>🌙</b></div>
      </div>
      ${G.season() ? `<div class="w-season">${{ singles: '🛍️ 11.11 Singles Day i dag!', preblack: '🖤 Black Week kommer snart…', blackweek: '🖤 BLACK WEEK pågår', mellomjul: '🎄 Mellomjulssalg!' }[G.season()]}</div>` : ''}
    </div>
    <div class="grid">${OS.HOME_APPS.flat().map(OS.iconHTML).join('')}</div>
    <div class="dock">${OS.DOCK.map(OS.iconHTML).join('')}</div>`;
  if (light && el._last === html) return;
  el._last = html; el.innerHTML = html;
};
OS.sleep = function () {
  const h = new Date(G.s.t).getHours();
  OS.modal(`<div class="sleep-anim"><div class="big">😴</div><p>Sover…</p></div>`, true);
  setTimeout(() => {
    G.sleep(); G.save();
    OS.closeModal(); OS.renderHome(); OS.updateStatus();
    OS.toast(`God morgen! Det er ${U.dateLong(G.s.t)}.`);
  }, 900);
};

// ---------- Navigasjon ----------
OS.open = function (id, view = 'main', params = {}) {
  if (!Apps[id]) return;
  OS.closeShade(); OS.closeModal();
  const was = OS.cur;
  OS.cur = id; OS.stack = [{ view, params }];
  if (view !== 'main' && Apps[id].views.main) OS.stack.unshift({ view: 'main', params: {} });
  U.$('#home').classList.add('hidden');
  const av = U.$('#appview'); av.classList.remove('hidden'); av.className = 'app-' + id; av.classList.add('opening');
  setTimeout(() => av.classList.remove('opening'), 250);
  if (Apps[id].onOpen) Apps[id].onOpen(view, params);
  OS.render();
};
OS.go = function (view, params = {}) {
  OS.stack.push({ view, params });
  OS.render();
};
OS.replace = function (view, params = {}) { OS.stack[OS.stack.length - 1] = { view, params }; OS.render(); };
OS.back = function (fromPop) {
  if (!U.$('#modal').classList.contains('hidden')) { if (!OS.modalLocked) OS.closeModal(); return; }
  if (!U.$('#shade').classList.contains('hidden')) { OS.closeShade(); return; }
  if (!OS.cur) return;
  if (OS.stack.length > 1) { OS.stack.pop(); OS.render(); }
  else OS.home();
};
OS.home = function (clearHist) {
  OS.closeShade();
  if (OS.cur && Apps[OS.cur].onClose) Apps[OS.cur].onClose();
  OS.cur = null; OS.stack = [];
  U.$('#appview').classList.add('hidden'); U.$('#appview').innerHTML = '';
  U.$('#home').classList.remove('hidden');
  OS.renderHome();
};
OS.render = function (keepScroll, auto) {
  const top = OS.stack[OS.stack.length - 1];
  const app = Apps[OS.cur]; if (!app || !top) return;
  const av = U.$('#appview');
  const scroller = av.querySelector('.app-body');
  const st = scroller ? scroller.scrollTop : 0;
  const key = OS.cur + ':' + top.view + ':' + JSON.stringify(top.params);
  const fn = app.views[top.view];
  if (!fn) { console.warn('Ukjent visning', top.view); return; }
  const html = fn(top.params || {});
  if (keepScroll && av._last === html) return;
  const active = document.activeElement;
  if (auto && active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type !== 'range')) && av.contains(active)) return; // ikke forstyrr skriving
  av._last = html;
  av.innerHTML = html;
  const ns = av.querySelector('.app-body');
  if (ns && keepScroll && av._key === key) ns.scrollTop = st;
  av._key = key;
  if (fn.after) fn.after(top.params || {}, av);
  OS.updateStatus();
};
OS.params = () => (OS.stack[OS.stack.length - 1] || {}).params || {};

// ---------- Varsler ----------
OS.banner = function (app, title, text) {
  OS.bannerQ.push({ app, title, text });
  OS.updateStatus();
  if (!OS.bannerBusy) OS.nextBanner();
};
OS.nextBanner = function () {
  const b = OS.bannerQ.shift(); const el = U.$('#banner');
  if (!b) { OS.bannerBusy = false; el.classList.add('hidden'); return; }
  if (OS.cur === b.app && b.app !== 'mail') { OS.nextBanner(); return; }
  OS.bannerBusy = true;
  const a = Apps[b.app] || { icon: '🔔', bg: '#555', name: '' };
  el.innerHTML = `<div class="bn-ico" style="background:${a.bg}">${a.icon}</div><div class="bn-txt"><div class="bn-app">${a.name} · nå</div><b>${U.esc(b.title)}</b><div>${U.esc(b.text)}</div></div>`;
  el.onclick = () => { el.classList.add('hidden'); OS.open(b.app); };
  el.classList.remove('hidden'); el.classList.add('show');
  clearTimeout(OS._bt);
  OS._bt = setTimeout(() => { el.classList.remove('show'); setTimeout(OS.nextBanner, 300); }, OS.bannerQ.length > 2 ? 1400 : 3200);
};
OS.toggleShade = function () {
  const el = U.$('#shade');
  if (!el.classList.contains('hidden')) return OS.closeShade();
  const list = G.s.notifs.slice(0, 40);
  el.innerHTML = `<div class="shade-head"><b>${U.time(G.s.t)}</b> <span>${U.dateLong(G.s.t)}</span><button class="link" onclick="G.s.notifs=[];OS.closeShade();OS.updateStatus()">Fjern alle</button></div>
    <div class="shade-list">${list.length ? list.map(n => { const a = Apps[n.app] || { icon: '🔔', bg: '#555', name: '' }; return `<div class="nt ${n.read ? '' : 'unread'}" onclick="OS.open('${n.app}')"><div class="bn-ico" style="background:${a.bg}">${a.icon}</div><div><div class="bn-app">${a.name} · ${U.dt(n.t)}</div><b>${U.esc(n.title)}</b><div>${U.esc(n.text)}</div></div></div>`; }).join('') : '<p class="empty">Ingen varsler</p>'}</div>
    <div class="shade-grip" onclick="OS.closeShade()">⌃</div>`;
  el.classList.remove('hidden');
  G.s.notifs.forEach(n => n.read = true);
  OS.updateStatus();
};
OS.closeShade = () => U.$('#shade').classList.add('hidden');

OS.modal = function (html, locked) {
  const el = U.$('#modal'); OS.modalLocked = !!locked;
  el.innerHTML = `<div class="modal-bg" onclick="${locked ? '' : 'OS.closeModal()'}"></div><div class="modal-card">${html}</div>`;
  el.classList.remove('hidden');
};
OS.closeModal = () => { U.$('#modal').classList.add('hidden'); OS.modalLocked = false; };
OS.confirm = function (text, yesLabel, onYes) {
  OS._confirmFn = onYes;
  OS.modal(`<p>${text}</p><div class="row-btns"><button class="btn" onclick="OS.closeModal()">Avbryt</button><button class="btn primary" onclick="OS.closeModal();OS._confirmFn()">${yesLabel}</button></div>`);
};
OS.toast = function (msg, ms = 2600) {
  const el = U.$('#toast'); el.innerHTML = msg; el.classList.remove('hidden'); el.classList.add('show');
  clearTimeout(OS._tt); OS._tt = setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.classList.add('hidden'), 300); }, ms);
};
OS.achToast = function (a) { setTimeout(() => OS.toast(`<span class="ach-t">${a[0]}</span><div><small>Trofé låst opp!</small><br><b>${a[1]}</b></div>`, 3500), 400); };

// Felles header for apper
OS.header = function (title, opts = {}) {
  const back = `<button class="hbtn" onclick="OS.back()">‹</button>`;
  return `<div class="app-head ${opts.cls || ''}" style="${opts.style || ''}">${back}<div class="ah-title">${title}</div>${opts.right || '<span class="hbtn"></span>'}</div>`;
};
