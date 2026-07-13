export type UserRole = 'super_admin' | 'sales_manager' | 'sales_executive' | 'survey_engineer' | 'installation_team' | 'accounts_staff';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone: string;
  photoURL?: string;
  createdAt: Date;
  active: boolean;
}

export type LeadStatus =
  | 'New'
  | 'Contacted'
  | 'Follow-up'
  | 'Interested'
  | 'Site Survey'
  | 'Quotation Sent'
  | 'Negotiation'
  | 'Confirmed'
  | 'Lost'
  | 'Installed';

export type LeadSource =
  | 'Website'
  | 'WhatsApp'
  | 'Facebook'
  | 'Instagram'
  | 'Google Ads'
  | 'Referral'
  | 'Direct Walk-in'
  | 'Phone Inquiry';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type CustomerType = 'Residential' | 'Commercial' | 'Industrial';

export type RoofType = 'Flat' | 'Slanted' | 'Metal' | 'Tile' | 'Other';

export interface Lead {
  id: string;
  leadId: string;
  customerName: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  source: LeadSource;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: Date;
  monthlyElectricityBill?: number;
  estimatedSystemSize?: number;
  roofType?: RoofType;
  customerType?: CustomerType;
  priority: Priority;
  status: LeadStatus;
  notes?: string;
  updatedAt: Date;
}

export interface FollowUp {
  id: string;
  leadId: string;
  customerName: string;
  assignedTo: string;
  assignedToName: string;
  date: Date;
  time: string;
  method: 'Call' | 'WhatsApp' | 'Email' | 'Meeting' | 'Site Visit';
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Missed';
  completedAt?: Date;
  createdAt: Date;
}

export interface Customer {
  id: string;
  customerId: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadhaar?: string;
  pan?: string;
  electricityBill?: string;
  capacity?: string;
  customerType: CustomerType;
  leadId?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

export interface Survey {
  id: string;
  leadId: string;
  customerName: string;
  assignedTo: string;
  assignedToName: string;
  scheduledDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected';
  gpsLocation?: { lat: number; lng: number };
  roofDimensions?: string;
  roofType?: RoofType;
  structureType?: string;
  shadowAnalysis?: string;
  photos?: string[];
  videos?: string[];
  remarks?: string;
  createdAt: Date;
}

export interface Quotation {
  id: string;
  quoteId: string;
  leadId: string;
  customerId: string;
  customerName: string;
  solarCapacity: string;
  panelDetails: string;
  inverterDetails: string;
  batteryDetails?: string;
  structureDetails?: string;
  installationCharges: number;
  governmentSubsidy: number;
  gst: number;
  totalAmount: number;
  warrantyInfo?: string;
  termsConditions?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected';
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ProjectStage =
  | 'Approved'
  | 'Material Allocation'
  | 'Dispatch'
  | 'Installation Started'
  | 'Installation Completed'
  | 'Inspection'
  | 'Closed';

export interface Project {
  id: string;
  projectId: string;
  leadId: string;
  customerId: string;
  customerName: string;
  assignedEngineer: string;
  assignedEngineerName: string;
  installationTeam: string[];
  stage: ProjectStage;
  installationDate?: Date;
  completionDate?: Date;
  progress: number;
  timeline?: string;
  remarks?: string;
  images?: string[];
  documents?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';

export interface Payment {
  id: string;
  paymentId: string;
  customerId: string;
  customerName: string;
  projectId?: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  type: 'Advance' | 'Partial' | 'Final';
  notes?: string;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  invoiceId: string;
  customerId: string;
  customerName: string;
  projectId?: string;
  items: { description: string; amount: number }[];
  subtotal: number;
  gst: number;
  total: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue';
  dueDate: Date;
  createdAt: Date;
}

export type TicketStatus = 'Open' | 'Assigned' | 'In Progress' | 'Resolved' | 'Closed';

export interface SupportTicket {
  id: string;
  ticketId: string;
  customerId: string;
  customerName: string;
  subject: string;
  description: string;
  assignedTo?: string;
  assignedToName?: string;
  status: TicketStatus;
  priority: Priority;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo: string[];
  assignedToNames: string[];
  priority: Priority;
  dueDate: Date;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Delayed';
  relatedTo?: { type: string; id: string };
  comments?: { userId: string; userName: string; text: string; createdAt: Date }[];
  createdAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'Aadhaar' | 'PAN' | 'Electricity Bill' | 'Site Photo' | 'Agreement' | 'Survey Report' | 'Quotation' | 'Invoice' | 'Installation Photo' | 'Other';
  customerId?: string;
  customerName?: string;
  fileUrl: string;
  fileSize: number;
  version: number;
  uploadedBy: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'lead' | 'followup' | 'payment' | 'survey' | 'installation' | 'service' | 'task';
  read: boolean;
  link?: string;
  createdAt: Date;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  module: string;
  createdAt: Date;
}
