"use strict";
/* ================= codebook (from 261020_Coding_Table_shortened.xlsx) ================= */
// The codebook text is not part of the public code. After sign-in the app loads the
// codebook from the protected database after sign-in (definitions for the team, headings for exports).
let CB = {defs:[], headers:[], legend:[]};
const SHOW_CODEBOOK = true;
const GENERIC_HEADERS = ['Article ID','Coder','Dataset','URL','Prescreening 1','Prescreening 2','Prescreening 3','Xi quoted','Party reference','Western reference','Spatial setting','Temporal setting',
  'Char 1 name','Char 1 valid','Char 1 action','Char 1 PRC','Char 1 level','Char 1 role','Char 2 name','Char 2 valid','Char 2 PRC','Char 2 level','Char 2 role',
  'Char 3 name','Char 3 valid','Char 3 PRC','Char 3 level','Char 3 role','Char 4 name','Char 4 valid','Char 4 PRC','Char 4 level','Char 4 role',
  'More than four characters','Characters with clear role','Plot 1 technology','Plot 1 type','Plot 2 exists','Plot 2 technology','Plot 2 type','Moral policy','Moral ideological','Narrative summary'];
const resHeaders = () => CB.headers && CB.headers.length === 43 ? CB.headers : GENERIC_HEADERS;
const resLegend = () => CB.legend && CB.legend.length === 43 ? CB.legend : GENERIC_HEADERS.map(() => '');
document.documentElement.classList.add('nocb');
const DEF = i => CB.defs[i] || ['', ''];

/* ================= constants ================= */
const CODERS = [
  {code:'1', ini:'KSK'}, {code:'2', ini:'WW'}, {code:'3', ini:'MS'},
  {code:'4', ini:'HR'}, {code:'5', ini:'GJL'}, {code:'6', ini:'AD'}, {code:'7', ini:'CC'}
];
const CATS = [
  {id:'xi',      short:'Xi quote',      label:'Xi Jinping quoted',                     key:'x', grp:'Ideology',   color:'#c2410c', def:14},
  {id:'party',   short:'Party ref.',    label:'Party document / institution / event',  key:'p', grp:'Ideology',   color:'#dc2626', def:15},
  {id:'west',    short:'Western ref.',  label:'Western document / institution / event',key:'w', grp:'Ideology',   color:'#2563eb', def:16},
  {id:'spatial', short:'Place',         label:'Spatial setting (place)',               key:'s', grp:'Setting',    color:'#0d9488', def:19},
  {id:'temporal',short:'Time',          label:'Temporal setting (time)',               key:'t', grp:'Setting',    color:'#65a30d', def:20},
  {id:'char',    short:'Character',     label:'Character',                             key:'c', grp:'Characters', color:'#7c3aed', def:22},
  {id:'action',  short:'Action',        label:'Character action',                      key:'a', grp:'Characters', color:'#db2777', def:25},
  {id:'tech',    short:'Technology',    label:'Technology in the plot',                key:'g', grp:'Plot',       color:'#475569', def:41, plot:true},
  {id:'pos',     short:'Positive turn', label:'Positive turn (success, progress)',     key:'+', grp:'Plot',       color:'#16a34a', def:42, plot:true},
  {id:'neg',     short:'Negative turn', label:'Negative turn (decline, failure)',      key:'-', grp:'Plot',       color:'#9f1239', def:42, plot:true, dash:true},
  {id:'mpol',    short:'Policy moral',  label:'Moral: policy type',                    key:'m', grp:'Moral',      color:'#ca8a04', def:45},
  {id:'mideo',   short:'Ideol. moral',  label:'Moral: ideological type',               key:'i', grp:'Moral',      color:'#0284c7', def:46},
  {id:'note',    short:'Memo',          label:'Memo (your own note)',                  key:'n', grp:'Memo',       color:'#78716c', dash:true}
];
const CM = Object.fromEntries(CATS.map(c => [c.id, c]));
const KEYCAT = Object.fromEntries(CATS.map(c => [c.key, c.id]));
KEYCAT['='] = 'pos'; KEYCAT['_'] = 'neg';

const F = [
  {k:'p1', sec:'Prescreening', label:'Topical relevance', def:9},
  {k:'p2', sec:'Prescreening', label:'Characters recognisable', def:10},
  {k:'p3', sec:'Prescreening', label:'Plot recognisable', def:11},
  {k:'xi', sec:'Level of ideology', label:'Xi Jinping quoted', def:14, cat:'xi'},
  {k:'party', sec:'Level of ideology', label:'Party document / institution / event', def:15, cat:'party'},
  {k:'west', sec:'Level of ideology', label:'Western document / institution / event', def:16, cat:'west'},
  {k:'spatial', sec:'Setting', label:'Spatial setting', def:19, cat:'spatial'},
  {k:'temporal', sec:'Setting', label:'Temporal setting', def:20, cat:'temporal'},
  {k:'more4', sec:'Characters', label:'More than four characters', def:37, fromChars:true},
  {k:'nchars', sec:'Characters', label:'Characters with a clear role', def:38, fromChars:true, num:true},
  {k:'t1', sec:'Plot', label:'Plot 1: technology part of plot', def:41, cat:'tech', plot:1},
  {k:'pt1', sec:'Plot', label:'Plot 1: plot type', def:42, ptype:1},
  {k:'pl2', sec:'Plot', label:'Parallel plot 2 exists', def:40},
  {k:'t2', sec:'Plot', label:'Plot 2: technology part of plot', def:41, cat:'tech', plot:2, dep:'pl2'},
  {k:'pt2', sec:'Plot', label:'Plot 2: plot type', def:42, ptype:2, dep:'pl2'},
  {k:'mpol', sec:'Moral of the story', label:'Policy-type moral', def:45, cat:'mpol'},
  {k:'mideo', sec:'Moral of the story', label:'Ideological-type moral', def:46, cat:'mideo'}
];
const FM = Object.fromEntries(F.map(f => [f.k, f]));
const SEC_DEF = {'Prescreening':8, 'Level of ideology':13, 'Setting':18, 'Characters':22, 'Plot':40, 'Moral of the story':44};
const OPT = {
  bin:[[1,'Yes'],[0,'No']],
  plot:[[1,'Positive'],[2,'Negative'],[3,'Mixed']],
  level:[[1,'State'],[2,'Domain'],[3,'Citizen']],
  role:[[1,'Hero'],[2,'Villain'],[3,'Victim'],[4,'Beneficiary']]
};
const lab = (kind, v) => { const o = (OPT[kind] || []).find(x => x[0] === v); return o ? o[1] : (v === '' || v == null ? '–' : String(v)); };
const fieldKind = f => f.ptype ? 'plot' : f.num ? 'num' : 'bin';
const ROLE_COL = {1:'#16a34a', 2:'#dc2626', 3:'#ca8a04', 4:'#0284c7'};

/* ================= practice material (fictional) ================= */
const PRACTICE = [
  {key:'practice-en', id:'PRACTICE-EN', dataset:'2', practice:true, url:'', ebene:'',
   title:'Practice: solar base on former mining land (fictional text)',
   text:`Taiyuan, March 2025. Shanxi's provincial government has opened a two-gigawatt solar and storage base on former mining land near Datong. Officials said the project follows the principle of "establishing the new before breaking the old" laid down in the Party's 14th Five-Year Plan.

According to the provincial energy bureau, the new battery storage stations allow the grid to absorb more solar power at midday, while coal plants remain available as backup. Local residents who lost their jobs when two mines closed in 2023 have been retrained as maintenance technicians by the operator, Jinyuan Energy.

Observers abroad were less optimistic. A report published in Brussels by a European research network warned that new coal approvals in the province still outpace retirements, which could lock in emissions for decades.

Analysts at a Beijing think tank argued that China must accelerate market reforms so that storage operators are paid fairly. Green development, they said, is the only way forward.`},
  {key:'practice-cn', id:'PRACTICE-CN', dataset:'1', practice:true, url:'', ebene:'',
   title:'练习：大同储能电站（虚构文本）',
   text:`2025年3月，山西省大同市一座新建的储能电站正式投运。省能源局表示，该项目坚持先立后破，在新能源可靠替代之前，煤电仍将发挥兜底保障作用。

据运营企业介绍，当地关闭煤矿后的部分工人已接受培训，转岗为光伏运维人员，收入有所提高。

专家指出，必须加快电力市场改革，让储能获得合理收益。`}
];
const EXAMPLE_CODINGS = {
  exA:{label:'Example coder A', anns:[
      ['spatial','Taiyuan'],['spatial','near Datong'],['temporal','March 2025'],['party',"the Party's 14th Five-Year Plan"],
      ['west','A report published in Brussels by a European research network'],
      ['char',"Shanxi's provincial government",'c1'],['action','has opened a two-gigawatt solar and storage base','c1'],
      ['char','Local residents','c2'],['action','have been retrained as maintenance technicians','c2'],
      ['char','Jinyuan Energy','c3'],['tech','battery storage stations',null,1],
      ['pos','allow the grid to absorb more solar power',null,1],['neg','could lock in emissions for decades',null,1],
      ['mpol','China must accelerate market reforms so that storage operators are paid fairly'],['mideo','is the only way forward']],
    chars:[{id:'c1',name:"Shanxi's provincial government",en:'Shanxi provincial government',prc:1,level:1,role:1},
           {id:'c2',name:'Local residents',en:'Local residents',prc:1,level:3,role:4},
           {id:'c3',name:'Jinyuan Energy',en:'Jinyuan Energy',valid:1,prc:1,level:2,role:1}],
    codes:{p1:1,p2:1,p3:1,pt1:3},
    summary:"Set in Taiyuan and Datong and in March 2025, this is a story about how Shanxi's provincial government opens a solar and storage base and local residents have been retrained as maintenance technicians. The take-away message is that China must accelerate market reforms and green development is the only way forward."},
  exB:{label:'Example coder B', anns:[
      ['spatial','near Datong'],['temporal','March 2025'],['temporal','in 2023'],['party',"the Party's 14th Five-Year Plan"],
      ['west','A report published in Brussels by a European research network'],
      ['char',"Shanxi's provincial government",'c1'],['action','has opened a two-gigawatt solar and storage base','c1'],
      ['char','Local residents','c2'],['action','lost their jobs','c2'],
      ['char','Jinyuan Energy','c3'],['action','retrained','c3'],
      ['tech','battery storage stations',null,1],['pos','allow the grid to absorb more solar power',null,1],
      ['mpol','China must accelerate market reforms']],
    chars:[{id:'c1',name:"Shanxi's provincial government",en:'Shanxi provincial government',prc:1,level:1,role:1},
           {id:'c2',name:'Local residents',en:'Local residents',prc:1,level:3,role:3},
           {id:'c3',name:'Jinyuan Energy',en:'Jinyuan Energy',prc:1,level:2,role:1}],
    codes:{p1:1,p2:1,p3:1},
    summary:"Set in Datong and in March 2025, this is a story about how Shanxi's provincial government has opened a solar and storage base, and Jinyuan Energy retrained local residents who lost their jobs. The take-away message is that China must accelerate market reforms."}
};

/* ================= utilities ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone = o => JSON.parse(JSON.stringify(o ?? null));
const now = () => new Date().toISOString();
const rid = () => Math.random().toString(36).slice(2, 9);
const fmtDate = s => { if (!s) return ''; const d = new Date(s); return d.toLocaleDateString(undefined, {day:'numeric', month:'short'}) + ' ' + d.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'}); };
const fmtA = a => a == null ? '–' : (a < 0 ? '−' : '') + Math.abs(a).toFixed(3).replace(/^0/, '');
const pct = x => x == null ? '–' : Math.round(x * 100) + '%';
const isCJK = t => (t.match(/[㐀-鿿]/g) || []).length > t.length * 0.15;
const keyOf = id => { let k = String(id).trim().replace(/[^A-Za-z0-9_\-.~:@+]/g, '_').slice(0, 150); if (!k || k === '.' || k === '..') k = 'a_' + rid(); return k; };
let toastT;
function toast(msg, ms = 2600) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), ms); }
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const coderIni = code => (CODERS.find(c => c.code === String(code)) || {}).ini || (code ? 'Coder ' + code : '?');

/* ================= state ================= */
const S = {
  mode:'loading', uid:'local', coder:'', isAdmin:true, canWrite:true,
  articles:{}, profiles:{}, subs:{}, finals:{}, drafts:{},
  practiceSubs:{},
  view:'code', cur:'practice-en', plot:1, mpane:'text', members:[], email:'', auth:{}, hidden:{},
  list:{q:'', f:'all'}, rel:{basis:'first', ds:'all'}, an:{tab:'passages', cat:'', ds:'all', coder:'all', q:''},
  cmp:{key:null, sel:null, onlyDiff:false, pane:'text', scroll:false}, sync:{s:'idle', msg:'This browser only'},
  hintOff:LS.get('npf:hintOff', false), leadView:LS.get('npf:leadView', false), sel:null, menu:null, undo:[], loaded:{}
};
PRACTICE.forEach(a => S.practiceArt = Object.assign(S.practiceArt || {}, {[a.key]: a}));

function buildExample(key, ex) {
  const text = S.practiceArt[key].text; const used = {};
  const anns = ex.anns.map(([cat, phrase, c, p]) => {
    let from = 0, s = text.indexOf(phrase, from);
    const tag = cat + phrase; if (used[tag] != null) s = text.indexOf(phrase, used[tag] + 1); used[tag] = s;
    return {id:rid(), cat, s, e:s + phrase.length, t:phrase, ...(c ? {c} : {}), ...(CM[cat].plot ? {p:p || 1} : {})};
  }).filter(a => a.s >= 0);
  return {aid:key, anns, chars:clone(ex.chars), codes:clone(ex.codes), summary:ex.summary, memo:'', status:'submitted',
          submittedAt:'2026-01-01T09:00:00Z', firstSubmittedAt:'2026-01-01T09:00:00Z', revisions:0, example:true};
}
const EXAMPLE_SUBS = {exA: buildExample('practice-en', EXAMPLE_CODINGS.exA), exB: buildExample('practice-en', EXAMPLE_CODINGS.exB)};

/* ---------- local persistence ---------- */
const LKEY = 'npf-annotator:v1';
function loadLocal() {
  const d = LS.get(LKEY, {});
  S.practiceSubs = d.practiceSubs || {};
  S.practiceDrafts = d.practiceDrafts || {};
  S.local = d.local || {articles:{}, drafts:{}, subs:{}, finals:{}, profiles:{}, coder:''};
}
function persistLocal() {
  LS.set(LKEY, {practiceSubs:S.practiceSubs, practiceDrafts:S.practiceDrafts, local:S.local});
}

/* ================= data access ================= */
const isPractice = key => !!(S.practiceArt[key]);
function art(key) { return S.practiceArt[key] || S.articles[key]; }
function corpus() {
  return Object.values(S.articles).filter(a => !a.archived).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.id).localeCompare(String(b.id), undefined, {numeric:true}));
}
function draft(key, create = true) {
  const store = isPractice(key) ? S.practiceDrafts : S.drafts;
  if (!store[key] && create) store[key] = {aid:key, anns:[], chars:[], codes:{}, summary:'', memo:'', status:'draft', updatedAt:now()};
  return store[key];
}
function subsOf(key) {
  if (isPractice(key)) {
    const out = key === 'practice-en' ? {...EXAMPLE_SUBS} : {};
    if (S.practiceSubs[key]) out[S.uid] = S.practiceSubs[key];
    return out;
  }
  const out = {};
  for (const [uid, m] of Object.entries(S.subs)) if (m[key]) out[uid] = m[key];
  return out;
}
const mySub = key => subsOf(key)[S.uid];
function assigned(a) { return Array.isArray(a.coders) && a.coders.length ? a.coders.map(String) : null; }
function canSeeOthers(key) {
  if (mySub(key)) return true;
  if (isPractice(key)) return false;
  const a = art(key); const as = a && assigned(a);
  const mine = as ? as.includes(String(S.coder)) : true;
  return S.isAdmin && (!mine || S.leadView);
}
function coderLabel(uid) {
  if (EXAMPLE_CODINGS[uid]) return EXAMPLE_CODINGS[uid].label;
  if (uid === S.uid) return 'You' + (S.coder ? ' · ' + coderIni(S.coder) : '');
  const p = S.profiles[uid]; return p && p.coder ? coderIni(p.coder) + ' (' + p.coder + ')' : 'Coder';
}
const coderCodeOf = uid => uid === S.uid ? S.coder : (S.profiles[uid] || {}).coder || '';
function myStatus(key) {
  const d = draft(key, false);
  if (d && d.status === 'submitted') return 'done';
  if (mySub(key) && (!d || d.status === 'submitted')) return 'done';
  if (d && (d.anns.length || Object.keys(d.codes).length || d.chars.length)) return 'draft';
  return 'none';
}

/* ================= derived values ================= */
function chAuto(c, ch, k) {
  const acts = (c.anns || []).filter(a => a.cat === 'action' && a.c === ch.id);
  if (k === 'valid') return acts.length ? 1 : '';
  if (k === 'action') return acts.map(a => a.t).join('; ');
  return '';
}
function cv(c, ch, k) { const v = ch[k]; if (v !== undefined && v !== null && v !== '') return v; return chAuto(c, ch, k); }
const validChars = c => (c.chars || []).filter(ch => cv(c, ch, 'valid') === 1);
function auto(c, k) {
  const f = FM[k], anns = c.anns || [];
  if (f.cat) { const n = anns.filter(a => a.cat === f.cat && (!f.plot || (a.p || 1) === f.plot)).length; return {v:n ? 1 : 0, n, why:n ? n + ' marked in text' : 'nothing marked yet'}; }
  if (f.ptype) {
    const pos = anns.filter(a => a.cat === 'pos' && (a.p || 1) === f.ptype).length, neg = anns.filter(a => a.cat === 'neg' && (a.p || 1) === f.ptype).length;
    if (pos && !neg) return {v:1, why:pos + ' positive turn' + (pos > 1 ? 's' : '')};
    if (neg && !pos) return {v:2, why:neg + ' negative turn' + (neg > 1 ? 's' : '')};
    if (pos && neg) return {v:'', why:pos + ' positive · ' + neg + ' negative: weigh them and choose'};
    return {v:'', why:'mark positive / negative turns, or choose'};
  }
  if (k === 'pl2') { const n = anns.filter(a => a.p === 2).length; return {v:n ? 1 : 0, n, why:n ? n + ' passages tagged plot 2' : 'no passage tagged plot 2'}; }
  if (k === 'nchars') { const n = validChars(c).filter(ch => cv(c, ch, 'role') !== '').length; return {v:n, why:'counted from the character cards'}; }
  if (k === 'more4') { const n = validChars(c).length; return {v:n > 4 ? 1 : 0, why:n + ' valid character' + (n === 1 ? '' : 's')}; }
  return {v:'', why:''};
}
/* prescreening: not relevant, or neither characters nor plot → no further coding */
const PRE = ['p1','p2','p3'];
const pv = (c, k) => { const v = c && c.codes ? c.codes[k] : undefined; return v === 0 || v === 1 ? v : ''; };
const screenedOut = c => !!c && (pv(c, 'p1') === 0 || (pv(c, 'p2') === 0 && pv(c, 'p3') === 0));
const preDone = c => screenedOut(c) || PRE.every(k => pv(c, k) !== '');
const outReason = c => pv(c, 'p1') === 0 ? 'the text is not topically relevant' : 'the text has neither characters nor a plot';
function val(c, k) {
  if (!c) return '';
  const f = FM[k];
  if (!PRE.includes(k) && screenedOut(c)) return '';
  if (f.dep && val(c, f.dep) !== 1) return '';
  const o = c.codes && c.codes[k];
  if (o !== undefined && o !== null && o !== '') return o;
  return auto(c, k).v;
}
function openItems(c) {
  const out = [];
  if (screenedOut(c)) return out;
  for (const k of ['p1','p2','p3']) if (val(c, k) === '') out.push({k, label:FM[k].label});
  if (!preDone(c)) return out;
  if (val(c, 'pt1') === '') out.push({k:'pt1', label:'Plot 1 type'});
  if (val(c, 'pl2') === 1 && val(c, 'pt2') === '') out.push({k:'pt2', label:'Plot 2 type'});
  (c.chars || []).forEach((ch, i) => {
    const v = cv(c, ch, 'valid');
    if (v === '') out.push({k:'ch:' + ch.id, label:'Character ' + (i + 1) + ' validity'});
    else if (v === 1) for (const kk of ['prc','level','role']) if (cv(c, ch, kk) === '') { out.push({k:'ch:' + ch.id, label:'Character ' + (i + 1) + ' ' + (kk === 'prc' ? 'PRC-Chinese' : kk)}); }
  });
  if (!String(c.summary || '').trim()) out.push({k:'summary', label:'Narrative summary'});
  return out;
}
function progress(c) {
  if (screenedOut(c)) return 1;
  const total = 4 + (val(c, 'pl2') === 1 ? 1 : 0) + 1 + (c.chars || []).reduce((n, ch) => n + (cv(c, ch, 'valid') === 0 ? 1 : 4), 0);
  return Math.max(0, Math.min(1, 1 - openItems(c).length / total));
}

/* ================= Results-sheet row (43 columns, exact template order) ================= */
function resultsRow(a, c, coderCol) {
  const r = new Array(43).fill('');
  r[0] = a.id; r[1] = coderCol; r[2] = a.dataset; r[3] = a.url || '';
  ['p1','p2','p3','xi','party','west','spatial','temporal'].forEach((k, i) => r[4 + i] = val(c, k));
  const chs = c.chars || [];
  const put = (i, base, withAction) => {
    const ch = chs[i]; if (!ch) return;
    const v = cv(c, ch, 'valid'); r[base] = ch.en || ch.name; r[base + 1] = v; let o = base + 2;
    if (withAction) { r[o] = cv(c, ch, 'action'); o++; }
    if (v === 1) { r[o] = cv(c, ch, 'prc'); r[o + 1] = cv(c, ch, 'level'); r[o + 2] = cv(c, ch, 'role'); }
  };
  if (!screenedOut(c)) { put(0, 12, true); put(1, 18); put(2, 23); put(3, 28); }
  r[33] = val(c, 'more4'); r[34] = val(c, 'nchars'); r[35] = val(c, 't1'); r[36] = val(c, 'pt1');
  r[37] = val(c, 'pl2'); r[38] = val(c, 't2'); r[39] = val(c, 'pt2'); r[40] = val(c, 'mpol'); r[41] = val(c, 'mideo');
  r[42] = screenedOut(c) ? '' : (c.summary || '');
  return r;
}

/* ================= intervals / spans ================= */
function mergeIv(iv) {
  iv = iv.filter(x => x[1] > x[0]).sort((a, b) => a[0] - b[0]); const out = [];
  for (const x of iv) { if (out.length && x[0] <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], x[1]); else out.push([x[0], x[1]]); }
  return out;
}
const ivLen = iv => iv.reduce((n, x) => n + x[1] - x[0], 0);
function ivOverlap(A, B) { let i = 0, j = 0, o = 0; while (i < A.length && j < B.length) { const s = Math.max(A[i][0], B[j][0]), e = Math.min(A[i][1], B[j][1]); if (e > s) o += e - s; if (A[i][1] < B[j][1]) i++; else j++; } return o; }
const spansOf = (c, cat) => mergeIv((c.anns || []).filter(a => a.cat === cat).map(a => [a.s, a.e]));

/* ================= character alignment across coders ================= */
const normName = s => String(s || '').toLowerCase().replace(/^the\s+/, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
function alignChars(codings) {
  // codings: [{uid, c}] → groups [{members:{uid:{ch,c}}, label}]
  const nodes = [];
  codings.forEach(({uid, c}) => (c.chars || []).forEach(ch => nodes.push({uid, c, ch,
    names:new Set([normName(ch.name), normName(ch.en)].filter(Boolean)),
    iv:mergeIv((c.anns || []).filter(a => a.cat === 'char' && a.c === ch.id).map(a => [a.s, a.e]))})));
  const par = nodes.map((_, i) => i), uids = nodes.map(n => new Set([n.uid]));
  const find = i => par[i] === i ? i : (par[i] = find(par[i]));
  const pairs = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    if (nodes[i].uid === nodes[j].uid) continue;
    let score = 0;
    for (const n of nodes[i].names) if (nodes[j].names.has(n)) score = 2;
    if (!score && ivOverlap(nodes[i].iv, nodes[j].iv) > 0) score = 1;
    if (score) pairs.push([score, i, j]);
  }
  pairs.sort((a, b) => b[0] - a[0]);
  for (const [, i, j] of pairs) {
    const a = find(i), b = find(j); if (a === b) continue;
    if ([...uids[a]].some(u => uids[b].has(u))) continue;
    par[b] = a; uids[b].forEach(u => uids[a].add(u));
  }
  const g = {};
  nodes.forEach((n, i) => { const r = find(i); (g[r] = g[r] || {members:{}, names:[]}); g[r].members[n.uid] = {ch:n.ch, c:n.c}; g[r].names.push(n.ch.en || n.ch.name); });
  return Object.values(g).map(x => ({members:x.members, label:mode(x.names.filter(Boolean)) || '(unnamed)'}));
}
function mode(arr) {
  const m = new Map(); arr.forEach(v => m.set(v, (m.get(v) || 0) + 1));
  let best = '', bn = 0, tie = false;
  for (const [v, n] of m) { if (n > bn) { best = v; bn = n; tie = false; } else if (n === bn) tie = true; }
  return arr.length ? best : '';
}
function majority(vals) {
  const vs = vals.filter(v => v !== '' && v != null); if (!vs.length) return {v:'', src:'none'};
  const m = new Map(); vs.forEach(v => m.set(v, (m.get(v) || 0) + 1));
  const sorted = [...m].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 1) return {v:sorted[0][0], src:vs.length > 1 ? 'unanimous' : 'single'};
  if (sorted[0][1] > sorted[1][1]) return {v:sorted[0][0], src:'majority'};
  return {v:'', src:'tie'};
}

/* ================= Krippendorff's alpha ================= */
function prepUnits(units, metric) {
  return units.map(vals => {
    const v = vals.filter(x => x !== '' && x != null); const m = v.length; if (m < 2) return null;
    if (metric === 'interval') { const nums = v.map(Number); const s1 = nums.reduce((a, b) => a + b, 0), s2 = nums.reduce((a, b) => a + b * b, 0); return {m, d:2 * (m * s2 - s1 * s1) / (m - 1), s1, s2, agree:pairAgree(v)}; }
    const cnt = {}; v.forEach(x => cnt[x] = (cnt[x] || 0) + 1); const sq = Object.values(cnt).reduce((a, b) => a + b * b, 0);
    return {m, d:(m * m - sq) / (m - 1), cnt, agree:pairAgree(v)};
  }).filter(Boolean);
}
function pairAgree(v) { let a = 0, t = 0; for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) { t++; if (v[i] === v[j]) a++; } return [a, t]; }
function alphaOf(P, metric) {
  if (!P.length) return {a:null, n:0};
  let n = 0, Do = 0; const tot = {}; let S1 = 0, S2 = 0;
  for (const u of P) { n += u.m; Do += u.d; if (metric === 'interval') { S1 += u.s1; S2 += u.s2; } else for (const k in u.cnt) tot[k] = (tot[k] || 0) + u.cnt[k]; }
  if (n < 2) return {a:null, n};
  let De;
  if (metric === 'interval') De = 2 * (n * S2 - S1 * S1) / (n * (n - 1));
  else De = (n * n - Object.values(tot).reduce((a, b) => a + b * b, 0)) / (n * (n - 1));
  Do = Do / n;
  if (De <= 1e-12) return {a:null, n, novar:true, tot};
  return {a:1 - Do / De, n, tot};
}
function reliability(units, metric = 'nominal', B = 1000) {
  const P = prepUnits(units, metric); const r = alphaOf(P, metric);
  let ag = 0, at = 0; P.forEach(u => { ag += u.agree[0]; at += u.agree[1]; });
  r.units = P.length; r.agree = at ? ag / at : null;
  if (r.tot && metric !== 'interval') { const t = Object.values(r.tot), s = t.reduce((a, b) => a + b, 0); r.maxShare = s ? Math.max(...t) / s : 0; }
  if (r.a != null && P.length >= 3 && B) {
    let seed = 12345; const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    const bs = [];
    for (let b = 0; b < B; b++) { const smp = []; for (let i = 0; i < P.length; i++) smp.push(P[Math.floor(rnd() * P.length)]); const x = alphaOf(smp, metric).a; if (x != null) bs.push(x); }
    bs.sort((a, b) => a - b);
    if (bs.length > 20) r.ci = [bs[Math.floor(bs.length * 0.025)], bs[Math.min(bs.length - 1, Math.floor(bs.length * 0.975))]];
  }
  return r;
}
const band = a => a == null ? 'na' : a >= 0.8 ? 'good' : a >= 0.667 ? 'warn' : 'bad';
const bandLabel = a => a == null ? 'not computable' : a >= 0.8 ? 'reliable' : a >= 0.667 ? 'tentative' : 'not reliable';

/* ================= consensus ================= */
function codingFor(sub, basis) { return basis === 'first' && sub.first ? Object.assign({}, sub.first) : sub; }
function consensus(key, basis = 'current') {
  const subs = Object.entries(subsOf(key)).map(([uid, s]) => ({uid, c:codingFor(s, basis)}));
  const fin = S.finals[key] || {}; const k = subs.length;
  const values = {}, src = {};
  for (const f of F) {
    const fv = fin.values && fin.values[f.k];
    if (fv !== undefined && fv !== null && fv !== '') { values[f.k] = fv; src[f.k] = 'resolved'; continue; }
    const m = majority(subs.map(x => val(x.c, f.k))); values[f.k] = m.v; src[f.k] = m.src;
  }
  if (values.pl2 !== 1) { values.t2 = ''; values.pt2 = ''; }
  const out = screenedOut({codes:values});
  if (out) F.forEach(f => { if (!PRE.includes(f.k)) { values[f.k] = ''; src[f.k] = 'screened out'; } });
  const groups = out ? [] : alignChars(subs).filter(g => Object.keys(g.members).length > k / 2);
  const chars = groups.map(g => {
    const mem = Object.values(g.members);
    const valid = majority(mem.map(m => cv(m.c, m.ch, 'valid'))).v;
    return {label:g.label, n:mem.length, valid,
      prc:majority(mem.map(m => cv(m.c, m.ch, 'prc'))).v,
      level:majority(mem.map(m => cv(m.c, m.ch, 'level'))).v,
      role:majority(mem.map(m => cv(m.c, m.ch, 'role'))).v,
      action:cv(mem[0].c, mem[0].ch, 'action')};
  }).filter(ch => ch.valid === 1);
  return {k, values, src, chars, summary:out ? '' : (fin.summary || ''), out};
}
function consensusRow(a, cs) {
  const r = new Array(43).fill('');
  r[0] = a.id; r[1] = 'consensus'; r[2] = a.dataset; r[3] = a.url || '';
  ['p1','p2','p3','xi','party','west','spatial','temporal'].forEach((k, i) => r[4 + i] = cs.values[k]);
  const put = (i, base, withAction) => { const ch = cs.chars[i]; if (!ch) return; r[base] = ch.label; r[base + 1] = 1; let o = base + 2; if (withAction) { r[o] = ch.action; o++; } r[o] = ch.prc; r[o + 1] = ch.level; r[o + 2] = ch.role; };
  put(0, 12, true); put(1, 18); put(2, 23); put(3, 28);
  ['more4','nchars','t1','pt1','pl2','t2','pt2','mpol','mideo'].forEach((k, i) => r[33 + i] = cs.values[k]);
  r[42] = cs.summary; return r;
}

/* ================= rendering: top bar ================= */
function render() { renderTop(); renderView(); }
function renderTop() {
  const nf = openFeedback();
  const todoN = myWork().todo.length;
  const unN = S.mode === 'shared' ? unreadThreads().length : 0;
  const mine = ['inbox', 'My work' + (todoN ? ` <span class="badge soft">${todoN}</span>` : '') + (unN ? ` <span class="badge" title="New messages in discussions">${unN}</span>` : '')];
  const tabs = isLead() ? [mine, ['code','Code'], ...(S.mode === 'shared' ? [['progress','Progress' + (nf ? ` <span class="badge">${nf}</span>` : '')]] : []), ['compare','Compare'],['reliability','Reliability'],['analyse','Analyse']] : [mine, ['code','Code']];
  const q = !isLead() ? myQueue() : [], qd = q.filter(a => myStatus(a.key) === 'done').length;
  const sy = S.sync;
  $('#top').innerHTML = `
    <div class="brand"><span class="mark" aria-hidden="true">叙</span><span class="brand-t">NPF Annotator</span></div>
    ${tabs.length ? `<nav class="tabs" aria-label="Views">${tabs.map(([k, l]) => `<button data-act="view" data-v="${k}" class="${S.view === k ? 'on' : ''}">${l}</button>`).join('')}</nav>` : S.mode === 'shared' ? `<span class="myprog" title="Your assigned articles"><b>${qd}</b> of ${q.length} done<span class="abar"><i style="width:${q.length ? qd / q.length * 100 : 0}%;background:var(--good)"></i></span></span>` : ''}
    <div class="tools">
      <span class="sync ${sy.s === 'saved' ? 'ok' : sy.s === 'saving' ? 'busy' : sy.s === 'error' ? 'err' : ''}" title="${esc(sy.msg)}"><i></i>${esc(sy.label || (S.mode === 'shared' ? 'Shared project' : S.mode === 'loading' ? 'Connecting…' : 'This browser only'))}</span>
      ${SHOW_CODEBOOK && CB.defs.length ? '<button class="btn sm" data-act="codebook">Codebook</button>' : ''}
      ${S.isAdmin ? `<button class="btn sm" data-act="articles">Articles</button>` : ''}
      ${S.isAdmin && S.mode === 'shared' ? `<button class="btn sm" data-act="team">Team</button>` : ''}
      ${S.mode === 'shared' ? `<button class="btn sm" data-act="feedback">Feedback</button>` : ''}
      ${isLead() ? `<button class="btn sm" data-act="export">Export</button>` : ''}
      ${S.mode === 'local' && sb ? `<button class="btn sm pri" data-act="tosignin">Sign in</button>` : ''}
      <button class="btn sm me" data-act="coder" title="${S.mode === 'shared' ? esc(S.email) : 'Change your coder number'}">${S.coder ? 'Coder ' + esc(S.coder) + ' · ' + esc(coderIni(S.coder)) : S.mode === 'shared' ? 'Account' : 'Set coder'}</button>
    </div>`;
}
function setSync(s, msg) {
  const labels = {saving:'Saving…', saved:'All changes saved', error:'Not saved yet: retrying', offline:'Offline: kept on this device', idle:''};
  S.sync = {s, label:labels[s] || '', msg:msg || ''}; renderTop(); paintSave();
}
function saveText() {
  if (S.mode !== 'shared') return S.mode === 'local' ? 'Saved on this device' : '';
  const s = S.sync && S.sync.s;
  if (s === 'saving') return 'Saving…';
  if (s === 'offline') return 'Offline · saved on this device, will upload';
  if (s === 'error') return 'Not saved yet · retrying';
  if (lastSavedAt) return 'Saved to server ' + lastSavedAt.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
  return 'Saved to server automatically';
}
function paintSave() {
  const s = S.sync && S.sync.s, cls = s === 'saving' ? 'busy' : (s === 'error' || s === 'offline') ? 'err' : 'ok';
  $$('.savest').forEach(el => { el.className = 'savest ' + cls; el.textContent = saveText(); });
}
function renderView() {
  const v = $('#view'); hidePop();
  if (!isLead() && !['code','inbox'].includes(S.view)) S.view = 'inbox';
  if (S.view === 'inbox') return viewInbox(v);
  if (S.view === 'progress' && S.mode !== 'shared') S.view = 'code';
  if (S.view === 'code') return viewCode(v);
  if (S.view === 'progress') return viewProgress(v);
  if (S.view === 'compare') return viewCompare(v);
  if (S.view === 'reliability') return viewRel(v);
  if (S.view === 'analyse') return viewAnalyse(v);
}

/* ================= CODE view ================= */
function viewCode(v) {
  if (!v.querySelector('.code')) v.innerHTML = `<nav class="mtabs" id="mtabs" aria-label="Panes"></nav><div class="code" data-m="${S.mpane}"><aside class="pane list" id="list"></aside><section class="pane reader" id="reader"></section><aside class="pane panel" id="panel"></aside></div>`;
  renderList(); renderReader(); renderPanel(); renderMtabs();
}
function listItems() {
  const q = S.list.q.toLowerCase(), f = S.list.f;
  return (isLead() ? corpus() : myQueue()).filter(a => {
    if (q && !(String(a.id).toLowerCase().includes(q) || String(a.title || '').toLowerCase().includes(q) || String(a.text || '').toLowerCase().includes(q))) return false;
    const st = myStatus(a.key), as = assigned(a);
    if (f === 'mine' && as && !as.includes(String(S.coder))) return false;
    if (f === 'todo' && st === 'done') return false;
    if (f === 'done' && st !== 'done') return false;
    return true;
  });
}
function artItem(a) {
  const st = myStatus(a.key), n = Object.keys(subsOf(a.key)).filter(u => !EXAMPLE_CODINGS[u]).length, as = assigned(a);
  return `<button class="art ${S.cur === a.key ? 'on' : ''}" data-act="open" data-key="${esc(a.key)}" title="${st === 'done' ? 'Submitted' : st === 'draft' ? 'In progress' : 'Not started'}">
    <span class="st ${st}"></span><span class="art-id">${esc(a.id)}</span>
    <span style="display:flex;gap:4px"><span class="tag">${a.dataset === '1' ? 'CN' : a.dataset === '2' ? 'EN' : '?'}</span>${a.practice || !isLead() ? '' : `<span class="tag" title="Coders who submitted">${n}${as ? '/' + as.length : ''}</span>`}</span>
    <span class="art-t">${a.practice ? '' : duePill(a, st === 'done') + ' '}${esc(a.title || String(a.text || '').slice(0, 80))}</span></button>`;
}
function renderList() {
  const el = $('#list'); if (!el) return;
  if (!isLead()) {
    const W = myWork();
    el.innerHTML = `${isPractice(S.cur) ? `<div class="grp-l">Practice</div>${artItem(art(S.cur))}` : ''}
      <div class="grp-l">To do · ${W.todo.length}</div>
      ${W.todo.map(artItem).join('') || `<p class="small" style="padding:4px 8px">${W.q.length ? 'Nothing left to do. Well done!' : 'No articles assigned to you yet.'}</p>`}
      ${W.done.length ? `<div class="grp-l">Done · ${W.done.length}</div>${W.done.map(artItem).join('')}` : ''}
      <p style="padding:10px 8px"><button class="link" data-act="view" data-v="inbox">← Back to My work</button></p>`;
    return;
  }
  const items = listItems(); const hasAssign = isLead() && corpus().some(a => assigned(a));
  const pool = isLead() ? corpus() : myQueue();
  const total = pool.length, done = pool.filter(a => myStatus(a.key) === 'done').length;
  el.innerHTML = `<div class="list-h">
      <input id="lq" type="search" placeholder="Search ID, title or text" value="${esc(S.list.q)}" aria-label="Search articles">
      <div class="chips">${[['all','All'], ...(hasAssign ? [['mine','Mine']] : []), ['todo','To do'], ['done','Submitted']].map(([k, l]) => `<button class="chip ${S.list.f === k ? 'on' : ''}" data-act="lf" data-v="${k}">${l}</button>`).join('')}</div>
    </div>
    <div class="grp-l">Practice</div>${PRACTICE.map(artItem).join('')}
    <div class="grp-l">${isLead() ? 'Corpus' : 'My articles'} · ${done}/${total} submitted</div>
    ${items.length ? items.map(artItem).join('') : `<p style="color:var(--muted);font-size:13px;padding:4px 8px">${total ? 'No article matches.' : S.mode === 'loading' ? 'Loading articles…' : S.isAdmin ? 'No articles yet. Use <b>Articles</b> at the top to add them.' : 'No articles yet. The project lead adds them.'}</p>`}`;
}
function locked(key) { const d = draft(key); return d.status === 'submitted'; }
function renderReader() {
  const el = $('#reader'); if (!el) return;
  const a = art(S.cur);
  if (!a) { el.innerHTML = `<div class="empty"><b>Pick an article on the left</b>Start with a practice text to try the tool.</div>`; return; }
  const c = draft(a.key); const lk = locked(a.key);
  const counts = {}; c.anns.forEach(x => counts[x.cat] = (counts[x.cat] || 0) + 1);
  const others = Object.keys(subsOf(a.key)).filter(u => u !== S.uid).length;
  el.innerHTML = `<div class="rd">
    <div class="rd-meta"><span class="tag">${esc(a.id)}</span><span>${a.dataset === '1' ? 'Chinese' : 'English'}</span>${a.ebene ? `<span>· Ebene ${esc(a.ebene)}</span>` : ''}${metaLine(a)}${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">Open source ↗</a>` : ''}${a.practice ? '<span class="pill na">Practice, not part of the corpus</span>' : ''}</div>
    <h1 lang="${a.dataset === '1' ? 'zh' : 'en'}">${esc(a.title || a.id)}</h1>
    ${lk ? `<div class="banner good"><span>✓ Submitted ${esc(fmtDate(c.submittedAt))}.${others && isLead() ? ' ' + others + ' other coding' + (others > 1 ? 's' : '') + ' available.' : ' Thank you!'}</span><span style="margin-left:auto;display:flex;gap:8px">${nextKey() ? `<button class="btn sm pri" data-act="next">Next article →</button>` : ''}${others && isLead() ? `<button class="btn sm${nextKey() ? '' : ' pri'}" data-act="gocmp" data-key="${esc(a.key)}">Compare</button>` : ''}${a.practice ? '' : '<button class="btn sm" data-act="view" data-v="inbox">My work</button>'}<button class="btn sm" data-act="reopen">Edit again</button></span></div>` : ''}
    ${preTop(c, lk)}
    ${!S.hintOff && !lk && preDone(c) && !screenedOut(c) ? `<div class="hint"><span><b>${matchMedia('(pointer: coarse)').matches ? 'Press and hold a word, drag to cover the passage, then pick a category.' : 'Select words in the text to code them.'}</b> A menu opens with the codebook categories${matchMedia('(pointer: coarse)').matches ? '' : '; each has a shortcut key'}. Click a highlight to change or delete it. Most Yes/No answers on the right fill themselves from what you mark.</span><button data-act="hintoff" aria-label="Hide tip">✕</button></div>` : ''}
    <div class="rd-bar">
      ${S.mode === 'shared' && !a.practice ? (() => { const ts = threadsFor(a.key), op = ts.filter(t => t.status === 'open').length, un = ts.filter(isUnread).length; return `<button class="btn sm" data-act="discuss" title="Questions and discussion with the other coders of this article">Discuss${op ? ` <span class="badge soft">${op}</span>` : ''}${un ? ' <span class="badge">new</span>' : ''}</button>`; })() : ''}
      <span class="savest"></span>
      <span style="display:flex;align-items:center;gap:6px" title="Technology and positive/negative turns are tagged to this plot">Plot passages go to <span class="mini-seg"><button data-act="plot" data-v="1" class="${S.plot === 1 ? 'on' : ''}">1</button><button data-act="plot" data-v="2" class="${S.plot === 2 ? 'on' : ''}">2</button></span></span>
      <span class="legend">${CATS.filter(x => counts[x.id]).map(x => `<button class="lg ${S.hidden[x.id] ? 'off' : ''}" style="--c:${x.color}" data-act="lg" data-cat="${x.id}" title="Show or hide"><i></i>${x.short}<b>${counts[x.id]}</b></button>`).join('') || '<span>Nothing marked yet</span>'}</span>
    </div>
    <div id="txt" class="txt ${screenedOut(c) ? 'out' : ''}" lang="${a.dataset === '1' ? 'zh' : 'en'}">${textHTML(a.text, c.anns.filter(x => !S.hidden[x.cat]), c, S.mode === 'shared' && !a.practice ? threadsFor(a.key).filter(t => t.status === 'open') : [])}</div>
    ${preBottom(c, lk)}
  </div>`;
}
function metaLine(a) {
  const m = a.meta || {}; const ks = Object.keys(m);
  const pick = re => { const k = ks.find(k => re.test(k)); return k ? m[k] : ''; };
  const parts = [pick(/^(domain|outlet|source|medium|media|quelle|来源|媒体)$/i), pick(/^(author|autor|作者)$/i), pick(/^(published|published at|date|datum|日期|发布时间|publication date)$/i)].filter(Boolean);
  return parts.length ? `<span>· ${parts.map(esc).join(' · ')}</span>` : '';
}
function preTop(c, lk) {
  const done = preDone(c), out = screenedOut(c);
  const ans = k => pv(c, k) === 1 ? 'yes' : pv(c, k) === 0 ? 'no' : '–';
  if (out) return `<div class="ps-line warn"><span class="step">1</span><span><b>Screened out:</b> ${outReason(c)}. No further coding needed.</span><button class="link" data-act="psgo">See the answers</button></div>`;
  if (done && !S.psEdit) return `<div class="ps-line"><span class="step ok">1</span><span><b>Prescreening done:</b> relevant ${ans('p1')} · characters ${ans('p2')} · plot ${ans('p3')}. <span style="color:var(--muted)">Now mark the text.</span></span>${lk ? '' : '<button class="link" data-act="psedit">Change</button>'}</div>`;
  if (done) return '';
  return `<div class="ps-line todo"><span class="step">1</span><span><b>Step 1: read the whole text.</b> Then answer the three prescreening questions at the end of the text. Marking opens after that.</span><button class="link" data-act="psgo">Go to the questions ↓</button></div>`;
}
function preBottom(c, lk) {
  const done = preDone(c), out = screenedOut(c);
  if (done && !out && !S.psEdit) return '';
  return `<section class="prescreen ${out ? 'out' : ''}" id="prescreen" aria-label="Step 1: Prescreening">
    <div class="ps-h"><span class="step">1</span><div><b>Prescreening</b><p>${out ? 'Your answers screen this text out.' : 'You have read the text. Is it eligible for coding?'}</p></div><button class="q" data-act="def" data-def="8" aria-label="About the prescreening">?</button></div>
    ${PRE.map(k => fieldHTML(c, FM[k], lk)).join('')}
    ${out ? `<div class="ps-out"><b>No further coding needed:</b> ${outReason(c)}. Your answers are enough for this article.${lk ? '' : ` <span class="ps-act"><button class="btn sm pri" data-act="submit">Submit prescreening</button></span>`}</div>`
      : done ? `<div class="ps-ok"><b>The text passes.</b> Continue with the full coding. <button class="btn sm pri" data-act="psclose">Start marking</button></div>` : ''}
  </section>`;
}
function textHTML(text, anns, c, flags) {
  flags = (flags || []).filter(f => f.s != null && f.e > f.s);
  const pts = new Set([0, text.length]); anns.forEach(a => { pts.add(a.s); pts.add(a.e); }); flags.forEach(f => { pts.add(f.s); pts.add(f.e); });
  const arr = [...pts].sort((x, y) => x - y); let h = '';
  const chIdx = {}; (c && c.chars || []).forEach((ch, i) => chIdx[ch.id] = i + 1);
  for (let i = 0; i < arr.length - 1; i++) {
    const s = arr[i], e = arr[i + 1]; if (e <= s) continue;
    const seg = text.slice(s, e); const cov = anns.filter(a => a.s <= s && a.e >= e);
    const fl = flags.filter(f => f.s <= s && f.e >= e); const th = fl.length ? ` data-th="${fl.map(f => f.id).join(',')}"` : '';
    if (!cov.length) { h += fl.length ? `<span class="fl"${th} title="Flagged for discussion">${esc(seg)}</span>` : esc(seg); continue; }
    const top = cov.reduce((m, a) => (a.e - a.s) < (m.e - m.s) ? a : m, cov[0]);
    const cat = CM[top.cat];
    const badge = top.e === e && (top.cat === 'char' || top.cat === 'action') && chIdx[top.c] ? ` data-b="${chIdx[top.c]}"` : top.e === e && top.p === 2 ? ' data-b="P2"' : '';
    h += `<span class="hl${cov.length > 1 ? ' multi' : ''}${cat.dash ? ' dash' : ''}${fl.length ? ' fl' : ''}" style="--c:${cat.color}" data-ids="${cov.map(a => a.id).join(',')}" data-cats="${cov.map(a => a.cat).join(',')}"${badge}${th}>${esc(seg)}</span>`;
  }
  return h;
}

/* ---------- coding panel ---------- */
function segHTML(kind, cur, autoV, attrs, disabled) {
  return `<div class="seg ${disabled ? 'dis' : ''}">${OPT[kind].map(([v, l]) => {
    const on = cur === v; const isAuto = on && autoV;
    return `<button class="${on ? 'on' : ''}${isAuto ? ' auto' : ''}" ${attrs} data-v="${v}" aria-pressed="${on}">${l}</button>`; }).join('')}</div>`;
}
function fieldHTML(c, f, lk) {
  if (f.dep && val(c, f.dep) !== 1) return '';
  const cur = val(c, f.k), au = auto(c, f.k), over = c.codes[f.k] !== undefined && c.codes[f.k] !== null && c.codes[f.k] !== '';
  const autoish = !over && au.v !== '' && cur === au.v;
  const need = cur === '';
  const cat = f.cat ? CM[f.cat] : null;
  let meta = '';
  if (f.cat) meta = `<span>${au.n ? `<button class="link" data-act="flash" data-cat="${f.cat}" data-p="${f.plot || ''}">${esc(au.why)}</button>` : esc(au.why)}</span>`;
  else if (au.why) meta = `<span>${esc(au.why)}</span>`;
  if (over && au.v !== '' && au.v !== cur) meta += `<span>· you set this by hand <button class="link" data-act="reset" data-k="${f.k}">use the text again</button></span>`;
  else if (over && f.cat) meta += `<span>· set by hand</span>`;
  const control = f.num ? `<span class="tag" style="font-size:13px">${cur === '' ? '–' : cur}</span>` : segHTML(fieldKind(f), cur, autoish, `data-act="set" data-k="${f.k}"`, lk);
  return `<div class="fld ${need ? 'need' : ''}" id="fld-${f.k}">
    <div class="fld-l">${cat ? `<span class="dot" style="--c:${cat.color}"></span>` : ''}<span>${esc(f.label)}</span>${f.def != null ? `<button class="q" data-act="def" data-def="${f.def}" aria-label="Definition">?</button>` : ''}</div>
    ${control}${meta ? `<div class="fld-m">${meta}</div>` : ''}</div>`;
}
function charHTML(c, ch, i, lk) {
  const acts = c.anns.filter(a => a.cat === 'action' && a.c === ch.id), ments = c.anns.filter(a => a.cat === 'char' && a.c === ch.id);
  const v = cv(c, ch, 'valid'), vAuto = (ch.valid === undefined || ch.valid === null || ch.valid === '') && v !== '';
  const ds = art(S.cur).dataset;
  const dis = v !== 1 || lk;
  return `<div class="ch ${v === 0 ? 'x' : ''}" id="fld-ch:${ch.id}" data-id="${ch.id}">
    <div class="ch-h"><span class="ch-n ${i > 3 ? 'out' : ''}" title="${i > 3 ? 'Only characters 1–4 go into the Results columns' : 'Exported as Char ' + (i + 1)}">${i + 1}</span>
      <input data-chf="en" data-id="${ch.id}" value="${esc(ch.en ?? ch.name)}" placeholder="${ds === '1' ? 'Name in English / Pinyin' : 'Name (NER)'}" aria-label="Character name" ${lk ? 'disabled' : ''}>
      ${lk ? '' : `<button class="ic" data-act="chmv" data-id="${ch.id}" data-d="-1" title="Move up" aria-label="Move up">↑</button><button class="ic" data-act="chmv" data-id="${ch.id}" data-d="1" title="Move down" aria-label="Move down">↓</button><button class="ic" data-act="chdel" data-id="${ch.id}" title="Delete character" aria-label="Delete character">✕</button>`}</div>
    <div class="fld-m" style="margin-top:-4px">${ments.length ? `<button class="link" data-act="flashch" data-id="${ch.id}">${ments.length} mention${ments.length > 1 ? 's' : ''}</button>` : '<span>no mention marked</span>'}<span>·</span><span>${acts.length ? acts.length + ' action' + (acts.length > 1 ? 's' : '') + ' marked' : 'mark its action with A'}</span>${ds === '1' && ch.name !== ch.en ? `<span>· ${esc(ch.name)}</span>` : ''}</div>
    <div class="ch-row"><span>Valid <button class="q" data-act="def" data-def="24">?</button></span>${segHTML('bin', v, vAuto, `data-act="chset" data-id="${ch.id}" data-k="valid"`, lk)}</div>
    <div class="ch-row"><span>Action <button class="q" data-act="def" data-def="25">?</button></span><input data-chf="action" data-id="${ch.id}" value="${esc(cv(c, ch, 'action'))}" placeholder="${ds === '1' ? 'Action in English' : 'Verb or phrase from the text'}" ${lk ? 'disabled' : ''}></div>
    <div class="ch-row"><span>PRC-Chinese</span>${segHTML('bin', cv(c, ch, 'prc'), false, `data-act="chset" data-id="${ch.id}" data-k="prc"`, dis)}</div>
    <div class="ch-row"><span>Level <button class="q" data-act="def" data-def="26">?</button></span>${segHTML('level', cv(c, ch, 'level'), false, `data-act="chset" data-id="${ch.id}" data-k="level"`, dis)}</div>
    <div class="ch-row"><span>Role <button class="q" data-act="def" data-def="31">?</button></span>${segHTML('role', cv(c, ch, 'role'), false, `data-act="chset" data-id="${ch.id}" data-k="role"`, dis)}</div>
  </div>`;
}
function renderPanel() {
  const el = $('#panel'); if (!el) return;
  const a = art(S.cur); if (!a) { el.innerHTML = ''; return; }
  const c = draft(a.key), lk = locked(a.key), st = el.scrollTop;
  const p = progress(c), open = openItems(c);
  const secs = [...new Set(F.map(f => f.sec))];
  const pre = preDone(c), out = screenedOut(c);
  const body = secs.map(sec => {
    if (sec !== 'Prescreening' && (out || !pre)) return '';
    const fs = F.filter(f => f.sec === sec);
    let inner = fs.filter(f => !f.fromChars).map(f => fieldHTML(c, f, lk)).join('');
    if (sec === 'Characters') {
      inner = `<p style="margin:0 0 4px;font-size:12px;color:var(--faint)">Select a name in the text and press <b>C</b>; select what it does and press <b>A</b>. Order sets Char 1–4 in the export.</p>`
        + c.chars.map((ch, i) => charHTML(c, ch, i, lk)).join('')
        + (lk ? '' : `<button class="btn sm" data-act="chadd">+ Add character without text mark</button>`)
        + fs.map(f => fieldHTML(c, f, lk)).join('');
    }
    return `<div class="sec"><div class="sec-h">${esc(sec)}<button class="q" data-act="def" data-def="${SEC_DEF[sec]}" aria-label="Definition">?</button></div>${inner}</div>`;
  }).join('');
  const gate = out ? `<div class="sec"><div class="ps-out" style="margin:4px 0 0"><b>Screened out:</b> ${outReason(c)}. Nothing else to code for this article.</div></div>`
    : !pre ? `<div class="sec"><p class="small" style="margin:4px 0 0">Read the whole text first, then answer the prescreening (here or at the end of the text). The rest of the coding sheet opens after that.</p></div>` : '';
  setTimeout(paintSave, 0);
  el.innerHTML = `<div class="pn-h"><b style="font-size:13px">Coding sheet</b><span class="savest"></span><div class="prog" title="${Math.round(p * 100)}% complete"><i style="width:${p * 100}%"></i></div><span class="tag">${open.length ? open.length + ' open' : 'complete'}</span></div>
    <div class="pn-b">${body}${gate}
      ${out || !pre ? '' : `<div class="sec"><div class="sec-h">Narrative summary<button class="q" data-act="def" data-def="49" aria-label="Definition">?</button></div>
        <textarea id="summary" rows="6" placeholder="Set in [place] and [time], this is a story about how [hero] [action]… The take-away message is [moral]." ${lk ? 'disabled' : ''}>${esc(c.summary)}</textarea>
        ${lk ? '' : `<div style="margin-top:6px"><button class="btn sm" data-act="draftsum">Draft from my marks</button></div>`}</div>
      <div class="sec"><div class="sec-h">Memo</div>
        <textarea id="memo" rows="3" placeholder="Doubts, borderline decisions, things to discuss. Not exported to Results." ${lk ? 'disabled' : ''}>${esc(c.memo)}</textarea></div>`}
    </div>
    <div class="pn-f">${lk ? `<button class="btn" data-act="reopen" style="flex:1;justify-content:center">Edit again</button>` : `
      ${open.length ? `<div class="open-list">Still open: ${open.slice(0, 6).map(o => `<button data-act="goto" data-k="${esc(o.k)}">${esc(o.label)}</button>`).join('')}${open.length > 6 ? '…' : ''}</div>` : ''}
      <button class="btn pri" data-act="submit" ${pre ? '' : 'disabled'}>${out ? 'Submit prescreening' : mySub(a.key) ? 'Resubmit coding' : 'Submit coding'}</button>`}</div>`;
  el.scrollTop = st; renderMtabs();
}

/* ---------- summary drafting from marks ---------- */
function draftSummary(c) {
  const T = cat => [...new Set(c.anns.filter(a => a.cat === cat).map(a => a.t.trim()))];
  const and = arr => arr.length <= 1 ? (arr[0] || '') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  const vc = validChars(c); const by = r => vc.filter(ch => cv(c, ch, 'role') === r);
  const nm = ch => ch.en || ch.name;
  const actOf = ch => (cv(c, ch, 'action').split('; ')[0] || '[action]');
  let s = `Set in ${and(T('spatial')) || '[place]'} and ${and(T('temporal')) || '[time]'}, this is a story about how ${by(1).length ? by(1).map(ch => nm(ch) + ' ' + actOf(ch)).join(' and ') : '[hero] [action]'}`;
  if (by(4).length) s += ` and ${by(4).map(ch => nm(ch) + ' ' + actOf(ch)).join(' and ')}`;
  s += '.';
  if (by(2).length) s += ` The ${by(2).map(ch => nm(ch) + ' ' + actOf(ch)).join(' and ')}${by(3).length ? ' and causes harm to ' + by(3).map(nm).join(' and ') : ''}.`;
  else if (by(3).length) s += ` ${by(3).map(ch => nm(ch) + ' ' + actOf(ch)).join(' and ')}.`;
  const morals = [...T('mpol'), ...T('mideo')];
  s += ` The take-away message is ${and(morals) || '[moral]'}.`;
  return s;
}

/* ================= selection → tag menu ================= */
let pointerDown = false, selT;
function offsetIn(box, node, off) { const r = document.createRange(); r.setStart(box, 0); r.setEnd(node, off); return r.toString().length; }
function checkSel() {
  const sel = getSelection(); const box = $('#txt');
  if (!box || !sel.rangeCount || sel.isCollapsed) return;
  const r = sel.getRangeAt(0); if (!box.contains(r.startContainer) || !box.contains(r.endContainer)) return;
  const a = art(S.cur); const text = a.text;
  let s = offsetIn(box, r.startContainer, r.startOffset), e = offsetIn(box, r.endContainer, r.endOffset);
  if (e < s) [s, e] = [e, s];
  while (s < e && /\s/.test(text[s])) s++; while (e > s && /\s/.test(text[e - 1])) e--;
  if (a.dataset !== '1') { const W = /[A-Za-z0-9À-ɏ]/; while (s > 0 && W.test(text[s - 1]) && W.test(text[s])) s--; while (e < text.length && W.test(text[e]) && W.test(text[e - 1])) e++; }
  if (e <= s) return;
  const canFlag = S.mode === 'shared' && !isPractice(S.cur);
  if (locked(S.cur)) { if (canFlag) { S.sel = {s, e, t:text.slice(s, e)}; return showFlagOnlyMenu(r.getBoundingClientRect(), 'This coding is submitted. Choose “Edit again” to change your marks.'); } toast('This coding is submitted. Choose “Edit again” to change it.'); return; }
  { const c0 = draft(S.cur);
    if (canFlag && (screenedOut(c0) || !preDone(c0))) { S.sel = {s, e, t:text.slice(s, e)}; return showFlagOnlyMenu(r.getBoundingClientRect(), screenedOut(c0) ? 'This text is screened out, so no marks are needed.' : 'Marking opens after the prescreening questions below the text.'); }
    if (screenedOut(c0)) { toast('This text is screened out, so no marks are needed. Change the prescreening if that was a mistake.', 4500); return; }
    if (!preDone(c0)) { toast('First read to the end and answer the three prescreening questions below the text.', 4500); const ps = $('#prescreen'); if (ps) { ps.scrollIntoView({block:'start', behavior:'smooth'}); ps.classList.remove('nudge'); void ps.offsetWidth; ps.classList.add('nudge'); } return; } }
  S.sel = {s, e, t:text.slice(s, e)};
  showTagMenu(r.getBoundingClientRect());
}
function showTagMenu(rect) {
  S.menu = {type:'tag', rect};
  const groups = [...new Set(CATS.map(c => c.grp))];
  const pop = $('#pop');
  pop.innerHTML = `<div class="pop-sel">“${esc(S.sel.t.length > 120 ? S.sel.t.slice(0, 120) + '…' : S.sel.t)}”</div>` + groups.map(g => `
    <div class="pop-g"><span>${g}</span>${g === 'Plot' ? `<span class="mini-seg">plot <button data-act="plot" data-v="1" class="${S.plot === 1 ? 'on' : ''}">1</button><button data-act="plot" data-v="2" class="${S.plot === 2 ? 'on' : ''}">2</button></span>` : ''}</div>
    <div class="pop-gi">${CATS.filter(c => c.grp === g).map(c => `<button class="pop-i" data-act="tag" data-cat="${c.id}"><span class="dot" style="--c:${c.color}"></span>${c.label}<kbd>${c.key.toUpperCase()}</kbd></button>`).join('')}</div>`).join('');
  if (S.mode === 'shared' && !isPractice(S.cur)) pop.insertAdjacentHTML('beforeend', `<div class="pop-g"><span>Discuss</span></div><div class="pop-gi"><button class="pop-i" data-act="flagsel"><span class="dot" style="--c:#b45309"></span>Flag for discussion<kbd>F</kbd></button></div>`);
  placePop(rect);
}
function showCharMenu(cat) {
  const c = draft(S.cur); S.menu = {type:'char', cat, rect:S.menu.rect};
  const pop = $('#pop'); const items = c.chars.map((ch, i) => `<button class="pop-i" data-act="pickch" data-id="${ch.id}"><span class="ch-n" style="width:18px;height:18px;font-size:10px">${i + 1}</span>${esc(ch.en || ch.name)}${i < 9 ? `<kbd>${i + 1}</kbd>` : ''}</button>`).join('');
  pop.innerHTML = `<div class="pop-sel">“${esc(S.sel.t.slice(0, 120))}”</div>
    <div class="pop-g">${cat === 'char' ? 'Which character is this?' : 'Whose action is this?'}</div>
    ${cat === 'char' ? `<button class="pop-i" data-act="newch"><span class="dot" style="--c:#7c3aed"></span>New character: <b>${esc(S.sel.t.slice(0, 40))}</b><kbd>↵</kbd></button>` : ''}
    ${items || (cat === 'action' ? '<p style="padding:6px;color:var(--muted);font-size:13px;margin:0">Mark the character first: select its name and press C.</p>' : '')}
    <div class="pop-g"></div><button class="pop-i" data-act="back">← Back<kbd>Esc</kbd></button>`;
  placePop(S.menu.rect);
}
function placePop(rect) {
  const p = $('#pop'); p.hidden = false;
  const coarse = matchMedia('(pointer: coarse)').matches; p.classList.toggle('sheet', coarse);
  if (coarse) { p.style.left = ''; p.style.top = ''; return; }
  p.style.left = '0px'; p.style.top = '0px';
  const pw = p.offsetWidth, ph = p.offsetHeight;
  let x = rect.left + rect.width / 2 - pw / 2, y = rect.bottom + 8;
  if (y + ph > innerHeight - 8) y = rect.top - ph - 8;
  if (y < 8) y = Math.max(8, innerHeight - ph - 8);
  x = Math.max(8, Math.min(innerWidth - pw - 8, x));
  p.style.left = x + 'px'; p.style.top = y + 'px';
}
function hidePop() { const p = $('#pop'); if (p) p.hidden = true; S.menu = null; }
function pushUndo() { const c = draft(S.cur); S.undo.push({key:S.cur, anns:clone(c.anns), chars:clone(c.chars)}); if (S.undo.length > 60) S.undo.shift(); }
function addAnn(cat, chId) {
  const c = draft(S.cur); pushUndo();
  const a = {id:rid(), cat, s:S.sel.s, e:S.sel.e, t:S.sel.t};
  if (chId) a.c = chId;
  if (CM[cat].plot) a.p = S.plot;
  c.anns.push(a); S.sel = null; getSelection().removeAllRanges(); hidePop();
  changed();
}
function changed(panelOnly) { queueSave(S.cur); if (!panelOnly) renderReader(); renderPanel(); renderList(); }
function chooseCat(cat) {
  if (!S.sel) return;
  if (cat === 'char' || cat === 'action') return showCharMenu(cat);
  addAnn(cat);
}
function newChar() {
  const c = draft(S.cur); pushUndo();
  const ch = {id:'c' + rid(), name:S.sel.t, en:art(S.cur).dataset === '1' ? '' : S.sel.t};
  c.chars.push(ch);
  c.anns.push({id:rid(), cat:'char', s:S.sel.s, e:S.sel.e, t:S.sel.t, c:ch.id});
  S.sel = null; getSelection().removeAllRanges(); hidePop(); changed();
  if (art(S.cur).dataset === '1') setTimeout(() => { const i = $(`input[data-chf="en"][data-id="${ch.id}"]`); if (i) { i.scrollIntoView({block:'center'}); i.focus(); } }, 50);
}
function showAnnPop(el) {
  const c = draft(S.cur); const ids = el.dataset.ids.split(','); const lk = locked(S.cur);
  const anns = c.anns.filter(a => ids.includes(a.id));
  S.menu = {type:'ann'};
  const chName = id => { const ch = c.chars.find(x => x.id === id); return ch ? (ch.en || ch.name) : ''; };
  $('#pop').innerHTML = anns.map(a => `<div class="ann-i" data-id="${a.id}">
      <span class="dot" style="--c:${CM[a.cat].color}"></span>
      <span style="font-size:13px"><b>${CM[a.cat].label}</b>${a.c ? ' · ' + esc(chName(a.c)) : ''}${CM[a.cat].plot ? ` · <span class="mini-seg"><button data-act="annp" data-id="${a.id}" data-v="1" class="${(a.p || 1) === 1 ? 'on' : ''}" ${lk ? 'disabled' : ''}>plot 1</button><button data-act="annp" data-id="${a.id}" data-v="2" class="${a.p === 2 ? 'on' : ''}" ${lk ? 'disabled' : ''}>plot 2</button></span>` : ''}<br><span style="color:var(--muted);font-family:var(--read)">“${esc(a.t.slice(0, 90))}${a.t.length > 90 ? '…' : ''}”</span></span>
      ${lk ? '' : `<button class="ic" data-act="delann" data-id="${a.id}" title="Delete this mark" aria-label="Delete this mark">✕</button>`}
      <input data-annnote="${a.id}" value="${esc(a.note || '')}" placeholder="Add a note to this mark" ${lk ? 'disabled' : ''}>
    </div>`).join('');
  if (el.dataset.th) $('#pop').insertAdjacentHTML('beforeend', el.dataset.th.split(',').map(id => `<button class="pop-i" data-act="dopen" data-id="${id}"><span class="dot" style="--c:#b45309"></span>Open the discussion on this passage</button>`).join(''));
  placePop(el.getBoundingClientRect());
}
function flash(pred) {
  const spans = $$('#txt .hl').filter(s => pred(s.dataset.ids.split(',')));
  if (!spans.length) return;
  spans[0].scrollIntoView({block:'center', behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  spans.forEach(s => { s.classList.remove('flash'); void s.offsetWidth; s.classList.add('flash'); });
}

/* ================= saving ================= */
async function submit() {
  const key = S.cur, c = draft(key);
  if (!S.coder && !isPractice(key)) { if (S.mode === 'shared') { toast(S.isAdmin ? 'Give yourself a coder number under Team first.' : 'You need a coder number before submitting. Ask the project lead to set it under Team.', 5000); return; } openCoder(true); return; }
  if (isPractice(key)) LS.set('npf:practiced', true);
  const prev = mySub(key);
  const snap = {anns:clone(c.anns), chars:clone(c.chars), codes:clone(c.codes), summary:c.summary};
  const sub = {aid:key, coder:S.coder, ...clone(c), status:'submitted', submittedAt:now(),
    firstSubmittedAt:(prev && prev.firstSubmittedAt) || now(), revisions:prev ? (prev.revisions || 0) + 1 : 0,
    first:(prev && prev.first) || snap,
    revisedAfterComparison:prev ? !!(prev.revisedAfterComparison || c.sawOthers) : false};
  c.status = 'submitted'; c.submittedAt = sub.submittedAt;
  if (S.mode === 'shared' && !isPractice(key)) { c.updatedAt = now(); LS.set(bkKey(key), c); pendingSave.add(key); }
  try { setSync('saving'); await writeSub(key, sub); await flushSave(key); if (!pendingSave.size) setSync('saved'); }
  catch (e) { c.status = 'draft'; setSync('error', e && e.message); toast('Could not submit. Check your connection and try again.'); return; }
  const others = Object.keys(subsOf(key)).filter(u => u !== S.uid).length;
  if (screenedOut(c)) toast('Prescreening submitted. This article needs no further coding.'); else toast(others && isLead() ? 'Submitted. You can now compare with ' + others + ' other coding' + (others > 1 ? 's' : '') + '.' : 'Submitted. Thank you!');
  render(); afterSubmitCheer(key);
}
function reopen() { const c = draft(S.cur); c.status = 'draft'; queueSave(S.cur); render(); }

/* ================= COMPARE view ================= */
function leadToggle() {
  if (!S.isAdmin) return '';
  return `<label style="display:flex;gap:8px;align-items:center;font-size:12.5px;color:var(--muted);cursor:pointer"><input type="checkbox" data-act="leadview" ${S.leadView ? 'checked' : ''} style="width:auto"> Lead view: show all codings, including articles I have not coded yet</label>`;
}
/* Compare: text stays visible; selecting a variable shows each coder's marks for it in the text */
const CCOL = ['#0f766e', '#c2410c', '#7c3aed', '#2563eb', '#be185d', '#4d7c0f', '#a16207'];
function cmpSpec(sel, groups) {
  if (!sel) return null;
  if (sel.type === 'cat') return {cats:[sel.cat], label:CM[sel.cat].label};
  if (sel.type === 'ch') { const g = groups[sel.gi]; return g ? {group:g, cats:[], label:'Character: ' + g.label} : null; }
  const f = FM[sel.k]; if (!f) return null;
  if (f.cat) return {cats:[f.cat], plot:f.plot || null, label:f.label};
  if (f.ptype) return {cats:['pos', 'neg', 'tech'], plot:f.ptype, label:f.label};
  if (f.k === 'pl2') return {cats:['tech', 'pos', 'neg'], plot:2, label:f.label};
  if (f.k === 'p2' || f.fromChars) return {cats:['char', 'action'], label:f.label};
  if (f.k === 'p3') return {cats:['pos', 'neg', 'tech'], label:f.label};
  return {cats:[], label:f.label, none:true};
}
function cmpAnns(c, uid, spec) {
  if (!spec || spec.none) return [];
  if (spec.group) { const m = spec.group.members[uid]; return m ? (c.anns || []).filter(a => (a.cat === 'char' || a.cat === 'action') && a.c === m.ch.id) : []; }
  return (c.anns || []).filter(a => spec.cats.includes(a.cat) && (!spec.plot || (a.p || 1) === spec.plot));
}
function cmpText(a, uids, subs, spec) {
  const per = uids.map(u => cmpAnns(subs[u], u, spec));
  const ivs = per.map(l => mergeIv(l.map(x => [x.s, x.e])));
  const pts = new Set([0, a.text.length]); ivs.forEach(iv => iv.forEach(([s, e]) => { pts.add(s); pts.add(e); }));
  const arr = [...pts].sort((x, y) => x - y); let h = '';
  for (let i = 0; i < arr.length - 1; i++) {
    const s = arr[i], e = arr[i + 1]; if (e <= s) continue;
    const who = uids.map((u, j) => ivs[j].some(([x, y]) => x <= s && y >= e) ? j : -1).filter(j => j >= 0);
    const seg = esc(a.text.slice(s, e));
    if (!who.length) { h += seg; continue; }
    const cats = [...new Set(who.flatMap(j => per[j].filter(x => x.s < e && x.e > s).map(x => CM[x.cat].short)))];
    const shadow = who.map((j, n) => `inset 0 -${3 * (n + 1)}px 0 ${CCOL[j % CCOL.length]}`).join(',');
    h += `<span class="cxm ${who.length === uids.length ? 'all' : 'some'}" style="box-shadow:${shadow};padding-bottom:${3 * who.length}px" title="${esc('Marked by ' + who.map(j => coderLabel(uids[j])).join(', ') + (cats.length ? ' · ' + cats.join(', ') : ''))}">${seg}</span>`;
  }
  // overlap between coders for what is shown (mean pairwise, same formula as span agreement)
  let sum = 0, n = 0;
  for (let i = 0; i < ivs.length; i++) for (let j = i + 1; j < ivs.length; j++) { const la = ivLen(ivs[i]), lb = ivLen(ivs[j]); if (!la && !lb) continue; sum += 2 * ivOverlap(ivs[i], ivs[j]) / (la + lb); n++; }
  return {html:h, counts:per.map(l => l.length), overlap:n ? sum / n : null};
}
function cmpRoleSame(g, uids) {
  const mem = Object.values(g.members); const roles = mem.map(m => cv(m.c, m.ch, 'role')).filter(x => x !== '');
  return mem.length === uids.length && roles.length === mem.length && roles.every(r => r === roles[0]);
}
function cmpDiffs(uids, subs, groups) {
  const out = [];
  for (const f of F) { const vs = uids.map(u => val(subs[u], f.k)).filter(x => x !== ''); if (vs.length >= 2 && !vs.every(x => x === vs[0])) out.push({type:'var', k:f.k}); }
  if (uids.length >= 2) groups.forEach((g, gi) => { if (!cmpRoleSame(g, uids)) out.push({type:'ch', gi}); });
  return out;
}
const selKey = s => !s ? '' : s.type === 'var' ? 'v:' + s.k : s.type === 'cat' ? 'c:' + s.cat : 'g:' + s.gi;
function cmpModel(key) {
  const subs = subsOf(key); const uids = Object.keys(subs);
  const groups = alignChars(uids.map(u => ({uid:u, c:subs[u]})));
  return {subs, uids, groups, diffs:cmpDiffs(uids, subs, groups)};
}
function viewCompare(v) {
  const eligible = [...PRACTICE, ...corpus()].filter(a => Object.keys(subsOf(a.key)).length >= 1 && canSeeOthers(a.key));
  if (!S.cmp.key || !eligible.find(a => a.key === S.cmp.key)) { S.cmp.key = eligible[0] ? eligible[0].key : null; S.cmp.sel = null; }
  const key = S.cmp.key; S.cmp.pane = S.cmp.pane || 'text';
  if (!key) {
    v.innerHTML = `<div class="wide"><div class="wrap"><div class="vh"><div><h2>Compare codings</h2><p>Every coder's codes for one article, next to the text.</p></div><div class="tools">${leadToggle()}</div></div>
      <div class="card empty"><b>Nothing to compare yet</b>Submit a coding first. Try the English practice text: two example coders are waiting there.</div></div></div>`;
    return;
  }
  { const d = draft(key, false); if (d && !d.sawOthers && Object.keys(subsOf(key)).length > 1) { d.sawOthers = true; queueSave(key); } }
  const a = art(key); const {subs, uids, groups, diffs} = cmpModel(key);
  if (!S.cmp.sel || (S.cmp.sel.type === 'ch' && !groups[S.cmp.sel.gi]))
    S.cmp.sel = diffs.find(x => x.type === 'ch' || !cmpSpec(x, groups).none) || {type:'cat', cat:'char'};
  const sel = S.cmp.sel, spec = cmpSpec(sel, groups), sk = selKey(sel);
  const T = cmpText(a, uids, subs, spec);
  const cs = consensus(key); const fin = S.finals[key] || {};
  const canResolve = S.isAdmin && !a.practice;
  const onlyDiff = !!S.cmp.onlyDiff;
  const zh = a.dataset === '1' ? 'zh' : 'en';
  const dot = u => `<i class="cdot" style="background:${CCOL[uids.indexOf(u) % CCOL.length]}"></i>`;
  const list = eligible.map(x => { const ss = Object.values(subsOf(x.key)); const ag = articleAgreement(ss);
    return `<button class="art ${key === x.key ? 'on' : ''}" data-act="cmpopen" data-key="${esc(x.key)}"><span class="st ${ag == null ? '' : ag >= .9 ? 'done' : 'draft'}"></span><span class="art-id">${esc(x.id)}</span><span class="tag">${ss.length}</span><span class="art-t">${ag == null ? 'Waiting for a second coder' : pct(ag) + ' of variables agree'}</span></button>`; }).join('');
  // codes table
  let rows = '', lastSec = '';
  for (const f of F) {
    const vs = uids.map(u => val(subs[u], f.k)); const filled = vs.filter(x => x !== '');
    const agree = filled.length < 2 ? null : filled.every(x => x === filled[0]);
    if (onlyDiff && agree !== false) continue;
    if (f.sec !== lastSec) { rows += `<tr class="grp"><td colspan="${uids.length + 3}">${esc(f.sec)}</td></tr>`; lastSec = f.sec; }
    const kind = fieldKind(f);
    const consCell = canResolve ? `<select data-act="final" data-key="${esc(key)}" data-k="${f.k}" aria-label="Consensus for ${esc(f.label)}">
        <option value="">${cs.src[f.k] === 'resolved' ? 'Majority' : cs.src[f.k] === 'tie' ? 'Tie: choose' : 'Majority: ' + esc(lab(kind, cs.values[f.k]))}</option>
        ${(kind === 'num' ? [...new Set(filled)].map(x => [x, String(x)]) : OPT[kind]).map(([vv, l]) => `<option value="${vv}" ${fin.values && fin.values[f.k] === vv ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
      : `${esc(lab(kind, cs.values[f.k]))}`;
    rows += `<tr class="selrow ${agree === false ? 'dis' : ''} ${sk === 'v:' + f.k ? 'sel' : ''}" data-act="cmpsel" data-t="var" data-k="${f.k}" tabindex="0" aria-selected="${sk === 'v:' + f.k}">
      <td>${esc(f.label)}</td>${vs.map(x => `<td>${esc(kind === 'num' ? (x === '' ? '–' : x) : lab(kind, x))}</td>`).join('')}
      <td>${agree == null ? '<span class="pill na">n/a</span>' : agree ? '<span class="pill good">agree</span>' : '<span class="pill warn">differs</span>'}</td><td>${consCell}</td></tr>`;
  }
  const chRows = groups.map((g, gi) => {
    const mem = Object.values(g.members); const same = cmpRoleSame(g, uids);
    if (onlyDiff && same) return '';
    const cells = uids.map(u => { const m = g.members[u]; if (!m) return '<td style="color:var(--faint)">not coded</td>';
      const vv = cv(m.c, m.ch, 'valid');
      return `<td><b>${esc(m.ch.en || m.ch.name)}</b><br><span style="font-size:12px;color:var(--muted)">${vv === 1 ? `${lab('role', cv(m.c, m.ch, 'role'))} · ${lab('level', cv(m.c, m.ch, 'level'))} · PRC ${lab('bin', cv(m.c, m.ch, 'prc'))}` : vv === 0 ? 'not valid' : 'validity open'}</span></td>`; }).join('');
    return `<tr class="selrow ${same ? '' : 'dis'} ${sk === 'g:' + gi ? 'sel' : ''}" data-act="cmpsel" data-t="ch" data-k="${gi}" tabindex="0" aria-selected="${sk === 'g:' + gi}"><td>${esc(g.label)}</td>${cells}<td>${same ? '<span class="pill good">agree</span>' : mem.length < uids.length ? '<span class="pill warn">not found by all</span>' : '<span class="pill warn">role differs</span>'}</td></tr>`;
  }).join('');
  const di = diffs.findIndex(x => selKey(x) === sk);
  const nV = diffs.filter(x => x.type === 'var').length, nC = diffs.filter(x => x.type === 'ch').length;
  const revs = uids.map(u => subs[u].revisions ? `${esc(coderLabel(u))} revised ${subs[u].revisions}×${subs[u].revisedAfterComparison ? ' after comparing' : ''}` : '').filter(Boolean).join(' · ');
  const same = S.cmp.lastKey === key, keep = same ? ['.cx-list', '#cxText', '.cx-cmp'].map(q => { const el = $(q); return el ? el.scrollTop : 0; }) : null;
  S.cmp.lastKey = key;
  v.innerHTML = `<nav class="cx-tabs" aria-label="Panes"><button data-act="cxpane" data-v="text" class="${S.cmp.pane === 'text' ? 'on' : ''}">Text</button><button data-act="cxpane" data-v="cmp" class="${S.cmp.pane === 'cmp' ? 'on' : ''}">Comparison${diffs.length ? ` <span class="badge">${diffs.length}</span>` : ''}</button></nav>
  <div class="cmpx" data-pane="${S.cmp.pane}">
    <aside class="cx-list pane" aria-label="Articles"><div class="grp-l" style="margin-top:0">Articles</div>${list}<div style="margin-top:14px">${leadToggle()}</div></aside>
    <section class="cx-text pane" id="cxText" aria-label="Article text">
      <div class="cx-mnow"><span>${esc(spec ? spec.label : '–')}</span><button class="btn sm" data-act="cmpstep" data-d="-1" ${diffs.length ? '' : 'disabled'} aria-label="Previous difference">‹</button><button class="btn sm pri" data-act="cmpstep" data-d="1" ${diffs.length ? '' : 'disabled'} aria-label="Next difference">›</button></div>
      <div class="cx-th">
        <div class="cx-pick"><select data-act="cmppick" aria-label="Article">${eligible.map(x => `<option value="${esc(x.key)}" ${x.key === key ? 'selected' : ''}>${esc(x.id)} · ${esc((x.title || '').slice(0, 50))}</option>`).join('')}</select></div>
        <div class="rd-meta"><span class="tag">${esc(a.id)}</span><span>${a.dataset === '1' ? 'Chinese' : 'English'}</span>${metaLine(a)}${a.practice ? '<span class="pill na">practice</span>' : ''}</div>
        <h2 class="cx-title" lang="${zh}">${esc(a.title || a.id)}</h2>
        <div class="cx-now">In the text: <b>${esc(spec ? spec.label : '–')}</b>${T.overlap != null ? ` · coders' marks overlap <b>${pct(T.overlap)}</b>` : ''}</div>
        <div class="cx-leg">${uids.map((u, j) => `<span title="${T.counts[j]} marked passage${T.counts[j] === 1 ? '' : 's'}">${dot(u)}${esc(coderLabel(u))} <b>${T.counts[j]}</b></span>`).join('')}${uids.length > 1 ? '<span class="cx-key"><i class="cxm some">tinted</i> = not marked by everyone</span>' : ''}</div>
        <div class="chips cx-cats" aria-label="Show a category">${CATS.filter(c => c.id !== 'note').map(c => `<button class="chip ${sk === 'c:' + c.id ? 'on' : ''}" data-act="cmpsel" data-t="cat" data-k="${c.id}">${c.short}</button>`).join('')}</div>
      </div>
      ${spec && spec.none ? `<div class="banner warn" style="margin:12px 0 0">${esc(spec.label)} is judged from the whole text, so there are no marked passages to compare. Read the text below.</div>` : ''}
      <div class="txt cx-txt" lang="${zh}">${T.html}</div>
    </section>
    <section class="cx-cmp pane" aria-label="Comparison">
      <div class="cx-bar">
        <div class="cx-sum"><b>${diffs.length ? diffs.length + ' difference' + (diffs.length > 1 ? 's' : '') : uids.length > 1 ? 'No differences' : 'One coding so far'}</b><span> ${nV} variable${nV === 1 ? '' : 's'} · ${nC} character${nC === 1 ? '' : 's'} · ${uids.length} coding${uids.length === 1 ? '' : 's'}</span>${revs ? `<span class="cx-rev">${revs}</span>` : ''}</div>
        <div class="cx-nav">
          <button class="btn sm" data-act="cmpstep" data-d="-1" ${diffs.length ? '' : 'disabled'} aria-label="Previous difference">‹</button>
          <button class="btn sm pri" data-act="cmpstep" data-d="1" ${diffs.length ? '' : 'disabled'}>${di >= 0 ? `Difference ${di + 1} of ${diffs.length} ›` : 'Next difference ›'}</button>
          <label class="cx-only"><input type="checkbox" data-act="cmponly" ${onlyDiff ? 'checked' : ''}> Only differences</label>
        </div>
      </div>
      <div class="card"><h3>Codes</h3><p class="sub">Click a row to see in the text which passages each coder marked for it.${canResolve ? ' Set the consensus after discussion; until then the majority is used.' : ''}</p>
        <div class="tw"><table class="cx-tab"><thead><tr><th>Variable</th>${uids.map(u => `<th>${dot(u)}${esc(coderLabel(u))}</th>`).join('')}<th>Agreement</th><th>Consensus</th></tr></thead><tbody>${rows || `<tr><td colspan="${uids.length + 3}" style="color:var(--muted)">All codes agree.</td></tr>`}</tbody></table></div></div>
      <div class="card"><h3>Characters</h3><p class="sub">Click a character to see each coder's marks for it. Characters are matched by name or overlapping marks.</p>
        <div class="tw"><table class="cx-tab"><thead><tr><th>Character</th>${uids.map(u => `<th>${dot(u)}${esc(coderLabel(u))}</th>`).join('')}<th>Agreement</th></tr></thead><tbody>${chRows || `<tr><td colspan="${uids.length + 2}" style="color:var(--muted)">${groups.length ? 'All characters agree.' : 'No characters coded.'}</td></tr>`}</tbody></table></div></div>
      <div class="card"><h3>Narrative summaries</h3><div class="sumc" style="margin-top:10px">${uids.map(u => `<div><b>${dot(u)}${esc(coderLabel(u))}</b>${esc(subs[u].summary || '—')}</div>`).join('')}</div>
        ${canResolve ? `<label style="display:grid;gap:4px;margin-top:12px;font-size:12.5px;color:var(--muted);font-weight:500">Agreed summary (goes into the consensus dataset)<textarea id="finsum" data-key="${esc(key)}" rows="3">${esc(fin.summary || '')}</textarea></label>` : ''}</div>
      ${uids.some(u => subs[u].memo) ? `<div class="card"><h3>Memos</h3><div class="sumc" style="margin-top:10px">${uids.filter(u => subs[u].memo).map(u => `<div><b>${dot(u)}${esc(coderLabel(u))}</b>${esc(subs[u].memo)}</div>`).join('')}</div></div>` : ''}
      ${a.practice ? '' : `<div><button class="btn sm" data-act="gocode" data-key="${esc(key)}">Open in Code</button></div>`}
    </section>
  </div>`;
  if (keep) ['.cx-list', '#cxText', '.cx-cmp'].forEach((q, i) => { const el = $(q); if (el) el.scrollTop = keep[i]; });
  if (S.cmp.scroll) { S.cmp.scroll = false; cmpScrollToMark(); }
}
function cmpScrollToMark() {
  requestAnimationFrame(() => {
    const pane = $('#cxText'); if (!pane) return; const first = pane.querySelector('.cx-txt .cxm.some') || pane.querySelector('.cx-txt .cxm'); if (!first) return;
    const head = pane.querySelector('.cx-th'); const pr = pane.getBoundingClientRect(), fr = first.getBoundingClientRect();
    const top = pane.scrollTop + fr.top - pr.top - (head ? head.offsetHeight : 0) - 24;
    const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isPhone()) window.scrollTo({top:Math.max(0, fr.top + scrollY - 120), behavior:smooth ? 'smooth' : 'auto'});
    else pane.scrollTo({top:Math.max(0, top), behavior:smooth ? 'smooth' : 'auto'});
    first.classList.add('flash'); setTimeout(() => first.classList.remove('flash'), 1200);
  });
}
function cmpSelect(s, fromText) {
  S.cmp.sel = s; S.cmp.scroll = true;
  if (isPhone() && !fromText) S.cmp.pane = 'text';
  renderView();
}
function cmpStep(dir) {
  const {diffs} = cmpModel(S.cmp.key); if (!diffs.length) return;
  const i = diffs.findIndex(x => selKey(x) === selKey(S.cmp.sel));
  cmpSelect(diffs[i < 0 ? (dir > 0 ? 0 : diffs.length - 1) : (i + dir + diffs.length) % diffs.length]);
}
function articleAgreement(subs) {
  if (subs.length < 2) return null; let a = 0, t = 0;
  for (const f of F) { const vs = subs.map(c => val(c, f.k)).filter(x => x !== ''); if (vs.length < 2) continue; t++; if (vs.every(x => x === vs[0])) a++; }
  return t ? a / t : null;
}
function spanAgreement(codings, cat) {
  const ivs = codings.map(c => spansOf(c, cat)); let sum = 0, n = 0;
  for (let i = 0; i < ivs.length; i++) for (let j = i + 1; j < ivs.length; j++) {
    const la = ivLen(ivs[i]), lb = ivLen(ivs[j]); if (!la && !lb) continue;
    sum += 2 * ivOverlap(ivs[i], ivs[j]) / (la + lb); n++;
  }
  return n ? sum / n : null;
}

/* ================= RELIABILITY view ================= */
let relCache = {sig:'', res:null};
function relData() {
  const basis = S.rel.basis, ds = S.rel.ds;
  const arts = corpus().filter(a => (ds === 'all' || a.dataset === ds));
  let units = arts.map(a => ({a, subs:Object.entries(subsOf(a.key)).map(([uid, s]) => ({uid, c:codingFor(s, basis)}))})).filter(u => u.subs.length >= 2);
  const early = units.filter(u => discussedEarly(u.a.key)).length;
  if (S.rel.noDisc) units = units.filter(u => !discussedEarly(u.a.key));
  return {arts, units, early};
}
function computeRel() {
  const {arts, units, early} = relData();
  const sig = S.rel.basis + S.rel.ds + (S.rel.noDisc ? 'nd' : '') + units.map(u => u.a.key + u.subs.map(s => s.uid + (s.c.submittedAt || '')).join()).join('|') + JSON.stringify(S.finals).length;
  if (relCache.sig === sig) return relCache.res;
  const vars = F.map(f => ({f, r:reliability(units.map(u => u.subs.map(s => val(s.c, f.k))), f.num ? 'interval' : 'nominal')}));
  // characters
  let jac = 0, jn = 0; const roleU = [], levelU = [], prcU = [], validU = [];
  units.forEach(u => {
    const groups = alignChars(u.subs); const ids = u.subs.map(s => s.uid);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const A = groups.filter(g => g.members[ids[i]]).length, B = groups.filter(g => g.members[ids[j]]).length, both = groups.filter(g => g.members[ids[i]] && g.members[ids[j]]).length;
      if (A + B - both > 0) { jac += both / (A + B - both); jn++; }
    }
    groups.forEach(g => { const m = Object.values(g.members); if (m.length < 2) return;
      validU.push(m.map(x => cv(x.c, x.ch, 'valid')));
      const vm = m.filter(x => cv(x.c, x.ch, 'valid') === 1);
      roleU.push(vm.map(x => cv(x.c, x.ch, 'role'))); levelU.push(vm.map(x => cv(x.c, x.ch, 'level'))); prcU.push(vm.map(x => cv(x.c, x.ch, 'prc'))); });
  });
  const chars = {jaccard:jn ? jac / jn : null, jn, valid:reliability(validU), role:reliability(roleU), level:reliability(levelU), prc:reliability(prcU)};
  const spans = CATS.filter(c => c.id !== 'note').map(c => { let s = 0, n = 0; units.forEach(u => { const x = spanAgreement(u.subs.map(z => z.c), c.id); if (x != null) { s += x; n++; } }); return {c, f1:n ? s / n : null, n}; });
  // coder pairs
  const byCoder = {};
  units.forEach(u => u.subs.forEach(s => { const cc = coderCodeOf(s.uid) || s.uid; (byCoder[cc] = byCoder[cc] || {})[u.a.key] = s.c; }));
  const coders = Object.keys(byCoder).sort();
  const pair = {};
  coders.forEach(x => coders.forEach(y => { if (x >= y) return; let ag = 0, t = 0, arts2 = 0;
    for (const k in byCoder[x]) if (byCoder[y][k]) { arts2++; for (const f of F) { const a1 = val(byCoder[x][k], f.k), a2 = val(byCoder[y][k], f.k); if (a1 === '' || a2 === '') continue; t++; if (a1 === a2) ag++; } }
    pair[x + '|' + y] = {p:t ? ag / t : null, n:arts2}; }));
  const nCoders = new Set(units.flatMap(u => u.subs.map(s => coderCodeOf(s.uid) || s.uid))).size;
  const res = {arts, units, early, vars, chars, spans, coders, pair, nCoders,
    perArt:units.map(u => u.subs.length), cn:units.filter(u => u.a.dataset === '1').length, en:units.filter(u => u.a.dataset === '2').length};
  relCache = {sig, res}; return res;
}
function alphaCell(r) {
  const a = r.a; const w = x => Math.max(0, Math.min(1, x)) * 100;
  return `<div class="abar" title="α = ${fmtA(a)}">${a != null ? `<i style="width:${w(a)}%;background:var(--${band(a) === 'na' ? 'faint' : band(a)})"></i>` : ''}${r.ci ? `<span class="ci" style="left:${w(r.ci[0])}%;width:${Math.max(0.5, w(r.ci[1]) - w(r.ci[0]))}%"></span>` : ''}<span class="t" style="left:66.7%"></span><span class="t" style="left:80%"></span></div>`;
}
function viewRel(v) {
  const R = computeRel(); const n = R.units.length; const pair = R.pair;
  const ctrl = `<div class="filters">
      <span class="mini-seg" role="group" aria-label="Basis"><button data-act="relb" data-v="first" class="${S.rel.basis === 'first' ? 'on' : ''}">Independent (first submission)</button><button data-act="relb" data-v="current" class="${S.rel.basis === 'current' ? 'on' : ''}">Latest version</button></span>
      <span class="mini-seg" role="group" aria-label="Dataset"><button data-act="relds" data-v="all" class="${S.rel.ds === 'all' ? 'on' : ''}">All</button><button data-act="relds" data-v="1" class="${S.rel.ds === '1' ? 'on' : ''}">CN</button><button data-act="relds" data-v="2" class="${S.rel.ds === '2' ? 'on' : ''}">EN</button></span>
      ${S.mode === 'shared' ? `<label style="display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted)"><input type="checkbox" data-act="relnodisc" ${S.rel.noDisc ? 'checked' : ''} style="width:auto"> Leave out articles discussed before all coders submitted${R.early && !S.rel.noDisc ? ` (${R.early})` : ''}</label>` : ''}</div>`;
  if (!n) {
    v.innerHTML = `<div class="wide"><div class="wrap"><div class="vh"><div><h2>Intercoder reliability</h2><p>Krippendorff's α for every variable, computed live as codings come in.</p></div><div class="tools">${ctrl}</div></div>
      <div class="card empty"><b>Reliability appears once an article has two submitted codings</b>${R.arts.length} article${R.arts.length === 1 ? '' : 's'} in the corpus, ${corpus().filter(a => Object.keys(subsOf(a.key)).length === 1).length} with one coding so far. Every variable from the Results sheet will get α, a 95% interval, percent agreement and a plain-language verdict here, plus agreement on characters and marked passages and a ready-to-paste methods paragraph.</div>
      ${relLegend()}</div></div>`;
    return;
  }
  const vals = R.vars.filter(x => x.r.a != null).map(x => x.r.a);
  const med = vals.length ? [...vals].sort((a, b) => a - b)[Math.floor((vals.length - 1) / 2)] : null;
  const good = vals.filter(a => a >= .8).length + R.vars.filter(x => x.r.novar).length, tent = vals.filter(a => a >= .667 && a < .8).length, bad = vals.filter(a => a < .667).length;
  const rows = R.vars.map(({f, r}) => `<tr><td>${esc(f.label)}<div style="font-size:11.5px;color:var(--faint)">${esc(f.sec)}${f.num ? ' · interval metric' : ''}</div></td>
      <td class="n"><b>${fmtA(r.a)}</b></td><td style="min-width:140px">${alphaCell(r)}</td>
      <td class="n">${r.ci ? fmtA(r.ci[0]) + ' – ' + fmtA(r.ci[1]) : '–'}</td><td class="n">${pct(r.agree)}</td><td class="n">${r.units}</td>
      <td>${r.novar ? '<span class="pill good">perfect agreement</span><div style="font-size:11.5px;color:var(--muted);margin-top:3px">Every coder chose the same value in every article, so α has no variation to measure and is undefined.</div>' : `<span class="pill ${band(r.a)}">${bandLabel(r.a)}</span>`}${r.novar ? '' : r.maxShare > .9 && r.a != null ? '<div style="font-size:11.5px;color:var(--muted);margin-top:3px">One value dominates (>90%), so a single disagreement moves α a lot. Read it together with % agreement.</div>' : ''}</td></tr>`).join('');
  const C = R.chars;
  const chRow = (name, r, note) => `<tr><td>${name}<div style="font-size:11.5px;color:var(--faint)">${note}</div></td><td class="n"><b>${fmtA(r.a)}</b></td><td>${alphaCell(r)}</td><td class="n">${r.ci ? fmtA(r.ci[0]) + ' – ' + fmtA(r.ci[1]) : '–'}</td><td class="n">${pct(r.agree)}</td><td class="n">${r.units}</td><td>${r.novar ? '<span class="pill good">perfect agreement</span>' : `<span class="pill ${band(r.a)}">${bandLabel(r.a)}</span>`}</td></tr>`;
  v.innerHTML = `<div class="wide"><div class="wrap">
    <div class="vh"><div><h2>Intercoder reliability</h2><p>Krippendorff's α per variable (nominal; interval for the number of characters). Use <b>Independent</b> for publication: it uses each coder's first submission, stored by the database before any comparison or discussion.${S.mode === 'shared' && !S.isAdmin ? ' You see the articles you have coded yourself; the project lead sees the whole corpus.' : ''}</p></div><div class="tools">${ctrl}</div></div>
    <div class="stats">
      <div class="stat"><b>${n}</b><span>articles with ≥2 codings (${R.cn} CN · ${R.en} EN)</span></div>
      <div class="stat"><b>${R.nCoders}</b><span>coders · ${Math.min(...R.perArt)}–${Math.max(...R.perArt)} per article</span></div>
      <div class="stat"><b>${fmtA(med)}</b><span>median α across variables</span></div>
      <div class="stat"><b style="color:var(--good)">${good}<span style="color:var(--warn);font-size:18px"> · ${tent}</span><span style="color:var(--bad);font-size:18px"> · ${bad}</span></b><span>reliable · tentative · not reliable</span></div>
    </div>
    ${relLegend()}
    <div class="card"><h3>Variables</h3><p class="sub">Bar = α, bracket = 95% bootstrap interval, ticks at .667 and .80. n = articles with at least two values.</p>
      <div class="tw"><table><thead><tr><th>Variable</th><th class="n" style="text-transform:none">α</th><th></th><th class="n">95% CI</th><th class="n">% agree</th><th class="n">n</th><th>Verdict</th></tr></thead><tbody>${rows}</tbody></table></div></div>
    <div class="card"><h3>Characters</h3><p class="sub">Characters are matched across coders by name or overlapping marks. <b>Identification overlap</b> (mean pairwise Jaccard): ${C.jaccard == null ? '–' : '<b>' + pct(C.jaccard) + '</b>'} of characters found by one coder were also found by the other.</p>
      <div class="tw"><table><thead><tr><th>Character attribute</th><th class="n" style="text-transform:none">α</th><th></th><th class="n">95% CI</th><th class="n">% agree</th><th class="n">n</th><th>Verdict</th></tr></thead><tbody>
        ${chRow('Validity', C.valid, 'characters found by ≥2 coders')}${chRow('Role', C.role, 'valid characters found by ≥2 coders')}${chRow('Level', C.level, 'valid characters found by ≥2 coders')}${chRow('PRC-Chinese', C.prc, 'valid characters found by ≥2 coders')}</tbody></table></div></div>
    <div class="card"><h3>Marked passages</h3><p class="sub">How much the highlighted text overlaps between two coders (pairwise F1 on characters of text, averaged). Descriptive: it shows whether coders base the same code on the same evidence.</p>
      <div class="tw"><table><thead><tr><th>Category</th><th class="n">Overlap</th><th></th><th class="n">pairs</th></tr></thead><tbody>${R.spans.map(s => `<tr><td><span class="dot" style="--c:${s.c.color};display:inline-block;margin-right:6px"></span>${s.c.label}</td><td class="n">${pct(s.f1)}</td><td style="min-width:140px"><div class="abar">${s.f1 != null ? `<i style="width:${s.f1 * 100}%;background:${s.c.color}"></i>` : ''}</div></td><td class="n">${s.n}</td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><h3>Coder pairs</h3><p class="sub">Percent agreement over all variables for each pair of coders. A pair far below the rest points to a codebook rule read differently.</p>
      <div class="tw"><table><thead><tr><th></th>${R.coders.map(c => `<th class="n">${esc(coderIni(c))}</th>`).join('')}</tr></thead><tbody>${R.coders.map(x => `<tr><th>${esc(coderIni(x))}</th>${R.coders.map(y => { if (x === y) return '<td class="n" style="color:var(--faint)">—</td>'; const p = pair[x < y ? x + '|' + y : y + '|' + x]; return `<td class="n" title="${p && p.n} shared articles" style="${p && p.p != null ? `background:color-mix(in srgb,var(--${p.p >= .9 ? 'good' : p.p >= .8 ? 'warn' : 'bad'}) 16%,transparent)` : ''}">${p && p.p != null ? pct(p.p) : '–'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>
    <div class="card"><h3>Methods paragraph</h3><p class="sub">Generated from the numbers above. Check and adapt before use.</p><div class="methods" id="methods">${esc(methodsText(R))}</div><div style="margin-top:10px"><button class="btn sm" data-act="copymethods">Copy text</button></div></div>
  </div></div>`;
}
function relLegend() {
  return `<div class="keyrow"><span><i style="background:var(--good)"></i>α ≥ .800 reliable</span><span><i style="background:var(--warn)"></i>.667 – .799 tentative conclusions only</span><span><i style="background:var(--bad)"></i>&lt; .667 not reliable</span><span>(Krippendorff 2004)</span></div>`;
}
function methodsText(R) {
  const ok = R.vars.filter(x => x.r.a != null); if (!ok.length) return '';
  const mn = ok.reduce((m, x) => x.r.a < m.r.a ? x : m), mx = ok.reduce((m, x) => x.r.a > m.r.a ? x : m);
  const sorted = ok.map(x => x.r.a).sort((a, b) => a - b), med = sorted[Math.floor((sorted.length - 1) / 2)];
  const good = ok.filter(x => x.r.a >= .8).length, tent = ok.filter(x => x.r.a >= .667).length;
  const lo = Math.min(...R.perArt), hi = Math.max(...R.perArt);
  const basis = S.rel.basis === 'first' ? "Agreement was calculated on the coders' first, independent submissions, before any comparison or discussion." : 'Agreement was calculated on the latest version of each coding.';
  const C = R.chars;
  return `Intercoder reliability was assessed on ${R.units.length} articles (${R.cn} Chinese-language, ${R.en} English-language), each coded independently by ${lo === hi ? lo : lo + '–' + hi} of ${R.nCoders} trained coders using the NPF codebook. Coders annotated the text passages supporting each code directly in the article. ${basis} Krippendorff's α (nominal metric; interval metric for the number of characters) ranged from ${fmtA(mn.r.a)} (${mn.f.label.toLowerCase()}) to ${fmtA(mx.r.a)} (${mx.f.label.toLowerCase()}), with a median of ${fmtA(med)} across ${ok.length} variables; ${good} variables reached α ≥ .80 and ${tent} reached α ≥ .667 (Krippendorff, 2004).${R.vars.some(x => x.r.novar) ? ' For ' + R.vars.filter(x => x.r.novar).length + ' variable(s) all coders assigned the same value throughout, so α is undefined while agreement is perfect.' : ''} 95% confidence intervals were obtained by bootstrapping articles (1,000 resamples).${C.jaccard != null ? ` For characters, the mean pairwise overlap of identified characters (Jaccard) was ${pct(C.jaccard)}; for characters identified by at least two coders, α was ${fmtA(C.role.a)} for role, ${fmtA(C.level.a)} for level and ${fmtA(C.prc.a)} for PRC affiliation.` : ''} ${S.rel.noDisc ? ' Articles that coders discussed with each other before all of them had submitted their first coding were excluded from this calculation.' : ''} Disagreements were then discussed and resolved to form the consensus dataset used in the analysis.`;
}

/* ================= ANALYSE view ================= */
function analysable() { return corpus().filter(a => Object.keys(subsOf(a.key)).length && canSeeOthers(a.key)); }
function viewAnalyse(v) {
  const t = S.an.tab;
  const tabs = [['passages','Coded passages'],['characters','Characters'],['distributions','Distributions'],['summaries','Summaries']];
  v.innerHTML = `<div class="wide"><div class="wrap">
    <div class="vh"><div><h2>Analyse</h2><p>Qualitative retrieval and corpus overviews. Built on the consensus of submitted codings (majority, or the resolved value where set). Articles you still have to code are left out.</p></div><div class="tools">${leadToggle()}</div></div>
    <div class="chips">${tabs.map(([k, l]) => `<button class="chip ${t === k ? 'on' : ''}" data-act="antab" data-v="${k}">${l}</button>`).join('')}</div>
    ${analysable().length ? (t === 'passages' ? anPassages() : t === 'characters' ? anChars() : t === 'distributions' ? anDist() : anSums())
      : '<div class="card empty"><b>Nothing to analyse yet</b>Analysis uses submitted codings of corpus articles. Once articles are coded, this view lists every coded passage with its context, the characters across the corpus with their roles, and the distribution of each variable by dataset.</div>'}
  </div></div>`;
}
function anPassages() {
  const {cat, ds, coder, q} = S.an; const out = [];
  analysable().forEach(a => { if (ds !== 'all' && a.dataset !== ds) return;
    const subs = subsOf(a.key); const uids = Object.keys(subs);
    uids.forEach(u => { if (coder !== 'all' && coderCodeOf(u) !== coder) return; const c = subs[u];
      c.anns.forEach(x => { if (cat && x.cat !== cat) return; if (q && !x.t.toLowerCase().includes(q.toLowerCase()) && !(x.note || '').toLowerCase().includes(q.toLowerCase())) return;
        const others = uids.filter(o => o !== u && subs[o].anns.some(y => y.cat === x.cat && y.s < x.e && y.e > x.s)).length;
        out.push({a, u, c, x, others, k:uids.length}); }); }); });
  const coders = [...new Set(analysable().flatMap(a => Object.keys(subsOf(a.key)).map(coderCodeOf)).filter(Boolean))].sort();
  const chName = (c, id) => { const ch = (c.chars || []).find(z => z.id === id); return ch ? (ch.en || ch.name) : ''; };
  return `<div class="card"><div class="filters" style="margin-bottom:8px">
      <select data-act="anf" data-f="cat" aria-label="Category"><option value="">All categories</option>${CATS.map(c => `<option value="${c.id}" ${cat === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}</select>
      <select data-act="anf" data-f="ds" aria-label="Dataset"><option value="all">CN + EN</option><option value="1" ${ds === '1' ? 'selected' : ''}>CN</option><option value="2" ${ds === '2' ? 'selected' : ''}>EN</option></select>
      <select data-act="anf" data-f="coder" aria-label="Coder"><option value="all">All coders</option>${coders.map(c => `<option value="${c}" ${coder === c ? 'selected' : ''}>${esc(coderIni(c))}</option>`).join('')}</select>
      <input type="search" id="anq" placeholder="Search passages and notes" value="${esc(q)}" aria-label="Search passages">
      <span style="color:var(--muted);font-size:12.5px;margin-left:auto">${out.length} passage${out.length === 1 ? '' : 's'}</span></div>
    ${out.slice(0, 400).map(({a, u, c, x, others, k}) => { const pre = a.text.slice(Math.max(0, x.s - 70), x.s), post = a.text.slice(x.e, x.e + 70);
      return `<div class="psg" style="--c:${CM[x.cat].color}"><div class="psg-m"><span class="dot"></span><b style="color:var(--ink)">${CM[x.cat].label}</b>${x.c ? '<span>· ' + esc(chName(c, x.c)) + '</span>' : ''}${x.p === 2 ? '<span class="tag">plot 2</span>' : ''}<span>· ${esc(a.id)}</span><span class="tag">${a.dataset === '1' ? 'CN' : 'EN'}</span><span>· ${esc(coderLabel(u))}</span>${k > 1 ? `<span class="pill ${others === k - 1 ? 'good' : others ? 'warn' : 'na'}">also marked by ${others}/${k - 1}</span>` : ''}</div>
        <q lang="${a.dataset === '1' ? 'zh' : 'en'}"><span class="ctx">${x.s > 70 ? '…' : ''}${esc(pre)}</span><mark>${esc(x.t)}</mark><span class="ctx">${esc(post)}${x.e + 70 < a.text.length ? '…' : ''}</span></q>
        ${x.note ? `<div style="font-size:12.5px;color:var(--muted)">Note: ${esc(x.note)}</div>` : ''}</div>`; }).join('') || '<p style="color:var(--muted)">No passage matches these filters.</p>'}
    ${out.length > 400 ? '<p style="color:var(--muted)">Showing the first 400. Narrow the filters or export the Passages sheet.</p>' : ''}</div>`;
}
function anChars() {
  const ds = S.an.ds; const agg = {};
  analysable().forEach(a => { if (ds !== 'all' && a.dataset !== ds) return; const cs = consensus(a.key);
    cs.chars.forEach(ch => { const k = normName(ch.label); const g = agg[k] = agg[k] || {names:[], arts:new Set(), roles:{1:0, 2:0, 3:0, 4:0}, levels:[], prc:[], ds:new Set()};
      g.names.push(ch.label); g.arts.add(a.key); g.ds.add(a.dataset); if (ch.role) g.roles[ch.role]++; if (ch.level) g.levels.push(ch.level); if (ch.prc !== '') g.prc.push(ch.prc); }); });
  const rows = Object.values(agg).sort((a, b) => b.arts.size - a.arts.size);
  return `<div class="card"><div class="filters" style="margin-bottom:10px"><select data-act="anf" data-f="ds" aria-label="Dataset"><option value="all">CN + EN</option><option value="1" ${ds === '1' ? 'selected' : ''}>CN</option><option value="2" ${ds === '2' ? 'selected' : ''}>EN</option></select>
    <div class="keyrow">${OPT.role.map(([v, l]) => `<span><i style="background:${ROLE_COL[v]}"></i>${l}</span>`).join('')}</div></div>
    <p class="sub">Consensus characters (found by a majority of coders, valid), grouped by name. Variants such as “China” and “Beijing” stay separate on purpose: decide in the analysis whether to merge them.</p>
    <div class="tw"><table><thead><tr><th>Character</th><th class="n">Articles</th><th>Roles</th><th>Most common level</th><th class="n">PRC</th></tr></thead><tbody>
    ${rows.map(g => { const tot = Object.values(g.roles).reduce((a, b) => a + b, 0);
      return `<tr><td><b>${esc(mode(g.names))}</b>${new Set(g.names).size > 1 ? `<div style="font-size:11.5px;color:var(--faint)">${esc([...new Set(g.names)].join(' / '))}</div>` : ''}</td><td class="n">${g.arts.size}</td>
      <td><div class="stack" title="${OPT.role.map(([v, l]) => l + ' ' + g.roles[v]).join(' · ')}">${tot ? OPT.role.map(([v]) => g.roles[v] ? `<i style="width:${g.roles[v] / tot * 100}%;background:${ROLE_COL[v]}"></i>` : '').join('') : ''}</div><div style="font-size:11.5px;color:var(--muted);margin-top:2px">${OPT.role.filter(([v]) => g.roles[v]).map(([v, l]) => l + ' ' + g.roles[v]).join(' · ')}</div></td>
      <td>${esc(lab('level', mode(g.levels)))}</td><td class="n">${g.prc.length ? pct(g.prc.filter(x => x === 1).length / g.prc.length) : '–'}</td></tr>`; }).join('') || '<tr><td colspan="5" style="color:var(--muted)">No consensus characters yet.</td></tr>'}</tbody></table></div></div>`;
}
function anDist() {
  const arts = analysable(); const css = Object.fromEntries(arts.map(a => [a.key, consensus(a.key)]));
  const groups = [['1','CN'],['2','EN']].filter(([d]) => arts.some(a => a.dataset === d));
  const bins = F.filter(f => !f.ptype && !f.num);
  const share = (k, d) => { const xs = arts.filter(a => a.dataset === d).map(a => css[a.key].values[k]).filter(v => v !== ''); return {p:xs.length ? xs.filter(v => v === 1).length / xs.length : null, n:xs.length}; };
  const binRows = bins.map(f => `<tr><td>${esc(f.label)}</td>${groups.map(([d]) => { const s = share(f.k, d); return `<td style="min-width:170px"><div style="display:flex;align-items:center;gap:8px"><div class="abar" style="flex:1"><i style="width:${(s.p || 0) * 100}%;background:var(--accent)"></i></div><span class="n" style="font-family:var(--mono);font-size:12px;width:76px;text-align:right">${pct(s.p)} <span style="color:var(--faint)">n=${s.n}</span></span></div></td>`; }).join('')}</tr>`).join('');
  const PCOL = {1:'var(--good)', 2:'var(--bad)', 3:'var(--warn)'};
  const ptRow = (k, d) => { const xs = arts.filter(a => a.dataset === d).map(a => css[a.key].values[k]).filter(v => v !== ''); const t = xs.length;
    return `<td><div class="stack">${t ? [1, 2, 3].map(v => { const c = xs.filter(x => x === v).length; return c ? `<i style="width:${c / t * 100}%;background:${PCOL[v]}" title="${lab('plot', v)} ${c}"></i>` : ''; }).join('') : ''}</div><div style="font-size:11.5px;color:var(--muted);margin-top:2px">${[1, 2, 3].map(v => lab('plot', v) + ' ' + xs.filter(x => x === v).length).join(' · ')}</div></td>`; };
  // PRC × role
  const cross = d => { const m = {1:{1:0, 2:0, 3:0, 4:0}, 0:{1:0, 2:0, 3:0, 4:0}}; arts.filter(a => d === 'all' || a.dataset === d).forEach(a => css[a.key].chars.forEach(ch => { if ((ch.prc === 1 || ch.prc === 0) && ch.role) m[ch.prc][ch.role]++; })); return m; };
  const crossTable = (d, title) => { const m = cross(d); const tot = r => Object.values(m[r]).reduce((a, b) => a + b, 0);
    return `<div><h3 style="font-size:13px;margin:0 0 6px">${title}</h3><div class="tw"><table><thead><tr><th></th>${OPT.role.map(([, l]) => `<th class="n">${l}</th>`).join('')}<th class="n">n</th></tr></thead><tbody>${[[1, 'PRC-Chinese'], [0, 'Not PRC']].map(([r, l]) => `<tr><th>${l}</th>${OPT.role.map(([v]) => { const t = tot(r); const x = m[r][v]; return `<td class="n" style="${t ? `background:color-mix(in srgb,${ROLE_COL[v]} ${Math.round(x / t * 45)}%,transparent)` : ''}">${t ? pct(x / t) : '–'}<div style="font-size:10.5px;color:var(--faint)">${x}</div></td>`; }).join('')}<td class="n">${tot(r)}</td></tr>`).join('')}</tbody></table></div></div>`; };
  return `<div class="card"><h3>How often each element appears</h3><p class="sub">Share of articles coded “Yes” in the consensus.</p>
      <div class="tw"><table><thead><tr><th>Variable</th>${groups.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>${binRows}</tbody></table></div></div>
    <div class="card"><h3>Plot type</h3><div class="keyrow" style="margin-bottom:8px"><span><i style="background:var(--good)"></i>Positive</span><span><i style="background:var(--bad)"></i>Negative</span><span><i style="background:var(--warn)"></i>Mixed</span></div>
      <div class="tw"><table><thead><tr><th></th>${groups.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody><tr><td>Plot 1</td>${groups.map(([d]) => ptRow('pt1', d)).join('')}</tr><tr><td>Plot 2</td>${groups.map(([d]) => ptRow('pt2', d)).join('')}</tr></tbody></table></div></div>
    <div class="card"><h3>Who is cast in which role?</h3><p class="sub">Consensus characters: share of each role within PRC-Chinese and non-PRC characters (row percentages).</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px">${groups.map(([d, l]) => crossTable(d, l)).join('')}</div></div>`;
}
function anSums() {
  return `<div class="card">${analysable().map(a => { const subs = subsOf(a.key); const fin = S.finals[a.key];
    return `<div class="psg"><div class="psg-m"><b style="color:var(--ink)">${esc(a.id)}</b><span class="tag">${a.dataset === '1' ? 'CN' : 'EN'}</span><span>${esc(a.title || '')}</span></div>
      ${fin && fin.summary ? `<div style="font:15px/1.6 var(--read)"><span class="pill good">agreed</span> ${esc(fin.summary)}</div>` : ''}
      <div class="sumc">${Object.entries(subs).map(([u, s]) => `<div><b>${esc(coderLabel(u))}</b>${esc(s.summary || '—')}</div>`).join('')}</div></div>`; }).join('')}</div>`;
}

/* ================= EXPORT ================= */
function aoaToXlsx(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, aoa, widths] of sheets) { const ws = XLSX.utils.aoa_to_sheet(aoa); if (widths) ws['!cols'] = widths.map(w => ({wch:w})); XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31)); }
  return new Blob([XLSX.write(wb, {type:'array', bookType:'xlsx'})]);
}
function allSubs(basis) { const out = []; corpus().forEach(a => Object.entries(subsOf(a.key)).forEach(([u, s]) => out.push({a, u, s, c:codingFor(s, basis)}))); return out; }
const stamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');
function individualSheets() {
  const cur = allSubs('current'), first = allSubs('first');
  const res = (list) => [resHeaders(), resLegend(), ...list.map(x => resultsRow(x.a, x.c, coderCodeOf(x.u)))];
  const chars = [['Article ID','Coder','Char #','Name in text','Name (NER)','Valid','Action','PRC-Chinese','Level','Role','Mentions marked','Actions marked']];
  const pas = [['Article ID','Coder','Dataset','Category','Plot','Character','Passage','Start','End','Note']];
  const memos = [['Article ID','Coder','First submitted','Last submitted','Revisions','Revised after comparing','Memo']];
  cur.forEach(({a, u, s, c}) => {
    const cc = coderCodeOf(u);
    (c.chars || []).forEach((ch, i) => { const v = cv(c, ch, 'valid'); chars.push([a.id, cc, i + 1, ch.name, ch.en || ch.name, v, cv(c, ch, 'action'), v === 1 ? cv(c, ch, 'prc') : '', v === 1 ? cv(c, ch, 'level') : '', v === 1 ? cv(c, ch, 'role') : '', c.anns.filter(x => x.cat === 'char' && x.c === ch.id).length, c.anns.filter(x => x.cat === 'action' && x.c === ch.id).length]); });
    (c.anns || []).slice().sort((p, q) => p.s - q.s).forEach(x => { const ch = (c.chars || []).find(z => z.id === x.c); pas.push([a.id, cc, a.dataset, CM[x.cat].label, CM[x.cat].plot ? (x.p || 1) : '', ch ? (ch.en || ch.name) : '', x.t, x.s, x.e, x.note || '']); });
    memos.push([a.id, cc, s.firstSubmittedAt || '', s.submittedAt || '', s.revisions || 0, s.revisedAfterComparison ? 1 : 0, s.memo || '']);
  });
  return [['Results', res(cur), [12, 8, 8, 30]], ['Results (independent)', res(first), [12, 8, 8, 30]], ['Characters', chars], ['Passages', pas, [12, 7, 7, 26, 5, 22, 60]], ['Memos', memos], ['Discussions', discussionsSheet(), [10, 10, 10, 8, 20, 10, 40, 80]], ['Articles', articlesSheet()]];
}
function discussionsSheet() {
  const rows = [['Thread','Article ID','Started by','Status','Started','Messages','Passage','Conversation']];
  Object.values(S.threads).sort((a, b) => a.id - b.id).forEach(t => { const a = art(t.article_key) || {id:t.article_key}; const ms = S.msgs[t.id] || [];
    rows.push([t.id, a.id, t.coder ? coderIni(t.coder) : 'lead', t.status, t.created_at, ms.length, t.quote || '', ms.map(m => (m.coder ? coderIni(m.coder) : 'lead') + ' (' + String(m.created_at).slice(0, 16).replace('T', ' ') + '): ' + m.body).join('\n')]); });
  return rows;
}
function articlesSheet() {
  const mk = [...new Set(allArticles().flatMap(a => Object.keys(a.meta || {})))];
  return [['Article ID','Dataset','Ebene','URL','Title','Assigned coders','Due','Submitted codings','Archived','Discussions','Discussed before all submitted', ...mk], ...allArticles().map(a => [a.id, a.dataset, a.ebene || '', a.url || '', a.title || '', (assigned(a) || []).join(','), a.due || '', Object.keys(subsOf(a.key)).length, a.archived ? 1 : 0, threadsFor(a.key).length, threadsFor(a.key).length ? (discussedEarly(a.key) ? 1 : 0) : '', ...mk.map(k => (a.meta || {})[k] || '')])];
}
function consensusSheets() {
  const arts = corpus().filter(a => Object.keys(subsOf(a.key)).length);
  const rows = [resHeaders(), resLegend()]; const ag = [['Article ID','Variable','Coders','Values','Agreement','Consensus','Source']];
  arts.forEach(a => { const cs = consensus(a.key); rows.push(consensusRow(a, cs)); const subs = subsOf(a.key);
    F.forEach(f => { const vs = Object.entries(subs).map(([u, s]) => [coderCodeOf(u), val(s, f.k)]); const filled = vs.map(x => x[1]).filter(x => x !== '');
      ag.push([a.id, f.label, vs.map(x => x[0]).join(','), vs.map(x => x[1] === '' ? '.' : x[1]).join(','), filled.length < 2 ? '' : filled.every(x => x === filled[0]) ? 1 : 0, cs.values[f.k], cs.src[f.k]]); }); });
  return [['Consensus', rows, [12, 10, 8, 30]], ['Agreement by article', ag, [12, 36, 8, 10, 10, 10, 12]], ['Articles', articlesSheet()]];
}
function reliabilitySheets() {
  const keep = S.rel.basis; const out = [];
  for (const basis of ['first', 'current']) {
    S.rel.basis = basis; const R = computeRel();
    const rows = [['Variable','Section','Metric','Krippendorff alpha','CI 2.5%','CI 97.5%','% agreement','Articles (n)','Pairable values','Verdict']];
    R.vars.forEach(({f, r}) => rows.push([f.label, f.sec, f.num ? 'interval' : 'nominal', r.a ?? '', r.ci ? r.ci[0] : '', r.ci ? r.ci[1] : '', r.agree ?? '', r.units, r.n, r.novar ? 'no variation' : bandLabel(r.a)]));
    [['Character validity', R.chars.valid], ['Character role', R.chars.role], ['Character level', R.chars.level], ['Character PRC-Chinese', R.chars.prc]].forEach(([l, r]) => rows.push([l, 'Characters (aligned)', 'nominal', r.a ?? '', r.ci ? r.ci[0] : '', r.ci ? r.ci[1] : '', r.agree ?? '', r.units, r.n, bandLabel(r.a)]));
    rows.push(['Character identification (mean pairwise Jaccard)', 'Characters', '', '', '', '', R.chars.jaccard ?? '', R.chars.jn, '', '']);
    R.spans.forEach(s => rows.push(['Passage overlap: ' + s.c.label, 'Text evidence (pairwise F1)', '', '', '', '', s.f1 ?? '', s.n, '', '']));
    rows.push([]); rows.push(['Methods paragraph']); rows.push([methodsText(R)]);
    out.push([basis === 'first' ? 'Reliability (independent)' : 'Reliability (latest)', rows, [44, 22, 9, 10, 9, 9, 11, 10, 10, 14]]);
  }
  S.rel.basis = keep; relCache.sig = '';
  return out;
}
function backupJSON() { return JSON.stringify({tool:'NPF Annotator', exportedAt:now(), articles:S.articles, profiles:S.profiles, subs:S.subs, finals:S.finals}, null, 1); }
function tsv(aoa) { return aoa.map(r => r.map(x => String(x ?? '').replace(/[\t\n\r]+/g, ' ')).join('\t')).join('\n'); }
async function copyText(t, msg) { try { await navigator.clipboard.writeText(t); toast(msg || 'Copied'); } catch { const ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast(msg || 'Copied'); } catch { toast('Copy was blocked. Select the text and copy it by hand.'); } ta.remove(); } }
function openExport() {
  const n = allSubs('current').length;
  modal(`<div class="mh"><div><h2>Export</h2><p class="sub">${n} submitted coding${n === 1 ? '' : 's'} across ${corpus().filter(a => Object.keys(subsOf(a.key)).length).length} articles. Excel files use the exact column layout of your Results sheet.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div style="display:grid;gap:10px">
      ${expRow('ind', 'Individual codings (.xlsx)', 'One row per coder and article in the Results layout, plus a sheet with the independent first submissions, all characters, every marked passage with position, and memos.')}
      ${expRow('cons', 'Consensus dataset (.xlsx)', 'One row per article: resolved values where set, otherwise the majority. Includes an agreement table per article and variable.')}
      ${expRow('rel', 'Reliability report (.xlsx)', 'α, intervals, % agreement and n for every variable, for independent and latest codings, with the methods paragraph.')}
      ${expRow('json', 'Full backup (.json)', 'Everything in the project, to archive with the paper or restore later.')}
    </div>`);
}
const expRow = (k, t, d) => `<div class="card" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;padding:12px 14px"><div style="flex:1;min-width:220px"><b>${t}</b><div style="color:var(--muted);font-size:12.5px">${d}</div></div><div style="display:flex;gap:6px">${k !== 'json' ? `<button class="btn sm" data-act="copyexp" data-k="${k}">Copy for Excel</button>` : ''}<button class="btn sm pri" data-act="dl" data-k="${k}">Download</button></div></div>`;
async function doExport(k, copy) {
  if (!allSubs('current').length && k !== 'json') { toast('Nothing submitted yet.'); return; }
  const sheets = k === 'ind' ? individualSheets() : k === 'cons' ? consensusSheets() : k === 'rel' ? reliabilitySheets() : null;
  if (copy) return copyText(tsv(sheets[0][1]), 'Copied “' + sheets[0][0] + '”. Paste it into Excel.');
  if (k === 'json') return saveFile('NPF_backup_' + stamp() + '.json', backupJSON());
  const names = {ind:'NPF_codings_', cons:'NPF_consensus_', rel:'NPF_reliability_'};
  if (typeof XLSX === 'undefined') { toast('The Excel library did not load. Use “Copy for Excel”.'); return; }
  await saveFile(names[k] + stamp() + '.xlsx', aoaToXlsx(sheets));
}

/* ================= modals ================= */
function modal(html, wide) { const m = $('#modal'); m.innerHTML = `<div class="mbox" role="dialog" aria-modal="true" ${wide ? 'style="max-width:980px"' : ''}>${html}</div>`; m.hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }
function openDef(i) {
  if (!SHOW_CODEBOOK || !CB.defs.length) return;
  const [t, d] = DEF(+i); const rows = [];
  const idx = +i; if ([26, 31].includes(idx)) for (let j = idx + 1; j < idx + 5 && CB.defs[j] && CB.defs[j][0]; j++) rows.push(CB.defs[j]);
  modal(`<div class="mh"><h2>${esc(t)}</h2><button class="x" data-act="close" aria-label="Close">×</button></div><p style="white-space:pre-wrap;font:15px/1.6 var(--read)">${esc(d)}</p>${rows.map(r => `<div class="cb-i"><b>${esc(r[0])}</b><p>${esc(r[1])}</p></div>`).join('')}`);
}
function openCodebook() {
  if (!SHOW_CODEBOOK || !CB.defs.length) return;
  let h = '';
  CB.defs.forEach(([t, d]) => { if (!t) return; const isSec = /^[A-Z ]+$/.test(t.trim()) || /^EBENE LEVELS|PRECODED/.test(t); h += isSec ? `<div class="cb-sec">${esc(t)}</div>${d ? `<p style="color:var(--muted);margin:0 0 6px">${esc(d)}</p>` : ''}` : `<div class="cb-i"><b>${esc(t)}</b>${d ? `<p>${esc(d)}</p>` : ''}</div>`; });
  modal(`<div class="mh"><div><h2>Codebook</h2><p class="sub">Definitions from the coding table. The same text opens from every “?”.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="cb-sec">Shortcut keys while text is selected</div><div class="keyrow" style="margin-bottom:8px">${CATS.map(c => `<span><i style="background:${c.color}"></i>${c.key.toUpperCase()} ${c.short}</span>`).join('')}<span>Ctrl/⌘ Z undo</span></div>${h}`, true);
}
function openCoder(thenSubmit) {
  const taken = {}; Object.entries(S.profiles).forEach(([u, p]) => { if (u !== S.uid && p.coder) taken[p.coder] = true; });
  modal(`<div class="mh"><div><h2>Which coder are you?</h2><p class="sub">Your number goes into the “Coder” column of every export. You pick it once; change it later from the top bar.</p></div>${S.coder ? '<button class="x" data-act="close" aria-label="Close">×</button>' : ''}</div>
    <div class="coder-grid">${CODERS.map(c => `<button class="coder-b ${taken[c.code] ? 'taken' : ''}" data-act="pickcoder" data-v="${c.code}" data-then="${thenSubmit ? 1 : ''}"><b>${c.ini}</b><span>Coder ${c.code}${taken[c.code] ? ' · already used by someone' : ''}${S.coder === c.code ? ' · you' : ''}</span></button>`).join('')}</div>`);
}
async function pickCoder(code, then) {
  S.coder = code; closeModal();
  S.local.coder = code; persistLocal();
  render(); if (then) submit();
}

/* ---------- articles admin ---------- */
function openArticles() {
  importState = {sheets:[], direct:[], backup:null};
  const list = allArticles();
  modal(`<div class="mh"><div><h2>Articles</h2><p class="sub">${corpus().length} in the corpus${list.length > corpus().length ? ', ' + (list.length - corpus().length) + ' archived' : ''}. Codings stay attached when you re-import an article with the same ID. Articles with codings can only be archived, never deleted.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="drop" id="drop"><b>Drop files here</b> or <label class="link" style="cursor:pointer">choose files<input type="file" id="fileIn" multiple accept=".xlsx,.xls,.csv,.txt,.docx,.json" hidden></label><div style="font-size:12.5px;margin-top:6px">Excel or CSV with one article per row: any layout, headings in English, German or Chinese, title rows above the table are fine. You can check and change which column is which before importing. · Word or text files, one article per file (file name = ID) · a backup .json</div></div>
    <div id="imp"></div>
    <details style="margin-top:14px"><summary class="link" style="cursor:pointer">Paste a single article</summary>
      <div class="form" style="margin-top:10px">
        <div class="row2"><label>Article ID<input id="na-id"></label><label>Dataset<select id="na-ds"><option value="">Detect</option><option value="1">1 = CN</option><option value="2">2 = EN</option></select></label><label>Ebene<select id="na-eb"><option value=""></option><option>1</option><option>2</option><option>3</option><option>4</option><option>Unclear</option></select></label></div>
        <label>URL<input id="na-url"></label><label>Title<input id="na-ti"></label>
        <label>Coders (numbers, e.g. 1,2,5; empty = everyone)<input id="na-co"></label>
        <label>Text<textarea id="na-tx" rows="8"></textarea></label>
        <div><button class="btn pri" data-act="addone">Add article</button></div></div></details>
    <div class="tw" style="margin-top:14px;max-height:280px;overflow:auto"><table><thead><tr><th>ID</th><th>Data</th><th>Ebene</th><th>Coders</th><th class="n">Codings</th><th></th></tr></thead><tbody>
      ${list.map(a => `<tr style="${a.archived ? 'opacity:.55' : ''}"><td class="n" style="text-align:left">${esc(a.id)}${a.archived ? ' <span class="pill na">archived</span>' : ''}</td><td>${a.dataset === '1' ? 'CN' : 'EN'}</td><td>${esc(a.ebene || '')}</td><td><input data-assign="${esc(a.key)}" value="${esc((assigned(a) || []).join(','))}" placeholder="all" style="width:90px;padding:2px 6px"></td><td class="n">${Object.keys(subsOf(a.key)).length}</td><td style="white-space:nowrap"><button class="btn sm" data-act="archive" data-key="${esc(a.key)}" data-v="${a.archived ? '0' : '1'}">${a.archived ? 'Restore' : 'Archive'}</button> <button class="ic" data-act="delart" data-key="${esc(a.key)}" title="Delete article" aria-label="Delete article">✕</button></td></tr>`).join('') || '<tr><td colspan="6" style="color:var(--muted)">No articles yet.</td></tr>'}</tbody></table></div>`, true);
  const drop = $('#drop'), fi = $('#fileIn');
  fi.onchange = () => readFiles([...fi.files]);
  drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = () => drop.classList.remove('over');
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); readFiles([...e.dataTransfer.files]); };
}
const normDs = (v, text) => { const s = String(v || '').trim().toLowerCase(); if (['1','cn','zh','chinese','中文'].includes(s)) return '1'; if (['2','en','english','英文','英语','englisch','en-us','en-gb'].includes(s)) return '2'; return isCJK(text || '') ? '1' : '2'; };
const parseCoders = v => String(v || '').split(/[,;\s]+/).map(x => x.trim()).filter(x => /^\d+$/.test(x));
/* ---------- flexible import: finds the heading row and the right columns in any sheet ---------- */
const IMP_FIELDS = [
  ['id', 'Article ID', true], ['text', 'Article text', true], ['title', 'Title', false], ['url', 'URL', false],
  ['dataset', 'Dataset / language', false], ['coders', 'Assigned coders', false], ['ebene', 'Ebene', false]
];
const SYN = {
  id:['article id','articleid','article no','article number','article nr','id','nr','no','number','unique number','unique id','doc id','document id','编号','序号','文章编号','文章id','artikel id','artikel-id','artikelnummer','laufnummer','lfd nr','lfd. nr'],
  text:['article text','text','full text','fulltext','content','body','article body','article content','main text','正文','内容','全文','文本','新闻内容','volltext','inhalt','artikeltext','haupttext'],
  title:['title','headline','heading','article title','标题','题目','新闻标题','titel','überschrift','schlagzeile'],
  url:['url','link','article url','web address','网址','链接','原文链接','quelle','quell-url'],
  dataset:['dataset','language','lang','corpus','sample','语言','语种','数据集','sprache','datensatz','korpus'],
  coders:['coders','coder','assigned','assigned coders','kodierer','codierer','kodierende'],
  ebene:['ebene','level','layer','层级','层次']
};
const PARTIAL = {text:['text','content','正文','inhalt'], title:['title','headline','标题','titel'], url:['url','link'], id:[' id','id ','编号']};
const normH = h => String(h ?? '').toLowerCase().replace(/\(.*?\)|（.*?）/g, '').replace(/[_\s]+/g, ' ').replace(/[:：]$/, '').trim();
const cellStr = v => { if (v == null) return ''; if (v instanceof Date) return v.toISOString().slice(0, 10); if (typeof v === 'number' && Number.isInteger(v)) return String(v); return String(v).trim(); };
function headerScore(row) { return row.reduce((n, c) => n + (Object.values(SYN).some(l => l.includes(normH(c))) ? 1 : 0), 0); }
function findHeaderRow(aoa) {
  let best = -1, sc = 0;
  for (let i = 0; i < Math.min(40, aoa.length); i++) { const s = headerScore(aoa[i]); if (s > sc) { sc = s; best = i; } }
  if (best >= 0) return best;
  for (let i = 0; i < Math.min(40, aoa.length); i++) if (aoa[i].filter(c => cellStr(c)).length >= 2) return i;
  return 0;
}
function guessMap(aoa, h) {
  const head = (aoa[h] || []).map(normH), data = aoa.slice(h + 1).filter(r => r.some(c => cellStr(c)));
  const map = {}; const used = new Set();
  for (const [f] of IMP_FIELDS) { const i = head.findIndex((x, j) => !used.has(j) && SYN[f].includes(x)); if (i >= 0) { map[f] = i; used.add(i); } }
  for (const f of Object.keys(PARTIAL)) if (map[f] == null) { const i = head.findIndex((x, j) => !used.has(j) && x && PARTIAL[f].some(p => (' ' + x + ' ').includes(p))); if (i >= 0) { map[f] = i; used.add(i); } }
  const cols = Math.max(0, ...aoa.slice(h, h + 50).map(r => r.length));
  const stat = j => { const vs = data.slice(0, 200).map(r => cellStr(r[j])).filter(Boolean); const avg = vs.length ? vs.reduce((n, v) => n + v.length, 0) / vs.length : 0; return {vs, avg, http:vs.filter(v => /^https?:\/\//i.test(v)).length / Math.max(1, vs.length), uniq:new Set(vs).size === vs.length}; };
  if (map.text == null) { let b = -1, ba = 150; for (let j = 0; j < cols; j++) { if (used.has(j)) continue; const s = stat(j); if (s.avg > ba) { ba = s.avg; b = j; } } if (b >= 0) { map.text = b; used.add(b); } }
  if (map.url == null) { for (let j = 0; j < cols; j++) { if (used.has(j)) continue; if (stat(j).http > .6) { map.url = j; used.add(j); break; } } }
  if (map.id == null) { for (let j = 0; j < cols; j++) { if (used.has(j) || isDateHead(head[j] || '')) continue; const s = stat(j); if (s.vs.length && s.uniq && s.avg < 25 && s.http < .1 && !/^\d{5}(\.\d+)?$/.test(s.vs[0])) { map.id = j; used.add(j); break; } } }
  if (map.title == null) { for (let j = 0; j < cols; j++) { if (used.has(j)) continue; const s = stat(j); if (s.avg > 8 && s.avg < 250 && s.http < .1 && s.vs.length > data.length * .5 && !/date|time|datum|日期|时间|author|作者|autor/.test(head[j] || '')) { map.title = j; used.add(j); break; } } }
  return map;
}
const isDateHead = h => /date|published|captured|time|datum|日期|时间|veröffentlicht/i.test(h);
const excelDate = n => { const d = new Date(Date.UTC(1899, 11, 30) + n * 864e5); return d.toISOString().slice(0, 10); };
function sheetArticles(sh) {
  const {aoa, hdr, map} = sh; const head = aoa[hdr] || []; const out = []; const mapped = new Set(Object.values(map).filter(v => v != null && v >= 0));
  aoa.slice(hdr + 1).forEach((r, i) => {
    if (!r.some(c => cellStr(c))) return;
    const g = f => map[f] == null || map[f] < 0 ? '' : cellStr(r[map[f]]);
    const text = g('text'); if (!text) return;
    let id = g('id'); if (!id) id = sh.file.replace(/\.[^.]+$/, '').replace(/\s+/g, '_') + (importState.sheets.filter(x => x.file === sh.file).length > 1 ? '_' + sh.name.replace(/\s+/g, '_') : '') + '-' + (i + 1);
    const meta = {};
    head.forEach((hh, j) => { if (mapped.has(j)) return; const name = cellStr(hh) || 'Column ' + (j + 1); let v = r[j]; if (v == null || v === '') return;
      if (typeof v === 'number' && isDateHead(name) && v > 20000 && v < 80000) v = excelDate(v); else v = cellStr(v);
      if (v) meta[name] = v; });
    out.push({id, text, title:g('title'), url:g('url'), dataset:normDs(g('dataset'), text), coders:parseCoders(g('coders')), ebene:g('ebene'), meta, order:i});
  });
  return out;
}
function importArticles() { return [...importState.sheets.filter(s => s.on).flatMap(sheetArticles), ...importState.direct]; }
let importState = {sheets:[], direct:[], backup:null};
async function readFiles(files) {
  for (const f of files) {
    const ext = f.name.split('.').pop().toLowerCase(), base = f.name.replace(/\.[^.]+$/, '');
    try {
      if (ext === 'json') { const d = JSON.parse(await f.text()); if (d.articles) Object.values(d.articles).forEach(a => importState.direct.push({...a})); if (d.subs && S.mode !== 'shared') importState.backup = d; }
      else if (ext === 'txt' || ext === 'md') { const t = (await f.text()).trim(); importState.direct.push({id:base, text:t, dataset:normDs('', t)}); }
      else if (ext === 'docx') { if (typeof mammoth === 'undefined') throw new Error('the Word reader did not load'); const r = await mammoth.extractRawText({arrayBuffer:await f.arrayBuffer()}); const t = r.value.trim(); importState.direct.push({id:base, text:t, dataset:normDs('', t)}); }
      else {
        const wb = XLSX.read(await f.arrayBuffer(), {type:'array', cellDates:false});
        wb.SheetNames.forEach(n => {
          const aoa = XLSX.utils.sheet_to_json(wb.Sheets[n], {header:1, defval:'', raw:true, blankrows:true});
          if (!aoa.length) return;
          const hdr = findHeaderRow(aoa); const map = guessMap(aoa, hdr);
          importState.sheets.push({file:f.name, name:n, aoa, hdr, map, on:map.text != null});
        });
      }
    } catch (e) { toast('Could not read ' + f.name + ': ' + (e.message || e)); }
  }
  if (!importState.sheets.some(s => s.on) && importState.sheets.length) importState.sheets[0].on = true;
  renderImport();
}
function renderImport() {
  const el = $('#imp'); if (!el) return;
  const list = importArticles();
  if (!importState.sheets.length && !list.length) { el.innerHTML = ''; return; }
  const ids = list.map(a => String(a.id)); const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  const short = list.filter(a => a.text.length < 200);
  const exist = list.filter(a => S.articles[keyOf(a.id)]).length;
  const sheetBox = importState.sheets.map((sh, si) => {
    const head = sh.aoa[sh.hdr] || []; const cols = Math.max(...sh.aoa.slice(sh.hdr, sh.hdr + 50).map(r => r.length));
    const opt = (f, req) => `<select data-impmap="${f}" data-si="${si}" aria-label="${f}"><option value="-1">${f === 'id' ? '— number the rows —' : f === 'dataset' ? '— detect from the text —' : '— not in this sheet —'}</option>${Array.from({length:cols}, (_, j) => `<option value="${j}" ${sh.map[f] === j ? 'selected' : ''}>${esc(cellStr(head[j]) || 'Column ' + (j + 1))}</option>`).join('')}</select>`;
    const n = sh.on ? sheetArticles(sh).length : 0;
    return `<div class="card" style="padding:12px 14px;margin-top:10px">
      <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-impsheet="${si}" ${sh.on ? 'checked' : ''} style="width:auto"> ${esc(sh.file)} · sheet “${esc(sh.name)}” <span class="tag" style="margin-left:auto">${n} article${n === 1 ? '' : 's'}</span></label>
      ${sh.on ? `<div class="small">Headings found in row ${sh.hdr + 1}. <label style="display:inline-flex;gap:6px;align-items:center">Use row <input type="number" min="1" max="${Math.min(40, sh.aoa.length)}" value="${sh.hdr + 1}" data-imphdr="${si}" style="width:64px;padding:2px 6px"> as headings</label></div>
        <div class="row2" style="margin-top:6px">${IMP_FIELDS.map(([f, l, req]) => `<label style="display:grid;gap:3px;font-size:12px;color:var(--muted);font-weight:500">${l}${req ? ' *' : ''}${opt(f, req)}</label>`).join('')}</div>
        <p class="small">All other columns are kept with each article (shown in the article header and in exports).</p>` : ''}</div>`;
  }).join('');
  const prev = list.slice(0, 3).map(a => `<tr><td class="n" style="text-align:left">${esc(a.id)}</td><td>${a.dataset === '1' ? 'CN' : 'EN'}</td><td>${esc((a.title || '').slice(0, 50))}</td><td style="color:var(--muted)">${esc(a.text.slice(0, 70))}…</td></tr>`).join('');
  el.innerHTML = `${sheetBox}
    ${list.length ? `<div class="tw" style="margin-top:10px"><table><thead><tr><th>ID</th><th>Data</th><th>Title</th><th>Text</th></tr></thead><tbody>${prev}</tbody></table></div>` : ''}
    ${dup.length ? `<div class="banner warn" style="margin-top:10px">${dup.length} duplicate ID${dup.length > 1 ? 's' : ''} (${esc([...new Set(dup)].slice(0, 5).join(', '))}). Only the last one of each would be kept: check the ID column.</div>` : ''}
    ${short.length ? `<div class="banner warn" style="margin-top:10px">${short.length} article${short.length > 1 ? 's have' : ' has'} very little text (under 200 characters): ${esc(short.slice(0, 8).map(a => a.id).join(', '))}${short.length > 8 ? '…' : ''}. The scraping may have failed for ${short.length > 1 ? 'them' : 'it'}.</div>` : ''}
    <div class="banner ${list.length ? 'good' : 'warn'}" style="margin-top:10px"><span>${list.length ? `<b>${list.length}</b> article${list.length > 1 ? 's' : ''} ready (${list.filter(a => a.dataset === '1').length} CN · ${list.filter(a => a.dataset === '2').length} EN)${exist ? ` · ${exist} already exist and will be updated, their codings stay` : ''}${importState.backup ? ' · backup codings will be restored in this browser' : ''}.` : 'No article found yet. Choose the column that holds the article text.'}</span>${list.length ? `<button class="btn pri sm" data-act="doimport" style="margin-left:auto">Import ${list.length}</button>` : ''}</div>`;
}

/* ================= events ================= */
document.addEventListener('pointerdown', e => { pointerDown = true; if (!e.target.closest('#pop') && !$('#pop').hidden && S.menu) { if (!e.target.closest('#txt')) hidePop(); } });
document.addEventListener('pointerup', e => { pointerDown = false; if (e.target.closest('#txt')) setTimeout(checkSel, 10); });
document.addEventListener('selectionchange', () => { if (pointerDown) return; clearTimeout(selT); selT = setTimeout(() => { const sel = getSelection(); if (sel && !sel.isCollapsed && $('#txt') && $('#txt').contains(sel.anchorNode) && (!S.menu || S.menu.type !== 'char')) checkSel(); }, 450); });
$('#pop').addEventListener('pointerdown', e => { if (!e.target.closest('input')) e.preventDefault(); });

document.addEventListener('click', async e => {
  const t = e.target.closest('[data-act]');
  const inTxt = e.target.closest('#txt');
  if (inTxt && !t) {
    const sel = getSelection(); if (sel && !sel.isCollapsed) return;
    const hl = e.target.closest('.hl'); if (hl && S.view === 'code') { showAnnPop(hl); return; }
    const fl = e.target.closest('[data-th]'); if (fl && S.view === 'code') { openDrawer('thread', {tid:+fl.dataset.th.split(',')[0]}); return; }
    hidePop(); return;
  }
  if (!t) { if (e.target === $('#modal')) closeModal(); return; }
  const d = t.dataset, act = d.act;
  switch (act) {
    case 'view': S.view = d.v; render(); break;
    case 'work': S.cur = d.key; markSeen(d.key); S.undo = []; S.hidden = {}; S.psEdit = false; S.view = 'code'; render(); $('#reader').scrollTop = 0; if (isPhone()) setPane('text'); break;
    case 'setdue': openDue(); break;
    case 'dosetdue': doSetDue(d.clear === '1'); break;
    case 'open': markSeen(d.key); S.cur = d.key; S.undo = []; S.hidden = {}; S.psEdit = false; S.psWasDone = preDone(draft(d.key)); renderList(); renderReader(); renderPanel(); $('#reader').scrollTop = 0; if (isPhone()) setPane('text'); break;
    case 'next': { const k = nextKey(); if (k) { S.cur = k; S.undo = []; S.hidden = {}; render(); $('#reader').scrollTop = 0; if (isPhone()) setPane('text'); } break; }
    case 'mpane': setPane(d.v); break;
    case 'discuss': openDrawer('list'); break;
    case 'flagsel': flagSelection(); break;
    case 'dnew': S.dsc.tags = null; openDrawer('new', {quote:null}); break;
    case 'dopen': openDrawer('thread', {tid:+d.id}); { const t = S.threads[+d.id]; if (t) goToThread(t); } break;
    case 'dfrom': openThreadFromAnywhere(+d.id); break;
    case 'dback': S.dsc.tags = null; openDrawer('list'); break;
    case 'dclose': closeDrawer(); break;
    case 'dpost': t.disabled = true; await postThread(); break;
    case 'dreply': t.disabled = true; await postReply(); break;
    case 'dstatus': setThreadStatus(d.v); break;
    case 'dtag': { const set = S.dsc.tags || (S.dsc.tags = new Set()); set.has(d.v) ? set.delete(d.v) : set.add(d.v); t.classList.toggle('on'); break; }
    case 'dgo': goToThread(S.threads[+d.id]); if (isPhone()) closeDrawer(); break;
    case 'psedit': S.psEdit = true; renderReader(); setTimeout(() => { const ps = $('#prescreen'); if (ps) ps.scrollIntoView({block:'center', behavior:'smooth'}); }, 30); break;
    case 'psclose': S.psEdit = false; renderReader(); if (isPhone()) setPane('text'); break;
    case 'psgo': { if (isPhone()) setPane('text'); const ps = $('#prescreen'); if (ps) ps.scrollIntoView({block:'center', behavior:'smooth'}); break; }
    case 'feedback': openFeedbackForm(); break;
    case 'fbkind': S.fbKind = d.v; $$('[data-act="fbkind"]').forEach(b => b.classList.toggle('on', b.dataset.v === d.v)); break;
    case 'fbsend': sendFeedback(); break;
    case 'fbstatus': { const {error} = await sb.from('feedback').update({status:d.v}).eq('id', +d.id); if (error) toast('Could not update: ' + error.message); await loadFeedback(); render(); break; }
    case 'progrefresh': S.progressAt = 0; await Promise.all([loadProgress(), loadFeedback(), loadBackups(), loadSubs()]); render(); toast('Updated'); break;
    case 'autoassign': openAutoAssign(); break;
    case 'doautoassign': doAutoAssign(); break;
    case 'archive': setArchived(d.key, d.v === '1'); break;
    case 'backupnow': { t.disabled = true; const {error} = await sb.rpc('take_backup', {full_copy:true}); toast(error ? 'Backup failed: ' + error.message : 'Full copy saved in the database.'); await loadBackups(); renderView(); break; }
    case 'backupdl': { const {data, error} = await sb.from('backups').select('taken_at,kind,data').eq('id', +d.id).single(); if (error) { toast('Could not load it: ' + error.message); break; } saveFile('NPF_backup_' + String(data.taken_at).slice(0, 10) + '_' + data.kind + '.json', JSON.stringify(data.data, null, 1)); break; }
    case 'team': openTeam(); break;
    case 'teamdel': { if (t.dataset.sure) { const {error} = await sb.from('members').delete().eq('email', d.email); if (error) toast('Could not remove: ' + error.message); await loadMembers(); openTeam(); } else { t.dataset.sure = '1'; t.textContent = 'Remove?'; t.className = 'btn sm'; t.style.color = 'var(--bad)'; } break; }
    case 'copylink': copyText(redirectUrl(), 'Link copied.'); break;
    case 'setpw': { const pw = $('#newpw').value; if (pw.length < 8) { toast('Use at least 8 characters.'); break; } const {error} = await sb.auth.updateUser({password:pw}); toast(error ? 'Could not save: ' + error.message : 'Password saved. You can now sign in with it on any device.'); if (!error) closeModal(); break; }
    case 'signout': await sb.auth.signOut(); location.reload(); break;
    case 'reload': location.reload(); break;
    case 'demo': goLocal('Practice mode: nothing is shared.'); break;
    case 'tosignin': location.reload(); break;
    case 'authpw': showSignIn({pw:true, email:($('#email') || {}).value}); break;
    case 'authlink': showSignIn({email:($('#email') || {}).value}); break;
    case 'authback': showSignIn({}); break;
    case 'authresend': sendLink(S.auth.email || LS.get('npf:email', '')); break;
    case 'lf': S.list.f = d.v; renderList(); break;
    case 'hintoff': S.hintOff = true; LS.set('npf:hintOff', true); renderReader(); break;
    case 'plot': S.plot = +d.v; if (S.menu && S.menu.type === 'tag') showTagMenu(S.menu.rect); renderReader(); break;
    case 'lg': S.hidden[d.cat] = !S.hidden[d.cat]; renderReader(); break;
    case 'tag': chooseCat(d.cat); break;
    case 'newch': newChar(); break;
    case 'pickch': addAnn(S.menu.cat, d.id); break;
    case 'back': showTagMenu(S.menu.rect); break;
    case 'delann': { const c = draft(S.cur); pushUndo(); c.anns = c.anns.filter(a => a.id !== d.id); hidePop(); changed(); break; }
    case 'annp': { const c = draft(S.cur); const a = c.anns.find(x => x.id === d.id); if (a) { pushUndo(); a.p = +d.v; changed(); } hidePop(); break; }
    case 'set': { const c = draft(S.cur); const v = +d.v; const au = auto(c, d.k).v; if (au === v) delete c.codes[d.k]; else c.codes[d.k] = v; if (PRE.includes(d.k)) { const wasDone = S.psWasDone; changed(); if (preDone(c) && !screenedOut(c) && !wasDone) toast('Prescreening done. The text passes: now mark it.'); S.psWasDone = preDone(c); break; } changed(true); break; }
    case 'reset': { const c = draft(S.cur); delete c.codes[d.k]; changed(true); break; }
    case 'flash': if (isPhone()) setPane('text'); { const p = d.p ? +d.p : 0; const c = draft(S.cur); flash(ids => ids.some(id => { const a = c.anns.find(x => x.id === id); return a && a.cat === d.cat && (!p || (a.p || 1) === p); })); break; }
    case 'flashch': if (isPhone()) setPane('text'); { const c = draft(S.cur); flash(ids => ids.some(id => { const a = c.anns.find(x => x.id === id); return a && a.c === d.id; })); break; }
    case 'chset': { const c = draft(S.cur); const ch = c.chars.find(x => x.id === d.id); const v = +d.v; if (d.k === 'valid' && chAuto(c, ch, 'valid') === v) delete ch.valid; else ch[d.k] = ch[d.k] === v && d.k !== 'valid' ? null : v; changed(true); break; }
    case 'chadd': { const c = draft(S.cur); pushUndo(); c.chars.push({id:'c' + rid(), name:'', en:''}); changed(true); setTimeout(() => { const i = $$('#panel input[data-chf="en"]').pop(); if (i) i.focus(); }, 30); break; }
    case 'chdel': { const c = draft(S.cur); pushUndo(); c.chars = c.chars.filter(x => x.id !== d.id); c.anns = c.anns.filter(a => a.c !== d.id); changed(); break; }
    case 'chmv': { const c = draft(S.cur); const i = c.chars.findIndex(x => x.id === d.id), j = i + +d.d; if (j < 0 || j >= c.chars.length) break; [c.chars[i], c.chars[j]] = [c.chars[j], c.chars[i]]; changed(); break; }
    case 'draftsum': { const c = draft(S.cur); const s = draftSummary(c); if (c.summary.trim() && c.summary.trim() !== s) { c.summaryPrev = c.summary; } c.summary = s; changed(true); toast('Drafted from your marks. Edit the wording so it follows the text.'); break; }
    case 'goto': if (isPhone()) setPane('sheet'); { const el = document.getElementById(d.k === 'summary' ? 'summary' : 'fld-' + d.k); if (el) { el.scrollIntoView({block:'center'}); if (el.tagName === 'TEXTAREA') el.focus(); } break; }
    case 'submit': submit(); break;
    case 'reopen': reopen(); break;
    case 'gocmp': S.view = 'compare'; S.cmp.key = d.key; S.cmp.sel = null; render(); break;
    case 'gocode': S.view = 'code'; S.cur = d.key; render(); break;
    case 'cmpopen': S.cmp.key = d.key; S.cmp.sel = null; S.cmp.scroll = true; renderView(); break;
    case 'cmpsel': cmpSelect(d.t === 'var' ? {type:'var', k:d.k} : d.t === 'ch' ? {type:'ch', gi:+d.k} : {type:'cat', cat:d.k}, d.t === 'cat'); break;
    case 'cmpstep': cmpStep(+d.d); break;
    case 'cxpane': S.cmp.pane = d.v; renderView(); window.scrollTo(0, 0); break;
    case 'relb': S.rel.basis = d.v; renderView(); break;
    case 'relds': S.rel.ds = d.v; renderView(); break;
    case 'copymethods': copyText($('#methods').textContent, 'Methods paragraph copied.'); break;
    case 'antab': S.an.tab = d.v; renderView(); break;
    case 'def': openDef(d.def); break;
    case 'codebook': openCodebook(); break;
    case 'coder': openAccount(); break;
    case 'pickcoder': pickCoder(d.v, d.then === '1'); break;
    case 'articles': openArticles(); break;
    case 'export': openExport(); break;
    case 'dl': doExport(d.k); break;
    case 'copyexp': doExport(d.k, true); break;
    case 'close': closeModal(); break;
    case 'doimport': doImport(); break;
    case 'addone': addOne(); break;
    case 'delart': delArticle(d.key); break;
    case 'delart2': delArticle(d.key, true); break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.dataset.act === 'final') { saveFinal(t.dataset.key, {values:{[t.dataset.k]:t.value === '' ? '' : +t.value}}).then(() => renderView()); }
  if (t.dataset.act === 'cmppick') { S.cmp.key = t.value; S.cmp.sel = null; S.cmp.scroll = true; renderView(); return; }
  if (t.dataset.act === 'cmponly') { S.cmp.onlyDiff = t.checked; renderView(); return; }
  if (t.dataset.act === 'relnodisc') { S.rel.noDisc = t.checked; relCache.sig = ''; renderView(); return; }
  if (t.dataset.act === 'progopen') { S.prog.onlyOpen = t.checked; renderView(); return; }
  if (t.dataset.act === 'leadview') { S.leadView = t.checked; LS.set('npf:leadView', t.checked); if (t.checked) toast('Lead view on. Code your own articles before you look at them here.', 4000); renderView(); return; }
  if (t.dataset.act === 'anf') { S.an[t.dataset.f] = t.value; renderView(); }
  if (t.dataset.assign) setAssign(t.dataset.assign, t.value);
  if (t.dataset.impmap) { const sh = importState.sheets[+t.dataset.si]; const v = +t.value; for (const k in sh.map) if (sh.map[k] === v && k !== t.dataset.impmap && v >= 0) sh.map[k] = -1; sh.map[t.dataset.impmap] = v; renderImport(); }
  if (t.dataset.impsheet) { importState.sheets[+t.dataset.impsheet].on = t.checked; renderImport(); }
  if (t.dataset.imphdr) { const sh = importState.sheets[+t.dataset.imphdr]; sh.hdr = Math.max(0, (+t.value || 1) - 1); sh.map = guessMap(sh.aoa, sh.hdr); renderImport(); }
  if (t.dataset.team) teamUpdate(t.dataset.email, {[t.dataset.team]:t.value || null});
  if (t.id === 'finsum') saveFinal(t.dataset.key, {summary:t.value});
});
let inT;
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'lq') { S.list.q = t.value; clearTimeout(inT); inT = setTimeout(() => { renderList(); const i = $('#lq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 200); return; }
  if (t.id === 'anq') { S.an.q = t.value; clearTimeout(inT); inT = setTimeout(() => { renderView(); const i = $('#anq'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 300); return; }
  if (!art(S.cur)) return; const c = draft(S.cur);
  if (t.id === 'summary') { c.summary = t.value; queueSave(S.cur); }
  else if (t.id === 'memo') { c.memo = t.value; queueSave(S.cur); }
  else if (t.dataset.chf) { const ch = c.chars.find(x => x.id === t.dataset.id); if (!ch) return; if (t.dataset.chf === 'en') { ch.en = t.value; if (!ch.name) ch.name = t.value; } else ch.action = t.value; queueSave(S.cur); }
  else if (t.dataset.annnote) { const a = c.anns.find(x => x.id === t.dataset.annnote); if (a) { a.note = t.value; queueSave(S.cur); } }
});
function updatePn() {
  const h = $('#panel .pn-h'); if (!h || !art(S.cur)) return; const c = draft(S.cur);
  const p = progress(c), open = openItems(c);
  h.querySelector('.prog i').style.width = p * 100 + '%'; h.querySelector('.tag').textContent = open.length ? open.length + ' open' : 'complete';
}
document.addEventListener('input', e => { if (e.target.closest && e.target.closest('#panel')) updatePn(); });
document.addEventListener('keydown', e => {
  const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  if (e.key === 'Escape') { if (S.menu && S.menu.type === 'char') { showTagMenu(S.menu.rect); e.preventDefault(); return; } if (!$('#modal').hidden) { closeModal(); return; } hidePop(); return; }
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('selrow')) { e.preventDefault(); e.target.click(); return; }
  if (S.view === 'compare' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'j' || e.key === 'k')) { e.preventDefault(); cmpStep(e.key === 'j' ? 1 : -1); return; }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing && S.view === 'code') {
    const u = S.undo.pop(); if (!u) { toast('Nothing to undo'); return; } e.preventDefault();
    const c = draft(u.key); c.anns = u.anns; c.chars = u.chars; S.cur = u.key; changed(); toast('Undone'); return;
  }
  if (typing || e.ctrlKey || e.metaKey || e.altKey || !S.menu) return;
  if ((S.menu.type === 'tag' || S.menu.type === 'flag') && e.key.toLowerCase() === 'f' && S.mode === 'shared' && !isPractice(S.cur)) { e.preventDefault(); flagSelection(); return; }
  if (S.menu.type === 'tag') { const cat = KEYCAT[e.key.toLowerCase()]; if (cat) { e.preventDefault(); chooseCat(cat); } return; }
  if (S.menu.type === 'char') { const c = draft(S.cur);
    if (e.key === 'Enter' && S.menu.cat === 'char') { e.preventDefault(); newChar(); return; }
    const n = parseInt(e.key, 10); if (n >= 1 && n <= c.chars.length) { e.preventDefault(); addAnn(S.menu.cat, c.chars[n - 1].id); } }
});
addEventListener('resize', () => hidePop());
document.addEventListener('scroll', e => { if (e.target === $('#pop')) return; if (S.menu && S.menu.type !== 'ann') hidePop(); }, true);

/* ================= boot ================= */


/* ================= roles ================= */
const APP_VERSION = '2026-11-06b';
const isLead = () => S.mode !== 'shared' || S.isAdmin;
function allArticles() { return Object.values(S.articles).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.id).localeCompare(String(b.id), undefined, {numeric:true})); }
function myQueue() { return corpus().filter(a => (assigned(a) || []).includes(String(S.coder))); }


/* ================= MY WORK (coder inbox) ================= */
const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const daysUntil = iso => Math.round((new Date(iso + 'T12:00:00') - new Date(todayISO() + 'T12:00:00')) / 864e5);
const fmtDay = iso => new Date(iso + 'T12:00:00').toLocaleDateString(undefined, {weekday:'short', day:'numeric', month:'short'});
function duePill(a, done) {
  if (!a.due) return '';
  if (done) return `<span class="pill na">due ${esc(fmtDay(a.due))}</span>`;
  const n = daysUntil(a.due);
  if (n < 0) return `<span class="pill bad">overdue ${-n === 1 ? 'by 1 day' : 'by ' + -n + ' days'}</span>`;
  if (n === 0) return '<span class="pill warn">due today</span>';
  if (n === 1) return '<span class="pill warn">due tomorrow</span>';
  if (n <= 3) return `<span class="pill warn">due in ${n} days</span>`;
  return `<span class="pill na">due ${esc(fmtDay(a.due))}</span>`;
}
const seenKey = () => 'npf:seen:' + S.uid;
const wasSeen = key => (LS.get(seenKey(), {}) || {})[key];
function markSeen(key) { const m = LS.get(seenKey(), {}) || {}; if (!m[key]) { m[key] = now(); LS.set(seenKey(), m); } }
const byDue = (a, b) => (a.due || '9999') < (b.due || '9999') ? -1 : (a.due || '9999') > (b.due || '9999') ? 1 : (a.order ?? 0) - (b.order ?? 0);
function myWork() {
  const q = myQueue();
  const todo = q.filter(a => myStatus(a.key) !== 'done').sort(byDue);
  const done = q.filter(a => myStatus(a.key) === 'done').sort((a, b) => String((mySub(b.key) || {}).submittedAt || '').localeCompare(String((mySub(a.key) || {}).submittedAt || '')));
  return {q, todo, done};
}
function cheer(p, left) {
  if (p >= 1) return 'All done. Thank you for your careful work!';
  if (p === 0) return 'Ready when you are. Start with the first article below.';
  if (p < .5) return 'Good start. Keep going!';
  if (left === 1) return 'Only one article left!';
  return 'More than halfway there!';
}
function ringSVG(p) {
  const r = 46, c = 2 * Math.PI * r;
  return `<svg viewBox="0 0 110 110" class="ring" aria-hidden="true"><circle cx="55" cy="55" r="${r}" class="ring-bg"/><circle cx="55" cy="55" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p)}" transform="rotate(-90 55 55)"/></svg>`;
}
function viewInbox(v) {
  const W = myWork(); const n = W.q.length, d = W.done.length, p = n ? d / n : 0;
  const subs = W.done.map(a => mySub(a.key)).filter(Boolean);
  const marks = subs.reduce((t, s) => t + (screenedOut(s) ? 0 : (s.anns || []).length), 0);
  const outN = subs.filter(screenedOut).length;
  const week = subs.filter(s => s.submittedAt && Date.now() - new Date(s.submittedAt) < 7 * 864e5).length;
  const overdue = W.todo.filter(a => a.due && daysUntil(a.due) < 0).length;
  const nextDue = W.todo.find(a => a.due && daysUntil(a.due) >= 0);
  const card = (a, isDone) => {
    const st = myStatus(a.key), c = draft(a.key, false), s = mySub(a.key);
    const isNew = !isDone && st === 'none' && !wasSeen(a.key);
    const status = isDone ? (screenedOut(s) ? '<span class="pill na">screened out</span>' : `<span class="pill good">coded · ${(s.anns || []).length} mark${(s.anns || []).length === 1 ? '' : 's'}</span>`)
      : isNew ? '<span class="pill new">new</span>' : st === 'draft' ? `<span class="pill warn">in progress · ${(c.anns || []).length} mark${(c.anns || []).length === 1 ? '' : 's'}</span>` : '<span class="pill na">not started</span>';
    const when = isDone ? `submitted ${esc(ago(s.submittedAt))}${s.revisions ? ' · changed ' + s.revisions + '×' : ''}` : st === 'draft' && c.updatedAt ? 'last edited ' + esc(ago(c.updatedAt)) : '';
    return `<article class="wk ${isNew ? 'is-new' : ''} ${isDone ? 'is-done' : ''}">
      <div class="wk-m"><span class="tag">${esc(a.id)}</span><span class="tag">${a.dataset === '1' ? 'CN' : 'EN'}</span>${status}${duePill(a, isDone)}</div>
      <h3 lang="${a.dataset === '1' ? 'zh' : 'en'}">${esc(a.title || String(a.text || '').slice(0, 80))}</h3>
      <div class="wk-f"><span class="small" style="margin:0">${metaLine(a).replace(/^<span>· /, '<span>')}${when ? (metaLine(a) ? ' · ' : '') + when : ''}</span>
        <button class="btn sm ${isDone ? '' : 'pri'}" data-act="work" data-key="${esc(a.key)}">${isDone ? 'Review' : st === 'draft' ? 'Continue' : 'Start'}</button></div>
    </article>`;
  };
  const name = S.coder ? coderIni(S.coder) : '';
  v.innerHTML = `<div class="wide"><div class="wrap" style="max-width:920px">
    <section class="hero-w">
      <div class="ring-wrap">${ringSVG(p)}<div class="ring-t"><b>${d}</b><span>of ${n}</span></div></div>
      <div style="min-width:0">
        <h2>${name ? 'Hello, ' + esc(name) : 'My work'}</h2>
        <p class="cheer">${n ? esc(cheer(p, n - d)) : 'Nothing assigned to you yet.'}</p>
        <p class="small" style="margin:4px 0 0">${n ? `${W.todo.length} to do${overdue ? ` · <b style="color:var(--bad)">${overdue} overdue</b>` : ''}${nextDue ? ` · next due ${esc(fmtDay(nextDue.due))}` : ''}` : 'The project lead assigns articles to you. They will appear here, with their due dates.'}</p>
      </div>
      ${d ? `<div class="wk-stats"><div><b>${marks.toLocaleString()}</b><span>passages marked</span></div><div><b>${week}</b><span>done this week</span></div>${outN ? `<div><b>${outN}</b><span>screened out</span></div>` : ''}</div>` : ''}
    </section>
    ${S.mode === 'shared' && Object.keys(S.threads).length ? (() => { const ts = Object.values(S.threads).filter(t => t.status === 'open' || isUnread(t)).sort((a, b) => (isUnread(b) - isUnread(a)) || (mentionsMe(b) - mentionsMe(a)) || String(b.updated_at).localeCompare(String(a.updated_at))); return ts.length ? `<section><div class="sec-t"><h3>Discussions</h3>${unreadThreads().length ? `<span class="badge">${unreadThreads().length} new</span>` : `<span class="tag">${ts.length} open</span>`}</div><div class="wk-list">${discussionCards(ts.slice(0, 8))}</div></section>` : ''; })() : ''}
    ${p >= 1 && n ? `<div class="banner good" style="font-size:14px"><span><b>✓</b> You have finished every article assigned to you. You can still review and change your codings below.</span></div>` : ''}
    <section><div class="sec-t"><h3>To do</h3><span class="tag">${W.todo.length}</span></div>
      ${W.todo.length ? `<div class="wk-list">${W.todo.map(a => card(a, false)).join('')}</div>` : `<div class="card empty" style="padding:18px">${n ? '<b>Nothing left to do</b>Well done.' : '<b>No articles yet</b>Meanwhile, try the practice texts below.'}</div>`}</section>
    ${W.done.length ? `<section><div class="sec-t"><h3>Done</h3><span class="tag">${W.done.length}</span><span class="small" style="margin:0 0 0 auto">Open one to review it. Choose “Edit again” there to change it.</span></div><div class="wk-list">${W.done.map(a => card(a, true)).join('')}</div></section>` : ''}
    <section><div class="sec-t"><h3>Practice</h3></div><div class="wk-list">${PRACTICE.map(a => `<article class="wk"><div class="wk-m"><span class="tag">${a.dataset === '1' ? 'CN' : 'EN'}</span>${myStatus(a.key) === 'done' ? '<span class="pill good">done</span>' : ''}</div><h3 lang="${a.dataset === '1' ? 'zh' : 'en'}">${esc(a.title)}</h3><div class="wk-f"><span class="small" style="margin:0">Not part of the study. Try the tool here.</span><button class="btn sm" data-act="work" data-key="${a.key}">Open</button></div></article>`).join('')}</div></section>
  </div></div>`;
}
function celebrate() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = document.createElement('canvas'); cv.className = 'confetti'; cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.scale(devicePixelRatio, devicePixelRatio);
  const cols = ['#1e6b63', '#16a34a', '#ca8a04', '#0284c7', '#db2777', '#7c3aed'];
  const ps = Array.from({length:120}, () => ({x:innerWidth / 2 + (Math.random() - .5) * 120, y:innerHeight * .35, vx:(Math.random() - .5) * 9, vy:-Math.random() * 9 - 3, s:4 + Math.random() * 5, c:cols[Math.floor(Math.random() * cols.length)], r:Math.random() * 6}));
  const t0 = performance.now();
  (function tick(t) { const el = t - t0; g.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach(q => { q.vy += .25; q.x += q.vx; q.y += q.vy; q.r += .1; g.save(); g.translate(q.x, q.y); g.rotate(q.r); g.globalAlpha = Math.max(0, 1 - el / 1800); g.fillStyle = q.c; g.fillRect(-q.s / 2, -q.s / 4, q.s, q.s / 2); g.restore(); });
    if (el < 1800) requestAnimationFrame(tick); else cv.remove(); })(t0);
}
function afterSubmitCheer(key) {
  if (isPractice(key)) return;
  const W = myWork(); const n = W.q.length, d = W.done.length;
  if (!n) return;
  if (d >= n) { celebrate(); toast('That was your last article. Everything is done, thank you!', 5000); }
  else if (d === Math.ceil(n / 2)) { toast(`Halfway there: ${d} of ${n} done.`, 4000); }
  else toast(`Done: ${d} of ${n}. ${n - d} to go.`, 3500);
}

/* ---------- due dates (lead) ---------- */
function parseIdList(txt) {
  const want = new Set(), ranges = [];
  String(txt || '').split(/[,;\s]+/).filter(Boolean).forEach(tok => { const m = tok.match(/^(\d+)\s*[-–]\s*(\d+)$/); if (m) ranges.push([+m[1], +m[2]]); else want.add(tok); });
  return allArticles().filter(a => want.has(String(a.id)) || (/^\d+$/.test(String(a.id)) && ranges.some(([x, y]) => +a.id >= Math.min(x, y) && +a.id <= Math.max(x, y))));
}
function openDue() {
  modal(`<div class="mh"><div><h2>Set a due date</h2><p class="sub">Coders see it in <b>My work</b>, with a reminder when it gets close.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="form">
      <label>Articles (IDs or ranges, e.g. <i>32-36, 71-75</i>; empty = all unfinished assigned articles)<input id="due-ids" placeholder="32-36, 71-75"></label>
      <label>Due date<input id="due-date" type="date" min="${todayISO()}" style="width:auto"></label>
      <p class="small" id="due-hint"></p>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="dosetdue">Set due date</button><button class="btn" data-act="dosetdue" data-clear="1">Remove due date</button></div></div>`);
}
async function doSetDue(clear) {
  const txt = $('#due-ids').value.trim(); const date = clear ? null : $('#due-date').value;
  if (!clear && !date) { toast('Choose a date.'); return; }
  const P = progressModel();
  const arts = txt ? parseIdList(txt) : corpus().filter(a => assigned(a) && !P.need(a).every(c => P.st[c] && P.st[c][a.key] && P.st[c][a.key].status === 'submitted'));
  if (!arts.length) { toast('No matching articles.'); return; }
  if (S.mode === 'shared') { const {error} = await sb.from('articles').update({due:date, updated_at:now()}).in('key', arts.map(a => a.key)); if (error) { toast('Could not save: ' + error.message); return; } }
  arts.forEach(a => a.due = date); if (S.mode !== 'shared') persistLocal();
  closeModal(); toast((clear ? 'Due date removed for ' : 'Due ' + fmtDay(date) + ' set for ') + arts.length + ' article' + (arts.length === 1 ? '' : 's') + '.'); renderView();
}


/* ================= DISCUSSIONS: flags and threads per article ================= */
S.threads = {}; S.msgs = {}; S.reads = {}; S.dsc = {open:false, view:'list', tid:null, quote:null, tags:null};
const myTag = () => S.isAdmin && S.mode === 'shared' ? ['lead', String(S.coder)] : [String(S.coder)];
async function loadThreads() {
  if (S.mode !== 'shared') return;
  const [t, m, r] = await Promise.all([fetchAll('threads', '*'), fetchAll('thread_messages', '*'), fetchAll('thread_reads', '*')]);
  S.threads = {}; t.forEach(x => S.threads[x.id] = x);
  S.msgs = {}; m.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at))).forEach(x => (S.msgs[x.thread_id] = S.msgs[x.thread_id] || []).push(x));
  S.reads = {}; r.filter(x => x.user_id === S.uid).forEach(x => S.reads[x.thread_id] = x.read_at);
}
const threadsFor = key => Object.values(S.threads).filter(t => t.article_key === key).sort((a, b) => (a.status === 'open' ? 0 : 1) - (b.status === 'open' ? 0 : 1) || String(b.updated_at).localeCompare(String(a.updated_at)));
const lastMsg = t => { const m = S.msgs[t.id] || []; return m[m.length - 1]; };
function isUnread(t) {
  const ms = (S.msgs[t.id] || []).filter(m => m.user_id !== S.uid); if (!ms.length) return false;
  const r = S.reads[t.id]; return !r || ms[ms.length - 1].created_at > r;
}
function mentionsMe(t) {
  const mine = myTag();
  return (t.mentions || []).some(x => mine.includes(String(x))) || (S.msgs[t.id] || []).some(m => m.user_id !== S.uid && (m.mentions || []).some(x => mine.includes(String(x))));
}
const unreadThreads = () => Object.values(S.threads).filter(isUnread);
function discussedEarly(key) {
  // a discussion started before every coder of this article had submitted for the first time
  const ts = threadsFor(key); if (!ts.length) return false;
  const first = ts.map(t => (S.msgs[t.id] || [])[0]).filter(Boolean).map(m => m.created_at).sort()[0] || ts.map(t => t.created_at).sort()[0];
  const subs = Object.values(subsOf(key));
  const as = assigned(art(key) || {}) || [];
  if (subs.length < Math.max(2, as.length)) return true;
  return subs.some(s => (s.firstSubmittedAt || s.submittedAt || '') > first);
}
function peopleFor(key) {
  const a = art(key); const out = (assigned(a || {}) || []).filter(c => c !== String(S.coder)).map(c => ({tag:c, label:coderIni(c)}));
  if (!S.isAdmin) out.push({tag:'lead', label:'Project lead'});
  return out;
}
const tagLabel = t => t === 'lead' ? 'Project lead' : coderIni(t);
const authorLabel = (uid, coder) => uid === S.uid ? 'You' : coder ? coderIni(coder) : 'Project lead';
function bodyHTML(s) { return esc(s).replace(/(^|\s)@([A-Za-z]{1,4}|lead)\b/g, '$1<b class="at">@$2</b>').replace(/\n/g, '<br>'); }
function ensureDrawer() { let d = $('#drawer'); if (!d) { d = document.createElement('aside'); d.id = 'drawer'; d.className = 'drawer'; d.hidden = true; d.setAttribute('aria-label', 'Discussion'); document.body.appendChild(d); } return d; }
function openDrawer(view, opts = {}) {
  S.dsc = {...S.dsc, open:true, view, ...opts};
  if (view === 'new' && !S.dsc.tags) S.dsc.tags = new Set(peopleFor(S.cur).filter(p => p.tag !== 'lead').map(p => p.tag));
  if (view === 'thread' && S.dsc.tid) markRead(S.dsc.tid);
  renderDrawer();
}
function closeDrawer() { S.dsc.open = false; S.dsc.tags = null; S.dsc.quote = null; const d = $('#drawer'); if (d) d.hidden = true; renderReader(); }
async function markRead(tid) {
  S.reads[tid] = now(); renderTop();
  if (S.mode === 'shared') { try { await sb.from('thread_reads').upsert({user_id:S.uid, thread_id:tid, read_at:now()}); } catch {} }
}
function tagChips() {
  const ppl = peopleFor(S.cur); if (!ppl.length) return '';
  const on = S.dsc.tags || new Set();
  return `<div class="chips" role="group" aria-label="Tag people">${ppl.map(p => `<button type="button" class="chip ${on.has(p.tag) ? 'on' : ''}" data-act="dtag" data-v="${esc(p.tag)}">@${esc(p.label)}</button>`).join('')}</div>`;
}
function renderDrawer() {
  const d = ensureDrawer(); if (!S.dsc.open) { d.hidden = true; return; }
  const a = art(S.cur); if (!a) { d.hidden = true; return; }
  const v = S.dsc.view; d.hidden = false;
  const head = (title, back) => `<div class="dr-h">${back ? `<button class="ic" data-act="dback" aria-label="Back to all discussions">←</button>` : ''}<b>${title}</b><button class="ic" data-act="dclose" aria-label="Close" style="margin-left:auto">✕</button></div>`;
  const note = `<p class="small dr-note">Ask about the text or the codebook. Please don't share your own codes before everyone has submitted, so the codings stay independent.</p>`;
  if (v === 'new') {
    d.innerHTML = head('New question · ' + esc(a.id), true) + `<div class="dr-b">
      ${S.dsc.quote ? `<blockquote class="dq" lang="${a.dataset === '1' ? 'zh' : 'en'}">“${esc(S.dsc.quote.t.slice(0, 300))}”</blockquote>` : '<p class="small">About the whole article. To ask about a passage, select it in the text and choose “Flag for discussion”.</p>'}
      <label class="dl">Your question<textarea id="dmsg" rows="5" placeholder="e.g. Is the provincial government a state-level character here?"></textarea></label>
      <div class="dl">Tag${tagChips() || '<p class="small">No other coders on this article yet.</p>'}</div>
      ${note}<button class="btn pri" data-act="dpost">Post question</button></div>`;
    setTimeout(() => { const t = $('#dmsg'); if (t) t.focus(); }, 30); return;
  }
  if (v === 'thread') {
    const t = S.threads[S.dsc.tid]; if (!t) { S.dsc.view = 'list'; return renderDrawer(); }
    const ms = S.msgs[t.id] || [];
    d.innerHTML = head('Discussion · ' + esc(a.id), true) + `<div class="dr-b">
      <div class="dr-st">${t.status === 'open' ? '<span class="pill warn">open</span>' : '<span class="pill good">resolved</span>'}${(t.mentions || []).length ? `<span class="small" style="margin:0">tagged: ${t.mentions.map(x => '@' + esc(tagLabel(String(x)))).join(' ')}</span>` : ''}</div>
      ${t.quote ? `<button class="dq dq-btn" data-act="dgo" data-id="${t.id}" lang="${a.dataset === '1' ? 'zh' : 'en'}" title="Show in the text">“${esc(t.quote.slice(0, 300))}”</button>` : ''}
      <div class="dr-msgs">${ms.map(m => `<div class="dm ${m.user_id === S.uid ? 'me' : ''}"><div class="dm-h"><b>${esc(authorLabel(m.user_id, m.coder))}</b><span>${esc(fmtDate(m.created_at))}</span></div><div class="dm-b">${bodyHTML(m.body)}</div>${(m.mentions || []).length ? `<div class="small" style="margin:2px 0 0">→ ${m.mentions.map(x => '@' + esc(tagLabel(String(x)))).join(' ')}</div>` : ''}</div>`).join('')}</div>
      <label class="dl">Reply<textarea id="dmsg" rows="3" placeholder="Write a reply"></textarea></label>
      <div class="dl">Tag (optional)${tagChips()}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-act="dreply">Send</button><button class="btn" data-act="dstatus" data-v="${t.status === 'open' ? 'resolved' : 'open'}">${t.status === 'open' ? 'Mark as resolved' : 'Reopen'}</button></div>
      ${note}</div>`;
    const box = d.querySelector('.dr-msgs'); if (box) box.scrollTop = box.scrollHeight;
    return;
  }
  const ts = threadsFor(a.key);
  d.innerHTML = head('Discussion · ' + esc(a.id), false) + `<div class="dr-b">
    <button class="btn pri" data-act="dnew" style="width:100%;justify-content:center">Ask a question about this article</button>
    <p class="small">Or select a passage in the text and choose <b>Flag for discussion</b>${matchMedia('(pointer: coarse)').matches ? '' : ' (key F)'}.</p>
    ${ts.length ? ts.map(t => { const m0 = (S.msgs[t.id] || [])[0], lm = lastMsg(t), n = (S.msgs[t.id] || []).length;
      return `<button class="dt ${isUnread(t) ? 'unread' : ''}" data-act="dopen" data-id="${t.id}">
        <span class="dt-m">${t.status === 'open' ? '<span class="pill warn">open</span>' : '<span class="pill good">resolved</span>'}${isUnread(t) ? '<span class="pill new">new</span>' : ''}<span class="small" style="margin:0 0 0 auto">${esc(ago(t.updated_at))}</span></span>
        ${t.quote ? `<span class="dt-q">“${esc(t.quote.slice(0, 90))}”</span>` : ''}
        <span class="dt-b"><b>${esc(authorLabel(m0 ? m0.user_id : t.created_by, m0 ? m0.coder : t.coder))}:</b> ${esc((m0 ? m0.body : '').slice(0, 120))}</span>
        <span class="small" style="margin:0">${n - 1 > 0 ? (n - 1) + ' repl' + (n - 1 === 1 ? 'y' : 'ies') + ' · last by ' + esc(authorLabel(lm.user_id, lm.coder)) : 'no replies yet'}</span></button>`; }).join('') : '<p class="small">No discussions on this article yet.</p>'}
  </div>`;
}
async function postThread() {
  const body = $('#dmsg').value.trim(); if (!body) { toast('Write your question first.'); return; }
  const tags = [...(S.dsc.tags || [])]; const q = S.dsc.quote;
  if (S.mode !== 'shared') { toast('Discussions work in the shared project.'); return; }
  const {data, error} = await sb.from('threads').insert({article_key:S.cur, s:q ? q.s : null, e:q ? q.e : null, quote:q ? q.t.slice(0, 1000) : '', mentions:tags}).select().single();
  if (error) { toast('Could not post: ' + error.message); return; }
  const r = await sb.from('thread_messages').insert({thread_id:data.id, body, mentions:tags});
  if (r.error) { toast('Could not post: ' + r.error.message); return; }
  await loadThreads(); S.dsc.tags = null; S.dsc.quote = null;
  toast(tags.length ? 'Posted. ' + tags.map(tagLabel).join(', ') + ' will see it in My work.' : 'Posted.');
  openDrawer('thread', {tid:data.id}); renderReader(); renderTop();
}
async function postReply() {
  const body = $('#dmsg').value.trim(); if (!body) { toast('Write a reply first.'); return; }
  const tags = [...(S.dsc.tags || [])];
  const {error} = await sb.from('thread_messages').insert({thread_id:S.dsc.tid, body, mentions:tags});
  if (error) { toast('Could not send: ' + error.message); return; }
  if (tags.length) { const t = S.threads[S.dsc.tid]; const m = [...new Set([...(t.mentions || []), ...tags])]; await sb.from('threads').update({mentions:m}).eq('id', t.id); }
  await loadThreads(); S.dsc.tags = null; openDrawer('thread', {tid:S.dsc.tid});
}
async function setThreadStatus(v) {
  const patch = v === 'resolved' ? {status:v, resolved_by:S.uid, resolved_at:now()} : {status:v, resolved_by:null, resolved_at:null};
  const {error} = await sb.from('threads').update(patch).eq('id', S.dsc.tid);
  if (error) { toast('Could not change it: ' + error.message); return; }
  await loadThreads(); openDrawer('thread', {tid:S.dsc.tid}); renderReader();
}
function flagSelection() {
  if (!S.sel) return; const q = {...S.sel}; hidePop(); getSelection().removeAllRanges(); S.dsc.tags = null;
  openDrawer('new', {quote:q});
}
function showFlagOnlyMenu(rect, why) {
  S.menu = {type:'flag', rect};
  $('#pop').innerHTML = `<div class="pop-sel">“${esc(S.sel.t.slice(0, 120))}”</div><p class="small" style="padding:0 6px">${esc(why)}</p>
    <button class="pop-i" data-act="flagsel"><span class="dot" style="--c:#b45309"></span>Flag for discussion<kbd>F</kbd></button>`;
  placePop(rect);
}
function goToThread(t) {
  if (S.cur !== t.article_key) { S.cur = t.article_key; S.view = 'code'; render(); }
  if (t.s != null) setTimeout(() => { const sp = $$('#txt [data-th]').find(x => x.dataset.th.split(',').includes(String(t.id))); if (sp) { sp.scrollIntoView({block:'center', behavior:'smooth'}); sp.classList.remove('flash'); void sp.offsetWidth; sp.classList.add('flash'); } }, 60);
}
function openThreadFromAnywhere(id) {
  const t = S.threads[id]; if (!t) return;
  markSeen && markSeen(t.article_key);
  S.cur = t.article_key; S.view = 'code'; S.psEdit = false; render();
  if (isPhone()) setPane('text');
  openDrawer('thread', {tid:t.id}); goToThread(t);
}
function discussionCards(list) {
  return list.map(t => { const a = art(t.article_key); if (!a) return ''; const lm = lastMsg(t);
    return `<article class="wk ${isUnread(t) ? 'is-new' : ''}"><div class="wk-m"><span class="tag">${esc(a.id)}</span>${isUnread(t) ? '<span class="pill new">new</span>' : ''}${mentionsMe(t) ? '<span class="pill warn">you are tagged</span>' : ''}${t.status === 'resolved' ? '<span class="pill good">resolved</span>' : ''}</div>
      ${t.quote ? `<h3 lang="${a.dataset === '1' ? 'zh' : 'en'}" style="font-size:14.5px">“${esc(t.quote.slice(0, 110))}”</h3>` : ''}
      <div class="wk-f"><span class="small" style="margin:0">${lm ? '<b>' + esc(authorLabel(lm.user_id, lm.coder)) + ':</b> ' + esc(lm.body.slice(0, 110)) + ' · ' + esc(ago(lm.created_at)) : ''}</span><button class="btn sm pri" data-act="dfrom" data-id="${t.id}">Open</button></div></article>`; }).join('');
}

/* ================= lead data ================= */
async function loadFeedback() { if (S.mode !== 'shared' || !S.isAdmin) return; const {data, error} = await sb.from('feedback').select('*').order('created_at', {ascending:false}).limit(500); if (!error) S.feedback = data; }
async function loadProgress() { if (S.mode !== 'shared' || !S.isAdmin) return; const {data, error} = await sb.rpc('progress_overview'); if (!error) { S.progress = data || []; S.progressAt = Date.now(); } }
async function loadBackups() { if (S.mode !== 'shared' || !S.isAdmin) return; const {data, error} = await sb.from('backups').select('id,kind,bytes,taken_at').order('taken_at', {ascending:false}).limit(60); if (!error) S.backups = data; }
const openFeedback = () => (S.feedback || []).filter(f => f.status === 'open').length;

/* ================= PROGRESS view (lead) ================= */
let progTimer;
function teamCoders() {
  const ms = S.mode === 'shared' ? (S.members || []).filter(m => m.coder) : CODERS.map(c => ({coder:c.code, email:'', user_id:null}));
  return ms.slice().sort((a, b) => String(a.coder).localeCompare(String(b.coder), undefined, {numeric:true}));
}
function progressModel() {
  const coders = teamCoders(); const byUid = {}; coders.forEach(m => { if (m.user_id) byUid[m.user_id] = m.coder; });
  const st = {}; // coder -> key -> {status, marks, at}
  (S.progress || []).forEach(r => { const c = byUid[r.user_id] || (S.profiles[r.user_id] || {}).coder; if (!c) return; (st[c] = st[c] || {})[r.article_key] = {status:r.status, marks:r.marks, at:r.updated_at}; });
  Object.entries(S.subs || {}).forEach(([uid, m]) => { const c = byUid[uid] || (S.profiles[uid] || {}).coder; if (!c) return; for (const k in m) { st[c] = st[c] || {}; if (!st[c][k]) st[c][k] = {status:'submitted', marks:(m[k].anns || []).length, at:m[k].submittedAt}; if (screenedOut(m[k])) st[c][k].out = true; } });
  const arts = corpus();
  const need = a => assigned(a) || [];
  const rows = coders.map(m => {
    const mine = arts.filter(a => need(a).includes(String(m.coder))); const s = st[m.coder] || {};
    const done = mine.filter(a => s[a.key] && s[a.key].status === 'submitted').length;
    const prog = mine.filter(a => s[a.key] && s[a.key].status !== 'submitted').length;
    const last = Object.values(s).map(x => x.at).filter(Boolean).sort().pop();
    const overdue = mine.filter(a => a.due && daysUntil(a.due) < 0 && !(s[a.key] && s[a.key].status === 'submitted')).length;
    return {m, total:mine.length, done, prog, open:mine.length - done - prog, last, overdue};
  });
  const complete = arts.filter(a => need(a).every(c => st[c] && st[c][a.key] && st[c][a.key].status === 'submitted')).length;
  const expected = arts.reduce((n, a) => n + need(a).length, 0), submitted = rows.reduce((n, r) => n + r.done, 0);
  return {coders, st, arts, rows, complete, expected, submitted, need};
}
const ago = s => { if (!s) return 'never'; const d = (Date.now() - new Date(s)) / 60000; if (d < 2) return 'just now'; if (d < 60) return Math.round(d) + ' min ago'; if (d < 1440) return Math.round(d / 60) + ' h ago'; return Math.round(d / 1440) + ' days ago'; };
const kb = b => b == null ? '' : b > 1e6 ? (b / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB';
function viewProgress(v) {
  clearInterval(progTimer);
  if (S.mode === 'shared') { if (!S.progressAt || Date.now() - S.progressAt > 20000) Promise.all([loadProgress(), loadFeedback(), loadBackups()]).then(() => { if (S.view === 'progress') renderView(); }); progTimer = setInterval(() => { if (S.view !== 'progress') return clearInterval(progTimer); loadProgress().then(() => { if (S.view === 'progress' && $('#modal').hidden && !(document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) renderView(); }); }, 60000); }
  const P = progressModel(); const f = S.prog || (S.prog = {onlyOpen:true});
  const sym = s => !s ? '<i class="pcd todo" title="Not started"></i>' : s.status === 'submitted' ? (s.out ? `<i class="pcd done out" title="Submitted as screened out ${esc(fmtDate(s.at))}"></i>` : `<i class="pcd done" title="Submitted ${esc(fmtDate(s.at))}"></i>`) : s.status === 'reopened' ? `<i class="pcd reo" title="Reopened after submitting"></i>` : `<i class="pcd wip" title="In progress · ${s.marks} marks · ${esc(ago(s.at))}"></i>`;
  const artRows = P.arts.filter(a => !f.onlyOpen || !P.need(a).every(c => P.st[c] && P.st[c][a.key] && P.st[c][a.key].status === 'submitted'));
  const fb = S.feedback || [];
  v.innerHTML = `<div class="wide"><div class="wrap">
    <div class="vh"><div><h2>Progress</h2><p>Who has coded what, feedback from the team, and the safety copies of your data. Updates every minute while open.</p></div><div class="tools"><button class="btn sm" data-act="progrefresh">Refresh</button></div></div>
    <div class="stats">
      <div class="stat"><b>${P.submitted}<span style="font-size:15px;color:var(--muted)"> / ${P.expected}</span></b><span>codings submitted</span><div class="abar" style="margin-top:8px"><i style="width:${P.expected ? P.submitted / P.expected * 100 : 0}%;background:var(--accent)"></i></div></div>
      <div class="stat"><b>${P.complete}<span style="font-size:15px;color:var(--muted)"> / ${P.arts.length}</span></b><span>articles coded by all their coders</span></div>
      <div class="stat"><b>${P.rows.reduce((n, r) => n + r.prog, 0)}</b><span>codings in progress</span></div>
      <div class="stat"><b style="color:${openFeedback() ? 'var(--warn)' : 'inherit'}">${openFeedback()}</b><span>open feedback messages</span></div>
    </div>
    <div class="card"><h3>Coders</h3><p class="sub">Counts are for the articles assigned to each coder. ${corpus().filter(a => !assigned(a)).length} article(s) have no coders yet and are hidden from coders.</p>
      <div class="tw"><table><thead><tr><th>Coder</th><th>Email</th><th class="n">Assigned</th><th class="n">Submitted</th><th class="n">In progress</th><th class="n">Not started</th><th class="n">Overdue</th><th style="min-width:140px">Progress</th><th>Last activity</th></tr></thead><tbody>
      ${P.rows.map(r => `<tr><td><b>${esc(coderIni(r.m.coder))}</b> <span class="tag">${esc(r.m.coder)}</span></td><td style="word-break:break-all">${esc(r.m.email || '')}${S.mode === 'shared' && !r.m.user_id ? ' <span class="pill na">not signed in yet</span>' : ''}</td>
        <td class="n">${r.total}</td><td class="n">${r.done}</td><td class="n">${r.prog}</td><td class="n">${r.open}</td><td class="n" style="${r.overdue ? 'color:var(--bad);font-weight:600' : ''}">${r.overdue || ''}</td>
        <td><div class="abar"><i style="width:${r.total ? r.done / r.total * 100 : 0}%;background:var(--good)"></i></div></td><td>${esc(ago(r.last))}</td></tr>`).join('') || '<tr><td colspan="9" style="color:var(--muted)">No coders yet. Add them under Team.</td></tr>'}</tbody></table></div></div>
    <div class="card"><div class="vh" style="align-items:center"><div><h3>Articles</h3><p class="sub keyrow" style="margin:0"><span><i class="pcd done"></i>submitted</span><span><i class="pcd wip"></i>in progress</span><span><i class="pcd done out"></i>screened out</span><span><i class="pcd reo"></i>reopened</span><span><i class="pcd todo"></i>not started</span><span>blank = not assigned</span></p></div>
      <div class="tools"><label style="display:flex;gap:6px;align-items:center;font-size:12.5px;color:var(--muted)"><input type="checkbox" data-act="progopen" ${f.onlyOpen ? 'checked' : ''} style="width:auto"> Only unfinished</label><button class="btn sm" data-act="setdue">Set due date</button><button class="btn sm" data-act="autoassign">Assign coders automatically</button></div></div>
      <div class="tw" style="max-height:460px;overflow:auto;margin-top:10px"><table><thead><tr><th>Article</th><th>Data</th><th>Due</th>${P.coders.map(m => `<th class="n" style="text-align:center">${esc(coderIni(m.coder))}</th>`).join('')}</tr></thead><tbody>
      ${artRows.slice(0, 400).map(a => `<tr><td><button class="link" data-act="gocode" data-key="${esc(a.key)}">${esc(a.id)}</button> <span style="color:var(--muted);font-size:12px">${esc((a.title || '').slice(0, 50))}</span></td><td>${a.dataset === '1' ? 'CN' : 'EN'}</td><td style="white-space:nowrap">${a.due ? duePill(a, P.need(a).length && P.need(a).every(c => P.st[c] && P.st[c][a.key] && P.st[c][a.key].status === 'submitted')) : '<span class="small" style="margin:0">–</span>'}</td>
        ${P.coders.map(m => `<td style="text-align:center">${P.need(a).includes(String(m.coder)) ? sym(P.st[m.coder] && P.st[m.coder][a.key]) : ''}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${P.coders.length + 3}" style="color:var(--muted)">${P.arts.length ? 'Every article is fully coded.' : 'No articles yet.'}</td></tr>`}</tbody></table></div></div>
    ${S.mode === 'shared' ? (() => { const ts = Object.values(S.threads).filter(t => t.status === 'open').sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at))); return `<div class="card"><h3>Open discussions</h3><p class="sub">Questions coders raised while coding. Articles discussed before all their coders submitted are marked in Reliability.</p>${ts.length ? `<div class="wk-list">${discussionCards(ts.slice(0, 20))}</div>` : '<p class="small">No open discussions.</p>'}</div>`; })() : ''}
    <div class="card"><h3>Feedback and bug reports</h3><p class="sub">Sent by coders with the Feedback button. The app adds where they were and which device they used.</p>
      ${S.mode !== 'shared' ? '<p class="small">Feedback works in the shared project.</p>' : fb.length ? fb.map(x => `<div class="psg"><div class="psg-m"><span class="pill ${x.kind === 'bug' ? 'bad' : x.kind === 'idea' ? 'good' : 'na'}">${x.kind}</span><b style="color:var(--ink)">${esc(x.coder ? coderIni(x.coder) : x.email)}</b><span>${esc(fmtDate(x.created_at))}</span>${x.context && x.context.article ? `<span>· article ${esc(x.context.article)}</span>` : ''}${x.context && x.context.view ? `<span>· ${esc(x.context.view)} view</span>` : ''}${x.context && x.context.device ? `<span>· ${esc(x.context.device)}</span>` : ''}
          <button class="btn sm" style="margin-left:auto" data-act="fbstatus" data-id="${x.id}" data-v="${x.status === 'open' ? 'done' : 'open'}">${x.status === 'open' ? 'Mark as done' : 'Reopen'}</button></div>
          <div style="${x.status === 'done' ? 'color:var(--muted);text-decoration:line-through' : ''};white-space:pre-wrap">${esc(x.message)}</div></div>`).join('') : '<p class="small">No feedback yet.</p>'}</div>
    <div class="card"><h3>Safety copies</h3><p class="sub">The database copies everything by itself every night (codings, kept 30 days) and every Sunday (full copy including article texts, last 6 kept). For an extra copy outside Supabase, use Export → Full backup now and then and keep the file with your project files.</p>
      ${S.mode !== 'shared' ? '<p class="small">Available in the shared project.</p>' : `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px"><button class="btn sm pri" data-act="backupnow">Make a full copy now</button><button class="btn sm" data-act="dl" data-k="json">Download a backup file now</button></div>
      <div class="tw"><table><thead><tr><th>Taken</th><th>Type</th><th class="n">Size</th><th></th></tr></thead><tbody>${(S.backups || []).map(b => `<tr><td>${esc(fmtDate(b.taken_at))}</td><td>${b.kind === 'full' ? 'Full (with texts)' : b.kind === 'daily' ? 'Nightly (codings)' : 'Manual'}</td><td class="n">${kb(b.bytes)}</td><td><button class="link" data-act="backupdl" data-id="${b.id}">Download</button></td></tr>`).join('') || '<tr><td colspan="4" style="color:var(--muted)">Loading…</td></tr>'}</tbody></table></div>`}</div>
  </div></div>`;
}
function openAutoAssign() {
  const coders = teamCoders(); const un = corpus().filter(a => !assigned(a)).length;
  modal(`<div class="mh"><div><h2>Assign coders automatically</h2><p class="sub">Spreads the articles evenly, so everyone gets a similar number. Existing assignments stay as they are.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="form">
      <div><b style="font-size:13px">Who codes</b><div class="chips" style="margin-top:6px">${coders.map(m => `<label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" class="aa-c" value="${esc(m.coder)}" checked style="width:auto">${esc(coderIni(m.coder))}</label>`).join('')}</div></div>
      <label>Coders per article<input id="aa-n" type="number" min="1" max="${coders.length}" value="${Math.min(3, coders.length)}" style="width:90px"></label>
      <label>Due date (optional)<input id="aa-due" type="date" min="${todayISO()}" style="width:auto"></label>
      <p class="small">${un} article${un === 1 ? '' : 's'} without coders will be assigned.</p>
      <div><button class="btn pri" data-act="doautoassign" ${un ? '' : 'disabled'}>Assign</button></div></div>`);
}
async function doAutoAssign() {
  const pick = $$('.aa-c').filter(x => x.checked).map(x => x.value); const n = Math.max(1, Math.min(pick.length, +$('#aa-n').value || 3));
  if (pick.length < n) { toast('Choose at least ' + n + ' coders.'); return; }
  const load = {}; pick.forEach(c => load[c] = 0); corpus().forEach(a => (assigned(a) || []).forEach(c => { if (c in load) load[c]++; }));
  const plan = {}; let rot = 0; const co = {}; pick.forEach(x => { co[x] = {}; pick.forEach(y => co[x][y] = 0); });
  corpus().forEach(a => { const as = (assigned(a) || []).filter(c => c in load); as.forEach(x => as.forEach(y => { if (x !== y) co[x][y]++; })); });
  corpus().filter(a => !assigned(a)).forEach(a => {
    const chosen = [];
    for (let i = 0; i < n; i++) {
      const rank = c => load[c] * 1000 + chosen.reduce((t, x) => t + co[c][x], 0) * 10 + ((pick.indexOf(c) - rot + pick.length) % pick.length);
      const c = pick.filter(c => !chosen.includes(c)).sort((x, y) => rank(x) - rank(y))[0]; chosen.push(c);
    }
    chosen.forEach(x => { load[x]++; chosen.forEach(y => { if (x !== y) co[x][y]++; }); });
    plan[a.key] = chosen.sort((x, y) => x.localeCompare(y, undefined, {numeric:true})); rot = (rot + 1) % pick.length;
  });
  const due = ($('#aa-due') || {}).value || null;
  if (S.mode === 'shared') { const {error} = await sb.rpc('set_assignments', {assignments:plan}); if (error) { toast('Could not assign: ' + error.message); return; }
    if (due) { const r = await sb.from('articles').update({due}).in('key', Object.keys(plan)); if (r.error) toast('Assigned, but the due date was not saved: ' + r.error.message); } }
  Object.entries(plan).forEach(([k, c]) => { S.articles[k].coders = c; if (due) S.articles[k].due = due; }); if (S.mode !== 'shared') persistLocal();
  closeModal(); toast('Assigned ' + Object.keys(plan).length + ' articles: ' + pick.map(c => coderIni(c) + ' ' + load[c]).join(', ')); renderView();
}

/* ================= feedback (everyone) ================= */
function openFeedbackForm() {
  S.fbKind = S.fbKind || 'bug';
  modal(`<div class="mh"><div><h2>Send feedback</h2><p class="sub">Goes straight to the project lead. The app adds which article and screen you were on.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="form"><div class="seg" role="group" aria-label="Type">${[['bug','Something is broken'],['question','Question'],['idea','Idea']].map(([k, l]) => `<button data-act="fbkind" data-v="${k}" class="${S.fbKind === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      <label>What happened, or what would help?<textarea id="fbmsg" rows="6" placeholder="${S.fbKind === 'bug' ? 'What did you do, what did you expect, what happened instead?' : 'Write your message'}"></textarea></label>
      <div><button class="btn pri" data-act="fbsend">Send to the project lead</button></div></div>`);
  setTimeout(() => { const t = $('#fbmsg'); if (t) t.focus(); }, 30);
}
async function sendFeedback() {
  const msg = $('#fbmsg').value.trim(); if (!msg) { toast('Please write a short message.'); return; }
  const a = art(S.cur);
  const context = {view:S.view, article:a ? a.id : '', device:(matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop') + ' · ' + innerWidth + '×' + innerHeight, browser:navigator.userAgent.slice(0, 200), app:APP_VERSION, sync:S.sync && S.sync.label};
  if (S.mode !== 'shared') { toast('Feedback works once you are signed in to the shared project.'); return; }
  const {error} = await sb.from('feedback').insert({kind:S.fbKind, message:msg, context});
  if (error) { toast('Could not send: ' + error.message); return; }
  closeModal(); toast('Thank you. Your message is with the project lead.');
}

/* ================= saving (Supabase) ================= */
const bkKey = key => 'npf-annotator:backup:' + S.uid + ':' + key;
const saveT = {}, saveChain = {};
const pendingSave = new Set(); let lastSavedAt = null, signedOutWarned = false;
function queueSave(key) {
  const c = draft(key); c.updatedAt = now();
  if (isPractice(key) || S.mode !== 'shared') { if (S.mode !== 'shared' && !isPractice(key)) S.local.drafts[key] = c; persistLocal(); return; }
  LS.set(bkKey(key), c); pendingSave.add(key);
  setSync('saving'); clearTimeout(saveT[key]);
  saveT[key] = setTimeout(() => flushSave(key), 700);
}
function flushSave(key) {
  clearTimeout(saveT[key]);
  if (S.mode !== 'shared' || !pendingSave.has(key)) return saveChain[key] || Promise.resolve();
  const body = clone(draft(key));
  const send = () => sb.from('drafts').upsert({user_id:S.uid, article_key:key, data:body, updated_at:now()});
  saveChain[key] = (saveChain[key] || Promise.resolve())
    .then(async () => {
      let {error} = await send();
      if (error && /jwt|token|expired|401|not authenticated/i.test((error.message || '') + ' ' + (error.code || ''))) { await sb.auth.refreshSession().catch(() => {}); ({error} = await send()); }
      if (error) throw error;
    })
    .then(() => {
      if ((draft(key, false) || {}).updatedAt === body.updatedAt) pendingSave.delete(key);
      lastSavedAt = new Date(); if (!pendingSave.size) setSync('saved');
    }, async e => {
      const offline = !navigator.onLine;
      if (!offline) { const r = await sb.auth.getSession().catch(() => ({data:{}})); if (!r.data || !r.data.session) { if (!signedOutWarned) { signedOutWarned = true; toast('You were signed out. Your work is safe on this device: sign in again to save it to the server.', 8000); } } }
      setSync(offline ? 'offline' : 'error', e && e.message);
      clearTimeout(saveT[key]); saveT[key] = setTimeout(() => flushSave(key), offline ? 3000 : 5000);
    });
  return saveChain[key];
}
function flushAll() { pendingSave.forEach(k => flushSave(k)); }
addEventListener('online', () => { if (S.mode === 'shared') { toast('Back online. Saving your changes…'); flushAll(); } });
addEventListener('offline', () => { if (S.mode === 'shared') setSync('offline'); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushAll(); });
addEventListener('pagehide', flushAll);
addEventListener('beforeunload', e => { if (S.mode === 'shared' && pendingSave.size) { flushAll(); e.preventDefault(); e.returnValue = ''; } });
async function writeSub(key, sub) {
  if (isPractice(key)) { S.practiceSubs[key] = sub; persistLocal(); return; }
  if (S.mode !== 'shared') { (S.local.subs[S.uid] = S.local.subs[S.uid] || {})[key] = sub; S.subs = S.local.subs; persistLocal(); return; }
  const data = {anns:sub.anns, chars:sub.chars, codes:sub.codes, summary:sub.summary, memo:sub.memo || '', revisedAfterComparison:!!sub.revisedAfterComparison};
  const {error} = await sb.from('submissions').upsert({user_id:S.uid, article_key:key, data});
  if (error) throw error;
  await loadSubs();
}
async function saveFinal(key, patch) {
  const cur = clone(S.finals[key] || {values:{}}); cur.values = cur.values || {};
  if (patch.values) Object.assign(cur.values, patch.values); if (patch.summary !== undefined) cur.summary = patch.summary;
  for (const k in cur.values) if (cur.values[k] === '' || cur.values[k] == null) delete cur.values[k];
  cur.updatedAt = now(); S.finals[key] = cur;
  if (S.mode === 'shared') {
    const {error} = await sb.from('finals').upsert({article_key:key, data:cur, updated_by:S.uid, updated_at:now()});
    if (error) { setSync('error', error.message); toast('Could not save the consensus value.'); } else setSync('saved');
  } else { S.local.finals = S.finals; persistLocal(); }
}
async function saveFile(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data], {type:'application/json'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  return true;
}

/* ---------- articles (lead) ---------- */
function buildArticle(a, i) {
  const key = keyOf(a.id); const prev = S.articles[key] || {};
  return {id:String(a.id), key, dataset:a.dataset || normDs('', a.text), url:a.url || '', title:a.title || '', text:a.text, ebene:a.ebene || '',
    coders:a.coders && a.coders.length ? a.coders.map(String) : (prev.coders || []), order:prev.order ?? a.order ?? (Date.now() + (i || 0)), meta:a.meta || prev.meta || {}, archived:!!prev.archived};
}
const artRow = a => ({key:a.key, id:a.id, dataset:a.dataset, url:a.url, title:a.title, body:a.text, ebene:a.ebene, coders:a.coders, sort:a.order, meta:a.meta || {}, updated_at:now()});
async function putArticles(list) {
  const byKey = new Map(); list.forEach((a, i) => { const d = buildArticle(a, i); byKey.set(d.key, d); });
  const docs = [...byKey.values()];
  if (S.mode === 'shared') {
    for (let i = 0; i < docs.length; i += 100) { const {error} = await sb.from('articles').upsert(docs.slice(i, i + 100).map(artRow)); if (error) throw error; }
  } else { docs.forEach(d => S.local.articles[d.key] = d); persistLocal(); }
  docs.forEach(d => S.articles[d.key] = d);
  return docs.length;
}
async function doImport() {
  const bk = importState.backup; let n = 0;
  setSync('saving');
  try { n = await putArticles(importArticles()); }
  catch (e) { setSync('error', e && e.message); toast('Import stopped: ' + (e.message || 'write refused')); return; }
  if (bk && S.mode !== 'shared') { Object.assign(S.local.subs, bk.subs || {}); Object.assign(S.local.profiles, bk.profiles || {}); Object.assign(S.local.finals, bk.finals || {}); S.subs = S.local.subs; S.profiles = S.local.profiles; S.finals = S.local.finals; persistLocal(); }
  setSync('saved'); toast('Imported ' + n + ' article' + (n === 1 ? '' : 's') + '.'); closeModal(); render();
}
async function addOne() {
  const id = $('#na-id').value.trim(), text = $('#na-tx').value.trim();
  if (!id || !text) { toast('Article ID and text are required.'); return; }
  try { await putArticles([{id, text, dataset:$('#na-ds').value || normDs('', text), url:$('#na-url').value.trim(), title:$('#na-ti').value.trim(), ebene:$('#na-eb').value, coders:parseCoders($('#na-co').value)}]); toast('Added ' + id + '.'); openArticles(); renderList(); }
  catch (e) { toast('Could not add the article: ' + (e.message || 'write refused')); }
}
async function delArticle(key, confirmed) {
  if (!confirmed) { const b = $(`[data-act="delart"][data-key="${CSS.escape(key)}"]`); if (b) b.outerHTML = `<button class="btn sm" data-act="delart2" data-key="${esc(key)}" style="color:var(--bad)">Delete?</button>`; return; }
  if (S.mode === 'shared') { const {error} = await sb.from('articles').delete().eq('key', key); if (error) { toast(error.code === '23503' ? 'This article already has codings or drafts, so it is protected. Use Archive to hide it instead.' : 'Could not delete it: ' + error.message, 6000); openArticles(); return; } }
  else { delete S.local.articles[key]; persistLocal(); }
  delete S.articles[key]; if (S.cur === key) S.cur = 'practice-en';
  openArticles(); render();
}
async function setArchived(key, on) {
  const a = S.articles[key]; if (!a) return;
  if (S.mode === 'shared') { const {error} = await sb.from('articles').update({archived:on, updated_at:now()}).eq('key', key); if (error) { toast('Could not change it: ' + error.message); return; } }
  a.archived = on; if (S.mode !== 'shared') persistLocal();
  if (on && S.cur === key) S.cur = 'practice-en';
  toast(on ? 'Archived. Hidden from coders; codings are kept.' : 'Restored.'); openArticles(); renderList(); renderTop();
}
async function setAssign(key, v) {
  const a = S.articles[key]; if (!a) return; a.coders = parseCoders(v);
  if (S.mode === 'shared') { const {error} = await sb.from('articles').update({coders:a.coders, updated_at:now()}).eq('key', key); if (error) toast('Could not save the assignment.'); }
  else persistLocal();
  renderList();
}

/* ================= backend: loading + live updates ================= */
let sb = null;
const CFG = window.NPF_CONFIG || {};
async function fetchAll(table, cols, order) {
  const out = []; const step = 1000;
  for (let from = 0; ; from += step) {
    let q = sb.from(table).select(cols); if (order) q = q.order(order, {ascending:true});
    const {data, error} = await q.range(from, from + step - 1); if (error) throw error;
    out.push(...data); if (data.length < step) break;
  }
  return out;
}
const artFromRow = r => ({key:r.key, id:r.id, dataset:r.dataset, url:r.url || '', title:r.title || '', text:r.body || '', ebene:r.ebene || '', coders:r.coders || [], order:r.sort, archived:!!r.archived, meta:r.meta || {}, due:r.due || ''});
const subFromRow = r => ({...(r.data || {}), aid:r.article_key, coder:r.coder, status:'submitted', submittedAt:r.submitted_at, firstSubmittedAt:r.first_submitted_at, revisions:r.revisions || 0, first:r.first_data || null});
async function loadArticles() { const rows = await fetchAll('articles', 'key,id,dataset,url,title,body,ebene,coders,sort,archived,meta,due', 'sort'); const m = {}; rows.forEach(r => m[r.key] = artFromRow(r)); S.articles = m; if (S.cur && !art(S.cur)) S.cur = 'practice-en'; }
async function loadMembers() {
  const {data, error} = await sb.from('members').select('*'); if (error) throw error;
  S.members = data;
  data.forEach(m => { if (m.user_id) S.profiles[m.user_id] = {coder:m.coder, email:m.email, role:m.role}; });
  const me = data.find(m => m.user_id === S.uid); if (me) { S.coder = me.coder || ''; S.isAdmin = me.role === 'lead'; }
}
async function loadSubs() {
  const rows = await fetchAll('submissions', 'user_id,article_key,coder,data,first_data,submitted_at,first_submitted_at,revisions');
  const m = {}; rows.forEach(r => { (m[r.user_id] = m[r.user_id] || {})[r.article_key] = subFromRow(r); if (!S.profiles[r.user_id]) S.profiles[r.user_id] = {coder:r.coder}; });
  S.subs = m; relCache.sig = '';
}
async function loadFinals() { const rows = await fetchAll('finals', 'article_key,data'); S.finals = {}; rows.forEach(r => S.finals[r.article_key] = r.data || {}); relCache.sig = ''; }
async function loadDrafts() {
  const rows = await fetchAll('drafts', 'article_key,data,updated_at');
  const resend = [];
  rows.forEach(r => { const local = LS.get(bkKey(r.article_key), null); const newer = local && (local.updatedAt || '') > ((r.data || {}).updatedAt || ''); S.drafts[r.article_key] = newer ? local : r.data; if (newer) resend.push(r.article_key); });
  setTimeout(() => resend.forEach(k => { if (S.drafts[k]) { pendingSave.add(k); LS.set(bkKey(k), S.drafts[k]); flushSave(k); } }), 0);
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); const pre = 'npf-annotator:backup:' + S.uid + ':'; if (k && k.startsWith(pre)) { const key = k.slice(pre.length); if (!S.drafts[key] && S.articles[key]) { S.drafts[key] = LS.get(k, null); queueSave(key); } } } } catch {}
}
function soft() {
  const ae = document.activeElement;
  if (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName) && $('#view').contains(ae)) { renderTop(); if (S.view === 'code') renderList(); return; }
  if (S.menu && S.view === 'code') { renderTop(); renderList(); return; }
  if (!$('#modal').hidden) { renderTop(); return; }
  render();
}
let lastSync = Date.now();
async function threadsChanged() { await loadThreads(); const ae = document.activeElement; if (S.dsc.open && !(ae && $('#drawer') && $('#drawer').contains(ae) && ae.tagName === 'TEXTAREA')) renderDrawer(); }
function subscribeRealtime() {
  const t = {}; const later = (n, fn) => { clearTimeout(t[n]); t[n] = setTimeout(async () => { try { await fn(); lastSync = Date.now(); soft(); } catch {} }, 600); };
  sb.channel('npf-live')
    .on('postgres_changes', {event:'*', schema:'public', table:'articles'}, p => { if (p.eventType === 'DELETE') delete S.articles[p.old.key]; else S.articles[p.new.key] = artFromRow(p.new); later('a', async () => {}); })
    .on('postgres_changes', {event:'*', schema:'public', table:'submissions'}, () => later('s', loadSubs))
    .on('postgres_changes', {event:'*', schema:'public', table:'finals'}, () => later('f', loadFinals))
    .on('postgres_changes', {event:'*', schema:'public', table:'members'}, () => later('m', loadMembers))
    .on('postgres_changes', {event:'*', schema:'public', table:'feedback'}, () => later('fb', loadFeedback))
    .on('postgres_changes', {event:'*', schema:'public', table:'threads'}, () => later('th', threadsChanged))
    .on('postgres_changes', {event:'INSERT', schema:'public', table:'thread_messages'}, pl => {
      const m = pl.new || {}; if (m.user_id !== S.uid && (m.mentions || []).some(x => myTag().includes(String(x)))) toast((m.coder ? coderIni(m.coder) : 'The project lead') + ' tagged you in a discussion. See My work.', 6000);
      later('th', threadsChanged); })
    .subscribe();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && S.mode === 'shared' && Date.now() - lastSync > 60000) later('all', async () => { await Promise.all([loadMembers(), loadSubs(), loadFinals()]); });
  });
}

/* ================= sign-in ================= */
const redirectUrl = () => location.origin + location.pathname;
function authShell(inner) {
  $('#top').innerHTML = `<div class="brand"><span class="mark" aria-hidden="true">叙</span>NPF Annotator</div>`;
  $('#view').innerHTML = `<div class="auth"><div class="auth-card"><span class="mark big" aria-hidden="true">叙</span><h1>NPF Annotator</h1><p class="sub">${esc(CFG.projectName || 'Narrative coding')}</p>${inner}</div></div>`;
}
function showSignIn(st = {}) {
  S.mode = 'signin'; S.auth = st;
  const email = st.email || LS.get('npf:email', '');
  let inner;
  if (st.sent) inner = `<p>We sent a sign-in email to <b>${esc(email)}</b>.</p><p class="small">Tap the link in it on this device, or type the code from the email here:</p>
      <form id="otpForm" class="form"><input id="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="10" placeholder="Code from the email" aria-label="Code from the email"><button class="btn pri big">Sign in</button></form>
      <p class="small"><button type="button" class="link" data-act="authback">Use a different email</button> · <button type="button" class="link" data-act="authresend">Send again</button></p>`;
  else if (st.pw) inner = `<form id="pwForm" class="form"><label>Email<input id="email" type="email" autocomplete="email" required value="${esc(email)}"></label><label>Password<input id="pw" type="password" autocomplete="current-password" required></label><button class="btn pri big">Sign in</button></form>
      <p class="small"><button type="button" class="link" data-act="authlink">Email me a sign-in link instead</button></p>`;
  else inner = `<form id="linkForm" class="form"><label>Your email<input id="email" type="email" autocomplete="email" inputmode="email" required value="${esc(email)}" placeholder="name@uni-trier.de"></label><button class="btn pri big">Email me a sign-in link</button></form>
      <p class="small">No password needed. You stay signed in on this device.</p><p class="small"><button type="button" class="link" data-act="authpw">Sign in with a password</button></p>`;
  authShell(`${inner}${st.err ? `<p class="err">${esc(st.err)}</p>` : ''}${st.busy ? '<p class="small">One moment…</p>' : ''}<hr><p class="small"><button type="button" class="link" data-act="demo">Try the practice texts without signing in</button></p>`);
  setTimeout(() => { const i = $('#otp') || $('#pw') || $('#email'); if (i && !st.busy) i.focus(); }, 30);
}
function friendlyAuthError(e) {
  const m = (e && e.message) || String(e);
  if (/rate|too many|security purposes/i.test(m)) return 'Too many sign-in emails in a short time. Wait a minute and try again, or sign in with a password.';
  if (/invalid login/i.test(m)) return 'Email or password is not right. You can also ask for a sign-in link.';
  if (/expired|invalid.*token|otp/i.test(m)) return 'That code is not valid any more. Ask for a new email.';
  return m;
}
async function sendLink(email) {
  LS.set('npf:email', email); showSignIn({email, busy:true});
  const {error} = await sb.auth.signInWithOtp({email, options:{emailRedirectTo:redirectUrl(), shouldCreateUser:true}});
  if (error) showSignIn({email, err:friendlyAuthError(error)}); else showSignIn({email, sent:true});
}
function showNotMember() {
  S.mode = 'signin';
  authShell(`<p>You are signed in as <b>${esc(S.email)}</b>, but this email is not on the coding team yet.</p><p class="small">Ask the project lead to add exactly this address under <b>Team</b>. Then reload this page.</p>
    <div class="form"><button class="btn pri big" data-act="reload">Reload</button><button class="btn big" data-act="signout">Sign out</button></div>`);
}
let entering = false;
async function enter(session) {
  if (entering || S.mode === 'shared') return; entering = true;
  S.uid = session.user.id; S.email = session.user.email;
  authShell('<p>Opening your project…</p>');
  const {data:m, error} = await sb.rpc('claim_membership');
  if (error) { entering = false; showSignIn({err:'Could not reach the project: ' + error.message}); return; }
  if (!m || !m.email) { entering = false; showNotMember(); return; }
  S.mode = 'shared'; S.coder = m.coder || ''; S.isAdmin = m.role === 'lead';
  S.articles = {}; S.subs = {}; S.finals = {}; S.drafts = {}; S.profiles = {}; S.members = [];
  S.sync = {s:'idle', label:'Loading…', msg:''}; render();
  try { await loadMembers(); await loadArticles(); await Promise.all([loadSubs(), loadFinals(), loadDrafts()]); S.sync = {s:'saved', label:'Connected', msg:'Signed in as ' + S.email}; lastSync = Date.now(); }
  catch (e) { S.sync = {s:'error', label:'Could not load everything', msg:e.message}; }
  if (!S.isAdmin) { const W = myWork(); const first = W.todo[0] || W.done[0]; if (first) S.cur = first.key; }
  else if (corpus().length && isPractice(S.cur) && LS.get('npf:practiced', false)) S.cur = (nextKey() || S.cur);
  try { const r = await sb.from('app_config').select('value').eq('key', 'codebook').maybeSingle(); if (r.data && r.data.value) CB = {defs:SHOW_CODEBOOK ? (r.data.value.defs || []) : [], headers:r.data.value.headers || [], legend:r.data.value.legend || []}; } catch {}
  document.documentElement.classList.toggle('nocb', !(SHOW_CODEBOOK && CB.defs.length));
  try { await loadThreads(); } catch {}
  if (S.isAdmin) { try { await loadFeedback(); } catch {} S.view = 'progress'; } else S.view = 'inbox';
  subscribeRealtime(); entering = false; render();
  if (!S.coder) toast(S.isAdmin ? 'Give yourself a coder number under Team.' : 'You have no coder number yet. The project lead sets it under Team.', 5000);
}

/* ================= account + team ================= */
function openAccount() {
  if (S.mode !== 'shared') return openCoder();
  modal(`<div class="mh"><div><h2>${esc(S.email)}</h2><p class="sub">${S.coder ? 'Coder ' + esc(S.coder) + ' · ' + esc(coderIni(S.coder)) : 'No coder number yet'} · ${S.isAdmin ? 'project lead' : 'coder'}</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="form">
      <label>Password for signing in on other devices (optional)<input id="newpw" type="password" autocomplete="new-password" minlength="8" placeholder="At least 8 characters"></label>
      <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="setpw">Save password</button>${S.isAdmin ? '<button class="btn" data-act="team">Manage team</button>' : ''}<button class="btn" data-act="signout" style="margin-left:auto">Sign out</button></div>
    </div>`);
}
const coderOpts = cur => `<option value="">–</option>` + ['1','2','3','4','5','6','7','8','9'].map(c => `<option value="${c}" ${String(cur) === c ? 'selected' : ''}>${c}${CODERS.find(x => x.code === c) ? ' · ' + CODERS.find(x => x.code === c).ini : ''}</option>`).join('');
function openTeam() {
  const ms = (S.members || []).slice().sort((a, b) => String(a.coder || 'z').localeCompare(String(b.coder || 'z')) || a.email.localeCompare(b.email));
  const used = {}; ms.forEach(m => { if (m.coder) used[m.coder] = (used[m.coder] || 0) + 1; });
  modal(`<div class="mh"><div><h2>Team</h2><p class="sub">Only people listed here can open the project. They sign in with exactly this email. The coder number goes into every export.</p></div><button class="x" data-act="close" aria-label="Close">×</button></div>
    <div class="tw"><table><thead><tr><th>Email</th><th>Coder</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>
    ${ms.map(m => `<tr><td style="word-break:break-all">${esc(m.email)}</td><td><select data-team="coder" data-email="${esc(m.email)}" aria-label="Coder number" style="width:auto">${coderOpts(m.coder)}</select>${m.coder && used[m.coder] > 1 ? '<div class="small" style="color:var(--bad)">used twice</div>' : ''}</td>
      <td><select data-team="role" data-email="${esc(m.email)}" aria-label="Role" style="width:auto" ${m.email === S.email ? 'disabled' : ''}><option value="coder" ${m.role === 'coder' ? 'selected' : ''}>Coder</option><option value="lead" ${m.role === 'lead' ? 'selected' : ''}>Lead</option></select></td>
      <td>${m.user_id ? '<span class="pill good">joined</span>' : '<span class="pill na">invited</span>'}</td>
      <td>${m.email === S.email ? '' : `<button class="ic" data-act="teamdel" data-email="${esc(m.email)}" title="Remove from team" aria-label="Remove from team">✕</button>`}</td></tr>`).join('')}</tbody></table></div>
    <form id="teamForm" class="row2" style="margin-top:14px;align-items:end">
      <label style="display:grid;gap:4px;font-size:12.5px;color:var(--muted);font-weight:500">Email<input id="tm-email" type="email" required placeholder="colleague@uni-trier.de"></label>
      <label style="display:grid;gap:4px;font-size:12.5px;color:var(--muted);font-weight:500">Coder number<select id="tm-coder">${coderOpts('')}</select></label>
      <label style="display:grid;gap:4px;font-size:12.5px;color:var(--muted);font-weight:500">Role<select id="tm-role"><option value="coder">Coder</option><option value="lead">Lead</option></select></label>
      <button class="btn pri">Add to team</button></form>
    <p class="small" style="margin-top:12px">After adding someone, send them the link to this page: <b>${esc(redirectUrl())}</b> <button class="link" data-act="copylink">Copy link</button></p>`, true);
}
async function teamUpdate(email, patch) {
  const {error} = await sb.from('members').update(patch).eq('email', email);
  if (error) { toast('Could not save: ' + error.message); return; }
  await loadMembers(); openTeam(); renderTop();
}

/* ================= boot ================= */
function goLocal(reason) {
  S.mode = 'local'; S.uid = 'local'; S.isAdmin = true;
  S.articles = S.local.articles; S.subs = S.local.subs; S.finals = S.local.finals; S.profiles = S.local.profiles; S.drafts = S.local.drafts; S.coder = S.local.coder || '';
  S.sync = {s:'idle', label:'Practice mode · this device only', msg:reason || ''};
  render();
}
async function boot() {
  loadLocal();
  if (!CFG.supabaseUrl || !CFG.supabaseAnonKey || !window.supabase) return goLocal('No backend configured yet: work stays in this browser.');
  sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, {auth:{persistSession:true, autoRefreshToken:true, detectSessionInUrl:true, flowType:'implicit'}});
  sb.auth.onAuthStateChange((ev, session) => { if (session && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION')) setTimeout(() => enter(session), 0); if (ev === 'SIGNED_OUT') location.reload(); });
  authShell('<p>Opening…</p>');
  const {data:{session}} = await sb.auth.getSession();
  if (session) enter(session); else if (S.mode !== 'shared') showSignIn();
}
function nextKey() {
  const items = (myQueue().length || !isLead() ? myQueue() : corpus()).slice().sort(byDue);
  const i = items.findIndex(a => a.key === S.cur);
  const after = items.slice(i + 1).concat(items.slice(0, Math.max(0, i))).find(a => myStatus(a.key) !== 'done');
  return after ? after.key : null;
}
const isPhone = () => matchMedia('(max-width: 860px)').matches;
function renderMtabs() {
  const el = $('#mtabs'); if (!el) return; const a = art(S.cur); const open = a ? openItems(draft(a.key)).length : 0;
  el.innerHTML = [['list','Articles'],['text','Text'],['sheet','Coding' + (a ? ` <span class="tag">${open || '✓'}</span>` : '')]].map(([k, l]) => `<button data-act="mpane" data-v="${k}" class="${S.mpane === k ? 'on' : ''}">${l}</button>`).join('');
}
function setPane(p) { S.mpane = p; const c = $('.code'); if (c) c.dataset.m = p; renderMtabs(); if (isPhone()) window.scrollTo(0, 0); }

document.addEventListener('submit', async e => {
  const f = e.target; if (!f.id) return; e.preventDefault();
  if (f.id === 'linkForm') return sendLink($('#email').value.trim().toLowerCase());
  if (f.id === 'otpForm') { const email = S.auth.email || LS.get('npf:email', ''); showSignIn({email, sent:true, busy:true}); const {error} = await sb.auth.verifyOtp({email, token:$('#otp') ? $('#otp').value.trim() : '', type:'email'}); if (error) showSignIn({email, sent:true, err:friendlyAuthError(error)}); return; }
  if (f.id === 'pwForm') { const email = $('#email').value.trim().toLowerCase(), pw = $('#pw').value; LS.set('npf:email', email); showSignIn({email, pw:true, busy:true}); const {error} = await sb.auth.signInWithPassword({email, password:pw}); if (error) showSignIn({email, pw:true, err:friendlyAuthError(error)}); return; }
  if (f.id === 'teamForm') {
    const email = $('#tm-email').value.trim().toLowerCase(); if (!email) return;
    const {error} = await sb.from('members').insert({email, coder:$('#tm-coder').value || null, role:$('#tm-role').value});
    if (error) { toast(/duplicate/i.test(error.message) ? 'This email is already on the team.' : 'Could not add: ' + error.message); return; }
    await loadMembers(); openTeam(); toast('Added ' + email + '. Send them the link to this page.');
  }
});

boot();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
