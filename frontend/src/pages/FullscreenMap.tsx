import React from 'react'
import { GoogleMap, Marker, useJsApiLoader, Polyline } from '@react-google-maps/api';


interface Props {
  markers: google.maps.LatLngLiteral[]
}

const mapOptions = {
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false
  }



function FullscreenMap({markers}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o"
  })

  const [map, setMap] = React.useState<google.maps.Map | null>(null)
  const [distance, setDistance] = React.useState<number>()

  React.useEffect(() => {
    if (isLoaded && map) {
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i])
      }
    
    map.fitBounds(bounds)

    }

    if (markers[0] && markers[1]){
      getDistance(markers[0], markers[1])
    }
    
  }, [map, markers])

  var rad = function (x: number) {
    return x * Math.PI / 180;
  };

  var getDistance = function (p1: google.maps.LatLngLiteral, p2: google.maps.LatLngLiteral) {
    var R = 6378137; // Earth’s mean radius in meter
    var dLat = rad(p2.lat - p1.lat);
    var dLong = rad(p2.lng - p1.lng);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
      Math.sin(dLong / 2) * Math.sin(dLong / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    setDistance(Math.floor(d / 1000))
  };


  const onLoad = React.useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onUnmount = React.useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, [])

  return isLoaded ? (
    <div className={'overlay'}>
      <GoogleMap
        center={markers[1]}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {markers.map((marker) => (
          <Marker key={marker.lat} animation={window.google.maps.Animation.DROP} icon={{url: "marker.png"}} position={{ lat: marker.lat, lng: marker.lng }} />
        ))}
        <Polyline path={markers}/>
        <></>
      </GoogleMap>
      <h3>You are {distance}km Away.</h3>
      <button className='guess-again-button' onClick={() => {window.location.reload()}}>Guess Again</button>
    </div>
  ) : <></>
}

export default React.memo(FullscreenMap)