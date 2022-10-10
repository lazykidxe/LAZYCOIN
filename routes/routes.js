var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
const axios = require("axios");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const express = require('express');
const app = express();

const oneDay = 1000 * 60 * 60 * 24;

//session middleware
app.use(sessions({
    secret: "thisismysecrctekeyfhrgfgrfrty84fwir767",
    saveUninitialized:true,
    cookie: { maxAge: oneDay },
    resave: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//serving public file
app.use(express.static(__dirname));

app.use(cookieParser());

var session;

var stockSelected;

var userID;

exports.home = (req,res) =>{
      session=req.session;
      if(session.userid){
          res.render("index");
      }else
      res.render("index",{
    });
  };



exports.login = (req,res) =>{
    res.render("login",{
    });
};







exports.logout = (req,res) =>{
  req.session.destroy();
  res.redirect('/');
};


var gg;
setInterval(function() {
  gg++;
}, 1000);



exports.create = (req,res) =>{
    res.render("create",{
    });
};

exports.data = (req,res) =>{
  res.render("login",{
  });
};

exports.user = (req,res) =>{
      stockSelected = "";
      res.render("user",{
    });
};


exports.createAccount = async (req, res) => {

    var data = req.body;
    var errorMessage;
    var regexUsername = '^.*(?=.{6,}).*$'
    var regexPassword = '^.*(?=.{6,})(?=.*[a-zA-Z]).*$'
    var regexEmail = '^[a-z0-9](\.?[a-z0-9]){5,}@g(oogle)?mail\.com$'

    var usernameCheck = false;
    var passwordCheck = false;
    var emailCheck = false;

    var validUsername;
    var validPassword;
    var validEmail;
    var validDate;


    if(data.email == ""){
        errorMessage = "EMAIL is empty!"
      }else if((data.email).match(new RegExp(regexEmail)) && data.email != ""){
        //console.log("EMAIL IS CORRECT");
        validEmail = data.email;
        emailCheck = true;
      }else{
        errorMessage = "Email is in wrong format"
        //console.log("EMAIL IS WRONG")
      }
  
      if(data.password == ""){
        errorMessage = "PASSWORD is empty!"
      }else if((data.password).match(new RegExp(regexPassword)) && data.password != ""){
        //console.log("PASSWORD IS CORRECT");
        validPassword = data.password;
        passwordCheck = true;
      }else{
        errorMessage = "Password must includes a lower case and upper case"
        console.log("PASSWORD IS WRONG")
      }

      
    if(data.username === ""){
        errorMessage = "Username is empty!"
      }else if((data.username).match(new RegExp(regexUsername)) && data.username != ""){
        //console.log("USERNAME IS CORRECT");
        validUsername = data.username;
        usernameCheck = true;  
      }else{
        errorMessage = "Username needs to be more than 6 digits"
        //console.log("USERNAME IS WRONG")
      }
      validDate = data.date


      if(usernameCheck == true && passwordCheck == true && emailCheck == true){
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("LAZYCOIN");


            dbo.collection("Users").count({}, function(error, numOfDocs){

              var account = { UserID: numOfDocs, Username: validUsername, Password: validPassword, Email: validEmail, Birth: validDate };
              
              dbo.collection("Users").insertOne(account, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
              });
              
          });


            dbo.collection("Users").count({}, function(error, numOfDocs){
              console.log(numOfDocs);

              var userBalances = {UserID: numOfDocs, Balance: 1000}

              dbo.collection("UserBalaces").insertOne(userBalances, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
              });
              
              
          });

          






         
            



          });
          res.render("index",{
        });
    }else{
        res.render("create",    {
            message : errorMessage
        });
    }
};



var number = 5;

exports.loginAccount = async (req, res) => {



  var userInput = req.body;
  var inputUsername = userInput.username;
  var inputPassword = userInput.password;
  var errorMessage;




  if(inputUsername == "" || inputPassword == ""){
    console.log("USERNAME OR PASSWORD IS EMPTY");
    errorMessage = "USERNAME OR PASSWORD IS EMPTY";
    res.render("login",{
      message:errorMessage
    });
  }else if(inputUsername != "" ){
    
    MongoClient.connect(url, function(err, db) {
      if (err) throw err;
      var dbo = db.db("LAZYCOIN");
      dbo.collection("Users").findOne({Username:inputUsername,Password:inputPassword}, function(err, result) {
        if (err) throw console.log("USERNAME NOT FOUND");
        if(result == null){
          errorMessage = "USERNAME NOT FOUND";
          res.render("login",    {
            message : errorMessage
        });
        }else if(inputUsername == result.Username){

          var name = result.Username

          userID = result.UserID;

          dbo.collection("UserBalaces").findOne({UserID: result.UserID}, function(err, result) {
            if (err) throw err;
 
            userBalances = result.Balance
            db.close();

            session=req.session;
            session.userid=req.body.username;
  
            console.log(userBalances)
            console.log(name)
  
            res.render("user",    {
              name: name,
              current : result.Balance
            
          });
          });



        }
       
      });
    });

  }
}














const encodedParams = new URLSearchParams();
var stockInsertID;

exports.data = (req,res) =>{


var data = req.body;

var stock = data.stockSelected;

var currentBalace;

encodedParams.append("symbol", stock );
console.log("STOCK:" + stock)






MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("LAZYCOIN");
  dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {


    if (err) throw err;
    //console.log(result);
    currentBalace = result.Balance;
    db.close();
  });
});

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("LAZYCOIN");
  dbo.collection("Stocks").findOne({Stock: stock}, function(err, result) {


    if (err) throw err;
    //console.log(result.StockID);
    stockInsertID = result.StockID;
    db.close();
  });
});



const options = {
  method: 'GET',
  url: 'https://yahoofinance-stocks1.p.rapidapi.com/stock-metadata',
  params: {Symbol: stock},
  headers: {
    'X-RapidAPI-Key': '238218e685msh4e469b864f5d032p184fd5jsn8fe519100be3',
    'X-RapidAPI-Host': 'yahoofinance-stocks1.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
  var dataFromResponse = response.data;

	console.log(dataFromResponse.result.regularMarketPrice);

  stockName = dataFromResponse.result.shortName
  stockSymbol = dataFromResponse.result.symbol
  currentPrice = dataFromResponse.result.regularMarketPrice
  stockOpen = dataFromResponse.result.regularMarketOpen
  stockHigh = dataFromResponse.result.regularMarketDayHigh
  stockLow = dataFromResponse.result.regularMarketDayLow
  

  res.render("data",{
    balance: currentBalace,
    name: stockName,
    symbol: stockSymbol,
    current: currentPrice,
    open: stockOpen,
    high: stockHigh,
    low: stockLow,




  });


}).catch(function (error) {
	console.error(error);
});

};











exports.buy = async(req,res) =>{

  //user id 
  //user current balance 
  //console.log(userID)


  var data = req.body
  console.log( "AMOUNT " + data.amount);
 

 

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {
      if (err) throw err;
      //console.log(result);
      db.close();
    });
  });




  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    var buyRecord = { UserID: userID, StockID: stockInsertID, Amount: data.amount };
    dbo.collection("User_Owned_Stocks").insertOne(buyRecord, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });



  res.render("data",{
    tradeMessage: "make it"
  });

}