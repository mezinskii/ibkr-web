// src/features/strategies/strategyModel.ts

/**
 * Структура для диапазона значений
 */
export interface ValueRange {
  min: number;
  max: number;
}

/**
 * Структура для стратегии торговли опционами SPX
 */
export interface SPXStrategy {
  // Уникальный идентификатор стратегии
  id: string;

  // Название стратегии
  name: string;

  // Активна ли стратегия
  isActive: boolean;

  // День недели для входа в позицию (0-6, где 0 - воскресенье, 1 - понедельник, и т.д.)
  dayOfWeek: number;

  // Целевая дельта ближнего опциона (отрицательное для путов)
  delta: number;

  // Смещение ближней экспирации от текущей даты (в днях)
  d1: number;

  // Смещение дальней экспирации от текущей даты (в днях)
  d2: number;

  // Время входа в позицию (формат "HH-MM")
  t1: string;

  // Время выхода из позиции (формат "HH-MM") в день экспирации ближнего опциона
  t2: string;

  // Take profit в процентах от средней цены входа
  tp: number;

  // Максимальная сумма на открытие позиции в USD
  maxCost: number;

  // Диапазон значения VIX на момент входа (необязательно)
  vix?: ValueRange;

  // Диапазон % изменения VIX с 16:15 прошлого торгового дня до 9:32 текущего дня (необязательно)
  vixOvernightRange?: ValueRange;

  // Диапазон % изменения VIX с 9:32 текущего дня до момента входа (необязательно)
  vixIntradayRange?: ValueRange;

  // Минимальное падение цены (%) для усреднения (необязательно)
  averagingDropPct?: number;

  // Список времени усреднения (необязательно)
  averagingTimes?: string[];

  // Сумма ($) на одно усреднение (необязательно)
  averagingAmount?: number;

  // Краткое описание стратегии
  description?: string;

  // Дата последнего выполнения стратегии
  lastExecuted?: string;

  // Результаты выполнения стратегии (P&L)
  results?: {
    totalPnL: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
  };
}

/**
 * Тип для статуса выполнения стратегии
 */
export enum StrategyExecutionStatus {
  WAITING = "waiting",
  ENTERED = "entered",
  TAKE_PROFIT_ORDER_PLACED = "takeProfitOrderPlaced",
  TAKE_PROFIT_EXECUTED = "takeProfitExecuted",
  EXITED_BY_TIME = "exitedByTime",
  AVERAGING = "averaging",
  COMPLETED = "completed",
  ERROR = "error",
}

/**
 * Структура для сделки по стратегии
 */
export interface StrategyTrade {
  id: string;
  strategyId: string;
  entryTime?: string;
  exitTime?: string;
  entryPrice?: number;
  exitPrice?: number;
  contracts: number;
  status: StrategyExecutionStatus;
  pnl?: number;
  entryOrderId?: string;
  exitOrderId?: string;
  takeProfitOrderId?: string;
  position?: {
    putNearOption: string; // Тикер ближнего пут-опциона
    putFarOption: string; // Тикер дальнего пут-опциона
    nearExpiration: string; // Дата экспирации ближнего опциона
    farExpiration: string; // Дата экспирации дальнего опциона
    strike: number; // Страйк обоих опционов
  };
  errors?: string[];
  // Другие поля для отслеживания торговли
}

/**
 * Функция для парсинга строки стратегии из формата заказчика
 * Пример: "Mon 70 3 4 09-32 15-30 20% 10000"
 */
export function parseStrategyString(
  strategyString: string,
  id: string = crypto.randomUUID(),
  name: string = "Стратегия SPX"
): SPXStrategy {
  const parts = strategyString.trim().split(/\s+/);

  // Определение дня недели
  const dayMap: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
    вс: 0,
    пн: 1,
    вт: 2,
    ср: 3,
    чт: 4,
    пт: 5,
    сб: 6,
  };

  const dayOfWeek = dayMap[parts[0].toLowerCase()] || 1; // По умолчанию понедельник
  const delta = parseFloat(parts[1]);
  const d1 = parseInt(parts[2]);
  const d2 = parseInt(parts[3]);
  const t1 = parts[4];
  const t2 = parts[5];
  const tp = parseFloat(parts[6].replace("%", ""));
  const maxCost = parseInt(parts[7]);

  return {
    id,
    name,
    isActive: true,
    dayOfWeek,
    delta,
    d1,
    d2,
    t1,
    t2,
    tp,
    maxCost,
    description: `Стратегия SPX: ${strategyString}`,
  };
}

/**
 * Функция для форматирования стратегии в строку для отображения
 */
export function formatStrategyToString(strategy: SPXStrategy): string {
  const dayMap = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  return `${dayMap[strategy.dayOfWeek]} ${strategy.delta} ${strategy.d1} ${
    strategy.d2
  } ${strategy.t1} ${strategy.t2} ${strategy.tp}% ${strategy.maxCost}`;
}
