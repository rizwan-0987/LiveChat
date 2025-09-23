import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Body from "./components/Body";
import Login from "./components/Login";
import { Provider } from "react-redux";
import { appStore } from "./utils/appSrore";
import Feed from "./components/Feed";
import Profile from "./components/Profile";
import Conections from "./components/Conections";
import Requests from "./components/Requests";
import Register from "./components/Register";
import { Chat } from "./components/Chat";
import AppShell from "./components/AppShell";

function App() {





  
  return (
    <>
      <Provider store={appStore}>
        <AppShell>
          <BrowserRouter basename="/">
            {/* <Routes>
            <Route path="/" element={<Body />}>
              <Route path="/" element={<Feed />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register/>} />

              <Route path="/profile" element={<Profile />} />
              <Route path="/conections" element={<Conections />} />
              <Route path="/requests" element={<Requests />} />
            </Route>
          </Routes> */}

            <Routes>
              {/* Public routes (no Body, no auth check) */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected shell (Body does auth check and renders Outlet) */}
              <Route path="/" element={<Body />}>
                <Route index element={<Feed />} /> {/* "/" */}
                <Route path="profile" element={<Profile />} />
                <Route path="conections" element={<Conections />} />
                <Route path="requests" element={<Requests />} />
                <Route path="/chat/:targetUserId" element={<Chat />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AppShell>
      </Provider>
    </>
  );
}

export default App;
