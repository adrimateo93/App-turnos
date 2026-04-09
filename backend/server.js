const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DB_URL)
.then(()=>console.log("Mongo OK"))
.catch(err=>console.log(err));

const User = mongoose.model("User",{
  nombre:String,
  email:String,
  password:String,
  rol:String
});

const Turno = mongoose.model("Turno",{
  fecha:String,
  horaInicio:String,
  horaFin:String,
  empleadoId:String,
  puesto:String
});

const auth=(req,res,next)=>{
  const token=req.headers.authorization;
  if(!token) return res.status(401).send("No autorizado");
  try{
    req.user=jwt.verify(token,process.env.JWT_SECRET);
    next();
  }catch{
    res.status(401).send("Token inválido");
  }
};

const isAdmin=(req,res,next)=>{
  if(req.user.rol!=="admin") return res.status(403).send("No permitido");
  next();
};

app.post("/api/login", async(req,res)=>{
  const {email,password}=req.body;
  const user=await User.findOne({email});
  if(!user) return res.status(401).send("No existe");
  const valid=await bcrypt.compare(password,user.password);
  if(!valid) return res.status(401).send("Error");
  const token=jwt.sign({id:user._id,rol:user.rol},process.env.JWT_SECRET);
  res.json({token});
});

app.get("/api/turnos",auth,async(req,res)=>{
  const turnos=await Turno.find();
  res.json(turnos);
});

const PORT=process.env.PORT||5000;
app.listen(PORT,()=>console.log("Server "+PORT));
