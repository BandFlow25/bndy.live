// src/app/admin/page.tsx
'use client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VenuesTable } from "@/components/admin/VenuesTable";
import { ArtistsTable } from "@/components/admin/ArtistsTable";
import { EventsTable } from "@/components/admin/EventsTable";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6 pt-[72px]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Database Management</h1>
        <Link href="/admin/import">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Events
          </Button>
        </Link>
      </div>
      
      <Tabs defaultValue="venues">
        <TabsList>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="venues">
          <VenuesTable />
        </TabsContent>
        
        <TabsContent value="artists">
          <ArtistsTable />
        </TabsContent>
        
        <TabsContent value="events">
          <EventsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}