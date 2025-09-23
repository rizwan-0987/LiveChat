// import { io } from "socket.io-client";
// import { BASE_URL } from "./constants";

// export const createSocketConnection = () => {
//     return io(BASE_URL)
// }


// /src/utils/socket.js
import { io } from "socket.io-client";

const URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:7777";

let socket;
export function createSocketConnection() {
    if (!socket) {
        socket = io(URL, {
            withCredentials: true,
            transports: ["websocket"],
            autoConnect: true,
        });
    }
    return socket;
}
export function getSocket() {
    return socket;
}
