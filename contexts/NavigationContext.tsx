'use client';

import React, { createContext, useContext, useState } from 'react';

interface NavigationContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <NavigationContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
