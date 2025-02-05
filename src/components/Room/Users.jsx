"use client";
import {
  AvatarImage,
  AvatarFallback,
  Avatar,
} from "@/components/Room/ui/avatar";
import { Card } from "@/components/Room/ui/card";
import { Button } from "@/components/Room/ui/button";
import { Badge } from "@/components/Room/ui/badge";
import axios from "axios";
import { useSocket } from "@/context/socketContext";
import { onUserJoined, onUserLeft } from "@/socket/user";
import { useEffect, useState } from "react";

export function UsersArea({ currentRoomId, user }) {
  axios.defaults.withCredentials = true;

  const [data, setData] = useState({});
  const socket = useSocket();
  const [roomUsersList, setRoomUsersList] = useState([]);

  useEffect(() => {
    axios
      .get(`${process.env.SERVER_API_URL}rooms/${currentRoomId}`, {
        data: {
          roomUsers: true,
        },
        headers: {
          "Cache-Control": "no-cache", //disable cache
        },
      })
      .then((res) => {
        setData(res.data);
        setRoomUsersList(res.data.roomUsers);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  useEffect(() => {
    if (!socket) return;
    onUserJoined(socket, setRoomUsersList);
    onUserLeft(socket, setRoomUsersList);

    return () => {
      socket.off("user:joined");
      socket.off("user:left");
      socket.emit("user:leaveRoom", { currentRoomId, userId: user.id });
    };
  }, [socket]);

  const { id, hostId, coHostId } = data;

  return (
    <div className="col-span-1 flex flex-col gap-4 p-4 overflow-y-scroll relative">
      {/* position:relative; height:500px; overflow-x:hidden; left: 0; */}
      <h2 className="text-xl font-semibold ">Users</h2>
      <div className="flex flex-col gap-4">
        {/* style="position: absolute; width: 300px" */}
        {roomUsersList.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            hostId={hostId}
            coHostId={coHostId}
          />
        ))}
      </div>
    </div>
  );
}

function UserCard({ user, hostId, coHostId }) {
  // TODO: make imageUrl and image the same
  const imageUrl = user.imageUrl || user.image;
  const { id, name } = user;
  const [isMuted, setIsMuted] = useState(false);
  const toggleMute = () => {
    setIsMuted((prevIsMuted) => !prevIsMuted);
  };
  return (
    <Card className="rounded-full flex items-center gap-4 p-4">
      <Avatar className="h-9 w-9 rounded-full">
        <AvatarImage src={imageUrl} alt={user.name} />
        <AvatarFallback>User</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h3 className="font-semibold">{name}</h3>
        {id === hostId && <Badge>Host</Badge>}
        {id === coHostId && <Badge>Co-Host</Badge>}
      </div>
      <Button size="icon" variant="ghost" onClick={toggleMute}>
        {isMuted ? (
          <IconVolumeoff className="w-6 h-6 " />
        ) : (
          <IconVolumeup className="w-6 h-6" />
        )}
        <span className="sr-only">
          {isMuted ? `Unmute ${name}` : `Mute ${name}`}
        </span>
      </Button>
    </Card>
  );
}

//off icon with another color
function IconVolumeoff(props) {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}

function IconVolumeup(props) {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </svg>
  );
}
