
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { requestLocationPermissions, startLocationUpdates, stopLocationUpdates } from './../services/location';

interface AuthContextType {
  isAuthenticated: boolean;
  isLocationActive: boolean;
  login: (locationSharingEnabled: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLocationActive, setIsLocationActive] = useState(false);

  const login = async (locationSharingEnabled: boolean) => {
    setIsAuthenticated(true);
    if (locationSharingEnabled) {
      const hasPermissions = await requestLocationPermissions();
      if (hasPermissions) {
        await startLocationUpdates();
        setIsLocationActive(true);
      }
    }
  };

  const logout = async () => {
    setIsAuthenticated(false);
    if (isLocationActive) {
      await stopLocationUpdates();
      setIsLocationActive(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLocationActive, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
