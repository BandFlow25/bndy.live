// src/app/admin/import/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExcelEventImporter } from "@/components/admin/ExcelEventImporter";
import { WebScraperImporter } from "@/components/admin/WebScraperImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Script from 'next/script';

export default function ImportPage() {
  return (
    <>
      {/* We still need Places API loaded, but just for venue search */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
      />
      
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin" 
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold">Event Import Tools</h1>
          </div>
        </div>

        <Tabs defaultValue="excel" className="space-y-4">
          <TabsList>
            <TabsTrigger value="excel">Excel Import</TabsTrigger>
            <TabsTrigger value="web">Web Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="excel" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Excel Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Import events from Excel spreadsheets. The importer will try to detect 
                  dates, venues, and artists automatically. All venues will be validated 
                  against Google Places.
                </p>
                <ExcelEventImporter />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="web" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Web Import</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Import events from supported websites. This will scan the page for 
                  event information and validate all venues against Google Places.
                </p>
                <WebScraperImporter />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}