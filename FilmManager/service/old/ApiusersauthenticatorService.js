'use strict';


/**
 * Logs a user in or out
 * The user who wants to log in or out sends the user data to the authenticator which performs the operation. For logout, the operation is possible only for authenticated users.
 *
 * body User The data of the user who wants to perform log in. For login the structure must contain email and password.
 * type String The operation type (\"login\" or \"logout\") (optional)
 * no response value expected for this operation
 **/
exports.authenticateUser = function(body,type) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

