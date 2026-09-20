/* Abre e fecha os modais (compra, detalhe da apostila e admin), um por vez. */

let aberto = null;
let ultimoFoco = null;

const painelDe = (modal) => modal.querySelector(".modal__panel");

const focaveis = (painel) =>
  [...painel.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex='-1'])")].filter(
    (el) => el.offsetParent !== null && !el.closest(".pane:not(.is-active)")
  );

const esconder = (modal) => {
  modal.inert = true;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
};

export const abrirModal = (modal) => {
  if (aberto === modal) return;
  if (aberto) {
    esconder(aberto);
  } else {
    ultimoFoco = document.activeElement;
    document.documentElement.style.setProperty("--scrollbar", `${window.innerWidth - document.documentElement.clientWidth}px`);
    document.body.classList.add("is-locked");
  }
  aberto = modal;
  modal.inert = false;
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  painelDe(modal).focus({ preventScroll: true });
};

export const fecharModal = () => {
  if (!aberto) return;
  esconder(aberto);
  aberto = null;
  document.body.classList.remove("is-locked");
  ultimoFoco?.focus({ preventScroll: true });
};

export const modalAberto = () => aberto;

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) fecharModal();
});

document.addEventListener("keydown", (e) => {
  if (!aberto) return;
  if (e.key === "Escape") return fecharModal();
  if (e.key !== "Tab") return;
  const itens = focaveis(painelDe(aberto));
  const primeiro = itens[0];
  const ultimo = itens[itens.length - 1];
  if (e.shiftKey && document.activeElement === primeiro) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primeiro.focus();
  }
});
