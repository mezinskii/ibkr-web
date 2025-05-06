// src/features/strategies/StrategyDashboard.tsx

import React from 'react';
import { Card, Typography } from 'antd';
import StrategyList from './StrategyList/StrategyList';

const { Title } = Typography;

const StrategyDashboard: React.FC = () => (
  <Card style={{ margin: 24 }} bordered>
    <Title level={2} style={{ marginBottom: 16 }}>
      Управление стратегиями торговли
    </Title>
    <StrategyList />
  </Card>
);

export default React.memo(StrategyDashboard);