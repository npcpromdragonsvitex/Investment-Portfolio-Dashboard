// AI сервис для анализа портфеля и рекомендаций
export interface AIRecommendation {
  symbol: string;
  name: string;
  action: 'КУПИТЬ' | 'ПРОДАТЬ' | 'ДЕРЖАТЬ';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  risk: 'Низкий' | 'Средний' | 'Высокий';
  reasoning: string;
  timeHorizon: 'Краткосрочно' | 'Среднесрочно' | 'Долгосрочно';
}

export interface PortfolioAnalysis {
  overallRisk: 'Низкий' | 'Средний' | 'Высокий';
  diversificationScore: number;
  recommendations: AIRecommendation[];
  marketSentiment: 'Бычий' | 'Медвежий' | 'Нейтральный';
  suggestedActions: string[];
}

// Симуляция AI анализа (в реальном приложении здесь был бы запрос к OpenAI/Claude API)
export const analyzePortfolio = async (positions: any[]): Promise<PortfolioAnalysis> => {
  // Симулируем задержку AI обработки
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  
  // Анализ диверсификации
  const maxAllocation = Math.max(...positions.map(pos => pos.allocation));
  const diversificationScore = Math.max(0, 100 - (maxAllocation - 20) * 2);
  
  // Определение общего риска портфеля
  const avgVolatility = positions.reduce((sum, pos) => {
    const volatility = Math.abs(pos.changePercent) || 2;
    return sum + volatility * (pos.allocation / 100);
  }, 0);
  
  const overallRisk = avgVolatility > 5 ? 'Высокий' : avgVolatility > 2 ? 'Средний' : 'Низкий';
  
  // Генерация рекомендаций на основе анализа
  const recommendations: AIRecommendation[] = [
    {
      symbol: 'TCSG',
      name: 'TCS Group',
      action: 'КУПИТЬ',
      confidence: 85,
      targetPrice: 3500,
      currentPrice: 3200,
      risk: 'Средний',
      reasoning: 'Сильные финансовые показатели и рост цифрового банкинга. Компания показывает устойчивый рост выручки.',
      timeHorizon: 'Среднесрочно'
    },
    {
      symbol: 'AFLT',
      name: 'Аэрофлот',
      action: 'ДЕРЖАТЬ',
      confidence: 65,
      targetPrice: 85,
      currentPrice: 78,
      risk: 'Высокий',
      reasoning: 'Восстановление авиаперевозок продолжается, но геополитические риски остаются высокими.',
      timeHorizon: 'Долгосрочно'
    },
    {
      symbol: 'MAGN',
      name: 'ММК',
      action: 'ПРОДАТЬ',
      confidence: 75,
      targetPrice: 38,
      currentPrice: 42,
      risk: 'Высокий',
      reasoning: 'Снижение спроса на сталь и высокие производственные затраты негативно влияют на маржинальность.',
      timeHorizon: 'Краткосрочно'
    }
  ];
  
  // Определение настроения рынка
  const avgChange = positions.reduce((sum, pos) => sum + (pos.changePercent || 0), 0) / positions.length;
  const marketSentiment = avgChange > 1 ? 'Бычий' : avgChange < -1 ? 'Медвежий' : 'Нейтральный';
  
  // Предложения по улучшению портфеля
  const suggestedActions = [];
  
  if (diversificationScore < 70) {
    suggestedActions.push('Рассмотрите диверсификацию портфеля - добавьте акции из других секторов');
  }
  
  if (maxAllocation > 30) {
    suggestedActions.push('Снизьте концентрацию в отдельных позициях для уменьшения риска');
  }
  
  if (overallRisk === 'Высокий') {
    suggestedActions.push('Рассмотрите добавление менее волатильных активов для снижения общего риска');
  }
  
  if (totalValue > 1000000) {
    suggestedActions.push('При таком объеме капитала рекомендуется консультация с финансовым консультантом');
  }
  
  return {
    overallRisk,
    diversificationScore: Math.round(diversificationScore),
    recommendations,
    marketSentiment,
    suggestedActions
  };
};

// Функция для получения рыночных новостей и инсайтов
export const getMarketInsights = async (): Promise<string[]> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const insights = [
    'ЦБ РФ сохранил ключевую ставку на уровне 21%, что поддерживает банковский сектор',
    'Нефтяные компании показывают рост на фоне стабилизации цен на нефть',
    'Технологический сектор демонстрирует восстановление после коррекции',
    'Металлургические компании под давлением из-за снижения мирового спроса',
    'Потребительский сектор показывает устойчивость благодаря внутреннему спросу'
  ];
  
  // Возвращаем случайные 2-3 инсайта
  const shuffled = insights.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.floor(Math.random() * 2) + 2);
};