import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/api/authApi";
import {
  addLocalAccount,
  findLocalAccount,
  getLocalAccounts,
  saveLocalAccounts,
} from "../services/localStore";
import { getRole, saveStoredRole } from "../utils/roles";

const AuthContext = createContext();

const DEMO_ADMIN = {
  _id: "demo-admin",
  name: "Admin",
  email: "admin@voltixstore.com",
  password: "Admin@12345",
  role: "admin",
  token: "demo-admin-token",
  active: true,
};

function ensureDemoAdmin() {
  const existing = findLocalAccount(DEMO_ADMIN.email, "admin");
  if (!existing) {
    addLocalAccount(DEMO_ADMIN);
    return;
  }

  if (existing.name !== "Admin") {
    saveLocalAccounts(
      getLocalAccounts().map((account) =>
        account.email === DEMO_ADMIN.email
          ? { ...account, name: "Admin" }
          : account
      )
    );
  }
}

function readUser() {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function normalizeUser(apiUser, email, role = "customer") {
  return {
    ...apiUser,
    email: apiUser?.email || email,
    role:
      apiUser?.role === "admin" || apiUser?.role === "seller"
        ? apiUser.role
        : role,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(false);

  async function login(email, password, selectedRole = "customer") {
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      ensureDemoAdmin();

      // Local accounts are role-aware. A seller account must never hijack
      // a customer login with the same email, and vice versa.
      if (selectedRole === "seller" || selectedRole === "admin") {
        const local = findLocalAccount(normalizedEmail, selectedRole);

        if (!local) {
          throw new Error(
            `No ${selectedRole} account exists for this email. Create a ${selectedRole} account first.`
          );
        }

        if (local.active === false) {
          throw new Error(
            "This account is restricted by the administrator."
          );
        }

        if (local.password !== password) {
          throw new Error("Incorrect email or password.");
        }

        localStorage.setItem("token", local.token);
        localStorage.setItem("user", JSON.stringify(local));
        saveStoredRole(normalizedEmail, local.role);
        setUser(local);

        return { user: local, token: local.token };
      }

      // Customer authentication always uses the real Route API.
      const data = await loginUser({
        email: normalizedEmail,
        password,
      });

      const apiUser = data?.user || data?.data?.user || {};
      const finalUser = normalizeUser(apiUser, normalizedEmail, "customer");

      if (finalUser.role !== "customer") {
        throw new Error("This account is not a customer account.");
      }

      if (!data?.token) {
        throw new Error("Login succeeded without receiving an authentication token.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(finalUser));
      saveStoredRole(normalizedEmail, "customer");
      setUser(finalUser);

      return { ...data, user: finalUser };
    } finally {
      setLoading(false);
    }
  }

  async function register(userData, selectedRole = "customer") {
    setLoading(true);

    try {
      const normalized = {
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        rePassword: userData.rePassword,
        phone: userData.phone.trim(),
      };

      if (normalized.password !== normalized.rePassword) {
        throw new Error("Passwords do not match.");
      }

      if (selectedRole === "customer") {
        // Do not check the local seller store here. The Route API owns
        // customer accounts and validates email uniqueness server-side.
        const data = await registerUser(normalized);

        // Route API normally returns a token and user after signup.
        // Use them directly so registration cannot fail because of a
        // redundant second signin request.
        if (data?.token) {
          const apiUser = data?.user || data?.data?.user || {};
          const finalUser = normalizeUser(apiUser, normalized.email, "customer");

          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(finalUser));
          saveStoredRole(normalized.email, "customer");
          setUser(finalUser);

          return { ...data, user: finalUser };
        }

        // Safe fallback for API variants that return no token on signup.
        return await login(normalized.email, normalized.password, "customer");
      }

      if (selectedRole === "seller") {
        const existingSeller = findLocalAccount(normalized.email, "seller");
        if (existingSeller) {
          throw new Error("A seller account with this email already exists.");
        }

        const account = {
          _id: `local-seller-${Date.now()}`,
          name: normalized.name,
          email: normalized.email,
          phone: normalized.phone,
          password: normalized.password,
          role: "seller",
          token: `local-seller-token-${Date.now()}`,
          createdAt: new Date().toISOString(),
          active: true,
        };

        addLocalAccount(account);
        saveStoredRole(normalized.email, "seller");
        localStorage.setItem("token", account.token);
        localStorage.setItem("user", JSON.stringify(account));
        setUser(account);

        return { user: account, token: account.token };
      }

      throw new Error("This account type cannot be registered from the public form.");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  function updateUser(next) {
    const final = { ...user, ...next };
    const local = findLocalAccount(final.email, final.role);

    if (local) {
      saveLocalAccounts(
        getLocalAccounts().map((account) =>
          account.email === local.email && account.role === local.role
            ? { ...account, ...final }
            : account
        )
      );
    }

    localStorage.setItem("user", JSON.stringify(final));
    setUser(final);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: getRole(user),
        loading,
        login,
        register,
        logout,
        updateUser,
        isLoggedIn: !!user,
        demoAdmin: DEMO_ADMIN,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
