'use strict';

const Review = require('../components/review');
const db = require('../components/db');
const constants = require('../utils/constants.js');

/**
 * Retrieve the number of reviews of the film with ID filmId
 * 
 * * Input: 
* - filmId: the ID of the film whose reviews need to be retrieved
 * * Output:
 * - total number of reviews of the film with ID filmId
 * 
 **/
exports.getFilmReviewsTotal = function(filmId) {
  return new Promise((resolve, reject) => {
      const sql = "SELECT count(*) total FROM reviews WHERE filmId = ? ";
      db.get(sql, [filmId], (err, size) => {
          if (err) {
              reject(err);
          } else {
              resolve(size.total);
          }
      });
  });
}

/**
 * Retrieve the reviews of the film with ID filmId
 * 
 * * Input: 
 * - req: the request of the user
 * * Output:
 * - list of the reviews
 * 
 **/
 exports.getFilmReviews = function(req) {
  return new Promise((resolve, reject) => {
      let sql = "SELECT r.filmId as fid, r.reviewerId as rid, completed, reviewDate, rating, review, c.total_rows "
                + "FROM reviews r, (SELECT count(*) total_rows FROM reviews l WHERE l.filmId = ? ) c "
                + "WHERE  r.filmId = ? ";
      let params = getPagination(req);
      if (params.length != 2) sql = sql + " LIMIT ?,?";
      db.all(sql, params, (err, rows) => {
          if (err) {
              reject(err);
          } else {
              let reviews = rows.map((row) => createReview(row));
              resolve(reviews);
          }
      });
  });
}

/**
 * Retrieve the review of the film having filmId as ID and issued to user with reviewerId as ID
 *
 * * Input: 
 * - filmId: the ID of the film whose review needs to be retrieved
 * - reviewerId: the ID ot the reviewer
 * * Output:
 * - the requested review
 * 
 **/
 exports.getSingleReview = function(filmId, reviewerId) {
  return new Promise((resolve, reject) => {
      const sql = "SELECT filmId as fid, reviewerId as rid, completed, reviewDate, rating, review "
                  + "FROM reviews WHERE filmId = ? AND reviewerId = ?";
      db.all(sql, [filmId, reviewerId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else {
              var review = createReview(rows[0]);
              resolve(review);
          }
      });
  });
}

/**
 * Issue a film review to a user
 *
 *
 * * Input: 
 * - reviewerId : ID of the film reviewer
 * - filmId: ID of the film 
 * - owner: ID of the user who wants to issue the review
 * * Output:
 * - no response expected for this operation
 * 
 **/
 exports.issueFilmReview = function(invitations, owner) {
  //console.log(invitations);
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT owner, private FROM films WHERE id = ?";
      db.all(sql1, [invitations[0].filmId], (err, rows) => {
          if (err)
                reject(err);
          else if (rows.length === 0){
              reject(404);
          } else if(owner != rows[0].owner) {
              reject(403);
          } else if(rows[0].private == 1) {
              reject(404);
          }
          else {
            let sql2 = "SELECT * FROM users WHERE id = ?";
            let invitedUsers = [invitations[0].reviewerId];
            for (let i = 1; i < invitations.length; i++) {
                //console.log(invitations[i]);
                sql2 += " OR id = ?";
                invitedUsers[i] = invitations[i].reviewerId;
            }

            db.all(sql2, invitedUsers, async function(err, rows) {
                if (err)
                    reject(err);
                else if (rows.length !== invitations.length){
                    reject(409);
                }
                else {
                    const sql3 = 'INSERT INTO reviews(filmId, reviewerId, completed) VALUES(?,?,0)';
                    var finalResult = [];
                    for (let i = 0; i < invitations.length; i++) {
                        let singleResult;
                        try {
                            singleResult = await issueSingleReview(sql3, invitations[i].filmId, invitations[i].reviewerId);
                            finalResult[i] = singleResult;
                        } catch (error) {
                            reject ('Error in the creation of the review data structure');
                            break;
                        }
                    }

                    if(finalResult.length !== 0){
                        resolve(finalResult);
                    }        
                }
            }); 
          }
      });
  });
}

/**
 * Complete and update a review
 *
 * * Input:
 * - review: review object (with only the needed properties)
 * - filmID: the ID of the film to be reviewed
 * - reviewerId: the ID of the reviewer
 * * Output:
 * - no response expected for this operation
 * 
 **/
 exports.updateSingleReview = function(review, filmId, reviewerId) {
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT * FROM reviews WHERE filmId = ? AND reviewerId = ?";
      db.all(sql1, [filmId, reviewerId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else if(reviewerId != rows[0].reviewerId) {
              reject(403);
          }
          else {
            let sql2 = 'UPDATE reviews SET completed = ?';
            let parameters = [review.completed];

            if(review.reviewDate != undefined){
              sql2 = sql2.concat(', reviewDate = ?');
              parameters.push(review.reviewDate);
            } 

            if(review.rating != undefined){
                sql2 = sql2.concat(', rating = ?');
                parameters.push(review.rating);
            } 

            if(review.review != undefined){
                sql2 = sql2.concat(', review = ?');
                parameters.push(review.review);
            } 

            sql2 = sql2.concat(' WHERE filmId = ? AND reviewerId = ?');
            parameters.push(filmId);
            parameters.push(reviewerId);

            db.run(sql2, parameters, function(err) {
              if (err)
                reject(err);
              else
                resolve(null);
           })
          }
      });
  });
}

/**
 * Delete a review invitation
 *
 * * Input: 
 * - filmId: ID of the film
 * - reviewerId: ID of the reviewer
 * - owner : ID of user who wants to remove the review
 * * Output:
 * - no response expected for this operation
 * 
 **/
exports.deleteSingleReview = function(filmId,reviewerId,owner) {
  return new Promise((resolve, reject) => {
      const sql1 = "SELECT f.owner, r.completed FROM films f, reviews r WHERE f.id = r.filmId AND f.id = ? AND r.reviewerId = ?";
      db.all(sql1, [filmId, reviewerId], (err, rows) => {
          if (err)
              reject(err);
          else if (rows.length === 0)
              reject(404);
          else if(owner != rows[0].owner) {
              reject("403");
          }
          else if(rows[0].completed == 1) {
              reject("409");
          }
          else {
              const sql2 = 'DELETE FROM reviews WHERE filmId = ? AND reviewerId = ?';
              db.run(sql2, [filmId, reviewerId], (err) => {
                  if (err)
                      reject(err);
                  else
                      resolve(null);
              })
          }
      });
  });

}

/**
 * ? Utility functions
 */
 const getPagination = function(req) {
  let pageNo = parseInt(req.query.pageNo);
  let size = parseInt(constants.OFFSET);
  let limits = [];
  limits.push(req.params.filmId);
  limits.push(req.params.filmId);
  if (req.query.pageNo == null) {
      pageNo = 1;
  }
  limits.push(size * (pageNo - 1));
  limits.push(size);
  return limits;
}

const createReview = function(row) {
  let completedReview = (row.completed === 1) ? true : false;
  return new Review(row.fid, row.rid, completedReview, row.reviewDate, row.rating, row.review);
}

const issueSingleReview = function(sql, filmId, reviewerId){
  return new Promise((resolve, reject) => {
      db.run(sql, [filmId, reviewerId], function(err) {
          if (err)
              reject('500');
          else {
              var createdReview = new Review(filmId, reviewerId, false);
              resolve(createdReview);
          }
      });
  })
}