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
  REJECTED = "rejected",
}

export enum BookingSource {
  WEB = "web",
  APP = "app",
  PHONE = "phone",
  WALK_IN = "walk_in",
}

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
}

export enum DiscountConditionType {
  PROMO_CODE = "promo_code",
  TIME_BASED = "time_based",
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
export interface TenantImage {
  tenantImageId: number;
  tenantId: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Tenant {
  tenantId: number;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logoUrl?: string;
  images?: TenantImage[];
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchImage {
  branchImageId: number;
  branchId: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Branch {
  branchId: number;
  tenantId: number;
  name: string;
  slug: string;
  address?: string;
  phone?: string;
  email?: string;
  images?: BranchImage[];
  timezone: string;
  // Location
  regionId?: string;
  comunaId?: string;
  // Amenities
  hasParking: boolean;
  hasBathrooms: boolean;
  hasShowers: boolean;
  hasLockers: boolean;
  hasWifi: boolean;
  hasCafeteria: boolean;
  hasEquipmentRental: boolean;
  amenitiesDescription?: string;
  // Booking settings
  requiresApproval: boolean;
  // Status
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
  sports?: Sport[];
}

// Chile locations
export interface Comuna {
  id: string;
  name: string;
}

export interface Region {
  id: string;
  name: string;
  romanNumber: string;
  number: string;
  communes: Comuna[];
}

export interface LocationsData {
  name: string;
  regions: Region[];
}

export interface Sport {
  sportId: number;
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

export interface ResourceImage {
  resourceImageId: number;
  resourceId: number;
  imageUrl: string;
  isPrimary: boolean;
}

export interface Resource {
  resourceId: number;
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
  images?: ResourceImage[];
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
  branchHoursId: number;
  branchId: number;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Guest {
  guestId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface Booking {
  bookingId: number;
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
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  resource?: Resource;
  user?: UserProfile;
  guest?: Guest;
  discountId?: number;
  originalPrice?: number;
}

export interface BookingCancellation {
  bookingCancellationId: number;
  bookingId: number;
  cancelledBy?: number;
  reason?: string;
  cancelledAt: string;
}

// Auth & User
export interface Role {
  roleId: number;
  name: RoleName;
  description?: string;
}

export interface UserRole {
  userRoleId?: number;
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
  userId: number;
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

export interface Discount {
  discountId: number;
  tenantId: number;
  branchId?: number;
  resources?: { resourceId: number; name: string }[];
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  conditionType: DiscountConditionType;
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountForm {
  tenantId: number;
  branchId?: number;
  resourceIds?: number[];
  name: string;
  code?: string;
  type: DiscountType;
  value: number;
  conditionType: DiscountConditionType;
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

export interface SurveyResponseForm {
  bookingId: number;
  resourceCondition: number;
  amenitiesRating: number;
  attentionRating: number;
  punctualityRating: number;
  comments?: string;
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
export interface CalendarBooking {
  id: number;
  startAt: string;
  endAt: string;
  status: string;
  userId?: number;
}

export interface CalendarBlockedSlot {
  date: string;
  startTime: string;
  endTime: string;
}

export interface CalendarResponse {
  resourceId: number;
  resourceName: string;
  from: string;
  to: string;
  bookings: CalendarBooking[];
  blockedSlots: CalendarBlockedSlot[];
  discounts: {
    discountId: number;
    name: string;
    type: DiscountType;
    value: number;
    daysOfWeek?: number[];
    startTime?: string;
    endTime?: string;
  }[];
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
  discountCode?: string;
}

export interface UserBookingForm {
  resourceId: number;
  startAt: string;
  endAt: string;
  notes?: string;
  discountCode?: string;
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
  images?: string[];
  timezone?: string;
  isActive?: boolean;
  // Location
  regionId?: string;
  comunaId?: string;
  // Amenities
  hasParking?: boolean;
  hasBathrooms?: boolean;
  hasShowers?: boolean;
  hasLockers?: boolean;
  hasWifi?: boolean;
  hasCafeteria?: boolean;
  hasEquipmentRental?: boolean;
  amenitiesDescription?: string;
  requiresApproval?: boolean;
}

export interface ResourceForm {
  name: string;
  sportId: number;
  description?: string;
  images?: string[];
  pricePerHour: number;
  currency: string;
  slotMinutes: number;
}

// Dashboard stats
export interface TenantDashboardStats {
  stats: {
    totalBranches: number;
    activeBranches: number;
    totalResources: number;
    activeResources: number;
    todayBookings: number;
    pendingBookings: number;
    monthlyBookings: number;
    staffCount: number;
  };
  recentBookings: Booking[];
  branchSummary: {
    id: number;
    name: string;
    isActive: boolean;
    resourceCount: number;
  }[];
  tenantUsers: TenantUser[];
  bookingsChart: { date: string; bookings: number; revenue: number }[];
  pendingBookingsList: Booking[];
}

export interface TenantUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  isActive: boolean;
  roles: {
    roleId: number;
    roleName: string;
    scope: string;
    branchId?: number;
    branchName?: string | null;
  }[];
}

export interface BranchDashboardStats {
  stats: {
    totalResources: number;
    activeResources: number;
    todayBookings: number;
    pendingBookings: number;
    monthlyBookings: number;
    occupancyRate: number;
  };
  upcomingBookings: Booking[];
  bookingsChart: { date: string; bookings: number; revenue: number }[];
}

export interface SuperAdminDashboardStats {
  stats: {
    totalTenants: number;
    activeTenants: number;
    totalBranches: number;
    activeBranches: number;
    totalResources: number;
    activeResources: number;
    totalUsers: number;
    todayBookings: number;
    pendingBookingsToday: number;
    monthlyBookings: number;
    totalBookings: number;
  };
  recentTenants: (Tenant & { branches?: Branch[] })[];
  recentBookings: Booking[];
}

export interface BlockedSlot {
  blockedSlotId: number;
  branchId: number;
  resourceId?: number | null;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdBy?: number;
  createdAt?: string;
  resource?: Resource;
}

export interface BlockedSlotForm {
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  resourceId?: number | null;
}
