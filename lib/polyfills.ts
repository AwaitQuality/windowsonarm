// Polyfill for DOMParser in Edge Runtime/Cloudflare Workers
// Required for AWS SDK v3 to work in Edge Runtime
import { DOMParser as XDOMParser } from '@xmldom/xmldom';

// Set global DOMParser if it doesn't exist
if (typeof globalThis.DOMParser === 'undefined') {
  (globalThis as any).DOMParser = XDOMParser;
}