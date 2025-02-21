// src/components/events/steps/DetailsStep/index.tsx
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormControl } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EventSection } from './EventSection';
import { TicketSection } from './TicketSection';
import { ConflictWarning } from '../DateStep/ConflictWarning';
import type { EventFormData } from '@/lib/types';
import { RecurringSection } from './RecurringSection';

interface DetailsStepProps {
    form: UseFormReturn<EventFormData>;
    loading: boolean;
    onSubmit: (data: EventFormData) => Promise<void>;
}

export function DetailsStep({ form, loading, onSubmit }: DetailsStepProps) {
    const [showEventSection, setShowEventSection] = useState(false);
    const [showTicketSection, setShowTicketSection] = useState(false);
    const conflicts = form.watch('dateConflicts');
    const hasBlockingConflict = conflicts?.some((c: { type: string }) => c.type === 'exact_duplicate');
    const [showRecurringSection, setShowRecurringSection] = useState(false);


    return (
        <div className="space-y-8">
            {/* Show conflicts first if they exist */}
            {conflicts && conflicts.length > 0 && (
                <ConflictWarning conflicts={conflicts} />
            )}

            <EventSection
                form={form}
                isExpanded={showEventSection}
                onToggle={() => setShowEventSection(prev => !prev)}
            />

            <TicketSection
                form={form}
                isExpanded={showTicketSection}
                onToggle={() => setShowTicketSection(prev => !prev)}
            />

            <RecurringSection
                form={form}
                isExpanded={showRecurringSection}
                onToggle={() => setShowRecurringSection(!showRecurringSection)}
            />

            <Button
                type="submit"
                className="w-full"
                disabled={loading || hasBlockingConflict}
                onClick={() => form.handleSubmit(onSubmit)()}
            >
                {loading ? 'Creating...' : 'Create Event'}
            </Button>
        </div>
    );
}