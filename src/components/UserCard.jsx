import axios from "axios";
import { BASE_URL } from "../utils/constants";
import { useDispatch } from "react-redux";
import { removeFeed } from "../utils/feedSlice";

const UserCard = (user) => {
  const { _id, firstName, lastName, age, gender, photoUrl, about } = user.user;
  const dispatch = useDispatch();  
  const handleSendRequest = async(status , userId) => {
    const res = await axios.post(BASE_URL + "/request/send/" + status + "/" + userId, {}, { withCredentials: true });
    dispatch(removeFeed(userId))
  }
  
    return (
      <div className="card bg-base-300 w-96 shadow-sm rounded-2xl my-10">
        <figure>
          <img  className="rounded-2xl h-90 w-90 object-center" src={photoUrl} alt="Shoes" />
        </figure>
        <div className="card-body">
          <h2 className="card-title">{firstName + " " + lastName}</h2>
          {age && gender && <p>{age + " " + gender}</p>}
          <p>{about}</p>
          <div className="card-actions justify-end">
            <button
              className="btn btn-secondary"
              onClick={() => handleSendRequest("ignored", _id)}
            >
              Ignore
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSendRequest("interested", _id)}
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    );
  }


export default UserCard
