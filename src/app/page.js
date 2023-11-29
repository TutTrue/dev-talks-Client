import Card from "@/components/Card";
import CardList from "@/components/CardList";
import Footer from "@/components/Footer.jsx";
import MultiSelect from "@/components/MultiSelect";
import Navbar from "@/components/NavBar";
import AddNewRoom from "@/components/NewRoom";
import PopupModal from "@/components/Popup";
import SearchBar from "@/components/SearchBar";
import { auth } from "@clerk/nextjs";
import axios from "axios";
// import { useSocket } from "@/context/socketContext";
// import { useEffect } from "react";

export default async function Home() {

  const { getToken } = auth();
  const rooms = await axios.get("http://localhost:8080/api/rooms")
  const options = await axios.get("http://localhost:8080/api/filters");
  // console.log(options.data)

  return (
    <>
      <main className="flex-grow">
        <Navbar />
        <div className="h-full m-auto max-w-[80%] mt-4">
          <SearchBar />
          <MultiSelect options={options.data} />
          <CardList rooms={rooms.data} token={await getToken()} />
        </div>
      </main>
      <Footer />
    </>
  );
}
