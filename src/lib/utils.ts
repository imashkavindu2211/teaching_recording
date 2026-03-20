export const normalizeNIC = (nic: string): string => {
  if (!nic) return "";
  // Remove all whitespace, convert to uppercase, and remove 'V' as per requirements
  return nic.replace(/\s+/g, '').toUpperCase().replace(/V/g, '');
};
