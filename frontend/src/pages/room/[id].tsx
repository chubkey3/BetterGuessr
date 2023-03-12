import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { io } from 'socket.io-client'
import FullscreenMap from "../FullscreenMap";
import StreetView from "../StreetView";
import GuessMap from '../GuessMap'
import styles from "@/styles/Home.module.css";
import Head from "next/head";

const socket = io('http://localhost:3002')

const Room = () => {
    const router = useRouter();
    //
    const { id } = router.query    

    const [message, setMessage] = useState("Not Connected")

    //game variables
    const [team1, setTeam1] = useState<string[]>()
    const [team2, setTeam2] = useState<string[]>()
    const [health, setHealth] = useState<{team1: number, team2: number}>()
    const [win, setWin] = useState<string>()
    const [team1distance, setTeam1Distance] = useState<number>()
    const [team2distance, setTeam2Distance] = useState<number>()

    const [countdown, setCountdown] = useState<number>(0)
    const [roundCountdown, setRoundCountdown] = useState<number>(0)

    const [started, toggleStarted] = useState<boolean>(false)
    const [center, setCenter] = useState<google.maps.LatLngLiteral>()
    const [markers, setMarkers] = useState([])
    const [user, setUser] = useState<string>()
    const [userInput, setUserInput] = useState<string>("")
    const [roundEnd, setRoundEnd] = useState<boolean>(false)

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
        console.log(user)
    }, [user])

    useEffect(() => {

        if (user){

            socket.on('room_not_found', () => {
                setMessage('Room not Found')
            })

            socket.on('invalid_payload', () => {
                setMessage('An Error Occurred Connecting to Room')
            })

            socket.on('user_already_joined', () => {
                setMessage('Already Joined')
            })

            socket.on('rejoin', () => {
                //in future check if user is in the game
                toggleStarted(true)
            })

            socket.on('room_started', () => {
                setMessage('Room Started')
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
                setRoundEnd(false)
                setMarkers([])
                toggleStarted(true)
            })

            socket.on('round_over', (data) => {

                setRoundEnd(true)
                setHealth({team1: data.team1_health, team2: data.team2_health})
                setCountdown(5)
                setRoundCountdown(0)
                
                setTeam1Distance(data.team1_distance)
                
                setTeam2Distance(data.team2_distance)
            })

            socket.on('guess', (data) => {
                if (data.countdown){
                    setRoundCountdown(data.countdown)
                }
            })

            socket.on('win', (data) => {
                if (data.users.includes(user)){
                    setWin('You Win! 🎉')
                } else {
                    setWin('You Lost! 😥')
                }

                setCountdown(0)
                setRoundCountdown(0)
            })

            socket.on('empty_team', () => {
                setMessage('Empty Team(s)')
            })

            socket.on('user_guessed', () => {
                console.log('Already Guessed!')
            })
        }

    }, [socket, user])

    useEffect(() => {
        let countdownInterval = setInterval(() => {

            if (countdown > 0){
                setCountdown((prevState) => prevState - 1)
            } else {
                clearInterval(countdownInterval)
            }
        }, 1000)

        return () => clearInterval(countdownInterval)

    }, [countdown])

    useEffect(() => {
       let countdownRoundInterval = setInterval(() => {

            if (roundCountdown > 0){
                setRoundCountdown((prevState) => prevState - 1)
            } else {
                clearInterval(countdownRoundInterval)
            }

       }, 1000)

       return () => clearInterval(countdownRoundInterval)

    }, [roundCountdown])

    const switchTeams = () => {
        socket.emit('switch_teams', {room: id, user: user})
    }

    const startRoom = () => {
        socket.emit('start', {room: id})
    }

    return (
        <>
            <Head>
                <title>BetterGuessr</title>
                <meta name="description" content="GeoGuessr but better" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/marker.png" />
            </Head>
            {!started ? (user ? <div>
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
                    {roundCountdown !== 0 && <h1 className="round-countdown">{roundCountdown}</h1>}
                    <StreetView key={center.lat} center={center} socket={socket}/>
                    <GuessMap key={center.lng} setParentMarkers={setMarkers} socket={socket} user={user} room={id}/>
                    {roundEnd && <FullscreenMap markers={markers} center={center} team1_health={health?.team1} team2_health={health?.team2} team1_distance={team1distance} team2_distance={team2distance} countdown={countdown}/>}
                    {win && <div className="win-overlay">
                        <text>{win}</text>
                        <button onClick={() =>window.location.reload()}>play again</button>
                    </div>}
                </div>}
        </>
    )
}

export default Room;