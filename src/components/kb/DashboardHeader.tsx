import React from 'react';
import { format } from 'date-fns';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { isTagarao } from '../../utils/adminUtils';

type Props = {
  date: Date;
  dayIndex: number;
  onChangeDate: (d: Date) => void;
  onImportPlan: () => void;
  onExportToday?: () => void;
  onClearToday?: () => void;
  onDateSelect?: (d: Date) => void;
  day1Date?: string | null;
};

export function DashboardHeader({ date, dayIndex, onChangeDate, onImportPlan, onExportToday, onClearToday, onDateSelect, day1Date }: Props) {
  const { user } = useAuth();
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    onChangeDate(newDate);
    
    if (onDateSelect) {
      onDateSelect(newDate);
    }
  };

  return (
    <div className="mb-8">
      <div className="mb-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-800 mb-1">Civilify Law Entry</h1>
            <div className="text-base sm:text-lg text-gray-600">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                <span>Day {dayIndex} of 30 • {format(date, 'PPP')}</span>
                {day1Date && (
                  <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                    Day 1: {format(new Date(day1Date), 'MMM d')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <input
          type="date"
          className="border-2 border-blue-500 rounded-xl h-10 px-3 text-sm bg-blue-50 w-full sm:w-auto"
          value={format(date, 'yyyy-MM-dd')}
          onChange={handleDateChange}
          aria-label="Select date"
        />
        {/* Tagarao-only admin buttons */}
        {isTagarao(user) && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button type="button" variant="outline" onClick={onImportPlan} className="w-full sm:w-auto">Import Plan</Button>
            {onClearToday && <Button type="button" variant="destructive" onClick={onClearToday} className="w-full sm:w-auto">Clear Today</Button>}
          </div>
        )}
      </div>
    </div>
  );
}


