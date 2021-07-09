const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const morgan = require('morgan')
const exphbs = require('express-handlebars') 
const methodOverride = require('method-override')
const passport = require('passport')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const connectDB = require('./config/db')

//Load Config
dotenv.config({ path: './config/config.env' })

//Passport config
require('./config/passport')(passport)

connectDB()

const app = express()
//Body parser
app.use(express.urlencoded({ extended: false}))
app.use(express.json())

//Method Override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method
      delete req.body._method
      return method
    }
  }))


if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))
}

//Handlebars helpers
const { formatDate, stripTags, truncate, editIcon, select} = require('./helpers/hbs')

//Handlebars
app.engine('.hbs', exphbs({ 
    helpers:{
        formatDate,
        stripTags, 
        truncate,
        editIcon,
        select,
},
    defaultLayout: 'main', extname: '.hbs' }));
app.set('view engine', '.hbs')

//Sessions
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl: mongoose.connection._connectionString,
        mongoOptions: {}
      })
  }))

//Passport middleware
app.use(passport.initialize())
app.use(passport.session())

//set global variable
app.use(function(req, res, next){
    res.locals.user = req.user || null
    next()
})


// Static folder
//Path module is used here, public is used so that all the file can be included
//__dirname means current director
app.use(express.static(path.join(__dirname, 'public')))

//Routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 3000
app.listen(
    PORT, 
    console.log(`Listening to ${process.env.NODE_ENV} mode on port ${PORT}`)
    )