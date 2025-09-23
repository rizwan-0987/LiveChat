// AppShell.jsx
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { createSocketConnection } from "../utils/socket";

export default function AppShell({ children }) {
  const user = useSelector((s) => s.user);
  useEffect(() => {
    if (!user?._id) return;
    const socket = createSocketConnection();
    socket.emit("register", { userId: user._id });
  }, [user?._id]);

  return children;
}
