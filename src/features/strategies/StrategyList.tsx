// src/features/strategies/StrategyList.tsx

import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Spin,
  message,
  Space,
} from 'antd';
import { ColumnsType } from 'antd/es/table';
import { SPXStrategy, formatStrategyToString } from './strategyModel';
import { strategyService } from '../../services/strategyService';

const StrategyList: React.FC = () => {
  const [strategies, setStrategies] = useState<SPXStrategy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();

  const loadStrategies = async () => {
    setLoading(true);
    try {
      const data = await strategyService.getAllStrategies();
      setStrategies(data);
    } catch (err) {
      message.error('Ошибка загрузки стратегий');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStrategies();
  }, []);

  const handleToggleActive = async (id: string, checked: boolean) => {
    try {
      await strategyService.toggleStrategyActive(id, checked);
      setStrategies(prev =>
        prev.map(s => (s.id === id ? { ...s, isActive: checked } : s))
      );
    } catch {
      message.error('Не удалось обновить статус');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await strategyService.deleteStrategy(id);
      setStrategies(prev => prev.filter(s => s.id !== id));
      message.success('Стратегия удалена');
    } catch {
      message.error('Ошибка при удалении');
    }
  };

  const handleAdd = async (values: { name: string; params: string }) => {
    try {
      const strategy = await strategyService.createStrategyFromString(
        values.params,
        values.name
      );
      setStrategies(prev => [...prev, strategy]);
      setModalVisible(false);
      form.resetFields();
      message.success('Стратегия добавлена');
    } catch {
      message.error('Ошибка при добавлении стратегии');
    }
  };

  const columns: ColumnsType<SPXStrategy> = [
    {
      title: 'Активна',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active, record) => (
        <Switch
          checked={active}
          onChange={checked => handleToggleActive(record.id, checked)}
        />
      ),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Параметры',
      key: 'params',
      render: (_, record) => formatStrategyToString(record),
    },
    {
      title: 'День',
      dataIndex: 'dayOfWeek',
      key: 'dayOfWeek',
      render: day => ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][day],
    },
    {
      title: '∆',
      dataIndex: 'delta',
      key: 'delta',
    },
    {
      title: 'TP%',
      dataIndex: 'tp',
      key: 'tp',
      render: tp => `${tp}%`,
    },
    {
      title: 'MaxCost',
      dataIndex: 'maxCost',
      key: 'maxCost',
      render: cost => `$${cost.toLocaleString()}`,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button danger onClick={() => handleDelete(record.id)}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setModalVisible(true)}>
          Добавить стратегию
        </Button>
        <Button onClick={loadStrategies}>Обновить</Button>
      </Space>
      {loading ? (
        <Spin size="large" />
      ) : (
        <Table
          dataSource={strategies}
          columns={columns}
          rowKey="id"
          pagination={false}
          bordered
        />
      )}

      <Modal
        title="Добавить новую стратегию"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAdd}>
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название стратегии' }]}
          >
            <Input placeholder="SPX Понедельник" />
          </Form.Item>
          <Form.Item
            name="params"
            label="Параметры"
            rules={[{ required: true, message: 'Введите параметры стратегии' }]}
          >
            <Input placeholder="Mon 70 3 4 09-32 15-30 20% 10000" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Отмена
              </Button>
              <Button type="primary" htmlType="submit">
                Сохранить
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default StrategyList;