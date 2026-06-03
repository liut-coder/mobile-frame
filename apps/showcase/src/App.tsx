import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Pressable, View } from 'react-native';

import { MFAppProvider, useMFAppShellStore, type MFThemePreference } from '@mobile-frame/app-shell';
import { defineModule } from '@mobile-frame/module-sdk';
import { type MFTheme } from '@mobile-frame/ui-core';
import {
  MFBadge,
  MFBackButton,
  MFButton,
  MFCard,
  MFCaption,
  MFCheckbox,
  MFDivider,
  MFEmptyState,
  MFFormField,
  MFGlassPanel,
  MFHeading,
  MFInput,
  MFKeyValue,
  MFListItem,
  MFPage,
  MFPageHeader,
  MFPasswordInput,
  MFProgress,
  MFRadio,
  MFRow,
  MFScrollPage,
  MFSegmentedControl,
  MFSearchBar,
  MFSheetHost,
  MFStack,
  MFStatCard,
  MFStatusCard,
  MFSwitch,
  MFTabBar,
  MFText,
  MFTextArea,
  MFToastHost
} from '@mobile-frame/ui-native';

import { previewNativeCapability, previewPermission } from './preview-actions';

type ScreenKey = 'splash' | 'onboarding' | 'login' | 'register' | 'main' | 'settings' | 'permissions' | 'personalInfo' | 'generalSettings' | 'about';
type MainTab = 'home' | 'components' | 'native' | 'templates' | 'profile';
type ThemeChoice = MFThemePreference;

const PlaceholderScreen = () => null;

const showcaseModules = [
  defineModule({
    id: 'components',
    name: 'Components',
    version: '1.0.0',
    routes: [{ name: 'components.home', screen: PlaceholderScreen }],
    permissions: [],
    capabilities: ['ui.catalog'],
    navigation: { tab: { title: 'Components', icon: 'grid', order: 10 } }
  }),
  defineModule({
    id: 'native-capabilities',
    name: 'Native Capabilities',
    version: '1.0.0',
    routes: [{ name: 'native.home', screen: PlaceholderScreen }],
    permissions: ['network.read', 'vault.read'],
    capabilities: ['native.bridge', 'permission.preview'],
    navigation: { tab: { title: 'Native', icon: 'cube', order: 20 } }
  })
];

const tabs: Array<{ key: MainTab; label: string }> = [
  { key: 'home', label: 'Home' },
  { key: 'components', label: 'Components' },
  { key: 'native', label: 'Native' },
  { key: 'templates', label: 'Templates' },
  { key: 'profile', label: 'Profile' }
];

const themeOptions: Array<{ label: string; value: ThemeChoice }> = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
];

const showcaseConfig = {
  appId: 'com.misk.mobileframe.showcase',
  displayName: 'MobileFrame Showcase',
  modules: showcaseModules
};

const onboardingPages = [
  {
    title: 'Native feel',
    body: 'Use one React Native shell while keeping platform-specific component contracts ready.',
    badge: 'Fabric ready'
  },
  {
    title: 'Modular growth',
    body: 'Mount business modules by route, permission, capability, and tab metadata.',
    badge: 'Module SDK'
  },
  {
    title: 'Generated starts',
    body: 'Create apps, modules, screens, and native bridge placeholders from one workspace.',
    badge: 'Presets'
  }
] as const;

export function App() {
  const [screen, setScreen] = useState<ScreenKey>('splash');
  const [tab, setTab] = useState<MainTab>('home');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [registerAgreed, setRegisterAgreed] = useState(false);
  const [registerCodeSent, setRegisterCodeSent] = useState(false);
  const [switches, setSwitches] = useState({
    animation: true,
    autoUpdate: true,
    haptics: false,
    sound: true,
    systemTheme: false
  });

  const closeSheet = useMFAppShellStore((state) => state.closeSheet);
  const config = useMFAppShellStore((state) => state.config);
  const hideToast = useMFAppShellStore((state) => state.hideToast);
  const openShellSheet = useMFAppShellStore((state) => state.openSheet);
  const setShellThemeMode = useMFAppShellStore((state) => state.setThemeMode);
  const sheet = useMFAppShellStore((state) => state.sheet);
  const showShellToast = useMFAppShellStore((state) => state.showToast);
  const themeChoice = useMFAppShellStore((state) => state.themeMode);
  const toast = useMFAppShellStore((state) => state.toast);
  const theme = config.theme;

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = setTimeout(() => hideToast(toast.id), toast.durationMs);
    return () => clearTimeout(timer);
  }, [hideToast, toast]);

  const showToast = (message: string) => {
    showShellToast(message);
  };

  const openSheet = (title: string, body: string) => {
    openShellSheet({ body, title });
  };

  const goMain = (nextTab: MainTab = 'home') => {
    setTab(nextTab);
    setScreen('main');
  };

  const appActions = {
    closeSheet,
    goMain,
    openSheet,
    setOnboardingStep,
    setRegisterAgreed,
    setRegisterCodeSent,
    setScreen,
    setSwitches,
    setTab,
    setThemeChoice: setShellThemeMode,
    showToast
  };

  return (
    <MFAppProvider config={showcaseConfig}>
      <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
        {screen === 'splash' ? <SplashScreen actions={appActions} theme={theme} /> : null}
        {screen === 'onboarding' ? <OnboardingScreen actions={appActions} step={onboardingStep} theme={theme} /> : null}
        {screen === 'login' ? <LoginScreen actions={appActions} theme={theme} /> : null}
        {screen === 'register' ? <RegisterScreen actions={appActions} agreed={registerAgreed} codeSent={registerCodeSent} theme={theme} /> : null}
        {screen === 'main' ? <MainScreen actions={appActions} activeTab={tab} theme={theme} /> : null}
        {screen === 'settings' ? <SettingsScreen actions={appActions} switches={switches} theme={theme} themeChoice={themeChoice} /> : null}
        {screen === 'permissions' ? <PermissionsScreen actions={appActions} theme={theme} /> : null}
        {screen === 'personalInfo' ? <PersonalInfoScreen actions={appActions} theme={theme} /> : null}
        {screen === 'generalSettings' ? <GeneralSettingsScreen actions={appActions} switches={switches} theme={theme} /> : null}
        {screen === 'about' ? <AboutScreen actions={appActions} theme={theme} /> : null}
        <MFToastHost toast={toast} theme={theme} />
        <MFSheetHost onClose={closeSheet} sheet={sheet} theme={theme} />
      </View>
    </MFAppProvider>
  );
}

type AppActions = {
  goMain: (nextTab?: MainTab) => void;
  openSheet: (title: string, body: string) => void;
  setOnboardingStep: (step: number) => void;
  setRegisterAgreed: (value: boolean) => void;
  setRegisterCodeSent: (value: boolean) => void;
  setScreen: (screen: ScreenKey) => void;
  setSwitches: Dispatch<
    SetStateAction<{
      animation: boolean;
      autoUpdate: boolean;
      haptics: boolean;
      sound: boolean;
      systemTheme: boolean;
    }>
  >;
  setTab: (tab: MainTab) => void;
  setThemeChoice: (choice: ThemeChoice) => void;
  showToast: (message: string) => void;
};

function SplashScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  return (
    <MFPage centered theme={theme}>
      <MFStack gap={24} style={{ alignItems: 'center' }}>
        <View
          style={{
            alignItems: 'center',
            backgroundColor: theme.colors.primarySoft,
            borderRadius: 32,
            height: 96,
            justifyContent: 'center',
            width: 96
          }}
        >
          <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 42, fontWeight: '900', lineHeight: 48 }}>
            M
          </MFText>
        </View>
        <MFStack gap={8} style={{ alignItems: 'center' }}>
          <MFHeading theme={theme}>MobileFrame</MFHeading>
          <MFText muted theme={theme} style={{ textAlign: 'center' }}>
            Native mobile scaffold for reusable business apps.
          </MFText>
        </MFStack>
        <MFButton onPress={() => actions.setScreen('onboarding')} theme={theme} title="Start experience" />
      </MFStack>
    </MFPage>
  );
}

function OnboardingScreen({ actions, step, theme }: { actions: AppActions; step: number; theme: MFTheme }) {
  const current = onboardingPages[step] ?? onboardingPages[0];

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={20}>
        <ScreenTitle eyebrow={`Step ${step + 1} of ${onboardingPages.length}`} subtitle={current.body} theme={theme} title={current.title} />
        <MFGlassPanel theme={theme}>
          <MFStack gap={18}>
            <MFBadge label={current.badge} theme={theme} />
            <View
              style={{
                backgroundColor: theme.colors.primarySoft,
                borderRadius: theme.radius.xl,
                height: 220,
                justifyContent: 'center',
                padding: theme.spacing.xl
              }}
            >
              <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 52, fontWeight: '900', lineHeight: 60 }}>
                0{step + 1}
              </MFText>
              <MFText muted theme={theme}>
                Design tokens, shell state, native capabilities, and page templates stay aligned.
              </MFText>
            </View>
            <MFStatusCard message="Tokens, typography, spacing, and feedback components are exported from shared packages." theme={theme} title="Unified design system" />
            <MFStatusCard message="Native capability contracts use MFResult and mock adapters before platform code lands." theme={theme} title="Native adapters" tone="success" />
            <MFStatusCard message="Routes, permissions, capabilities, and tab metadata are declared through the module SDK." theme={theme} title="Business modules" tone="warning" />
          </MFStack>
        </MFGlassPanel>
        <MFButton
          onPress={() => {
            if (step >= onboardingPages.length - 1) {
              actions.setScreen('login');
              return;
            }
            actions.setOnboardingStep(step + 1);
          }}
          theme={theme}
          title={step >= onboardingPages.length - 1 ? 'Go to login' : 'Next'}
        />
      </MFStack>
    </MFScrollPage>
  );
}

function LoginScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <ScreenTitle eyebrow="Account" subtitle="Use the local demo flow to enter the showcase." theme={theme} title="Welcome back" />
        <MFCard theme={theme}>
          <MFStack gap={14}>
            <MFFormField helperText="Demo credentials are accepted locally." label="Account" required theme={theme}>
              <MFInput autoCapitalize="none" keyboardType="email-address" placeholder="Phone or email" theme={theme} />
            </MFFormField>
            <MFFormField label="Password" required theme={theme}>
              <MFPasswordInput placeholder="Password" theme={theme} />
            </MFFormField>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFCaption theme={theme}>Remembered locally for demo only</MFCaption>
              <Pressable onPress={() => actions.showToast('Password recovery is reserved')}>
                <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '800' }}>
                  Forgot
                </MFText>
              </Pressable>
            </MFRow>
            <MFButton
              onPress={() => {
                actions.showToast('Login success');
                actions.goMain('home');
              }}
              theme={theme}
              title="Login"
            />
          </MFStack>
        </MFCard>
        <MFRow gap={12}>
          {['WeChat', 'QQ', 'Apple'].map((provider) => (
            <MFButton
              fullWidth={false}
              key={provider}
              onPress={() => actions.showToast(`${provider} auth is reserved`)}
              theme={theme}
              title={provider}
              variant="secondary"
            />
          ))}
        </MFRow>
        <MFButton onPress={() => actions.setScreen('register')} theme={theme} title="Create account" variant="ghost" />
      </MFStack>
    </MFScrollPage>
  );
}

function RegisterScreen({
  actions,
  agreed,
  codeSent,
  theme
}: {
  actions: AppActions;
  agreed: boolean;
  codeSent: boolean;
  theme: MFTheme;
}) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <TopBack actions={actions} target="login" theme={theme} />
        <ScreenTitle eyebrow="Account" subtitle="The first version keeps validation local and reusable." theme={theme} title="Create account" />
        <MFCard theme={theme}>
          <MFStack gap={14}>
            <MFFormField label="Phone number" required theme={theme}>
              <MFInput keyboardType="phone-pad" placeholder="Phone number" theme={theme} />
            </MFFormField>
            <MFRow gap={10}>
              <View style={{ flex: 1 }}>
                <MFFormField helperText={codeSent ? 'Verification code countdown started.' : undefined} label="Code" required theme={theme}>
                  <MFInput keyboardType="number-pad" placeholder="Verification code" theme={theme} />
                </MFFormField>
              </View>
              <MFButton
                fullWidth={false}
                onPress={() => {
                  actions.setRegisterCodeSent(true);
                  actions.showToast('Verification code sent');
                }}
                theme={theme}
                title={codeSent ? '60s' : 'Get code'}
                variant="secondary"
              />
            </MFRow>
            <MFFormField label="Password" required theme={theme}>
              <MFPasswordInput placeholder="Password" theme={theme} />
            </MFFormField>
            <MFFormField label="Confirm password" required theme={theme}>
              <MFPasswordInput placeholder="Confirm password" theme={theme} />
            </MFFormField>
            <MFCheckbox
              label="I accept the user agreement and privacy policy"
              onValueChange={actions.setRegisterAgreed}
              theme={theme}
              value={agreed}
            />
            <MFButton
              onPress={() => {
                if (!agreed) {
                  actions.showToast('Please accept the agreements first');
                  return;
                }
                actions.showToast('Registration success');
                actions.goMain('home');
              }}
              theme={theme}
              title="Register"
            />
          </MFStack>
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function MainScreen({ actions, activeTab, theme }: { actions: AppActions; activeTab: MainTab; theme: MFTheme }) {
  return (
    <View style={{ flex: 1 }}>
      {activeTab === 'home' ? <HomeScreen actions={actions} theme={theme} /> : null}
      {activeTab === 'components' ? <CatalogScreen actions={actions} kind="components" theme={theme} /> : null}
      {activeTab === 'native' ? <CatalogScreen actions={actions} kind="native" theme={theme} /> : null}
      {activeTab === 'templates' ? <CatalogScreen actions={actions} kind="templates" theme={theme} /> : null}
      {activeTab === 'profile' ? <ProfileScreen actions={actions} theme={theme} /> : null}
      <MainTabBar activeTab={activeTab} actions={actions} theme={theme} />
    </View>
  );
}

function HomeScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFRow style={{ justifyContent: 'space-between' }}>
          <ScreenTitle eyebrow="Showcase" subtitle="Reusable native mobile scaffold." theme={theme} title="Hello, developer" />
          <Pressable onPress={() => actions.openSheet('Notifications', 'Unread build, token, and permission events will appear here.')}>
            <View style={{ alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }}>
              <MFText theme={theme} style={{ color: theme.colors.primary, fontWeight: '900' }}>
                !
              </MFText>
            </View>
          </Pressable>
        </MFRow>
        <MFSearchBar placeholder="Search components, native capabilities, templates, or modules" theme={theme} />
        <MFRow gap={12}>
          <MFStatCard label="Components" onPress={() => actions.setTab('components')} theme={theme} value="32" />
          <MFStatCard label="Native" onPress={() => actions.setTab('native')} theme={theme} value="28" />
        </MFRow>
        <MFRow gap={12}>
          <MFStatCard label="Templates" onPress={() => actions.setTab('templates')} theme={theme} value="16" />
          <MFStatCard label="Modules" onPress={() => actions.openSheet('Modules', 'Module creation is available through mf:create-module.')} theme={theme} value="12" />
        </MFRow>
        <ActionGrid
          actions={[
            ['New screen', () => actions.openSheet('New screen', 'Use mf:create-screen to create a typed screen scaffold.')],
            ['New component', () => actions.openSheet('New component', 'Use mf:create-native-component for a native component contract.')],
            ['New module', () => actions.openSheet('New module', 'Use mf:create-module to create a module manifest.')],
            ['Import project', () => actions.showToast('Import flow is reserved')]
          ]}
          theme={theme}
        />
        <MFGlassPanel theme={theme}>
          <MFStack gap={10}>
            <MFRow style={{ justifyContent: 'space-between' }}>
              <MFText theme={theme} style={{ fontWeight: '900' }}>
                Development environment
              </MFText>
              <MFBadge label="v1.2.0" tone="success" theme={theme} />
            </MFRow>
            <MFCaption theme={theme}>TypeScript, lint, test, tokens, shell, and local showcase pages are wired.</MFCaption>
            <MFProgress label="First-version scaffold loop" theme={theme} value={0.68} />
          </MFStack>
        </MFGlassPanel>
      </MFStack>
    </MFScrollPage>
  );
}

function CatalogScreen({ actions, kind, theme }: { actions: AppActions; kind: 'components' | 'native' | 'templates'; theme: MFTheme }) {
  const data = {
    components: {
      title: 'Components',
      subtitle: 'Primitive, component, pattern, and feedback building blocks.',
      rows: ['MFButton', 'MFInput', 'MFCard', 'MFListItem', 'MFToast']
    },
    native: {
      title: 'Native capabilities',
      subtitle: 'Contracts for secure storage, permissions, biometrics, network state, and files.',
      rows: ['SecureVaultModule', 'BiometricModule', 'PermissionModule', 'NetworkMonitorModule', 'LoggerModule']
    },
    templates: {
      title: 'Page templates',
      subtitle: 'Reusable page shapes for generated apps and modules.',
      rows: ['ListPage', 'DetailPage', 'DashboardPage', 'EditorPage', 'SettingsPage']
    }
  }[kind];

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <ScreenTitle eyebrow="Library" subtitle={data.subtitle} theme={theme} title={data.title} />
        <MFCard padded={false} theme={theme}>
          {data.rows.map((row, index) => (
            <View key={row}>
              <MFListItem
                meta="Tap to preview the reserved contract."
                onPress={() => {
                  if (kind === 'native') {
                    void previewNativeCapability(row, actions);
                    return;
                  }

                  actions.openSheet(row, `${row} is documented as part of the MobileFrame first-version catalog.`);
                }}
                theme={theme}
                title={row}
              />
              {index < data.rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        {kind === 'templates' ? (
          <MFEmptyState
            actionLabel="Create screen"
            message="Generated template previews will appear here after a screen scaffold is created."
            onAction={() => actions.openSheet('Create screen', 'Use mf:create-screen to create a typed template preview.')}
            theme={theme}
            title="No generated previews"
          />
        ) : null}
      </MFStack>
    </MFScrollPage>
  );
}

function ProfileScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <MFGlassPanel theme={theme}>
          <MFRow gap={14}>
            <View style={{ alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }}>
              <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 24, fontWeight: '900' }}>
                D
              </MFText>
            </View>
            <MFStack gap={4} style={{ flex: 1 }}>
              <MFText theme={theme} style={{ fontSize: 18, fontWeight: '900' }}>
                Demo user
              </MFText>
              <MFCaption theme={theme}>Product manager</MFCaption>
            </MFStack>
          </MFRow>
        </MFGlassPanel>
        <MFRow gap={12}>
          <MFStatCard label="Tasks" theme={theme} value="12" />
          <MFStatCard label="Components" theme={theme} value="8" />
          <MFStatCard label="Docs" theme={theme} value="5" />
        </MFRow>
        <MFCard padded={false} theme={theme}>
          {[
            ['Personal info', 'personalInfo'],
            ['Account security', 'reserved'],
            ['Notification settings', 'reserved'],
            ['Settings', 'settings'],
            ['General settings', 'generalSettings'],
            ['Help and feedback', 'reserved'],
            ['About', 'about']
          ].map(([title, target], index, rows) => (
            <View key={title}>
              <MFListItem
                onPress={() => {
                  if (target === 'reserved') {
                    actions.showToast(`${title} is reserved`);
                    return;
                  }
                  actions.setScreen(target as ScreenKey);
                }}
                theme={theme}
                title={title}
              />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function SettingsScreen({
  actions,
  switches,
  theme,
  themeChoice
}: {
  actions: AppActions;
  switches: {
    animation: boolean;
    autoUpdate: boolean;
    haptics: boolean;
    sound: boolean;
    systemTheme: boolean;
  };
  theme: MFTheme;
  themeChoice: ThemeChoice;
}) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <TopBack actions={actions} target="main" theme={theme} />
        <ScreenTitle eyebrow="Settings" subtitle="Local shell settings and system capability entry points." theme={theme} title="App settings" />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFText theme={theme} style={{ fontWeight: '900' }}>
              Appearance
            </MFText>
            <MFSegmentedControl onChange={actions.setThemeChoice} options={themeOptions} theme={theme} value={themeChoice} />
            <MFCheckbox
              label="Follow system preference"
              onValueChange={(value) => actions.setSwitches((current) => ({ ...current, systemTheme: value }))}
              theme={theme}
              value={switches.systemTheme}
            />
          </MFStack>
        </MFCard>
        <MFCard padded={false} theme={theme}>
          {[
            ['Permission management', 'permissions'],
            ['Security and privacy', 'reserved'],
            ['Network status', 'reserved'],
            ['Biometrics', 'reserved'],
            ['General settings', 'generalSettings'],
            ['About', 'about']
          ].map(([title, target], index, rows) => (
            <View key={title}>
              <MFListItem
                onPress={() => {
                  if (target === 'reserved') {
                    actions.showToast(`${title} is reserved`);
                    return;
                  }
                  actions.setScreen(target as ScreenKey);
                }}
                theme={theme}
                title={title}
              />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFStatusCard message="Wi-Fi online, storage has 38 GB free, memory is stable." theme={theme} title="System status" tone="success" />
      </MFStack>
    </MFScrollPage>
  );
}

function PermissionsScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  const granted = ['Camera', 'Photos', 'Microphone', 'Notifications', 'Biometrics'];
  const manual = ['Clipboard', 'File access'];

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <TopBack actions={actions} target="settings" theme={theme} />
        <ScreenTitle eyebrow="System" subtitle="PermissionModule remains the single entry for permission flows." theme={theme} title="Permissions" />
        <MFCard padded={false} theme={theme}>
          {granted.map((item, index) => (
            <View key={item}>
              <MFListItem
                meta="Granted in the mock profile"
                onPress={() => void previewPermission(item, actions)}
                right={<MFBadge label="Granted" tone="success" theme={theme} />}
                theme={theme}
                title={item}
              />
              {index < granted.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFCard padded={false} theme={theme}>
          {manual.map((item, index) => (
            <View key={item}>
              <MFListItem
                meta="Requires system settings"
                onPress={() => void previewPermission(item, actions)}
                right={<MFBadge label="Manual" tone="warning" theme={theme} />}
                theme={theme}
                title={item}
              />
              {index < manual.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFGlassPanel theme={theme}>
          <MFCaption theme={theme}>Privacy note: permissions are requested only when a feature needs them.</MFCaption>
        </MFGlassPanel>
      </MFStack>
    </MFScrollPage>
  );
}

function PersonalInfoScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <TopBack actions={actions} target="main" theme={theme} />
        <ScreenTitle eyebrow="Profile" subtitle="Editable user fields backed by local mock state." theme={theme} title="Personal info" />
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFRow gap={14}>
              <View style={{ alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 28, height: 56, justifyContent: 'center', width: 56 }}>
                <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 24, fontWeight: '900' }}>
                  D
                </MFText>
              </View>
              <MFStack gap={2} style={{ flex: 1 }}>
                <MFText theme={theme} style={{ fontWeight: '900' }}>
                  Demo user
                </MFText>
                <MFCaption theme={theme}>Product manager</MFCaption>
              </MFStack>
            </MFRow>
            <MFFormField label="Phone number" theme={theme}>
              <MFInput defaultValue="138 **** 5678" placeholder="Phone number" theme={theme} />
            </MFFormField>
            <MFFormField label="Email" theme={theme}>
              <MFInput defaultValue="demo@example.com" placeholder="Email" theme={theme} />
            </MFFormField>
            <MFFormField label="Department" theme={theme}>
              <MFInput defaultValue="Product" placeholder="Department" theme={theme} />
            </MFFormField>
            <MFFormField label="Signature" theme={theme}>
              <MFTextArea defaultValue="Focused on reusable mobile foundations." placeholder="Signature" theme={theme} />
            </MFFormField>
            <MFKeyValue label="WeChat" theme={theme} value="linked" />
            <MFKeyValue label="Apple ID" theme={theme} value="linked" />
            <MFKeyValue label="Email" theme={theme} value="verified" />
            <MFButton onPress={() => actions.showToast('Saved successfully')} theme={theme} title="Save changes" />
          </MFStack>
        </MFCard>
      </MFStack>
    </MFScrollPage>
  );
}

function GeneralSettingsScreen({
  actions,
  switches,
  theme
}: {
  actions: AppActions;
  switches: {
    animation: boolean;
    autoUpdate: boolean;
    haptics: boolean;
    sound: boolean;
    systemTheme: boolean;
  };
  theme: MFTheme;
}) {
  const toggle = (key: keyof typeof switches) => actions.setSwitches((current) => ({ ...current, [key]: !current[key] }));

  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <TopBack actions={actions} target="settings" theme={theme} />
        <ScreenTitle eyebrow="Preferences" subtitle="General settings use local mock state for the first loop." theme={theme} title="General settings" />
        <MFCard padded={false} theme={theme}>
          {['Language and region - Simplified Chinese', 'Font size - Standard', 'Default home - Home', 'Cache management - 128 MB'].map((title, index, rows) => (
            <View key={title}>
              <MFListItem onPress={() => actions.openSheet(title, 'Selection and cleanup flows are reserved for native adapters.')} theme={theme} title={title} />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <MFText theme={theme} style={{ fontWeight: '900' }}>
              Default home
            </MFText>
            {['Home', 'Components', 'Templates'].map((option) => (
              <MFRadio
                key={option}
                label={option}
                onPress={() => actions.showToast(`Default home reserved: ${option}`)}
                selected={option === 'Home'}
                theme={theme}
              />
            ))}
          </MFStack>
        </MFCard>
        <MFCard theme={theme}>
          <MFStack gap={12}>
            <ToggleRow label="Automatic updates" onValueChange={() => toggle('autoUpdate')} theme={theme} value={switches.autoUpdate} />
            <ToggleRow label="Animations" onValueChange={() => toggle('animation')} theme={theme} value={switches.animation} />
            <ToggleRow label="Sound" onValueChange={() => toggle('sound')} theme={theme} value={switches.sound} />
            <ToggleRow label="Haptics" onValueChange={() => toggle('haptics')} theme={theme} value={switches.haptics} />
          </MFStack>
        </MFCard>
        <MFButton onPress={() => actions.openSheet('Storage cleanup', 'This action will request confirmation before clearing cached files.')} theme={theme} title="Clean storage" variant="secondary" />
      </MFStack>
    </MFScrollPage>
  );
}

function AboutScreen({ actions, theme }: { actions: AppActions; theme: MFTheme }) {
  return (
    <MFScrollPage theme={theme}>
      <MFStack gap={18}>
        <TopBack actions={actions} target="settings" theme={theme} />
        <MFGlassPanel theme={theme}>
          <MFStack gap={12} style={{ alignItems: 'center' }}>
            <View style={{ alignItems: 'center', backgroundColor: theme.colors.primarySoft, borderRadius: 32, height: 72, justifyContent: 'center', width: 72 }}>
              <MFText theme={theme} style={{ color: theme.colors.primary, fontSize: 30, fontWeight: '900' }}>
                M
              </MFText>
            </View>
            <MFHeading theme={theme}>MobileFrame</MFHeading>
            <MFCaption theme={theme}>Version 1.0.0, build 100</MFCaption>
          </MFStack>
        </MFGlassPanel>
        <MFCard padded={false} theme={theme}>
          {['Official website', 'Open source licenses', 'Privacy policy', 'User agreement', 'Changelog', 'Contact us'].map((title, index, rows) => (
            <View key={title}>
              <MFListItem onPress={() => actions.openSheet(title, `${title} will be connected to the app shell link adapter.`)} theme={theme} title={title} />
              {index < rows.length - 1 ? <MFDivider /> : null}
            </View>
          ))}
        </MFCard>
        <MFButton onPress={() => actions.showToast('Already on the latest version')} theme={theme} title="Check for updates" variant="secondary" />
      </MFStack>
    </MFScrollPage>
  );
}

function ScreenTitle({ eyebrow, subtitle, theme, title }: { eyebrow: string; subtitle: string; theme: MFTheme; title: string }) {
  return <MFPageHeader eyebrow={eyebrow} subtitle={subtitle} theme={theme} title={title} />;
}

function TopBack({ actions, target, theme }: { actions: AppActions; target: ScreenKey; theme: MFTheme }) {
  return <MFBackButton onPress={() => actions.setScreen(target)} theme={theme} />;
}

function ToggleRow({ label, onValueChange, theme, value }: { label: string; onValueChange: () => void; theme: MFTheme; value: boolean }) {
  return (
    <MFRow style={{ justifyContent: 'space-between' }}>
      <MFText theme={theme} style={{ fontWeight: '800' }}>
        {label}
      </MFText>
      <MFSwitch onValueChange={onValueChange} theme={theme} value={value} />
    </MFRow>
  );
}

function ActionGrid({ actions, theme }: { actions: Array<[string, () => void]>; theme: MFTheme }) {
  return (
    <MFCard theme={theme}>
      <MFStack gap={12}>
        <MFText theme={theme} style={{ fontWeight: '900' }}>
          Quick actions
        </MFText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {actions.map(([title, onPress]) => (
            <View key={title} style={{ minWidth: '46%' }}>
              <MFButton fullWidth onPress={onPress} theme={theme} title={title} variant="secondary" />
            </View>
          ))}
        </View>
      </MFStack>
    </MFCard>
  );
}

function MainTabBar({ actions, activeTab, theme }: { actions: AppActions; activeTab: MainTab; theme: MFTheme }) {
  return (
    <MFTabBar
      items={tabs.map((item) => ({ label: item.label, value: item.key }))}
      onChange={actions.setTab}
      style={{ bottom: 12, left: 12, position: 'absolute', right: 12 }}
      theme={theme}
      value={activeTab}
    />
  );
}

export default App;
