'use client'
// src/app/admin/page.tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VenuesTable } from "@/components/admin/VenuesTable";
import { ArtistsTable } from "@/components/admin/ArtistsTable";
import { DataMigration } from "@/components/admin/DataMigration"; 

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>
      
      <Tabs defaultValue="venues">
        <TabsList>
          <TabsTrigger value="venues">Venues</TabsTrigger>
          <TabsTrigger value="artists">Artists</TabsTrigger>
          <TabsTrigger value="migration">Data Migration</TabsTrigger>
        </TabsList>
        
        <TabsContent value="venues">
          <VenuesTable />
        </TabsContent>
        
        <TabsContent value="artists">
          <ArtistsTable />
        </TabsContent>

        <TabsContent value="migration">
  <DataMigration />
</TabsContent>
      </Tabs>
    </div>
  );
}