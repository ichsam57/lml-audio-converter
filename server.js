const express = require("express");
const multer = require("multer");
const cors = require("cors");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const fs = require("fs-extra");
const path = require("path");
const { v4: uuid } = require("uuid");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

app.use(cors({
 origin:"*"
}));

app.use(express.json());

fs.ensureDirSync("./uploads");
fs.ensureDirSync("./output");

const storage = multer.diskStorage({
 destination:(req,file,cb)=>{
   cb(null,"uploads/");
 },
 filename:(req,file,cb)=>{
   cb(
    null,
    Date.now()+
    path.extname(file.originalname)
   );
 }
});

const upload = multer({
 storage
});

app.post(
 "/api/download",
 upload.single("audio"),
 async(req,res)=>{

 try{

 if(!req.file){

 return res.status(400).json({
 error:"No file"
 });

 }

 const format =
 req.body.format || "mp3";

 const outputName =
 uuid()+"."+format;

 const outputPath =
 path.join(
  __dirname,
  "output",
  outputName
 );

 ffmpeg(req.file.path)

 .toFormat(format)

 .audioBitrate("320k")

 .on("end",()=>{

 res.download(
  outputPath,
  ()=>{

   fs.remove(req.file.path);

   setTimeout(()=>{
    fs.remove(outputPath);
   },5000);

 });

 })

 .on("error",(err)=>{

 console.log(err);

 res.status(500).json({
 error:"Convert failed"
 });

 })

 .save(outputPath);

 }
 catch(err){

 console.log(err);

 res.status(500).json({
 error:"Server Error"
 });

 }

});

const PORT=
process.env.PORT||3000;

app.listen(PORT,()=>{

console.log(
"LML Backend Running "+PORT
);

});
