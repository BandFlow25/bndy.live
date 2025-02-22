// src/components/map/GoogleMapsWrapper.tsx
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { ReactNode } from "react";

const render = (status: Status) => {
  if (status === Status.LOADING) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#242a38'
      }}>
        Loading...
      </div>
    );
  }
  //if (status === Status.LOADING) return <div>Loading...</div>;
  if (status === Status.FAILURE) return <div>Error loading map</div>;
  return <div></div>; // Return empty div instead of null for Success case
};

interface GoogleMapsWrapperProps {
  children: ReactNode;
  apiKey: string;
}

export function GoogleMapsWrapper({ children, apiKey }: GoogleMapsWrapperProps) {
  return (
    <Wrapper
      apiKey={apiKey}
      render={render}
      libraries={['places']}
    >
      {children}
    </Wrapper>
  );
}