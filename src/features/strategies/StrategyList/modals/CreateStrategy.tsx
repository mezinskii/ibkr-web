// src/features/strategies/StrategyList/CreateStrategy.tsx
import React from "react";
import { Modal, Form, Input, Button, Space } from "antd";
import type { FormInstance } from "antd";

interface CreateStrategyProps {
  visible: boolean;
  onCancel: () => void;
  onFinish: (values: { name: string; params: string }) => void;
  form: FormInstance<{ name: string; params: string }>;
}

const CreateStrategy: React.FC<CreateStrategyProps> = ({
  visible,
  onCancel,
  onFinish,
  form,
}) => (
  <Modal
    title="Добавить новую стратегию"
    visible={visible}
    onCancel={onCancel}
    footer={null}
  >
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="name"
        label="Название"
        rules={[{ required: true, message: "Введите название" }]}
      >
        <Input placeholder="SPX Понедельник" />
      </Form.Item>
      <Form.Item
        name="params"
        label="Параметры"
        rules={[{ required: true, message: "Введите параметры" }]}
      >
        <Input placeholder="Mon 70 3 4 09-32 15-30 20% 10000" />
      </Form.Item>
      <Form.Item>
        <Space>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="primary" htmlType="submit">
            Сохранить
          </Button>
        </Space>
      </Form.Item>
    </Form>
  </Modal>
);

export default CreateStrategy;
