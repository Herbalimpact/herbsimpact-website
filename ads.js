// Herbal Impact "advertising board": shows our own products and services on the site.
// Same system as wellbizsolutions.co.site.
// All ads come from /assets/data/products.json — edit that one file to change
// what appears. This script adds:
//   1. a WhatsApp button fixed to the corner of every page
//   2. one matching ad card in the middle of each blog article
//   3. a "Recommended for you" strip near the end of each blog article
// Clicks are counted in GoatCounter as events named "ad/<slot>/<item id>".
(function () {
  var lang = (document.documentElement.lang || 'en').toLowerCase().indexOf('sw') === 0 ? 'sw' : 'en';
  var T = {
    en: { product: 'From our shop', service: 'Our service', sponsored: 'Sponsored',
          get: 'Get it', chat: 'Chat on WhatsApp', recTitle: 'Recommended for you',
          waFloat: 'Chat with us', waHello: 'Hello Herbal Impact, I am interested in: ',
          waGeneric: 'Hello Herbal Impact, I have a question about your products.', allShop: 'Visit our store', allSvc: 'Contact us',
          featured: 'Featured product', featuredSvc: 'Featured service', learn: 'Get it now' },
    sw: { product: 'Kutoka dukani kwetu', service: 'Huduma yetu', sponsored: 'Tangazo',
          get: 'Ipate sasa', chat: 'Tuandikie WhatsApp', recTitle: 'Tunakupendekezea',
          waFloat: 'Ongea nasi', waHello: 'Habari Herbal Impact, ninahitaji: ',
          waGeneric: 'Habari Herbal Impact, nina swali kuhusu bidhaa zenu.', allShop: 'Tembelea duka letu', allSvc: 'Wasiliana nasi',
          featured: 'Bidhaa maalum', featuredSvc: 'Huduma maalum', learn: 'Ipate sasa' }
  }[lang];

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s || '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function track(name) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true }); } catch (e) {}
  }
  function waLink(number, text) {
    return 'https://wa.me/' + number + '?text=' + encodeURIComponent(text);
  }
  function productUrl(item, slot) {
    var sep = item.url.indexOf('?') === -1 ? '?' : '&';
    return item.url + sep + 'utm_source=herbsimpact&utm_medium=' + slot + '&utm_campaign=ads';
  }

  function card(item, slot, number) {
    var isSvc = item.type === 'service';
    var href = isSvc ? waLink(item.whatsapp || number, T.waHello + item.title + ' (' + location.href + ')') : productUrl(item, slot);
    var label = item.sponsored ? T.sponsored : (isSvc ? T.service : T.product);
    var c = el('div', 'wb-ad wb-ad-' + slot + (isSvc ? ' wb-ad-svc' : ''));
    c.innerHTML =
      '<a class="wb-ad-img" href="' + esc(href) + '" target="_blank" rel="noopener' + (item.sponsored ? ' sponsored' : '') + '">' +
        '<img src="' + esc(item.image) + '" alt="' + esc(item.title) + '" loading="lazy"></a>' +
      '<div class="wb-ad-body">' +
        '<span class="wb-ad-label">' + esc(label) + '</span>' +
        '<p class="wb-ad-title">' + esc(item.title) + '</p>' +
        (item.text ? '<p class="wb-ad-text">' + esc(item.text) + '</p>' : '') +
        (item.price ? '<p class="wb-ad-price">' + esc(item.price) + '</p>' : '') +
        '<a class="wb-ad-btn" href="' + esc(href) + '" target="_blank" rel="noopener' + (item.sponsored ? ' sponsored' : '') + '">' +
          esc(isSvc ? T.chat : T.get) + '</a>' +
      '</div>';
    c.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { track('ad/' + slot + '/' + item.id); });
    });
    return c;
  }

  function addWhatsAppButton(number) {
    // herbsimpact.com already has its own WhatsApp button (.whatsapp-float).
    if (document.querySelector('.wb-wa-float, .whatsapp-float')) return;
    var a = el('a', 'wb-wa-float');
    a.href = waLink(number, T.waGeneric);
    a.target = '_blank';
    a.rel = 'noopener';
    a.setAttribute('aria-label', T.waFloat + ' (WhatsApp)');
    a.innerHTML =
      '<svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.6l-.4-.2-3.8 1.2 1.2-3.7-.3-.4c-1.2-1.8-1.8-3.8-1.8-5.9C5 9.9 9.9 5.1 16 5.1s11 4.8 11 10.7-4.9 10.6-11 10.6zm6-7.9c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2-.2.3-.9 1.1-1.1 1.3-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.7-1.6-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.1-.7l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.6-.6-.8-.6h-.7c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.6 5.8 5 .8.3 1.5.6 2 .7.8.3 1.6.2 2.2.1.7-.1 2-.8 2.3-1.6.3-.8.3-1.4.2-1.6-.1-.1-.3-.2-.6-.4z"/></svg>' +
      '<span>' + esc(T.waFloat) + '</span>';
    a.addEventListener('click', function () { track('ad/whatsapp-float'); });
    document.body.appendChild(a);
  }

  function pageText() {
    var parts = [document.title, location.pathname.replace(/[-_\/.]/g, ' ')];
    ['description', 'keywords'].forEach(function (n) {
      var m = document.querySelector('meta[name="' + n + '"]');
      if (m) parts.push(m.content);
    });
    var h1 = document.querySelector('article h1, h1');
    if (h1) parts.push(h1.textContent);
    return ' ' + parts.join(' ').toLowerCase() + ' ';
  }

  function score(item, text) {
    var s = 0;
    (item.tags || []).forEach(function (t) {
      // Match whole words (or word starts), so "tic" doesn't match "practical".
      var re = new RegExp('(^|[^a-z0-9])' + String(t).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      if (re.test(text)) s++;
    });
    return s;
  }

  function addArticleAds(items, number, exclude) {
    var article = document.querySelector('article.post .container') || document.querySelector('article.post');
    if (!article || !/^\/blog-\d/.test(location.pathname)) return;
    var file = location.pathname.replace(/^\//, '');
    if ((exclude || []).indexOf(file) !== -1) return;

    // Skip anything this article already links to (its own e-book box).
    var linked = {};
    article.querySelectorAll('a[href]').forEach(function (a) { linked[a.href.split('?')[0]] = true; });

    var text = pageText();
    var pool = items.filter(function (it) {
      return it.active !== false && it.lang === lang && !(it.url && linked[it.url.split('?')[0]]);
    }).map(function (it, i) { return { it: it, s: score(it, text), i: i }; });
    pool.sort(function (a, b) { return b.s - a.s || a.i - b.i; });

    var matched = pool.filter(function (p) { return p.s > 0; });
    var used = {};

    // 1. Middle card: best match, placed before the 3rd section heading.
    var heads = Array.prototype.filter.call(article.querySelectorAll('h2'), function (h) {
      return !h.closest('.related-articles, .disclaimer, .wb-ad-rec, aside, nav, header, footer');
    });
    if (matched.length && heads.length >= 3) {
      var mid = matched[0].it;
      used[mid.id] = true;
      heads[2].parentNode.insertBefore(card(mid, 'mid', number), heads[2]);
    }

    // 2. "Recommended for you": up to 3 more, mixing products and services.
    var rest = pool.filter(function (p) { return !used[p.it.id]; });
    var pick = [], haveSvc = false, haveProd = false;
    rest.forEach(function (p) {
      if (pick.length >= 3) return;
      var svc = p.it.type === 'service';
      // Unmatched items only fill the strip if marked "general" in products.json.
      if (p.s > 0 || (p.it.general && ((svc && !haveSvc) || (!svc && !haveProd)))) {
        pick.push(p.it);
        if (svc) haveSvc = true; else haveProd = true;
      }
    });
    if (!pick.length) return;

    var box = el('section', 'wb-ad-rec');
    box.appendChild(el('h2', 'wb-ad-rec-title', esc(T.recTitle)));
    var grid = el('div', 'wb-ad-grid');
    pick.forEach(function (it) { grid.appendChild(card(it, 'end', number)); });
    box.appendChild(grid);
    box.appendChild(el('p', 'wb-ad-more',
      '<a href="/store.html">' + esc(T.allShop) + ' →</a> &nbsp;·&nbsp; <a href="/contact.html">' + esc(T.allSvc) + ' →</a>'));

    // Place it after the article's health disclaimer, before "related articles".
    var anchor = article.querySelector('.related-articles') || article.querySelector('p.mt-40');
    if (anchor) anchor.parentNode.insertBefore(box, anchor);
    else article.appendChild(box);
  }

  // Home page: one featured item at a time, changing every rotationHours
  // (default 48). The switch happens at 11:00 AM Dar es Salaam time (UTC+3),
  // and every visitor sees the same item during the same period.
  function addFeatured(data, number) {
    var host = document.getElementById('wb-featured');
    if (!host) return;
    var byId = {};
    (data.items || []).forEach(function (it) { byId[it.id] = it; });
    var list = (data.homepageRotation || []).map(function (id) { return byId[id]; })
      .filter(function (it) { return it && it.active !== false; });
    if (!list.length) return;
    var hours = data.rotationHours || 48;
    var start = Date.UTC(2026, 10, 13, 8, 0, 0);           // 13 Nov 2026 11:00 AM in Dar es Salaam
    var period = Math.floor((Date.now() - start) / (hours * 3600000));
    var item = list[((period % list.length) + list.length) % list.length];

    var isSvc = item.type === 'service';
    var href = isSvc ? waLink(item.whatsapp || number, T.waHello + item.title + ' (' + location.href + ')') : productUrl(item, 'home');
    var rel = 'noopener' + (item.sponsored ? ' sponsored' : '');
    host.innerHTML =
      '<div class="container"><div class="wb-featured' + (isSvc ? ' wb-ad-svc' : '') + '">' +
        '<a class="wb-featured-img" href="' + esc(href) + '" target="_blank" rel="' + rel + '"><img src="' + esc(item.image) + '" alt="' + esc(item.title) + '"></a>' +
        '<div class="wb-featured-body">' +
          '<span class="wb-ad-label">' + esc(item.sponsored ? T.sponsored : (isSvc ? T.featuredSvc : T.featured)) + '</span>' +
          '<h2 class="wb-featured-title">' + esc(item.title) + '</h2>' +
          (item.text ? '<p class="wb-featured-text">' + esc(item.text) + '</p>' : '') +
          '<div class="wb-featured-actions">' +
            (item.price ? '<span class="wb-ad-price">' + esc(item.price) + '</span>' : '') +
            '<a class="wb-ad-btn" href="' + esc(href) + '" target="_blank" rel="' + rel + '">' + esc(isSvc ? T.chat : T.learn) + '</a>' +
            '<a class="wb-featured-more" href="' + (isSvc ? '/contact.html' : '/store.html') + '">' + esc(isSvc ? T.allSvc : T.allShop) + ' →</a>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    host.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { track('ad/home/' + item.id); });
    });
    host.hidden = false;
  }

  fetch('/assets/data/products.json', { cache: 'no-cache' })
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var number = data.whatsappDefault || '255754281131';
      addWhatsAppButton(number);
      addFeatured(data, number);
      addArticleAds(data.items || [], number, data.noAdsOnPages);
    })
    .catch(function (e) { console.error('ads:', e); });
})();
