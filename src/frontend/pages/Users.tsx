import { useState, useEffect } from 'react';
import DataTable from '../components/ui/DataTable.tsx';
import { UserPlus, RefreshCw, Pencil, Trash2, Key, Shield, ShieldQuestion } from 'lucide-react';
import { useToast } from '../hooks/useToast.ts';
import { useAuthStore } from '../store/useStore.ts';
import Modal from '../components/ui/Modal.tsx';
import { validatePassword } from '../../shared/validation.js';

const SECURITY_QUESTIONS = [
  '¿Cuál es el nombre de tu primera mascota?',
  '¿Cuál es el nombre de tu ciudad natal?',
  '¿Cuál es el nombre de tu mejor amigo de la infancia?',
  '¿Cuál es tu comida favorita?',
  '¿Cuál es el nombre de tu profesor favorito?',
  '¿Cuál es tu película favorita?',
  '¿Cuál es el modelo de tu primer auto?',
];

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const { success, error: toastError } = useToast();
  const { user: currentUser } = useAuthStore();
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'VENDEDOR',
    question: '',
    answer: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [securityData, setSecurityData] = useState({
    question: '',
    answer: '',
    customQuestion: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<{id: number, name: string} | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));
  const paginatedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (window.api) {
        const result = await window.api.getAllUsers();
        if (Array.isArray(result)) {
          setUsers(result);
        } else if (result?.data && Array.isArray(result.data)) {
          setUsers(result.data);
        } else {
          setUsers([]);
        }
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateModal = () => {
    setSelectedUser(null);
    setFormData({ username: '', password: '', role: 'VENDEDOR', question: '', answer: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: any) => {
    setSelectedUser(user);
    setFormData({ username: user.username, password: '', role: user.role, question: '', answer: '' });
    setIsModalOpen(true);
  };

  const handleOpenPasswordModal = (user: any) => {
    setSelectedUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setIsPasswordModalOpen(true);
  };

  const handleOpenSecurityModal = (user: any) => {
    setSelectedUser(user);
    setSecurityData({ question: '', answer: '', customQuestion: '' });
    setIsSecurityModalOpen(true);
  };

  const handleSetSecurityQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const question = securityData.question === '__other__' ? securityData.customQuestion : securityData.question;
    if (!question || !securityData.answer) {
      toastError('Debes seleccionar una pregunta y proporcionar una respuesta');
      return;
    }
    try {
      const result = await window.api.setSecurityQuestion(selectedUser.id, question, securityData.answer);
      if (result.success) {
        success('Pregunta de seguridad configurada');
        setIsSecurityModalOpen(false);
      } else {
        toastError(result.message || 'Error al configurar pregunta de seguridad');
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedUser && !formData.password) {
        toastError('La contraseña es requerida para nuevos usuarios');
        return;
      }

      if (formData.password && !validatePassword(formData.password).valid) {
        toastError(validatePassword(formData.password).error);
        return;
      }

      const userId = currentUser?.id;
      if (!userId) {
        toastError('No hay usuario conectado');
        return;
      }

      let result;
      if (selectedUser) {
        const updateData: any = { username: formData.username, role: formData.role };
        result = await window.api.updateUser(selectedUser.id, updateData, userId);
      } else {
        result = await window.api.createUser(formData, userId);
      }

      if (result.success) {
        success(selectedUser ? 'Usuario actualizado' : 'Usuario creado');
        setIsModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al guardar');
      }
    } catch (err: any) {
      toastError('Error de comunicación');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toastError('Las contraseñas no coinciden');
      return;
    }

    const pwCheck = validatePassword(passwordData.newPassword);
    if (!pwCheck.valid) {
      toastError(pwCheck.error);
      return;
    }

    try {
      const userId = currentUser?.id;
      if (!userId) {
        toastError('No hay usuario conectado');
        return;
      }

      const result = await window.api.changePassword(selectedUser.id, passwordData.newPassword, userId);

      if (result.success) {
        success('Contraseña cambiada correctamente');
        setIsPasswordModalOpen(false);
      } else {
        toastError(result.message || 'Error al cambiar contraseña');
      }
    } catch (err) {
      toastError('Error de comunicación');
    }
  };

  const handleDeleteClick = (id: number, name: string) => {
    setDeleteTarget({ id, name });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    
    try {
      const userId = currentUser?.id;
      if (!userId) {
        toastError('No hay usuario conectado');
        return;
      }

      const result = await window.api.deleteUser(deleteTarget.id, userId);
      if (result.success) {
        success('Usuario eliminado');
        setIsDeleteModalOpen(false);
        fetchData();
      } else {
        toastError(result.message || 'Error al eliminar');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white m-0">Usuarios</h2>
          <p className="text-gray-400 mt-1">Gestión de accesos y roles</p>
        </div>
        {currentUser?.role === 'ADMIN' && (
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Crear Usuario
          </button>
        )}
      </div>
      
      <DataTable
        columns={[
          { header: 'ID', render: (u) => <span className="font-medium text-white">{u.id}</span> },
          { header: 'Usuario', render: (u) => <span className="text-gray-300">{u.username}</span> },
          { header: 'Rol', render: (u) => (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
              {u.role}
            </span>
          )},
          { header: 'Creado', render: (u) => <span className="text-gray-400">{new Date(u.created_at).toLocaleDateString('es-ES')}</span> },
          { header: 'Acciones', headerClassName: 'text-right', className: 'text-right', render: (u) => (
            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleOpenSecurityModal(u)} className="p-2 text-cyan-400 hover:bg-cyan-400/10 rounded-lg" title="Pregunta de Seguridad">
                <ShieldQuestion className="w-4 h-4" />
              </button>
              <button onClick={() => handleOpenPasswordModal(u)} className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg" title="Cambiar Contraseña">
                <Key className="w-4 h-4" />
              </button>
              <button onClick={() => handleOpenEditModal(u)} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg" title="Editar">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDeleteClick(u.id, u.username)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg" title="Eliminar">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )},
        ]}
        data={paginatedUsers}
        keyExtractor={(u) => u.id}
        loading={loading}
        emptyMessage="No hay usuarios"
        emptyDescription="Agrega tu primer usuario al sistema"
        emptyIcon={<Shield className="w-8 h-8" />}
        emptyAction={currentUser?.role === 'ADMIN' ? { label: 'Crear Usuario', onClick: handleOpenCreateModal } : undefined}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={users.length}
        onPageChange={setCurrentPage}
      />

      {/* Modal para Crear/Editar Usuario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
        width="500px"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Usuario *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {selectedUser ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required={!selectedUser}
              minLength={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Rol
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
            >
              <option value="VENDEDOR">Vendedor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {!selectedUser && (
            <>
              <hr className="border-[#2e303a]" />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Pregunta de Seguridad (opcional)
                </label>
                <select
                  value={formData.question || ''}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                >
                  <option value="">Sin pregunta de seguridad</option>
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
              {formData.question && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Respuesta *
                  </label>
                  <input
                    type="text"
                    value={formData.answer || ''}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                    required={!!formData.question}
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {selectedUser ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Cambiar Contraseña */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Cambiar Contraseña"
        width="450px"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nueva Contraseña *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
              minLength={8}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Confirmar Contraseña *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
              minLength={8}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Cambiar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Pregunta de Seguridad */}
      <Modal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        title="Configurar Pregunta de Seguridad"
        width="500px"
      >
        <form onSubmit={handleSetSecurityQuestion} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Pregunta de Seguridad *
            </label>
            <select
              value={securityData.question}
              onChange={(e) => setSecurityData({ ...securityData, question: e.target.value })}
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
            >
              <option value="">Selecciona una pregunta</option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
              <option value="__other__">Otra (escribe tu propia pregunta)</option>
            </select>
          </div>

          {securityData.question === '__other__' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tu pregunta personalizada *
              </label>
              <input
                type="text"
                value={securityData.customQuestion}
                onChange={(e) => setSecurityData({ ...securityData, customQuestion: e.target.value })}
                className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
                required
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Respuesta *
            </label>
            <input
              type="text"
              value={securityData.answer}
              onChange={(e) => setSecurityData({ ...securityData, answer: e.target.value })}
              placeholder="tu respuesta"
              className="w-full px-4 py-2 bg-[#1f2028] border border-[#2e303a] rounded-lg text-white focus:outline-none focus:border-primary"
              required
            />
            <p className="text-xs text-gray-500 mt-1">La respuesta se guardará cifrada. No distingue mayúsculas/minúsculas.</p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsSecurityModalOpen(false)}
              className="px-4 py-2 bg-[#2e303a] text-gray-300 rounded-lg hover:bg-[#3e404a] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        width="450px"
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
            <Trash2 className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-white">
            ¿Estás seguro de eliminar <span className="font-semibold">"{deleteTarget?.name}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">Esta acción no se puede deshacer</p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(false)}
            className="flex-1 px-4 py-2.5 bg-[#2e303a] text-gray-300 rounded-xl hover:bg-[#3e404a] transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleDeleteConfirm}
            className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
}
