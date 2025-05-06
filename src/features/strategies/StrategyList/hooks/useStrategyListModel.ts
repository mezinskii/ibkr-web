import { useState, useEffect } from "react";
import { message } from "antd";
import { SPXStrategy } from "../../strategyModel";
import { strategyService } from "../../../../services/strategyService";

export function useStrategyListModel() {
  const [strategies, setStrategies] = useState<SPXStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // загрузка списка
  const load = async () => {
    setLoading(true);
    try {
      const data = await strategyService.getAllStrategies();
      setStrategies(data);
      setError(null);
    } catch {
      message.error("Ошибка загрузки стратегий");
      setError("Ошибка загрузки стратегий");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // переключение активности
  const toggleActive = async (id: string, active: boolean) => {
    try {
      await strategyService.toggleStrategyActive(id, active);
      setStrategies((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: active } : s))
      );
    } catch {
      message.error("Не удалось обновить статус");
    }
  };

  // удаление
  const remove = async (id: string) => {
    try {
      await strategyService.deleteStrategy(id);
      setStrategies((prev) => prev.filter((s) => s.id !== id));
      message.success("Стратегия удалена");
    } catch {
      message.error("Ошибка при удалении");
    }
  };

  // добавление
  const add = async (params: string, name: string) => {
    try {
      const strategy = await strategyService.createStrategyFromString(
        params,
        name
      );
      setStrategies((prev) => [...prev, strategy]);
      message.success("Стратегия добавлена");
      return true;
    } catch {
      message.error("Ошибка при добавлении стратегии");
      return false;
    }
  };

  return { strategies, loading, error, load, toggleActive, remove, add };
}
