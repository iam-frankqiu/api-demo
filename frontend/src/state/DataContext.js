import React, { createContext, useCallback, useContext, useState } from 'react';

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);

  // fetchItems now accepts params: { page, pageSize, q }, and an optional AbortSignal
  const fetchItems = useCallback(async ({ page = 1, pageSize = 20, q = '' } = {}, signal) => {
    try {
      const params = new URLSearchParams({
        limit: pageSize,
        offset: (page - 1) * pageSize,
        ...(q ? { q } : {})
      });
      const res = await fetch(`http://localhost:3001/api/items?${params.toString()}`, { signal });
      const json = await res.json();
      setItems(json.items);
      setTotal(json.total);
    } catch (err) {
      if (err.name === 'AbortError') {
        // fetch aborted, do nothing
      } else {
        throw err;
      }
    }
  }, []);

  return (
    <DataContext.Provider value={{ items, total, fetchItems }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);