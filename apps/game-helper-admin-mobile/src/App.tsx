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
type Tone = 'info' | 'success' | 'warning' | 'danger';

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

const devices = [
  { adb: 'ADB 正常', app: 'v0.3.2', name: 'Pixel 7 Pro', status: '在线', tone: 'success' as const, user: '用户 A' },
  { adb: 'ADB 异常', app: 'v0.3.2', name: 'Redmi K70', status: '异常', tone: 'danger' as const, user: '用户 D' },
  { adb: 'Worker 离线', app: 'v0.3.1', name: 'Galaxy S24', status: '离线', tone: 'warning' as const, user: '用户 K' }
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
  const [taskFilter, setTaskFilter] = useState<'running' | 'failed' | 'finished'>('running');

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
      setTab(nextTab);
      setScreen('main');
    },
    openSheet: (title: string, body: string) => openShellSheet({ body, title }),
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
        {screen === 'main' ? <MainScreen actions={actions} activeTab={tab} deviceFilter={deviceFilter} taskFilter={taskFilter} theme={theme} /> : null}
        <MFToastHost toast={toast} theme={theme} />
        <MFSheetHost onClose={closeSheet} sheet={sheet} theme={theme} />
      </View>
    </MFAppProvider>
  );
}

type AdminActions = {
  goLogin: () => void;
  goMain: (nextTab?: MainTab) => void;
  openSheet: (title: string, body: string) => void;
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
  taskFilter,
  theme
}: {
  actions: AdminActions;
  activeTab: MainTab;
  deviceFilter: 'all' | 'online' | 'alert';
  taskFilter: 'running' | 'failed' | 'finished';
  theme: MFTheme;
}) {
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
        <Header title="设备" subtitle="设备在线状态、绑定和 Worker 管理" theme={theme} rightLabel="待绑定" onRightPress={() => actions.openSheet('待绑定设备', '9X7Q-2M4K-8L3R 等待绑定。Phase 2 会接入扫码和绑定码查询。')} />
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
                <MFButton fullWidth={false} onPress={() => actions.showToast(`${device.name} 测试连接已下发`)} theme={theme} title="测试连接" variant="secondary" />
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
        <Header title="管理" subtitle="托管用户、游戏模块和 APP 发版中心" theme={theme} rightLabel="新增" onRightPress={() => actions.openSheet('新增入口', '可新增托管用户、模块分组或具体任务模块。')} />
        <MFCard padded={false} theme={theme}>
          {managementEntries.map((entry, index) => (
            <View key={entry.title}>
              <MFListItem
                meta={entry.meta}
                onPress={() => actions.openSheet(entry.target, `${entry.target} 页面将按原型继续拆分列表、详情、编辑、排序和确认弹窗。`)}
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
