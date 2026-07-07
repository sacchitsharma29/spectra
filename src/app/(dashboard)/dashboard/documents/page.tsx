'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, toDate } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Plus, Eye, Download, FileText, Image, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Document {
  id: string; name: string; type: string; customerName: string;
  fileSize: string; uploadedBy: string; createdAt: any;
}

export default function DocumentsPage() {
  const { data: documents, loading } = useCollection<Document>('documents');
  const canWrite = useCanWrite();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: '', type: 'Document', customerName: '', fileSize: '', uploadedBy: '' });

  const columns: Column<Document>[] = [
    {
      key: 'name', header: 'File',
      render: (d) => (
        <div className="flex items-center gap-3">
          {d.type === 'Site Photo' || d.type === 'Installation Photo'
            ? <Image className="w-5 h-5 text-blue-500" />
            : <FileText className="w-5 h-5 text-red-500" />
          }
          <div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-gray-500">{d.fileSize}</p></div>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (d) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{d.type}</span> },
    { key: 'customerName', header: 'Customer' },
    { key: 'uploadedBy', header: 'Uploaded By' },
    { key: 'createdAt', header: 'Date', render: (d) => <span className="text-gray-500">{formatDate(toDate(d.createdAt))}</span> },
    { key: 'actions', header: '', render: (d: any) => <div className="flex gap-1"><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('View document coming soon'); }}><Eye className="w-4 h-4" /></button><button className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100" onClick={(e) => { e.stopPropagation(); toast('Download coming soon'); }}><Download className="w-4 h-4" /></button>{canWrite && <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(d); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors" title="Delete document"><Trash2 className="w-4 h-4" /></button>}</div> },
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('documents', deleteTarget.id);
      toast.success('Document deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleAdd = async () => {
    if (!form.name || !form.customerName) { toast.error('Please fill required fields'); return; }
    try {
      await addDocument('documents', {
        ...form,
        fileSize: form.fileSize || '-',
        uploadedBy: form.uploadedBy || 'Admin',
      });
      toast.success('Document added');
      setShowModal(false);
      setForm({ name: '', type: 'Document', customerName: '', fileSize: '', uploadedBy: '' });
    } catch (err: any) { toast.error(err?.message || 'Failed to add document'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Documents</h1><p className="text-gray-500 mt-1">Manage uploaded documents</p></div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Document</Button>}
      </div>
      <Card><CardContent>
        {!loading && documents.length === 0
          ? <EmptyState title="No documents uploaded" description="Upload documents here" action={canWrite ? { label: 'Add Document', onClick: () => setShowModal(true) } : undefined} />
          : <DataTable columns={columns} data={documents} loading={loading} searchable exportable />}
      </CardContent></Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Document" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this document? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Document">
        <div className="space-y-4">
          <Input label="Document Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select
            label="Type"
            options={[
              { value: 'Document', label: 'Document' },
              { value: 'Site Photo', label: 'Site Photo' },
              { value: 'Installation Photo', label: 'Installation Photo' },
              { value: 'Agreement', label: 'Agreement' },
              { value: 'Invoice', label: 'Invoice' },
              { value: 'Other', label: 'Other' },
            ]}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Input label="Customer Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
          <Input label="File Size" value={form.fileSize} onChange={(e) => setForm({ ...form, fileSize: e.target.value })} placeholder="e.g. 2.5 MB" />
          <Input label="Uploaded By" value={form.uploadedBy} onChange={(e) => setForm({ ...form, uploadedBy: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
