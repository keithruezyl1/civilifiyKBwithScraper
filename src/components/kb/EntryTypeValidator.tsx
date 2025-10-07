import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailableEntryTypes, canSubmitEntryType } from '../../services/authApi';
import { getKbConfig } from '../../lib/kb/parseKbRules';

interface EntryTypeValidatorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
  children: React.ReactNode;
}

export const EntryTypeValidator: React.FC<EntryTypeValidatorProps> = ({
  selectedType,
  onTypeChange,
  children
}) => {
  const { user } = useAuth();
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const kbConfig = getKbConfig();

  useEffect(() => {
    const loadAvailableTypes = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const types = await getAvailableEntryTypes(user.id);
        setAvailableTypes(types);
        
        // If current selection is not available, reset to first available type
        if (selectedType && !types.includes(selectedType)) {
          if (types.length > 0) {
            onTypeChange(types[0]);
          } else {
            setError('No entry types available for today. You have reached your daily quota.');
          }
        }
      } catch (err) {
        console.error('Error loading available entry types:', err);
        setError('Failed to load available entry types');
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableTypes();
  }, [user, selectedType, onTypeChange]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">Loading available entry types...</div>
        {children}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-sm text-red-800">{error}</div>
        </div>
        {children}
      </div>
    );
  }

  if (availableTypes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            You have reached your daily quota for all entry types. 
            Please wait until tomorrow or contact your administrator.
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="text-sm text-green-800">
          Available entry types for today: {availableTypes.length}
        </div>
        <div className="text-xs text-green-600 mt-1">
          {availableTypes.map(type => kbConfig.types[type]?.label || type).join(', ')}
        </div>
      </div>
      {children}
    </div>
  );
};

// Hook to check if a specific entry type is available
export const useEntryTypeValidation = (entryType: string) => {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkAvailability = async () => {
      if (!user || !entryType) {
        setIsAvailable(null);
        return;
      }

      try {
        setIsLoading(true);
        const available = await canSubmitEntryType(user.id, entryType);
        setIsAvailable(available);
      } catch (err) {
        console.error('Error checking entry type availability:', err);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, [user, entryType]);

  return { isAvailable, isLoading };
};
