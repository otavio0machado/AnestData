import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import api from '../api';
import { BoletimListItem, StatusCobranca, BoletimStatus } from '../types';
import { FilePlus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const statusLabel: Record<BoletimStatus, string> = {
  PREENCHENDO: 'Preenchendo',
  FINALIZADO: 'Finalizado',
  ARQUIVADO: 'Arquivado',
  ENVIADO_PLANO: 'Enviado ao Plano',
};

const statusColor: Record<BoletimStatus, string> = {
  PREENCHENDO: 'bg-yellow-100 text-yellow-800',
  FINALIZADO: 'bg-blue-100 text-blue-800',
  ARQUIVADO: 'bg-gray-100 text-gray-700',
  ENVIADO_PLANO: 'bg-green-100 text-green-800',
};

const cobrancaColor: Record<StatusCobranca, string> = {
  PENDENTE: 'bg-orange-100 text-orange-800',
  ENVIADO: 'bg-blue-100 text-blue-800',
  PAGO: 'bg-green-100 text-green-800',
  GLOSADO: 'bg-red-100 text-red-800',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [boletins, setBoletins] = useState<BoletimListItem[]>([]);
  const [metrics, setMetrics] = useState({ totalHoje: 0, pendentesEnvio: 0, emAberto: 0, totalGeral: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bRes] = await Promise.all([
          api.get('/boletins?limit=15'),
          ...(user?.role === 'ADMIN' ? [api.get('/reports/dashboard').then(r => setMetrics(r.data))] : []),
        ]);
        setBoletins(bRes.data.items);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Olá, {user?.nome?.split(' ')[0]}!</p>
        </div>
        <Link to="/boletim/novo" className="btn-primary flex items-center gap-2">
          <FilePlus size={18} />
          <span className="hidden sm:inline">Novo Boletim</span>
        </Link>
      </div>

      {user?.role === 'ADMIN' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { icon: FileText, label: 'Hoje', value: metrics.totalHoje, color: 'text-primary-700' },
            { icon: Clock, label: 'Pend. Envio', value: metrics.pendentesEnvio, color: 'text-orange-600' },
            { icon: AlertCircle, label: 'Em Aberto', value: metrics.emAberto, color: 'text-red-600' },
            { icon: CheckCircle, label: 'Total', value: metrics.totalGeral, color: 'text-green-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <Icon size={24} className={color} />
              <div>
                <div className="text-2xl font-bold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Boletins Recentes</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : boletins.length === 0 ? (
          <div className="p-8 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum boletim encontrado</p>
            <Link to="/boletim/novo" className="btn-primary inline-flex items-center gap-2 mt-4">
              <FilePlus size={16} /> Criar Primeiro Boletim
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {boletins.map((b) => (
              <Link
                key={b.id}
                to={`/boletim/${b.id}`}
                className="flex items-start justify-between p-4 hover:bg-gray-50 transition-colors gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">{b.patient?.nome || '—'}</div>
                  <div className="text-sm text-gray-500 truncate mt-0.5">{b.procedimento || 'Sem procedimento'}</div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[b.status])}>
                      {statusLabel[b.status]}
                    </span>
                    {user?.role === 'ADMIN' && (
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cobrancaColor[b.statusCobranca])}>
                        {b.statusCobranca}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-gray-500">
                    {b.dataCirurgia ? new Date(b.dataCirurgia).toLocaleDateString('pt-BR') : new Date(b.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                  {b.user && <div className="text-xs text-gray-400 mt-0.5">{b.user.nome}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
