
import React from "react";
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Control } from "react-hook-form";

interface PlanningVersionBasicFieldsProps {
  control: Control<any>;
  availableYears: string[];
}

export function PlanningVersionBasicFields({ 
  control, 
  availableYears 
}: PlanningVersionBasicFieldsProps) {
  return (
    <>
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="version-name">Version Name</FormLabel>
            <FormControl>
              <Input 
                id="version-name"
                placeholder="e.g. Plan 2024 v1" 
                {...field} 
                value={field.value || ""}
                onChange={(e) => field.onChange(e.target.value)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="year"
        render={({ field }) => (
          <FormItem>
            <FormLabel htmlFor="version-year">Year</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ""}
              defaultValue={field.value || ""}
            >
              <SelectTrigger id="version-year" className="w-full">
                <SelectValue placeholder="Select a year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
