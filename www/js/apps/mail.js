// ===== E-post (Mæil) =====
Apps.mail = {
  name: 'Mæil', icon: '✉️', bg: 'linear-gradient(135deg,#ea4335,#c5221f)',
  badge: () => G.s.mail.filter(m => !m.read && m.cat === 'primary').length,
  views: {}, tab: 'primary',
};
const AVC = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac', '#f06292', '#7986cb'];
Apps.mail.av = (name) => `<div class="av" style="background:${AVC[(name || 'x').charCodeAt(0) % AVC.length]}">${(name || '?')[0]}</div>`;

Apps.mail.views.main = function () {
  const tab = Apps.mail.tab;
  const list = G.s.mail.filter(m => tab === 'all' ? m.cat !== 'spam' : m.cat === tab);
  const cnt = (c) => G.s.mail.filter(m => !m.read && m.cat === c).length;
  return OS.header('Innboks', { right: `<button class="hbtn" onclick="OS.go('compose')">✏️</button>` }) + `
    <div class="tabs">${[['primary', 'Primær'], ['promo', 'Kampanjer'], ['spam', 'Søppel'], ['all', 'Alle']].map(([k, v]) => `<button class="${tab === k ? 'on' : ''}" onclick="Apps.mail.tab='${k}';OS.render()">${v}${cnt(k) && k !== 'all' ? ` (${cnt(k)})` : ''}</button>`).join('')}</div>
    <div class="app-body">${list.length ? list.slice(0, 120).map(m => `<div class="mail-li ${m.read ? '' : 'unread'}" onclick="OS.go('read',{id:'${m.id}'})">${Apps.mail.av(m.fromName)}<div class="grow"><div class="r1"><b>${U.esc(m.fromName)}</b><span>${new Date(m.t).toDateString() === new Date(G.s.t).toDateString() ? U.time(m.t) : U.date(m.t)}</span></div><div class="subj">${U.esc(m.subject)}</div><div class="small" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${U.esc(m.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 90))}</div></div></div>`).join('') : '<div class="empty">Ingen e-post her 📭</div>'}
    ${list.length && tab !== 'spam' ? `<div class="pad"><button class="btn block" onclick="G.s.mail.forEach(m=>{if(${tab === 'all' ? 'true' : `m.cat==='${tab}'`})m.read=true});OS.render()">Merk alle som lest</button></div>` : ''}</div>`;
};
Apps.mail.views.main.live = true;

Apps.mail.views.read = function ({ id }) {
  const m = G.s.mail.find(x => x.id === id); if (!m) return OS.header('') + '<div class="empty">Slettet</div>';
  m.read = true;
  return OS.header('', { right: `<button class="hbtn" onclick="Apps.mail.del('${m.id}')">🗑️</button>` }) + `<div class="app-body"><div class="mail-view">
    <h2>${U.esc(m.subject)}</h2>
    <div class="mail-from">${Apps.mail.av(m.fromName)}<div><b>${U.esc(m.fromName)}</b> <span class="small">&lt;${U.esc(m.from)}&gt;</span><div class="small">til meg · ${U.dt(m.t)}</div></div></div>
    <div class="mail-body">${m.body}</div>
    ${m.action ? `<button class="btn primary block" style="margin-top:16px" onclick="${m.action.fn}">${m.action.label}</button>` : ''}
    ${m.cat !== 'spam' ? `<button class="btn block" style="margin-top:8px" onclick="Apps.mail.spam('${m.id}')">🚩 Rapporter som svindel/søppel</button>` : ''}
  </div></div>`;
};
Apps.mail.del = function (id) { G.s.mail = G.s.mail.filter(m => m.id !== id); OS.back(); };
Apps.mail.spam = function (id) {
  const m = G.s.mail.find(x => x.id === id); m.cat = 'spam';
  if (m.phish && !m.clicked) { G.ach('spotter'); OS.toast('🎣 Godt sett! Det var svindel.'); } else OS.toast('Flyttet til søppel');
  OS.back();
};
Apps.mail.phish = function (brand) {
  const m = G.s.mail.find(x => x.phish && x.fromName === brand && !x.clicked) || {};
  m.clicked = true;
  const dom = { PostNei: 'postnei-sporing.xyz/betal', SpareMinus: 'spareminus-bank.co/login', Skatteetaten: 'skatteetaten-no.info/refusjon', 'Klarnå': 'klarna-no.help/verify' }[brand] || 'sikker-side.ru';
  OS.modal(`<div class="fake-site"><div class="url">🔓 http://${dom}</div><h3 style="margin:4px 0">${brand}</h3><p style="font-size:14px">Bekreft kortinformasjonen din for å fortsette.</p>
    <label class="lbl">Kortnummer</label><input class="inp" placeholder="1234 5678 9012 3456" inputmode="numeric">
    <div style="display:flex;gap:8px"><div style="flex:1"><label class="lbl">Utløp</label><input class="inp" placeholder="MM/ÅÅ"></div><div style="flex:1"><label class="lbl">CVC</label><input class="inp" placeholder="123"></div></div>
    <label class="lbl">BankID-passord</label><input class="inp" type="password" placeholder="••••••">
    <button class="btn primary block" onclick="Apps.mail.phished()">Bekreft</button><button class="btn block" onclick="OS.closeModal();OS.toast('Lurt! Du lukket siden 👍')">Lukk siden</button></div>`);
};
Apps.mail.phished = function () {
  OS.modal(`<div class="processing"><div class="spinner"></div><b>Bekrefter…</b></div>`, true);
  setTimeout(() => {
    const loss = G.phished();
    OS.closeModal();
    OS.modal(`<div style="text-align:center"><div style="font-size:52px">🎣💸</div><h3>Du ble svindlet!</h3><p>Svindlerne tømte <b>${U.kr(loss)}</b> fra brukskontoen${G.cardAvail() > 0 ? ' og handlet gavekort på kredittkortet ditt' : ''}.</p><p class="small">Tips: Sjekk alltid avsenderadressen. Ekte firmaer ber aldri om kortinfo eller passord på e-post.</p><button class="btn primary block" onclick="OS.closeModal();OS.open('bank')">Åpne nettbanken</button></div>`);
    setTimeout(() => G.mail({ from: 'sikkerhet@spareminus.no', fromName: 'SpareMinus', subject: 'Mistenkelige transaksjoner på kontoen din', cat: 'primary', body: '<p>Vi har registrert uvanlige transaksjoner på kontoen din. Dessverre godkjente du dem selv, så vi kan ikke hjelpe deg.</p><p>Vi anbefaler at du ikke gjør det igjen.</p>' }), 2500);
  }, 1800);
};

Apps.mail.views.compose = function () {
  const opts = Object.entries(G.SHOPS).filter(([k]) => k !== 'funn').map(([k, s]) => [s.mail, s.name]).concat([['kundeservice@postnei.no', 'PostNei'], ['hei@klarna.no', 'Klarnå'], ['post@spareminus.no', 'SpareMinus'], ['mamma@epost.no', 'Mamma']]);
  return OS.header('Ny e-post', { right: `<button class="hbtn" onclick="Apps.mail.sendMail()">➤</button>` }) + `<div class="app-body"><div class="pad">
    <label class="lbl">Til</label><select class="inp" id="m-to">${opts.map(([a, n]) => `<option value="${a}|${n}">${n} &lt;${a}&gt;</option>`).join('')}</select>
    <label class="lbl">Emne</label><input class="inp" id="m-subj" placeholder="Emne">
    <label class="lbl">Melding</label><textarea class="inp" id="m-body" rows="8" placeholder="Skriv her…"></textarea>
    <button class="btn primary block" onclick="Apps.mail.sendMail()">Send</button></div></div>`;
};
Apps.mail.sendMail = function () {
  const [addr, name] = U.$('#m-to').value.split('|');
  const subj = U.$('#m-subj').value || '(uten emne)';
  OS.back(); OS.toast('E-post sendt ✉️');
  const reply = name === 'Mamma'
    ? U.pick(['Hei vennen! Har du husket å spise? Og har du spart noe i år? Klem mamma', 'Så hyggelig å høre fra deg! Pappa lurer på om du har betalt den regningen. Klem', 'Hei! Jeg så at du har kjøpt mye på nett i det siste. Er alt bra? Mamma 💕'])
    : name === 'Klarnå' ? 'Hei! 💗 Takk for at du kontakter oss! Har du vurdert å utsette betalingen? Med vennlig hilsen Klarnå-teamet'
      : `Takk for din henvendelse om «${U.esc(subj)}». Vi har stor pågang og saksbehandlingstiden er for øyeblikket 6–8 uker. Dette er et automatisk svar. Vennligst ikke svar på denne e-posten, da den ikke blir lest. Svar på e-poster vi sender senere blir heller ikke lest.`;
  const at = G.s.t;
  setTimeout(() => G.mail({ from: addr, fromName: name, subject: 'SV: ' + subj, cat: 'primary', body: `<p>${reply}</p>` }), name === 'Mamma' ? 6000 : 1500);
};
