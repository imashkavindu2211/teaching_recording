export const normalizeNIC = (nic: string): string => {
  if (!nic) return "";
  // Keep only numbers and the letter 'V' (converting lowercase 'v' to 'V')
  return nic.replace(/[^0-9Vv]/g, '').toUpperCase();
};
