import { Navigate } from "react-router-dom";
import useAuth from "../state/useAuth";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();

  if (!ready) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
