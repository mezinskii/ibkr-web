// src/features/strategies/StrategyDashboard.tsx

import React from 'react';
import { Card, Typography } from 'antd';
import StrategyList from './StrategyList';

const { Title } = Typography;

/**
 * Компонент страницы управления стратегиями, переделанный на Ant Design
 */
const StrategyDashboard: React.FC = () => (
  <Card style={{ margin: 24 }} bordered>
    <Title level={2} style={{ marginBottom: 16 }}>
      Управление стратегиями торговли
    </Title>
    <StrategyList />
  </Card>
);

export default StrategyDashboard;