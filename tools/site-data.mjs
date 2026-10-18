export function buildWhatsAppUrl(profile) {
  const digits = String(profile.whatsappDigits ?? '').replace(/\D/g, '');
  const message = String(profile.whatsappMessage ?? '').trim();
  if (!digits || !message) throw new Error('WhatsApp requires international digits and a default message.');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function safeExternalUrl(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  let url;
  try { url = new URL(raw); } catch { throw new Error(`Invalid project URL: ${raw}`); }
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`Unsupported project URL protocol: ${url.protocol}`);
  return url.href;
}
