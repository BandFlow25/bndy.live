// src\components\events\NewEventWizard.tsx
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from "@/components/ui/use-toast";
import { Form } from "@/components/ui/form";
import { MapPin, Users, Calendar, Clock, Info } from 'lucide-react';
import { VenueStep } from './createwizardsteps/VenueStep';
import { formatEventDate, formatTime } from '@/lib/utils/date-utils';
import { ArtistStep } from './createwizardsteps/OLDArtistStep';
import { DateStep } from './createwizardsteps/DateStep';
import { TimeStep } from './createwizardsteps/TimeStep';
import { DetailsStep } from './createwizardsteps/DetailsStep';
import { createEvent } from '@/lib/services/event-service';
import { createVenue } from '@/lib/services/venue-service';
import type { Artist, Venue, EventFormData } from '@/lib/types';
import { cn } from "@/lib/utils";

interface CreateEventWizardProps {
    map: google.maps.Map;
    onSuccess: () => void;
}

type StepId = 'venue' | 'artists' | 'date' | 'time' | 'details';

const STEPS = [
    { id: 'venue' as StepId, icon: <MapPin className="w-4 h-4" />, title: 'Where?' },
    { id: 'artists' as StepId, icon: <Users className="w-4 h-4" />, title: 'Who?' },
    { id: 'date' as StepId, icon: <Calendar className="w-4 h-4" />, title: 'When?' },
    { id: 'time' as StepId, icon: <Clock className="w-4 h-4" />, title: 'What time?' },
    { id: 'details' as StepId, icon: <Info className="w-4 h-4" />, title: 'Details' }
] as const;

export function CreateEventWizard({ map, onSuccess }: CreateEventWizardProps) {
    const [currentStep, setCurrentStep] = useState<StepId>('venue');
    const [loading, setLoading] = useState(false);
    const [completedSteps, setCompletedSteps] = useState<Set<StepId>>(new Set());
    const { toast } = useToast();
    const [multipleArtists, setMultipleArtists] = useState(false);

    const form = useForm<EventFormData>({
        defaultValues: {
            artists: [],
            venue: {} as Venue,
            name: '',
            eventUrl: '',
            ticketUrl: '',
            description: ''
        }
    });

    const handleStepComplete = (stepId: StepId) => {
        setCompletedSteps(prev => new Set([...prev, stepId]));
    };

    const handleStepChange = (stepId: StepId) => {
        if (completedSteps.has(stepId) ||
            STEPS.findIndex(s => s.id === stepId) ===
            STEPS.findIndex(s => s.id === currentStep) + 1) {
            setCurrentStep(stepId);
        }
    };

    const handleSubmit = async (data: EventFormData) => {
        setLoading(true);
        try {
            // First create venue if it's a new one
            let venueId = data.venue.id;
            if (!venueId) {
                const newVenue = await createVenue({
                    name: data.venue.name,
                    address: data.venue.address || '',
                    location: data.venue.location,
                    googlePlaceId: data.venue.googlePlaceId,
                });
                venueId = newVenue.id;
                data.venue = newVenue; // Update the form data with the new venue
            }
    
            // Now create the event with the correct venue ID
            const eventData = {
                ...data,
                venueId,
                location: data.venue.location,
                status: 'pending',
                source: 'bndy.live' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
    
            await createEvent(eventData);
            
            toast({
                title: "Event Created!",
                description: "Your event has been successfully added to the calendar.",
            });
    
            if (map && data.venue.location) {
                setTimeout(() => {
                    map.panTo(data.venue.location);
                    map.setZoom(15);
                }, 300);
            }
    
            onSuccess();
        } catch (error) {
            console.error('Error creating event:', error);
            toast({
                title: "Error",
                description: "There was a problem creating your event. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const title = useMemo(() => {
        const formData = form.getValues();

        switch (currentStep) {
            case 'venue':
                return formData.venue.name ?
                    `Event @ ${formData.venue.name}` :
                    "Where's the event?";
            case 'artists':
                return formData.artists.length > 0 ?
                    `${formData.artists[0]?.name} @ ${formData.venue.name}` :
                    "Who's playing?";
            case 'date':
                return formData.date ?
                    `${formData.artists[0]?.name} @ ${formData.venue.name} - ${formatEventDate(new Date(formData.date))}` :
                    "When's the event?";
            case 'time':
                return formData.startTime ?
                    `${formData.artists[0]?.name} @ ${formData.venue.name} - ${formatEventDate(new Date(formData.date))} @ ${formatTime(formData.startTime)}` :
                    "What time?";
            case 'details':
                return `${formData.artists[0]?.name} @ ${formData.venue.name} - ${formatEventDate(new Date(formData.date))} @ ${formatTime(formData.startTime)}`;
            default:
                return "Create New Event";
        }
    }, [currentStep, form]);

    return (
        <div className="space-y-6">
            {/* Step Indicator */}
            <div className="relative flex items-center justify-between mb-8">
                {STEPS.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <div
                            className={cn(
                                "flex flex-col items-center",
                                completedSteps.has(step.id) ? "cursor-pointer" : "cursor-default",
                                currentStep === step.id ? "text-primary" :
                                    completedSteps.has(step.id) ? "text-primary/70" : "text-muted-foreground"
                            )}
                            onClick={() => handleStepChange(step.id)}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                currentStep === step.id ? "bg-primary text-white" :
                                    completedSteps.has(step.id) ? "bg-primary/20 text-primary" : "bg-muted"
                            )}>
                                {step.icon}
                            </div>
                            <span className="text-xs mt-1">{step.title}</span>
                        </div>
                        {index < STEPS.length - 1 && (
                            <div className={cn(
                                "flex-1 h-0.5 mx-2",
                                index < STEPS.findIndex(s => s.id === currentStep) ? "bg-primary" : "bg-muted"
                            )} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <div className="text-lg font-semibold mb-6">{title}</div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

                    {currentStep === 'venue' && (
                        <VenueStep
                            form={form}
                            map={map}
                            onVenueSelect={(venue: Venue) => {
                                form.setValue('venue', venue);
                                // If it's a verified venue with standard times, populate those
                                if (venue.id && venue.standardStartTime) {
                                    form.setValue('startTime', venue.standardStartTime);
                                }
                                if (venue.id && venue.standardEndTime) {
                                    form.setValue('endTime', venue.standardEndTime);
                                }
                                if (venue.id && venue.standardTicketPrice) {
                                    form.setValue('ticketPrice', venue.standardTicketPrice);
                                }
                                handleStepComplete('venue');
                                handleStepChange('artists');
                            }}
                        />
                    )}

                    {currentStep === 'artists' && (
                        <ArtistStep
                            form={form}
                            multipleMode={multipleArtists}
                            onArtistSelect={(artist) => {
                                if (!multipleArtists) {
                                    handleStepComplete('artists');
                                    handleStepChange('date');
                                }
                            }}
                            onNext={() => {
                                handleStepComplete('artists');
                                handleStepChange('date');
                            }}
                            onBack={() => handleStepChange('venue')}
                        />
                    )}

                    {currentStep === 'date' && (
                        <DateStep
                            form={form}
                            onComplete={() => {
                                handleStepComplete('date');
                                handleStepChange('time');
                            }}
                        />
                    )}

                    {currentStep === 'time' && (
                        <TimeStep
                            form={form}
                            onComplete={() => {
                                handleStepComplete('time');
                                handleStepChange('details');
                            }}
                        />
                    )}

                    {currentStep === 'details' && (
                        <DetailsStep
                            form={form}
                            loading={loading}
                            onSubmit={handleSubmit}
                        />
                    )}


                </form>
            </Form>
        </div>
    );
}