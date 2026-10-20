// Normalizes research JSON into the loader's strict shape: scalar specs, price null when no amount.
import fs from 'node:fs';
const files = process.argv.slice(2);
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); let n = 0;
  const fix = (p) => {
    if (p.price && typeof p.price.amount !== 'number') { p.specs = p.specs || {}; if (p.price.note) p.specs.pricing_note = p.price.note; if (p.price.source_url) p.specs.price_source_url = p.price.source_url; p.price = null; n++; }
    if (p.specs) for (const k of Object.keys(p.specs)) { const v = p.specs[k];
      if (v === null || v === undefined) { delete p.specs[k]; n++; }
      else if (Array.isArray(v)) { p.specs[k] = v.map((x) => (typeof x === 'object' ? JSON.stringify(x) : String(x))).join('; '); n++; }
      else if (typeof v === 'object') { p.specs[k] = JSON.stringify(v); n++; } }
    for (const k of ['pros','cons','known_issues','mention_sources']) if (p[k] && !Array.isArray(p[k])) { p[k] = [String(p[k])]; n++; }
  };
  (j.products || []).forEach(fix); (j.software || []).forEach(fix);
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); console.log(f, 'normalized', n);
}

// Computers: the research seat wrote `software` as requirement records (maker, os, tiers).
// Turn each into the loader's ComponentSoftware shape without inventing anything.
for (const f of files.filter((x) => x.endsWith('computers.json'))) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); let n = 0;
  j.software = (j.software || []).map((s) => {
    if (s.brand && s.pricing_model) return s; // already in shape
    const name = s.name || '';
    const mentions = (j.sources || []).filter((src) => (`${src.title} ${src.what_it_says}`).toLowerCase().includes(name.toLowerCase().split(' ')[0]));
    const price = s.price && typeof s.price.amount === 'number' ? { amount: s.price.amount, currency: s.price.currency || 'USD', read_on: s.price.read_on || j.read_date, source_url: s.price.source_url || '' } : null;
    const period = s.price && s.price.period ? String(s.price.period) : undefined;
    const pricing_model = price === null ? 'free' : (period === 'monthly' || period === 'yearly') ? 'subscription' : 'one_time';
    const specs = {};
    for (const [k, v] of Object.entries(s)) {
      if (['name','maker','brand','price','os','pros','cons','known_issues','why_people_choose_it','who_its_for','room_fit','direct_url','fallback_url','read_url','image_url','mention_count','mention_sources','subtype','tier','specs'].includes(k)) continue;
      specs[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    }
    if (s.specs) for (const [k, v] of Object.entries(s.specs)) specs[k] = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (s.os) specs.os = String(s.os);
    n++;
    return {
      brand: s.maker || s.brand || name, name, subtype: 'software', tier: mentions.length >= 10 ? 'core' : 'qualified',
      mention_count: s.mention_count ?? mentions.length, mention_sources: s.mention_sources || mentions.map((m) => m.url),
      price, pricing_model, ...(pricing_model === 'subscription' ? { price_period: period } : {}),
      platform: s.os ? String(s.os) : undefined,
      direct_url: s.direct_url || (s.price && s.price.source_url) || '', fallback_url: s.fallback_url || '', read_url: s.read_url || '',
      specs, room_fit: s.room_fit || '', who_its_for: s.who_its_for || '', pros: s.pros || [], cons: s.cons || [], known_issues: s.known_issues || [],
      why_people_choose_it: s.why_people_choose_it || '', image_url: s.image_url || '',
    };
  });
  fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); console.log(f, 'software entries shaped', n);
}

// Subscriptions: the loader accepts monthly / yearly / lifetime. "one-time" is lifetime; a $0 "none"
// or "included" entry is not a subscription, so it becomes a specs note and is dropped from the list.
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(f, 'utf8')); let n = 0;
  for (const p of j.products || []) {
    if (!Array.isArray(p.subscriptions)) continue;
    const keep = [];
    for (const s of p.subscriptions) {
      const period = String(s.period || '').toLowerCase();
      if (['monthly', 'yearly', 'lifetime'].includes(period)) { keep.push(s); continue; }
      n++;
      if (period === 'one-time' || period === 'one_time' || period === 'once') { keep.push({ ...s, period: 'lifetime' }); continue; }
      p.specs = p.specs || {};
      p.specs.subscription_note = [p.specs.subscription_note, `${s.name}: ${s.required_for || ''}`.trim()].filter(Boolean).join('; ');
    }
    p.subscriptions = keep;
  }
  if (n) { fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); console.log(f, 'subscription periods fixed', n); }
}
