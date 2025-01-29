import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface WeekTypeSwitchProps {
  isCustomWeek: boolean;
  onToggle: (value: boolean) => void;
}

export const WeekTypeSwitch = ({ isCustomWeek, onToggle }: WeekTypeSwitchProps) => {
  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="week-type"
        checked={isCustomWeek}
        onCheckedChange={onToggle}
      />
      <Label htmlFor="week-type">
        {isCustomWeek ? "Custom Weeks" : "Regular Weeks"}
      </Label>
    </div>
  );
};