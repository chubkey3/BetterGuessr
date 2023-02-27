import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { io } from 'socket.io-client'

const socket = io('http://localhost:3002')

const Room = () => {
    const router = useRouter();
    //
    const { id } = router.query

    const [message, setMessage] = useState("Not Connected")

    const [team1, setTeam1] = useState<string>()
    const [team2, setTeam2] = useState<string>()
    const [started, toggleStarted] = useState<boolean>()

    useEffect(() => {
        if (id){
            socket.emit('join', {room: id, user: 'cumstain'})
        }

    }, [id])

    useEffect(() => {

        socket.on('room_not_found', () => {
            setMessage('Room not Found')
        })

        socket.on('invalid_payload', () => {
            setMessage('An Error Occurred Connecting to Room')
        })

        socket.on('room', (data) => {
            //setTeam1(data["team1"])
            //setTeam2(data["team2"])
            setTeam1(JSON.stringify(data["team1"]))
            setTeam2(JSON.stringify(data["team2"]))
            setMessage("Connected")
        })

    }, [socket])

    const switchTeams = () => {
        socket.emit('switch_teams', {room: id, user: 'cumstain'})
    }

    const startRoom = () => {
        socket.emit('start', {room: id})
    }

    return id ? <div>
        {message}
        <button onClick={switchTeams}>switch team</button>
        <h1>Team 1</h1>
        <h2>{team1}</h2>
        {/*team1.map((user) => (
            <h2>{user}</h2>
        ))*/}
        <h1>Team 2</h1>
        <h2>{team2}</h2>
        {/*team2.map((user) => (
            <h2>{user}</h2>
        ))*/}
        <button onClick={startRoom}>Start</button>
        </div>
        : <div className="w-full h-full"></div>
}

export default Room;