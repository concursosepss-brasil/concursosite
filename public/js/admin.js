import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { app, gravar, apagar } from "./firebase.js";
import { ajuste, ajustes, concursos, apostilas, apostila, mesclar, removerCapa, temCapaEnviada, gerarId } from "./catalogo.js";
import { abrirModal, fecharModal } from "./modal.js";
import { esc, capaHtml } from "./util.js";

/* Painel do dono do site. Só entra quem tem login criado no Firebase (Authentication > Usuários);
   quem escreve no banco é decidido pelas regras do Firebase, não por este arquivo. */

const modal = document.querySelector("#admin");
const corpo = document.querySelector("#admin-corpo");
const auth = getAuth(app);

let usuario; // undefined = ainda verificando, null = deslogado
let iniciado = false;
let pilula = null;
const ui = { aba: "concursos", concurso: null, filtro: "", materia: null, capa: null, tirarCapa: false };

/* ---------- Auxiliares ---------- */
const campo = (rotulo, nome, valor = "", extra = "") =>
  `<label class="field"><span>${rotulo}</span><input name="${nome}" value="${esc(valor)}" ${extra}></label>`;
const area = (rotulo, nome, valor = "", extra = "") =>
  `<label class="field"><span>${rotulo}</span><textarea name="${nome}" ${extra}>${esc(valor)}</textarea></label>`;
const marca = (rotulo, nome, marcado, valor = "") =>
  `<label class="check"><input type="checkbox" name="${nome}" value="${esc(valor)}"${marcado ? " checked" : ""}><span>${rotulo}</span></label>`;

const mensagem = (texto, ok = false) => {
  const el = corpo.querySelector("#admin-msg");
  if (!el) return;
  el.textContent = texto;
  el.classList.toggle("is-ok", ok);
  el.classList.add("is-shown");
};

const erroDoBanco = (err) =>
  /permission_denied/i.test(`${err.code} ${err.message}`)
    ? "Sem permissão para salvar. Entre com uma conta liberada para editar o site."
    : `Não foi possível salvar: ${err.message}`;

const idLivre = (base, existe) => {
  let id = base;
  for (let n = 2; existe(id); n += 1) id = `${base}-${n}`;
  return id;
};

const proximaOrdem = (itens) => Math.max(0, ...itens.map((i) => i.ordem ?? 0)) + 10;

/* Reduz a capa para caber no banco (até ~180 KB). */
const prepararCapa = async (arquivo) => {
  const bitmap = await createImageBitmap(arquivo);
  const largura = Math.min(600, bitmap.width);
  const canvas = Object.assign(document.createElement("canvas"), {
    width: largura,
    height: Math.round((bitmap.height * largura) / bitmap.width),
  });
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  for (const tipo of ["image/webp", "image/jpeg"]) {
    for (const qualidade of [0.82, 0.7, 0.55]) {
      const url = canvas.toDataURL(tipo, qualidade);
      if (url.startsWith(`data:${tipo}`) && url.length <= 180000) return url;
    }
  }
  throw new Error("imagem pesada demais, use uma capa menor");
};

/* ---------- Telas ---------- */
const telaLogin = () => `
  <h2 id="admin-titulo">Área do administrador</h2>
  <p class="pane__lead">Entre com o e-mail e a senha cadastrados para editar o site.</p>
  <form class="admin__form" id="form-login" novalidate>
    ${campo("E-mail", "email", "", 'type="email" inputmode="email" autocomplete="username"')}
    ${campo("Senha", "senha", "", 'type="password" autocomplete="current-password"')}
    <button class="btn btn--block" type="submit">ENTRAR</button>
  </form>
  <p class="admin__msg" id="admin-msg" role="status"></p>`;

const abaConcursos = () => {
  const lista = concursos({ todos: true });
  const c = lista.find((x) => x.id === ui.concurso);
  return `
    <div class="admin__lista">
      ${lista
        .map(
          (x) =>
            `<button type="button" class="${x.id === ui.concurso ? "is-ativa" : ""}" data-editar-concurso="${esc(x.id)}">${esc(x.nome)}${x.oculto ? " (oculto)" : ""}<small>${x.grupo ? "grupo do WhatsApp ✓" : "sem grupo"}</small></button>`
        )
        .join("")}
      <button type="button" class="admin__novo${c ? "" : " is-ativa"}" data-editar-concurso="">+ Novo concurso</button>
    </div>
    <form class="admin__form" id="form-concurso" novalidate>
      <h3>${c ? `Editar ${esc(c.nome)}` : "Novo concurso"}</h3>
      ${campo("Nome do concurso", "nome", c?.nome, 'maxlength="80" required placeholder="Ex.: SEDUC-AM"')}
      ${campo("Cargo ou área", "cargo", c?.cargo, 'maxlength="120" placeholder="Ex.: Professor"')}
      ${area("Descrição do concurso", "descricao", c?.descricao, 'maxlength="1200" rows="4"')}
      <label class="field"><span>Situação</span>
        <select name="status">
          <option value="aberto"${c?.status !== "breve" ? " selected" : ""}>Apostilas disponíveis</option>
          <option value="breve"${c?.status === "breve" ? " selected" : ""}>Em breve</option>
        </select>
      </label>
      ${campo("Link do grupo de WhatsApp (materiais gratuitos e novidades)", "grupo", c?.grupo, 'type="url" inputmode="url" maxlength="300" placeholder="https://chat.whatsapp.com/..."')}
      ${campo("Link do edital (opcional)", "edital", c?.edital, 'type="url" inputmode="url" maxlength="300" placeholder="https://..."')}
      <div class="admin__duplo">
        ${campo("Preço da avulsa (R$)", "precoAvulsa", c?.precoAvulsa ?? "", `type="number" step="0.01" min="0.01" placeholder="${ajuste("precoAvulsa")}"`)}
        ${campo("Preço do kit (R$)", "precoKit", c?.precoKit ?? "", `type="number" step="0.01" min="0.01" placeholder="${ajuste("precoKit")}"`)}
      </div>
      ${marca("Ocultar este concurso do site", "oculto", c?.oculto)}
      <button class="btn btn--block" type="submit">SALVAR CONCURSO</button>
    </form>`;
};

const previaCapa = (a) => capaHtml(a, ui.capa ? { src: ui.capa } : ui.tirarCapa ? { src: a.capa ?? "" } : {});

const abaMaterias = () => {
  const todos = concursos({ todos: true });
  if (!todos.length) return `<p class="pane__lead">Crie um concurso primeiro, na aba Concursos.</p>`;
  if (!todos.some((c) => c.id === ui.filtro)) ui.filtro = todos[0].id;

  const lista = apostilas(ui.filtro, { todas: true });
  const a = ui.materia ? apostila(ui.materia) : null;
  const atual = a ?? { id: "", titulo: "", emoji: "📘", sumario: "", acompanha: "pedagogia,legislacao", principal: true };
  const escolhidas = (atual.acompanha ?? "").split(",").filter(Boolean);
  const outras = lista.filter((x) => x.id !== atual.id && !x.oculto);

  return `
    <label class="field"><span>Concurso</span>
      <select id="filtro-concurso">
        ${todos.map((c) => `<option value="${esc(c.id)}"${c.id === ui.filtro ? " selected" : ""}>${esc(c.nome)}</option>`).join("")}
      </select>
    </label>
    <div class="admin__lista">
      ${lista
        .map(
          (x) =>
            `<button type="button" class="${x.id === ui.materia ? "is-ativa" : ""}" data-editar-materia="${esc(x.id)}">${esc(x.emoji)} ${esc(x.titulo)}${x.oculto ? " (oculta)" : ""}<small>${x.principal === false ? "só acompanha o kit" : "à venda"}</small></button>`
        )
        .join("")}
      <button type="button" class="admin__novo${a ? "" : " is-ativa"}" data-editar-materia="">+ Nova matéria</button>
    </div>
    <form class="admin__form" id="form-materia" novalidate>
      <h3>${a ? `Editar ${esc(a.titulo)}` : "Nova matéria"}</h3>
      ${campo("Título da apostila", "titulo", atual.titulo, 'maxlength="80" required placeholder="Ex.: Matemática"')}
      ${campo("Emoji", "emoji", atual.emoji, 'maxlength="8" placeholder="📘"')}
      <div class="field"><span>Capa</span>
        <div class="admin__capa">
          <div class="admin__prev" id="capa-previa">${previaCapa(atual)}</div>
          <div>
            <label class="btn btn--sm btn--ghost admin__arquivo">Enviar capa<input type="file" name="arquivo" accept="image/*" hidden></label>
            ${a && temCapaEnviada(a.id) && !ui.tirarCapa ? `<button class="link" type="button" data-tirar-capa>Remover capa enviada</button>` : ""}
            <p class="pane__hint">A imagem é reduzida automaticamente. Proporção ideal: 1024 × 1536.</p>
          </div>
        </div>
      </div>
      ${area("Sumário (um item por linha; use “# ” no começo para um título de seção)", "sumario", atual.sumario, 'maxlength="12000" rows="7"')}
      <fieldset class="field admin__kit"><span>Acompanha no kit</span>
        ${outras.length ? outras.map((x) => marca(`${esc(x.emoji)} ${esc(x.titulo)}`, "acompanha", escolhidas.includes(x.id), x.id)).join("") : `<p class="pane__hint">Cadastre outras matérias deste concurso para montar o kit.</p>`}
      </fieldset>
      ${marca("Vendida avulsa e como matéria principal do kit", "principal", atual.principal !== false)}
      ${marca("Ocultar esta matéria do site", "oculto", atual.oculto)}
      <button class="btn btn--block" type="submit">SALVAR MATÉRIA</button>
    </form>`;
};

const TIPOS_PIX = ["Telefone", "CPF", "CNPJ", "E-mail", "Chave aleatória"];

const abaSite = () => {
  const a = ajustes();
  const formatado = a.whatsapp.replace(/^55/, "");
  return `
    <form class="admin__form" id="form-site" novalidate>
      <h3>Página inicial</h3>
      ${campo("Título", "homeTitulo", a.homeTitulo, 'maxlength="140"')}
      ${area("Texto de apoio", "homeTexto", a.homeTexto, 'maxlength="400" rows="3"')}

      <h3 class="admin__sep">Contato e Pix</h3>
      ${campo("WhatsApp de atendimento (com DDD)", "whatsapp", formatado, 'type="tel" inputmode="tel" maxlength="20" placeholder="92 99999-9999"')}
      ${campo("Instagram (usuários separados por vírgula; o primeiro vai no ícone do topo)", "instagram", a.instagram, 'maxlength="200" placeholder="meu_perfil, outro_perfil"')}
      ${campo("Chave Pix", "pixChave", a.pixChave, 'maxlength="80"')}
      <label class="field"><span>Tipo da chave</span>
        <select name="pixTipo">${TIPOS_PIX.map((t) => `<option${t === a.pixTipo ? " selected" : ""}>${t}</option>`).join("")}</select>
      </label>
      ${campo("Favorecido (nome que aparece no banco)", "pixFavorecido", a.pixFavorecido, 'maxlength="80"')}

      <h3 class="admin__sep">Preços padrão</h3>
      <div class="admin__duplo">
        ${campo("Apostila avulsa (R$)", "precoAvulsa", a.precoAvulsa, 'type="number" step="0.01" min="0.01"')}
        ${campo("Kit completo (R$)", "precoKit", a.precoKit, 'type="number" step="0.01" min="0.01"')}
      </div>
      <p class="pane__hint">Cada concurso pode ter preço próprio, na aba Concursos.</p>

      <h3 class="admin__sep">Entrega e equipe</h3>
      ${campo("Prazo de entrega depois do comprovante", "prazoEntrega", a.prazoEntrega, 'maxlength="40" placeholder="15 minutos"')}
      ${area("Texto “Quem faz as apostilas”", "quemFaz", a.quemFaz, 'maxlength="600" rows="4"')}

      <h3 class="admin__sep">Perguntas frequentes</h3>
      ${area("Uma pergunta por bloco: 1ª linha é a pergunta, as seguintes são a resposta. Separe os blocos com uma linha em branco.", "faq", a.faq, 'maxlength="8000" rows="14"')}

      <h3 class="admin__sep">Rodapé</h3>
      ${area("Aviso do rodapé", "rodape", a.rodape, 'maxlength="400" rows="3"')}
      <button class="btn btn--block" type="submit">SALVAR SITE</button>
    </form>`;
};

const telaPainel = () => `
  <div class="admin__topo">
    <div><h2 id="admin-titulo">Modo admin</h2><p class="admin__user">${esc(usuario.email)}</p></div>
    <button class="link" type="button" data-sair>Sair do modo admin</button>
  </div>
  <div class="admin__abas" role="tablist">
    <button type="button" role="tab" aria-selected="${ui.aba === "concursos"}" class="${ui.aba === "concursos" ? "is-ativa" : ""}" data-aba="concursos">Concursos</button>
    <button type="button" role="tab" aria-selected="${ui.aba === "materias"}" class="${ui.aba === "materias" ? "is-ativa" : ""}" data-aba="materias">Matérias</button>
    <button type="button" role="tab" aria-selected="${ui.aba === "site"}" class="${ui.aba === "site" ? "is-ativa" : ""}" data-aba="site">Site</button>
  </div>
  ${{ concursos: abaConcursos, materias: abaMaterias, site: abaSite }[ui.aba]()}
  <p class="admin__msg" id="admin-msg" role="status"></p>`;

const desenhar = () => {
  corpo.innerHTML = usuario === undefined ? `<p class="pane__lead">Verificando acesso…</p>` : usuario ? telaPainel() : telaLogin();
};

/* ---------- Ações ---------- */
const salvarConcurso = async (form) => {
  const dados = Object.fromEntries(new FormData(form));
  const existente = concursos({ todos: true }).find((c) => c.id === ui.concurso);
  const nome = dados.nome.trim();
  if (nome.length < 2) return mensagem("Informe o nome do concurso.");
  for (const chave of ["grupo", "edital"]) {
    if (dados[chave].trim() && !dados[chave].trim().startsWith("https://")) return mensagem("Os links precisam começar com https://");
  }

  const id = existente?.id ?? idLivre(gerarId(nome), (x) => concursos({ todos: true }).some((c) => c.id === x));
  const registro = {
    nome,
    cargo: dados.cargo.trim(),
    descricao: dados.descricao.trim(),
    status: dados.status,
    grupo: dados.grupo.trim(),
    edital: dados.edital.trim(),
    oculto: form.elements.oculto.checked,
    ordem: existente?.ordem ?? proximaOrdem(concursos({ todos: true })),
  };
  const precos = {};
  for (const chave of ["precoAvulsa", "precoKit"]) if (dados[chave]) precos[chave] = Number(dados[chave]);

  try {
    await gravar(`concursos/${id}`, { ...registro, ...precos });
  } catch (err) {
    return mensagem(erroDoBanco(err));
  }
  mesclar({ concursos: { [id]: { precoAvulsa: undefined, precoKit: undefined, ...registro, ...precos } } });
  ui.concurso = id;
  desenhar();
  mensagem("Concurso salvo. O site já foi atualizado.", true);
};

const salvarMateria = async (form) => {
  const dados = new FormData(form);
  const existente = ui.materia ? apostila(ui.materia) : null;
  const titulo = dados.get("titulo").trim();
  if (titulo.length < 2) return mensagem("Informe o título da apostila.");

  const cid = existente?.concurso ?? ui.filtro;
  const id = existente?.id ?? idLivre(gerarId(titulo), apostila);
  const registro = {
    concurso: cid,
    titulo,
    emoji: dados.get("emoji").trim() || "📘",
    sumario: dados.get("sumario").trim(),
    acompanha: dados.getAll("acompanha").join(","),
    principal: form.elements.principal.checked,
    oculto: form.elements.oculto.checked,
    ordem: existente?.ordem ?? proximaOrdem(apostilas(cid, { todas: true })),
  };

  try {
    await gravar(`apostilas/${id}`, registro);
    if (ui.capa) await gravar(`capas/${id}`, ui.capa);
    else if (ui.tirarCapa) await apagar(`capas/${id}`);
  } catch (err) {
    return mensagem(erroDoBanco(err));
  }
  mesclar({ apostilas: { [id]: registro }, capas: ui.capa ? { [id]: ui.capa } : {} });
  if (ui.tirarCapa && !ui.capa) removerCapa(id);
  ui.materia = id;
  ui.capa = null;
  ui.tirarCapa = false;
  desenhar();
  mensagem("Matéria salva. O site já foi atualizado.", true);
};

const salvarSite = async (form) => {
  const dados = Object.fromEntries(new FormData(form));
  let telefone = dados.whatsapp.replace(/\D/g, "");
  if (telefone.length <= 11) telefone = `55${telefone}`;
  if (telefone.length < 12 || telefone.length > 13) return mensagem("Informe o WhatsApp com DDD, por exemplo 92 98474-5492.");
  const perfis = dados.instagram.split(",").map((p) => p.trim().replace(/^@/, "")).filter(Boolean);
  if (perfis.some((p) => !/^[\w.]{1,30}$/.test(p))) return mensagem("Instagram: use só o nome de usuário, sem link, por exemplo meu_perfil.");
  if (dados.pixChave.trim().length < 3) return mensagem("Informe a chave Pix.");
  if (dados.pixFavorecido.trim().length < 2) return mensagem("Informe o favorecido do Pix.");
  const precoAvulsa = Number(dados.precoAvulsa);
  const precoKit = Number(dados.precoKit);
  if (!(precoAvulsa > 0) || !(precoKit > 0)) return mensagem("Informe os dois preços.");
  if (!dados.prazoEntrega.trim()) return mensagem("Informe o prazo de entrega.");

  const registro = {
    whatsapp: telefone,
    instagram: perfis.join(","),
    pixChave: dados.pixChave.trim(),
    pixTipo: dados.pixTipo,
    pixFavorecido: dados.pixFavorecido.trim(),
    precoAvulsa,
    precoKit,
    homeTitulo: dados.homeTitulo.trim(),
    homeTexto: dados.homeTexto.trim(),
    rodape: dados.rodape.trim(),
    faq: dados.faq.trim(),
    prazoEntrega: dados.prazoEntrega.trim(),
    quemFaz: dados.quemFaz.trim(),
  };
  try {
    await gravar("site", registro);
  } catch (err) {
    return mensagem(erroDoBanco(err));
  }
  mesclar({ site: registro });
  desenhar();
  mensagem("Site salvo. As mudanças já estão no ar.", true);
};

const sair = async () => {
  fecharModal();
  await signOut(auth);
};

const atualizarPilula = () => {
  if (!usuario) {
    pilula?.remove();
    pilula = null;
    return;
  }
  if (pilula) return;
  pilula = Object.assign(document.createElement("div"), { className: "admin-pilula" });
  pilula.innerHTML = `<span>Modo admin</span><button type="button" data-abrir>Editar</button><button type="button" data-sair>Sair</button>`;
  pilula.addEventListener("click", (e) => {
    const botao = e.target.closest("button");
    if (botao && "abrir" in botao.dataset) abrirModal(modal);
    if (botao && "sair" in botao.dataset) sair();
  });
  document.body.append(pilula);
};

const ERROS_LOGIN = {
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/user-not-found": "E-mail ou senha incorretos.",
  "auth/invalid-email": "E-mail inválido.",
  "auth/too-many-requests": "Muitas tentativas. Aguarde um pouco e tente de novo.",
  "auth/network-request-failed": "Sem conexão. Tente de novo.",
  "auth/operation-not-allowed": "Ative o login por E-mail/senha no Firebase (Authentication > Método de login).",
};

const entrar = async (form) => {
  const { email, senha } = Object.fromEntries(new FormData(form));
  if (!email.trim() || !senha) return mensagem("Informe o e-mail e a senha.");
  try {
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  } catch (err) {
    mensagem(ERROS_LOGIN[err.code] ?? `Não foi possível entrar: ${err.message}`);
  }
};

const aoClicar = (e) => {
  const alvo = e.target.closest("button");
  if (!alvo) return;
  if ("sair" in alvo.dataset) return sair();
  if (alvo.dataset.aba) {
    ui.aba = alvo.dataset.aba;
  } else if ("editarConcurso" in alvo.dataset) {
    ui.concurso = alvo.dataset.editarConcurso || null;
  } else if ("editarMateria" in alvo.dataset) {
    ui.materia = alvo.dataset.editarMateria || null;
    ui.capa = null;
    ui.tirarCapa = false;
  } else if ("tirarCapa" in alvo.dataset) {
    ui.tirarCapa = true;
    ui.capa = null;
    corpo.querySelector("#capa-previa").innerHTML = previaCapa(ui.materia ? apostila(ui.materia) : { titulo: "", emoji: "📘" });
    return alvo.remove();
  } else {
    return;
  }
  desenhar();
};

const aoAlterar = async (e) => {
  if (e.target.id === "filtro-concurso") {
    ui.filtro = e.target.value;
    ui.materia = null;
    return desenhar();
  }
  if (e.target.name !== "arquivo" || !e.target.files[0]) return;
  try {
    ui.capa = await prepararCapa(e.target.files[0]);
    ui.tirarCapa = false;
    corpo.querySelector("#capa-previa").innerHTML = capaHtml({ titulo: "Nova capa", emoji: "" }, { src: ui.capa });
  } catch (err) {
    mensagem(`Capa não aceita: ${err.message}`);
  }
};

const aoEnviar = (e) => {
  e.preventDefault();
  if (e.target.id === "form-login") entrar(e.target);
  if (e.target.id === "form-concurso") salvarConcurso(e.target);
  if (e.target.id === "form-materia") salvarMateria(e.target);
  if (e.target.id === "form-site") salvarSite(e.target);
};

/* Liga o painel e a pílula "Modo admin". Só roda para quem já entrou antes (localStorage) ou abriu pelos 5 toques. */
export const iniciarAdmin = () => {
  if (iniciado) return;
  iniciado = true;
  ui.concurso = concursos({ todos: true })[0]?.id ?? null;
  corpo.addEventListener("click", aoClicar);
  corpo.addEventListener("change", aoAlterar);
  corpo.addEventListener("submit", aoEnviar);
  onAuthStateChanged(auth, (u) => {
    usuario = u;
    try {
      if (u) localStorage.setItem("adminAtivo", "1");
      else localStorage.removeItem("adminAtivo");
    } catch {
      /* sem localStorage: a pílula só aparece nesta visita */
    }
    atualizarPilula();
    desenhar();
  });
};

export const abrirAdmin = () => {
  iniciarAdmin();
  desenhar();
  abrirModal(modal);
};
