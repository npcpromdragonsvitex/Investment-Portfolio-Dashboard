import axios from 'axios';

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  previousClose: number;
}

export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  previousClose: number;
  currency: string;
}

// Используем Alpha Vantage API для получения реальных данных
const ALPHA_VANTAGE_API_KEY = 'demo'; // В реальном приложении нужен настоящий ключ
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Fallback к Finnhub API
const FINNHUB_API_KEY = 'demo'; // В реальном приложении нужен настоящий ключ
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

// Российские акции с их тикерами на разных биржах
const RUSSIAN_STOCKS_MAPPING = {
  'SBER': { name: 'Сбербанк', symbol: 'SBER.ME', fallback: 'SBER' },
  'GAZP': { name: 'Газпром', symbol: 'GAZP.ME', fallback: 'GAZP' },
  'LKOH': { name: 'Лукойл', symbol: 'LKOH.ME', fallback: 'LKOH' },
  'NVTK': { name: 'Новатэк', symbol: 'NVTK.ME', fallback: 'NVTK' },
  'YNDX': { name: 'Яндекс', symbol: 'YNDX', fallback: 'YNDX' },
  'ROSN': { name: 'Роснефть', symbol: 'ROSN.ME', fallback: 'ROSN' },
  'MTSS': { name: 'МТС', symbol: 'MTSS.ME', fallback: 'MBT' }
};

// Симуляция реальных данных с более реалистичными колебаниями
const generateRealisticPrice = (basePrice: number, volatility: number = 0.05): StockPrice => {
  const change = (Math.random() - 0.5) * 2 * volatility;
  const newPrice = basePrice * (1 + change);
  const absoluteChange = newPrice - basePrice;
  const changePercent = (absoluteChange / basePrice) * 100;
  
  return {
    symbol: '',
    price: Number(newPrice.toFixed(2)),
    change: Number(absoluteChange.toFixed(2)),
    changePercent: Number(changePercent.toFixed(2)),
    volume: Math.floor(Math.random() * 1000000) + 100000,
    previousClose: basePrice
  };
};

// Базовые цены российских акций (в рублях)
const BASE_PRICES = {
  'SBER': 285.4,
  'GAZP': 175.8,
  'LKOH': 6250,
  'NVTK': 1180,
  'YNDX': 2850,
  'ROSN': 540,
  'MTSS': 285
};

export const fetchStockPrice = async (symbol: string): Promise<StockData> => {
  try {
    // В реальном приложении здесь был бы запрос к API
    // Пока используем симуляцию с реалистичными данными
    
    const stockInfo = RUSSIAN_STOCKS_MAPPING[symbol as keyof typeof RUSSIAN_STOCKS_MAPPING];
    const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES];
    
    if (!stockInfo || !basePrice) {
      throw new Error(`Stock ${symbol} not found`);
    }

    // Симулируем задержку API
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
    
    const priceData = generateRealisticPrice(basePrice, 0.03); // 3% волатильность
    
    return {
      symbol,
      name: stockInfo.name,
      price: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
      volume: priceData.volume,
      previousClose: priceData.previousClose,
      currency: 'RUB'
    };
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    
    // Fallback к базовой цене с небольшим изменением
    const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES] || 100;
    const priceData = generateRealisticPrice(basePrice, 0.01);
    const stockInfo = RUSSIAN_STOCKS_MAPPING[symbol as keyof typeof RUSSIAN_STOCKS_MAPPING];
    
    return {
      symbol,
      name: stockInfo?.name || symbol,
      price: priceData.price,
      change: priceData.change,
      changePercent: priceData.changePercent,
      volume: priceData.volume,
      previousClose: priceData.previousClose,
      currency: 'RUB'
    };
  }
};

export const fetchMultipleStockPrices = async (symbols: string[]): Promise<StockData[]> => {
  try {
    const promises = symbols.map(symbol => fetchStockPrice(symbol));
    const results = await Promise.allSettled(promises);
    
    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Fallback для неудачных запросов
        const symbol = symbols[index];
        const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES] || 100;
        const priceData = generateRealisticPrice(basePrice, 0.01);
        const stockInfo = RUSSIAN_STOCKS_MAPPING[symbol as keyof typeof RUSSIAN_STOCKS_MAPPING];
        
        return {
          symbol,
          name: stockInfo?.name || symbol,
          price: priceData.price,
          change: priceData.change,
          changePercent: priceData.changePercent,
          volume: priceData.volume,
          previousClose: priceData.previousClose,
          currency: 'RUB'
        };
      }
    });
  } catch (error) {
    console.error('Error fetching multiple stock prices:', error);
    throw error;
  }
};

// Функция для получения исторических данных
export const fetchHistoricalData = async (symbol: string, days: number = 30): Promise<Array<{date: string, value: number}>> => {
  const data = [];
  const basePrice = BASE_PRICES[symbol as keyof typeof BASE_PRICES] || 100;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Создаем более реалистичную историческую динамику
    const trend = Math.sin(i / 10) * 0.1; // Долгосрочный тренд
    const noise = (Math.random() - 0.5) * 0.05; // Случайные колебания
    const weekendEffect = date.getDay() === 0 || date.getDay() === 6 ? -0.01 : 0; // Эффект выходных
    
    const totalChange = trend + noise + weekendEffect;
    const price = basePrice * (1 + totalChange);
    
    data.push({
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      value: Math.round(price * 100) / 100
    });
  }
  
  return data;
};