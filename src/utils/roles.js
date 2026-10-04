export const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
};

export const ROLE_LABELS = {
  customer: "Customer",
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

/**
 * The store now has two account types: customer and admin.
 * Anything that is not an admin account - including a stale
 * "seller" value left in localStorage by an older build - is
 * treated as a customer, so no dead role can linger.
 */
export function getRole(user) {
  if (user?.role === "admin") return ROLES.ADMIN;

  return ROLES.CUSTOMER;
}