"use client";
import { Card } from "@/components/Room/ui/card";
import { Button } from "@/components/Room/ui/button";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/context/socketContext";

import usePeer from "@/hooks/usePeer";
import useStream from "@/hooks/useMediaStream";
import PeerVideo from "../PeerVideo";

export function SharingArea({ roomId, user }) {
  const socket = useSocket();
  const { push } = useRouter();
  const { peer, myId: peerId, isPeerReady } = usePeer(roomId, user.id);
  const { stream, isSuccess, toggleAudio, toggleVideo, muted, visible } =
    useStream();
  const [sharedScreens, setSharedScreens] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [foucsedScreen, setFocusedScreen] = useState(null);
  const screensPerPage = 4;

  useEffect(() => {
    if (!isPeerReady || !peer || !socket || !isSuccess) return;
    socket.on("user:peerConnected", (userId) => {
      const call = peer.call(userId, stream);
      call.on("stream", (stream) => {
        setSharedScreens((prev) => {
          const streams = prev.filter((s) => s.stream.id !== stream.id);
          return [...streams, { stream, muted }];
        });
      });

      socket.on("user:peerDisconnected", (streamId) => {
        setSharedScreens((prev) => {
          return prev.filter((s) => s.id !== streamId);
        });
      });
    });

    peer.on("call", (call) => {
      call.answer(stream);
      setSharedScreens((prev) => {
        const streams = prev.filter((s) => s.stream.id !== stream.id);
        return [...streams, { stream, muted }];
      });
      call.on("stream", (friendstream) => {
        if (friendstream.id === stream.id) return;
        setSharedScreens((prev) => {
          const streams = prev.filter((s) => s.stream.id !== friendstream.id);
          return [...streams, { stream: friendstream, muted }];
        });
      });
    });

    socket.on("peer:toggleAudio", ({ streamId, muted }) => {
      const streams = sharedScreens.map((s) => {
        if (s.stream.id === streamId) {
          s.muted = muted;
        }
        return s;
      });
      setSharedScreens(streams);
    });

    return () => {
      socket.off("user:peerConnected");
      socket.off("user:peerDisconnected");
    };
  }, [isPeerReady, peer, socket, peerId, stream, sharedScreens]);

  const leaveRoom = async () => {
    // close mediaDevices
    stream.getTracks().forEach((track) => track.stop());
    if (peer) {
      peer.disconnect();
      peer.destroy();
    }

    socket.emit("user:leaveRoom", {
      roomId,
      userId: user.id,
    });
    socket.emit("peer:leave", { roomId, streamId: stream.id });
    push("/");
  };

  const calculateGrid = () => {
    const endIndex = startIndex + screensPerPage;
    return sharedScreens.slice(startIndex, endIndex).map((screen, index) => {
      return index % 2 === 0
        ? `${index / 2 + 1} / 2`
        : `${(index - 1) / 2 + 1} / 2`;
    });
  };
  const handleScreenClick = (screen) => {
    setFocusedScreen(screen);
  };

  const handleNextClick = () => {
    const nextIndex = startIndex + screensPerPage;
    if (nextIndex < sharedScreens.length) {
      setStartIndex(nextIndex);
    }
  };

  const handlePrevClick = () => {
    console.log(startIndex);
    const prevIndex = startIndex - screensPerPage;
    if (prevIndex >= 0) {
      setStartIndex(prevIndex);
    }
  };

  const handleToggleAudio = () => {
    stream.muted = !muted;
    toggleAudio(stream);
    socket.emit("peer:toggleAudio", { roomId, streamId: stream.id, muted });
  };

  const handleToggleVideo = () => {
    console.log("toggle video", visible);
    console.log("toggle audio", muted);
    toggleVideo();
    // socket.emit("peer:toggleVideo", { roomId, streamId: stream.id });
  };
  return (
    <div className="col-span-2 flex flex-col gap-4 p-4 overflow-hidden relative">
      <h2 className="text-xl font-semibold">Screen Sharing</h2>
      {foucsedScreen && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white w-3/4 h-3/4">
            <div className="flex justify-between items-center p-4">
              <h3 className="text-lg font-semibold">Screen</h3>
              <button
                onClick={() => setFocusedScreen(null)}
                className="bg-red-500 text-white p-2 rounded-md"
              >
                Close
              </button>
            </div>
            <div className="flex justify-center">
              <PeerVideo stream={foucsedScreen} />
            </div>
          </div>
        </div>
      )}

      {sharedScreens.length > 0 && (
        <div
          className={`grid grid-cols-2`}
          style={{ gridTemplateRows: calculateGrid() }}
        >
          {sharedScreens
            .slice(startIndex, startIndex + screensPerPage)
            .map(({ stream: screen, muted: isMuted }, index) => (
              <Card
                key={index}
                className="border p-4 rounded-md"
                onClick={() => handleScreenClick(screen)}
              >
                <div>
                  <h3 className="text-lg font-semibold">
                    Screen {index + startIndex + 1}
                  </h3>
                  <p className="text-sm text-gray-500">Shared by:user</p>
                  <div className="flex justify-center">
                    <PeerVideo
                      isMe={isMuted}
                      stream={screen}
                      className="rounded-full aspect-video object-cover h-28 w-28"
                    />
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )}
      <div className="flex gap-4  ">
        {startIndex - screensPerPage >= 0 && (
          <Button variant="outline" onClick={handlePrevClick}>
            Prev
          </Button>
        )}
        {/* make space between prev and next button */}
        <div className="flex-grow"></div>
        {startIndex + screensPerPage < sharedScreens.length && (
          <Button variant="outline" onClick={handleNextClick}>
            Next
          </Button>
        )}
      </div>
      <div className="flex gap-4 flex-wrap mt-auto">
        <Button variant="outline" onClick={handleToggleAudio}>
          <IconCamera className="h-6 w-6 mr-2" />
          Mute Audio
        </Button>
        <Button variant="outline" onClick={handleToggleVideo}>
          <IconCamera className="h-6 w-6 mr-2" />
          Camera
        </Button>
        <Button variant="outline" onClick={(e) => console.log("share screen")}>
          <IconVideocamera className="h-6 w-6 mr-2" />
          Share Screen
        </Button>
        <button
          onClick={leaveRoom}
          className="bg-red-500 text-white p-2 rounded-md w-full"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}

function IconVideocamera(props) {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function IconCamera(props) {
  return (
    <svg
      {...props}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}
