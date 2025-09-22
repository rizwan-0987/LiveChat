import axios from 'axios'
import React, { useEffect } from 'react'
import { BASE_URL } from '../utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { addConnection } from '../utils/connectionSlice'
import { Link } from 'react-router-dom'

const Conections = () => {
    const connections = useSelector((store)=>store.connection)
    const dispatch = useDispatch();
    const fetchConnections = async () => {
        try {
            const res = await axios.get(BASE_URL + "/user/connections", { withCredentials: true })
            console.log(res.data[0].firstName);
            dispatch(addConnection(res.data))
        } catch (error) {
            //todo error
        }
    }
        useEffect(() => {
            
            fetchConnections()

        }, []);
    
    if (!connections) return;
    if (connections.length ===0) {
        return <h1>no connection found</h1>
    }
        return (
          <div className=" text-center my-10">
            <h1 className="text-bold text-2xl"> Connection</h1>

            {connections.map((connection) => (
              <div
                key={connection._id}
                className="m-4 p-4 bg-base-300 rounded-xl flex justify-between"
              >
                <div className="flex">
                  <img
                    className="w-20 h-20 mx-5 rounded-full"
                    src={connection.photoUrl}
                    alt="profile image"
                  />
                  <div className="flex flex-col">
                    <h3 className="self-start text-2xl font-bold">
                      {connection.firstName + " " + connection.lastName}
                    </h3>
                    {connection.age && connection.gender && (
                      <h3 className="self-start">
                        {" "}
                        {connection.age + " " + connection.gender}
                      </h3>
                    )}
                    <h3>{connection.about}</h3>
                  </div>
                </div>
                <Link to={"/chat/" + connection._id}>
                  <button className="btn btn-primary">Chat</button>
                </Link>
              </div>
            ))}
          </div>
        );
    }

export default Conections
