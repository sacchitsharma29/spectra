'use client';

import React, { useState } from 'react';
import { Plus, Phone, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';

import { EmptyState } from '@/components/ui/EmptyState';

import { useCollection, addDocument, deleteDocument } from '@/hooks/useFirestore';
import { formatDate, getInitials } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Customer } from '@/types';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  const { data: customers, loading } = useCollection<Customer>('customers');
  const canWrite = useCanWrite();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerId: '', name: '', mobile: '', capacity: '', address: '' });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const columns: Column<Customer>[] = [
    {
      key: 'name', header: 'Customer',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{getInitials(c.name)}</div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{c.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{c.customerId}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'mobile', header: 'Contact',
      render: (c) => (
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400"><Phone className="w-3 h-3" />{c.mobile}</div>
          {c.email && <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5"><Mail className="w-3 h-3" />{c.email}</div>}
        </div>
      ),
    },
    { key: 'capacity', header: 'Capacity', render: (c) => <span className="text-gray-500">{c.capacity ? `${c.capacity} kW` : '-'}</span> },
    { key: 'address', header: 'Address', render: (c) => <span className="text-gray-500 truncate max-w-[200px] block">{c.address || '-'}</span> },
    { key: 'createdAt', header: 'Since', render: (c) => <span className="text-gray-500">{formatDate(c.createdAt)}</span> },
    ...(canWrite ? [{
      key: 'actions' as const, header: '', width: '50px' as const,
      render: (c: Customer) => (
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteTarget(c); }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          title="Delete customer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    }] : []),
  ];

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocument('customers', deleteTarget.id);
      toast.success('Customer deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete'); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.mobile) { toast.error('Name and mobile are required'); return; }
    try {
      await addDocument('customers', form);
      toast.success('Customer added');
      setShowModal(false);
      setForm({ customerId: '', name: '', mobile: '', capacity: '', address: '' });
    } catch (err: any) { toast.error(err?.message || 'Failed to add customer'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Customers</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your active customers</p>
        </div>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>Add Customer</Button>}
      </div>
      <Card>
        <CardContent>
          {!loading && customers.length === 0 ? (
            <EmptyState title="No customers yet" description="Customers will appear here after lead conversion" />
          ) : (
            <DataTable columns={columns} data={customers} loading={loading} searchable exportable onRowClick={(c) => window.location.href = `/dashboard/customers/${c.id}`} />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Customer" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Customer">
        <div className="space-y-4">
          <Input label="Customer ID" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} />
          <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
          <Input label="Capacity (kW)" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Add Customer</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
