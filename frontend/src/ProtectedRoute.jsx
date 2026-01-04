import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const { userData, authChecked } = useSelector(state => state.user);

  if (!authChecked) {
    return <div>Loading...</div>;
  }

  if (!userData) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

export default ProtectedRoute;
