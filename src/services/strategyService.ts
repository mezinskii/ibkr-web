// src/services/strategyService.ts

import {
  SPXStrategy,
  StrategyTrade,
  parseStrategyString,
} from "../features/strategies/strategyModel";
import { API_BASE_URL } from "../config";

// Константа для локального хранения стратегий
const STRATEGIES_STORAGE_KEY = "trading_strategies";
const TRADES_STORAGE_KEY = "strategy_trades";

/**
 * Сервис для работы с торговыми стратегиями
 */
export const strategyService = {
  /**
   * Получение всех стратегий
   */
  getAllStrategies: async (): Promise<SPXStrategy[]> => {
    try {
      // Сначала пробуем загрузить с сервера, если не получается - из localStorage
      try {
        const response = await fetch(`${API_BASE_URL}/strategies`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.strategies || [];
        }
      } catch (error) {
        console.warn(
          "Failed to fetch strategies from server, falling back to local storage:",
          error
        );
      }

      // Загрузка из localStorage, если API не доступен
      const storedStrategies = localStorage.getItem(STRATEGIES_STORAGE_KEY);
      return storedStrategies ? JSON.parse(storedStrategies) : [];
    } catch (error) {
      console.error("Error loading strategies:", error);
      return [];
    }
  },

  /**
   * Сохранение стратегии
   */
  saveStrategy: async (strategy: SPXStrategy): Promise<SPXStrategy> => {
    try {
      // Сначала пробуем сохранить на сервер
      try {
        const response = await fetch(`${API_BASE_URL}/strategies`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(strategy),
        });

        if (response.ok) {
          const data = await response.json();
          return data.strategy;
        }
      } catch (error) {
        console.warn(
          "Failed to save strategy to server, falling back to local storage:",
          error
        );
      }

      // Если сервер недоступен, сохраняем локально
      const strategies = await strategyService.getAllStrategies();

      // Найти и обновить существующую стратегию или добавить новую
      const existingIndex = strategies.findIndex((s) => s.id === strategy.id);
      if (existingIndex >= 0) {
        strategies[existingIndex] = strategy;
      } else {
        // Если это новая стратегия, генерируем ID если его нет
        if (!strategy.id) {
          strategy.id = crypto.randomUUID();
        }
        strategies.push(strategy);
      }

      localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
      return strategy;
    } catch (error) {
      console.error("Error saving strategy:", error);
      throw new Error("Failed to save strategy");
    }
  },

  /**
   * Удаление стратегии
   */
  deleteStrategy: async (strategyId: string): Promise<boolean> => {
    try {
      // Сначала пробуем удалить на сервере
      try {
        const response = await fetch(
          `${API_BASE_URL}/strategies/${strategyId}`,
          {
            method: "DELETE",
            credentials: "include",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.warn(
          "Failed to delete strategy from server, falling back to local storage:",
          error
        );
      }

      // Если сервер недоступен, удаляем локально
      const strategies = await strategyService.getAllStrategies();
      const filteredStrategies = strategies.filter((s) => s.id !== strategyId);

      if (filteredStrategies.length < strategies.length) {
        localStorage.setItem(
          STRATEGIES_STORAGE_KEY,
          JSON.stringify(filteredStrategies)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error deleting strategy:", error);
      return false;
    }
  },

  /**
   * Обновление статуса активности стратегии
   */
  toggleStrategyActive: async (
    strategyId: string,
    isActive: boolean
  ): Promise<boolean> => {
    try {
      const strategies = await strategyService.getAllStrategies();
      const strategy = strategies.find((s) => s.id === strategyId);

      if (!strategy) {
        return false;
      }

      strategy.isActive = isActive;
      await strategyService.saveStrategy(strategy);
      return true;
    } catch (error) {
      console.error("Error toggling strategy active state:", error);
      return false;
    }
  },

  /**
   * Получение всех сделок по стратегиям
   */
  getStrategyTrades: async (strategyId?: string): Promise<StrategyTrade[]> => {
    try {
      // Сначала пробуем загрузить с сервера
      try {
        const url = strategyId
          ? `${API_BASE_URL}/strategy-trades?strategyId=${strategyId}`
          : `${API_BASE_URL}/strategy-trades`;

        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          return data.trades || [];
        }
      } catch (error) {
        console.warn(
          "Failed to fetch trades from server, falling back to local storage:",
          error
        );
      }

      // Загрузка из localStorage
      const storedTrades = localStorage.getItem(TRADES_STORAGE_KEY);
      const trades = storedTrades ? JSON.parse(storedTrades) : [];

      if (strategyId) {
        return trades.filter(
          (trade: StrategyTrade) => trade.strategyId === strategyId
        );
      }

      return trades;
    } catch (error) {
      console.error("Error loading strategy trades:", error);
      return [];
    }
  },

  /**
   * Создание новой стратегии из строки
   */
  createStrategyFromString: async (
    strategyString: string,
    name: string
  ): Promise<SPXStrategy> => {
    const strategy = parseStrategyString(
      strategyString,
      crypto.randomUUID(),
      name
    );
    return await strategyService.saveStrategy(strategy);
  },

  /**
   * Импорт стратегий из JSON файла
   */
  importStrategies: async (
    file: File
  ): Promise<{ success: boolean; count: number }> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error("Imported data is not an array");
      }

      // Валидация и импорт каждой стратегии
      let importedCount = 0;
      for (const item of data) {
        // Проверка на наличие обязательных полей
        if (!item.dayOfWeek && item.delta === undefined && !item.t1) {
          continue;
        }

        // Генерируем новый ID для импортированной стратегии
        item.id = crypto.randomUUID();
        await strategyService.saveStrategy(item);
        importedCount++;
      }

      return { success: true, count: importedCount };
    } catch (error) {
      console.error("Error importing strategies:", error);
      throw new Error(
        "Failed to import strategies: " + (error as Error).message
      );
    }
  },

  /**
   * Экспорт стратегий в JSON файл
   */
  exportStrategies: async (): Promise<Blob> => {
    const strategies = await strategyService.getAllStrategies();
    const jsonString = JSON.stringify(strategies, null, 2);
    return new Blob([jsonString], { type: "application/json" });
  },
};
