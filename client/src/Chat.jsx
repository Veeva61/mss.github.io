import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const SERVER = import.meta.env.VITE_SERVER || 'http://localhost:3000';

export default function Chat({room, name}){
  const [socket] = useState(()=>io(SERVER));
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');

  useEffect(()=>{
    socket.emit('join-room', { room, name });
    socket.on('chat-message', (m)=> setMsgs(prev=>[...prev,m]));
    socket.on('user-joined', u=> setMsgs(prev=>[...prev,{system:`${u.name} joined`}]));
    socket.on('user-left', u=> setMsgs(prev=>[...prev,{system:`user left`}]));
    return ()=> socket.disconnect();
  },[room]);

  const send = ()=>{
    if(!text) return;
    socket.emit('chat-message',{ room, msg:text, name });
    setMsgs(prev=>[...prev,{id:'me',msg:text,name}]);
    setText('');
  }

  return (
    <div>
      <div style={{height:400,overflow:'auto',border:'1px solid #ccc',padding:10}}>
        {msgs.map((m,i)=> (
          <div key={i}>{m.system ? <i>{m.system}</i> : <b>{m.name||m.id}:</b>} {m.msg}</div>
        ))}
      </div>
      <div style={{marginTop:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter' && send()} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
