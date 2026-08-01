#!/usr/bin/env node
/**
  * Build script for Herbal Impact static pages (Home, About, Blog index,
  * Contact, Downloads, Store, Tools, Videos).
  *
  * Reads each page's Markdown + front-matter file in content/pages/, merges
  * the front-matter fields into the matching template in templates/, and
  * writes the final static HTML file to the site root so existing URLs never
  * change (e.g. content/pages/home.md -> index.html).
  *
  * Front matter can contain nested lists (e.g. "pillars", "downloads"), so it
  * is parsed with the "yaml" package (already a declared dependency) rather
  * than the simple hand-rolled parser used for blog posts.
  */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const PAGES_DIR = path.join(ROOT, 'content', 'pages');
const BLOG_DIR = path.join(ROOT, 'content', 'blog');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

// Maps each content markdown file to the template used to render it and the
// static HTML file it produces at the site root.
const PAGE_MAP = {
  'home.md': { template: 'home.html', output: 'index.html' },
  'about.md': { template: 'about.html', output: 'about.html' },
  'blog-index.md': { template: 'blog-index.html', output: 'blog.html' },
  'contact.md': { template: 'contact.html', output: 'contact.html' },
  'downloads.md': { template: 'downloads.html', output: 'downloads.html' },
  'store.md': { template: 'store.html', output: 'store.html' },
  'tools.md': { template: 'tools.html', output: 'tools.html' },
  'videos.md': { template: 'videos.html', output: 'videos.html' },
};

// English blog posts shown as cards on the Blog Index page, in display
// order, mapped to the static files build-blog.js publishes them as. Keep
// this in sync with the OUTPUT_MAP in scripts/build-blog.js.
const BLOG_INDEX_POSTS = [
  '5-everyday-herbs.md',
  'brewing-medicinal-tea.md',
  'daily-wellness-rituals.md',
  ];

function parseFrontMatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Missing front matter block (file must start with "---").');
  }
  return YAML.parse(match[1]) || {};
}

function escapeHtml(value) {
  if (value === undefined || value === null) return '';
  return String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
}

// Renders {{#list}}...{{/list}} blocks by repeating the inner block once per
// item (substituting {{field}} from that item), then substitutes any
// remaining top-level {{field}} tokens from `data`.
function render(template, data) {
  let out = template.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (whole, key, inner) => {
    const list = Array.isArray(data[key]) ? data[key] : [];
    return list
    .map((item) => inner.replace(/\{\{(\w+)\}\}/g, (m, field) => escapeHtml(item[field])))
    .join('');
  });
  out = out.replace(/\{\{(\w+)\}\}/g, (m, field) => escapeHtml(data[field]));
  return out;
}

// Builds the "posts" list injected into the Blog Index page: one entry per
// English blog post, using the same fields as the Blog Posts CMS collection.
function loadBlogIndexPosts() {
  return BLOG_INDEX_POSTS.filter((file) => fs.existsSync(path.join(BLOG_DIR, file))).map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf8');
    const data = parseFrontMatter(raw);
    const slug = file.replace(/\.md$/, '.html');
    return { ...data, slug };
  });
}

let builtCount = 0;
for (const [mdFile, pageInfo] of Object.entries(PAGE_MAP)) {
  const template = pageInfo.template;
  const output = pageInfo.output;
  const mdPath = path.join(PAGES_DIR, mdFile);
  const templatePath = path.join(TEMPLATES_DIR, template);
  if (!fs.existsSync(mdPath)) {
    console.warn('Skipping ' + mdFile + ': content file not found at ' + mdPath);
    continue;
  }
  if (!fs.existsSync(templatePath)) {
    console.warn('Skipping ' + mdFile + ': template not found at ' + templatePath);
    continue;
  }
  const data = parseFrontMatter(fs.readFileSync(mdPath, 'utf8'));
  if (mdFile === 'blog-index.md') {
    data.posts = loadBlogIndexPosts();
  }
  const templateHtml = fs.readFileSync(templatePath, 'utf8');
  const html = render(templateHtml, data);
  fs.writeFileSync(path.join(ROOT, output), html);
  console.log('Built ' + output + ' from content/pages/' + mdFile);
  builtCount++;
}

console.log('Done. Built ' + builtCount + ' page(s).');
