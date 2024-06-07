'use client';

import { VideoConfig } from '../webrtc';
import { useMemo, useState, useRef, useEffect } from 'react';
import { io } from 'socket.io-client';
import { v4 } from 'uuid';
import { Videocam, VideocamOff, Mic, MicOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';

const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
        },
    ],
    iceCandidatePoolSize: 10,
};

export default function Room() {
    const server = 'https://polymeet-7137e04975b4.herokuapp.com/';
    const [socket, setSocket] = useState(io(server));

    const [userId, setUserId] = useState<String>(v4());
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);

    const partnerRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [videoConfig, setVideoConfig] = useState<VideoConfig>({
        video: true,
        audio: true,
    });

    const hasRunRef = useRef(false);

    useEffect(() => {
        if (hasRunRef.current) {
            return;
        }
        setLocalStream(new MediaStream());
        hasRunRef.current = true;
        initialize();
    }, []);

    useEffect(() => {
        //ref.current.srcObject = localStream;
        if (!localVideoRef.current) return;
        const v: any = localVideoRef.current;
        v.srcObject = localStream;
    }, [localStream]);

    useEffect(() => {
        //ref.current.srcObject = localStream;
        if (!partnerRef.current) return;
        const v: any = partnerRef.current;
        v.srcObject = remoteStream;
    }, [remoteStream]);

    useEffect(() => {
        localStream?.getVideoTracks().forEach((track) => {
            track.enabled = videoConfig.video;
        });
        localStream?.getAudioTracks().forEach((track) => {
            track.enabled = videoConfig.audio;
        });
    }, [videoConfig]);

    async function initialize() {
        let peer: RTCPeerConnection;
        let joinTimeout: any;
        let offerSent = false;
        let answerSent = false;
        let stream: any;
        try {
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            setLocalStream(stream);
        } catch (err) {
            console.log(err);
        }

        // Signals to the server that a new user just joined the call
        console.log('Joining room...');
        socket.emit('joinRoom', { userId });

        socket.on('waiting', () => {
            console.log('Waiting 20 seconds for someone to join...');
            joinTimeout = setTimeout(() => {
                console.log('No one joined, searching for a room...');
                socket.emit('joinRoom', { userId });
            }, 20000000);

            socket.on('user_joined', async () => {
                console.log('Someone joined! timeout canceled.');
                clearTimeout(joinTimeout);

                peer = new RTCPeerConnection(servers);

                peer.ontrack = (e) => {
                    console.log('here');
                    setRemoteStream(e.streams[0]);
                };

                stream.getTracks().forEach((track: any) => {
                    peer.addTrack(track, stream);
                });

                peer.onicecandidate = (e) => {
                    if (e.candidate && !offerSent) {
                        offerSent = true;
                        console.log(e.candidate);
                        socket.emit('offer', {
                            offerDescription: peer.localDescription,
                            candidate: e.candidate,
                        });
                    }
                };

                const offerDescription = await peer.createOffer();
                peer.setLocalDescription(offerDescription);
            });
        });

        socket.on('reset', () => {
            setRemoteStream(null);
            socket.emit('joinRoom', { userId });
            offerSent = false;
            answerSent = false;
        });

        socket.on('process-offer', async ({ offerDescription, candidate }) => {
            peer = new RTCPeerConnection(servers);

            peer.ontrack = (e) => {
                console.log('here');
                setRemoteStream(e.streams[0]);
            };

            stream.getTracks().forEach((track: any) => {
                peer.addTrack(track, stream);
            });

            peer.onicecandidate = (e) => {
                if (e.candidate && !answerSent) {
                    answerSent = true;
                    socket.emit('answer', {
                        answerDescription: peer.localDescription,
                        candidate: e.candidate,
                    });
                }
            };

            await peer.setRemoteDescription(offerDescription);
            peer.addIceCandidate(candidate);

            const answerDescription = await peer.createAnswer();
            peer.setLocalDescription(answerDescription);
        });

        socket.on('process-answer', async ({ answerDescription, candidate }) => {
            await peer.setRemoteDescription(answerDescription);
            peer.addIceCandidate(candidate);
        });
    }

    const toggleStream = async () => {
        console.log('Starting stream...');
        setVideoConfig({
            ...videoConfig,
            video: !videoConfig.video,
        });
    };

    const toggleAudio = async () => {
        console.log('Toggling audio...');
        setVideoConfig({
            ...videoConfig,
            audio: !videoConfig.audio,
        });
    };

    return (
        <div id='meet'>
            <div
                style={{
                    width: 700,
                    height: 325,
                    background: '#475569',
                    padding: '10px',
                    borderRadius: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                }}
            >
                <p style={{ position: 'absolute', left: 20, top: 20 }}>Them</p>
                <video
                    ref={partnerRef}
                    autoPlay={true}
                    muted={false}
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '10px',
                        objectFit: 'cover',
                    }}
                ></video>
            </div>
            <div
                style={{
                    width: 700,
                    height: 325,
                    background: '#475569',
                    padding: '10px',
                    borderRadius: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                }}
            >
                <p style={{ position: 'absolute', left: 20, top: 20 }}>You</p>
                <video
                    ref={localVideoRef}
                    autoPlay={true}
                    muted={true}
                    playsInline
                    style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '10px',
                        objectFit: 'cover',
                    }}
                ></video>
                <div style={{ position: 'absolute', bottom: 10, left: 10, display: 'flex', gap: '10px' }}>
                    <IconButton onClick={toggleStream} color='primary'>
                        {videoConfig.video ? <VideocamOff /> : <Videocam />}
                    </IconButton>
                    <IconButton onClick={toggleAudio} color='primary'>
                        {videoConfig.audio ? <MicOff /> : <Mic />}
                    </IconButton>
                </div>
            </div>
        </div>
    );
}
