export type Role = 'MEDICO' | 'ADMIN';
export type BoletimStatus = 'PREENCHENDO' | 'FINALIZADO' | 'ARQUIVADO' | 'ENVIADO_PLANO';
export type StatusCobranca = 'PENDENTE' | 'ENVIADO' | 'PAGO' | 'GLOSADO';

export interface User {
  id: string;
  nome: string;
  email: string;
  role: Role;
  cremers?: string;
}

export interface Patient {
  id?: string;
  nome: string;
  sexo?: string;
  cor?: string;
  dataNascimento?: string;
  filiacao?: string;
  prontuario?: string;
  atendimento?: string;
  medicoResponsavel?: string;
  docCpf?: string;
  endereco?: string;
}

export interface SistemaClinico {
  semParticularidades: boolean;
  anotacoes?: string;
  ecg?: string;
  fc?: string;
  pa?: string;
  cine?: string;
  fe?: string;
  ecoSP?: boolean;
  ecoFE?: string;
  pao2?: string;
  pco2?: string;
  espirometria?: string;
  vef1?: string;
}

export interface ViaAerea {
  semParticularidades: boolean;
  anotacoes?: string;
}

export interface AlergiaField {
  nega: boolean;
  texto?: string;
}

export interface BooleanTextField {
  sim: boolean;
  texto?: string;
}

export interface NegaTextField {
  nega: boolean;
  texto?: string;
}

export interface SinalVital {
  hora: string;
  pa?: string;
  fc?: string;
  spo2?: string;
  etco2?: string;
}

export interface TecnicaIntraop {
  tipo: 'geral' | 'raqui' | 'peridural' | 'sedacao' | 'bloqueio' | '';
  // Geral
  geralInducao?: string;
  geralAdministracao?: string;
  // Raqui
  raquiAgulha?: string;
  raquiEspaco?: string;
  raquiMedicacao?: string;
  raquiVolume?: string;
  // Peridural
  periduralAgulha?: string;
  periduralEspaco?: string;
  periduralMedicacao?: string;
  periduralVolume?: string;
  // Bloqueio
  bloqueioDescricao?: string;
}

export interface ViaAereaIntraop {
  tipo: 'canula_nasal' | 'mascara_laringea' | 'tet' | '';
  numero?: string;
}

export interface Puncoes {
  venosa?: string;
  arterial?: string;
}

export interface MonitorizacaoIntraop {
  ecg: boolean;
  spo2: boolean;
  etco2: boolean;
  bis: boolean;
  pam: boolean;
  temperatura: boolean;
  outros?: string;
}

export interface Fluidos {
  srl?: string;
  sf09?: string;
  ringerlactato?: string;
  outro?: string;
  total?: string;
}

export interface AltaAnestesica {
  destino: 'srpa' | 'uti' | 'enfermaria' | 'domicilio' | 'outro' | '';
  destinoOutro?: string;
  consciente: boolean;
  orientado: boolean;
  semDor: boolean;
  hemodinamicamenteEstavel: boolean;
  respirandoEspontaneamente: boolean;
  saturacaoAdequada: boolean;
  observacoes?: string;
}

export interface BoletimForm {
  // Paciente
  patient: Patient;
  // Dados cirurgia
  horaCirurgia?: string;
  dataCirurgia?: string;
  procedimento?: string;
  tipoConvenioNome?: string;
  convenioId?: string;
  matriculaConvenio?: string;
  cirurgiao?: string;
  telefoneCirurgiao?: string;
  // Estado físico
  asaEstado?: number;
  tipoCirurgia?: string;
  ambulatorialInternado?: string;
  semParticularidades: boolean;
  // Sistemas
  cardiovascular: SistemaClinico;
  respiratorio: SistemaClinico;
  neurologico: SistemaClinico;
  endocrinoReprodutor: SistemaClinico;
  oncologico: SistemaClinico;
  digestivo: SistemaClinico;
  renalUrinario: SistemaClinico;
  ortopedico: SistemaClinico;
  // Exames
  ht?: string; hb?: string; na?: string; k?: string; creatinina?: string;
  ureia?: string; glicose?: string; tp?: string; ttp?: string; plaquetas?: string;
  outroExame?: string;
  // Medicações
  medicacoesEmUso?: string;
  preMedicacao?: string;
  npoDas?: string;
  // Cirurgias prévias
  cirurgiasPrevias?: string;
  // Via aérea
  viaAerea: ViaAerea;
  mallampatti?: string;
  iotDificil?: boolean;
  alergias: AlergiaField;
  sangramentosHematologia: NegaTextField;
  medicamentosEspeciais: BooleanTextField;
  monitorizacaoEspecial: BooleanTextField;
  // Técnica
  tecnicaGeral: boolean;
  tecnicaSedacao: boolean;
  tecnicaCondutiva: boolean;
  tecnicaLocalMonit: boolean;
  // Técnica intraoperatória (segunda folha)
  posicaoPaciente?: string;
  horaInicioAnestesia?: string;
  horaInicioCirurgia?: string;
  horaFimCirurgia?: string;
  sinaisVitais: SinalVital[];
  tecnicaIntraop: TecnicaIntraop;
  viaAereaIntraop: ViaAereaIntraop;
  puncoes: Puncoes;
  medicacoesIntraop?: string;
  monitorizacao: MonitorizacaoIntraop;
  fluidos: Fluidos;
  diurese?: string;
  sangue?: string;
  altaAnestesica: AltaAnestesica;
  // Anestesiologista
  anestesiologistaNome?: string;
  cremers?: string;
  horaFim?: string;
  dataFim?: string;
  observacoes?: string;
  // Assinatura
  assinatura?: string;
  status?: BoletimStatus;
}

export interface Boletim extends Omit<BoletimForm, 'patient'> {
  id: string;
  patientId: string;
  userId: string;
  status: BoletimStatus;
  statusCobranca: StatusCobranca;
  obsAdmin?: string;
  createdAt: string;
  updatedAt: string;
  user?: { nome: string; cremers?: string };
  patient?: Patient;
}

export interface BoletimListItem {
  id: string;
  status: BoletimStatus;
  statusCobranca: StatusCobranca;
  dataCirurgia?: string;
  procedimento?: string;
  tipoConvenioNome?: string;
  createdAt: string;
  patient?: { nome: string; prontuario?: string };
  user?: { nome: string };
}
