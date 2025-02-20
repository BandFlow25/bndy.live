"use client";
import { BndyLogo } from "@/components/ui/bndylogo";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowBigLeft } from "lucide-react"; // Import Lucide icon

export function Header() {
  const pathname = usePathname();
  const isMapView = pathname === "/"; // Adjust if needed

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b p-4">
      <div className="flex flex-col items-center max-w-7xl mx-auto relative">
        
        {/* "Return to Map" link (only show if not on the map view) */}
        {!isMapView && (
          <div className="absolute left-4 top-4 flex items-center">
            <Link href="/" className="flex items-center text-primary font-semibold hover:underline">
              <ArrowBigLeft className="w-5 h-5 mr-2" /> {/* Lucide back arrow */}
              back to map
            </Link>
          </div>
        )}

        {/* Logo */}
        <div className="text-primary">
          <BndyLogo />
        </div>

        {/* Centered Text */}
        <p className="text-lg text-muted-foreground text-center mt-2">
          Keeping <span className="text-primary font-extrabold tracking-wider">LIVE</span> music{" "}
          <span className="text-primary font-extrabold tracking-wider">ALIVE</span>
        </p>
      </div>
    </div>
  );
}
