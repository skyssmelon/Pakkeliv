// ===== Spillmotor: tilstand, klokke, økonomi, frakt, hendelser =====
const G = {};
G.SAVE_KEY = 'netthandel-sim-save-v1';
G.START = new Date(2026, 10, 6, 8, 0, 0).getTime();

G.SHOPS = {
  amazoom: { name: 'Amazoom', mail: 'ordre@amazoom.no', color: '#232f3e', accent: '#ff9900', logo: 'amazoom', freeOver: 499, ship: 59 },
  zalandoo: { name: 'Zalandoo', mail: 'service@zalandoo.no', color: '#ffffff', accent: '#ff6900', logo: 'zalandoo', freeOver: 0, ship: 0 },
  elkjopt: { name: 'Elkjøpt', mail: 'kundeservice@elkjopt.no', color: '#0b3d91', accent: '#ffd400', logo: 'elkjopt', freeOver: 1000, ship: 99 },
  funn: { name: 'Funn-selger', mail: 'noreply@funn.no', color: '#0063fb', accent: '#fff', freeOver: 0, ship: 0 },
  taemu: { name: 'Tæmu', mail: 'no-reply@taemu.com', color: '#fb7701', accent: '#ffffff', logo: 'taemu', freeOver: 0, ship: 0 },
};

G.PICKUP = ['Kiwi Storgata', 'Rema 1000 Sentrum', 'Coop Extra Torget', 'Narvesen Jernbanen', 'Pakkeautomat Kjøpesenteret (bak søppelkassene)', 'Bunnpris Bryggen', 'Joker Industrigata 42', 'Shell Kvernhusvegen'];
G.ORIGIN_ROUTE = {
  NO: [['Ankommet terminal Oslo (Alnabru)', 'Oslo']],
  SE: [['Sendingen er hentet hos avsender', 'Jönköping, Sverige'], ['Ankommet terminal Malmö', 'Malmö, Sverige'], ['Krysset grensen ved Svinesund', 'Svinesund']],
  DE: [['Sendingen er hentet hos avsender', 'Erfurt, Tyskland'], ['Under transport gjennom Danmark', 'Padborg, Danmark'], ['Ankommet Norge', 'Langhus terminal']],
  PL: [['Sendingen er hentet hos avsender', 'Szczecin, Polen'], ['Ankommet sorteringssenter', 'Malmö, Sverige'], ['Ankommet Norge', 'Langhus terminal']],
  NL: [['Sendingen er hentet hos avsender', 'Tilburg, Nederland'], ['Under transport', 'Hamburg, Tyskland'], ['Ankommet Norge', 'Langhus terminal']],
  CN: [['Avsender har opprettet sendingen', 'Shenzhen, Kina'], ['Ankommet utvekslingskontor', 'Shenzhen, Kina'], ['Avgått fra flyplass', 'Hong Kong'], ['Ankommet transittland', 'Liège, Belgia'], ['Ankommet tollsted', 'Oslo lufthavn']],
};

G.newState = function () {
  return {
    v: 1, t: G.START, speed: 4, created: Date.now(),
    lastDay: new Date(G.START).toDateString(),
    bank: {
      checking: 8450, savings: 2000,
      card: { limit: 25000, owed: 0 },
      loans: [], tx: [], remarks: 0,
    },
    klarna: { items: [] },
    credit: 680,
    orders: [], shipments: [], inventory: [], mail: [], notifs: [], deals: {},
    cart: { amazoom: [], zalandoo: [], elkjopt: [], taemu: [] },
    chat: { msgs: [], agent: null, queue: 0, count: 0, ended: false },
    funn: { listings: [] },
    ach: {}, stats: { spent: 0, orders: 0, fees: 0, chatMsgs: 0, scams: 0, items: 0, sold: 0, returns: 0 },
    coupons: [], subs: [], seenWelcome: false, seq: 1000,
  };
};

G.load = function () {
  try {
    const raw = localStorage.getItem(G.SAVE_KEY);
    if (raw) { G.s = JSON.parse(raw); return true; }
  } catch (e) { console.warn(e); }
  G.s = G.newState();
  G.welcome();
  return false;
};
G.save = function () { try { localStorage.setItem(G.SAVE_KEY, JSON.stringify(G.s)); } catch (e) { } };
G.reset = function () { localStorage.removeItem(G.SAVE_KEY); G.s = G.newState(); G.welcome(); G.save(); };
G.nid = (p = '') => p + (++G.s.seq);

// ---------- Tid ----------
G.now = () => G.s.t;
G.tick = function (ms) {
  const target = G.s.t + ms;
  // Behandle i steg på maks 30 min for riktig rekkefølge
  while (G.s.t < target) {
    const step = Math.min(30 * U.MIN, target - G.s.t);
    const prevHour = new Date(G.s.t).getHours();
    G.s.t += step;
    G.processShipments();
    const d = new Date(G.s.t);
    if (d.toDateString() !== G.s.lastDay) { G.s.lastDay = d.toDateString(); G.daily(); }
    if (d.getHours() !== prevHour) G.hourly(d.getHours());
  }
};
G.sleep = function () {
  const d = new Date(G.s.t);
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (d.getHours() >= 7 ? 1 : 0), 7, 0, 0).getTime();
  G.tick(next - G.s.t);
};

// ---------- Priser ----------
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
G.season = function (t = G.s.t) {
  const d = new Date(t), m = d.getMonth(), day = d.getDate();
  if (m === 10 && day === 11) return 'singles';
  if (m === 10 && day >= 16 && day <= 22) return 'preblack';
  if (m === 10 && day >= 23 && day <= 30) return 'blackweek';
  if (m === 11 && day >= 26 && day <= 31) return 'mellomjul';
  return null;
};
G.priceInfo = function (p) {
  const deal = G.s.deals[p.id];
  if (deal && deal.until > G.s.t) return { price: deal.price, old: Math.max(p.old || 0, p.price), deal: true, label: deal.label || 'Nyhetsbrev-pris' };
  const s = G.season(), h = hash(p.id);
  if (s === 'preblack' && h < 0.35) return { price: Math.round(p.price * 1.12 / 10) * 10 - 1, old: p.old };
  if (s === 'blackweek' && h < 0.45) {
    const pre = Math.round(p.price * 1.12 / 10) * 10 - 1;
    return { price: Math.round(p.price * (0.95 - h) / 10) * 10 - 1, old: pre, label: 'BLACK WEEK' };
  }
  if (s === 'singles' && (p.shop === 'taemu' || p.shop === 'zalandoo')) return { price: Math.round(p.price * 0.89), old: p.price, label: '11.11' };
  if (s === 'mellomjul' && h < 0.3) return { price: Math.round(p.price * 0.7 / 10) * 10 - 1, old: p.price, label: 'MELLOMSALG' };
  return { price: p.price, old: p.old };
};
G.price = (p) => G.priceInfo(p).price;

// ---------- Bank ----------
G.tx = function (acct, amount, text) {
  if (acct === 'checking') G.s.bank.checking += amount;
  else if (acct === 'savings') G.s.bank.savings += amount;
  else if (acct === 'card') G.s.bank.card.owed -= amount; // negativt beløp = kjøp
  G.s.bank.tx.unshift({ t: G.s.t, acct, amount, text });
  if (G.s.bank.tx.length > 400) G.s.bank.tx.length = 400;
};
G.cardAvail = () => G.s.bank.card.limit - G.s.bank.card.owed;
G.totalDebt = function () {
  return G.s.bank.card.owed + G.s.bank.loans.reduce((a, l) => a + l.balance, 0) + G.klarnaOutstanding();
};
G.netWorth = () => G.s.bank.checking + G.s.bank.savings - G.totalDebt();
G.creditDelta = function (d, why) {
  G.s.credit = Math.max(300, Math.min(900, G.s.credit + d));
  if (G.s.credit < 500) G.ach('lowcredit');
};
G.klarnaLimit = () => Math.max(0, Math.round((G.s.credit - 420) * 60 / 500) * 500);
G.loanRate = () => Math.max(9.9, Math.min(29.9, 29.9 - (G.s.credit - 450) * 0.05));
G.loanMax = () => Math.max(0, Math.round((G.s.credit - 450) * 1500 / 10000) * 10000);

G.annuity = (P, yearRate, months) => { const r = yearRate / 100 / 12; return r === 0 ? P / months : P * r / (1 - Math.pow(1 + r, -months)); };

G.takeLoan = function (amount, months) {
  const rate = Math.round(G.loanRate() * 10) / 10;
  const monthly = Math.round(G.annuity(amount, rate, months) + 50);
  const d = new Date(G.s.t);
  const loan = { id: G.nid('L'), amount, balance: amount, rate, months, monthly, left: months, created: G.s.t, next: new Date(d.getFullYear(), d.getMonth() + 1, 20).getTime() };
  G.s.bank.loans.push(loan);
  G.tx('checking', amount, 'Utbetaling forbrukslån ' + loan.id);
  G.creditDelta(-35);
  G.mail({
    from: 'lan@spareminus.no', fromName: 'SpareMinus', subject: 'Gratulerer! Lånet ditt er innvilget 🎉', cat: 'primary',
    body: `<p>Hei!</p><p>Ditt forbrukslån på <b>${U.kr(amount)}</b> er innvilget og utbetalt til brukskontoen din. Det tok oss 3,2 sekunder å vurdere søknaden din. Vi så ikke så nøye etter.</p>
    <table class="mt"><tr><td>Nominell rente</td><td>${rate.toFixed(1).replace('.', ',')} %</td></tr><tr><td>Nedbetalingstid</td><td>${months} mnd</td></tr><tr><td>Månedsbeløp</td><td>${U.kr(monthly)}</td></tr><tr><td>Totalt å betale</td><td>${U.kr(monthly * months)}</td></tr></table>
    <p>Første trekk skjer den 20. neste måned. Kos deg med pengene – de er ikke dine!</p>`
  });
  G.ach('loan');
  return loan;
};

// ---------- Klarnå ----------
G.klarnaOutstanding = () => G.s.klarna.items.reduce((a, it) => a + it.schedule.filter(x => !x.paid).reduce((b, x) => b + x.amount + (x.fees || 0), 0), 0);
G.klarnaCreate = function (type, total, shop, orderId, months) {
  const t = G.s.t, sched = [];
  let fee = 0;
  if (type === 'invoice') { sched.push({ due: t + 14 * U.DAY, amount: total + 39, paid: false, fees: 0, level: 0 }); fee = 39; }
  else if (type === 'invoice30') { sched.push({ due: t + 30 * U.DAY, amount: total + 49, paid: false, fees: 0, level: 0 }); fee = 49; }
  else if (type === 'split3') { const a = Math.round(total / 3 * 100) / 100; for (let i = 1; i <= 3; i++) sched.push({ due: t + i * 30 * U.DAY, amount: a, paid: false, fees: 0, level: 0 }); }
  else if (type === 'finance') {
    const m = G.annuity(total, 24.9, months) + 39;
    for (let i = 1; i <= months; i++) sched.push({ due: t + i * 30 * U.DAY, amount: Math.round(m), paid: false, fees: 0, level: 0 });
  }
  const item = { id: G.nid('K'), type, total, shop, orderId, created: t, schedule: sched, months };
  G.s.klarna.items.unshift(item);
  G.ach('klarna');
  return item;
};
G.klarnaPay = function (itemId, idx) {
  const it = G.s.klarna.items.find(i => i.id === itemId); if (!it) return false;
  const x = it.schedule[idx]; if (!x || x.paid) return false;
  const amt = x.amount + (x.fees || 0);
  if (G.s.bank.checking < amt) return false;
  G.tx('checking', -amt, `Klarnå ${G.SHOPS[it.shop] ? G.SHOPS[it.shop].name : ''} ${it.id}`);
  x.paid = true; x.paidAt = G.s.t;
  if (x.level >= 3) G.creditDelta(10); else if (x.level === 0) G.creditDelta(3);
  if (G.totalDebt() <= 0.5 && G.s.stats.orders > 0) G.ach('debtfree');
  return true;
};
G.klarnaPostpone = function (itemId, idx) {
  const it = G.s.klarna.items.find(i => i.id === itemId); const x = it && it.schedule[idx];
  if (!x || x.paid || x.postponed) return false;
  x.due += 30 * U.DAY; x.fees = (x.fees || 0) + 39; x.postponed = true; G.s.stats.fees += 39; return true;
};
G.klarnaCancelOrder = function (orderId, amount) {
  // refusjon ved retur: reduser ubetalte avdrag
  let left = amount;
  G.s.klarna.items.filter(i => i.orderId === orderId).forEach(it => it.schedule.forEach(x => {
    if (!x.paid && left > 0) { const r = Math.min(x.amount, left); x.amount -= r; left -= r; if (x.amount <= 0.5) { x.paid = true; x.amount = 0; x.cancelled = true; } }
  }));
  return left; // det som ikke kunne trekkes fra
};

// ---------- Betaling ----------
G.pay = function (method, amount, text, shop, orderId, months) {
  if (method === 'debit') {
    if (G.s.bank.checking < amount) return { ok: false, msg: 'Betalingen ble avvist: Ikke dekning på brukskontoen.' };
    G.tx('checking', -amount, text); return { ok: true };
  }
  if (method === 'credit') {
    if (G.cardAvail() < amount) return { ok: false, msg: 'Kortet ble avvist: Kredittgrensen er nådd.' };
    G.tx('card', -amount, text); return { ok: true };
  }
  if (method.startsWith('klarna')) {
    const type = method.split(':')[1];
    if (G.klarnaOutstanding() + amount > G.klarnaLimit()) return { ok: false, msg: 'Klarnå kunne dessverre ikke godkjenne kjøpet. (Prøv et mindre beløp, eller et mindre ansvarlig selskap.)' };
    const it = G.klarnaCreate(type, amount, shop, orderId, months);
    return { ok: true, klarna: it };
  }
  return { ok: false, msg: 'Ukjent betalingsmetode' };
};

// ---------- Bestilling og frakt ----------
G.placeOrder = function (shopId, lines, opts) {
  const sub = lines.reduce((a, l) => a + l.price * l.qty, 0);
  const total = Math.round((sub + opts.shipping + (opts.extras || 0) - (opts.discount || 0)) * 100) / 100;
  const orderId = (shopId === 'taemu' ? 'PO-211-' : shopId === 'amazoom' ? '402-' : '') + U.digits(7);
  const res = G.pay(opts.method, total, `${G.SHOPS[shopId].name} ordre ${orderId}`, shopId, orderId, opts.months);
  if (!res.ok) return res;
  const order = { id: orderId, shop: shopId, lines, sub, shipping: opts.shipping, extras: opts.extras || 0, discount: opts.discount || 0, total, method: opts.method, t: G.s.t, delivery: opts.delivery, status: 'Behandles', shipmentId: null, returned: [] };
  G.s.orders.unshift(order);
  G.s.stats.spent += total; G.s.stats.orders++;
  G.ach('first'); if (G.s.stats.orders >= 10) G.ach('ten'); if (G.s.stats.orders >= 50) G.ach('fifty');
  if (G.s.stats.spent >= 10000) G.ach('spend10'); if (G.s.stats.spent >= 50000) G.ach('spend50'); if (G.s.stats.spent >= 250000) G.ach('spend250');
  if (total >= 20000) G.ach('bigspender');
  // E-post
  G.mailOrderConfirm(order);
  // Planlegg forsendelse
  const maxFrom = lines.map(l => CATALOG.get(l.pid)).reduce((acc, p) => (p.days[1] > acc.days[1] ? p : acc));
  G.createShipment(order, maxFrom.from, maxFrom.days, opts.delivery);
  return { ok: true, order };
};

G.createShipment = function (order, from, days, delivery) {
  const t0 = G.s.t;
  const prefix = from === 'CN' ? 'LP00' : '70730';
  const tracking = prefix + U.digits(from === 'CN' ? 10 : 12) + (from === 'CN' ? 'CN' : '');
  let dmin = days[0], dmax = days[1];
  if (delivery === 'express') { dmin = Math.max(1, dmin - 1); dmax = Math.max(1, Math.ceil(dmax / 2)); }
  const total = (dmin + Math.random() * (dmax - dmin)) * U.DAY;
  const plan = [];
  const sendAt = t0 + U.int(2, 18) * U.HOUR;
  plan.push({ at: t0 + U.int(5, 50) * U.MIN, text: 'Avsender har varslet oss om sendingen. Vi har ikke sett den ennå.', loc: '' });
  const route = G.ORIGIN_ROUTE[from] || G.ORIGIN_ROUTE.NO;
  const span = total * 0.75;
  route.forEach((r, i) => plan.push({ at: sendAt + (span * i / route.length), text: r[0], loc: r[1] }));
  let tEnd = sendAt + total;
  // Toll
  const customs = (from === 'CN' && Math.random() < 0.35) || (from !== 'NO' && Math.random() < 0.07);
  if (customs) {
    const fee = from === 'CN' ? U.pick([149, 189, 249]) : 189;
    plan.push({ at: sendAt + span * 0.92, text: `Sendingen er stoppet i tollen. Betal fortollingsgebyr på ${U.kr(fee)} i PostNei-appen for å få den videre.`, loc: 'Tollsted Oslo', hold: 'customs', fee });
  }
  // Uhell
  const r = Math.random();
  if (r < 0.12) { plan.push({ at: sendAt + span * 0.95, text: 'Sendingen ble feilsortert og er på vei til Hammerfest. Vi beklager ikke.', loc: 'Langhus terminal' }); plan.push({ at: sendAt + span * 0.95 + 2 * U.DAY, text: 'Sendingen er funnet og returnert fra Hammerfest', loc: 'Hammerfest' }); tEnd += 2.5 * U.DAY; }
  else if (r < 0.22) { plan.push({ at: sendAt + span * 0.97, text: 'Forsinkelse grunnet uforutsette hendelser (det var mandag).', loc: 'Terminal Bergen' }); tEnd += 1 * U.DAY; }
  else if (r < 0.28) { plan.push({ at: sendAt + span * 0.97, text: 'Sendingen ble skadet under transport, men vi sender den videre likevel.', loc: 'Terminal Bergen', damage: true }); }
  plan.push({ at: tEnd - 10 * U.HOUR, text: 'Ankommet lokal terminal', loc: 'Terminal Haugaland' });
  plan.push({ at: tEnd - 3 * U.HOUR, text: delivery === 'home' ? 'Sendingen er lastet på bil for utkjøring' : 'Under transport til hentested', loc: '' });
  let final;
  if (delivery === 'home') {
    if (Math.random() < 0.3) {
      plan.push({ at: tEnd, text: 'Vi forsøkte å levere sendingen, men du var ikke hjemme. (Sjåføren ringte ikke på.) Sendingen er sendt til hentested.', loc: '' });
      final = { at: tEnd + 4 * U.HOUR, text: 'Sendingen er klar for henting', status: 'ready' };
    } else final = { at: tEnd, text: U.pick(['Sendingen er levert på døra.', 'Sendingen er levert. Bildebevis: en busk.', 'Levert i postkassen (vi brettet den litt).']), status: 'delivered' };
  } else final = { at: tEnd, text: 'Sendingen er klar for henting', status: 'ready' };
  plan.push(final);
  plan.sort((a, b) => a.at - b.at);
  const sh = { id: tracking, orderId: order.id, shop: order.shop, from, events: [], plan, status: 'created', point: U.pick(G.PICKUP), pickupBy: null, created: t0, delivery, damaged: false, fee: 0, feePaid: true, hold: null, eta: tEnd, returnOf: null };
  G.s.shipments.unshift(sh);
  order.shipmentId = tracking;
  return sh;
};

G.processShipments = function () {
  const t = G.s.t;
  G.s.shipments.forEach(sh => {
    if (sh.status === 'picked' || sh.status === 'returned' || sh.status === 'delivered') return;
    // Henting utløpt
    if (sh.status === 'ready' && sh.pickupBy && t > sh.pickupBy) {
      sh.status = 'returned'; sh.events.unshift({ t, text: 'Sendingen ble ikke hentet og returneres til avsender. Returgebyr belastes.', loc: sh.point });
      G.notify('post', 'Pakke returnert', `Sendingen ${sh.id} ble ikke hentet i tide.`);
      G.refundOrder(sh.orderId, null, 199, 'Ikke hentet');
      return;
    }
    if (sh.hold === 'customs' && !sh.feePaid) return;
    while (sh.plan.length && sh.plan[0].at <= t) {
      const ev = sh.plan.shift();
      if (sh.hold && !sh.feePaid) { sh.plan.unshift(ev); break; }
      sh.events.unshift({ t: ev.at, text: ev.text, loc: ev.loc });
      if (sh.status === 'created') {
        sh.status = 'transit';
        if (!sh.returnOf) {
          const o = G.order(sh.orderId); if (o) o.status = 'Sendt';
          G.mailShipped(sh);
          G.notify('post', 'Ny sending på vei', `${G.SHOPS[sh.shop].name}: sporingsnummer ${sh.id}`);
        }
      }
      if (ev.damage) sh.damaged = true;
      if (ev.hold === 'customs') {
        sh.hold = 'customs'; sh.fee = ev.fee; sh.feePaid = false;
        G.notify('post', 'Handling kreves', `Betal fortollingsgebyr ${U.kr(ev.fee)} for sending ${sh.id}`);
        G.mail({ from: 'varsel@postnei.no', fromName: 'PostNei', subject: 'Din sending er stoppet i tollen', cat: 'primary', body: `<p>Sending <b>${sh.id}</b> er stoppet i tollen.</p><p>For at vi skal sende den videre må du betale fortollingsgebyr på <b>${U.kr(ev.fee)}</b> i PostNei-appen. Gebyret dekker kostnaden ved å kreve inn gebyret.</p>` });
        break;
      }
      if (ev.status === 'ready') {
        sh.status = 'ready'; sh.pickupBy = ev.at + 14 * U.DAY;
        const o = G.order(sh.orderId); if (o) o.status = 'Klar for henting';
        G.notify('post', 'Klar for henting 📦', `Sendingen fra ${G.SHOPS[sh.shop].name} kan hentes hos ${sh.point}`);
        G.mail({ from: 'varsel@postnei.no', fromName: 'PostNei', subject: 'Pakken din er klar for henting', cat: 'primary', body: `<p>Sending <b>${sh.id}</b> fra ${G.SHOPS[sh.shop].name} kan hentes hos:</p><p><b>${sh.point}</b></p><p>Hentefrist: ${U.dateLong(sh.pickupBy)}. Husk legitimasjon, tålmodighet og en positiv innstilling.</p>` });
      }
      if (ev.status === 'delivered') { G.deliver(sh); }
    }
  });
};

G.payCustoms = function (shId) {
  const sh = G.s.shipments.find(s => s.id === shId);
  if (!sh || sh.feePaid) return { ok: false };
  if (G.s.bank.checking < sh.fee) return { ok: false, msg: 'Ikke dekning på brukskontoen.' };
  G.tx('checking', -sh.fee, 'PostNei fortollingsgebyr ' + sh.id);
  sh.feePaid = true; sh.hold = null; G.s.stats.fees += sh.fee;
  sh.events.unshift({ t: G.s.t, text: 'Gebyr er betalt. Sendingen er frigitt fra tollen.', loc: 'Tollsted Oslo' });
  const now = G.s.t; sh.plan.forEach((p, i) => { if (p.at < now) p.at = now + (i + 1) * 3 * U.HOUR; });
  return { ok: true };
};

G.pickup = function (shId) {
  const sh = G.s.shipments.find(s => s.id === shId);
  if (!sh || sh.status !== 'ready') return;
  G.deliver(sh, true);
};

G.deliver = function (sh, picked) {
  sh.status = picked ? 'picked' : 'delivered';
  if (picked) sh.events.unshift({ t: G.s.t, text: U.pick(['Sendingen er utlevert. Den ansatte så misfornøyd ut.', 'Sendingen er utlevert til mottaker.', 'Utlevert. Det var 14 personer i kø foran deg.']), loc: sh.point });
  if (sh.returnOf) { G.finishReturn(sh); return; }
  const o = G.order(sh.orderId); if (!o) return;
  o.status = 'Levert';
  o.lines.forEach(l => {
    const p = CATALOG.get(l.pid);
    for (let i = 0; i < l.qty; i++) {
      let cond = o.shop === 'funn' ? 'Brukt' : sh.damaged && Math.random() < 0.6 ? 'Skadet i transport' : 'Ny';
      let note = '';
      if (p.shop === 'taemu' && Math.random() < 0.55) { note = U.pick(['Mye mindre enn på bildet.', 'Fargen var «nesten» riktig.', 'Lukter som et dekkverksted.', 'Manglet halve delene.', 'Bruksanvisningen var på et språk som ikke finnes.', 'Funker i ca. 4 minutter.', 'Ser ut som den er laget av lego-rester.']); G.ach('taemufail'); }
      if (p.sizes && p.shop === 'zalandoo' && Math.random() < 0.3) note = U.pick(['Passer ikke – for liten.', 'Passer ikke – altfor stor.', 'Fargen ser helt annerledes ut i virkeligheten.']);
      G.s.inventory.unshift({ uid: G.nid('I'), pid: l.pid, name: p.name, brand: p.brand, emoji: p.emoji, color: p.color || null, hue: p.hue, paid: l.price, t: G.s.t, variant: l.variant, size: l.size, cond, note, orderId: o.id, shop: o.shop, extras: l.warranty ? 'Trygghetsavtale 3 år' : '' });
      G.s.stats.items++;
    }
  });
  if (G.s.inventory.length >= 50) G.ach('hoarder');
  if (!picked) G.notify('post', 'Pakke levert', `Sendingen fra ${G.SHOPS[o.shop].name} er levert.`);
};

G.order = (id) => G.s.orders.find(o => o.id === id);

// ---------- Retur ----------
G.canReturn = function (item) {
  if (item.shop === 'funn') return false;
  const days = item.shop === 'amazoom' ? 30 : item.shop === 'zalandoo' ? 100 : 14;
  return !item.returning && (G.s.t - item.t) <= days * U.DAY;
};
G.startReturn = function (uid) {
  const it = G.s.inventory.find(i => i.uid === uid); if (!it || !G.canReturn(it)) return { ok: false };
  let fee = it.shop === 'taemu' ? 149 : it.shop === 'elkjopt' && it.cond === 'Ny' && !it.note ? 0 : 0;
  if (fee && G.s.bank.checking < fee) return { ok: false, msg: 'Ikke dekning for returfrakt.' };
  if (fee) G.tx('checking', -fee, 'Returfrakt Tæmu');
  it.returning = true;
  const tracking = 'RET' + U.digits(10);
  const t0 = G.s.t;
  const sh = { id: tracking, orderId: it.orderId, shop: it.shop, from: 'NO', events: [{ t: t0, text: 'Returetikett opprettet. Lever pakken på et hentested.', loc: '' }], plan: [
    { at: t0 + 6 * U.HOUR, text: 'Retursending innlevert', loc: U.pick(G.PICKUP) },
    { at: t0 + 2 * U.DAY, text: 'Under transport til avsenders lager', loc: it.shop === 'taemu' ? 'Shenzhen, Kina (vi tror)' : 'Lager i Europa' },
    { at: t0 + (it.shop === 'taemu' ? 12 : 4) * U.DAY, text: 'Retur mottatt av avsender', loc: '', status: 'delivered' },
  ], status: 'transit', point: '', created: t0, delivery: 'return', damaged: false, fee: 0, feePaid: true, hold: null, returnOf: it.uid };
  G.s.shipments.unshift(sh);
  G.s.stats.returns++;
  return { ok: true, sh, fee };
};
G.finishReturn = function (sh) {
  const it = G.s.inventory.find(i => i.uid === sh.returnOf); if (!it) return;
  G.s.inventory = G.s.inventory.filter(i => i.uid !== it.uid);
  const reject = it.shop === 'taemu' && Math.random() < 0.3;
  if (reject) {
    G.mail({ from: 'no-reply@taemu.com', fromName: 'Tæmu', subject: 'Din retur er avvist', cat: 'primary', body: `<p>Kjære verdsatte kunde!!</p><p>Vi har dessverre avvist din retur av <b>${U.esc(it.name)}</b> fordi varen ble returnert i «brukt tilstand» (du åpnet esken).</p><p>Som kompensasjon gir vi deg en kupong på 3% på neste kjøp over 2000 kr! 🎉</p>` });
    return;
  }
  G.refundOrder(it.orderId, it, 0, 'Retur');
};
G.refundOrder = function (orderId, item, fee, why) {
  const o = G.order(orderId); if (!o) return;
  const amount = item ? item.paid + (item.extras ? Math.round(item.paid * 0.19) : 0) : o.total;
  let refund = Math.max(0, amount - (fee || 0));
  if (o.method.startsWith('klarna')) {
    const left = G.klarnaCancelOrder(orderId, refund);
    if (left > 0) G.tx('checking', left, `Refusjon ${G.SHOPS[o.shop].name} ${o.id}`);
  } else if (o.method === 'credit') G.tx('card', refund, `Refusjon ${G.SHOPS[o.shop].name} ${o.id}`);
  else G.tx('checking', refund, `Refusjon ${G.SHOPS[o.shop].name} ${o.id}`);
  if (fee) G.s.stats.fees += fee;
  if (!item) o.status = 'Returnert';
  else o.returned.push(item.uid);
  G.mail({ from: G.SHOPS[o.shop].mail, fromName: G.SHOPS[o.shop].name, subject: `Refusjon for ordre ${o.id}`, cat: 'primary', body: `<p>Vi har behandlet ${why.toLowerCase()} for ordre <b>${o.id}</b>.</p><p>Refundert beløp: <b>${U.kr(refund)}</b>${fee ? ` (etter fratrekk av gebyr ${U.kr(fee)})` : ''}.</p><p>Det kan ta 3–5 virkedager før pengene er på konto. Eller med en gang. Vi vet egentlig ikke.</p>` });
};

// ---------- Funn (bruktmarked) ----------
G.BUYERS = ['Geir_63', 'Bjørn Erik', 'Kjøper alt AS', 'Mona L.', 'Tor-Inge', 'Sølvi 🌸', 'Ola Nordmann', 'xX_Gamer_Xx', 'Randi fra Røldal', 'Petter Smart', 'Hans (snart pensjonist)', 'Truls', 'Ronny med henger', 'Anne-Grethe'];
G.listItem = function (uid, price) {
  const it = G.s.inventory.find(i => i.uid === uid); if (!it) return;
  it.listed = true;
  G.s.funn.listings.unshift({ id: G.nid('F'), uid, name: it.name, emoji: it.emoji, price, t: G.s.t, offers: [], sold: false, views: 0, chats: [] });
};
G.funnTick = function () {
  G.s.funn.listings.filter(l => !l.sold).forEach(l => {
    l.views += U.int(0, 9);
    if (l.offers.filter(o => !o.resolved).length >= 6) return;
    const it = G.s.inventory.find(i => i.uid === l.uid); if (!it) return;
    const fair = it.paid * (it.note || it.cond !== 'Ny' ? 0.35 : 0.6);
    const ratio = l.price / Math.max(1, fair);
    const p = Math.max(0.03, 0.35 / Math.max(0.5, ratio));
    if (Math.random() < p) {
      const kind = Math.random();
      let amount, msg;
      const buyer = U.pick(G.BUYERS);
      if (kind < 0.45) { amount = Math.max(1, Math.round(l.price * (0.1 + Math.random() * 0.3) / 10) * 10); msg = U.pick(['Hei. Gir ' + U.kr(amount) + ' kontant i dag. Henter med en gang.', 'Er den ledig? Kan gi ' + U.kr(amount) + '. Er student 🙏', U.kr(amount) + '?', 'Siste bud ' + U.kr(amount) + '. Ser du har hatt den ute lenge (?)']); }
      else if (kind < 0.85) { amount = Math.round(l.price * (0.65 + Math.random() * 0.3) / 10) * 10; msg = U.pick(['Hei! Er den fortsatt tilgjengelig? Kan betale ' + U.kr(amount) + ' med Vipps.', 'Interessert! ' + U.kr(amount) + ' og vi har en deal?', 'Kan du gå ned til ' + U.kr(amount) + '? Kan hente i kveld.']); }
      else if (kind < 0.95) { amount = l.price; msg = 'Tar den til full pris! Når kan jeg hente?'; }
      else { amount = l.price; msg = 'Hei kjære, jeg er på oljeplattform og kan ikke hente. Jeg betaler via SikkerFrakt™, bare klikk lenken og fyll inn kortinfo for å motta pengene 🙏'; return l.offers.unshift({ id: G.nid('O'), buyer: 'Mr. Johnson (ny bruker)', amount, msg, scam: true, t: G.s.t }); }
      l.offers.unshift({ id: G.nid('O'), buyer, amount, msg, t: G.s.t });
      G.notify('funn', 'Ny melding på Funn', `${buyer}: ${msg.slice(0, 60)}`);
    }
  });
};
G.acceptOffer = function (lid, oid) {
  const l = G.s.funn.listings.find(x => x.id === lid); const o = l && l.offers.find(x => x.id === oid);
  if (!o) return { ok: false };
  if (o.scam) {
    const loss = Math.min(Math.max(G.s.bank.checking, 0), U.pick([2999, 4999, 7999]));
    if (loss > 0) G.tx('checking', -loss, 'SIKKERFRAKT LTD *GB');
    G.s.stats.scams++; G.ach('scammed');
    o.resolved = 'scam';
    return { ok: true, scam: true, loss };
  }
  l.sold = true; l.soldFor = o.amount; l.soldAt = G.s.t;
  G.s.inventory = G.s.inventory.filter(i => i.uid !== l.uid);
  G.tx('checking', o.amount, `Vipps fra ${o.buyer} (Funn)`);
  G.s.stats.sold++; G.ach('sold');
  return { ok: true, amount: o.amount };
};

// ---------- Daglige og timevise hendelser ----------
G.daily = function () {
  const d = new Date(G.s.t), day = d.getDate();
  const b = G.s.bank;
  // Faste trekk
  if (day === 1) {
    G.bill('Husleie – Utleiegården AS', 9800);
    G.bill('Strøm – Dyrkraft', U.int(1100, 2900));
    G.bill('Mobilabonnement – Telenei', 449);
    G.bill('Strømmetjenester (Netflix, Viaplay, HBO, Disney+, TV 2 Play)', 689);
    G.bill('Innboforsikring – If-Then', 289);
    // kredittkortrente
    if (b.card.owed > 0) { const intr = Math.round(b.card.owed * 0.234 / 12); b.card.owed += intr; G.s.bank.tx.unshift({ t: G.s.t, acct: 'card', amount: -intr, text: 'Renter kredittkort' }); G.s.stats.fees += intr; }
    if (b.savings > 0) { const r = Math.round(b.savings * 0.03 / 12); G.tx('savings', r, 'Renter sparekonto'); }
  }
  (G.s.subs || []).forEach(sb => { if (G.s.t >= sb.start && day === sb.day) G.bill(sb.name + ' abonnement', sb.price); });
  if (day === 12) G.bill('Treningssenter – SATS-ish (brukt 0 ganger)', 549);
  if (day === 20) {
    G.tx('checking', 32480, 'Lønn – Kontor & Kaos AS');
    G.notify('bank', 'Lønn mottatt 💰', 'Kr 32 480 er satt inn på brukskontoen.');
    if (b.card.owed > 0) { const min = Math.min(b.card.owed, Math.max(300, Math.round(b.card.owed * 0.03))); G.bill('Kredittkort minstebeløp', min, () => { b.card.owed -= min; }); }
  }
  // Lån
  b.loans.forEach(l => {
    if (l.balance > 0 && G.s.t >= l.next) {
      const interest = l.balance * l.rate / 100 / 12;
      const pay = Math.min(l.monthly, l.balance + interest + 50);
      G.bill(`Forbrukslån ${l.id} terminbeløp`, Math.round(pay), () => { l.balance = Math.max(0, l.balance + interest - (pay - 50)); l.left--; });
      G.s.stats.fees += 50;
      const nd = new Date(l.next); l.next = new Date(nd.getFullYear(), nd.getMonth() + 1, 20).getTime();
    }
  });
  b.loans = b.loans.filter(l => l.balance > 1);
  // Klarnå purringer
  G.s.klarna.items.forEach(it => it.schedule.forEach(x => {
    if (x.paid) return;
    const over = (G.s.t - x.due) / U.DAY;
    const shopName = G.SHOPS[it.shop] ? G.SHOPS[it.shop].name : '';
    if (over > -3 && over < -2 && x.level === 0 && !x.warned) { x.warned = true; G.mail({ from: 'hei@klarna.no', fromName: 'Klarnå', subject: '💗 Psst! Snart forfall', cat: 'primary', body: `<p>Hei! Bare en vennlig påminnelse om at <b>${U.kr(x.amount + x.fees)}</b> for kjøpet ditt hos ${shopName} forfaller ${U.dateLong(x.due)}.</p><p>Vil du heller utsette? Det kan du! Mot et lite gebyr. 💗</p>` }); }
    if (over >= 1 && x.level === 0) { x.level = 1; x.fees += 35; G.s.stats.fees += 35; G.creditDelta(-15); G.notify('klarna', 'Purring', `Du har en forfalt betaling på ${U.kr(x.amount + x.fees)}`); G.mail({ from: 'hei@klarna.no', fromName: 'Klarnå', subject: 'Purring: Du har glemt oss 😢', cat: 'primary', body: `<p>Betalingen for ${shopName} forfalt ${U.dateLong(x.due)}. Vi har lagt til et purregebyr på 35 kr fordi vi er glade i deg.</p><p>Nytt beløp: <b>${U.kr(x.amount + x.fees)}</b></p>` }); }
    else if (over >= 14 && x.level === 1) { x.level = 2; x.fees += 70; G.s.stats.fees += 70; G.creditDelta(-30); G.mail({ from: 'hei@klarna.no', fromName: 'Klarnå', subject: '⚠️ Inkassovarsel', cat: 'primary', body: `<p><b>Inkassovarsel.</b> Hvis ${U.kr(x.amount + x.fees)} ikke er betalt innen 14 dager, sendes kravet til inkasso. Da blir det dyrt. Og vi blir lei oss (litt).</p>` }); }
    else if (over >= 28 && x.level === 2) { x.level = 3; x.fees += 700; G.s.stats.fees += 700; G.creditDelta(-120); G.ach('inkasso'); G.notify('klarna', 'Sendt til inkasso', 'Kravet er overført til Kravsnorff Inkasso AS'); G.mail({ from: 'krav@kravsnorff.no', fromName: 'Kravsnorff Inkasso AS', subject: 'BETALINGSOPPFORDRING – sak ' + U.digits(8), cat: 'primary', body: `<p style="font-family:monospace">Kravsnorff Inkasso AS har overtatt kravet fra Klarnå.</p><table class="mt"><tr><td>Hovedstol</td><td>${U.kr(x.amount)}</td></tr><tr><td>Gebyrer og salærer</td><td>${U.kr(x.fees)}</td></tr><tr><td><b>Å betale</b></td><td><b>${U.kr(x.amount + x.fees)}</b></td></tr></table><p>Betal i Klarnå-appen. Ved manglende betaling vil saken bli sendt til forliksrådet, namsmannen, og din mor.</p>` }); }
  }));
  // Nyhetsbrev planlegges
  G.s.todayLetters = U.int(2, 4);
  // Kampanjer
  const s = G.season();
  if (day === 11 && d.getMonth() === 10) G.mailCampaign('singles');
  if (day === 16 && d.getMonth() === 10) G.mailCampaign('preblack');
  if (day === 23 && d.getMonth() === 10) G.mailCampaign('blackweek');
  if (day === 27 && d.getMonth() === 10) G.mailCampaign('blackfriday');
  // Lånereklame
  if (Math.random() < 0.35) G.mailLoanSpam();
  if (Math.random() < 0.3) G.mailPhishing();
  // Rydd gamle tilbud
  Object.keys(G.s.deals).forEach(k => { if (G.s.deals[k].until < G.s.t) delete G.s.deals[k]; });
  if (G.s.bank.savings >= 50000) G.ach('saver');
  if (window.Missions) Missions.daily();
};
G.bill = function (text, amount, after) {
  G.tx('checking', -amount, text + ' (AvtaleGiro)');
  if (after) after();
  if (G.s.bank.checking < 0) {
    G.tx('checking', -250, 'Gebyr overtrekk');
    G.s.stats.fees += 250; G.creditDelta(-25);
    G.notify('bank', 'Overtrukket konto', `Brukskontoen er i minus (${U.kr(G.s.bank.checking)}).`);
  }
};
G.hourly = function (h) {
  if (h >= 7 && h <= 22 && (G.s.todayLetters || 0) > 0 && Math.random() < 0.22) { G.s.todayLetters--; G.mailNewsletter(); }
  if (h % 2 === 0) G.funnTick();
  // handlekurv-påminnelse
  if (h === 19) {
    const shop = Object.keys(G.s.cart).find(k => G.s.cart[k].length);
    if (shop && Math.random() < 0.5) G.mailCartReminder(shop);
  }
};

// ---------- Varsler ----------
G.notify = function (app, title, text) {
  G.s.notifs.unshift({ id: G.nid('N'), app, title, text, t: G.s.t, read: false });
  if (G.s.notifs.length > 80) G.s.notifs.length = 80;
  if (window.OS) OS.banner(app, title, text);
};

// ---------- E-post ----------
G.mail = function (m) {
  const msg = Object.assign({ id: G.nid('M'), t: G.s.t, read: false, cat: 'primary' }, m);
  G.s.mail.unshift(msg);
  if (G.s.mail.length > 300) G.s.mail.length = 300;
  if (msg.cat === 'primary' && window.OS) OS.banner('mail', msg.fromName, msg.subject);
  return msg;
};
G.welcome = function () {
  const s = G.s;
  s.mail.unshift({ id: 'M1', t: G.START - 3 * U.HOUR, read: false, cat: 'primary', from: 'velkommen@pakkeliv.no', fromName: 'Pakkeliv', subject: 'Velkommen til ditt nye digitale liv 📱',
    body: `<p>Hei!</p><p>Du har en ny telefon, en bankkonto med <b>8 450 kr</b> og et sterkt, men ikke helt ufarlig, ønske om å handle på nett.</p>
    <ul><li>🛒 Handle i <b>Amazoom</b>, <b>Zalandoo</b>, <b>Elkjøpt</b> og <b>Tæmu</b>.</li><li>📦 Følg pakkene i <b>PostNei</b> – og hent dem før fristen.</li><li>💳 Tom for penger? <b>Klarnå</b> og <b>SpareMinus</b> hjelper deg gjerne. Altfor gjerne.</li><li>♻️ Selg ting du angrer på i <b>Funn</b>.</li><li>📝 Sjekk <b>Huskeliste</b> – du har gaver å kjøpe.</li><li>🌙 Trykk på månen på hjemskjermen for å sove til neste dag.</li></ul>
    <p>Lønn kommer den 20. Husleia går den 1. Lykke til!</p>` });
};
G.mailOrderConfirm = function (o) {
  const sh = G.SHOPS[o.shop];
  const rows = o.lines.map(l => { const p = CATALOG.get(l.pid); return `<tr><td>${p.emoji} ${U.esc(p.name)}${l.variant ? ' · ' + l.variant : ''}${l.size ? ' · str ' + l.size : ''} × ${l.qty}</td><td>${U.kr(l.price * l.qty)}</td></tr>`; }).join('');
  const payTxt = { debit: 'Bankkort (brukskonto)', credit: 'Kredittkort', 'klarna:invoice': 'Klarnå faktura 14 dager', 'klarna:invoice30': 'Klarnå – prøv først, betal om 30 dager', 'klarna:split3': 'Klarnå – del opp i 3', 'klarna:finance': 'Klarnå finansiering' }[o.method] || o.method;
  G.mail({ from: sh.mail, fromName: sh.name, shop: o.shop, subject: o.shop === 'taemu' ? `🎉🎉 Bestilling bekreftet! Du sparte ${U.kr(o.sub * 0.8)}!!` : `Ordrebekreftelse ${o.id}`, cat: 'primary',
    body: `<p>Takk for bestillingen!</p><p>Ordrenummer: <b>${o.id}</b><br>Dato: ${U.dt(o.t)}</p><table class="mt">${rows}<tr><td>Frakt</td><td>${o.shipping ? U.kr(o.shipping) : 'Gratis'}</td></tr>${o.extras ? `<tr><td>Tillegg</td><td>${U.kr(o.extras)}</td></tr>` : ''}${o.discount ? `<tr><td>Rabatt</td><td>−${U.kr(o.discount)}</td></tr>` : ''}<tr><td><b>Totalt</b></td><td><b>${U.kr(o.total)}</b></td></tr></table><p>Betaling: ${payTxt}</p><p>Du får en ny e-post med sporingsnummer når pakken er sendt.</p>` });
};
G.mailShipped = function (sh) {
  const s = G.SHOPS[sh.shop];
  G.mail({ from: s.mail, fromName: s.name, shop: sh.shop, subject: sh.shop === 'taemu' ? '📦 Pakken din er på vei!!! (kanskje)' : 'Ordren din er sendt 🚚', cat: 'primary',
    body: `<p>Gode nyheter! Ordre <b>${sh.orderId}</b> er sendt med PostNei.</p><p>Sporingsnummer: <b>${sh.id}</b></p><p>Forventet levering: ${U.dateLong(sh.eta)}${sh.from === 'CN' ? ' (± 3 uker)' : ''}</p>`,
    action: { label: 'Spor pakken i PostNei', fn: `OS.open('post','track',{id:'${sh.id}'})` } });
};
G.NEWS_SUBJ = {
  amazoom: ['Anbefalt for deg basert på at du lever', 'Dagens tilbud: Opptil −40 %', 'Du kommer til å elske disse', 'Bare i dag: lyntilbud ⚡', 'Kunder som deg kjøpte også…'],
  zalandoo: ['Nye trender er her ✨', 'Høstens favoritter – opptil −50 %', 'Din stil, din måte, våre priser', 'Vi har funnet noe til deg!', 'Siste sjanse: SALG'],
  elkjopt: ['UKAS TILBUD – kun denne uken (og neste)', 'Lavpris! Lavpris! Lavpris!', 'Oppgrader TV-en før julefilmene', 'Prismatch? Vi matcher oss selv', 'Har du sett disse prisene?'],
  taemu: ['🔥🔥 SISTE SJANSE!!! −90% 🔥🔥', '🎁 Du har vunnet en GRATIS gave!!!', '⏰ Tilbudet utløper om 00:14:59!!!', '💰 Handle som en milliardær', '😱 Prisfall på varer du så på!!'],
};
G.mailNewsletter = function () {
  const shop = U.pick(['amazoom', 'zalandoo', 'elkjopt', 'taemu']);
  const pool = CATALOG.PRODUCTS.filter(p => p.shop === shop);
  const picks = U.shuffle(pool).slice(0, 4);
  const until = G.s.t + 2 * U.DAY;
  const items = picks.map(p => {
    const disc = shop === 'taemu' ? 0.3 + Math.random() * 0.4 : 0.1 + Math.random() * 0.35;
    const price = Math.max(9, Math.round(p.price * (1 - disc) / 10) * 10 - 1);
    G.s.deals[p.id] = { price, until, label: 'Nyhetsbrev' };
    return `<div class="nl-item" onclick="OS.open('${shop}','product',{id:'${p.id}'})"><div class="nl-img" style="${Apps.imgStyle(p)}">${p.emoji}</div><div><div class="nl-name">${U.esc(p.brand)} ${U.esc(p.name)}</div><div><s>${U.kr(p.price)}</s> <b class="red">${U.kr(price)}</b></div></div></div>`;
  }).join('');
  const sh = G.SHOPS[shop];
  G.mail({ from: 'nyhetsbrev@' + sh.mail.split('@')[1], fromName: sh.name, shop, cat: 'promo', subject: U.pick(G.NEWS_SUBJ[shop]),
    body: `<div class="nl-head" style="background:${sh.color};color:${shop === 'zalandoo' ? '#ff6900' : (shop === 'taemu' ? '#fff' : sh.accent)}">${sh.name}</div><p>${shop === 'taemu' ? 'KJÆRE KUNDE!!! Disse prisene er GALE!!! Gjelder kun 48 timer!!!' : 'Utvalgte tilbud – gjelder i 48 timer.'}</p>${items}<p class="small">Du mottar denne e-posten fordi du en gang så på en nettside. <u>Avmeld</u> (fungerer ikke).</p>` });
};
G.mailCartReminder = function (shop) {
  const sh = G.SHOPS[shop];
  G.mail({ from: 'nyhetsbrev@' + sh.mail.split('@')[1], fromName: sh.name, shop, cat: 'promo', subject: 'Du glemte noe i handlekurven 👀',
    body: `<p>Vi så at du la noe i handlekurven og så… bare dro. Det er greit. Vi er ikke sinte. Bare skuffet.</p>`, action: { label: 'Gå til handlekurven', fn: `OS.open('${shop}','cart')` } });
};
G.mailCampaign = function (kind) {
  const c = {
    singles: ['🛍️ 11.11 SINGLES DAY – −11 % på Tæmu og Zalandoo i dag!', 'Feir at du er singel ved å kjøpe ting du ikke trenger. Gjelder kun i dag.'],
    preblack: ['Black Week nærmer seg! 🖤', 'Neste uke kommer de laveste prisene vi noensinne har hatt (siden i fjor). Tips: ikke se på prisene denne uken.'],
    blackweek: ['🖤 BLACK WEEK ER I GANG 🖤', 'Tusenvis av varer på salg i alle butikker. Førpris er prisen vi hadde forrige uke (vi hevet den litt, men det trenger du ikke tenke på).'],
    blackfriday: ['🖤🖤 BLACK FRIDAY – I DAG! 🖤🖤', 'Det er i dag det skjer. Lommeboka gråter allerede.'],
  }[kind];
  G.mail({ from: 'kampanje@handlenett.no', fromName: 'Alle butikkene dine', cat: 'promo', subject: c[0], body: `<p>${c[1]}</p>` });
  G.notify('mail', 'Kampanje', c[0]);
};
G.mailLoanSpam = function () {
  const n = U.pick(['Lånekompisen', 'Raskelån.no', 'Gjeldsgnist', 'Refinans-Ronny', 'SpareMinus']);
  const amt = U.pick([50000, 150000, 250000, 500000]);
  G.mail({ from: 'tilbud@' + n.toLowerCase().replace(/[^a-z]/g, '') + '.no', fromName: n, cat: 'promo', subject: U.pick([`Du er forhåndsgodkjent for ${U.kr(amt)}!`, 'Svar på 1 minutt – penger på konto i dag!', 'Samle dyr gjeld i ett enda dyrere lån', 'Trenger du litt ekstra til jul? 🎄']),
    body: `<p>Hei! Vi ser at du kanskje trenger penger. Det gjør alle.</p><p>Lån inntil <b>${U.kr(amt)}</b> uten sikkerhet. Eff. rente fra 9,9 % (de fleste får 29,9 %).</p><p class="small">Eksempel: 65 000 kr over 5 år, eff. rente 21,4 %, totalt 100 920 kr.</p>`, action: { label: 'Søk lån i SpareMinus', fn: "OS.open('bank','loan')" } });
};
G.mailPhishing = function () {
  const t = U.pick([
    ['PostNei', 'kundeservice@postnei-sporing.xyz', 'Pakken din er holdt tilbake – betal 29,00 kr', 'Vi kunne ikke levere pakken din på grunn av ubetalt fraktgebyr (29,00 kr). Vennligst bekreft betalingen innen 24 timer, ellers returneres pakken.'],
    ['SpareMinus', 'sikkerhet@spareminus-bank.co', 'VIKTIG: Kontoen din er sperret', 'Vi har oppdaget uvanlig aktivitet. Logg inn umiddelbart for å bekrefte identiteten din, ellers vil kontoen bli stengt permanent.'],
    ['Skatteetaten', 'refusjon@skatteetaten-no.info', 'Du har penger til gode: 4 128,50 kr', 'Etter siste beregning har du krav på tilbakebetaling. Fyll inn kortinformasjon for å motta beløpet.'],
    ['Klarnå', 'support@klarna-no.help', 'Din konto er suspendert', 'På grunn av en feil i systemet må du oppdatere betalingsinformasjonen din for å fortsette å bruke Klarnå.'],
  ]);
  G.mail({ from: t[1], fromName: t[0], cat: 'primary', phish: true, subject: t[2], body: `<p>Kjære kunde,</p><p>${t[3]}</p><p>Med vennlig hilsen<br>${t[0]} Kundeservice</p>`, action: { label: 'Klikk her for å bekrefte', fn: `Apps.mail.phish('${t[0]}')` } });
};
G.phished = function () {
  const loss = Math.min(Math.max(0, G.s.bank.checking), U.pick([3999, 6499, 9999]));
  if (loss > 0) G.tx('checking', -loss, 'APPLE.COM/BILL *IE');
  if (G.cardAvail() > 3000) G.tx('card', -2999, 'STEAM GIFT CARD *RU');
  G.s.stats.scams++; G.ach('scammed');
  return loss;
};

// ---------- Prestasjoner ----------
G.ACH = {
  first: ['🛒', 'Første kjøp', 'Gjennomfør ditt første kjøp'],
  ten: ['🛍️', 'Stamkunde', 'Gjennomfør 10 bestillinger'],
  fifty: ['🏆', 'Shopaholic', 'Gjennomfør 50 bestillinger'],
  spend10: ['💸', 'Pengene brenner', 'Bruk 10 000 kr totalt'],
  spend50: ['🔥', 'Lommebok i brann', 'Bruk 50 000 kr totalt'],
  spend250: ['🏦', 'Nasjonaløkonomisk bidrag', 'Bruk 250 000 kr totalt'],
  bigspender: ['💎', 'Storinnkjøp', 'Én bestilling på over 20 000 kr'],
  klarna: ['💗', 'Kjøp nå, gråt senere', 'Betal med Klarnå for første gang'],
  loan: ['🏧', 'Raske penger', 'Ta opp et forbrukslån'],
  inkasso: ['📮', 'Brev fra Kravsnorff', 'Få et krav sendt til inkasso'],
  lowcredit: ['📉', 'Kredittverdig? Nei', 'Få kredittscore under 500'],
  scammed: ['🎣', 'Svindlet', 'Bli lurt av svindlere'],
  sold: ['♻️', 'Gjenbruker', 'Selg noe på Funn'],
  chat10: ['😤', 'Tålmodighetens mester', 'Send 10 meldinger til PostNei kundeservice'],
  chat50: ['🧘', 'Zen-mester', 'Send 50 meldinger til PostNei kundeservice'],
  taemufail: ['🤡', 'Forventet vs. virkelighet', 'Motta en Tæmu-vare som ikke var som på bildet'],
  hoarder: ['📦', 'Hamstrer', 'Ha 50 ting i boden'],
  debtfree: ['🕊️', 'Gjeldfri', 'Betal ned all gjeld etter å ha handlet'],
  saver: ['🐷', 'Sparegris', 'Ha 50 000 kr på sparekonto'],
  spotter: ['🕵️', 'Svindelsnuser', 'Rapporter en svindel-e-post før du klikker'],
  funnbuy: ['🤝', 'Bruktkupp', 'Kjøp noe brukt på Funn'],
  allgifts: ['🎄', 'Julenissen', 'Fullfør alle gave- og innkjøpsoppdrag'],
  warranty: ['🛡️', 'Trygghetsnarkoman', 'Kjøp Elkjøpt Trygghetsavtale'],
};
G.ach = function (id) {
  if (G.s.ach[id]) return;
  G.s.ach[id] = G.s.t;
  const a = G.ACH[id]; if (!a) return;
  if (window.OS) OS.achToast(a);
};
