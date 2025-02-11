//src\components\Header.tsx
import { BndyLogo } from '@/components/ui/bndylogo';

export function Header() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-background/95 backdrop-blur-sm border-b p-4">
      <div className="flex flex-col items-center max-w-7xl mx-auto">
        {/* Logo */}
        <div className="text-primary">
          <BndyLogo />         
        </div>
        {/* Centered Text */}
        <p className="text-lg text-muted-foreground text-center mt-2">
          Keeping <span className="text-primary font-extrabold tracking-wider">LIVE</span> music <span className="text-primary font-extrabold tracking-wider">ALIVE</span>
        </p>
      </div>
    </div>
  );
}
