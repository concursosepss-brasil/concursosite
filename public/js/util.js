import { capaDe } from "./catalogo.js";

export const moeda = (valor) => valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const esc = (texto) =>
  String(texto ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* Capa real ou, quando ainda não existe arte, uma capa provisória com o emoji da matéria. */
export const capaHtml = (a, { eager = false, src = capaDe(a) } = {}) =>
  src
    ? `<img class="capa" src="${esc(src)}" alt="Capa da apostila de ${esc(a.titulo)}" width="1024" height="1536"${eager ? "" : ' loading="lazy"'}>`
    : `<div class="capa capa--provisoria" role="img" aria-label="Capa provisória da apostila de ${esc(a.titulo)}"><div class="capa__in"><span>${esc(a.emoji)}</span><strong>${esc(a.titulo)}</strong><small>Concursos e PSS Brasil</small></div></div>`;
