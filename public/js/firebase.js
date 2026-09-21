import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase, ref, get, set, remove } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB-sUbVkpKtYy6rbeKhUScb9ZYgeHJRtEo",
  authDomain: "concursos-e-pss-brasil.firebaseapp.com",
  databaseURL: "https://concursos-e-pss-brasil-default-rtdb.firebaseio.com",
  projectId: "concursos-e-pss-brasil",
  storageBucket: "concursos-e-pss-brasil.firebasestorage.app",
  messagingSenderId: "1048580005293",
  appId: "1:1048580005293:web:89772ac8ef2388599d5524",
};

export const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/** Concursos, matérias, capas e ajustes do site publicados pelo modo admin. */
export async function lerCatalogo() {
  const [concursos, apostilas, capas, site] = await Promise.all(
    ["concursos", "apostilas", "capas", "site"].map(async (no) => (await get(ref(db, no))).val())
  );
  return { concursos, apostilas, capas, site };
}

/* Só edita quem tem o e-mail liberado em admins/ (cadastrado no console do Firebase; a chave é o e-mail com "." trocado por ","). */
export const ehAdmin = async (email) => {
  try {
    return (await get(ref(db, `admins/${email.toLowerCase().replaceAll(".", ",")}`))).val() === true;
  } catch {
    return false;
  }
};

export const gravar = (caminho, valor) => set(ref(db, caminho), valor);
export const apagar = (caminho) => remove(ref(db, caminho));
