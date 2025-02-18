
// src/components/events/CreateEventWizard.tsx
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { formatEventDate, formatTime, formatEventDateTime } from '@/lib/utils/date-utils';
import { VenueStep } from './steps/VenueStep';
import { ArtistStep } from './steps/ArtistStep';
import { cn } from "@/lib/utils";

import {
    MapPin,
    Users,
    Calendar,
    Clock,
    ChevronDown,
    Info,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { DateSelect } from "@/components/ui/date-select";
import { TimeSelect } from "@/components/ui/time-select";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceInput } from "@/components/ui/price-input";
import { createEvent } from '@/lib/services/event-service';
import { Artist, Venue, EventFormData } from '@/lib/types';

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
    const [showTicketSection, setShowTicketSection] = useState(false);
    const [showEventSection, setShowEventSection] = useState(true);
    const [completedSteps, setCompletedSteps] = useState<Set<Step['id']>>(new Set());

    const form = useForm<EventFormData>({
        defaultValues: {
            artists: [],
            venue: {} as Venue,
            name: '',
            startTime: '19:00',
            eventUrl: '',    // Add this
            ticketUrl: '',   // Add this
            description: '', // Add this too while we're at it
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

    const handleArtistSelected = (artist: Artist) => {
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
            // Create base event data with only necessary venue info
            const eventData = {
                venueId: data.venue.id,
                venueName: data.venue.name,  // We denormalize this for convenience
                location: data.venue.location,  // Needed for map display
                artists: data.artists,
                name: data.name,
                date: data.date,
                startTime: data.startTime,
                endTime: data.endTime || '',
                description: data.description || '',
                ticketPrice: data.ticketPrice || '',
                ticketUrl: data.ticketUrl || '',
                eventUrl: data.eventUrl || ''
            };


            // Only add optional fields if they have values
            if (showEndTime && data.endTime) {
                eventData.endTime = data.endTime;
            }
            if (data.ticketPrice?.trim()) {
                eventData.ticketPrice = data.ticketPrice;
            }
            if (data.ticketUrl?.trim()) {
                eventData.ticketUrl = data.ticketUrl;
            }
            if (data.eventUrl?.trim()) {
                eventData.eventUrl = data.eventUrl;
            }

            console.log('Event data being sent to createEvent:', eventData);

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
                return `${formData.artists[0]?.name} @ ${formData.venue.name} - ${formatEventDate(new Date(formData.date))} @ ${formatTime(formData.startTime)}`
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
                            {/* Event Information - Collapsible */}
                            <div
                                className="border border-white/30 rounded-lg p-6 space-y-4"
                            >
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => setShowEventSection((prev: boolean) => !prev)}
                                >
                                    <h3 className="text-sm font-semibold text-primary">Event Information</h3>
                                    <ChevronDown
                                        className={`h-5 w-5 transition-transform ${showEventSection ? "rotate-180" : ""}`}
                                    />
                                </div>

                                {showEventSection && (
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        className="bg-background/50 backdrop-blur-sm border-accent/20 text-lg"
                                                        value={field.value || `${form.watch('artists')[0]?.name} @ ${form.watch('venue').name}`}
                                                        onChange={(e) => field.onChange(e.target.value)}
                                                    />
                                                </FormControl>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold text-white">
                                                        Description (Optional)
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

                                        <FormField
                                            control={form.control}
                                            name="eventUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold text-white">
                                                        Event Website (Optional)
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
                                )}
                            </div>

                            {/* Ticket Information - Collapsible */}
                            <div className="border border-white/30 rounded-lg p-6 space-y-4">
                                <div
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => setShowTicketSection((prev: boolean) => !prev)}
                                >
                                    <h3 className="text-sm font-semibold text-primary">Ticket Information</h3>
                                    <ChevronDown
                                        className={`h-5 w-5 transition-transform ${showTicketSection ? "rotate-180" : ""}`}
                                    />
                                </div>

                                {showTicketSection && (
                                    <div className="space-y-4">
                                        <div className="flex items-center space-x-4">
                                            <FormField
                                                control={form.control}
                                                name="ticketPrice"
                                                render={({ field }) => (
                                                    <FormItem className="w-full">
                                                        <FormLabel className="text-sm font-semibold text-white">
                                                            Ticket Price
                                                        </FormLabel>
                                                        <FormControl>
                                                            <PriceInput {...field} value={field.value || ''} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="ticketUrl"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold text-white">
                                                        Ticket Website (Optional)
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
                                )}
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