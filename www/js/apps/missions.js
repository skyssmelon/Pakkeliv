// ===== Huskeliste: oppdrag og gaver =====
const Missions = {};
const D = (m, d, h = 23) => new Date(2026, m, d, h, 59).getTime();
Missions.LIST = [
  { id: 'kari', who: 'Kari på jobben', emoji: '🎂', title: 'Bursdagsgave til Kari', desc: 'Kollegaen din fyller 40 den 14. november. Spleisen kom aldri i gang, så du må fikse noe selv. Maks 300 kr.', due: D(10, 14, 16), max: 300, test: (p) => true },
  { id: 'vinter', who: 'Deg selv', emoji: '❄️', title: 'Bli vinterklar', desc: 'Det er sludd ute og du har fortsatt sommerjakka. Skaff en vinterjakke eller vintersko før 1. desember.', due: D(10, 30), max: 99999, self: true, test: (p) => (p.sub === 'Jakker') || (p.sub === 'Sko' && /(vinter|GTX|piggsko|støvel|boots|Caribou)/i.test(p.name)) },
  { id: 'mamma', who: 'Mamma', emoji: '👩', title: 'Julegave til mamma', desc: 'Mamma sier hun «ikke trenger noe». Det betyr noe fint til hjemmet, kjøkkenet, en bok eller skjønnhet. Maks 1 000 kr.', due: D(11, 23), max: 1000, test: (p) => ['Hjem og interiør', 'Skjønnhet og helse', 'Kaffe', 'Bøker', 'Kjøkkenmaskiner'].includes(p.sub) },
  { id: 'pappa', who: 'Pappa', emoji: '👨', title: 'Julegave til pappa', desc: 'Pappa liker verktøy, friluftsliv, kaffe og å si «det var da ikke nødvendig». Maks 1 500 kr.', due: D(11, 23), max: 1500, test: (p) => ['Verktøy og hage', 'Sport og friluft', 'Kaffe', 'Bøker', 'Bil og elbil'].includes(p.sub) },
  { id: 'bror', who: 'Lillebror (12)', emoji: '🧒', title: 'Julegave til lillebror', desc: 'Han vil ha «noe gaming» eller leker. Maks 900 kr. (Han kommer til å klage uansett.)', due: D(11, 23), max: 900, test: (p) => ['Spill', 'Leker og spill', 'Gamingtilbehør'].includes(p.sub) },
  { id: 'nisse', who: 'Hemmelig venn', emoji: '🎅', title: 'Hemmelig venn på julebordet', desc: 'Julebordet er 12. desember. Gaven skal koste maks 200 kr, og helst være litt morsom.', due: D(11, 12, 18), max: 200, test: (p) => true },
  { id: 'spare', who: 'Deg selv', emoji: '🐷', title: 'Bufferkonto', desc: 'Ha minst 10 000 kr på sparekontoen på nyttårsaften. Fremtidige-deg ber pent.', due: D(11, 31), max: 0, self: true, auto: () => G.s.bank.savings >= 10000 },
  { id: 'inkassofri', who: 'Deg selv', emoji: '📮', title: 'Ingen inkasso i år', desc: 'Kom deg gjennom året uten at Kravsnorff Inkasso tar kontakt.', due: D(11, 31), max: 0, self: true, auto: () => !G.s.ach.inkasso },
];
Missions.state = () => (G.s.missions = G.s.missions || {});
Missions.status = function (m) {
  const st = Missions.state()[m.id];
  if (st) return st.done ? 'done' : 'failed';
  if (G.s.t > m.due) return 'late';
  return 'open';
};
Missions.matches = function (item) {
  const p = CATALOG.get(item.pid);
  return Missions.LIST.filter(m => !m.auto && Missions.status(m) === 'open' && item.paid <= m.max && m.test(p));
};
Missions.give = function (uid, mid) {
  const item = G.s.inventory.find(i => i.uid === uid); const m = Missions.LIST.find(x => x.id === mid);
  if (!item || !m) return;
  const p = CATALOG.get(item.pid);
  if (!m.self) G.s.inventory = G.s.inventory.filter(i => i.uid !== uid);
  const fl = m.self ? null : G.s.funn.listings.find(l => l.uid === uid && !l.sold); if (fl) G.s.funn.listings = G.s.funn.listings.filter(l => l !== fl);
  Missions.state()[mid] = { done: G.s.t, item: item.name };
  const bad = item.note || item.cond !== 'Ny';
  const cheap = m.max < 99999 && item.paid < m.max * 0.25;
  if (m.self) { OS.toast(`${m.emoji} Oppdrag fullført: ${m.title}`); }
  else {
    OS.toast(`🎁 Gaven er lagt klar til ${m.who}`);
    const reply = bad ? U.pick([`Takk for ${item.name}… Den var litt… annerledes enn jeg trodde. ${item.note ? '(' + item.note.toLowerCase() + ')' : ''} Men det er tanken som teller! 😅`, `Åh. En ${item.name}. Den har en… spesiell lukt. Takk likevel.`])
      : cheap ? `Takk for gaven! ${item.name}! Så… praktisk. 🙂`
        : U.pick([`TUSEN TAKK for ${item.name}! Akkurat det jeg ønsket meg! 😍`, `Å, så fin! ${item.name}! Du er best ❤️`, `Wow, ${item.name}! Du skulle ikke ha gjort det. Men jeg er glad du gjorde det!`]);
    setTimeout(() => G.mail({ from: m.id + '@familie.no', fromName: m.who, subject: bad ? 'Takk for gaven… 🙃' : 'Takk for gaven! 🎁', cat: 'primary', body: `<p>${U.esc(reply)}</p>` }), 2500);
  }
  if (Missions.LIST.filter(x => !x.auto).every(x => Missions.state()[x.id] && Missions.state()[x.id].done)) G.ach('allgifts');
  OS.home(); OS.open('liste');
};
Missions.daily = function () {
  Missions.LIST.forEach(m => {
    const st = Missions.state();
    if (st[m.id]) return;
    if (m.auto && G.s.t > m.due) { st[m.id] = m.auto() ? { done: G.s.t } : { failed: G.s.t }; if (st[m.id].done) OS.toast(`${m.emoji} ${m.title} – fullført!`); return; }
    if (!m.auto && G.s.t > m.due) {
      st[m.id] = { failed: G.s.t };
      if (!m.self) G.mail({ from: m.id + '@familie.no', fromName: m.who, subject: U.pick(['Det går fint 🙂', 'Hm.', 'Ingen gave i år?']), cat: 'primary', body: `<p>${U.pick(['Jeg merket at det ikke kom noen gave. Det går helt fint. Helt. Fint.', 'Det var hyggelig å se deg uansett. Selv om du kom tomhendt.', 'Jeg skal ikke si noe. Men jeg kommer til å huske det.'])}</p><p>– ${m.who}</p>` });
    }
  });
};

Apps.liste = {
  name: 'Huskeliste', icon: '📝', bg: 'linear-gradient(135deg,#fdd835,#f9a825)', views: {},
  badge: () => Missions.LIST.filter(m => Missions.status(m) === 'open' && m.due - G.s.t < 3 * U.DAY && !m.auto).length,
};
Apps.liste.views.main = function () {
  const pill = (m) => { const s = Missions.status(m); return s === 'done' ? '<span class="status-pill done">✓ Fullført</span>' : s === 'failed' || s === 'late' ? '<span class="status-pill warn">Mislyktes</span>' : `<span class="status-pill ${m.due - G.s.t < 3 * U.DAY ? 'ready' : ''}">${Math.max(0, Math.ceil((m.due - G.s.t) / U.DAY))} dager igjen</span>`; };
  const done = Missions.LIST.filter(m => Missions.status(m) === 'done').length;
  return OS.header('Huskeliste') + `<div class="app-body">
    <div class="card"><b>📝 Ting du må huske</b><div class="small">Kjøp en passende ting, hent den, og bruk «Gi bort» i Boden. ${done}/${Missions.LIST.length} fullført.</div></div>
    ${Missions.LIST.map(m => { const st = Missions.state()[m.id]; return `<div class="card"><div style="display:flex;gap:10px;align-items:flex-start"><div style="font-size:30px">${m.emoji}</div><div style="flex:1"><div style="display:flex;justify-content:space-between;gap:6px;align-items:flex-start"><b>${m.title}</b>${pill(m)}</div><div class="small" style="margin:4px 0">${m.desc}</div><div class="small">Frist: ${U.dateLong(m.due)}${st && st.item ? ` · Ga bort: <b>${U.esc(st.item)}</b>` : ''}</div></div></div></div>`; }).join('')}
    <div style="height:20px"></div></div>`;
};
Apps.liste.views.main.live = true;
