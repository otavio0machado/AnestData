import { useEffect, useState } from 'react';
import api from '../api';
import { User } from '../types';
import { UserPlus, ToggleLeft, ToggleRight } from 'lucide-react';
import clsx from 'clsx';

export default function UsersPage() {
  const [users, setUsers] = useState<(User & { ativo: boolean })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', role: 'MEDICO', cremers: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/users', form);
      setUsers(prev => [...prev, { ...res.data, ativo: true }]);
      setShowForm(false);
      setForm({ nome: '', email: '', senha: '', role: 'MEDICO', cremers: '' });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(u: User & { ativo: boolean }) {
    const res = await api.patch(`/users/${u.id}`, { ativo: !u.ativo });
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, ...res.data } : x));
  }

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Usuários</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Novo Usuário
        </button>
      </div>

      {showForm && (
        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Cadastrar Usuário</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Nome *</label><input required value={form.nome} onChange={e => setForm(f => ({...f,nome:e.target.value}))} className="input-field" /></div>
              <div><label className="label">Email *</label><input type="email" required value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} className="input-field" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Senha *</label><input type="password" required value={form.senha} onChange={e => setForm(f => ({...f,senha:e.target.value}))} className="input-field" /></div>
              <div>
                <label className="label">Perfil</label>
                <select value={form.role} onChange={e => setForm(f => ({...f,role:e.target.value}))} className="input-field">
                  <option value="MEDICO">Médico</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
            </div>
            {form.role === 'MEDICO' && (
              <div><label className="label">CREMERS</label><input value={form.cremers} onChange={e => setForm(f => ({...f,cremers:e.target.value}))} className="input-field" placeholder="Número do CREMERS" /></div>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Criar Usuário'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      <div className="card divide-y divide-gray-50">
        {users.map(u => (
          <div key={u.id} className="flex items-center p-4 gap-3">
            <div className={clsx('w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0',
              u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
              {u.nome.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900">{u.nome}</div>
              <div className="text-sm text-gray-500">{u.email}</div>
              {u.cremers && <div className="text-xs text-gray-400">CREMERS: {u.cremers}</div>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium',
                u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700')}>
                {u.role === 'ADMIN' ? 'Admin' : 'Médico'}
              </span>
              <button onClick={() => toggleAtivo(u)} className={u.ativo ? 'text-green-500' : 'text-gray-400'} title={u.ativo ? 'Ativo (clique para desativar)' : 'Inativo (clique para ativar)'}>
                {u.ativo ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
