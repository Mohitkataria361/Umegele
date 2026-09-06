
"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { socket } from "@/lib/socket";
// import { error } from "console";

type Props = {
  initiator: boolean;
  matched: boolean;
  onConnectionChange: (connected: boolean) => void;
};

export default function WebRTCVideo({
  initiator,
  matched,
  onConnectionChange,

}: Props) {
  const localVideoRef =
    useRef<HTMLVideoElement>(null);

  const remoteVideoRef =
    useRef<HTMLVideoElement>(null);

  const peerRef =
    useRef<RTCPeerConnection | null>(null);

  const localStreamRef =
    useRef<MediaStream | null>(null);

  const pendingIceRef =
    useRef<RTCIceCandidateInit[]>([]);

  const [localReady, setLocalReady] =
    useState(false);

  const [remoteReady, setRemoteReady] =
    useState(false);

  const [micEnabled, setMicEnabled] =
    useState(true);

  const [cameraEnabled, setCameraEnabled] =
    useState(true);
  useEffect(() => {
    if (!matched) {
      return;
    }

    let stopped = false;
    // STUN - tries a direct peer-to-peer connection 
    //   // { urls: "stun:stun.l.google.com:19302", },
    //   // TURN - fallback when direct connection fails 
    //   ,],
    const createPeer = (iceServers: RTCIceServer[]) => {
      const peer =
        new RTCPeerConnection({
          iceServers: [...iceServers,
          {
            urls: "stun:stun.l.google.com:19302",
          },

          ],
          iceTransportPolicy: "all",
        });

      peerRef.current = peer;

      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        socket.emit(
          "webrtc-ice-candidate",
          {
            candidate:
              event.candidate.toJSON(),
          }
        );
      };

      peer.ontrack = (event) => {
        const stream =
          event.streams[0];

        if (
          remoteVideoRef.current &&
          stream
        ) {
          remoteVideoRef.current.srcObject =
            stream;

          setRemoteReady(true);
        }
      };

      peer.onconnectionstatechange =
        () => {
          console.log(
            "WebRTC:",
            peer.connectionState
          );

          if (
            peer.connectionState ===
            "connected"
          ) {
            setRemoteReady(true);
            onConnectionChange(true);
          }

          if (
            peer.connectionState ===
            "disconnected" ||
            peer.connectionState ===
            "failed" ||
            peer.connectionState ===
            "closed"
          ) {
            setRemoteReady(false);
            onConnectionChange(false);
          }
        };

      return peer;
    };

    const start = async () => {
      try {
        const response = await fetch("/api/turn");
        if (!response.ok) {
          throw new Error("Failed to fetch TURN servers");

        }
        const meter_ice = await response.json();
        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: true,
            }
          );

        if (stopped) {
          stream
            .getTracks()
            .forEach((track) =>
              track.stop()
            );

          return;
        }

        localStreamRef.current =
          stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject =
            stream;
        }

        setLocalReady(true);
        setMicEnabled(true);
        setCameraEnabled(true);

        const peer = createPeer(meter_ice);

        stream
          .getTracks()
          .forEach((track) => {
            peer.addTrack(
              track,
              stream
            );
          });

        if (initiator) {
          const offer =
            await peer.createOffer();

          await peer.setLocalDescription(
            offer
          );

          socket.emit(
            "webrtc-offer",
            {
              offer,
            }
          );
        }
      } catch (error) {
        console.error(
          "WebRTC error:",
          error
        );

        setLocalReady(false);
      }
    };

    const onOffer = async ({
      offer,
    }: {
      offer: RTCSessionDescriptionInit;
    }) => {
      const peer =
        peerRef.current;

      if (!peer) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          offer
        );

        for (const candidate of
          pendingIceRef.current) {
          await peer.addIceCandidate(
            candidate
          );
        }

        pendingIceRef.current =
          [];

        const answer =
          await peer.createAnswer();

        await peer.setLocalDescription(
          answer
        );

        socket.emit(
          "webrtc-answer",
          {
            answer,
          }
        );
      } catch (error) {
        console.error(
          "Offer error:",
          error
        );
      }
    };

    const onAnswer = async ({
      answer,
    }: {
      answer: RTCSessionDescriptionInit;
    }) => {
      const peer =
        peerRef.current;

      if (!peer) {
        return;
      }

      try {
        await peer.setRemoteDescription(
          answer
        );

        for (const candidate of
          pendingIceRef.current) {
          await peer.addIceCandidate(
            candidate
          );
        }

        pendingIceRef.current =
          [];
      } catch (error) {
        console.error(
          "Answer error:",
          error
        );
      }
    };

    const onIce = async ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      const peer =
        peerRef.current;

      if (!peer) {
        pendingIceRef.current.push(
          candidate
        );

        return;
      }

      if (!peer.remoteDescription) {
        pendingIceRef.current.push(
          candidate
        );

        return;
      }

      try {
        await peer.addIceCandidate(
          candidate
        );
      } catch (error) {
        console.error(
          "ICE error:",
          error
        );
      }
    };

    socket.on(
      "webrtc-offer",
      onOffer
    );

    socket.on(
      "webrtc-answer",
      onAnswer
    );

    socket.on(
      "webrtc-ice-candidate",
      onIce
    );

    start();

    return () => {
      stopped = true;

      socket.off(
        "webrtc-offer",
        onOffer
      );

      socket.off(
        "webrtc-answer",
        onAnswer
      );

      socket.off(
        "webrtc-ice-candidate",
        onIce
      );

      pendingIceRef.current =
        [];

      if (peerRef.current) {
        peerRef.current.close();
        peerRef.current = null;
      }

      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        localStreamRef.current =
          null;
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject =
          null;
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject =
          null;
      }

      setLocalReady(false);
      setRemoteReady(false);
      setMicEnabled(true);
      setCameraEnabled(true);

      onConnectionChange(false);
    };
  }, [
    matched,
    initiator,
    // onConnectionChange,
  ]);

  const toggleMicrophone = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const tracks =
      stream.getAudioTracks();

    const newState =
      !micEnabled;

    tracks.forEach(
      (track) => {
        track.enabled = newState;
      }
    );

    setMicEnabled(newState);
  };

  const toggleCamera = () => {
    const stream =
      localStreamRef.current;

    if (!stream) {
      return;
    }

    const tracks =
      stream.getVideoTracks();

    const newState =
      !cameraEnabled;

    tracks.forEach(
      (track) => {
        track.enabled = newState;
      }
    );

    setCameraEnabled(newState);
  };


  return (
    <div className="w-full">

      {/* VIDEO AREA */}

      <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800">

        {/* STRANGER VIDEO */}

        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {!remoteReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950">

            <div className="text-4xl mb-3">
              👤
            </div>

            <p className="text-zinc-400 text-sm">
              Connecting to stranger...
            </p>

            <div className="flex gap-1.5 mt-4">
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce" />
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
            </div>

          </div>
        )}

        {/* STRANGER LABEL */}

        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm">
          Stranger
        </div>

        {/* YOUR VIDEO */}

        <div className="absolute right-4 bottom-4 w-32 sm:w-40 aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-zinc-700 shadow-xl">

          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

          {!localReady && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-xs">
              Camera...
            </div>
          )}

          {!cameraEnabled && localReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-400 text-xs">
              Camera off
            </div>
          )}

          <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded-md text-xs">
            You
          </div>

        </div>

      </div>

      {/* CONTROLS */}

      <div className="flex justify-center items-center gap-4 mt-5">

        {/* MICROPHONE */}

        <button
          onClick={toggleMicrophone}
          className={`h-12 w-12 rounded-full flex items-center justify-center text-xl transition ${micEnabled
            ? "bg-zinc-800 hover:bg-zinc-700"
            : "bg-red-600 hover:bg-red-500"
            }`}
          title={
            micEnabled
              ? "Mute microphone"
              : "Unmute microphone"
          }
        >
          {micEnabled ? "🎤" : "🔇"}
        </button>

        {/* CAMERA */}

        <button
          onClick={toggleCamera}
          className={`h-12 w-12 rounded-full flex items-center justify-center text-xl transition ${cameraEnabled
            ? "bg-zinc-800 hover:bg-zinc-700"
            : "bg-red-600 hover:bg-red-500"
            }`}
          title={
            cameraEnabled
              ? "Turn camera off"
              : "Turn camera on"
          }
        >
          📷
        </button>

      </div>

    </div>
  );


}
