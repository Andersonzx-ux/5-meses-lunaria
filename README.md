# Lunária — A Cidade Onde Mora o Nosso Amor

Um pequeno jogo 2D de exploração, feito como presente. A Larissa caminha por uma cidade noturna, conversa com os moradores e recupera, capítulo por capítulo, as lembranças da história do casal, até chegar à Casa do Futuro.

Roda direto no navegador, no computador ou no celular, sem instalar nada. Toda a arte é desenhada por código (Canvas 2D); o único arquivo externo é a trilha sonora.

## Como jogar

| Ação | Computador | Celular |
|---|---|---|
| Andar | Setas ou WASD | Joystick (toque e arraste na metade esquerda da tela) |
| Interagir / avançar diálogo | E, Espaço ou Enter | Botão de ação (canto direito) ou toque no balão/na caixa |
| Diário | J | Toque no contador ✦ |
| Ligar/desligar música | M | Botão ♪ |
| Voltar ao menu | Esc | Botão "‹ Menu" |

Funciona em pé e deitado; a tela se reorganiza ao girar o celular. A música começa no primeiro toque ou clique, porque os navegadores não permitem som antes disso.

## Rodar no computador

Requer [Node.js](https://nodejs.org/) 20.19 ou 22.12 em diante.

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`. Para testar no celular, na mesma rede Wi-Fi:

```bash
npm run dev -- --host
```

e abra no celular o endereço "Network" que aparece no terminal.

Com `npm run dev`, acrescentar `?debug` ao endereço mostra os corpos de colisão.

### Outros comandos

| Comando | O que faz |
|---|---|
| `npm run typecheck` | Verifica os tipos do TypeScript |
| `npm run build` | Verifica os tipos e gera a versão final em `dist/` |
| `npm run preview` | Serve a pasta `dist/` para testar a versão final |

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` gera o build e publica a cada push na branch `main`.

1. Crie o repositório no GitHub e envie o projeto para a branch `main`.
2. Em **Settings → Pages**, em **Source**, escolha **GitHub Actions**.
3. Acompanhe a publicação na aba **Actions**. Quando terminar, o jogo fica em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

O build usa caminhos relativos, então funciona com qualquer nome de repositório.

No plano gratuito do GitHub, o repositório precisa ser público para usar o Pages, e os textos do jogo ficam visíveis no código.

## Progresso salvo

O progresso fica no LocalStorage do navegador em que se joga: lembranças, lugares visitados, moradores conhecidos e posição. Cada aparelho e cada navegador tem o seu; abrir o link pelo WhatsApp e depois pelo Chrome conta como dois navegadores diferentes.

Para recomeçar, use **Nova jornada** no menu. Para apagar também a preferência de som, rode no console do navegador:

```js
localStorage.removeItem('lunaria:save');
localStorage.removeItem('lunaria:settings');
location.reload();
```

## Personalizar

Os textos e a aparência ficam separados do código, em `src/game/data/` e `src/game/art/`:

| Arquivo | Conteúdo |
|---|---|
| `data/dialogues.ts` | Todas as falas: prólogo, moradores, portas, fechadura e pedido |
| `data/discoveries.ts` | As lembranças, em ordem: título, mensagem, pista e qual vem antes |
| `data/letter.ts` | A carta (páginas e assinatura) e a mensagem final |
| `data/interactions.ts` | Moradores (posição, aparência, roteiro) e pontos de interação |
| `data/locations.ts` | Os prédios e a praça |
| `data/cityLayout.ts` | Ruas, postes, bancos, canteiros, lago e ponto de partida |
| `data/credits.ts` | Créditos do menu |
| `art/character.ts` | Aparência da Larissa e do Anderson (cabelo, roupas, cores) |
| `art/buildings.ts` | Desenho de cada prédio |

### Acrescentar uma lembrança

1. Crie o prédio em `data/locations.ts` (se for um lugar novo) e o desenho dele em `art/buildings.ts`.
2. Escreva as falas em `data/dialogues.ts`.
3. Crie a lembrança em `data/discoveries.ts`, com `requires` apontando para a anterior, e ajuste o `requires` da seguinte.
4. Adicione o morador ou o ponto de interação em `data/interactions.ts`.

O contador, a fechadura, o diário e as pistas se ajustam sozinhos à nova quantidade. Só as falas da fechadura (`casaLocked` e `casaUnlocked`) dizem o número de encaixes por extenso.

## Estrutura

```
src/
├── main.ts              # inicia o jogo, ajusta o tamanho ao girar a tela, liga a música
├── assets/audio/        # trilha sonora
├── styles/main.css
└── game/
    ├── config.ts        # configuração do Phaser
    ├── constants.ts     # cores e cálculo do tamanho da tela
    ├── art/             # desenhos gerados por código (prédios, personagens, cena final)
    ├── data/            # textos e posições editáveis
    ├── entities/        # Player e NPC
    ├── scenes/          # Boot, Preload, Menu, City, HUD e Final
    ├── systems/         # diálogo, descobertas, progresso, save, música, entrada
    ├── ui/              # botões, diário, carta, revelação, controles de toque
    ├── utils/
    └── world/           # montagem da cidade e das interações
```

## Tecnologias

- [Phaser 3](https://phaser.io/) 3.90 — motor do jogo
- [TypeScript](https://www.typescriptlang.org/) 5.9
- [Vite](https://vite.dev/) 8 — servidor de desenvolvimento e build
- GitHub Actions + GitHub Pages — publicação

Sem backend, sem banco de dados e sem APIs externas.

---

Feito para o amor da minha vida.
