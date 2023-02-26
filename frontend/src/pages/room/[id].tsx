import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { io } from 'socket.io-client'

const socket = io('http://localhost:3002')

const Room = () => {
    const router = useRouter();
    //
    const { id } = router.query

    const [message, setMessage] = useState("hello")


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
            setMessage(JSON.stringify(data))
        })

    }, [socket])

    const switchTeams = () => {
        socket.emit('switch_teams', {room: id, user: 'cumstain'})
    }

    return id ? <div>
        {message}
        <button onClick={switchTeams}>switch</button>
        </div>
        : <div className="w-full h-full"></div>
}

export default Room;