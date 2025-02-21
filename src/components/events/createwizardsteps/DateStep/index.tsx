import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { DateSelect } from "@/components/ui/date-select";
import { checkEventConflicts } from '@/lib/services/event-service';
import { ConflictWarning } from './ConflictWarning';
import type { EventFormData, DateConflict } from '@/lib/types';

interface DateStepProps {
    form: UseFormReturn<EventFormData>;
    onComplete: () => void;
}

export function DateStep({ form, onComplete }: DateStepProps) {
    const [conflicts, setConflicts] = useState<DateConflict[]>([]);
    const [isNextDisabled, setIsNextDisabled] = useState(false);
    const [dateSelected, setDateSelected] = useState(false);

    const handleDateSelect = async (date: Date | undefined) => {
        if (!date) {
            console.warn("⚠️ No date selected, hiding Next button.");
            setDateSelected(false);
            return;
        }

        const dateStr = date.toISOString().split("T")[0];
        console.log("📅 Date selected:", dateStr);
        setDateSelected(true);

        try {
            console.log("🔍 Running checkEventConflicts...");
            const { conflicts: newConflicts, fullMatchConflict } = await checkEventConflicts({
                venue: form.getValues('venue'),
                artists: form.getValues('artists'),
                date: dateStr,
            });

            console.log("✅ Conflict Check Result:", newConflicts);
            console.log("🚨 Conflict Types Found:", newConflicts.map(c => c.type));
            setConflicts(newConflicts);
            setIsNextDisabled(fullMatchConflict); // Block Next only for exact duplicates

            form.setValue('date', dateStr);
            form.setValue('dateConflicts', newConflicts);

            // Auto-progress ONLY IF no blocking conflicts
            if (!fullMatchConflict && newConflicts.length === 0) {
                onComplete();
            }
        } catch (error) {
            console.error("❌ Error running conflict check:", error);
        }
    };

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="w-full">
                        <FormLabel>Select Date</FormLabel>
                        <FormControl>
                            <DateSelect
                                date={field.value ? new Date(field.value) : undefined}
                                onSelect={handleDateSelect}
                                className="w-full"
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            {conflicts.length > 0 && (
                <div className="mt-4">
                    <ConflictWarning conflicts={conflicts} />
                </div>
            )}

            {dateSelected && (
                <button
                    type="button"
                    disabled={isNextDisabled}
                    className={`w-full mt-4 px-4 py-2 text-white font-semibold rounded-md bg-orange-500 hover:bg-orange-600 ${
                        isNextDisabled ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    onClick={onComplete}
                >
                    Next
                </button>
            )}
        </div>
    );
}