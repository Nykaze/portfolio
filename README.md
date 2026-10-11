# portfolio

Site pessoal do Gabriel Nykaze. HTML, CSS e JavaScript puros, sem build,
publicado no GitHub Pages.

Acesse em **https://nykaze.github.io/portfolio/**

## Estrutura

```
index.html              a página inteira
404.html                página de erro (caminhos absolutos, pois é servida em qualquer rota)
assets/css/styles.css   tokens de tema, componentes, responsivo
assets/js/main.js       animação do hero, menu do mobile, nav colada, tema
assets/fonts/           Archivo (texto) e IBM Plex Mono (dado e código)
assets/icons/sprite.svg ícones em sprite (Simple Icons + Devicon)
assets/img/             favicon e imagens de projeto
tools/                  scripts de manutenção (assets, capturas, contraste)
```

## Onde editar o conteúdo

| O quê | Onde |
| --- | --- |
| Nome, título, descrição | `<title>` e `<meta name="description">` em `index.html` |
| Textos das seções | blocos `<section>` em `index.html` |
| Projetos | `<article class="project">` dentro de `.projects` |
| E-mail, LinkedIn, GitHub | seção `#contato` |
| Cores e espaçamentos | bloco `:root` no topo de `assets/css/styles.css` |
| Percentuais do painel | `.langs` no `<aside class="panel">` |

Nada precisa ser recompilado. É só dar push.

## Adicionar um projeto

Copie um `<article class="project">` de dentro de `.projects` e troque o texto, o
`href` e, se quiser uma imagem, aponte para um arquivo em `assets/img/`. A imagem
só funciona bem com proporção panorâmica; o banner do Agritech tem 1400x470.

## Ícones

Os ícones vêm de um sprite embutido no fim do `index.html`, o que faz o site
funcionar em `file://` sem depender de fetch.

```bash
node tools/fetch-assets.mjs   # baixa fontes, gera o sprite, baixa imagens
node tools/inline-icons.mjs   # embute o sprite no index.html
```

Para isso funcionar, o `index.html` precisa ter a linha `<!--ICONS-->` dentro do
`<svg style="display:none">` no fim do body. Depois de embutir, a linha some: se
for mudar os ícones, apague o bloco de `<svg style="display:none">` e rode o
`inline-icons.mjs` de novo.

Ícones novos entram em `ICONS` no `fetch-assets.mjs`. O slug vem do
[Simple Icons](https://simpleicons.org).

## Tema

Claro por padrão, escuro pela preferência do sistema. O botão na navegação força um
tema e a escolha fica no `localStorage`. Os dois temas usam a mesma estrutura de
tokens, então nenhuma seção muda de cor no meio da página.

Para conferir o contraste dos dois temas:

```bash
node tools/contrast.mjs
```

## Movimento

Um momento só: a chegada do hero, escalonada na ordem de leitura. A classe que
dispara a animação é adicionada por JavaScript, então sem JS a página já nasce
visível, e com `prefers-reduced-motion` nada se move.

## Conferir visualmente

```bash
node tools/shots.mjs
```

Gera desktop e mobile nos dois tema em
`%TEMP%\opencode\shots`. O Chrome headless no Windows tem largura mínima de 500px,
por isso o mobile sai de um iframe de 390px.

## Deploy

O workflow `.github/workflows/pages.yml` roda a cada push na `main`. Ele copia
`index.html`, `404.html`, `robots.txt`, `sitemap.xml` e `assets/` para `_site/`.

O repositório já está configurado com **Settings → Pages → Source: GitHub Actions**.

## Licença

Código do site: MIT. As imagens em `assets/img/` pertencem aos respectivos
projetos e mantêm as licenças originais.