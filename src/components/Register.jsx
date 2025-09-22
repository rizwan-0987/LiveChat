import axios from "axios";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";
import { Link, useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constants";
import { LogoMark } from "./LogoMark";

const BG_URL =
  "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?q=80&w=1600&auto=format&fit=crop";

export default function Register() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [emailId, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        BASE_URL + "/signup",
        {
          emailId,
          password,
          firstName,
          lastName,
        },
        { withCredentials: true }
      );
      console.log(res.data.user);
      dispatch(addUser(res.data.user));
      navigate("/profile");
      setLoading(false);
    } catch (error) {
      setLoading(false);

      setError(error.response.data || "Something Went Wrong");
      console.log(error);
    }
  };

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(20,20,20,0.35), rgba(20,20,20,0.35)), url(${BG_URL})`,
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Logo — top-left */}
      <Link
        to="/"
        className="absolute top-4 left-4 inline-flex items-center gap-2 z-10"
      >
        <LogoMark className="w-8 h-8 text-white" />
        <span className="font-bold text-xl pb-2 text-white">LiveChat</span>
      </Link>

      {/* Card */}
      <div className="relative mt-7 w-full max-w-md z-10">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm opacity-70 mb-2">
              Register to start chatting
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* First name */}
                <div className="form-control">
                  <label className="label" htmlFor="firstName">
                    <span className="label-text">First name</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    className="input input-bordered w-full"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    type="text"
                    required
                    placeholder="First Name"
                  />
                </div>

                {/* Last name */}
                <div className="form-control">
                  <label className="label" htmlFor="lastName">
                    <span className="label-text">Last name</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    className="input input-bordered w-full "
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    type="text"
                    required
                    placeholder="Last Name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-control">
                <label className="label" htmlFor="email">
                  <span className="label-text">Email</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full "
                  value={emailId}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password */}
              <div className="form-control">
                <label className="label" htmlFor="password">
                  <span className="label-text">Password</span>
                </label>
                <div className="join w-full">
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? "text" : "password"}
                    placeholder="••••••••"
                    className="input input-bordered join-item w-full "
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="btn join-item"
                    onClick={() => setShowPwd((s) => !s)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>

                <p className="text-error text-xs mt-1">{error}</p>
              </div>

              {/* Submit */}
              <button
                onClick={handleRegister}
                className={`btn btn-primary w-full ${
                  loading ? "btn-disabled" : ""
                }`}
              >
                {loading && <span className="loading loading-spinner"></span>}
                <span className="ml-1">Register</span>
              </button>
            </div>

            {/* Footer */}
            <p className="text-sm text-center mt-3">
              Already having account?{" "}
              <Link to="/login" className="link link-primary">
                Login
              </Link>
            </p>
          </div>
        </div>

        {/* Small print */}
        <p className="text-xs opacity-60 text-center mt-3 text-white">
          By continuing you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
