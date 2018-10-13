exports.requireLogin = (req, res, next) => {
  const exp = require('express');
  const app = exp();

  // console.log(app);
  if(app.locals.username) {
    return next();
  } else {
    let err = new Error('You must log in to view this page');
    err.status = 401;

    return res.redirect('/login');
  }
}