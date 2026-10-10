import type { CartItem } from './cart-core';
export interface ApiContact { name: string; email: string; phone?: string; location?: string; message?: string; company?: string; companyId?: string; taxId?: string; vatId?: string; billingStreet?: string; billingCity?: string; billingPostcode?: string; billingCountry?: string; deliveryStreet?: string; deliveryCity?: string; deliveryPostcode?: string }
export interface InquiryPayload { contact: ApiContact; attachments?: { name: string; type: 'image/jpeg' | 'image/png' | 'image/webp'; dataUrl: string }[]; plannerProject?: unknown }
export interface OrderPayload { contact: ApiContact; delivery: 'delivery' | 'pickup'; items: Pick<CartItem, 'productId' | 'variantId' | 'quantity'>[] }
export interface ApiConfig { origin: string; inquiriesEnabled: boolean; realOrdersEnabled: boolean; ownerApprovalConfigured: boolean }
export function createCommerceApi(config: ApiConfig) {
  let origin: string | null = null, csrf: string | null = null;
  if (config.origin) { const url = new URL(config.origin); if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Backend requires a plain HTTPS origin.'); origin = url.origin; }
  async function request<T>(route: string, method = 'GET', body?: unknown, idempotencyKey?: string, adminMutation = false): Promise<T> {
    if (!origin) throw new Error('Backend nie je nakonfigurovaný. Použite lokálny export.');
    const response = await fetch(origin + route, { method, credentials: 'include', headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}), ...(adminMutation && csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const value = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(value.error || `Backend odmietol požiadavku (${response.status}).`);
    return value;
  }
  const capabilities = () => request<{ inquiries: boolean; orders: boolean; payments: false; adminRequiresAuthentication: boolean }>('/api/capabilities');
  return {
    configured: origin !== null, capabilities,
    async sendInquiry(payload: InquiryPayload, idempotencyKey: string) { if (!config.inquiriesEnabled) throw new Error('Odosielanie dopytov nie je aktivované.'); if (!(await capabilities()).inquiries) throw new Error('Príjem dopytov nie je pripravený na serveri.'); return request<{ id: string; status: 'received' }>('/api/inquiries', 'POST', payload, idempotencyKey); },
    async sendOrder(payload: OrderPayload, idempotencyKey: string) { if (!(config.realOrdersEnabled && config.ownerApprovalConfigured)) throw new Error('Reálne objednávky nie sú schválené a aktivované.'); if (!(await capabilities()).orders) throw new Error('Reálne objednávky sú vypnuté na serveri.'); return request<{ id: string; status: 'awaiting-confirmation'; paymentStatus: 'not-initiated' }>('/api/orders', 'POST', payload, idempotencyKey); },
    async adminLogin(user: string, password: string) { const result = await request<{ role: 'admin'; csrf: string }>('/api/admin/login', 'POST', { user, password }); csrf = result.csrf; return { role: result.role }; },
    async adminLogout() { await request('/api/admin/logout', 'POST', {}, undefined, true); csrf = null; },
    adminRead: <T,>(collection: 'products' | 'articles' | 'realizations' | 'orders' | 'inquiries') => request<{ items: T[] }>(`/api/admin/${collection}`),
    adminSave: (collection: 'products' | 'articles' | 'realizations', items: unknown[]) => request<{ saved: true; count: number }>(`/api/admin/${collection}`, 'PUT', { items }, undefined, true),
  };
}
// These flags are false in the published preview. Reading configuration performs no network operation.
export const commerceApi = createCommerceApi({ origin: import.meta.env.VITE_API_ORIGIN || '', inquiriesEnabled: import.meta.env.VITE_ENABLE_INQUIRIES === 'yes', realOrdersEnabled: import.meta.env.VITE_ENABLE_REAL_ORDERS === 'yes', ownerApprovalConfigured: import.meta.env.VITE_COMMERCE_OWNER_APPROVED === 'yes' });
