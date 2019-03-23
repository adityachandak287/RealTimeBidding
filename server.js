var express = require("express");
var app = express();
const PORT = 3001;
var server = app.listen(PORT);
app.use(express.static("public"));
console.log(`Server is running at ${PORT}`);
var socket = require("socket.io");
var io = socket(server);
var sellers = [];
var bidLogs = {};
var chatRooms = {};
io.sockets.on("connection", socket => {
  socket.emit("getSellers", { sellers: sellers });
  socket.on("createSeller", data => {
    sellers.push(data.name);
    socket.join(data.name);
    bidLogs[data.name] = [];
    io.emit("updateSellers", { sellers: sellers });
    console.log(data.name + " joined");
  });

  socket.on("joinSeller", data => {
    var rooms = Object.keys(socket.rooms);
    if (rooms.length > 1) {
      console.log(`${socket.id} left room ${rooms[1]}`);
      socket.leave(rooms[1]);
    }
    socket.join(data.room);

    console.log(rooms);
    socket.emit("getBids", bidLogs[data.room]);
    console.log(`${socket.id} joined room ${data.room}`);
  });

  socket.on("logBid", data => {
    console.log(
      `${data.bid.bid} from ${data.bid.buyer} in room ${data.bid.seller}`
    );
    io.in(data.bid.seller).emit("newBid", data);
    bidLogs[data.bid.seller].push(data.bid);
  });

  socket.on("buyerChoose", data => {
    const killData = { buyer: data.buyer.buyer, seller: socket.id };
    const saleData = {
      buyer: killData.buyer,
      seller: killData.seller,
      bid: data.buyer.bid,
      room: "chat" + killData.buyer + killData.seller
    };
    io.in(data.room).emit("pleaseExit", killData);
    console.log(`Buyer ${saleData.buyer} Seller ${saleData.seller}`);
    io.to(`${saleData.buyer}`).emit("enterChatMode", saleData);
    socket.emit("enterChatMode", saleData);
    if (!saleData.room in chatRooms) {
      chatRooms[saleData.room] = saleData;
    }
    sellers.pop(data.room);
    io.in(data.room).emit("removeSeller", data.room);
  });

  socket.on("connectMe", room => {
    socket.join(room);
    console.log(`${socket.id} connected to chat room ${room}`);
  });
  //Disconnect all buyers except highest bidder and seller
  socket.on("killMe", data => {
    console.log(`${socket.id} left room ${data}`);
    socket.leave(data);
  });

  //Chat events
  socket.on("newMessage", data => {
    socket.to(data.room).emit("newMessageFromServer", data);
    console.log(data);
  });
});
