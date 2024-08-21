require("dotenv").config();
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const cors = require('cors');
const bcrypt = require('bcrypt');
const userModel = require('./models/user-model');
const expressSession = require('express-session');
const flash = require('connect-flash');

const server = http.createServer(app);
const io = socketio(server);

const dp = require('./config/mongoose-connection');

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cors({origin: true}));
app.use(
    expressSession({
        resave: false,
        saveUninitialized: false,
        secret: process.env.EXPRESS_SESSION_SECRET,
    })
);
app.use(flash());

io.on("connection", function (socket) {
    socket.on("send-location", function(data){
        io.emit("receive-location", { id: socket.id, ...data });
    });
    socket.on("disconnect", () => {
        io.emit("user-disconnected", socket.id);
    });
});

app.get("/", (req, res) => {
    let error = req.flash("error");
    res.render("createAccount", { error });
});

app.post("/create-account", async (req, res) => {
    try {
        let {fullname, email, password} = req.body;

        let user = await userModel.findOne({email: email});
        if(user) 
        {
            req.flash("error","You already have an account, Please Login !!");
            return res.redirect("/login");
        }

        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(password, salt, async function(err, hash){
                if(err) return res.send(err.message);
                else{
                    let user = await userModel.create({
                        fullname,
                        email,
                        password: hash,
                    });
                    req.flash("success","Account created successfully !!");
                    res.redirect("/index");
                }
            });
        });
    } catch (error) {
        console.log(error.message);
    }
});

app.get("/login", (req, res) => {
    let error = req.flash("error");
    res.render("login", { error });
});

app.post("/login", async (req, res) => {
    let {email, password} = req.body;

    let user = await userModel.findOne({email:email});
    if(!user)
    {
        req.flash("error","Your Account is not Registered !!");
        return res.redirect("/");
    }

    bcrypt.compare(password, user.password, function(err,result){
        if(result){
            res.redirect("/index");
        }
        else{
            req.flash("error","Email or Password incorrect !!");
            res.redirect("/login");
        }
    })
});

app.get("/index", (req, res) => {
    let success = req.flash("success");
    res.render("index", { success });
});

server.listen(3000, () => {
    console.log("App listening at the port 3000:");
});
