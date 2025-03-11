
import React from 'react';
import { format } from 'date-fns';
import { User, Client, TimeSheetStatus } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { TeamMemberSelectorSection } from './TeamMemberSelectorSection';
import { AdminOverrideAlert } from './AdminOverrideAlert';
import { UnsubmittedWeeksAlert } from './UnsubmittedWeeksAlert';
import { useTimeSheet } from './TimeSheetProvider';

interface TimeSheetWrapperProps {
  userRole: 'admin' | 'user' | 'manager';
  firstWeek: string;
  currentUser: User;
  users: User[];
  clients: Client[];
  readOnly?: boolean;
  impersonatedUser?: User;
  adminOverride?: boolean;
  isUserHead?: boolean;
  checkEarlierWeeksUnderReview?: (weekId: string) => boolean;
}

export const TimeSheetWrapper: React.FC<TimeSheetWrapperProps> = ({
  userRole,
  firstWeek,
  currentUser,
  users,
  clients,
  readOnly = false,
  impersonatedUser,
  adminOverride = false,
  isUserHead = false,
  checkEarlierWeeksUnderReview
}) => {
  const {
    showSettings,
    setShowSettings,
    customWeeks,
    viewedUser,
    currentDate,
    setCurrentDate,
    weekHours,
    isViewingOwnTimesheet,
    availableClients,
    availableMediaTypes,
    timeEntries,
    weekPercentage,
    selectedClients,
    selectedMediaTypes,
    handleReturnToFirstUnsubmittedWeek,
    handleNavigateToFirstUnderReviewWeek,
    handleSubmitForReview,
    handleApprove,
    handleReject,
    handleSaveVisibleClients,
    handleSaveVisibleMediaTypes,
    getTotalHoursForWeek,
    currentCustomWeek,
    handleAddClient,
    handleAddMediaType,
    handleRemoveClient,
    handleRemoveMediaType,
    handleSelectClient,
    handleSelectMediaType,
    handleReorderClients,
    handleReorderMediaTypes,
    timeUpdateHandler,
    handleWeekHoursChange,
    getCurrentWeekStatus
  } = useTimeSheet();

  return (
    <div className="space-y-6">
      <TeamMemberSelectorSection 
        currentUser={currentUser}
        users={users}
        userRole={userRole}
        impersonatedUser={impersonatedUser}
      />

      <AdminOverrideAlert adminOverride={adminOverride} />

      <TimeSheetHeader
        userRole={userRole}
        remainingHours={Math.round(weekHours * (weekPercentage / 100)) - getTotalHoursForWeek()}
        status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
        onReturnToFirstUnsubmittedWeek={handleReturnToFirstUnsubmittedWeek}
        onToggleSettings={() => setShowSettings(!showSettings)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekPercentage={weekPercentage}
        weekHours={weekHours}
        hasCustomWeeks={customWeeks.length > 0}
        showSettings={showSettings}
      />

      <UnsubmittedWeeksAlert 
        readOnly={readOnly} 
        adminOverride={adminOverride} 
      />

      <TimeSheetControls
        currentDate={currentDate}
        onWeekChange={(date) => {
          setCurrentDate(date);
        }}
        onWeekHoursChange={handleWeekHoursChange}
        status={getCurrentWeekStatus(format(currentDate, 'yyyy-MM-dd'))}
        isManager={userRole === 'manager' || userRole === 'admin'}
        isViewingOwnTimesheet={isViewingOwnTimesheet}
        onSubmitForReview={handleSubmitForReview}
        onApprove={handleApprove}
        onReject={handleReject}
        readOnly={readOnly || (!isViewingOwnTimesheet && userRole !== 'manager' && userRole !== 'admin' && !adminOverride && !isUserHead)}
        firstWeek={viewedUser.firstWeek || firstWeek}
        weekId={currentCustomWeek?.id}
        weekPercentage={weekPercentage}
        customWeeks={customWeeks}
        adminOverride={adminOverride}
        isUserHead={isUserHead}
        viewedUserId={viewedUser.id}
        hasEarlierWeeksUnderReview={isUserHead && checkEarlierWeeksUnderReview && currentCustomWeek?.id 
          ? checkEarlierWeeksUnderReview(currentCustomWeek.id) 
          : false}
        onNavigateToFirstUnderReview={isUserHead ? handleNavigateToFirstUnderReviewWeek : undefined}
      />

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
        currentUserId={currentUser.id}
        isUserHead={isUserHead}
      />
    </div>
  );
};
