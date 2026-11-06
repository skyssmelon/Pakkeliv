// ===== Hjelpefunksjoner =====
const U = {};

U.rng = function (seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
U.r = Math.random;
U.pick = (arr, r = Math.random) => arr[Math.floor(r() * arr.length)];
U.int = (a, b, r = Math.random) => Math.floor(a + r() * (b - a + 1));
U.chance = (p, r = Math.random) => r() < p;
U.shuffle = (arr, r = Math.random) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

U.kr = (n) => {
  const v = Math.round(n);
  return (v < 0 ? '−' : '') + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',-';
};
U.kr2 = (n) => {
  const neg = n < 0; n = Math.abs(n);
  const [i, d] = n.toFixed(2).split('.');
  return (neg ? '−' : '') + 'kr ' + i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + d;
};
U.esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

U.DAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
U.MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];
U.MON = ['jan', 'feb', 'mar', 'apr', 'mai', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'des'];
U.pad = (n) => String(n).padStart(2, '0');
U.time = (t) => { const d = new Date(t); return U.pad(d.getHours()) + ':' + U.pad(d.getMinutes()); };
U.date = (t) => { const d = new Date(t); return d.getDate() + '. ' + U.MON[d.getMonth()]; };
U.dateLong = (t) => { const d = new Date(t); return U.DAYS[d.getDay()] + ' ' + d.getDate() + '. ' + U.MONTHS[d.getMonth()]; };
U.dt = (t) => U.date(t) + ' ' + U.time(t);
U.HOUR = 3600e3; U.DAY = 86400e3; U.MIN = 60e3;

U.id = (prefix = '') => prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
U.digits = (n) => { let s = ''; for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10); return s; };

U.h = function (html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
U.$ = (sel, root = document) => root.querySelector(sel);
U.$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

U.stars = (r) => `<span class="stars"><span class="stars-on" style="width:${(r / 5) * 100}%">★★★★★</span>★★★★★</span>`;
U.enc = (o) => `JSON.parse(decodeURIComponent('${encodeURIComponent(JSON.stringify(o)).replace(/'/g, '%27')}'))`;
