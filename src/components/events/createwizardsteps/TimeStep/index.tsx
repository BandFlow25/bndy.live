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
    const venue = form.getValues('venue');

    // Use venue's standard times if available
    useEffect(() => {
        if (venue.standardStartTime) {
            form.setValue('startTime', venue.standardStartTime);
        }
        if (venue.standardEndTime) {
            form.setValue('endTime', venue.standardEndTime);
            setShowEndTime(true);
        }
    }, [venue]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                        <FormControl>
                            <TimeSelect
                                {...field}
                                defaultStartIndex={38}
                                placeholder="Add Start Time"
                            />
                        </FormControl>
                    )}
                />

                <div className="flex items-center space-x-2 ml-4">
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
            </div>

            {showEndTime && (
                <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                        <FormControl>
                            <TimeSelect
                                {...field}
                                defaultStartIndex={44}
                                placeholder="Add End Time"
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