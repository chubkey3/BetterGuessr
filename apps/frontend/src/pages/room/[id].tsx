import { useRouter } from "next/router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { io } from 'socket.io-client'
import FullscreenMap from "../FullscreenMap";
import StreetView from "../StreetView";
import GuessMap from '../GuessMap'
import styles from "@/styles/Home.module.css";
import Head from "next/head";
import { Box, Flex, Input, Text } from "@chakra-ui/react";
import TextBox from "@/components/TextBox";
import Image from "next/image";
import ThemeButton from "@/components/ThemeButton";

const Room = () => {
    const router = useRouter();
    const socket = useMemo(() => io(process.env.PROD == 'true' ? "https://api.chubkey.com" : "http://localhost:13242"), [])

    const { id } = router.query

    const [message, setMessage] = useState("Not Connected")

    //game variables
    const [team1, setTeam1] = useState<string[]>()
    const [team2, setTeam2] = useState<string[]>()
    const [health, setHealth] = useState<{ team1: number, team2: number }>()
    const [win, setWin] = useState<string>()
    const [team1distance, setTeam1Distance] = useState<number>()
    const [team2distance, setTeam2Distance] = useState<number>()
    const [round, setRound] = useState<number>()
    const [multiplier, setMultiplier] = useState<number>()

    const [countdown, setCountdown] = useState<number>(0)
    const [roundCountdown, setRoundCountdown] = useState<number>(0)

    const [started, toggleStarted] = useState<boolean>(false)
    const [center, setCenter] = useState<google.maps.LatLngLiteral>()
    const [markers, setMarkers] = useState<{lat: number, lng: number, user: string}[]>([])
    const [user, setUser] = useState<string>()
    const [userInput, setUserInput] = useState<string>("")
    const [roundEnd, setRoundEnd] = useState<boolean>(false)

    useEffect(() => {
        if (router.query.user && typeof router.query.user === 'string') {
            setUser(router.query.user)
        }
    }, [router.query.user])

    useEffect(() => {
        let user = sessionStorage.getItem('user')
        if (user) {
            setUser(user)
        }
    }, [])

    useEffect(() => {
        if (user) {
            sessionStorage.setItem('user', user)
        }
    }, [user])

    useEffect(() => {
        if (id && user) {
            socket.emit('join', { room: id, user: user })
        }

    }, [id, user])

    useEffect(() => {

        if (user) {

            socket.on('room_not_found', () => {
                setMessage('Room not Found')
            })

            socket.on('invalid_payload', () => {
                setMessage('An Error Occurred Connecting to Room')
            })

            socket.on('user_already_joined', () => {
                setMessage('Already Joined')
                sessionStorage.removeItem('user')
            })

            socket.on('rejoin', (data) => {
                toggleStarted(true)
                setTeam1(data.team1_users)
                setTeam2(data.team2_users)
            })

            socket.on('room_started', () => {
                setMessage('Room Started')
            })

            socket.on('room', (data) => {
                setTeam1(data["team1"])
                setTeam2(data["team2"])
                setMessage("Connected")
            })

            socket.on('new_round', (data) => {
                setCenter(data.location)
                setRoundEnd(false)
                setMarkers([])
                toggleStarted(true)
                setHealth({ team1: data.team1_health, team2: data.team2_health })
                setRound(data.round)
                setMultiplier(data.multiplier)
            })

            socket.on('round_over', (data) => {
                setRoundEnd(true)
                setHealth({ team1: data.team1_health, team2: data.team2_health })
                setMarkers(data.team1_guesses.concat(data.team2_guesses))

                if (data.team1_health > 0 && data.team2_health > 0){
                    setCountdown(5)
                }

                setRoundCountdown(0)

                setTeam1Distance(data.team1_distance)
                setTeam2Distance(data.team2_distance)
            })

            socket.on('guess', (data) => {
                if (data.countdown) {
                    setRoundCountdown(data.countdown)
                }
            })

            socket.on('win', (data) => {
                if (data.users.includes(user)) {
                    setWin('You Win! 🎉')
                } else {
                    setWin('You Lost! 😥')
                }

                setCountdown(0)
                setRoundCountdown(0)
                socket.disconnect()
            })

            socket.on('empty_team', () => {
                setMessage('Empty Team(s)')
            })

            socket.on('user_guessed', () => {
                console.log('Already Guessed!')
            })
        }

    }, [user])

    useEffect(() => {
        let countdownInterval = setInterval(() => {

            if (countdown > 0) {
                setCountdown((prevState) => prevState - 1)
            } else {
                clearInterval(countdownInterval)
            }
        }, 1000)

        return () => clearInterval(countdownInterval)

    }, [countdown])

    useEffect(() => {
        let countdownRoundInterval = setInterval(() => {

            if (roundCountdown > 0) {
                setRoundCountdown((prevState) => prevState - 1)
            } else {
                clearInterval(countdownRoundInterval)
            }

        }, 1000)

        return () => clearInterval(countdownRoundInterval)

    }, [roundCountdown])

    const switchTeams = useCallback(() => {
        socket.emit('switch_teams', { room: id, user: user })
    }, [id, user])

    const startRoom = useCallback(() => {
        socket.emit('start', { room: id })
    }, [id])

    return (
        <>
            <Head>
                <title>BetterGuessr</title>
                <meta name="description" content="GeoGuessr but better" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <link rel="icon" href="/marker.png" />
            </Head>
            {!started ? (user ? 
            <Flex justifyContent={'space-around'} fontSize={'20px'} fontWeight={'bold'} alignItems={'center'} flexDir={'column'}>
                <Flex alignItems={'baseline'}>
                    <Text fontSize={'46px'} fontWeight={'bold'} marginBottom={'5vh'} marginTop={'3vh'}>BetterGuessr</Text>
                    <Image width={40} height={40} alt={'BetterGuessr Logo'} src="/marker.png" />
                </Flex>
                {(message === 'Connected') ? <h1 className="good_message">Status: {message}</h1> : <h1 className="bad_message">Status: {message}</h1>}
                <Flex justifyContent={'space-between'} marginTop={'5vh'} w={'80vw'} maxW={'200px'} h={'20vh'} alignItems={'flex-start'}>
                    <Flex flexDir={'column'} justifyContent={'center'} alignItems={'center'}>
                        <h1>Team 1</h1>
                        {team1?.map((user) => (
                            <h2 key={user}>{user}</h2>
                        ))}
                    </Flex>
                    <Flex flexDir={'column'} justifyContent={'center'} alignItems={'center'}>
                        <h1>Team 2</h1>
                        {team2?.map((user) => (
                            <h2 key={user}>{user}</h2>
                        ))}
                    </Flex>
                </Flex>
                <ThemeButton callback={switchTeams}>Switch Team</ThemeButton>
                <ThemeButton callback={startRoom}>Start</ThemeButton>
            </Flex> :
                <div className="register">
                    <h1>Pick Name</h1>
                    <Input maxW={'80vw'} autoFocus value={userInput} onChange={(e) => { setUserInput(e.target.value) }} onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            setUser(userInput)
                        }
                    }} />
                    <button className="but" onClick={() => { setUser(userInput) }}>Join</button>
                </div>
            )
                : center && <div className="main-wrapper" style={styles}>
                    <div className="overhead-display">
                        {roundCountdown !== 0 && <TextBox>{roundCountdown}</TextBox>}
                        {!roundEnd && <TextBox>{multiplier}x</TextBox>}
                    </div>
                    {!roundEnd && <div className="health">
                        {user && team1?.includes(user) ?
                        <div>
                            <TextBox>{health?.team1}</TextBox>
                            <div className="team-container">
                                {team1?.map((user) => (
                                    <h1 key={user}>{user}</h1>
                                ))}
                            </div>
                        </div>
                        :
                        <div>
                            <TextBox>{health?.team2}</TextBox>
                            <div className="team-container">
                                {team2?.map((user) => (
                                    <h1 key={user}>{user}</h1>
                                ))}
                            </div>
                        </div>
                        }
                        {user && team1?.includes(user) ?
                        <div>
                            <TextBox>{health?.team2}</TextBox>
                            <div className="team-container">
                                {team2?.map((user) => (
                                    <h1 key={user}>{user}</h1>
                                ))}
                            </div>
                        </div>
                        :
                        <div>
                            <TextBox>{health?.team1}</TextBox>
                            <div className="team-container">
                                {team1?.map((user) => (
                                    <h1 key={user}>{user}</h1>
                                ))}
                            </div>
                        </div>
                        }
                    </div>}
                    <StreetView key={center.lat} center={center} socket={socket} />
                    <GuessMap key={center.lng} setParentMarkers={setMarkers} socket={socket} user={user} room={id} />
                    {roundEnd && <FullscreenMap markers={markers} center={center} team1_health={health?.team1} team2_health={health?.team2} team1_distance={team1distance} team2_distance={team2distance} countdown={countdown} round={round} multiplier={multiplier} team={user && team1?.includes(user) ? 'team1' : 'team2'} />}
                    {win && <div className="win-overlay">
                        <text>{win}</text>
                        <button className="but" onClick={() => window.location.reload()}>play again</button>
                    </div>}
                </div>}
        </>
    )
}

export default Room;
