import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface BackgroundProcess {
  id: string;
  type: 'scraping' | 'entry_generation';
  status: 'running' | 'completed' | 'failed';
  sessionId?: string;
  title: string;
  startedAt: Date;
  completedAt?: Date;
  error?: string;
}

interface BackgroundProcessContextType {
  processes: BackgroundProcess[];
  addProcess: (process: Omit<BackgroundProcess, 'id' | 'startedAt'>) => string;
  updateProcess: (id: string, updates: Partial<BackgroundProcess>) => void;
  removeProcess: (id: string) => void;
  getProcessBySessionId: (sessionId: string) => BackgroundProcess | undefined;
}

const BackgroundProcessContext = createContext<BackgroundProcessContextType | undefined>(undefined);

export const useBackgroundProcess = () => {
  const context = useContext(BackgroundProcessContext);
  if (!context) {
    throw new Error('useBackgroundProcess must be used within a BackgroundProcessProvider');
  }
  return context;
};

const STORAGE_KEY = 'background_processes';

export const BackgroundProcessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [processes, setProcesses] = useState<BackgroundProcess[]>([]);

  // Load processes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const processesWithDates = parsed.map((p: any) => ({
          ...p,
          startedAt: new Date(p.startedAt),
          completedAt: p.completedAt ? new Date(p.completedAt) : undefined,
        }));
        setProcesses(processesWithDates);
      }
    } catch (error) {
      console.error('Error loading background processes:', error);
    }
  }, []);

  // Save processes to localStorage whenever processes change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(processes));
    } catch (error) {
      console.error('Error saving background processes:', error);
    }
  }, [processes]);

  const addProcess = useCallback((processData: Omit<BackgroundProcess, 'id' | 'startedAt'>) => {
    const id = `process_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newProcess: BackgroundProcess = {
      ...processData,
      id,
      startedAt: new Date(),
    };
    
    setProcesses(prev => [...prev, newProcess]);
    return id;
  }, []);

  const updateProcess = useCallback((id: string, updates: Partial<BackgroundProcess>) => {
    setProcesses(prev => 
      prev.map(process => 
        process.id === id 
          ? { ...process, ...updates }
          : process
      )
    );
  }, []);

  const removeProcess = useCallback((id: string) => {
    setProcesses(prev => prev.filter(process => process.id !== id));
  }, []);

  const getProcessBySessionId = useCallback((sessionId: string) => {
    return processes.find(process => process.sessionId === sessionId);
  }, [processes]);

  const value: BackgroundProcessContextType = {
    processes,
    addProcess,
    updateProcess,
    removeProcess,
    getProcessBySessionId,
  };

  return (
    <BackgroundProcessContext.Provider value={value}>
      {children}
    </BackgroundProcessContext.Provider>
  );
};

























