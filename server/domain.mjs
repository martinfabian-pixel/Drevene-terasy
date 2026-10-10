import { createHash, randomUUID } from 'node:crypto';
export class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
const cleanString = (value, name, max = 200, required = false) => {
  if (value == null && !required) return '';
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new ApiError(400, `Invalid ${name}.`);
  const result = value.trim(); if (required && !result) throw new ApiError(400, `${name} is required.`); return result;
};
export function validateInquiry(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Invalid inquiry.');
  const contact = value.contact || value;
  const name = cleanString(contact.name, 'name', 150, true), email = cleanString(contact.email, 'email', 254, true);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, 'Invalid email.');
  const attachments = value.attachments || [];
  if (!Array.isArray(attachments) || attachments.length > 6) throw new ApiError(400, 'Too many attachments.');
  let attachmentBytes = 0;
  const safeAttachments = attachments.map(file => {
    const filename = cleanString(file.name, 'attachment name', 150, true).replace(/[\\/]/g, '_');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new ApiError(400, 'Unsupported attachment type.');
    if (typeof file.dataUrl !== 'string' || !file.dataUrl.startsWith(`data:${file.type};base64,`)) throw new ApiError(400, 'Invalid image encoding.');
    const raw = file.dataUrl.slice(file.dataUrl.indexOf(',') + 1);
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4 !== 0) throw new ApiError(400, 'Invalid image base64.');
    const bytes = Buffer.from(raw, 'base64'); attachmentBytes += bytes.length;
    const validMagic = file.type === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : file.type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP';
    if (!validMagic || !bytes.length) throw new ApiError(400, 'Invalid image data.');
    return { name: filename, type: file.type, dataUrl: file.dataUrl };
  });
  if (attachmentBytes > 10_000_000) throw new ApiError(413, 'Attachments too large.');
  const dimensions = {};
  for (const field of ['lengthM', 'widthM']) if (contact[field] !== '' && contact[field] != null) { const number = Number(contact[field]); if (!Number.isFinite(number) || number <= 0 || number > 50) throw new ApiError(400, 'Invalid dimensions.'); dimensions[field] = number; }
  const plannerProject = value.plannerProject ?? null;
  if (plannerProject !== null && JSON.stringify(plannerProject).length > 1_000_000) throw new ApiError(413, 'Project too large.');
  return { name, email, phone: cleanString(contact.phone, 'phone', 40), location: cleanString(contact.location, 'location', 200),
    message: cleanString(contact.message || contact.note, 'message', 5000), dimensions, attachments: safeAttachments, plannerProject };
}
export function validateProductCatalog(value) {
  if (!Array.isArray(value) || value.length > 5000) throw new ApiError(400, 'Invalid catalog.');
  const ids = new Set(), variantIds = new Set();
  return value.map(product => {
    if (!product || typeof product !== 'object' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(product.id) || ids.has(product.id)) throw new ApiError(400, 'Invalid or duplicate product ID.');
    ids.add(product.id);
    const name = cleanString(product.name, 'product name', 200, true);
    if (!['massive', 'thermo', 'wpc', 'joists', 'aluminium', 'fixings', 'pedestals', 'finish', 'care', 'accessories'].includes(product.category)) throw new ApiError(400, 'Invalid category.');
    const httpsUrl = source => { if (source === null || source === '') return null; if (typeof source !== 'string' || source.length > 2000) throw new ApiError(400, 'Invalid URL.'); try { const url = new URL(source); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch {} throw new ApiError(400, 'HTTPS URL required.'); };
    const technicalSheet = httpsUrl(product.technicalSheet ?? null);
    if (!Array.isArray(product.sourceUrls) || product.sourceUrls.length > 20) throw new ApiError(400, 'Source URLs required.');
    const sourceUrls = product.sourceUrls.map(httpsUrl).filter(Boolean);
    if (product.status === 'verified' && !sourceUrls.length) throw new ApiError(400, 'Verified products need source provenance.');
    if (!Array.isArray(product.images) || product.images.length > 6 || product.images.some(image => typeof image !== 'string' || !(/^[a-zA-Z0-9_-]+\.(webp|jpg|jpeg|png)$/.test(image) || /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image) && image.length <= 2800000))) throw new ApiError(400, 'Invalid image reference.');
    if (!['demo', 'verified'].includes(product.status) || !Array.isArray(product.variants) || !product.variants.length || product.variants.length > 500) throw new ApiError(400, 'Invalid product status or variants.');
    const variants = product.variants.map(variant => {
      if (!variant || !/^[a-z0-9][a-z0-9_-]{0,119}$/.test(variant.id) || variantIds.has(variant.id)) throw new ApiError(400, 'Invalid or duplicate variant ID.');
      variantIds.add(variant.id);
      if (!['ks', 'bm', 'm²', 'bal', 'l'].includes(variant.unit)) throw new ApiError(400, 'Invalid sale unit.');
      for (const key of ['lengthMm', 'widthMm', 'thicknessMm']) if (variant[key] !== null && (typeof variant[key] !== 'number' || !Number.isFinite(variant[key]) || variant[key] <= 0 || variant[key] > 20000)) throw new ApiError(400, 'Invalid dimensions.');
      if (variant.priceGross !== null && (typeof variant.priceGross !== 'number' || !Number.isFinite(variant.priceGross) || variant.priceGross < 0 || variant.priceGross > 1_000_000)) throw new ApiError(400, 'Invalid price.');
      if (variant.vatRate !== null && (typeof variant.vatRate !== 'number' || !Number.isFinite(variant.vatRate) || variant.vatRate < 0 || variant.vatRate > 100)) throw new ApiError(400, 'Invalid VAT.');
      if (variant.priceGross !== null && variant.vatRate === null) throw new ApiError(400, 'Price requires VAT rate.');
      let stock = null;
      if (variant.stock != null) {
        if (!['available', 'preorder', 'unavailable'].includes(variant.stock.status) || !Number.isInteger(variant.stock.availableQuantity) || variant.stock.availableQuantity < 0 || variant.stock.availableQuantity > 10000000) throw new ApiError(400, 'Invalid structured stock.');
        stock = { status: variant.stock.status, availableQuantity: variant.stock.availableQuantity };
      }
      return { id: variant.id, lengthMm: variant.lengthMm, widthMm: variant.widthMm, thicknessMm: variant.thicknessMm, unit: variant.unit, priceGross: variant.priceGross, vatRate: variant.vatRate,
        profile: cleanString(variant.profile, 'profile', 150), color: cleanString(variant.color, 'color', 150), availability: cleanString(variant.availability, 'availability', 200) || null, stock };
    });
    return { id: product.id, name, category: product.category, family: cleanString(product.family, 'family', 150), manufacturer: cleanString(product.manufacturer, 'manufacturer', 150) || null,
      woodSpecies: cleanString(product.woodSpecies, 'species', 150) || null, surface: cleanString(product.surface, 'surface', 150) || null, description: cleanString(product.description, 'description', 10000),
      images: product.images, variants, technicalSheet, sourceUrls, status: product.status };
  });
}
export function calculateOrder(value, catalog) {
  if (!value || !Array.isArray(value.items) || !value.items.length || value.items.length > 500) throw new ApiError(400, 'Invalid order items.');
  const contact = validateInquiry({ contact: value.contact });
  const grouped = new Map();
  for (const item of value.items) {
    if (!item || typeof item.productId !== 'string' || typeof item.variantId !== 'string' || !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100000) throw new ApiError(400, 'Invalid item.');
    const id = `${item.productId}:${item.variantId}`, previous = grouped.get(id);
    if (previous) previous.quantity += item.quantity; else grouped.set(id, { productId: item.productId, variantId: item.variantId, quantity: item.quantity });
  }
  const items = [...grouped.values()].map(item => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100000) throw new ApiError(400, 'Invalid item quantity.');
    const product = catalog.find(row => row.id === item.productId), variant = product?.variants.find(row => row.id === item.variantId);
    if (!product || product.status !== 'verified' || !variant || variant.priceGross === null || variant.vatRate === null || variant.stock?.status !== 'available' || variant.stock.availableQuantity < item.quantity) throw new ApiError(409, 'Product is not confirmed and in stock for ordering.');
    const units = variant.unit === 'bm' ? item.quantity * variant.lengthMm / 1000 : variant.unit === 'm²' ? item.quantity * variant.lengthMm * variant.widthMm / 1_000_000 : item.quantity;
    if (!Number.isFinite(units) || units <= 0) throw new ApiError(409, 'Missing sale dimensions.');
    const grossCents = Math.round(variant.priceGross * units * 100), netCents = Math.round(grossCents / (1 + variant.vatRate / 100));
    if (!Number.isSafeInteger(grossCents) || !Number.isSafeInteger(netCents)) throw new ApiError(400, 'Order value exceeds safe limits.');
    return { productId: product.id, variantId: variant.id, name: product.name, quantity: item.quantity, saleQuantity: units, unit: variant.unit, unitPriceGross: variant.priceGross, vatRate: variant.vatRate, grossCents, netCents };
  });
  const address = {};
  for (const field of ['billingStreet', 'billingCity', 'billingPostcode', 'deliveryStreet', 'deliveryCity', 'deliveryPostcode']) address[field] = cleanString(value.contact?.[field], field, 200, !field.startsWith('delivery') || value.delivery === 'delivery');
  if (!['delivery', 'pickup'].includes(value.delivery)) throw new ApiError(400, 'Invalid delivery mode.');
  if (!Number.isSafeInteger(items.reduce((sum, item) => sum + item.grossCents, 0))) throw new ApiError(400, 'Order total exceeds safe limits.');
  address.billingCountry = cleanString(value.contact?.billingCountry || 'Slovensko', 'billingCountry', 100, true);
  const billing = { company: cleanString(value.contact?.company, 'company', 150), companyId: cleanString(value.contact?.companyId, 'companyId', 8), taxId: cleanString(value.contact?.taxId, 'taxId', 30), vatId: cleanString(value.contact?.vatId, 'vatId', 30) };
  if (billing.company && !/^[0-9]{8}$/.test(billing.companyId)) throw new ApiError(400, 'Company requires a valid company ID.');
  return { id: randomUUID(), createdAt: new Date().toISOString(), status: 'awaiting-confirmation', paymentStatus: 'not-initiated', contact, address, delivery: value.delivery, items,
    billing, grossCents: items.reduce((sum, item) => sum + item.grossCents, 0), netCents: items.reduce((sum, item) => sum + item.netCents, 0), deliveryCents: null, currency: 'EUR' };
}
export const requestHash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
