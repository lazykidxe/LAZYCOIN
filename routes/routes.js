var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/mydb";
const axios = require("axios");
const cookieParser = require("cookie-parser");
const sessions = require('express-session');
const express = require('express');
const app = express();

const oneDay = 1000 * 60 * 60 * 24;

const encodedParams = new URLSearchParams();

var name
var currentStock;



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

var stockInsertID;
var currentBalace;
var currentStockPrice;

var amazonPrice;
var applePrice;
var teslaPrice;
var amazonToday;
var appleToday;
var teslaToday;
var amazonVolume;

var userAmazon;
var userAmazonPrice;
var userAmazonHold;
var userAmazonAverage;
var userAmazonChange;





var stockCheck = "AMZN";
    setInterval(function(){
      encodedParams.append("symbol", stockCheck );
      const options = {
        method: 'GET',
        url: 'https://yahoofinance-stocks1.p.rapidapi.com/stock-metadata',
        params: {Symbol: stockCheck},
        headers: {
          'X-RapidAPI-Key': '238218e685msh4e469b864f5d032p184fd5jsn8fe519100be3',
          'X-RapidAPI-Host': 'yahoofinance-stocks1.p.rapidapi.com'
        }
      };
      axios.request(options).then(function (response) {
        var dataFromResponse = response.data;
        //amazonPrice = dataFromResponse.result.regularMarketPrice;
        if(stockCheck == "AMZN"){
          amazonPrice = dataFromResponse.result.regularMarketPrice;
          amazonToday = Math.round(dataFromResponse.result.regularMarketChangePercent * 100) / 100 
          amazonVolume = dataFromResponse.result.regularMarketVolume;
          amazonVolume = Math.round(amazonVolume / 1000000 * 100) / 100
          stockCheck = "AAPL"
          //console.log('Amazon read!')
        }else if(stockCheck == "AAPL"){
          applePrice = dataFromResponse.result.regularMarketPrice;
          appleToday = Math.round(dataFromResponse.result.regularMarketChangePercent * 100) / 100 
          stockCheck = "TSLA"
          //console.log("Apple read!")
        }else if(stockCheck == "TSLA"){
          teslaPrice = dataFromResponse.result.regularMarketPrice;
          teslaToday = Math.round(dataFromResponse.result.regularMarketChangePercent * 100) / 100 
          stockCheck = "AMZN"
          //console.log("Tesla read!")
          //console.log("Good to go!")
        }



        
      })


      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("LAZYCOIN");
       

        if(userID != null){
          dbo.collection("User_Owned_Stocks").findOne({UserID:userID,StockID:1}, function(err, result) {
            if (err) throw err;
            //console.log(result);

            if(result.Amount > 0){
              userAmazon = "AMZN"
              userAmazonPrice = "$" + amazonPrice
              userAmazonHold = "$" + result.Amount
              userAmazonAverage = "$" + result.AverageCost
              
              userAmazonChange = Math.abs((amazonPrice - result.AverageCost)/ ((amazonPrice + result.AverageCost) / 2))
              userAmazonChange = Math.round(userAmazonChange * 100) / 100 * 100
              userAmazonChange = userAmazonChange  + "%"
            }else{
              userAmazon = ""
            }

            db.close();
          });
        }else{

        }
  
        

      });


  
      //console.log('AMAZON: ' + amazonPrice)
    },3000)



    var amazonPerentage = 0;



    setInterval(function(){

      if(userID != null){
       
        MongoClient.connect(url, function(err, db) {
          if (err) throw err;
          var dbo = db.db("LAZYCOIN");
          dbo.collection("User_Owned_Stocks").findOne({UserID:userID,StockID: 1}, function(err, result) {
            if (err) throw err;
            var newAmount;
            
            if(result.AverageCost > 0){
              if(result.AverageCost < amazonPrice){
                //console.log('HIT')
                
                newAmount = Math.abs((amazonPrice - result.AverageCost)/ ((amazonPrice + result.AverageCost) / 2))
                newAmount = Math.round(newAmount * 100) / 100
                console.log("PERCENTAGE " + newAmount)
                amazonPerentage = newAmount
                newAmount = result.Start + (result.Start * newAmount)
                //console.log("AMOUNT " + newAmount)
                
  
                var myquery = { UserID: userID, StockID: 1 };
                var newvalues = { $set: {Amount: newAmount} };
                dbo.collection("User_Owned_Stocks").updateOne(myquery, newvalues, function(err, res) {
                  if (err) throw err;
                  //console.log("1 document updated");
                  //db.close();
                });
  
  
              }else{
                newAmount = (amazonPrice - result.AverageCost)/ ((amazonPrice + result.AverageCost) / 2)
              }
            }else{

            }

            
          });
        });

      }else{
        //console.log("NOt HIT ")
      }


    },4000)

 

    
    


    exports.stock = (req,res) =>{

      var time = new Date();
      var currentTime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second:'numeric', hour12: true })

      res.render("stock",{
        time:currentTime,
        amazonPrice:"$" + amazonPrice,
        amazonToday:amazonToday + "%",
        amazonVolume:amazonVolume + "M"

      });
    };












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

exports.buyStock = (req,res) =>{

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {
      if (err) throw err;


      res.render("buyStock",{
        userBalance: "You have $" + result.Balance + " Available."
      });
      
      db.close();
    });
  });



};

exports.sellStock = (req,res) =>{
  res.render("sellStock",{
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
      stockInsertID = "";
      currentStock = "";
      var currentUserBalance
      var AMZN;
      var AAPL;





      MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("LAZYCOIN");

        //var userBlance;

        dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {
          if (err) throw err;
          //console.log("USER BALANCE:" + result.Balance);
          //db.close();
          //userBalance = result.Balance;
          
          dbo.collection("User_Owned_Stocks").findOne({UserID: userID, StockID: 1}, function(err, resultAMAZN) {
            if (err) throw err;
            //console.log(result2);
            //db.close();

            if(resultAMAZN.Amount > 0){
              AMZN = "AMZN";
            }else{
              AMZN = "";
            }

            dbo.collection("User_Owned_Stocks").findOne({UserID: userID, StockID: 2}, function(err, resultAPPLE) {
              if (err) throw err;
              //console.log(result2);
              //db.close();
  
              if(resultAPPLE.Amount > 0){
                AAPL = "AAPL";
              }else{
                AAPL = "";
              }

            //console.log("UB: " + result.Balance)


            var time = new Date();
            var currentTime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second:'numeric', hour12: true })
              //console.log(currentTime)

              // if(resultAMAZN != null){

              // }
            
            
            res.render("user",{
              name:name,
              userBalance: "$ " +result.Balance,
              time: currentTime,
              amazonPrice: "$" + amazonPrice,
              amazonToday: amazonToday + "%",
              applePrice: "$" + applePrice,
              appleToday: appleToday + "%",
              teslaPrice: "$" + teslaPrice,
              teslaToday: teslaToday + "%",

              amazon:userAmazon,
              userAmazonPrice:userAmazonPrice,
              userAmazonHold:userAmazonHold,
              userAmazonAverage:userAmazonAverage,
              userAmazonChange:userAmazonChange



             
             
          
          }); 


         
          db.close();

        }); 
          });
        });
      });
};




exports.comfirmation = (req,res) =>{
  res.render("comfirmation",{
  });
};

exports.comfirmationSell = (req,res) =>{
  res.render("comfirmationSell",{
  });
};

exports.search = (req,res) =>{
  res.render("search",{
  });
};



exports.history = (req,res) =>{

  var trade;
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    dbo.collection("Trade_History").find({UserID: userID}).toArray(function(err, result) {
      if (err) throw err;
      //console.log(result);
      trade = result;
      db.close();
      //console.log(trade)

      const myJSON = JSON.stringify(trade);

      json = myJSON.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');


    res.render("history",{
      trades: json
    });
  });
  });




};



//------------------------------------------------
//Page for creating an account and store into the database

exports.createAccount = async (req, res) => {

//
    var data = req.body;
    console.log(data.username)


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
              

               userBalances = {UserID: numOfDocs, Balance: 1000}

              dbo.collection("UserBalaces").insertOne(userBalances, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                //db.close();
              });
     
           
              var buyRecord3 = { UserID: numOfDocs, StockID: 3,Stock: "TSLA",Shares: 0 , Amount: 0, Start:0, AverageCost: 0  }; 
              var buyRecord4 = { UserID: numOfDocs, StockID: 4,Stock: "MSFT",Shares: 0 , Amount: 0, Start:0, AverageCost: 0  }; 
              var buyRecord5 = { UserID: numOfDocs, StockID: 5,Stock: "META",Shares: 0 , Amount: 0, Start:0, AverageCost: 0  }; 
              var buyRecord6 = { UserID: numOfDocs, StockID: 6,Stock: "DIS",Shares: 0 , Amount: 0, Start:0, AverageCost: 0  }; 
              var buyRecord7 = { UserID: numOfDocs, StockID: 1,Stock: "AMZN",Shares: 0 , Amount: 0, Start:0, AverageCost: 0  }; 
              var buyRecord8 = { UserID: numOfDocs, StockID: 2,Stock: "AAPL",Shares: 0 , Amount: 0, Start:0, AverageCost: 0  }; 

              dbo.collection("User_Owned_Stocks").insertOne(buyRecord3, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                //db.close();
              });
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord4, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                //db.close();
              });
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord5, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                //db.close();
              });
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord6, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
              });
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord7, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
              });
              dbo.collection("User_Owned_Stocks").insertOne(buyRecord8, function(err, res) {
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

           name = result.Username

          userID = result.UserID;
          var AMZN;
          var AAPL;
          
          //if matching authorzation found, find all the data associated to the account
          
          //Find balance (missing owned stocks)-----------------------------------------------------------------------------------------------------------------------------
          var loginUserBalance;
          dbo.collection("UserBalaces").findOne({UserID: result.UserID}, function(err, result) {
            if (err) throw err;
            
            loginUserBalance = result.Balance

            dbo.collection("User_Owned_Stocks").findOne({UserID: userID, StockID: 1}, function(err, resultAMAZN) {
              if (err) throw err;
              //console.log(result2);
              //db.close();nod
  
              if(resultAMAZN.Amount > 0){
                AMZN = "AMZN ";
              }else{
                AMZN = "";
              }
  
              dbo.collection("User_Owned_Stocks").findOne({UserID: userID, StockID: 2}, function(err, resultAPPLE) {
                if (err) throw err;
                //console.log(result2);
                //db.close();
    
                if(resultAPPLE.Amount > 0){
                  AAPL = "AAPL ";
                }else{
                  AAPL = "";
                }

          
            db.close();

            session=req.session;
            session.userid=req.body.username;



            var time = new Date();
            var currentTime = time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second:'numeric', hour12: true })



              res.render("user",    {
                name: name,
                userBalance : "$ " + loginUserBalance,
                amazonPrice: "$" + amazonPrice,
                applePrice: "$" + applePrice,
                teslaPrice: "$" + teslaPrice,
                time: currentTime


                
  
              });
              
          
        











          }); 
          });
          });
        }
      });
    });
  }
}






 
//-----------------------------------------------------------------------------------------------



exports.data = (req,res) =>{

var data = req.body;
var stock = data.stockSelected;

currentStock = stock

encodedParams.append("symbol", stock );


//console.log("STOCK:" + search)


MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("LAZYCOIN");
  dbo.collection("UserBalaces").findOne({UserID: userID}, function(err, result) {


    if (err) throw err;
  
    currentBalace = result.Balance;
    db.close();
  });
});

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("LAZYCOIN");
  dbo.collection("Stocks").findOne({Stock: stock}, function(err, result) {



      stockInsertID = result.StockID;

    
    //db.close();
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

	//console.log(dataFromResponse);

  stockName = dataFromResponse.result.shortName
  stockSymbol = dataFromResponse.result.symbol
  currentPrice = dataFromResponse.result.regularMarketPrice
  stockOpen = dataFromResponse.result.regularMarketOpen
  stockHigh = dataFromResponse.result.regularMarketDayHigh
  stockLow = dataFromResponse.result.regularMarketDayLow

  stockMarketChangePercent = dataFromResponse.result.regularMarketChangePercent
  stockMarketVolume = dataFromResponse.result.regularMarketVolume

  currentStockPrice = currentPrice;


  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    //console.log("STOCKID: " + stock)
    dbo.collection("User_Owned_Stocks").findOne({UserID: userID, Stock: stock}, function(err, result) {
      if (err) throw err;

      //(currentStockPrice - BoughtStockPrice ) / BoughtStockPrice
      // console.log("CURRENTPRICE: " + currentStockPrice)
      // console.log("BOUGHTPRICE : " + result.AverageCost)
      var percentage;
      var amount;
      var price;
      var todayReturn;
      var todayReturnAmount;
      var marketChangePercent;



      
      
      if(result.Amount > 0 || result.Amount == null){
        amount = result.Amount;
        price = result.AverageCost;
      }else{
        amount = "";
        price = "";
   
      }
      //console.log(price)
      //console.log("CURRETST:" + price)
      //console.log("CURRETST:" + amount)

      var returnPercentage;
      var difference;

      difference = 1 - (currentStockPrice / result.AverageCost);

      difference = difference * 100

      


  var percentage;

  //console.log("A: " + amazonPerentage)

      if(stock == "AMZN"){
        if(amazonPerentage > 0){
          percentage = amazonPerentage * 100
        }else{
          percentage = amazonPerentage
        }
        
      }


   



    //console.log("P: " + percentage)
    
      var shares = Math.round(result.Shares * 100) /100
      

  

  res.render("data",{
    balance: "You have $" + currentBalace + " available",
    name: stockName,
    symbol: stockSymbol,
    current: currentPrice,
    open: stockOpen,
    high: stockHigh,
    low: stockLow,
    amount: "$ " + amount,
    price: "$" + price,
    percentage: stockMarketChangePercent + "%",
    volume: stockMarketVolume,
    shares: result.Shares,
    returnPercentage:percentage + "%",
    average: "$ " + result.AverageCost,
    buy:"BUY",
    sell:"SELL"



  });

      //console.log(result);
      db.close();
    });
  });





}).catch(function (error) {
	console.error(error);
});



};


















exports.searchStock = async(req,res) =>{


var data = req.body;
var searchStock = data.stockSearch
var buy;
var sell;

console.log("SEARCH: " + searchStock)

if(searchStock == "AMZN" || searchStock == "AAPL" || searchStock == "TSLA" || searchStock == "MSFT" || searchStock == "DIS" || searchStock == "META"){
  buy = "BUY";
  sell = "SELL";
}else{

}


encodedParams.append("symbol", searchStock );



const options = {
  method: 'GET',
  url: 'https://yahoofinance-stocks1.p.rapidapi.com/stock-metadata',
  params: {Symbol: searchStock},
  headers: {
    'X-RapidAPI-Key': '238218e685msh4e469b864f5d032p184fd5jsn8fe519100be3',
    'X-RapidAPI-Host': 'yahoofinance-stocks1.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
  var dataFromResponse = response.data;
  console.log(dataFromResponse)


  stockName = dataFromResponse.result.shortName
  stockSymbol = dataFromResponse.result.symbol
  currentPrice = dataFromResponse.result.regularMarketPrice
  stockOpen = dataFromResponse.result.regularMarketOpen
  stockHigh = dataFromResponse.result.regularMarketDayHigh
  stockLow = dataFromResponse.result.regularMarketDayLow

  stockMarketChangePercent = dataFromResponse.result.regularMarketChangePercent
  stockMarketVolume = dataFromResponse.result.regularMarketVolume



  res.render("data",{
    name: stockName,
    symbol: stockSymbol,
    current: currentPrice,
    open: stockOpen,
    high: stockHigh,
    low: stockLow,
    percentage: stockMarketChangePercent + "%",
    volume: stockMarketVolume,
    shares: 0,
    amount: 0,
    price:0,
    returnPercentage:0,
    buy:buy,
    sell:sell
  
  
  });
},)







}















//-----------------------------------------------------------------------------------------------






exports.buy = async(req,res) =>{


  var data = req.body
  var enterAmount = data.amount





  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    dbo.collection("UserBalaces").findOne({UserID:userID}, function(err, result) {
      if (err) throw err;

      console.log("CURRENT: " + currentStockPrice)
    
 if(enterAmount <= result.Balance){



  var sharesCalculate = parseInt(enterAmount) / currentStockPrice
  

  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    dbo.collection("User_Owned_Stocks").findOne({UserID:parseInt(userID),StockID:parseInt(stockInsertID)}, function(err, result2) {
      if (err) throw err;
     
      sharesCalculate =  sharesCalculate + result2.Shares

      console.log(result2.Shares)
      
      var updatedAmount = parseInt(enterAmount) + parseInt(result2.Amount) 
      console.log("SHARE: " + sharesCalculate)

      var averageCostCalculate = (currentStockPrice * sharesCalculate) / sharesCalculate

      if(result2.AverageCost == 0){
        averageCostCalculate = averageCostCalculate
      }else{
        averageCostCalculate = (result2.AverageCost + averageCostCalculate)/2
      }

      
      var userAmount = result.Balance - enterAmount
      //console.log('AVERAGE: ' + averageCostCalculate)
      console.log('UserAMOUNt ' + userAmount)
      
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("LAZYCOIN");
    var myquery = { UserID: parseInt(userID), StockID: parseInt(stockInsertID) };
    var mybalance = {UserID: parseInt(userID)}
    var newAmount = { $set: {Amount: updatedAmount } };
    var newStart = { $set: {Start: updatedAmount } };
    var newShares = {$set: {Shares: sharesCalculate}}
    var newAverageCost = {$set: {AverageCost: averageCostCalculate}}
    var newUserBalance = {$set: {Balance: userAmount}}
    dbo.collection("User_Owned_Stocks").updateOne(myquery, newAmount, function(err, res) {
      if (err) throw err;
    });
    dbo.collection("User_Owned_Stocks").updateOne(myquery, newShares, function(err, res) {
      if (err) throw err;
    });
    dbo.collection("User_Owned_Stocks").updateOne(myquery, newAverageCost, function(err, res) {
      if (err) throw err;
    });
    dbo.collection("UserBalaces").updateOne(mybalance, newUserBalance, function(err, res) {
      if (err) throw err;
    });
    dbo.collection("User_Owned_Stocks").updateOne(myquery, newStart, function(err, res) {
      if (err) throw err;
    });

    res.render("buyStock",{
      tradeMessage: "You bought " + result2.Stock + " at $" + currentStockPrice + " for $" + enterAmount,
      userBalance: "You have  $" + userAmount + " available"
    })
  });

});
});


 }else{
  res.render("buyStock",{
    tradeMessage: "You don't have enough!"
  })
 }



});
});

}






exports.sell = async(req,res) =>{

  
  }



exports.live = (req,res) =>{
 


encodedParams.append("symbol", currentStock );


const options = {
  method: 'GET',
  url: 'https://yahoofinance-stocks1.p.rapidapi.com/stock-metadata',
  params: {Symbol: currentStock},
  headers: {
    'X-RapidAPI-Key': '238218e685msh4e469b864f5d032p184fd5jsn8fe519100be3',
    'X-RapidAPI-Host': 'yahoofinance-stocks1.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
  var dataFromResponse = response.data;


  console.log(dataFromResponse.result.regularMarketPrice)

  res.render("live",{
   price:dataFromResponse.result.regularMarketPrice
  })
 
})
}


