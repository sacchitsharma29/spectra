'use client';

import React from 'react';
import Link from 'next/link';
import { Bell, Search, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { getInitials } from '@/lib/utils';
import { where } from 'firebase/firestore';

export function Navbar() {
  const { userData, signOut } = useAuth();
  const { data: userNotifications } = useCollection<any>('notifications', [where('read', '==', false)]);
  const unreadCount = userNotifications.filter((n) => !n.userId || n.userId === userData?.uid).length;

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search leads, customers, projects..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/notifications"
          className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
        </Link>

        <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200 dark:border-gray-700">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userData?.name || 'User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
              {userData?.role?.replace('_', ' ') || ''}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            {getInitials(userData?.name || 'U')}
          </div>
        </div>
      </div>
    </header>
  );
}
