import React, { useState, useEffect } from 'react';
import { Youtube, Instagram, Twitter, MessageCircle, Music, Plus, BarChart3 } from 'lucide-react';
import { trafferAPI } from '../services/api';

const TrafferDashboard = ({ onLogout }) => {
  const [currentStep, setCurrentStep] = useState('platforms'); // 'platforms' или 'reports'
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [savedPlatforms, setSavedPlatforms] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Новый отчет
  const [newReport, setNewReport] = useState({
    platform: '',
    videosUploaded: '',
    views: '',
    engagement: ''
  });

  const platforms = [
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: Music,
      color: 'bg-pink-500',
      description: 'Короткие видео'
    },
    {
      id: 'youtube',
      name: 'YouTube Shorts',
      icon: Youtube,
      color: 'bg-red-500',
      description: 'Видео до 60 секунд'
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      description: 'Reels и Stories'
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-gray-800',
      description: 'Посты и треды'
    },
    {
      id: 'threads',
      name: 'Threads',
      icon: MessageCircle,
      color: 'bg-blue-600',
      description: 'Текстовые посты'
    }
  ];

  // Загрузка данных при монтировании
  useEffect(() => {
    loadTrafferData();
  }, []);

  const loadTrafferData = async () => {
    setLoading(true);
    try {
      const response = await trafferAPI.getActivity();
      const activity = response.data.activity;
      
      if (activity.selectedPlatforms && activity.selectedPlatforms.length > 0) {
        setSavedPlatforms(activity.selectedPlatforms);
        setSelectedPlatforms(activity.selectedPlatforms.map(p => p.id));
        setCurrentStep('reports');
      }
      
      setDailyReports(activity.dailyReports || []);
    } catch (error) {
      console.error('Error loading traffer data:', error);
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const savePlatforms = async () => {
    if (selectedPlatforms.length === 0) {
      setError('Выберите хотя бы одну платформу');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const platformsToSave = selectedPlatforms.map(id => {
        const platform = platforms.find(p => p.id === id);
        return { id: platform.id, name: platform.name };
      });

      await trafferAPI.savePlatforms(platformsToSave);
      setSavedPlatforms(platformsToSave);
      setCurrentStep('reports');
      alert('Платформы сохранены! Теперь вы можете добавлять ежедневные отчеты.');
    } catch (error) {
      console.error('Error saving platforms:', error);
      setError('Ошибка сохранения платформ');
    } finally {
      setLoading(false);
    }
  };

  const addDailyReport = async () => {
    if (!newReport.platform || !newReport.videosUploaded) {
      setError('Заполните обязательные поля');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await trafferAPI.addDailyReport(newReport);
      setDailyReports([response.data.report, ...dailyReports]);
      setNewReport({
        platform: '',
        videosUploaded: '',
        views: '',
        engagement: ''
      });
      alert('Отчет добавлен успешно!');
    } catch (error) {
      console.error('Error adding report:', error);
      setError('Ошибка добавления отчета');
    } finally {
      setLoading(false);
    }
  };

  // Подсчет статистики
  const calculateStats = () => {
    const totalVideos = dailyReports.reduce((sum, report) => sum + report.videosUploaded, 0);
    const totalViews = dailyReports.reduce((sum, report) => sum + (report.views || 0), 0);
    const avgEngagement = dailyReports.length > 0 
      ? (dailyReports.reduce((sum, report) => sum + (report.engagement || 0), 0) / dailyReports.length).toFixed(1)
      : 0;

    return { totalVideos, totalViews, avgEngagement };
  };

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Траффер панель</h1>
            <p className="text-gray-400">
              {currentStep === 'platforms' ? 'Выберите платформы для работы' : 'Ежедневные отчеты'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {currentStep === 'reports' && (
              <button
                onClick={() => setCurrentStep('platforms')}
                className="p-2 bg-blue-700 rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                ⚙️
              </button>
            )}
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

        {/* Loading */}
        {loading && (
          <div className="mb-4 p-3 bg-blue-800 rounded-lg text-blue-200 text-sm flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
            Загрузка...
          </div>
        )}

        {/* Выбор платформ */}
        {currentStep === 'platforms' && (
          <div className="space-y-6">
            {/* Активные платформы */}
            {selectedPlatforms.length > 0 && (
              <div className="bg-green-800 rounded-xl p-4 mb-6">
                <h3 className="font-semibold mb-2">Выбранные платформы ({selectedPlatforms.length})</h3>
                <div className="text-sm text-green-200">
                  {selectedPlatforms.map(id => 
                    platforms.find(p => p.id === id)?.name
                  ).join(', ')}
                </div>
              </div>
            )}

            {/* Список платформ */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Доступные платформы</h2>
              
              {platforms.map((platform) => {
                const IconComponent = platform.icon;
                const isSelected = selectedPlatforms.includes(platform.id);
                
                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${platform.color} border-white shadow-lg`
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-6 h-6" />
                        <div className="text-left">
                          <div className="font-semibold">{platform.name}</div>
                          <div className="text-sm text-gray-400">{platform.description}</div>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 ${
                        isSelected ? 'bg-white border-white' : 'border-gray-400'
                      }`}>
                        {isSelected && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-gray-900 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Кнопка сохранения */}
            <button
              onClick={savePlatforms}
              disabled={selectedPlatforms.length === 0 || loading}
              className={`w-full p-4 rounded-xl font-semibold transition-all ${
                selectedPlatforms.length > 0 && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Сохранение...' : 'Подтвердить выбор платформ'}
            </button>
          </div>
        )}

        {/* Ежедневные отчеты */}
        {currentStep === 'reports' && (
          <div className="space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalVideos}</div>
                  <div className="text-sm text-blue-200">Видео загружено</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-sm text-green-200">Просмотров</div>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-700 to-purple-600 rounded-xl p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.avgEngagement}%</div>
                  <div className="text-sm text-purple-200">Ср. вовлеченность</div>
                </div>
              </div>
            </div>

            {/* Активные платформы */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Ваши платформы</h3>
              <div className="flex flex-wrap gap-2">
                {savedPlatforms.map((platform) => {
                  const platformData = platforms.find(p => p.id === platform.id);
                  const IconComponent = platformData?.icon || Music;
                  return (
                    <div key={platform.id} className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3 py-2">
                      <IconComponent className="w-4 h-4" />
                      <span className="text-sm">{platform.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Форма добавления отчета */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Добавить ежедневный отчет
              </h3>
              
              <div className="space-y-4">
                {/* Выбор платформы */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Платформа *
                  </label>
                  <select
                    value={newReport.platform}
                    onChange={(e) => setNewReport({...newReport, platform: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="">Выберите платформу</option>
                    {savedPlatforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Количество видео */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Количество загруженных видео *
                  </label>
                  <input
                    type="number"
                    value={newReport.videosUploaded}
                    onChange={(e) => setNewReport({...newReport, videosUploaded: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Например: 5"
                  />
                </div>

                {/* Просмотры */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Просмотры
                  </label>
                  <input
                    type="number"
                    value={newReport.views}
                    onChange={(e) => setNewReport({...newReport, views: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Например: 10000"
                  />
                </div>

                {/* Вовлеченность */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Вовлеченность (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newReport.engagement}
                    onChange={(e) => setNewReport({...newReport, engagement: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Например: 5.2"
                  />
                </div>

                <button
                  onClick={addDailyReport}
                  disabled={!newReport.platform || !newReport.videosUploaded || loading}
                  className={`w-full p-3 rounded-lg font-semibold transition-colors ${
                    newReport.platform && newReport.videosUploaded && !loading
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Добавление...' : 'Добавить отчет'}
                </button>
              </div>
            </div>

            {/* История отчетов */}
            {dailyReports.length > 0 && (
              <div className="bg-gray-800 rounded-xl p-6">
                <h4 className="font-semibold mb-4">История отчетов ({dailyReports.length})</h4>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dailyReports.map((report, index) => {
                    const platformData = platforms.find(p => p.id === report.platform);
                    const IconComponent = platformData?.icon || Music;
                    
                    return (
                      <div key={index} className="bg-gray-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <IconComponent className="w-5 h-5" />
                            <div>
                              <div className="font-medium">{platformData?.name || report.platform}</div>
                              <div className="text-sm text-gray-400">
                                {new Date(report.date).toLocaleDateString('ru-RU')}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Видео:</span>
                            <div className="font-semibold">{report.videosUploaded}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Просмотры:</span>
                            <div className="font-semibold">{(report.views || 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Вовлеченность:</span>
                            <div className="font-semibold">{(report.engagement || 0).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Заглушка если нет отчетов */}
            {dailyReports.length === 0 && (
              <div className="bg-gray-800 rounded-xl p-6 text-center">
                <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Пока нет отчетов</p>
                <p className="text-sm text-gray-500 mt-1">
                  Добавьте первый отчет выше
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrafferDashboard;