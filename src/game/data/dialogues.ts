/**
 * Falas de Lunária. `speaker` vazio = narração (sem placa de nome).
 * Mantenha cada fala curta (até ~3 linhas na caixa de diálogo).
 *
 * A história é a da Larissa e do Anderson, do primeiro olhar na rua até o
 * pedido de namoro, contada pela cidade em segunda pessoa.
 */
export interface DialogueLine {
  speaker: string;
  text: string;
}

const N = ''; // narração

const AURORA = 'Dona Aurora';
const ESTELINO = 'Seu Estelino';
const FLORA = 'Flora';
const PAGINA = 'Dona Página';
const THEO = 'Theo';
const BENTO = 'Seu Bento';
export const ANDERSON = 'Anderson';
/** Como ela passou a chamá-lo depois do "sim". */
export const MEU_BEM = 'Meu bem';

export const DIALOGUES = {
  // --- Prólogo ---
  prologue: [
    { speaker: N, text: 'Larissa, bem-vinda a Lunária.' },
    { speaker: N, text: 'Essa cidade não aparece em mapa nenhum. Ela foi construída com memórias: as suas e as de alguém que pensa muito em você.' },
    { speaker: N, text: 'Cada lugar guarda um pedaço de como essa história começou.' },
    { speaker: N, text: 'Lá no alto da avenida fica a Casa do Futuro. A porta dela só abre quando todas as lembranças voltarem a brilhar.' },
    { speaker: N, text: 'Suba a avenida até a Praça das Luzes. Tudo começou numa rua qualquer.' },
  ],

  // --- Capítulo 1: Praça das Luzes ---
  theoFirst: [
    { speaker: THEO, text: 'Boa noite, Larissa! Eu acendo os lampiões daqui e reparo em todo mundo que passa.' },
    { speaker: THEO, text: 'Teve um garoto de cabelo cacheado, todo de preto, que te viu por essa rua uma ou duas vezes.' },
    { speaker: THEO, text: 'Sabe aquela música, Serendipity? É sobre isso: um acaso que, olhando pra trás, parece destino.' },
    { speaker: THEO, text: 'Faz um pedido na fonte. Ela lembra das coisas que a gente quase não notou.' },
  ],
  theoRepeat: [{ speaker: THEO, text: 'A fonte tá logo ali. Uma moedinha e um pedido, de coração.' }],
  theoDone: [
    { speaker: THEO, text: 'A Dona Página, da biblioteca, guarda as conversas dessa cidade. Dizem que uma delas deu trabalho.' },
  ],
  fountainWish: [{ speaker: N, text: 'Você joga uma moedinha. Na água, aparece uma rua comum, numa tarde comum…' }],
  fountainAfter: [{ speaker: N, text: 'A água ainda mostra aquela rua. Algumas tardes comuns mudam tudo.' }],

  // --- Capítulo 2: Biblioteca dos Segredos ---
  paginaEarly: [{ speaker: PAGINA, text: 'Shhh… essa página ainda não chegou, Larissa. Toda história tem um começo.' }],
  paginaFirst: [
    { speaker: PAGINA, text: 'Shhh… Ah, é você, Larissa. Eu estava te esperando.' },
    { speaker: PAGINA, text: 'Aqui ficam guardadas todas as conversas de Lunária. A de vocês tem uma página bem engraçada.' },
    { speaker: PAGINA, text: 'Ele puxou assunto. Você respondeu pouquinho. Ele pediu outra rede social pra conversarem melhor… e você nem nada.' },
    { speaker: PAGINA, text: 'Mas esse livro tem mania de fugir e voltar. Ouvi ele farfalhando atrás da biblioteca.' },
  ],
  paginaRepeat: [{ speaker: PAGINA, text: 'Atrás da biblioteca, querida. Livro fujão não vai longe.' }],
  paginaDone: [
    { speaker: PAGINA, text: 'Tem livro que a gente fecha e ele se abre sozinho de novo. A Dona Aurora, da cafeteria, sabe o que veio depois.' },
  ],
  bookSpot: [{ speaker: N, text: 'Atrás da biblioteca, um livrinho de capa vermelha, aberto numa página marcada.' }],

  // --- Capítulo 3: Cafeteria da Lua ---
  auroraEarly: [{ speaker: AURORA, text: 'Ainda não é hora dessa lembrança, querida. Mas a porta daqui tá sempre aberta pra você.' }],
  auroraFirst: [
    { speaker: AURORA, text: 'Boa noite, querida! Hoje a cafeteria virou açaiteria, só pra lembrar daquela noite.' },
    { speaker: AURORA, text: 'Ele te chamou pra sair uma vez, e não deu. Chamou de novo, e também não. Na terceira, decidiu que seria a última tentativa.' },
    { speaker: AURORA, text: 'Você avisou que sua prima ia junto. Ele respondeu que não tinha problema nenhum, que só queria te ver.' },
    { speaker: AURORA, text: 'Vocês falaram de jogo, de LoL, de anime, de música… e o açaí para finalizar.' },
    { speaker: AURORA, text: 'No fim da noite você precisava ir embora. E deixou uma coisa pra ele guardar pra sempre.' },
  ],
  auroraAfter: [{ speaker: AURORA, text: 'Vocês saíram de novo, e de novo. O Seu Estelino, do cinema, viu tudo.' }],

  // --- Capítulo 4: Cinema das Estrelas ---
  estelinoEarly: [{ speaker: ESTELINO, text: 'A sessão de vocês ainda não começou, Larissa. Mas eu já guardei os lugares.' }],
  estelinoFirst: [
    { speaker: ESTELINO, text: 'Sessão especial, Larissa! Reservei duas poltronas no meio.' },
    { speaker: ESTELINO, text: 'O filme daquela noite foi Michael. Lembro bem, porque vocês saíram comentando até a calçada.' },
    { speaker: ESTELINO, text: 'Depois vieram outros passeios: o parque de diversões, o Ranger girando lá no alto, e um monte de lugares no meio do caminho.' },
    { speaker: ESTELINO, text: 'Tem uma coisa presa no cartaz, do lado esquerdo da porta. Acho que é sua.' },
  ],
  estelinoRepeat: [{ speaker: ESTELINO, text: 'O cartaz do lado esquerdo da porta. Pode olhar, é seu.' }],
  estelinoDone: [
    { speaker: ESTELINO, text: 'O Seu Bento, do Empório da Meia-Noite, aqui do lado, tá guardando uma coisa geladinha pra você.' },
  ],
  cinemaPoster: [{ speaker: N, text: 'Presos com uma fita: um ingresso de cinema e uma pulseirinha do parque de diversões.' }],
  cinemaPosterAfter: [{ speaker: N, text: 'O ingresso de Michael e a pulseira do parque continuam ali, lado a lado.' }],

  // --- Capítulo 5: Empório da Meia-Noite ---
  bentoEarly: [
    { speaker: BENTO, text: 'Opa, Larissa! Ainda tô arrumando a geladeira. Passa aqui depois, que eu vou ter uma coisa pra você.' },
  ],
  bentoFirst: [
    { speaker: BENTO, text: 'Opa, boa noite, Larissa! Bem-vinda ao Empório da Meia-Noite. Suco, refrigerante, tudo geladinho.' },
    { speaker: BENTO, text: 'Mas cá entre nós: pra aguentar a noite, nada como um energético. E o melhor é o Monster, sem dúvida.' },
    { speaker: BENTO, text: 'E eu sei que você gosta de Monster, viu? A cidade inteira sabe.' },
    { speaker: BENTO, text: 'Agora escuta essa: o último cliente que passou aqui levou um Monster branco. Um menino de cabelo cacheado, todo vestido de preto.' },
    { speaker: BENTO, text: 'Só que ele também deixou pago um Mango Loco, pra próxima pessoa que viesse comprar.' },
    { speaker: BENTO, text: 'Ele pediu aos céus que fosse você. Disse que ia ficar triste se outra pessoa levasse o último.' },
    { speaker: BENTO, text: 'Então pega, é seu. Tá geladinho.' },
  ],
  bentoAfter: [
    { speaker: BENTO, text: 'Volta sempre, viu? E passa na Flora, da floricultura. Ela anda guardando um segredo.' },
  ],
  emporioDoor: [
    { speaker: N, text: 'Prateleiras de sucos e refrigerantes, e uma geladeira que zumbe baixinho, cheia de latinhas coloridas.' },
  ],

  // --- Capítulo 6: Floricultura dos Desejos ---
  floraEarly: [{ speaker: FLORA, text: 'Oi, Larissa! Eu tô guardando uma coisa pra você… mas ainda não é a hora.' }],
  floraFirst: [
    { speaker: FLORA, text: 'Larissa! Ainda bem que você chegou, eu já não aguentava guardar segredo.' },
    { speaker: FLORA, text: 'Um dia, um rapaz todo de preto entrou aqui nervoso. Queria as rosas mais bonitas da loja.' },
    { speaker: FLORA, text: 'Perguntou de chocolate, de presente, de embrulho… e ficou o tempo todo conferindo uma caixinha no bolso.' },
    { speaker: FLORA, text: 'Ensaiou o que ia dizer umas dez vezes aqui na minha frente. Errou todas.' },
    { speaker: FLORA, text: 'Essa rosa ficou pra trás. Leva com você.' },
  ],
  floraAfter: [{ speaker: FLORA, text: 'Agora vai. A Casa do Futuro tá te esperando lá no alto da avenida.' }],

  // --- Segredo: lago ---
  lakeSpot: [{ speaker: N, text: 'A água está diferente hoje. Em vez de estrelas, passam fotos, uma atrás da outra.' }],

  // --- Portas ---
  cafeteriaDoor: [{ speaker: N, text: 'Pela janela, mesinhas redondas e duas tigelas de açaí esquecidas no balcão.' }],
  cinemaDoor: [{ speaker: N, text: 'O letreiro pisca devagar. Lá dentro, duas poltronas do meio parecem reservadas.' }],
  floriculturaDoor: [{ speaker: N, text: 'A vitrine está cheia de rosas. Uma delas parece estar faltando.' }],
  bibliotecaDoor: [{ speaker: N, text: 'Pelas janelas em arco, estantes que sobem até o teto. Um livro vira a página sozinho.' }],

  // --- Casa do Futuro ---
  casaLocked: [
    { speaker: N, text: 'A porta está trancada. Na fechadura, uma estrela de quatro pontas com seis encaixes, um pra cada lembrança.' },
  ],
  casaUnlocked: [
    { speaker: N, text: 'Os seis encaixes brilham juntos. A fechadura gira sozinha, devagar, como quem estava esperando por você.' },
  ],

  // --- O pedido (cena final, na Casa do Futuro). Texto do Anderson. ---
  proposal: [
    { speaker: ANDERSON, text: 'Oi, meu bem. Tivemos ótimos momentos até agora, e não só os que foram representados aqui, mas também os que ainda vão vir.' },
    { speaker: ANDERSON, text: 'São tantas fotos, tantos momentos, tantas risadas compartilhadas… e a conexão no olhar que já estava se formando desde o primeiro dia em que nos vimos.' },
    { speaker: ANDERSON, text: 'Prometo cuidar de você, meu amor. Zelar por você, te proteger e estar sempre ao seu lado, em todos os momentos.' },
    { speaker: ANDERSON, text: 'Você é o amor da minha vida.' },
    { speaker: ANDERSON, text: 'Larissa, você aceita namorar comigo?' },
  ],
  proposalYes: [
    { speaker: N, text: 'Ele sorri como quem ganhou o mundo. E, desde aquele dia, você nunca mais o chamou pelo nome.' },
    { speaker: MEU_BEM, text: 'Obrigado por ter aceitado. Agora tem uma coisa que eu quero que você leia.' },
  ],
} satisfies Record<string, readonly DialogueLine[]>;

export type DialogueId = keyof typeof DIALOGUES;

/** Narração que aponta onde está a próxima lembrança. */
export function nextMemoryLine(place: string): DialogueLine {
  return { speaker: '', text: `A próxima lembrança espera por você em: ${place}.` };
}

/** Fala dinâmica da fechadura da Casa do Futuro. */
export function casaProgressLine(found: number, total: number): DialogueLine {
  const text =
    found === 0
      ? 'Nenhum encaixe aceso ainda.'
      : `${found} de ${total} encaixes acesos. ${total - found === 1 ? 'Falta só um.' : `Faltam ${total - found}.`}`;
  return { speaker: '', text };
}
