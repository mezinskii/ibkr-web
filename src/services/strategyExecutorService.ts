// src/services/strategyExecutorService.ts

import { SPXStrategy, StrategyTrade, StrategyExecutionStatus } from '../features/strategies/strategyModel';
import { strategyService } from './strategyService';
import { tradingService } from './tradingService';

// Интервал проверки стратегий (в миллисекундах)
const STRATEGY_CHECK_INTERVAL = 30 * 1000; // 30 секунд

/**
 * Сервис для планирования и выполнения торговых стратегий
 */
export class StrategyExecutorService {
  private static instance: StrategyExecutorService;
  private intervalId: number | null = null;
  private activeStrategies: Map<string, StrategyTrade> = new Map();
  private accountId: string = '';
  private isRunning: boolean = false;

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): StrategyExecutorService {
    if (!StrategyExecutorService.instance) {
      StrategyExecutorService.instance = new StrategyExecutorService();
    }
    return StrategyExecutorService.instance;
  }

  /**
   * Запуск сервиса выполнения стратегий
   */
  public async start(accountId: string): Promise<boolean> {
    if (this.isRunning) {
      console.log('Strategy executor already running');
      return true;
    }

    if (!accountId) {
      console.error('Account ID is required to start strategy executor');
      return false;
    }

    this.accountId = accountId;
    this.isRunning = true;

    // Загружаем активные торги из localStorage
    await this.loadActiveTrades();

    // Запускаем интервал проверки стратегий
    this.intervalId = window.setInterval(() => {
      this.checkStrategies();
    }, STRATEGY_CHECK_INTERVAL);

    console.log('Strategy executor started with account ID:', accountId);
    return true;
  }

  /**
   * Остановка сервиса выполнения стратегий
   */
  public stop(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Strategy executor stopped');
  }

  /**
   * Проверка запущен ли сервис
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Получение текущего аккаунта
   */
  public getAccountId(): string {
    return this.accountId;
  }

  /**
   * Получение активных торговых операций
   */
  public getActiveTrades(): StrategyTrade[] {
    return Array.from(this.activeStrategies.values());
  }

  /**
   * Загрузка активных торговых операций из хранилища
   */
  private async loadActiveTrades(): Promise<void> {
    try {
      const trades = await strategyService.getStrategyTrades();
      
      // Фильтруем только активные торги (не завершенные и не с ошибками)
      const activeTrades = trades.filter(trade => 
        trade.status !== StrategyExecutionStatus.COMPLETED && 
        trade.status !== StrategyExecutionStatus.ERROR
      );
      
      // Загружаем в Map
      activeTrades.forEach(trade => {
        this.activeStrategies.set(trade.id, trade);
      });
      
      console.log(`Loaded ${activeTrades.length} active trades`);
    } catch (error) {
      console.error('Error loading active trades:', error);
    }
  }

  /**
   * Сохранение торговой операции
   */
  private async saveTrade(trade: StrategyTrade): Promise<void> {
    try {
      // Получаем все текущие трейды
      const allTrades = await strategyService.getStrategyTrades();
      
      // Находим индекс текущего трейда, если он существует
      const tradeIndex = allTrades.findIndex(t => t.id === trade.id);
      
      if (tradeIndex >= 0) {
        // Обновляем существующий трейд
        allTrades[tradeIndex] = trade;
      } else {
        // Добавляем новый трейд
        allTrades.push(trade);
      }
      
      // Сохраняем в localStorage
      localStorage.setItem('strategy_trades', JSON.stringify(allTrades));
      
      // Если трейд завершен или с ошибкой, удаляем его из активных
      if (trade.status === StrategyExecutionStatus.COMPLETED || 
          trade.status === StrategyExecutionStatus.ERROR) {
        this.activeStrategies.delete(trade.id);
      } else {
        // Иначе обновляем в активных
        this.activeStrategies.set(trade.id, trade);
      }
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  }

  /**
   * Основная функция проверки стратегий
   */
  private async checkStrategies(): Promise<void> {
    try {
      console.log('Checking strategies...');
      
      // Получаем все активные стратегии
      const strategies = await strategyService.getAllStrategies();
      const activeStrategies = strategies.filter(s => s.isActive);
      
      // Проверяем каждую активную стратегию
      for (const strategy of activeStrategies) {
        await this.processStrategy(strategy);
      }
      
      // Проверяем активные торги
      await this.checkActiveTrades();
      
      console.log('Strategies check completed');
    } catch (error) {
      console.error('Error checking strategies:', error);
    }
  }

  /**
   * Обработка отдельной стратегии
   */
  private async processStrategy(strategy: SPXStrategy): Promise<void> {
    try {
      // Проверяем, есть ли уже активная торговля по этой стратегии
      const existingTrades = Array.from(this.activeStrategies.values())
        .filter(trade => trade.strategyId === strategy.id);
      
      if (existingTrades.length > 0) {
        console.log(`Strategy ${strategy.name} already has active trades. Skipping.`);
        return;
      }
      
      // Проверяем условия для входа
      const shouldEnter = await this.checkEntryConditions(strategy);
      
      if (shouldEnter) {
        console.log(`Entering position for strategy ${strategy.name}`);
        await this.enterPosition(strategy);
      }
    } catch (error) {
      console.error(`Error processing strategy ${strategy.name}:`, error);
    }
  }

  /**
   * Проверка условий для входа в позицию
   */
  private async checkEntryConditions(strategy: SPXStrategy): Promise<boolean> {
    try {
      // Проверка дня недели
      const now = new Date();
      const currentDayOfWeek = now.getDay();
      
      if (strategy.dayOfWeek !== currentDayOfWeek) {
        return false;
      }
      
      // Проверка времени входа
      const currentTime = now.getHours().toString().padStart(2, '0') + 
                          '-' + 
                          now.getMinutes().toString().padStart(2, '0');
      
      if (strategy.t1 !== currentTime) {
        return false;
      }
      
      // Проверка VIX, если указан
      if (strategy.vix) {
        const vixValue = await tradingService.getVIXValue();
        
        if (vixValue === -1 || vixValue < strategy.vix.min || vixValue > strategy.vix.max) {
          console.log(`VIX value ${vixValue} is outside the range ${strategy.vix.min}-${strategy.vix.max}`);
          return false;
        }
      }
      
      // TODO: Добавить другие проверки (vixOvernightRange, vixIntradayRange)
      
      return true;
    } catch (error) {
      console.error('Error checking entry conditions:', error);
      return false;
    }
  }

  /**
   * Вход в позицию согласно стратегии
   */
  private async enterPosition(strategy: SPXStrategy): Promise<void> {
    try {
      // Создаем запись о новой торговой операции
      const trade: StrategyTrade = {
        id: crypto.randomUUID(),
        strategyId: strategy.id,
        status: StrategyExecutionStatus.WAITING,
        contracts: 0, // Пока не знаем количество контрактов
      };
      
      // Сохраняем торговую операцию
      await this.saveTrade(trade);
      this.activeStrategies.set(trade.id, trade);
      
      // Ищем опционы с необходимыми параметрами
      const options = await tradingService.findSPXOptions(
        strategy.delta,
        [strategy.d1, strategy.d2],
        'P' // Путы
      );
      
      if (options.length < 2) {
        trade.status = StrategyExecutionStatus.ERROR;
        trade.errors = ['Не удалось найти подходящие опционы'];
        await this.saveTrade(trade);
        return;
      }
      
      // Сортируем опционы по срокам экспирации
      const sortedOptions = options.sort((a, b) => 
        new Date(a.expiry).getTime() - new Date(b.expiry).getTime()
      );
      
      const nearOption = sortedOptions[0];
      const farOption = sortedOptions[1];
      
      // Рассчитываем среднюю цену
      const nearPrice = (nearOption.bid + nearOption.ask) / 2;
      const farPrice = (farOption.bid + farOption.ask) / 2;
      const spreadPrice = farPrice - nearPrice; // Цена календарного спреда
      
      // Рассчитываем количество контрактов
      const maxContracts = Math.floor(strategy.maxCost / (spreadPrice * 100)); // * 100 потому что цена за 1 опцион
      
      if (maxContracts <= 0) {
        trade.status = StrategyExecutionStatus.ERROR;
        trade.errors = ['Недостаточно средств для покупки даже одного контракта'];
        await this.saveTrade(trade);
        return;
      }
      
      // Обновляем запись о торговой операции
      trade.status = StrategyExecutionStatus.ENTERED;
      trade.contracts = maxContracts;
      trade.entryTime = new Date().toISOString();
      trade.entryPrice = spreadPrice;
      trade.position = {
        putNearOption: nearOption.symbol,
        putFarOption: farOption.symbol,
        nearExpiration: nearOption.expiry,
        farExpiration: farOption.expiry,
        strike: nearOption.strike
      };
      
      await this.saveTrade(trade);
      
      // Размещаем ордер на календарный спред
      const orderResponse = await tradingService.placeCalendarSpread(
        this.accountId,
        nearOption.conid,
        farOption.conid,
        maxContracts,
        strategy.maxCost
      );
      
      if (orderResponse.id) {
        trade.entryOrderId = orderResponse.id;
        trade.status = StrategyExecutionStatus.ENTERED;
        
        // Размещаем ордер на take profit
        const tpOrderResponse = await tradingService.placeTakeProfitOrder(
          this.accountId,
          orderResponse.id,
          strategy.tp
        );
        
        if (tpOrderResponse.id) {
          trade.takeProfitOrderId = tpOrderResponse.id;
          trade.status = StrategyExecutionStatus.TAKE_PROFIT_ORDER_PLACED;
        } else {
          trade.errors = trade.errors || [];
          trade.errors.push(`Ошибка при размещении ордера Take Profit: ${tpOrderResponse.error}`);
        }
      } else {
        trade.status = StrategyExecutionStatus.ERROR;
        trade.errors = trade.errors || [];
        trade.errors.push(`Ошибка при размещении ордера: ${orderResponse.error}`);
      }
      
      await this.saveTrade(trade);
    } catch (error) {
      console.error('Error entering position:', error);
      
      // Создаем или обновляем запись об ошибке
      const trade = this.activeStrategies.get(strategy.id) || {
        id: crypto.randomUUID(),
        strategyId: strategy.id,
        status: StrategyExecutionStatus.ERROR,
        contracts: 0,
        errors: [(error as Error).message]
      };
      
      trade.status = StrategyExecutionStatus.ERROR;
      trade.errors = trade.errors || [];
      trade.errors.push((error as Error).message);
      
      await this.saveTrade(trade as StrategyTrade);
    }
  }

  /**
   * Проверка активных торговых операций
   */
  private async checkActiveTrades(): Promise<void> {
    for (const trade of this.activeStrategies.values()) {
      try {
        await this.checkTradeStatus(trade);
      } catch (error) {
        console.error(`Error checking trade ${trade.id}:`, error);
      }
    }
  }

  /**
   * Проверка статуса торговой операции
   */
  private async checkTradeStatus(trade: StrategyTrade): Promise<void> {
    try {
      // Получаем стратегию, связанную с этой торговой операцией
      const strategies = await strategyService.getAllStrategies();
      const strategy = strategies.find(s => s.id === trade.strategyId);
      
      if (!strategy) {
        trade.status = StrategyExecutionStatus.ERROR;
        trade.errors = trade.errors || [];
        trade.errors.push('Стратегия не найдена');
        await this.saveTrade(trade);
        return;
      }
      
      // Проверяем нужно ли закрывать позицию по времени
      if (trade.status === StrategyExecutionStatus.TAKE_PROFIT_ORDER_PLACED) {
        // Проверяем, наступило ли время для закрытия позиции
        const now = new Date();
        // const currentDayOfWeek = now.getDay();
        
        // Проверяем экспирацию ближнего опциона
        if (trade.position && trade.position.nearExpiration) {
          const expirationDate = new Date(trade.position.nearExpiration);
          const isExpirationDay = expirationDate.getDate() === now.getDate() &&
                                 expirationDate.getMonth() === now.getMonth() &&
                                 expirationDate.getFullYear() === now.getFullYear();
          
          // Если сегодня день экспирации ближнего опциона
          if (isExpirationDay) {
            // Проверяем, наступило ли время закрытия
            const currentTime = now.getHours().toString().padStart(2, '0') + 
                              '-' + 
                              now.getMinutes().toString().padStart(2, '0');
            
            if (strategy.t2 === currentTime) {
              console.log(`Closing position for trade ${trade.id} at expiration time`);
              await this.closePositionAtMarket(trade);
            }
          }
        }
      }
      
      // Проверяем статус take profit ордера
      if (trade.status === StrategyExecutionStatus.TAKE_PROFIT_ORDER_PLACED && 
          trade.takeProfitOrderId) {
        // Тут должен быть код для проверки статуса ордера take profit
        // с помощью IBKR API. Для демонстрации будем просто логировать.
        console.log(`Checking take profit order ${trade.takeProfitOrderId} for trade ${trade.id}`);
        
        // TODO: Реализовать проверку статуса ордера через API
        // const orderStatus = await tradingService.checkOrderStatus(this.accountId, trade.takeProfitOrderId);
        // if (orderStatus === 'Filled') {
        //   trade.status = StrategyExecutionStatus.TAKE_PROFIT_EXECUTED;
        //   trade.exitTime = new Date().toISOString();
        //   trade.exitPrice = ... // Получить цену исполнения
        //   await this.saveTrade(trade);
        // }
      }
      
      // Проверка на необходимость усреднения позиции
      if (trade.status === StrategyExecutionStatus.TAKE_PROFIT_ORDER_PLACED && 
          strategy.averagingDropPct && 
          strategy.averagingTimes && 
          strategy.averagingTimes.length > 0 && 
          strategy.averagingAmount) {
        
        const now = new Date();
        const currentTime = now.getHours().toString().padStart(2, '0') + 
                          '-' + 
                          now.getMinutes().toString().padStart(2, '0');
        
        // Проверяем, наступило ли время для усреднения
        if (strategy.averagingTimes.includes(currentTime)) {
          // TODO: Реализовать проверку падения цены и усреднение позиции
          console.log(`Checking averaging for trade ${trade.id} at time ${currentTime}`);
        }
      }
    } catch (error) {
      console.error(`Error checking trade status for ${trade.id}:`, error);
      trade.errors = trade.errors || [];
      trade.errors.push(`Ошибка при проверке статуса: ${(error as Error).message}`);
      await this.saveTrade(trade);
    }
  }

  /**
   * Закрытие позиции по рыночной цене
   */
  private async closePositionAtMarket(trade: StrategyTrade): Promise<void> {
    try {
      if (!trade.position) {
        trade.errors = trade.errors || [];
        trade.errors.push('Невозможно закрыть позицию: информация о позиции отсутствует');
        await this.saveTrade(trade);
        return;
      }
      
      // Если есть ордер take profit, отменяем его
      if (trade.takeProfitOrderId) {
        await tradingService.cancelOrder(this.accountId, trade.takeProfitOrderId);
      }
      
      // Закрываем позицию по рыночной цене
      // TODO: Реализовать закрытие позиции через API
      console.log(`Closing position for trade ${trade.id} at market price`);
      
      // Обновляем статус трейда
      trade.status = StrategyExecutionStatus.EXITED_BY_TIME;
      trade.exitTime = new Date().toISOString();
      // trade.exitPrice = ... // Получить цену закрытия
      
      await this.saveTrade(trade);
      
      // Отмечаем трейд как завершенный
      setTimeout(() => {
        trade.status = StrategyExecutionStatus.COMPLETED;
        this.saveTrade(trade);
      }, 5000); // Даем время на получение подтверждения закрытия
    } catch (error) {
      console.error(`Error closing position for trade ${trade.id}:`, error);
      trade.errors = trade.errors || [];
      trade.errors.push(`Ошибка при закрытии позиции: ${(error as Error).message}`);
      await this.saveTrade(trade);
    }
  }
}

// Экспортируем экземпляр сервиса
export const strategyExecutor = StrategyExecutorService.getInstance();