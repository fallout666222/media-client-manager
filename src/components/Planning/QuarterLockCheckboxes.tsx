
import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from "react-hook-form";

interface QuarterLockCheckboxesProps {
  control: Control<any>;
}

export function QuarterLockCheckboxes({ control }: QuarterLockCheckboxesProps) {
  const quarters = [
    { name: "q1_locked", label: "Lock Q1" },
    { name: "q2_locked", label: "Lock Q2" },
    { name: "q3_locked", label: "Lock Q3" },
    { name: "q4_locked", label: "Lock Q4" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {quarters.map((quarter) => (
        <FormField
          key={quarter.name}
          control={control}
          name={quarter.name as any}
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  id={quarter.name}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel htmlFor={quarter.name}>{quarter.label}</FormLabel>
              </div>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}
