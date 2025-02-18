export function extractFacebookUsername(facebookUrl: string | undefined): string | null {
    if (!facebookUrl) return null;
    
    try {
      // Check if it's a profile with numeric ID format
      const idMatch = facebookUrl.match(/profile\.php\?id=(\d+)/);
      if (idMatch) return idMatch[1];
  
      // Otherwise, extract standard username format
      const usernameMatch = facebookUrl.match(/facebook\.com\/([^/?]+)/);
      return usernameMatch ? usernameMatch[1] : null;
    } catch {
      return null;
    }
  }
  
  export function getFacebookProfilePicUrl(username: string): string {
    return `https://graph.facebook.com/${username}/picture?type=large`;
  }
  
  // Helper to check if image exists (returns a promise)
  export function checkImageExists(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  }