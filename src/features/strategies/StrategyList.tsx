// src/features/strategies/StrategyList.tsx

import React, { useState, useEffect } from "react";
import { SPXStrategy, formatStrategyToString } from "./strategyModel";
import { strategyService } from "../../services/strategyService";

const StrategyList: React.FC = () => {
  const [strategies, setStrategies] = useState<SPXStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Состояние для новой стратегии
  const [newStrategyName, setNewStrategyName] = useState<string>("");
  const [newStrategyString, setNewStrategyString] = useState<string>("");

  // Загрузка стратегий
  const loadStrategies = async () => {
    setLoading(true);
    try {
      const data = await strategyService.getAllStrategies();
      setStrategies(data);
      setError(null);
    } catch (err) {
      setError("Ошибка при загрузке стратегий");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Загрузка стратегий при монтировании компонента
  useEffect(() => {
    loadStrategies();
  }, []);

  // Обработчик переключения активности стратегии
  const handleToggleActive = async (strategyId: string, isActive: boolean) => {
    try {
      await strategyService.toggleStrategyActive(strategyId, isActive);

      // Обновляем локальное состояние
      setStrategies(
        strategies.map((s) => (s.id === strategyId ? { ...s, isActive } : s))
      );
    } catch (err) {
      setError("Ошибка при изменении статуса стратегии");
      console.error(err);
    }
  };

  // Обработчик удаления стратегии
  const handleDeleteStrategy = async (strategyId: string) => {
    if (!window.confirm("Действительно удалить стратегию?")) {
      return;
    }

    try {
      const success = await strategyService.deleteStrategy(strategyId);
      if (success) {
        setStrategies(strategies.filter((s) => s.id !== strategyId));
      } else {
        setError("Не удалось удалить стратегию");
      }
    } catch (err) {
      setError("Ошибка при удалении стратегии");
      console.error(err);
    }
  };

  // Обработчик добавления новой стратегии
  const handleAddStrategy = async () => {
    if (!newStrategyName.trim() || !newStrategyString.trim()) {
      setError("Заполните все поля для создания стратегии");
      return;
    }

    try {
      const strategy = await strategyService.createStrategyFromString(
        newStrategyString,
        newStrategyName
      );

      setStrategies([...strategies, strategy]);
      setNewStrategyName("");
      setNewStrategyString("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError("Ошибка при добавлении стратегии. Проверьте формат строки.");
      console.error(err);
    }
  };

  // Обработчик импорта стратегий
  const handleImportStrategies = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await strategyService.importStrategies(file);
      if (result.success) {
        await loadStrategies();
        alert(`Успешно импортировано ${result.count} стратегий`);
      }
    } catch (err) {
      setError("Ошибка при импорте стратегий");
      console.error(err);
    }

    // Сбрасываем значение input, чтобы можно было загрузить тот же файл повторно
    event.target.value = "";
  };

  // Обработчик экспорта стратегий
  const handleExportStrategies = async () => {
    try {
      const blob = await strategyService.exportStrategies();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `trading-strategies-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();

      // Освобождаем ресурсы
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      setError("Ошибка при экспорте стратегий");
      console.error(err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Стратегии торговли</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            {showAddForm ? "Отменить" : "Добавить стратегию"}
          </button>
          <label className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded cursor-pointer">
            Импорт
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportStrategies}
            />
          </label>
          <button
            onClick={handleExportStrategies}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded"
            disabled={strategies.length === 0}
          >
            Экспорт
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-4 border rounded shadow-sm">
          <h2 className="text-xl font-semibold mb-3">
            Добавление новой стратегии
          </h2>
          <div className="mb-3">
            <label className="block mb-1">Название стратегии:</label>
            <input
              type="text"
              value={newStrategyName}
              onChange={(e) => setNewStrategyName(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Например: SPX Понедельник"
            />
          </div>
          <div className="mb-3">
            <label className="block mb-1">Строка стратегии:</label>
            <input
              type="text"
              value={newStrategyString}
              onChange={(e) => setNewStrategyString(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Mon 70 3 4 09-32 15-30 20% 10000"
            />
            <p className="text-sm text-gray-500 mt-1">
              Формат: [День] [Дельта] [D1] [D2] [T1] [T2] [TP%] [MaxCost]
            </p>
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleAddStrategy}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="spinner-border h-8 w-8 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        </div>
      ) : strategies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Нет добавленных стратегий. Добавьте новую стратегию с помощью кнопки
          выше.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-md overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  День недели
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дельта
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Take Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Макс. стоимость
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {strategies.map((strategy) => {
                // Определяем день недели для отображения
                const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
                const dayOfWeek = dayNames[strategy.dayOfWeek];

                return (
                  <tr key={strategy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={strategy.isActive}
                          onChange={(e) =>
                            handleToggleActive(strategy.id, e.target.checked)
                          }
                          className="form-checkbox h-5 w-5 text-blue-600"
                        />
                      </label>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {strategy.name}
                    </td>
                    <td className="px-6 py-4">
                      {formatStrategyToString(strategy)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{dayOfWeek}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {strategy.delta}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {strategy.tp}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${strategy.maxCost.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteStrategy(strategy.id)}
                        className="text-red-600 hover:text-red-900 ml-2"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StrategyList;
