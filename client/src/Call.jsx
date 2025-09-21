import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const SERVER = import.meta.env.VITE_SERVER || 'http://localhost:3000';

export default function Call({room, name}){
  const localRef = useRef();
  const remoteRef = useRef();
  const pcRef = useRef(null);
  const socketRef = useRef(null);
  const [inCall,setInCall] = useState(false);

  useEffect(()=>{
    const socket = io(SERVER);
    socketRef.current = socket;
    socket.emit('join-room',{room,name});

    socket.on('webrtc-offer', async ({ from, offer })=>{
      await ensurePc();
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      socket.emit('webrtc-answer',{ to: from, answer });
    });

    socket.on('webrtc-answer', async ({ answer })=>{
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('webrtc-ice', ({ candidate })=>{
      pcRef.current?.addIceCandidate(new RTCIceCandidate(candidate)).catch(console.error);
    });

    return ()=> socket.disconnect();
  },[room]);

  async function ensurePc(){
    if(pcRef.current) return;
    const pc = new RTCPeerConnection();
    pcRef.current = pc;

    pc.onicecandidate = (e)=>{
      if(e.candidate) socketRef.current.emit('webrtc-ice',{ candidate: e.candidate });
    }
    pc.ontrack = (e)=>{ remoteRef.current.srcObject = e.streams[0]; }

    const stream = await navigator.mediaDevices.getUserMedia({ audio:true, video:true });
    localRef.current.srcObject = stream;
    stream.getTracks().forEach(t=> pc.addTrack(t, stream));
  }

  async function startCall(){
    await ensurePc();
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    socketRef.current.emit('webrtc-offer',{ room, offer });
    setInCall(true);
  }

  function hangup(){
    pcRef.current?.close(); pcRef.current = null;
    setInCall(false);
  }

  return (
    <div>
      <div>
        <video ref={localRef} autoPlay muted style={{width:200}} />
        <video ref={remoteRef} autoPlay style={{width:400}} />
      </div>
      <div style={{marginTop:8}}>
        <button onClick={startCall} disabled={inCall}>Start Call</button>
        <button onClick={hangup} disabled={!inCall}>Hang Up</button>
      </div>
    </div>
  );
}
