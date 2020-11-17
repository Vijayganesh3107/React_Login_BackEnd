const express=require("express");
const app=express();
const bodyparser=require("body-parser");
app.use(bodyparser.json())
const mongodb=require("mongodb"); 
const mongoclient=mongodb.MongoClient;
const shortid=require("shortid");
const bcrypt=require("bcrypt");
const nodemailer = require("nodemailer");
let url="mongodb+srv://admin:dFU1aOAaxzbWv0Oz@cluster0.whuqd.mongodb.net/assignment?retryWrites=true&w=majority"
const cors=require("cors");
app.use(cors());
var jwt=require("jsonwebtoken");

require("dotenv").config();

app.get("/getUrl/:email",async(req,res)=>{
    var client=await mongoclient.connect(url,{ useUnifiedTopology: true });
    var db=client.db("assignment");
    var data= await db.collection("urlreact").find({email:req.params.email}).toArray();
    res.json(data);
    client.close();
})
app.post("/insertUrl/:email",async(req,res)=>{
    var client=await mongoclient.connect(url,{ useUnifiedTopology: true });
    var db=client.db("assignment");
   req.body.shortURL=`vjbitly.${shortid.generate(8)}`
   req.body.email=req.params.email
   var checkdata=await db.collection("urlreact").findOne({longURL:req.body.longURL,email:req.body.email});
   if(!checkdata){
    var data= await db.collection("urlreact").insertOne(req.body);
    if(data){
        res.json({
            message:"data Inserted"
        })
        client.close();
    }else{
        res.json({
            message:"data not inserted"
        });
        client.close();
    }
}else{
    res.json({
        message:"LongURL already present"
    })
    client.close();
}
})



app.post("/user/signup",async(req,res)=>{
    var client=await mongoclient.connect(url,{useUnifiedTopology:true});
    var db= client.db("assignment");
    var checkdata=await db.collection("reactusers").findOne({email:req.body.email})
    
    if(checkdata){
        res.json({
            message:"User with the same mail id is alraedy present"
        }
        )
        client.close();
    }
    else{
        var transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:"vijay.ganeshp95@gmail.com",
                pass:"vIjay@31071995"
            }
        })
        var mailoptions = {
            from: `vijay.ganeshp95@gmail.com`,
            to: `vijay.ganeshp95@gmail.com`,
            subject: `Secret Mail from nodejs`,
            html: `<div>Please click the below link to activate your account.This link will be valid for 24hrs only
                    <a href="http://localhost:3000/signup/auth/${req.body.email}">http://localhost:3000/users/auth/</a></div>`,
          };
          transporter.sendMail(mailoptions, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              console.log("email sent" + info.response);
            }
          });
        
        var salt= await bcrypt.genSalt(10);
        var hashedpassword=await bcrypt.hash(req.body.password,salt);
        req.body.password=hashedpassword;
        req.body.activated=false
        var data=await db.collection("reactusers").insertOne(req.body);

        if(data){
            res.json({
                message:"Data Inserted Successfully",
                email:req.body.email,
            })
            client.close();
        }else{
            res.json({
                message:"Something went wrong while inserting Data"
            })
            client.close();
        }
    }
   
    
})

app.put("/user/auth/:email",async(req,res)=>{
    var client=await mongoclient.connect(url, { useUnifiedTopology: true });
    var db=client.db("assignment")
    
    var checkdata= await db.collection("reactusers").find({$and:[{email:req.params.email},{activated:false}]}).count();
    if(checkdata==1){
        var data=await db.collection("reactusers").updateOne({email:req.params.email},{$set:{activated:true}})
        res.json({
            message:"User Successfully Activated"
        })
        
        client.close();
    }else{
        res.json({
            message:"User Already Activated"
        })
        client.close();
        // if(checkdata.activated==true  ){
            
        //     res.json({message:"User already activated"})
        //     client.close();
        // }else{
        //     res.json({message:"Email does not exixst"})
        //     client.close();
        // }
    }
})

app.post("/user/login",async(req,res)=>{
        var client=await mongoclient.connect(url,{useUnifiedTopology:true});
        var db=client.db("assignment");
        var checkdata=await db.collection("reactusers").findOne({$and:[{email:req.body.email},{activated:true}]})
        if(!checkdata){
            res.json({
                message:"User Not Registered"
            })
            client.close();
        }else{
            var output=await bcrypt.compare(req.body.password,checkdata.password);
            if(output){
                var token=jwt.sign({email:req.body.email},"jhsadjkhsakjdhjksahdjkah");
                res.json({
                    message:"Login Succesfull",
                    token
                })
                client.close();
            }else{
                res.json({
                    message:"Email and Password mismatches"
                })
                client.close();
            }
        }
})


app.post("/forgetpassword",async(req,res)=>{
    var client=await mongoclient.connect(url);
    var db=client.db("assignment");
    var checkdata=await db.collection("reactusers").find({email:req.body.email}).count();
    if(checkdata===1){
        var transporter=nodemailer.createTransport({
            service:"gmail",
            auth:{
                user:"vijay.ganeshp95@gmail.com",
                pass:"vIjay@31071995"
            }
        })
        var mailoptions = {
            from: `vijay.ganeshp95@gmail.com`,
            to: `vijay.ganeshp95@gmail.com`,
            subject: `Secret Mail from nodejs`,
            html: `<div>Please click the below link to activate your account.This link will be valid for 24hrs only
                    <a href="http://localhost:3000/changepassword/${req.body.email}"    >http://localhost:3000/users/auth/</a></div>`,
          };
          transporter.sendMail(mailoptions, (err, info) => {
            if (err) {
              console.log(err);
            } else {
              console.log("email sent" + info.response);
            }
          });
          res.json({
              message:"Email Sent"
          })
          client.close();
    }else{
        res.json({
            message:"User not Present"
        })
        client.close();
    }
})

app.put("/changepassword/:email",async(req,res)=>{
    var client=await mongoclient.connect(url,{ useUnifiedTopology: true });
    var db= client.db("assignment");
    var checkdata=await db.collection("reactusers").find({email:req.params.email})
    if(checkdata){
        var salt=await bcrypt.genSalt(10);
        var hashedpass= await bcrypt.hash(req.body.password,salt);
        var data=await db.collection("reactusers").updateOne({email:req.params.email},{$set:{password:hashedpass}});
        res.json({
            message:"Password Updated"
        })
        client.close();
    }else{
        res.json({
            message:"Something Went Wrong"
        })
        client.close();
    }
})

function authorize(req, res, next) {
    if (req.headers.authorization) {
      jwt.verify(
        req.headers.authorization,
        process.env.JWT_SECRET,
        (err, decode) => {
          if (decode) {
            if (req.body.email == decode.email) next();
            else {
              res.json({
                message: "Not Authorized",
              });
            }
          } else {
            res.json({
              message: "Token not valid",
            });
          }
        }
      );
    } else {
      res.json({
        message: "Token not present",
      });
    }
  }

let port=process.env.PORT ||5000
app.listen(port);