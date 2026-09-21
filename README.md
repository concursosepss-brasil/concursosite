# Concursos e PSS Brasil

Site de vendas de apostilas para concursos. HTML, CSS e JavaScript puros, hospedado no Firebase Hosting.

## Estrutura

```
public/            site (é a pasta publicada)
  index.html       páginas: início (/) e concurso (/c/<id>), detalhe da apostila e modais
  css/style.css
  js/config.js     Pix, WhatsApp, prazo, preços padrão e catálogo inicial (SEDUC-AM)
  js/conteudo.js   sumários e número de páginas das apostilas prontas (tirados do índice de cada PDF)
  js/catalogo.js   catálogo = config.js + o que o admin salvou no banco
  js/main.js       rotas, vitrine, kit, compra e animações
  js/admin.js      modo admin (só carrega quando abre)
  js/modal.js      abrir/fechar modais
  js/firebase.js   conexão com o Realtime Database
  assets/capas/    capas das apostilas: <id>.webp (portugues, matematica, ...)
database.rules.json  regras do banco (leitura pública do catálogo, escrita só do admin)
firebase.json      Hosting (com rewrite de /c/**) e banco
```

## Modo admin

Toque 5 vezes rápido na logo (topo ou rodapé). Entre com a conta Google autorizada e edite:

- concursos: nome, cargo, descrição, edital, preços, situação e o link do grupo de WhatsApp de cada um;
- matérias: título, emoji, capa (envio de imagem), sumário, o que acompanha no kit, à venda ou só acompanhante;
- site: título e texto da página inicial, WhatsApp de atendimento, Instagram (o primeiro perfil vai no ícone do topo e todos no rodapé), chave/tipo/favorecido do Pix, preços padrão, perguntas frequentes e nota do rodapé.

Enquanto o modo admin está ligado aparece uma pílula flutuante (Editar / Sair). Para sair: botão "Sair do modo admin" no painel ou "Sair" na pílula. Concurso sem link de grupo usa o WhatsApp de atendimento (o botão vira "Solicitar entrada").

O que o admin salva fica no banco (`concursos`, `apostilas`, `capas`, `site`) e se sobrepõe ao catálogo inicial do `config.js`.

Configuração única no Firebase Console: Authentication > Método de login > Google > Ativar. Os e-mails autorizados a escrever ficam em `database.rules.json` (procure `auth.token.email`; troque ou acrescente o e-mail do dono do site) e valem depois de `firebase deploy --only database`.

## Antes de publicar

1. Preencha o que é do dono do site, pelo modo admin (aba Site) ou em `public/js/config.js`: WhatsApp, chave Pix, favorecido e preços. Enquanto não preencher, o Pix mostra "CONFIGURE NO ADMIN".
   Os sumários das apostilas e o link do grupo de cada concurso também são preenchidos pelo admin.
2. Coloque as capas em `public/assets/capas/` com o id da matéria (`portugues.webp`, `matematica.webp`...; as capas `ldb` e `mapas` já estão na pasta e as matérias ficam ocultas até ligar pelo admin). Matéria sem capa mostra uma capa provisória.
3. O banco é o Realtime Database do projeto (`concursos-e-pss-brasil-default-rtdb`). As regras deste projeto substituem as que estão lá hoje.

## Testar localmente

```
npx serve public
```

## Publicar

Primeira vez (PowerShell, dentro da pasta do projeto):

```
npm i -g firebase-tools
firebase login
firebase deploy --only database
firebase deploy --only hosting
```

## GitHub

```
git init -b main
git add .
git commit -m "Site Concursos e PSS Brasil"
git remote add origin https://github.com/concursosepss-brasil/concursosite.git
git push -u origin main
```

## Deploy automático a cada push

Uma única vez:

```
firebase init hosting:github
```

Informe o repositório quando pedir. O comando cria os arquivos em `.github/workflows` e o secret no GitHub. Depois disso o fluxo é só:

```
git add .
git commit -m "sua mensagem"
git push
```

As regras do banco (`database.rules.json`) não sobem pelo GitHub. Quando mudar esse arquivo, rode `firebase deploy --only database`.
