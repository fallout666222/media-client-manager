
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

interface HoursInputProps {
  value: number;
  isQuarterTotal?: boolean;
  isFiscalYearTotal?: boolean;
  onChange?: (value: number) => void;
}

export const HoursInput = ({ 
  value, 
  isQuarterTotal = false, 
  isFiscalYearTotal = false, 
  onChange 
}: HoursInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
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
      setInputValue('0');
    }
    
    // Only call onChange if this is an editable field
    if (!isQuarterTotal && !isFiscalYearTotal && onChange) {
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
        isFiscalYearTotal ? 'bg-green-50 font-bold' : ''
      }`}
      readOnly={isQuarterTotal || isFiscalYearTotal}
    />
  );
};
