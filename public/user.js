let user = "",
  userdata = {};
let sellers = [];
let socket;
let sellerRoom;
let bidData = [];
let highestBid;
let chatRoom;
let userName = "John Doe" + Math.trunc(Math.random() * 100);
let sellerDetails = [];
$().ready(() => {
  // $("#sellerDiv").hide();
  $("#buyerDiv").hide();
  $("#bidDiv").hide();
  $("#chatDiv").hide();
  $("#chooseBuyerTd").hide();
  $("#sellerDetails").hide();
  $("#outerSellerDiv").hide();
});
document.getElementById("buyerBtn").addEventListener("click", () => {
  user = "Buyer";
  let temp = document.getElementById("userName").value;
  if (temp != "") userName = temp;
  document.getElementById("sellerBtn").disabled = true;
  document.getElementById("buyerBtn").disabled = true;
  $("#buttonDiv").slideUp();
  $("#buyerDiv").slideDown();
  $("#outerSellerDiv").slideDown();
  $("#bidDiv").slideDown();
  connectIO();
});
document.getElementById("sellerBtn").addEventListener("click", () => {
  user = "Seller";
  let temp = document.getElementById("userName").value;
  if (temp != "") userName = temp;
  document.getElementById("sellerBtn").disabled = true;
  document.getElementById("buyerBtn").disabled = true;
  $("#buttonDiv").slideUp();
  $("#formDiv").hide();
  $("#sellerDetails").slideDown();
});
document.getElementById("goToBidding").addEventListener("click", () => {
  $("#sellerDetails").slideUp();
  $("#bidDiv").slideDown();

  connectIO();
});
document.getElementById("chooseBuyer").addEventListener("click", () => {
  if (socket) {
    console.log(sellerRoom);
    socket.emit("buyerChoose", { buyer: highestBid, room: sellerRoom });
  }
});

function connectIO() {
  if (user) {
    socket = io.connect("https://realtimebidding.herokuapp.com/");
    if (user == "Buyer") {
      socket.on("getSellers", data => {
        console.log(data.sellers);
        addSellers(data.sellers, socket);
      });
      socket.on("updateSellers", data => {
        addSellers(data.sellers, socket);
        console.log(data.sellers);
      });
      socket.on("getBids", data => {
        bidData = data;
        makeBidLog();
      });
      document.getElementById("submitBid").addEventListener("click", () => {
        let logData = {
          seller: sellerRoom,
          buyer: socket.id,
          bid: document.getElementById("bidAmount").value
        };
        if (logData.bid != "" && sellerRoom != "") {
          bidData.push(logData);
          console.log(logData);
          socket.emit("logBid", { bids: bidData, bid: logData });
          document.getElementById("bidForm").reset();
        }
      });
      socket.on("newBid", data => {
        console.log("New Bid!");
        bidData.push(data.bid);
        addBid(data.bid);
        console.log(data);
      });
      socket.on("saleDone", data => {
        console.log(`Sale done with ${data.seller}`);
        $("#bidLog").slideUp();
        $("#chatDiv").slideDown();
      });
    } else if (user == "Seller") {
      $("#chooseBuyerTd").fadeIn();
      sellerRoom = "Seller " + userName;
      socket.emit("createSeller", {
        name: sellerRoom
      });
      socket.on("getBids", data => {
        bidData = data;
        makeBidLog();
      });
      socket.on("newBid", data => {
        console.log("New Bid!");
        bidData.push(data.bid);
        addBid(data.bid);
        console.log(data);
      });
    }
    socket.on("pleaseExit", data => {
      console.log(data);
      if (socket.id != data.buyer && socket.id != data.seller) {
        console.log(data);
        window.location.href = "https://realtimebidding.herokuapp.com/";
        socket.emit("killMe", sellerRoom);
      }
    });
    socket.on("enterChatMode", data => {
      console.log("CHAT");
      enterChatMode(data);
    });
    socket.on("newMessageFromServer", data => {
      addOtherMessage(data);
      document.getElementById("msgText").value = "";
    });
    socket.on("removeSeller", data => {
      sellers.pop(data);
    });
  }
}
function enterChatMode(data) {
  socket.emit("connectMe", data.room);
  chatRoom = data.room;
  $("#bidLog").slideUp();
  $("#formDiv").slideUp();
  $("#buyerDiv").slideUp();
  $("#sellerDiv").slideUp();
  $("#outerSellerDiv").slideUp();
  $("#highestBidDiv").slideUp();
  $("#chatDiv").slideDown();
  document.getElementById("sendMsg").addEventListener("click", () => {
    if (socket) {
      let msgBody = {
        msg: document.getElementById("msgText").value,
        room: chatRoom,
        sender: socket.id,
        name: userName
      };
      if (msgBody.value != "") {
        socket.emit("newMessage", msgBody);
        addMyMessage(msgBody);
        document.getElementById("msgText").value = "";
      }
    }
  });
}

function addMyMessage(data) {
  $("#chatDiv").append(
    "<div class='bg-dark text-light rounded p-1 m-1'> <p class='pull-right'>" +
      "<span class='font-weight-bold'>Me: </span>: " +
      data.msg +
      "</p></div>"
  );
}
function addOtherMessage(data) {
  $("#chatDiv").append(
    "<div class='bg-light text-dark rounded p-1 m-1'> <p class='pull-left'>" +
      "<span class='font-weight-bold'>" +
      data.name +
      "</span>: " +
      data.msg +
      "</p></div>"
  );
}

function addSellers(sellerData) {
  sellerData.forEach(seller => {
    if (sellers.indexOf(seller) == -1) {
      let d = document.createElement("div");
      let p = document.createElement("button");
      p.textContent = seller;
      p.classList.add("btn");
      p.classList.add("btn-warning");
      p.addEventListener("click", () => {
        socket.emit("joinSeller", { room: seller, sellerID: seller });
        sellerRoom = seller;
        console.log(seller);
      });
      d.appendChild(p);
      d.classList.add("container");
      d.classList.add("text-center");
      d.classList.add("rounded");
      d.classList.add("p-2");
      d.classList.add("m-2");
      $("#sellerDiv").append(d);
      sellers.push(seller);
    }
  });
}

function makeBidLog() {
  let myNode = document.getElementById("bidLog");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }
  document.getElementById("highestBid").textContent = "Highest Bid:";
  if (bidData.length > 0) {
    bidData.forEach(bid => {
      addBid(bid);
    });
  }
}

function addBid(bid) {
  console.log(bid);
  let logDiv = document.getElementById("bidLog");
  let tempDiv = document.createElement("div");
  let tempH = document.createElement("h6");
  tempH.textContent = `${bid.buyer} - Rs. ${bid.bid}`;
  tempDiv.appendChild(tempH);
  tempDiv.classList.add("bg-light");
  tempDiv.classList.add("text-dark");
  tempDiv.classList.add("rounded");
  tempDiv.classList.add("p-1");
  tempDiv.classList.add("m-2");
  logDiv.insertBefore(tempDiv, logDiv.childNodes[0]);
  highestBid = getHighestBid();
  document.getElementById("highestBid").textContent = `Highest Bid: ${
    highestBid.buyer
  } - Rs.${highestBid.bid}`;
}

function getHighestBid() {
  let maxBid = { bid: 0 };
  bidData.forEach(bid => {
    if (bid.bid >= maxBid.bid) {
      maxBid = bid;
    }
  });
  return maxBid;
}
