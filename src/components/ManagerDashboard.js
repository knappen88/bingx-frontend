import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, Users, BarChart3, Calendar, Trash2, Crown, ArrowUp, ArrowDown, Wallet } from 'lucide-react';
import { bingxAPI, vipAPI, tradingAPI } from '../services/api';

const ManagerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('bingx');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // BingX Data
  const [bingxData, setBingxData] = useState({
    newReferrals: '',
    tradingVolume: '',
    adCosts: '',
    adProfit: ''
  });

  // VIP Data
  const [vipMembers, setVipMembers] = useState([]);
  const [vipPlans, setVipPlans] = useState([]);
  const [newVipMember, setNewVipMember] = useState({
    name: '',
    plan: ''
  });

  // Trading Data
  const [tradingAccount, setTradingAccount] = useState(null);
  const [tradingOperations, setTradingOperations] = useState([]);
  const [newOperation, setNewOperation] = useState({
    type: 'profit',
    amount: '',
    description: ''
  });

  // Load data on component mount
  useEffect(() => {
    loadVipData();
    loadTradingData();
  }, []);

  // Load VIP data
  const loadVipData = async () => {
    try {
      const [membersResponse, plansResponse] = await Promise.all([
        vipAPI.getMembers(),
        vipAPI.getPlans()
      ]);
      setVipMembers(membersResponse.data);
      setVipPlans(plansResponse.data);
    } catch (error) {
      console.error('Error loading VIP data:', error);
      setError('Ошибка загрузки VIP данных');
    }
  };

  // Load trading data
  const loadTradingData = async () => {
    try {
      const response = await tradingAPI.getAccount();
      setTradingAccount(response.data.account);
      setTradingOperations(response.data.operations || []);
    } catch (error) {
      console.error('Error loading trading data:', error);
      setError('Ошибка загрузки торговых данных');
    }
  };

  // Auto-calculate trading profit (1M = $250)
  const calculateTradingProfit = (volume) => {
    const volumeNum = parseFloat(volume) || 0;
    return (volumeNum / 1000000 * 250).toFixed(2);
  };

  // Handle BingX form submission
  const handleBingxSubmit = async () => {
    if (!bingxData.newReferrals && !bingxData.tradingVolume) {
      setError('Заполните хотя бы одно поле');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await bingxAPI.saveData(bingxData);
      setBingxData({
        newReferrals: '',
        tradingVolume: '',
        adCosts: '',
        adProfit: ''
      });
      alert('Данные BingX сохранены успешно!');
    } catch (error) {
      console.error('Error saving BingX data:', error);
      setError(error.response?.data?.message || 'Ошибка сохранения данных');
    } finally {
      setLoading(false);
    }
  };

  // Add VIP member
  const addVipMember = async () => {
    if (!newVipMember.name || !newVipMember.plan) {
      setError('Заполните все поля для VIP участника');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await vipAPI.addMember({
        name: newVipMember.name,
        planId: newVipMember.plan
      });
      
      setVipMembers([response.data.member, ...vipMembers]);
      setNewVipMember({ name: '', plan: '' });
      alert('VIP участник добавлен успешно!');
    } catch (error) {
      console.error('Error adding VIP member:', error);
      setError(error.response?.data?.message || 'Ошибка добавления VIP участника');
    } finally {
      setLoading(false);
    }
  };

  // Remove VIP member
  const removeVipMember = async (id) => {
    if (!window.confirm('Удалить VIP участника?')) return;

    setLoading(true);
    try {
      await vipAPI.deleteMember(id);
      setVipMembers(vipMembers.filter(member => member._id !== id));
      alert('VIP участник удален');
    } catch (error) {
      console.error('Error removing VIP member:', error);
      setError('Ошибка удаления VIP участника');
    } finally {
      setLoading(false);
    }
  };

  // Calculate VIP profit
  const calculateVipProfit = () => {
    return vipMembers.reduce((total, member) => total + member.plan.price, 0);
  };

  // Set initial deposit
  const setInitialDeposit = async (amount) => {
    setLoading(true);
    setError('');

    try {
      const response = await tradingAPI.setDeposit(amount);
      setTradingAccount(response.data.account);
      alert('Депозит установлен успешно!');
    } catch (error) {
      console.error('Error setting deposit:', error);
      setError(error.response?.data?.message || 'Ошибка установки депозита');
    } finally {
      setLoading(false);
    }
  };

  // Add trading operation
  const addTradingOperation = async () => {
    if (!newOperation.amount || !newOperation.description) {
      setError('Заполните все поля операции');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await tradingAPI.addOperation(newOperation);
      setTradingOperations([response.data.operation, ...tradingOperations]);
      setNewOperation({
        type: 'profit',
        amount: '',
        description: ''
      });
      alert('Операция добавлена успешно!');
    } catch (error) {
      console.error('Error adding operation:', error);
      setError(error.response?.data?.message || 'Ошибка добавления операции');
    } finally {
      setLoading(false);
    }
  };

  // Remove trading operation
  const removeTradingOperation = async (id) => {
    if (!window.confirm('Удалить операцию?')) return;

    setLoading(true);
    try {
      await tradingAPI.deleteOperation(id);
      setTradingOperations(tradingOperations.filter(op => op._id !== id));
      alert('Операция удалена');
    } catch (error) {
      console.error('Error removing operation:', error);
      setError('Ошибка удаления операции');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current balance
  const calculateCurrentBalance = () => {
    if (!tradingAccount?.initialDeposit) return 0;
    
    const totalOperations = tradingOperations.reduce((total, op) => {
      if (op.type === 'profit') return total + op.amount;
      if (op.type === 'loss') return total - op.amount;
      if (op.type === 'withdrawal') return total - op.amount;
      return total;
    }, 0);
    
    return tradingAccount.initialDeposit + totalOperations;
  };

  // Calculate trading statistics
  const calculateTradingStats = () => {
    const profits = tradingOperations.filter(op => op.type === 'profit').reduce((sum, op) => sum + op.amount, 0);
    const losses = tradingOperations.filter(op => op.type === 'loss').reduce((sum, op) => sum + op.amount, 0);
    const withdrawals = tradingOperations.filter(op => op.type === 'withdrawal').reduce((sum, op) => sum + op.amount, 0);
    
    return { profits, losses, withdrawals };
  };

  const tabs = [
    { id: 'bingx', name: 'BingX', icon: BarChart3 },
    { id: 'vip', name: 'ВИП Группа', icon: Users },
    { id: 'trading', name: 'Торговля', icon: DollarSign }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Manager панель</h1>
            <p className="text-gray-400">Ведение статистики BingX</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Выйти
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-800 rounded-lg text-red-200 text-sm">
            {error}
            <button 
              onClick={() => setError('')} 
              className="ml-2 text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-4 p-3 bg-blue-800 rounded-lg text-blue-200 text-sm flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
            Загрузка...
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-xl p-1 mb-6">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* BingX Tab */}
        {activeTab === 'bingx' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Ежедневная статистика BingX
              </h3>
              
              <div className="space-y-4">
                {/* Новые рефералы */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Количество новых рефералов
                  </label>
                  <input
                    type="number"
                    value={bingxData.newReferrals}
                    onChange={(e) => setBingxData({...bingxData, newReferrals: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Введите количество"
                  />
                </div>

                {/* Торговый объем */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Торговый объем (в долларах)
                  </label>
                  <input
                    type="number"
                    value={bingxData.tradingVolume}
                    onChange={(e) => setBingxData({...bingxData, tradingVolume: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Например: 1000000"
                  />
                  {bingxData.tradingVolume && (
                    <div className="mt-2 p-2 bg-green-800 rounded-lg">
                      <span className="text-sm text-green-200">
                        Автоподсчет прибыли: ${calculateTradingProfit(bingxData.tradingVolume)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Затраты на рекламу */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Затраты на рекламу ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bingxData.adCosts}
                    onChange={(e) => setBingxData({...bingxData, adCosts: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Введите затраты"
                  />
                </div>

                {/* Прибыль с рекламы */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Прибыль с рекламы ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={bingxData.adProfit}
                    onChange={(e) => setBingxData({...bingxData, adProfit: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Введите прибыль"
                  />
                </div>

                <button
                  onClick={handleBingxSubmit}
                  disabled={loading}
                  className={`w-full p-3 rounded-lg font-semibold transition-colors ${
                    loading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Сохранение...' : 'Сохранить данные'}
                </button>
              </div>
            </div>

            {/* Краткая статистика */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="font-semibold mb-3">Сегодняшняя сводка</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Рефералы:</span>
                  <span>{bingxData.newReferrals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Торговый объем:</span>
                  <span>${bingxData.tradingVolume || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Прибыль с объема:</span>
                  <span className="text-green-400">${calculateTradingProfit(bingxData.tradingVolume)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Затраты на рекламу:</span>
                  <span className="text-red-400">-${bingxData.adCosts || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Прибыль с рекламы:</span>
                  <span className="text-green-400">+${bingxData.adProfit || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIP Tab */}
        {activeTab === 'vip' && (
          <div className="space-y-6">
            {/* Форма добавления ВИП участника */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Crown className="w-5 h-5 mr-2" />
                Добавить в ВИП группу
              </h3>
              
              <div className="space-y-4">
                {/* Имя участника */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Имя участника
                  </label>
                  <input
                    type="text"
                    value={newVipMember.name}
                    onChange={(e) => setNewVipMember({...newVipMember, name: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Введите имя"
                  />
                </div>

                {/* Выбор тарифа */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Тарифный план
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {vipPlans.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setNewVipMember({...newVipMember, plan: plan.id})}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          newVipMember.plan === plan.id
                            ? 'bg-blue-600 border-blue-400'
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <div className="font-semibold text-sm">{plan.name}</div>
                        <div className="text-xs text-gray-300">${plan.price}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={addVipMember}
                  disabled={!newVipMember.name || !newVipMember.plan || loading}
                  className={`w-full p-3 rounded-lg font-semibold transition-colors ${
                    newVipMember.name && newVipMember.plan && !loading
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  {loading ? 'Добавление...' : 'Добавить в ВИП'}
                </button>
              </div>
            </div>

            {/* Список ВИП участников */}
            {vipMembers.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="font-semibold mb-4 flex items-center justify-between">
                  <span>ВИП участники ({vipMembers.length})</span>
                  <span className="text-green-400">${calculateVipProfit()}</span>
                </h4>
                
                <div className="space-y-3">
                  {vipMembers.map((member) => (
                    <div key={member._id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-gray-400">
                            {member.plan.name} • ${member.plan.price} • {new Date(member.dateAdded).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                        <button
                          onClick={() => removeVipMember(member._id)}
                          disabled={loading}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Статистика по тарифам */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h4 className="font-semibold mb-4">Статистика по тарифам</h4>
              <div className="space-y-3">
                {vipPlans.map((plan) => {
                  const count = vipMembers.filter(m => m.plan.id === plan.id).length;
                  const revenue = count * plan.price;
                  return (
                    <div key={plan.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{plan.name}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-400">{count}x</span>
                        <span className="ml-2 text-green-400">${revenue}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Итого:</span>
                    <span className="text-green-400">${calculateVipProfit()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Быстрая статистика */}
            {vipMembers.length === 0 && (
              <div className="bg-gray-800 rounded-xl p-6 text-center">
                <Crown className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Пока нет ВИП участников</p>
                <p className="text-sm text-gray-500 mt-1">
                  Добавьте первого участника выше
                </p>
              </div>
            )}
          </div>
        )}

        {/* Trading Tab */}
        {activeTab === 'trading' && (
          <div className="space-y-6">
            {/* Стартовый депозит */}
            {!tradingAccount?.isDepositSet ? (
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Wallet className="w-5 h-5 mr-2" />
                  Установить стартовый депозит
                </h3>
                
                <div className="space-y-4">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Введите сумму депозита"
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        setInitialDeposit(e.target.value);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.querySelector('input[type="number"]');
                      if (input.value) {
                        setInitialDeposit(input.value);
                      }
                    }}
                    disabled={loading}
                    className={`w-full p-3 rounded-lg font-semibold transition-colors ${
                      loading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? 'Установка...' : 'Установить депозит'}
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-yellow-800 rounded-lg">
                  <p className="text-sm text-yellow-200">
                    💡 Депозит можно установить только один раз!
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Текущий баланс */}
                <div className="bg-gradient-to-r from-green-800 to-blue-800 rounded-xl p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Текущий баланс</h3>
                    <div className="text-3xl font-bold">${calculateCurrentBalance().toFixed(2)}</div>
                    <div className="text-sm text-gray-300 mt-1">
                      Стартовый депозит: ${tradingAccount.initialDeposit.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Добавление операции */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Добавить операцию</h3>
                  
                  <div className="space-y-4">
                    {/* Тип операции */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setNewOperation({...newOperation, type: 'profit'})}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          newOperation.type === 'profit'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <ArrowUp className="w-4 h-4 inline mr-1" />
                        Прибыль
                      </button>
                      <button
                        onClick={() => setNewOperation({...newOperation, type: 'loss'})}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          newOperation.type === 'loss'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <ArrowDown className="w-4 h-4 inline mr-1" />
                        Убыток
                      </button>
                      <button
                        onClick={() => setNewOperation({...newOperation, type: 'withdrawal'})}
                        className={`p-3 rounded-lg text-sm font-medium transition-all ${
                          newOperation.type === 'withdrawal'
                            ? 'bg-yellow-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        <Wallet className="w-4 h-4 inline mr-1" />
                        Вывод
                      </button>
                    </div>

                    {/* Сумма */}
                    <input
                      type="number"
                      step="0.01"
                      value={newOperation.amount}
                      onChange={(e) => setNewOperation({...newOperation, amount: e.target.value})}
                      placeholder="Сумма"
                      className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />

                    {/* Описание */}
                    <input
                      type="text"
                      value={newOperation.description}
                      onChange={(e) => setNewOperation({...newOperation, description: e.target.value})}
                      placeholder="Описание операции"
                      className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />

                    <button
                      onClick={addTradingOperation}
                      disabled={!newOperation.amount || !newOperation.description || loading}
                      className={`w-full p-3 rounded-lg font-semibold transition-colors ${
                        newOperation.amount && newOperation.description && !loading
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      {loading ? 'Добавление...' : 'Добавить операцию'}
                    </button>
                  </div>
                </div>

                {/* История операций */}
                {tradingOperations.length > 0 && (
                  <div className="bg-gray-800 rounded-xl p-6">
                    <h4 className="font-semibold mb-4">История операций ({tradingOperations.length})</h4>
                    
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {tradingOperations.map((operation) => (
                        <div key={operation._id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                operation.type === 'profit' ? 'bg-green-500' :
                                operation.type === 'loss' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <div>
                                <div className="font-medium">{operation.description}</div>
                                <div className="text-sm text-gray-400">{new Date(operation.date).toLocaleDateString('ru-RU')}</div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`font-semibold ${
                                operation.type === 'profit' ? 'text-green-400' :
                                operation.type === 'loss' ? 'text-red-400' : 'text-yellow-400'
                              }`}>
                                {operation.type === 'profit' ? '+' : '-'}${operation.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => removeTradingOperation(operation._id)}
                                disabled={loading}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-900 rounded transition-colors disabled:opacity-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Статистика торговли */}
                <div className="bg-gray-800 rounded-xl p-6">
                  <h4 className="font-semibold mb-4">Статистика торговли</h4>
                  
                  {(() => {
                    const stats = calculateTradingStats();
                    return (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Стартовый депозит:</span>
                          <span className="font-semibold">${tradingAccount.initialDeposit.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Общая прибыль:</span>
                          <span className="font-semibold text-green-400">+${stats.profits.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Общие убытки:</span>
                          <span className="font-semibold text-red-400">-${stats.losses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Выведено:</span>
                          <span className="font-semibold text-yellow-400">-${stats.withdrawals.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-600 pt-3 mt-3">
                          <div className="flex justify-between">
                            <span className="font-semibold">Текущий баланс:</span>
                            <span className={`font-semibold ${
                              calculateCurrentBalance() >= tradingAccount.initialDeposit ? 'text-green-400' : 'text-red-400'
                            }`}>
                              ${calculateCurrentBalance().toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerDashboard;