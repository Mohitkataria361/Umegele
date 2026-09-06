
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer);

  const waitingUsers = new Set<string>();
  const partners = new Map<string, string>();
  const userRooms = new Map<string, string>();

  const removeFromWaiting = (socketId: string) => {
    waitingUsers.delete(socketId);
  };

  const findMatch = (socketId: string) => {
    if (partners.has(socketId)) return;
    if (waitingUsers.has(socketId)) return;

    let strangerId: string | null = null;

    for (const candidateId of waitingUsers) {
      if (candidateId === socketId) continue;

      const candidateSocket =
        io.sockets.sockets.get(candidateId);

      if (
        candidateSocket &&
        !partners.has(candidateId)
      ) {
        strangerId = candidateId;
        break;
      }

      waitingUsers.delete(candidateId);
    }

    if (!strangerId) {
      waitingUsers.add(socketId);

      io.to(socketId).emit("waiting");

      console.log(`WAITING: ${socketId}`);

      return;
    }

    waitingUsers.delete(strangerId);
    waitingUsers.delete(socketId);

    const roomId =
      `room-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

    partners.set(socketId, strangerId);
    partners.set(strangerId, socketId);

    userRooms.set(socketId, roomId);
    userRooms.set(strangerId, roomId);

    const currentSocket =
      io.sockets.sockets.get(socketId);

    const strangerSocket =
      io.sockets.sockets.get(strangerId);

    currentSocket?.join(roomId);
    strangerSocket?.join(roomId);

    /*
      One user is designated as the WebRTC caller.

      We use the first socketId passed to this function
      as the caller.
    */
    io.to(socketId).emit("matched", {
      roomId,
      initiator: true,
    });

    io.to(strangerId).emit("matched", {
      roomId,
      initiator: false,
    });

    console.log(
      `MATCHED: ${socketId} <-> ${strangerId}`
    );
  };

  io.on("connection", (socket) => {
    console.log("CONNECTED:", socket.id);

    // --------------------------------
    // FIND STRANGER
    // --------------------------------

    socket.on("end-call", () => {
      console.log(`END CALL: ${socket.id}`);

      const partnerId = partners.get(socket.id);

      // Remove current user from waiting queue
      waitingUsers.delete(socket.id);

      if (!partnerId) {
        return;
      }

      const roomId = userRooms.get(socket.id);

      // Remove both users from the current match
      partners.delete(socket.id);
      partners.delete(partnerId);

      userRooms.delete(socket.id);
      userRooms.delete(partnerId);

      // Leave room
      socket.leave(roomId ?? "");

      const partnerSocket =
        io.sockets.sockets.get(partnerId);

      partnerSocket?.leave(roomId ?? "");

      // Tell stranger the call has ended
      io.to(partnerId).emit("call-ended");

      console.log(
        `${socket.id} ended call with ${partnerId}`
      );
    });

    socket.on("find-stranger", () => {
      console.log(`FIND REQUEST: ${socket.id}`);

      findMatch(socket.id);
    });

    // --------------------------------
    // CHAT MESSAGE
    // --------------------------------

    socket.on(
      "send-message",
      ({
        roomId,
        message,
      }: {
        roomId: string;
        message: string;
      }) => {
        const currentRoom =
          userRooms.get(socket.id);

        if (
          !currentRoom ||
          currentRoom !== roomId
        ) {
          console.log(
            `Invalid room message from ${socket.id}`
          );

          return;
        }

        const partnerId =
          partners.get(socket.id);

        if (!partnerId) return;

        io.to(partnerId).emit(
          "receive-message",
          {
            message,
          }
        );
      }
    );

    // --------------------------------
    // WEBRTC OFFER
    // --------------------------------

    socket.on(
      "webrtc-offer",
      ({
        offer,
      }: {
        offer: RTCSessionDescriptionInit;
      }) => {
        const partnerId =
          partners.get(socket.id);

        if (!partnerId) {
          console.log(
            `No partner for offer from ${socket.id}`
          );

          return;
        }

        io.to(partnerId).emit(
          "webrtc-offer",
          {
            offer,
          }
        );

        console.log(
          `WEBRTC OFFER: ${socket.id} -> ${partnerId}`
        );
      }
    );

    // --------------------------------
    // WEBRTC ANSWER
    // --------------------------------

    socket.on(
      "webrtc-answer",
      ({
        answer,
      }: {
        answer: RTCSessionDescriptionInit;
      }) => {
        const partnerId =
          partners.get(socket.id);

        if (!partnerId) {
          console.log(
            `No partner for answer from ${socket.id}`
          );

          return;
        }

        io.to(partnerId).emit(
          "webrtc-answer",
          {
            answer,
          }
        );

        console.log(
          `WEBRTC ANSWER: ${socket.id} -> ${partnerId}`
        );
      }
    );

    // --------------------------------
    // WEBRTC ICE CANDIDATE
    // --------------------------------

    socket.on(
      "webrtc-ice-candidate",
      ({
        candidate,
      }: {
        candidate: RTCIceCandidateInit;
      }) => {
        const partnerId =
          partners.get(socket.id);

        if (!partnerId) {
          return;
        }

        io.to(partnerId).emit(
          "webrtc-ice-candidate",
          {
            candidate,
          }
        );
      }
    );

    // --------------------------------
    // NEXT STRANGER
    // --------------------------------

    socket.on("next-stranger", () => {
      console.log(
        `NEXT REQUEST: ${socket.id}`
      );

      const partnerId =
        partners.get(socket.id);

      if (!partnerId) {
        findMatch(socket.id);
        return;
      }

      const roomId =
        userRooms.get(socket.id);

      partners.delete(socket.id);
      partners.delete(partnerId);

      userRooms.delete(socket.id);
      userRooms.delete(partnerId);

      socket.leave(roomId ?? "");

      const partnerSocket =
        io.sockets.sockets.get(partnerId);

      partnerSocket?.leave(roomId ?? "");

      io.to(partnerId).emit(
        "stranger-left"
      );

      findMatch(socket.id);

      console.log(
        `${socket.id} left ${partnerId}`
      );
    });

    // --------------------------------
    // DISCONNECT
    // --------------------------------

    socket.on("disconnect", () => {
      console.log(
        "DISCONNECTED:",
        socket.id
      );

      removeFromWaiting(socket.id);

      const partnerId =
        partners.get(socket.id);

      if (!partnerId) {
        return;
      }

      partners.delete(socket.id);
      partners.delete(partnerId);

      const roomId =
        userRooms.get(socket.id);

      userRooms.delete(socket.id);
      userRooms.delete(partnerId);

      const partnerSocket =
        io.sockets.sockets.get(partnerId);

      partnerSocket?.leave(roomId ?? "");

      io.to(partnerId).emit(
        "stranger-left"
      );

      console.log(
        `${socket.id} disconnected`
      );
    });
  });

  httpServer.listen(port, () => {
    console.log(
      `> Ready on http://${hostname}:${port}`
    );
  });
});
