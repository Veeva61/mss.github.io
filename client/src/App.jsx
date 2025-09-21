import React, { useState } from 'react';
import Chat from './Chat';
import Call from './Call';

export default function App(){
  const [room, setRoom] = useState('main');
  const [name, setName] = useState('User'+Math.floor(Math.random()*1000));

  return (
    <div style={{display:'flex',gap:20,padding:20}}>
      <div style={{width:360}}>
        <h2>Messenger</h2>
        <div>
          <label>Room: </label>
          <input value={room} onChange={e=>setRoom(e.target.value)} />
        </div>
        <div>
          <label>Name: </label>
          <input value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <Chat room={room} name={name} />
      </div>
      <div style={{flex:1}}>
        <Call room={room} name={name} />
      </div>
    </div>
  );
}
