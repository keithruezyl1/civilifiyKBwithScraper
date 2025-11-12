import React from 'react';
import { useBackgroundProcess } from '../../contexts/BackgroundProcessContext';

interface ProcessStatusProps {
  onScrapingClick: (sessionId?: string) => void;
  onEntryGenerationClick: (sessionId: string) => void;
}

export const ProcessStatus: React.FC<ProcessStatusProps> = ({ 
  onScrapingClick, 
  onEntryGenerationClick 
}) => {
  const { processes } = useBackgroundProcess();

  const runningProcesses = processes.filter((p: any) => p.status === 'running');

  if (runningProcesses.length === 0) {
    return null;
  }

  return (
    <div className="process-status">
      {runningProcesses.map((process: any) => (
        <div key={process.id} className="process-item">
          {process.type === 'scraping' ? (
            <span 
              className="process-link"
              onClick={() => onScrapingClick(process.sessionId)}
            >
              Scraping in process...
            </span>
          ) : (
            <span 
              className="process-link"
              onClick={() => onEntryGenerationClick(process.sessionId || '')}
            >
              Entry Generation in process...
            </span>
          )}
        </div>
      ))}
      {/* Completed processes notifications removed */}
    </div>
  );
};
