require("dotenv").config();
const app = require("express")();
const server = require("http").createServer(app);
const io = require("socket.io")(server);
const cors = require("cors");

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require("./helpers/users");
const { addMessage, getHistory } = require("./helpers/messages");

app.use(cors());

io.on("connect", (socket) => {
  socket.on("join", ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit("message", {
      user: process.env.SERVER_NAME || "Admin",
      text: `${user.name}, bienvenue dans ${user.room}.`,
    });
    const conversations = getHistory();
    if (conversations.length > 0) socket.emit("history", conversations);
    socket.broadcast.to(user.room).emit("message", {
      user: process.env.SERVER_NAME || "Admin",
      text: `${user.name} a rejoint le salon.`,
    });

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id);
    if (user) {
      const conversation = { user: user.name, text: message };
      io.to(user.room).emit("message", conversation);
      addMessage({ message: conversation });
    }
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("message", {
        user: process.env.SERVER_NAME || "Admin",
        text: `${user.name} a quitté le chat.`,
      });
      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room),
      });
    }
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server has started.`)
);
