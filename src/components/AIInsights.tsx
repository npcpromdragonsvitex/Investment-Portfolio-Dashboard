import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Target, Clock, BarChart3 } from 'lucide-react';
import { analyzePortfolio, getMarketInsights, PortfolioAnalysis } from '../services/aiService';

interface AIInsightsProps {
  positions: any[];
  onAnalysisUpdate?: (analysis: PortfolioAnalysis) => void;
}

const AIInsights: React.FC<AIInsightsProps> = ({ positions, onAnalysisUpdate }) => {
  const [analysis, setAnalysis] = useState<PortfolioAnalysis | null>(null);
  const [marketInsights, setMarketInsights] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);

  const runAnalysis = async () => {
    if (positions.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const [portfolioAnalysis, insights] = await Promise.all([
        analyzePortfolio(positions),
        getMarketInsights()
      ]);
      
      setAnalysis(portfolioAnalysis);
      setMarketInsights(insights);
      setLastAnalysisTime(new Date());
      
      if (onAnalysisUpdate) {
        onAnalysisUpdate(portfolioAnalysis);
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (positions.length > 0) {
      runAnalysis();
    }
  }, [positions]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Низкий': return 'text-green-400';
      case 'Средний': return 'text-yellow-400';
      case 'Высокий': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'КУПИТЬ': return 'bg-green-600 text-green-100';
      case 'ДЕРЖАТЬ': return 'bg-yellow-600 text-yellow-100';
      case 'ПРОДАТЬ': return 'bg-red-600 text-red-100';
      default: return 'bg-slate-600 text-slate-100';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'Бычий': return 'text-green-400';
      case 'Медвежий': return 'text-red-400';
      case 'Нейтральный': return 'text-slate-400';
      default: return 'text-slate-400';
    }
  };

  if (positions.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">AI Анализ недоступен</h3>
          <p className="text-slate-400">Добавьте позиции в портфель для получения AI рекомендаций</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Analysis Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold">AI Анализ Портфеля</h3>
          </div>
          <div className="flex items-center gap-4">
            {lastAnalysisTime && (
              <span className="text-sm text-slate-400">
                Обновлено: {lastAnalysisTime.toLocaleTimeString('ru-RU')}
              </span>
            )}
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
            >
              {isAnalyzing ? 'Анализируем...' : 'Обновить анализ'}
            </button>
          </div>
        </div>

        {isAnalyzing ? (
          <div className="text-center py-8">
            <Brain className="w-8 h-8 animate-pulse text-purple-400 mx-auto mb-4" />
            <p className="text-slate-300">AI анализирует ваш портфель...</p>
            <p className="text-sm text-slate-400 mt-2">Это может занять несколько секунд</p>
          </div>
        ) : analysis ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-slate-400">Общий риск</span>
              </div>
              <p className={`text-xl font-bold ${getRiskColor(analysis.overallRisk)}`}>
                {analysis.overallRisk}
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-slate-400">Диверсификация</span>
              </div>
              <p className="text-xl font-bold text-white">{analysis.diversificationScore}/100</p>
              <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysis.diversificationScore}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm text-slate-400">Настроение рынка</span>
              </div>
              <p className={`text-xl font-bold ${getSentimentColor(analysis.marketSentiment)}`}>
                {analysis.marketSentiment}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* AI Recommendations */}
      {analysis && analysis.recommendations.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-green-400" />
            AI Рекомендации
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {analysis.recommendations.map((rec) => (
              <div key={rec.symbol} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-mono text-blue-400 font-semibold">{rec.symbol}</p>
                    <p className="text-sm text-slate-300">{rec.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(rec.action)}`}>
                    {rec.action}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Уверенность:</span>
                    <span className="text-white">{rec.confidence}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Целевая цена:</span>
                    <span className="text-white">{rec.targetPrice.toLocaleString('ru-RU')} ₽</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Риск:</span>
                    <span className={getRiskColor(rec.risk)}>{rec.risk}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Горизонт:</span>
                    <span className="text-white">{rec.timeHorizon}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-600">
                  <p className="text-xs text-slate-400">{rec.reasoning}</p>
                </div>
                
                {/* Confidence bar */}
                <div className="mt-3">
                  <div className="w-full bg-slate-600 rounded-full h-1">
                    <div
                      className={`h-1 rounded-full transition-all duration-300 ${
                        rec.confidence > 80 ? 'bg-green-500' :
                        rec.confidence > 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${rec.confidence}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Actions */}
      {analysis && analysis.suggestedActions.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Рекомендуемые действия
          </h3>
          <div className="space-y-3">
            {analysis.suggestedActions.map((action, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5">
                  {index + 1}
                </div>
                <p className="text-slate-200 flex-1">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Insights */}
      {marketInsights.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-400" />
            Рыночные инсайты
          </h3>
          <div className="space-y-3">
            {marketInsights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                <p className="text-slate-200 flex-1">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;