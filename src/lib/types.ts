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
  events: EventDto[];
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

export interface EventDto {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: EventStatus;
  folder: boolean;
  featured: boolean;
  alias: string | null;
  logo: string;
  createdAt: string;
  updatedAt: string;
  prevents: Prevent[];
  oAuthMercadoPago?: MercadoPagoConfigDto;
  featuredPrevent?: Prevent;
  products?: ProductEventDto[];
  combos?: ComboEventDto[];
  artists: EventArtistDto[];
  payments: EventPaymentDto[];
}

export enum PreventPromoTypeEnum {
  NONE = "NONE",
  X_FOR_Y = "X_FOR_Y",
}

export interface Prevent {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  remaining?: number;
  status: PreventStatusEnum;
  startDate: Date;
  endDate: Date;
  featured: boolean;
  promoType: PreventPromoTypeEnum;
  promoPackSize?: number | null;
  promoPayFor?: number | null;
  promoIsActive?: boolean;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
  promoMaxBundlesPerPurchase?: number | null;
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

export interface ProductBuyerInfo {
  docNumber: string;
  email: string;
  fullName: string;
}

export interface PurchaseData {
  selectedPrevent: Prevent | null;
  ticketQuantity: number;
  clients: TicketInfo[];
  products: PurchaseProductItem[];
  combos: PurchaseComboItem[];
  email: string;
  promoter: string;
  comprobante: File;
  paymentMethod: 'mercadopago' | 'bank_transfer' | 'free' | null;
  coupon: CouponEvent | null;
  total: number;
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
  eventTitle: string;
  eventSubtitle: string;
  galleryTitle: string;
  gallerySubtitle: string;
  totalEvents: number;
  totalTickets: number;
}

export enum ProductStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SOLD_OUT = 'SOLD_OUT',
}

export interface ProductEventDto {
  id: number;
  price: string;
  discountPercentage: string;
  eventStock: number;
  initialEventStock: number;
  status: ProductStatusEnum;
  product: ProductDto;
}

export interface ProductDto {
  id: number;
  name: string;
  description: string;
  basePrice: string;
  brand: string;
  imageUrl?: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseProductItem {
  quantity: number;
  product: ProductEventDto;
}

export interface PurchaseComboItem {
  quantity: number;
  combo: ComboEventDto;
}

export interface ComboEventDto {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
  comboItems: Array<ProductComboItemDto>;
}

export interface ProductComboItemDto {
  id: number;
  quantity: number;
  productEvent: ProductEventDto;
}

export enum ProductTypeEnum {
  PRODUCT = 'PRODUCT',
  COMBO = 'COMBO'
}

export enum ArtistGenderEnum {
  CACHENGUE = 'CACHENGUE',
  TECHNO = 'TECHNO',
  OTRO = 'OTRO'
}

export interface EventArtistDto {
  id?: number;
  name: string;
  image: string;
  description: string;
  spotify: string;
  gender: ArtistGenderEnum;
}

export class EventImageDto {
  id?: number;
  name: string;
  url: string;
  event: EventDto;
}

export interface PaymentMethodDto {
  id: number;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventPaymentDto {
  id: number;
  active: boolean;
  accountFullName: string | null;
  accountBank: string | null;
  accountAlias: string | null;
  paymentMethod: PaymentMethodDto;
}

export interface InEventPurchaseData {
  buyer: ProductBuyerInfo;
  products: PurchaseProductItem[];
  combos: PurchaseComboItem[];
  paymentMethod: "mercadopago" | "cash" | null;
  total: number;
}

export class ProductItemDto {
  productId: number;
  quantity: number
}

export class ComboItemDto {
  comboId: number;
  quantity: number
}

export interface InEventPurchasePayload {
  client: ProductBuyerInfo;
  products: ProductItemDto[];
  combos: ComboItemDto[];
  total: number;
  coupon: number | null;
}

export type CouponDiscountType = 'PERCENT' | 'AMOUNT';
export type CouponChannel = 'ONLINE' | 'IN_EVENT' | 'BOTH';

export interface CouponEvent {
  id: number;
  eventId: number;
  name: string;
  description?: string | null;
  code: string;
  discountType: CouponDiscountType;
  value: string;
  maxDiscountAmount?: string | null;
  minOrderAmount?: string | null;
  maxUsesTotal?: number | null;
  maxUsesPerUser?: number | null;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  channel: CouponChannel;
  usesCount: number;
  totalGrossAmount: string;
  totalDiscountAmount: string;
}


export type ApiResponse<T> =
  | { success: true; data: T; message?: string, status?: string }
  | { success: false; data?: any; message?: string, status?: string };