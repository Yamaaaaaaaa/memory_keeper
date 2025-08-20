import React, { createContext, useContext, useRef, useState } from "react";
import {
    mediaDevices,
    MediaStream,
    RTCPeerConnection
} from "react-native-webrtc";

interface WebRTCContextProps {
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    startLocalStream: () => Promise<void>;
    toggleMic: () => void;
    toggleCamera: () => void;
    endCall: () => void;
}

const WebRTCContext = createContext<WebRTCContextProps | null>(null);

export const WebRTCProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const pc = useRef<RTCPeerConnection | null>(null);

    const startLocalStream = async () => {
        const stream = await mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        setLocalStream(stream);
    };

    const toggleMic = () => {
        localStream?.getAudioTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
    };

    const toggleCamera = () => {
        localStream?.getVideoTracks().forEach((track) => {
            track.enabled = !track.enabled;
        });
    };

    const endCall = () => {
        pc.current?.close();
        setLocalStream(null);
        setRemoteStream(null);
    };

    return (
        <WebRTCContext.Provider
            value={{ localStream, remoteStream, startLocalStream, toggleMic, toggleCamera, endCall }}
        >
            {children}
        </WebRTCContext.Provider>
    );
};

export const useWebRTC = () => {
    const ctx = useContext(WebRTCContext);
    if (!ctx) throw new Error("useWebRTC must be used inside WebRTCProvider");
    return ctx;
};
