import { useState } from 'react';
import { View } from 'react-native';

import { MFTabBar } from '@mobile-frame/ui-native';

import {
  DashboardScreen,
  DeviceDetailScreen,
  DeviceListScreen,
  LoginScreen,
  ManagementHomeScreen,
  ProfileScreen,
  TaskDetailScreen,
  TaskListScreen
} from '../screens';
import { appTabs, type AdminTab } from '../store';
import { appTheme } from '../theme';

type DetailRoute = { id: string; type: 'device' | 'task' } | null;

export function AppNavigator() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [detailRoute, setDetailRoute] = useState<DetailRoute>(null);

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  const openDevice = (deviceId: string) => {
    setActiveTab('devices');
    setDetailRoute({ id: deviceId, type: 'device' });
  };

  const openTask = (taskId: string) => {
    setActiveTab('tasks');
    setDetailRoute({ id: taskId, type: 'task' });
  };

  const changeTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setDetailRoute(null);
  };

  return (
    <View style={{ flex: 1 }}>
      {renderScreen({
        activeTab,
        detailRoute,
        onBack: () => setDetailRoute(null),
        onOpenDevice: openDevice,
        onOpenTask: openTask
      })}
      <MFTabBar
        items={appTabs.map((tab) => ({ label: tab.label, value: tab.value }))}
        onChange={changeTab}
        theme={appTheme}
        value={activeTab}
        style={{
          bottom: 16,
          left: 16,
          position: 'absolute',
          right: 16
        }}
      />
    </View>
  );
}

function renderScreen({
  activeTab,
  detailRoute,
  onBack,
  onOpenDevice,
  onOpenTask
}: {
  activeTab: AdminTab;
  detailRoute: DetailRoute;
  onBack: () => void;
  onOpenDevice: (deviceId: string) => void;
  onOpenTask: (taskId: string) => void;
}) {
  if (detailRoute?.type === 'device') {
    return <DeviceDetailScreen deviceId={detailRoute.id} onBack={onBack} onOpenTask={onOpenTask} />;
  }

  if (detailRoute?.type === 'task') {
    return <TaskDetailScreen onBack={onBack} onOpenDevice={onOpenDevice} taskId={detailRoute.id} />;
  }

  switch (activeTab) {
    case 'dashboard':
      return <DashboardScreen onOpenDevice={onOpenDevice} onOpenTask={onOpenTask} />;
    case 'devices':
      return <DeviceListScreen onOpenDevice={onOpenDevice} />;
    case 'tasks':
      return <TaskListScreen onOpenTask={onOpenTask} />;
    case 'management':
      return <ManagementHomeScreen />;
    case 'profile':
      return <ProfileScreen />;
  }
}
