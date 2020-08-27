var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var jwt = require('jsonwebtoken')
const mysql = require('./src/lib/database')

var authRouter = require('./routes/auth');
var studentsRouter = require('./routes/students');
var coursesRouter = require('./routes/courses')

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


mysql.connect()


const myKey='YehMeriKeyHai'

const authenticate = (req, res, next)=>{
  try {
    var token = req.headers.authorization
    if (!token) {
      throw new Error('Token value required as Authorization under header!')
    } else {
      token = token.split(' ')[1]
      if (token) {
        jwt.verify(token, myKey, (err, user) => {
          if (err) {
            throw new Error('Invalid Access Token')
          } else {
            req.user = user
            next()
          }
        })
      } else {
        throw new Error(' Access Token not found! ')
      }
    }
  } catch (err) {
    return res.json({
      'data':null,
      'error':{
        'message': err.message
      }
    })
  }
}

app.use('/auth', authRouter);
app.use('/students', authenticate, studentsRouter);
app.use('/courses', coursesRouter);

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

module.exports = app;
