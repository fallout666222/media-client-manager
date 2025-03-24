
import React, { useState, useRef, useEffect } from 'react';
import { updatePlanningHours } from '@/integrations/supabase/database';
import { useToast } from '@/hooks/use-toast';
import { User } from '@/types/timesheet';

interface PlanningHoursCellProps {
  userId: string;
  versionId: string;
  clientId: string;
  month: string;
  initialValue: number;
  isLocked?: boolean;
  onUpdate?: (newValue: number) => void;
  monthLimit?: number;
  monthTotal?: number;
}

export function PlanningHoursCell({ 
  userId, 
  versionId, 
  clientId, 
  month, 
  initialValue,
  isLocked = false,
  onUpdate,
  monthLimit,
  monthTotal
}: PlanningHoursCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleClick = () => {
    if (isLocked) return;
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = async () => {
    setIsEditing(false);
    
    if (value === initialValue) return;
    
    try {
      // Check if the new value would exceed the month limit
      if (monthLimit !== undefined && monthTotal !== undefined) {
        const difference = value - initialValue;
        const newMonthTotal = monthTotal + difference;
        
        if (newMonthTotal > monthLimit) {
          toast({
            title: 'Limit Exceeded',
            description: `Cannot add more hours. Monthly limit of ${monthLimit} would be exceeded.`,
            variant: 'destructive'
          });
          setValue(initialValue); // Revert to original value
          return;
        }
      }

      await updatePlanningHours(userId, versionId, clientId, month, value);
      if (onUpdate) onUpdate(value);
      
      toast({
        title: 'Hours Updated',
        description: `Updated ${month} hours for client`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating hours:', error);
      setValue(initialValue); // Revert to original value
      
      toast({
        title: 'Error',
        description: 'Failed to update hours',
        variant: 'destructive'
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min="0"
        className="w-full h-full p-2 border rounded text-center"
        value={value}
        onChange={(e) => setValue(Number(e.target.value) || 0)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <div 
      className={`p-2 text-center w-full ${isLocked ? 'bg-gray-100' : 'cursor-pointer hover:bg-blue-50'}`}
      onClick={handleClick}
    >
      {value > 0 ? value : '-'}
    </div>
  );
}
