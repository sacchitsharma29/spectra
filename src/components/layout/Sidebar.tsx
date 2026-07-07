'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserPlus, CalendarCheck, ClipboardCheck,
  FileText, HardHat, CreditCard, FileSpreadsheet, HeadphonesIcon,
  CheckSquare, FolderOpen, Calendar, BarChart3, Settings,
  Bell, X, Menu, Sun, Moon, LogOut, ChevronLeft, ChevronRight, LifeBuoy,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { Logo } from '@/components/ui/Logo';
import { getInitials, formatRoleName } from '@/lib/utils';
import { usePermissions } from '@/lib/permissions';

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'My Dashboard', icon: UserCheck, href: '/dashboard/my-dashboard' },
  { label: 'Leads', icon: UserPlus, href: '/dashboard/leads' },
  { label: 'Customers', icon: Users, href: '/dashboard/customers' },
  { label: 'Follow-ups', icon: CalendarCheck, href: '/dashboard/followups' },
  { label: 'Surveys', icon: ClipboardCheck, href: '/dashboard/surveys' },
  { label: 'Quotations', icon: FileText, href: '/dashboard/quotations' },
  { label: 'Projects', icon: HardHat, href: '/dashboard/projects' },
  { label: 'Payments', icon: CreditCard, href: '/dashboard/payments' },
  { label: 'Invoices', icon: FileSpreadsheet, href: '/dashboard/invoices' },
  { label: 'Support', icon: HeadphonesIcon, href: '/dashboard/support' },
  { label: 'Tasks', icon: CheckSquare, href: '/dashboard/tasks' },
  { label: 'Documents', icon: FolderOpen, href: '/dashboard/documents' },
  { label: 'Calendar', icon: Calendar, href: '/dashboard/calendar' },
  { label: 'Reports', icon: BarChart3, href: '/dashboard/reports' },
  { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  { label: 'Help', icon: LifeBuoy, href: '/dashboard/help' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { userData, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const { checkAccess } = usePermissions();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col ${
          collapsed ? 'w-[72px]' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <Link href="/dashboard" className="min-w-0" onClick={() => setMobileOpen(false)}>
            <Logo size="md" showText={!collapsed} />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
          {menuItems.filter((item) => checkAccess(userData?.role, item.href)).map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800/70'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 dark:border-gray-800 p-3 shrink-0">
          <div className={`flex items-center gap-3 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {getInitials(userData?.name || 'U')}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate leading-tight">
                  {userData?.name || 'User'}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                  {formatRoleName(userData?.role || '')}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 mx-auto" /> : <Moon className="w-4 h-4 mx-auto" />}
            </button>
            <button
              onClick={toggleCollapsed}
              className="hidden lg:flex flex-1 p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors items-center justify-center"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={signOut}
              className="flex-1 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 mx-auto" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
