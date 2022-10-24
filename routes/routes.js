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

var userID;
var count = 1;

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

exports.create = (req,res) =>{
    res.render("create",{
    });
};


// exports.data = (req,res) =>{
//   res.render("login",{
//   });
// };



var userBalances
var currentOwnedStocks;



exports.user = (req,res) =>{
      stockSelected = "";
      var currentUserBalance

      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("LAZYCOIN");

        dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {
          if (err) throw err;
          //console.log("USER BALANCE:" + result.Balance);
          db.close();

          res.render("user",{
            current: result.Balance,
            ownedStock: "HELLO"
        });
        });

          
      });



};



//------------------------------------------------
//Page for creating an account and store into the database

exports.createAccount = async (req, res) => {

//
    var data = req.body;


    var regexUsername = '^.*(?=.{6,}).*$'
    var regexPassword = '^.*(?=.{6,})(?=.*[a-zA-Z]).*$'
    var regexEmail = '^[a-z0-9](\.?[a-z0-9]){5,}@g(oogle)?mail\.com$'

    var usernameCheck = false;
    var passwordCheck = false;
    var emailCheck = false;
    var errorMessage;

    var validUsername;
    var validPassword;
    var validEmail;
    var validDate;

    //-----Check if user inputs are valid
    if(data.email == ""){
        errorMessage = "EMAIL is empty!"
      }else if((data.email).match(new RegExp(regexEmail)) && data.email != ""){
        validEmail = data.email;
        emailCheck = true;
      }else{
        errorMessage = "Email is in wrong format"
      }
  
      if(data.password == ""){
        errorMessage = "PASSWORD is empty!"
      }else if((data.password).match(new RegExp(regexPassword)) && data.password != ""){
        validPassword = data.password;
        passwordCheck = true;
      }else{
        errorMessage = "Password must includes a lower case and upper case"
        console.log("PASSWORD IS WRONG")
      }

    if(data.username === ""){
        errorMessage = "Username is empty!"
      }else if((data.username).match(new RegExp(regexUsername)) && data.username != ""){
        validUsername = data.username;
        usernameCheck = true;  
      }else{
        errorMessage = "Username needs to be more than 6 digits"
      }
      validDate = data.date


      //if all the inputs are valid, save them into the database
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

            //generate a user id based on number of user inside the database and 
            //assign starting balance for each new account
            dbo.collection("Users").count({}, function(error, numOfDocs){
              console.log(numOfDocs);

               userBalances = {UserID: numOfDocs, Balance: 1000}

              dbo.collection("UserBalaces").insertOne(userBalances, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                //db.close();
              });
              console.log("HERE:" + userID + "STOCKID: " + stockInsertID)
              var buyRecord = { UserID: numOfDocs, StockID: 1,Stock: "AMZN", Shares: 0 , Amount: 0, AverageCost: 0  }; 
              var buyRecord2 = { UserID: numOfDocs, StockID: 2,Stock: "APPL",Shares: 0 , Amount: 0, AverageCost: 0  }; 
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                //db.close();
              });
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord2, function(err, res) {
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


//-----------------------------------------------------------------------------------------------


//Page for login account 
exports.loginAccount = async (req, res) => {

  var userInput = req.body;
  var inputUsername = userInput.username;
  var inputPassword = userInput.password;
  var errorMessage;

  //Check inputs are not empty
  if(inputUsername == "" || inputPassword == ""){
    console.log("USERNAME OR PASSWORD IS EMPTY");
    errorMessage = "USERNAME OR PASSWORD IS EMPTY";
    res.render("login",{
      message:errorMessage
    });
  }else if(inputUsername != "" ){
    //After passed the empty check, search matching username and password from the database
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
          
          //if matching authorzation found, find all the data associated to the account
          
          //Find balance (missing owned stocks)-----------------------------------------------------------------------------------------------------------------------------
          var loginUserBalance;
          dbo.collection("UserBalaces").findOne({UserID: result.UserID}, function(err, result) {
            if (err) throw err;
            
            loginUserBalance = result.Balance
            console.log("LOGIN USER BALANCE:" + loginUserBalance)
            db.close();

            session=req.session;
            session.userid=req.body.username;



            res.render("user",    {
              name: name,
              current : loginUserBalance,
              ownedStock : "AA"
  
              
          });
          });




        }
      });
    });
  }
}














const encodedParams = new URLSearchParams();
var stockInsertID;
var currentBalace;
var currentStockPrice;

 


exports.data = (req,res) =>{

var data = req.body;
var stock = data.stockSelected;



encodedParams.append("symbol", stock );
//console.log("STOCK:" + stock)






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

  currentStockPrice = currentPrice;


  var today = new Date();  
  var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  //console.log(time)

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    var myobj = {Time: time, CurrentPrice: currentPrice};
    dbo.collection(stockSymbol + "Seconds").insertOne(myobj, function(err, res) {
      if (err) throw err;
      //console.log("1 document inserted");
      db.close();
    });
  });


  

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


  var data = req.body

  

 
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {
      if (err) throw err;
      //console.log("HAVE:" + result.Balance);
 
      //db.close();
      if( result.Balance > data.amount){

        //console.log("YOU CAN BUY")
    
    
    
        MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          var dbo = db.db("LAZYCOIN");





          dbo.collection("User_Owned_Stocks").findOne({StockID:parseInt(stockInsertID), UserID: parseInt(userID)}, function(err, result) {
            if (err) throw err;
            
 



            if(result.StockID == stockInsertID){

              //console.log("CURRENT:" + currentStockPrice)

              var totalAmountBought;
              var totalSharesBough;
              var AverageCost = totalAmountBought / totalSharesBough;
              
             
              var updateAmount = {$set:{Amount: parseInt(result.Amount) + parseInt(data.amount)}};
              var currentAmount = {Amount: result.Amount};

              
              var addOnShares = parseInt(data.amount) / currentStockPrice;
              var roundShares = Math.round((addOnShares + Number.EPSILON) * 100) / 100
              var updateShares = {$set:{Shares: roundShares + parseInt(result.Shares)}};
              var currentShares = {Shares: result.Shares}

              //console.log("CURRENT:" +result.Shares)
              //console.log("UPDATE:" + roundShares)

              console.log("CHECK 1 : " + data.amount)
              data.amount = 0;
              console.log("CHECK 2 : " + data.amount)

             

              dbo.collection("User_Owned_Stocks").updateOne(currentAmount, updateAmount, function(err, res) {
                if (err) throw err;
                //db.close();
              });

        

                dbo.collection("User_Owned_Stocks").updateOne(currentShares, updateShares, function(err, res) {
                  if (err) throw err;
                  //db.close();
                });
  
       



              

              dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {
                if (err) throw err;
                dbBalance = result.Balance;
                userCurrentBalance = result.Balance - data.amount;
        
                // console.log("AMOUNT: "+ data.amount)
                // console.log("USERCURRENTBALANCE: " + userCurrentBalance);
                // console.log("DB BALANCE: " + dbBalance);
                
                
        
                var myquery = { Balance: dbBalance };
                var newvalues = { $set: {UserID: userID, Balance: userCurrentBalance } };
            
                
                dbo.collection("UserBalaces").updateOne(myquery, newvalues, function(err, res) {
                  if (err) throw err;
           
                  db.close();
                });

                count--;
      
                
              });

            }
          });

       
        });




    
        var userCurrentBalance;
        var dbBalance;
     
    
    
        res.render("data",{
          tradeMessage: "YOU BOUGHT ",
            current: userBalances,
           
            
           
        });
     
      }else{
        res.render("data",{
          tradeMessage: "YOU DONT HAVE ENOUGH"
        });
      }
    });
  });


  






}

