import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CustomWeek } from "@/types/timesheet";

interface WeekTypeSwitchProps {
  isCustomWeek: boolean;
  onToggle: (value: boolean) => void;
  customWeeks?: CustomWeek[];
}

export const WeekTypeSwitch = ({ isCustomWeek, onToggle, customWeeks }: WeekTypeSwitchProps) => {
  const handleToggle = (checked: boolean) => {
    if (checked && (!customWeeks || customWeeks.length === 0)) {
      console.log("No custom weeks available");
      return;
    }
    onToggle(checked);
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="week-type"
        checked={isCustomWeek}
        onCheckedChange={handleToggle}
      />
      <Label htmlFor="week-type">
        {isCustomWeek ? "Custom Weeks" : "Regular Weeks"}
      </Label>
    </div>
  );
};