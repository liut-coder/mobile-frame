import { describe, expect, it } from 'vitest';

import { defineModule, sortModulesByTabOrder } from './index';

const Screen = () => null;

describe('defineModule', () => {
  it('preserves module metadata', () => {
    const module = defineModule({
      id: 'terminal',
      name: 'Terminal',
      version: '1.0.0',
      routes: [{ name: 'terminal.home', screen: Screen }],
      permissions: ['network.read'],
      capabilities: ['terminal.session']
    });

    expect(module.id).toBe('terminal');
  });
});

describe('sortModulesByTabOrder', () => {
  it('sorts modules with tabs first', () => {
    const result = sortModulesByTabOrder([
      defineModule({
        id: 'late',
        name: 'Late',
        version: '1.0.0',
        routes: [],
        permissions: [],
        capabilities: [],
        navigation: { tab: { title: 'Late', icon: 'clock', order: 20 } }
      }),
      defineModule({
        id: 'early',
        name: 'Early',
        version: '1.0.0',
        routes: [],
        permissions: [],
        capabilities: [],
        navigation: { tab: { title: 'Early', icon: 'bolt', order: 10 } }
      })
    ]);

    expect(result.map((module) => module.id)).toEqual(['early', 'late']);
  });
});
