import { z } from "zod";

export const FIELD_STATUSES = ["pend", "conf", "na", "ok"] as const;
export type FieldStatus = (typeof FIELD_STATUSES)[number];

export type FieldMetaItem = {
  status?: FieldStatus;
  note?: string;
  updatedAt?: string;
};

export type FieldMetaRecord = Record<string, FieldMetaItem>;

export type PhoneItem = {
  id: string;
  numero: string;
  rotulo?: string;
  isWhats: boolean;
  tags: string[]; // "recepcao", "seguranca_2fa", "financeiro", "emergencia"
};

export type EmailItem = {
  id: string;
  email: string;
  rotulo?: string;
  tags: string[]; // "recepcao", "seguranca_2fa", "mensagens", "financeiro"
};

export type ContactPerson = {
  id: string;
  nome: string;
  funcao: string;
  telefone?: string;
  whatsapp?: boolean;
  email?: string;
  aprova?: string;
};

export type BedConfig = {
  id: string;
  casal: number;
  queen: number;
  king: number;
  solteiro: number;
  beliche: number;
  treliche?: number;
  sofa: number;
  camaAuxiliar?: number;
  outro?: number;
  outroDesc?: string;
  obs?: string;
};

export type UnitDiff = {
  id: string;
  unidade: string;
  andar?: string;
  vista?: string;
  tamanho?: string;
  tem?: string;
  naoTem?: string;
  acessivel?: boolean;
  fotos?: string;
  obs?: string;
};

export type RoomCategoryItem = {
  id: string;
  nome: string;
  tipoVenda: string;
  tipoQuarto: string;
  quantidade: number;
  identificacao: string;
  tamanho?: number;
  andar?: string;
  vista?: string;
  maxAdultos: number;
  maxCriancas: number;
  maxTotal: number;
  ocupPadrao: number;
  camas: BedConfig[];
  banheiro: string;
  chuveiro: string;
  camaExtra: string;
  camaExtraValor?: string;
  acessivel: boolean;
  isDormitorio?: boolean;
  dormGenero?: string;
  dormLockers?: boolean;
  dormBanheiroDentro?: boolean;
  isUnidadeInteira?: boolean;
  unidadeQuartos?: number;
  unidadeBanheiros?: number;
  unidadeCozinha?: string;
  unidadeAreaExterna?: boolean;
  descricaoCurta?: string;
  descricaoLonga?: string;
  difs: UnitDiff[];
};

export type OtherChannelItem = {
  id: string;
  nome: string;
  situacao: "possui" | "a_cadastrar" | "nao_contratado";
  linkId?: string;
  obs?: string;
};

export type ExtraServiceItem = {
  id: string;
  nome: string;
  cobranca: string;
  valor?: string;
  agendamento?: boolean;
  obs?: string;
};

export type ChildAgeRule = {
  id: string;
  de: number;
  ate: number;
  regra: string;
  valor?: string;
  limite?: number;
  obs?: string;
};

export type CancellationRule = {
  id: string;
  ant: number;
  un: "dias" | "horas";
  reemb: number;
};

export type PaymentPlanItem = {
  id: string;
  nome: string;
  formas?: string[];
  entrada?: number;
  prazoEntrada?: string;
  restante?: string;
  desconto?: number;
  parcelas?: number;
  parcelaMin?: string;
  acrescimo?: number;
  naoPago?: string;
  obs?: string;
};

export type PointOfInterest = {
  id: string;
  nome: string;
  tipo: string;
  dist: string;
};

export type CompetitiveDiff = {
  id: string;
  titulo: string;
  texto: string;
};

export type ChecklistData = {
  // Mod 1: Identificação
  nomeFantasia?: string;
  razaoSocial?: string;
  cnpj?: string;
  inscMunicipal?: string;
  inscEstadual?: string;
  nire?: string;
  cadastur?: string;
  titularNome?: string;
  titularCpf?: string;
  tipoPropriedade?: string;
  totalUnidades?: number;
  inauguracao?: string;
  ultimaReforma?: string;
  reformaDesc?: string;

  // Mod 2: Contatos
  telefones?: PhoneItem[];
  emails?: EmailItem[];
  emailReservas?: string;
  emailFinanceiro?: string;
  emailExclusivo?: string;
  site?: string;
  responsaveis?: ContactPerson[];
  recepcao24h?: boolean;
  recepcaoInicio?: string;
  recepcaoFim?: string;

  // Mod 3: Canais e Sistemas
  canais?: Record<string, { status: "possui" | "a_cadastrar" | "nao_contratado"; link?: string; idProp?: string; obs?: string }>;
  usaFoco?: boolean;
  channelManagerOutro?: string;
  pmsOutro?: string;
  pmsAcessoOutro?: string;
  motorReservasLink?: string;
  cmNome?: string;
  cmObs?: string;
  pmsNome?: string;
  pmsObs?: string;
  sitePropriedade?: string;
  outrosCanais?: OtherChannelItem[];

  // Mod 4: Instalações & Serviços (e Endereço compartilhado)
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  mapsLink?: string;
  comoChegar?: string;
  idiomas?: string[];
  cafe?: string; // "Incluso na diária" | "Pago à parte" | "Não oferece"
  cafeValor?: string;
  cafeTipo?: string;
  cafeInicio?: string;
  cafeFim?: string;
  outrasRefeicoes?: string[];
  mealPlan?: string;
  restauranteProprio?: boolean;
  refeicoesRestaurante?: string[];
  cafeFormato?: string;
  cafeHorario?: string;
  restauranteHorario?: string;
  estac?: string; // "Gratuito" | "Pago" | "Não possui"
  estacValor?: string;
  estacTipo?: string;
  estacCobertura?: string;
  estacVagas?: number;
  estacCoberto?: boolean;
  estacReserva?: boolean;
  estacObs?: string;
  wifi?: string;
  facilidades?: Record<string, { on: boolean; det?: string }>;
  facilidadesExtras?: ExtraServiceItem[];
  servicos?: ExtraServiceItem[];
  regimesAlimentacao?: string[];

  // Mod 5: Acomodações
  categorias?: RoomCategoryItem[];

  // Mod 6: Matriz de Comodidades
  comodidades?: Record<string, { escopo: "todas" | "algumas" | "nenhuma"; categoriasIds?: string[]; det?: string }>;

  // Mod 7: Políticas
  checkinInicio?: string;
  checkinFim?: string;
  checkoutInicio?: string;
  checkoutFim?: string;
  earlyCheckin?: string;
  early?: string;
  earlyValor?: string;
  earlyUnid?: string;
  lateCheckout?: string;
  late?: string;
  lateValor?: string;
  lateUnid?: string;
  metodoAcesso?: string[];
  detalhesAcesso?: string;
  limpezaFrequencia?: string;
  trocaEnxoval?: string;
  taxaLimpezaEstadia?: string;
  idadeMinima?: number;
  documentos?: string[];
  menores?: string;
  criancas?: ChildAgeRule[];
  criancasGratisAte?: number;
  berco?: string;
  bercoValor?: string;
  cancelamento?: CancellationRule[];
  cancelamentoRegra?: string;
  cancelamentoDias?: number;
  cancelamentoReembolso?: number;
  cancelDepois?: string;
  noShow?: string;
  noShowRegra?: string;
  cancelObs?: string;
  prePagamento?: string;
  caucao?: string | boolean;
  caucaoValor?: string;
  pets?: string;
  petPorte?: string[];
  petPortes?: string[];
  petTaxa?: string;
  petQtd?: number;
  petRegras?: string;
  fumantes?: string;
  fumantesDet?: string;
  festas?: string;
  festasDet?: string;
  silencioInicio?: string;
  silencioFim?: string;
  visitantes?: string;
  visitantesDet?: string;
  iss?: string;
  taxaServico?: string;
  taxaTurismo?: string;
  outrasPoliticas?: string;
  regulamento?: string;

  // Mod 8: Pagamentos & Repasses
  pix?: boolean;
  transf?: boolean;
  cartao?: boolean;
  bandeiras?: string[];
  outrasFormas?: string[];
  formasBalcao?: string[];
  cartaoParcelas?: number;
  planos?: PaymentPlanItem[];
  aConfirmarFoco?: boolean;
  pagObs?: string;
  alinhamentoComissoes?: boolean;
  alinhamentoMarkup?: boolean;
  alinhamentoAceite?: boolean;
  obsComerciais?: string;
  titular?: string;
  titularConta?: string;
  docTitular?: string;
  docConta?: string;
  banco?: string;
  bancoCod?: string;
  bancoNome?: string;
  agencia?: string;
  conta?: string;
  tipoConta?: string;
  chavePix?: string;

  // Mod 9: Localização & Arredores
  aeroporto?: string;
  aeroportoNome?: string;
  aeroportoDist?: string;
  rodoviaria?: string;
  rodoviariaNome?: string;
  rodoviariaDist?: string;
  pontos?: PointOfInterest[];
  rotas?: string;
  eventos?: string;

  // Mod 10: Mídia, Fotos & Textos
  siteOficial?: string;
  instagram?: string;
  drivePastaGeral?: string;
  linkGeral?: string;
  fotosExtras?: Array<{ id: string; nome: string; st: string; link: string }>;
  driveQuartos?: Record<string, { link?: string; status: string }>;
  driveAreas?: Record<string, { link?: string; status: string }>;
  sobreCurto?: string;
  sobreLongo?: string;
  espaco?: string;
  descCurta?: string;
  descLonga?: string;
  oEspaco?: string;
  acessoHospede?: string;
  vizinhanca?: string;
  locomover?: string;
  outrasInfo?: string;
  diferenciais?: CompetitiveDiff[];
  publico?: string[];
  publicoOutro?: string;
  publicos?: string[];
};

export type ChecklistModuleDefinition = {
  id: string;
  index: string;
  title: string;
  description: string;
  requiredFields: Array<{ key: keyof ChecklistData; label: string }>;
};

export const CHECKLIST_MODULES: ChecklistModuleDefinition[] = [
  {
    id: "identificacao",
    index: "01",
    title: "Identificação",
    description: "Razão Social, Nome Fantasia, CNPJ e registros fiscais.",
    requiredFields: [
      { key: "razaoSocial", label: "Razão Social" },
      { key: "nomeFantasia", label: "Nome Fantasia" },
      { key: "cnpj", label: "CNPJ" },
      { key: "inscMunicipal", label: "Inscrição Municipal" },
      { key: "titularNome", label: "Nome do Titular" },
      { key: "titularCpf", label: "CPF do Titular" },
    ],
  },
  {
    id: "contatos",
    index: "02",
    title: "Contatos",
    description: "Telefones etiquetados (Recepção, 2FA/SMS, Financeiro) e e-mails oficiais.",
    requiredFields: [{ key: "emailReservas", label: "E-mail de Reservas" }],
  },
  {
    id: "canais",
    index: "03",
    title: "Canais e sistemas",
    description: "Canais trabalhados, status cadastral e integração FOCO/PMS.",
    requiredFields: [],
  },
  {
    id: "estrutura",
    index: "04",
    title: "Instalações e serviços",
    description: "Endereço, Google Maps, horários de recepção/check-in, refeições e áreas comuns.",
    requiredFields: [
      { key: "cep", label: "CEP" },
      { key: "logradouro", label: "Logradouro" },
      { key: "numero", label: "Número" },
      { key: "bairro", label: "Bairro" },
      { key: "cidade", label: "Cidade" },
      { key: "uf", label: "UF" },
      { key: "mapsLink", label: "Link do Google Maps" },
      { key: "checkinInicio", label: "Início do Check-in" },
      { key: "checkoutFim", label: "Horário de Check-out" },
    ],
  },
  {
    id: "acomodacoes",
    index: "05",
    title: "Acomodações",
    description: "Categorias de quartos, inventário, leitos e capacidades.",
    requiredFields: [],
  },
  {
    id: "comodidades",
    index: "06",
    title: "Comodidades dos quartos",
    description: "Matriz em 3 estados (Todas / Algumas / Nenhuma) para os 33 itens.",
    requiredFields: [],
  },
  {
    id: "politicas",
    index: "07",
    title: "Políticas",
    description: "Regras de cancelamento, crianças, animais (pets) e convivência.",
    requiredFields: [{ key: "cancelamentoRegra", label: "Regra de Cancelamento" }],
  },
  {
    id: "pagamentos",
    index: "08",
    title: "Pagamentos e comissões",
    description: "Dados bancários para repasses das OTAs e alinhamento de comissões/markup.",
    requiredFields: [
      { key: "titularConta", label: "Titular da Conta Bancária" },
      { key: "docConta", label: "CPF/CNPJ da Conta" },
      { key: "bancoNome", label: "Banco" },
      { key: "agencia", label: "Agência" },
      { key: "conta", label: "Conta Bancária" },
      { key: "chavePix", label: "Chave PIX" },
    ],
  },
  {
    id: "localizacao",
    index: "09",
    title: "Localização e arredores",
    description: "Aeroporto, rodoviária, pontos turísticos próximos e rotas de acesso.",
    requiredFields: [],
  },
  {
    id: "midia",
    index: "10",
    title: "Textos de venda",
    description: "Links das fotos no Google Drive e descrições completas para Booking e Airbnb.",
    requiredFields: [
      { key: "drivePastaGeral", label: "Pasta Mãe de Fotos no Google Drive" },
      { key: "descCurta", label: "Descrição Curta" },
      { key: "descLonga", label: "Descrição Completa" },
    ],
  },
];
