import { useState } from 'react';
import { View } from 'react-native';

import { AdminAuthProvider, ProtectedScreen, type AdminPermission, type PermissionMode } from '@mobile-frame/auth-admin';
import { MFTabBar } from '@mobile-frame/ui-native';

import {
  DashboardScreen,
  DeviceDetailScreen,
  DeviceListScreen,
  GameModuleListScreen,
  LoginScreen,
  ManagementHomeScreen,
  PermissionDeniedScreen,
  ProfileScreen,
  ReleaseListScreen,
  RuntimeLogListScreen,
  TaskDetailScreen,
  TaskListScreen,
  ManagedUserListScreen,
  VisualAssetListScreen
} from '../screens';
import { adminSession, appTabs, type AdminTab, type ManagementArea } from '../store';
import { appTheme } from '../theme';

type DetailRoute = { id: string; type: 'device' | 'task' } | null;
type RouteGuard = {
  mode?: PermissionMode;
  permissions: AdminPermission[];
  title: string;
};

const tabGuards: Record<AdminTab, RouteGuard> = {
  dashboard: { permissions: ['dashboard.view'], title: 'Overview access required' },
  devices: { permissions: ['device.view'], title: 'Device access required' },
  management: {
    mode: 'any',
    permissions: ['user.view', 'module.view', 'asset.view', 'app.release.view', 'log.view'],
    title: 'Management access required'
  },
  profile: { permissions: [], title: 'Profile' },
  tasks: { permissions: ['task.view'], title: 'Task access required' }
};

const detailGuards: Record<NonNullable<DetailRoute>['type'], RouteGuard> = {
  device: { permissions: ['device.view'], title: 'Device access required' },
  task: { permissions: ['task.view'], title: 'Task access required' }
};

const managementGuards: Record<ManagementArea, RouteGuard> = {
  assets: { permissions: ['asset.view'], title: 'Asset management access required' },
  logs: { permissions: ['log.view'], title: 'Runtime log access required' },
  modules: { permissions: ['module.view'], title: 'Module management access required' },
  releases: { permissions: ['app.release.view'], title: 'Release management access required' },
  users: { permissions: ['user.view'], title: 'User management access required' }
};

export function AppNavigator() {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [detailRoute, setDetailRoute] = useState<DetailRoute>(null);
  const [managementArea, setManagementArea] = useState<ManagementArea | null>(null);

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  const openDevice = (deviceId: string) => {
    setActiveTab('devices');
    setDetailRoute({ id: deviceId, type: 'device' });
    setManagementArea(null);
  };

  const openTask = (taskId: string) => {
    setActiveTab('tasks');
    setDetailRoute({ id: taskId, type: 'task' });
    setManagementArea(null);
  };

  const openManagementArea = (area: ManagementArea) => {
    setActiveTab('management');
    setDetailRoute(null);
    setManagementArea(area);
  };

  const changeTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setDetailRoute(null);
    setManagementArea(null);
  };

  return (
    <AdminAuthProvider session={adminSession}>
      <View style={{ flex: 1 }}>
        {renderScreen({
          activeTab,
          detailRoute,
          managementArea,
          onBack: () => {
            setDetailRoute(null);
            setManagementArea(null);
          },
          onOpenDevice: openDevice,
          onOpenManagementArea: openManagementArea,
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
    </AdminAuthProvider>
  );
}

function renderScreen({
  activeTab,
  detailRoute,
  managementArea,
  onBack,
  onOpenDevice,
  onOpenManagementArea,
  onOpenTask
}: {
  activeTab: AdminTab;
  detailRoute: DetailRoute;
  managementArea: ManagementArea | null;
  onBack: () => void;
  onOpenDevice: (deviceId: string) => void;
  onOpenManagementArea: (area: ManagementArea) => void;
  onOpenTask: (taskId: string) => void;
}) {
  const guard = detailRoute
    ? detailGuards[detailRoute.type]
    : activeTab === 'management' && managementArea
      ? managementGuards[managementArea]
      : tabGuards[activeTab];

  return (
    <ProtectedScreen
      fallback={
        <PermissionDeniedScreen
          onBack={detailRoute || managementArea ? onBack : undefined}
          permissions={guard.permissions}
          title={guard.title}
        />
      }
      mode={guard.mode}
      permissions={guard.permissions}
    >
      {renderScreenContent({ activeTab, detailRoute, managementArea, onBack, onOpenDevice, onOpenManagementArea, onOpenTask })}
    </ProtectedScreen>
  );
}

function renderScreenContent({
  activeTab,
  detailRoute,
  managementArea,
  onBack,
  onOpenDevice,
  onOpenManagementArea,
  onOpenTask
}: {
  activeTab: AdminTab;
  detailRoute: DetailRoute;
  managementArea: ManagementArea | null;
  onBack: () => void;
  onOpenDevice: (deviceId: string) => void;
  onOpenManagementArea: (area: ManagementArea) => void;
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
      return renderManagementScreen(managementArea, onBack, onOpenManagementArea);
    case 'profile':
      return <ProfileScreen />;
  }
}

function renderManagementScreen(area: ManagementArea | null, onBack: () => void, onOpenManagementArea: (area: ManagementArea) => void) {
  switch (area) {
    case 'assets':
      return <VisualAssetListScreen onBack={onBack} />;
    case 'logs':
      return <RuntimeLogListScreen onBack={onBack} />;
    case 'modules':
      return <GameModuleListScreen onBack={onBack} />;
    case 'releases':
      return <ReleaseListScreen onBack={onBack} />;
    case 'users':
      return <ManagedUserListScreen onBack={onBack} />;
    case null:
    default:
      return <ManagementHomeScreen onOpenArea={onOpenManagementArea} />;
  }
}
