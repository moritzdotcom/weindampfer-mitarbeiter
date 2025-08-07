import { useState } from 'react';

export default function useLocation() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  const getLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position);
        setError(null);
      },
      (err) => {
        setError(err);
        setLocation(null);
      }
    );
  };

  return {
    location,
    error,
    getLocation,
  };
}
