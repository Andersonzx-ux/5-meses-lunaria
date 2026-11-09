import type { LocationId } from './locations';

/**
 * As lembranças de Lunária, em ordem cronológica. Cada capítulo só fica
 * disponível depois do anterior (`requires`). As obrigatórias acendem os
 * encaixes da porta da Casa do Futuro; o segredo é opcional.
 */
export type DiscoveryId =
  | 'olhar-na-rua'
  | 'perfil-voltou'
  | 'primeiro-beijo'
  | 'ingresso-pulseira'
  | 'monster-manga'
  | 'rosa'
  | 'seiscentas-fotos';

export interface DiscoveryData {
  id: DiscoveryId;
  location: LocationId | 'lago';
  title: string;
  message: string;
  required: boolean;
  /** Lembrança que precisa ter sido encontrada antes desta. */
  requires?: DiscoveryId;
  /** Pista mostrada no diário enquanto esta for a próxima lembrança. */
  hint: string;
}

export const DISCOVERIES: readonly DiscoveryData[] = [
  {
    id: 'olhar-na-rua',
    location: 'praca',
    title: 'Duas vezes na mesma rua',
    message:
      'Ele já tinha te visto na rua uma ou duas vezes, sem saber quem você era. Até que chegou uma solicitação de amizade no celular dele. Era você.',
    required: true,
    hint: 'A fonte da praça lembra de uma rua…',
  },
  {
    id: 'perfil-voltou',
    location: 'biblioteca',
    title: 'O perfil que voltou',
    message:
      'Dias depois, a rede social recomendou o seu perfil pra ele. Ele seguiu, mandou mensagem de novo, e dessa vez a conversa foi longe. Algumas histórias insistem em acontecer.',
    required: true,
    requires: 'olhar-na-rua',
    hint: 'Uma conversa guardada na biblioteca…',
  },
  {
    id: 'primeiro-beijo',
    location: 'cafeteria',
    title: 'Açaí e um beijo',
    message:
      'Foi na despedida. Um beijo no fim de uma noite que quase não aconteceu. Ali ele teve certeza: tinha conhecido o amor da vida dele.',
    required: true,
    requires: 'perfil-voltou',
    hint: 'Um último convite, na cafeteria…',
  },
  {
    id: 'ingresso-pulseira',
    location: 'cinema',
    title: 'Michael, o Ranger e o resto',
    message:
      'A cada passeio vocês se conheciam um pouco mais. As conversas ficaram mais longas, e as despedidas, mais difíceis.',
    required: true,
    requires: 'primeiro-beijo',
    hint: 'Um filme e um parque, no cinema…',
  },
  {
    id: 'monster-manga',
    location: 'emporio',
    title: 'O Mango Loco',
    message:
      'Um Monster branco pra ele e um Mango Loco para você, seu preferido. Ele pediu aos céus que fosse você. E foi.',
    required: true,
    requires: 'ingresso-pulseira',
    hint: 'Algo geladinho no Empório…',
  },
  {
    id: 'rosa',
    location: 'floricultura',
    title: 'A rosa que sobrou',
    message:
      'Rosas, chocolate, presentes e uma caixinha com duas alianças. Era 12 de junho de 2026, Dia dos Namorados, e ele tinha uma pergunta pra te fazer.',
    required: true,
    requires: 'monster-manga',
    hint: 'Rosas escolhidas na floricultura…',
  },
  {
    id: 'seiscentas-fotos',
    location: 'lago',
    title: 'Mais de 600 fotos',
    message:
      'Mais de seiscentas fotos juntos, e contando. Cada uma guarda um dia em que vocês escolheram ficar perto.',
    required: false,
    requires: 'primeiro-beijo',
    hint: 'Um segredo escondido…',
  },
];

export const REQUIRED_DISCOVERIES = DISCOVERIES.filter((d) => d.required).length;

export function getDiscovery(id: DiscoveryId): DiscoveryData {
  const found = DISCOVERIES.find((d) => d.id === id);
  if (!found) throw new Error(`Lembrança desconhecida: ${id}`);
  return found;
}
