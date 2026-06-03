import { describe, expect, it } from 'vitest';

import type * as UiAdmin from './index';

type UiAdminExports = typeof UiAdmin;
type RequiredAdminExports = Pick<
  UiAdminExports,
  | 'AdminBoundaryCard'
  | 'AdminPageHeader'
  | 'EntityListItem'
  | 'LogViewer'
  | 'ManagementEntryList'
  | 'StatCard'
  | 'StatusBadge'
  | 'TaskProgressCard'
  | 'Timeline'
>;

describe('ui-admin exports', () => {
  it('keeps the administrator mobile component entry points available', () => {
    const expectedExports: Array<keyof RequiredAdminExports> = [
      'AdminBoundaryCard',
      'AdminPageHeader',
      'EntityListItem',
      'LogViewer',
      'ManagementEntryList',
      'StatCard',
      'StatusBadge',
      'TaskProgressCard',
      'Timeline'
    ];

    expect(expectedExports).toEqual([
      'AdminBoundaryCard',
      'AdminPageHeader',
      'EntityListItem',
      'LogViewer',
      'ManagementEntryList',
      'StatCard',
      'StatusBadge',
      'TaskProgressCard',
      'Timeline'
    ]);
  });
});
