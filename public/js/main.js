import { aoMudar, mesclar, ajuste, concursos, concurso, principais, apostila, kitDe, comKit, preco, planoAvulso, planoKit } from "./catalogo.js";
import { abrirModal } from "./modal.js";
import { moeda, esc, capaHtml } from "./util.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const atraso = (ms) => new Promise((resolver) => setTimeout(resolver, ms));
const comTimeout = (promessa, ms) =>
  Promise.race([promessa, new Promise((_, rejeitar) => setTimeout(() => rejeitar(new Error("tempo esgotado")), ms))]);
const linkWhatsapp = (texto) => `https://wa.me/${ajuste("whatsapp")}?text=${encodeURIComponent(texto)}`;

/* ---------- Textos e contatos editáveis pelo admin ---------- */
const blocosFaq = (texto) =>
  texto
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim().split("\n"))
    .filter(([pergunta]) => pergunta)
    .map(([pergunta, ...resposta]) => ({ pergunta: pergunta.trim(), resposta: resposta.join(" ").trim() }));

/* 5592984478798 -> (92) 98447-8798 */
const telefoneBonito = (numero) => {
  const local = numero.replace(/^55/, "");
  return local.length < 10 ? local : `(${local.slice(0, 2)}) ${local.slice(2, -4)}-${local.slice(-4)}`;
};

const preencherAjustes = () => {
  $$("[data-pix-chave]").forEach((el) => (el.textContent = ajuste("pixChave")));
  $$("[data-pix-tipo]").forEach((el) => (el.textContent = ajuste("pixTipo")));
  $$("[data-pix-favorecido]").forEach((el) => (el.textContent = ajuste("pixFavorecido")));
  $$("[data-whatsapp]").forEach((el) => (el.href = linkWhatsapp(el.dataset.whatsapp)));
  $$("[data-prazo]").forEach((el) => (el.textContent = ajuste("prazoEntrega")));
  $("#quem-faz-texto").textContent = ajuste("quemFaz");
  const perfis = ajuste("instagram").split(",").map((p) => p.trim()).filter(Boolean);
  const linkInstagram = (perfil) => `https://www.instagram.com/${encodeURIComponent(perfil)}/`;
  $("#topo-insta").hidden = !perfis.length;
  if (perfis.length) {
    $("#topo-insta").href = linkInstagram(perfis[0]);
    $("#topo-insta-nome").textContent = `@${perfis[0]}`;
  }
  $("#topo-whats-num").textContent = telefoneBonito(ajuste("whatsapp"));
  $("#rodape-insta").hidden = !perfis.length;
  $("#rodape-insta").innerHTML =
    "<span>Siga no Instagram</span>" +
    perfis.map((p) => `<a href="${esc(linkInstagram(p))}" target="_blank" rel="noopener">@${esc(p)}</a>`).join("");
  $("#home-titulo").textContent = ajuste("homeTitulo");
  $("#home-texto").textContent = ajuste("homeTexto");
  $("#rodape-nota").textContent = ajuste("rodape");
  $("#faq-lista").innerHTML = blocosFaq(ajuste("faq"))
    .map(
      ({ pergunta, resposta }, i) => `
      <div class="acc acc--faq">
        <button class="acc__btn" type="button" aria-expanded="false" aria-controls="faq-${i}"><span class="acc__icon" aria-hidden="true"></span>${esc(pergunta)}</button>
        <div class="acc__panel" id="faq-${i}"><div class="acc__inner"><p>${esc(resposta)}</p></div></div>
      </div>`
    )
    .join("");
};
preencherAjustes();

/* ---------- Header ---------- */
const header = $(".header");
const atualizarHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
atualizarHeader();
window.addEventListener("scroll", atualizarHeader, { passive: true });

/* ---------- Aparecer ao rolar ---------- */
const observer = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add("is-visible");
      observer.unobserve(entrada.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
);

/* imediato: redesenho por atualização do catálogo, sem repetir a animação de entrada */
const observar = (raiz, imediato = false) =>
  $$("[data-reveal]:not(.is-visible)", raiz).forEach((el) => (imediato ? el.classList.add("is-visible") : observer.observe(el)));

/* ---------- Acordeões ---------- */
document.addEventListener("click", (e) => {
  const botao = e.target.closest(".acc__btn");
  if (!botao) return;
  const aberto = botao.closest(".acc").classList.toggle("is-open");
  botao.setAttribute("aria-expanded", aberto);
});

/* Vitrine do concurso: a matéria principal no meio, cercada pelas que acompanham o kit. */
const capasDoKit = (comKits) => {
  const [principal, ...extras] = comKits.length ? kitDe(comKits[0].id) : [];
  return principal ? [extras[0], principal, ...extras.slice(1)].filter(Boolean) : [];
};

/* ---------- Início: lista de concursos ---------- */
const renderHome = ({ imediato = false } = {}) => {
  $("#concursos-grid").innerHTML = concursos()
    .map((c, i) => {
      const lista = principais(c.id);
      const comKits = lista.filter(comKit);
      const destaque = capasDoKit(comKits);
      const capas =
        (destaque.length ? destaque : lista.slice(0, 3)).map((a) => capaHtml(a)).join("") ||
        capaHtml({ id: "", titulo: c.nome, emoji: "📚" });
      const meta = comKits.length
        ? `Escolha entre ${comKits.length} matérias · kit de ${kitDe(comKits[0].id).length} apostilas por ${moeda(preco(c.id, "kit"))}`
        : lista.length
          ? `${lista.length} apostilas · ${moeda(preco(c.id, "avulsa"))} cada`
          : "Apostilas em preparo";
      return `
        <a class="ccard" href="/c/${esc(c.id)}" data-nav data-reveal style="--d: ${(i % 3) * 90}ms">
          <div class="ccard__capas" aria-hidden="true">${capas}</div>
          <div class="ccard__corpo">
            <span class="status status--${esc(c.status)}">${c.status === "aberto" ? "Apostilas disponíveis" : "Em breve"}</span>
            <h3>${esc(c.nome)}</h3>
            ${c.cargo ? `<p>${esc(c.cargo)}</p>` : ""}
            <p class="ccard__meta">${meta}</p>
            <span class="ccard__ir">Ver matérias e kit</span>
          </div>
        </a>`;
    })
    .join("");
  observar($("#concursos-grid"), imediato);
};

/* ---------- Página do concurso ---------- */
const kitGrid = $("#kit-grid");

const cardAvulsa = (a, i) => `
  <article class="card" data-reveal style="--d: ${(i % 4) * 70}ms">
    <button class="card__cover" type="button" data-detalhe="${esc(a.id)}" aria-label="Ver sumário: ${esc(a.titulo)}">${capaHtml(a)}</button>
    <h3><span aria-hidden="true">${esc(a.emoji)}</span> ${esc(a.titulo)}</h3>
    <p class="card__price">${moeda(preco(a.concurso, "avulsa"))}</p>
    <button class="btn btn--sm btn--ghost btn--block" type="button" data-comprar="avulsa" data-id="${esc(a.id)}">Comprar avulsa</button>
  </article>`;

const kitCardHtml = (materia, i) => {
  const itens = kitDe(materia.id);
  const cid = itens[0].concurso;
  const total = preco(cid, "kit");
  const separado = itens.length * preco(cid, "avulsa");
  const covers = itens
    .map(
      (a, j) => `
      <figure class="kit__cover">
        <button class="kit__capa" type="button" data-detalhe="${esc(a.id)}" aria-label="Ver sumário: ${esc(a.titulo)}">${capaHtml(a, { eager: j === 0 })}</button>
        <figcaption><small>${j === 0 ? "Apostila principal" : "Acompanha o kit"}</small><strong>${esc(a.titulo)}</strong></figcaption>
      </figure>`
    )
    .join("");
  const lista =
    itens.map((a, j) => `<li><b>${esc(a.titulo)}</b> <span>${j === 0 ? "apostila principal" : "acompanha o kit"}</span></li>`).join("") +
    `<li><b>Mapas mentais</b> <span>bônus para revisar rápido</span></li>` +
    `<li><b>Tudo em PDF</b> <span>celular, tablet ou computador</span></li>`;
  return `
    <article class="kit__panel" data-reveal style="--d: ${Math.min(i, 6) * 60}ms">
      <div class="kit__covers" style="--n: ${itens.length}">${covers}</div>
      <div class="kit__buy">
        <span class="badge">Melhor custo-benefício</span>
        <h3>Kit de ${esc(itens[0].titulo)}</h3>
        <div class="kit__price">
          <s>${separado > total ? moeda(separado) : ""}</s>
          <span>${moeda(total)}</span>
          <small>pagamento único via Pix</small>
        </div>
        <p class="kit__economia">${separado > total ? `Economize ${moeda(separado - total)} em relação às apostilas avulsas` : ""}</p>
        <p class="kit__inclui">Neste kit você recebe:</p>
        <ul class="kit__lista">${lista}</ul>
        <button class="btn btn--lg btn--block" type="button" data-comprar="kit" data-id="${esc(itens[0].id)}">COMPRAR KIT · ${moeda(total)}</button>
        <p class="kit__prazo">Entrega em até <b data-prazo></b> depois que o comprovante chegar.</p>
      </div>
    </article>`;
};

const renderKits = async (comKits) => {
  kitGrid.innerHTML = comKits.map(kitCardHtml).join("");
  $$("[data-prazo]", kitGrid).forEach((el) => (el.textContent = ajuste("prazoEntrega")));
  await Promise.all($$("img", kitGrid).map((img) => img.decode().catch(() => {})));
};

/* Sem link de grupo cadastrado, o botão abre o WhatsApp de atendimento pedindo o convite. */
const linkGrupo = (c) => c.grupo || linkWhatsapp(`Olá! Quero entrar no grupo do concurso ${c.nome}.`);

const renderConcurso = (id, { imediato = false } = {}) => {
  const c = concurso(id);
  const lista = principais(id);
  const comKits = lista.filter(comKit);
  const grupo = esc(linkGrupo(c));

  $("#c-tag").textContent = `Concurso ${c.nome}${c.cargo ? ` · ${c.cargo}` : ""}`;
  $("#c-titulo").innerHTML = `Apostilas para o concurso <span class="nowrap">${esc(c.nome)}</span>`;
  $("#c-desc").textContent = c.descricao ?? "";
  $("#c-acoes").innerHTML =
    (comKits.length ? `<a class="btn" href="#kit">ESCOLHER MEU KIT</a>` : "") +
    `<a class="btn${comKits.length ? " btn--ghost" : ""}" href="${grupo}" target="_blank" rel="noopener">${c.grupo ? "Entrar no grupo do WhatsApp" : "Solicitar entrada no grupo"}</a>`;
  $("#c-meta").innerHTML =
    "<li>PDF digital</li><li>Pagamento via Pix</li>" +
    (c.edital ? `<li><a class="meta-link" href="${esc(c.edital)}" target="_blank" rel="noopener">Ver edital</a></li>` : "");

  const vitrine = capasDoKit(comKits);
  $("#c-visual").innerHTML = vitrine.length
    ? `<div class="hero__stack">${vitrine.map((a) => capaHtml(a, { eager: true })).join("")}</div>`
    : lista.length
      ? `<div class="hero__cover">${capaHtml(lista[0], { eager: true })}</div>`
      : "";

  $("#kit").hidden = !comKits.length;
  renderKits(comKits);

  $("#avulsas").hidden = !lista.length;
  $("#avulsas-sub").textContent = comKits.length
    ? `Cada apostila sai por ${moeda(preco(id, "avulsa"))}. O kit completo leva as ${kitDe(comKits[0].id).length} apostilas por ${moeda(preco(id, "kit"))}.`
    : `Cada apostila sai por ${moeda(preco(id, "avulsa"))}.`;
  $("#avulsas-grid").innerHTML = lista.map(cardAvulsa).join("");

  $("#c-grupo-texto").textContent = c.grupo
    ? `Entre no grupo do WhatsApp do concurso ${c.nome} para receber materiais gratuitos e novidades.`
    : `Peça o convite do grupo do concurso ${c.nome} pelo WhatsApp e receba materiais gratuitos e novidades.`;
  $("#c-grupo-link").href = linkGrupo(c);
  $("#c-grupo-link").textContent = c.grupo ? "ENTRAR NO GRUPO" : "SOLICITAR ENTRADA";

  observar($("#view-concurso"), imediato);
};

/* ---------- Detalhe da apostila (sumário) ---------- */
const abrirDetalhe = (id) => {
  const a = apostila(id);
  const c = concurso(a.concurso);
  const linhas = (a.sumario ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const sumario = linhas.length
    ? `<ul class="sumario">${linhas.map((l) => (l.startsWith("# ") ? `<li class="sumario__titulo">${esc(l.slice(2))}</li>` : `<li>${esc(l)}</li>`)).join("")}</ul>`
    : `<p class="detalhe__vazio">O sumário desta apostila será publicado em breve.</p>`;
  const acoes =
    a.principal === false
      ? `<p class="detalhe__vazio">Esta apostila acompanha os kits do concurso.</p>`
      : (comKit(a) ? `<button class="btn btn--block" type="button" data-comprar="kit" data-id="${esc(a.id)}">KIT COMPLETO · ${moeda(preco(a.concurso, "kit"))}</button>` : "") +
        `<button class="btn btn--ghost btn--block" type="button" data-comprar="avulsa" data-id="${esc(a.id)}">APOSTILA AVULSA · ${moeda(preco(a.concurso, "avulsa"))}</button>`;

  $("#detalhe-corpo").innerHTML = `
    <div class="detalhe__capa">${capaHtml(a, { eager: true })}</div>
    <div class="detalhe__info">
      <span class="tag"><span aria-hidden="true">${esc(a.emoji)}</span> ${esc(c?.nome ?? "")}</span>
      <h2 id="detalhe-titulo">${esc(a.titulo)}</h2>
      ${a.paginas ? `<p class="detalhe__meta">${a.paginas} páginas em PDF</p>` : ""}
      <h3>O que vem na apostila</h3>
      ${sumario}
      <div class="detalhe__acoes">${acoes}</div>
    </div>`;
  $("#detalhe .modal__panel").scrollTop = 0;
  abrirModal($("#detalhe"));
};

/* ---------- Rotas: / (início) e /c/<concurso> ---------- */
const views = { home: $("#view-home"), concurso: $("#view-concurso") };
let viewAtual = null;
let caminhoAtual = null;
let idAtual = null;

const trocarView = async (proxima, preparar) => {
  if (viewAtual) {
    viewAtual.classList.add("is-out");
    await atraso(300);
    viewAtual.hidden = true;
    viewAtual.classList.remove("is-out");
  }
  preparar();
  window.scrollTo({ top: 0, behavior: "instant" });
  proxima.hidden = false;
  proxima.classList.add("is-out");
  void proxima.offsetWidth;
  proxima.classList.remove("is-out");
  viewAtual = proxima;
};

const navComprar = $("#nav-comprar");
const metaHome = { titulo: document.title, descricao: $('meta[name="description"]').content };

const definirMeta = (titulo, descricao, caminho) => {
  const url = `${location.origin}${caminho}`;
  document.title = titulo;
  $('meta[name="description"]').content = descricao;
  $('meta[property="og:title"]').content = titulo;
  $('meta[property="og:description"]').content = descricao;
  $('meta[property="og:url"]').content = url;
  $('link[rel="canonical"]').href = url;
};

/* Título, descrição e "Comprar" do topo acompanham a página aberta. */
const atualizarPagina = () => {
  const c = idAtual && concurso(idAtual);
  if (!c) {
    definirMeta(metaHome.titulo, metaHome.descricao, "/");
    navComprar.href = "/#concursos";
    navComprar.toggleAttribute("data-nav", true);
    return;
  }
  const comKits = principais(c.id).filter(comKit);
  const kit = comKits.length ? `kit com ${kitDe(comKits[0].id).length} apostilas por ${moeda(preco(c.id, "kit"))}, ` : "";
  definirMeta(
    `Apostilas ${c.nome} | Concursos e PSS Brasil`,
    `Apostilas em PDF para o concurso ${c.nome}${c.cargo ? ` (${c.cargo})` : ""}: ${kit}sumário de cada apostila e entrega em até ${ajuste("prazoEntrega")} via Pix.`,
    `/c/${c.id}`
  );
  navComprar.href = $("#kit").hidden ? "#avulsas" : "#kit";
  navComprar.toggleAttribute("data-nav", false);
};

const rotear = async () => {
  const achou = location.pathname.match(/^\/c\/([^/]+)\/?$/);
  let id = achou ? decodeURIComponent(achou[1]) : null;
  if (id && !concurso(id)) {
    await Promise.race([bancoPronto, atraso(5000)]);
    if (!concurso(id)) {
      id = null;
      history.replaceState(null, "", "/");
    }
  }

  const caminho = id ? `/c/${id}` : "/";
  if (caminho !== caminhoAtual) {
    idAtual = id;
    await trocarView(id ? views.concurso : views.home, () => (id ? renderConcurso(id) : renderHome()));
    caminhoAtual = caminho;
    atualizarPagina();
    if (location.hash) requestAnimationFrame(() => $(location.hash)?.scrollIntoView({ behavior: "smooth" }));
  } else if (location.hash) {
    $(location.hash)?.scrollIntoView({ behavior: "smooth" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
};

const irPara = (url) => {
  history.pushState(null, "", url);
  return rotear();
};

document.addEventListener("click", (e) => {
  const link = e.target.closest("a[data-nav]");
  if (!link || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  irPara(link.getAttribute("href"));
});
window.addEventListener("popstate", rotear);

/* ---------- Catálogo publicado pelo admin ---------- */
const carregarBanco = async () => {
  try {
    const { lerCatalogo } = await comTimeout(import("./firebase.js"), 8000);
    mesclar(await comTimeout(lerCatalogo(), 8000));
  } catch (err) {
    console.warn("Catálogo do banco indisponível, usando o inicial:", err);
  }
};

const renderTudo = () => {
  preencherAjustes();
  renderHome({ imediato: true });
  if (idAtual && concurso(idAtual)) renderConcurso(idAtual, { imediato: true });
  atualizarPagina();
};

aoMudar(renderTudo);
observar(document);
const bancoPronto = carregarBanco();
rotear();

/* ---------- Modo admin: 5 toques rápidos na logo ---------- */
const carregarAdmin = () => import("./admin.js");
try {
  if (localStorage.getItem("adminAtivo")) carregarAdmin().then(({ iniciarAdmin }) => iniciarAdmin());
} catch {
  /* sem acesso ao localStorage: só abre pelos 5 toques */
}

let toques = 0;
let timerToques;
document.addEventListener(
  "click",
  async (e) => {
    if (!e.target.closest("[data-admin-trigger]")) return;
    toques += 1;
    clearTimeout(timerToques);
    timerToques = setTimeout(() => (toques = 0), 2000);
    if (toques < 5) return;
    toques = 0;
    e.preventDefault();
    const { abrirAdmin } = await carregarAdmin();
    abrirAdmin();
  },
  true
);

/* ---------- Compra: copiar a chave Pix, pagar no banco e avisar no WhatsApp ---------- */
const checkout = $("#checkout");
const view = $("#steps-view");
const progresso = $(".modal__progress", checkout);
const panes = $$(".pane", view);
let etapaAtual = 1;
let plano;
let copiou = false;

const CHAVE_COMPRA = "compraEmAndamento";
const VALIDADE_COMPRA = 3 * 60 * 60 * 1000;

const guardarCompra = () => {
  if (!plano) return;
  try {
    localStorage.setItem(CHAVE_COMPRA, JSON.stringify({ plano: plano.id, etapa: etapaAtual, copiou, quando: Date.now() }));
  } catch {
    /* sem localStorage: o progresso só dura enquanto a aba ficar aberta */
  }
};

const limparCompra = () => {
  try {
    localStorage.removeItem(CHAVE_COMPRA);
  } catch {
    /* nada a limpar */
  }
};

const lerCompra = () => {
  try {
    const compra = JSON.parse(localStorage.getItem(CHAVE_COMPRA));
    return compra && Date.now() - compra.quando < VALIDADE_COMPRA ? compra : null;
  } catch {
    return null;
  }
};

const ajustarAltura = () => {
  view.style.height = `${panes[etapaAtual - 1].offsetHeight}px`;
};

const irParaEtapa = (etapa) => {
  etapaAtual = etapa;
  panes.forEach((pane, i) => {
    pane.classList.toggle("is-active", i + 1 === etapa);
    pane.classList.toggle("is-before", i + 1 < etapa);
  });
  progresso.dataset.step = etapa;
  ajustarAltura();
  guardarCompra();
};

const mostrarPlano = () => {
  $$("[data-plano-nome]").forEach((el) => (el.textContent = plano.nome));
  $("#plano-preco").textContent = moeda(plano.preco);
  $("#whatsapp-comprovante").href = linkWhatsapp(
    `Olá! Acabei de pagar via Pix: ${plano.nome} (${moeda(plano.preco)}). Vou enviar o comprovante em seguida.`
  );
};

const abrirCheckout = (novoPlano) => {
  plano = novoPlano;
  copiou = false;
  mostrarPlano();
  abrirModal(checkout);
  irParaEtapa(1);
};

document.addEventListener("click", (e) => {
  const comprar = e.target.closest("[data-comprar]");
  if (comprar) {
    const id = comprar.dataset.id;
    return abrirCheckout(comprar.dataset.comprar === "kit" ? planoKit(id) : planoAvulso(id));
  }
  const detalhe = e.target.closest("[data-detalhe]");
  if (detalhe) abrirDetalhe(detalhe.dataset.detalhe);
});

$$("[data-go]").forEach((el) => el.addEventListener("click", () => irParaEtapa(Number(el.dataset.go))));
window.addEventListener("resize", () => checkout.classList.contains("is-open") && ajustarAltura());

/* ---------- Copiar chave Pix ---------- */
const botaoCopiar = $("#copy-pix");
let timerCopiar;
botaoCopiar.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(ajuste("pixChave"));
  } catch {
    const range = document.createRange();
    range.selectNodeContents($("[data-pix-chave]"));
    getSelection().removeAllRanges();
    getSelection().addRange(range);
  }
  botaoCopiar.classList.add("is-copied");
  clearTimeout(timerCopiar);
  timerCopiar = setTimeout(() => botaoCopiar.classList.remove("is-copied"), 2000);
  copiou = true;
  guardarCompra();
});

/* Quem copiou a chave e voltou do app do banco já cai no passo de avisar o pagamento. */
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && copiou && etapaAtual === 1 && checkout.classList.contains("is-open")) irParaEtapa(2);
});

/* Avisar no WhatsApp encerra a compra: o site não guarda mais nada dela. */
$("#whatsapp-comprovante").addEventListener("click", limparCompra);

/* ---------- Voltar de onde parou ---------- */
const compraSalva = lerCompra();
const idSalvo = compraSalva?.plano ?? "";
const [tipoSalvo, ...restoSalvo] = idSalvo.split("-");
const materiaSalva = restoSalvo.join("-");
const planoSalvo = apostila(materiaSalva) && { kit: planoKit, avulsa: planoAvulso }[tipoSalvo]?.(materiaSalva);
if (planoSalvo) {
  plano = planoSalvo;
  copiou = Boolean(compraSalva.copiou);
  mostrarPlano();
  abrirModal(checkout);
  irParaEtapa(copiou && compraSalva.etapa === 1 ? 2 : compraSalva.etapa);
  document.fonts?.ready.then(ajustarAltura);
} else {
  limparCompra();
}

/* Fechar o pagamento é desistir: só então o progresso é apagado. */
new MutationObserver(() => checkout.classList.contains("is-open") || limparCompra()).observe(checkout, { attributeFilter: ["class"] });
