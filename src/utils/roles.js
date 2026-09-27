export const ROLES = {
  CUSTOMER: "customer",
  SELLER: "seller",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  customer: "Customer",
  seller: "Seller",
  admin: "Admin",
};

export function getStoredRole(email) {
  try {
    const roles = JSON.parse(localStorage.getItem("electrostore_roles") || "{}");
    return roles[email?.toLowerCase()] || null;
  } catch {
    return null;
  }
}

export function saveStoredRole(email, role) {
  try {
    const roles = JSON.parse(localStorage.getItem("electrostore_roles") || "{}");
    roles[email.toLowerCase()] = role;
    localStorage.setItem("electrostore_roles", JSON.stringify(roles));
  } catch {
    // Ignore storage errors.
  }
}

export function getRole(user) {
  if (user?.role === "admin" || user?.role === "seller" || user?.role === "customer") {
    return user.role;
  }
  if (user?.role === "user") return ROLES.CUSTOMER;
  return getStoredRole(user?.email) || ROLES.CUSTOMER;
}
