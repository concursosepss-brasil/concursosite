import { SEED, AJUSTES } from "./config.js";

/* Catálogo = catálogo inicial (config.js) com o que vem do banco por cima, id a id. */
const estado = {
  concursos: structuredClone(SEED.concursos),
  apostilas: structuredClone(SEED.apostilas),
  capas: {},
  site: { ...AJUSTES },
};
const ouvintes = [];

const avisar = () => ouvintes.forEach((fn) => fn());
const porOrdem = (a, b) => (a.ordem ?? 999) - (b.ordem ?? 999);
const comId = ([id, dados]) => ({ id, ...dados });
const sobrepor = (destino, novos = {}) => {
  for (const [id, dados] of Object.entries(novos ?? {})) destino[id] = { ...destino[id], ...dados };
};

/* Sumário vazio no banco não apaga o do catálogo inicial. */
const semSumarioVazio = (apostilas) =>
  Object.fromEntries(Object.entries(apostilas ?? {}).map(([id, { sumario, ...resto }]) => [id, sumario ? { ...resto, sumario } : resto]));

export const aoMudar = (fn) => ouvintes.push(fn);

export const mesclar = ({ concursos, apostilas, capas, site } = {}) => {
  const antes = JSON.stringify(estado);
  sobrepor(estado.concursos, concursos);
  sobrepor(estado.apostilas, semSumarioVazio(apostilas));
  Object.assign(estado.capas, capas);
  Object.assign(estado.site, site);
  if (JSON.stringify(estado) !== antes) avisar();
};

export const removerCapa = (id) => {
  delete estado.capas[id];
  avisar();
};

/* ---------- Consultas ---------- */
export const ajuste = (chave) => estado.site[chave];
export const ajustes = () => ({ ...estado.site });

export const concursos = ({ todos = false } = {}) =>
  Object.entries(estado.concursos).map(comId).filter((c) => todos || !c.oculto).sort(porOrdem);

export const concurso = (id) => {
  const dados = estado.concursos[id];
  return dados && !dados.oculto ? { id, ...dados } : null;
};

export const apostilas = (concursoId, { todas = false } = {}) =>
  Object.entries(estado.apostilas)
    .map(comId)
    .filter((a) => a.concurso === concursoId && (todas || !a.oculto))
    .sort(porOrdem);

export const apostila = (id) => (estado.apostilas[id] ? { id, ...estado.apostilas[id] } : null);

/* Vendidas separadamente: aparecem na vitrine e no seletor do kit. */
export const principais = (concursoId) =>
  apostilas(concursoId).filter((a) => a.principal !== false);

export const capaDe = (a) => estado.capas[a.id] || a.capa || "";
export const temCapaEnviada = (id) => Boolean(estado.capas[id]);

export const semAcentos = (texto) => texto.normalize("NFD").replace(/[̀-ͯ]/g, "");

export const gerarId = (texto) =>
  semAcentos(texto).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

/* Kit = a matéria escolhida + as que acompanham (ignora as ocultas ou inexistentes). */
export const kitDe = (id) => {
  const a = apostila(id);
  const extras = (a.acompanha ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean)
    .map(apostila)
    .filter((x) => x && !x.oculto);
  return [a, ...extras];
};

export const comKit = (a) => kitDe(a.id).length > 1;

/* ---------- Preços e planos de compra ---------- */
export const preco = (concursoId, tipo) => {
  const c = estado.concursos[concursoId] ?? {};
  return (tipo === "kit" ? c.precoKit : c.precoAvulsa) ?? ajuste(tipo === "kit" ? "precoKit" : "precoAvulsa");
};

const nomeConcurso = (concursoId) => estado.concursos[concursoId]?.nome ?? "";

export const planoAvulso = (id) => {
  const a = apostila(id);
  return {
    id: `avulsa-${id}`,
    nome: `Apostila avulsa: ${a.titulo} (${nomeConcurso(a.concurso)})`,
    preco: preco(a.concurso, "avulsa"),
  };
};

export const planoKit = (id) => {
  const a = apostila(id);
  const titulos = kitDe(id).map((item) => item.titulo).join(" + ");
  return {
    id: `kit-${id}`,
    nome: `Kit completo: ${titulos} + Mapas Mentais (${nomeConcurso(a.concurso)})`,
    preco: preco(a.concurso, "kit"),
  };
};
