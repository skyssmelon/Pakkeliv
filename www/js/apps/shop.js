// ===== Felles butikkmotor for Amazoom, Zalandoo, Elkjøpt og Tæmu =====
const Shop = { sel: {}, co: {} };

Shop.CFG = {
  amazoom: {
    name: 'Amazoom', bg: 'linear-gradient(135deg,#232f3e,#37475a)', icon: '<span class="txt">a<span style="color:#ff9900">⌣</span></span>',
    logo: 'amazoom<span>.no</span>', tag: 'Alt fra A til Z – og litt til',
    heroes: [['Lyntilbud ⚡', 'Nye tilbud hver time. Vent – hvor går tiden?', '⚡', 'linear-gradient(120deg,#ff9900,#ff5e00)'], ['Jul hos Amazoom', 'Gaver til alle du må kjøpe gave til.', '🎁', 'linear-gradient(120deg,#146eb4,#232f3e)'], ['Prime Day hver dag', 'Fordi hver dag er en anledning.', '📦', 'linear-gradient(120deg,#00a8e1,#146eb4)']],
  },
  zalandoo: {
    name: 'Zalandoo', bg: '#ff6900', icon: '<span class="txt" style="font-size:24px">Z</span>',
    logo: 'zalandoo', tag: 'Skrik av glede. Eller av kontoutskriften.',
    heroes: [['Høst/vinter 2026', 'Varme jakker for kalde, norske dager.', '🧥', 'linear-gradient(120deg,#2b2b2b,#555)'], ['Sko-sjokket', 'Over 100 modeller. Alle i feil størrelse.', '👟', 'linear-gradient(120deg,#ff6900,#ff9a4d)'], ['Gratis frakt og retur', '100 dagers returrett. Fordi du kommer til å angre.', '📦', 'linear-gradient(120deg,#6a4c93,#ff6900)']],
  },
  elkjopt: {
    name: 'Elkjøpt', bg: 'linear-gradient(135deg,#0b3d91,#1556c4)', icon: '<span class="txt" style="color:#ffd400">EK</span>',
    logo: 'Elkjøpt<span>.</span>', tag: 'Du har allerede kjøpt det.',
    heroes: [['UKAS KUPP', 'Gjelder kun denne uken. Og neste. Og den etter.', '📺', 'linear-gradient(120deg,#0b3d91,#e30613)'], ['Prismatch', 'Finner du det billigere, matcher vi… nesten.', '💸', 'linear-gradient(120deg,#ffd400,#ff8a00)'], ['Trygghetsavtale', 'For når du ikke stoler på det du nettopp kjøpte.', '🛡️', 'linear-gradient(120deg,#3aaa35,#0b3d91)']],
  },
  taemu: {
    name: 'Tæmu', bg: '#fb7701', icon: '<span class="txt" style="font-size:18px">TÆ</span>',
    logo: 'TÆMU', tag: 'Handle som en milliardær. Vent som en pensjonist.',
    heroes: [['−90 % PÅ ALT!!!', 'Førpris er helt ekte, vi lover.', '🔥', 'linear-gradient(120deg,#fb7701,#ff2d55)'], ['SPINN HJULET!!', 'Vinn kuponger du nesten kan bruke!', '🎡', 'linear-gradient(120deg,#ffb703,#fb7701)']],
  },
};
Shop.SUB_EMOJI = { 'Mobiltelefoner': '📱', 'TV': '📺', 'Bærbare PC-er': '💻', 'Hodetelefoner': '🎧', 'Høyttalere': '🔊', 'Nettbrett': '📲', 'Smartklokker': '⌚', 'Konsoller': '🎮', 'Gamingtilbehør': '🕹️', 'Skjermer': '🖥️', 'PC-tilbehør': '🖱️', 'Lading og kabler': '🔌', 'Foto og video': '📷', 'Kaffe': '☕', 'Kjøkkenmaskiner': '🍟', 'Støvsugere': '🧹', 'Personlig pleie': '🪥', 'Hvitevarer': '🧊', 'Smarthjem': '💡', 'Spill': '💿', 'Bøker': '📚', 'Hjem og interiør': '🛋️', 'Verktøy og hage': '🔧', 'Leker og spill': '🧸', 'Sport og friluft': '🎿', 'Skjønnhet og helse': '💄', 'Dyr': '🐕', 'Bil og elbil': '🚗', 'Kontor': '📎', 'Baby': '🍼', 'Dagligvarer': '🍫', 'Jakker': '🧥', 'Gensere': '🧶', 'T-skjorter': '👕', 'Bukser og jeans': '👖', 'Kjoler': '👗', 'Sko': '👟', 'Undertøy og ull': '🧦', 'Sportsklær': '🏃', 'Tilbehør': '👜', 'Barn': '🧒', 'Alt mulig': '🎁' };

Shop.dname = (p) => p.name.startsWith(p.brand + ' ') ? p.name.slice(p.brand.length + 1) : p.name;
Shop.products = (shop) => CATALOG.PRODUCTS.filter(p => p.shop === shop);
Shop.cartCount = (shop) => (G.s.cart[shop] || []).reduce((a, l) => a + l.qty, 0);

Shop.card = function (p) {
  const pi = G.priceInfo(p);
  const sale = pi.old && pi.old > pi.price;
  const pct = sale ? Math.round((1 - pi.price / pi.old) * 100) : 0;
  const tag = pi.label === 'BLACK WEEK' ? `<span class="tag bw">BLACK −${pct}%</span>` : sale ? `<span class="tag">−${pct}%</span>` : '';
  const extra = p.shop === 'taemu' ? `<div class="sold-count">${Math.floor(p.reviews * 3.7).toLocaleString('no')} solgt</div>` : `<div>${U.stars(p.rating)} <span class="small">(${p.reviews})</span></div>`;
  const sw = p.colorName ? `<span class="cdot" style="background:${p.color}" title="${p.colorName}"></span>` : '';
  return `<div class="pcard" onclick="OS.go('product',{id:'${p.id}'})"><div class="pimg" style="${Apps.imgStyle(p)}">${p.emoji}${tag}${sw}</div><div class="pinfo"><div class="pbrand">${U.esc(p.brand)}</div><div class="pname">${U.esc(Shop.dname(p))}</div>${extra}<div class="pprice ${sale ? 'sale' : ''}">${U.kr(pi.price)} ${sale ? `<s style="font-size:12px">${U.kr(pi.old)}</s>` : ''}</div></div></div>`;
};

Shop.head = function (shop, opts = {}) {
  const c = Shop.CFG[shop]; const n = Shop.cartCount(shop);
  return `<div class="shop-head"><div class="shop-top"><button class="hbtn" onclick="OS.back()">‹</button><div class="shop-logo" onclick="OS.open('${shop}')">${c.logo}</div>
    <button class="hbtn" onclick="OS.go('orders')" title="Mine ordre">📋</button>
    <button class="hbtn" onclick="OS.go('cart')">🛒${n ? `<span class="badge">${n}</span>` : ''}</button></div>
    ${opts.noSearch ? '' : `<div class="search"><span>🔍</span><input placeholder="Søk i ${c.name}" value="${U.esc(opts.q || '')}" onkeydown="if(event.key==='Enter'){this.blur();OS.go('cat',{q:this.value})}"></div>`}</div>`;
};

function makeShop(shop) {
  const c = Shop.CFG[shop];
  const views = {};

  views.main = function () {
    const all = Shop.products(shop);
    const subs = Object.keys(CATALOG.SHOP_CATS[shop]);
    const hero = c.heroes[Math.floor(G.s.t / (6 * U.HOUR)) % c.heroes.length];
    const deals = all.filter(p => { const pi = G.priceInfo(p); return pi.old && pi.old > pi.price; }).sort((a, b) => (G.priceInfo(a).price / G.priceInfo(a).old) - (G.priceInfo(b).price / G.priceInfo(b).old)).slice(0, 14);
    const day = Math.floor(G.s.t / U.DAY);
    const rnd = U.rng(day * 7 + shop.length);
    const popular = all.slice().sort((a, b) => b.pop - a.pop).slice(0, 40);
    const recs = U.shuffle(all, rnd).slice(0, 12);
    let extra = '';
    if (shop === 'taemu') extra = `<div class="taemu-flash">⏰ LYNSALG SLUTTER OM ${U.pad(23 - new Date(G.s.t).getHours())}:${U.pad(59 - new Date(G.s.t).getMinutes())}:59 · GRATIS FRAKT · 90 DAGERS PRISJUSTERING*</div>`;
    let gender = '';
    if (shop === 'zalandoo') gender = `<div class="chips">${['Dame', 'Herre', 'Barn', 'Unisex'].map(g => `<span class="chip" onclick="OS.go('cat',{gender:'${g}'})">${g}</span>`).join('')}<span class="chip" onclick="OS.go('cat',{sale:1})">🔥 Salg</span></div>`;
    return Shop.head(shop) + `<div class="app-body">${extra}${gender}
      <div class="hero" style="background:${hero[3]}" onclick="${shop === 'taemu' && hero[2] === '🎡' ? 'Shop.wheel()' : `OS.go('cat',{sale:1})`}"><h3>${hero[0]}</h3><p>${hero[1]}</p><div class="hero-emo">${hero[2]}</div></div>
      ${shop === 'taemu' ? `<div class="card" style="display:flex;gap:12px;align-items:center;cursor:pointer" onclick="Shop.wheel()"><div style="font-size:36px">🎡</div><div><b>Spinn lykkehjulet!</b><div class="small">Garantert gevinst!! (vilkår gjelder)</div></div></div>` : ''}
      <div class="section-t">Kategorier</div>
      <div class="cat-grid">${subs.map(s => `<div class="cat-tile" onclick="OS.go('cat',{sub:'${s}'})"><span class="e">${Shop.SUB_EMOJI[s] || '🛍️'}</span>${s}</div>`).join('')}</div>
      ${deals.length ? `<div class="section-t">${G.season() === 'blackweek' ? '🖤 Black Week-tilbud' : 'Tilbud'} <a onclick="OS.go('cat',{sale:1})">Se alle</a></div><div class="hscroll">${deals.map(Shop.card).join('')}</div>` : ''}
      <div class="section-t">Populært nå</div><div class="hscroll">${popular.slice(0, 14).map(Shop.card).join('')}</div>
      <div class="section-t">${shop === 'taemu' ? 'Du trenger dette (du trenger ikke dette)' : 'Anbefalt for deg'}</div><div class="pgrid">${recs.map(Shop.card).join('')}</div>
      <p class="small" style="text-align:center;padding:10px 20px 30px">${c.tag}<br>${all.length} produkter</p>
    </div>`;
  };

  views.cat = function (p) {
    let list = Shop.products(shop);
    let title = p.sub || (p.q ? `«${p.q}»` : p.gender || (p.sale ? 'Tilbud' : 'Alle'));
    if (p.sub) list = list.filter(x => x.sub === p.sub);
    if (p.gender) list = list.filter(x => x.gender === p.gender || (p.gender !== 'Barn' && x.gender === 'Unisex'));
    if (p.sale) list = list.filter(x => { const pi = G.priceInfo(x); return pi.old && pi.old > pi.price; });
    if (p.q) { const words = p.q.toLowerCase().split(/\s+/).filter(Boolean); list = list.filter(x => { const s = (x.brand + ' ' + x.name + ' ' + x.sub + ' ' + (x.colorName || '')).toLowerCase(); return words.every(w => s.includes(w)); }); }
    const brands = [...new Set(list.map(x => x.brand))].sort();
    if (p.brand) list = list.filter(x => x.brand === p.brand);
    const sort = p.sort || 'pop';
    const pr = (x) => G.price(x);
    list = list.slice().sort({ pop: (a, b) => b.pop - a.pop, low: (a, b) => pr(a) - pr(b), high: (a, b) => pr(b) - pr(a), rating: (a, b) => b.rating - a.rating, disc: (a, b) => { const da = G.priceInfo(a), db = G.priceInfo(b); return ((db.old || db.price) - db.price) / (db.old || 1) - ((da.old || da.price) - da.price) / (da.old || 1); } }[sort]);
    const n = (p.page || 1) * 40;
    const P = (o) => U.enc(Object.assign({}, p, o));
    return Shop.head(shop, { q: p.q }) + `<div class="app-body">
      <div class="section-t" style="margin-top:12px">${U.esc(title)} <span class="small">${list.length} treff</span></div>
      ${brands.length > 1 ? `<div class="chips"><span class="chip ${!p.brand ? 'on' : ''}" onclick="OS.replace('cat',${P({ brand: null, page: 1 })})">Alle merker</span>${brands.slice(0, 40).map(b => `<span class="chip ${p.brand === b ? 'on' : ''}" onclick="OS.replace('cat',${P({ brand: b, page: 1 })})">${U.esc(b)}</span>`).join('')}</div>` : ''}
      <div class="sortbar">Sorter: <select onchange="OS.replace('cat',Object.assign(${P({})},{sort:this.value,page:1}))">${[['pop', 'Mest populære'], ['low', 'Pris: lav til høy'], ['high', 'Pris: høy til lav'], ['rating', 'Best vurdert'], ['disc', 'Største rabatt']].map(([k, v]) => `<option value="${k}" ${sort === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      ${list.length ? `<div class="pgrid">${list.slice(0, n).map(Shop.card).join('')}</div>` : `<div class="empty">Ingen treff. ${shop === 'taemu' ? 'Det er første gang i historien.' : 'Prøv et annet søk.'}</div>`}
      ${list.length > n ? `<div class="pad"><button class="btn block" onclick="OS.replace('cat',${P({ page: (p.page || 1) + 1 })})">Vis flere (${list.length - n} igjen)</button></div>` : ''}
    </div>`;
  };

  views.product = function ({ id }) {
    const p = CATALOG.get(id); if (!p) return Shop.head(shop) + '<div class="empty">Fant ikke produktet</div>';
    const pi = G.priceInfo(p); const sale = pi.old && pi.old > pi.price;
    const sel = Shop.sel[id] || (Shop.sel[id] = { variant: p.variants ? p.variants[0] : null, size: null, qty: 1 });
    const d0 = new Date(G.s.t + p.days[0] * U.DAY), d1 = new Date(G.s.t + p.days[1] * U.DAY);
    const from = { NO: 'Norge', SE: 'Sverige', DE: 'Tyskland', PL: 'Polen', NL: 'Nederland', CN: 'Kina' }[p.from];
    const similar = Shop.products(shop).filter(x => x.sub === p.sub && x.id !== p.id).sort(() => 0).slice(0, 200);
    const rnd = U.rng(parseInt(p.id.slice(2), 36) + 99);
    const sim = U.shuffle(similar, rnd).slice(0, 8);
    const owned = G.s.inventory.filter(i => i.pid === id).length;
    return Shop.head(shop, { noSearch: true }) + `<div class="app-body">
      <div class="pd-img" style="${Apps.imgStyle(p)}">${p.emoji}${pi.label ? `<span class="tag ${pi.label === 'BLACK WEEK' ? 'bw' : ''}" style="position:absolute;top:12px;left:12px;font-size:13px;padding:5px 9px;border-radius:6px;background:${pi.label === 'BLACK WEEK' ? '#000' : '#e4002b'};color:#fff;font-weight:800">${pi.label}</span>` : ''}</div>
      <div class="pd-main">
        <div class="pd-brand">${U.esc(p.brand)}</div>
        <div class="pd-name">${U.esc(p.name)}</div>
        <div>${U.stars(p.rating)} <span class="small">${p.rating.toFixed(1).replace('.', ',')} · ${p.reviews} vurderinger</span></div>
        <div class="pd-price ${sale ? 'sale' : ''}">${U.kr(pi.price)}</div>
        ${sale ? `<div class="small">Førpris <s>${U.kr(pi.old)}</s> · Du sparer ${U.kr(pi.old - pi.price)}${pi.label === 'BLACK WEEK' ? ' (førpris = forrige ukes pris 😇)' : ''}</div>` : ''}
        ${shop === 'taemu' ? `<div class="small" style="color:#fb7701">🔥 ${Math.floor(p.reviews * 3.7).toLocaleString('no')} solgt · Bare ${U.int(2, 9, rnd)} igjen på lager!!</div>` : ''}
        ${p.price >= 1500 ? `<div class="small" style="margin-top:4px">💗 Eller fra ${U.kr(G.annuity(pi.price, 24.9, 36) + 39)}/mnd med Klarnå</div>` : ''}
        ${p.variants ? `<label class="lbl">${p.variantLabel || 'Variant'}: <b>${sel.variant}</b></label><div class="pd-opts">${p.variants.map(v => `<span class="opt ${sel.variant === v ? 'on' : ''}" onclick="Shop.sel['${id}'].variant='${v.replace(/'/g, "\\'")}';OS.render(true)">${CATALOG.COLORS[v] ? `<span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${CATALOG.COLORS[v]};border:1px solid #ccc;vertical-align:-1px;margin-right:5px"></span>` : ''}${v}</span>`).join('')}</div>` : ''}
        ${p.colorName ? `<div class="small" style="margin-top:8px">Farge: <b>${p.colorName}</b></div>` : ''}
        ${p.sizes ? `<label class="lbl">Størrelse ${sel.size ? ': <b>' + sel.size + '</b>' : '<span class="red">(velg)</span>'}</label><div class="pd-opts">${p.sizes.map(s => `<span class="opt ${sel.size === s ? 'on' : ''}" onclick="Shop.sel['${id}'].size='${s}';OS.render(true)">${s}</span>`).join('')}</div>${shop === 'zalandoo' ? `<div class="small">📏 ${U.pick(['Varen er liten i størrelsen.', 'Normal i størrelsen.', 'Kunder sier: stor i størrelsen.', 'Ingen vet hvordan den passer.'], rnd)}</div>` : ''}` : ''}
        <div class="pd-ship">🚚 Levering ${U.date(d0)}–${U.date(d1)} · Sendes fra ${from}${shop === 'taemu' ? ' (antakelig)' : ''}</div>
        ${owned ? `<div class="small">📦 Du eier allerede ${owned} av denne.</div>` : ''}
      </div>
      <div class="card"><b>Om produktet</b><p style="font-size:14px;line-height:1.45;color:#333">${U.esc(p.desc)}</p>${p.specs.map(([k, v]) => `<div class="kv"><span>${k}</span><span>${U.esc(v)}</span></div>`).join('')}</div>
      <div class="card"><b>Kundeanmeldelser</b>${Shop.reviews(p, rnd)}</div>
      ${sim.length ? `<div class="section-t">Kunder kjøpte også</div><div class="hscroll">${sim.map(Shop.card).join('')}</div>` : ''}
      <div style="height:20px"></div>
    </div>
    <div class="buybar"><button class="btn" onclick="Shop.add('${shop}','${id}')">Legg i handlekurv</button><button class="btn primary" onclick="Shop.add('${shop}','${id}',true)">Kjøp nå</button></div>`;
  };

  views.cart = function () {
    const lines = G.s.cart[shop];
    if (!lines.length) return Shop.head(shop, { noSearch: true }) + `<div class="app-body"><div class="empty">🛒<br>Handlekurven er tom.<br>${shop === 'taemu' ? 'Det må vi gjøre noe med!!!' : 'Den trives ikke sånn.'}</div><div class="pad"><button class="btn primary block" onclick="OS.open('${shop}')">Fortsett å handle</button></div></div>`;
    const sum = Shop.sum(shop);
    return Shop.head(shop, { noSearch: true }) + `<div class="app-body"><div class="section-t" style="margin-top:12px">Handlekurv</div>
      ${lines.map((l, i) => { const p = CATALOG.get(l.pid); const pr = G.price(p); return `<div class="cart-line"><div class="ci" style="${Apps.imgStyle(p)}" onclick="OS.go('product',{id:'${p.id}'})">${p.emoji}</div><div style="flex:1;min-width:0"><div class="pbrand">${U.esc(p.brand)}</div><div style="font-size:14px">${U.esc(p.name)}</div><div class="small">${[l.variant, l.size ? 'Str ' + l.size : '', p.colorName].filter(Boolean).join(' · ')}</div><div class="qty"><button onclick="Shop.qty('${shop}',${i},-1)">−</button><b>${l.qty}</b><button onclick="Shop.qty('${shop}',${i},1)">+</button><span style="margin-left:auto;font-weight:800">${U.kr(pr * l.qty)}</span></div></div></div>`; }).join('')}
      <div class="card">
        <div class="kv"><span>Delsum</span><span>${U.kr(sum.sub)}</span></div>
        <div class="kv"><span>Frakt</span><span>${sum.ship ? U.kr(sum.ship) : 'Gratis'}</span></div>
        ${c.freeOver && sum.ship ? `<div class="small">Handle for ${U.kr(G.SHOPS[shop].freeOver - sum.sub)} til for gratis frakt!</div>` : ''}
        <div class="kv" style="font-weight:800;font-size:17px"><span>Totalt</span><span>${U.kr(sum.sub + sum.ship)}</span></div>
      </div>
      <div class="pad"><button class="btn primary block" onclick="Shop.co={delivery:'pickup',method:'debit',months:12,warranty:${shop === 'elkjopt'},prime:${shop === 'amazoom' && !(G.s.subs || []).some(s => s.id === 'prime')}};OS.go('checkout')">Gå til kassen</button></div></div>`;
  };

  views.checkout = function () {
    const co = Shop.co; const sum = Shop.sum(shop);
    const lines = G.s.cart[shop]; if (!lines.length) return views.cart();
    const del = { pickup: ['📦 Hentested', 'Levering til nærmeste hentested', 0], home: ['🏠 Hjemlevering', 'På døra (i teorien)', 79], express: ['⚡ Ekspress', 'Raskere – men fortsatt PostNei', 149] };
    const dels = shop === 'taemu' ? ['pickup'] : shop === 'zalandoo' ? ['pickup', 'home'] : ['pickup', 'home', 'express'];
    const ship = sum.ship + del[co.delivery][2];
    const wElig = shop === 'elkjopt' ? lines.reduce((a, l) => a + G.price(CATALOG.get(l.pid)) * l.qty, 0) : 0;
    const warranty = co.warranty ? Math.round(wElig * 0.19) : 0;
    const coupon = shop === 'taemu' ? (G.s.coupons || []).find(x => x.until > G.s.t && sum.sub >= x.min) : null;
    const discount = coupon ? Math.round(sum.sub * coupon.pct / 100) : 0;
    const total = sum.sub + ship + warranty - discount;
    const kl = G.klarnaLimit() - G.klarnaOutstanding();
    const pays = [
      ['debit', '💳', 'Bankkort', `Brukskonto · saldo ${U.kr(G.s.bank.checking)}`, G.s.bank.checking >= total],
      ['credit', '💎', 'Kredittkort (SpareMinus Visa)', `Disponibelt ${U.kr(G.cardAvail())} · 23,4 % rente`, G.cardAvail() >= total],
      ['klarna:invoice', '💗', 'Klarnå – faktura 14 dager', `+ 39 kr fakturagebyr («helt gratis»)`, kl >= total],
    ];
    if (shop === 'zalandoo') pays.push(['klarna:invoice30', '💗', 'Klarnå – prøv først, betal om 30 dager', '+ 49 kr gebyr', kl >= total]);
    if (total >= 300) pays.push(['klarna:split3', '💗', 'Klarnå – del opp i 3, rentefritt', `3 × ${U.kr(total / 3)} hver 30. dag`, kl >= total]);
    if (total >= 1500) pays.push(['klarna:finance', '💗', 'Klarnå – finansiering', `fra ${U.kr(G.annuity(total, 24.9, co.months) + 39)}/mnd i ${co.months} mnd · 24,9 % rente`, kl >= total]);
    Shop._total = { total, ship, warranty, discount, coupon };
    return Shop.head(shop, { noSearch: true }) + `<div class="app-body"><div class="pad">
      <h3 style="margin:4px 0 10px">Kasse</h3>
      <div class="card" style="margin:0 0 10px"><div class="small">Leveres til</div><b>Deg Selv</b><div class="small">Pakkeveien 12, 5500 Pakkeby</div></div>
      <b>Levering</b>
      ${dels.map(k => `<div class="pay-opt ${co.delivery === k ? 'on' : ''}" onclick="Shop.co.delivery='${k}';OS.render(true)"><div class="pi">${del[k][0].split(' ')[0]}</div><div style="flex:1"><div class="pt">${del[k][0].slice(2)}</div><div class="ps">${del[k][1]}</div></div><b>${del[k][2] ? '+' + U.kr(del[k][2]) : ''}</b></div>`).join('')}
      ${shop === 'elkjopt' ? `<div class="upsell"><input type="checkbox" ${co.warranty ? 'checked' : ''} onchange="Shop.co.warranty=this.checked;OS.render(true)" style="width:22px;height:22px"><div><b>🛡️ Elkjøpt Trygghetsavtale 3 år</b> – ${U.kr(Math.round(wElig * 0.19))}<div class="small">Dekker alt som ikke dekkes av reklamasjonsretten, som du allerede har gratis. Anbefales av våre selgere (de får provisjon).</div></div></div>` : ''}
      ${shop === 'amazoom' && !(G.s.subs || []).some(s => s.id === 'prime') ? `<div class="upsell"><input type="checkbox" ${co.prime ? 'checked' : ''} onchange="Shop.co.prime=this.checked;OS.render(true)" style="width:22px;height:22px"><div><b>📦 Prøv Amazoom Prime gratis!</b><div class="small">Gratis i 30 dager. Deretter 79 kr/mnd til du sier opp (lykke til med å finne knappen).</div></div></div>` : ''}
      ${coupon ? `<div class="upsell">🎟️ Kupong −${coupon.pct} % brukt!</div>` : (shop === 'taemu' && (G.s.coupons || []).some(x => x.until > G.s.t) ? `<div class="upsell">🎟️ Du har en kupong, men den krever minst ${U.kr(G.s.coupons.find(x => x.until > G.s.t).min)} i handlekurven.</div>` : '')}
      <b style="display:block;margin-top:14px">Betaling</b>
      ${pays.map(([k, i, t, s, ok]) => `<div class="pay-opt ${co.method === k ? 'on' : ''} ${ok ? '' : 'dis'}" onclick="Shop.co.method='${k}';OS.render(true)"><div class="pi">${i}</div><div style="flex:1"><div class="pt">${t}</div><div class="ps">${s}${ok ? '' : ' · <span class="red">ikke nok dekning</span>'}</div>${k === 'klarna:finance' && co.method === k ? `<div style="margin-top:6px">${[6, 12, 24, 36].map(m => `<span class="chip ${co.months === m ? 'on' : ''}" onclick="event.stopPropagation();Shop.co.months=${m};OS.render(true)">${m} mnd</span>`).join('')}</div>` : ''}</div></div>`).join('')}
      <div class="card" style="margin:12px 0">
        <div class="kv"><span>Varer</span><span>${U.kr(sum.sub)}</span></div>
        <div class="kv"><span>Frakt</span><span>${ship ? U.kr(ship) : 'Gratis'}</span></div>
        ${warranty ? `<div class="kv"><span>Trygghetsavtale</span><span>${U.kr(warranty)}</span></div>` : ''}
        ${discount ? `<div class="kv"><span>Kupong</span><span class="green">−${U.kr(discount)}</span></div>` : ''}
        <div class="kv" style="font-weight:800;font-size:18px"><span>Å betale</span><span>${U.kr(total)}</span></div>
      </div>
      <button class="btn primary block" style="padding:15px" onclick="Shop.pay('${shop}')">${co.method.startsWith('klarna') ? 'Fullfør med Klarnå 💗' : 'Betal ' + U.kr(total)}</button>
      <p class="small" style="text-align:center">Ved å trykke godtar du 47 sider med vilkår du ikke har lest.</p>
    </div></div>`;
  };

  views.done = function ({ id }) {
    const o = G.order(id);
    return Shop.head(shop, { noSearch: true }) + `<div class="app-body"><div class="pad" style="text-align:center">
      <div style="font-size:64px;margin-top:20px">${shop === 'taemu' ? '🎉🎊🥳' : '✅'}</div><h2>Takk for kjøpet!</h2>
      <p>Ordre <b>${o.id}</b> er mottatt.<br>Totalt ${U.kr(o.total)}.</p><p class="small">Bekreftelse er sendt på e-post. Du får sporingsnummer når pakken sendes.</p>
      ${shop === 'taemu' ? '<p style="color:#fb7701;font-weight:700">Du har låst opp 3 nye kuponger!!! (kan ikke brukes)</p>' : ''}
      <button class="btn primary block" onclick="OS.open('${shop}')">Fortsett å handle</button>
      <button class="btn block" onclick="OS.go('order',{id:'${o.id}'})">Se ordren</button>
    </div></div>`;
  };

  views.orders = function () {
    const os = G.s.orders.filter(o => o.shop === shop);
    return Shop.head(shop, { noSearch: true }) + `<div class="app-body"><div class="section-t" style="margin-top:12px">Mine ordre</div>
      ${os.length ? `<div class="list">${os.map(o => { const p = CATALOG.get(o.lines[0].pid); return `<div class="li" onclick="OS.go('order',{id:'${o.id}'})"><div class="inv-ico" style="${Apps.imgStyle(p)}">${p.emoji}</div><div class="grow"><div class="t1">${U.esc(p.name)}${o.lines.length > 1 ? ` + ${o.lines.length - 1} til` : ''}</div><div class="t2">${U.dt(o.t)} · ${U.kr(o.total)}</div></div><span class="status-pill ${o.status === 'Levert' ? 'done' : o.status === 'Klar for henting' ? 'ready' : ''}">${o.status}</span></div>`; }).join('')}</div>` : '<div class="empty">Ingen ordre ennå.</div>'}</div>`;
  };

  views.order = function ({ id }) {
    const o = G.order(id); if (!o) return Shop.head(shop) + '<div class="empty">?</div>';
    return Shop.head(shop, { noSearch: true }) + `<div class="app-body"><div class="card"><div class="small">Ordrenummer</div><b>${o.id}</b><div class="small" style="margin-top:6px">${U.dt(o.t)} · ${o.status}</div></div>
      <div class="list">${o.lines.map(l => { const p = CATALOG.get(l.pid); return `<div class="li" onclick="OS.go('product',{id:'${p.id}'})"><div class="inv-ico" style="${Apps.imgStyle(p)}">${p.emoji}</div><div class="grow"><div class="t1">${U.esc(p.name)}</div><div class="t2">${[l.variant, l.size ? 'Str ' + l.size : ''].filter(Boolean).join(' · ')} × ${l.qty}</div></div><b>${U.kr(l.price * l.qty)}</b></div>`; }).join('')}</div>
      <div class="card"><div class="kv"><span>Frakt</span><span>${U.kr(o.shipping)}</span></div>${o.extras ? `<div class="kv"><span>Tillegg</span><span>${U.kr(o.extras)}</span></div>` : ''}${o.discount ? `<div class="kv"><span>Rabatt</span><span>−${U.kr(o.discount)}</span></div>` : ''}<div class="kv"><b>Totalt</b><b>${U.kr(o.total)}</b></div></div>
      ${o.shipmentId ? `<div class="pad"><button class="btn primary block" onclick="OS.open('post','track',{id:'${o.shipmentId}'})">📦 Spor pakken (${o.shipmentId})</button></div>` : ''}
    </div>`;
  };

  return { name: c.name, icon: c.icon, bg: c.bg, views, badge: () => Shop.cartCount(shop) };
}

Shop.sum = function (shop) {
  const sub = G.s.cart[shop].reduce((a, l) => a + G.price(CATALOG.get(l.pid)) * l.qty, 0);
  const cfg = G.SHOPS[shop];
  const ship = cfg.ship && sub < cfg.freeOver ? cfg.ship : 0;
  return { sub, ship };
};

Shop.add = function (shop, id, now) {
  const p = CATALOG.get(id); const sel = Shop.sel[id] || {};
  if (p.sizes && !sel.size) { OS.toast('Velg størrelse først 👆'); return; }
  const cart = G.s.cart[shop];
  const ex = cart.find(l => l.pid === id && l.variant === (sel.variant || null) && l.size === (sel.size || null));
  if (ex) ex.qty++; else cart.push({ pid: id, qty: 1, variant: sel.variant || null, size: sel.size || null });
  G.save();
  if (now) { Shop.co = { delivery: 'pickup', method: 'debit', months: 12, warranty: shop === 'elkjopt', prime: shop === 'amazoom' && !(G.s.subs || []).some(s => s.id === 'prime') }; OS.go('checkout'); }
  else { OS.toast(shop === 'taemu' ? '🛒 Lagt til!!! Legg til 3 til for GRATIS GAVE!!' : '🛒 Lagt i handlekurven'); OS.render(true); }
};
Shop.qty = function (shop, i, d) {
  const l = G.s.cart[shop][i]; l.qty += d;
  if (l.qty <= 0) G.s.cart[shop].splice(i, 1);
  OS.render(true);
};

Shop.pay = function (shop) {
  const co = Shop.co, T = Shop._total;
  const lines = G.s.cart[shop].map(l => ({ pid: l.pid, qty: l.qty, variant: l.variant, size: l.size, price: G.price(CATALOG.get(l.pid)), warranty: shop === 'elkjopt' && co.warranty }));
  OS.modal(`<div class="processing"><div class="spinner"></div><b>${co.method.startsWith('klarna') ? 'Klarnå sjekker kredittverdigheten din…' : 'Behandler betaling…'}</b><p class="small">${co.method.startsWith('klarna') ? 'Det tar 0,3 sekunder. Vi ser ikke så nøye etter.' : 'BankID-ish verifisering'}</p></div>`, true);
  setTimeout(() => {
    const res = G.placeOrder(shop, lines, { shipping: T.ship, extras: T.warranty, discount: T.discount, method: co.method, months: co.months, delivery: co.delivery });
    OS.closeModal();
    if (!res.ok) { OS.modal(`<div style="text-align:center"><div style="font-size:48px">❌</div><p>${res.msg}</p><button class="btn primary block" onclick="OS.closeModal()">OK</button></div>`); return; }
    if (T.coupon) G.s.coupons = G.s.coupons.filter(c => c !== T.coupon);
    if (co.warranty && T.warranty) G.ach('warranty');
    if (shop === 'amazoom' && co.prime) {
      G.s.subs = G.s.subs || [];
      G.s.subs.push({ id: 'prime', name: 'Amazoom Prime', price: 79, start: G.s.t + 30 * U.DAY, day: new Date(G.s.t).getDate() });
    }
    G.s.cart[shop] = [];
    G.save();
    OS.stack = [{ view: 'main', params: {} }];
    OS.go('done', { id: res.order.id });
  }, 1300);
};

Shop.REV = {
  pos: [['Helt topp!', 'Kom raskt og fungerer akkurat som den skal.'], ['Kjempefornøyd', 'Kjøpte til samboeren. Nå har vi to.'], ['Anbefales', 'Femte gang jeg kjøper denne. Har ikke tenkt å slutte.'], ['Supert', 'Kvalitet til prisen. Kona er misfornøyd med prisen, men ellers bra.'], ['Bedre enn forventet', 'Hadde lave forventninger, og de ble knust.'], ['10/10', 'Ingen klager, bortsett fra at jeg nå er blakk.']],
  mid: [['Grei nok', 'Gjør jobben, men ikke noe mer.'], ['Ok', 'Pakken kom tre dager for sent, men varen er fin.'], ['Helt ok', 'Litt mindre enn forventet. Det gjelder både varen og livet generelt.'], ['Middels', 'Fungerer. Emballasjen var finere enn produktet.']],
  neg: [['Skuffet', 'Gikk i stykker etter to dager. Kundeservice svarte aldri.'], ['Ikke kjøp!', 'Fikk feil farge. Og feil vare. Og den kom til naboen.'], ['Elendig levering', 'Varen er sikkert fin, men PostNei mistet den to ganger.'], ['1 stjerne', 'Gir én stjerne fordi null ikke er mulig.']],
  taemu: [['Veldig bra', 'Veldig bra produkt god kvalitet rask frakt anbefaler til alle venner 5 stjerner'], ['Fornøyd', 'Som beskrevet. Kom etter 5 uker. Er fortsatt glad.'], ['Bra pris', 'For denne prisen kan man ikke klage. Så jeg klager ikke. Men den virker ikke.'], ['God', 'Produktet ankom. Det er produkt. Takk selger.']],
  names: ['Kari N.', 'Ole H.', 'Ingrid', 'Per-Kristian', 'Marte S.', 'Lars', 'Siv', 'Eirik B.', 'Hilde', 'Jonas', 'Anette', 'Trond', 'Silje M.', 'Ahmed', 'Nora', 'Bjørnar'],
};
Shop.reviews = function (p, rnd) {
  let out = '';
  for (let i = 0; i < 3; i++) {
    const r = rnd();
    const stars = p.shop === 'taemu' ? 5 : r < (p.rating - 3) / 2 ? 5 : r < 0.75 ? 4 : r < 0.88 ? 3 : U.int(1, 2, rnd);
    const pool = p.shop === 'taemu' ? Shop.REV.taemu : stars >= 4 ? Shop.REV.pos : stars === 3 ? Shop.REV.mid : Shop.REV.neg;
    const [h, t] = U.pick(pool, rnd);
    const who = p.shop === 'taemu' ? U.pick('ABCDEFGHJKLMNOPRST'.split(''), rnd) + '***' + U.pick('aeiou'.split(''), rnd) : U.pick(Shop.REV.names, rnd);
    const sizeNote = p.sizes && p.shop === 'zalandoo' && rnd() < 0.5 ? ' ' + U.pick(['Stor i størrelsen, gå ned en.', 'Liten i størrelsen.', 'Passer perfekt.'], rnd) : '';
    out += `<div class="review">${U.stars(stars)}<b>${h}</b>${t}${sizeNote}<div class="who">${who} · Verifisert kjøp</div></div>`;
  }
  return out;
};

Shop.wheel = function () {
  const can = !(G.s.coupons || []).some(c => c.until > G.s.t) && (G.s.lastSpin || 0) < G.s.t - 12 * U.HOUR;
  OS.modal(`<div style="text-align:center"><h3 style="margin:0">🎡 Tæmu Lykkehjul</h3><p class="small">Garantert gevinst!!!</p><div class="wheel-ptr">🔻</div><div class="wheel" id="wheel"></div><div id="wres" style="min-height:44px"></div>
    ${can ? '<button class="btn primary block" id="spinbtn" onclick="Shop.spin()">SPINN!!</button>' : '<p class="small">Du kan spinne igjen om litt. (Eller når du har brukt kupongen.)</p><button class="btn block" onclick="OS.closeModal()">Lukk</button>'}</div>`);
};
Shop.spin = function () {
  const pct = U.pick([30, 50, 70, 90]);
  const min = { 30: 400, 50: 1200, 70: 2500, 90: 5000 }[pct];
  U.$('#spinbtn').disabled = true;
  U.$('#wheel').style.transform = `rotate(${1440 + U.int(0, 359)}deg)`;
  G.s.lastSpin = G.s.t;
  setTimeout(() => {
    G.s.coupons = (G.s.coupons || []).concat([{ pct, min, until: G.s.t + 2 * U.DAY }]);
    U.$('#wres').innerHTML = `<h2 style="color:#fb7701;margin:6px 0">−${pct}% KUPONG!!!</h2><div class="small">Gjelder ved kjøp over ${U.kr(min)}. Utløper om 48 timer.</div>`;
    U.$('#spinbtn').outerHTML = '<button class="btn primary block" onclick="OS.closeModal()">Shop nå!!!</button>';
  }, 3100);
};

['amazoom', 'zalandoo', 'elkjopt', 'taemu'].forEach(s => { Apps[s] = makeShop(s); });
