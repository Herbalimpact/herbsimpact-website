#!/usr/bin/env node
/**
 * Build script for Herbal Impact blog posts.
 *
 * Reads every Markdown file in content/blog/, merges its front matter and
 * body into templates/blog-post.html, and writes the final static HTML
 * file to the site root (e.g. content/blog/5-everyday-herbs.md -> blog-1.html)
 * so existing URLs never change.
 *
 * No external dependencies: only Node's built-in "fs" and "path" modules,
 * plus small hand-rolled front-matter and Markdown parsers tailored to the
 * headings / paragraphs / bullet lists / **bold** text used in these posts.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'blog-post.html');
const SITE_URL = 'https://herbsimpact.com/';

// Maps a content markdown file to the static HTML file it produces.
// Add an entry here whenever a new blog post markdown file is created.
const OUTPUT_MAP = {
  '5-everyday-herbs.md': 'blog-1.html',
  '5-everyday-herbs-sw.md': 'blog-1-sw.html',
  'brewing-medicinal-tea.md': 'blog-2.html',
  'brewing-medicinal-tea-sw.md': 'blog-2-sw.html',
  'daily-wellness-rituals.md': 'blog-3.html',
  'daily-wellness-rituals-sw.md': 'blog-3-sw.html',
  'the-silent-weight-how-excess-body-fat-quietly-undermines-your-health.md': 'blog-4.html',
  'uzito-wa-ziada-jinsi-mafuta-mengi-mwilini-yanavyodhoofisha-afya-yako-kimya-kimya.md': 'blog-4-sw.html',
  'cyclospora-outbreak-2026-what-the-lettuce-linked-parasite-means-for-your-health.md': 'blog-5.html',
  'mlipuko-wa-cyclospora-2026-maana-ya-vimelea-vinavyohusishwa-na-lettusi-kwa-afya-yako.md': 'blog-5-sw.html',
  'chronic-cough-the-global-problem-thats-surprisingly-hard-to-treat.md': 'blog-6.html',
    'why-do-some-people-have-really-bad-breath-heres-what-is-actually-going-on.md': 'blog-7.html',
    'kwa-nini-baadhi-ya-watu-wanatoa-pumzi-yenye-harufu-mbaya-sana-hii-ndiyo-sababu-halisi.md': 'blog-7-sw.html',
  'kikohozi-sugu-tatizo-linaloendelea-kusumbua-dunia.md': 'blog-6-sw.html',
  'being-rich-could-have-led-to-her-demise-by-now.md': 'blog-8.html',
  'angekuwa-tajiri-huenda-angeshakufa.md': 'blog-8-sw.html',
};

// Hand-curated "related articles" links, grouped by topic and language, so
// every post links to a couple of others readers (and search engines) can
// discover it from. Keep language pairs consistent (EN posts link only to
// other EN posts, SW posts only to other SW posts).
const RELATED_POSTS = {
  'blog-1.html': ['blog-2.html', 'blog-3.html'],
  'blog-2.html': ['blog-1.html', 'blog-3.html'],
  'blog-3.html': ['blog-1.html', 'blog-2.html'],
  'blog-1-sw.html': ['blog-2-sw.html', 'blog-3-sw.html'],
  'blog-2-sw.html': ['blog-1-sw.html', 'blog-3-sw.html'],
  'blog-3-sw.html': ['blog-1-sw.html', 'blog-2-sw.html'],
  'blog-4.html': ['blog-6.html', 'blog-7.html'],
  'blog-5.html': ['blog-6.html', 'blog-7.html'],
  'blog-6.html': ['blog-4.html', 'blog-7.html'],
  'blog-7.html': ['blog-4.html', 'blog-6.html'],
  'blog-4-sw.html': ['blog-6-sw.html', 'blog-7-sw.html'],
  'blog-5-sw.html': ['blog-6-sw.html', 'blog-7-sw.html'],
  'blog-6-sw.html': ['blog-4-sw.html', 'blog-7-sw.html'],
  'blog-7-sw.html': ['blog-4-sw.html', 'blog-6-sw.html'],
  'blog-8.html': ['blog-4.html', 'blog-6.html'],
  'blog-8-sw.html': ['blog-4-sw.html', 'blog-6-sw.html'],
};

// The health disclaimer and the language-switch link text are the same on
// every post within a language, so they live here rather than being
// repeated in every content file. Which one is used is decided by whether
// the output file name ends in "-sw.html".
const DISCLAIMER = {
  en: 'Health disclaimer: This article is for general wellness information only. It is not medical advice and is not intended to diagnose, treat, cure or prevent any disease. Always consult a qualified healthcare provider before starting any new remedy.',
  sw: "Onyo la kiafya: Makala hii ni kwa ajili ya taarifa za jumla za afya tu. Si ushauri wa kitabibu na hailengi kutambua, kutibu, kuponya au kuzuia ugonjwa wowote. Daima wasiliana na mtaalamu wa afya aliyehitimu kabla ya kuanza dawa au tiba yoyote mpya.",
};

const SWAHILI_LINK_TEXT = {
  toSwahili: 'SOMA KWA KISWAHILI HAPA',
  toEnglish: 'READ IN ENGLISH',
};

// Text for the language-switch links shown above the article title and at
// the bottom of the article. These differ from SWAHILI_LINK_TEXT above,
// which is the button link inside the article body itself.
const TOP_LINK_TEXT = {
  en: 'All articles',
  sw: 'Soma kwa Kiingereza / Read in English',
};

const BOTTOM_LINK_TEXT = {
  en: 'Back to all articles',
  sw: 'Rudi kwenye makala zote / Back to all articles',
};

const RELATED_HEADING = { en: 'Related articles', sw: 'Makala zinazohusiana' };

// Parses a simple "key: value" front-matter block. Unlike full YAML, a
// value is allowed to continue on the following line(s) as long as those
// lines are indented (this is the "folded scalar" style YAML allows, e.g.
//   title: "A long title that wraps onto
//     a second line"
// ) - continuation lines are joined onto the value with a single space.
// (Earlier versions of this parser silently dropped continuation lines,
// which is why a few long titles/descriptions used to show up truncated.)
function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Missing front matter block (file must start with "---").');
  }
  const [, fmBlock, body] = match;
  const data = {};
  let currentKey = null;
  fmBlock.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    // An indented line with no key of its own continues the previous value.
    if (/^\s/.test(line) && currentKey) {
      data[currentKey] = data[currentKey] + ' ' + line.trim();
      return;
    }
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    currentKey = key;
    data[key] = value;
  });
  // Strip wrapping quotes now that any multi-line value is fully joined.
  Object.keys(data).forEach((key) => {
    let value = data[key];
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    data[key] = value;
  });
  return { data, body: body.replace(/^\s+/, '') };
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Converts **bold** inline markdown to HTML on already-escaped text.
function inline(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');
}

// Minimal Markdown -> HTML converter supporting the subset of Markdown used
// in these posts: ## / ### headings, "-" bullet lists, plain paragraphs,
// and **bold** inline formatting.
function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const htmlParts = [];
  let listBuffer = [];

  function flushList() {
    if (listBuffer.length) {
      htmlParts.push('<ul>\n' + listBuffer.map((item) => '      <li>' + inline(item) + '</li>').join('\n') + '\n    </ul>');
      listBuffer = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('### ')) {
      flushList();
      htmlParts.push('<h3>' + inline(line.slice(4)) + '</h3>');
    } else if (line.startsWith('## ')) {
      flushList();
      htmlParts.push('<h2>' + inline(line.slice(3)) + '</h2>');
    } else if (line.startsWith('- ')) {
      listBuffer.push(line.slice(2));
    } else {
      flushList();
      htmlParts.push('<p>' + inline(line) + '</p>');
    }
  }
  flushList();
  return htmlParts.join('\n\n    ');
}

// Builds the small "Related articles" block shown near the end of each
// post, using the RELATED_POSTS map above and the titles collected from
// every post in the first pass of main().
function buildRelatedHtml(outputName, isSwahili, titles) {
  const related = RELATED_POSTS[outputName] || [];
  if (!related.length) return '';
  const items = related
    .filter((href) => titles[href])
    .map((href) => '      <li><a href="' + href + '">' + escapeHtml(titles[href]) + '</a></li>')
    .join('\n');
  if (!items) return '';
  const heading = isSwahili ? RELATED_HEADING.sw : RELATED_HEADING.en;
  return (
    '<div class="related-articles">\n' +
    '      <h3>' + escapeHtml(heading) + '</h3>\n' +
    '      <ul>\n' + items + '\n      </ul>\n' +
    '    </div>'
  );
}

// Builds the Article structured-data block (JSON-LD) for a post's <head>,
// so the article is eligible for rich results in search.
function buildJsonLd(data, outputName) {
  const canonicalUrl = SITE_URL + outputName;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.title || '',
    description: data.description || '',
    image: data.cover_image || undefined,
    url: canonicalUrl,
    inLanguage: outputName.endsWith('-sw.html') ? 'sw' : 'en',
    publisher: {
      '@type': 'Organization',
      name: 'Herbal Impact',
      logo: { '@type': 'ImageObject', url: SITE_URL + 'logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
  };
  return JSON.stringify(jsonLd);
}

function buildPost(mdFileName, template, titles) {
  const mdPath = path.join(CONTENT_DIR, mdFileName);
  const raw = fs.readFileSync(mdPath, 'utf8');
  const { data, body } = parseFrontMatter(raw);

  const outputName = OUTPUT_MAP[mdFileName];
  if (!outputName) {
    throw new Error('No output mapping configured for ' + mdFileName + '. Add it to OUTPUT_MAP in scripts/build-blog.js.');
  }
  const isSwahili = outputName.endsWith('-sw.html');
  const disclaimer = isSwahili ? DISCLAIMER.sw : DISCLAIMER.en;
  const swahiliLinkText = isSwahili ? SWAHILI_LINK_TEXT.toEnglish : SWAHILI_LINK_TEXT.toSwahili;
  // The top link goes back to "all articles" for English posts, but for
  // Swahili posts it links directly to the matching English post instead
  // (matching the original hand-written pages).
  const topLinkHref = isSwahili ? outputName.replace('-sw.html', '.html') : 'blog.html';
  const topLinkText = isSwahili ? TOP_LINK_TEXT.sw : TOP_LINK_TEXT.en;
  const bottomLinkText = isSwahili ? BOTTOM_LINK_TEXT.sw : BOTTOM_LINK_TEXT.en;

  const bodyHtml = markdownToHtml(body);
  // A shorter title for the <title> tag / search snippet, when one is set
  // in front matter; otherwise falls back to the full on-page headline.
  const seoTitle = data.seo_title || data.title || '';
  const canonicalUrl = SITE_URL + outputName;
  const relatedHtml = buildRelatedHtml(outputName, isSwahili, titles);
  const jsonLd = buildJsonLd(data, outputName);

  const html = template
    .split('{{TITLE}}').join(escapeHtml(data.title || ''))
    .split('{{SEO_TITLE}}').join(escapeHtml(seoTitle))
    .split('{{CATEGORY}}').join(escapeHtml(data.category || ''))
    .split('{{READ_TIME}}').join(escapeHtml(data.read_time || ''))
    .split('{{COVER_IMAGE}}').join(escapeHtml(data.cover_image || ''))
    .split('{{COVER_IMAGE_ALT}}').join(escapeHtml(data.cover_image_alt || ''))
    .split('{{SWAHILI_LINK}}').join(escapeHtml(data.swahili_link || ''))
    .split('{{SWAHILI_LINK_TEXT}}').join(swahiliLinkText)
    .split('{{DESCRIPTION}}').join(escapeHtml(data.description || ''))
    .split('{{DISCLAIMER}}').join(escapeHtml(disclaimer))
    .split('{{TOP_LINK_HREF}}').join(escapeHtml(topLinkHref))
    .split('{{TOP_LINK_TEXT}}').join(escapeHtml(topLinkText))
    .split('{{BOTTOM_LINK_TEXT}}').join(escapeHtml(bottomLinkText))
    .split('{{CANONICAL}}').join(canonicalUrl)
    .split('{{RELATED_POSTS}}').join(relatedHtml)
    .split('{{JSONLD}}').join(jsonLd)
    .split('{{BODY}}').join(bodyHtml);

  fs.writeFileSync(path.join(ROOT, outputName), html, 'utf8');
  console.log('Built ' + outputName + ' from content/blog/' + mdFileName);
}

function main() {
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'));

  if (!files.length) {
    console.warn('No Markdown files found in content/blog - nothing to build.');
    return;
  }

  // First pass: collect every post's title (needed for the related-articles
  // links) without writing any files yet.
  const titles = {};
  files.forEach((file) => {
    const outputName = OUTPUT_MAP[file];
    if (!outputName) return;
    const { data } = parseFrontMatter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
    titles[outputName] = data.title || '';
  });

  // Second pass: render and write each post, now that all titles are known.
  files.forEach((file) => buildPost(file, template, titles));
  console.log('\nDone. Built ' + files.length + ' blog post(s).');
}

main();
