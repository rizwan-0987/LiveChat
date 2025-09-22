import axios from 'axios'
import React, { useEffect } from 'react'
import { BASE_URL } from '../utils/constants'
import { useDispatch, useSelector } from 'react-redux'
import { addRequest, removeRequest } from '../utils/requestSlice'

const Requests = () => {
    const requests = useSelector((store)=>store.request)
    const dispatch = useDispatch();

    const reviewRequest = async (status,userId) => {
        const res = await axios.post(BASE_URL + "/req/review/" + status + "/" + userId, {}, { withCredentials: true });
        dispatch(removeRequest(userId))
    }

    const fetchRequest = async () => {
        const res = await axios.get(BASE_URL + "/user/requests/received", { withCredentials: true });
        console.log(res.data)
        dispatch(addRequest(res.data))
    }
    useEffect(() => {
        
        fetchRequest();     
    }, []);

   if (!requests) return;
   if (requests.length === 0) {
     return (
       <h1 className="text-center my-10 font-bold text-2xl">
         No Request found
       </h1>
     );
   }
   return (
     <div className="text-center my-10">
       <h1 className="font-bold text-2xl"> Requests</h1>

           {requests.map((request,idx) => {
               const { photoUrl, firstName, lastName, age, gender, about } = request.fromUserId;
               return (
                 <div key={idx} className="m-4 p-4 bg-base-300 rounded-xl flex">
                   <img
                     className="w-20 h-20 mx-5 rounded-full"
                     src={photoUrl}
                     alt="profile image"
                   />
                   <div className="flex flex-col">
                     <h3 className="self-start text-2xl font-bold">
                       {firstName + " " + lastName}
                     </h3>
                     {age && gender && (
                       <h3 className="self-start"> {age + " " + gender}</h3>
                     )}
                     <h3 className="text-start">{about}</h3>
                   </div>
                   <div className="w-full flex justify-end my-5 gap-5">
                     <button
                       className="btn btn-primary self-end px-7"
                       onClick={() => reviewRequest("accepted", request._id)}
                     >
                       Accept
                     </button>
                     <button
                       className="btn btn-secondary self-end px-7"
                       onClick={() => reviewRequest("rejected", request._id)}
                     >
                       Reject
                     </button>
                   </div>
                 </div>
               );
           } )}
     </div>
   );
}

export default Requests
