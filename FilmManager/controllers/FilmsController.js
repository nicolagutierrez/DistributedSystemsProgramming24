'use strict';

let utils = require('../utils/writer.js');
let Films = require('../service/FilmsService.js');
const constants = require('../utils/constants.js');

module.exports.createFilm = function createFilm (req, res, next) {
  Films.createFilm(req.body, req.user.id)
    .then(function (response) {
      utils.writeJson(res, response, 201);
    })
    .catch(function (response) {
      utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};


module.exports.getPublicFilms = function getPublicFilms (req, res, next) {
  var numOfFilms = 0;
  var next=0;

  Films.getPublicFilmsTotal()
      .then(function(response) {
          numOfFilms = response;
          Films.getPublicFilms(req)
          .then(function(response) {
              if (req.query.pageNo == null) var pageNo = 1;
              else var pageNo = req.query.pageNo;
              let totalPage = Math.ceil(numOfFilms / constants.OFFSET);
              next = Number(pageNo) + 1;
              let resContent = {
                totalPages: totalPage,
                currentPage: pageNo,
                totalItems: numOfFilms,
                films: {}
              }
              if (pageNo > totalPage) {
                utils.writeJson(res, resContent);
              } else if (pageNo == totalPage) {
                resContent.films = response;
                utils.writeJson(res, resContent);
              } else {
                resContent.films = response;
                resContent.next = "/api/films/public?pageNo=" + next
                  utils.writeJson(res, resContent);
              }
          })
          .catch(function(response) {
              utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
          });
      })
      .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      });  
};

module.exports.getSinglePublicFilm = function getSinglePublicFilm (req, res, next) {
  Films.getSinglePublicFilm(req.params.filmId)
  .then(function(response) {
      utils.writeJson(res, response);
  })
  .catch(function(response) {
      if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
  });
};

module.exports.getPrivateFilms = function getPrivateFilms (req, res, next) {
  var numOfFilms = 0;
  var next=0;

  Films.getPrivateFilmsTotal(req.user.id)
      .then(function(response) {
          numOfFilms = response;
          Films.getPrivateFilms(req)
          .then(function(response) {
              if (req.query.pageNo == null) var pageNo = 1;
              else var pageNo = req.query.pageNo;
              var totalPage = Math.ceil(numOfFilms / constants.OFFSET);
              next = Number(pageNo) + 1;
              let resContent = {
                totalPages: totalPage,
                currentPage: pageNo,
                totalItems: numOfFilms,
                films: {}
              }
              
              if (pageNo > totalPage) {
                utils.writeJson(res, resContent);
              } else if (pageNo == totalPage) {
                resContent.films = response;
                utils.writeJson(res, resContent);
              } else {
                resContent.films = response;
                resContent.next = "/api/films/" + req.params.userId + "/films/private?pageNo=" + next
                utils.writeJson(res, resContent);
              }
          })
          .catch(function(response) {
              utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
          });
      })
      .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      });
};

module.exports.getSinglePrivateFilm = function getSinglePrivateFilm (req, res, next) {
  Films.getSinglePrivateFilm(req.params.filmId, req.user.id)
        .then(function(response) {
            utils.writeJson(res, response);
        })
        .catch(function(response) {
            if(response == 403){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film.' }], }, 403);
            }
            else if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.getInvitedFilms = function getInvitedFilms (req, res, next) {
  var numOfFilms = 0;
  var next=0;

  Films.getInvitedFilmsTotal(req.user.id)
      .then(function(response) {
          numOfFilms = response;
          Films.getInvitedFilms(req)
          .then(function(response) {
              if (req.query.pageNo == null) var pageNo = 1;
              else var pageNo = req.query.pageNo;
              let totalPage = Math.ceil(numOfFilms / constants.OFFSET);
              next = Number(pageNo) + 1;
              let resContent = {
                totalPages: totalPage,
                currentPage: pageNo,
                totalItems: numOfFilms,
                films: {}
            }
              if (pageNo > totalPage) {
                utils.writeJson(res, resContent);
              } else if (pageNo == totalPage) {
                resContent.films = response;
                utils.writeJson(res, resContent);
              } else {
                resContent.films = response;
                resContent.next = "/api/films/public/invited?pageNo=" + next
                utils.writeJson(res, resContent);
              }
          })
          .catch(function(response) {
              utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
          });
      })
      .catch(function(response) {
        utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
    });
};


module.exports.updateSinglePublicFilm = function updateSinglePublicFilm (req, res, next) {
  Films.updateSinglePublicFilm(req.body, req.params.filmId, req.user.id)
  .then(function(response) {
      utils.writeJson(res, response, 204);
  })
  .catch(function(response) {
      if(response == 403){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
  });
};

module.exports.updateSinglePrivateFilm = function updateSinglePrivateFilm (req, res, next) {
  Films.updateSinglePrivateFilm(req.body, req.params.filmId, req.user.id)
  .then(function(response) {
      utils.writeJson(res, response, 204);
  })
  .catch(function(response) {
      if(response == 403){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
      }
      else if (response == 404){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
      }
      else if (response == 409){
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The visibility of the film cannot be changed.' }], }, 409);
      }
      else {
          utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
      }
  });
};


module.exports.deleteSinglePublicFilm = function deleteSinglePublicFilm (req, res, next) {
  Films.deleteSinglePublicFilm(req.params.filmId, req.user.id)
        .then(function(response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function(response) {
            if(response == 403){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
            }
            else if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};

module.exports.deleteSinglePrivateFilm = function deleteSinglePrivateFilm (req, res, next) {
  Films.deleteSinglePrivateFilm(req.params.filmId, req.user.id)
        .then(function(response) {
            utils.writeJson(res, response, 204);
        })
        .catch(function(response) {
            if(response == 403){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The user is not the owner of the film' }], }, 403);
            }
            else if (response == 404){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The film does not exist.' }], }, 404);
            }
            else if (response == 409){
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': 'The visibility of the film cannot be changed.' }], }, 409);
            }
            else {
                utils.writeJson(res, { errors: [{ 'param': 'Server', 'msg': response }], }, 500);
            }
        });
};