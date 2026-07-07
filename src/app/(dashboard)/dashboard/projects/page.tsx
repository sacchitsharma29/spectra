'use client';

import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import toast from 'react-hot-toast';

interface Project {
  id: string; projectId: string; customerName: string; stage: string;
  progress: number; assignedEngineer: string; installationDate: any; systemSize: string;
}

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const { data: projects, loading } = useCollection<Project>('projects');
  const canWrite = useCanWrite();
  const [form, setForm] = useState({ customerName: '', assignedEngineer: '', installationDate: '', stage: 'Approved' });

  const columns: Column<Project>[] = [
    { key: 'projectId', header: 'Project #', width: '110px' },
    { key: 'customerName', header: 'Customer' },
    { key: 'systemSize', header: 'System' },
    { key: 'stage', header: 'Stage', render: (p) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.stage)}`}>{p.stage}</span> },
    {
      key: 'progress', header: 'Progress',
      render: (p) => <div className="flex items-center gap-2"><div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${p.progress}%` }} /></div><span className="text-xs text-gray-500">{p.progress}%</span></div>,
    },
    { key: 'assignedEngineer', header: 'Engineer' },
    { key: 'installationDate', header: 'Install Date', render: (p) => <span className="text-gray-500">{formatDate(p.installationDate)}</span> },
    ...(canWrite ? [{
      key: 'actions' as const, header: '', width: '50px' as const,
      render: (p: any) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(p); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Delete project"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('projects', deleteTarget.id);
      toast.success('Project deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.customerName || !form.assignedEngineer) { toast.error('Fill required fields'); return; }
    try {
      await addDocument('projects', { ...form, installationDate: form.installationDate ? new Date(form.installationDate) : null, progress: 0 });
      toast.success('Project created!'); setShowModal(false);
    } catch (err: any) { toast.error(err?.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Projects</h1><p className="text-gray-500 mt-1">Track installation projects</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>New Project</Button>}
      </div>
      <Card><CardContent>
        {!loading && projects.length === 0 ? <EmptyState title="No projects yet" description="Create your first project" action={canWrite ? { label: 'Create', onClick: () => setShowModal(true) } : undefined} />
        : <DataTable columns={columns} data={projects} loading={loading} searchable exportable />}
      </CardContent></Card>
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this project? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Project">
        <div className="space-y-4">
          <Input label="Customer *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="Engineer *" value={form.assignedEngineer} onChange={(e) => setForm({ ...form, assignedEngineer: e.target.value })} />
          <Input label="Install Date" type="date" value={form.installationDate} onChange={(e) => setForm({ ...form, installationDate: e.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button onClick={handleCreate}>Create</Button></div>
        </div>
      </Modal>
    </div>
  );
}
