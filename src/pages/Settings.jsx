import { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Mail, 
  Plus, 
  Copy, 
  RefreshCw, 
  LogOut, 
  Trash2, 
  UserPlus,
  Check,
  X,
  Crown,
  User,
  Settings as SettingsIcon,
  Bell
} from 'lucide-react';
import { organizationsApi, invitationsApi, authApi } from '../services/api';

export default function Settings({ user, organizations, onOrganizationsUpdate }) {
  const [activeTab, setActiveTab] = useState('organizations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Organizations state
  const [orgDetails, setOrgDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  
  // Invitations state
  const [myInvitations, setMyInvitations] = useState([]);
  
  // Create organization form
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  
  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const currentOrg = organizations?.find(o => o.organizationId === user?.currentOrganizationId);

  useEffect(() => {
    if (currentOrg) {
      loadOrganizationDetails();
    }
    loadMyInvitations();
  }, [currentOrg?.organizationId]);

  const loadOrganizationDetails = async () => {
    if (!currentOrg) return;
    
    try {
      setLoading(true);
      const [detailsRes, membersRes, invitationsRes] = await Promise.all([
        organizationsApi.getById(currentOrg.organizationId),
        organizationsApi.getMembers(currentOrg.organizationId),
        currentOrg.role === 'Owner' ? organizationsApi.getInvitations(currentOrg.organizationId) : Promise.resolve({ data: [] })
      ]);
      
      setOrgDetails(detailsRes.data);
      setMembers(membersRes.data);
      setSentInvitations(invitationsRes.data);
    } catch (err) {
      console.error('Failed to load organization details:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMyInvitations = async () => {
    try {
      const response = await invitationsApi.getMyInvitations();
      setMyInvitations(response.data);
    } catch (err) {
      console.error('Failed to load invitations:', err);
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      await organizationsApi.create({ 
        name: newOrgName.trim(), 
        description: newOrgDescription.trim() 
      });
      
      setSuccess('Организация создана успешно!');
      setNewOrgName('');
      setNewOrgDescription('');
      setShowCreateOrg(false);
      
      // Refresh organizations list
      if (onOrganizationsUpdate) {
        const response = await authApi.getOrganizations();
        onOrganizationsUpdate(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при создании организации');
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !currentOrg) return;
    
    try {
      setLoading(true);
      setError('');
      await organizationsApi.invite(currentOrg.organizationId, inviteEmail.trim());
      
      setSuccess(`Приглашение отправлено на ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
      loadOrganizationDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отправке приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (token) => {
    try {
      setLoading(true);
      setError('');
      await invitationsApi.accept(token);
      
      setSuccess('Вы присоединились к организации!');
      loadMyInvitations();
      
      // Refresh organizations list
      if (onOrganizationsUpdate) {
        const response = await authApi.getOrganizations();
        onOrganizationsUpdate(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при принятии приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectInvitation = async (token) => {
    try {
      setLoading(true);
      await invitationsApi.reject(token);
      loadMyInvitations();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отклонении приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId) => {
    if (!confirm('Отменить приглашение?')) return;
    
    try {
      setLoading(true);
      await invitationsApi.cancel(invitationId);
      loadOrganizationDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при отмене приглашения');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Удалить ${memberName} из организации?`)) return;
    
    try {
      setLoading(true);
      await organizationsApi.removeMember(currentOrg.organizationId, memberId);
      setSuccess(`${memberName} удалён из организации`);
      loadOrganizationDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении участника');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveOrganization = async () => {
    if (!currentOrg || currentOrg.isPersonal) return;
    if (!confirm(`Вы уверены, что хотите покинуть организацию "${currentOrg.organizationName}"?`)) return;
    
    try {
      setLoading(true);
      await organizationsApi.leave(currentOrg.organizationId);
      
      setSuccess('Вы покинули организацию');
      
      // Refresh organizations list
      if (onOrganizationsUpdate) {
        const response = await authApi.getOrganizations();
        onOrganizationsUpdate(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при выходе из организации');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    if (!confirm('Сгенерировать новый код приглашения? Старый код перестанет работать.')) return;
    
    try {
      setLoading(true);
      const response = await organizationsApi.regenerateCode(currentOrg.organizationId);
      setOrgDetails(prev => ({ ...prev, joinCode: response.data.joinCode }));
      setSuccess('Код приглашения обновлён');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении кода');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess('Скопировано в буфер обмена');
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(clearMessages, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-slate-100">Настройки</h1>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('organizations')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'organizations'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 size={16} className="inline mr-2" />
          Организации
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'invitations'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail size={16} className="inline mr-2" />
          Приглашения
          {myInvitations.length > 0 && (
            <span className="ml-2 bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
              {myInvitations.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'profile'
              ? 'border-primary-500 text-primary-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <User size={16} className="inline mr-2" />
          Профиль
        </button>
      </div>

      {/* Organizations Tab */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          {/* Create Organization Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateOrg(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Создать организацию
            </button>
          </div>

          {/* Create Organization Form */}
          {showCreateOrg && (
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Новая организация</h3>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Название организации *
                  </label>
                  <input
                    type="text"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500"
                    placeholder="Моя мастерская"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={newOrgDescription}
                    onChange={(e) => setNewOrgDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500"
                    placeholder="Описание организации..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Создание...' : 'Создать'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateOrg(false)}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Organizations List */}
          <div className="glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">Мои организации</h3>
            <div className="space-y-3">
              {organizations?.map((org) => (
                <div
                  key={org.organizationId}
                  className={`p-4 rounded-lg border transition-colors ${
                    org.organizationId === user?.currentOrganizationId
                      ? 'bg-primary-600/20 border-primary-500/50'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 size={20} className={
                        org.organizationId === user?.currentOrganizationId 
                          ? 'text-primary-400' 
                          : 'text-slate-400'
                      } />
                      <div>
                        <div className="font-medium text-slate-100 flex items-center gap-2">
                          {org.organizationName}
                          {org.isPersonal && (
                            <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                              Личное
                            </span>
                          )}
                          {org.organizationId === user?.currentOrganizationId && (
                            <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                              Активная
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400 flex items-center gap-2">
                          {org.role === 'Owner' ? (
                            <><Crown size={12} className="text-yellow-500" /> Владелец</>
                          ) : (
                            <><User size={12} /> Участник</>
                          )}
                        </div>
                      </div>
                    </div>
                    {!org.isPersonal && org.role !== 'Owner' && (
                      <button
                        onClick={handleLeaveOrganization}
                        disabled={org.organizationId !== user?.currentOrganizationId}
                        className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        title="Покинуть организацию"
                      >
                        <LogOut size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Organization Details */}
          {currentOrg && !currentOrg.isPersonal && (
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Текущая организация: {currentOrg.organizationName}
              </h3>

              {/* Join Code (only for owners) */}
              {currentOrg.role === 'Owner' && orgDetails?.joinCode && (
                <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-2">Код для присоединения:</div>
                  <div className="flex items-center gap-3">
                    <code className="text-xl font-mono text-primary-400 bg-slate-900 px-4 py-2 rounded">
                      {orgDetails.joinCode}
                    </code>
                    <button
                      onClick={() => copyToClipboard(orgDetails.joinCode)}
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Копировать"
                    >
                      <Copy size={18} />
                    </button>
                    <button
                      onClick={handleRegenerateCode}
                      disabled={loading}
                      className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
                      title="Сгенерировать новый код"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Поделитесь этим кодом с людьми, которых хотите пригласить при регистрации
                  </p>
                </div>
              )}

              {/* Members */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-slate-200">
                    <Users size={16} className="inline mr-2" />
                    Участники ({members.length})
                  </h4>
                  {currentOrg.role === 'Owner' && (
                    <button
                      onClick={() => setShowInviteForm(true)}
                      className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
                    >
                      <UserPlus size={16} />
                      Пригласить
                    </button>
                  )}
                </div>

                {/* Invite Form */}
                {showInviteForm && (
                  <form onSubmit={handleInvite} className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500"
                        placeholder="email@example.com"
                        required
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        Отправить
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInviteForm(false)}
                        className="px-3 py-2 text-slate-400 hover:text-slate-200"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                          <User size={16} className="text-slate-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {member.fullName || member.username}
                            {member.userId === user?.id && (
                              <span className="text-xs text-slate-500 ml-2">(вы)</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          member.role === 'Owner' 
                            ? 'bg-yellow-500/20 text-yellow-400' 
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {member.role === 'Owner' ? 'Владелец' : 'Участник'}
                        </span>
                        {currentOrg.role === 'Owner' && member.role !== 'Owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.userId, member.fullName || member.username)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                            title="Удалить из организации"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sent Invitations (only for owners) */}
              {currentOrg.role === 'Owner' && sentInvitations.length > 0 && (
                <div>
                  <h4 className="font-medium text-slate-200 mb-3">
                    <Mail size={16} className="inline mr-2" />
                    Отправленные приглашения
                  </h4>
                  <div className="space-y-2">
                    {sentInvitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg"
                      >
                        <div>
                          <div className="text-sm text-slate-200">{inv.email}</div>
                          <div className="text-xs text-slate-500">
                            Отправлено: {new Date(inv.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            inv.status === 'Pending' 
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : inv.status === 'Accepted'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {inv.status === 'Pending' ? 'Ожидает' : 
                             inv.status === 'Accepted' ? 'Принято' : 'Отклонено'}
                          </span>
                          {inv.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelInvitation(inv.id)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Отменить приглашение"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Входящие приглашения</h3>
          
          {myInvitations.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Mail size={48} className="mx-auto mb-3 opacity-50" />
              <p>У вас нет новых приглашений</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myInvitations.map((inv) => (
                <div
                  key={inv.id}
                  className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-100 flex items-center gap-2">
                        <Building2 size={18} className="text-primary-400" />
                        {inv.organizationName}
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        Приглашение от: {inv.invitedByName || inv.invitedByEmail}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptInvitation(inv.token)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check size={14} />
                        Принять
                      </button>
                      <button
                        onClick={() => handleRejectInvitation(inv.token)}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X size={14} />
                        Отклонить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="glass p-6 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Профиль</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary-600/30 flex items-center justify-center">
                <User size={32} className="text-primary-400" />
              </div>
              <div>
                <div className="text-xl font-medium text-slate-100">
                  {user?.fullName || user?.username}
                </div>
                <div className="text-slate-400">{user?.email}</div>
              </div>
            </div>
            
            <div className="grid gap-4 mt-6">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Имя пользователя</div>
                <div className="text-slate-100">{user?.username}</div>
              </div>
              
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Email</div>
                <div className="text-slate-100">{user?.email}</div>
              </div>
              
              {user?.fullName && (
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-400 mb-1">Полное имя</div>
                  <div className="text-slate-100">{user.fullName}</div>
                </div>
              )}
              
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <div className="text-sm text-slate-400 mb-1">Текущая организация</div>
                <div className="text-slate-100 flex items-center gap-2">
                  <Building2 size={16} className="text-primary-400" />
                  {currentOrg?.organizationName || 'Не выбрана'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
