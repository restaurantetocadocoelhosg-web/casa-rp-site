// NOVIDADES — cada peça que o Marqueteiro Casa RP posta no Instagram vira UMA página no site.
// Fonte: novidades.json que o próprio robô (n8n) atualiza no bucket público após cada post.
// Uso: node ferramentas/novidades.mjs [arquivo-local.json]   (sem argumento, baixa a fonte)
// Só ADICIONA/ATUALIZA páginas: se a fonte falhar ou vier vazia, nada é apagado.
import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { PAGINAS } from './paginas.mjs';
import { RAIZ, SITE, esc, wpp, documento } from './layout.mjs';

const BASE_SUPABASE = 'https://zuwdgyvbuaocbzckhhlm.supabase.co/storage/v1/object/public/posts-instagram/rp_resistencias/';
export const FONTE = `${BASE_SUPABASE}site/novidades.json`;
const MAX_ITENS = 500;
const MAX_FOTO = 8 * 1024 * 1024;
const TEMPO_FOTO_MS = 30000;
const MAX_LEGENDA = 4000;
const MAX_FONTE = 3 * 1024 * 1024;
// Trava contra enxurrada: se a fonte for adulterada, no máximo isto entra no ar por dia.
const MAX_NOVAS_POR_RODADA = 20;
// Corta por caractere (code point): slice() comum pode partir um emoji ao meio e quebrar o encodeURIComponent.
const cortar = (s, n) => Array.from(String(s)).slice(0, n).join('');

// Qual página de produto cada post reforça (link interno = SEO). Ordem importa: o primeiro que casar.
const TERMOS = [
  // Linhas específicas antes das genéricas: "Termostato para fritadeira" é termostato, "forno mufla" não é forno industrial.
  ['termostato-controlador', /termostato|controlador|robertshaw/i],
  ['resistencia-pipoqueira', /pipoqueira|pipoca/i],
  ['resistencia-churrasqueira-eletrica', /churrasqueira/i],
  ['resistencia-degelo-camara-fria', /degelo|c[aâ]mara fria/i],
  ['resistencia-forno-mufla', /mufla/i],
  ['resistencia-tubo-de-quartzo', /quartzo|infravermelh/i],
  ['resistencia-cartucho', /cartucho/i],
  ['aquecedor-piscina-caixa-dagua', /piscina|caixa d.?[aá]gua/i],
  ['resistencia-chapeada-inox', /chapead|bifeteira/i],
  ['resistencia-circular', /circular/i],
  ['resistencia-flangeada-caldeira', /flangead|caldeira/i],
  ['resistencia-forno-eletrico-domestico', /forno (el[eé]trico )?dom[eé]stico|embutir|nardelli/i],
  ['resistencia-forno-industrial', /forno|turbo|padaria|pizz/i],
  ['resistencia-fritadeira-eletrica', /fritadeira|fritura/i],
  ['resistencia-banho-maria', /banho[- ]?maria|self[- ]?service/i],
  ['resistencia-cafeteira', /cafeteira|caf[eé]/i],
  ['resistencia-autoclave', /autoclave/i],
  ['resistencia-secadora-hospitalar', /secadora/i],
  ['resistencia-imersao-boiler', /imers[aã]o|boiler/i],
  ['resistencia-mica', /\bmica\b|injetora|extrusora/i],
  ['resistencia-sauna-seca', /sauna/i],
  ['resistencia-chuveiro-lorenzetti', /chuveiro|ducha|lorenzetti|\bfame\b|\bcorona\b|\bhydra\b/i],
  ['fio-resistencia', /\bfio\b/i],
  ['resistencia-tubular', /tubular|ondulad|barra reta/i],
  ['resistencia-aletada-estufa', /aletad|estufa/i],
];

// Produto da loja que ainda não tem página própria: vira novidade, mas sem botão "ver linha".
const SEM_PAGINA = /acendedor/i;

export function paginaRelacionada(texto) {
  if (SEM_PAGINA.test(texto)) return null;
  const achado = TERMOS.find(([, re]) => re.test(texto));
  return achado ? PAGINAS.find((p) => p.slug === achado[0]) : null;
}
const ehDeProduto = (texto) => SEM_PAGINA.test(texto) || !!paginaRelacionada(texto);

const MAX_TITULO = 90;
// Título do Instagram → título de página: 1ª frase se a linha for longa, sem cortar palavra,
// e sem TUDO EM MAIÚSCULAS (no Google parece grito e o site já usa caixa alta no visual).
export function arrumarTitulo(linha) {
  let t = String(linha).replace(/[*_]/g, '').trim();
  if (t === t.toLocaleUpperCase('pt-BR') && /[A-ZÀ-Ú]{4}/.test(t)) {
    t = t.toLocaleLowerCase('pt-BR').replace(/^\p{L}/u, (c) => c.toLocaleUpperCase('pt-BR'))
      .replace(/(?<![\p{L}\p{N}])(rp|fame|lorenzetti|corona|hydra|bella ducha|4t)(?![\p{L}\p{N}])/giu,
        (m) => ({ rp: 'RP', fame: 'FAME', '4t': '4T' }[m.toLowerCase()] || m.replace(/(^|\s)\p{L}/gu, (c) => c.toUpperCase())));
  }
  if (Array.from(t).length > MAX_TITULO) {
    // Corta na 1ª frase (ponto, não dois-pontos: "Tubular U:" sozinho não diz nada).
    const frase = t.match(/^(.{25,}?[.!?])\s/u);
    if (frase && Array.from(frase[1]).length <= MAX_TITULO) t = frase[1];
    else t = cortar(t, MAX_TITULO).replace(/\s+\S*$/, '') + '…';
  }
  return t.replace(/[.:!]+$/, '').trim();
}

/** Legenda do Instagram → { titulo, paragrafos }: sem hashtags, sem bloco de contato. */
export function limparLegenda(legenda) {
  // Linhas do bloco de contato que o robô sempre põe no fim (com fronteira: "Segurança" e "Sabores" ficam).
  const CONTATO = /^(whats\s*app\b|shopee\b|r\.\s|rua\s|seg(unda)?\s*(-|a\b|à|–|\.)|s[aá]b(ado)?\.?\s*\d|tel(efone)?\s*[:.]|instagram\s*:|📍|📱|📞|🕗)/iu;
  const linhas = String(legenda || '').replace(/\r/g, '').split('\n')
    .map((l) => l.replace(/(^|\s)#[\p{L}\p{N}_]+/gu, ' ').replace(/\s{2,}/g, ' ').trim())
    .filter((l) => l && !CONTATO.test(l) && !/^[#\s]*$/.test(l));
  if (!linhas.length) return null;
  const titulo = arrumarTitulo(linhas[0]);
  const paragrafos = linhas.slice(1).map((l) => l.replace(/[*_]/g, '')).filter((l) => l.length > 2).slice(0, 12);
  return titulo.length >= 8 ? { titulo, paragrafos } : null;
}

export const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'novidade';

// Slug estável: o final (hash do arquivo) identifica a página. Se já existe uma pasta com esse
// final, ela é reaproveitada — mudar a legenda/limpeza não cria URL nova nem página órfã.
const hashDe = (item) => createHash('sha1').update(String(item.arquivo)).digest('hex').slice(0, 5);
export const slugDe = (item, titulo, existentes = []) =>
  existentes.find((d) => d.endsWith(`-${hashDe(item)}`)) || `${slugify(titulo)}-${hashDe(item)}`;

/**
 * Lista válida de itens da fonte. O endereço da foto NÃO é lido da fonte: é remontado a partir
 * do nome validado, então "../" ou outro bucket no JSON nunca são baixados.
 */
export function validarFonte(dados) {
  const itens = Array.isArray(dados?.itens) ? dados.itens.slice(0, MAX_ITENS) : [];
  return itens
    .filter((i) => i && typeof i.arquivo === 'string' && /^[\w-][\w.-]{0,120}\.(jpe?g|png|webp)$/i.test(i.arquivo) && !i.arquivo.includes('..')
      && typeof i.legenda === 'string' && i.legenda.length <= MAX_LEGENDA && !/toca do coelho/i.test(i.legenda)
      && /^\d{4}-\d{2}-\d{2}$/.test(String(i.data || '')))
    .map((i) => ({ arquivo: i.arquivo, legenda: i.legenda, data: i.data, imagem: `${BASE_SUPABASE}biblioteca/${encodeURIComponent(i.arquivo)}` }));
}

// Assinatura real do arquivo (não confia só no content-type do servidor).
const ehImagem = (b) => (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff)
  || (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47)
  || (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP');

const dataBR = (iso) => iso.split('-').reverse().join('/');

export function paginaNovidade(item, conteudo, slug, foto) {
  const url = `${SITE}/novidades/${slug}/`;
  const rel = paginaRelacionada(`${conteudo.titulo} ${conteudo.paragrafos.join(' ')}`);
  const descricao = cortar(conteudo.paragrafos[0] || conteudo.titulo, 155);
  const msg = `Olá! Vi a novidade "${cortar(conteudo.titulo, 60)}" no site e quero um orçamento.`;
  const ld = [{
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: conteudo.titulo, datePublished: item.data, image: `${url}${foto}`, url,
    author: { '@id': `${SITE}/#loja` }, publisher: { '@id': `${SITE}/#loja` },
  }];
  const corpo = `  <nav class="wrap migalha" aria-label="Você está em"><a href="/">Início</a> › <a href="/novidades/">Novidades</a> › <span>${esc(conteudo.titulo)}</span></nav>

  <article class="wrap novidade">
    <p class="eyebrow">Novidade · <time datetime="${esc(item.data)}">${esc(dataBR(item.data))}</time></p>
    <h1>${esc(conteudo.titulo)}</h1>
    <div class="risco" aria-hidden="true"></div>
    <div class="novidade-grid">
      <img src="${esc(foto)}" alt="${esc(conteudo.titulo)} — Casa RP Resistências, Niterói" loading="eager" />
      <div>
${conteudo.paragrafos.map((p) => `        <p>${esc(p)}</p>`).join('\n')}
${rel ? `        <p><a class="btn btn-borda" href="/${rel.slug}/">Ver ${esc(rel.ancora || `resistência para ${rel.curto.toLowerCase()}`)}</a></p>` : ''}
        <div class="acoes">
          <a class="btn btn-wpp" href="${esc(wpp(msg))}" target="_blank" rel="noopener">Pedir orçamento no WhatsApp</a>
        </div>
      </div>
    </div>
  </article>`;
  return documento({ titulo: conteudo.titulo, descricao, url, imagem: `${url}${foto}`, ld, msg, corpo, tipoOg: 'article' });
}

export function paginaIndice(lista) {
  const url = `${SITE}/novidades/`;
  const corpo = `  <nav class="wrap migalha" aria-label="Você está em"><a href="/">Início</a> › <span>Novidades</span></nav>

  <section aria-labelledby="titulo">
    <div class="wrap">
      <p class="eyebrow">Casa RP Resistências · Niterói (RJ)</p>
      <h1 id="titulo">Novidades e <em>dicas</em> de resistências</h1>
      <div class="risco" aria-hidden="true"></div>
${lista.length ? `      <ul class="novidades-lista">
${lista.map((n) => `        <li><a href="/novidades/${n.slug}/"><img src="/novidades/${n.slug}/${n.foto}" alt="" loading="lazy" /><span><time datetime="${esc(n.data)}">${esc(dataBR(n.data))}</time>${esc(n.titulo)}</span></a></li>`).join('\n')}
      </ul>` : '      <p class="muted">Em breve.</p>'}
    </div>
  </section>`;
  return documento({
    titulo: 'Novidades — resistências elétricas em Niterói (RJ)',
    descricao: 'Novidades, lançamentos e dicas da Casa RP Resistências: resistências para fornos, fritadeiras, banho-maria, sauna, chuveiros e peças sob medida em Niterói.',
    url, imagem: `${SITE}/img/catalogo.jpg`, msg: 'Olá! Vim pelas novidades do site e quero um orçamento.', corpo,
  });
}

async function baixarFoto(urlFoto, destino, baixar) {
  if (existsSync(destino)) return true;
  let r;
  try { r = await baixar(urlFoto); } catch { return false; } // uma foto ruim não derruba a rodada
  const tipo = r.headers.get('content-type') || '';
  if (!r.ok || !/^image\/(jpeg|png|webp)/.test(tipo)) return false;
  if (Number(r.headers.get('content-length') || 0) > MAX_FOTO) return false; // nem começa a baixar
  const buf = Buffer.from(await r.arrayBuffer());
  if (!buf.length || buf.length > MAX_FOTO || !ehImagem(buf)) return false;
  writeFileSync(destino, buf);
  return true;
}

/** Gera tudo. `baixar` é injetável para teste (padrão: fetch). Devolve um resumo. */
export async function gerarNovidades(dados, { raiz = RAIZ, baixar = (u) => fetch(u, { signal: AbortSignal.timeout(TEMPO_FOTO_MS), redirect: 'error' }) } = {}) {
  const itens = validarFonte(dados);
  const pasta = join(raiz, 'novidades');
  mkdirSync(pasta, { recursive: true });
  const existentes = readdirSync(pasta, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const lista = [];
  let novas = 0, semFoto = 0, adiadas = 0;
  for (const item of itens) {
    const conteudo = limparLegenda(item.legenda);
    // Só vira página o post que fala de produto (bom dia/frase motivacional não ajuda no Google).
    if (!conteudo || !ehDeProduto(`${conteudo.titulo} ${conteudo.paragrafos.join(' ')}`)) continue;
    const slug = slugDe(item, conteudo.titulo, existentes);
    const dir = join(pasta, slug);
    const foto = `foto.${item.arquivo.split('.').pop().toLowerCase().replace('jpeg', 'jpg')}`;
    const jaExistia = existsSync(join(dir, 'index.html'));
    if (!jaExistia && novas >= MAX_NOVAS_POR_RODADA) { adiadas++; continue; }
    // Pasta só nasce junto com a foto: pasta vazia viraria endereço 404 no sitemap.
    const temp = join(pasta, `.baixando-${slug}`);
    let temFoto = existsSync(join(dir, foto));
    if (!temFoto) {
      temFoto = await baixarFoto(item.imagem, temp, baixar);
      if (temFoto) { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, foto), readFileSync(temp)); }
      if (existsSync(temp)) rmSync(temp);
    }
    if (!temFoto) { semFoto++; if (jaExistia) lista.push({ slug, foto, data: item.data, titulo: conteudo.titulo }); continue; }
    writeFileSync(join(dir, 'index.html'), paginaNovidade(item, conteudo, slug, foto));
    if (!jaExistia) novas++;
    lista.push({ slug, foto, data: item.data, titulo: conteudo.titulo });
  }
  // Índice com o que está no disco nesta rodada (mais recente primeiro). Fonte vazia não apaga o índice antigo.
  if (lista.length || !existsSync(join(pasta, 'index.html'))) {
    lista.sort((a, b) => b.data.localeCompare(a.data) || a.slug.localeCompare(b.slug));
    writeFileSync(join(pasta, 'index.html'), paginaIndice(lista));
  }
  return { fonte: itens.length, paginas: lista.length, novas, semFoto, adiadas };
}

// Execução direta
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const local = process.argv[2];
  let dados;
  if (local) dados = JSON.parse(readFileSync(local, 'utf8'));
  else {
    const r = await fetch(`${FONTE}?t=${Date.now()}`);
    // Aviso amarelo no GitHub (não vermelho): o robô ainda não gerou a fonte ou o bucket caiu.
    if (!r.ok) { console.log(`::warning::fonte de novidades indisponível (HTTP ${r.status}) — nada foi alterado`); process.exit(0); }
    const texto = await r.text();
    if (texto.length > MAX_FONTE) { console.log('::warning::fonte de novidades grande demais — nada foi alterado'); process.exit(0); }
    dados = JSON.parse(texto);
  }
  console.log('novidades:', JSON.stringify(await gerarNovidades(dados)));
}
