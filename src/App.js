import Authorization from "./components/Authorization";
import './styles/App.css'
import { BrowserRouter, Route, Routes, useLocation} from "react-router-dom";
import Profile from "./components/Profile";
import NavigationBar from "./components/NavigationBar";
import Events from "./components/Events";
import Calendar from "./components/Calendar"
import EventsOnDay from "./components/EventsOnDay";
import Event from "./components/Event";
import Team from "./components/Team";
import Archive from "./components/Archive";
import Folder from "./components/Folder";

function App() {
  return (
    <BrowserRouter>
      <div className="flex">
        <Navbar/>
        <Routes>
          <Route path='/' element={<Authorization/>}/> 
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/calendar' element={<Calendar/>}/>
          <Route path='/events' element={<Events/>}/>
          <Route path='/event-page' element={<EventsOnDay/>}/>
          <Route path='/event' element={<Event/>}/>
          <Route path='/team' element={<Team/>}/>
          <Route path='/archive' element={<Archive/>}/>
          <Route path='/folder' element={<Folder/>}/>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const Navbar = () => {
  const location = useLocation();
  return location.pathname !== '/' ?<NavigationBar/>:<></>;
};

export default App;
