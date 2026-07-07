import { useState, useEffect, useMemo } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'super_admin' | 'sales_manager' | 'sales_executive' | 'survey_engineer' | 'installation_team' | 'accounts_staff' | 'admin';

export const allRoles = [
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'sales_manager', label: 'Sales Manager' },
  { id: 'sales_executive', label: 'Sales Executive' },
  { id: 'survey_engineer', label: 'Survey Engineer' },
  { id: 'installation_team', label: 'Installation Team' },
  { id: 'accounts_staff', label: 'Accounts Staff' },
];

export const allModules = [
  { id: '/dashboard/leads', label: 'Leads' },
  { id: '/dashboard/customers', label: 'Customers' },
  { id: '/dashboard/followups', label: 'Follow-ups' },
  { id: '/dashboard/surveys', label: 'Surveys' },
  { id: '/dashboard/quotations', label: 'Quotations' },
  { id: '/dashboard/projects', label: 'Projects' },
  { id: '/dashboard/payments', label: 'Payments' },
  { id: '/dashboard/invoices', label: 'Invoices' },
  { id: '/dashboard/support', label: 'Support' },
  { id: '/dashboard/tasks', label: 'Tasks' },
  { id: '/dashboard/documents', label: 'Documents' },
  { id: '/dashboard/calendar', label: 'Calendar' },
  { id: '/dashboard/reports', label: 'Reports' },
  { id: '/dashboard/settings', label: 'Settings' },
  { id: '/dashboard/notifications', label: 'Notifications' },
  { id: '/dashboard/my-dashboard', label: 'My Dashboard' },
  { id: '/dashboard/help', label: 'Help' },
];

const universalPaths = ['/dashboard/my-dashboard', '/dashboard/help'];

const defaultRolePermissions: Record<string, string[]> = {
  sales_manager: [...universalPaths, '/dashboard/leads', '/dashboard/customers', '/dashboard/followups', '/dashboard/surveys', '/dashboard/quotations', '/dashboard/projects', '/dashboard/payments', '/dashboard/support', '/dashboard/tasks', '/dashboard/documents', '/dashboard/calendar', '/dashboard/reports'],
  sales_executive: [...universalPaths, '/dashboard/leads', '/dashboard/customers', '/dashboard/followups', '/dashboard/support', '/dashboard/tasks', '/dashboard/calendar'],
  survey_engineer: [...universalPaths, '/dashboard/surveys', '/dashboard/tasks', '/dashboard/calendar'],
  installation_team: [...universalPaths, '/dashboard/projects', '/dashboard/tasks', '/dashboard/documents', '/dashboard/calendar'],
  accounts_staff: [...universalPaths, '/dashboard/customers', '/dashboard/payments', '/dashboard/invoices', '/dashboard/reports'],
};

export function canAccess(role: string | undefined, pathname: string, rolePermissions?: Record<string, string[]>): boolean {
  if (!role) return false;
  if (role === 'super_admin' || role === 'admin') return true;
  if (universalPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))) return true;

  const perms = rolePermissions || defaultRolePermissions;
  const allowed = perms[role];
  if (!allowed) return false;

  for (const p of allowed) {
    if (pathname === p || pathname.startsWith(p + '/')) return true;
  }
  return false;
}

export function canWrite(role: string | undefined): boolean {
  return role === 'super_admin' || role === 'admin';
}

export function useCanWrite(): boolean {
  const { userData } = useAuth();
  return useMemo(() => canWrite(userData?.role), [userData?.role]);
}

export function usePermissions() {
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'permissions'));
        if (snap.exists() && snap.data().rolePermissions) {
          setRolePermissions({ ...defaultRolePermissions, ...snap.data().rolePermissions });
        } else {
          setRolePermissions(defaultRolePermissions);
        }
      } catch {
        setRolePermissions(defaultRolePermissions);
      }
      setLoading(false);
    };
    load();
  }, []);

  const checkAccess = (role: string | undefined, pathname: string) =>
    canAccess(role, pathname, rolePermissions || undefined);

  return { rolePermissions, loading, checkAccess };
}
