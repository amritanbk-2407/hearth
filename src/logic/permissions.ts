import type { Role } from '../types';

/**
 * Role-based access control for a household.
 *  admin  – full control, manages members and roles
 *  member – everything except managing members
 *  helper – domestic help: can complete chores, update stock and fix-ups,
 *           but cannot see or change money.
 */
export type Permission =
  | 'manageMembers'
  | 'manageMoney'
  | 'viewMoney'
  | 'manageChores'
  | 'completeChores'
  | 'manageStock'
  | 'manageFixUps'
  | 'resetData';

const matrix: Record<Role, Permission[]> = {
  admin: [
    'manageMembers',
    'manageMoney',
    'viewMoney',
    'manageChores',
    'completeChores',
    'manageStock',
    'manageFixUps',
    'resetData',
  ],
  member: ['manageMoney', 'viewMoney', 'manageChores', 'completeChores', 'manageStock', 'manageFixUps'],
  helper: ['completeChores', 'manageStock', 'manageFixUps'],
};

export const can = (role: Role | undefined, p: Permission) => (role ? matrix[role].includes(p) : false);

export const roleLabel: Record<Role, string> = {
  admin: 'Admin',
  member: 'Member',
  helper: 'Helper',
};

export const roleDescription: Record<Role, string> = {
  admin: 'Full access, manages members & roles',
  member: 'Manages chores, bills, stock & fix-ups',
  helper: 'Chores, stock & fix-ups only (no money)',
};
