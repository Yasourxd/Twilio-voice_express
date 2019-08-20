var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var app = express();

//Twili Voice Call Data import
const accountSid = require('./env2').accountSid;
const authToken = require('./env2').authToken;
const phoneNumber = require('./env2').phoneNumber;
const agent = require('./env2').agent;
const twLink = require('./env2').twLink;
const client = require('twilio')(accountSid, authToken);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.disable('etag');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// Create Call
client.calls
  .create({
    url:twLink + "92293453650964",
    to: phoneNumber,
    from: agent,
  })
  .then(call => console.log(call.sid))

module.exports = app;
