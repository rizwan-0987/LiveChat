import { useRef, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { getSocket } from "../utils/socket"; 
import { BASE_URL } from "../utils/constants";

export const Chat = () => {
  const listRef = useRef(null);
  const socketRef = useRef(null);

  const { targetUserId } = useParams();

  const user = useSelector((s) => s.user);
  const connections = useSelector((s) => s.connection) || [];
  const userId = user?._id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [friendFetched, setFriendFetched] = useState(null);
  const friend = useMemo(() => {
    const fromList = connections.find(
      (c) => String(c._id) === String(targetUserId)
    );
    return fromList || friendFetched || null;
  }, [connections, targetUserId, friendFetched]);

  const [targetPresence, setTargetPresence] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!targetUserId) return setFriendFetched(null);

      const fromList = connections.find(
        (c) => String(c._id) === String(targetUserId)
      );
      if (fromList) {
        if (mounted) setFriendFetched(fromList);
        const hasAvatar = !!(
          fromList.photoUrl ||
          fromList.avatar ||
          fromList.profilePic ||
          fromList.imageUrl
        );
        if (!hasAvatar) {
          try {
            const { data } = await axios.get(
              `${BASE_URL}/user/${targetUserId}`,
              { withCredentials: true }
            );
            if (mounted)
              setFriendFetched((prev) => ({
                ...prev,
                ...(data?.user || data || {}),
              }));
          } catch {}
        }
        return;
      }

      try {
        const { data } = await axios.get(`${BASE_URL}/user/${targetUserId}`, {
          withCredentials: true,
        });
        if (mounted) setFriendFetched(data?.user || data || null);
      } catch {
        if (mounted) setFriendFetched(null);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [targetUserId, connections]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!targetUserId) {
        if (mounted) setMessages([]);
        return;
      }
      try {
        const { data } = await axios.get(`${BASE_URL}/chat/${targetUserId}`, {
          withCredentials: true,
        });
        const chatMessages = (data?.messages || []).map((m) => ({
          _id: m._id,
          userId: m.senderId?._id || m.senderId,
          firstName: m.senderId?.firstName,
          lastName: m.senderId?.lastName,
          text: m.text,
          createdAt: m.createdAt,
          status: m.status || "sent",
        }));
        if (mounted) setMessages(chatMessages);
      } catch {
        if (mounted) setMessages([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [targetUserId]);

  useEffect(() => {
    if (!userId) return;
    const socket = getSocket();
    socketRef.current = socket;
    return () => {
      socketRef.current = null;
    }; 
  }, [userId]);

  useEffect(() => {
    const socket = socketRef.current || getSocket();
    if (!socket || !userId || !targetUserId) return;

    const roomPayload = {
      userId: String(userId),
      targetUserId: String(targetUserId),
    };
    socket.emit("joinChat", roomPayload);

    const onMessageReceived = (payload) => {
      if (String(payload.userId) === String(userId)) return; // ignore echo
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            (payload._id && String(m._id) === String(payload._id)) ||
            (payload.tempId && m.tempId === payload.tempId)
        );
        return exists ? prev : [...prev, payload];
      });
    };

    const onMessageAck = (payload) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === payload.tempId
            ? {
                ...m,
                _id: payload._id,
                status: payload.status,
                createdAt: payload.createdAt,
              }
            : m
        )
      );
    };

    const onMessagesSeen = ({ messageIds, byUserId }) => {
      if (String(byUserId) !== String(targetUserId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(String(m._id)) ? { ...m, status: "seen" } : m
        )
      );
    };

    const onMessagesDelivered = ({ messageIds, toUserId }) => {
      if (String(toUserId) !== String(targetUserId)) return;
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(String(m._id)) ? { ...m, status: "delivered" } : m
        )
      );
    };

    socket.on("messageReceived", onMessageReceived);
    socket.on("messageAck", onMessageAck);
    socket.on("messagesSeen", onMessagesSeen);
    socket.on("messagesDelivered", onMessagesDelivered);

    return () => {
      socket.off("messageReceived", onMessageReceived);
      socket.off("messageAck", onMessageAck);
      socket.off("messagesSeen", onMessagesSeen);
      socket.off("messagesDelivered", onMessagesDelivered);
      socket.emit("leaveChat", roomPayload);
    };
  }, [userId, targetUserId]);

  useEffect(() => {
    const socket = socketRef.current || getSocket();
    if (!socket || !targetUserId) return;

    socket.emit("watchPresence", { userIds: [String(targetUserId)] });

    const flipToDeliveredIfOnline = (isOnline) => {
      if (!isOnline) return;
      setMessages((prev) =>
        prev.map((m) =>
          String(m.userId) === String(userId) && m.status === "sent"
            ? { ...m, status: "delivered" }
            : m
        )
      );
    };

    const onSnapshot = (list) => {
      const entry =
        list?.find((x) => String(x.userId) === String(targetUserId)) || null;
      setTargetPresence(entry);
      if (entry?.isOnline) flipToDeliveredIfOnline(true);
    };

    const onPresence = (u) => {
      if (String(u.userId) !== String(targetUserId)) return;
      setTargetPresence(u);
      if (u.isOnline) flipToDeliveredIfOnline(true);
    };

    socket.on("presenceSnapshot", onSnapshot);
    socket.on("presence", onPresence);

    return () => {
      socket.off("presenceSnapshot", onSnapshot);
      socket.off("presence", onPresence);
    };
  }, [targetUserId, userId]);

  useEffect(() => {
    const socket = socketRef.current || getSocket();
    if (!socket || !userId || !targetUserId) return;

    const hasUnseen = messages.some(
      (m) => String(m.userId) === String(targetUserId) && m.status !== "seen"
    );
    if (hasUnseen) {
      socket.emit("markSeen", {
        userId: String(userId),
        targetUserId: String(targetUserId),
      });
    }
  }, [messages, userId, targetUserId]);

  useEffect(() => {
    if (listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const socket = socketRef.current || getSocket();
    const text = newMessage.trim();
    if (!socket || !text || !userId || !targetUserId) return;

    const tempId =
      "tmp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    const payload = {
      _id: tempId,
      tempId,
      firstName: user.firstName,
      lastName: user.lastName,
      userId: String(userId),
      targetUserId: String(targetUserId),
      text,
      createdAt: new Date().toISOString(),
      status: "sent",
    };

    setMessages((prev) => [...prev, payload]);
    setNewMessage("");
    socket.emit("sendMessage", payload);
  };

  const headerName = useMemo(() => {
    const n = `${friend?.firstName ?? ""} ${friend?.lastName ?? ""}`.trim();
    if (n) return n;
    const other = messages.find((m) => String(m.userId) !== String(userId));
    return other
      ? `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim()
      : "Chat";
  }, [friend, messages, userId]);

  const isOnline = !!targetPresence?.isOnline;
  const lastSeenText = targetPresence?.lastSeen
    ? `last seen ${new Date(targetPresence.lastSeen).toLocaleString()}`
    : "";

  const avatarSrc =
    friend?.photoUrl ||
    friend?.avatar ||
    friend?.profilePic ||
    friend?.imageUrl ||
    null;

  const initials =
    `${friend?.firstName?.[0] || ""}${
      friend?.lastName?.[0] || ""
    }`.toUpperCase() || "U";

  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return messages.filter((m) => {
      const key = String(m._id || m.tempId);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [messages]);

  return (
    <div className="w-[90%] mx-auto border border-gray-600 m-5 h-[83vh] flex flex-col">
      <div className="p-5 border-b border-gray-600 flex items-center gap-3">
        <div className="relative w-10 h-10">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
              <span className="text-sm font-semibold">{initials}</span>
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-base-100 ${
              isOnline ? "bg-green-500" : "bg-gray-400"
            }`}
            title={isOnline ? "Online" : "Offline"}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">{headerName}</span>
          <span className="text-xs opacity-70">
            {isOnline ? "Online" : lastSeenText}
          </span>
        </div>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-5">
        {uniqueMessages.map((msg, index) => {
          const mine = String(userId) === String(msg.userId);
          return (
            <div
              key={msg._id ?? index}
              className={`chat ${mine ? "chat-end" : "chat-start"}`}
            >
              <div className="chat-header">
                {`${msg.firstName ?? ""} ${msg.lastName ?? ""}`}
                <time className="text-xs opacity-50 ml-2">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString()
                    : ""}
                </time>
              </div>
              <div className="chat-bubble">{msg.text}</div>

              {mine && (
                <div className="chat-footer opacity-70 flex items-center gap-1">
                  <Ticks status={msg.status} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-5 border-t border-gray-600 flex items-center gap-2">
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="input input-bordered flex-1"
          placeholder="Type a message…"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} className="btn btn-secondary">
          Send
        </button>
      </div>
    </div>
  );
};

function Ticks({ status }) {
  if (status === "seen") return <DoubleTick className="text-sky-500" />;
  if (status === "delivered") return <DoubleTick className="text-gray-400" />;
  return <SingleTick className="text-gray-400" />;
}

function SingleTick({ className = "" }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 6L9 17l-5-5"
      />
    </svg>
  );
}

function DoubleTick({ className = "" }) {
  return (
    <svg
      className={`w-5 h-5 ${className}`}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
    >
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M28 8L16 20l-5-5"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M24 8L12 20l-5-5"
      />
    </svg>
  );
}
