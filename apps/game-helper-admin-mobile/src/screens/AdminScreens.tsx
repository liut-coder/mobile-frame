import { View } from 'react-native';

import {
  MFBadge,
  MFBanner,
  MFButton,
  MFCard,
  MFDivider,
  MFFormField,
  MFHeading,
  MFInfoGrid,
  MFInfoRow,
  MFInput,
  MFListItem,
  MFPage,
  MFPageHeader,
  MFPasswordInput,
  MFProgress,
  MFRow,
  MFScrollPage,
  MFSearchBar,
  MFStack,
  MFStatusPill,
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
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow="Admin mobile"
          subtitle="Sign in with administrator credentials backed by the mobile BFF boundary."
          theme={appTheme}
          title="Game Helper Admin"
        />
        <MFCard theme={appTheme}>
          <MFStack gap={14}>
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
        <CapabilityBoundaryCard />
      </MFStack>
    </MFPage>
  );
}

export function DashboardScreen({ onOpenDevice, onOpenTask }: DashboardScreenProps) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow="Overview"
          subtitle="Realtime summary for devices, task progress, failures, approvals, and release status."
          theme={appTheme}
          title="Operations overview"
        />
        <MFInfoGrid items={dashboardSummary} theme={appTheme} />
        {dashboardAlerts.map((alert) => (
          <MFBanner key={alert.title} message={alert.message} theme={appTheme} title={alert.title} tone={alert.tone} />
        ))}
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <SectionTitle title="Recent devices" />
            {devices.slice(0, 2).map((device) => (
              <DeviceListRow device={device} key={device.id} onPress={() => onOpenDevice(device.id)} />
            ))}
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <SectionTitle title="Active tasks" />
            {tasks.slice(0, 2).map((task) => (
              <TaskListRow key={task.id} onPress={() => onOpenTask(task.id)} task={task} />
            ))}
          </MFStack>
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

export function DeviceListScreen({ onOpenDevice }: DeviceListScreenProps) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow="Devices"
          subtitle="Paginated and filterable device status surface for the administrator mobile app."
          theme={appTheme}
          title="Device fleet"
        />
        <MFSearchBar placeholder="Search device, user, or app version" theme={appTheme} value="" />
        <MFRow gap={8}>
          <MFBadge label="All 3" theme={appTheme} />
          <MFBadge label="Online 1" tone="success" theme={appTheme} />
          <MFBadge label="Attention 2" tone="warning" theme={appTheme} />
        </MFRow>
        <MFStack gap={12}>
          {devices.map((device) => (
            <DeviceCard device={device} key={device.id} onPress={() => onOpenDevice(device.id)} />
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
      <MFStack gap={18}>
        <MFPageHeader
          backLabel="Devices"
          eyebrow={device.id}
          onBack={onBack}
          right={<MFStatusPill label={getDeviceStatusLabel(device.status)} status={statusTone(device.status)} theme={appTheme} />}
          subtitle={`${device.owner} - ${device.model}`}
          theme={appTheme}
          title="Device detail"
        />
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <MFInfoRow label="App version" theme={appTheme} value={device.appVersion} />
            <MFInfoRow label="Battery" theme={appTheme} value={`${device.battery}%`} />
            <MFInfoRow label="Last heartbeat" theme={appTheme} value={device.heartbeat} />
            <MFInfoRow label="Worker health" theme={appTheme} value={device.worker} />
            {device.risk ? <MFInfoRow label="Risk" theme={appTheme} value={device.risk} /> : null}
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <SectionTitle title="Current task" />
            {currentTask ? (
              <TaskListRow onPress={() => onOpenTask(currentTask.id)} task={currentTask} />
            ) : (
              <MFText muted theme={appTheme}>
                No active task is assigned to this device.
              </MFText>
            )}
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
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
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow="Tasks"
          subtitle="Monitor progress, stop failed runs, retry recoverable jobs, and inspect logs."
          theme={appTheme}
          title="Task queue"
        />
        <MFSearchBar placeholder="Search task, user, or device" theme={appTheme} value="" />
        <MFRow gap={8}>
          <MFBadge label="Running" theme={appTheme} />
          <MFBadge label="Failed" tone="danger" theme={appTheme} />
          <MFBadge label="Queued" tone="warning" theme={appTheme} />
        </MFRow>
        <MFStack gap={12}>
          {tasks.map((task) => (
            <TaskCard key={task.id} onPress={() => onOpenTask(task.id)} task={task} />
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
      <MFStack gap={18}>
        <MFPageHeader
          backLabel="Tasks"
          eyebrow={task.id}
          onBack={onBack}
          right={<MFStatusPill label={getTaskStatusLabel(task.status)} status={statusTone(task.status)} theme={appTheme} />}
          subtitle={`${task.owner} - ${task.deviceName}`}
          theme={appTheme}
          title={task.name}
        />
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <MFProgress label={`Progress ${progressLabel(task)}`} theme={appTheme} value={progressValue(task)} />
            <MFInfoRow label="Current step" theme={appTheme} value={task.currentStep} />
            <MFInfoRow label="Started" theme={appTheme} value={task.startedAt} />
            {task.error ? <MFBanner message={task.error} theme={appTheme} title="Failure reason" tone="danger" /> : null}
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <SectionTitle title="Timeline" />
            {task.steps.map((step, index) => (
              <TimelineRow key={`${step.label}-${index}`} label={step.label} state={step.state} time={step.time} />
            ))}
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <SectionTitle title="Log viewer" />
            {task.logs.map((log, index) => (
              <LogRow key={`${log.time}-${index}`} level={log.level} message={log.message} time={log.time} />
            ))}
          </MFStack>
        </MFCard>
        <MFRow gap={10}>
          <MFButton fullWidth={false} theme={appTheme} title="Stop" variant="danger" />
          <MFButton fullWidth={false} theme={appTheme} title="Retry" variant="secondary" />
          <MFButton fullWidth={false} onPress={() => onOpenDevice(task.deviceId)} theme={appTheme} title="Device" variant="outline" />
        </MFRow>
      </MFStack>
    </MFScrollPage>
  );
}

export function ManagementHomeScreen() {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow="Management"
          subtitle="Second-level entry points keep the bottom navigation focused and mobile friendly."
          theme={appTheme}
          title="Management"
        />
        <MFCard padded={false} theme={appTheme}>
          {managementEntries.map((entry, index) => (
            <View key={entry.title}>
              <MFListItem
                meta={`${entry.description} Permission: ${entry.permission}`}
                right={<MFBadge label={entry.badge} theme={appTheme} />}
                theme={appTheme}
                title={entry.title}
              />
              {index < managementEntries.length - 1 ? <MFDivider theme={appTheme} /> : null}
            </View>
          ))}
        </MFCard>
        <CapabilityBoundaryCard />
      </MFStack>
    </MFScrollPage>
  );
}

export function ProfileScreen() {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow="Mine"
          subtitle="Administrator identity, permission snapshot, and integration contracts."
          theme={appTheme}
          title="Profile"
        />
        <MFCard theme={appTheme}>
          <MFStack gap={12}>
            <MFInfoRow label="Name" theme={appTheme} value={adminSession.name} />
            <MFInfoRow label="Role" theme={appTheme} value={adminSession.role} />
            <MFInfoRow label="Tenant" theme={appTheme} value={adminSession.tenantId} />
            <MFInfoRow label="Admin device" theme={appTheme} value={adminSession.deviceId} />
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={10}>
            <SectionTitle title="Permissions" />
            <MFRow gap={8} style={{ flexWrap: 'wrap' }}>
              {adminSession.permissions.map((permission) => (
                <MFBadge key={permission} label={permission} theme={appTheme} />
              ))}
            </MFRow>
          </MFStack>
        </MFCard>
        <MFCard theme={appTheme}>
          <MFStack gap={10}>
            <SectionTitle title="/api/v1/mobile boundary" />
            {bffContracts.map((contract) => (
              <MFText key={contract} theme={appTheme} style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 18 }}>
                {contract}
              </MFText>
            ))}
          </MFStack>
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function DeviceCard({ device, onPress }: { device: DeviceRecord; onPress: () => void }) {
  return (
    <MFCard onPress={onPress} pressable theme={appTheme}>
      <DeviceListRow device={device} />
    </MFCard>
  );
}

function DeviceListRow({ device, onPress }: { device: DeviceRecord; onPress?: () => void }) {
  return (
    <MFStack gap={8}>
      <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <MFStack gap={2} style={{ flex: 1 }}>
          <MFText theme={appTheme} style={{ fontWeight: '900' }}>
            {device.model} - {device.id}
          </MFText>
          <MFText muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
            User: {device.owner}
          </MFText>
        </MFStack>
        <MFStatusPill label={getDeviceStatusLabel(device.status)} status={statusTone(device.status)} theme={appTheme} />
      </MFRow>
      <MFText muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
        App v{device.appVersion} - Battery {device.battery}% - {device.heartbeat}
      </MFText>
      {device.risk ? (
        <MFText theme={appTheme} style={{ color: appTheme.colors.warning, fontSize: 13, fontWeight: '800', lineHeight: 18 }}>
          {device.risk}
        </MFText>
      ) : null}
      {onPress ? (
        <MFButton fullWidth={false} onPress={onPress} theme={appTheme} title="View" variant="ghost" />
      ) : null}
    </MFStack>
  );
}

function TaskCard({ onPress, task }: { onPress: () => void; task: TaskRecord }) {
  return (
    <MFCard onPress={onPress} pressable theme={appTheme}>
      <TaskListRow task={task} />
    </MFCard>
  );
}

function TaskListRow({ onPress, task }: { onPress?: () => void; task: TaskRecord }) {
  return (
    <MFStack gap={10}>
      <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <MFStack gap={2} style={{ flex: 1 }}>
          <MFText theme={appTheme} style={{ fontWeight: '900' }}>
            {task.name}
          </MFText>
          <MFText muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
            {task.owner} - {task.deviceName}
          </MFText>
        </MFStack>
        <MFStatusPill label={getTaskStatusLabel(task.status)} status={statusTone(task.status)} theme={appTheme} />
      </MFRow>
      <MFProgress label={`${progressLabel(task)} - started ${task.startedAt}`} theme={appTheme} value={progressValue(task)} />
      <MFText muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
        {task.currentStep}
      </MFText>
      {onPress ? (
        <MFButton fullWidth={false} onPress={onPress} theme={appTheme} title="Details" variant="ghost" />
      ) : null}
    </MFStack>
  );
}

function TimelineRow({ label, state, time }: { label: string; state: 'done' | 'running' | 'blocked' | 'waiting'; time: string }) {
  return (
    <MFRow gap={10} style={{ alignItems: 'flex-start' }}>
      <MFStatusPill label={state} status={statusTone(state)} theme={appTheme} />
      <MFStack gap={2} style={{ flex: 1 }}>
        <MFText theme={appTheme} style={{ fontWeight: '800' }}>
          {label}
        </MFText>
        <MFText muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
          {time}
        </MFText>
      </MFStack>
    </MFRow>
  );
}

function LogRow({ level, message, time }: { level: 'info' | 'warn' | 'error'; message: string; time: string }) {
  return (
    <MFStack gap={6}>
      <MFRow gap={8}>
        <MFStatusPill label={level} status={statusTone(level)} theme={appTheme} />
        <MFText muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
          {time}
        </MFText>
      </MFRow>
      <MFText theme={appTheme} style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: 18 }}>
        {message}
      </MFText>
    </MFStack>
  );
}

function CapabilityBoundaryCard() {
  return (
    <MFCard theme={appTheme}>
      <MFStack gap={10}>
        <SectionTitle title="Execution boundary" />
        {adminBoundaries.map((boundary) => (
          <MFText key={boundary} muted theme={appTheme} style={{ fontSize: 13, lineHeight: 18 }}>
            {boundary}
          </MFText>
        ))}
      </MFStack>
    </MFCard>
  );
}

function MissingEntityScreen({ entity, onBack }: { entity: string; onBack: () => void }) {
  return (
    <MFScrollPage theme={appTheme}>
      <MFStack gap={18}>
        <MFPageHeader backLabel="Back" eyebrow="Missing" onBack={onBack} theme={appTheme} title={`Unknown ${entity}`} />
        <MFText muted theme={appTheme}>
          The selected {entity} fixture is not available.
        </MFText>
      </MFStack>
    </MFScrollPage>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <MFHeading level="section" theme={appTheme}>
      {title}
    </MFHeading>
  );
}
