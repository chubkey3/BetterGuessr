import LocationData from "./LocationData"

interface RoomData {
    room_name: string,
    team1_guesses: {
        lat: number,
        lng: number,
        user: string
    }[],
    team2_guesses: {
        lat: number,
        lng: number,
        user: string
    }[],
    team1_tempguesses: any,
    team2_tempguesses: any,
    room_id: string,
    team1_users: string[],
    team2_users: string[],
    guessed: number,
    started: boolean,
    team1_health: number,
    team2_health: number,
    location: LocationData,
    countdown_time: number,
    round: number
}

export default RoomData