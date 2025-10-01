'use client';

export function isExtensionPresent(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check for common extension attributes
  const html = document.documentElement;
  return !!(
    html.getAttribute('rp-extension') ||
    html.getAttribute('data-extension') ||
    html.getAttribute('extension-id') ||
    // Check for extension scripts
    Array.from(document.scripts).some(script => 
      script.src.includes('chrome-extension://') ||
      script.src.includes('moz-extension://')
    )
  );
}

export function getExtensionSafeHTML(html: string): string {
  // Remove extension attributes that cause hydration issues
  return html
    .replace(/\s*rp-extension="[^"]*"/g, '')
    .replace(/\s*data-extension="[^"]*"/g, '')
    .replace(/\s*extension-id="[^"]*"/g, '');
}
