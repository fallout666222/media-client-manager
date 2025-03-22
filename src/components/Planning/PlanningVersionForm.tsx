
import React, { useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PlanningVersionBasicFields } from './PlanningVersionBasicFields';
import { QuarterLockCheckboxes } from './QuarterLockCheckboxes';
import { PlanningVersionSubmitButton } from './PlanningVersionSubmitButton';

const formSchema = z.object({
  name: z.string().min(1, { message: "Version name is required" }),
  year: z.string().min(1, { message: "Year is required" }),
  q1_locked: z.boolean().default(false),
  q2_locked: z.boolean().default(false),
  q3_locked: z.boolean().default(false),
  q4_locked: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

interface PlanningVersionFormProps {
  onSubmit: (values: FormValues) => Promise<void>;
  initialValues?: FormValues;
  availableYears: string[];
  isSubmitting: boolean;
}

export function PlanningVersionForm({
  onSubmit,
  initialValues,
  availableYears,
  isSubmitting
}: PlanningVersionFormProps) {
  const { toast } = useToast();
  
  const defaultValues: FormValues = {
    name: initialValues?.name || "",
    year: initialValues?.year || "",
    q1_locked: initialValues?.q1_locked || false,
    q2_locked: initialValues?.q2_locked || false,
    q3_locked: initialValues?.q3_locked || false,
    q4_locked: initialValues?.q4_locked || false,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  console.log("Form values:", form.getValues());
  console.log("Form state:", form.formState);

  // Reset form when isSubmitting changes from true to false (submission completed)
  useEffect(() => {
    if (!isSubmitting && !initialValues) {
      form.reset(defaultValues);
    }
  }, [isSubmitting, form, initialValues, defaultValues]);

  const handleSubmit = async (values: FormValues) => {
    console.log("Submitting form with values:", values);
    try {
      await onSubmit(values);
      // Form will be reset in the useEffect when isSubmitting changes
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to save the planning version",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <PlanningVersionBasicFields 
          control={form.control} 
          availableYears={availableYears} 
        />
        
        <QuarterLockCheckboxes control={form.control} />

        <PlanningVersionSubmitButton 
          isSubmitting={isSubmitting} 
          isEditing={!!initialValues} 
        />
      </form>
    </Form>
  );
}
