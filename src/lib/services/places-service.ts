// src/lib/services/places-service.ts
export async function searchVenueWithIncreasingRadius(
  venueName: string,
  map: google.maps.Map
): Promise<google.maps.places.PlaceResult[]> {
  const service = new google.maps.places.PlacesService(map);
  
  try {
    const results = await new Promise<google.maps.places.PlaceResult[]>((resolve, reject) => {
      service.textSearch({
        query: venueName,
        type: 'establishment'
      }, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(status);
        }
      });
    });

    return results;
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}