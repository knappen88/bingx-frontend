import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, PieChart, Users, Target, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie } from 'recharts';
import { adminAPI } from '../services/api';
import TimeFilter from './TimeFilter';

const AdminDashboard = ({ onLogout }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [data, setData] = useState({
    bingx: [],
    vip: [],
    trading: { accounts: [], operations: [] },
    users: []
  });

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const statsData = await adminAPI.getAllStats(selectedPeriod);
      // const usersData = await adminAPI.getAllUsers(); // Раскомментировать когда добавим endpoint
      
      setData({
        bingx: statsData.bingx || [],
        vip: statsData.vip || [],
        trading: statsData.trading || { accounts: [], operations: [] },
        users: [] // usersData.data || [] // Раскомментировать когда добавим endpoint
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  // Загрузка данных при монтировании компонента и при изменении периода
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Расчет общих показателей на основе реальных данных
  const calculateTotals = () => {
    // BingX данные
    const bingxTotals = data.bingx.reduce((acc, item) => ({
      totalReferrals: acc.totalReferrals + (item.newReferrals || 0),
      totalTradingVolume: acc.totalTradingVolume + (item.tradingVolume || 0),
      totalTradingProfit: acc.totalTradingProfit + (item.tradingProfit || 0),
      totalAdCosts: acc.totalAdCosts + (item.adCosts || 0),
      totalAdProfit: acc.totalAdProfit + (item.adProfit || 0)
    }), {
      totalReferrals: 0,
      totalTradingVolume: 0,
      totalTradingProfit: 0,
      totalAdCosts: 0,
      totalAdProfit: 0
    });

    // VIP данные
    const vipRevenue = data.vip.reduce((total, member) => total + (member.plan?.price || 0), 0);

    // Trading данные
    const tradingProfit = data.trading.operations?.reduce((total, op) => {
      if (op.type === 'profit') return total + op.amount;
      if (op.type === 'loss') return total - op.amount;
      return total;
    }, 0) || 0;

    const totalRevenue = bingxTotals.totalTradingProfit + bingxTotals.totalAdProfit + vipRevenue + tradingProfit;
    const totalCosts = bingxTotals.totalAdCosts;
    const netProfit = totalRevenue - totalCosts;

    return { 
      ...bingxTotals, 
      totalVipRevenue: vipRevenue, 
      totalPersonalTrading: tradingProfit,
      totalRevenue, 
      totalCosts, 
      netProfit 
    };
  };

  // Расчет средних значений
  const calculateAverages = () => {
    const totals = calculateTotals();
    const days = Math.max(data.bingx.length, 1); // Избегаем деления на 0
    
    return {
      avgReferralsPerDay: (totals.totalReferrals / days).toFixed(1),
      avgTradingVolume: (totals.totalTradingVolume / days).toFixed(0),
      avgDailyRevenue: (totals.totalRevenue / days).toFixed(2),
      avgDailyCosts: (totals.totalCosts / days).toFixed(2),
      avgNetProfit: (totals.netProfit / days).toFixed(2)
    };
  };

  // Получить статистику пользователей
  const getUserStats = () => {
    const managers = data.vip.reduce((acc, member) => {
      const userId = member.userId?._id || member.userId;
      if (!acc[userId]) {
        acc[userId] = {
          name: member.userId?.name || 'Unknown Manager',
          email: member.userId?.email || '',
          role: 'manager',
          vipRevenue: 0,
          vipCount: 0
        };
      }
      acc[userId].vipRevenue += member.plan?.price || 0;
      acc[userId].vipCount += 1;
      return acc;
    }, {});

    const bingxStats = data.bingx.reduce((acc, item) => {
      const userId = item.userId?._id || item.userId;
      if (!acc[userId]) {
        acc[userId] = {
          name: item.userId?.name || 'Unknown Manager',
          email: item.userId?.email || '',
          role: 'manager',
          bingxProfit: 0,
          referrals: 0
        };
      }
      acc[userId].bingxProfit += (item.tradingProfit || 0) + (item.adProfit || 0);
      acc[userId].referrals += item.newReferrals || 0;
      return acc;
    }, {});

    // Объединяем статистику
    const allUserIds = new Set([...Object.keys(managers), ...Object.keys(bingxStats)]);
    
    return Array.from(allUserIds).map(userId => ({
      name: managers[userId]?.name || bingxStats[userId]?.name || 'Unknown',
      email: managers[userId]?.email || bingxStats[userId]?.email || '',
      role: 'manager',
      vipRevenue: managers[userId]?.vipRevenue || 0,
      vipCount: managers[userId]?.vipCount || 0,
      bingxProfit: bingxStats[userId]?.bingxProfit || 0,
      referrals: bingxStats[userId]?.referrals || 0,
      totalRevenue: (managers[userId]?.vipRevenue || 0) + (bingxStats[userId]?.bingxProfit || 0)
    }));
  };

  // Получить название периода
  const getPeriodName = () => {
    const periodNames = {
      'today': 'Сегодня',
      'yesterday': 'Вчера',
      'week': 'Последние 7 дней',
      'month': 'Текущий месяц'
    };
    return periodNames[selectedPeriod] || 'Все время';
  };

  const sections = [
    { id: 'overview', name: 'Обзор', icon: BarChart3 },
    { id: 'analytics', name: 'Аналитика', icon: PieChart },
    { id: 'users', name: 'Пользователи', icon: Users }
  ];

  const totals = calculateTotals();
  const averages = calculateAverages();
  const userStats = getUserStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка данных...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Админ панель</h1>
            <p className="text-gray-400">Общая статистика и аналитика</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAllData}
              className="p-2 bg-blue-700 rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              🔄
            </button>
            <button
              onClick={onLogout}
              className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Выйти
            </button>
          </div>
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

        {/* Time Filter */}
        <div className="mb-6 bg-gray-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Фильтр по времени
          </h3>
          
          <TimeFilter 
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </div>

        {/* Navigation */}
        <div className="flex space-x-1 bg-gray-800 rounded-xl p-1 mb-6">
          {sections.map((section) => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                  activeSection === section.id
                    ? 'bg-red-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span className="text-sm font-medium">{section.name}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Выбранный период */}
            <div className="bg-blue-800 rounded-xl p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Данные за: {getPeriodName()}</div>
                <div className="text-sm text-blue-200 mt-1">
                  Записей BingX: {data.bingx.length}
                </div>
              </div>
            </div>

            {/* Основные показатели */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Общий доход</h3>
                <div className="text-2xl font-bold text-green-400">
                  ${totals.totalRevenue.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Чистая прибыль</h3>
                <div className="text-2xl font-bold text-green-400">
                  ${totals.netProfit.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Общий объем</h3>
                <div className="text-2xl font-bold text-blue-400">
                  ${totals.totalTradingVolume.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Всего рефералов</h3>
                <div className="text-2xl font-bold text-purple-400">
                  {totals.totalReferrals}
                </div>
              </div>
            </div>

            {/* Средние показатели */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Средние показатели (за период)
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Рефералы за запись:</span>
                  <span className="font-semibold">{averages.avgReferralsPerDay}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Торговый объем за запись:</span>
                  <span className="font-semibold">${parseInt(averages.avgTradingVolume).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Доход за запись:</span>
                  <span className="font-semibold text-green-400">${averages.avgDailyRevenue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Расходы за запись:</span>
                  <span className="font-semibold text-red-400">${averages.avgDailyCosts}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Чистая прибыль за запись:</span>
                  <span className="font-semibold text-green-400">${averages.avgNetProfit}</span>
                </div>
              </div>
            </div>

            {/* Детализация по источникам дохода */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Источники дохода за период</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">BingX торговля:</span>
                  <span className="font-semibold text-green-400">${totals.totalTradingProfit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Реклама (чистый доход):</span>
                  <span className="font-semibold text-blue-400">${(totals.totalAdProfit - totals.totalAdCosts).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VIP группы:</span>
                  <span className="font-semibold text-purple-400">${totals.totalVipRevenue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Личная торговля:</span>
                  <span className="font-semibold text-orange-400">${totals.totalPersonalTrading.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-600 pt-3 mt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Итого:</span>
                    <span className="text-green-400">${totals.totalRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Реальные данные */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Сводка данных за период</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">BingX записей:</span>
                  <span className="font-semibold">{data.bingx.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">VIP участников:</span>
                  <span className="font-semibold">{data.vip.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Торговых операций:</span>
                  <span className="font-semibold">{data.trading.operations?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Торговых счетов:</span>
                  <span className="font-semibold">{data.trading.accounts?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeSection === 'analytics' && (
          <div className="space-y-6">
            {/* Информация о периоде */}
            <div className="bg-blue-800 rounded-xl p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Аналитика за: {getPeriodName()}</div>
                <div className="text-sm text-blue-200 mt-1">
                  На основе {data.bingx.length} записей BingX
                </div>
              </div>
            </div>

            {/* Линейный график доходов */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Динамика доходов за период</h3>
              {data.bingx.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.bingx.slice(-10)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="createdAt" 
                        stroke="#9CA3AF"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('ru-RU').slice(0, 5)}
                      />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('ru-RU')}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tradingProfit" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        name="Торговля" 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="adProfit" 
                        stroke="#3B82F6" 
                        strokeWidth={2} 
                        name="Реклама" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">Нет данных для графика</p>
                    <p className="text-sm text-gray-500">Попробуйте изменить период или добавить данные</p>
                  </div>
                </div>
              )}
            </div>

            {/* Круговая диаграмма доходов */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Структура доходов за период</h3>
              {totals.totalRevenue > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={[
                          { name: 'Торговый объем', value: totals.totalTradingProfit, fill: '#10B981' },
                          { name: 'Реклама', value: totals.totalAdProfit, fill: '#3B82F6' },
                          { name: 'ВИП группы', value: totals.totalVipRevenue, fill: '#8B5CF6' },
                          { name: 'Личная торговля', value: totals.totalPersonalTrading, fill: '#F59E0B' }
                        ].filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        dataKey="value"
                        label={({ value }) => `$${value.toFixed(0)}`}
                      />
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Доход']} />
                    </RePieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 bg-gray-700 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <PieChart className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">Нет данных для диаграммы</p>
                    <p className="text-sm text-gray-500">Попробуйте изменить период</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {[
                  { name: 'Торговый объем', color: '#10B981' },
                  { name: 'Реклама', color: '#3B82F6' },
                  { name: 'ВИП группы', color: '#8B5CF6' },
                  { name: 'Личная торговля', color: '#F59E0B' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-xs text-gray-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Детальная статистика */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Детальная статистика за период</h3>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">BingX Торговля</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Общий объем:</span>
                      <span>${totals.totalTradingVolume.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Прибыль с объема:</span>
                      <span className="text-green-400">${totals.totalTradingProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Средний объем за запись:</span>
                      <span>${data.bingx.length > 0 ? (totals.totalTradingVolume / data.bingx.length).toLocaleString() : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">Реклама</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Затраты:</span>
                      <span className="text-red-400">-${totals.totalAdCosts.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Доходы:</span>
                      <span className="text-green-400">+${totals.totalAdProfit.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">ROI:</span>
                      <span className="text-blue-400">
                        {totals.totalAdCosts > 0 ? ((totals.totalAdProfit / totals.totalAdCosts) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <h4 className="font-medium mb-2">ВИП Группы</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Общий доход:</span>
                      <span className="text-green-400">${totals.totalVipRevenue.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Участников:</span>
                      <span>{data.vip.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Средняя подписка:</span>
                      <span>${data.vip.length > 0 ? (totals.totalVipRevenue / data.vip.length).toFixed(2) : 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeSection === 'users' && (
          <div className="space-y-6">
            {/* Информация о периоде */}
            <div className="bg-blue-800 rounded-xl p-4">
              <div className="text-center">
                <div className="text-lg font-semibold">Пользователи за: {getPeriodName()}</div>
                <div className="text-sm text-blue-200 mt-1">
                  Активность менеджеров в выбранном периоде
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Активность пользователей за период</h3>
              <div className="space-y-4">
                {userStats.length > 0 ? userStats.map((user, index) => (
                  <div key={index} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{user.name}</span>
                      <span className="px-2 py-1 rounded text-xs bg-green-600">
                        Manager
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Общий доход за период:</span>
                        <span className="text-green-400">${user.totalRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">BingX доход:</span>
                        <span>${user.bingxProfit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ВИП доход:</span>
                        <span>${user.vipRevenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">ВИП участников:</span>
                        <span>{user.vipCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Рефералы за период:</span>
                        <span>{user.referrals}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Нет данных пользователей за выбранный период</p>
                    <p className="text-sm mt-1">Попробуйте изменить период или добавить активность</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;