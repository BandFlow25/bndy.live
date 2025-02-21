"use client";
import { BndyLogo } from "@/components/ui/bndylogo";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowBigLeft, MapPin, List } from "lucide-react"; // Icons

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isMapView = pathname === "/";
  const isListView = pathname === "/list";
  const isHomeView = isMapView || isListView;

  // Define the correct action
  const handleNavigation = () => {
    if (isHomeView) {
      router.push(isListView ? "/" : "/list"); // Switch between List and Map
    } else {
      router.back(); // Navigate back when not on map or list
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b p-4">
      <div className="flex flex-col items-center max-w-7xl mx-auto relative">
        
        {/* Toggle / Back Button */}
        <div className="absolute left-4 top-4 flex items-center">
          <button
            onClick={handleNavigation}
            className="flex items-center text-muted-foreground hover:text-muted-foreground transition"
            aria-label={isHomeView ? "Switch view" : "Go back"}
          >
            {isHomeView ? (isListView ? <MapPin className="w-5 h-5" /> : <List className="w-5 h-5" />) : (
              <>
                <ArrowBigLeft className="w-5 h-5 mr-2" />
                Back
              </>
            )}
          </button>
        </div>

        {/* Logo (NO CHANGES) */}
        <div className="text-primary">
          <BndyLogo />
        </div>

        {/* Strapline (NO CHANGES) */}
        <p className="text-lg text-muted-foreground text-center mt-2">
          Keeping <span className="text-primary font-extrabold tracking-wider">LIVE</span> music{" "}
          <span className="text-primary font-extrabold tracking-wider">ALIVE</span>
        </p>
      </div>
    </div>
  );
}
