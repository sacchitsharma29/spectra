'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { useCollection } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate, toDate } from '@/lib/utils';
import { where } from 'firebase/firestore';
import {
  CheckCircle2, Clock, LifeBuoy,
  ArrowUpRight, ListTodo,
} from 'lucide-react';

interface Task {
  id: string; title: string; description?: string; assignedTo: string; assignedToUid?: string;
  priority: string; dueDate: any; status: string;
}

interface Ticket {
  id: string; subject: string; status: string; priority: string; createdAt: any; description?: string;
}

export default function MyDashboardPage() {
  const { userData, firestoreReady } = useAuth();
  const uid = userData?.uid || '';
  const name = userData?.name || userData?.email || 'Team Member';

  const { data: myTasks, loading: tasksLoading } = useCollection<Task>('tasks', [where('assignedToUid', '==', uid)]);
  const { data: myTickets, loading: ticketsLoading } = useCollection<Ticket>('tickets', [where('createdBy', '==', uid)]);

  const openTasks = useMemo(() => myTasks.filter((t) => t.status !== 'Completed'), [myTasks]);
  const completedTasks = useMemo(() => myTasks.filter((t) => t.status === 'Completed'), [myTasks]);
  const dueSoon = useMemo(() => {
    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return openTasks.filter((t) => {
      const d = toDate(t.dueDate);
      return d && d >= now && d <= weekLater;
    });
  }, [openTasks]);
  const openTickets = useMemo(() => myTickets.filter((t) => t.status === 'Open'), [myTickets]);

  const stats = [
    { title: 'My Tasks', value: openTasks.length, icon: <ListTodo className="w-5 h-5" />, color: 'blue' as const },
    { title: 'Due This Week', value: dueSoon.length, icon: <Clock className="w-5 h-5" />, color: 'orange' as const },
    { title: 'Completed', value: completedTasks.length, icon: <CheckCircle2 className="w-5 h-5" />, color: 'green' as const },
    { title: 'Open Tickets', value: openTickets.length, icon: <LifeBuoy className="w-5 h-5" />, color: 'purple' as const },
  ];

  const loading = !firestoreReady || tasksLoading || ticketsLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back, {name.split(' ')[0]}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Here&apos;s an overview of your work</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
          : stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-500" /> My Tasks
            </h2>
            <Link href="/dashboard/tasks" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : openTasks.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">All caught up! No pending tasks.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {openTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Due: {formatDate(t.dueDate)}
                        {t.priority === 'High' || t.priority === 'Urgent'
                          ? <span className="ml-2 text-red-500 font-medium">{t.priority}</span>
                          : <span className="ml-2 text-gray-400">{t.priority}</span>}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${
                      t.status === 'In Progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      t.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-600'
                    }`}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-purple-500" /> My Tickets
            </h2>
            <Link href="/dashboard/help" className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="space-y-3 p-4">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : myTickets.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <LifeBuoy className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">No tickets raised yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {myTickets.slice(0, 5).map((t) => (
                  <div key={t.id} className="p-3 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{t.subject}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ml-2 ${
                      t.status === 'Open' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      t.status === 'Resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-gray-100 text-gray-600'
                    }`}>{t.status}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
