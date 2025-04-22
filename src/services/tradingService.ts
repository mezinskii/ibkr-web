// src/services/tradingService.ts

import { API_BASE_URL } from "../config";

/**
 * Интерфейс для информации о контракте опциона
 */
interface OptionContract {
  conid: string; // Contract ID
  symbol: string; // Тикер
  right: string; // PUT/CALL
  strike: number; // Страйк
  expiry: string; // Дата экспирации
  delta: number; // Дельта
  bid: number; // Бид
  ask: number; // Аск
  last: number; // Последняя цена
}

/**
 * Интерфейс для структуры ордера
 */
interface OrderRequest {
  acctId: string; // ID счета
  conid: string; // ID контракта
  orderType: string; // LMT, MKT и т.д.
  side: string; // BUY, SELL
  quantity: number; // Количество контрактов
  price?: number; // Цена (для лимитных ордеров)
  tif?: string; // Время действия ордера (DAY, GTC и т.д.)
  outsideRth?: boolean; // Разрешить исполнение вне рабочих часов
}

/**
 * Интерфейс для структуры ответа при размещении ордера
 */
interface OrderResponse {
  id: string; // ID ордера
  message?: string; // Сообщение от сервера
  status: string; // Статус ордера
  warning?: string; // Предупреждение, если есть
  error?: string; // Ошибка, если есть
}

/**
 * Сервис для работы с торговлей через IBKR API
 */
export const tradingService = {
  /**
   * Получение списка доступных аккаунтов
   */
  getAccounts: async (): Promise<
    { id: string; accountId: string; accountTitle: string }[]
  > => {
    try {
      const response = await fetch(`${API_BASE_URL}/portfolio/accounts`, {
        method: "GET",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      console.error("Error fetching accounts:", error);
      return [];
    }
  },

  /**
   * Поиск опционов на SPX с указанной дельтой и экспирацией
   */
  findSPXOptions: async (
    targetDelta: number,
    expirationDays: number[],
    right: string = "P" // 'P' для PUT, 'C' для CALL
  ): Promise<OptionContract[]> => {
    try {
      // Получаем текущую дату
      const today = new Date();

      // Формируем даты экспирации
      const expirationDates = expirationDays.map((days) => {
        const date = new Date(today);
        date.setDate(date.getDate() + days);
        return date.toISOString().split("T")[0];
      });

      // Построим параметры запроса
      const queryParams = new URLSearchParams({
        symbol: "SPX",
        right,
        delta: targetDelta.toString(),
        expirations: expirationDates.join(","),
      });

      const response = await fetch(
        `${API_BASE_URL}/iserver/secdef/search?${queryParams}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.contracts || [];
    } catch (error) {
      console.error("Error finding SPX options:", error);
      return [];
    }
  },

  /**
   * Получение текущего значения VIX
   */
  getVIXValue: async (): Promise<number> => {
    try {
      // Запрос котировок для VIX
      const response = await fetch(
        `${API_BASE_URL}/iserver/marketdata/snapshot?conids=1369`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      // Возвращаем последнюю цену VIX или -1, если не удалось получить
      return data[0]?.lastPrice || -1;
    } catch (error) {
      console.error("Error getting VIX value:", error);
      return -1;
    }
  },

  /**
   * Размещение ордера
   */
  placeOrder: async (order: OrderRequest): Promise<OrderResponse> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/iserver/account/${order.acctId}/orders`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(order),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error placing order:", error);
      return {
        id: "",
        status: "error",
        error: (error as Error).message,
      };
    }
  },

  /**
   * Создание ордера для календарного спреда (продажа ближнего и покупка дальнего опционов)
   */
  placeCalendarSpread: async (
    accountId: string,
    nearOptionConid: string,
    farOptionConid: string,
    quantity: number,
    maxCost: number
  ): Promise<OrderResponse> => {
    try {
      // Формирование запроса на создание спреда
      const spreadOrder = {
        acctId: accountId,
        strategy: "Calendar",
        orders: [
          {
            conid: nearOptionConid,
            side: "SELL",
            quantity,
          },
          {
            conid: farOptionConid,
            side: "BUY",
            quantity,
          },
        ],
        orderType: "LMT",
        price: maxCost / quantity, // Максимальная цена на один спред
        tif: "DAY",
        outsideRth: false,
      };

      const response = await fetch(
        `${API_BASE_URL}/iserver/account/${accountId}/orders/combinations`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(spreadOrder),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error placing calendar spread order:", error);
      return {
        id: "",
        status: "error",
        error: (error as Error).message,
      };
    }
  },

  /**
   * Размещение ордера на взятие прибыли (take profit)
   */
  placeTakeProfitOrder: async (
    accountId: string,
    orderId: string,
    profitPercent: number
  ): Promise<OrderResponse> => {
    try {
      // Сначала получаем информацию о текущем ордере, чтобы знать цену входа
      const orderInfoResponse = await fetch(
        `${API_BASE_URL}/iserver/account/${accountId}/order/${orderId}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!orderInfoResponse.ok) {
        throw new Error(`HTTP error! Status: ${orderInfoResponse.status}`);
      }

      const orderInfo = await orderInfoResponse.json();

      // Рассчитываем целевую цену для take profit
      const entryPrice = orderInfo.price || 0;
      const targetPrice = entryPrice * (1 + profitPercent / 100);

      // Создаем ордер take profit
      const takeProfitOrder = {
        acctId: accountId,
        parentId: orderId,
        orderType: "LMT",
        price: targetPrice,
        tif: "GTC", // Good Till Cancelled
        outsideRth: true, // Разрешаем исполнение вне рабочих часов
      };

      const response = await fetch(
        `${API_BASE_URL}/iserver/account/${accountId}/orders`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(takeProfitOrder),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error placing take profit order:", error);
      return {
        id: "",
        status: "error",
        error: (error as Error).message,
      };
    }
  },

  /**
   * Отмена ордера
   */
  cancelOrder: async (accountId: string, orderId: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/iserver/account/${accountId}/order/${orderId}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error("Error canceling order:", error);
      return false;
    }
  },

  /**
   * Закрытие позиции по рыночной цене
   */
  closePositionAtMarket: async (
    accountId: string,
    conid: string,
    positionQuantity: number
  ): Promise<OrderResponse> => {
    try {
      // Определяем сторону для закрытия позиции (если у нас positive quantity - нужно SELL, иначе - BUY)
      const side = positionQuantity > 0 ? "SELL" : "BUY";
      const quantity = Math.abs(positionQuantity);

      const order = {
        acctId: accountId,
        conid,
        orderType: "MKT", // Рыночный ордер
        side,
        quantity,
        tif: "DAY",
      };

      const response = await fetch(
        `${API_BASE_URL}/iserver/account/${accountId}/orders`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(order),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! Status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error closing position at market:", error);
      return {
        id: "",
        status: "error",
        error: (error as Error).message,
      };
    }
  },
};
