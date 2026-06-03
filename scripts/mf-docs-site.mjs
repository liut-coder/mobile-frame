import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const outputDir = path.join(repoRoot, 'docs-site');
const outputPath = path.join(outputDir, 'index.html');

const documents = [
  {
    path: 'README.md',
    category: 'Start',
    summary: 'Project scope, setup commands, validation commands, and workspace map.'
  },
  {
    path: 'docs/usage-guide.zh-CN.md',
    category: 'Start',
    summary: 'Chinese usage guide for setup, generators, native checks, and handoff rules.'
  },
  {
    path: 'docs/mobile-frame-改造与多App接入方案.md',
    category: 'Plan',
    summary: 'Main transformation plan, target architecture, delivery phases, and acceptance checklist.'
  },
  {
    path: 'docs/game-helper-admin-mobile-mobile-frame-adaptation.md',
    category: 'Plan',
    summary: 'Game-helper admin mobile adaptation plan, boundaries, pages, admin components, realtime, logs, and mobile BFF scope.'
  },
  {
    path: 'docs/architecture.md',
    category: 'Foundation',
    summary: 'Workspace boundaries, app relationships, runtime layering, and verification scope.'
  },
  {
    path: 'docs/design-system.md',
    category: 'Foundation',
    summary: 'Design token, UI core, UI native, and screen template usage.'
  },
  {
    path: 'docs/create-app.md',
    category: 'Generators',
    summary: 'App generator usage, presets, generated file structure, and validation evidence.'
  },
  {
    path: 'docs/presets.md',
    category: 'Generators',
    summary: 'Canonical presets, extension presets, preset data contracts, and generation rules.'
  },
  {
    path: 'docs/native-contracts.md',
    category: 'Native',
    summary: 'TypeScript-facing native capability contracts, mocks, and compatibility boundary.'
  },
  {
    path: 'docs/release.md',
    category: 'Release',
    summary: 'Local validation, GitHub Actions workflow, Android/iOS build prerequisites, and release gates.'
  },
  {
    path: 'docs/mobile-frame-product-overview.md',
    category: 'Reference',
    summary: 'Product positioning, target users, product value, feature scope, and success criteria.'
  },
  {
    path: 'docs/mobile-frame-landing-plan.md',
    category: 'Reference',
    summary: 'Showcase UI and interaction implementation plan for landing flows and component work.'
  },
  {
    path: 'mobile-frame-wireframes.md',
    category: 'Reference',
    summary: 'Wireframes and interaction notes used as visual acceptance references.'
  },
  {
    path: 'mobile-frame-通用移动端原生脚手架设计方案.md',
    category: 'Reference',
    summary: 'Original scaffold design proposal retained for historical context.'
  }
];

const args = process.argv.slice(2);
const mode = getMode(args);

for (const document of documents) {
  const absolutePath = path.join(repoRoot, document.path);
  if (!fs.existsSync(absolutePath)) {
    fail(`missing documentation source: ${document.path}`);
  }
}

const html = renderSite();

if (mode === 'check') {
  checkSite(html);
} else {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`docs site written to ${path.relative(repoRoot, outputPath)}`);
}

function getMode(values) {
  if (values.length === 0 || values.includes('--build')) {
    return 'build';
  }

  if (values.includes('--check')) {
    return 'check';
  }

  fail(`unknown docs-site argument(s): ${values.join(' ')}`);
}

function checkSite(expectedHtml) {
  if (!fs.existsSync(outputPath)) {
    fail('docs site is missing; run pnpm run mf:docs-site');
  }

  const currentHtml = fs.readFileSync(outputPath, 'utf8').replace(/\r\n/g, '\n');
  if (currentHtml !== expectedHtml) {
    fail('docs site is out of date; run pnpm run mf:docs-site');
  }

  for (const document of documents) {
    const sourceHref = sourceLink(document.path);
    const articleId = `id="${slugForPath(document.path)}"`;
    if (!currentHtml.includes(`href="${sourceHref}"`)) {
      fail(`docs site missing source link for ${document.path}`);
    }
    if (!currentHtml.includes(articleId)) {
      fail(`docs site missing article for ${document.path}`);
    }
  }

  console.log('docs site check passed');
}

function renderSite() {
  const renderedDocuments = documents.map((document) => renderDocument(document));
  const categories = groupByCategory(renderedDocuments);

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>MobileFrame Docs</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f7f8fb;
      --surface: #ffffff;
      --surface-soft: #eef4ff;
      --text: #172033;
      --muted: #5e6a7d;
      --line: #dbe2ec;
      --blue: #2f6fff;
      --green: #138a5b;
      --amber: #ad6b00;
      --code-bg: #111827;
      --code-text: #eef2ff;
      --shadow: 0 14px 40px rgba(23, 32, 51, 0.08);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }

    a {
      color: var(--blue);
      text-decoration: none;
    }

    a:hover {
      text-decoration: underline;
    }

    .site-header {
      background: var(--surface);
      border-bottom: 1px solid var(--line);
    }

    .site-header-inner {
      max-width: 1180px;
      margin: 0 auto;
      padding: 40px 24px 32px;
    }

    .eyebrow {
      margin: 0 0 10px;
      color: var(--green);
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: clamp(32px, 5vw, 54px);
      line-height: 1.05;
    }

    .lead {
      max-width: 760px;
      margin: 18px 0 0;
      color: var(--muted);
      font-size: 18px;
    }

    .quick-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 24px;
    }

    .quick-links a,
    .source-link {
      display: inline-flex;
      align-items: center;
      min-height: 36px;
      padding: 7px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      color: var(--text);
      font-size: 14px;
      font-weight: 600;
    }

    .shell {
      display: grid;
      grid-template-columns: 280px minmax(0, 1fr);
      gap: 28px;
      max-width: 1180px;
      margin: 0 auto;
      padding: 28px 24px 56px;
    }

    .sidebar {
      position: sticky;
      top: 16px;
      align-self: start;
      max-height: calc(100vh - 32px);
      overflow: auto;
      padding: 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .sidebar h2 {
      margin: 0 0 12px;
      font-size: 16px;
    }

    .sidebar-group {
      margin-top: 16px;
    }

    .sidebar-group-title {
      margin: 0 0 6px;
      color: var(--amber);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .sidebar a {
      display: block;
      padding: 6px 0;
      color: var(--muted);
      font-size: 14px;
    }

    .docs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }

    .doc-card {
      min-height: 168px;
      padding: 18px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .doc-card p {
      margin: 8px 0 14px;
      color: var(--muted);
      font-size: 14px;
    }

    .doc-card h2 {
      margin: 0;
      font-size: 19px;
      line-height: 1.25;
    }

    .category-pill {
      display: inline-flex;
      margin-bottom: 10px;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--surface-soft);
      color: var(--blue);
      font-size: 12px;
      font-weight: 700;
    }

    .doc-article {
      margin-top: 28px;
      padding: 28px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }

    .article-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
      color: var(--muted);
      font-size: 14px;
    }

    .doc-article h1,
    .doc-article h2,
    .doc-article h3,
    .doc-article h4 {
      scroll-margin-top: 18px;
      line-height: 1.25;
    }

    .doc-article h1 {
      margin: 0 0 18px;
      font-size: 30px;
    }

    .doc-article h2 {
      margin-top: 34px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      font-size: 24px;
    }

    .doc-article h3 {
      margin-top: 26px;
      font-size: 20px;
    }

    .doc-article h4 {
      margin-top: 22px;
      font-size: 17px;
    }

    .doc-article p,
    .doc-article li {
      color: var(--text);
    }

    .doc-article blockquote {
      margin: 16px 0;
      padding: 12px 16px;
      border-left: 4px solid var(--blue);
      background: var(--surface-soft);
      color: var(--muted);
    }

    .doc-article code {
      border-radius: 6px;
      background: #eef1f6;
      padding: 2px 5px;
      color: #263143;
      font-size: 0.94em;
    }

    .doc-article pre {
      overflow-x: auto;
      margin: 18px 0;
      padding: 16px;
      border-radius: 8px;
      background: var(--code-bg);
      color: var(--code-text);
    }

    .doc-article pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 18px 0;
      font-size: 14px;
    }

    th,
    td {
      border: 1px solid var(--line);
      padding: 9px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: var(--surface-soft);
    }

    @media (max-width: 860px) {
      .shell {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        max-height: none;
      }

      .doc-article {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <header class="site-header" id="top">
    <div class="site-header-inner">
      <p class="eyebrow">MobileFrame Documentation</p>
      <h1>React Native Bare + TypeScript mobile scaffold</h1>
      <p class="lead">This static documentation site is generated from the repository markdown files. It gives teams one browser-openable entry for architecture, design system, generators, native contracts, release gates, and the active transformation plan.</p>
      <nav class="quick-links" aria-label="Primary links">
        <a href="#documents">Documents</a>
        <a href="#${slugForPath('docs/mobile-frame-改造与多App接入方案.md')}">Transformation Plan</a>
        <a href="#${slugForPath('docs/release.md')}">Release Gates</a>
        <a href="${sourceLink('README.md')}">README Source</a>
      </nav>
    </div>
  </header>
  <main class="shell">
    <aside class="sidebar" aria-label="Document navigation">
      <h2>Docs</h2>
${renderSidebar(categories)}
    </aside>
    <section>
      <section id="documents" class="docs-grid" aria-label="Document cards">
${renderCards(renderedDocuments)}
      </section>
${renderedDocuments.map((document) => document.articleHtml).join('\n')}
    </section>
  </main>
</body>
</html>
`;
}

function renderDocument(document) {
  const markdown = fs.readFileSync(path.join(repoRoot, document.path), 'utf8');
  const title = firstHeading(markdown) ?? document.path;
  const slug = slugForPath(document.path);

  return {
    ...document,
    title,
    slug,
    articleHtml: `<article class="doc-article" id="${slug}">
  <div class="article-meta">
    <span class="category-pill">${escapeHtml(document.category)}</span>
    <a class="source-link" href="${sourceLink(document.path)}">Open source Markdown</a>
  </div>
${markdownToHtml(markdown, slug, document.path)}
</article>`
  };
}

function renderSidebar(categories) {
  return Array.from(categories.entries())
    .map(([category, categoryDocuments]) => {
      const links = categoryDocuments.map((document) => `      <a href="#${document.slug}">${escapeHtml(document.title)}</a>`).join('\n');
      return `      <div class="sidebar-group">
        <p class="sidebar-group-title">${escapeHtml(category)}</p>
${links}
      </div>`;
    })
    .join('\n');
}

function renderCards(renderedDocuments) {
  return renderedDocuments
    .map(
      (document) => `        <article class="doc-card">
          <span class="category-pill">${escapeHtml(document.category)}</span>
          <h2><a href="#${document.slug}">${escapeHtml(document.title)}</a></h2>
          <p>${escapeHtml(document.summary)}</p>
          <a class="source-link" href="${sourceLink(document.path)}">Source</a>
        </article>`
    )
    .join('\n');
}

function groupByCategory(renderedDocuments) {
  const categories = new Map();
  for (const document of renderedDocuments) {
    if (!categories.has(document.category)) {
      categories.set(document.category, []);
    }
    categories.get(document.category).push(document);
  }
  return categories;
}

function markdownToHtml(markdown, documentSlug, documentPath) {
  const lines = markdown.split(/\r?\n/);
  const html = [];
  const paragraph = [];
  let codeLines = null;
  let codeLanguage = '';
  let listType = null;
  let tableRows = [];
  let headingIndex = 0;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '');
    const trimmed = line.trim();

    if (codeLines) {
      if (trimmed.startsWith('```')) {
        const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
        html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        codeLines = null;
        codeLanguage = '';
      } else {
        codeLines.push(rawLine);
      }
      continue;
    }

    if (trimmed.startsWith('```')) {
      closeParagraph();
      closeList();
      closeTable();
      codeLines = [];
      codeLanguage = trimmed.slice(3).trim().split(/\s+/)[0] ?? '';
      continue;
    }

    if (trimmed.length === 0) {
      closeParagraph();
      closeList();
      closeTable();
      continue;
    }

    const tableRow = parseTableRow(trimmed);
    if (tableRow) {
      closeParagraph();
      closeList();
      tableRows.push(tableRow);
      continue;
    }

    closeTable();

    const heading = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (heading) {
      closeParagraph();
      closeList();
      headingIndex += 1;
      const level = heading[1].length;
      const id = `${documentSlug}-heading-${headingIndex}`;
      html.push(`<h${level} id="${id}">${renderInline(heading[2], documentPath)}</h${level}>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      closeParagraph();
      closeList();
      html.push('<hr />');
      continue;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unordered) {
      closeParagraph();
      openList('ul');
      html.push(`<li>${renderInline(unordered[1], documentPath)}</li>`);
      continue;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      closeParagraph();
      openList('ol');
      html.push(`<li>${renderInline(ordered[1], documentPath)}</li>`);
      continue;
    }

    const quote = /^>\s?(.+)$/.exec(trimmed);
    if (quote) {
      closeParagraph();
      closeList();
      html.push(`<blockquote>${renderInline(quote[1], documentPath)}</blockquote>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  if (codeLines) {
    const languageClass = codeLanguage ? ` class="language-${escapeHtml(codeLanguage)}"` : '';
    html.push(`<pre><code${languageClass}>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  }

  closeParagraph();
  closeList();
  closeTable();

  return html.map((line) => `  ${line}`).join('\n');

  function closeParagraph() {
    if (paragraph.length === 0) {
      return;
    }
    html.push(`<p>${renderInline(paragraph.join(' '), documentPath)}</p>`);
    paragraph.length = 0;
  }

  function openList(type) {
    if (listType === type) {
      return;
    }
    closeList();
    listType = type;
    html.push(`<${type}>`);
  }

  function closeList() {
    if (!listType) {
      return;
    }
    html.push(`</${listType}>`);
    listType = null;
  }

  function closeTable() {
    if (tableRows.length === 0) {
      return;
    }

    const rows = tableRows.filter((row) => row !== 'separator');
    if (rows.length === 0) {
      tableRows = [];
      return;
    }

    const [header, ...bodyRows] = rows;
    const headerHtml = header.map((cell) => `<th>${renderInline(cell, documentPath)}</th>`).join('');
    const bodyHtml = bodyRows
      .map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell, documentPath)}</td>`).join('')}</tr>`)
      .join('');

    html.push(`<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
    tableRows = [];
  }
}

function parseTableRow(line) {
  if (!line.startsWith('|') || !line.endsWith('|')) {
    return null;
  }

  const cells = line
    .slice(1, -1)
    .split('|')
    .map((cell) => cell.trim());

  if (cells.every((cell) => /^:?-{3,}:?$/.test(cell))) {
    return 'separator';
  }

  return cells;
}

function renderInline(text, documentPath) {
  const parts = text.split(/(`[^`]*`)/g);
  return parts
    .map((part) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return `<code>${escapeHtml(part.slice(1, -1))}</code>`;
      }

      return escapeHtml(part)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
          return `<a href="${normalizeMarkdownLink(href, documentPath)}">${label}</a>`;
        });
    })
    .join('');
}

function normalizeMarkdownLink(href, documentPath) {
  if (/^(https?:|mailto:|#)/.test(href)) {
    return escapeHtml(href);
  }

  const [target, anchor = ''] = href.split('#');
  const normalizedTarget = path.posix.normalize(path.posix.join(path.posix.dirname(documentPath), target));
  const normalizedHref = target ? sourceLink(normalizedTarget) : '';
  return `${normalizedHref}${anchor ? `#${anchor}` : ''}`;
}

function sourceLink(relativePath) {
  return encodeURI(`../${relativePath.replace(/\\/g, '/')}`);
}

function firstHeading(markdown) {
  const match = /^#\s+(.+)$/m.exec(markdown);
  return match?.[1].trim();
}

function slugForPath(relativePath) {
  return `doc-${relativePath
    .toLowerCase()
    .replace(/\\/g, '/')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
