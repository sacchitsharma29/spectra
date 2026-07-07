'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, updateDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, getStatusColor, getPriorityColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string; title: string; description?: string; assignedTo: string; assignedToUid?: string;
  priority: string; dueDate: any; status: string;
}

interface UserDoc {
  id: string; name: string; email: string; role: string;
}

export default function TasksPage() {
  const [showModal, setShowModal] = useState(false);
  const { data: tasks, loading } = useCollection<Task>('tasks');
  const { data: users } = useCollection<UserDoc>('users');
  const { userData } = useAuth();
  const canWrite = useCanWrite();
  const [form, setForm] = useState({ title: '', description: '', assignedToUid: '', assignedTo: '', dueDate: '', priority: 'Medium' });
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const userOptions = users.map((u) => ({ value: u.id, label: `${u.name || u.email} (${u.role || 'no role'})` }));

  const columns: Column<Task>[] = [
    { key: 'title', header: 'Task', render: (t) => <span className="font-medium">{t.title}</span> },
    { key: 'assignedTo', header: 'Assigned To' },
    { key: 'priority', header: 'Priority', render: (t) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(t.priority)}`}>{t.priority}</span> },
    { key: 'dueDate', header: 'Due', render: (t) => <span className="text-gray-500">{formatDate(t.dueDate)}</span> },
    { key: 'status', header: 'Status', render: (t) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(t.status)}`}>{t.status}</span> },
    {
      key: 'actions', header: '', render: (t) => (
        <div className="flex gap-1">
          {t.status !== 'Completed' && !canWrite && (
            <button
              onClick={() => handleMarkComplete(t)}
              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
              title="Mark Complete"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
          {canWrite && (
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(t); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    if (!form.title) { toast.error('Task title is required'); return; }
    const assignedUser = users.find((u) => u.id === form.assignedToUid);
    try {
      await addDocument('tasks', {
        title: form.title,
        description: form.description,
        assignedToUid: form.assignedToUid,
        assignedTo: assignedUser ? (assignedUser.name || assignedUser.email) : form.assignedTo,
        dueDate: form.dueDate ? new Date(form.dueDate) : null,
        priority: form.priority,
        status: 'Pending',
      });
      toast.success('Task created!');
      setShowModal(false);
      setForm({ title: '', description: '', assignedToUid: '', assignedTo: '', dueDate: '', priority: 'Medium' });
    } catch (err: any) { toast.error(err?.message); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('tasks', deleteTarget.id);
      toast.success('Task deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleMarkComplete = async (task: Task) => {
    try {
      await updateDocument('tasks', task.id, { status: 'Completed' });
      await addDocument('notifications', {
        title: 'Task Completed',
        message: `"${task.title}" has been marked as completed by ${userData?.name || 'Team Member'}`,
        type: 'task',
        read: false,
      });
      toast.success('Task marked as complete');
    } catch (err: any) { toast.error(err?.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Tasks</h1><p className="text-gray-500 mt-1">Manage team tasks</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Task</Button>}
      </div>
      <Card><CardContent>
        {!loading && tasks.length === 0 ? <EmptyState title="No tasks" description="Create your first task" action={canWrite ? { label: 'Create', onClick: () => setShowModal(true) } : undefined} />
        : <DataTable columns={columns} data={tasks} loading={loading} searchable />}
      </CardContent></Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Task" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this task? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Task">
        <div className="space-y-4">
          <Input label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><textarea className="input-field min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <Select label="Assigned To" options={userOptions} value={form.assignedToUid} onChange={(e) => {
            const u = users.find((u) => u.id === e.target.value);
            setForm({ ...form, assignedToUid: e.target.value, assignedTo: u ? (u.name || u.email) : '' });
          }} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <Select label="Priority" options={[{ value: 'Low', label: 'Low' }, { value: 'Medium', label: 'Medium' }, { value: 'High', label: 'High' }, { value: 'Urgent', label: 'Urgent' }]} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
