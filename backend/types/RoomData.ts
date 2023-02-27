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
    room_id: string,
    team1_users: string[],
    team2_users: string[],
    guessed: number,
    started: boolean,
    team1_health: number,
    team2_health: number,
    location: LocationData
}

export default RoomData