import { useState } from 'react';
import { View } from 'react-native';

import { PermissionGate, canAccess, useAdminSession, type AdminPermission } from '@mobile-frame/auth-admin';
import type { RealtimeConnectionSnapshot, TaskRealtimeLogEntry } from '@mobile-frame/realtime';
import {
  AdminBoundaryCard,
  AdminPageHeader,
  EntityListItem,
  FilterSheet,
  InfiniteList,
  LogViewer,
  ManagementEntryList,
  SegmentTabs,
  StatCard,
  StatusBadge,
  TaskProgressCard,
  Timeline
} from '@mobile-frame/ui-admin';
import {
  MFBanner,
  MFButton,
  MFCard,
  MFFormField,
  MFInfoRow,
  MFInput,
  MFPage,
  MFPasswordInput,
  MFProgress,
  MFRow,
  MFScrollPage,
  MFSearchBar,
  MFStack,
  MFText
} from '@mobile-frame/ui-native';

import {
  adminBoundaries,
  adminSession,
  bffContracts,
  getDeviceStatusLabel,
  getTaskStatusLabel,
  managementEntries,
  statusTone,
  type AdminTone,
  type DeviceRecord,
  type TaskRecord
} from '../store';
import {
  adminMobileBffClient,
  useMobileBffAssets,
  useMobileBffDashboard,
  useMobileBffDevice,
  useMobileBffDevices,
  useMobileBffModules,
  useMobileBffReleases,
  useMobileBffRuntimeLogs,
  useMobileBffTask,
  useMobileBffTaskLogs,
  useMobileBffTasks,
  useMobileBffUsers
} from '../services/mobile-bff';
import { adminNativeActions } from '../services/native-actions';
import { useRealtimeDeviceStatus, useRealtimeGlobalAlerts, useRealtimeTaskProgress } from '../services/realtime';
import { appTheme } from '../theme';

type LoginScreenProps = {
  onLogin: () => void;
};

type DashboardScreenProps = {
  onOpenDevice: (deviceId: string) => void;
  onOpenTask: (taskId: string) => void;
};

type DeviceListScreenProps = {
  onOpenDevice: (deviceId: string) => void;
};

type DeviceDetailScreenProps = {
  deviceId: string;
  onBack: () => void;
  onOpenTask: (taskId: string) => void;
};

type TaskListScreenProps = {
  onOpenTask: (taskId: string) => void;
};

type TaskDetailScreenProps = {
  onBack: () => void;
  onOpenDevice: (deviceId: string) => void;
  taskId: string;
};

type PermissionDeniedScreenProps = {
  onBack?: () => void;
  permissions: AdminPermission[];
  title: string;
};

type DeviceListSegment = 'all' | 'online' | 'attention';
type TaskListSegment = 'all' | TaskRecord['status'];
type NativeActionFeedback = {
  message: string;
  title: string;
  tone: AdminTone;
};

const listPageSize = 2;

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <MFPage centered theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Admin mobile"
          subtitle="Sign in with administrator credentials backed by the mobile BFF boundary."
          theme={appTheme}
          title="Game Helper Admin"
        />
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.md}>
            <MFFormField label="Tenant" theme={appTheme}>
              <MFInput editable={false} theme={appTheme} value={adminSession.tenantId} />
            </MFFormField>
            <MFFormField label="Account" required theme={appTheme}>
              <MFInput autoCapitalize="none" theme={appTheme} value="ops.admin@example.com" />
            </MFFormField>
            <MFFormField helperText="Token storage belongs in Keychain or Android Keystore." label="Password" required theme={appTheme}>
              <MFPasswordInput theme={appTheme} value="mobile-frame-demo" />
            </MFFormField>
            <MFButton onPress={onLogin} theme={appTheme} title="Sign in" />
          </MFStack>
        </MFCard>
        <AdminBoundaryCard items={adminBoundaries} theme={appTheme} />
      </MFStack>
    </MFPage>
  );
}

export function DashboardScreen({ onOpenDevice, onOpenTask }: DashboardScreenProps) {
  const dashboard = useMobileBffDashboard();
  const { alerts, connection } = useRealtimeGlobalAlerts();
  const activeAlerts = alerts.length > 0 ? alerts : dashboard.alerts;

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Overview"
          subtitle="Realtime summary for devices, task progress, failures, approvals, and release status."
          theme={appTheme}
          title="Operations overview"
        />
        <RealtimeConnectionSummary connection={connection} />
        <DashboardStatGrid metrics={dashboard.metrics} />
        {activeAlerts.map((alert) => (
          <MFBanner key={alert.id} message={alert.message} theme={appTheme} title={alert.title} tone={alert.tone} />
        ))}
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="Recent devices" />
          {dashboard.recentDevices.map((device) => (
            <DeviceListItem compact device={device} key={device.id} onPress={() => onOpenDevice(device.id)} />
          ))}
        </MFStack>
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="Active tasks" />
          {dashboard.activeTasks.map((task) => (
            <TaskListItem compact key={task.id} onPress={() => onOpenTask(task.id)} task={task} />
          ))}
        </MFStack>
      </MFStack>
    </MFScrollPage>
  );
}

export function DeviceListScreen({ onOpenDevice }: DeviceListScreenProps) {
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<DeviceRecord['status'][]>([]);
  const [segment, setSegment] = useState<DeviceListSegment>('all');
  const [visibleCount, setVisibleCount] = useState(listPageSize);
  const requestedStatuses = selectedStatuses.length > 0 ? selectedStatuses : deviceStatusesForSegment(segment);
  const deviceList = useMobileBffDevices({ limit: visibleCount, query, statuses: requestedStatuses });
  const deviceFilterOptions = deviceList.facets;
  const deviceSegmentOptions = [
    { label: `All ${sumFacetCount(deviceList.facets)}`, value: 'all' },
    { label: `Online ${facetCount(deviceList.facets, 'online')}`, value: 'online' },
    { label: `Attention ${facetCount(deviceList.facets, 'warning') + facetCount(deviceList.facets, 'offline')}`, value: 'attention' }
  ] satisfies Array<{ label: string; value: DeviceListSegment }>;

  const changeSegment = (value: DeviceListSegment) => {
    setSegment(value);
    setSelectedStatuses([]);
    setVisibleCount(listPageSize);
  };

  const toggleStatus = (status: DeviceRecord['status']) => {
    setSelectedStatuses((current) => (current.includes(status) ? current.filter((item) => item !== status) : [...current, status]));
    setVisibleCount(listPageSize);
  };

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSegment('all');
    setVisibleCount(listPageSize);
  };

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Devices"
          subtitle="Paginated and filterable device status surface for the administrator mobile app."
          theme={appTheme}
          title="Device fleet"
        />
        <MFSearchBar
          onChangeText={(value) => {
            setQuery(value);
            setVisibleCount(listPageSize);
          }}
          placeholder="Search device, user, or app version"
          theme={appTheme}
          value={query}
        />
        <SegmentTabs onChange={changeSegment} options={deviceSegmentOptions} theme={appTheme} value={segment} />
        <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
          <StatusBadge label={`Showing ${deviceList.total}`} theme={appTheme} tone="info" />
          <StatusBadge label={`Filters ${selectedStatuses.length}`} theme={appTheme} tone={selectedStatuses.length > 0 ? 'warning' : 'neutral'} />
          <MFButton fullWidth={false} onPress={() => setFilterSheetVisible(true)} theme={appTheme} title="Filters" variant="outline" />
        </MFRow>
        <InfiniteList
          emptyMessage="No devices match the current status filters."
          emptyTitle="No devices"
          hasMore={Boolean(deviceList.nextCursor)}
          items={deviceList.items}
          keyExtractor={(device) => device.id}
          loadMoreLabel="Load more devices"
          onLoadMore={() => setVisibleCount((current) => Math.min(current + listPageSize, deviceList.total))}
          renderItem={(device) => <DeviceListItem device={device} onPress={() => onOpenDevice(device.id)} />}
          summary={`Showing ${deviceList.items.length} of ${deviceList.total} devices`}
          theme={appTheme}
        />
        <FilterSheet
          onApply={() => setFilterSheetVisible(false)}
          onClose={() => setFilterSheetVisible(false)}
          onReset={resetFilters}
          onToggle={toggleStatus}
          options={deviceFilterOptions}
          selectedValues={selectedStatuses}
          subtitle="Combine status filters for the mobile device fleet list."
          theme={appTheme}
          title="Filter devices"
          visible={filterSheetVisible}
        />
      </MFStack>
    </MFScrollPage>
  );
}

export function DeviceDetailScreen({ deviceId, onBack, onOpenTask }: DeviceDetailScreenProps) {
  const [nativeFeedback, setNativeFeedback] = useState<NativeActionFeedback | null>(null);
  const { connection, snapshot } = useRealtimeDeviceStatus(deviceId);
  const device = useMobileBffDevice(deviceId);
  const currentTask = useMobileBffTask(device?.currentTaskId ?? null);

  if (!device) {
    return <MissingEntityScreen entity="device" onBack={onBack} />;
  }

  const latestAppVersion = snapshot?.appVersion ?? device.appVersion;
  const latestHeartbeat = snapshot?.heartbeat ?? device.heartbeat;
  const latestRisk = snapshot?.risk ?? device.risk;
  const latestStatus = snapshot?.status ?? device.status;
  const latestWorker = snapshot?.worker ?? device.worker;

  const scanBindCode = async () => {
    const result = await adminNativeActions.scanner.scanQRCode();

    if (!result.ok) {
      setNativeFeedback(nativeFailure('Scan bind', result.error));
      return;
    }

    setNativeFeedback(
      result.data
        ? await bindScannedDevice(device.id, result.data.value)
        : { message: 'No QR code result is available from the native adapter.', title: 'Scan bind', tone: 'warning' }
    );
  };

  const copyDeviceId = async () => {
    const result = await adminNativeActions.clipboard.copy(device.id);

    setNativeFeedback(result.ok ? { message: `Copied ${device.id}`, title: 'Copy device ID', tone: 'success' } : nativeFailure('Copy device ID', result.error));
  };

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          backLabel="Devices"
          eyebrow={device.id}
          onBack={onBack}
          right={<StatusBadge label={getDeviceStatusLabel(latestStatus)} theme={appTheme} tone={statusTone(latestStatus)} />}
          subtitle={`${device.owner} - ${device.model}`}
          theme={appTheme}
          title="Device detail"
        />
        <RealtimeConnectionSummary connection={connection} />
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.md}>
            <MFInfoRow label="App version" theme={appTheme} value={latestAppVersion} />
            <MFInfoRow label="Battery" theme={appTheme} value={`${device.battery}%`} />
            <MFInfoRow label="Last heartbeat" theme={appTheme} value={latestHeartbeat} />
            <MFInfoRow label="Worker health" theme={appTheme} value={latestWorker} />
            {latestRisk ? <MFInfoRow label="Risk" theme={appTheme} value={latestRisk} /> : null}
          </MFStack>
        </MFCard>
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="Current task" />
          {currentTask ? (
            <PermissionGate
              fallback={
                <MFText muted theme={appTheme}>
                  Task details require task.view permission.
                </MFText>
              }
              permission="task.view"
            >
              <TaskListItem compact onPress={() => onOpenTask(currentTask.id)} task={currentTask} />
            </PermissionGate>
          ) : (
            <MFText muted theme={appTheme}>
              No active task is assigned to this device.
            </MFText>
          )}
        </MFStack>
        <NativeActionBanner feedback={nativeFeedback} />
        <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
          <PermissionGate permission="device.bind">
            <MFButton fullWidth={false} onPress={scanBindCode} theme={appTheme} title="Scan bind" variant="secondary" />
          </PermissionGate>
          <MFButton fullWidth={false} onPress={copyDeviceId} theme={appTheme} title="Copy ID" variant="outline" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

export function TaskListScreen({ onOpenTask }: TaskListScreenProps) {
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<TaskRecord['status'][]>([]);
  const [segment, setSegment] = useState<TaskListSegment>('all');
  const [visibleCount, setVisibleCount] = useState(listPageSize);
  const requestedStatuses = selectedStatuses.length > 0 ? selectedStatuses : taskStatusesForSegment(segment);
  const taskList = useMobileBffTasks({ limit: visibleCount, query, statuses: requestedStatuses });
  const taskFilterOptions = taskList.facets;
  const taskSegmentOptions = [
    { label: `All ${sumFacetCount(taskList.facets)}`, value: 'all' },
    { label: `Running ${facetCount(taskList.facets, 'running')}`, value: 'running' },
    { label: `Failed ${facetCount(taskList.facets, 'failed')}`, value: 'failed' }
  ] satisfies Array<{ label: string; value: TaskListSegment }>;

  const changeSegment = (value: TaskListSegment) => {
    setSegment(value);
    setSelectedStatuses([]);
    setVisibleCount(listPageSize);
  };

  const toggleStatus = (status: TaskRecord['status']) => {
    setSelectedStatuses((current) => (current.includes(status) ? current.filter((item) => item !== status) : [...current, status]));
    setVisibleCount(listPageSize);
  };

  const resetFilters = () => {
    setSelectedStatuses([]);
    setSegment('all');
    setVisibleCount(listPageSize);
  };

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Tasks"
          subtitle="Monitor progress, stop failed runs, retry recoverable jobs, and inspect logs."
          theme={appTheme}
          title="Task queue"
        />
        <MFSearchBar
          onChangeText={(value) => {
            setQuery(value);
            setVisibleCount(listPageSize);
          }}
          placeholder="Search task, user, or device"
          theme={appTheme}
          value={query}
        />
        <SegmentTabs onChange={changeSegment} options={taskSegmentOptions} theme={appTheme} value={segment} />
        <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
          <StatusBadge label={`Showing ${taskList.total}`} theme={appTheme} tone="info" />
          <StatusBadge label={`Filters ${selectedStatuses.length}`} theme={appTheme} tone={selectedStatuses.length > 0 ? 'warning' : 'neutral'} />
          <MFButton fullWidth={false} onPress={() => setFilterSheetVisible(true)} theme={appTheme} title="Filters" variant="outline" />
        </MFRow>
        <InfiniteList
          emptyMessage="No tasks match the current status filters."
          emptyTitle="No tasks"
          hasMore={Boolean(taskList.nextCursor)}
          items={taskList.items}
          keyExtractor={(task) => task.id}
          loadMoreLabel="Load more tasks"
          onLoadMore={() => setVisibleCount((current) => Math.min(current + listPageSize, taskList.total))}
          renderItem={(task) => <TaskListItem onPress={() => onOpenTask(task.id)} task={task} />}
          summary={`Showing ${taskList.items.length} of ${taskList.total} tasks`}
          theme={appTheme}
        />
        <FilterSheet
          onApply={() => setFilterSheetVisible(false)}
          onClose={() => setFilterSheetVisible(false)}
          onReset={resetFilters}
          onToggle={toggleStatus}
          options={taskFilterOptions}
          selectedValues={selectedStatuses}
          subtitle="Combine status filters for task monitoring and triage."
          theme={appTheme}
          title="Filter tasks"
          visible={filterSheetVisible}
        />
      </MFStack>
    </MFScrollPage>
  );
}

export function TaskDetailScreen({ onBack, onOpenDevice, taskId }: TaskDetailScreenProps) {
  const [nativeFeedback, setNativeFeedback] = useState<NativeActionFeedback | null>(null);
  const { connection, snapshot } = useRealtimeTaskProgress(taskId);
  const task = useMobileBffTask(taskId);
  const taskLogs = useMobileBffTaskLogs(taskId);

  if (!task) {
    return <MissingEntityScreen entity="task" onBack={onBack} />;
  }

  const latestCurrentStep = snapshot?.currentStep ?? task.currentStep;
  const latestLogs = mergeRealtimeLog(taskLogs.items, snapshot?.log);
  const latestProgress = snapshot?.progress ?? task.progress;
  const latestStatus = snapshot?.status ?? task.status;
  const latestSteps = snapshot?.steps ?? task.steps;

  const copyTaskId = async () => {
    const result = await adminNativeActions.clipboard.copy(task.id);

    setNativeFeedback(result.ok ? { message: `Copied ${task.id}`, title: 'Copy task ID', tone: 'success' } : nativeFailure('Copy task ID', result.error));
  };

  const copyErrorInfo = async () => {
    const errorInfo = task.error ?? 'No task error is available.';
    const result = await adminNativeActions.clipboard.copy(errorInfo);

    setNativeFeedback(result.ok ? { message: 'Copied task error information.', title: 'Copy error', tone: 'success' } : nativeFailure('Copy error', result.error));
  };

  const shareTaskLogs = async () => {
    const logText = formatTaskLogs(task.id, latestLogs);
    const result = await adminNativeActions.share.shareText(logText);

    setNativeFeedback(result.ok ? { message: 'Shared task logs through the native adapter.', title: 'Share logs', tone: 'success' } : nativeFailure('Share logs', result.error));
  };

  const stopTask = async () => {
    try {
      const receipt = await adminMobileBffClient.stopTask(task.id);
      setNativeFeedback({ message: `${receipt.action} accepted for ${receipt.id}.`, title: 'Stop task', tone: 'warning' });
    } catch (error) {
      setNativeFeedback(serviceFailure('Stop task', error));
    }
  };

  const retryTask = async () => {
    try {
      const receipt = await adminMobileBffClient.retryTask(task.id);
      setNativeFeedback({ message: `${receipt.action} accepted for ${receipt.id}.`, title: 'Retry task', tone: 'success' });
    } catch (error) {
      setNativeFeedback(serviceFailure('Retry task', error));
    }
  };

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          backLabel="Tasks"
          eyebrow={task.id}
          onBack={onBack}
          right={<StatusBadge label={getTaskStatusLabel(latestStatus)} theme={appTheme} tone={statusTone(latestStatus)} />}
          subtitle={`${task.owner} - ${task.deviceName}`}
          theme={appTheme}
          title={task.name}
        />
        <RealtimeConnectionSummary connection={connection} />
        <TaskProgressCard
          currentStep={`Current step: ${latestCurrentStep}`}
          error={task.error ? { message: task.error, title: 'Failure reason' } : undefined}
          progress={progressRatio(latestProgress)}
          progressLabel={`Progress ${progressCountLabel(latestProgress)} - started ${task.startedAt}`}
          status={{ label: getTaskStatusLabel(latestStatus), tone: statusTone(latestStatus) }}
          subtitle={`${task.owner} - ${task.deviceName}`}
          theme={appTheme}
          title={task.name}
        />
        <NativeActionBanner feedback={nativeFeedback} />
        <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
          <PermissionGate permission="task.stop">
            <MFButton fullWidth={false} onPress={stopTask} theme={appTheme} title="Stop" variant="danger" />
          </PermissionGate>
          <PermissionGate permission="task.retry">
            <MFButton fullWidth={false} onPress={retryTask} theme={appTheme} title="Retry" variant="secondary" />
          </PermissionGate>
          <PermissionGate permission="device.view">
            <MFButton fullWidth={false} onPress={() => onOpenDevice(task.deviceId)} theme={appTheme} title="Device" variant="outline" />
          </PermissionGate>
          <MFButton fullWidth={false} onPress={copyTaskId} theme={appTheme} title="Copy ID" variant="outline" />
          <MFButton fullWidth={false} onPress={copyErrorInfo} theme={appTheme} title="Copy error" variant="outline" />
          <MFButton fullWidth={false} onPress={shareTaskLogs} theme={appTheme} title="Share logs" variant="secondary" />
        </MFRow>
        <Timeline
          items={latestSteps.map((step) => ({
            label: step.label,
            state: step.state,
            time: step.time,
            tone: statusTone(step.state)
          }))}
          theme={appTheme}
        />
        <LogViewer entries={latestLogs.map((log) => ({ level: log.level, message: log.message, time: log.time }))} theme={appTheme} />
      </MFStack>
    </MFScrollPage>
  );
}

export function ManagementHomeScreen() {
  const session = useAdminSession();
  const assetList = useMobileBffAssets({ limit: listPageSize });
  const moduleList = useMobileBffModules({ limit: listPageSize });
  const releaseList = useMobileBffReleases({ limit: listPageSize });
  const runtimeLogList = useMobileBffRuntimeLogs({ limit: listPageSize });
  const userList = useMobileBffUsers({ limit: listPageSize });
  const visibleEntries = managementEntries.filter((entry) => canAccess(session, { permission: entry.permission }));

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Management"
          subtitle="Second-level entry points keep the bottom navigation focused and mobile friendly."
          theme={appTheme}
          title="Management"
        />
        {visibleEntries.length > 0 ? (
          <ManagementEntryList entries={visibleEntries} theme={appTheme} />
        ) : (
          <MFText muted theme={appTheme}>
            No management entries are available for the current administrator permissions.
          </MFText>
        )}
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="/api/v1/mobile previews" />
          <MFText muted theme={appTheme} style={captionTextStyle()}>
            Fixture-backed management data from the mobile BFF boundary; full second-stage pages remain planned separately.
          </MFText>
          {canAccess(session, { permission: 'user.view' }) ? (
            <EntityListItem
              badge={`Total ${userList.total}`}
              meta="GET /api/v1/mobile/users"
              status={{ label: `${facetCount(userList.facets, 'active')} active`, tone: 'success' }}
              subtitle={userList.items.map((user) => `${user.name} (${user.status})`).join(' - ')}
              theme={appTheme}
              title="Managed users"
            />
          ) : null}
          {canAccess(session, { permission: 'module.view' }) ? (
            <EntityListItem
              badge={`Total ${moduleList.total}`}
              meta="GET /api/v1/mobile/modules"
              status={{ label: `${facetCount(moduleList.facets, 'enabled')} enabled`, tone: 'success' }}
              subtitle={moduleList.items.map((module) => `${module.name} v${module.version}`).join(' - ')}
              theme={appTheme}
              title="Game modules"
            />
          ) : null}
          {canAccess(session, { permission: 'asset.view' }) ? (
            <EntityListItem
              badge={`Total ${assetList.total}`}
              meta="GET /api/v1/mobile/assets"
              status={{ label: `${facetCount(assetList.facets, 'review')} review`, tone: facetCount(assetList.facets, 'review') > 0 ? 'warning' : 'neutral' }}
              subtitle={assetList.items.map((asset) => `${asset.name} (${asset.kind})`).join(' - ')}
              theme={appTheme}
              title="Visual assets"
            />
          ) : null}
          {canAccess(session, { permission: 'app.release.view' }) ? (
            <EntityListItem
              badge={`Total ${releaseList.total}`}
              meta="GET /api/v1/mobile/releases"
              status={{ label: `${facetCount(releaseList.facets, 'staged')} staged`, tone: facetCount(releaseList.facets, 'staged') > 0 ? 'warning' : 'neutral' }}
              subtitle={releaseList.items.map((release) => `${release.version} ${release.status}`).join(' - ')}
              theme={appTheme}
              title="App releases"
            />
          ) : null}
          {canAccess(session, { permission: 'log.view' }) ? (
            <EntityListItem
              badge={`Total ${runtimeLogList.total}`}
              meta="GET /api/v1/mobile/logs"
              status={{ label: `${facetCount(runtimeLogList.facets, 'error')} error`, tone: facetCount(runtimeLogList.facets, 'error') > 0 ? 'danger' : 'neutral' }}
              subtitle={runtimeLogList.items.map((log) => `${log.scope}: ${log.level}`).join(' - ')}
              theme={appTheme}
              title="Running logs"
            />
          ) : null}
        </MFStack>
        <AdminBoundaryCard items={adminBoundaries} theme={appTheme} />
      </MFStack>
    </MFScrollPage>
  );
}

export function ProfileScreen() {
  const [nativeFeedback, setNativeFeedback] = useState<NativeActionFeedback | null>(null);
  const session = useAdminSession() ?? adminSession;

  const openMobileBffDocs = async () => {
    const result = await adminNativeActions.browser.open('https://github.com/liut-coder/mobile-frame');

    setNativeFeedback(
      result.ok
        ? { message: `Opened ${result.data.url}`, title: 'Open external link', tone: 'success' }
        : nativeFailure('Open external link', result.error)
    );
  };

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Mine"
          subtitle="Administrator identity, permission snapshot, and integration contracts."
          theme={appTheme}
          title="Profile"
        />
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.md}>
            <MFInfoRow label="Name" theme={appTheme} value={session.name ?? 'Administrator'} />
            <MFInfoRow label="Role" theme={appTheme} value={session.role} />
            <MFInfoRow label="Tenant" theme={appTheme} value={session.tenantId} />
            <MFInfoRow label="Admin device" theme={appTheme} value={session.deviceId} />
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.sm}>
            <SectionTitle title="Permissions" />
            <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
              {session.permissions.map((permission) => (
                <StatusBadge key={permission} label={permission} theme={appTheme} tone="info" />
              ))}
            </MFRow>
          </MFStack>
        </MFCard>
        <NativeActionBanner feedback={nativeFeedback} />
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.sm}>
            <SectionTitle title="/api/v1/mobile boundary" />
            {bffContracts.map((contract) => (
              <MFText key={contract} theme={appTheme} style={codeTextStyle()}>
                {contract}
              </MFText>
            ))}
            <MFButton fullWidth={false} onPress={openMobileBffDocs} theme={appTheme} title="Open repo" variant="outline" />
          </MFStack>
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

export function PermissionDeniedScreen({ onBack, permissions, title }: PermissionDeniedScreenProps) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader backLabel={onBack ? 'Back' : undefined} eyebrow="Permission" onBack={onBack} theme={appTheme} title={title} />
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.md}>
            <MFText muted theme={appTheme}>
              The current administrator session does not include the required permission set.
            </MFText>
            <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
              {permissions.length > 0 ? (
                permissions.map((permission) => <StatusBadge key={permission} label={permission} theme={appTheme} tone="warning" />)
              ) : (
                <StatusBadge label="No extra permission required" theme={appTheme} tone="neutral" />
              )}
            </MFRow>
          </MFStack>
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function DashboardStatGrid({ metrics }: { metrics: Array<{ label: string; tone: AdminTone; value: string }> }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: appTheme.spacing.md }}>
      {metrics.map((item) => (
        <View key={item.label} style={{ flexBasis: '46%', flexGrow: 1 }}>
          <StatCard label={item.label} theme={appTheme} tone={item.tone} value={item.value} />
        </View>
      ))}
    </View>
  );
}

function DeviceListItem({ compact = false, device, onPress }: { compact?: boolean; device: DeviceRecord; onPress: () => void }) {
  const { snapshot } = useRealtimeDeviceStatus(device.id);
  const latestHeartbeat = snapshot?.heartbeat ?? device.heartbeat;
  const latestRisk = snapshot?.risk ?? device.risk;
  const latestStatus = snapshot?.status ?? device.status;

  return (
    <EntityListItem
      actionLabel={compact ? 'View' : undefined}
      meta={`App v${snapshot?.appVersion ?? device.appVersion} - Battery ${device.battery}% - ${latestHeartbeat}`}
      onPress={onPress}
      status={{ label: getDeviceStatusLabel(latestStatus), tone: statusTone(latestStatus) }}
      subtitle={`User: ${device.owner}`}
      theme={appTheme}
      title={`${device.model} - ${device.id}`}
    >
      {latestRisk ? (
        <MFText theme={appTheme} style={warningTextStyle()}>
          {latestRisk}
        </MFText>
      ) : null}
    </EntityListItem>
  );
}

function TaskListItem({ compact = false, onPress, task }: { compact?: boolean; onPress: () => void; task: TaskRecord }) {
  const { snapshot } = useRealtimeTaskProgress(task.id);
  const latestCurrentStep = snapshot?.currentStep ?? task.currentStep;
  const latestProgress = snapshot?.progress ?? task.progress;
  const latestStatus = snapshot?.status ?? task.status;

  return (
    <EntityListItem
      actionLabel={compact ? 'Details' : undefined}
      onPress={onPress}
      status={{ label: getTaskStatusLabel(latestStatus), tone: statusTone(latestStatus) }}
      subtitle={`${task.owner} - ${task.deviceName}`}
      theme={appTheme}
      title={task.name}
    >
      <MFProgress label={`${progressCountLabel(latestProgress)} - started ${task.startedAt}`} theme={appTheme} value={progressRatio(latestProgress)} />
      <MFText muted theme={appTheme} style={captionTextStyle()}>
        {latestCurrentStep}
      </MFText>
    </EntityListItem>
  );
}

function RealtimeConnectionSummary({ connection }: { connection: RealtimeConnectionSnapshot }) {
  const label = connection.fallback ? `Realtime ${connection.status} via ${connection.fallback}` : `Realtime ${connection.status}`;

  return (
    <MFRow gap={appTheme.spacing.sm} style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <StatusBadge label={label} theme={appTheme} tone={connectionTone(connection.status)} />
      <MFText muted theme={appTheme} style={captionTextStyle()}>
        {connection.lastEventAt ? `Last event ${connection.lastEventAt}` : `Transport ${connection.transport}`}
      </MFText>
    </MFRow>
  );
}

function MissingEntityScreen({ entity, onBack }: { entity: string; onBack: () => void }) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader backLabel="Back" eyebrow="Missing" onBack={onBack} theme={appTheme} title={`Unknown ${entity}`} />
        <MFText muted theme={appTheme}>
          The selected {entity} fixture is not available.
        </MFText>
      </MFStack>
    </MFScrollPage>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <MFText theme={appTheme} style={sectionTitleTextStyle()}>
      {title}
    </MFText>
  );
}

function NativeActionBanner({ feedback }: { feedback: NativeActionFeedback | null }) {
  return feedback ? <MFBanner message={feedback.message} theme={appTheme} title={feedback.title} tone={feedback.tone} /> : null;
}

function nativeFailure(title: string, error: { code: string; message: string; module: string }): NativeActionFeedback {
  return {
    message: `${error.module}.${error.code}: ${error.message}`,
    title,
    tone: 'danger'
  };
}

function serviceFailure(title: string, error: unknown): NativeActionFeedback {
  return {
    message: error instanceof Error ? error.message : 'Mobile BFF request failed.',
    title,
    tone: 'danger'
  };
}

async function bindScannedDevice(deviceId: string, code: string): Promise<NativeActionFeedback> {
  try {
    const receipt = await adminMobileBffClient.bindDevice(deviceId, { code });

    return { message: `${receipt.action} accepted for ${receipt.id}: ${code}`, title: 'Scan bind', tone: 'success' };
  } catch (error) {
    return serviceFailure('Scan bind', error);
  }
}

function formatTaskLogs(taskId: string, logs: TaskRecord['logs']): string {
  const logLines = logs.map((log) => `[${log.time}] ${log.level.toUpperCase()} ${log.message}`);

  return [`Task ${taskId}`, ...logLines].join('\n');
}

function connectionTone(status: RealtimeConnectionSnapshot['status']) {
  switch (status) {
    case 'open':
      return 'success';
    case 'polling':
    case 'reconnecting':
      return 'warning';
    case 'error':
      return 'danger';
    case 'closed':
    case 'connecting':
    case 'idle':
    default:
      return 'info';
  }
}

function deviceStatusesForSegment(segment: DeviceListSegment): DeviceRecord['status'][] {
  switch (segment) {
    case 'online':
      return ['online'];
    case 'attention':
      return ['warning', 'offline'];
    case 'all':
    default:
      return [];
  }
}

function taskStatusesForSegment(segment: TaskListSegment): TaskRecord['status'][] {
  if (segment === 'all') {
    return [];
  }

  return [segment];
}

function facetCount<TValue extends string>(facets: Array<{ count: number; value: TValue }>, value: TValue): number {
  return facets.find((facet) => facet.value === value)?.count ?? 0;
}

function sumFacetCount(facets: Array<{ count: number }>): number {
  return facets.reduce((total, facet) => total + facet.count, 0);
}

function mergeRealtimeLog(logs: TaskRecord['logs'], latestLog: TaskRealtimeLogEntry | undefined): TaskRecord['logs'] {
  if (!latestLog) {
    return logs;
  }

  const lastLog = logs[logs.length - 1];

  if (lastLog?.level === latestLog.level && lastLog.message === latestLog.message && lastLog.time === latestLog.time) {
    return logs;
  }

  return [...logs, latestLog];
}

function progressCountLabel(progress: TaskRecord['progress']) {
  return `${progress.done} / ${progress.total}`;
}

function progressRatio(progress: TaskRecord['progress']) {
  if (progress.total <= 0) {
    return 0;
  }

  return progress.done / progress.total;
}

function sectionTitleTextStyle() {
  return {
    fontSize: appTheme.typography.size.title3,
    fontWeight: '800' as const,
    lineHeight: appTheme.typography.lineHeight.title3
  };
}

function captionTextStyle() {
  return {
    fontSize: appTheme.typography.size.caption,
    lineHeight: appTheme.typography.lineHeight.caption
  };
}

function warningTextStyle() {
  return {
    ...captionTextStyle(),
    color: appTheme.colors.warning,
    fontWeight: '800' as const
  };
}

function codeTextStyle() {
  return {
    fontFamily: appTheme.typography.family.mono,
    ...captionTextStyle()
  };
}
