// src/features/strategies/StrategyDashboard.tsx

import React, { useState, useEffect } from "react";
import { strategyExecutor } from "../../services/strategyExecutorService";
import { tradingService } from "../../services/tradingService";
import { StrategyTrade, StrategyExecutionStatus } from "./strategyModel";
import StrategyList from "./StrategyList";

const StrategyDashboard: React.FC = () => {
  const [isExecutorRunning, setIsExecutorRunning] = useState<boolean>(false);
  const [accounts, setAccounts] = useState<
    { id: string; accountId: string; accountTitle: string }[]
  >([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [activeTrades, setActiveTrades] = useState<StrategyTrade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка аккаунтов при монтировании компонента
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const accountsData = await tradingService.getAccounts();
        setAccounts(accountsData);

        // Если есть аккаунты и нет выбранного, выбираем первый
        if (accountsData.length > 0 && !selectedAccount) {
          setSelectedAccount(accountsData[0].id);
        }

        setError(null);
      } catch (err) {
        setError("Ошибка при загрузке аккаунтов");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();

    // Проверяем, запущен ли уже исполнитель стратегий
    const executorRunning = strategyExecutor.isActive();
    setIsExecutorRunning(executorRunning);

    if (executorRunning) {
      setSelectedAccount(strategyExecutor.getAccountId());
      updateActiveTrades();
    }

    // Устанавливаем интервал для обновления активных трейдов
    const intervalId = setInterval(updateActiveTrades, 10000); // Каждые 10 секунд

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // Обновление списка активных трейдов
  const updateActiveTrades = () => {
    if (strategyExecutor.isActive()) {
      const trades = strategyExecutor.getActiveTrades();
      setActiveTrades(trades);
    } else {
      setActiveTrades([]);
    }
  };

  // Старт исполнителя стратегий
  const handleStartExecutor = async () => {
    if (!selectedAccount) {
      setError("Выберите аккаунт перед запуском");
      return;
    }

    try {
      setLoading(true);
      const started = await strategyExecutor.start(selectedAccount);

      if (started) {
        setIsExecutorRunning(true);
        updateActiveTrades();
        setError(null);
      } else {
        setError("Не удалось запустить исполнитель стратегий");
      }
    } catch (err) {
      setError("Ошибка при запуске исполнителя стратегий");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Остановка исполнителя стратегий
  const handleStopExecutor = () => {
    try {
      strategyExecutor.stop();
      setIsExecutorRunning(false);
      setActiveTrades([]);
      setError(null);
    } catch (err) {
      setError("Ошибка при остановке исполнителя стратегий");
      console.error(err);
    }
  };

  // Получение текста статуса для трейда
  const getStatusText = (status: StrategyExecutionStatus): string => {
    const statusMap: Record<StrategyExecutionStatus, string> = {
      [StrategyExecutionStatus.WAITING]: "Ожидание",
      [StrategyExecutionStatus.ENTERED]: "Вход в позицию",
      [StrategyExecutionStatus.TAKE_PROFIT_ORDER_PLACED]:
        "Ордер Take Profit размещен",
      [StrategyExecutionStatus.TAKE_PROFIT_EXECUTED]: "Take Profit исполнен",
      [StrategyExecutionStatus.EXITED_BY_TIME]: "Выход по времени",
      [StrategyExecutionStatus.AVERAGING]: "Усреднение позиции",
      [StrategyExecutionStatus.COMPLETED]: "Завершено",
      [StrategyExecutionStatus.ERROR]: "Ошибка",
    };

    return statusMap[status] || status;
  };

  // Получение CSS класса для статуса
  const getStatusClass = (status: StrategyExecutionStatus): string => {
    switch (status) {
      case StrategyExecutionStatus.WAITING:
        return "bg-gray-200 text-gray-800";
      case StrategyExecutionStatus.ENTERED:
        return "bg-blue-200 text-blue-800";
      case StrategyExecutionStatus.TAKE_PROFIT_ORDER_PLACED:
        return "bg-indigo-200 text-indigo-800";
      case StrategyExecutionStatus.TAKE_PROFIT_EXECUTED:
        return "bg-green-200 text-green-800";
      case StrategyExecutionStatus.EXITED_BY_TIME:
        return "bg-yellow-200 text-yellow-800";
      case StrategyExecutionStatus.AVERAGING:
        return "bg-purple-200 text-purple-800";
      case StrategyExecutionStatus.COMPLETED:
        return "bg-green-200 text-green-800";
      case StrategyExecutionStatus.ERROR:
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">
        Управление стратегиями торговли
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white shadow-md rounded-md p-4 mb-6">
        <h2 className="text-xl font-semibold mb-4">Исполнитель стратегий</h2>

        <div className="flex items-center mb-4">
          <div className="mr-4 flex-grow">
            <label className="block mb-1">Торговый аккаунт:</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="border p-2 w-full rounded"
              disabled={isExecutorRunning || loading}
            >
              <option value="">Выберите аккаунт</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.accountId} - {account.accountTitle}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6">
            {!isExecutorRunning ? (
              <button
                onClick={handleStartExecutor}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={!selectedAccount || loading}
              >
                {loading ? "Загрузка..." : "Запустить исполнитель"}
              </button>
            ) : (
              <button
                onClick={handleStopExecutor}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
              >
                Остановить исполнитель
              </button>
            )}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center">
            <div
              className={`w-3 h-3 rounded-full mr-2 ${
                isExecutorRunning ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>
              {isExecutorRunning
                ? "Исполнитель стратегий запущен"
                : "Исполнитель стратегий остановлен"}
            </span>
          </div>
        </div>
      </div>

      {activeTrades.length > 0 && (
        <div className="bg-white shadow-md rounded-md p-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Активные торговые операции
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Стратегия
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Контракты
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время входа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Цена входа
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Статус
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTrades.map((trade) => (
                  <tr key={trade.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.id.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.strategyId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.contracts}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.entryTime
                        ? new Date(trade.entryTime).toLocaleString()
                        : "Н/Д"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {trade.entryPrice
                        ? `$${trade.entryPrice.toFixed(2)}`
                        : "Н/Д"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusClass(
                          trade.status
                        )}`}
                      >
                        {getStatusText(trade.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Компонент для управления стратегиями */}
      <StrategyList />
    </div>
  );
};

export default StrategyDashboard;
