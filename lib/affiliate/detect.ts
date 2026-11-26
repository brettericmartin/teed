// Recognises outbound links that pay a commission, so a bag page can show the
// affiliate disclosure. Patterns cover common link shorteners and networks plus
// Amazon's tag parameter; anything else is treated as a plain link.
const AFFILIATE_HOSTS = [
  'amzn.to', 'geni.us', 'rstyle.me', 'howl.me', 'prf.hn', 'shopstyle.', 'shareasale.com',
  'linksynergy.com', 'avantlink.com', 'awin1.com', 'anrdoezrs.net', 'jdoqocy.com',
  'tkqlhce.com', 'dpbolvw.net', 'kqzyfj.com', 'pxf.io', 'sjv.io', 'skimresources.com',
  'skimlinks.com', 'magik.ly', 'partnerize.com', 'refersion.com', 'goaffpro.com',
  'linkby.com', 'narrativ.com', 'bam-x.com', 'shop-links.co', 'fmtc.co',
];

export function isAffiliateUrl(raw: string | null | undefined): boolean {
  if (!raw) return false;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (AFFILIATE_HOSTS.some((h) => (h.endsWith('.') ? host.includes(h) : host === h || host.endsWith(`.${h}`)))) {
    return true;
  }
  if (/(^|\.)amazon\.[a-z.]+$/.test(host) && url.searchParams.has('tag')) return true;
  for (const key of ['affid', 'aff_id', 'affiliate_id', 'irclickid', 'clickref']) {
    if (url.searchParams.has(key)) return true;
  }
  return false;
}
