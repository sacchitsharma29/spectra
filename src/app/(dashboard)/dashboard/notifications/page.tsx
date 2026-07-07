'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useCollection, addDocument, updateDocument, deleteDocument } from '@/hooks/useFirestore';
import { useAuth } from '@/contexts/AuthContext';
import { Bell, UserPlus, Calendar, CreditCard, ClipboardCheck, HardHat, HeadphonesIcon, CheckSquare, Trash2, CheckCheck, Plus } from 'lucide-react';
import { formatDateTime, toDate } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  userId: string;
  createdAt: any;
}

const typeIcons: Record<string, any> = {
  lead: UserPlus,
  followup: Calendar,
  payment: CreditCard,
  survey: ClipboardCheck,
  installation: HardHat,
  service: HeadphonesIcon,
  task: CheckSquare,
};

const typeColors: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  followup: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  payment: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  survey: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  installation: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  service: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  task: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
};

export default function NotificationsPage() {
  const { userData } = useAuth();
  const canWrite = useCanWrite();
  const { data: allNotifications, loading } = useCollection<Notification>('notifications');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'lead' });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('notifications', deleteTarget.id);
      toast.success('Notification deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const notifications = allNotifications.filter((n) => n.userId === userData?.uid || !n.userId);
  const [readState, setReadState] = useState<Set<string>>(new Set());
  const unread = notifications.filter((n) => !n.read && !readState.has(n.id)).length;

  const markRead = async (id: string) => {
    try {
      await updateDocument('notifications', id, { read: true });
      setReadState((prev) => new Set(prev).add(id));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    const unreadItems = notifications.filter((n) => !n.read && !readState.has(n.id));
    try {
      await Promise.all(unreadItems.map((n) => updateDocument('notifications', n.id, { read: true })));
      setReadState(new Set(unreadItems.map((n) => n.id)));
      toast.success('Marked all as read');
    } catch { toast.error('Failed to mark all as read'); }
  };

  const handleAdd = async () => {
    if (!newNotif.title || !newNotif.message) { toast.error('Please fill all fields'); return; }
    try {
      await addDocument('notifications', {
        ...newNotif,
        userId: userData?.uid || '',
        read: false,
      });
      toast.success('Notification added');
      setShowAddModal(false);
      setNewNotif({ title: '', message: '', type: 'lead' });
    } catch (err: any) { toast.error(err?.message || 'Failed to add notification'); }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {unread > 0 ? `You have ${unread} unread notification${unread > 1 ? 's' : ''}` : 'No unread notifications'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
            <Button variant="outline" size="sm" onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
              Add
            </Button>
          )}
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} icon={<CheckCheck className="w-4 h-4" />}>
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-4 p-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] || Bell;
                const isRead = n.read || readState.has(n.id);
                return (
                  <div
                    key={n.id}
                    onClick={() => { if (!isRead) markRead(n.id); }}
                    className={`flex items-start gap-4 p-4 transition-colors cursor-pointer ${
                      !isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeColors[n.type] || typeColors.lead}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900 dark:text-gray-100' : 'text-gray-700 dark:text-gray-300'}`}>
                          {n.title}
                        </p>
                        {!isRead && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1.5" />}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{n.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDateTime(toDate(n.createdAt))}</p>
                    </div>
                    {canWrite && (
                      <button
                        onClick={() => setDeleteTarget(n)}
                        className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors shrink-0"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Notification" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this notification? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Notification">
        <div className="space-y-4">
          <Input label="Title" value={newNotif.title} onChange={(e) => setNewNotif({ ...newNotif, title: e.target.value })} />
          <Input label="Message" value={newNotif.message} onChange={(e) => setNewNotif({ ...newNotif, message: e.target.value })} />
          <Select
            label="Type"
            options={[
              { value: 'lead', label: 'Lead' }, { value: 'followup', label: 'Follow-up' },
              { value: 'payment', label: 'Payment' }, { value: 'survey', label: 'Survey' },
              { value: 'installation', label: 'Installation' }, { value: 'service', label: 'Service' },
              { value: 'task', label: 'Task' },
            ]}
            value={newNotif.type}
            onChange={(e) => setNewNotif({ ...newNotif, type: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
