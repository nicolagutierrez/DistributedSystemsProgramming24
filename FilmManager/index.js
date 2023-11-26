'use strict';

const path = require('path');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const oas3Tools = require('oas3-tools');
const { Validator, ValidationError } = require('express-json-validator-middleware');

const serverPort = 3001;

//* Authentication-related imports *//
const passport = require('passport');
const session = require('express-session');

const filmManager = require(path.join(__dirname, 'components/FilmManager'));
const userController = require(path.join(__dirname, 'controllers/UsersController'));
const filmController = require(path.join(__dirname, 'controllers/FilmsController'));
const reviewController = require(path.join(__dirname, 'controllers/ReviewsController'));
const utils = require(path.join(__dirname, 'utils/writer.js'));


//* Set up and enable Cross-Origin Resource Sharing (CORS) *//
const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
};

  
//* Passport *//
passport.serializeUser(function (user, cb) { 
    cb(null, user);
});
  
passport.deserializeUser(function (user, cb) { 
    return cb(null, user); 
});
  
  
//* Defining authentication verification middleware *//
const isLoggedIn = (req, res, next) => {
if(req.isAuthenticated()) {
    return next();
}
return res.status(401).json({error: 'Not authorized'});
}


//* Defining JSON validator middleware *//
const filmSchema = JSON.parse(fs.readFileSync(path.join('.', 'json_schemas', 'film_schema.json')).toString());
const userSchema = JSON.parse(fs.readFileSync(path.join('.', 'json_schemas', 'user_schema.json')).toString());
const reviewSchema = JSON.parse(fs.readFileSync(path.join('.', 'json_schemas', 'review_schema.json')).toString());
const validator = new Validator({ allErrors: true });
validator.ajv.addSchema([userSchema, filmSchema, reviewSchema]);
const addFormats = require('ajv-formats').default;
addFormats(validator.ajv);
const validate = validator.validate;


//* Swagger configuration *//
const options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};
const expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
const app = expressAppConfig.getApp();


//* Creating the session *//
app.use(cors(corsOptions));
app.use(session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.authenticate('session'));


//* Route methods *//
app.get('/api', function(req, res, next) {utils.writeJson(res, new filmManager());});
app.post('/api/films', isLoggedIn, validate({ body: filmSchema }), filmController.createFilm);

app.get('/api/films/private', isLoggedIn, filmController.getPrivateFilms);
app.get('/api/films/private/:filmId', isLoggedIn, filmController.getSinglePrivateFilm);
app.put('/api/films/private/:filmId', isLoggedIn, validate({ body: filmSchema }), filmController.updateSinglePrivateFilm);
app.delete('/api/films/private/:filmId', isLoggedIn, filmController.deleteSinglePrivateFilm);

app.get('/api/films/public', filmController.getPublicFilms);
app.get('/api/films/public/invited', isLoggedIn, filmController.getInvitedFilms);
app.get('/api/films/public/:filmId', filmController.getSinglePublicFilm);
app.put('/api/films/public/:filmId', isLoggedIn, validate({ body: filmSchema }), filmController.updateSinglePublicFilm);
app.delete('/api/films/public/:filmId', isLoggedIn, filmController.deleteSinglePublicFilm);

app.get('/api/films/public/:filmId/reviews', reviewController.getFilmReviews);
app.get('/api/films/public/:filmId/reviews/:reviewerId', reviewController.getSingleReview);
app.put('/api/films/public/:filmId/reviews/:reviewerId', isLoggedIn, reviewController.updateSingleReview);
app.post('/api/films/public/:filmId/reviews', isLoggedIn, reviewController.issueFilmReview);
app.delete('/api/films/public/:filmId/reviews/:reviewerId', isLoggedIn, reviewController.deleteSingleReview);

app.get('/api/users', isLoggedIn, userController.getUsers);
app.get('/api/users/:userId', isLoggedIn, userController.getSingleUser);
app.post('/api/users/authenticator', userController.authenticateUser);


//* Error handlers for validation and authentication errors *//
app.use(function(err, req, res, next) {
    if (err instanceof ValidationError) {
        res.status(400).send(err);
    } else next(err);
});

app.use(function(err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        var authErrorObj = { errors: [{ 'param': 'Server', 'msg': 'Authorization error' }] };
        res.status(401).json(authErrorObj);
    } else next(err);
});


//* Initialize the Swagger middleware *//
http.createServer(app).listen(serverPort, function() {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});