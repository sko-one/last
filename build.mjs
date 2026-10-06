// build.mjs: runs on Netlify at every deploy (see netlify.toml). Needs only Node, no packages.
//
// Reads index.html, then writes the finished site to dist/:
//   - one HTML file per page (/about, /architecture, /project/fluxveil, …), each with its own
//     title, description, share image and structured data, plus the page text already in the HTML
//   - 404.html, sitemap.xml and robots.txt
//   - a copy of everything else in the repository (images/, favicon.svg, …)
//
// You keep editing only index.html; nothing in this file needs to change when projects are added.

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

const OUT = "dist";
const SKIP = new Set([OUT, ".git", ".github", "node_modules", ".netlify", "build.mjs", "netlify.toml", "README.md", ".gitignore", ".DS_Store"]);

const template = readFileSync("index.html", "utf8");

// The site data and the SEO helpers live in index.html, between "const SITE" and "SEO:END"
const start = template.indexOf("const SITE = "), end = template.indexOf("/* SEO:END */");
if (start < 0 || end < 0) throw new Error("index.html: could not find the SITE data or the SEO:END marker");
const { SITE, seoFor, seoHead, SEO, ORIGIN } =
  new Function(template.slice(start, end) + "\nreturn { SITE, seoFor, seoHead, SEO, ORIGIN };")();

/* ---------- page text written straight into the HTML (the page script replaces it on load) ---------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const bg = v => (v && typeof v === "object" && !Array.isArray(v)) ? (v.bg ?? v.en) : v;
const rich = t => esc(t).replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
const cats = p => p.categories.map(c => bg(SITE.categories[c]) || c).join(", ");
const img = (src, alt) => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy">` : "";

function listing(title, list){
  return `<section class="listing"><h1>${esc(title)}</h1><ul class="grid">${list.map(p => `
    <li class="card"><a href="/project/${esc(p.slug)}">${img(p.thumb || p.cover, p.title)}<h2>${esc(p.title)}</h2><div class="cats">${esc(cats(p))}</div></a></li>`).join("")}
  </ul></section>`;
}

function mainFor(page, arg){
  if (!page) return listing(bg(SEO.home.h1), SITE.projects);
  if (SITE.sections[page]) {
    const label = bg(SITE.nav.find(n => n.route === page).label);
    return listing(label, SITE.projects.filter(p => p.categories.some(c => SITE.sections[page].includes(c))));
  }
  if (page === "about") return `<section class="about"><h1>${esc(bg(SITE.nav.find(n => n.route === "about").label))}</h1>
    ${img(SITE.about.portrait, SEO.founder.name)}
    ${(bg(SITE.about.paragraphs) || []).map(t => `<p>${rich(t)}</p>`).join("\n")}</section>`;
  if (page === "contacts") {
    const c = SITE.contacts;
    return `<section class="contacts"><h1>${esc(bg(SITE.nav.find(n => n.route === "contacts").label))}</h1>
      <p>${esc(SITE.name)} – ${esc(SEO.founder.name)}</p>
      <p>${esc(bg(c.address))}</p>
      <p><a href="mailto:${esc(c.email)}">${esc(c.email)}</a> · <a href="tel:${esc(c.phone.replace(/\s/g, ""))}">${esc(c.phone)}</a></p></section>`;
  }
  if (page === "project") {
    const p = SITE.projects.find(x => x.slug === arg);
    const facts = [cats(p), bg(p.location), p.year].filter(Boolean).join(" · ");
    const pics = [p.cover, ...(p.gallery || [])].filter(Boolean);
    return `<article class="project"><h1>${esc(p.title)}</h1><p>${esc(facts)}</p>
      ${(bg(p.description) || []).map(t => `<p>${rich(t)}</p>`).join("\n")}
      ${p.link ? `<p><a href="${esc(p.link)}" target="_blank" rel="noopener">${esc(p.link)}</a></p>` : ""}
      ${pics.map((src, i) => img(src, `${p.title} – ${i + 1}`)).join("\n")}</article>`;
  }
  return `<p class="empty">Тази страница не съществува. <a href="/">Виж всички проекти</a></p>`;
}

const navLinks = SITE.nav.map(n => `<a href="/${esc(n.route)}" data-route="${esc(n.route)}">${esc(bg(n.label))}</a>`).join("");

function pageHtml(path){
  const [page = "", arg = ""] = path.replace(/^\/+/, "").split("/");
  return template
    .replace(/<!-- SEO -->[\s\S]*?<!-- \/SEO -->/, `<!-- SEO -->\n${seoHead(seoFor(path, "bg"))}\n<!-- /SEO -->`)
    .replace('<nav class="nav" id="nav"></nav>', `<nav class="nav" id="nav">${navLinks}</nav>`)
    .replace('<main id="app" tabindex="-1"></main>', `<main id="app" tabindex="-1">${mainFor(page, arg)}</main>`);
}

function write(file, text){
  const f = join(OUT, file);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, text);
}

/* ---------- build ---------- */
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const name of readdirSync(".")) if (!SKIP.has(name) && name !== "index.html") cpSync(name, join(OUT, name), { recursive: true });

const routes = ["/", ...SITE.nav.map(n => "/" + n.route), ...SITE.projects.map(p => "/project/" + p.slug)];
for (const r of routes) write(r === "/" ? "index.html" : r.slice(1) + ".html", pageHtml(r));
write("404.html", pageHtml("/404"));

const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(r => `  <url><loc>${ORIGIN}${r}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`);

console.log(`Built ${routes.length} pages + 404.html, sitemap.xml, robots.txt into ${OUT}/`);
