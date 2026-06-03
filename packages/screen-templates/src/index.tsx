import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { InstalledApp, PermissionSnapshot } from '@mobile-frame/core/native-modules';
import { createTheme, type MFTheme } from '@mobile-frame/ui-core';
import {
  MFBadge,
  MFButton,
  MFCard,
  MFDivider,
  MFEmptyState,
  MFHeading,
  MFInfoGrid,
  MFInfoRow,
  MFListItem,
  MFLoadingState,
  MFPage,
  MFPageHeader,
  MFScrollPage,
  MFStack,
  MFStatusPill,
  MFSwitch,
  MFText
} from '@mobile-frame/ui-native';

const defaultTheme = createTheme('light');

export type MFTemplateAction = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
};

export type MFTemplateProps = {
  actions?: MFTemplateAction[];
  eyebrow?: string;
  subtitle?: string;
  theme?: MFTheme;
  title: string;
};

export function BlankScreen({ actions = [], children, eyebrow, subtitle, theme = defaultTheme, title }: MFTemplateProps & { children?: ReactNode }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        {children ?? (
          <MFEmptyState
            message="This blank template is ready for generated content."
            theme={theme}
            title="Blank template"
          />
        )}
        <TemplateActions actions={actions} theme={theme} />
      </MFStack>
    </MFScrollPage>
  );
}

export type DashboardSummaryItem = {
  label: string;
  tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  value: string;
};

export type DashboardScreenProps = MFTemplateProps & {
  banner?: {
    message: string;
    tone?: 'info' | 'success' | 'warning' | 'danger';
    title: string;
  };
  primaryActions?: MFTemplateAction[];
  quickActions?: MFTemplateAction[];
  recentItems?: Array<{ meta?: string; title: string }>;
  summary?: DashboardSummaryItem[];
};

export function DashboardScreen({
  actions = [],
  banner,
  eyebrow = 'Dashboard',
  primaryActions = [],
  quickActions = [],
  recentItems = [],
  subtitle = 'Reusable overview surface for device, admin, and operations apps.',
  summary = [],
  theme = defaultTheme,
  title
}: DashboardScreenProps) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        {banner ? (
          <MFCard theme={theme}>
            <MFStack gap={8}>
              <MFStatusPill label={banner.title} status={banner.tone ?? 'info'} theme={theme} />
              <MFText muted theme={theme}>
                {banner.message}
              </MFText>
            </MFStack>
          </MFCard>
        ) : null}
        <MFInfoGrid
          items={(summary.length > 0 ? summary : defaultSummary).map((item) => ({
            label: item.label,
            tone: item.tone,
            value: item.value
          }))}
          theme={theme}
        />
        <TemplateActions actions={primaryActions.length > 0 ? primaryActions : actions} theme={theme} />
        <MFCard padded={false} theme={theme}>
          {(recentItems.length > 0 ? recentItems : defaultRecentItems).map((item, index, rows) => (
            <View key={`${item.title}-${index}`}>
              <MFListItem meta={item.meta} theme={theme} title={item.title} />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <TemplateActions actions={quickActions} theme={theme} />
      </MFStack>
    </MFScrollPage>
  );
}

export type ListScreenProps = MFTemplateProps & {
  empty?: {
    actionLabel?: string;
    message: string;
    onAction?: () => void;
    title: string;
  };
  items?: Array<{ badge?: string; meta?: string; onPress?: () => void; title: string }>;
};

type ListScreenItem = NonNullable<ListScreenProps['items']>[number];

export function ListScreen({
  actions = [],
  empty,
  eyebrow = 'List',
  items = [],
  subtitle,
  theme = defaultTheme,
  title
}: ListScreenProps) {
  const rows: ListScreenItem[] = items.length > 0 ? items : defaultListItems;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        {rows.length > 0 ? (
          <MFCard padded={false} theme={theme}>
            {rows.map((item, index) => (
              <View key={`${item.title}-${index}`}>
                <MFListItem
                  meta={item.meta}
                  onPress={item.onPress}
                  right={item.badge ? <MFBadge label={item.badge} theme={theme} /> : undefined}
                  theme={theme}
                  title={item.title}
                />
                {index < rows.length - 1 ? <MFDivider /> : null}
              </View>
            ))}
          </MFCard>
        ) : (
          <MFEmptyState
            actionLabel={empty?.actionLabel}
            message={empty?.message ?? 'No records are available for this template.'}
            onAction={empty?.onAction}
            theme={theme}
            title={empty?.title ?? 'No data'}
          />
        )}
        <TemplateActions actions={actions} theme={theme} />
      </MFStack>
    </MFScrollPage>
  );
}

export type DetailScreenProps = MFTemplateProps & {
  fields?: Array<{ label: string; value: ReactNode }>;
  status?: { label: string; tone?: 'info' | 'success' | 'warning' | 'danger' | 'neutral' };
};

export function DetailScreen({ actions = [], eyebrow = 'Detail', fields = [], status, subtitle, theme = defaultTheme, title }: DetailScreenProps) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader
          eyebrow={eyebrow}
          right={status ? <MFStatusPill label={status.label} status={status.tone ?? 'info'} theme={theme} /> : undefined}
          subtitle={subtitle}
          theme={theme}
          title={title}
        />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            {(fields.length > 0 ? fields : defaultDetailFields).map((field) => (
              <MFInfoRow key={field.label} label={field.label} theme={theme} value={field.value} />
            ))}
          </MFStack>
        </MFCard>
        <TemplateActions actions={actions} theme={theme} />
      </MFStack>
    </MFScrollPage>
  );
}

export type SettingsScreenProps = MFTemplateProps & {
  groups?: Array<{
    title: string;
    rows: Array<{ description?: string; enabled?: boolean; onChange?: (value: boolean) => void; title: string }>;
  }>;
};

type SettingsScreenGroup = NonNullable<SettingsScreenProps['groups']>[number];

export function SettingsScreen({ eyebrow = 'Settings', groups = [], subtitle, theme = defaultTheme, title }: SettingsScreenProps) {
  const sections: SettingsScreenGroup[] = groups.length > 0 ? groups : defaultSettingsGroups;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        {sections.map((group) => (
          <MFCard key={group.title} theme={theme}>
            <MFStack gap={12}>
              <MFHeading level="section" theme={theme}>
                {group.title}
              </MFHeading>
              {group.rows.map((row) => (
                <View key={row.title}>
                  <MFInfoRow
                    label={row.title}
                    theme={theme}
                    value={<MFSwitch onValueChange={row.onChange} theme={theme} value={row.enabled ?? false} />}
                  />
                  {row.description ? (
                    <MFText muted theme={theme} style={{ fontSize: 13, lineHeight: 18 }}>
                      {row.description}
                    </MFText>
                  ) : null}
                </View>
              ))}
            </MFStack>
          </MFCard>
        ))}
      </MFStack>
    </MFScrollPage>
  );
}

export type PermissionScreenProps = MFTemplateProps & {
  permissions?: PermissionSnapshot;
};

export function PermissionScreen({ eyebrow = 'Permissions', permissions, subtitle, theme = defaultTheme, title }: PermissionScreenProps) {
  const snapshot = permissions ?? defaultPermissionSnapshot;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        <MFCard padded={false} theme={theme}>
          {snapshot.permissions.map((permission, index) => (
            <View key={permission.type}>
              <MFListItem
                meta={permission.required ? 'Required' : 'Optional'}
                right={<MFStatusPill label={permission.granted ? 'Granted' : 'Missing'} status={permission.granted ? 'success' : 'warning'} theme={theme} />}
                theme={theme}
                title={permission.label}
              />
              {index < snapshot.permissions.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

export type InstalledAppsScreenProps = MFTemplateProps & {
  apps?: InstalledApp[];
  onLaunchApp?: (packageName: string) => void;
};

export function InstalledAppsScreen({ apps = [], eyebrow = 'Installed Apps', onLaunchApp, subtitle, theme = defaultTheme, title }: InstalledAppsScreenProps) {
  const rows = apps.length > 0 ? apps : defaultInstalledApps;

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        <MFCard padded={false} theme={theme}>
          {rows.map((app, index) => (
            <View key={app.packageName}>
              <MFListItem
                meta={`${app.packageName}${app.versionName ? ` - ${app.versionName}` : ''}`}
                onPress={onLaunchApp ? () => onLaunchApp(app.packageName) : undefined}
                right={<MFStatusPill label={app.installed ? 'Installed' : 'Missing'} status={app.installed ? 'success' : 'neutral'} theme={theme} />}
                theme={theme}
                title={app.appName}
              />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

export function EmptyStateScreen({
  actions = [],
  eyebrow = 'Empty',
  subtitle,
  theme = defaultTheme,
  title
}: MFTemplateProps) {
  return (
    <MFPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        <MFEmptyState message="Use this template when an expected resource has no content yet." theme={theme} title="Nothing here yet" />
        <TemplateActions actions={actions} theme={theme} />
      </MFStack>
    </MFPage>
  );
}

export function ErrorStateScreen({
  actions = [],
  eyebrow = 'Error',
  subtitle,
  theme = defaultTheme,
  title
}: MFTemplateProps) {
  return (
    <MFPage theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        <MFCard theme={theme}>
          <MFStack gap={10} style={{ alignItems: 'center' }}>
            <MFStatusPill label="Recoverable" status="danger" theme={theme} />
            <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900', textAlign: 'center' }}>
              Something needs attention
            </MFText>
            <MFText muted theme={theme} style={{ textAlign: 'center' }}>
              Use this template for failed loads, permission errors, or native adapter failures.
            </MFText>
          </MFStack>
        </MFCard>
        <TemplateActions actions={actions} theme={theme} />
      </MFStack>
    </MFPage>
  );
}

export function LoadingScreen({ eyebrow = 'Loading', subtitle, theme = defaultTheme, title }: MFTemplateProps) {
  return (
    <MFPage centered theme={theme}>
      <MFStack gap={18}>
        <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />
        <MFLoadingState message="Preparing template content." theme={theme} title="Loading" />
      </MFStack>
    </MFPage>
  );
}

function TemplateActions({ actions, theme }: { actions: MFTemplateAction[]; theme: MFTheme }) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <MFStack gap={10}>
      {actions.map((action) => (
        <MFButton key={action.label} onPress={action.onPress} theme={theme} title={action.label} variant={action.variant ?? 'primary'} />
      ))}
    </MFStack>
  );
}

const defaultSummary: DashboardSummaryItem[] = [
  { label: 'Online', tone: 'success', value: '24' },
  { label: 'Warnings', tone: 'warning', value: '3' },
  { label: 'Tasks', tone: 'info', value: '128' },
  { label: 'Errors', tone: 'danger', value: '1' }
];

const defaultRecentItems = [
  { meta: 'Permission snapshot refreshed', title: 'Device status updated' },
  { meta: 'Queue item completed', title: 'Background task finished' },
  { meta: 'Mock adapter returned success', title: 'Native capability checked' }
];

const defaultListItems: ListScreenItem[] = [
  { badge: 'Active', meta: 'Reusable generated row', title: 'Overview item' },
  { badge: 'Draft', meta: 'Supports press and badge states', title: 'Secondary item' }
];

const defaultDetailFields = [
  { label: 'Identifier', value: 'mf-template' },
  { label: 'Status', value: 'Ready' },
  { label: 'Owner', value: 'MobileFrame' }
];

const defaultSettingsGroups: SettingsScreenGroup[] = [
  {
    rows: [
      { description: 'Used by generated apps as a default enabled setting.', enabled: true, title: 'Notifications' },
      { description: 'Available through the app shell theme preference.', enabled: false, title: 'Follow system theme' }
    ],
    title: 'General'
  }
];

const defaultPermissionSnapshot: PermissionSnapshot = {
  permissions: [
    { granted: true, label: 'Notifications', required: false, type: 'notification' },
    { granted: false, label: 'Overlay', required: true, type: 'overlay' },
    { granted: true, label: 'Battery optimization', required: true, type: 'batteryOptimization' }
  ],
  updatedAt: 'mock'
};

const defaultInstalledApps: InstalledApp[] = [
  {
    appName: 'Example Game',
    installed: true,
    packageName: 'com.example.game',
    versionName: '1.0.0'
  }
];
