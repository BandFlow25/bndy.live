import React, { useEffect, useState } from 'react';
import { extractFacebookUsername, getFacebookProfilePicUrl, checkImageExists } from '@/lib/utils/profilepic-utils';

interface FacebookImageProps {
  facebookUrl?: string;
  alt: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function FacebookImage({ facebookUrl, alt, className = '', size = 'medium' }: FacebookImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfilePic() {
      if (!facebookUrl) {
        setLoading(false);
        return;
      }

      const username = extractFacebookUsername(facebookUrl);
      if (!username) {
        setLoading(false);
        return;
      }

      const profilePicUrl = getFacebookProfilePicUrl(username);
      const exists = await checkImageExists(profilePicUrl);

      if (exists) {
        setImageUrl(profilePicUrl);
      }
      setLoading(false);
    }

    loadProfilePic();
  }, [facebookUrl]);

  const sizeClasses = {
    small: 'w-10 h-10',
    medium: 'w-20 h-20',
    large: 'w-32 h-32'
  }[size];

  if (loading) {
    return <div className={`${sizeClasses} bg-accent animate-pulse rounded-full ${className}`} />;
  }

  if (!imageUrl) {
    return null;
  }

  return (
    <img 
      src={imageUrl} 
      alt={alt} 
      className={`${sizeClasses} rounded-full border border-primary object-cover ${className}`}
    />
  );
}