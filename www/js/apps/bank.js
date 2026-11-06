// ===== SpareMinus nettbank + Klarnå =====
Apps.bank = {
  name: 'SpareMinus', icon: '<span class="txt" style="font-size:20px">S−</span>', bg: 'linear-gradient(135deg,#0f4c5c,#1a7f8e)',
  badge: () => G.s.bank.checking < 0 ? 1 : 0, views: {},
};
const B = Apps.bank.views;
const ACCT = { checking: 'Brukskonto', savings: 'Sparekonto', card: 'Kredittkort' };

B.main = function () {
  const b = G.s.bank;
  const tx = b.tx.slice(0, 25);
  return OS.header('SpareMinus', { right: `<button class="hbtn" onclick="OS.go('stats')">📊</button>` }) + `<div class="app-body">
    <div class="bank-hero"><small>Disponibelt på brukskonto</small><div class="big ${b.checking < 0 ? 'red' : ''}" style="${b.checking < 0 ? 'color:#ffb3b3' : ''}">${U.kr2(b.checking)}</div></div>
    <div class="qa"><button onclick="OS.go('transfer')"><span>↔️</span>Overfør</button><button onclick="OS.go('paycard')"><span>💳</span>Betal kort</button><button onclick="OS.go('loan')"><span>🏧</span>Søk lån</button><button onclick="OS.go('score')"><span>📈</span>Kreditt</button></div>
    <div class="section-t">Kontoer</div>
    <div class="list">
      <div class="li" onclick="OS.go('acct',{a:'checking'})"><div class="inv-ico" style="background:#e3f2f4">🏦</div><div class="grow"><div class="t1">Brukskonto</div><div class="t2">3201.24.56789</div></div><b class="${b.checking < 0 ? 'red' : ''}">${U.kr(b.checking)}</b></div>
      <div class="li" onclick="OS.go('acct',{a:'savings'})"><div class="inv-ico" style="background:#e9f6ea">🐷</div><div class="grow"><div class="t1">Sparekonto</div><div class="t2">3,0 % rente</div></div><b>${U.kr(b.savings)}</b></div>
      <div class="li" onclick="OS.go('acct',{a:'card'})"><div class="inv-ico" style="background:#f3e9f7">💎</div><div class="grow"><div class="t1">Kredittkort Visa</div><div class="t2">Disponibelt ${U.kr(G.cardAvail())} av ${U.kr(b.card.limit)}</div></div><b class="${b.card.owed > 0 ? 'red' : ''}">${b.card.owed > 0 ? '−' : ''}${U.kr(b.card.owed)}</b></div>
      ${b.loans.map(l => `<div class="li" onclick="OS.go('loanview',{id:'${l.id}'})"><div class="inv-ico" style="background:#fdeaea">📄</div><div class="grow"><div class="t1">Forbrukslån ${l.id}</div><div class="t2">${l.rate.toFixed(1).replace('.', ',')} % · ${U.kr(l.monthly)}/mnd · ${l.left} terminer igjen</div></div><b class="red">−${U.kr(l.balance)}</b></div>`).join('')}
    </div>
    <div class="list"><div class="li" onclick="OS.go('subs')"><div class="inv-ico" style="background:#fff3e0">🔁</div><div class="grow"><div class="t1">Faste trekk og abonnementer</div><div class="t2">Husleie, strøm, strømmetjenester${(G.s.subs || []).length ? ', ' + G.s.subs.map(s => s.name).join(', ') : ''}</div></div>›</div></div>
    <div class="section-t">Siste transaksjoner</div>
    <div class="list">${tx.length ? tx.map(Apps.bank.txHTML).join('') : '<div class="empty">Ingen transaksjoner ennå</div>'}</div>
    <div style="height:20px"></div></div>`;
};
B.main.live = true;
Apps.bank.txHTML = (x) => `<div class="tx"><div><div>${U.esc(x.text)}</div><div class="d">${U.dt(x.t)} · ${ACCT[x.acct]}</div></div><div class="a ${x.amount > 0 ? 'green' : ''}">${x.amount > 0 ? '+' : ''}${U.kr2(x.amount)}</div></div>`;

B.acct = function ({ a }) {
  const list = G.s.bank.tx.filter(x => x.acct === a);
  const bal = a === 'checking' ? G.s.bank.checking : a === 'savings' ? G.s.bank.savings : -G.s.bank.card.owed;
  return OS.header(ACCT[a]) + `<div class="app-body"><div class="bank-hero"><small>Saldo</small><div class="big">${U.kr2(bal)}</div></div>
    <div class="list" style="margin-top:12px">${list.length ? list.map(Apps.bank.txHTML).join('') : '<div class="empty">Ingen transaksjoner</div>'}</div></div>`;
};

B.transfer = function () {
  return OS.header('Overføring') + `<div class="app-body"><div class="pad">
    <label class="lbl">Fra</label><select class="inp" id="t-from"><option value="checking">Brukskonto (${U.kr(G.s.bank.checking)})</option><option value="savings">Sparekonto (${U.kr(G.s.bank.savings)})</option></select>
    <label class="lbl">Til</label><select class="inp" id="t-to"><option value="savings">Sparekonto</option><option value="checking">Brukskonto</option></select>
    <label class="lbl">Beløp</label><input class="inp" id="t-amt" type="number" inputmode="decimal" placeholder="0">
    <button class="btn primary block" style="background:#0f4c5c" onclick="Apps.bank.doTransfer()">Overfør</button></div></div>`;
};
Apps.bank.doTransfer = function () {
  const f = U.$('#t-from').value, t = U.$('#t-to').value, a = parseFloat(U.$('#t-amt').value);
  if (!(a > 0) || f === t) return OS.toast('Ugyldig overføring');
  const bal = f === 'checking' ? G.s.bank.checking : G.s.bank.savings;
  if (bal < a) return OS.toast('Ikke dekning');
  G.tx(f, -a, 'Overføring til ' + ACCT[t]); G.tx(t, a, 'Overføring fra ' + ACCT[f]);
  if (G.s.bank.savings >= 50000) G.ach('saver');
  OS.toast('Overført ' + U.kr(a)); OS.back();
};
B.paycard = function () {
  const o = G.s.bank.card.owed;
  return OS.header('Betal kredittkort') + `<div class="app-body"><div class="pad">
    <div class="card" style="margin:0 0 10px"><div class="kv"><span>Utestående</span><b>${U.kr2(o)}</b></div><div class="kv"><span>Rente</span><span>23,4 % nominelt</span></div><div class="kv"><span>Minstebeløp</span><span>${U.kr(Math.min(o, Math.max(300, o * 0.03)))}</span></div></div>
    <label class="lbl">Beløp</label><input class="inp" id="c-amt" type="number" inputmode="decimal" value="${Math.ceil(o)}">
    <button class="btn primary block" style="background:#0f4c5c" onclick="Apps.bank.doPayCard()" ${o <= 0 ? 'disabled' : ''}>Betal fra brukskonto</button></div></div>`;
};
Apps.bank.doPayCard = function () {
  const a = Math.min(parseFloat(U.$('#c-amt').value), G.s.bank.card.owed);
  if (!(a > 0)) return OS.toast('Ugyldig beløp');
  if (G.s.bank.checking < a) return OS.toast('Ikke dekning');
  G.tx('checking', -a, 'Innbetaling kredittkort'); G.tx('card', a, 'Innbetaling');
  if (G.totalDebt() <= 0.5) G.ach('debtfree');
  OS.toast('Betalt ' + U.kr(a)); OS.back();
};

B.loan = function () {
  const max = G.loanMax();
  const rate = G.loanRate();
  if (max < 10000) return OS.header('Forbrukslån') + `<div class="app-body"><div class="pad" style="text-align:center"><div style="font-size:50px">🙅</div><h3>Søknaden kan ikke innvilges</h3><p>Kredittscoren din (${G.s.credit}) er for lav. Selv vi har grenser. Ikke mange, men noen.</p></div></div>`;
  const amt = Apps.bank.la || Math.min(50000, max), m = Apps.bank.lm || 60;
  const mon = G.annuity(amt, rate, m) + 50;
  const eff = (Math.pow(1 + (rate / 100 + 0.006) / 12, 12) - 1) * 100;
  return OS.header('Forbrukslån') + `<div class="app-body"><div class="pad">
    <div class="card" style="margin:0 0 12px;background:#0f4c5c;color:#fff"><b>Penger på konto i dag! 💸</b><div style="font-size:13px;opacity:.85">Du er forhåndsgodkjent for inntil ${U.kr(max)}.</div></div>
    <label class="lbl">Lånebeløp: <b>${U.kr(amt)}</b></label><input class="range" type="range" min="10000" max="${max}" step="5000" value="${amt}" oninput="Apps.bank.la=+this.value;OS.render(true)">
    <label class="lbl">Nedbetalingstid: <b>${m / 12} år</b></label><input class="range" type="range" min="12" max="180" step="12" value="${m}" oninput="Apps.bank.lm=+this.value;OS.render(true)">
    <div class="card" style="margin:12px 0"><div class="kv"><span>Nominell rente</span><span>${rate.toFixed(1).replace('.', ',')} %</span></div><div class="kv"><span>Effektiv rente</span><span>${eff.toFixed(1).replace('.', ',')} %</span></div><div class="kv"><span>Termingebyr</span><span>50 kr/mnd</span></div><div class="kv"><span>Månedlig beløp</span><b>${U.kr(mon)}</b></div><div class="kv"><span>Totalt å betale</span><b class="red">${U.kr(mon * m)}</b></div></div>
    <button class="btn primary block" style="background:#0f4c5c" onclick="Apps.bank.applyLoan(${amt},${m})">Søk nå – svar på sekunder</button>
    <p class="small" style="text-align:center">Lån er dyrt. Det står med liten skrift fordi vi helst vil at du ikke leser det.</p></div></div>`;
};
Apps.bank.applyLoan = function (a, m) {
  OS.modal(`<div class="processing"><div class="spinner"></div><b>Vurderer søknaden…</b><p class="small">Sjekker gjeldsregisteret (ser bort)</p></div>`, true);
  setTimeout(() => { G.takeLoan(a, m); OS.closeModal(); Apps.bank.la = null; OS.toast('🎉 Lånet er innvilget og utbetalt!'); OS.replace('main'); }, 1600);
};
B.loanview = function ({ id }) {
  const l = G.s.bank.loans.find(x => x.id === id); if (!l) return OS.header('Lån') + '<div class="empty">Lånet er innfridd 🎉</div>';
  return OS.header('Lån ' + l.id) + `<div class="app-body"><div class="card"><div class="kv"><span>Opprinnelig beløp</span><span>${U.kr(l.amount)}</span></div><div class="kv"><span>Restgjeld</span><b class="red">${U.kr(l.balance)}</b></div><div class="kv"><span>Rente</span><span>${l.rate.toFixed(1).replace('.', ',')} %</span></div><div class="kv"><span>Terminbeløp</span><span>${U.kr(l.monthly)}</span></div><div class="kv"><span>Neste trekk</span><span>${U.dateLong(l.next)}</span></div><div class="kv"><span>Terminer igjen</span><span>${l.left}</span></div></div>
    <div class="pad"><button class="btn primary block" style="background:#0f4c5c" onclick="Apps.bank.repay('${l.id}')" ${G.s.bank.checking < l.balance ? 'disabled' : ''}>Innfri lånet (${U.kr(l.balance)})</button>${G.s.bank.checking < l.balance ? '<p class="small" style="text-align:center">Ikke nok penger på brukskontoen. Overraskende.</p>' : ''}</div></div>`;
};
Apps.bank.repay = function (id) {
  const l = G.s.bank.loans.find(x => x.id === id);
  G.tx('checking', -l.balance, 'Innfrielse lån ' + l.id);
  G.s.bank.loans = G.s.bank.loans.filter(x => x.id !== id);
  G.creditDelta(25); if (G.totalDebt() <= 0.5) G.ach('debtfree');
  OS.toast('Lånet er innfridd 🎉'); OS.back();
};

B.score = function () {
  const s = G.s.credit, pos = (s - 300) / 6;
  const lbl = s >= 780 ? 'Utmerket' : s >= 680 ? 'God' : s >= 580 ? 'Middels' : s >= 480 ? 'Svak' : 'Svært svak';
  return OS.header('Kredittscore') + `<div class="app-body"><div class="card score"><div class="small">Din kredittscore</div><div class="num">${s}</div><b>${lbl}</b><div class="meter"><i style="left:${pos}%"></i></div><div class="small" style="display:flex;justify-content:space-between"><span>300</span><span>900</span></div></div>
    <div class="card"><div class="kv"><span>Total gjeld</span><b>${U.kr(G.totalDebt())}</b></div><div class="kv"><span>Klarnå-ramme</span><span>${U.kr(G.klarnaLimit())}</span></div><div class="kv"><span>Maks forbrukslån</span><span>${U.kr(G.loanMax())}</span></div><div class="kv"><span>Lånerente du får</span><span>${G.loanRate().toFixed(1).replace('.', ',')} %</span></div></div>
    <div class="card small">Scoren går ned når du tar opp lån, betaler for sent eller får inkasso, og opp når du betaler i tide og nedbetaler gjeld.</div></div>`;
};
B.score.live = true;

B.subs = function () {
  const fixed = [['Husleie – Utleiegården AS', '9 800 kr', 'den 1.'], ['Strøm – Dyrkraft', '1 100–2 900 kr', 'den 1.'], ['Mobil – Telenei', '449 kr', 'den 1.'], ['Strømmetjenester', '689 kr', 'den 1.'], ['Innboforsikring', '289 kr', 'den 1.'], ['Treningssenter', '549 kr', 'den 12.'], ['Lønn inn', '+32 480 kr', 'den 20.']];
  return OS.header('Faste trekk') + `<div class="app-body"><div class="list">${fixed.map(([a, b, c]) => `<div class="li"><div class="grow"><div class="t1">${a}</div><div class="t2">AvtaleGiro ${c}</div></div><b>${b}</b></div>`).join('')}</div>
    <div class="section-t">Abonnementer du har tegnet</div>
    <div class="list">${(G.s.subs || []).length ? G.s.subs.map((s, i) => `<div class="li"><div class="grow"><div class="t1">${s.name}</div><div class="t2">${U.kr(s.price)}/mnd · ${G.s.t < s.start ? 'gratis prøveperiode til ' + U.date(s.start) : 'trekkes den ' + s.day + '.'}</div></div><button class="btn sm danger" onclick="Apps.bank.cancelSub(${i})">Si opp</button></div>`).join('') : '<div class="empty">Ingen abonnementer. Imponerende.</div>'}</div></div>`;
};
Apps.bank.cancelSub = function (i) {
  const s = G.s.subs[i];
  OS.confirm(`Er du sikker på at du vil si opp ${s.name}? Du mister tilgang til fordeler du aldri har brukt.`, 'Ja, si opp', () => {
    OS.confirm('Helt sikker? Vi kan tilby deg 1 måned for halv pris!', 'Si opp likevel', () => {
      G.s.subs.splice(i, 1); OS.toast('Abonnementet er sagt opp. Vi savner deg allerede.'); OS.render();
    });
  });
};

B.stats = function () {
  const st = G.s.stats;
  return OS.header('Statistikk') + `<div class="app-body"><div class="statgrid">
    <div><small>Totalt handlet</small><b>${U.kr(st.spent)}</b></div><div><small>Bestillinger</small><b>${st.orders}</b></div>
    <div><small>Gebyrer og renter</small><b class="red">${U.kr(st.fees)}</b></div><div><small>Ting mottatt</small><b>${st.items}</b></div>
    <div><small>Total gjeld</small><b class="red">${U.kr(G.totalDebt())}</b></div><div><small>Nettoformue</small><b class="${G.netWorth() < 0 ? 'red' : 'green'}">${U.kr(G.netWorth())}</b></div>
    <div><small>Returer</small><b>${st.returns}</b></div><div><small>Solgt på Funn</small><b>${st.sold}</b></div>
    <div><small>Svindelofre</small><b>${st.scams}×</b></div><div><small>Chattet med PostNei</small><b>${st.chatMsgs} mld</b></div>
  </div></div>`;
};

// ---------- Klarnå ----------
Apps.klarna = {
  name: 'Klarnå', icon: '<span class="txt" style="color:#111;font-size:22px">K.</span>', bg: '#ffb3c7',
  badge: () => G.s.klarna.items.reduce((a, it) => a + it.schedule.filter(x => !x.paid && x.due < G.s.t + 3 * U.DAY).length, 0),
  views: {},
};
const K = Apps.klarna.views;
Apps.klarna.TYPE = { invoice: 'Faktura 14 dager', invoice30: 'Betal om 30 dager', split3: 'Del opp i 3', finance: 'Finansiering' };
K.main = function () {
  const out = G.klarnaOutstanding();
  const items = G.s.klarna.items;
  const active = items.filter(it => it.schedule.some(x => !x.paid));
  const done = items.filter(it => !it.schedule.some(x => !x.paid)).slice(0, 20);
  const next = [];
  active.forEach(it => it.schedule.forEach((x, i) => { if (!x.paid) next.push({ it, x, i }); }));
  next.sort((a, b) => a.x.due - b.x.due);
  const lim = G.klarnaLimit();
  return OS.header('<span class="klarna-logo">Klarnå.</span>') + `<div class="app-body">
    <div class="klarna-hero"><div class="small" style="color:#333">Du skylder</div><div class="big">${U.kr(out)}</div><div style="font-size:13px">Tilgjengelig kjøpekraft: <b>${U.kr(Math.max(0, lim - out))}</b> 💗</div></div>
    ${next.length ? `<div class="section-t">Kommende betalinger</div><div class="card">${next.slice(0, 8).map(({ it, x, i }) => Apps.klarna.instHTML(it, x, i)).join('')}</div>` : '<div class="card" style="text-align:center"><div style="font-size:40px">🌸</div><b>Ingen betalinger!</b><div class="small">Det er jo trist. Gå og shopp litt?</div></div>'}
    ${active.length ? `<div class="section-t">Aktive kjøp</div><div class="list">${active.map(Apps.klarna.itemLi).join('')}</div>` : ''}
    ${done.length ? `<div class="section-t">Betalte kjøp</div><div class="list">${done.map(Apps.klarna.itemLi).join('')}</div>` : ''}
    <div class="card small">💗 Klarnå er rentefritt*.<br>*unntatt finansiering, purregebyrer, fakturagebyrer, utsettelsesgebyrer, inkassosalærer og andre ting.</div>
    <div style="height:20px"></div></div>`;
};
K.main.live = true;
Apps.klarna.itemLi = (it) => `<div class="li" onclick="OS.go('item',{id:'${it.id}'})"><div class="inv-ico" style="background:#ffe3ec">🛍️</div><div class="grow"><div class="t1">${G.SHOPS[it.shop] ? G.SHOPS[it.shop].name : '?'}</div><div class="t2">${Apps.klarna.TYPE[it.type]} · ${U.date(it.created)}</div></div><b>${U.kr(it.total)}</b></div>`;
Apps.klarna.instHTML = function (it, x, i) {
  const late = !x.paid && x.due < G.s.t;
  const lvl = x.level ? `<span class="lvl lvl${x.level}">${['', 'PURRING', 'INKASSOVARSEL', 'INKASSO'][x.level]}</span> ` : '';
  return `<div class="inst"><div style="min-width:0"><div>${lvl}<b>${U.kr(x.amount + (x.fees || 0))}</b> · ${G.SHOPS[it.shop] ? G.SHOPS[it.shop].name : ''}</div><div class="small ${late ? 'red' : ''}">${x.paid ? 'Betalt ' + U.date(x.paidAt) : (late ? 'Forfalt ' : 'Forfaller ') + U.dateLong(x.due)}${x.fees ? ` · gebyrer ${U.kr(x.fees)}` : ''}</div></div>
    ${x.paid ? '<span class="status-pill done">✓</span>' : `<div style="display:flex;gap:6px;flex-shrink:0">${!x.postponed && !x.level ? `<button class="btn sm" onclick="Apps.klarna.postpone('${it.id}',${i})">Utsett</button>` : ''}<button class="btn sm" style="background:#111;color:#fff" onclick="Apps.klarna.pay('${it.id}',${i})">Betal</button></div>`}</div>`;
};
K.item = function ({ id }) {
  const it = G.s.klarna.items.find(x => x.id === id);
  const o = G.order(it.orderId);
  return OS.header('Kjøp hos ' + (G.SHOPS[it.shop] ? G.SHOPS[it.shop].name : '')) + `<div class="app-body">
    <div class="card"><div class="kv"><span>Type</span><span>${Apps.klarna.TYPE[it.type]}${it.months ? ` (${it.months} mnd)` : ''}</span></div><div class="kv"><span>Kjøpsbeløp</span><b>${U.kr(it.total)}</b></div><div class="kv"><span>Totalt å betale</span><b>${U.kr(it.schedule.reduce((a, x) => a + x.amount + (x.fees || 0), 0))}</b></div><div class="kv"><span>Dato</span><span>${U.dt(it.created)}</span></div>
    ${o ? `<div style="margin-top:8px;font-size:14px">${o.lines.map(l => CATALOG.get(l.pid).emoji + ' ' + U.esc(CATALOG.get(l.pid).name)).join('<br>')}</div>` : ''}</div>
    <div class="card"><b>Betalingsplan</b>${it.schedule.map((x, i) => Apps.klarna.instHTML(it, x, i)).join('')}</div>
    ${it.schedule.filter(x => !x.paid).length > 1 ? `<div class="pad"><button class="btn block" style="background:#111;color:#fff" onclick="Apps.klarna.payAll('${it.id}')">Betal alt nå</button></div>` : ''}</div>`;
};
K.item.live = true;
Apps.klarna.pay = function (id, i) {
  if (!G.klarnaPay(id, i)) return OS.toast('Ikke nok penger på brukskontoen 😬');
  OS.toast('Betalt 💗'); OS.render(true);
};
Apps.klarna.payAll = function (id) {
  const it = G.s.klarna.items.find(x => x.id === id); let ok = true;
  it.schedule.forEach((x, i) => { if (!x.paid && ok) ok = G.klarnaPay(id, i); });
  OS.toast(ok ? 'Alt betalt 💗' : 'Ikke nok penger til alt'); OS.render(true);
};
Apps.klarna.postpone = function (id, i) {
  OS.confirm('Utsette betalingen med 30 dager for kun 39 kr? 💗', 'Utsett', () => { G.klarnaPostpone(id, i); OS.toast('Utsatt! Fremtidige-du takker (ikke).'); OS.render(true); });
};
