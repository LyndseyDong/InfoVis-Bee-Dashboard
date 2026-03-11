import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');

  const login = (u, p) => { if (u && p) { setIsLoggedIn(true); return true; } return false; };
  const logout = () => setIsLoggedIn(false);

  return (
    <AppContext.Provider value={{ isLoggedIn, login, logout, selectedYear, setSelectedYear }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
