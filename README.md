# portfolio

Site pessoal do Gabriel Nykaze. HTML, CSS e JavaScript puros, sem build,
publicado no GitHub Pages.

Acesse em **https://nykaze.github.io/portfolio/**

## Estrutura

```
index.html          a página inteira
404.html            página de erro (usa caminhos absolutos por ser servida em qualquer rota)
assets/css/styles.css   tokens de tema, layout, componentes, responsivo
assets/js/main.js       reveal no scroll, nav colada, alternador de tema
assets/fonts/       Geist e Geist Mono (woff2, subset latin, self-hosted)
assets/icons/       sprite.svg gerado (Simple Icons + Devicon)
assets/img/         favicon e imagens de projeto
tools/              scripts de manutenção dos assets
```

## Onde editar o conteúdo

| O quê | Onde |
| --- | --- |
| Nome, título, descrição | `<title>` e `<meta name="description">` em `index.html` |
| Textos das seções | blocos `<section>` em `index.html` |
| Projetos | cards dentro de `<div class="bento">` |
| E-mail, LinkedIn, GitHub | seção `#contato` e a seção `#stack` |
| Cores e espaçamentos | bloco `:root` no topo de `assets/css/styles.css` |
| Percentuais do painel | `.langs` no `<aside class="panel">`, dentro do `index.html` |

Depois de mexer no `index.html`, nada precisa ser recompilado. É só dar push.

## Adicionar um projeto

Copie um `<article class="card">` de dentro de `.bento`, troque o texto, o
`href` e, se quiser uma imagem, aponte para um arquivo em `assets/img/`.

## Ícones

Os ícones vêm de um sprite embutido no fim do `index.html`. Para adicionar um:

```bash
node tools/fetch-assets.mjs   # recarrega fontes, sprite e imagens
node tools/inline-icons.mjs   # embute o sprite no index.html
```

Se o sprite foi atualizado, limpe o bloco de `<svg style="display:none">` no
fim do `index.html` e rode `node tools/inline-icons.mjs` de novo.

## Tema

Claro por padrão, escuro pela preferência do sistema. O botão na navegação
força um tema e a escolha fica no `localStorage`. Os dois temas usam a mesma
estrutura de tokens, então nada muda de cor em seção nenhuma.

## Deploy

O workflow `.github/workflows/pages.yml` roda a cada push na `main`. Ele copia
`index.html`, `404.html`, `robots.txt`, `sitemap.xml` e `assets/` para `_site/`.

Para ativar: no repositório, **Settings → Pages → Source: GitHub Actions**.

## Licença

Código do site: MIT. As imagens em `assets/img/` pertencem aos respectivos
projetos e mantêm as licenças originais.