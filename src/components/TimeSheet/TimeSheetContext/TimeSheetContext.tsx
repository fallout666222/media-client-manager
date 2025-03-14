
import React, { createContext, useContext } from 'react';
import { TimeSheetContextType } from './types';

const TimeSheetContext = createContext<TimeSheetContextType | undefined>(undefined);

export const useTimeSheet = () => {
  const context = useContext(TimeSheetContext);
  if (context === undefined) {
    throw new Error('useTimeSheet must be used within a TimeSheetProvider');
  }
  return context;
};

export default TimeSheetContext;
