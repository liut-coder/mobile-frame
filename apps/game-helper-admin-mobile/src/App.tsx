import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { createAppConfig, MFAppProvider, useMFAppShellStore } from '@mobile-frame/app-shell';
import { getPreset } from '@mobile-frame/presets';
import { createTheme, type MFTheme } from '@mobile-frame/ui-core';
import {
  MFBadge,
  MFButton,
  MFCard,
  MFCaption,
  MFCheckbox,
  MFDivider,
  MFFormField,
  MFHeading,
  MFInput,
  MFKeyValue,
  MFListItem,
  MFPage,
  MFPasswordInput,
  MFProgress,
  MFRow,
  MFScrollPage,
  MFSearchBar,
  MFSegmentedControl,
  MFSheetHost,
  MFStack,
  MFStatusCard,
  MFStatCard,
  MFTabBar,
  MFText,
  MFToastHost
} from '@mobile-frame/ui-native';

type ScreenKey = 'splash' | 'login' | 'main';
type MainTab = 'dashboard' | 'devices' | 'tasks' | 'manage' | 'profile';
type RouteKey =
  | 'tabs'
  | 'managedUsers'
  | 'managedUserDetail'
  | 'managedUserForm'
  | 'bindDevice'
  | 'gameAccounts'
  | 'userTaskHistory'
  | 'pendingDevices'
  | 'deviceDetail'
  | 'deviceAlert';
type Tone = 'info' | 'success' | 'warning' | 'danger';
type UserFormMode = 'create' | 'edit';

type ManagedUser = {
  accountCount: number;
  autoSchedule: boolean;
  code: string;
  currentTask: string;
  device: string;
  deviceStatus: string;
  id: string;
  name: string;
  progress: number;
  status: string;
};

type DeviceRecord = {
  adb: string;
  app: string;
  id: string;
  name: string;
  status: string;
  tone: Tone;
  user: string;
  worker: string;
};

const theme = createTheme('light');
const preset = getPreset('admin-mobile');

const tabs: Array<{ badge?: string; key: MainTab; label: string }> = [
  { key: 'dashboard', label: '总览' },
  { badge: '2', key: 'devices', label: '设备' },
  { badge: '6', key: 'tasks', label: '任务' },
  { key: 'manage', label: '管理' },
  { key: 'profile', label: '我的' }
];

const metrics = [
  { label: '托管用户', tab: 'manage' as const, value: '128' },
  { label: '在线设备', tab: 'devices' as const, value: '98' },
  { label: '执行中', tab: 'tasks' as const, value: '6' },
  { label: '异常', tab: 'devices' as const, value: '4' }
];

const runningTasks = [
  { device: 'Pixel 7 Pro', progress: 0.72, status: '执行中', title: '随缘打熊', user: '用户 A / 王国 01' },
  { device: 'Redmi K70', progress: 0.41, status: '等待截图', title: '联盟签到', user: '用户 D / 王国 02' },
  { device: 'Galaxy S24', progress: 0.18, status: '排队中', title: '日常采集', user: '用户 K / 王国 09' }
];

const fallbackManagedUser: ManagedUser = {
  accountCount: 2,
  autoSchedule: true,
  code: 'managed-user-10001',
  currentTask: '随缘打熊',
  device: 'Pixel 7 Pro',
  deviceStatus: '在线',
  id: 'mu-10001',
  name: '用户 A',
  progress: 0.72,
  status: '托管中'
};

const managedUsers: ManagedUser[] = [
  fallbackManagedUser,
  {
    accountCount: 1,
    autoSchedule: true,
    code: 'managed-user-10004',
    currentTask: '联盟签到',
    device: 'Redmi K70',
    deviceStatus: '异常',
    id: 'mu-10004',
    name: '用户 D',
    progress: 0.41,
    status: '需处理'
  },
  {
    accountCount: 3,
    autoSchedule: false,
    code: 'managed-user-10011',
    currentTask: '日常采集',
    device: 'Galaxy S24',
    deviceStatus: '离线',
    id: 'mu-10011',
    name: '用户 K',
    progress: 0.18,
    status: '暂停托管'
  }
];

const devices: DeviceRecord[] = [
  { adb: 'ADB 正常', app: 'v0.3.2', id: 'dev-pixel-7-pro', name: 'Pixel 7 Pro', status: '在线', tone: 'success', user: '用户 A', worker: 'Worker v0.3.2' },
  { adb: 'ADB 异常', app: 'v0.3.2', id: 'dev-redmi-k70', name: 'Redmi K70', status: '异常', tone: 'danger', user: '用户 D', worker: 'Worker v0.3.2' },
  { adb: 'Worker 离线', app: 'v0.3.1', id: 'dev-galaxy-s24', name: 'Galaxy S24', status: '离线', tone: 'warning', user: '用户 K', worker: 'Worker v0.3.1' }
];

const fallbackDevice = devices[0] ?? {
  adb: 'ADB 正常',
  app: 'v0.3.2',
  id: 'dev-placeholder',
  name: 'Pixel 7 Pro',
  status: '在线',
  tone: 'success' as const,
  user: '用户 A',
  worker: 'Worker v0.3.2'
};

const gameAccounts = [
  { accountId: 'ACCT-10001-0001', name: '王国 01', role: '战神无双', server: 'S23-荣耀之巅', status: '启用' },
  { accountId: 'ACCT-10001-0002', name: '王国 02', role: '云中游侠', server: 'S24-曙光前线', status: '备用' }
];

const pendingDevices = [
  { bindingCode: '9X7Q-2M4K-8L3R', name: 'OnePlus 12', status: '等待绑定' },
  { bindingCode: '837291', name: 'Pixel 8', status: '已识别' }
];

const taskCards = [
  { progress: 0.72, status: 'running', title: '随缘打熊', user: '用户 A', worker: 'Pixel 7 Pro' },
  { progress: 0.06, status: 'failed', title: '王国领奖', user: '用户 F', worker: 'OnePlus 12' },
  { progress: 1, status: 'finished', title: '联盟签到', user: '用户 Q', worker: 'Redmi K70' }
];

const managementEntries = [
  { meta: '128 个用户，98 台在线设备', target: '托管用户列表', title: '托管用户' },
  { meta: '8 个分组，32 个具体任务模块', target: '游戏模块分组', title: '游戏模块' },
  { meta: '线上 v0.3.2，灰度 v0.3.3', target: 'APP 发版中心', title: 'APP 管理 / 发版中心' }
];

const profileEntries: Array<{ meta: string; title: string }> = [
  { meta: '手机号、邮箱、部门', title: '个人信息' },
  { meta: '告警、任务、发版', title: '通知设置' },
  { meta: '服务地址、缓存、主题', title: '系统设置' },
  { meta: preset.features.join(' / '), title: '权限' },
  { meta: '解绑、取消任务、回滚和发版审计', title: '操作日志' }
];

const alerts = [
  { message: 'Redmi K70 最近一次心跳 6 分钟前，ADB 连接异常。', title: '设备连接异常', tone: 'danger' as const },
  { message: 'v0.3.3 灰度覆盖 18 台设备，失败 2 台。', title: '灰度升级失败', tone: 'warning' as const }
];

export function App() {
  const [screen, setScreen] = useState<ScreenKey>('splash');
  const [tab, setTab] = useState<MainTab>('dashboard');
  const [rememberLogin, setRememberLogin] = useState(true);
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'online' | 'alert'>('all');
  const [route, setRoute] = useState<RouteKey>('tabs');
  const [selectedDeviceId, setSelectedDeviceId] = useState(fallbackDevice.id);
  const [selectedUserId, setSelectedUserId] = useState(fallbackManagedUser.id);
  const [taskFilter, setTaskFilter] = useState<'running' | 'failed' | 'finished'>('running');
  const [userFormMode, setUserFormMode] = useState<UserFormMode>('create');

  const closeSheet = useMFAppShellStore((state) => state.closeSheet);
  const hideToast = useMFAppShellStore((state) => state.hideToast);
  const openShellSheet = useMFAppShellStore((state) => state.openSheet);
  const sheet = useMFAppShellStore((state) => state.sheet);
  const showShellToast = useMFAppShellStore((state) => state.showToast);
  const toast = useMFAppShellStore((state) => state.toast);

  const config = useMemo(
    () =>
      createAppConfig({
        appId: 'com.misk.gamehelperadminmobile',
        displayName: '游戏助手管理端',
        theme
      }),
    []
  );

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => hideToast(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [hideToast, toast]);

  const actions = {
    goLogin: () => setScreen('login'),
    goMain: (nextTab: MainTab = 'dashboard') => {
      setRoute('tabs');
      setTab(nextTab);
      setScreen('main');
    },
    goRoute: (nextRoute: RouteKey) => setRoute(nextRoute),
    goTabs: (nextTab?: MainTab) => {
      if (nextTab) {
        setTab(nextTab);
      }
      setRoute('tabs');
    },
    openSheet: (title: string, body: string) => openShellSheet({ body, title }),
    openDevice: (deviceId: string, nextRoute: 'deviceDetail' | 'deviceAlert' = 'deviceDetail') => {
      setSelectedDeviceId(deviceId);
      setRoute(nextRoute);
    },
    openBindDevice: (userId: string) => {
      setSelectedUserId(userId);
      setRoute('bindDevice');
    },
    openManagedUser: (userId: string) => {
      setSelectedUserId(userId);
      setRoute('managedUserDetail');
    },
    openUserForm: (mode: UserFormMode, userId?: string) => {
      if (userId) {
        setSelectedUserId(userId);
      }
      setUserFormMode(mode);
      setRoute('managedUserForm');
    },
    setDeviceFilter,
    setRememberLogin,
    setTab,
    setTaskFilter,
    showToast: (message: string) => showShellToast(message)
  };

  return (
    <MFAppProvider config={config}>
      <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        {screen === 'splash' ? <SplashScreen actions={actions} theme={theme} /> : null}
        {screen === 'login' ? <LoginScreen actions={actions} rememberLogin={rememberLogin} theme={theme} /> : null}
        {screen === 'main' ? (
          <MainScreen
            actions={actions}
            activeTab={tab}
            deviceFilter={deviceFilter}
            route={route}
            selectedDevice={devices.find((device) => device.id === selectedDeviceId) ?? fallbackDevice}
            selectedUser={managedUsers.find((user) => user.id === selectedUserId) ?? fallbackManagedUser}
            taskFilter={taskFilter}
            theme={theme}
            userFormMode={userFormMode}
          />
        ) : null}
        <MFToastHost toast={toast} theme={theme} />
        <MFSheetHost onClose={closeSheet} sheet={sheet} theme={theme} />
      </View>
    </MFAppProvider>
  );
}

type AdminActions = {
  goLogin: () => void;
  goMain: (nextTab?: MainTab) => void;
  goRoute: (nextRoute: RouteKey) => void;
  goTabs: (nextTab?: MainTab) => void;
  openBindDevice: (userId: string) => void;
  openDevice: (deviceId: string, nextRoute?: 'deviceDetail' | 'deviceAlert') => void;
  openManagedUser: (userId: string) => void;
  openSheet: (title: string, body: string) => void;
  openUserForm: (mode: UserFormMode, userId?: string) => void;
  setDeviceFilter: (value: 'all' | 'online' | 'alert') => void;
  setRememberLogin: (value: boolean) => void;
  setTab: (value: MainTab) => void;
  setTaskFilter: (value: 'running' | 'failed' | 'finished') => void;
  showToast: (message: string) => void;
};

function SplashScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFPage centered theme={theme} style={{ backgroundColor: '#F8FAFD' }}>
      <MFStack gap={24} style={{ alignItems: 'center' }}>
        <LogoMark theme={theme} size={92} />
        <MFStack gap={8} style={{ alignItems: 'center' }}>
          <MFHeading theme={theme} style={{ textAlign: 'center' }}>
            游戏助手管理端
          </MFHeading>
          <MFText muted theme={theme}>
            正在连接服务
          </MFText>
        </MFStack>
        <MFCard theme={theme} style={{ alignSelf: 'stretch' }}>
          <MFStack gap={12}>
            <MFStatusCard message="Mobile API、Device API 与实时网关等待接入。" theme={theme} title="管理端移动化 Phase 1" tone="success" />
            <MFProgress label="应用初始化" theme={theme} value={0.68} />
            <MFCaption theme={theme}>v0.1.0</MFCaption>
          </MFStack>
        </MFCard>
        <MFButton onPress={actions.goLogin} theme={theme} title="进入管理端" />
      </MFStack>
    </MFPage>
  );
}

function LoginScreen({
  actions,
  rememberLogin,
  theme
}: {
  actions: AdminActions;
  rememberLogin: boolean;
  theme: MFTheme;
}) {
  return (
    <MFScrollPage theme={theme} style={{ paddingTop: 44 }}>
      <MFStack gap={18}>
        <MFStack gap={12} style={{ alignItems: 'center' }}>
          <LogoMark theme={theme} size={76} />
          <MFHeading theme={theme} style={{ textAlign: 'center' }}>
            管理员登录
          </MFHeading>
          <MFCaption theme={theme}>管理员账号用于调度、排障、审计和发版。</MFCaption>
        </MFStack>
        <MFCard theme={theme}>
          <MFStack gap={14}>
            <MFFormField label="账号" required theme={theme}>
              <MFInput autoCapitalize="none" defaultValue="admin@example.com" placeholder="请输入管理员账号" theme={theme} />
            </MFFormField>
            <MFFormField label="密码" required theme={theme}>
              <MFPasswordInput defaultValue="admin-password" placeholder="请输入密码" theme={theme} />
            </MFFormField>
            <MFCheckbox label="记住登录状态" onValueChange={actions.setRememberLogin} theme={theme} value={rememberLogin} />
            <MFButton onPress={() => actions.goMain('dashboard')} theme={theme} title="登录" />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          <MFListItem
            meta="/api/v1/mobile · /ws/admin"
            onPress={() => actions.openSheet('服务地址', '当前原型使用 api.example.com。正式接入时登录页会打开服务地址配置抽屉。')}
            theme={theme}
            title="api.example.com"
          />
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function MainScreen({
  actions,
  activeTab,
  deviceFilter,
  route,
  selectedDevice,
  selectedUser,
  taskFilter,
  theme,
  userFormMode
}: {
  actions: AdminActions;
  activeTab: MainTab;
  deviceFilter: 'all' | 'online' | 'alert';
  route: RouteKey;
  selectedDevice: DeviceRecord;
  selectedUser: ManagedUser;
  taskFilter: 'running' | 'failed' | 'finished';
  theme: MFTheme;
  userFormMode: UserFormMode;
}) {
  if (route === 'managedUsers') {
    return <ManagedUsersScreen actions={actions} theme={theme} />;
  }

  if (route === 'managedUserDetail') {
    return <ManagedUserDetailScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'managedUserForm') {
    return <ManagedUserFormScreen actions={actions} mode={userFormMode} theme={theme} user={selectedUser} />;
  }

  if (route === 'bindDevice') {
    return <BindDeviceScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'gameAccounts') {
    return <GameAccountsScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'userTaskHistory') {
    return <UserTaskHistoryScreen actions={actions} theme={theme} user={selectedUser} />;
  }

  if (route === 'pendingDevices') {
    return <PendingDevicesScreen actions={actions} theme={theme} />;
  }

  if (route === 'deviceDetail') {
    return <DeviceDetailScreen actions={actions} device={selectedDevice} theme={theme} />;
  }

  if (route === 'deviceAlert') {
    return <DeviceAlertScreen actions={actions} device={selectedDevice} theme={theme} />;
  }

  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'dashboard' ? <DashboardScreen actions={actions} theme={theme} /> : null}
      {activeTab === 'devices' ? <DevicesScreen actions={actions} filter={deviceFilter} theme={theme} /> : null}
      {activeTab === 'tasks' ? <TasksScreen actions={actions} filter={taskFilter} theme={theme} /> : null}
      {activeTab === 'manage' ? <ManageScreen actions={actions} theme={theme} /> : null}
      {activeTab === 'profile' ? <ProfileScreen actions={actions} theme={theme} /> : null}
      <MainTabBar actions={actions} activeTab={activeTab} theme={theme} />
    </View>
  );
}

function DashboardScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <Header title="总览" subtitle="系统状态、设备、任务、异常和发版状态" theme={theme} rightLabel="告警" onRightPress={() => actions.setTab('devices')} />
        <MFCard glass theme={theme}>
          <MFStack gap={14}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  今日运行稳定
                </MFText>
                <MFCaption theme={theme}>98 台设备在线，6 个任务执行中，4 个异常待处理。</MFCaption>
              </MFStack>
              <MFBadge label="实时" tone="success" theme={theme} />
            </MFRow>
            <MFProgress label="任务完成率" theme={theme} value={0.859} />
          </MFStack>
        </MFCard>
        <MFRow gap={12}>
          {metrics.slice(0, 2).map((metric) => (
            <MFStatCard key={metric.label} label={metric.label} onPress={() => actions.setTab(metric.tab)} theme={theme} value={metric.value} />
          ))}
        </MFRow>
        <MFRow gap={12}>
          {metrics.slice(2).map((metric) => (
            <MFStatCard key={metric.label} label={metric.label} onPress={() => actions.setTab(metric.tab)} theme={theme} value={metric.value} />
          ))}
        </MFRow>
        <SectionTitle action="查看发版" onAction={() => actions.openSheet('APP 发版中心', '线上 v0.3.2，待发布 v0.3.3。后续 Phase 6 会接入发布记录、灰度和回滚。')} theme={theme} title="发版状态" />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  v0.3.3 灰度中
                </MFText>
                <MFCaption theme={theme}>已升级 98 / 112，失败 2 台</MFCaption>
              </MFStack>
              <MFBadge label="87.5%" tone="warning" theme={theme} />
            </MFRow>
            <MFProgress theme={theme} value={0.875} />
          </MFStack>
        </MFCard>
        <SectionTitle action="全部任务" onAction={() => actions.setTab('tasks')} theme={theme} title="执行中任务" />
        {runningTasks.map((task) => (
          <TaskSummaryCard key={`${task.title}-${task.device}`} task={task} theme={theme} />
        ))}
        <SectionTitle action="处理" onAction={() => actions.setTab('devices')} theme={theme} title="最近异常" />
        {alerts.map((alert) => (
          <MFStatusCard key={alert.title} message={alert.message} theme={theme} title={alert.title} tone={alert.tone} />
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function DevicesScreen({ actions, filter, theme }: { actions: AdminActions; filter: 'all' | 'online' | 'alert'; theme: MFTheme }) {
  const visibleDevices = devices.filter((device) => {
    if (filter === 'online') {
      return device.status === '在线';
    }
    if (filter === 'alert') {
      return device.status !== '在线';
    }
    return true;
  });

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="设备" subtitle="设备在线状态、绑定和 Worker 管理" theme={theme} rightLabel="待绑定" onRightPress={() => actions.goRoute('pendingDevices')} />
        <MFSearchBar placeholder="搜索设备、托管用户或绑定码" theme={theme} />
        <MFSegmentedControl
          onChange={actions.setDeviceFilter}
          options={[
            { label: '全部', value: 'all' },
            { label: '在线', value: 'online' },
            { label: '异常', value: 'alert' }
          ]}
          theme={theme}
          value={filter}
        />
        <MFRow gap={12}>
          <MFStatCard label="在线" theme={theme} value="98" />
          <MFStatCard label="离线" theme={theme} value="14" />
          <MFStatCard label="异常" theme={theme} value="2" />
        </MFRow>
        {visibleDevices.map((device) => (
          <MFCard key={device.name} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {device.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {device.user} · Worker {device.app}
                  </MFCaption>
                </MFStack>
                <MFBadge label={device.status} tone={device.tone} theme={theme} />
              </MFRow>
              <MFKeyValue label="运行状态" theme={theme} value={device.adb} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id, 'deviceAlert')} theme={theme} title="异常" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.openSheet('设备操作', '可重启 Worker、复制设备 ID、查看日志或解绑。危险操作会写入审计。')} theme={theme} title="更多" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function TasksScreen({ actions, filter, theme }: { actions: AdminActions; filter: 'running' | 'failed' | 'finished'; theme: MFTheme }) {
  const visibleTasks = taskCards.filter((task) => task.status === filter);

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="任务" subtitle="新建任务、执行进度、暂停、取消和重试" theme={theme} rightLabel="新建" onRightPress={() => actions.openSheet('新建任务', '流程：选择托管用户、游戏账号、设备、模块分组、具体任务、运行参数并确认下发。')} />
        <MFSegmentedControl
          onChange={actions.setTaskFilter}
          options={[
            { label: '执行中', value: 'running' },
            { label: '失败', value: 'failed' },
            { label: '已完成', value: 'finished' }
          ]}
          theme={theme}
          value={filter}
        />
        {visibleTasks.map((task) => (
          <MFCard key={task.title} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {task.title}
                  </MFText>
                  <MFCaption theme={theme}>
                    {task.user} · {task.worker}
                  </MFCaption>
                </MFStack>
                <TaskBadge status={task.status} theme={theme} />
              </MFRow>
              <MFProgress label="执行进度" theme={theme} value={task.progress} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openSheet('任务执行详情', '后续会接入实时日志、执行链路、相似度、证据截图和取消/暂停操作。')} theme={theme} title="详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.showToast(`${task.title} 操作已加入队列`)} theme={theme} title={task.status === 'failed' ? '重试' : '日志'} variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function ManageScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="管理" subtitle="托管用户、游戏模块和 APP 发版中心" theme={theme} rightLabel="新增" onRightPress={() => actions.openUserForm('create')} />
        <MFCard padded={false} theme={theme}>
          {managementEntries.map((entry, index) => (
            <View key={entry.title}>
              <MFListItem
                meta={entry.meta}
                onPress={() => {
                  if (entry.title === '托管用户') {
                    actions.goRoute('managedUsers');
                    return;
                  }

                  actions.openSheet(entry.target, `${entry.target} 页面将按原型继续拆分列表、详情、编辑、排序和确认弹窗。`);
                }}
                theme={theme}
                title={entry.title}
              />
              {index < managementEntries.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <SectionTitle theme={theme} title="今日概览" />
        <MFRow gap={12}>
          <MFStatCard label="新增用户" theme={theme} value="7" />
          <MFStatCard label="模块变更" theme={theme} value="3" />
          <MFStatCard label="审计记录" theme={theme} value="26" />
        </MFRow>
        <MFStatusCard message="模块分组、具体任务模块、脚本、运行模板和视觉资产将在 Phase 3 接入 CRUD 与排序。" theme={theme} title="模块管理计划" tone="info" />
      </MFStack>
    </MFScrollPage>
  );
}

function ManagedUsersScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="manage" subtitle="托管用户、绑定设备、游戏账号和当前任务" theme={theme} title="托管用户" />
        <MFSearchBar placeholder="搜索用户名称、编号、设备或任务" theme={theme} />
        <MFSegmentedControl
          onChange={() => actions.showToast('筛选条件将在接口接入后生效')}
          options={[
            { label: '全部', value: 'all' },
            { label: '托管中', value: 'active' },
            { label: '异常', value: 'alert' }
          ]}
          theme={theme}
          value="all"
        />
        {managedUsers.map((user) => (
          <MFCard key={user.id} theme={theme}>
            <MFStack gap={12}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4} style={{ flex: 1 }}>
                  <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
                    {user.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {user.code} · {user.device}
                  </MFCaption>
                </MFStack>
                <MFBadge label={user.status} tone={user.deviceStatus === '在线' ? 'success' : 'warning'} theme={theme} />
              </MFRow>
              <MFProgress label={user.currentTask} theme={theme} value={user.progress} />
              <MFRow gap={10}>
                <MFButton fullWidth={false} onPress={() => actions.openManagedUser(user.id)} theme={theme} title="详情" variant="secondary" />
                <MFButton fullWidth={false} onPress={() => actions.openBindDevice(user.id)} theme={theme} title="更换设备" variant="ghost" />
                <MFButton fullWidth={false} onPress={() => actions.openUserForm('edit', user.id)} theme={theme} title="编辑" variant="ghost" />
              </MFRow>
            </MFStack>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.openUserForm('create')} theme={theme} title="新建托管用户" />
      </MFStack>
    </MFScrollPage>
  );
}

function ManagedUserDetailScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUsers" subtitle={`${user.code} · ${user.status}`} theme={theme} title={user.name} />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {user.currentTask}
                </MFText>
                <MFCaption theme={theme}>当前托管任务</MFCaption>
              </MFStack>
              <MFBadge label={`${Math.round(user.progress * 100)}%`} tone="info" theme={theme} />
            </MFRow>
            <MFProgress theme={theme} value={user.progress} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="基本信息" />
            <MFKeyValue label="用户编号" theme={theme} value={user.code} />
            <MFKeyValue label="托管状态" theme={theme} value={user.status} />
            <MFKeyValue label="自动调度" theme={theme} value={user.autoSchedule ? '允许' : '暂停'} />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          <MFListItem meta={`${user.deviceStatus} · ${user.device}`} onPress={() => actions.openBindDevice(user.id)} theme={theme} title="绑定设备" />
          <MFDivider />
          <MFListItem meta={`${user.accountCount} 个游戏账号`} onPress={() => actions.goRoute('gameAccounts')} theme={theme} title="游戏账号" />
          <MFDivider />
          <MFListItem meta="总数 128 · 成功率 85.9%" onPress={() => actions.goRoute('userTaskHistory')} theme={theme} title="任务记录" />
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.openUserForm('edit', user.id)} theme={theme} title="编辑" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.showToast(`${user.name} 已暂停托管`)} theme={theme} title="暂停托管" variant="danger" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function ManagedUserFormScreen({ actions, mode, theme, user }: { actions: AdminActions; mode: UserFormMode; theme: MFTheme; user: ManagedUser }) {
  const isEdit = mode === 'edit';

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute={isEdit ? 'managedUserDetail' : 'managedUsers'} subtitle="基本信息、托管设置和状态" theme={theme} title={isEdit ? '编辑托管用户' : '新建托管用户'} />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="用户名称" required theme={theme}>
              <MFInput defaultValue={isEdit ? user.name : ''} placeholder="例如：用户 A" theme={theme} />
            </MFFormField>
            <MFFormField helperText="留空时由服务端自动生成。" label="用户编号" theme={theme}>
              <MFInput defaultValue={isEdit ? user.code : ''} placeholder="managed-user-10001" theme={theme} />
            </MFFormField>
            <MFCheckbox label="允许自动调度" onValueChange={() => actions.showToast('托管设置已切换')} theme={theme} value={isEdit ? user.autoSchedule : true} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="状态" />
            <MFBadge label={isEdit ? user.status : '托管中'} tone="success" theme={theme} />
            <MFCaption theme={theme}>保存后会写入审计日志，并同步移动端 BFF 缓存。</MFCaption>
          </MFStack>
        </MFCard>
        <MFButton
          onPress={() => {
            actions.showToast(isEdit ? '托管用户已保存' : '托管用户已创建');
            actions.goRoute(isEdit ? 'managedUserDetail' : 'managedUsers');
          }}
          theme={theme}
          title="保存"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function BindDeviceScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUserDetail" subtitle="输入绑定码或选择待绑定设备" theme={theme} title="绑定设备" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title={user.name} />
            <MFKeyValue label="当前设备" theme={theme} value={user.device} />
            <MFKeyValue label="绑定状态" theme={theme} value={user.deviceStatus} />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFFormField label="绑定码" required theme={theme}>
              <MFInput defaultValue="837291" keyboardType="number-pad" placeholder="请输入设备绑定码" theme={theme} />
            </MFFormField>
            <MFButton onPress={() => actions.showToast('已识别 Pixel 8，等待确认绑定')} theme={theme} title="查询设备" variant="secondary" />
          </MFStack>
        </MFCard>
        {pendingDevices.map((device) => (
          <MFCard key={device.bindingCode} theme={theme}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  {device.name}
                </MFText>
                <MFCaption theme={theme}>{device.bindingCode}</MFCaption>
              </MFStack>
              <MFBadge label={device.status} tone="info" theme={theme} />
            </MFRow>
          </MFCard>
        ))}
        <MFButton
          onPress={() => {
            actions.showToast('设备 Token 已下发，绑定完成');
            actions.goRoute('managedUserDetail');
          }}
          theme={theme}
          title="确认绑定"
        />
      </MFStack>
    </MFScrollPage>
  );
}

function GameAccountsScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUserDetail" subtitle={`${user.name} · ${user.accountCount} 个账号`} theme={theme} title="游戏账号" />
        {gameAccounts.map((account) => (
          <MFCard key={account.accountId} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {account.name}
                  </MFText>
                  <MFCaption theme={theme}>
                    {account.server} · {account.role}
                  </MFCaption>
                </MFStack>
                <MFBadge label={account.status} tone="success" theme={theme} />
              </MFRow>
              <MFKeyValue label="账号 ID" theme={theme} value={account.accountId} />
              <MFButton fullWidth={false} onPress={() => actions.openSheet('编辑游戏账号', `${account.name} 表单会在后续接入保存、删除和状态切换。`)} theme={theme} title="编辑" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
        <MFButton onPress={() => actions.openSheet('新建游戏账号', '需要填写账号名称、区服、角色名、备注和状态。')} theme={theme} title="新建游戏账号" />
      </MFStack>
    </MFScrollPage>
  );
}

function UserTaskHistoryScreen({ actions, theme, user }: { actions: AdminActions; theme: MFTheme; user: ManagedUser }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="managedUserDetail" subtitle={`${user.name} · 总数 128 · 成功率 85.9%`} theme={theme} title="任务记录" />
        {taskCards.map((task) => (
          <MFCard key={`${user.id}-${task.title}`} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {task.title}
                  </MFText>
                  <MFCaption theme={theme}>{task.worker}</MFCaption>
                </MFStack>
                <TaskBadge status={task.status} theme={theme} />
              </MFRow>
              <MFProgress label="执行进度" theme={theme} value={task.progress} />
              <MFButton fullWidth={false} onPress={() => actions.openSheet('任务执行详情', '任务链路、实时日志和证据截图会在 Phase 4/5 接入。')} theme={theme} title="查看详情" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function PendingDevicesScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="devices" subtitle="自动注册但尚未绑定托管用户的设备" theme={theme} title="待绑定设备" />
        <MFSearchBar placeholder="搜索绑定码或设备名称" theme={theme} />
        {pendingDevices.map((device) => (
          <MFCard key={device.bindingCode} theme={theme}>
            <MFStack gap={10}>
              <MFRow style={{ justifyContent: 'space-between' }}>
                <MFStack gap={4}>
                  <MFText theme={theme} style={{ fontWeight: '900' }}>
                    {device.name}
                  </MFText>
                  <MFCaption theme={theme}>{device.bindingCode}</MFCaption>
                </MFStack>
                <MFBadge label={device.status} tone="warning" theme={theme} />
              </MFRow>
              <MFButton fullWidth={false} onPress={() => actions.openBindDevice(fallbackManagedUser.id)} theme={theme} title="立即绑定" variant="secondary" />
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceDetailScreen({ actions, device, theme }: { actions: AdminActions; device: DeviceRecord; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backTab="devices" subtitle={`${device.id} · ${device.status}`} theme={theme} title={device.name} />
        <MFCard glass theme={theme}>
          <MFStack gap={12}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFStack gap={4}>
                <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                  {device.worker}
                </MFText>
                <MFCaption theme={theme}>{device.user} · APP {device.app}</MFCaption>
              </MFStack>
              <MFBadge label={device.status} tone={device.tone} theme={theme} />
            </MFRow>
            <MFKeyValue label="ADB 状态" theme={theme} value={device.adb} />
            <MFKeyValue label="当前任务" theme={theme} value="随缘打熊 72%" />
          </MFStack>
        </MFCard>
        <MFStatusCard message="最近 10 分钟心跳正常，任务 claim/report/finish 链路等待后端实时事件接入。" theme={theme} title="最近运行" tone={device.tone === 'danger' ? 'danger' : 'success'} />
        <MFRow gap={10}>
          <MFButton fullWidth={false} onPress={() => actions.showToast(`${device.name} 测试连接已下发`)} theme={theme} title="测试连接" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => actions.openDevice(device.id, 'deviceAlert')} theme={theme} title="异常详情" variant="ghost" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceAlertScreen({ actions, device, theme }: { actions: AdminActions; device: DeviceRecord; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <BackHeader actions={actions} backRoute="deviceDetail" subtitle={`${device.name} · ${device.adb}`} theme={theme} title="设备异常详情" />
        <MFStatusCard message="ADB 连接异常，Worker 最近一次 report 未完成。建议先尝试恢复连接，再决定是否重启 Worker。" theme={theme} title="ADB 连接异常" tone="danger" />
        <MFCard theme={theme}>
          <MFStack gap={10}>
            <SectionTitle theme={theme} title="异常信息" />
            <MFKeyValue label="设备" theme={theme} value={device.name} />
            <MFKeyValue label="托管用户" theme={theme} value={device.user} />
            <MFKeyValue label="APP 版本" theme={theme} value={device.app} />
            <MFKeyValue label="恢复状态" theme={theme} value="未恢复" />
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={8}>
            <SectionTitle theme={theme} title="处理建议" />
            {['检查无障碍权限和悬浮窗权限', '重启 Worker 后重新 claim 当前任务', '必要时解绑并重新生成 device_token'].map((item) => (
              <MFCaption key={item} theme={theme}>
                {item}
              </MFCaption>
            ))}
          </MFStack>
        </MFCard>
        <MFButton onPress={() => actions.showToast('恢复连接指令已下发')} theme={theme} title="尝试恢复连接" />
      </MFStack>
    </MFScrollPage>
  );
}

function ProfileScreen({ actions, theme }: { actions: AdminActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={16}>
        <Header title="我的" subtitle="管理员资料、系统设置、权限和操作日志" theme={theme} />
        <MFCard glass theme={theme}>
          <MFRow gap={14}>
            <View style={{ alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }}>
              <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 24, fontWeight: '900' }}>
                A
              </MFText>
            </View>
            <MFStack gap={4} style={{ flex: 1 }}>
              <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                Admin
              </MFText>
              <MFCaption theme={theme}>超级管理员 · 全局权限</MFCaption>
            </MFStack>
            <MFBadge label="在线" tone="success" theme={theme} />
          </MFRow>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          {profileEntries.map((entry, index, rows) => (
            <View key={entry.title}>
              <MFListItem meta={entry.meta} onPress={() => actions.openSheet(entry.title, `${entry.title} 后续会接入独立子页面。`)} theme={theme} title={entry.title} />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFButton onPress={() => actions.goLogin()} theme={theme} title="退出登录" variant="danger" />
      </MFStack>
    </MFScrollPage>
  );
}

function Header({
  onRightPress,
  rightLabel,
  subtitle,
  theme,
  title
}: {
  onRightPress?: () => void;
  rightLabel?: string;
  subtitle: string;
  theme: MFTheme;
  title: string;
}) {
  return (
    <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <MFStack gap={4} style={{ flex: 1 }}>
        <MFHeading theme={theme}>{title}</MFHeading>
        <MFCaption theme={theme}>{subtitle}</MFCaption>
      </MFStack>
      {rightLabel && onRightPress ? <MFButton fullWidth={false} onPress={onRightPress} theme={theme} title={rightLabel} variant="secondary" /> : null}
    </MFRow>
  );
}

function BackHeader({
  actions,
  backRoute,
  backTab,
  subtitle,
  theme,
  title
}: {
  actions: AdminActions;
  backRoute?: RouteKey;
  backTab?: MainTab;
  subtitle: string;
  theme: MFTheme;
  title: string;
}) {
  return (
    <MFStack gap={10}>
      <MFButton
        fullWidth={false}
        onPress={() => {
          if (backRoute) {
            actions.goRoute(backRoute);
            return;
          }

          actions.goTabs(backTab);
        }}
        theme={theme}
        title="返回"
        variant="ghost"
      />
      <Header subtitle={subtitle} theme={theme} title={title} />
    </MFStack>
  );
}

function SectionTitle({
  action,
  onAction,
  theme,
  title
}: {
  action?: string;
  onAction?: () => void;
  theme: MFTheme;
  title: string;
}) {
  return (
    <MFRow style={{ justifyContent: 'space-between' }}>
      <MFText theme={theme} style={{ fontSize: 17, fontWeight: '900' }}>
        {title}
      </MFText>
      {action && onAction ? (
        <Pressable accessibilityRole="button" onPress={onAction}>
          <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '800' }}>
            {action}
          </MFText>
        </Pressable>
      ) : null}
    </MFRow>
  );
}

function TaskSummaryCard({
  task,
  theme
}: {
  task: {
    device: string;
    progress: number;
    status: string;
    title: string;
    user: string;
  };
  theme: MFTheme;
}) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={10}>
        <MFRow style={{ justifyContent: 'space-between' }}>
          <MFStack gap={3} style={{ flex: 1 }}>
            <MFText theme={theme} style={{ fontWeight: '900' }}>
              {task.title}
            </MFText>
            <MFCaption theme={theme}>
              {task.user} · {task.device}
            </MFCaption>
          </MFStack>
          <MFBadge label={task.status} tone="info" theme={theme} />
        </MFRow>
        <MFProgress label="当前进度" theme={theme} value={task.progress} />
      </MFStack>
    </MFCard>
  );
}

function TaskBadge({ status, theme }: { status: string; theme: MFTheme }) {
  const mapping: Record<string, { label: string; tone: Tone }> = {
    failed: { label: '失败', tone: 'danger' },
    finished: { label: '完成', tone: 'success' },
    running: { label: '执行中', tone: 'info' }
  };
  const badge = mapping[status] ?? { label: '执行中', tone: 'info' as const };
  return <MFBadge label={badge.label} tone={badge.tone} theme={theme} />;
}

function LogoMark({ size, theme }: { size: number; theme: MFTheme }) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: Math.round(size / 3.6),
        height: size,
        justifyContent: 'center',
        width: size
      }}
    >
      <MFText theme={theme} style={{ color: '#FFFFFF', fontSize: Math.round(size * 0.42), fontWeight: '900', lineHeight: Math.round(size * 0.48) }}>
        GH
      </MFText>
    </View>
  );
}

function MainTabBar({ actions, activeTab, theme }: { actions: AdminActions; activeTab: MainTab; theme: MFTheme }) {
  return (
    <MFTabBar
      items={tabs.map((item) => ({ badge: item.badge, label: item.label, value: item.key }))}
      onChange={actions.setTab}
      style={{ bottom: 12, left: 12, position: 'absolute', right: 12 }}
      theme={theme}
      value={activeTab}
    />
  );
}

export default App;
