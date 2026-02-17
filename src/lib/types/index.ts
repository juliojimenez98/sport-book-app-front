// ============================================
// Types for the booking platform frontend
// ============================================

// Enums
export enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
  NO_SHOW = "no_show",
}

export enum BookingSource {
  WEB = "web",
  APP = "app",
  PHONE = "phone",
  WALK_IN = "walk_in",
}

export enum RoleName {
  SUPER_ADMIN = "super_admin",
  TENANT_ADMIN = "tenant_admin",
  BRANCH_ADMIN = "branch_admin",
  STAFF = "staff",
}

export enum RoleScope {
  GLOBAL = "global",
  TENANT = "tenant",
  BRANCH = "branch",
}

// Base entities
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Branch {
  id: number;
  tenantId: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  // Amenities
  hasParking: boolean;
  hasBathrooms: boolean;
  hasShowers: boolean;
  hasLockers: boolean;
  hasWifi: boolean;
  hasCafeteria: boolean;
  hasEquipmentRental: boolean;
  amenitiesDescription?: string;
  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

export interface Sport {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  isActive: boolean;
}

export interface BranchSport {
  branchId: number;
  sportId: number;
  sport?: Sport;
}

export interface Resource {
  id: number;
  branchId: number;
  sportId: number;
  name: string;
  description?: string;
  pricePerHour: number;
  currency: string;
  slotMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  branch?: Branch;
  sport?: Sport;
  // Extended fields
  imageUrl?: string;
  openTime?: string;
  closeTime?: string;
  type?: string;
  capacity?: number;
  surface?: string;
  indoor?: boolean;
}

export interface BranchHours {
  id: number;
  branchId: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Guest {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface Booking {
  id: number;
  resourceId: number;
  userId?: number;
  guestId?: number;
  startAt: string;
  endAt: string;
  status: BookingStatus;
  source: BookingSource;
  totalPrice: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  resource?: Resource;
  user?: UserProfile;
  guest?: Guest;
}

export interface BookingCancellation {
  id: number;
  bookingId: number;
  cancelledBy?: number;
  reason?: string;
  cancelledAt: string;
}

// Auth & User
export interface Role {
  id: number;
  name: RoleName;
  description?: string;
}

export interface UserRole {
  id?: number;
  userId?: number;
  roleId: number;
  roleName?: RoleName; // Backend sends this directly from login/me
  scope: RoleScope;
  tenantId?: number | null;
  branchId?: number | null;
  role?: Role;
  tenant?: Tenant;
  branch?: Branch;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  roles?: UserRole[];
  userRoles?: UserRole[]; // Backend returns this from /users endpoint
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginResponse {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
}

export interface TokenPayload {
  userId: number;
  email: string;
  roles: Array<{
    name: RoleName;
    scope: RoleScope;
    tenantId?: number;
    branchId?: number;
  }>;
  iat: number;
  exp: number;
}

// Time slot for booking calendar
export interface TimeSlot {
  start: string;
  end: string;
}

// Calendar
export interface CalendarSlot {
  startAt: string;
  endAt: string;
  isAvailable: boolean;
  bookingId?: number;
}

export interface CalendarResponse {
  resourceId: number;
  from: string;
  to: string;
  slots: CalendarSlot[];
}

// API responses
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface GuestBookingForm {
  resourceId: number;
  startAt: string;
  endAt: string;
  guest: {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  notes?: string;
}

export interface UserBookingForm {
  resourceId: number;
  startAt: string;
  endAt: string;
  notes?: string;
}

export interface TenantForm {
  name: string;
  slug: string;
  email: string;
  phone?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
}

export interface BranchForm {
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  isActive?: boolean;
  // Amenities
  hasParking?: boolean;
  hasBathrooms?: boolean;
  hasShowers?: boolean;
  hasLockers?: boolean;
  hasWifi?: boolean;
  hasCafeteria?: boolean;
  hasEquipmentRental?: boolean;
  amenitiesDescription?: string;
}

export interface ResourceForm {
  name: string;
  sportId: number;
  description?: string;
  pricePerHour: number;
  currency: string;
  slotMinutes: number;
}
