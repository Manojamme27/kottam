import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { userData, authChecked } = useSelector(state => state.user);

  // ⛔ wait until auth finishes
  if (!authChecked) {
    return <div>Loading...</div>;
  }

  // ⛔ not logged in
  if (!userData) {
    return <Navigate to="/signin" replace />;
  }

  // ✅ logged in
  return children;
};

export default ProtectedRoute;
