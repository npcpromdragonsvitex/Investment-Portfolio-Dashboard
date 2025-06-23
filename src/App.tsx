import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, Settings, AlertTriangle, Wifi, WifiOff, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { fetchMultipleStockPrices, fetchHistoricalData, StockData } from './services/stockApi';
import CapitalManager from './components/CapitalManager';
import AIInsights from './components/AIInsights';

interface Position {
  symbol: string;
  name: string;
  shares: number;
  price: number;
  value: number;
  change: number;
  changePercent: number;
  allocation: number;
  previousClose: number;
}

interface PortfolioData {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  positions: Position[];
}

const InvestmentDashboard = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    positions: []
  });

  const [performanceData, setPerformanceData] = useState<Array<{date: string, value: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiToken, setApiToken] = useState('');
  const [updateInterval, setUpdateInterval] = useState('30');
  const [notifications, setNotifications] = useState({
    priceChanges: true,
    recommendations: false
  });

  // Управление капиталом
  const [totalCapital, setTotalCapital] = useState(2000000); // 2 млн рублей начальный капитал
  const [availableCash, setAvailableCash] = useState(500000); // 500к свободных средств

  // Конфигурация портфеля - российские акции
  const portfolioConfig = {
    positions: [
      { symbol: 'SBER', name: 'Сбербанк', shares: 100 },
      { symbol: 'GAZP', name: 'Газпром', shares: 200 },
      { symbol: 'LKOH', name: 'Лукойл', shares: 50 },
      { symbol: 'NVTK', name: 'Новатэк', shares: 80 },
      { symbol: 'YNDX', name: 'Яндекс', shares: 30 },
      { symbol: 'ROSN', name: 'Роснефть', shares: 75 },
      { symbol: 'MTSS', name: 'МТС', shares: 120 }
    ]
  };

  const pieColors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

  const calculatePortfolio = (stockData: StockData[]): PortfolioData => {
    let totalValue = 0;
    let totalPrevValue = 0;
    
    const calculatedPositions: Position[] = portfolioConfig.positions.map((configPos) => {
      const stockInfo = stockData.find(stock => stock.symbol === configPos.symbol);
      
      if (!stockInfo) {
        return {
          symbol: configPos.symbol,
          name: configPos.name,
          shares: configPos.shares,
          price: 0,
          value: 0,
          change: 0,
          changePercent: 0,
          allocation: 0,
          previousClose: 0
        };
      }

      const currentValue = configPos.shares * stockInfo.price;
      const prevValue = configPos.shares * stockInfo.previousClose;
      
      totalValue += currentValue;
      totalPrevValue += prevValue;
      
      return {
        symbol: stockInfo.symbol,
        name: stockInfo.name,
        shares: configPos.shares,
        price: stockInfo.price,
        value: currentValue,
        change: stockInfo.change,
        changePercent: stockInfo.changePercent,
        allocation: 0, // Будет пересчитано после получения общей суммы
        previousClose: stockInfo.previousClose
      };
    });

    // Пересчитываем доли после получения общей суммы
    const positionsWithAllocation = calculatedPositions.map(pos => ({
      ...pos,
      allocation: totalValue > 0 ? (pos.value / totalValue) * 100 : 0
    }));

    const dailyChange = totalValue - totalPrevValue;
    const dailyChangePercent = totalPrevValue > 0 ? (dailyChange / totalPrevValue) * 100 : 0;

    return {
      totalValue,
      dailyChange,
      dailyChangePercent,
      positions: positionsWithAllocation
    };
  };

  const loadPortfolioData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const symbols = portfolioConfig.positions.map(pos => pos.symbol);
      const stockData = await fetchMultipleStockPrices(symbols);
      const calculatedData = calculatePortfolio(stockData);
      
      setPortfolioData(calculatedData);
      setApiConnected(true);
      
      // Загружаем исторические данные для первой акции (для примера)
      if (symbols.length > 0) {
        const historical = await fetchHistoricalData(symbols[0]);
        // Масштабируем исторические данные под общую стоимость портфеля
        const scaledHistorical = historical.map(point => ({
          ...point,
          value: Math.round((point.value / stockData[0].price) * calculatedData.totalValue)
        }));
        setPerformanceData(scaledHistorical);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка загрузки данных';
      setError(errorMessage);
      setApiConnected(false);
      console.error('Error loading portfolio data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPortfolioData();
    setIsRefreshing(false);
  };

  const handleSaveSettings = () => {
    if (!apiToken.trim()) {
      alert('Пожалуйста, введите токен API');
      return;
    }

    const settings = {
      apiToken: apiToken.trim(),
      updateInterval: parseInt(updateInterval),
      notifications
    };

    // В реальном приложении здесь было бы сохранение в localStorage
    localStorage.setItem('investmentSettings', JSON.stringify(settings));
    
    alert('Настройки успешно сохранены!');
    setShowSettings(false);
    handleRefresh();
  };

  // Автообновление данных
  useEffect(() => {
    loadPortfolioData();
    
    const intervalMs = parseInt(updateInterval) * 1000;
    const interval = setInterval(() => {
      if (apiConnected && !isRefreshing) {
        handleRefresh();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [updateInterval, apiConnected]);

  // Загрузка сохраненных настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem('investmentSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setApiToken(settings.apiToken || '');
        setUpdateInterval(settings.updateInterval?.toString() || '30');
        setNotifications(settings.notifications || { priceChanges: true, recommendations: false });
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const pieData = portfolioData.positions.map((pos, index) => ({
    name: pos.symbol,
    value: Math.round(pos.allocation * 100) / 100,
    color: pieColors[index % pieColors.length],
    fullName: pos.name
  }));

  if (isLoading && portfolioData.positions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Загрузка реальных данных</h2>
          <p className="text-slate-400">Получаем актуальные цены российских акций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Инвестиционный Портфель
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-400">Российские акции • Реальные цены • AI Анализ</p>
              <div className="flex items-center gap-2">
                {apiConnected ? (
                  <><Wifi className="w-4 h-4 text-green-400" /><span className="text-green-400 text-sm">Подключен</span></>
                ) : (
                  <><WifiOff className="w-4 h-4 text-red-400" /><span className="text-red-400 text-sm">Офлайн</span></>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Обновить
            </button>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
              Настройки
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span className="text-red-100">{error}</span>
            </div>
          </div>
        )}

        {/* Capital Management */}
        <div className="mb-8">
          <CapitalManager
            totalCapital={totalCapital}
            availableCash={availableCash}
            onCapitalChange={setTotalCapital}
            onCashChange={setAvailableCash}
          />
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Стоимость позиций</p>
                <p className="text-3xl font-bold">{formatCurrency(portfolioData.totalValue)}</p>
                <p className="text-slate-400 text-xs mt-1">
                  {portfolioData.positions.length} позиций
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Дневное изменение</p>
                <p className={`text-2xl font-bold ${portfolioData.dailyChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioData.dailyChange >= 0 ? '+' : ''}{formatCurrency(portfolioData.dailyChange)}
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  За сегодня
                </p>
              </div>
              {portfolioData.dailyChange >= 0 ? 
                <TrendingUp className="w-8 h-8 text-green-400" /> : 
                <TrendingDown className="w-8 h-8 text-red-400" />
              }
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Процентное изменение</p>
                <p className={`text-2xl font-bold ${portfolioData.dailyChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {portfolioData.dailyChangePercent >= 0 ? '+' : ''}{portfolioData.dailyChangePercent.toFixed(2)}%
                </p>
                <p className="text-slate-400 text-xs mt-1">
                  Относительно вчера
                </p>
              </div>
              <PieChart className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">Динамика портфеля (30 дней)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${(value / 1000000).toFixed(1)}М`} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Стоимость']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Chart */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <h3 className="text-xl font-semibold mb-4">Распределение активов</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [`${value}%`, props.payload.fullName]}
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Positions Table */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 mb-8">
          <h3 className="text-xl font-semibold mb-4">Текущие позиции • Реальные цены</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4">Тикер</th>
                  <th className="text-left py-3 px-4">Компания</th>
                  <th className="text-right py-3 px-4">Количество</th>
                  <th className="text-right py-3 px-4">Цена</th>
                  <th className="text-right py-3 px-4">Стоимость</th>
                  <th className="text-right py-3 px-4">Изменение</th>
                  <th className="text-right py-3 px-4">Доля</th>
                </tr>
              </thead>
              <tbody>
                {portfolioData.positions.map((position) => (
                  <tr key={position.symbol} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-blue-400 font-semibold">{position.symbol}</td>
                    <td className="py-3 px-4">{position.name}</td>
                    <td className="py-3 px-4 text-right">{position.shares.toLocaleString('ru-RU')}</td>
                    <td className="py-3 px-4 text-right">{formatPrice(position.price)}</td>
                    <td className="py-3 px-4 text-right font-semibold">{formatCurrency(position.value)}</td>
                    <td className={`py-3 px-4 text-right font-medium ${position.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {position.changePercent >= 0 ? '+' : ''}{position.changePercent.toFixed(2)}%
                    </td>
                    <td className="py-3 px-4 text-right">{position.allocation.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights */}
        <div className="mb-8">
          <AIInsights positions={portfolioData.positions} />
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Настройки</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-2xl">
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">API Token (опционально)</label>
                  <input 
                    type="password" 
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Введите токен для реальных данных"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-1">Для получения реальных данных с биржи</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Интервал обновления</label>
                  <select 
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={updateInterval}
                    onChange={(e) => setUpdateInterval(e.target.value)}
                  >
                    <option value="10">10 секунд</option>
                    <option value="30">30 секунд</option>
                    <option value="60">1 минута</option>
                    <option value="300">5 минут</option>
                    <option value="600">10 минут</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Уведомления</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 rounded" 
                        checked={notifications.priceChanges}
                        onChange={(e) => setNotifications(prev => ({...prev, priceChanges: e.target.checked}))}
                      />
                      <span className="text-sm">Изменения цен {'>'} 5%</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        className="mr-2 rounded" 
                        checked={notifications.recommendations}
                        onChange={(e) => setNotifications(prev => ({...prev, recommendations: e.target.checked}))}
                      />
                      <span className="text-sm">AI рекомендации</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={handleSaveSettings}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors font-medium"
                  >
                    Сохранить
                  </button>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded-lg transition-colors font-medium"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestmentDashboard;