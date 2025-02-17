
// src/components/events/CreateEventWizard.tsx
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { formatEventDate, formatTime, formatEventDateTime } from '@/lib/utils/date-utils';
import { VenueStep } from './steps/VenueStep';
import { ArtistStep } from './steps/ArtistStep';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
    MapPin,
    Users,
    Calendar,
    Clock,
    Info,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DateSelect } from "@/components/ui/date-select";
import { TimeSelect } from "@/components/ui/time-select";
import { PriceInput } from "@/components/ui/price-input";
import { createEvent } from '@/lib/services/event-service';
import { EventFormData } from '@/lib/types';
import { NonBand, Venue } from '@/lib/types';

interface CreateEventWizardProps {
    map: google.maps.Map;
    onSuccess: () => void;
}

type Step = {
    id: 'venue' | 'artists' | 'date' | 'time' | 'details';
    icon: React.ReactNode;
    title: string;
};

const STEPS: Step[] = [
    { id: 'venue', icon: <MapPin className="w-4 h-4" />, title: 'Where?' },
    { id: 'artists', icon: <Users className="w-4 h-4" />, title: 'Who?' },
    { id: 'date', icon: <Calendar className="w-4 h-4" />, title: 'When?' },
    { id: 'time', icon: <Clock className="w-4 h-4" />, title: 'What time?' },
    { id: 'details', icon: <Info className="w-4 h-4" />, title: 'Details' },
];

export function CreateEventWizard({ map, onSuccess }: CreateEventWizardProps) {
    const [currentStep, setCurrentStep] = useState<Step['id']>('venue');
    const [loading, setLoading] = useState(false);
    const [multipleArtists, setMultipleArtists] = useState(false);
    const [showEndTime, setShowEndTime] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<Step['id']>>(new Set());

    const form = useForm<EventFormData>({
        defaultValues: {
            artists: [],
            venue: {} as Venue,
            name: '',
            startTime: '19:00',
        }
    });

    const currentStepIndex = STEPS.findIndex(step => step.id === currentStep);


// Step completion and navigation handlers
const handleStepCompletion = (step: Step['id']) => {
    setCompletedSteps(prev => new Set([...prev, step]));
};

const handleStepClick = (stepId: Step['id']) => {
    // Only allow navigation to completed steps or current step
    if (completedSteps.has(stepId) || stepId === currentStep) {
        setCurrentStep(stepId);
    }
};

// Auto-progress handlers
const handleVenueSelected = (venue: Venue) => {
    form.setValue('venue', venue);
    handleStepCompletion('venue');
    setCurrentStep('artists');
};

const handleArtistSelected = (artist: NonBand) => {
    if (!multipleArtists) {
        form.setValue('artists', [artist]);
        handleStepCompletion('artists');
        setCurrentStep('date');
    }
};

const handleDateSelected = (date: string) => {
    form.setValue('date', date);
    handleStepCompletion('date');
    setCurrentStep('time');
};

const handleTimeSelected = (time: string) => {
    form.setValue('startTime', time);
    if (!showEndTime) {
        handleStepCompletion('time');
        setCurrentStep('details');
    }
};

// Handle back navigation
const handleBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
        setCurrentStep(STEPS[currentIndex - 1].id);
    }
};

const onSubmit = async (data: EventFormData) => {
    setLoading(true);
    try {
        await createEvent(data);
        onSuccess();
    } catch (error) {
        console.error('Error creating event:', error);
    } finally {
        setLoading(false);
    }
};

// Dynamic title based on form state
const title = useMemo(() => {
    const formData = form.getValues();

    switch (currentStep) {
        case 'venue':
            return formData.venue.name ? `Event @ ${formData.venue.name}` : "Where's the event?";
        case 'artists':
            return formData.artists.length > 0
                ? `${formData.artists[0]?.name} @ ${formData.venue.name}`
                : "Who's playing?";
        case 'date':
            return formData.date
                ? `${formData.artists[0]?.name} @ ${formData.venue.name} - ${formatEventDate(new Date(formData.date))}`
                : "When's the event?";
        case 'time':
            return formData.startTime
                ? `${formData.artists[0]?.name} @ ${formData.venue.name} - ${formatEventDate(new Date(formData.date))} @ ${formatTime(formData.startTime)}`
                : "What time?";
        case 'details':
            return "Almost done!";
        default:
            return "Create New Event";
    }
}, [currentStep, form.watch(['venue', 'artists', 'date', 'startTime'])]);

return (
    <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="relative flex items-center justify-between mb-8">
            {STEPS.map((step, index) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = step.id === currentStep;
                const isClickable = isCompleted || isCurrent;

                return (
                    <React.Fragment key={step.id}>
                        <div
                            className={cn(
                                "flex flex-col items-center",
                                isClickable ? "cursor-pointer" : "cursor-default",
                                isCurrent ? "text-primary" : 
                                isCompleted ? "text-primary/70" : "text-muted-foreground"
                            )}
                            onClick={() => handleStepClick(step.id)}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                isCurrent ? "bg-primary text-white" : 
                                isCompleted ? "bg-primary/20 text-primary" : "bg-muted"
                            )}>
                                {step.icon}
                            </div>
                            <span className="text-xs mt-1">{step.title}</span>
                            {isCompleted && !isCurrent && (
                                <span className="text-[10px] text-muted-foreground mt-0.5">Click to edit</span>
                            )}
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className={cn(
                                "flex-1 h-0.5 mx-2",
                                index < currentStepIndex ? "bg-primary" : "bg-muted"
                            )} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>

        <div className="text-lg font-semibold mb-6">{title}</div>

        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {currentStep === 'venue' && (
                    <VenueStep
                        map={map}
                        form={form}
                        onVenueSelect={handleVenueSelected}
                    />
                )}

                {currentStep === 'artists' && (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="multipleArtists"
                                checked={multipleArtists}
                                onCheckedChange={(checked) => setMultipleArtists(checked as boolean)}
                            />
                            <Label htmlFor="multipleArtists">List Multiple Artists?</Label>
                        </div>

                        <ArtistStep
                            form={form}
                            multipleMode={multipleArtists}
                            onArtistSelect={handleArtistSelected}
                            onNext={() => setCurrentStep('date')}
                            onBack={handleBack}
                        />
                    </div>
                )}

                {currentStep === 'date' && (
                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Event Date</FormLabel>
                                <FormControl>
                                    <DateSelect
                                        date={field.value ? new Date(field.value) : undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                handleDateSelected(date.toISOString().split("T")[0]);
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {currentStep === 'time' && (
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="startTime"
                            defaultValue="19:00"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Start Time</FormLabel>
                                    <FormControl>
                                        <TimeSelect
                                            {...field}
                                            onChange={(time) => handleTimeSelected(time)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="showEndTime"
                                checked={showEndTime}
                                onCheckedChange={(checked) => setShowEndTime(checked as boolean)}
                            />
                            <Label htmlFor="showEndTime">Add End Time?</Label>
                        </div>

                        {showEndTime && (
                            <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Time</FormLabel>
                                        <FormControl>
                                            <TimeSelect
                                                {...field}
                                                value={field.value || ''} 
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                )}


                    {currentStep === 'details' && (
                        <div className="space-y-8">
                            {/* Core Event Information */}
                            <div className="bg-accent/5 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-primary">Event Details</h3>

                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Event Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    className="bg-background/50 backdrop-blur-sm border-accent/20 text-lg"
                                                    placeholder={`${form.watch('artists')[0]?.name} @ ${form.watch('venue').name}`}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                Description
                                                <span className="text-xs normal-case font-normal text-muted-foreground/60">(optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    {...field}
                                                    className="bg-background/50 backdrop-blur-sm border-accent/20 min-h-[120px]"
                                                    placeholder="Add any additional details about the event..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Ticket Information */}
                            <div className="bg-accent/5 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-primary">Ticket Information</h3>

                                <FormField
                                    control={form.control}
                                    name="ticketPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                                Ticket Price
                                            </FormLabel>
                                            <FormControl>
                                                <PriceInput {...field} value={field.value || ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ticketUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                Ticket Website
                                                <span className="text-xs normal-case font-normal text-muted-foreground/60">(optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="url"
                                                    {...field}
                                                    className="bg-background/50 backdrop-blur-sm border-accent/20"
                                                    placeholder="https://..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Additional Information */}
                            <div className="bg-accent/5 rounded-lg p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-primary">Additional Information</h3>

                                <FormField
                                    control={form.control}
                                    name="eventUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                                Event Website
                                                <span className="text-xs normal-case font-normal text-muted-foreground/60">(optional)</span>
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="url"
                                                    {...field}
                                                    className="bg-background/50 backdrop-blur-sm border-accent/20"
                                                    placeholder="https://..."
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="flex gap-4 mt-8">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleBack}
                                    className="w-full"
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : 'Create Event'}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </Form>
        </div>
    );
}