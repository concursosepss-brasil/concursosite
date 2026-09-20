/* Dados fixos do site. O que você muda pelo modo admin (concursos, matérias, capas,
   grupos de WhatsApp) fica no banco e se sobrepõe ao catálogo inicial abaixo. */

/* Textos e dados do site. Tudo aqui pode ser trocado pelo modo admin (aba Site):
   o que você salvar lá fica no banco e vale no lugar destes valores. */
export const AJUSTES = {
  // DDI + DDD + número, só dígitos
  whatsapp: "",
  pixChave: "CONFIGURE NO ADMIN",
  pixTipo: "Telefone",
  pixFavorecido: "Configure no admin",
  // preço padrão; cada concurso pode ter o seu
  precoAvulsa: 19.9,
  precoKit: 29.9,
  // prazo combinado para enviar o PDF depois do comprovante
  prazoEntrega: "15 minutos",
  quemFaz:
    "Somos a equipe do Concursos e PSS Brasil. Preparamos as apostilas com foco no que cada banca realmente cobra, organizamos o conteúdo por disciplina e cuidamos pessoalmente do atendimento e da entrega pelo WhatsApp.",
  homeTitulo: "Apostilas para você passar no seu concurso",
  homeTexto: "Escolha o concurso, monte o kit da sua matéria e receba os PDFs depois de pagar via Pix.",
  rodape: "Material independente de estudo. O Concursos e PSS Brasil não possui vínculo com órgãos públicos nem com bancas organizadoras.",
  // perguntas separadas por linha em branco: 1ª linha = pergunta, o resto = resposta
  faq: [
    "Qual a diferença entre o kit e a apostila avulsa?\nO kit traz a apostila específica do seu cargo junto com as que acompanham o kit do concurso (como Conhecimentos Pedagógicos e Legislação) e ainda uma apostila de mapas mentais, por um valor menor. A avulsa é só a apostila da matéria escolhida.",
    "Como vejo o que vem em cada apostila?\nNa página de cada concurso, toque na capa da apostila para abrir o sumário com os capítulos e o número de páginas.",
    "Como entro no grupo do meu concurso?\nCada concurso tem um grupo de WhatsApp com materiais gratuitos e novidades. O botão de entrada fica na página do concurso.",
    "Quem faz as apostilas?\nSomos a equipe do Concursos e PSS Brasil. Preparamos o material, respondemos as dúvidas e fazemos a entrega pelo WhatsApp. Se algo não chegar, é só chamar o atendimento.",
    "Como recebo a apostila?\nDepois que o pagamento for confirmado, enviamos o PDF pelo WhatsApp que você usou para nos avisar.",
    "Quanto tempo leva para receber?\nA entrega é feita em até 15 minutos depois que o comprovante chega. Por isso é importante enviá-lo logo após o pagamento.",
    "Posso estudar pelo celular ou imprimir?\nPode. A apostila é um PDF, então funciona no celular, no tablet e no computador, e você pode imprimir se preferir.",
    "O pagamento é seguro?\nO Pix vai direto para a chave exibida no site. Antes de confirmar no app do banco, confira se o nome do favorecido é o mesmo que aparece na tela de pagamento.",
  ].join("\n\n"),
};

/* Catálogo inicial. Capas ficam em public/assets/capas/<id>.webp;
   matéria sem "capa" mostra uma capa provisória até você enviar a arte pelo admin. */
const COM_KIT = "pedagogia,legislacao";

const materia = (ordem, titulo, emoji, capa, acompanha = COM_KIT) => ({
  concurso: "seduc-am",
  titulo,
  emoji,
  capa: capa ? `/assets/capas/${capa}.webp` : "",
  sumario: "",
  acompanha,
  principal: true,
  ordem,
});

export const SEED = {
  concursos: {
    "seduc-am": {
      nome: "SEDUC-AM",
      cargo: "Professor",
      descricao:
        "Apostilas para os cargos de professor da SEDUC-AM, organizadas por disciplina. Escolha a matéria do seu cargo e monte o kit com Conhecimentos Pedagógicos e Legislação. Sempre confira o edital vigente.",
      status: "aberto",
      grupo: "",
      edital: "",
      ordem: 10,
    },
  },
  apostilas: {
    portugues: materia(10, "Língua Portuguesa", "📖", "portugues"),
    matematica: materia(20, "Matemática", "➗", "matematica"),
    historia: materia(30, "História", "📜", ""),
    geografia: materia(40, "Geografia", "🌎", ""),
    biologia: materia(50, "Biologia", "🧬", ""),
    fisica: materia(60, "Física", "⚛️", ""),
    quimica: materia(70, "Química", "🧪", ""),
    ingles: materia(80, "Inglês", "🗽", ""),
    "educacao-fisica": materia(90, "Educação Física", "🏃", ""),
    artes: materia(100, "Artes", "🎨", ""),
    filosofia: materia(110, "Filosofia", "💭", ""),
    sociologia: materia(120, "Sociologia", "👥", ""),
    pedagogia: materia(130, "Conhecimentos Pedagógicos", "🧑‍🏫", "pedagogia", "portugues,legislacao"),
    legislacao: { ...materia(140, "Legislação Educacional", "⚖️", "legislacao", ""), principal: false },
    // capas prontas, ocultas até você ligar pelo admin (matéria > desmarcar "Ocultar esta matéria do site")
    ldb: { ...materia(150, "LDB Ponto a Ponto", "📗", "ldb", ""), principal: false, oculto: true },
    mapas: { ...materia(160, "Mapas Mentais", "🧠", "mapas", ""), principal: false, oculto: true },
  },
};
