const PROXY_PATH = '/api/browse';

const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith('.local')) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  return false;
}

function parseTargetUrl(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let url;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  if (isPrivateHost(url.hostname)) return null;
  return url.href;
}

function toProxyUrl(absoluteUrl) {
  return `${PROXY_PATH}?url=${encodeURIComponent(absoluteUrl)}`;
}

function resolveAbsoluteUrl(value, baseUrl) {
  if (!value || value.startsWith('#') || value.startsWith('javascript:') || value.startsWith('data:')) {
    return null;
  }
  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
}

function rewriteAttribute(html, attr, pageUrl) {
  const re = new RegExp(`(<[^>]+\\s${attr}\\s*=\\s*["'])([^"']+)(["'])`, 'gi');
  return html.replace(re, (_match, prefix, value, suffix) => {
    const absolute = resolveAbsoluteUrl(value, pageUrl);
    if (!absolute || !parseTargetUrl(absolute)) return `${prefix}${value}${suffix}`;
    return `${prefix}${toProxyUrl(absolute)}${suffix}`;
  });
}

function injectBrowserScript(pageUrl) {
  return `<script>
(function () {
  var pageUrl = ${JSON.stringify(pageUrl)};

  function proxify(raw) {
    if (!raw || raw.indexOf('javascript:') === 0 || raw.indexOf('data:') === 0 || raw.indexOf('#') === 0) return null;
    if (raw.indexOf('${PROXY_PATH}?url=') === 0) return raw;
    try {
      var abs = new URL(raw, pageUrl).href;
      return '${PROXY_PATH}?url=' + encodeURIComponent(abs);
    } catch (e) {
      return null;
    }
  }

  function notify(url) {
    try { parent.postMessage({ type: 'browser-navigate', url: url }, '*'); } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var next = proxify(link.getAttribute('href'));
    if (!next) return;
    e.preventDefault();
    var target = (link.getAttribute('target') || '').toLowerCase();
    if (target === '_blank') {
      window.open(next, '_blank');
      return;
    }
    window.location.href = next;
  }, true);

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    var method = (form.getAttribute('method') || 'get').toLowerCase();
    if (method !== 'get') return;
    e.preventDefault();
    try {
      var target = new URL(form.getAttribute('action') || pageUrl, pageUrl);
      new FormData(form).forEach(function (value, key) {
        target.searchParams.set(key, value);
      });
      var next = '${PROXY_PATH}?url=' + encodeURIComponent(target.href);
      window.location.href = next;
    } catch (err) {}
  }, true);

  notify(new URLSearchParams(window.location.search).get('url') || pageUrl);
})();
</script>`;
}

function rewriteHtml(html, pageUrl) {
  let out = html;
  for (const attr of ['href', 'src', 'action', 'poster']) {
    out = rewriteAttribute(out, attr, pageUrl);
  }

  out = out.replace(/url\(\s*(['"]?)(https?:\/\/[^'")]+)\1\s*\)/gi, (_m, _q, url) => {
    const absolute = parseTargetUrl(url);
    return absolute ? `url("${toProxyUrl(absolute)}")` : _m;
  });

  const script = injectBrowserScript(pageUrl);
  if (/<\/body>/i.test(out)) {
    out = out.replace(/<\/body>/i, `${script}</body>`);
  } else {
    out += script;
  }

  return out;
}

async function fetchProxied(targetUrl) {
  const res = await fetch(targetUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
  });

  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  const buffer = Buffer.from(await res.arrayBuffer());

  if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
    const html = buffer.toString('utf8');
    return {
      status: res.status,
      contentType: 'text/html; charset=utf-8',
      body: rewriteHtml(html, res.url || targetUrl),
    };
  }

  return {
    status: res.status,
    contentType,
    body: buffer,
    binary: true,
  };
}

module.exports = {
  PROXY_PATH,
  parseTargetUrl,
  fetchProxied,
  toProxyUrl,
};
