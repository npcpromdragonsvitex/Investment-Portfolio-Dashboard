import React, { useState } from 'react';
import { DollarSign, Plus, Minus, TrendingUp, Calculator } from 'lucide-react';

interface CapitalManagerProps {
  totalCapital: number;
  availableCash: number;
  onCapitalChange: (newCapital: number) => void;
  onCashChange: (newCash: number) => void;
}

const CapitalManager: React.FC<CapitalManagerProps> = ({
  totalCapital,
  availableCash,
  onCapitalChange,
  onCashChange
}) => {
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [newCapitalAmount, setNewCapitalAmount] = useState('');
  const [operationType, setOperationType] = useState<'add' | 'withdraw'>('add');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleCapitalOperation = () => {
    const amount = parseFloat(newCapitalAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Введите корректную сумму');
      return;
    }

    if (operationType === 'add') {
      onCapitalChange(totalCapital + amount);
      onCashChange(availableCash + amount);
    } else {
      if (amount > availableCash) {
        alert('Недостаточно свободных средств для вывода');
        return;
      }
      onCapitalChange(totalCapital - amount);
      onCashChange(availableCash - amount);
    }

    setNewCapitalAmount('');
    setShowCapitalModal(false);
  };

  const investedAmount = totalCapital - availableCash;
  const investedPercentage = totalCapital > 0 ? (investedAmount / totalCapital) * 100 : 0;

  return (
    <>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            Управление капиталом
          </h3>
          <button
            onClick={() => setShowCapitalModal(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            Изменить капитал
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-slate-400">Общий капитал</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalCapital)}</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-400">Инвестировано</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(investedAmount)}</p>
            <p className="text-xs text-slate-400 mt-1">{investedPercentage.toFixed(1)}% от капитала</p>
          </div>

          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-slate-400">Свободные средства</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(availableCash)}</p>
            <p className="text-xs text-slate-400 mt-1">Доступно для инвестиций</p>
          </div>
        </div>

        {/* Прогресс-бар инвестиций */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Распределение капитала</span>
            <span>{investedPercentage.toFixed(1)}% инвестировано</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(investedPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Модальное окно управления капиталом */}
      {showCapitalModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Управление капиталом</h3>
              <button
                onClick={() => setShowCapitalModal(false)}
                className="text-slate-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Тип операции</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOperationType('add')}
                    className={`p-3 rounded-lg border transition-colors ${
                      operationType === 'add'
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Plus className="w-4 h-4 mx-auto mb-1" />
                    Пополнить
                  </button>
                  <button
                    onClick={() => setOperationType('withdraw')}
                    className={`p-3 rounded-lg border transition-colors ${
                      operationType === 'withdraw'
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    <Minus className="w-4 h-4 mx-auto mb-1" />
                    Вывести
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Сумма ({operationType === 'add' ? 'пополнение' : 'вывод'})
                </label>
                <input
                  type="number"
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите сумму в рублях"
                  value={newCapitalAmount}
                  onChange={(e) => setNewCapitalAmount(e.target.value)}
                />
                {operationType === 'withdraw' && (
                  <p className="text-xs text-slate-400 mt-1">
                    Доступно для вывода: {formatCurrency(availableCash)}
                  </p>
                )}
              </div>

              <div className="bg-slate-700/50 rounded-lg p-3">
                <p className="text-sm text-slate-400 mb-1">Текущий капитал:</p>
                <p className="text-lg font-semibold">{formatCurrency(totalCapital)}</p>
                {newCapitalAmount && !isNaN(parseFloat(newCapitalAmount)) && (
                  <>
                    <p className="text-sm text-slate-400 mt-2 mb-1">После операции:</p>
                    <p className={`text-lg font-semibold ${
                      operationType === 'add' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(
                        operationType === 'add'
                          ? totalCapital + parseFloat(newCapitalAmount)
                          : totalCapital - parseFloat(newCapitalAmount)
                      )}
                    </p>
                  </>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCapitalOperation}
                  className={`flex-1 py-2 rounded-lg transition-colors font-medium ${
                    operationType === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {operationType === 'add' ? 'Пополнить' : 'Вывести'}
                </button>
                <button
                  onClick={() => setShowCapitalModal(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 py-2 rounded-lg transition-colors font-medium"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CapitalManager;