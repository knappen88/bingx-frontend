import React, { useState } from 'react';
import { User, Shield, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'traffer',
    secretCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  
  const { register } = useAuth();

  const roles = [
    {
      id: 'traffer',
      name: 'Траффер',
      icon: TrendingUp,
      color: 'bg-blue-500',
      description: 'Работа с платформами трафика',
      needsCode: false
    },
    {
      id: 'manager',
      name: 'Manager',
      icon: User,
      color: 'bg-green-500',
      description: 'Ведение статистики BingX',
      needsCode: true
    },
    {
      id: 'admin',
      name: 'Админ',
      icon: Shield,
      color: 'bg-red-500',
      description: 'Просмотр всей статистики',
      needsCode: true
    }
  ];

  const selectedRole = roles.find(r => r.id === formData.role);
  const needsSecretCode = selectedRole?.needsCode;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Валидация
    if (!formData.email || !formData.password || !formData.name) {
      setError('Заполните все обязательные поля');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      setLoading(false);
      return;
    }

    if (needsSecretCode && !formData.secretCode) {
      setError(`Введите секретный код для роли ${selectedRole.name}`);
      setLoading(false);
      return;
    }

    const result = await register(formData);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Регистрация</h1>
          <p className="text-gray-400">Создайте новый аккаунт</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Имя *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Введите ваше имя"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Введите email"
                required
              />
            </div>

            {/* Пароль */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Введите пароль (минимум 6 символов)"
                required
              />
            </div>

            {/* Выбор роли */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Роль *
              </label>
              <div className="space-y-2">
                {roles.map((role) => {
                  const IconComponent = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => handleInputChange('role', role.id)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        formData.role === role.id
                          ? `${role.color} border-white`
                          : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <IconComponent className="w-5 h-5" />
                        <div>
                          <div className="font-semibold">{role.name}</div>
                          <div className="text-sm text-gray-400">{role.description}</div>
                          {role.needsCode && (
                            <div className="text-xs text-yellow-400 mt-1">
                              🔒 Требует секретный код
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Секретный код (только для админов и менеджеров) */}
            {needsSecretCode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Секретный код для {selectedRole.name} *
                </label>
                <div className="relative">
                  <input
                    type={showSecretCode ? "text" : "password"}
                    value={formData.secretCode}
                    onChange={(e) => handleInputChange('secretCode', e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none pr-12"
                    placeholder="Введите секретный код"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretCode(!showSecretCode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 p-2 bg-yellow-800 rounded text-yellow-200 text-xs">
                  💡 Секретные коды выдаются администратором системы
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-800 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-lg font-semibold transition-colors ${
                loading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          {/* Переключение на логин */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Уже есть аккаунт?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                Войти
              </button>
            </p>
          </div>
        </div>

        {/* Информация о секретных кодах */}
        <div className="mt-6 bg-gray-800 rounded-xl p-4">
          <h4 className="font-semibold mb-2 text-sm">Информация о ролях:</h4>
          <div className="space-y-1 text-xs text-gray-400">
            <p>🔵 <strong>Траффер</strong> - свободная регистрация</p>
            <p>🟢 <strong>Manager</strong> - нужен секретный код</p>
            <p>🔴 <strong>Админ</strong> - нужен секретный код</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;