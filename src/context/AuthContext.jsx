import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../services/api/authApi";
import { getRole, saveStoredRole } from "../utils/roles";

const AuthContext = createContext();

function readUser() {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function normalizeUser(apiUser, email, role = "customer", token = "") {
  let tokenUser = {};

  try {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      tokenUser = payload;
    }
  } catch {
    tokenUser = {};
  }

  return {
    ...apiUser,
    _id: apiUser?._id || apiUser?.id || tokenUser?.id,
    email: apiUser?.email || email,
    name: apiUser?.name || tokenUser?.name || "",
    role:
      apiUser?.role === "admin" || tokenUser?.role === "admin"
        ? "admin"
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

      // Customer authentication always uses the real Route API.
      const data = await loginUser({
        email: normalizedEmail,
        password,
      });

      console.log("LOGIN API RESPONSE:", data);

      const apiUser = data?.user || data?.data?.user || {};
        const finalUser = normalizeUser(
          apiUser,
          normalizedEmail,
          "customer",
          data.token
        );
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

      if (selectedRole !== "customer") {
        throw new Error(
          "Only customer accounts can be created from the public form."
        );
      }

      // Route API owns customer accounts and validates email
      // uniqueness server-side.
      const data = await registerUser(normalized);

      // Route API normally returns a token and user after signup.
      // Use them directly so registration cannot fail because of a
      // redundant second signin request.
      if (data?.token) {
        const apiUser = data?.user || data?.data?.user || {};
          const finalUser = normalizeUser(
            apiUser,
            normalized.email,
            "customer",
            data.token
          );
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(finalUser));
        saveStoredRole(normalized.email, "customer");
        setUser(finalUser);

        return { ...data, user: finalUser };
      }

      // Safe fallback for API variants that return no token on signup.
      return await login(normalized.email, normalized.password, "customer");
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}