export const normalizeNIC = (nic: string): string => {
  if (!nic) return "";
  // Keep ONLY numbers - ignoring 'V', 'v' and any other characters
  return nic.replace(/[^0-9]/g, '');
};
