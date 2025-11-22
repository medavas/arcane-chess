import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useSelector(
    (state: any) => state.auth.isAuthenticated
  );
  return isAuthenticated ? children : <Navigate to="/intro" />;
};
