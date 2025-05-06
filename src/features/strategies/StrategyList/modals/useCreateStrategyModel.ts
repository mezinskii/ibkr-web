// src/features/strategies/hooks/useCreateStrategyModel.ts
import { useState } from "react";
import { Form } from "antd";
import { useStrategyListModel } from "../hooks/useStrategyListModel";

// Хук для управления модальным окном создания стратегии
export const useCreateStrategyModel = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const onCreateStrategyShow = () => setModalVisible(true);
  const onCreateStrategyHide = () => setModalVisible(false);

  const { add } = useStrategyListModel();
  const [form] = Form.useForm<{ name: string; params: string }>();

  const onFinish = async (values: { name: string; params: string }) => {
    const ok = await add(values.params, values.name);
    if (ok) {
      form.resetFields();
      onCreateStrategyHide();
    }
  };

  return {
    modalVisible,
    onCreateStrategyShow,
    onCreateStrategyHide,
    onFinish,
    form,
  };
};
