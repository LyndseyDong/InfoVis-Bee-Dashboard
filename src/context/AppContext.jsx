import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setApiData } from '../data/dataHelpers';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');
  const [dataLoaded, setDataLoaded]   = useState(false);
  const [refreshKey, setRefreshKey]   = useState(0);

  const loadData = useCallback(async () => {
    try {
      const res  = await fetch('/api/data');
      const data = await res.json();
      setApiData(data);
    } catch {
      // fall back to static JSON already set as default
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData().then(() => setDataLoaded(true));
  }, [loadData]);

  // Re-fetch and force a re-render in any page that reads refreshKey
  const refreshData = useCallback(async () => {
    await loadData();
    setRefreshKey(k => k + 1);
  }, [loadData]);

  const login  = (u, p) => { if (u && p) { setIsLoggedIn(true); return true; } return false; };
  const logout = () => setIsLoggedIn(false);

  return (
    <AppContext.Provider value={{ isLoggedIn, login, logout, selectedYear, setSelectedYear, dataLoaded, refreshData, refreshKey }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
