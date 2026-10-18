import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://shizuru892.github.io';
const data=JSON.parse(await fs.readFile(path.join(root,'portfolio.json'),'utf8'));
const app=await fs.readFile(path.join(root,'app.js'),'utf8');
const shell=await fs.readFile(path.join(root,'index.html'),'utf8');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const absolute=p=>new URL(p,origin+'/').href;
const homeTitle='Shizuru | Pixel Art & Game Animation Portfolio';
const pages=[{route:'/',title:homeTitle,description:data.site.description},
  {route:'/about/',title:'About Shizuru | Pixel Art & Animation',description:'Meet Shizuru and explore a portfolio of pixel art environments, character sprites, creature animations, game assets and interfaces.'},
  ...data.categories.map(c=>({route:'/category/'+c.id+'/',title:c.title+' | Shizuru Pixel Art',description:c.description,category:c}))];
const hashes={};for(const name of ['styles.css','app.js','viewer.js'])hashes[name]=createHash('sha256').update(await fs.readFile(path.join(root,name))).digest('hex').slice(0,10);
const verification=(shell.match(/<meta\b[^>]*name=["']google-site-verification["'][^>]*>/gi)||[]).join('\n');
const source=app.slice(0,app.indexOf("$('#back-top').onclick"));
if(!source||!source.includes('function home()'))throw Error('Cannot find portfolio render functions');
for(const page of pages){
  const nodes=new Map();const document={title:'',querySelector:s=>{if(!nodes.has(s))nodes.set(s,{content:'',href:''});return nodes.get(s);}};
  const context={document,location:{pathname:page.route,search:'',hash:''},URLSearchParams,__data:data};
  const expression=page.category?`category(${JSON.stringify(page.category.id)})`:page.route==='/about/'?'about()':'home()';
  vm.runInNewContext(source+`\ncontent=__data;priorityIds=new Set(content.artworks.filter(a=>a.category===${JSON.stringify(page.category?.id||data.categories[0].id)}).slice(0,3).map(a=>a.id));globalThis.markup=${expression};`,context,{timeout:5000});
  const url=absolute(page.route),works=page.category?data.artworks.filter(a=>a.category===page.category.id):[];
  const preview=absolute(works.find(a=>!a.videoSrc)?.src||'assets/coast.png');
  const graph=[{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Shizuru',alternateName:'Shizuru Pixel Art Portfolio',inLanguage:'en'},
    {'@type':page.category?'CollectionPage':page.route==='/about/'?'AboutPage':'WebPage','@id':url+'#webpage',url,name:page.title,description:page.description,inLanguage:'en',isPartOf:{'@id':origin+'/#website'},primaryImageOfPage:{'@type':'ImageObject',contentUrl:preview}}];
  if(page.category){graph[1].mainEntity={'@type':'ItemList',numberOfItems:works.length,itemListElement:works.map((a,i)=>({'@type':'ListItem',position:i+1,item:{'@type':'ImageObject',name:a.title,contentUrl:absolute(a.src),description:a.alt||a.title}}))};graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Shizuru',item:origin+'/'},{'@type':'ListItem',position:2,name:page.category.title,item:url}]});}
  const schema=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
  const head=`<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${esc(page.title)}</title>\n  <meta name="description" content="${esc(page.description)}">\n  <meta name="robots" content="index, follow, max-image-preview:large">\n  <meta name="theme-color" content="#111215">\n  <link rel="canonical" href="${url}">\n  <meta property="og:site_name" content="Shizuru">\n  <meta property="og:type" content="website">\n  <meta property="og:title" content="${esc(page.title)}">\n  <meta property="og:description" content="${esc(page.description)}">\n  <meta property="og:url" content="${url}">\n  <meta property="og:image" content="${preview}">\n  <meta property="og:image:alt" content="${esc(works.find(a=>!a.videoSrc)?.alt||'Shizuru pixel art environment')}">\n  <meta name="twitter:card" content="summary_large_image">\n  <meta name="twitter:title" content="${esc(page.title)}">\n  <meta name="twitter:description" content="${esc(page.description)}">\n  <meta name="twitter:image" content="${preview}">\n  ${verification}\n  <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n  <link rel="stylesheet" href="/styles.css?v=${hashes['styles.css']}">\n  <script src="/app.js?v=${hashes['app.js']}" defer></script>\n  <script src="/viewer.js?v=${hashes['viewer.js']}" defer></script>\n  <script type="application/ld+json">${schema}</script>\n</head>`;
  const html=shell.replace(/<head>[\s\S]*?<\/head>/,head).replace(/<main\b[^>]*>[\s\S]*?<\/main>/,`<main id="main" tabindex="-1" data-prerendered="true">${context.markup}</main>`);
  if(!html.includes('data-prerendered="true"'))throw Error('Main content was not rendered');
  const dest=path.join(root,page.route==='/'?'index.html':page.route.slice(1)+'index.html');await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,html);
}
const sitemap='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'+pages.map(p=>'  <url><loc>'+esc(absolute(p.route))+'</loc>'+(p.category?data.artworks.filter(a=>a.category===p.category.id).map(a=>'<image:image><image:loc>'+esc(absolute(a.src))+'</image:loc></image:image>').join(''):'')+'</url>').join('\n')+'\n</urlset>\n';
await fs.writeFile(path.join(root,'sitemap.xml'),sitemap);
await fs.writeFile(path.join(root,'robots.txt'),'User-agent: *\nAllow: /\n\nSitemap: '+origin+'/sitemap.xml\n');
await fs.writeFile(path.join(root,'404.html'),'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page not found | Shizuru</title><link rel="stylesheet" href="/styles.css?v='+hashes['styles.css']+'"></head><body><main class="wrap message-page prose"><h1>Page not found.</h1><p>Explore the pixel art and animation portfolio.</p><a class="button" href="/">Back to Shizuru</a></main></body></html>');
console.log(`Rendered ${pages.length} pages, ${data.artworks.length} artwork sitemap entries and a custom 404.`);
