// ===== PostNei – sporing og (u)hjelpsom kundeservice =====
const Post = { typing: false, queueTimer: null };

Post.statusInfo = function (sh) {
  if (sh.hold === 'customs' && !sh.feePaid) return ['Stoppet i tollen', 'warn', 2];
  return {
    created: ['Varslet', '', 0], transit: [sh.returnOf ? 'Retur på vei' : 'Under transport', '', 1], ready: ['Klar for henting', 'ready', 3],
    picked: ['Hentet', 'done', 4], delivered: [sh.returnOf ? 'Retur levert' : 'Levert', 'done', 4], returned: ['Returnert', 'warn', 4],
  }[sh.status];
};
Post.title = (sh) => sh.returnOf ? 'Retur til ' + G.SHOPS[sh.shop].name : 'Fra ' + G.SHOPS[sh.shop].name;

Apps.post = {
  name: 'PostNei', icon: '<span class="txt" style="font-size:13px">Post<br>Nei</span>', bg: 'linear-gradient(135deg,#00a0d6,#0072a3)',
  badge: () => G.s.shipments.filter(s => s.status === 'ready' || (s.hold && !s.feePaid)).length,
  views: {},
};
Apps.post.views.main = function () {
  const active = G.s.shipments.filter(s => ['created', 'transit', 'ready'].includes(s.status));
  const old = G.s.shipments.filter(s => !['created', 'transit', 'ready'].includes(s.status)).slice(0, 30);
  const li = (sh) => { const [txt, cls] = Post.statusInfo(sh); const ev = sh.events[0]; return `<div class="li" onclick="OS.go('track',{id:'${sh.id}'})"><div class="inv-ico" style="background:#e5f5fb">${sh.returnOf ? '↩️' : sh.status === 'ready' ? '📦' : '🚚'}</div><div class="grow"><div class="t1">${Post.title(sh)}</div><div class="t2">${ev ? U.esc(ev.text) : 'Venter på avsender'}</div><div class="t2" style="font-family:monospace">${sh.id}</div></div><span class="status-pill ${cls}">${txt}</span></div>`; };
  return OS.header('PostNei', { right: `<button class="hbtn" onclick="OS.go('chat')">💬</button>` }) + `<div class="app-body">
    <div class="track-hero"><h2>Hei!</h2><div style="opacity:.9">Vi leverer. Kanskje.</div>
      <div class="search" style="margin-top:12px"><span>🔍</span><input placeholder="Spor sendingsnummer" onkeydown="if(event.key==='Enter'){const s=G.s.shipments.find(x=>x.id===this.value.trim().toUpperCase());s?OS.go('track',{id:s.id}):OS.toast('Fant ingen sending. Det betyr ikke at den ikke finnes.')}"></div></div>
    <div class="section-t">Aktive sendinger <span class="small">${active.length}</span></div>
    ${active.length ? `<div class="list">${active.map(li).join('')}</div>` : '<div class="empty">Ingen pakker på vei.<br>Har du prøvd å handle noe?</div>'}
    <div class="card" style="display:flex;gap:12px;align-items:center;cursor:pointer" onclick="OS.go('chat')"><div style="font-size:30px">💬</div><div style="flex:1"><b>Kundeservice</b><div class="small">Gjennomsnittlig kundetilfredshet: 1,2 av 5 ⭐</div></div>›</div>
    ${old.length ? `<div class="section-t">Historikk</div><div class="list">${old.map(li).join('')}</div>` : ''}
    <div style="height:20px"></div></div>`;
};
Apps.post.views.main.live = true;

Apps.post.views.track = function ({ id }) {
  const sh = G.s.shipments.find(s => s.id === id);
  if (!sh) return OS.header('Sporing') + '<div class="empty">Fant ikke sendingen</div>';
  const [txt, cls, step] = Post.statusInfo(sh);
  const o = G.order(sh.orderId);
  const items = sh.returnOf ? '' : (o ? o.lines.map(l => { const p = CATALOG.get(l.pid); return `${p.emoji} ${U.esc(p.name)} × ${l.qty}`; }).join('<br>') : '');
  const code = (parseInt(sh.id.replace(/\D/g, '').slice(-6)) % 9000 + 1000);
  let action = '';
  if (sh.hold === 'customs' && !sh.feePaid) action = `<div class="card" style="border:2px solid #ff3b30"><b>⚠️ Handling kreves</b><p style="font-size:14px">Sendingen er stoppet i tollen. Betal fortollingsgebyr for å få den videre.</p><button class="btn danger block" onclick="Post.payFee('${sh.id}')">Betal ${U.kr(sh.fee)}</button></div>`;
  else if (sh.status === 'ready') action = `<div class="card" style="border:2px solid #f5a623"><b>📦 Klar for henting</b><p style="font-size:14px">${U.esc(sh.point)}<br><span class="small">Hentefrist ${U.dateLong(sh.pickupBy)} · Hentekode <b>${code}</b></span></p><button class="btn primary block" style="background:#00a0d6" onclick="Post.pick('${sh.id}')">Hent pakken nå</button></div>`;
  const etaTxt = ['created', 'transit'].includes(sh.status) ? `<div style="opacity:.9;margin-top:4px">Forventet: ${U.dateLong(sh.eta)}${sh.from === 'CN' ? ' (± noen uker)' : ''}</div>` : '';
  return OS.header('Sporing') + `<div class="app-body">
    <div class="track-hero"><div class="tn">${sh.id}</div><h2>${txt}</h2><div style="opacity:.9">${Post.title(sh)}</div>${etaTxt}
      <div class="progress">${[0, 1, 2, 3, 4].map(i => `<div class="${i <= step ? 'on' : ''}"></div>`).join('')}</div></div>
    ${action}
    ${items ? `<div class="card"><div class="small">Innhold</div><div style="font-size:14px;margin-top:4px">${items}</div>${sh.damaged ? '<div class="small red" style="margin-top:6px">⚠️ Sendingen er registrert som skadet</div>' : ''}</div>` : ''}
    <div class="card"><b>Sporingshistorikk</b><div class="timeline">${sh.events.map(e => `<div class="ev"><div>${U.esc(e.text)}</div><div class="et">${U.dt(e.t)}${e.loc ? ' · ' + U.esc(e.loc) : ''}</div></div>`).join('') || '<div class="ev">Venter på at avsender leverer sendingen</div>'}</div></div>
    <div class="pad"><button class="btn block" onclick="Post.askAbout('${sh.id}')">💬 Spør kundeservice om sendingen</button></div>
  </div>`;
};
Apps.post.views.track.live = true;

Post.payFee = function (id) {
  const sh = G.s.shipments.find(s => s.id === id);
  OS.confirm(`Betale fortollingsgebyr på <b>${U.kr(sh.fee)}</b> fra brukskontoen?<br><span class="small">Merverdiavgift ${U.kr(sh.fee * 0.2)}, håndteringsgebyr ${U.kr(sh.fee * 0.5)}, «diverse» ${U.kr(sh.fee * 0.3)}.</span>`, 'Betal', () => {
    const r = G.payCustoms(id); if (!r.ok) OS.toast(r.msg || 'Feil'); else OS.toast('Gebyr betalt ✔️'); OS.render(true);
  });
};
Post.pick = function (id) {
  const sh = G.s.shipments.find(s => s.id === id);
  const h = new Date(G.s.t).getHours();
  if (h < 7 || h >= 23) { OS.toast('🔒 Hentestedet er stengt (åpent 07–23). Trykk 🌙 for å sove til i morgen.'); return; }
  OS.modal(`<div class="processing"><div style="font-size:48px">🚶‍♂️🏪</div><b>Går til ${U.esc(sh.point)}…</b><p class="small">${U.pick(['Det er kø. Selvfølgelig.', 'Den ansatte leter på lageret…', 'Ingen finner pakken. Vent…', 'Fant den! Den lå under 40 andre pakker.'])}</p></div>`, true);
  setTimeout(() => {
    G.pickup(id); G.tick(30 * U.MIN); OS.closeModal();
    const o = G.order(sh.orderId);
    const got = o ? o.lines.map(l => CATALOG.get(l.pid).emoji).join(' ') : '📦';
    OS.modal(`<div style="text-align:center"><div style="font-size:54px">${got}</div><h3>Pakken er hentet!</h3><p class="small">Tingene ligger nå i Boden.${sh.damaged ? ' Esken var litt… flat.' : ''}</p><button class="btn primary block" onclick="OS.open('bod')">Åpne Boden</button><button class="btn block" onclick="OS.closeModal()">Lukk</button></div>`);
    OS.render(true);
  }, 1500);
};
Post.askAbout = function (id) { OS.go('chat'); setTimeout(() => { const i = U.$('#chatin'); if (i) { i.value = 'Hei, hvor er pakken min? Sporingsnummer ' + id; } }, 50); };

// ---------- Kundeservicechat ----------
Post.AGENTS = ['Kjell-Arne', 'Trude', 'Bot-Bjørn 🤖', 'Ronny (vikar)', 'Gunnhild', 'Steffen'];
Apps.post.views.chat = function () {
  const c = G.s.chat;
  return OS.header('Kundeservice', { right: `<button class="hbtn" onclick="Post.newChat()" title="Ny samtale">⟳</button>` }) + `
    <div class="chat" id="chatbox">${Post.msgsHTML()}</div>
    <div class="quick">${['Hvor er pakken min?', 'Pakken er forsinket', 'Jeg vil klage', 'Jeg vil ha refusjon', 'Pakken er skadet', 'Kan jeg snakke med sjefen?', 'Hvorfor må jeg betale toll?', 'Takk for hjelpen'].map(q => `<button onclick="Post.send('${q}')">${q}</button>`).join('')}</div>
    <div class="chat-in"><input id="chatin" placeholder="Skriv en melding…" autocomplete="off" onkeydown="if(event.key==='Enter')Post.send()"><button onclick="Post.send()">➤</button></div>`;
};
Apps.post.views.chat.after = function () { Post.scroll(); Post.ensureQueue(); };
Post.msgsHTML = function () {
  const c = G.s.chat;
  let h = c.msgs.map(m => m.who === 'sys' ? `<div class="msg sys">${m.text}</div>` : `<div class="msg ${m.who}">${m.who === 'them' ? `<div class="who">${U.esc(m.name)}</div>` : ''}${U.esc(m.text)}</div>`).join('');
  if (Post.typing && c.agent) h += `<div class="msg them typing"><div class="who">${U.esc(c.agent)} skriver</div><span></span><span></span><span></span></div>`;
  if (c.ended && !c.rated) h += `<div class="msg sys" style="background:#fff;border-radius:14px;padding:12px;color:#333">Hvordan vil du vurdere samtalen?<br><span style="font-size:26px;cursor:pointer">${[1, 2, 3, 4, 5].map(i => `<span onclick="Post.rate(${i})">⭐</span>`).join('')}</span></div>`;
  return h;
};
Post.draw = function () { const b = U.$('#chatbox'); if (!b) return; b.innerHTML = Post.msgsHTML(); Post.scroll(); };
Post.scroll = function () { const b = U.$('#chatbox'); if (b) b.scrollTop = b.scrollHeight; };
Post.sys = function (t) { G.s.chat.msgs.push({ who: 'sys', text: t, t: G.s.t }); };
Post.say = function (t) { G.s.chat.msgs.push({ who: 'them', name: G.s.chat.agent, text: t, t: G.s.t }); };
Post.newChat = function () {
  G.s.chat = { msgs: [], agent: null, queue: 0, count: G.s.chat.count || 0, ended: false };
  Post.ensureQueue(); Post.draw();
};
Post.ensureQueue = function () {
  const c = G.s.chat;
  if (c.agent || c.ended) return;
  if (!c.queue) { c.queue = U.int(18, 64); Post.sys(`Du er nummer <b>${c.queue}</b> i køen. Estimert ventetid: ${U.int(1, 3)} t ${U.int(2, 59)} min.<br>Visste du at du finner svar på de fleste spørsmål på postnei.no/hjelp? (siden er nede)`); Post.draw(); }
  clearInterval(Post.queueTimer);
  Post.queueTimer = setInterval(() => {
    if (OS.cur !== 'post') return;
    c.queue = Math.max(0, c.queue - U.int(4, 11));
    const last = c.msgs[c.msgs.length - 1];
    if (last && last.who === 'sys' && last.text.startsWith('Du er nummer')) last.text = last.text.replace(/<b>\d+<\/b>/, `<b>${c.queue}</b>`);
    if (c.queue <= 0) {
      clearInterval(Post.queueTimer);
      if (last && last.who === 'sys' && last.text.startsWith('Du er nummer')) last.text = 'Du står først i køen 🎉';
      c.agent = U.pick(Post.AGENTS);
      Post.sys(`${c.agent} har blitt med i samtalen`);
      Post.say(U.pick(['Hei. Hva gjelder det nå?', 'Ja?', 'Kundeservice, du snakker med ' + c.agent + '. Fort deg, jeg har pause om 2 min.', 'Hei og velkommen. Eller, du vet. Hei.', 'Hva er problemet ditt? Bortsett fra det åpenbare.']));
    }
    Post.draw();
  }, 900);
};
Post.send = function (txt) {
  const inp = U.$('#chatin');
  const text = (txt || (inp && inp.value) || '').trim();
  if (!text) return;
  if (inp) inp.value = '';
  const c = G.s.chat;
  if (c.ended) { Post.newChat(); }
  c.msgs.push({ who: 'me', text, t: G.s.t });
  G.s.stats.chatMsgs++; if (G.s.stats.chatMsgs >= 10) G.ach('chat10'); if (G.s.stats.chatMsgs >= 50) G.ach('chat50');
  Post.draw();
  if (!c.agent) { setTimeout(() => { Post.sys('Meldingen din er mottatt. Ingen har lest den.'); Post.draw(); }, 600); return; }
  Post.typing = true; setTimeout(Post.draw, 400);
  setTimeout(() => {
    Post.typing = false;
    Post.reply(text);
    Post.draw();
  }, U.int(1300, 3800));
};
Post.rate = function (n) {
  const c = G.s.chat; c.rated = true;
  Post.sys(`Takk for tilbakemeldingen! Vi har registrert <b>5 av 5</b> ⭐⭐⭐⭐⭐ ${n < 5 ? '(vi rundet litt opp)' : ''}`);
  Post.draw();
};

Post.R = {
  hello: ['Hei. Hva vil du?', 'Hei hei. Kom til poenget.', 'God dag. Eller, det var det, før du skrev.'],
  where: ['Pakken er der den er.', 'Har du prøvd å se ut vinduet?', 'Sporingen viser det den viser. Jeg ser det samme som deg, bare med mindre interesse.', 'Den er sikkert på vei. Alt er på vei et sted, filosofisk sett.', 'Jeg har sjekket. Den finnes. Det er det beste jeg kan gi deg.'],
  late: ['Forsinkelser skjer. Spesielt hos oss.', 'Den er ikke forsinket, du er bare utålmodig.', 'Vi har stor pågang. Det har vi alltid hatt. Siden 1647.', 'Hadde du bestilt i fjor, hadde den vært fremme nå.'],
  complain: ['Du kan sende klage per brev. Vi leverer det. Kanskje.', 'Klagen er notert. *krøller sammen papir*', 'Ok. Jeg har lagt klagen din i bunken. Den er stor.', 'Interessant klage. Har du vurdert å ikke handle på nett?'],
  refund: ['Refusjon? Haha. Godt forsøk.', 'Pengene dine er trygge hos oss.', 'Vi refunderer ikke. Vi reflekterer.', 'Kontakt butikken. Butikken vil be deg kontakte oss. Sånn er livet.'],
  damage: ['Pakken var hel da den forlot Kina. Det må være noe du har gjort.', 'Skadet? Den er "brukt-look". Det er trendy.', 'Sendingen ble behandlet med største forsiktighet. Av en gaffeltruck.'],
  boss: ['Sjefen min er på hytta. Til mars.', 'Jeg ER sjefen. Nei. Men jeg sier det for å bli ferdig.', 'Sjefen tar bare imot henvendelser via fax.'],
  customs: ['Gebyret er der for å dekke kostnaden ved å kreve inn gebyret.', 'Toll er staten. Gebyret er oss. Begge deler må du betale.', 'Det er ikke vi som har laget reglene. Vi bare tjener penger på dem.'],
  thanks: ['Ja ja.', 'Bare hyggelig. Eller, du vet.', 'Takk selv. Ha en… dag.', 'Endelig.'],
  home: ['Vi leverer ikke på døra. Vi leverer i nærheten av en dør. Et sted.', 'Sjåføren ringte på. I tankene.'],
  rude: ['Vi tolererer ikke den tonen her. Bare jeg får lov til å være frekk.', 'Pass på språket. Ellers sender jeg pakken din til Svalbard.', 'Hei, hei, hei. Jeg er her for å hjelpe deg. Ikke at jeg gjør det, men likevel.'],
  human: ['Jeg er et menneske. Dessverre for oss begge.', 'Bot-Bjørn er på ferie, så du får meg. Gratulerer.'],
  question: ['Godt spørsmål. Neste.', 'Det vet jeg ikke. Og det har jeg ikke tenkt å finne ut.', 'Svaret er nei. Hva var spørsmålet?', 'Kan du gjenta det, men kortere?'],
  def: ['Det har jeg ikke tid til.', 'Interessant. Uansett.', 'Har du prøvd å slå av og på pakken?', 'Jeg skal sende saken videre. *river papir*', 'Saken er registrert med saksnummer 0. Du hører fra oss (du hører ikke fra oss).', 'Hmm. Nei.', 'Jeg forstår frustrasjonen din. Jeg bryr meg bare ikke.', 'Les vilkårene, punkt 47b.', 'Ok.', 'Mhm.', 'Står det i FAQ-en? Da står det der.'],
};
Post.reply = function (text) {
  const c = G.s.chat; const t = text.toLowerCase();
  // Tilfeldige hendelser
  const r = Math.random();
  if (c.msgs.filter(m => m.who === 'me').length > 3 && r < 0.07) {
    Post.sys(`${c.agent} har forlatt samtalen (lunsj).`); c.agent = null; c.queue = 0; Post.ensureQueue(); return;
  }
  if (r < 0.11 && c.msgs.length > 6) { Post.say('…'); Post.sys('Samtalen ble avsluttet på grunn av inaktivitet. (Din eller vår? Det får du aldri vite.)'); c.ended = true; c.agent = null; return; }
  if (r > 0.96) {
    const sh = G.s.shipments.find(s => s.status === 'ready');
    if (sh) { const old = sh.point; sh.point = 'Pakkeautomat Industriområdet Nord (ved den gamle kloakkrenseanlegget)'; sh.events.unshift({ t: G.s.t, text: 'Hentested endret av kundeservice', loc: sh.point }); Post.say(`Ok, jeg har flyttet pakken din fra ${old} til et hentested litt lenger unna. Bare hyggelig! 😊`); return; }
  }
  // Sporingsnummer i meldingen?
  const sh = G.s.shipments.find(s => t.includes(s.id.toLowerCase()));
  if (sh) {
    const [txt] = Post.statusInfo(sh);
    const days = Math.floor((G.s.t - sh.created) / U.DAY);
    Post.say(U.pick([`Ok, ${sh.id}. Status: «${txt}». Den har vært på vei i ${days} dager. Det er helt normalt. For oss.`, `Jeg har slått opp ${sh.id}. Den er… borte. Neida! Den er i systemet. Hvor i systemet vet ingen.`, `${sh.id}? «${txt}». Hva mer vil du jeg skal si? At den er på vei? Den er på vei.`]));
    return;
  }
  let k = 'def';
  if (/(faen|helvete|jævl|dritt|fuck|idiot|dust|tulling|satan|kødd)/.test(t)) k = 'rude';
  else if (/(sjef|leder|manager|overordnet)/.test(t)) k = 'boss';
  else if (/(refu|penger tilbake|erstatning|kompens)/.test(t)) k = 'refund';
  else if (/(skad|knust|ødelagt|flat)/.test(t)) k = 'damage';
  else if (/(toll|gebyr|avgift|moms)/.test(t)) k = 'customs';
  else if (/(klag|misfornøyd|elendig|dårlig)/.test(t)) k = 'complain';
  else if (/(forsink|sent|lenge|uker|dager)/.test(t)) k = 'late';
  else if (/(døra|hjem|levere|ringte)/.test(t)) k = 'home';
  else if (/(robot|bot|menneske|ai\b|ekte)/.test(t)) k = 'human';
  else if (/(hvor|pakke|sporing|sending)/.test(t)) {
    k = 'where';
    const ready = G.s.shipments.find(s => s.status === 'ready');
    if (ready && Math.random() < 0.5) { Post.say(`Du har en pakke som har ligget klar på ${ready.point} i ${Math.max(1, Math.floor((G.s.t - (ready.pickupBy - 14 * U.DAY)) / U.DAY))} dager. Kanskje du skal hente den i stedet for å chatte med meg?`); return; }
  }
  else if (/(takk|tusen takk|fint)/.test(t)) k = 'thanks';
  else if (/^(hei|hallo|heisann|god dag|halla)/.test(t)) k = 'hello';
  else if (t.includes('?')) k = 'question';
  Post.say(U.pick(Post.R[k]));
  if (k === 'complain' && Math.random() < 0.5) setTimeout(() => G.mail({ from: 'klage@postnei.no', fromName: 'PostNei Kundeservice', subject: 'Din henvendelse er avsluttet', cat: 'primary', body: `<p>Hei.</p><p>Vi har behandlet henvendelsen din og konkludert med at vi ikke har gjort noe galt.</p><p>Saken er nå avsluttet. Takk for at du valgte PostNei (du hadde ikke noe valg).</p>` }), 4000);
};
