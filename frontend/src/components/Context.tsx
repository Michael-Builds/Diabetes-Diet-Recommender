import React, { createContext, ReactNode, useContext, useMemo } from 'react';
import { LayoutContextType } from '../interfaces';

const LayoutContext = createContext<any | undefined>(undefined);

export const LayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

    const memoValue = useMemo<any>(() => ({
        name: "hello"
    }), []);

    return (
        <LayoutContext.Provider value={memoValue}>
            {children}
        </LayoutContext.Provider>
    );
};

export const useLayout = (): LayoutContextType => {
    const context = useContext(LayoutContext);
    if (!context) {
        throw new Error('useLayout must be used within a LayoutProvider');
    }
    return context;
};