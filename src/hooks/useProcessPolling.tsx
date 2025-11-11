import { useEffect, useCallback } from 'react';
import { useBackgroundProcess } from '../contexts/BackgroundProcessContext';
import { useToast } from '../contexts/ToastContext';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

export const useProcessPolling = () => {
  const { processes, updateProcess, removeProcess } = useBackgroundProcess();
  const { addToast } = useToast();

  const checkProcessStatus = useCallback(async (process: any) => {
    try {
      let endpoint = '';

      if (process.type === 'scraping') {
        endpoint = `/api/scraping/session/${process.sessionId}/status`;
      } else if (process.type === 'entry_generation') {
        endpoint = `/api/scraping/session/${process.sessionId}/status`;
      }

      if (!endpoint) return;

      const response = await fetch(`${API_BASE}${endpoint}`);
      if (!response.ok) {
        console.log(`Failed to fetch status for ${process.sessionId}: ${response.status}`);
        return;
      }

      const data = await response.json();
      console.log(`Status check for ${process.sessionId}:`, data);
      
      // The API returns { success: true, status: { status: 'completed', ... } }
      if (data.success && data.status) {
        const sessionStatus = data.status.status;
        console.log(`Session ${process.sessionId} status: ${sessionStatus}`);
        
        if (sessionStatus === 'completed') {
          updateProcess(process.id, {
            status: 'completed',
            completedAt: new Date(),
          });

          // Show completion toast
          console.log(`Creating completion toast for ${process.type} process`);
          if (process.type === 'scraping') {
            addToast({
              type: 'success',
              title: 'Scraping Session is finished',
              persistent: true,
            });
          } else if (process.type === 'entry_generation') {
            addToast({
              type: 'success',
              title: 'Entry Generation is finished',
              persistent: true,
            });
          }
        } else if (sessionStatus === 'failed') {
          updateProcess(process.id, {
            status: 'failed',
            completedAt: new Date(),
            error: data.status.error || 'Process failed',
          });

          addToast({
            type: 'error',
            title: `${process.type === 'scraping' ? 'Scraping' : 'Entry Generation'} failed`,
            message: data.status.error || 'An error occurred during the process',
            persistent: true,
          });
        }
      }
    } catch (error) {
      console.error('Error checking process status:', error);
    }
  }, [updateProcess, addToast]);

  useEffect(() => {
    const runningProcesses = processes.filter((p: any) => p.status === 'running');
    
    if (runningProcesses.length === 0) return;

    const interval = setInterval(() => {
      runningProcesses.forEach((process: any) => {
        checkProcessStatus(process);
      });
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [processes, checkProcessStatus]);

  // Clean up completed processes after 1 hour
  useEffect(() => {
    const completedProcesses = processes.filter(
      (p: any) => p.status === 'completed' && 
      p.completedAt && 
      Date.now() - p.completedAt.getTime() > 3600000 // 1 hour
    );

    completedProcesses.forEach((process: any) => {
      removeProcess(process.id);
    });
  }, [processes, removeProcess]);
};
