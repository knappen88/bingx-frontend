import React from 'react';
import { Calendar, Clock, TrendingUp, CalendarDays } from 'lucide-react';

const TimeFilter = ({ selectedPeriod, onPeriodChange }) => {
  const periods = [
    {
      id: 'today',
      name: 'Сегодня',
      icon: Clock,
      color: 'bg-blue-500',
      description: 'Данные за сегодня'
    },
    {
      id: 'yesterday',
      name: 'Вчера',
      icon: Calendar,
      color: 'bg-green-500',
      description: 'Данные за вчера'
    },
    {
      id: 'week',
      name: 'Неделя',
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'Последние 7 дней'
    },
    {
      id: 'month',
      name: 'Месяц',
      icon: CalendarDays,
      color: 'bg-orange-500',
      description: 'Текущий месяц'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-300">Выберите период</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {periods.map((period) => {
          const IconComponent = period.icon;
          const isSelected = selectedPeriod === period.id;
          
          return (
            <button
              key={period.id}
              onClick={() => onPeriodChange(period.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? `${period.color} border-white shadow-lg`
                  : 'bg-gray-700 border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <IconComponent className="w-4 h-4" />
                <div>
                  <div className="font-semibold text-sm">{period.name}</div>
                  <div className="text-xs text-gray-300">{period.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {selectedPeriod && (
        <div className="mt-4 p-3 bg-blue-800 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-300 rounded-full"></div>
            <span className="text-sm text-blue-200">
              Отображаются данные: {periods.find(p => p.id === selectedPeriod)?.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeFilter;