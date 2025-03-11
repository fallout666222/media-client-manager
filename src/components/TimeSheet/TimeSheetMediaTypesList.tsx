import React, { useMemo } from 'react';

interface TimeSheetMediaTypesListProps {
  mediaTypesWithEntries: string[];
  selectedMediaTypes: string[];
}

export const TimeSheetMediaTypesList = ({
  mediaTypesWithEntries,
  selectedMediaTypes
}: TimeSheetMediaTypesListProps) => {
  
  const effectiveMediaTypes = useMemo(() => {
    // Get unique media types
    const uniqueMediaTypes = [...new Set([...selectedMediaTypes, ...mediaTypesWithEntries])];
    
    // Keep the order of selectedMediaTypes (user's preferred order)
    const orderedMediaTypes = [...selectedMediaTypes];
    
    // Add any media types with entries that aren't already in the ordered list
    mediaTypesWithEntries.forEach(type => {
      if (!orderedMediaTypes.includes(type)) {
        orderedMediaTypes.push(type);
      }
    });
    
    // Filter to only include unique media types that are in our combined set
    return orderedMediaTypes.filter(type => uniqueMediaTypes.includes(type));
  }, [selectedMediaTypes, mediaTypesWithEntries]);

  return {
    effectiveMediaTypes
  };
};
