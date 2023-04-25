import { useState, useEffect, useCallback, memo } from "react";
import { GoogleMap, Marker, useJsApiLoader, Polyline } from "@react-google-maps/api";
import { Flex, Text } from "@chakra-ui/react";

interface Props {
  markers: { lat: number; lng: number; user: string }[];
  center: google.maps.LatLngLiteral;
  team1_health?: number;
  team2_health?: number;
  team1_distance?: number;
  team2_distance?: number;
  countdown: number;
  round?: number;
  multiplier?: number;
  team?: string;
}

const containerStyle = {
  width: "50vw",
  height: "50vh",
  minWidth: "300px",
  borderRadius: "15px",
  border: "2px solid black"
};

const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  gestureHandling: "greedy",
  minZoom: 2,
};

function FullscreenMap({
  markers,
  center,
  team1_health,
  team2_health,
  team1_distance,
  team2_distance,
  countdown,
  round,
  multiplier,
  team,
}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o",
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (isLoaded && map) {
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i]);
      }
      bounds.extend(center);

      map.fitBounds(bounds);
    }
  }, [map, markers, isLoaded, center]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    map.setZoom(1);

    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  return isLoaded ? (
    <Flex zIndex={1} w={'100vw'} h={'100vh'} maxH={'-webkit-fill-available'} backdropFilter={'blur(2px)'} bgColor={'rgba(0,0,0,0.6)'} justifyContent={'center'} alignItems={'center'} flexDir={'column'} pos={'absolute'} color={'white'} fontSize={'22px'} fontWeight={'bold'}>
      <Text fontSize={'2xl'}>Round {round}</Text>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
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
        <Marker
          key={"location"}
          animation={window.google.maps.Animation.DROP}
          icon={{ url: "/marker2.png" }}
          position={center}
        />
        {markers.map((marker) => (
          <Polyline key={marker.lat} path={[marker, center]} />
        ))}
        <></>
      </GoogleMap>  
      <Flex w={'45vw'} minW={'300px'} justifyContent={'space-between'} marginTop={'3vh'} marginBottom={'5vh'}>
        {team === "team1" ? (          
          <Flex flexDir={'column'} alignItems={'center'} fontSize={'30px'}>
            <Text fontSize={'xl'}>Team 1: {team1_health}</Text>
            {team1_distance && (
              <Text fontSize={'lg'}>
                {team1_distance >= 1000 ? Math.ceil(team1_distance / 1000) + " km" : Math.ceil(team1_distance) + " m"}
              </Text>
            )}
          </Flex>
        ) : (
          <Flex flexDir={'column'} alignItems={'center'} fontSize={'30px'}>
            <Text fontSize={'xl'}>Team 2: {team2_health}</Text>
            {team2_distance && (
              <Text fontSize={'lg'}>
                {team2_distance >= 1000 ? Math.ceil(team2_distance / 1000) + " km" : Math.ceil(team2_distance) + " m"}
              </Text>
            )}
          </Flex>
        )}
        {team === "team1" ? (
          <Flex flexDir={'column'} alignItems={'center'} fontSize={'30px'}>
            <Text fontSize={'xl'}>Team 2: {team2_health}</Text>
            {team2_distance && (
              <Text fontSize={'lg'}>
                {team2_distance >= 1000 ? Math.ceil(team2_distance / 1000) + " km" : Math.ceil(team2_distance) + " m"}
              </Text>
            )}
          </Flex>
        ) : (
          <Flex flexDir={'column'} alignItems={'center'} fontSize={'30px'}>
            <Text fontSize={'xl'}>Team 1: {team1_health}</Text>
            {team1_distance && (
              <Text fontSize={'lg'}>
                {team1_distance >= 1000 ? Math.ceil(team1_distance / 1000) + " km" : Math.ceil(team1_distance) + " m"}
              </Text>
            )}
          </Flex>
        )}
      </Flex>
      <Text fontSize={'xl'}>Damage Multiplier</Text>
      <Text fontSize={'lg'}>{multiplier}x</Text>
      {countdown > 0 && <Text fontSize={'xl'} marginTop={'5vh'}>{`New Round in ${countdown}`}</Text>}
    </Flex>
  ) : (
    <></>
  );
}

export default memo(FullscreenMap);
