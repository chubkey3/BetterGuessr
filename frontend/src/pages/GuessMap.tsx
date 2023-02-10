import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import React, { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  center: google.maps.LatLngLiteral,
  setParentMarkers: any
}
 
const mapOptions = {
  fullscreenControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  minZoom: 1
}

const mapStyles = {
  width: '25vw',
  height: '25vw',
  zIndex: '5'
}

function MyComponent({ center, setParentMarkers }: Props) {
  const [markers, setMarkers] = useState<google.maps.LatLngLiteral[]>([]);
  const mapRef = useRef(null)

  useEffect(() => {
    if (markers[0]){
      setParentMarkers(markers)
    }
 
  }, [markers])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o"
  })

  const [map, setMap] = useState<google.maps.Map | null>(null)

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    map.setZoom(1)

    setMap(map)

  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, [])

  const onMapClick = (e: any) => {
    setMarkers((current) => [{ lat: e.latLng.lat(), lng: e.latLng.lng() }, center])
  }

  return isLoaded ? (
    <div className='guess-map-wrapper'>
      <GoogleMap
        mapContainerStyle={mapStyles}
        center={{lat: 0, lng: 0}}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={mapOptions}
        ref={mapRef}
        
      >
      </GoogleMap>
      <button>{(markers.length === 0) ? 'Place your pin to guess' : 'Guess'}</button>
    </div>
  ) : <></>
}

export default MyComponent