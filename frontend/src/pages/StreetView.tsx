import {
  GoogleMap,
  StreetViewPanorama,
  StreetViewService,
  useJsApiLoader,
} from "@react-google-maps/api";
import React, { memo, useCallback, useState } from "react";
import { Socket } from "socket.io-client";

interface Props {
  center: google.maps.LatLngLiteral,
  socket: Socket
}

const containerStyle = {
  width: "100vw",
  height: "100vh",
  zIndex: "1",
};

function MyComponent({ center }: Props) {
  const [location, setLocation] = useState<google.maps.LatLng>();

  const mapOptions = {
    fullscreenControl: false,
    mapTypeControl: false,
    minZoom: 2,
    streetViewControl: false,
    position: location,
    zoomControl: false
  
};

  const StreetViewOptions = {
    fullscreenControl: false,
    addressControl: false,
    disableDefaultUI: true,
    showRoadLabels: false,
    enableCloseButton: false,
    visible: true,
    position: location,
    zoomControl: false,
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    if (center){
      const bounds = new window.google.maps.LatLngBounds(center);
      map.fitBounds(bounds);
    }
    setMap(map);
  }, [center]);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const testOnLoad = () => {
    const panoroma = new window.google.maps.StreetViewService();
    
    panoroma.getPanorama({ location: center }, (data: any) =>
      setLocation(
        new google.maps.LatLng(
          data.location.latLng.lat(),
          data.location.latLng.lng()
        )
      )
    );
  };

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      zoom={2}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={mapOptions}
    >
      <div className="relative w-full h-full">
        <div>
          <StreetViewPanorama options={StreetViewOptions} />
        </div>
        <div className="absolute bottom-0 right-0 z-10">
          <StreetViewService onLoad={testOnLoad} />
        </div>
      </div>
    </GoogleMap>
  ) : (
    <></>
  );
}

export default memo(MyComponent);
