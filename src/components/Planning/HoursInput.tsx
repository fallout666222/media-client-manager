
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface HoursInputProps {
  value: number;
  isQuarterTotal?: boolean;
  isFiscalYearTotal?: boolean;
  isLocked?: boolean;
  onChange?: (value: number) => void;
}

export const HoursInput = ({ 
  value, 
  isQuarterTotal = false, 
  isFiscalYearTotal = false,
  isLocked = false, 
  onChange 
}: HoursInputProps) => {
  const [inputValue, setInputValue] = useState(value === 0 ? '' : value.toString());

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value === 0 ? '' : value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Only allow numbers and decimal points
    if (/^[0-9]*\.?[0-9]*$/.test(newValue) || newValue === '') {
      setInputValue(newValue);
    }
  };

  const handleBlur = () => {
    let numValue = parseFloat(inputValue);
    
    // Handle empty or invalid input
    if (isNaN(numValue)) {
      numValue = 0;
      setInputValue('');
    }
    
    // Only call onChange if this is an editable field
    if (!isQuarterTotal && !isFiscalYearTotal && !isLocked && onChange) {
      onChange(numValue);
    }
  };

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className={`text-center h-8 ${
        isQuarterTotal ? 'bg-blue-50 font-medium' : 
        isFiscalYearTotal ? 'bg-green-50 font-bold' : 
        isLocked ? 'bg-gray-100' : ''
      }`}
      readOnly={isQuarterTotal || isFiscalYearTotal || isLocked}
    />
  );
};
