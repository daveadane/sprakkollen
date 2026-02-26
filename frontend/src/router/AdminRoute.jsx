import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../state/useAuth";

export default function AdminRoute() {
  const { user, ready } = useAuth();
  if (!ready) return null;

  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_admin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}