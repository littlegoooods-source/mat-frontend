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
  Bell,
  ArrowRight,
  Key,
  Pencil
} from 'lucide-react';
import { organizationsApi, invitationsApi, authApi, setSuppressMembershipRevoked } from '../services/api';

export default function Settings({ user, organizations, onOrganizationsUpdate, onSwitchOrganization, onSwitchOrganizationSilent }) {
  const [activeTab, setActiveTab] = useState('organizations');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Organizations state
  const [orgDetailsMap, setOrgDetailsMap] = useState({});
  const [members, setMembers] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  
  // Invitations state
  const [myInvitations, setMyInvitations] = useState([]);
  
  // Create organization form
  const [showCreateOrg, setShowCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  
  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteOrgId, setInviteOrgId] = useState(null);
  
  // Join by code form
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  
  // Rename organization
  const [renamingOrgId, setRenamingOrgId] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const currentOrg = organizations?.find(o => o.organizationId === user?.currentOrganizationId);

  useEffect(() => {
    loadAllOrganizationDetails();
    loadMyInvitations();
  }, [organizations]);

  const loadAllOrganizationDetails = async () => {
    if (!organizations?.length) return;
    
    try {
      const detailsPromises = organizations.map(async (org) => {
        try {
          const response = await organizationsApi.getById(org.organizationId);
          return { orgId: org.organizationId, details: response.data };
        } catch (err) {
          return { orgId: org.organizationId, details: null };
        }
      });
      
      const results = await Promise.all(detailsPromises);
      const map = {};
      results.forEach(r => {
        if (r.details) map[r.orgId] = r.details;
      });
      setOrgDetailsMap(map);
    } catch (err) {
      console.error('Failed to load organization details:', err);
    }
  };

  const loadOrganizationMembers = async (orgId) => {
    try {
      setLoading(true);
      const [membersRes, invitationsRes] = await Promise.all([
        organizationsApi.getMembers(orgId),
        organizations.find(o => o.organizationId === orgId)?.role === 'Owner' 
          ? organizationsApi.getInvitations(orgId) 
          : Promise.resolve({ data: [] })
      ]);
      
      setMembers(membersRes.data);
      setSentInvitations(invitationsRes.data);
      setSelectedOrgId(orgId);
    } catch (err) {
      console.error('Failed to load organization members:', err);
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

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      await organizationsApi.joinByCode(joinCode.trim().toUpperCase());
      
      setSuccess('Вы успешно присоединились к организации!');
      setJoinCode('');
      setShowJoinForm(false);
      
      // Refresh organizations list
      if (onOrganizationsUpdate) {
        const response = await authApi.getOrganizations();
        onOrganizationsUpdate(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при присоединении к организации');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrganization = async (orgId) => {
    if (orgId === user?.currentOrganizationId) return;
    
    try {
      setLoading(true);
      if (onSwitchOrganization) {
        await onSwitchOrganization(orgId);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при переключении организации');
      setLoading(false);
    }
  };

  const handleInvite = async (e, orgId = null) => {
    e.preventDefault();
    const targetOrgId = orgId || inviteOrgId || currentOrg?.organizationId;
    if (!inviteEmail.trim() || !targetOrgId) return;
    
    try {
      setLoading(true);
      setError('');
      await organizationsApi.invite(targetOrgId, inviteEmail.trim());
      
      setSuccess(`Приглашение отправлено на ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteForm(false);
      setInviteOrgId(null);
      
      if (selectedOrgId === targetOrgId) {
        loadOrganizationMembers(targetOrgId);
      }
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
      if (selectedOrgId) loadOrganizationMembers(selectedOrgId);
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
      await organizationsApi.removeMember(selectedOrgId, memberId);
      setSuccess(`${memberName} удалён из организации`);
      
      // Reload members
      loadOrganizationMembers(selectedOrgId);
      
      // Reload organization details to get new joinCode
      const orgDetailsRes = await organizationsApi.getById(selectedOrgId);
      setOrgDetailsMap(prev => ({
        ...prev,
        [selectedOrgId]: orgDetailsRes.data
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении участника');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveOrganization = async (orgId) => {
    const org = organizations.find(o => o.organizationId === orgId);
    if (!org) return;
    // Нельзя покинуть свою личную организацию (только чужую)
    if (org.isPersonal && org.role === 'Owner') return;
    
    if (!confirm(`Вы уверены, что хотите покинуть организацию "${org.organizationName}"?`)) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Подавляем перехватчик MEMBERSHIP_REVOKED — выход добровольный
      setSuppressMembershipRevoked(true);
      await organizationsApi.leave(orgId);
      
      // Находим личную организацию и переключаемся без перезагрузки
      if (onSwitchOrganizationSilent) {
        const orgsResponse = await authApi.getOrganizations();
        const newOrganizations = orgsResponse.data;
        const personalOrg = newOrganizations.find(o => o.isPersonal);
        const targetOrg = personalOrg || newOrganizations[0];
        
        if (targetOrg) {
          await onSwitchOrganizationSilent(targetOrg.organizationId);
        }
      }
      
      setSuccess('Вы покинули организацию');
      setSelectedOrgId(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при выходе из организации');
    } finally {
      setSuppressMembershipRevoked(false);
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    const org = organizations.find(o => o.organizationId === orgId);
    if (!org || org.isPersonal) return;
    
    const confirmText = `Вы уверены, что хотите УДАЛИТЬ организацию "${org.organizationName}"?\n\nВсе данные организации (материалы, изделия, производство) будут удалены безвозвратно!\n\nВведите название организации для подтверждения:`;
    const userInput = prompt(confirmText);
    
    if (userInput !== org.organizationName) {
      if (userInput !== null) {
        setError('Название организации введено неверно. Удаление отменено.');
      }
      return;
    }
    
    try {
      setLoading(true);
      const wasCurrentOrg = orgId === user?.currentOrganizationId;
      
      // Подавляем перехватчик MEMBERSHIP_REVOKED — удаление добровольное
      setSuppressMembershipRevoked(true);
      await organizationsApi.delete(orgId);
      
      setSelectedOrgId(null);
      
      // Если удалённая организация была текущей — переключаемся на личную без перезагрузки
      if (wasCurrentOrg && onSwitchOrganizationSilent) {
        const orgsResponse = await authApi.getOrganizations();
        const newOrganizations = orgsResponse.data;
        const personalOrg = newOrganizations.find(o => o.isPersonal);
        const targetOrg = personalOrg || newOrganizations[0];
        
        if (targetOrg) {
          await onSwitchOrganizationSilent(targetOrg.organizationId);
        }
      } else if (onOrganizationsUpdate) {
        // Просто обновляем список организаций
        const response = await authApi.getOrganizations();
        onOrganizationsUpdate(response.data);
      }
      
      setSuccess('Организация удалена');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при удалении организации');
    } finally {
      setSuppressMembershipRevoked(false);
      setLoading(false);
    }
  };

  const handleRegenerateCode = async (orgId) => {
    if (!confirm('Сгенерировать новый код приглашения? Старый код перестанет работать.')) return;
    
    try {
      setLoading(true);
      const response = await organizationsApi.regenerateCode(orgId);
      setOrgDetailsMap(prev => ({
        ...prev,
        [orgId]: { ...prev[orgId], joinCode: response.data.joinCode }
      }));
      setSuccess('Код приглашения обновлён');
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при обновлении кода');
    } finally {
      setLoading(false);
    }
  };

  const startRenaming = (org) => {
    setRenamingOrgId(org.organizationId);
    setRenameValue(org.organizationName);
  };

  const cancelRenaming = () => {
    setRenamingOrgId(null);
    setRenameValue('');
  };

  const handleRenameOrganization = async (e, orgId) => {
    e.preventDefault();
    if (!renameValue.trim()) return;
    
    try {
      setLoading(true);
      setError('');
      await organizationsApi.update(orgId, { name: renameValue.trim() });
      
      setSuccess('Название организации обновлено');
      setRenamingOrgId(null);
      setRenameValue('');
      
      // Refresh organizations list
      if (onOrganizationsUpdate) {
        const response = await authApi.getOrganizations();
        onOrganizationsUpdate(response.data);
      }
      // Reload organization details
      await loadAllOrganizationDetails();
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при переименовании');
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

  // Get organizations where user is owner (for invite tab) - now includes personal orgs
  const ownedOrganizations = organizations?.filter(o => o.role === 'Owner') || [];

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
          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowJoinForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Key size={18} />
              Присоединиться по коду
            </button>
            <button
              onClick={() => setShowCreateOrg(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
            >
              <Plus size={18} />
              Создать организацию
            </button>
          </div>

          {/* Join Organization Form */}
          {showJoinForm && (
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">Присоединиться к организации</h3>
              <form onSubmit={handleJoinByCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Код организации *
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500 font-mono text-lg tracking-wider"
                    placeholder="XXXXXXXX"
                    maxLength={40}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Введите код, который вам прислал владелец организации
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading || !joinCode.trim()}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Присоединение...' : 'Присоединиться'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowJoinForm(false); setJoinCode(''); }}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            </div>
          )}

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
            <div className="space-y-4">
              {organizations?.map((org) => {
                const orgDetails = orgDetailsMap[org.organizationId];
                const isActive = org.organizationId === user?.currentOrganizationId;
                const isExpanded = selectedOrgId === org.organizationId;
                
                return (
                  <div
                    key={org.organizationId}
                    className={`rounded-lg border transition-colors ${
                      isActive
                        ? 'bg-primary-600/20 border-primary-500/50'
                        : 'bg-slate-800/50 border-slate-700'
                    }`}
                  >
                    {/* Organization Header */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Building2 size={20} className={isActive ? 'text-primary-400' : 'text-slate-400'} />
                          <div className="flex-1">
                            {/* Name with rename functionality */}
                            {renamingOrgId === org.organizationId ? (
                              <form onSubmit={(e) => handleRenameOrganization(e, org.organizationId)} className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-slate-100 text-sm focus:outline-none focus:border-primary-500"
                                  autoFocus
                                />
                                <button
                                  type="submit"
                                  disabled={loading || !renameValue.trim()}
                                  className="p-1 text-green-400 hover:bg-green-500/20 rounded disabled:opacity-50"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelRenaming}
                                  className="p-1 text-red-400 hover:bg-red-500/20 rounded"
                                >
                                  <X size={16} />
                                </button>
                              </form>
                            ) : (
                              <div className="font-medium text-slate-100 flex items-center gap-2 flex-wrap">
                                {org.organizationName}
                                {org.role === 'Owner' && (
                                  <button
                                    onClick={() => startRenaming(org)}
                                    className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-700 rounded transition-colors"
                                    title="Переименовать"
                                  >
                                    <Pencil size={12} />
                                  </button>
                                )}
                                {org.isPersonal && (
                                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">
                                    Личное
                                  </span>
                                )}
                                {isActive && (
                                  <span className="text-xs bg-primary-600 text-white px-2 py-0.5 rounded">
                                    Активная
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                              {org.role === 'Owner' ? (
                                <><Crown size={12} className="text-yellow-500" /> Владелец</>
                              ) : (
                                <><User size={12} /> Участник</>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {/* Switch button */}
                          {!isActive && (
                            <button
                              onClick={() => handleSwitchOrganization(org.organizationId)}
                              disabled={loading}
                              className="flex items-center gap-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                              title="Переключиться на эту организацию"
                            >
                              <ArrowRight size={14} />
                              Перейти
                            </button>
                          )}
                          
                          {/* Manage button - now available for all orgs including personal */}
                          <button
                            onClick={() => isExpanded ? setSelectedOrgId(null) : loadOrganizationMembers(org.organizationId)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-lg transition-colors"
                          >
                            <Users size={14} />
                            {isExpanded ? 'Скрыть' : 'Управление'}
                          </button>
                          
                          {/* Leave/Exit button */}
                          {/* Показываем для: не-личных (владельцам - удалить, участникам - покинуть) и личных чужих (покинуть) */}
                          {((!org.isPersonal) || (org.isPersonal && org.role !== 'Owner')) && (
                            <button
                              onClick={() => (!org.isPersonal && org.role === 'Owner')
                                ? handleDeleteOrganization(org.organizationId)
                                : handleLeaveOrganization(org.organizationId)
                              }
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 text-sm rounded-lg transition-colors"
                              title={(!org.isPersonal && org.role === 'Owner') ? 'Удалить организацию' : 'Покинуть организацию'}
                            >
                              {(!org.isPersonal && org.role === 'Owner') ? <Trash2 size={14} /> : <LogOut size={14} />}
                              {(!org.isPersonal && org.role === 'Owner') ? 'Удалить' : 'Покинуть'}
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Join Code (for owners) - now also for personal orgs */}
                      {org.role === 'Owner' && orgDetails?.joinCode && (
                        <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                          <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                            <Key size={14} />
                            Код для регистрации:
                          </div>
                          <div className="flex items-center gap-2">
                            <code className="text-lg font-mono text-primary-400 bg-slate-800 px-3 py-1 rounded">
                              {orgDetails.joinCode}
                            </code>
                            <button
                              onClick={() => copyToClipboard(orgDetails.joinCode)}
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                              title="Копировать"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => handleRegenerateCode(org.organizationId)}
                              disabled={loading}
                              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700 rounded transition-colors"
                              title="Сгенерировать новый код"
                            >
                              <RefreshCw size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Expanded Management Section - now also for personal orgs */}
                    {isExpanded && (
                      <div className="border-t border-slate-700 p-4 space-y-4">
                        {/* Invite Form */}
                        {org.role === 'Owner' && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-300">Пригласить по email:</span>
                            </div>
                            <form onSubmit={(e) => handleInvite(e, org.organizationId)} className="flex gap-2">
                              <input
                                type="email"
                                value={inviteOrgId === org.organizationId ? inviteEmail : ''}
                                onChange={(e) => {
                                  setInviteOrgId(org.organizationId);
                                  setInviteEmail(e.target.value);
                                }}
                                onFocus={() => setInviteOrgId(org.organizationId)}
                                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500 text-sm"
                                placeholder="email@example.com"
                                required
                              />
                              <button
                                type="submit"
                                disabled={loading || inviteOrgId !== org.organizationId || !inviteEmail}
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50 text-sm"
                              >
                                <UserPlus size={16} />
                              </button>
                            </form>
                          </div>
                        )}
                        
                        {/* Members List */}
                        <div>
                          <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                            <Users size={16} />
                            Участники ({members.length})
                          </h4>
                          <div className="space-y-2">
                            {members.map((member) => (
                              <div
                                key={member.userId}
                                className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center">
                                    <User size={14} className="text-slate-400" />
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-slate-200">
                                      {member.fullName || member.username}
                                      {member.userId === user?.id && (
                                        <span className="text-xs text-slate-500 ml-1">(вы)</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-slate-500">{member.email}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    member.role === 'Owner' 
                                      ? 'bg-yellow-500/20 text-yellow-400' 
                                      : 'bg-slate-700 text-slate-400'
                                  }`}>
                                    {member.role === 'Owner' ? 'Владелец' : 'Участник'}
                                  </span>
                                  {org.role === 'Owner' && member.role !== 'Owner' && (
                                    <button
                                      onClick={() => handleRemoveMember(member.userId, member.fullName || member.username)}
                                      className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
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
                        
                        {/* Sent Invitations */}
                        {org.role === 'Owner' && sentInvitations.length > 0 && (
                          <div>
                            <h4 className="font-medium text-slate-200 mb-2 flex items-center gap-2">
                              <Mail size={16} />
                              Отправленные приглашения
                            </h4>
                            <div className="space-y-2">
                              {sentInvitations.map((inv) => (
                                <div
                                  key={inv.id}
                                  className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
                                >
                                  <div>
                                    <div className="text-sm text-slate-200">{inv.email}</div>
                                    <div className="text-xs text-slate-500">
                                      {new Date(inv.createdAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded ${
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
                                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
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
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Send Invitation Section */}
          {ownedOrganizations.length > 0 && (
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                <UserPlus size={20} className="inline mr-2" />
                Пригласить в организацию
              </h3>
              <form onSubmit={(e) => handleInvite(e)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Выберите организацию
                  </label>
                  <select
                    value={inviteOrgId || ''}
                    onChange={(e) => setInviteOrgId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500"
                    required
                  >
                    <option value="">-- Выберите организацию --</option>
                    {ownedOrganizations.map(org => (
                      <option key={org.organizationId} value={org.organizationId}>
                        {org.organizationName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email приглашаемого
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 focus:outline-none focus:border-primary-500"
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !inviteOrgId || !inviteEmail}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Mail size={18} />
                  Отправить приглашение
                </button>
              </form>
            </div>
          )}

          {/* Incoming Invitations */}
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
