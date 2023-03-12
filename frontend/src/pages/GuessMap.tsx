import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Socket } from 'socket.io-client';

interface Props {
  setParentMarkers: any,
  socket: Socket,
  user: string | undefined,
  room: string | string[] | undefined
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
  zIndex: '5',
  borderRadius: '5px'
}

function GuessMap({ setParentMarkers, socket, user, room }: Props) {
  const [markers, setMarkers] = useState<google.maps.LatLngLiteral[]>([]);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral | undefined>({lat: 0, lng: 0})
  
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const mapRef = useRef(null)

  useEffect(() => {
    socket.on("guess", (data) => {
      setMarkers((prevMarkers) => {
        if (data.team.includes(user)){
          return prevMarkers.concat(data.guess)
        }
        return prevMarkers
      })

      setParentMarkers((prevMarkers: any) => {
        return prevMarkers.concat(data.guess)
      })      
    })
  }, [setParentMarkers, socket])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyAa8AwVw9QKRS5AyGTih-iqcXgJ0ImcJ7o"
  })

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    map.setZoom(1)

    setMap(map)

  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, [])

  const onMapClick = (e: any) => {
    socket.emit('guess', {user: user, room: room, guess: {lat: e.latLng.lat(), lng: e.latLng.lng()}})
  }

  return isLoaded ? (
    <div className='guess-map-wrapper'>
      <GoogleMap
        mapContainerStyle={mapStyles}
        center={mapCenter}
        zoom={2}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
        options={mapOptions}
        ref={mapRef}
        mapContainerClassName={'guess-map'}
      >
        {markers.map((marker) => (
          <Marker key={marker.lat} animation={window.google.maps.Animation.DROP} icon={{url: "/marker.png"}} position={{ lat: marker.lat, lng: marker.lng }} />
        ))}
      </GoogleMap>
      <button>{(markers.length === 0) ? 'Place your pin to guess' : 'Guess'}</button>
    </div>
  ) : <></>
}

export default GuessMap