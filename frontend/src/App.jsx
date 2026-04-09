import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export default function App(){
  const [token,setToken]=useState(localStorage.getItem("token"));
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const login=async()=>{
    const res=await axios.post(API+"/api/login",{email,password});
    localStorage.setItem("token",res.data.token);
    setToken(res.data.token);
  };

  if(!token){
    return (
      <div>
        <input placeholder="email" onChange={e=>setEmail(e.target.value)} />
        <input type="password" onChange={e=>setPassword(e.target.value)} />
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return <h1>App funcionando</h1>;
}
