'use client';

import { useEffect } from 'react';

export function ViewportFix() {
  useEffect(() => {
    const fixViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    fixViewportHeight();
    window.addEventListener('resize', fixViewportHeight);
    window.addEventListener('orientationchange', fixViewportHeight);
    
    return () => {
      window.removeEventListener('resize', fixViewportHeight);
      window.removeEventListener('orientationchange', fixViewportHeight);
    };
  }, []);

  return null;
}