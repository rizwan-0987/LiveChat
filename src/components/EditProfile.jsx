import { useState } from "react";
import UserCard from "./UserCard";
import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { addUser } from "../utils/userSlice";

const EditProfile = (user) => {
  const [firstName, setFirstName] = useState(user.user.firstName || "");
  const [lastName, setLastName] = useState(user.user.lastName || "");
  const [photoUrl, setPhotoUrl] = useState(user.user.photoUrl || "");
  const [age, setAge] = useState(user.user.age || "");
  const [gender, setGender] = useState(user.user.gender || "");
  const [about, setAbout] = useState(user.user.about || "");
  const [error, setError] = useState("");
    const dispatch = useDispatch();
      const [showToast, setShowToast] = useState(false);



    const saveProfile = async () => {
      setError("")
    try {
      const res = await axios.patch(
        BASE_URL + "/profile/edit",
        { firstName, lastName, photoUrl, age, gender, about },
        {
          withCredentials: true,
        }
        );
        dispatch(addUser(res.data.data))
        setShowToast(true)
        setTimeout(() => {
                   setShowToast(false);
 
        }, 1500);
    } catch (error) {
        console.log(error.response.data);
      setError(error.response.data);
    }
  };

  return (
    <div className="flex justify-center gap-8">
      <div className="bg-base-300 w-96  p-6  rounded-2xl  ">
        <h2 className="card-title justify-center">Edit Profile</h2>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">First name</legend>
          <input
            type="text"
            value={firstName}
            className="input"
            placeholder="First name"
            onChange={(e) => {
              setFirstName(e.target.value);
            }}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Last name</legend>
          <input
            type="text"
            value={lastName}
            className="input"
            placeholder="Last name"
            onChange={(e) => {
              setLastName(e.target.value);
            }}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Photo Url</legend>
          <input
            type="text"
            value={photoUrl}
            className="input"
            placeholder="Photo Url"
            onChange={(e) => {
              setPhotoUrl(e.target.value);
            }}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Age</legend>
          <input
            type="text"
            value={age}
            className="input"
            placeholder="Age"
            onChange={(e) => {
              setAge(e.target.value);
            }}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">Gender</legend>
          <input
            type="text"
            value={gender}
            className="input"
            placeholder="Gender"
            onChange={(e) => {
              setGender(e.target.value);
            }}
          />
        </fieldset>

        <fieldset className="fieldset">
          <legend className="fieldset-legend">About</legend>
          <textarea
            className="textarea h-24"
            value={about}
            placeholder="About"
            onChange={(e) => {
              setAbout(e.target.value);
            }}
          ></textarea>
        </fieldset>
        <p className="text-red-600">{error}</p>
        <button className="btn btn-success mt-3" onClick={() => saveProfile()}>
          Confirm Edit
        </button>
      </div>
      <UserCard user={{ firstName, lastName, age, gender, photoUrl, about }} />
     {showToast && <div className="toast toast-top toast-center">
        <div className="alert alert-success">
          <span>Profile edit successfully.</span>
        </div>
      </div>}
    </div>
  );
};

export default EditProfile;
