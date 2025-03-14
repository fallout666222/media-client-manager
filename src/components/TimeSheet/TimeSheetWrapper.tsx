
import React, { useEffect } from 'react';
import { format, parse, isBefore } from 'date-fns';
import { User, Client, TimeSheetStatus } from '@/types/timesheet';
import { TimeSheetHeader } from '@/components/TimeSheet/TimeSheetHeader';
import { TimeSheetControls } from '@/components/TimeSheet/TimeSheetControls';
import { TimeSheetContent } from '@/components/TimeSheet/TimeSheetContent';
import { TeamMemberSelectorSection } from './TeamMemberSelectorSection';
import { AdminOverrideAlert } from './AdminOverrideAlert';
import { UnsubmittedWeeksAlert } from './UnsubmittedWeeksAlert';
import { useTimeSheet } from './TimeSheetContext/TimeSheetContext';
import { WeekData, StatusTimeline, WeekDetails } from '@/components/ProgressBar';
import { mapTimeSheetStatusToWeekStatus } from '@/utils/statusMappers';

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
    handleReturnToUnconfirmed,
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
    getCurrentWeekStatus,
    weekStatuses,
    handleProgressBarWeekSelect,
    filterYear,
    setFilterYear
  } = useTimeSheet();

  const progressBarWeeks: WeekData[] = customWeeks
    .filter(week => {
      if (adminOverride || userRole === 'admin') return true;
      
      const userFirstWeek = viewedUser.firstWeek || firstWeek;
      if (!userFirstWeek) return true;
      
      const weekStartDate = parse(week.period_from, 'yyyy-MM-dd', new Date());
      const firstWeekDate = parse(userFirstWeek, 'yyyy-MM-dd', new Date());
      
      return !isBefore(weekStartDate, firstWeekDate);
    })
    .map(week => {
      const timeSheetStatus = getCurrentWeekStatus(week.period_from);
      const weekStatus = mapTimeSheetStatusToWeekStatus(timeSheetStatus);
      
      return {
        week: week.name,
        status: weekStatus,
        weekId: week.id,
        periodFrom: week.period_from
      };
    });

  const selectedProgressWeek = currentCustomWeek ? {
    week: currentCustomWeek.name,
    status: mapTimeSheetStatusToWeekStatus(getCurrentWeekStatus(currentCustomWeek.period_from)),
    weekId: currentCustomWeek.id,
    periodFrom: currentCustomWeek.period_from
  } : null;

  useEffect(() => {
    if (currentCustomWeek) {
      // Temporarily disabled console logs
      // console.log('TimeSheetWrapper - Current custom week updated:', 
      //   currentCustomWeek.name, 
      //   'ID:', currentCustomWeek.id, 
      //   'Period:', currentCustomWeek.period_from);
      
      // if (selectedProgressWeek) {
      //   console.log('TimeSheetWrapper - Selected progress week updated:', 
      //     selectedProgressWeek.week, 
      //     'ID:', selectedProgressWeek.weekId);
      // }
    }
  }, [currentCustomWeek, selectedProgressWeek]);

  const handleProgressWeekSelect = (week: WeekData) => {
    // console.log('Progress bar week selected:', week.week, 'WeekId:', week.weekId);
    if (week.weekId) {
      handleProgressBarWeekSelect(week.weekId);
    }
  };

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

      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Weekly Progress</h3>
        <StatusTimeline 
          weeks={progressBarWeeks} 
          selectedWeek={selectedProgressWeek} 
          onSelectWeek={handleProgressWeekSelect}
          filterYear={filterYear}
        />
        <WeekDetails weekData={selectedProgressWeek} />
      </div>

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
        onReturnToUnconfirmed={handleReturnToUnconfirmed}
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
        filterYear={filterYear}
        setFilterYear={setFilterYear}
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
