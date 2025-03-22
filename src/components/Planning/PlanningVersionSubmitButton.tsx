
import React from "react";
import { Button } from "@/components/ui/button";

interface PlanningVersionSubmitButtonProps {
  isSubmitting: boolean;
  isEditing: boolean;
}

export function PlanningVersionSubmitButton({ 
  isSubmitting, 
  isEditing 
}: PlanningVersionSubmitButtonProps) {
  return (
    <Button type="submit" disabled={isSubmitting}>
      {isSubmitting ? "Saving..." : isEditing ? "Update Version" : "Create Version"}
    </Button>
  );
}
