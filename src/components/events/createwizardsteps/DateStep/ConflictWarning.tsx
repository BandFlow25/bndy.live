// src/components/events/steps/DateStep/ConflictWarning.tsx

import { AlertTriangle } from 'lucide-react';

interface ConflictWarningProps {
    conflicts: Array<{
        type: 'venue' | 'artist';
        name: string;
        existingEvent: {
            name: string;
            startTime: string;
        };
    }>;
}

export function ConflictWarning({ conflicts }: ConflictWarningProps) {
    return (
        <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-4">
            <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div>
                    <h3 className="font-medium text-yellow-500">
                        {conflicts.length === 1 ? 'Scheduling Conflict Found' : `${conflicts.length} Scheduling Conflicts Found`}
                    </h3>
                    <ul className="mt-2 text-sm text-muted-foreground space-y-1">
                        {conflicts.map((conflict, index) => (
                            <li key={index} className="flex items-start gap-2">
                                <span className="font-medium">
                                    {conflict.type === 'venue' ? 'Venue' : 'Artist'}:
                                </span>
                                <span>
                                    {conflict.name} has event "{conflict.existingEvent.name}" at {conflict.existingEvent.startTime}
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-2 text-sm text-yellow-500">
                        You can still proceed, but please ensure there are no schedule clashes.
                    </p>
                </div>
            </div>
        </div>
    );
}

