var cheerio = require('cheerio');
var express = require('express');
var PushBullet = require('pushbullet'); //api for push notification
var pusher = new PushBullet('o.k6Ad96wcQtbBNTddbpPH1uqrhy6UVwUy');
var openshift = require('openshift-express');
var request = require("request");
// var axios = require('axios');
var Rx = require('rx');

var app = express();

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

openshift(app, {});

var timeEvents = Rx.Observable.interval(300000); //get data every 5 min
// var timeEvents = Rx.Observable.interval(1000); //get data every 5 min

timeEvents.subscribe(function () {
  getData();
});

var mongoose = require('mongoose');
mongoose.connect('mongodb://nick885:5454541a6jc@ds149479.mlab.com:49479/vidi');

var Schema = mongoose.Schema;

var AutoSchema = new Schema({
  carId    :  { type: String, default: '' },
  carUrl   :  { type: String, default: '' },
  carName  :  { type: String, default: '' },
  carPrice :  { type: Number, default: 0 },
  carPriceUsd :  { type: Number, default: 0 }
});

var autoModel = mongoose.model('Auto', AutoSchema);
var url = 'http://vidi-automarket.com.ua/buy/';

function getData() {
  request(url, function (error, response, body) {
    if (!error) {
      var $ = cheerio.load(body);
      $('.car').each(function (i, elem) {
        var carId = elem.attribs.href.split('/')[3];
        var carUrl = 'http://vidi-automarket.com.ua' + elem.attribs.href;
        var carPrice = $(this).children('.price').text().replace(/[^0-9]/g, '');
        var carPriceUsd = ($(this).children('.price').text().replace(/[^0-9]/g, '') / 27.7).toFixed();
        var carName = $(this).children('.name').text();
        var carDataObj = {carId: carId, carUrl: carUrl, carName: carName, carPrice: carPrice, carPriceUsd: carPriceUsd};

        autoModel.findOne({carId: carId},function(err, data) {
          if(!data) {
            saveData(carDataObj);
            sendPush(carDataObj);
          }
        })
        
      });
      
    } else {
      console.log("Произошла ошибка: " + error);
    }
  });
}

function saveData(model) {
  var auto = new autoModel(model);
  auto.save(function (err, test) {});
}

function sendPush(data) {
  var requestBody = `${data.carName} - ${data.carPrice} (${data.carPriceUsd} USD)`;
  var requestUrl = data.carUrl;
  pusher.link({}, requestBody, requestUrl, function (error, response) {
    console.log('link sended');
  });
}

