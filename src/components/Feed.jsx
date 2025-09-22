import axios from "axios"
import { BASE_URL } from "../utils/constants"
import { useDispatch, useSelector } from "react-redux"
import { addFeed } from "../utils/feedSlice"
import { useEffect } from "react"
import UserCard from "./UserCard"
const Feed = () => {
    const feed =useSelector((store)=>store.feed)
    const dispatch =useDispatch()
    const getFeed = async () => {
        if (feed) return;
       try {
         const res = await axios.get(BASE_URL + "/feed",{withCredentials:true});
         dispatch(addFeed(res.data));
       } catch (error) {
        //todo error
       }
    }
    useEffect(() => {
        
      getFeed()
    }, []);
  if (!feed) return;
if (feed.length <= 0 ) {
  return <div className="flex justify-center my-10"> NO User Available</div>
}
  return (
  feed && ( <div className="flex items-center justify-center ">
      <UserCard user ={ feed[0]}/>
    </div>
    ))
  
}

export default Feed
