'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Save, Building2, Users, Bell, FileText, Shield, Palette, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollection } from '@/hooks/useFirestore';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { getRoleBadgeColor, formatRoleName } from '@/lib/utils';
import { useCanWrite } from '@/lib/permissions';
import toast from 'react-hot-toast';

const settingsTabs = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'users', label: 'Users & Roles', icon: Users },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

const roleColors: Record<string, string> = {
  super_admin: 'bg-red-500',
  sales_manager: 'bg-blue-500',
  sales_executive: 'bg-green-500',
  survey_engineer: 'bg-purple-500',
  installation_team: 'bg-orange-500',
  accounts_staff: 'bg-teal-500',
};

const allRoles = [
  { id: 'super_admin', label: 'Super Admin' },
  { id: 'sales_manager', label: 'Sales Manager' },
  { id: 'sales_executive', label: 'Sales Executive' },
  { id: 'survey_engineer', label: 'Survey Engineer' },
  { id: 'installation_team', label: 'Installation Team' },
  { id: 'accounts_staff', label: 'Accounts Staff' },
];

const allModules = [
  { id: '/dashboard/leads', label: 'Leads' },
  { id: '/dashboard/customers', label: 'Customers' },
  { id: '/dashboard/followups', label: 'Follow-ups' },
  { id: '/dashboard/surveys', label: 'Surveys' },
  { id: '/dashboard/quotations', label: 'Quotations' },
  { id: '/dashboard/projects', label: 'Projects' },
  { id: '/dashboard/payments', label: 'Payments' },
  { id: '/dashboard/invoices', label: 'Invoices' },
  { id: '/dashboard/support', label: 'Support' },
  { id: '/dashboard/tasks', label: 'Tasks' },
  { id: '/dashboard/documents', label: 'Documents' },
  { id: '/dashboard/calendar', label: 'Calendar' },
  { id: '/dashboard/reports', label: 'Reports' },
  { id: '/dashboard/settings', label: 'Settings' },
  { id: '/dashboard/notifications', label: 'Notifications' },
];

const defaultPermissions: Record<string, string[]> = {
  super_admin: allModules.map((m) => m.id),
  sales_manager: ['/dashboard/leads', '/dashboard/customers', '/dashboard/followups', '/dashboard/surveys', '/dashboard/quotations', '/dashboard/projects', '/dashboard/payments', '/dashboard/support', '/dashboard/tasks', '/dashboard/documents', '/dashboard/calendar', '/dashboard/reports'],
  sales_executive: ['/dashboard/leads', '/dashboard/customers', '/dashboard/followups', '/dashboard/support', '/dashboard/tasks', '/dashboard/calendar'],
  survey_engineer: ['/dashboard/surveys', '/dashboard/tasks', '/dashboard/calendar'],
  installation_team: ['/dashboard/projects', '/dashboard/tasks', '/dashboard/documents', '/dashboard/calendar'],
  accounts_staff: ['/dashboard/customers', '/dashboard/payments', '/dashboard/invoices', '/dashboard/reports'],
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const { userData } = useAuth();
  const canWrite = useCanWrite();
  const { data: users } = useCollection<any>('users');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', uid: '', role: 'sales_executive' });
  const [permissions, setPermissions] = useState<Record<string, string[]>>(defaultPermissions);
  const [permLoading, setPermLoading] = useState(true);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [editRole, setEditRole] = useState('sales_executive');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [company, setCompany] = useState({
    name: 'Spectra Solar Solutions', email: 'info@spectrasolar.com', phone: '+91 1800-123-4567',
    website: 'www.spectrasolar.com', address: '42, Solar Plaza, Andheri East, Mumbai - 400093',
    gst: '27ABCDE1234F1Z5', pan: 'ABCDE1234F', logoUrl: '',
  });
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'company'));
        if (snap.exists() && snap.data()) {
          setCompany((prev) => ({ ...prev, ...snap.data() }));
        }
      } catch { /* use defaults */ }
      setCompanyLoading(false);
    };
    const loadPerms = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'permissions'));
        if (snap.exists() && snap.data().rolePermissions) {
          setPermissions({ ...defaultPermissions, ...snap.data().rolePermissions });
        }
      } catch { /* use defaults */ }
      setPermLoading(false);
    };
    const loadTemplates = async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'templates'));
        if (snap.exists() && snap.data().items) {
          setTemplates(snap.data().items);
        } else {
          setTemplates(defaultTemplates);
        }
      } catch { setTemplates(defaultTemplates); }
      setTemplateLoading(false);
    };
    load();
    loadPerms();
    loadTemplates();
  }, []);

  const toggleModule = (roleId: string, moduleId: string) => {
    if (roleId === 'super_admin') return;
    setPermissions((prev) => {
      const current = prev[roleId] || [];
      const updated = current.includes(moduleId)
        ? current.filter((m) => m !== moduleId)
        : [...current, moduleId];
      return { ...prev, [roleId]: updated };
    });
  };

  const saveCompany = async () => {
    try {
      await setDoc(doc(db, 'settings', 'company'), company);
      toast.success('Company settings saved');
    } catch (err: any) { toast.error(err?.message || 'Failed to save'); }
  };

  const savePermissions = async () => {
    try {
      await setDoc(doc(db, 'settings', 'permissions'), { rolePermissions: permissions });
      toast.success('Permissions saved');
    } catch (err: any) { toast.error(err?.message || 'Failed to save permissions'); }
  };

  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, 'users', deleteTarget.id));
      toast.success('User deleted');
      setDeleteTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to delete user'); }
  };

  const handleEditUser = async () => {
    if (!editTarget) return;
    try {
      await setDoc(doc(db, 'users', editTarget.id), { ...editTarget, role: editRole }, { merge: true });
      toast.success(`${editTarget.name || editTarget.email}'s role updated`);
      setEditTarget(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to update user'); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `logos/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setCompany((prev) => ({ ...prev, logoUrl: url }));
      await setDoc(doc(db, 'settings', 'company'), { ...company, logoUrl: url });
      toast.success('Logo updated');
    } catch (err: any) { toast.error(err?.message || 'Upload failed'); }
    setUploading(false);
  };

  const defaultTemplates = [
    { id: 'quotation-standard', name: 'Quotation Template - Standard', content: '# Quotation\n\n**Customer:** {{customerName}}\n**Date:** {{date}}\n\n## Items\n{{items}}\n\n**Total:** {{total}}' },
    { id: 'quotation-premium', name: 'Quotation Template - Premium', content: '# Premium Quotation\n\n**Customer:** {{customerName}}\n**Date:** {{date}}\n\n## Items\n{{items}}\n\n**Total:** {{total}}\n**Validity:** 30 days' },
    { id: 'invoice', name: 'Invoice Template', content: '# Invoice\n\n**Invoice #:** {{invoiceNumber}}\n**Customer:** {{customerName}}\n**Date:** {{date}}\n\n## Items\n{{items}}\n\n**Total:** {{total}}' },
    { id: 'survey-report', name: 'Survey Report Template', content: '# Survey Report\n\n**Customer:** {{customerName}}\n**Site:** {{siteAddress}}\n**Date:** {{date}}\n\n## Findings\n{{findings}}\n\n## Recommendations\n{{recommendations}}' },
    { id: 'completion-cert', name: 'Completion Certificate', content: '# Completion Certificate\n\nThis certifies that the solar installation at **{{siteAddress}}** for **{{customerName}}** has been completed successfully.\n\n**Date:** {{date}}\n**Installed By:** {{installedBy}}' },
  ];
  const [templates, setTemplates] = useState<{ id: string; name: string; content: string }[]>(defaultTemplates);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [editTemplate, setEditTemplate] = useState<{ id: string; name: string; content: string } | null>(null);
  const [templateContent, setTemplateContent] = useState('');

  const handleSaveTemplate = async () => {
    if (!editTemplate) return;
    const updated = templates.map((t) => t.id === editTemplate.id ? { ...t, content: templateContent } : t);
    setTemplates(updated);
    try {
      await setDoc(doc(db, 'settings', 'templates'), { items: updated });
      toast.success('Template saved');
      setEditTemplate(null);
    } catch (err: any) { toast.error(err?.message || 'Failed to save template'); }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.uid) { toast.error('Please fill all fields'); return; }
    try {
      await setDoc(doc(db, 'users', newUser.uid), {
        name: newUser.name, email: newUser.email, role: newUser.role, active: true,
      });
      toast.success('User added');
      setShowAddUser(false);
      setNewUser({ name: '', email: '', uid: '', role: 'sales_executive' });
    } catch (err: any) { toast.error(err?.message || 'Failed to add user'); }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'company':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-20 h-20 rounded-xl bg-blue-600 flex items-center justify-center overflow-hidden">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt="Company logo" className="w-full h-full object-contain" />
                ) : (
                  <span className="text-white font-bold text-3xl">S</span>
                )}
              </div>
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Change Logo'}
                </Button>
                <p className="text-xs text-gray-500 mt-1">Recommended: 200x200px PNG</p>
              </div>
            </div>
            {companyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Company Name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                <Input label="Email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
                <Input label="Phone" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                <Input label="Website" value={company.website} onChange={(e) => setCompany({ ...company, website: e.target.value })} />
                <Input label="Address" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} className="sm:col-span-2" />
                <Input label="GST Number" value={company.gst} onChange={(e) => setCompany({ ...company, gst: e.target.value })} />
                <Input label="PAN" value={company.pan} onChange={(e) => setCompany({ ...company, pan: e.target.value })} />
              </div>
            )}
            <div className="flex justify-end pt-4">
              <Button onClick={saveCompany} icon={<Save className="w-4 h-4" />}>Save Changes</Button>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{users.length} team members</p>
              {canWrite && <Button size="sm" onClick={() => setShowAddUser(true)} icon={<Plus className="w-4 h-4" />}>Add User</Button>}
            </div>
            <div className="space-y-2">
              {users.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No users found. Add your first team member.</p>
              ) : (
                users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${roleColors[u.role] || 'bg-gray-500'}`}>
                        {(u.name || u.email || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{u.name || u.email}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(u.role)}`}>
                        {formatRoleName(u.role)}
                      </span>
                      <div className={`w-2 h-2 rounded-full ${u.active !== false ? 'bg-green-500' : 'bg-gray-300'}`} />
                      {canWrite && (
                        <button onClick={() => { setEditTarget(u); setEditRole(u.role); }} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors" title="Edit role">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                      )}
                      <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Assign module access for each role. Super Admin has full access by default.</p>
              </div>
              <Button onClick={savePermissions} icon={<Save className="w-4 h-4" />}>Save Permissions</Button>
            </div>
            {permLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 pr-4 font-medium text-gray-500 dark:text-gray-400">Module</th>
                      {allRoles.map((role) => (
                        <th key={role.id} className="text-center py-2 px-2 font-medium text-gray-500 dark:text-gray-400 min-w-[100px]">
                          <span className="text-xs">{role.label}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allModules.map((mod) => (
                      <tr key={mod.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                        <td className="py-2.5 pr-4 text-gray-900 dark:text-gray-100">{mod.label}</td>
                        {allRoles.map((role) => {
                          const checked = role.id === 'super_admin' || (permissions[role.id] || []).includes(mod.id);
                          return (
                            <td key={role.id} className="text-center py-2.5 px-2">
                              <input
                                type="checkbox"
                                disabled={role.id === 'super_admin'}
                                checked={checked}
                                onChange={() => toggleModule(role.id, mod.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {[
              { label: 'New Lead Assignment', desc: 'When a new lead is assigned to you' },
              { label: 'Follow-up Reminders', desc: '15 minutes before scheduled follow-up' },
              { label: 'Payment Received', desc: 'When a payment is recorded' },
              { label: 'Survey Scheduled', desc: 'When a survey is assigned to you' },
              { label: 'Installation Updates', desc: 'Project stage changes' },
              { label: 'Service Ticket Created', desc: 'New support ticket assigned' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
            ))}
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your quotation and invoice templates</p>
            {templateLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />)}
              </div>
            ) : (
              templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{template.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => { setEditTemplate(template); setTemplateContent(template.content); }}>Edit</Button>
                </div>
              ))
            )}
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Security Settings</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Configure session timeout, password policies, and audit logs.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Session Timeout</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Auto logout after inactivity</p>
                </div>
                <Select options={[{ value: '30', label: '30 minutes' }, { value: '60', label: '1 hour' }, { value: '120', label: '2 hours' }, { value: 'never', label: 'Never' }]} className="w-40" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Two-Factor Authentication</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Extra security for admin accounts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Activity Logs</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Track all user activities</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast('Activity logs coming soon')}>View Logs</Button>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Appearance Settings</p>
              <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">Customize the look and feel of your CRM.</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark Mode</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Toggle dark/light theme</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                document.documentElement.classList.toggle('dark');
                const isDark = document.documentElement.classList.contains('dark');
                localStorage.setItem('spectra-theme', isDark ? 'dark' : 'light');
              }}>
                Toggle Theme
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your CRM configuration</p>

      <Card>
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-56 border-r border-gray-200 dark:border-gray-700 p-2 space-y-0.5">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </div>
      </Card>

      <Modal isOpen={showAddUser} onClose={() => setShowAddUser(false)} title="Add User">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-700 dark:text-blue-300">
            Create the user in Firebase Console → Authentication first, then paste their UID here.
          </div>
          <Input label="Firebase UID *" value={newUser.uid} onChange={(e) => setNewUser({ ...newUser, uid: e.target.value })} placeholder="From Authentication → Users" />
          <Input label="Name *" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <Input label="Email *" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <Select
            label="Role"
            options={allRoles.map((r) => ({ value: r.id, label: r.label }))}
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button onClick={handleAddUser}>Add User</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" size="sm">
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete <strong>{deleteTarget?.name || deleteTarget?.email}</strong>? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteUser}>Delete</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editTemplate} onClose={() => setEditTemplate(null)} title={`Edit ${editTemplate?.name || ''}`} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Use {'{{placeholder}}'} syntax for dynamic fields.</p>
          <textarea
            className="input-field min-h-[300px] resize-y font-mono text-sm"
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditTemplate(null)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} icon={<Save className="w-4 h-4" />}>Save Template</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.name || editTarget?.email || ''}`} size="sm">
        <div className="space-y-4">
          <Input label="Name" value={editTarget?.name || ''} onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })} />
          <Input label="Email" value={editTarget?.email || ''} onChange={(e) => setEditTarget({ ...editTarget, email: e.target.value })} />
          <Select
            label="Role"
            options={allRoles.map((r) => ({ value: r.id, label: r.label }))}
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={editTarget?.active !== false} onChange={(e) => setEditTarget({ ...editTarget, active: e.target.checked })} />
              <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm text-gray-600 dark:text-gray-400">Active</span>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button onClick={handleEditUser}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
