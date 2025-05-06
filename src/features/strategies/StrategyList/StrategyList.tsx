import React from 'react';
import { Table, Button, Spin, Space } from 'antd';
import { useStrategyListModel } from './hooks/useStrategyListModel';
import { useStrategyListColumns } from './hooks/useStrategyListColumns';
import CreateStrategy from './modals/CreateStrategy';
import { useCreateStrategyModel } from './modals/useCreateStrategyModel';

const StrategyList: React.FC = () => {
  const { strategies, loading, load, toggleActive, remove } = useStrategyListModel();
  const createModel = useCreateStrategyModel();
  const { columns } = useStrategyListColumns(toggleActive, remove);

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={createModel.onCreateStrategyShow}>
          Добавить стратегию
        </Button>
        <Button onClick={load}>Обновить</Button>
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
      <CreateStrategy
        visible={createModel.modalVisible}
        onCancel={createModel.onCreateStrategyHide}
        onFinish={createModel.onFinish}
        form={createModel.form}
      />
    </>
  );
};

export default StrategyList;
