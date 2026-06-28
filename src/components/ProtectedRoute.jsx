import { Navigate } from 'react-router-dom';

/**
 * Wraps any route that requires authentication.
 * If no JWT token is found in localStorage the user is redirected to /login.
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;
