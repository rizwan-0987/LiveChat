// import axios from 'axios'

// import { createSocketConnection } from "../utils/socket";
// import React, { useEffect, useState } from "react";

// import { BASE_URL } from '../utils/constants'
// import { useDispatch, useSelector } from 'react-redux'
// import { addConnection } from '../utils/connectionSlice'
// import { Link } from 'react-router-dom'

// const Conections = () => {
//   const connections = useSelector((store) => store.connection);

//   const [presence, setPresence] = useState({}); // { userId: { isOnline, lastSeen } }

//   const dispatch = useDispatch();
//   const fetchConnections = async () => {
//     try {
//       const res = await axios.get(BASE_URL + "/user/connections", {
//         withCredentials: true,
//       });
//       console.log(res.data[0].firstName);
//       dispatch(addConnection(res.data));
//     } catch (error) {
//       //todo error
//     }
//   };
//   useEffect(() => {
//     fetchConnections();
//   }, []);




// useEffect(() => {
//   if (!connections) return;
//   const socket = createSocketConnection();
//   const ids = connections.map((c) => c._id);
//   socket.emit("watchPresence", { userIds: ids });

//   const onSnapshot = (list) => {
//     const map = {};
//     list.forEach(
//       (u) => (map[u.userId] = { isOnline: u.isOnline, lastSeen: u.lastSeen })
//     );
//     setPresence(map);
//   };
//   const onPresence = (u) => {
//     setPresence((prev) => ({
//       ...prev,
//       [u.userId]: { isOnline: u.isOnline, lastSeen: u.lastSeen },
//     }));
//   };

//   socket.on("presenceSnapshot", onSnapshot);
//   socket.on("presence", onPresence);
//   return () => {
//     socket.off("presenceSnapshot", onSnapshot);
//     socket.off("presence", onPresence);
//   };
// }, [connections]);

// const formatLastSeen = (ts) =>
//   ts ? `last seen ${new Date(ts).toLocaleString()}` : "Offline";










//   if (!connections) return;
//   if (connections.length === 0) {
//     return <h1>no connection found</h1>;
//   }
//   return (
//     <div className=" text-center my-10">
//       <h1 className="text-bold text-2xl"> Connection</h1>

//       {connections.map((connection) => (

        
//         <div
//           key={connection._id}
//           className="m-4 p-4 bg-base-300 rounded-xl flex justify-between"
//         >
//           <div className="flex">
//             <img
//               className="w-20 h-20 mx-5 rounded-full"
//               src={connection.photoUrl}
//               alt="profile image"
//             />
//             <div className="flex flex-col">
//               <h3 className="self-start text-2xl font-bold">
//                 {connection.firstName + " " + connection.lastName}
//               </h3>
//               {connection.age && connection.gender && (
//                 <h3 className="self-start">
//                   {" "}
//                   {connection.age + " " + connection.gender}
//                 </h3>
//               )}
//               <h3>{connection.about}</h3>
//             </div>
//           </div>
//           <Link to={"/chat/" + connection._id}>
//             <button className="btn btn-primary">Chat</button>
//           </Link>
//         </div>
//       ))}
//     </div>
//   );
// }

// export default Conections
import axios from "axios";
import React, { useEffect, useState } from "react";
import { BASE_URL } from "../utils/constants";
import { useDispatch, useSelector } from "react-redux";
import { addConnection } from "../utils/connectionSlice";
import { Link } from "react-router-dom";
import { createSocketConnection } from "../utils/socket";

const Conections = () => {
  const connections = useSelector((store) => store.connection) || [];
  const [presence, setPresence] = useState({}); // { [userId]: { isOnline, lastSeen } }
  const dispatch = useDispatch();

  const fetchConnections = async () => {
    try {
      const res = await axios.get(BASE_URL + "/user/connections", {
        withCredentials: true,
      });
      dispatch(addConnection(Array.isArray(res.data) ? res.data : []));
    } catch (error) {
      // TODO: toast/log
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  // Watch presence for current list
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

  const formatLastSeen = (ts) =>
    ts ? `last seen ${new Date(ts).toLocaleString()}` : "Offline";

  if (!Array.isArray(connections) || connections.length === 0) {
    return <h1 className="p-6 text-center opacity-70">no connection found</h1>;
  }

  return (
    <div className="text-center my-10">
      <h1 className="text-bold text-2xl mb-4">Connection</h1>

      {connections.map((connection) => {
        const p = presence[String(connection._id)];
        return (
          <div
            key={connection._id}
            className="m-4 p-4 bg-base-300 rounded-xl flex justify-between items-center"
          >
            <div className="flex items-center">
              <img
                className="w-20 h-20 mx-5 rounded-full object-cover"
                src={connection.photoUrl}
                alt="profile"
              />
              <div className="flex flex-col items-start">
                <h3 className="text-2xl font-bold">
                  {(connection.firstName || "") +
                    " " +
                    (connection.lastName || "")}
                </h3>

                {connection.age && connection.gender && (
                  <h3>{connection.age + " " + connection.gender}</h3>
                )}

                {connection.about && (
                  <h3 className="opacity-70">{connection.about}</h3>
                )}

                {/* 👇 Presence badge */}
                <div className="mt-1">
                  {p?.isOnline ? (
                    <span className="badge badge-success">Online</span>
                  ) : (
                    <span className="badge">{formatLastSeen(p?.lastSeen)}</span>
                  )}
                </div>
              </div>
            </div>

            <Link to={"/chat/" + connection._id}>
              <button className="btn btn-primary">Chat</button>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Conections;
