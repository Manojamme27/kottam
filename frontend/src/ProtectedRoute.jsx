import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { userData } = useSelector(state => state.user);
  return userData ? children : <Navigate to="/signin" replace />;
};

export default ProtectedRoute;
