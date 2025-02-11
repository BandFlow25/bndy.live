//src\components\AddGigForm.tsx
import { useForm } from "react-hook-form";
import { GigFormInput } from "@/lib/types";
import { addGig } from '@/lib/services/firestore';

export function AddGigForm({ onSuccess }: { onSuccess: () => void }) {
 const form = useForm<GigFormInput>({
   defaultValues: {
     bandName: "",
     venueName: "",
     date: "",
     time: "",
     location: { lat: 54.093409, lng: -2.89479 }
   }
 });

 const onSubmit = async (data: GigFormInput) => {
   try {
     await addGig(data);
     onSuccess();
   } catch (error) {
     console.error(error);
   }
 };

 return (
   <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
     {/* Form fields */}
   </form>
 );
}