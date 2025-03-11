
import React from 'react';
import { format } from 'date-fns';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { Client } from '@/types/timesheet';
import { useTimeSheet } from './TimeSheetProvider';

interface TimeSheetContentSectionProps {
  userRole: 'admin' | 'user' | 'manager';
  clients: Client[];
  readOnly?: boolean;
  adminOverride?: boolean;
  isUserHead?: boolean;
}

export const TimeSheetContentSection: React.FC<TimeSheetContentSectionProps> = ({
  userRole,
  clients,
  readOnly = false,
  adminOverride = false,
  isUserHead = false,
}) => {
  const {
    showSettings,
    currentDate,
    weekHours,
    isViewingOwnTimesheet,
    availableMediaTypes,
    availableClients,
    timeEntries,
    weekPercentage,
    selectedClients,
    selectedMediaTypes,
    handleTimeUpdate,
    handleAddClient,
    handleAddMediaType,
    handleRemoveClient,
    handleRemoveMediaType,
    handleSaveVisibleClients,
    handleSaveVisibleMediaTypes,
    handleSelectClient,
    handleSelectMediaType,
    handleReorderClients,
    handleReorderMediaTypes,
    timeUpdateHandler,
    currentUser,
    getCurrentWeekStatus
  } = useTimeSheet();

  return (
    <TimeSheetContent
      showSettings={showSettings}
      clients={availableClients}
      mediaTypes={availableMediaTypes}
      timeEntries={timeEntries[format(currentDate, 'yyyy-MM-dd')] || {}}
      status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
      onTimeUpdate={timeUpdateHandler}
      onAddClient={handleAddClient}
      onRemoveClient={handleRemoveClient}
      onAddMediaType={handleAddMediaType}
      onRemoveMediaType={handleRemoveMediaType}
      onSaveVisibleClients={handleSaveVisibleClients}
      onSaveVisibleMediaTypes={handleSaveVisibleMediaTypes}
      readOnly={readOnly || (!isViewingOwnTimesheet && !adminOverride && !isUserHead)}
      weekHours={weekHours}
      weekPercentage={weekPercentage}
      userRole={userRole}
      availableClients={availableClients}
      availableMediaTypes={availableMediaTypes}
      selectedClients={selectedClients}
      selectedMediaTypes={selectedMediaTypes}
      onSelectClient={handleSelectClient}
      onSelectMediaType={handleSelectMediaType}
      isViewingOwnTimesheet={isViewingOwnTimesheet || adminOverride || isUserHead}
      clientObjects={clients}
      adminOverride={adminOverride}
      onReorderClients={handleReorderClients}
      onReorderMediaTypes={handleReorderMediaTypes}
      currentUserId={currentUser?.id}
      isUserHead={isUserHead}
    />
  );
};
