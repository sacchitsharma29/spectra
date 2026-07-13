'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Phone, Mail, MapPin, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import toast from 'react-hot-toast';
import { addDocument } from '@/hooks/useFirestore';
import { useCanWrite } from '@/lib/permissions';
import { LeadSource, LeadStatus, Priority, CustomerType, RoofType } from '@/types';
import Link from 'next/link';

const leadSources: { value: LeadSource; label: string }[] = [
  { value: 'Website', label: 'Website' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Facebook', label: 'Facebook' },
  { value: 'Instagram', label: 'Instagram' },
  { value: 'Google Ads', label: 'Google Ads' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Direct Walk-in', label: 'Direct Walk-in' },
  { value: 'Phone Inquiry', label: 'Phone Inquiry' },
];

const leadPriorities: { value: Priority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

const customerTypes: { value: CustomerType; label: string }[] = [
  { value: 'Residential', label: 'Residential' },
  { value: 'Commercial', label: 'Commercial' },
  { value: 'Industrial', label: 'Industrial' },
];

const roofTypes: { value: RoofType; label: string }[] = [
  { value: 'Flat', label: 'Flat' },
  { value: 'Slanted', label: 'Slanted' },
  { value: 'Metal', label: 'Metal' },
  { value: 'Tile', label: 'Tile' },
  { value: 'Other', label: 'Other' },
];

export default function NewLeadPage() {
  const router = useRouter();
  const canWrite = useCanWrite();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canWrite) router.push('/dashboard/leads');
  }, [canWrite, router]);
  const [form, setForm] = useState({
    customerName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    source: '' as LeadSource | '',
    priority: '' as Priority | '',
    customerType: '' as CustomerType | '',
    roofType: '' as RoofType | '',
    monthlyElectricityBill: '',
    estimatedSystemSize: '',
    notes: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.mobile || !form.source || !form.priority) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSaving(true);
    try {
      await addDocument('leads', {
        customerName: form.customerName,
        mobile: form.mobile,
        email: form.email || '',
        address: form.address || '',
        city: form.city || '',
        state: form.state || '',
        pincode: form.pincode || '',
        source: form.source,
        priority: form.priority,
        customerType: form.customerType || '',
        roofType: form.roofType || '',
        monthlyElectricityBill: form.monthlyElectricityBill ? Number(form.monthlyElectricityBill) : 0,
        estimatedSystemSize: form.estimatedSystemSize ? Number(form.estimatedSystemSize) : 0,
        notes: form.notes || '',
        status: 'New',
      });
      toast.success('Lead created successfully!');
      router.push('/dashboard/leads');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/leads">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">New Lead</h1>
          <p className="text-gray-500 dark:text-gray-400">Add a new lead to the system</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Contact Information</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Customer Name *"
                  placeholder="Full name"
                  value={form.customerName}
                  onChange={(e) => updateField('customerName', e.target.value)}
                  icon={<UsersIcon />}
                  required
                />
                <Input
                  label="Mobile Number *"
                  placeholder="+91 98765 43210"
                  value={form.mobile}
                  onChange={(e) => updateField('mobile', e.target.value)}
                  icon={<Phone className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Email"
                  placeholder="customer@email.com"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Address</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Address"
                placeholder="Street address"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="City"
                  placeholder="City"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                />
                <Input
                  label="State"
                  placeholder="State"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                />
              </div>
              <Input
                label="Pin Code"
                placeholder="6-digit PIN"
                value={form.pincode}
                onChange={(e) => updateField('pincode', e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Lead Details</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Lead Source *"
                  placeholder="Select source"
                  options={leadSources}
                  value={form.source}
                  onChange={(e) => updateField('source', e.target.value)}
                />
                <Select
                  label="Priority *"
                  placeholder="Select priority"
                  options={leadPriorities}
                  value={form.priority}
                  onChange={(e) => updateField('priority', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Customer Type"
                  placeholder="Select type"
                  options={customerTypes}
                  value={form.customerType}
                  onChange={(e) => updateField('customerType', e.target.value)}
                />
                <Select
                  label="Roof Type"
                  placeholder="Select roof type"
                  options={roofTypes}
                  value={form.roofType}
                  onChange={(e) => updateField('roofType', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Monthly Electricity Bill (₹)"
                  placeholder="e.g. 5000"
                  type="number"
                  value={form.monthlyElectricityBill}
                  onChange={(e) => updateField('monthlyElectricityBill', e.target.value)}
                />
                <Input
                  label="Estimated System Size (kW)"
                  placeholder="e.g. 5"
                  type="number"
                  value={form.estimatedSystemSize}
                  onChange={(e) => updateField('estimatedSystemSize', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Notes</h2>
            </CardHeader>
            <CardContent>
              <textarea
                className="input-field min-h-[100px] resize-y"
                placeholder="Any additional notes about this lead..."
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Link href="/dashboard/leads">
            <Button type="button" variant="secondary">Cancel</Button>
          </Link>
          <Button type="submit" loading={saving} icon={<Save className="w-4 h-4" />}>
            Save Lead
          </Button>
        </div>
      </form>
    </div>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
