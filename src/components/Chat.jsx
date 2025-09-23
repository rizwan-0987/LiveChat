// import { useRef ,useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import { createSocketConnection } from "../utils/socket";
// import { useSelector } from "react-redux";
// import axios from "axios";
// import { BASE_URL } from "../utils/constants";
// export const Chat = () => {
    
//     const listRef = useRef(null);

//   const { targetUserId } = useParams();
//     const [messages, setMessages] = useState([{ text: "hello how are you" }]);
//     const [newMessage, setNewMessage] = useState("")
//     const user = useSelector((store) => store.user)
//  console.log(user)
//     const userId = user?._id

//     const fetchChatMessages = async () => {
//         const chat = await axios.get(BASE_URL + "/chat/" + targetUserId, { withCredentials: true })
//         console.log(chat.data.messages)
//         const chatMessages = chat?.data?.messages.map((msg) => {
//             const{senderId ,text}=msg
//           return {
//             firstName: senderId?.firstName,
//             lastName: senderId?.lastName,
//             text: text,
//           };
//         });
//        setMessages(chatMessages)
//     }
    
//     useEffect(() => {
//         fetchChatMessages()
       
//     }, []);


//     useEffect(() => {
//       if (!userId) return;
//       const socket = createSocketConnection();
    

//       socket.emit("joinChat", {
//         firstName: user.firstName,
//         targetUserId,
//         userId,
//       });

//       socket.on("messageReceived", ({ firstName, lastName, text }) => {
//         console.log(firstName + " " + text);
//         setMessages((messages) => [...messages, { firstName, lastName, text }]);
//       });
//       return () => {
//         socket.disconnect();
//       };
//     }, [userId, targetUserId]);
    
//     const sendMessage = () => {
//                 const socket = createSocketConnection();

//         socket.emit("sendMessage", {
//             firstName: user.firstName,
//             lastName: user.lastName,
//             userId,
//             targetUserId,
//             text: newMessage
//         })
//         setNewMessage("");
//     }
// useEffect(() => {
//   if (listRef.current) {
//     listRef.current.scrollTop = listRef.current.scrollHeight;
//   }
// }, [messages]);
//   return (
//     <div className="w-[90%] mx-auto border border-gray-600 m-5 h-[83vh] flex flex-col">
//       <h1 className="p-5 border-b border-gray-600">Chat</h1>
//       <div ref={listRef} className="flex-1 overflow-scroll p-5">
//         {messages.map((msg, index) => {
//           return (
//             <div
//               key={index}
//               className={`chat ${
//                 user?.firstName === msg?.firstName ? "chat-end" : "chat-start"
//               }`}
//             >
//               <div className="chat-header">
//                 {`${msg.firstName} ${msg.lastName}`}
//                 <time className="text-xs opacity-50">2 hours ago</time>
//               </div>
//               <div className="chat-bubble">{msg.text}</div>
//               <div className="chat-footer opacity-50">Seen</div>
//             </div>
//           );
//         })}
//       </div>
//       <div className="p-5 border-t border-gray-600 flex items-center gap-2">
//         <input
//           value={newMessage}
//           onChange={(e) => setNewMessage(e.target.value)}
//           className="flex-1 border border-gray-500 rounded p-2"
//         />
//         <button onClick={sendMessage} className="btn btn-secondary">
//           Send
//         </button>
//       </div>
//     </div>
//   );
// };



// Chat.jsx
/// Chat.jsx
import { useRef, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { createSocketConnection } from "../utils/socket";
import { BASE_URL } from "../utils/constants";

export const Chat = () => {
  const listRef = useRef(null);
  const socketRef = useRef(null);

  const { targetUserId } = useParams();

  const user = useSelector((s) => s.user);
  const connections = useSelector((s) => s.connection) || []; // ⬅️ use the same data as Connections page
  const userId = user?._id;

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // if friend isn't in connections yet, we fetch a minimal profile as fallback
  const [friendFetched, setFriendFetched] = useState(null);
  const friend = useMemo(() => {
    const fromList = connections.find((c) => String(c._id) === String(targetUserId));
    return fromList || friendFetched || null;
  }, [connections, targetUserId, friendFetched]);

  // ---- Fallback: fetch friend only if not already in connections ----
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!targetUserId) return setFriendFetched(null);
      const fromList = connections.find((c) => String(c._id) === String(targetUserId));
      if (fromList) return setFriendFetched(null);

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

  // ---- Load history when target changes ----
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

  // ---- Socket: join room & live receive ----
  useEffect(() => {
    if (!userId || !targetUserId) return;

    const socket = createSocketConnection();
    socketRef.current = socket;

    const roomPayload = { userId: String(userId), targetUserId: String(targetUserId) };
    socket.emit("joinChat", roomPayload);

    const onMessageReceived = (payload) => {
      if (String(payload.userId) === String(userId)) return; // ignore self echo
      setMessages((prev) => [...prev, payload]);
    };

    socket.on("messageReceived", onMessageReceived);

    return () => {
      socket.off("messageReceived", onMessageReceived);
      socket.emit("leaveChat", roomPayload);
      socketRef.current = null;
    };
  }, [userId, targetUserId]);

  // ---- Presence: watch only this friend ----
  const [targetPresence, setTargetPresence] = useState(null);
  useEffect(() => {
    if (!targetUserId) return;
    const socket = createSocketConnection();
    socket.emit("watchPresence", { userIds: [String(targetUserId)] });

    const onSnapshot = (list) => setTargetPresence(list?.[0] || null);
    const onPresence = (u) => {
      if (String(u.userId) === String(targetUserId)) setTargetPresence(u);
    };

    socket.on("presenceSnapshot", onSnapshot);
    socket.on("presence", onPresence);
    return () => {
      socket.off("presenceSnapshot", onSnapshot);
      socket.off("presence", onPresence);
    };
  }, [targetUserId]);

  // ---- Auto-scroll on new messages ----
  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  // ---- Send message ----
  const sendMessage = () => {
    const socket = socketRef.current;
    const text = newMessage.trim();
    if (!socket || !text || !userId || !targetUserId) return;

    const payload = {
      firstName: user.firstName,
      lastName: user.lastName,
      userId: String(userId),
      targetUserId: String(targetUserId),
      text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, payload]); // optimistic
    setNewMessage("");
    socket.emit("sendMessage", payload);
  };

  // ---- Header info ----
  const headerName = useMemo(() => {
    const n = `${friend?.firstName ?? ""} ${friend?.lastName ?? ""}`.trim();
    if (n) return n;
    const other = messages.find((m) => String(m.userId) !== String(userId));
    return other ? `${other.firstName ?? ""} ${other.lastName ?? ""}`.trim() : "Chat";
  }, [friend, messages, userId]);

  const isOnline = !!targetPresence?.isOnline;
  const lastSeenText = targetPresence?.lastSeen
    ? `last seen ${new Date(targetPresence.lastSeen).toLocaleString()}`
    : "";

  // base64 data URL works directly:
  const avatarSrc =
    friend?.photoUrl || friend?.avatar || friend?.profilePic || friend?.imageUrl || null;

  const initials = `${friend?.firstName?.[0] || ""}${friend?.lastName?.[0] || ""}`
    .toUpperCase() || "U";

  return (
    <div className="w-[90%] mx-auto border border-gray-600 m-5 h-[83vh] flex flex-col">
      {/* Header with avatar + status dot + name + presence */}
      <div className="p-5 border-b border-gray-600 flex items-center gap-3">
        <div className="relative w-10 h-10">
          {avatarSrc ? (
            <img
              src={avatarSrc} // ⬅️ base64 from connections works here
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
            aria-label={isOnline ? "Online" : "Offline"}
            title={isOnline ? "Online" : "Offline"}
          />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold">{headerName}</span>
          <span className="text-xs opacity-70">{isOnline ? "Online" : lastSeenText}</span>
        </div>
      </div>

      {/* Messages list */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-5">
        {messages.map((msg, index) => (
          <div
            key={msg._id ?? index}
            className={`chat ${String(userId) === String(msg.userId) ? "chat-end" : "chat-start"}`}
          >
            <div className="chat-header">
              {`${msg.firstName ?? ""} ${msg.lastName ?? ""}`}
              <time className="text-xs opacity-50 ml-2">
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : ""}
              </time>
            </div>
            <div className="chat-bubble">{msg.text}</div>
          </div>
        ))}
      </div>

      {/* Composer */}
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
