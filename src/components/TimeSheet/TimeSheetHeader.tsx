
import React from 'react';
import { Button } from "@/components/ui/button";
import { RotateCcw, Settings } from "lucide-react";
import { useSettings } from '@/contexts/SettingsContext';

interface TimeSheetHeaderProps {
  userRole: string;
  remainingHours: number;
  status: string;
  onReturnToFirstUnsubmittedWeek: () => void;
  onToggleSettings: () => void;
  onExportToExcel?: () => void;  // Made optional
  firstWeek?: string;
  weekPercentage?: number;
  weekHours?: number;
  hasCustomWeeks?: boolean;
  showSettings?: boolean; // New prop to track if settings are shown
}

export const TimeSheetHeader = ({
  userRole,
  remainingHours,
  status,
  onReturnToFirstUnsubmittedWeek,
  onToggleSettings,
  firstWeek,
  weekPercentage = 100,
  weekHours = 40,
  hasCustomWeeks = true,
  showSettings = false, // Default to false
}: TimeSheetHeaderProps) => {
  // Calculate the effective hours based on percentage
  const effectiveWeekHours = Math.round(weekHours * (weekPercentage / 100));
  const { language } = useSettings();
  
  const translations = {
    en: {
      timesheet: "Timesheet",
      status: "Status",
      loggedInAs: "Logged in as",
      remainingHours: "Remaining Hours This Week",
      of: "of",
      weekPercentage: "Week Percentage",
      goToFirstWeek: "Go to First Unconfirmed/Revision Week",
      unknown: "Unknown",
      weeklyProgress: "Weekly Progress",
      filterByYear: "Filter by year",
      settings: "Settings"
    },
    ru: {
      timesheet: "Табель",
      status: "Статус",
      loggedInAs: "Вы вошли как",
      remainingHours: "Оставшиеся часы на этой неделе",
      of: "из",
      weekPercentage: "Процент недели",
      goToFirstWeek: "Перейти к первой неподтвержденной неделе",
      unknown: "Неизвестно",
      weeklyProgress: "Прогресс по неделям",
      filterByYear: "Фильтровать по году",
      settings: "Настройки"
    }
  };
  
  const t = translations[language];
  
  // Map status to translated version
  const getTranslatedStatus = (status: string) => {
    const statusMap = {
      en: {
        'unconfirmed': 'unconfirmed',
        'under-review': 'under review',
        'needs-revision': 'needs revision',
        'accepted': 'accepted'
      },
      ru: {
        'unconfirmed': 'не подтверждено',
        'under-review': 'на проверке',
        'needs-revision': 'требует доработки',
        'accepted': 'принято'
      }
    };
    
    return statusMap[language][status as keyof typeof statusMap['en']] || status.replace('-', ' ');
  };
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{t.timesheet}</h1>
        <p className="text-sm text-muted-foreground">
          {t.status}: <span className="font-medium capitalize">{getTranslatedStatus(status)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t.loggedInAs}: <span className="font-medium capitalize">{userRole || t.unknown}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {t.remainingHours}: <span className="font-medium">{remainingHours}</span> {t.of} {effectiveWeekHours}
        </p>
        {weekPercentage !== 100 && (
          <p className="text-sm text-muted-foreground">
            {t.weekPercentage}: <span className="font-medium">{weekPercentage}%</span>
          </p>
        )}
      </div>
      <div className="flex gap-2">
        {firstWeek && (
          <Button
            variant="outline"
            onClick={onReturnToFirstUnsubmittedWeek}
            className="flex items-center gap-2"
            disabled={!hasCustomWeeks}
            title={!hasCustomWeeks ? 
              language === 'en' ? "No custom weeks available" : "Нет доступных недель" 
              : language === 'en' ? "Go to the first week that needs your attention (Unconfirmed or Needs Revision)" 
              : "Перейти к первой неделе, требующей вашего внимания (Неподтвержденная или Требует исправления)"}
          >
            <RotateCcw className="h-4 w-4" />
            {t.goToFirstWeek}
          </Button>
        )}
        <Button
          variant={showSettings ? "default" : "outline"}
          onClick={onToggleSettings}
          className="flex items-center gap-2"
          title={language === 'en' ? "Toggle settings panel" : "Переключить панель настроек"}
        >
          <Settings className="h-4 w-4" />
          {t.settings}
        </Button>
      </div>
    </div>
  );
};
