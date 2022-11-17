const express = require("express");
const pug = require("pug")
const path = require("path");
const routes = require("./routes/routes.js");
const sessions = require('express-session');
const cookieParser = require("cookie-parser");


const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use(express.static(path.join(__dirname, "/public")));


const urlencodedParser = express.urlencoded({
    extended: false
});


const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));


// parsing the incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

// cookie parser middleware
app.use(cookieParser());


app.get("/", routes.home);
app.get('/logout', routes.logout);




app.get("/create", routes.create);
app.post("/create",urlencodedParser, routes.createAccount);


app.get("/login",  routes.login);
app.post("/loginAccount", urlencodedParser, routes.loginAccount);

app.get("/comfirmation", routes.comfirmation);
app.get("/comfirmationSell", routes.comfirmationSell);
app.get("/history", routes.history);
app.get("/search", routes.search);
app.get("/stock", routes.stock);

app.get("/live", routes.live);

app.post("/searchStock",urlencodedParser,routes.searchStock);

app.get("/user", routes.user);

app.get("/data",  routes.data);
app.post("/data", urlencodedParser, routes.data);

app.get("/buyStock",routes.buyStock);
app.post("/buy",urlencodedParser, routes.buy);

app.get("/sellStock",routes.sellStock);
app.post("/sell",urlencodedParser, routes.sell);



app.listen(2000);













