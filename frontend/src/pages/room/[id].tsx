import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { io } from 'socket.io-client'
import FullscreenMap from "../FullscreenMap";
import StreetView from "../StreetView";
import GuessMap from '../GuessMap'
import styles from "@/styles/Home.module.css";

const socket = io('http://localhost:3002')

const Room = () => {
    const router = useRouter();
    //
    const { id } = router.query    

    const [message, setMessage] = useState("Not Connected")

    const [team1, setTeam1] = useState<string[]>()
    const [team2, setTeam2] = useState<string[]>()
    const [started, toggleStarted] = useState<boolean>(false)
    const [center, setCenter] = useState<google.maps.LatLngLiteral>()
    const [markers, setMarkers] = useState([])
    const [user, setUser] = useState<string>()
    const [userInput, setUserInput] = useState<string>("")

    useEffect(() => {
        if (router.query.user && typeof router.query.user === 'string'){
            setUser(router.query.user)
        }
    }, [router.query.user])

    useEffect(() => {
        if (id && user){
            socket.emit('join', {room: id, user: user})
        }

    }, [id, user])

    useEffect(() => {

        socket.on('room_not_found', () => {
            setMessage('Room not Found')
        })

        socket.on('invalid_payload', () => {
            setMessage('An Error Occurred Connecting to Room')
        })

        socket.on('user_already_joined', () => {
            setMessage('Already Joined')
        })

        socket.on('room', (data) => {
            setTeam1(data["team1"])
            setTeam2(data["team2"])
            //setTeam1(JSON.stringify(data["team1"]))
            //setTeam2(JSON.stringify(data["team2"]))
            setMessage("Connected")
        })

        socket.on('new_round', (data) => {
            setCenter(data)
        })

    }, [socket])

    const switchTeams = () => {
        socket.emit('switch_teams', {room: id, user: user})
    }

    const startRoom = () => {
        socket.emit('start', {room: id})
        toggleStarted(true)
    }

    return !started ? (user ? <div>
        {message}
        <button onClick={switchTeams}>switch team</button>
        <h1>Team 1</h1>        
        {team1?.map((user) => (
            <h2>{user}</h2>
        ))}
        <h1>Team 2</h1>        
        {team2?.map((user) => (
            <h2>{user}</h2>
        ))}
        <button onClick={startRoom}>Start</button>
        </div> : 
        <div>
            <h1>Pick Name</h1>
            <input value={userInput} onChange={(e) => {setUserInput(e.target.value)}}/>
            <button onClick={() => {setUser(userInput)}}>Join</button>

        </div>
        )
        : center && <div className="main-wrapper" style={styles}>
            <StreetView center={center} />
            <GuessMap center={center} setParentMarkers={setMarkers} />
            {markers.length > 0 && <FullscreenMap markers={markers} />}
        </div>
}

export default Room;