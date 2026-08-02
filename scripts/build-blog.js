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

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Missing front matter block (file must start with "---").');
  }
  const [, fmBlock, body] = match;
  const data = {};
  fmBlock.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
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
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
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

function buildPost(mdFileName, template) {
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

  const html = template
    .split('{{TITLE}}').join(escapeHtml(data.title || ''))
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

  files.forEach((file) => buildPost(file, template));
  console.log('\nDone. Built ' + files.length + ' blog post(s).');
}

main();
