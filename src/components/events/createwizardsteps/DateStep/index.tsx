// src/components/events/steps/DateStep/index.tsx
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { DateSelect } from "@/components/ui/date-select";
import { checkEventConflicts } from '@/lib/services/event-service';
import { ConflictWarning } from './ConflictWarning';
import type { EventFormData } from '@/lib/types';
import { AlertTriangle } from 'lucide-react';

interface DateStepProps {
    form: UseFormReturn<EventFormData>;
    onComplete: () => void;
}

interface DateConflict {
    type: 'venue' | 'artist';
    name: string;
    existingEvent: {
        name: string;
        startTime: string;
    };
}

export function DateStep({ form, onComplete }: DateStepProps) {
    const [conflicts, setConflicts] = useState<DateConflict[]>([]);

    const handleDateSelect = async (date: Date | undefined) => {
        if (!date) return;

        const dateStr = date.toISOString().split("T")[0];
        
        // Check for conflicts
        const newConflicts = await checkEventConflicts({
            venue: form.getValues('venue'),
            artists: form.getValues('artists'),
            date: dateStr,
            startTime: "00:00"
        });

        setConflicts(newConflicts);
        form.setValue('date', dateStr);
        form.setValue('dateConflicts', newConflicts);
        onComplete();
    };

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Select Date</FormLabel>
                        <FormControl>
                            <DateSelect
                                date={field.value ? new Date(field.value) : undefined}
                                onSelect={handleDateSelect}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            {conflicts.length > 0 && <ConflictWarning conflicts={conflicts} />}
        </div>
    );
}