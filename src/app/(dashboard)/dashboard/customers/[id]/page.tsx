'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useDocument, useCollection, updateDocument } from '@/hooks/useFirestore';
import { where } from 'firebase/firestore';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import { Customer, Project, Payment } from '@/types';
import toast from 'react-hot-toast';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id as string;
  const { data: customer, loading: customerLoading } = useDocument<Customer>('customers', customerId);
  const { data: projects } = useCollection<Project>('projects', [where('customerId', '==', customerId)]);
  const { data: payments } = useCollection<Payment>('payments', [where('customerId', '==', customerId)]);
  const canWrite = useCanWrite();
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({ customerId: '', name: '', mobile: '', capacity: '', address: '' });

  if (customerLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            <div className="h-60 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-5xl mx-auto">
        <EmptyState title="Customer not found" description="This customer may have been deleted" action={{ label: 'Back to Customers', onClick: () => router.push('/dashboard/customers') }} />
      </div>
    );
  }

  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPending = 0;

  const openEdit = () => {
    setEditForm({
      customerId: customer?.customerId || '',
      name: customer?.name || '',
      mobile: customer?.mobile || '',
      capacity: customer?.capacity || '',
      address: customer?.address || '',
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!customer) return;
    try {
      await updateDocument('customers', customer.id, editForm);
      toast.success('Customer updated');
      setShowEdit(false);
    } catch (err: any) { toast.error(err?.message || 'Failed to update customer'); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{customer.name}</h1>
            {customer.customerType && <Badge>{customer.customerType}</Badge>}
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{customer.customerId} &middot; Customer since {formatDate(customer.createdAt)}</p>
        </div>
        {canWrite && (
          <Button variant="secondary" size="sm" icon={<Pencil className="w-4 h-4" />} onClick={openEdit}>Edit</Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact & Personal Details</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Customer ID', value: customer.customerId || '-' },
                  { label: 'Phone', value: customer.mobile },
                  { label: 'Capacity', value: customer.capacity ? `${customer.capacity} kW` : '-' },
                  { label: 'Address', value: customer.address ? `${customer.address}, ${customer.city || ''}, ${customer.state || ''} - ${customer.pincode || ''}` : '-' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h2>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-sm text-gray-500">No projects yet</p>
              ) : (
                <div className="space-y-2">
                  {projects.map((p) => (
                    <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
                      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-300">Project</p>
                            <p className="text-sm text-blue-700 dark:text-blue-400">{p.projectId || p.id}</p>
                          </div>
                          <Badge variant={p.stage === 'Closed' ? 'success' : p.stage === 'Installation Started' ? 'warning' : 'default'}>{p.stage}</Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documents</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Documents feature coming soon</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment Summary</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalPaid)}</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Total Paid</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totalPending)}</p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">Pending</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Payment History</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500">No payments yet</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{(p as any).paymentType || p.type || 'Payment'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(p.paymentDate || p.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">{formatCurrency(p.amount)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{p.paymentMethod || '-'}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {customer.notes && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 dark:text-gray-300">{customer.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Customer">
        <div className="space-y-4">
          <Input label="Customer ID" value={editForm.customerId} onChange={(e) => setEditForm({ ...editForm, customerId: e.target.value })} />
          <Input label="Name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="Mobile" value={editForm.mobile} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
          <Input label="Capacity (kW)" value={editForm.capacity} onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleEdit}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
