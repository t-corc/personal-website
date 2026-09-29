/* Public contact address reused from the existing website. */
const CV_URL = '/hire-me/Tommaso-Corciulo-CV.pdf';
const CONTACT_URL = 'mailto:tc@tommasocorciulo.com';
(() => {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_geo'];
  const params = new URLSearchParams(window.location.search);
  let campaign = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem('hire-me-campaign') || '{}');
    if (saved && typeof saved === 'object') campaign = Object.fromEntries(keys.filter(k => typeof saved[k] === 'string').map(k => [k, saved[k].slice(0, 200)]));
    if (keys.some(k => params.has(k))) {
      campaign = Object.fromEntries(keys.filter(k => params.has(k)).map(k => [k, params.get(k).slice(0, 200)]));
      sessionStorage.setItem('hire-me-campaign', JSON.stringify(campaign));
    }
  } catch { campaign = Object.fromEntries(keys.filter(k => params.has(k)).map(k => [k, params.get(k).slice(0, 200)])); }
  // Local custom events only: no analytics service, cookie, or network transmission.
  const report = (name, detail = {}) => window.dispatchEvent(new CustomEvent('hire-me:analytics', {detail: {event: name, page: '/hire-me', campaign, ...detail}}));
  document.querySelectorAll('[data-cta]').forEach(link => {
    if (link.dataset.cta === 'cv' && CV_URL) link.href = CV_URL;
    if (link.dataset.cta === 'contact') link.href = CONTACT_URL;
    link.addEventListener('click', () => report('cta_click', {cta: link.dataset.cta, id: link.id}));
  });
  report('page_view');
})();
