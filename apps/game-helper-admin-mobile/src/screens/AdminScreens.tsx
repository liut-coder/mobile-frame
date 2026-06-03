import { View } from 'react-native';

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
  progressLabel,
  progressValue,
  statusTone,
  tasks,
  type DeviceRecord,
  type TaskRecord
} from '../store';
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
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Overview"
          subtitle="Realtime summary for devices, task progress, failures, approvals, and release status."
          theme={appTheme}
          title="Operations overview"
        />
        <DashboardStatGrid />
        {dashboardAlerts.map((alert) => (
          <MFBanner key={alert.title} message={alert.message} theme={appTheme} title={alert.title} tone={alert.tone} />
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
  const device = findDevice(deviceId);

  if (!device) {
    return <MissingEntityScreen entity="device" onBack={onBack} />;
  }

  const currentTask = device.currentTaskId ? findTask(device.currentTaskId) : undefined;

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          backLabel="Devices"
          eyebrow={device.id}
          onBack={onBack}
          right={<StatusBadge label={getDeviceStatusLabel(device.status)} theme={appTheme} tone={statusTone(device.status)} />}
          subtitle={`${device.owner} - ${device.model}`}
          theme={appTheme}
          title="Device detail"
        />
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.md}>
            <MFInfoRow label="App version" theme={appTheme} value={device.appVersion} />
            <MFInfoRow label="Battery" theme={appTheme} value={`${device.battery}%`} />
            <MFInfoRow label="Last heartbeat" theme={appTheme} value={device.heartbeat} />
            <MFInfoRow label="Worker health" theme={appTheme} value={device.worker} />
            {device.risk ? <MFInfoRow label="Risk" theme={appTheme} value={device.risk} /> : null}
          </MFStack>
        </MFCard>
        <MFStack gap={appTheme.spacing.md}>
          <SectionTitle title="Current task" />
          {currentTask ? (
            <TaskListItem compact onPress={() => onOpenTask(currentTask.id)} task={currentTask} />
          ) : (
            <MFText muted theme={appTheme}>
              No active task is assigned to this device.
            </MFText>
          )}
        </MFStack>
        <MFRow gap={appTheme.spacing.sm}>
          <MFButton fullWidth={false} theme={appTheme} title="Scan bind" variant="secondary" />
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
  const task = findTask(taskId);

  if (!task) {
    return <MissingEntityScreen entity="task" onBack={onBack} />;
  }

  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          backLabel="Tasks"
          eyebrow={task.id}
          onBack={onBack}
          right={<StatusBadge label={getTaskStatusLabel(task.status)} theme={appTheme} tone={statusTone(task.status)} />}
          subtitle={`${task.owner} - ${task.deviceName}`}
          theme={appTheme}
          title={task.name}
        />
        <TaskProgressCard
          actions={[
            { label: 'Stop', variant: 'danger' },
            { label: 'Retry', variant: 'secondary' },
            { label: 'Device', onPress: () => onOpenDevice(task.deviceId), variant: 'outline' }
          ]}
          currentStep={`Current step: ${task.currentStep}`}
          error={task.error ? { message: task.error, title: 'Failure reason' } : undefined}
          progress={progressValue(task)}
          progressLabel={`Progress ${progressLabel(task)} - started ${task.startedAt}`}
          status={{ label: getTaskStatusLabel(task.status), tone: statusTone(task.status) }}
          subtitle={`${task.owner} - ${task.deviceName}`}
          theme={appTheme}
          title={task.name}
        />
        <Timeline
          items={task.steps.map((step) => ({
            label: step.label,
            state: step.state,
            time: step.time,
            tone: statusTone(step.state)
          }))}
          theme={appTheme}
        />
        <LogViewer entries={task.logs.map((log) => ({ level: log.level, message: log.message, time: log.time }))} theme={appTheme} />
      </MFStack>
    </MFScrollPage>
  );
}

export function ManagementHomeScreen() {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={appTheme.spacing.lg}>
        <AdminPageHeader
          eyebrow="Management"
          subtitle="Second-level entry points keep the bottom navigation focused and mobile friendly."
          theme={appTheme}
          title="Management"
        />
        <ManagementEntryList entries={managementEntries} theme={appTheme} />
        <AdminBoundaryCard items={adminBoundaries} theme={appTheme} />
      </MFStack>
    </MFScrollPage>
  );
}

export function ProfileScreen() {
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
            <MFInfoRow label="Name" theme={appTheme} value={adminSession.name} />
            <MFInfoRow label="Role" theme={appTheme} value={adminSession.role} />
            <MFInfoRow label="Tenant" theme={appTheme} value={adminSession.tenantId} />
            <MFInfoRow label="Admin device" theme={appTheme} value={adminSession.deviceId} />
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={appTheme.spacing.sm}>
            <SectionTitle title="Permissions" />
            <MFRow gap={appTheme.spacing.sm} style={{ flexWrap: 'wrap' }}>
              {adminSession.permissions.map((permission) => (
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
  return (
    <EntityListItem
      actionLabel={compact ? 'View' : undefined}
      meta={`App v${device.appVersion} - Battery ${device.battery}% - ${device.heartbeat}`}
      onPress={onPress}
      status={{ label: getDeviceStatusLabel(device.status), tone: statusTone(device.status) }}
      subtitle={`User: ${device.owner}`}
      theme={appTheme}
      title={`${device.model} - ${device.id}`}
    >
      {device.risk ? (
        <MFText theme={appTheme} style={warningTextStyle()}>
          {device.risk}
        </MFText>
      ) : null}
    </EntityListItem>
  );
}

function TaskListItem({ compact = false, onPress, task }: { compact?: boolean; onPress: () => void; task: TaskRecord }) {
  return (
    <EntityListItem
      actionLabel={compact ? 'Details' : undefined}
      onPress={onPress}
      status={{ label: getTaskStatusLabel(task.status), tone: statusTone(task.status) }}
      subtitle={`${task.owner} - ${task.deviceName}`}
      theme={appTheme}
      title={task.name}
    >
      <MFProgress label={`${progressLabel(task)} - started ${task.startedAt}`} theme={appTheme} value={progressValue(task)} />
      <MFText muted theme={appTheme} style={captionTextStyle()}>
        {task.currentStep}
      </MFText>
    </EntityListItem>
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
