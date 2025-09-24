
import { io } from "socket.io-client";

const URL = "http://localhost:7777";

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
