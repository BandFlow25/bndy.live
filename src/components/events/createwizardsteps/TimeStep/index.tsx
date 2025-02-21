// src/components/events/steps/TimeStep/index.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { TimeSelect } from '@/components/ui/time-select';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useEffect } from 'react';
import type { EventFormData } from '@/lib/types';

interface TimeStepProps {
    form: UseFormReturn<EventFormData>;
    onComplete: () => void;
}

export function TimeStep({ form, onComplete }: TimeStepProps) {
    const [showEndTime, setShowEndTime] = useState(false);

    const adjustTimes = (startTime: string, endTime: string) => {
        const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
        const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);

        if (startMinutes >= endMinutes) {
            // If start time is after or equal to end time, set end time to 30 mins after
            const newEndMinutes = startMinutes + 30;
            const newEndHours = Math.floor(newEndMinutes / 60) % 24;
            const newEndMins = newEndMinutes % 60;
            const newEndTime = `${String(newEndHours).padStart(2, '0')}:${String(newEndMins).padStart(2, '0')}`;
            form.setValue('endTime', newEndTime);
        }
    };

    return (
        <div className="space-y-4">
            <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                    <FormControl>
                        <TimeSelect
                            {...field}
                            placeholder="Add Start Time"
                            onChange={(time) => {
                                field.onChange(time);
                                if (showEndTime && form.getValues('endTime')) {
                                    adjustTimes(time, form.getValues('endTime'));
                                }
                            }}
                        />
                    </FormControl>
                )}
            />

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="showEndTime"
                    checked={showEndTime}
                    onCheckedChange={(checked) => {
                        setShowEndTime(checked as boolean);
                        if (!checked) {
                            form.setValue('endTime', undefined);
                        }
                    }}
                />
                <Label htmlFor="showEndTime">Add End Time</Label>
            </div>

            {showEndTime && (
                <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormControl>
                            <TimeSelect
                                {...field}
                                placeholder="Add End Time"
                                onChange={(time) => {
                                    field.onChange(time);
                                    if (form.getValues('startTime')) {
                                        adjustTimes(form.getValues('startTime'), time);
                                    }
                                }}
                            />
                        </FormControl>
                    )}
                />
            )}

            <Button
                onClick={onComplete}
                disabled={!form.getValues('startTime')}
                className="w-full mt-6"
            >
                Next
            </Button>
        </div>
    );
}