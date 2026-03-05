import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BoletimListItem, BoletimStatus, StatusCobranca } from '../types';
import clsx from 'clsx';
import { Search, Filter, Download } from 'lucide-react';

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

export default function AdminPanelPage() {
  const [boletins, setBoletins] = useState<BoletimListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [medicos, setMedicos] = useState<{ id: string; nome: string }[]>([]);

  const [filters, setFilters] = useState({
    data: '', medico: '', convenio: '', status: '', statusCobranca: '',
  });

  async function load(p = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await api.get(`/boletins?${params}`);
      setBoletins(res.data.items);
      setTotal(res.data.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    api.get('/users/medicos').then(r => setMedicos(r.data));
  }, []);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    load(1);
  }

  async function downloadPDF(id: string, prontuario?: string) {
    const res = await api.get(`/boletins/${id}/pdf`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url; a.download = `boletim_${prontuario || id}.pdf`; a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Painel Administrativo</h1>
        <span className="text-sm text-gray-500">{total} boletins</span>
      </div>

      {/* Filters */}
      <form onSubmit={handleFilter} className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="font-medium text-sm text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="label text-xs">Data da Cirurgia</label>
            <input type="date" value={filters.data} onChange={e => setFilters(f => ({ ...f, data: e.target.value }))} className="input-field-sm" />
          </div>
          <div>
            <label className="label text-xs">Médico</label>
            <select value={filters.medico} onChange={e => setFilters(f => ({ ...f, medico: e.target.value }))} className="input-field-sm">
              <option value="">Todos</option>
              {medicos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label text-xs">Convênio</label>
            <input value={filters.convenio} onChange={e => setFilters(f => ({ ...f, convenio: e.target.value }))} className="input-field-sm" placeholder="Nome do convênio" />
          </div>
          <div>
            <label className="label text-xs">Status do Boletim</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="input-field-sm">
              <option value="">Todos</option>
              <option value="PREENCHENDO">Preenchendo</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="ARQUIVADO">Arquivado</option>
              <option value="ENVIADO_PLANO">Enviado ao Plano</option>
            </select>
          </div>
          <div>
            <label className="label text-xs">Status de Cobrança</label>
            <select value={filters.statusCobranca} onChange={e => setFilters(f => ({ ...f, statusCobranca: e.target.value }))} className="input-field-sm">
              <option value="">Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="ENVIADO">Enviado</option>
              <option value="PAGO">Pago</option>
              <option value="GLOSADO">Glosado</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2 py-2">
              <Search size={14} /> Buscar
            </button>
          </div>
        </div>
        {Object.values(filters).some(Boolean) && (
          <button type="button" onClick={() => { setFilters({ data:'',medico:'',convenio:'',status:'',statusCobranca:'' }); load(1); }}
            className="text-xs text-gray-500 mt-2 hover:text-gray-700">Limpar filtros</button>
        )}
      </form>

      {/* Table / List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : boletins.length === 0 ? (
          <div className="p-8 text-center text-gray-400">Nenhum boletim encontrado</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['Paciente','Data','Procedimento','Convênio','Médico','Status','Cobrança',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left font-medium text-gray-600 text-xs">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {boletins.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{b.patient?.nome || '—'}</div>
                        <div className="text-xs text-gray-500">{b.patient?.prontuario}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {b.dataCirurgia ? new Date(b.dataCirurgia).toLocaleDateString('pt-BR') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">{b.procedimento || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{b.tipoConvenioNome || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{b.user?.nome || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[b.status])}>{b.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cobrancaColor[b.statusCobranca])}>{b.statusCobranca}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link to={`/boletim/${b.id}`} className="text-primary-700 hover:underline text-xs font-medium">Ver</Link>
                          <button onClick={() => downloadPDF(b.id, b.patient?.prontuario)} className="text-gray-500 hover:text-primary-700">
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="lg:hidden divide-y divide-gray-50">
              {boletins.map(b => (
                <Link key={b.id} to={`/boletim/${b.id}`} className="flex items-start p-4 hover:bg-gray-50 gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{b.patient?.nome || '—'}</div>
                    <div className="text-sm text-gray-500 truncate mt-0.5">{b.procedimento || '—'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.user?.nome}</div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusColor[b.status])}>{b.status}</span>
                      <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', cobrancaColor[b.statusCobranca])}>{b.statusCobranca}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 shrink-0">
                    {b.dataCirurgia ? new Date(b.dataCirurgia).toLocaleDateString('pt-BR') : new Date(b.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-gray-100">
                <button disabled={page === 1} onClick={() => load(page - 1)} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Anterior</button>
                <span className="text-sm text-gray-600">{page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => load(page + 1)} className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-40">Próximo</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
