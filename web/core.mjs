export const SCHEMA = 1;
export const money = n => new Intl.NumberFormat('en-BD', {maximumFractionDigits: 2}).format(n || 0);
export const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const digits = s => String(s ?? '').replace(/[০-৯]/g, c => String('০১২৩৪৫৬৭৮৯'.indexOf(c)));
export const normalize = s => digits(s).toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, ' ').trim().replace(/\s+/g, ' ');
export function phoneKey(value) {
  const n = digits(value).replace(/\D/g, '');
  return n.startsWith('880') && n.length === 13 ? '0' + n.slice(3) : n;
}
export const validPhone = value => /^01[3-9]\d{8}$/.test(phoneKey(value));
export const today = () => {const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB', {timeZone:'Asia/Dhaka',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;};
export const monthKey = date => date.slice(0, 7);
export function totals(items) {
  let revenue=0, cost=0, pieces=0, grams=0, balls=0, accessories=0, unknownCost=false;
  for (const i of items) {
    revenue += Number(i.quantity) * Number(i.sellPrice);
    if (i.buyPrice === null || i.buyPrice === '' || i.buyPrice === undefined) unknownCost=true;
    else cost += Number(i.quantity) * Number(i.buyPrice);
    pieces += Number(i.quantity);
    if(i.unit==='piece') accessories+=Number(i.quantity); else balls+=Number(i.quantity);
    grams += Number(i.quantity) * Number(i.weight || 0);
  }
  return {revenue:round(revenue),cost:round(cost),profit:unknownCost?null:round(revenue-cost),pieces:round(pieces),balls:round(balls),accessories:round(accessories),grams:round(grams),unknownCost};
}
export function matchProduct(description, products) {
  const needle=normalize(description);
  const ranked=products.filter(p=>!p.archived).map(p=>{
    let score=0;
    for (const alias of [p.name,...(p.aliases||[])]) {
      const n=normalize(alias); if(!n) continue;
      const a=n.split(' '), b=needle.split(' ');
      const common=a.filter(t=>b.includes(t)).length;
      const value=needle===n?1:needle.includes(n)?0.94:2*common/(a.length+b.length);
      score=Math.max(score,value);
    }
    return {product:p,score};
  }).sort((a,b)=>b.score-a.score);
  const best=ranked[0];
  if (!best || best.score < .56) return {product:null,confidence:0,ambiguous:false};
  const ambiguous=!!ranked[1] && best.score-ranked[1].score < .075;
  return {product:best.product,confidence:best.score,ambiguous};
}
function isMoneyLine(s) { return /(?:tk|taka|টাকা|৳)\b|(?:tk|টাকা|৳)$/.test(s); }
function measures(text) {
  const s=digits(text).toLowerCase();
  const mul=s.match(/(\d+(?:\.\d+)?)\s*[*×x]\s*(\d+(?:\.\d+)?)/);
  const q=s.match(/(\d+(?:\.\d+)?)\s*(?:balls?|pis|pcs?|pieces?|পিস|বল)(?!\p{L})/u);
  const w=s.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|কেজি|gm|gms|grams?|গ্রাম|g)(?!\p{L})/u);
  const price=s.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*(?:tk|taka|টাকা|৳)(?:\s|$)/);
  const reversed=!!mul && !!q && +q[1]===+mul[2] && +q[1]!==+mul[1];
  return {quantity:mul?(reversed?+mul[2]:+mul[1]):q?+q[1]:null, price:mul?(reversed?+mul[1]:+mul[2]):price?+price[1]:null, grams:w?+w[1]*(/kg|কেজি/.test(w[2])?1000:1):null,
    multiply:!!mul, explicitQuantity:!!q,reversed,quantityConflict:!!mul&&!!q&&+q[1]!==+mul[1]&&+q[1]!==+mul[2]};
}
export function applyProduct(item, product) {
  const m=measures(item.source||'');
  const quantity=m.quantity===null&&m.grams!==null&&product.weight>0?round(m.grams/product.weight):item.quantity;
  return {...item,productId:product.id,name:product.name,buyPrice:product.buyPrice,weight:product.weight,unit:product.unit,
    sellPrice:m.price===null?product.sellPrice:item.sellPrice,quantity,confirmed:false,
    flags:(item.flags||[]).filter(f=>f!=='Choose a saved product.')};
}
function cleanDescription(s) {
  return s.replace(/\b(?:total|price|order summary)\b/gi,' ')
    .replace(/\d+(?:\.\d+)?\s*[*×x]\s*\d+(?:\.\d+)?(?:\s*=\s*\d+(?:\.\d+)?)?/gi,' ')
    .replace(/\d+(?:\.\d+)?\s*(?:balls?|pis|pcs?|pieces?|kg|kgs|gm|gms|grams?|গ্রাম|কেজি|পিস|বল)(?!\p{L})/giu,' ')
    .replace(/\d+(?:\.\d+)?\s*(?:tk|taka|টাকা|৳)(?:\s|$)/gi,' ')
    .replace(/^[\s=:+\-]+|[\s=:+\-]+$/g,'').replace(/\s+/g,' ').trim();
}
export function parseOrder(raw, products=[]) {
  const original=digits(raw).replace(/\\/g,'\n').replace(/\r/g,'');
  const lines=original.split('\n').map(s=>s.trim()).filter(Boolean);
  const warnings=[];
  const pm=original.match(/(?:\+?88[\s-]*)?0?1[3-9](?:[\s-]*\d){8}/);
  const phone=pm?phoneKey(pm[0]):'';
  const header=pm?original.slice(0,pm.index):original.split(/order summary/i)[0];
  const addressLabel=/(?:address|ঠিকানা)\s*[:：\-]*\s*/i;
  const parts=header.split(addressLabel);
  const strip=s=>s.replace(/^\s*(?:order\s*\d+\s*[:：]|name|নাম)\s*[:：\-]*\s*/i,'').replace(/(?:mobile|phone|number|নাম্বার|নম্বর|মোবাইল)\s*[:：\-]*\s*$/i,'').trim();
  let name='',address='';
  if(parts.length>1) { name=strip(parts[0]); address=strip(parts.slice(1).join(' ')); }
  else { const hs=header.split('\n').map(strip).filter(Boolean); name=hs.shift()||'';address=hs.join(', '); }
  const phoneLine=pm?lines.findIndex(l=>l.includes(pm[0].trim())||phoneKey(l)===phone):-1;
  let body=phoneLine>=0?lines.slice(phoneLine+1):lines.slice(lines.findIndex(l=>/order summary/i.test(l))+1);
  let pending=[],items=[],context='',expectedTotal=null,delivery=null;
  function emit(extra='') {
    const text=[...pending,extra].filter(Boolean).join(' ');pending=[];
    if(!text.trim()) return;
    let desc=cleanDescription(text);
    let match=matchProduct(desc,products);
    // Needle sizes inherit the preceding shared product description.
    if(context && /^\d+(?:\.\d+)?\s*mm\b/i.test(desc)) {desc=context+' '+desc;match=matchProduct(desc,products);}
    const m=measures(text),p=match.product;
    let quantity=m.quantity;
    const flags=[];
    if(m.reversed) flags.push('The multiplication is reversed. Quantity was taken from the written piece count.');
    if(m.quantityConflict) flags.push('The written piece count and multiplication disagree. Check the quantity.');
    if(quantity===null && m.grams!==null && p && p.weight>0) quantity=m.grams/p.weight;
    if(quantity===null) { quantity=1; flags.push('Quantity assumed to be 1. Please check.'); }
    if(m.grams!==null && p?.weight>0 && m.quantity!==null && Math.abs(m.quantity*p.weight-m.grams)>.1) flags.push('Pieces and written weight disagree. Check the quantity.');
    if(!Number.isInteger(quantity)) flags.push('Weight does not make a whole number of units. Check the quantity.');
    if(!p) flags.push('Choose a saved product.');
    if(match.ambiguous || (p && match.confidence<.9)) flags.push('Please confirm the product match.');
    if(p && m.price!==null && m.price!==p.sellPrice) flags.push('Message price differs from the catalog.');
    const explicitTotal=text.match(/=\s*(\d+(?:\.\d+)?)/);
    const sellPrice=m.price??p?.sellPrice??0;
    if(explicitTotal && Math.abs(+explicitTotal[1]-quantity*sellPrice)>.01) flags.push('Written line total differs from quantity × price.');
    items.push({id:uid(),productId:p?.id||'',name:p?.name||desc||'Unrecognized product',quantity:round(quantity),sellPrice,buyPrice:p?.buyPrice??null,weight:p?.weight??100,unit:p?.unit||'ball',source:text,flags,confirmed:false});
  }
  for(let idx=0;idx<body.length;idx++) {
    const line=body[idx],s=line.toLowerCase();
    if(/order summary|অর্ডার সামারি/.test(s)) continue;
    if(/^(?:delivery\s*(?:charge)?|dc|ডেলিভারি|ডেলিভারী)/i.test(s)) {emit();delivery=+(s.match(/\d+(?:\.\d+)?/)||[])[0]||0;continue;}
    const isGrand=/^(?:total|grand total|মোট|সর্বমোট)\s*[:=]?\s*\d+(?:\.\d+)?\s*(?:tk|taka|টাকা|৳|\(|due|du|paid|$)/i.test(s)
      || /^\s*\d+(?:\s*\+\s*\d+)+\s*=/.test(s)
      || /^total\s+\d+\s*\+/.test(s);
    if(isGrand) {emit();const eq=s.match(/=\s*(\d+(?:\.\d+)?)/);const total=s.match(/(?:total|মোট|সর্বমোট)\s*[:=]?\s*(\d+(?:\.\d+)?)/);expectedTotal=eq?+eq[1]:total?+total[1]:expectedTotal;continue;}
    const m=measures(s),desc=cleanDescription(s);
    // A price on its own finishes the description accumulated above it.
    const money=m.price!==null||m.multiply;
    const hasMeasure=m.quantity!==null||m.grams!==null;
    const sizeOnly=/^\d+(?:\.\d+)?\s*mm\b/.test(desc);
    if(money && sizeOnly && pending.length) {context=cleanDescription(pending.join(' '));emit(line);continue;}
    if(money && sizeOnly && context) {emit(line);continue;}
    if(money) {emit(line);continue;}
    if(pending.length && desc && !hasMeasure) {
      const prior=measures(pending.join(' '));
      const priorMatch=matchProduct(cleanDescription(pending.join(' ')),products);
      const nextMatch=matchProduct(desc,products);
      if((prior.quantity!==null||prior.grams!==null) && nextMatch.product && priorMatch.product?.id!==nextMatch.product.id) emit();
    }
    pending.push(line);
    // Keep a quantity line pending if the next line contains the unit price.
    if(hasMeasure && idx===body.length-1) emit();
  }
  emit();
  if(!validPhone(phone)) warnings.push('A valid Bangladesh mobile number is needed.');
  if(!name) warnings.push('Customer name is missing.');
  const t=totals(items);
  if(expectedTotal!==null && delivery!==null && Math.abs(t.revenue+delivery-expectedTotal)>.01) warnings.push(`Written total ${expectedTotal} differs from items ${t.revenue} + delivery ${delivery} = ${round(t.revenue+delivery)}. Delivery is excluded from this bill.`);
  return {name,address,phone,items,warnings,expectedTotal,delivery,raw,date:today(),status:/\bpaid\b/i.test(original)&&!/(?:unpaid|due|\bdu\b)/i.test(original)?'paid':'due'};
}
export function aggregate(orders, month) {
  const included=orders.filter(o=>o.status!=='cancelled'&&(!month||monthKey(o.date)===month));
  const t=totals(included.flatMap(o=>o.items));
  return {...t,count:included.length,customers:new Set(included.map(o=>phoneKey(o.phone))).size,due:round(included.filter(o=>o.status==='due').reduce((s,o)=>s+totals(o.items).revenue,0))};
}
export function customerRecords(orders) {
  const map=new Map();
  for(const o of [...orders].sort((a,b)=>a.date.localeCompare(b.date))) {
    if(o.status==='cancelled') continue;
    const key=phoneKey(o.phone), c=map.get(key)||{phone:key,orders:[],name:o.name,address:o.address};
    c.name=o.name;c.address=o.address;c.orders.push(o);map.set(key,c);
  }
  return [...map.values()].map(c=>({...c,...aggregate(c.orders)})).sort((a,b)=>b.revenue-a.revenue);
}
export function validateBackup(data) {
  if(!data||data.version!==SCHEMA||!Array.isArray(data.products)||!Array.isArray(data.orders)) throw Error('This is not a Cotton Ledger backup.');
  const finite=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
  const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(id);
  const validDate=date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date))&&new Date(date).toISOString().slice(0,10)===date;
  const ids=new Set();
  for(const p of data.products) {
    if(!p||!validId(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||!finite(p.sellPrice)||!(p.buyPrice===null||finite(p.buyPrice))||!finite(p.weight)||(p.unit==='ball'&&p.weight===0)||!['ball','piece'].includes(p.unit)||!Array.isArray(p.aliases)||p.aliases.some(a=>typeof a!=='string')) throw Error('The backup contains an invalid product.');
    ids.add(p.id);
  }
  const orderIds=new Set();
  for(const o of data.orders) {
    if(!o||!validId(o.id)||orderIds.has(o.id)||typeof o.name!=='string'||!o.name.trim()||typeof o.address!=='string'||!validPhone(o.phone)||!validDate(o.date)||!['due','paid','cancelled'].includes(o.status)||!Array.isArray(o.items)||!o.items.length) throw Error('The backup contains an invalid order.');
    orderIds.add(o.id);
    for(const i of o.items) if(!i||typeof i.name!=='string'||!validId(i.productId)||!finite(i.quantity)||!Number.isInteger(i.quantity)||i.quantity<=0||!finite(i.sellPrice)||!(i.buyPrice===null||finite(i.buyPrice))||!finite(i.weight)||!['ball','piece'].includes(i.unit)) throw Error('The backup contains an invalid order item.');
  }
  return data;
}
export function parseCSV(text) {
  const rows=[];let row=[],cell='',quoted=false;
  text=text.replace(/^\uFEFF/,'');
  for(let k=0;k<text.length;k++) {const ch=text[k];if(ch==='"'){if(quoted&&text[k+1]==='"'){cell+='"';k++;}else quoted=!quoted;}else if(!quoted&&(ch===','||ch==='\n')){row.push(cell.trim());cell='';if(ch==='\n'){if(row.some(Boolean))rows.push(row);row=[];}}else if(ch!=='\r')cell+=ch;}
  if(quoted)throw Error('CSV has an unclosed quote.');
  row.push(cell.trim());if(row.some(Boolean))rows.push(row);
  const headers=rows.shift()?.map(s=>s.toLowerCase());
  if(!headers||!['name','sellprice','buyprice'].every(h=>headers.includes(h))) throw Error('CSV needs name, sellPrice and buyPrice columns.');
  return rows.map((r,index)=>{
    const get=k=>r[headers.indexOf(k)]||'';
    const name=get('name'),sellPrice=+get('sellprice'),buyPrice=get('buyprice')===''?null:+get('buyprice'),weight=get('weight')===''?100:+get('weight'),unit=get('unit')||'ball';
    if(!name||get('sellprice')===''||![sellPrice,weight].every(v=>Number.isFinite(v)&&v>=0)||!(buyPrice===null||Number.isFinite(buyPrice)&&buyPrice>=0)||!['ball','piece'].includes(unit)||(unit==='ball'&&weight<=0)) throw Error(`Invalid product on CSV row ${index+2}.`);
    return {id:uid(),name,sellPrice,buyPrice,weight,unit,aliases:get('aliases').split('|').map(s=>s.trim()).filter(Boolean),archived:false};
  });
}
