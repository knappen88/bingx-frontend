// Симуляция данных из "базы данных"
export const generateMockData = () => {
  // Данные за последние 7 дней
  const dailyData = [
    { date: '27.06', bingxReferrals: 12, tradingVolume: 2500000, tradingProfit: 625, adCosts: 150, adProfit: 300, vipRevenue: 347, personalTrading: 89 },
    { date: '28.06', bingxReferrals: 8, tradingVolume: 1800000, tradingProfit: 450, adCosts: 120, adProfit: 250, vipRevenue: 198, personalTrading: -45 },
    { date: '29.06', bingxReferrals: 15, tradingVolume: 3200000, tradingProfit: 800, adCosts: 200, adProfit: 420, vipRevenue: 596, personalTrading: 156 },
    { date: '30.06', bingxReferrals: 10, tradingVolume: 2100000, tradingProfit: 525, adCosts: 180, adProfit: 380, vipRevenue: 149, personalTrading: 78 },
    { date: '01.07', bingxReferrals: 18, tradingVolume: 4100000, tradingProfit: 1025, adCosts: 250, adProfit: 520, vipRevenue: 794, personalTrading: 234 },
    { date: '02.07', bingxReferrals: 13, tradingVolume: 2800000, tradingProfit: 700, adCosts: 160, adProfit: 340, vipRevenue: 298, personalTrading: 112 },
    { date: '03.07', bingxReferrals: 22, tradingVolume: 5200000, tradingProfit: 1300, adCosts: 300, adProfit: 650, vipRevenue: 1091, personalTrading: 287 }
  ];

  // Данные по пользователям
  const usersData = [
    { name: 'Manager_1', totalRevenue: 4521, bingxProfit: 2340, vipRevenue: 1245, tradingProfit: 936 },
    { name: 'Manager_2', totalRevenue: 3892, bingxProfit: 1980, vipRevenue: 987, tradingProfit: 925 },
    { name: 'Manager_3', totalRevenue: 6234, bingxProfit: 3450, vipRevenue: 1876, tradingProfit: 908 },
    { name: 'Traffer_1', platformsActive: 4, totalReach: 15420 },
    { name: 'Traffer_2', platformsActive: 3, totalReach: 8750 }
  ];

  return { dailyData, usersData };
};