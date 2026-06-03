import type { ReactNode } from 'react';

import { createTheme, type MFTheme, type MFVariant } from '@mobile-frame/ui-core';
import {
  MFBadge,
  MFBanner,
  MFButton,
  MFCard,
  MFHeading,
  MFPageHeader,
  MFProgress,
  MFRow,
  MFStack,
  MFStatusPill,
  MFText
} from '@mobile-frame/ui-native';

const defaultTheme = createTheme('light');

export type AdminStatusTone = 'info' | 'success' | 'warning' | 'danger' | 'neutral';

export type AdminAction = {
  label: string;
  onPress?: () => void;
  variant?: MFVariant;
};

export type AdminPageHeaderProps = {
  backLabel?: string;
  eyebrow?: string;
  onBack?: () => void;
  right?: ReactNode;
  subtitle?: string;
  theme?: MFTheme;
  title: string;
};

export function AdminPageHeader({ eyebrow = 'Admin', theme = defaultTheme, ...props }: AdminPageHeaderProps) {
  return <MFPageHeader eyebrow={eyebrow} theme={theme} {...props} />;
}

export function StatusBadge({
  label,
  tone = 'info',
  theme = defaultTheme
}: {
  label: string;
  theme?: MFTheme;
  tone?: AdminStatusTone;
}) {
  return <MFStatusPill label={label} status={tone} theme={theme} />;
}

export function StatCard({
  label,
  onPress,
  theme = defaultTheme,
  tone = 'info',
  value
}: {
  label: string;
  onPress?: () => void;
  theme?: MFTheme;
  tone?: AdminStatusTone;
  value: string;
}) {
  return (
    <MFCard onPress={onPress} pressable={Boolean(onPress)} theme={theme}>
      <MFStack gap={theme.spacing.sm}>
        <StatusBadge label={label} theme={theme} tone={tone} />
        <MFText theme={theme} style={{ color: getToneColor(theme, tone), fontSize: theme.typography.size.display, fontWeight: '900', lineHeight: theme.typography.lineHeight.display }}>
          {value}
        </MFText>
      </MFStack>
    </MFCard>
  );
}

export type EntityListItemProps = {
  actionLabel?: string;
  badge?: string;
  children?: ReactNode;
  meta?: string;
  onPress?: () => void;
  status?: {
    label: string;
    tone?: AdminStatusTone;
  };
  subtitle?: string;
  theme?: MFTheme;
  title: string;
};

export function EntityListItem({
  actionLabel,
  badge,
  children,
  meta,
  onPress,
  status,
  subtitle,
  theme = defaultTheme,
  title
}: EntityListItemProps) {
  return (
    <MFCard onPress={onPress} pressable={Boolean(onPress)} theme={theme}>
      <MFStack gap={theme.spacing.sm}>
        <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <MFStack gap={theme.spacing.xs} style={{ flex: 1 }}>
            <MFText theme={theme} style={titleTextStyle(theme)}>
              {title}
            </MFText>
            {subtitle ? (
              <MFText muted theme={theme} style={captionTextStyle(theme)}>
                {subtitle}
              </MFText>
            ) : null}
          </MFStack>
          {status ? <StatusBadge label={status.label} theme={theme} tone={status.tone} /> : badge ? <MFBadge label={badge} theme={theme} /> : null}
        </MFRow>
        {meta ? (
          <MFText muted theme={theme} style={captionTextStyle(theme)}>
            {meta}
          </MFText>
        ) : null}
        {children}
        {actionLabel && onPress ? <MFButton fullWidth={false} onPress={onPress} theme={theme} title={actionLabel} variant="ghost" /> : null}
      </MFStack>
    </MFCard>
  );
}

export type TaskProgressCardProps = {
  actions?: AdminAction[];
  currentStep?: string;
  error?: {
    message: string;
    title?: string;
  };
  progress: number;
  progressLabel: string;
  status: {
    label: string;
    tone?: AdminStatusTone;
  };
  subtitle?: string;
  theme?: MFTheme;
  title: string;
};

export function TaskProgressCard({
  actions = [],
  currentStep,
  error,
  progress,
  progressLabel,
  status,
  subtitle,
  theme = defaultTheme,
  title
}: TaskProgressCardProps) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={theme.spacing.md}>
        <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <MFStack gap={theme.spacing.xs} style={{ flex: 1 }}>
            <MFText theme={theme} style={titleTextStyle(theme)}>
              {title}
            </MFText>
            {subtitle ? (
              <MFText muted theme={theme} style={captionTextStyle(theme)}>
                {subtitle}
              </MFText>
            ) : null}
          </MFStack>
          <StatusBadge label={status.label} theme={theme} tone={status.tone} />
        </MFRow>
        <MFProgress label={progressLabel} theme={theme} value={progress} />
        {currentStep ? <InfoText theme={theme}>{currentStep}</InfoText> : null}
        {error ? <MFBanner message={error.message} theme={theme} title={error.title ?? 'Error'} tone="danger" /> : null}
        <ActionRow actions={actions} theme={theme} />
      </MFStack>
    </MFCard>
  );
}

export type TimelineItem = {
  label: string;
  state: string;
  time?: string;
  tone?: AdminStatusTone;
};

export function Timeline({
  items,
  theme = defaultTheme,
  title = 'Timeline'
}: {
  items: TimelineItem[];
  theme?: MFTheme;
  title?: string;
}) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={theme.spacing.md}>
        <SectionTitle theme={theme} title={title} />
        {items.map((item, index) => (
          <MFRow key={`${item.label}-${index}`} gap={theme.spacing.sm} style={{ alignItems: 'flex-start' }}>
            <StatusBadge label={item.state} theme={theme} tone={item.tone ?? toneFromStatus(item.state)} />
            <MFStack gap={theme.spacing.xs} style={{ flex: 1 }}>
              <MFText theme={theme} style={strongTextStyle(theme)}>
                {item.label}
              </MFText>
              {item.time ? <InfoText theme={theme}>{item.time}</InfoText> : null}
            </MFStack>
          </MFRow>
        ))}
      </MFStack>
    </MFCard>
  );
}

export type LogViewerEntry = {
  level: 'info' | 'warn' | 'error';
  message: string;
  time: string;
};

export function LogViewer({
  entries,
  keyword,
  paused = false,
  theme = defaultTheme,
  title = 'Log viewer'
}: {
  entries: LogViewerEntry[];
  keyword?: string;
  paused?: boolean;
  theme?: MFTheme;
  title?: string;
}) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={theme.spacing.md}>
        <MFRow style={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <SectionTitle theme={theme} title={title} />
          <MFBadge label={paused ? 'Paused' : 'Live'} tone={paused ? 'warning' : 'success'} theme={theme} />
        </MFRow>
        {keyword ? <InfoText theme={theme}>Filter: {keyword}</InfoText> : null}
        {entries.map((entry, index) => (
          <MFStack key={`${entry.time}-${index}`} gap={theme.spacing.xs}>
            <MFRow gap={theme.spacing.sm}>
              <StatusBadge label={entry.level} theme={theme} tone={toneFromStatus(entry.level)} />
              <InfoText theme={theme}>{entry.time}</InfoText>
            </MFRow>
            <MFText theme={theme} style={codeTextStyle(theme)}>
              {entry.message}
            </MFText>
          </MFStack>
        ))}
      </MFStack>
    </MFCard>
  );
}

export function AdminBoundaryCard({
  items,
  theme = defaultTheme,
  title = 'Execution boundary'
}: {
  items: string[];
  theme?: MFTheme;
  title?: string;
}) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={theme.spacing.sm}>
        <SectionTitle theme={theme} title={title} />
        {items.map((item) => (
          <InfoText key={item} theme={theme}>
            {item}
          </InfoText>
        ))}
      </MFStack>
    </MFCard>
  );
}

export function ManagementEntryList({
  entries,
  theme = defaultTheme
}: {
  entries: Array<{
    badge?: string;
    description: string;
    onPress?: () => void;
    permission?: string;
    title: string;
  }>;
  theme?: MFTheme;
}) {
  return (
    <MFStack gap={theme.spacing.md}>
      {entries.map((entry) => (
        <EntityListItem
          badge={entry.badge}
          key={entry.title}
          meta={entry.permission ? `${entry.description} Permission: ${entry.permission}` : entry.description}
          onPress={entry.onPress}
          theme={theme}
          title={entry.title}
        />
      ))}
    </MFStack>
  );
}

function ActionRow({ actions, theme }: { actions: AdminAction[]; theme: MFTheme }) {
  if (actions.length === 0) {
    return null;
  }

  return (
    <MFRow gap={theme.spacing.sm} style={{ flexWrap: 'wrap' }}>
      {actions.map((action) => (
        <MFButton
          fullWidth={false}
          key={action.label}
          onPress={action.onPress}
          theme={theme}
          title={action.label}
          variant={action.variant ?? 'secondary'}
        />
      ))}
    </MFRow>
  );
}

function SectionTitle({ theme, title }: { theme: MFTheme; title: string }) {
  return (
    <MFHeading level="section" theme={theme}>
      {title}
    </MFHeading>
  );
}

function InfoText({ children, theme }: { children: ReactNode; theme: MFTheme }) {
  return (
    <MFText muted theme={theme} style={captionTextStyle(theme)}>
      {children}
    </MFText>
  );
}

function titleTextStyle(theme: MFTheme) {
  return {
    fontSize: theme.typography.size.body,
    fontWeight: '900' as const,
    lineHeight: theme.typography.lineHeight.body
  };
}

function strongTextStyle(theme: MFTheme) {
  return {
    fontSize: theme.typography.size.callout,
    fontWeight: '800' as const,
    lineHeight: theme.typography.lineHeight.callout
  };
}

function captionTextStyle(theme: MFTheme) {
  return {
    fontSize: theme.typography.size.caption,
    lineHeight: theme.typography.lineHeight.caption
  };
}

function codeTextStyle(theme: MFTheme) {
  return {
    fontFamily: theme.typography.family.mono,
    fontSize: theme.typography.size.caption,
    lineHeight: theme.typography.lineHeight.caption
  };
}

function toneFromStatus(status: string): AdminStatusTone {
  switch (status) {
    case 'online':
    case 'completed':
    case 'done':
    case 'success':
      return 'success';
    case 'offline':
    case 'failed':
    case 'error':
    case 'blocked':
      return 'danger';
    case 'warning':
    case 'paused':
    case 'queued':
    case 'warn':
    case 'waiting':
      return 'warning';
    case 'running':
    case 'info':
    default:
      return 'info';
  }
}

function getToneColor(theme: MFTheme, tone: AdminStatusTone): string {
  switch (tone) {
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'danger':
      return theme.colors.danger;
    case 'neutral':
      return theme.colors.textMuted;
    case 'info':
    default:
      return theme.colors.info;
  }
}
