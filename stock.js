const axios = require("axios");

const options = {
  method: 'GET',
  url: 'https://stock-and-options-trading-data-provider.p.rapidapi.com/options/aapl',
  headers: {
    'X-RapidAPI-Proxy-Secret': 'a755b180-f5a9-11e9-9f69-7bf51e845926',
    'X-RapidAPI-Key': '238218e685msh4e469b864f5d032p184fd5jsn8fe519100be3',
    'X-RapidAPI-Host': 'stock-and-options-trading-data-provider.p.rapidapi.com'
  }
};

axios.request(options).then(function (response) {
	console.log(response.data);
}).catch(function (error) {
	console.error(error);
});