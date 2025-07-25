export enum GenderEnum {
  HOMBRE = "HOMBRE",
  MUJER = "MUJER",
  OTRO = "OTRO"
}

export enum EventStatus {
  ACTIVE = 'ACTIVE',
  DRAFT = 'DRAFT',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  UPCOMING = 'UPCOMING',
  SUSPENDED = 'SUSPENDED'
}

export interface Producer {
  id: number;
  name: string;
  domain: string;
  firebaseWebAppId: string;
  googleAnalyticsId: string;
  status: string;
  logo: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  spotify: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
  events: Event[];
  users: User[];
  email: Email;
  totalEvents: number;
  totalClients: number;
  webDetails: WebDetails;
}

export interface Email {
  id: number;
  email: string;
  key: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Event {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: EventStatus;
  folder: boolean;
  alias: string | null;
  logo: string;
  createdAt: string;
  updatedAt: string;
  prevents: Prevent[];
  oAuthMercadoPago?: MercadoPagoConfigDto;
  featuredPrevent?: Prevent;
}

export interface Prevent {
  id: number;
  name: string;
  price: number;
  quantity: number;
  remaining?: number;
  status: PreventStatusEnum;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum PreventStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SOLD_OUT = 'SOLD_OUT',
}

export interface User {
  id?: number;
  email?: string;
  name?: string;
}

export interface Participant {
  fullName: string;
  phone: string;
  docNumber: string;
  gender: GenderEnum;
  email?: string;
}

export interface TicketFormData {
  participants: Participant[];
  email: string;
  comprobante?: File | null;
}

export enum SpinnerSize {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large"
}

export enum ClientTypeEnum {
  FREE = 'FREE',
  REGULAR = 'REGULAR',
  OTRO = 'OTRO'
}

export interface PreferenceData {
  preferenceId: string;
  publicKey: string;
}

export interface MercadoPagoConfigDto {
  id: number;
  mpUserName: string;
  mpPublicKey: string;
  createdAt: string;
}

export interface TicketInfo {
  fullName: string;
  docNumber: string;
  gender: GenderEnum;
  phone: string;
  isCompleted: boolean;
}

export interface PurchaseData {
  selectedPrevent: Prevent | null;
  ticketQuantity: number;
  clients: TicketInfo[];
  email: string;
  comprobante: File;
  paymentMethod: 'mercadopago' | 'bank_transfer' | null;
}

export interface ClientData {
  fullName: string;
  docNumber: string;
  gender: GenderEnum;
  phone: string;
}

export interface PaymentStatus {
  status: string;
  params: Record<string, string>;
}

export interface Voucher {
  id: number;
  email: string;
  total: number;
  url: string;
  sent: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface VoucherClient {
  id: number;
  voucher: Voucher;
  client: Client;
}

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  docNumber: string;
  gender: GenderEnum;
  type: ClientTypeEnum;
  createdAt: string;
  updatedAt: string;
  voucherClients: VoucherClient[];
  tickets: any[];
};

export interface WebDetails {
  id: number;
  subtitle: string;
  mission: string;
  presentation: string;
}

export type ApiResponse<T> =
  | { success: true; data: T; message?: string, status?: string }
  | { success: false; data?: any; message?: string, status?: string };