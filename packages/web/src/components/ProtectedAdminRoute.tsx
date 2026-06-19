import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
}) => {
  const { isAdmin, isLoading, isAdminLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading || isAdminLoading) {
    return (
      <div className="loading-container">
        <div className="loading">Checking authorization...</div>
      </div>
    );
  }

  // Not logged in or not admin - redirect to login
  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // User is admin - render children
  return <>{children}</>;
};

export default ProtectedAdminRoute;
