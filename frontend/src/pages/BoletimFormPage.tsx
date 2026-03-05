import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, FormProvider, useFormContext } from 'react-hook-form';
import { BoletimForm, SinalVital } from '../types';
import { useAuthStore } from '../store/auth';
import api from '../api';
import SistemaClinicoField from '../components/form/SistemaClinicoField';
import SignatureField from '../components/form/SignatureField';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, Save, CheckCircle } from 'lucide-react';

const SECTIONS = ['Paciente', 'Cirurgia', 'Estado Físico', 'Sistemas', 'Exames', 'Medicações', 'Via Aérea', 'Técnica Prévia', 'Intraoperatório', 'Alta', 'Assinatura'];

const defaultValues: BoletimForm = {
  patient: { nome: '' },
  semParticularidades: false,
  cardiovascular: { semParticularidades: false },
  respiratorio: { semParticularidades: false },
  neurologico: { semParticularidades: false },
  endocrinoReprodutor: { semParticularidades: false },
  oncologico: { semParticularidades: false },
  digestivo: { semParticularidades: false },
  renalUrinario: { semParticularidades: false },
  ortopedico: { semParticularidades: false },
  viaAerea: { semParticularidades: false },
  alergias: { nega: false },
  sangramentosHematologia: { nega: false },
  medicamentosEspeciais: { sim: false },
  monitorizacaoEspecial: { sim: false },
  tecnicaGeral: false,
  tecnicaSedacao: false,
  tecnicaCondutiva: false,
  tecnicaLocalMonit: false,
  sinaisVitais: [],
  tecnicaIntraop: { tipo: '' },
  viaAereaIntraop: { tipo: '' },
  puncoes: {},
  monitorizacao: { ecg: false, spo2: false, etco2: false, bis: false, pam: false, temperatura: false },
  fluidos: {},
  altaAnestesica: { destino: '', consciente: false, orientado: false, semDor: false, hemodinamicamenteEstavel: false, respirandoEspontaneamente: false, saturacaoAdequada: false },
};

export default function BoletimFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [section, setSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(id || null);
  const [convenios, setConvenios] = useState<{ id: string; nome: string }[]>([]);

  const methods = useForm<BoletimForm>({ defaultValues });

  useEffect(() => {
    api.get('/convenios').then(r => setConvenios(r.data));
    if (id) {
      api.get(`/boletins/${id}`).then(r => {
        const data = r.data;
        methods.reset({ ...defaultValues, ...data, patient: data.patient || { nome: '' } });
      });
    }
  }, [id, methods]);

  // Auto-fill anestesiologista from user
  useEffect(() => {
    if (user && !id) {
      methods.setValue('anestesiologistaNome', user.nome);
      methods.setValue('cremers', user.cremers || '');
    }
  }, [user, id, methods]);

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const data = methods.getValues();
      if (data.patient?.nome) autoSave(data);
    }, 30000);
    return () => clearInterval(interval);
  });

  const autoSave = useCallback(async (data: BoletimForm) => {
    try {
      if (savedId) {
        await api.put(`/boletins/${savedId}`, data);
      } else {
        const res = await api.post('/boletins', data);
        setSavedId(res.data.id);
      }
    } catch { /* silent */ }
  }, [savedId]);

  async function handleSave(status?: string) {
    setSaving(true);
    try {
      const data = methods.getValues();
      const payload = status ? { ...data, status } : data;
      if (savedId) {
        await api.put(`/boletins/${savedId}`, payload);
      } else {
        const res = await api.post('/boletins', payload);
        setSavedId(res.data.id);
        navigate(`/boletim/${res.data.id}/editar`, { replace: true });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalize() {
    const ok = window.confirm('Finalizar e salvar o boletim? Isso marcará como FINALIZADO.');
    if (!ok) return;
    await handleSave('FINALIZADO');
    navigate(savedId ? `/boletim/${savedId}` : '/');
  }

  const progress = Math.round(((section + 1) / SECTIONS.length) * 100);

  return (
    <FormProvider {...methods}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 pt-4 pb-2">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900 text-sm">{id ? 'Editar Boletim' : 'Novo Boletim'}</h1>
              <div className="text-xs text-gray-500">{SECTIONS[section]} ({section + 1}/{SECTIONS.length})</div>
            </div>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1"
            >
              <Save size={14} />
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
          {/* Progress */}
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-primary-600 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          {/* Section tabs */}
          <div className="flex gap-1 mt-2 overflow-x-auto pb-1 scrollbar-hide">
            {SECTIONS.map((s, i) => (
              <button
                key={s}
                onClick={() => setSection(i)}
                className={clsx(
                  'shrink-0 text-xs px-2.5 py-1 rounded-full transition-colors whitespace-nowrap',
                  i === section ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <form className="p-4 space-y-4">
          {section === 0 && <SecaoPaciente />}
          {section === 1 && <SecaoCirurgia convenios={convenios} />}
          {section === 2 && <SecaoEstadoFisico />}
          {section === 3 && <SecaoSistemas />}
          {section === 4 && <SecaoExames />}
          {section === 5 && <SecaoMedicacoes />}
          {section === 6 && <SecaoViaAerea />}
          {section === 7 && <SecaoTecnica />}
          {section === 8 && <SecaoIntraop />}
          {section === 9 && <SecaoAlta />}
          {section === 10 && <SecaoAssinatura />}
        </form>

        {/* Navigation */}
        <div className="sticky bottom-16 lg:bottom-0 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
          {section > 0 && (
            <button onClick={() => setSection(s => s - 1)} className="btn-secondary flex items-center gap-1">
              <ChevronLeft size={16} /> Anterior
            </button>
          )}
          <div className="flex-1" />
          {section < SECTIONS.length - 1 ? (
            <button onClick={() => setSection(s => s + 1)} className="btn-primary flex items-center gap-1">
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleFinalize} className="btn-primary flex items-center gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle size={16} /> Finalizar Boletim
            </button>
          )}
        </div>
      </div>
    </FormProvider>
  );
}

function SecaoPaciente() {
  const { register } = useFormContext<BoletimForm>();
  return (
    <div className="space-y-4">
      <div className="section-header">Dados do Paciente</div>
      <div className="card p-4 space-y-3 rounded-t-none">
        <Field label="Nome completo *"><input {...register('patient.nome', { required: true })} className="input-field" placeholder="Nome do paciente" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sexo">
            <select {...register('patient.sexo')} className="input-field">
              <option value="">Selecione</option>
              <option>Masculino</option><option>Feminino</option><option>Outro</option>
            </select>
          </Field>
          <Field label="Cor/Raça">
            <select {...register('patient.cor')} className="input-field">
              <option value="">Selecione</option>
              <option>Branca</option><option>Parda</option><option>Preta</option><option>Amarela</option><option>Indígena</option>
            </select>
          </Field>
        </div>
        <Field label="Data de Nascimento"><input type="date" {...register('patient.dataNascimento')} className="input-field" /></Field>
        <Field label="Filiação (Nome da mãe)"><input {...register('patient.filiacao')} className="input-field" placeholder="Nome da mãe" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prontuário"><input {...register('patient.prontuario')} className="input-field" placeholder="Nº do prontuário" /></Field>
          <Field label="Atendimento"><input {...register('patient.atendimento')} className="input-field" placeholder="Nº atendimento" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Doc/CPF"><input {...register('patient.docCpf')} className="input-field" placeholder="CPF" /></Field>
          <Field label="Médico Responsável"><input {...register('patient.medicoResponsavel')} className="input-field" /></Field>
        </div>
        <Field label="Endereço"><input {...register('patient.endereco')} className="input-field" placeholder="Endereço completo" /></Field>
      </div>
    </div>
  );
}

function SecaoCirurgia({ convenios }: { convenios: { id: string; nome: string }[] }) {
  const { register } = useFormContext<BoletimForm>();
  return (
    <div className="space-y-4">
      <div className="section-header">Dados da Cirurgia</div>
      <div className="card p-4 space-y-3 rounded-t-none">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora"><input type="time" {...register('horaCirurgia')} className="input-field" /></Field>
          <Field label="Data"><input type="date" {...register('dataCirurgia')} className="input-field" /></Field>
        </div>
        <Field label="Cirurgia / Procedimento Proposto">
          <textarea {...register('procedimento')} rows={3} className="input-field resize-none" placeholder="Descreva o procedimento..." />
        </Field>
        <Field label="Convênio">
          <select {...register('tipoConvenioNome')} className="input-field">
            <option value="">Selecione o convênio</option>
            {convenios.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
        </Field>
        <Field label="Matrícula no Convênio"><input {...register('matriculaConvenio')} className="input-field" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Cirurgião (Serviço)"><input {...register('cirurgiao')} className="input-field" /></Field>
          <Field label="Telefone"><input type="tel" {...register('telefoneCirurgiao')} className="input-field" placeholder="(51) 99999-9999" /></Field>
        </div>
        <Field label="Tipo de Atendimento">
          <div className="flex gap-3">
            {['Ambulatorial', 'Internado'].map(v => (
              <RadioBtn key={v} name="ambulatorialInternado" value={v} label={v} />
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

function SecaoEstadoFisico() {
  const { watch, setValue } = useFormContext<BoletimForm>();
  const asa = watch('asaEstado');
  const tipo = watch('tipoCirurgia');
  const sp = watch('semParticularidades');

  return (
    <div className="space-y-4">
      <div className="section-header">Estado Físico (ASA)</div>
      <div className="card p-4 space-y-4 rounded-t-none">
        <div>
          <label className="label">Estado Físico ASA</label>
          <div className="flex gap-2 flex-wrap">
            {[1,2,3,4,5,6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setValue('asaEstado', n)}
                className={clsx(
                  'w-12 h-12 rounded-xl font-bold text-lg border-2 transition-all',
                  asa === n ? 'bg-primary-700 text-white border-primary-700 scale-110' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Tipo de Cirurgia</label>
          <div className="flex gap-2 flex-wrap">
            {['Eletiva', 'Urgência', 'Emergência'].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setValue('tipoCirurgia', v)}
                className={clsx(
                  'px-4 py-2 rounded-lg font-medium border-2 transition-all text-sm',
                  tipo === v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => setValue('semParticularidades', !sp)}
            className={clsx(
              'w-full py-3 rounded-xl font-medium border-2 transition-all text-sm flex items-center justify-center gap-2',
              sp ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'
            )}
          >
            <span>{sp ? '✓' : '○'}</span>
            História clínica e exames físicos sem particularidades (SP)
          </button>
        </div>
      </div>
    </div>
  );
}

function SecaoSistemas() {
  const { register } = useFormContext<BoletimForm>();
  return (
    <div className="space-y-3">
      <div className="section-header">Sistemas Clínicos</div>
      <p className="text-xs text-gray-500 px-1">Toque em <strong>SP</strong> para marcar "Sem Particularidades".</p>
      <SistemaClinicoField name="cardiovascular" label="Cardiovascular" extra={
        <div className="grid grid-cols-2 gap-2 mt-1">
          {['ecg','fc','pa','cine','fe'].map(f => (
            <input key={f} {...register(`cardiovascular.${f as 'ecg'}`)} className="input-field-sm" placeholder={f.toUpperCase()} />
          ))}
        </div>
      }/>
      <SistemaClinicoField name="respiratorio" label="Respiratório" extra={
        <div className="grid grid-cols-2 gap-2 mt-1">
          {[['pao2','PaO₂'],['pco2','PCO₂'],['espirometria','Espirometria'],['vef1','VEF1']].map(([f,l]) => (
            <input key={f} {...register(`respiratorio.${f as 'pao2'}`)} className="input-field-sm" placeholder={l} />
          ))}
        </div>
      }/>
      <SistemaClinicoField name="neurologico" label="Neurológico" />
      <SistemaClinicoField name="endocrinoReprodutor" label="Endócrino / Reprodutor" />
      <SistemaClinicoField name="oncologico" label="Oncológico" />
      <SistemaClinicoField name="digestivo" label="Digestivo" />
      <SistemaClinicoField name="renalUrinario" label="Renal-Urinário" />
      <SistemaClinicoField name="ortopedico" label="Ortopédico" />
    </div>
  );
}

function SecaoExames() {
  const { register } = useFormContext<BoletimForm>();
  const labFields: [keyof BoletimForm, string][] = [
    ['ht','Ht'],['hb','Hb'],['na','Na'],['k','K'],['creatinina','Creatinina'],
    ['ureia','Uréia'],['glicose','Glicose'],['tp','TP'],['ttp','TTP'],['plaquetas','Plaquetas'],
  ];
  return (
    <div className="space-y-4">
      <div className="section-header">Exames e Laboratórios</div>
      <div className="card p-4 rounded-t-none">
        <div className="grid grid-cols-2 gap-3">
          {labFields.map(([name, label]) => (
            <Field key={name} label={label}>
              <input {...register(name)} inputMode="decimal" className="input-field" placeholder={`Valor de ${label}`} />
            </Field>
          ))}
        </div>
        <div className="mt-3">
          <Field label="Outro"><input {...register('outroExame')} className="input-field" /></Field>
        </div>
      </div>
    </div>
  );
}

function SecaoMedicacoes() {
  const { register } = useFormContext<BoletimForm>();
  return (
    <div className="space-y-4">
      <div className="section-header">Medicações</div>
      <div className="card p-4 space-y-4 rounded-t-none">
        <Field label="Medicações em uso / Dose / Horário">
          <textarea {...register('medicacoesEmUso')} rows={4} className="input-field resize-none" placeholder="Liste as medicações em uso..." />
        </Field>
        <Field label="Pré-medicação dosagens, horário">
          <textarea {...register('preMedicacao')} rows={2} className="input-field resize-none" />
        </Field>
        <Field label="NPO a partir das (horas)">
          <input type="time" {...register('npoDas')} className="input-field" />
        </Field>
        <Field label="Cirurgias / Anestesias prévias – Pós Operatório">
          <textarea {...register('cirurgiasPrevias')} rows={3} className="input-field resize-none" placeholder="Histórico de cirurgias e anestesias anteriores..." />
        </Field>
      </div>
    </div>
  );
}

function SecaoViaAerea() {
  const { register, watch, setValue } = useFormContext<BoletimForm>();
  const vaSP = watch('viaAerea.semParticularidades');
  const iotDificil = watch('iotDificil');
  const alergNega = watch('alergias.nega');
  const sangNega = watch('sangramentosHematologia.nega');
  const medSim = watch('medicamentosEspeciais.sim');
  const monSim = watch('monitorizacaoEspecial.sim');
  const mallampatti = watch('mallampatti');

  return (
    <div className="space-y-4">
      <div className="section-header">Via Aérea</div>
      <div className="card p-4 space-y-4 rounded-t-none">
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b">
            <span className="text-sm font-semibold text-primary-800">Via Aérea / Prótese</span>
            <button type="button" onClick={() => setValue('viaAerea.semParticularidades', !vaSP)}
              className={clsx('text-xs px-2.5 py-1 rounded-full font-medium border', vaSP ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-300')}>SP</button>
          </div>
          {!vaSP && <div className="p-3"><textarea {...register('viaAerea.anotacoes')} rows={2} className="input-field-sm resize-none" placeholder="Observações sobre via aérea..." /></div>}
        </div>

        <div>
          <label className="label">Mallampatti</label>
          <div className="flex gap-2">
            {['I','II','III','IV'].map(v => (
              <button key={v} type="button" onClick={() => setValue('mallampatti', v)}
                className={clsx('flex-1 py-3 rounded-xl font-bold border-2 transition-all',
                  mallampatti === v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">IOT difícil?</label>
          <div className="flex gap-2">
            {[['true','Sim','bg-red-600 border-red-600'],['false','Não','bg-green-600 border-green-600']].map(([val, lbl, active]) => (
              <button key={val} type="button" onClick={() => setValue('iotDificil', val === 'true')}
                className={clsx('flex-1 py-3 rounded-xl font-semibold border-2 transition-all text-sm',
                  String(iotDificil) === val ? `${active} text-white` : 'bg-white text-gray-700 border-gray-300')}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <ToggleNega label="Alergias" negaVal={alergNega} onToggle={() => setValue('alergias.nega', !alergNega)}>
          {!alergNega && <textarea {...register('alergias.texto')} rows={2} className="input-field-sm resize-none mt-2" placeholder="Descreva as alergias..." />}
        </ToggleNega>

        <ToggleNega label="Sangramentos / Hematologia" negaVal={sangNega} onToggle={() => setValue('sangramentosHematologia.nega', !sangNega)}>
          {!sangNega && <textarea {...register('sangramentosHematologia.texto')} rows={2} className="input-field-sm resize-none mt-2" placeholder="Histórico de sangramentos..." />}
        </ToggleNega>

        <ToggleSim label="Medicamentos especiais" simVal={medSim} onToggle={() => setValue('medicamentosEspeciais.sim', !medSim)}>
          {medSim && <input {...register('medicamentosEspeciais.texto')} className="input-field-sm mt-2" placeholder="Especifique os medicamentos..." />}
        </ToggleSim>

        <ToggleSim label="Necessidade de monitorização especial" simVal={monSim} onToggle={() => setValue('monitorizacaoEspecial.sim', !monSim)}>
          {monSim && <input {...register('monitorizacaoEspecial.texto')} className="input-field-sm mt-2" placeholder="Especifique a monitorização..." />}
        </ToggleSim>
      </div>
    </div>
  );
}

function SecaoTecnica() {
  const { watch, setValue } = useFormContext<BoletimForm>();
  const tecnicas = [
    { key: 'tecnicaGeral' as const, label: 'Geral' },
    { key: 'tecnicaSedacao' as const, label: 'Sedação' },
    { key: 'tecnicaCondutiva' as const, label: 'Condutiva' },
    { key: 'tecnicaLocalMonit' as const, label: 'Local com monit.' },
  ];
  return (
    <div className="space-y-4">
      <div className="section-header">Técnica Anestésica Planejada</div>
      <div className="card p-4 rounded-t-none">
        <div className="grid grid-cols-2 gap-3">
          {tecnicas.map(({ key, label }) => {
            const val = watch(key);
            return (
              <button key={key} type="button" onClick={() => setValue(key, !val)}
                className={clsx('py-4 rounded-xl font-semibold border-2 transition-all',
                  val ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400')}>
                {val ? '✓ ' : ''}{label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SecaoAssinatura() {
  const { register } = useFormContext<BoletimForm>();
  return (
    <div className="space-y-4">
      <div className="section-header">Anestesiologista e Assinatura</div>
      <div className="card p-4 space-y-3 rounded-t-none">
        <Field label="Nome do Anestesiologista"><input {...register('anestesiologistaNome')} className="input-field" /></Field>
        <Field label="CREMERS"><input {...register('cremers')} className="input-field" placeholder="Número do CREMERS" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hora de Finalização"><input type="time" {...register('horaFim')} className="input-field" /></Field>
          <Field label="Data de Finalização"><input type="date" {...register('dataFim')} className="input-field" /></Field>
        </div>
        <SignatureField />
        <Field label="Observações">
          <textarea {...register('observacoes')} rows={4} className="input-field resize-none" placeholder="Observações gerais..." />
        </Field>
      </div>
    </div>
  );
}

function SecaoIntraop() {
  const { register, watch, setValue } = useFormContext<BoletimForm>();
  const tipoTecnica = watch('tecnicaIntraop.tipo');
  const tipoViaAerea = watch('viaAereaIntraop.tipo');
  const mon = watch('monitorizacao');
  const sinais: SinalVital[] = watch('sinaisVitais') || [];

  function addSinal() {
    setValue('sinaisVitais', [...sinais, { hora: '', pa: '', fc: '', spo2: '', etco2: '' }]);
  }
  function removeSinal(i: number) {
    setValue('sinaisVitais', sinais.filter((_, idx) => idx !== i));
  }

  const monItems: { key: keyof typeof mon; label: string }[] = [
    { key: 'ecg', label: 'ECG' }, { key: 'spo2', label: 'SpO₂' }, { key: 'etco2', label: 'EtCO₂' },
    { key: 'bis', label: 'BIS' }, { key: 'pam', label: 'PAM' }, { key: 'temperatura', label: 'Temp.' },
  ];

  return (
    <div className="space-y-4">
      <div className="section-header">Técnica Anestésica Intraoperatória</div>

      {/* Posição e horários */}
      <div className="card p-4 rounded-t-none space-y-3">
        <Field label="Posição do Paciente">
          <div className="flex flex-wrap gap-2">
            {['Supino', 'Litotomia', 'Dec. Lateral D', 'Dec. Lateral E', 'Prona', 'Sentado', 'Outro'].map(v => (
              <button key={v} type="button" onClick={() => setValue('posicaoPaciente', v)}
                className={clsx('text-sm px-3 py-1.5 rounded-lg border-2 font-medium transition-all',
                  watch('posicaoPaciente') === v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
                {v}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Início Anestesia"><input type="time" {...register('horaInicioAnestesia')} className="input-field" /></Field>
          <Field label="Início Cirurgia"><input type="time" {...register('horaInicioCirurgia')} className="input-field" /></Field>
          <Field label="Fim Cirurgia"><input type="time" {...register('horaFimCirurgia')} className="input-field" /></Field>
        </div>
      </div>

      {/* Monitorização */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Monitorização</h3>
        <div className="flex flex-wrap gap-2">
          {monItems.map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setValue(`monitorizacao.${key}`, !mon?.[key])}
              className={clsx('text-sm px-3 py-1.5 rounded-lg border-2 font-medium transition-all',
                mon?.[key] ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
              {mon?.[key] ? '✓ ' : ''}{label}
            </button>
          ))}
        </div>
        <Field label="Outros"><input {...register('monitorizacao.outros')} className="input-field" placeholder="Outros monitores..." /></Field>
      </div>

      {/* Sinais vitais */}
      <div className="card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-sm">Sinais Vitais Intraoperatórios</h3>
          <button type="button" onClick={addSinal} className="btn-primary text-xs py-1 px-3">+ Adicionar</button>
        </div>
        {sinais.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Toque em "+ Adicionar" para registrar sinais vitais</p>}
        {sinais.map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary-800">Registro {i + 1}</span>
              <button type="button" onClick={() => removeSinal(i)} className="text-xs text-red-500 hover:text-red-700">Remover</button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Hora"><input type="time" {...register(`sinaisVitais.${i}.hora`)} className="input-field-sm" /></Field>
              <Field label="PA"><input {...register(`sinaisVitais.${i}.pa`)} className="input-field-sm" placeholder="120/80" /></Field>
              <Field label="FC"><input {...register(`sinaisVitais.${i}.fc`)} className="input-field-sm" inputMode="numeric" placeholder="bpm" /></Field>
              <Field label="SpO₂"><input {...register(`sinaisVitais.${i}.spo2`)} className="input-field-sm" inputMode="numeric" placeholder="%" /></Field>
              <Field label="EtCO₂"><input {...register(`sinaisVitais.${i}.etco2`)} className="input-field-sm" inputMode="numeric" placeholder="mmHg" /></Field>
            </div>
          </div>
        ))}
      </div>

      {/* Tipo de técnica */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Tipo de Técnica Anestésica</h3>
        <div className="grid grid-cols-2 gap-2">
          {[['geral','Anestesia Geral'],['raqui','Raquianestesia'],['peridural','Peridural'],['sedacao','Sedação'],['bloqueio','Bloqueio']].map(([v,l]) => (
            <button key={v} type="button" onClick={() => setValue('tecnicaIntraop.tipo', v as 'geral')}
              className={clsx('py-3 rounded-xl font-semibold border-2 transition-all text-sm',
                tipoTecnica === v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
              {tipoTecnica === v ? '✓ ' : ''}{l}
            </button>
          ))}
        </div>

        {tipoTecnica === 'geral' && (
          <div className="border border-primary-200 bg-primary-50 rounded-lg p-3 space-y-2 mt-2">
            <div className="text-xs font-bold text-primary-800 mb-1">Anestesia Geral</div>
            <Field label="Indução (medicações e doses)">
              <textarea {...register('tecnicaIntraop.geralInducao')} rows={2} className="input-field resize-none" placeholder="Ex: Propofol 150mg, Fentanil 100mcg, Rocurônio 50mg..." />
            </Field>
            <Field label="Manutenção / Administração">
              <textarea {...register('tecnicaIntraop.geralAdministracao')} rows={2} className="input-field resize-none" placeholder="Ex: Sevoflurano 2%, Remifentanil 0,1mcg/kg/min..." />
            </Field>
          </div>
        )}

        {tipoTecnica === 'raqui' && (
          <div className="border border-primary-200 bg-primary-50 rounded-lg p-3 space-y-2 mt-2">
            <div className="text-xs font-bold text-primary-800 mb-1">Raquianestesia</div>
            <p className="text-xs text-gray-500">Raquianestesia com agulha <strong>{watch('tecnicaIntraop.raquiAgulha') || '___'}</strong>, no espaço <strong>{watch('tecnicaIntraop.raquiEspaco') || '___'}</strong>, com <strong>{watch('tecnicaIntraop.raquiMedicacao') || '___'}</strong> <strong>{watch('tecnicaIntraop.raquiVolume') || '___'}</strong>.</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Agulha"><input {...register('tecnicaIntraop.raquiAgulha')} className="input-field" placeholder="Ex: Quincke 25G" /></Field>
              <Field label="Espaço"><input {...register('tecnicaIntraop.raquiEspaco')} className="input-field" placeholder="Ex: L3-L4" /></Field>
              <Field label="Medicação"><input {...register('tecnicaIntraop.raquiMedicacao')} className="input-field" placeholder="Ex: Bupivacaína hiperbárica" /></Field>
              <Field label="Volume/Dose"><input {...register('tecnicaIntraop.raquiVolume')} className="input-field" placeholder="Ex: 3ml / 15mg" /></Field>
            </div>
          </div>
        )}

        {tipoTecnica === 'peridural' && (
          <div className="border border-primary-200 bg-primary-50 rounded-lg p-3 space-y-2 mt-2">
            <div className="text-xs font-bold text-primary-800 mb-1">Peridural</div>
            <p className="text-xs text-gray-500">Peridural com agulha <strong>{watch('tecnicaIntraop.periduralAgulha') || '___'}</strong>, no espaço <strong>{watch('tecnicaIntraop.periduralEspaco') || '___'}</strong>, com <strong>{watch('tecnicaIntraop.periduralMedicacao') || '___'}</strong> <strong>{watch('tecnicaIntraop.periduralVolume') || '___'}</strong>.</p>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Agulha"><input {...register('tecnicaIntraop.periduralAgulha')} className="input-field" placeholder="Ex: Tuohy 17G" /></Field>
              <Field label="Espaço"><input {...register('tecnicaIntraop.periduralEspaco')} className="input-field" placeholder="Ex: L2-L3" /></Field>
              <Field label="Medicação"><input {...register('tecnicaIntraop.periduralMedicacao')} className="input-field" placeholder="Ex: Ropivacaína 0,75%" /></Field>
              <Field label="Volume/Dose"><input {...register('tecnicaIntraop.periduralVolume')} className="input-field" placeholder="Ex: 15ml" /></Field>
            </div>
          </div>
        )}

        {tipoTecnica === 'bloqueio' && (
          <div className="border border-primary-200 bg-primary-50 rounded-lg p-3 mt-2">
            <Field label="Descrição do Bloqueio">
              <textarea {...register('tecnicaIntraop.bloqueioDescricao')} rows={3} className="input-field resize-none" placeholder="Descreva o bloqueio realizado..." />
            </Field>
          </div>
        )}
      </div>

      {/* Via aérea intraop */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Via Aérea</h3>
        <div className="grid grid-cols-3 gap-2">
          {[['canula_nasal','Cânula Nasal'],['mascara_laringea','Máscara Laríngea'],['tet','TET']].map(([v,l]) => (
            <button key={v} type="button" onClick={() => setValue('viaAereaIntraop.tipo', v as 'tet')}
              className={clsx('py-3 rounded-xl font-semibold border-2 transition-all text-sm text-center',
                tipoViaAerea === v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
              {tipoViaAerea === v ? '✓ ' : ''}{l}
            </button>
          ))}
        </div>
        {(tipoViaAerea === 'mascara_laringea' || tipoViaAerea === 'tet') && (
          <Field label={tipoViaAerea === 'tet' ? 'Número do TET' : 'Número da Máscara Laríngea'}>
            <input {...register('viaAereaIntraop.numero')} className="input-field" placeholder="Número" inputMode="decimal" />
          </Field>
        )}
      </div>

      {/* Punções */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Punções</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Venosa (local / calibre)"><input {...register('puncoes.venosa')} className="input-field" placeholder="Ex: Antebraço D, 20G" /></Field>
          <Field label="Arterial (local / calibre)"><input {...register('puncoes.arterial')} className="input-field" placeholder="Ex: Radial E, 20G" /></Field>
        </div>
      </div>

      {/* Medicações intraop */}
      <div className="card p-4">
        <Field label="Medicações Utilizadas / Dose / Horário">
          <textarea {...register('medicacoesIntraop')} rows={5} className="input-field resize-none" placeholder="Liste todas as medicações utilizadas durante o procedimento..." />
        </Field>
      </div>
    </div>
  );
}

function SecaoAlta() {
  const { register, watch, setValue } = useFormContext<BoletimForm>();
  const destino = watch('altaAnestesica.destino');
  const alta = watch('altaAnestesica');
  const fluidos = watch('fluidos');

  const condicoes: { key: keyof typeof alta; label: string }[] = [
    { key: 'consciente', label: 'Consciente' },
    { key: 'orientado', label: 'Orientado' },
    { key: 'semDor', label: 'Sem Dor' },
    { key: 'hemodinamicamenteEstavel', label: 'Hemodinamic. estável' },
    { key: 'respirandoEspontaneamente', label: 'Resp. espontânea' },
    { key: 'saturacaoAdequada', label: 'SatO₂ adequada' },
  ];

  // Auto-calc total fluidos
  const total = (() => {
    const vals = [fluidos?.srl, fluidos?.sf09, fluidos?.ringerlactato, fluidos?.outro]
      .map(v => parseFloat(v || '0')).filter(n => !isNaN(n));
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum > 0 ? String(sum) : '';
  })();

  return (
    <div className="space-y-4">
      <div className="section-header">Alta Anestésica</div>

      {/* Destino */}
      <div className="card p-4 space-y-3 rounded-t-none">
        <h3 className="font-semibold text-gray-800 text-sm">Destino do Paciente</h3>
        <div className="grid grid-cols-2 gap-2">
          {[['srpa','SRPA'],['uti','UTI'],['enfermaria','Enfermaria'],['domicilio','Domicílio'],['outro','Outro']].map(([v,l]) => (
            <button key={v} type="button" onClick={() => setValue('altaAnestesica.destino', v as 'srpa')}
              className={clsx('py-3 rounded-xl font-semibold border-2 transition-all text-sm',
                destino === v ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
              {destino === v ? '✓ ' : ''}{l}
            </button>
          ))}
        </div>
        {destino === 'outro' && (
          <Field label="Especificar destino">
            <input {...register('altaAnestesica.destinoOutro')} className="input-field" placeholder="Descreva o destino..." />
          </Field>
        )}
      </div>

      {/* Condições */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Condições na Alta</h3>
        <div className="grid grid-cols-2 gap-2">
          {condicoes.map(({ key, label }) => {
            const val = alta?.[key] as boolean;
            return (
              <button key={key} type="button"
                onClick={() => setValue(`altaAnestesica.${key}`, !val)}
                className={clsx('py-3 rounded-xl font-semibold border-2 transition-all text-sm',
                  val ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300')}>
                {val ? '✓ ' : ''}{label}
              </button>
            );
          })}
        </div>
        <Field label="Observações da Alta">
          <textarea {...register('altaAnestesica.observacoes')} rows={3} className="input-field resize-none" placeholder="Observações sobre a alta..." />
        </Field>
      </div>

      {/* Fluidos */}
      <div className="card p-4 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Balanço Hídrico</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SRL (ml)"><input {...register('fluidos.srl')} inputMode="numeric" className="input-field" placeholder="0" /></Field>
          <Field label="SF 0,9% (ml)"><input {...register('fluidos.sf09')} inputMode="numeric" className="input-field" placeholder="0" /></Field>
          <Field label="Ringer Lactato (ml)"><input {...register('fluidos.ringerlactato')} inputMode="numeric" className="input-field" placeholder="0" /></Field>
          <Field label="Outro (ml)"><input {...register('fluidos.outro')} inputMode="numeric" className="input-field" placeholder="0" /></Field>
        </div>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-3 flex items-center justify-between">
          <span className="font-semibold text-primary-800">TOTAL Fluidos</span>
          <span className="text-xl font-bold text-primary-800">{total || '0'} ml</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Diurese (ml)"><input {...register('diurese')} inputMode="numeric" className="input-field" placeholder="ml" /></Field>
          <Field label="Sangue (ml)"><input {...register('sangue')} inputMode="numeric" className="input-field" placeholder="ml" /></Field>
        </div>
      </div>
    </div>
  );
}

// Helpers
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="label">{label}</label>{children}</div>;
}

function RadioBtn({ name, value, label }: { name: keyof BoletimForm; value: string; label: string }) {
  const { register, watch } = useFormContext<BoletimForm>();
  const current = watch(name);
  return (
    <label className={clsx('flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium',
      current === value ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300')}>
      <input type="radio" {...register(name)} value={value} className="hidden" />
      {label}
    </label>
  );
}

function ToggleNega({ label, negaVal, onToggle, children }: { label: string; negaVal: boolean; onToggle: () => void; children?: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <button type="button" onClick={onToggle}
          className={clsx('text-xs px-3 py-1 rounded-full font-medium border transition-colors',
            negaVal ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-300')}>
          Nega
        </button>
      </div>
      {children}
    </div>
  );
}

function ToggleSim({ label, simVal, onToggle, children }: { label: string; simVal: boolean; onToggle: () => void; children?: React.ReactNode }) {
  return (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <div className="flex gap-2">
          <button type="button" onClick={() => !simVal && onToggle()}
            className={clsx('text-xs px-3 py-1 rounded-full font-medium border transition-colors',
              simVal ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-300')}>Sim</button>
          <button type="button" onClick={() => simVal && onToggle()}
            className={clsx('text-xs px-3 py-1 rounded-full font-medium border transition-colors',
              !simVal ? 'bg-gray-200 text-gray-700 border-gray-300' : 'bg-white text-gray-600 border-gray-300')}>Não</button>
        </div>
      </div>
      {children}
    </div>
  );
}
