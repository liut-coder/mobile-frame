import { View } from 'react-native';

import { PermissionGate, canAccess, useAdminSession, type AdminPermission } from '@mobile-frame/auth-admin';
import type { RealtimeConnectionSnapshot, TaskRealtimeLogEntry } from '@mobile-frame/realtime';
import {
  AdminBoundaryCard,
  AdminPageHeader,
  EntityListItem,
  LogViewer,
  ManagementEntryList,
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
  dashboardAlerts,
  dashboardSummary,
  devices,
  findDevice,
  findTask,
  getDeviceStatusLabel,
  getTaskStatusLabel,
  managementEntries,
  statusTone,
  tasks,
  type DeviceRecord,
  type TaskRecord
} from '../store';
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
  const { alerts, connection } = useRealtimeGlobalAlerts();
  const activeAlerts =
    alerts.length > 0
      ? alerts
      : dashboardAlerts.map((alert, index) => ({
          createdAt: `fixture-${index}`,
          id: alert.title,
          message: alert.message,
          title: alert.title,
          tone: alert.tone
        }));

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
        <DashboardStatGrid />
        {activeAlerts.map((alert) => (
          <MFBanner key={alert.id} message={alert.message} theme={appTheme} title={alert.title} tone={alert.tone} />
        ))}
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="Recent devices" />
          {devices.slice(0, 2).map((device) => (
            <DeviceListItem compact device={device} key={device.id} onPress={() => onOpenDevice(device.id)} />
          ))}
        </MFStack>
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="Active tasks" />
          {tasks.slice(0, 2).map((task) => (
            <TaskListItem compact key={task.id} onPress={() => onOpenTask(task.id)} task={task} />
          ))}
        </MFStack>
      </MFStack>
    </MFScrollPage>
  );
}

export function DeviceListScreen({ onOpenDevice }: DeviceListScreenProps) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Devices"
          subtitle="Paginated and filterable device status surface for the administrator mobile app."
          theme={appTheme}
          title="Device fleet"
        />
        <MFSearchBar placeholder="Search device, user, or app version" theme={appTheme} value="" />
        <MFRow gap={appTheme.spacing.sm}>
          <StatusBadge label="All 3" theme={appTheme} tone="info" />
          <StatusBadge label="Online 1" theme={appTheme} tone="success" />
          <StatusBadge label="Attention 2" theme={appTheme} tone="warning" />
        </MFRow>
        <MFStack gap={appTheme.spacing.md}>
          {devices.map((device) => (
            <DeviceListItem device={device} key={device.id} onPress={() => onOpenDevice(device.id)} />
          ))}
        </MFStack>
      </MFStack>
    </MFScrollPage>
  );
}

export function DeviceDetailScreen({ deviceId, onBack, onOpenTask }: DeviceDetailScreenProps) {
  const { connection, snapshot } = useRealtimeDeviceStatus(deviceId);
  const device = findDevice(deviceId);

  if (!device) {
    return <MissingEntityScreen entity="device" onBack={onBack} />;
  }

  const currentTask = device.currentTaskId ? findTask(device.currentTaskId) : undefined;
  const latestAppVersion = snapshot?.appVersion ?? device.appVersion;
  const latestHeartbeat = snapshot?.heartbeat ?? device.heartbeat;
  const latestRisk = snapshot?.risk ?? device.risk;
  const latestStatus = snapshot?.status ?? device.status;
  const latestWorker = snapshot?.worker ?? device.worker;

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
        <MFRow gap={appTheme.spacing.sm}>
          <PermissionGate permission="device.bind">
            <MFButton fullWidth={false} theme={appTheme} title="Scan bind" variant="secondary" />
          </PermissionGate>
          <MFButton fullWidth={false} theme={appTheme} title="Copy ID" variant="outline" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

export function TaskListScreen({ onOpenTask }: TaskListScreenProps) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Tasks"
          subtitle="Monitor progress, stop failed runs, retry recoverable jobs, and inspect logs."
          theme={appTheme}
          title="Task queue"
        />
        <MFSearchBar placeholder="Search task, user, or device" theme={appTheme} value="" />
        <MFRow gap={appTheme.spacing.sm}>
          <StatusBadge label="Running" theme={appTheme} tone="info" />
          <StatusBadge label="Failed" theme={appTheme} tone="danger" />
          <StatusBadge label="Queued" theme={appTheme} tone="warning" />
        </MFRow>
        <MFStack gap={appTheme.spacing.md}>
          {tasks.map((task) => (
            <TaskListItem key={task.id} onPress={() => onOpenTask(task.id)} task={task} />
          ))}
        </MFStack>
      </MFStack>
    </MFScrollPage>
  );
}

export function TaskDetailScreen({ onBack, onOpenDevice, taskId }: TaskDetailScreenProps) {
  const { connection, snapshot } = useRealtimeTaskProgress(taskId);
  const task = findTask(taskId);

  if (!task) {
    return <MissingEntityScreen entity="task" onBack={onBack} />;
  }

  const latestCurrentStep = snapshot?.currentStep ?? task.currentStep;
  const latestLogs = mergeRealtimeLog(task.logs, snapshot?.log);
  const latestProgress = snapshot?.progress ?? task.progress;
  const latestStatus = snapshot?.status ?? task.status;
  const latestSteps = snapshot?.steps ?? task.steps;

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
        <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
          <PermissionGate permission="task.stop">
            <MFButton fullWidth={false} theme={appTheme} title="Stop" variant="danger" />
          </PermissionGate>
          <PermissionGate permission="task.retry">
            <MFButton fullWidth={false} theme={appTheme} title="Retry" variant="secondary" />
          </PermissionGate>
          <PermissionGate permission="device.view">
            <MFButton fullWidth={false} onPress={() => onOpenDevice(task.deviceId)} theme={appTheme} title="Device" variant="outline" />
          </PermissionGate>
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
        <AdminBoundaryCard items={adminBoundaries} theme={appTheme} />
      </MFStack>
    </MFScrollPage>
  );
}

export function ProfileScreen() {
  const session = useAdminSession() ?? adminSession;

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
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.sm}>
            <SectionTitle title="/api/v1/mobile boundary" />
            {bffContracts.map((contract) => (
              <MFText key={contract} theme={appTheme} style={codeTextStyle()}>
                {contract}
              </MFText>
            ))}
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

function DashboardStatGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: appTheme.spacing.md }}>
      {dashboardSummary.map((item) => (
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
