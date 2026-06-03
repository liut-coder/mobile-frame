# MobileFrame Product Overview

Last updated: 2026-06-03

## Product Positioning

MobileFrame is a reusable mobile application foundation for teams that need to create multiple business apps without rebuilding the same native shell, design system, module contracts, and scaffolding every time.

It is not a single-purpose app. It is a starter platform that gives a team a ready React Native bare project, a shared UI system, native capability contracts, app/module generators, and a showcase app that demonstrates how the pieces fit together.

## Target Users

- Product engineering teams building multiple internal or customer-facing mobile apps.
- Platform teams standardizing React Native app architecture across projects.
- Developers who need a fast way to generate app shells, modules, screens, and native extension points.
- Teams that need a bridge between TypeScript business logic and platform-native iOS/Android capabilities.

## Product Value

MobileFrame reduces repeated setup work in four areas:

- App foundation: workspace structure, TypeScript, linting, testing, validation, and native project folders are already wired.
- UI foundation: shared tokens, component primitives, layout helpers, feedback components, and app shell state are available from the start.
- Native foundation: platform capability contracts and mock adapters provide a stable TypeScript-facing boundary before real native modules are implemented.
- Delivery foundation: generators and validation scripts give teams a consistent path for creating apps, modules, screens, and native extension points.

## Core Product Experience

The showcase app is the reference experience. It demonstrates:

- App startup and local navigation.
- Theme switching.
- Toast and sheet feedback.
- Forms and validation.
- Settings/profile flows.
- Permission and system capability placeholders.
- Catalog-style areas for components, templates, modules, and native capabilities.

The intended product workflow is:

1. Choose a preset for the new app.
2. Generate an app shell with `mf:create-app`.
3. Generate business modules and screens.
4. Mount modules through the app shell.
5. Use shared UI and native capability contracts.
6. Validate with `mf:validate`.
7. Build native iOS/Android projects when the local toolchain is available.

## Feature Scope

Current product scope:

- React Native bare showcase app.
- pnpm monorepo workspace.
- Shared TypeScript configuration.
- ESLint, Vitest, and TypeScript build validation.
- UI token and component packages.
- App shell package.
- Native capability contract package.
- Module SDK and preset package.
- Reusable `ui-admin`, `auth-admin`, and `realtime` packages plus the first `game-helper-admin-mobile` scaffold using the `admin-mobile` preset.
- Code generators.
- Native readiness and native build preflight scripts.
- Android debug APK build evidence.
- Android emulator runtime evidence from GitHub Actions run `26906180713`.
- Android Release scaffold evidence from GitHub Actions run `26906180713`.

Planned product scope:

- iOS simulator build evidence on macOS.
- Android production Release signing evidence.
- Admin-mobile capabilities beyond the first scaffold: real WebSocket/BFF transport, scanner, clipboard, sharing, server-backed pagination/search data flows, and real `/api/v1/mobile` BFF contracts.
- Real platform implementations for selected native capability modules.
- More complete reusable page templates.
- More complete module catalog and preset coverage.
- CI workflow that runs workspace validation and platform-specific build checks on suitable hosts.

## Native Capability Strategy

MobileFrame keeps app pages away from direct platform API calls. Pages and business modules should use TypeScript contracts such as permission, clipboard, network, biometric, secure vault, lifecycle, logger, and device-info adapters.

This keeps the product scalable:

- Mock adapters can support early UI and product work.
- Real native modules can replace mocks without changing page code.
- iOS and Android can evolve independently behind a shared contract.
- Security rules can be enforced at the capability boundary.

## Success Criteria

The scaffold is successful when a team can:

- Generate a new app or module without copying files by hand.
- Build and test shared TypeScript packages with one validation command.
- Run the showcase app through native Android and iOS toolchains.
- Add a native capability without changing unrelated app code.
- Reuse the same app shell and UI system across multiple app products.

The current milestone has reached source-level validation, Android debug APK assembly proof, Android Release scaffold proof, Android emulator runtime proof through GitHub Actions run `26906180713`, the first `game-helper-admin-mobile` adaptation pass from `docs/game-helper-admin-mobile-mobile-frame-adaptation.md`, reusable admin-mobile permission gates through `packages/auth-admin`, fixture-backed realtime subscriptions through `packages/realtime`, and mobile list filtering/pagination components through `packages/ui-admin`. The next closure milestone is production Android signing evidence, native build/runtime proof on iOS, and real admin-mobile service capabilities behind the current scaffold.
