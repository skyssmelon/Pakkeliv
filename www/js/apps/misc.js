// ===== Boden, Funn, Trofeer, Innstillinger =====

// ---------- Boden (mine ting) ----------
Apps.bod = { name: 'Boden', icon: '📦', bg: 'linear-gradient(135deg,#8d6e63,#5d4037)', views: {}, badge: () => 0 };
Apps.bod.views.main = function () {
  const inv = G.s.inventory;
  const value = inv.reduce((a, i) => a + i.paid, 0);
  return OS.header('Boden') + `<div class="app-body">
    <div class="card" style="display:flex;justify-content:space-around;text-align:center"><div><div class="small">Ting</div><b style="font-size:22px">${inv.length}</b></div><div><div class="small">Betalt totalt</div><b style="font-size:22px">${U.kr(value)}</b></div><div><div class="small">Bruktverdi</div><b style="font-size:22px">${U.kr(value * 0.45)}</b></div></div>
    ${inv.length ? `<div class="list">${inv.map(i => `<div class="li" onclick="OS.go('item',{uid:'${i.uid}'})"><div class="inv-ico" style="${Apps.imgStyle(i)}">${i.emoji}</div><div class="grow"><div class="t1">${U.esc(i.name)}</div><div class="t2">${U.esc(i.brand || '')} · ${U.kr(i.paid)} · ${U.date(i.t)}</div>${i.note || i.cond !== 'Ny' ? `<div class="t2 red">${U.esc(i.note || i.cond)}</div>` : ''}</div>${i.listed ? '<span class="status-pill">Til salgs</span>' : i.returning ? '<span class="status-pill warn">Retur</span>' : ''}</div>`).join('')}</div>` : '<div class="empty">📦<br>Boden er tom.<br>Ting du handler havner her når du har hentet dem.</div>'}
    <div style="height:20px"></div></div>`;
};
Apps.bod.views.item = function ({ uid }) {
  const i = G.s.inventory.find(x => x.uid === uid);
  if (!i) return OS.header('') + '<div class="empty">Tingen er borte. Kanskje solgt, kanskje returnert, kanskje bare borte.</div>';
  const p = CATALOG.get(i.pid);
  const canRet = G.canReturn(i) && !i.listed;
  const days = i.shop === 'amazoom' ? 30 : i.shop === 'zalandoo' ? 100 : 14;
  const left = Math.ceil((i.t + days * U.DAY - G.s.t) / U.DAY);
  return OS.header('') + `<div class="app-body">
    <div class="pd-img" style="${Apps.imgStyle(i)};font-size:120px">${i.emoji}</div>
    <div class="pd-main"><div class="pd-brand">${U.esc(i.brand || '')}</div><div class="pd-name">${U.esc(i.name)}</div>
      ${[i.variant, i.size ? 'Str ' + i.size : '', p && p.colorName].filter(Boolean).length ? `<div class="small">${[i.variant, i.size ? 'Str ' + i.size : '', p && p.colorName].filter(Boolean).join(' · ')}</div>` : ''}
      <div class="kv" style="margin-top:10px"><span>Betalt</span><b>${U.kr(i.paid)}</b></div><div class="kv"><span>Kjøpt fra</span><span>${G.SHOPS[i.shop].name}</span></div><div class="kv"><span>Mottatt</span><span>${U.dateLong(i.t)}</span></div><div class="kv"><span>Tilstand</span><span class="${i.cond !== 'Ny' ? 'red' : ''}">${i.cond}</span></div>${i.extras ? `<div class="kv"><span>Tillegg</span><span>${i.extras}</span></div>` : ''}
      ${i.note ? `<div class="upsell">😬 ${U.esc(i.note)}</div>` : ''}
    </div>
    <div class="pad">
      ${Missions.matches(i).map(m => `<button class="btn primary block" style="background:#f9a825;color:#111" onclick="Missions.give('${i.uid}','${m.id}')">${m.self ? m.emoji + ' Bruk til: ' + m.title : '🎁 Gi bort til ' + m.who}</button>`).join('')}
      <button class="btn block" onclick="Apps.bod.use('${i.uid}')">✨ Bruk</button>
      ${!i.listed && !i.returning ? `<button class="btn block" style="background:#0063fb;color:#fff" onclick="OS.open('funn','sell',{uid:'${i.uid}'})">♻️ Selg på Funn</button>` : ''}
      ${canRet ? `<button class="btn block" onclick="Apps.bod.ret('${i.uid}')">↩️ Returner (${left} dager igjen av returretten)</button>` : (i.returning ? '<p class="small" style="text-align:center">Returen er på vei.</p>' : '<p class="small" style="text-align:center">Returfristen har gått ut.</p>')}
      ${i.extras && (i.note || i.cond !== 'Ny') ? `<button class="btn block" onclick="Apps.bod.claim('${i.uid}')">🛡️ Bruk Trygghetsavtalen</button>` : ''}
    </div></div>`;
};
Apps.bod.use = function (uid) {
  const i = G.s.inventory.find(x => x.uid === uid);
  const msgs = ['Du brukte ' + i.name + '. Gleden varte i 4 sekunder.', 'Fantastisk! Du føler deg som et nytt menneske. I omtrent ett minutt.', 'Du tok et bilde av den og la den på Instagram. 3 likes.', 'Du brukte den. Den er nå "brukt". Bruktverdien sank med 40 %.', 'Ahh. Akkurat det du trengte. Trodde du.', 'Du la den i skuffen sammen med de andre tingene.'];
  OS.toast(U.pick(msgs), 3500);
};
Apps.bod.ret = function (uid) {
  const i = G.s.inventory.find(x => x.uid === uid);
  const fee = i.shop === 'taemu' ? 149 : 0;
  OS.confirm(`Returnere <b>${U.esc(i.name)}</b>?${fee ? `<br><span class="small">Tæmu krever ${U.kr(fee)} i returfrakt. Pakken skal til Kina.</span>` : '<br><span class="small">Gratis retur. Refusjon når butikken har mottatt varen.</span>'}`, 'Returner', () => {
    const r = G.startReturn(uid);
    if (!r.ok) return OS.toast(r.msg || 'Kan ikke returneres');
    OS.toast('↩️ Retur registrert. Følg den i PostNei.'); OS.render();
  });
};
Apps.bod.claim = function (uid) {
  const i = G.s.inventory.find(x => x.uid === uid);
  OS.modal(`<div class="processing"><div class="spinner"></div><b>Elkjøpt vurderer saken…</b></div>`, true);
  setTimeout(() => {
    OS.closeModal();
    const r = Math.random();
    if (r < 0.4) { i.cond = 'Ny'; i.note = ''; i.extras = ''; OS.modal(`<div style="text-align:center"><div style="font-size:48px">🛡️</div><h3>Godkjent!</h3><p>Du har fått en ny. Trygghetsavtalen er nå brukt opp. Vil du kjøpe en ny?</p><button class="btn primary block" onclick="OS.closeModal();OS.render()">OK</button></div>`); }
    else OS.modal(`<div style="text-align:center"><div style="font-size:48px">📄</div><h3>Avslått</h3><p>${U.pick(['Skaden skyldes «normal slitasje», som ikke dekkes.', 'Skaden skjedde på en tirsdag. Vilkårene dekker kun skader på fredager.', 'Du har ikke originalemballasjen. Den kastet du, som et normalt menneske.'])}</p><button class="btn block" onclick="OS.closeModal()">Ok…</button></div>`);
  }, 1600);
};

// ---------- Funn ----------
Apps.funn = {
  name: 'Funn', icon: '<span class="txt" style="font-size:16px">funn</span>', bg: '#0063fb', views: {}, tab: 'torget',
  badge: () => G.s.funn.listings.filter(l => !l.sold).reduce((a, l) => a + l.offers.filter(o => !o.seen && !o.resolved).length, 0),
};
Apps.funn.used = function () {
  const day = Math.floor(G.s.t / U.DAY);
  const r = U.rng(day * 31 + 5);
  const pool = CATALOG.PRODUCTS.filter(p => p.shop !== 'taemu' && p.price > 150);
  const towns = ['Pakkeby', 'Haugesund', 'Karmøy', 'Stord', 'Bergen', 'Kopervik', 'Sveio', 'Tysvær', 'Etne', 'Odda'];
  const descs = ['Lite brukt, som ny.', 'Fungerer som den skal. Selges pga. flytting.', 'Fikk i gave, aldri brukt.', 'Noen riper, ellers ok.', 'Selges grunnet kjøp av ny. Ingen prutting!!', 'Fast pris. Ikke spør om siste pris.', 'Må hentes i dag.', 'Røykfritt hjem. Hund i huset.'];
  return U.shuffle(pool, r).slice(0, 30).map((p, i) => {
    const f = 0.3 + r() * 0.45;
    return { lid: 'U' + day + '-' + i, pid: p.id, price: Math.max(50, Math.round(p.price * f / 50) * 50), town: U.pick(towns, r), desc: U.pick(descs, r), seller: U.pick(G.BUYERS, r), scam: r() < 0.12, ship: r() < 0.6 };
  }).filter(u => !(G.s.funnBought || []).includes(u.lid));
};
Apps.funn.views.main = function () {
  const tab = Apps.funn.tab;
  let body;
  if (tab === 'torget') {
    const list = Apps.funn.used();
    body = `<div class="small" style="padding:10px 14px 0">Nye annonser hver dag · ${list.length} til salgs i nærheten</div><div class="pgrid">${list.map(u => { const p = CATALOG.get(u.pid); return `<div class="pcard" onclick="OS.go('used',{lid:'${u.lid}'})"><div class="pimg" style="${Apps.imgStyle(p)}">${p.emoji}</div><div class="pinfo"><div class="pname">${U.esc(p.brand)} ${U.esc(Shop.dname(p))}</div><div class="small">📍 ${u.town}</div><div class="pprice">${U.kr(u.price)}</div></div></div>`; }).join('')}</div>`;
  } else {
    const ls = G.s.funn.listings;
    body = ls.length ? `<div class="list">${ls.map(l => { const n = l.offers.filter(o => !o.resolved).length; return `<div class="li" onclick="OS.go('listing',{id:'${l.id}'})"><div class="inv-ico" style="background:#e8f0ff">${l.emoji}</div><div class="grow"><div class="t1">${U.esc(l.name)}</div><div class="t2">${l.sold ? 'Solgt for ' + U.kr(l.soldFor) : U.kr(l.price) + ' · ' + l.views + ' visninger'}</div></div>${l.sold ? '<span class="status-pill done">Solgt</span>' : n ? `<span class="status-pill ready">${n} bud</span>` : ''}</div>`; }).join('')}</div>` : '<div class="empty">Du har ingen annonser.<br>Gå til Boden og velg «Selg på Funn».</div>';
  }
  return OS.header('Funn', { right: `<button class="hbtn" onclick="OS.open('bod')">📦</button>` }) + `<div class="tabs"><button class="${tab === 'torget' ? 'on' : ''}" onclick="Apps.funn.tab='torget';OS.render()">Torget</button><button class="${tab === 'mine' ? 'on' : ''}" onclick="Apps.funn.tab='mine';OS.render()">Mine annonser${Apps.funn.badge() ? ` (${Apps.funn.badge()})` : ''}</button></div><div class="app-body">${body}<div style="height:20px"></div></div>`;
};
Apps.funn.views.main.live = true;
Apps.funn.views.used = function ({ lid }) {
  const u = Apps.funn.used().find(x => x.lid === lid);
  if (!u) return OS.header('Annonse') + '<div class="empty">Annonsen er solgt eller slettet.</div>';
  const p = CATALOG.get(u.pid);
  return OS.header('Annonse') + `<div class="app-body"><div class="pd-img" style="${Apps.imgStyle(p)}">${p.emoji}</div>
    <div class="pd-main"><div class="pd-name">${U.esc(p.brand)} ${U.esc(Shop.dname(p))}</div><div class="pd-price">${U.kr(u.price)}</div><div class="small">Ny pris ca. ${U.kr(p.price)} · 📍 ${u.town}</div>
    <p style="font-size:15px">${u.desc}</p><div class="kv"><span>Selger</span><span>${U.esc(u.seller)}${u.scam ? ' (ny bruker)' : ' · ⭐ ' + (4 + Math.random()).toFixed(1)}</span></div><div class="kv"><span>Levering</span><span>${u.ship ? 'Kan sendes med PostNei' : 'Kun henting'}</span></div></div>
    <div class="pad">${u.ship ? `<button class="btn primary block" style="background:#0063fb" onclick="Apps.funn.buy('${u.lid}')">Kjøp og betal med Vipps-ish (${U.kr(u.price + 89)} inkl. frakt)</button>` : `<button class="btn primary block" style="background:#0063fb" onclick="Apps.funn.buy('${u.lid}',true)">Kjøp og hent (${U.kr(u.price)})</button>`}<p class="small" style="text-align:center">Tips: Betal aldri før du har sett varen. (Men det er jo så lettvint…)</p></div></div>`;
};
Apps.funn.buy = function (lid, pickup) {
  const u = Apps.funn.used().find(x => x.lid === lid); const p = CATALOG.get(u.pid);
  const total = u.price + (pickup ? 0 : 89);
  if (G.s.bank.checking < total) return OS.toast('Ikke nok penger på brukskontoen');
  if (pickup) { const h = new Date(G.s.t).getHours(); if (h < 8 || h > 21) return OS.toast('Selgeren svarer ikke nå. Prøv på dagtid.'); }
  G.tx('checking', -total, 'Vipps til ' + u.seller);
  G.s.funnBought = (G.s.funnBought || []).concat([lid]);
  G.s.stats.spent += total;
  if (u.scam) {
    OS.toast('Betalt! Selgeren sender «snart».');
    G.ach('funnbuy');
    setTimeout(() => { G.mail({ from: 'noreply@funn.no', fromName: 'Funn', subject: 'Brukeren du handlet med er slettet', cat: 'primary', body: `<p>Vi vil informere om at brukeren <b>${U.esc(u.seller)}</b> er utestengt fra Funn etter flere meldinger om svindel.</p><p>Har du betalt for noe, anbefaler vi å kontakte banken din. Banken vil anbefale deg å kontakte Funn.</p>` }); G.s.stats.scams++; G.ach('scammed'); }, 20000);
    OS.back(); return;
  }
  G.ach('funnbuy');
  const line = { pid: u.pid, qty: 1, price: u.price };
  const order = { id: 'FUNN-' + U.digits(6), shop: 'funn', lines: [line], sub: u.price, shipping: pickup ? 0 : 89, extras: 0, discount: 0, total, method: 'debit', t: G.s.t, delivery: 'pickup', status: 'Behandles', shipmentId: null, returned: [] };
  G.s.orders.unshift(order);
  if (pickup) {
    G.tick(45 * U.MIN);
    const sh = { status: 'picked', damaged: false, orderId: order.id, shop: 'funn', events: [] };
    G.deliver(sh, true);
    OS.modal(`<div style="text-align:center"><div style="font-size:50px">🚗🤝${p.emoji}</div><h3>Hentet!</h3><p class="small">Du kjørte til ${u.town}. Selgeren snakket i 20 minutter om hytta si.</p><button class="btn primary block" onclick="OS.closeModal();OS.open('bod')">Til Boden</button></div>`);
  } else {
    G.createShipment(order, 'NO', [2, 4], 'pickup');
    OS.toast('Betalt! Selgeren sender pakken.');
    OS.back();
  }
};

Apps.funn.views.sell = function ({ uid }) {
  const i = G.s.inventory.find(x => x.uid === uid); if (!i) return OS.header('Ny annonse') + '<div class="empty">?</div>';
  const sug = Math.round(i.paid * (i.note || i.cond !== 'Ny' ? 0.35 : 0.6) / 50) * 50 || 50;
  return OS.header('Ny annonse') + `<div class="app-body"><div class="pad"><div style="display:flex;gap:12px;align-items:center"><div class="inv-ico" style="${Apps.imgStyle(i)}">${i.emoji}</div><b>${U.esc(i.name)}</b></div>
    <label class="lbl">Pris (du betalte ${U.kr(i.paid)})</label><input class="inp" id="f-price" type="number" inputmode="numeric" value="${sug}">
    <div class="small" style="margin-top:6px">💡 Lignende annonser selges for rundt ${U.kr(sug)}. Høy pris = færre bud. Lav pris = 47 meldinger på 5 minutter.</div>
    <label class="lbl">Beskrivelse</label><textarea class="inp" rows="3">${i.note ? 'Selges pga. ' + U.esc(i.note.toLowerCase()) : 'Som ny. Lite brukt.'}</textarea>
    <button class="btn primary block" style="background:#0063fb" onclick="const v=parseInt(U.$('#f-price').value);if(v>0){G.listItem('${uid}',v);Apps.funn.tab='mine';OS.toast('Annonsen er publisert ♻️');OS.replace('main')}">Publiser annonse</button></div></div>`;
};
Apps.funn.views.listing = function ({ id }) {
  const l = G.s.funn.listings.find(x => x.id === id);
  l.offers.forEach(o => o.seen = true);
  return OS.header('Annonse') + `<div class="app-body"><div class="card" style="display:flex;gap:12px;align-items:center"><div class="inv-ico" style="background:#e8f0ff">${l.emoji}</div><div style="flex:1"><b>${U.esc(l.name)}</b><div class="small">${U.kr(l.price)} · ${l.views} visninger · lagt ut ${U.date(l.t)}</div></div></div>
    ${l.sold ? `<div class="card" style="text-align:center">✅ Solgt for <b>${U.kr(l.soldFor)}</b></div>` : `<div class="section-t">Meldinger og bud</div><div class="pad" style="padding-top:0">${l.offers.length ? l.offers.map(o => `<div class="offer"><b>${U.esc(o.buyer)}</b> <span class="small">${U.dt(o.t)}</span><div>${U.esc(o.msg)}</div>${o.resolved ? `<div class="small">${o.resolved === 'scam' ? '🎣 Det var svindel.' : 'Avslått'}</div>` : `<div class="btns"><button class="btn sm" style="background:#0063fb;color:#fff" onclick="Apps.funn.accept('${l.id}','${o.id}')">Godta ${U.kr(o.amount)}</button><button class="btn sm" onclick="Apps.funn.decline('${l.id}','${o.id}')">Avslå</button></div>`}</div>`).join('') : '<div class="empty">Ingen bud ennå. Folk ser, men byr ikke. Typisk.</div>'}</div>
    <div class="pad"><button class="btn block" onclick="Apps.funn.unlist('${l.id}')">Fjern annonsen</button></div>`}</div>`;
};
Apps.funn.views.listing.live = true;
Apps.funn.accept = function (lid, oid) {
  const r = G.acceptOffer(lid, oid);
  if (r.scam) OS.modal(`<div style="text-align:center"><div style="font-size:50px">🎣</div><h3>Det var svindel!</h3><p>«SikkerFrakt™»-lenken var falsk. Du fylte inn kortinfo og mistet <b>${U.kr(r.loss)}</b>.</p><p class="small">Ekte kjøpere trenger ikke kortinfoen din for å betale deg.</p><button class="btn primary block" onclick="OS.closeModal()">Æsj</button></div>`);
  else if (r.ok) OS.modal(`<div style="text-align:center"><div style="font-size:50px">🤝💰</div><h3>Solgt!</h3><p>${U.kr(r.amount)} er overført til brukskontoen.</p><button class="btn primary block" onclick="OS.closeModal()">Flott</button></div>`);
  OS.render();
};
Apps.funn.decline = function (lid, oid) { const l = G.s.funn.listings.find(x => x.id === lid); const o = l.offers.find(x => x.id === oid); o.resolved = 'declined'; OS.render(); };
Apps.funn.unlist = function (lid) {
  const l = G.s.funn.listings.find(x => x.id === lid);
  const i = G.s.inventory.find(x => x.uid === l.uid); if (i) i.listed = false;
  G.s.funn.listings = G.s.funn.listings.filter(x => x.id !== lid); OS.back();
};

// ---------- Trofeer ----------
Apps.trofeer = { name: 'Trofeer', icon: '🏆', bg: 'linear-gradient(135deg,#f7b733,#fc4a1a)', views: {}, badge: () => 0 };
Apps.trofeer.views.main = function () {
  const ids = Object.keys(G.ACH);
  const got = ids.filter(i => G.s.ach[i]).length;
  return OS.header('Trofeer') + `<div class="app-body"><div class="card" style="text-align:center"><div style="font-size:40px">🏆</div><b>${got} av ${ids.length}</b><div class="small">trofeer låst opp</div></div>
    <div class="list">${ids.map(i => { const a = G.ACH[i]; const has = G.s.ach[i]; return `<div class="ach ${has ? '' : 'locked'}"><div class="e">${a[0]}</div><div><b>${a[1]}</b><div class="small">${a[2]}${has ? ' · ' + U.date(has) : ''}</div></div></div>`; }).join('')}</div><div style="height:20px"></div></div>`;
};

// ---------- Innstillinger ----------
Apps.settings = { name: 'Innstillinger', icon: '⚙️', bg: 'linear-gradient(135deg,#8e8e93,#636366)', views: {}, badge: () => 0 };
Apps.settings.views.main = function () {
  const sp = G.s.speed;
  return OS.header('Innstillinger') + `<div class="app-body">
    <div class="section-t">Spillhastighet</div>
    <div class="card"><div class="small" style="margin-bottom:8px">Hvor mye tid som går i spillet per sekund. Nå: ${sp ? sp + ' min/sek (1 døgn ≈ ' + Math.round(1440 / sp / 60) + ' min)' : 'pause'}</div>
      ${[[0, '⏸ Pause'], [1, '1×'], [4, '4×'], [10, '10×'], [30, '30×'], [120, '120×']].map(([v, l]) => `<span class="chip ${sp === v ? 'on' : ''}" onclick="G.s.speed=${v};OS.render()">${l}</span>`).join('')}</div>
    <div class="section-t">Spillet</div>
    <div class="list">
      <div class="li" onclick="OS.sleep()"><div class="grow"><div class="t1">🌙 Sov til i morgen</div></div>›</div>
      <div class="li" onclick="G.tick(U.HOUR);OS.toast('⏩ +1 time');OS.updateStatus()"><div class="grow"><div class="t1">⏩ Hopp 1 time frem</div></div>›</div>
      <div class="li" onclick="OS.open('bank','stats')"><div class="grow"><div class="t1">📊 Statistikk</div></div>›</div>
      <div class="li" onclick="OS.confirm('Starte et helt nytt liv? All fremgang slettes.','Start på nytt',()=>{G.reset();OS.home();OS.toast('Nytt liv startet 🌱')})"><div class="grow"><div class="t1 red">🗑️ Start på nytt</div></div>›</div>
    </div>
    <div class="section-t">Om</div>
    <div class="card small">Pakkeliv – en netthandelsimulator.<br>Alle butikker, banker og selskaper i spillet er fiktive parodier. Produktnavn og merker brukes kun for realisme. Pengene er ikke ekte – men det er heller ikke kundeservicen.<br><br>${CATALOG.PRODUCTS.length} produkter · versjon 1.0</div>
  </div>`;
};
