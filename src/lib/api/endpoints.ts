import api from "./client";
import {
  Tenant,
  Branch,
  Sport,
  Resource,
  Booking,
  UserProfile,
  Role,
  LoginForm,
  RegisterForm,
  LoginResponse,
  CalendarResponse,
  PaginatedResponse,
  GuestBookingForm,
  UserBookingForm,
  TenantForm,
  BranchForm,
  ResourceForm,
} from "@/lib/types";

// ============================================
// Auth endpoints
// ============================================

export const authApi = {
  login: (data: LoginForm) =>
    api.post<LoginResponse>("/auth/login", data, { skipAuth: true }),

  register: (data: RegisterForm) =>
    api.post<LoginResponse>("/auth/register", data, { skipAuth: true }),

  logout: () => api.post<void>("/auth/logout"),

  refresh: (refreshToken: string) =>
    api.post<{ accessToken: string; refreshToken?: string }>(
      "/auth/refresh",
      { refreshToken },
      { skipAuth: true },
    ),

  me: () => api.get<UserProfile>("/auth/me"),
};

// ============================================
// Tenants endpoints
// ============================================

export const tenantsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Tenant>>(
      `/tenants${params ? `?page=${params.page || 1}&limit=${params.limit || 10}` : ""}`,
    ),

  get: (id: number) => api.get<Tenant>(`/tenants/${id}`),

  create: (data: TenantForm) => api.post<Tenant>("/tenants", data),

  update: (id: number, data: Partial<TenantForm>) =>
    api.put<Tenant>(`/tenants/${id}`, data),

  delete: (id: number) => api.delete<void>(`/tenants/${id}`),

  getBranches: (tenantId: number) =>
    api.get<Branch[]>(`/tenants/${tenantId}/branches`),

  createBranch: (tenantId: number, data: BranchForm) =>
    api.post<Branch>(`/tenants/${tenantId}/branches`, data),
};

// ============================================
// Branches endpoints
// ============================================

export const branchesApi = {
  list: () => api.get<Branch[]>("/branches"),

  get: (id: number) => api.get<Branch>(`/branches/${id}`),

  getBySlug: (tenantSlug: string, branchSlug: string) =>
    api.get<Branch>(`/branches/by-slug/${tenantSlug}/${branchSlug}`, {
      skipAuth: true,
    }),

  update: (id: number, data: Partial<BranchForm>) =>
    api.put<Branch>(`/branches/${id}`, data),

  delete: (id: number) => api.delete<void>(`/branches/${id}`),

  getSports: (branchId: number) =>
    api.get<Sport[]>(`/branches/${branchId}/sports`, { skipAuth: true }),

  addSport: (branchId: number, sportId: number) =>
    api.post<void>(`/branches/${branchId}/sports`, { sportId }),

  removeSport: (branchId: number, sportId: number) =>
    api.delete<void>(`/branches/${branchId}/sports/${sportId}`),

  getResources: (branchId: number) =>
    api.get<Resource[]>(`/branches/${branchId}/resources`, { skipAuth: true }),

  createResource: (branchId: number, data: ResourceForm) =>
    api.post<Resource>(`/branches/${branchId}/resources`, data),

  getBookings: (branchId: number, params?: { from?: string; to?: string }) => {
    const query = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    return api.get<Booking[]>(`/branches/${branchId}/bookings${query}`);
  },
};

// ============================================
// Sports endpoints
// ============================================

export const sportsApi = {
  list: () => api.get<Sport[]>("/sports", { skipAuth: true }),

  get: (id: number) => api.get<Sport>(`/sports/${id}`, { skipAuth: true }),

  create: (data: { name: string; description?: string }) =>
    api.post<Sport>("/sports", data),

  update: (id: number, data: { name?: string; description?: string }) =>
    api.put<Sport>(`/sports/${id}`, data),

  delete: (id: number) => api.delete<void>(`/sports/${id}`),
};

// ============================================
// Resources endpoints
// ============================================

export const resourcesApi = {
  get: (id: number) =>
    api.get<Resource>(`/resources/${id}`, { skipAuth: true }),

  getById: (id: string | number) =>
    api.get<Resource>(`/resources/${id}`, { skipAuth: true }),

  update: (id: number, data: Partial<ResourceForm>) =>
    api.put<Resource>(`/resources/${id}`, data),

  delete: (id: number) => api.delete<void>(`/resources/${id}`),

  getCalendar: (resourceId: number, from: string, to: string) =>
    api.get<CalendarResponse>(
      `/resources/${resourceId}/calendar?from=${from}&to=${to}`,
      { skipAuth: true },
    ),
};

// ============================================
// Bookings endpoints
// ============================================

export const bookingsApi = {
  create: (data: GuestBookingForm | UserBookingForm) =>
    api.post<Booking>("/bookings", data, { skipAuth: !("guest" in data) }),

  createAsGuest: (data: GuestBookingForm) =>
    api.post<Booking>("/bookings", data, { skipAuth: true }),

  createAsUser: (data: UserBookingForm) => api.post<Booking>("/bookings", data),

  get: (id: number) => api.get<Booking>(`/bookings/${id}`),

  cancel: (id: number, reason?: string) =>
    api.post<Booking>(`/bookings/${id}/cancel`, { reason }),

  confirm: (id: number) => api.put<Booking>(`/bookings/${id}/confirm`),
};

// ============================================
// Users endpoints
// ============================================

export const usersApi = {
  getMyBookings: () => api.get<Booking[]>("/users/me/bookings"),

  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tenantId?: number;
    branchId?: number;
    roleId?: number;
    roleName?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", params.page.toString());
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.search) searchParams.set("search", params.search);
    if (params?.tenantId)
      searchParams.set("tenantId", params.tenantId.toString());
    if (params?.branchId)
      searchParams.set("branchId", params.branchId.toString());
    if (params?.roleId) searchParams.set("roleId", params.roleId.toString());
    if (params?.roleName) searchParams.set("roleName", params.roleName);

    const query = searchParams.toString();
    return api.get<PaginatedResponse<UserProfile>>(
      `/users${query ? `?${query}` : ""}`,
    );
  },

  get: (id: number) => api.get<UserProfile>(`/users/${id}`),

  getRoles: () => api.get<Role[]>("/users/roles"),

  assignRole: (
    userId: number,
    data: {
      roleId: number;
      scope: string;
      tenantId?: number;
      branchId?: number;
    },
  ) => api.post<void>(`/users/${userId}/roles`, data),

  removeRole: (userId: number, roleId: number) =>
    api.delete<void>(`/users/${userId}/roles/${roleId}`),
};

// ============================================
// Public endpoints (for browse page - no auth required)
// ============================================

export const publicApi = {
  getTenants: () => api.get<Tenant[]>("/public/tenants", { skipAuth: true }),

  getTenantBySlug: (slug: string) =>
    api.get<Tenant>(`/public/tenants/${slug}`, { skipAuth: true }),

  getBranchBySlug: (tenantSlug: string, branchSlug: string) =>
    api.get<{ tenant: Tenant; branch: Branch }>(
      `/public/tenants/${tenantSlug}/branches/${branchSlug}`,
      { skipAuth: true },
    ),

  getBranches: () => api.get<Branch[]>("/public/branches", { skipAuth: true }),

  getSports: () => api.get<Sport[]>("/public/sports", { skipAuth: true }),

  getBranchResources: (branchId: number) =>
    api.get<Resource[]>(`/public/branches/${branchId}/resources`, {
      skipAuth: true,
    }),

  getResource: (id: number | string) =>
    api.get<Resource>(`/public/resources/${id}`, { skipAuth: true }),
};
