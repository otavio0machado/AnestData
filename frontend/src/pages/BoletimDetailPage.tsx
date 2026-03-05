import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api';
import { Boletim, BoletimStatus, StatusCobranca } from '../types';
import { Edit, Download, ArrowLeft, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

const statusLabel: Record<BoletimStatus, string> = {
  PREENCHENDO: 'Preenchendo', FINALIZADO: 'Finalizado', ARQUIVADO: 'Arquivado', ENVIADO_PLANO: 'Enviado ao Plano',
};
const cobrancaOptions: StatusCobranca[] = ['PENDENTE', 'ENVIADO', 'PAGO', 'GLOSADO'];

export default function BoletimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [boletim, setBoletim] = useState<Boletim | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCobranca, setUpdatingCobranca] = useState(false);
  const [obsAdmin, setObsAdmin] = useState('');

  useEffect(() => {
    api.get(`/boletins/${id}`).then(r => {
      setBoletim(r.data);
      setObsAdmin(r.data.obsAdmin || '');
    }).finally(() => setLoading(false));
  }, [id]);

  async function downloadPDF() {
    const res = await api.get(`/boletins/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `boletim_${boletim?.patient?.prontuario || id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function updateCobranca(statusCobranca: StatusCobranca) {
    setUpdatingCobranca(true);
    try {
      const res = await api.patch(`/boletins/${id}/cobranca`, { statusCobranca, obsAdmin });
      setBoletim(prev => prev ? { ...prev, ...res.data } : prev);
    } finally {
      setUpdatingCobranca(false);
    }
  }

  async function updateStatus(status: BoletimStatus) {
    const res = await api.put(`/boletins/${id}`, { status });
    setBoletim(prev => prev ? { ...prev, ...res.data } : prev);
  }

  if (loading) return <div className="p-8 text-center text-gray-400">Carregando...</div>;
  if (!boletim) return <div className="p-8 text-center text-red-500">Boletim não encontrado</div>;

  const p = boletim.patient;

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-6 pb-24 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100"><ArrowLeft size={20} /></button>
        <div className="flex-1">
          <h1 className="font-bold text-gray-900">{p?.nome || 'Sem nome'}</h1>
          <div className="text-sm text-gray-500">{p?.prontuario && `Prontuário: ${p.prontuario}`}</div>
        </div>
        <div className="flex gap-2">
          {(user?.role === 'MEDICO' || user?.role === 'ADMIN') && boletim.status !== 'ARQUIVADO' && (
            <Link to={`/boletim/${id}/editar`} className="btn-secondary flex items-center gap-1 text-sm py-2">
              <Edit size={14} /> Editar
            </Link>
          )}
          <button onClick={downloadPDF} className="btn-primary flex items-center gap-1 text-sm py-2">
            <Download size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm px-3 py-1 rounded-full font-medium bg-blue-100 text-blue-800">{statusLabel[boletim.status]}</span>
        {user?.role === 'ADMIN' && (
          <span className={clsx('text-sm px-3 py-1 rounded-full font-medium',
            boletim.statusCobranca === 'PAGO' ? 'bg-green-100 text-green-800' :
            boletim.statusCobranca === 'GLOSADO' ? 'bg-red-100 text-red-800' :
            boletim.statusCobranca === 'ENVIADO' ? 'bg-blue-100 text-blue-800' :
            'bg-orange-100 text-orange-800'
          )}>Cobrança: {boletim.statusCobranca}</span>
        )}
      </div>

      {/* Main info */}
      <Section title="Cirurgia">
        <Row label="Procedimento" value={boletim.procedimento} />
        <Row label="Data" value={boletim.dataCirurgia ? new Date(boletim.dataCirurgia).toLocaleDateString('pt-BR') : ''} />
        <Row label="Hora" value={boletim.horaCirurgia} />
        <Row label="Tipo" value={`${boletim.tipoCirurgia || ''} ${boletim.ambulatorialInternado || ''}`} />
        <Row label="Convênio" value={boletim.tipoConvenioNome} />
        <Row label="Matrícula" value={boletim.matriculaConvenio} />
        <Row label="Cirurgião" value={boletim.cirurgiao} />
      </Section>

      <Section title="Paciente">
        <Row label="Sexo" value={p?.sexo} />
        <Row label="DN" value={p?.dataNascimento ? new Date(p.dataNascimento).toLocaleDateString('pt-BR') : ''} />
        <Row label="Prontuário" value={p?.prontuario} />
        <Row label="Atendimento" value={p?.atendimento} />
        <Row label="Filiação" value={p?.filiacao} />
        <Row label="Endereço" value={p?.endereco} />
      </Section>

      <Section title="Estado Físico">
        <Row label="ASA" value={boletim.asaEstado ? `ASA ${boletim.asaEstado}` : ''} />
        <Row label="Tipo cirurgia" value={boletim.tipoCirurgia} />
        <Row label="Sem Particularidades" value={boletim.semParticularidades ? 'Sim' : 'Não'} />
      </Section>

      <Section title="Via Aérea">
        <Row label="Mallampatti" value={boletim.mallampatti} />
        <Row label="IOT difícil" value={boletim.iotDificil === true ? 'Sim' : boletim.iotDificil === false ? 'Não' : ''} />
        <Row label="Alergias" value={(boletim.alergias as { nega?: boolean; texto?: string })?.nega ? 'Nega' : (boletim.alergias as { texto?: string })?.texto || ''} />
      </Section>

      <Section title="Técnica Anestésica">
        <div className="flex flex-wrap gap-2 p-3">
          {boletim.tecnicaGeral && <Chip>Geral</Chip>}
          {boletim.tecnicaSedacao && <Chip>Sedação</Chip>}
          {boletim.tecnicaCondutiva && <Chip>Condutiva</Chip>}
          {boletim.tecnicaLocalMonit && <Chip>Local com monit.</Chip>}
        </div>
      </Section>

      <Section title="Anestesiologista">
        <Row label="Nome" value={boletim.anestesiologistaNome || boletim.user?.nome} />
        <Row label="CREMERS" value={boletim.cremers || boletim.user?.cremers} />
        <Row label="Data" value={boletim.dataFim ? new Date(boletim.dataFim).toLocaleDateString('pt-BR') : ''} />
        <Row label="Hora" value={boletim.horaFim} />
        {boletim.observacoes && <Row label="Observações" value={boletim.observacoes} />}
        {(boletim as Boletim & { assinatura?: { imagemBase64: string } }).assinatura && (
          <div className="px-3 pb-3">
            <div className="text-sm text-gray-500 mb-1">Assinatura:</div>
            <img src={(boletim as Boletim & { assinatura?: { imagemBase64: string } }).assinatura!.imagemBase64} alt="Assinatura" className="h-12 border rounded" />
          </div>
        )}
      </Section>

      {/* Admin controls */}
      {user?.role === 'ADMIN' && (
        <Section title="Gestão Administrativa">
          <div className="p-3 space-y-3">
            <div>
              <label className="label text-xs">Status do Boletim</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {(['FINALIZADO','ARQUIVADO','ENVIADO_PLANO'] as BoletimStatus[]).map(s => (
                  <button key={s} onClick={() => updateStatus(s)}
                    className={clsx('text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                      boletim.status === s ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                    {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label text-xs">Status de Cobrança</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {cobrancaOptions.map(s => (
                  <button key={s} disabled={updatingCobranca} onClick={() => updateCobranca(s)}
                    className={clsx('text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
                      boletim.statusCobranca === s ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50')}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label text-xs">Observações Administrativas</label>
              <textarea value={obsAdmin} onChange={e => setObsAdmin(e.target.value)} rows={3}
                className="input-field-sm resize-none" placeholder="Observações internas..." />
              <button onClick={() => updateCobranca(boletim.statusCobranca)}
                className="btn-primary text-sm py-1.5 mt-2 flex items-center gap-1">
                <CheckCircle size={14} /> Salvar obs.
              </button>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="section-header rounded-none">{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 px-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-32">{label}</span>
      <span className="text-sm text-gray-900 flex-1">{value}</span>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full font-medium">{children}</span>;
}
