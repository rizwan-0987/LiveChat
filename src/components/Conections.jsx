
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addConnection } from "../utils/connectionSlice";
import { Link } from "react-router-dom";
import { createSocketConnection } from "../utils/socket";

const Conections = () => {
  const connections = useSelector((store) => store.connection) || [];
  const user = useSelector((s) => s.user);

  const [presence, setPresence] = useState({});   
  const [threadMap, setThreadMap] = useState({}); 

  const dispatch = useDispatch();

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await axios.get(BASE_URL + "/user/connections", {
          withCredentials: true,
        });
        dispatch(addConnection(Array.isArray(res.data) ? res.data : []));
      } catch (error) {
      }
    };
    fetchConnections();
  }, [dispatch]);

  const loadThreadsSummary = async () => {
    if (!user?._id) return;
    try {
      const res = await axios.get(BASE_URL + "/chat/threads-summary", {
        withCredentials: true,
      });
      setThreadMap(res.data?.threads || {});
    } catch {
      setThreadMap({});
    }
  };

  useEffect(() => {
    loadThreadsSummary();
  }, [user?._id]);

  useEffect(() => {
    const onFocus = () => loadThreadsSummary();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    if (!Array.isArray(connections) || connections.length === 0) return;

    const socket = createSocketConnection();
    const ids = [...new Set(connections.map((c) => String(c._id)))];

    socket.emit("watchPresence", { userIds: ids });

    const onSnapshot = (list) => {
      const map = {};
      (list || []).forEach((u) => {
        map[String(u.userId)] = {
          isOnline: !!u.isOnline,
          lastSeen: u.lastSeen || null,
        };
      });
      setPresence(map);
    };

    const onPresence = (u) => {
      if (!u) return;
      setPresence((prev) => ({
        ...prev,
        [String(u.userId)]: {
          isOnline: !!u.isOnline,
          lastSeen: u.lastSeen || null,
        },
      }));
    };

    socket.on("presenceSnapshot", onSnapshot);
    socket.on("presence", onPresence);

    return () => {
      socket.off("presenceSnapshot", onSnapshot);
      socket.off("presence", onPresence);
    };
  }, [connections]);

  useEffect(() => {
    if (!user?._id) return;
    const socket = createSocketConnection();

    const onMessageReceived = (payload) => {
      if (String(payload.targetUserId) !== String(user._id)) return; // I'm the recipient
      const fromId = String(payload.userId);
      setThreadMap((prev) => {
        const cur = prev[fromId] || {};
        return {
          ...prev,
          [fromId]: {
            unreadCount: (cur.unreadCount || 0) + 1,
            lastMessageText: payload.text,
            lastMessageAt: payload.createdAt,
            lastMessageSenderId: String(payload.userId),
          },
        };
      });
    };

    const onMessageAck = (payload) => {
      if (String(payload.userId) !== String(user._id)) return;
      const toId = String(payload.targetUserId);
      setThreadMap((prev) => {
        const cur = prev[toId] || {};
        return {
          ...prev,
          [toId]: {
            unreadCount: cur.unreadCount || 0,
            lastMessageText: payload.text,
            lastMessageAt: payload.createdAt,
            lastMessageSenderId: String(payload.userId),
          },
        };
      });
    };

    const onUnreadReset = ({ withUserId }) => {
      const id = String(withUserId);
      setThreadMap((prev) => {
        const cur = prev[id] || {};
        return { ...prev, [id]: { ...cur, unreadCount: 0 } };
      });
    };

    socket.on("messageReceived", onMessageReceived);
    socket.on("messageAck", onMessageAck);
    socket.on("unreadReset", onUnreadReset);

    return () => {
      socket.off("messageReceived", onMessageReceived);
      socket.off("messageAck", onMessageAck);
      socket.off("unreadReset", onUnreadReset);
    };
  }, [user?._id]);

  const handleOpenChat = (friendId) => {
    setThreadMap((prev) => {
      const cur = prev[friendId] || {};
      return { ...prev, [friendId]: { ...cur, unreadCount: 0 } };
    });
  };

  const formatLastSeen = (ts) =>
    ts ? `last seen ${new Date(ts).toLocaleString()}` : "Offline";

  const formatTime = (ts) =>
    ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const truncate = (s = "", n = 56) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

  if (!Array.isArray(connections) || connections.length === 0) {
    return <h1 className="p-6 text-center opacity-70">no connection found</h1>;
  }

  return (
    <div className="text-center my-10">
      <h1 className="text-bold text-2xl mb-4">Connection</h1>

      {connections.map((connection) => {
        const id = String(connection._id);
        const p = presence[id];
        const t = threadMap[id] || {};
        const unreadCount = t.unreadCount || 0;
        const displayCount = unreadCount > 99 ? "99+" : unreadCount;

        const lastMine =
          t.lastMessageSenderId &&
          user?._id &&
          String(t.lastMessageSenderId) === String(user._id);

        const lastPrefix = lastMine ? "You: " : "";
        const lastLine = t.lastMessageText ? `${lastPrefix}${t.lastMessageText}` : "Say hello 👋";

        return (
          <div
            key={id}
            className="m-4 p-4 bg-base-300 rounded-xl flex justify-between items-center"
          >
            <div className="flex items-center">
              <div className="relative mx-5">
                <img
                  className="w-20 h-20 rounded-full object-cover"
                  src={connection.photoUrl}
                  alt="profile"
                />
                {unreadCount > 0 && (
                  <span
                    className="badge badge-primary absolute -top-1 -right-1 text-xs"
                    title={`${displayCount} unread`}
                  >
                    {displayCount}
                  </span>
                )}
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-base-100 ${
                    p?.isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                  title={p?.isOnline ? "Online" : "Offline"}
                />
              </div>

              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">
                    {(connection.firstName || "") + " " + (connection.lastName || "")}
                  </h3>
                </div>

                <div className="mt-1 flex items-center gap-3 max-w-[46ch]">
                  <span className="text-sm opacity-80 truncate">
                    {truncate(lastLine, 56)}
                  </span>
                  <span className="text-xs opacity-50">{formatTime(t.lastMessageAt)}</span>
                </div>

                <div className="mt-1">
                  {p?.isOnline ? (
                    <span className="badge badge-success">Online</span>
                  ) : (
                    <span className="badge">{formatLastSeen(p?.lastSeen)}</span>
                  )}
                </div>
              </div>
            </div>

            <Link to={"/chat/" + id} onClick={() => handleOpenChat(id)}>
              <button className="btn btn-primary">Chat</button>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Conections;
