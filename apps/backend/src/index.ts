const express = require("express");
const { randomUUID } = require("crypto");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const compression = require("compression");
const cors = require("cors");

require("dotenv").config();

const data = require("./locations/World.json");

import Room from "./models/Room";

import {Request, Response} from 'express';

//types
import LocationData from "./types/LocationData";
import RoomData from "./types/RoomData";
import { Socket } from "socket.io";

const app = express();

const server = require("http").createServer(app);

const rad = (x: number) => {
  return (x * Math.PI) / 180;
};

var getDistance = (p1: LocationData, p2: LocationData) => {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2.lat - p1.lat);
  var dLong = rad(p2.lng - p1.lng);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) * Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};

//in the future make team1_guesses/team2_guesses an array of objects so users can be associated to guesses

function parseData(data: any) {
  try {
    var o = JSON.parse(data);

    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}

  return data;
}

const activeUsers: { [key: string]: { room: string; user: string } } = {}; //convert to db?

const roomResetJobs: { [key: string]: ReturnType<typeof setInterval>} = {};

const userResetJobs: { [key: string]: ReturnType<typeof setInterval>} = {};

const resetRoom = async (room: string) => {
  await updateRoom(room, {
    team1_guesses: [],
    team2_guesses: [],
    team1_tempguesses: {},
    team2_tempguesses: {},
    team1_users: [],
    team2_users: [],
    started: false,
    guessed: 0,
    team1_health: 5000,
    team2_health: 5000,
    countdown_time: 15,
    round: 1,
  })
}

const findRoom = async (room: string): Promise<RoomData> => {
  const roomData = await Room.findOne({ room_name: room });

  return roomData;
};

const updateRoom = async (room: string, data: any, callback?: boolean) => {
  Room.findOneAndUpdate({ room_name: room }, data, { upsert: true }, async function (err: any) {
    if (!err && callback) {
      await updateUsers(room);
    } else if (err) {
      console.log(err);
    }
  });
};

const updateUsers = async (room: string) => {
  let updatedRoom = await findRoom(room);

  io.to(room).emit("room", { team1: updatedRoom.team1_users, team2: updatedRoom.team2_users });
};

const removeUser = async (room_name: string, user: string, socket: Socket) => {
    let room = await findRoom(room_name);

    if (!room.started) {
      let temp1: string[] = [];
      let temp2: string[] = [];

      for (let i = 0; i < room.team1_users.length; i++) {
        if (room.team1_users[i] !== user) {
          temp1.push(room.team1_users[i]);
        }
      }

      for (let i = 0; i < room.team2_users.length; i++) {
        if (room.team2_users[i] !== user) {
          temp2.push(room.team2_users[i]);
        }
      }

      clearTimeout(userResetJobs[user]);
      delete userResetJobs[user];

      await updateRoom(room_name, { team1_users: temp1, team2_users: temp2 }, true);

      socket.emit('kicked')

      delete activeUsers[socket.id];
    }
}

const getRandomLocation = () => {
  return data[Math.floor(Math.random() * data.length)];
};

const roundEnd = async (
  room_name: string,
  team1_guesses: { lat: number; lng: number; user: string }[],
  team2_guesses: { lat: number; lng: number; user: string }[]
) => {
  let room = await findRoom(room_name);  

  //calculate health
  let team1_guess = 99999999999;
  let team2_guess = 99999999999;

  let team1_health = room.team1_health;
  let team2_health = room.team2_health;

  var distance;
  var round;

  let team1_users = [];
  let team2_users = [];
  let team1_tempguesses = room.team1_tempguesses;
  let team2_tempguesses = room.team2_tempguesses;
  let team1_tempguessesmade = [];
  let team2_tempguessesmade = [];

  for (let i = 0; i < team1_guesses.length; i++) {
    distance = getDistance(team1_guesses[i], room.location);
    if (distance < team1_guess) {
      team1_guess = distance;
    }
    team1_users.push(team1_guesses[i].user)
  }

  for (let i = 0; i < team2_guesses.length; i++) {
    distance = getDistance(team2_guesses[i], room.location);
    if (distance < team2_guess) {
      team2_guess = distance;
    }
    team2_users.push(team2_guesses[i].user)
  }

  //console.log(Object.keys(team1_tempguesses), Object.keys(team2_tempguesses), team1_users, team2_users)
  for (var key in team1_tempguesses){
    distance = getDistance(team1_tempguesses[key], room.location)
    if (distance < team1_guess && !(team1_users.includes(key))){
      team1_guess = distance;
      team1_tempguessesmade.push({lat: team1_tempguesses[key].lat, lng: team1_tempguesses[key].lng, user: key})
    }
  }

  for (var key in team2_tempguesses){
    distance = getDistance(team2_tempguesses[key], room.location)
    if (distance < team2_guess && !(team2_users.includes(key))){
      team2_guess = distance;
      team2_tempguessesmade.push({lat: team2_tempguesses[key].lat, lng: team2_tempguesses[key].lng, user: key})
    }
  }

  if (team1_guess < team2_guess) {
    team2_health = Math.ceil(
      Math.max(
        0,
        room.team2_health -
          calculateMultiplier(room.round) * (calculatePoints(team1_guess / 1000) - calculatePoints(team2_guess / 1000))
      )
    );
  } else if (team2_guess < team1_guess) {
    team1_health = Math.ceil(
      Math.max(
        0,
        room.team1_health -
          calculateMultiplier(room.round) * (calculatePoints(team2_guess / 1000) - calculatePoints(team1_guess / 1000))
      )
    );
  }  
  
  io.to(room_name).emit("round_over", {
    team1_guesses: team1_guesses.concat(team1_tempguessesmade),
    team2_guesses: team2_guesses.concat(team2_tempguessesmade),
    team1_health: team1_health,
    team2_health: team2_health,
    team1_distance: Object.keys(team1_tempguesses).length > 0 ? team1_guess : null,
    team2_distance: Object.keys(team2_tempguesses).length > 0 ? team2_guess : null,
  });

  if (team1_health <= 0) {
    team1_health = 5000;
    team2_health = 5000;
    round = 1;

    setTimeout(() => {
      io.to(room_name).emit("win", { team: "team2", users: room.team2_users });
      updateRoom(room_name, { started: false, location: { lat: 0, lng: 0 }, team1_users: [], team2_users: [] });
    }, 5000);

    clearTimeout(roomResetJobs[room_name])
    delete roomResetJobs[room_name]

  } else if (team2_health <= 0) {
    team1_health = 5000;
    team2_health = 5000;
    round = 1;

    setTimeout(() => {
      io.to(room_name).emit("win", { team: "team1", users: room.team1_users });
      updateRoom(room_name, { started: false, location: { lat: 0, lng: 0 }, team1_users: [], team2_users: [] });
    }, 5000);

    clearTimeout(roomResetJobs[room_name])
    delete roomResetJobs[room_name]

  } else {
    round = room.round + 1;

    setTimeout(() => {
      let location = getRandomLocation();
      io.to(room_name).emit("new_round", {
        location: location,
        team1_health: team1_health,
        team2_health: team2_health,
        round: room.round + 1,
        multiplier: calculateMultiplier(room.round + 1),
      });
      updateRoom(room_name, { location: location });
    }, 5000);
  }

  updateRoom(room_name, {
    team1_health: team1_health,
    team2_health: team2_health,
    guessed: 0,
    team1_guesses: [],
    team2_guesses: [],
    round: round,
    team1_tempguesses: {},
    team2_tempguesses: {}
  });
};

const calculatePoints = (distance: number) => {
  if (distance > Math.pow(10, 7)) {
    return 0;
  }

  return 5000 * Math.exp(-distance / 2000);
};

const calculateMultiplier = (round: number) => {
  if (round < 3) {
    return 1;
  }

  return 1 + 0.5 * (round - 3);
};

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

var roundCountdown: any;

io.on("connection", (socket: Socket) => {
  socket.on("join", async (r: any) => {
    const req: { room: string; user: string } = parseData(r);

    let room = await findRoom(req.room);

    if (!req.room || !req.user) {
      socket.emit("invalid_payload");
    } else if (!room) {
      socket.emit("room_not_found");
    } else {
      if (!room.team1_users.includes(req.user) && !room.team2_users.includes(req.user)) {
        if (room.started) {
          socket.emit("room_started");
        } else {
          socket.join(req.room);

          activeUsers[socket.id] = { room: req.room, user: req.user };

          userResetJobs[req.user] = setTimeout(() => {
            removeUser(req.room, req.user, socket)
          }, 1000*60*5)

          let team1_users = room.team1_users;

          team1_users.push(req.user);

          await updateRoom(req.room, { team1_users: team1_users }, true);
        }
      } else if (room.team1_users.includes(req.user) || room.team2_users.includes(req.user)) {
        if (room.started) {
          socket.join(req.room);
          socket.emit("rejoin", { team1_users: room.team1_users, team2_users: room.team2_users });
          socket.emit("new_round", {
            location: room.location,
            team1_health: room.team1_health,
            team2_health: room.team2_health,
            round: room.round,
            multiplier: calculateMultiplier(room.round),
          });
        } else {
          socket.emit("user_already_joined");
        }
      }
    }
  });

  socket.on("switch_teams", async (r: any) => {
    const req: { user: string; room: string } = parseData(r);

    if (!req.room || !req.user) {
      socket.emit("invalid_payload");
    } else {
      var temp: string[] = [];

      let room = await findRoom(req.room);

      if (room.started) {
        socket.emit("room_started");
      } else if (room.team1_users.includes(req.user)) {
        for (var i = 0; i < room.team1_users.length; i++) {
          if (room.team1_users[i] === req.user) {
            continue;
          }
          temp.push(room.team1_users[i]);
        }

        let team2_users = room.team2_users;

        team2_users.push(req.user);

        await updateRoom(req.room, { team1_users: temp, team2_users: team2_users }, true);
      } else if (room.team2_users.includes(req.user)) {
        for (var i = 0; i < room.team2_users.length; i++) {
          if (room.team2_users[i] === req.user) {
            continue;
          }
          temp.push(room.team2_users[i]);
        }

        let team1_users = room.team1_users;

        team1_users.push(req.user);

        await updateRoom(req.room, { team1_users: team1_users, team2_users: temp }, true);
      }
    }
  });

  socket.on("start", async (r: any) => {
    const req: { room: string } = parseData(r);

    if (!req.room) {
      socket.emit("invalid_payload");
    } else {
      let room = await findRoom(req.room);

      if (room) {
        if (!room.started) {
          if (room.team1_users.length > 0 && room.team2_users.length > 0) {
            let location = getRandomLocation();

            updateRoom(req.room, { started: true, location: location });

            roomResetJobs[req.room] = setTimeout(() => {
              resetRoom(req.room)
              clearTimeout(roomResetJobs[req.room])
              delete roomResetJobs[req.room]
            }, 1000*60*60) //rooms reset after an hour
            
            for (var k in room.team1_users){
              clearTimeout(userResetJobs[k])
              delete userResetJobs[k]
            }
            for (var k in room.team2_users){
              clearTimeout(userResetJobs[k])
              delete userResetJobs[k]
            }

            io.to(req.room).emit("new_round", {
              location: location,
              team1_health: room.team1_health,
              team2_health: room.team2_health,
              round: room.round,
              multiplier: calculateMultiplier(room.round),
            });
          } else {
            socket.emit("empty_team");
          }
        } else {
          socket.emit("room_started");
        }
      } else {
        socket.emit("room_not_found");
      }
    }
  });

  socket.on("guess", async (r: any) => {
    const req: { user: string; room: string; guess: LocationData } = parseData(r);

    let room = await findRoom(req.room);    
    if (!room) {
      socket.emit("room_not_found");
    } else {
      if (room.started) {
        if (
          room.team1_guesses.filter((e) => e.user === req.user).length > 0 ||
          room.team2_guesses.filter((e) => e.user === req.user).length > 0
        ) {
          socket.emit("user_guessed");          
        } else {
          let temp: LocationData[] = [];

          let team1_guesses = room.team1_guesses;
          let team2_guesses = room.team2_guesses;

          let guessed = room.guessed + 1;

          //adding last guess
          if (room.team1_users.includes(req.user)) {
            temp = room.team1_guesses;
            temp.push({ lat: req.guess.lat, lng: req.guess.lng, user: req.user });
            team1_guesses.push({ lat: req.guess.lat, lng: req.guess.lng, user: req.user });
            updateRoom(req.room, { guessed: room.guessed + 1, team1_guesses: temp });
          } else {
            temp = room.team2_guesses;
            temp.push({ lat: req.guess.lat, lng: req.guess.lng, user: req.user });
            team2_guesses.push({ lat: req.guess.lat, lng: req.guess.lng, user: req.user });
            updateRoom(req.room, { guessed: room.guessed + 1, team2_guesses: temp });
          }
          

          //win detection

          //all users guessed
          if (guessed === room.team1_users.length + room.team2_users.length && guessed !== 1) {

            clearInterval(roundCountdown);
            roundEnd(req.room, team1_guesses, team2_guesses);
            if (room.team1_users.includes(req.user)) {
              io.to(req.room).emit("guess", {
                guess: { lat: req.guess.lat, lng: req.guess.lng, user: req.user },
                team: room.team1_users,
              });
            } else if (room.team2_users.includes(req.user)) {
              io.to(req.room).emit("guess", {
                guess: { lat: req.guess.lat, lng: req.guess.lng, user: req.user },
                team: room.team2_users,
              });
            }

          //first guess (start countdown)
          } else if (guessed === 1) {         

            clearInterval(roundCountdown);
            roundCountdown = setTimeout(
              () => roundEnd(req.room, team1_guesses, team2_guesses),
              1000 * room.countdown_time
            );
            if (room.team1_users.includes(req.user)) {
              io.to(req.room).emit("guess", {
                guess: { lat: req.guess.lat, lng: req.guess.lng, user: req.user },
                countdown: room.countdown_time,
                team: room.team1_users,
              });
            } else if(room.team2_users.includes(req.user)) {
              io.to(req.room).emit("guess", {
                guess: { lat: req.guess.lat, lng: req.guess.lng, user: req.user },
                countdown: room.countdown_time,
                team: room.team2_users,
              });
            }

            //between 2 and n-1 guesses done (including last guess)
          } else {

            if (room.team1_users.includes(req.user)) {
              io.to(req.room).emit("guess", {
                guess: { lat: req.guess.lat, lng: req.guess.lng, user: req.user },
                team: room.team1_users,
              });
            } else if (room.team2_users.includes(req.user)) {
              io.to(req.room).emit("guess", {
                guess: { lat: req.guess.lat, lng: req.guess.lng, user: req.user },
                team: room.team2_users,
              });
            }
          }
        }
        
      } else {
        socket.emit("room_not_started");
      }
    }
  });

  socket.on("temp_guess", async (r: any) => {
    const req: { user: string; room: string; guess: LocationData } = parseData(r);

    let room = await findRoom(req.room);

    if (!room) {
      socket.emit("room_not_found");
    } else {
      if (room.started) {
        let team1_tempguesses = room.team1_tempguesses
        let team2_tempguesses = room.team2_tempguesses

        if (room.team1_users.includes(req.user)){
          
          team1_tempguesses[req.user] = req.guess

        } else if (room.team2_users.includes(req.user)){
          team2_tempguesses[req.user] = req.guess

        }

        updateRoom(req.room, { team1_tempguesses: team1_tempguesses, team2_tempguesses: team2_tempguesses})

      } else {
        socket.emit("room_not_started");
      }
    }
  })

  socket.on("disconnect", async () => {
    if (socket.id in activeUsers) {
      const room_name = activeUsers[socket.id].room;
      const user = activeUsers[socket.id].user;

      let room = await findRoom(room_name);

      if (!room.started) {
        let temp1: string[] = [];
        let temp2: string[] = [];

        for (let i = 0; i < room.team1_users.length; i++) {
          if (room.team1_users[i] !== user) {
            temp1.push(room.team1_users[i]);
          }
        }

        for (let i = 0; i < room.team2_users.length; i++) {
          if (room.team2_users[i] !== user) {
            temp2.push(room.team2_users[i]);
          }
        }

        clearTimeout(userResetJobs[user]);
        delete userResetJobs[user];

        await updateRoom(room_name, { team1_users: temp1, team2_users: temp2 }, true);

        delete activeUsers[socket.id];
      }
    }
  });
});

//connect to database
mongoose
  .connect(process.env.MONGO_URL, { dbName: "betterguessr" })
  .then(() => console.log("Connected to Database!"))
  .catch(() => console.log("Error Connecting to Database!"));

mongoose.set("strictQuery", true);

if (process.env.PROD !== "production") {
  //new Room({room_name: "abc", team1_guesses: [], team2_guesses: [], room_id: crypto.randomUUID(), team1_users: [], team2_users: [], guessed: 0, started: false, team1_health: 5000, team2_health: 5000, location: {lat: 0, lng: 0}}).save()
  resetRoom("abc")
  .then(() => console.log('Success!'))
  .catch(() => console.log('Error!'))
}

//middleware
app.use(compression());
app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Betterguessr backend service.");
});

app.get("/join", (req: Request, res: Response) => {
  res.send(randomUUID());
});

app.get("/reset", (req: Request, res: Response) => {
  resetRoom("abc")
  .then(() => res.send('Success!'))
  .catch(() => res.send('Failure!'))
});

/*
app.listen(process.env.EXPRESS_PORT || 3001, () => {
    console.log('Server running on port ' + process.env.EXPRESS_PORT)
})
*/

server.listen(process.env.SOCKET_IO_PORT || 13242, () => {
  console.log("Socket running on port " + process.env.SOCKET_IO_PORT);
});
