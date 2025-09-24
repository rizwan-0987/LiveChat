
import React, { useEffect, useState } from "react";   
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { removeUser } from "../utils/userSlice";
import { removeFeed } from "../utils/feedSlice";
import { createSocketConnection } from "../utils/socket";  


const Navbar = () => {
  const user = useSelector((store) => store.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post(
        BASE_URL + "/logout",
        {},
        {
          withCredentials: true,
        }
      );
      dispatch(removeUser());
      dispatch(removeFeed());
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
  };

  const AvatarFallback = ({ letter = "U" }) => (
    <div className="bg-neutral text-neutral-content rounded-full w-10 flex items-center justify-center">
      <span className="font-semibold">{letter[0]?.toUpperCase()}</span>
    </div>
  );

useEffect(() => {
  if (!user?._id) return;
  const socket = createSocketConnection();
  socket.emit("register", { userId: user._id }); 
}, [user?._id]);


  return (
    <div className="navbar bg-base-200/80 backdrop-blur supports-[backdrop-filter]:bg-base-200/60 sticky top-0 z-50 ">
      <div className="flex-1 flex items-center ">
        <div className="dropdown lg:hidden ">
          <label
            tabIndex={0}
            className="btn btn-ghost"
            onClick={() => setIsMenuOpen((s) => !s)}
            aria-label="Open menu"
            aria-expanded={isMenuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </label>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-56"
            onClick={() => setIsMenuOpen(false)}
          >
            <li>
              <Link to="/">Home</Link>
            </li>

            {user ? (
              <>
                
                <li>
                  <Link to="/conections">Connections</Link>
                </li>
                <li>
                  <Link to="/requests">Requests</Link>
                </li>
               
              </>
            ) : (
              <>
                <li>
                  <Link to="/login">Login</Link>
                </li>
                <li>
                  <Link to="/register">Register</Link>
                </li>
              </>
            )}
          </ul>
        </div>

        <Link to="/" className=" mx-3 font-bold btn-ghost text-xl">
          Live Chat
        </Link>
      </div>

      <div className="flex items-center mx-2">
        <ul className="menu menu-horizontal px-1 hidden lg:flex">
          <li>
            <Link to="/">Home</Link>
          </li>
          {user ? (
            <>
             
              <li>
                <Link to="/conections">Connections</Link>
              </li>
              <li>
                <Link to="/requests">Requests</Link>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>

        {user && (
          <div className="dropdown dropdown-end ml-2 ">
            <div
              tabIndex={0}
              role="button"
              className="btn btn-ghost btn-circle avatar"
              aria-label="Open user menu"
            >
              <div className="w-10 rounded-full overflow-hidden">
                {user.photoUrl ? (
                  <img alt="User avatar" src={user.photoUrl} />
                ) : (
                  <AvatarFallback letter={user.firstName || "U"} />
                )}
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-56 p-2 shadow"
            >
              <li className="menu-title">
                <span>Welcome {user.firstName}</span>
              </li>
              <li>
                <Link to="/profile" className="justify-between">
                  Profile <span className="badge">New</span>
                </Link>
              </li>
             
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
