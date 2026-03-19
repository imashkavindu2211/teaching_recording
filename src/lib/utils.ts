export const normalizeNIC = (nic: string): string => {
  if (!nic) return "";
  // Trim spaces, convert to uppercase, and remove 'V' as per requirements
  return nic.trim().toUpperCase().replace(/V/g, '');
};
