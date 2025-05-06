// src/features/strategies/hooks/useStrategyListColumns.ts
import { ColumnsType } from 'antd/es/table';
import { Switch, Button } from 'antd';
import { formatStrategyToString, SPXStrategy } from '../../strategyModel';

export const useStrategyListColumns = (
  toggleActive: (id: string, active: boolean) => Promise<void>,
  remove: (id: string) => Promise<void>
) => {
  const columns: ColumnsType<SPXStrategy> = [
    {
      title: 'Активна',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active, r) => (
        <Switch checked={active} onChange={c => toggleActive(r.id, c)} />
      ),
    },
    { title: 'Название', dataIndex: 'name', key: 'name' },
    {
      title: 'Параметры',
      key: 'params',
      render: (_, r) => formatStrategyToString(r),
    },
    {
      title: 'День',
      dataIndex: 'dayOfWeek',
      key: 'day',
      render: d => ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d],
    },
    { title: '∆', dataIndex: 'delta', key: 'delta' },
    { title: 'TP%', dataIndex: 'tp', key: 'tp', render: t => `${t}%` },
    {
      title: 'MaxCost',
      dataIndex: 'maxCost',
      key: 'maxCost',
      render: c => `$${c.toLocaleString()}`,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, r) => (
        <Button danger onClick={() => remove(r.id)}>
          Удалить
        </Button>
      ),
    },
  ];

  return { columns };
};
