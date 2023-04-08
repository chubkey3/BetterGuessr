import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

interface Props {
  setParentMarkers: any;
  socket: Socket;
  user: string | undefined;
  room: string | string[] | undefined;
}

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  minZoom: 1,
};

function GuessMap({ setParentMarkers, socket, user, room }: Props) {
  const [tempmarker, setTempmarker] = useState<google.maps.LatLngLiteral>();
  const [markers, setMarkers] = useState<{ lat: number; lng: number; user: string }[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | undefined>({ lat: 0, lng: 0 });
  const [guessed, setGuessed] = useState<boolean>(false);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const mapRef = useRef(null);

  useEffect(() => {
    socket.on("guess", (data) => {
      setMarkers((prevMarkers) => {
        if (data.team.includes(user)) {
          return prevMarkers.concat(data.guess);
        }
        return prevMarkers;
      });

      setParentMarkers((prevMarkers: any) => {
        return prevMarkers.concat(data.guess);
      });
    });
  }, [setParentMarkers, socket]);

  const eventListner = useCallback(
    (event: any) => {
      if (event.code === "Space") {
        placeMarker();
      }
    },
    [tempmarker]
  );

  useEffect(() => {
    window.addEventListener("keyup", eventListner);

    return () => {
      window.removeEventListener("keyup", eventListner);
    };
  }, [eventListner]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o",
  });

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    map.setZoom(1);

    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  const onMapClick = useCallback(
    (e: any) => {
      if (!guessed) {
        // socket.emit("temporary_guess", { user: user, room: room, guess: e.latLng });
        setTempmarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      }
    },
    [guessed]
  );

  const placeMarker = () => {
    if (tempmarker) {
      socket.emit("guess", { user: user, room: room, guess: tempmarker });
      setTempmarker(undefined);
      setGuessed(true);
    }
  };

  return isLoaded ? (
    <div className="guess-map-wrapper">
      <GoogleMap
        center={mapCenter}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={mapOptions}
        ref={mapRef}
        mapContainerClassName={"guess-map"}
      >
        {markers.map((marker) => (
          <Marker
            label={marker.user}
            key={marker.lat}
            animation={window.google.maps.Animation.DROP}
            icon={{ url: "/marker.png", labelOrigin: new google.maps.Point(20, -10) }}
            position={{ lat: marker.lat, lng: marker.lng }}
          />
        ))}
        {tempmarker && (
          <Marker
            label={user}
            key={"temp_marker"}
            icon={{ url: "/marker.png", labelOrigin: new google.maps.Point(20, -10) }}
            position={tempmarker}
          />
        )}
      </GoogleMap>
      <button onClick={placeMarker} className={!tempmarker ? "disabled-button" : "but"}>
        {!tempmarker ? (guessed ? "Guess" : "Place pin to guess") : "Guess"}
      </button>
    </div>
  ) : (
    <></>
  );
}

export default GuessMap;
