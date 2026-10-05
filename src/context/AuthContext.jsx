import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, verifyToken } from "../services/api/authApi";
import { adminTestLogin } from "../services/api/adminApi";
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

/**
 * Route API answers both signup and signin with a user payload of
 * only { name, email, role } - there is no _id in it. The real id is
 * carried inside the token that comes back, and the per-user
 * endpoints (orders, most obviously) are keyed by that id, so it is
 * resolved once and merged onto the stored user.
 *
 * This runs against the token already in localStorage, and it must
 * never block a sign-in: any failure simply leaves _id unset.
 */
async function resolveUserId() {
  if (!localStorage.getItem("token")) {
    return null;
  }

  try {
    const data = await verifyToken();

    const id =
      data?.decoded?.id ||
      data?.data?.decoded?.id ||
      data?.user?._id ||
      data?.data?.user?._id ||
      null;

    return id ? String(id) : null;
  } catch (error) {
    console.warn(
      "[auth] could not resolve the account id from the token:",
      error?.message
    );

    return null;
  }
}

function withResolvedId(user, id) {
  return id ? { ...user, _id: id } : user;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [loading, setLoading] = useState(false);

  async function login(email, password, selectedRole = "customer") {
    setLoading(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      /* The Route API is a customer API. It has no admin account to
         sign into, never returns an admin role, and there is no admin
         auth endpoint to call, so an admin session cannot be minted
         through loginUser(). The admin branch therefore goes to the
         local test endpoint instead, which stays inert unless the
         server has explicitly enabled it.

         The customer path below this is unchanged. */
      if (selectedRole === "admin") {
        const data = await adminTestLogin({
          email: normalizedEmail,
          password,
        });

        const signedIn = {
          ...normalizeUser(data.user, normalizedEmail, "admin"),
          role: "admin",
        };

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(signedIn));
        saveStoredRole(normalizedEmail, "admin");
        setUser(signedIn);

        return { ...data, user: signedIn };
      }

      // Customer authentication always uses the real Route API.
      const data = await loginUser({
        email: normalizedEmail,
        password,
      });

      const apiUser = data?.user || data?.data?.user || {};
      const signedIn = normalizeUser(
        apiUser,
        normalizedEmail,
        "customer",
        data.token
      );

      if (signedIn.role !== "customer") {
        throw new Error("This account is not a customer account.");
      }

      if (!data?.token) {
        throw new Error("Login succeeded without receiving an authentication token.");
      }

      localStorage.setItem("token", data.token);

      const finalUser = withResolvedId(
        signedIn,
        await resolveUserId()
      );

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
        const signedUp = normalizeUser(
          apiUser,
          normalized.email,
          "customer",
          data.token
        );

        localStorage.setItem("token", data.token);

        const finalUser = withResolvedId(
          signedUp,
          await resolveUserId()
        );

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

  /* Sessions created before the account id was resolved would keep
     requesting orders as an unknown user, so the stored identity is
     completed once on start-up instead of forcing a re-login. */
  useEffect(() => {
    if (!user || user._id) {
      return;
    }

    let active = true;

    resolveUserId().then((id) => {
      if (!id || !active) {
        return;
      }

      const resolved = { ...user, _id: id };

      localStorage.setItem("user", JSON.stringify(resolved));
      setUser(resolved);
    });

    return () => {
      active = false;
    };
  }, [user]);

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