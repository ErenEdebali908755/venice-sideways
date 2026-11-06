/* One decorative icon family. Native buttons/selects supply localized names. */
const spriteNames = new Set([
  "back", "close", "next", "previous", "gallery", "zoom-in", "zoom-out",
  "location", "recenter", "location-stop", "sun", "moon", "system",
  "check", "warning", "boat",
]);
const paths = {
  camera: '<path d="M8 6l2-3h4l2 3h4a2 2 0 0 1 2 2v11H2V8a2 2 0 0 1 2-2z"/><circle cx="12" cy="12" r="4"/>',
  "arrow-left": '<path d="m10 5-7 7 7 7M3 12h18"/>',
  "arrow-right": '<path d="m14 5 7 7-7 7M3 12h18"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-up": '<path d="m6 15 6-6 6 6"/>',
  "external-link": '<path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.2"/>',
  options: '<path d="M4 6h7m4 0h5M4 12h2m4 0h10M4 18h10m4 0h2"/><circle cx="13" cy="6" r="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
  resize: '<path d="M8 3h8m-8 18h8m-4-18v18m-3-15 3-3 3 3m-6 12 3 3 3-3"/>',
};
export const icon = (name) => {
  const shape = paths[name];
  if (shape) return `<svg class="fg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${shape}</svg>`;
  return spriteNames.has(name) ? `<svg class="fg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use href="/field-guide/icons.svg?v=20261010-third-review#${name}"></use></svg>` : "";
};
