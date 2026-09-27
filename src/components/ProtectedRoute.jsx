import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRole } from "../utils/roles";

export default function ProtectedRoute({ roles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const role = getRole(user);

  if (roles?.length && !roles.includes(role)) {
    return <Navigate to={role === "admin" ? "/admin" : role === "seller" ? "/dashboard" : "/"} replace />;
  }

  return <Outlet />;
}
