import { useState, useEffect, useCallback, memo } from 'react'
import { GoogleMap, Marker, useJsApiLoader, Polyline } from '@react-google-maps/api';


interface Props {
  markers: google.maps.LatLngLiteral[],
  center: google.maps.LatLngLiteral,
  team1_health?: number,
  team2_health?: number,
  team1_distance?: number,
  team2_distance?: number,
  countdown: number
}

const containerStyle = {
  width: '50vw',
  height: '50vh'

};

const mapOptions = {
    fullscreenControl: false,
    mapTypeControl: false,
    streetViewControl: false
  }



function FullscreenMap({markers, center, team1_health, team2_health, team1_distance, team2_distance, countdown}: Props) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o"
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (isLoaded && map) {
      var bounds = new window.google.maps.LatLngBounds();
      for (var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i])
      }
      bounds.extend(center)
    
    map.fitBounds(bounds)

    }
    
  }, [map, markers])

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    map.setZoom(1)

    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, [])

  return isLoaded ? (
    <div className={'overlay'}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {markers.map((marker) => (
          <Marker key={marker.lat} animation={window.google.maps.Animation.DROP} icon={{url: "/marker.png"}} position={{ lat: marker.lat, lng: marker.lng }} />
        ))}
        <Marker key={'location'} animation={window.google.maps.Animation.DROP} icon={{url: "/marker2.png"}} position={center}/>
        {markers.map((marker) => (
          <Polyline path={[marker, center]}/>
        ))}
        <></>
      </GoogleMap>
      <div className='health-display'>
        <div className='health-display-container'>
          {team1_health && <h1>Team 1: {team1_health}</h1>}
          {team1_distance && <h2>{(team1_distance >= 1000) ? Math.ceil(team1_distance/1000) + ' km' : Math.ceil(team1_distance) + ' m'}</h2>}
        </div>
        <div className='health-display-container'>
          {team2_health && <h1>Team 2: {team2_health}</h1>}
          {team2_distance && <h2>{(team2_distance >= 1000) ? Math.ceil(team2_distance/1000) + ' km' : Math.ceil(team2_distance) + ' m'}</h2>}
        </div>
      </div>
      <h1>{`New Round in ${countdown}`}</h1>
    </div>
  ) : <></>
}

export default memo(FullscreenMap)