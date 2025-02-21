// src/app/admin/import/page.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExcelEventImporter } from "@/components/admin/ExcelEventImporter";
import { WebScraperImporter } from "@/components/admin/WebScraperImporter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ImportPage() {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Initialize a hidden map for Places API
  useEffect(() => {
    function initializeMap() {
      if (typeof google === "undefined" || !google.maps) {
        console.error("Google Maps API not loaded");
        return;
      }
  
      const mapDiv = document.createElement("div");
      mapDiv.style.display = "none";
      document.body.appendChild(mapDiv);
  
      const newMap = new google.maps.Map(mapDiv, {
        center: { lat: 53.002668, lng: -2.179404 }, // Stoke-on-Trent
        zoom: 12,
      });
  
      setMap(newMap);
  
      return () => {
        document.body.removeChild(mapDiv);
      };
    }
  
    if (window.google && window.google.maps) {
      initializeMap();
    } else {
      window.addEventListener("load", initializeMap);
      return () => window.removeEventListener("load", initializeMap);
    }
  }, []);

  if (!map) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Initializing maps...</div>
      </div>
    );
  }

  return (
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
              <ExcelEventImporter map={map} />
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
              
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

//<WebScraperImporter map={map} />