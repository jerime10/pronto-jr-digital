
import { useState } from 'react';
import { TabValue } from '../types';

export const useTabState = () => {
  const [activeTab, setActiveTab] = useState<TabValue>('info');
  
  return {
    activeTab,
    setActiveTab
  };
};
