/* eslint-disable no-underscore-dangle */
/* eslint-disable global-require */
/* eslint-disable no-use-before-define */
/* eslint-disable prefer-destructuring */
/* eslint-disable consistent-return */
module.exports = (app) => {
  const schedule = require('node-schedule');
  const RecipeSchema = require('../models/recipe');
  const pullEdamamRecipes = require('./helpers/edamam.js');
  const UserSchema = require('../models/user');

  const env = process.env.NODE_ENV || 'dev';
  if (env === 'production') {
    pullEdamamRecipes(); // do this once when server boots up, on production only
  }

  schedule.scheduleJob('59 59 23 * * *', () => {
    // schedule.scheduleJob(second min hr dayOfMonth month dayOfWeek)
    pullEdamamRecipes();
  });

  app.get('/', (req, res) => {
    const queryString = req.query.term || 'empty';
    const regExpQuery = new RegExp(queryString, 'i');
    const currentPage = req.query.page || 1;
    let user;
    if (req.session.user) {
      const userId = req.session.user._id;

      UserSchema.findById(userId, (errFindingUser, userFromDB) => {
        if (errFindingUser) return res.next(errFindingUser);
        user = userFromDB;
      });
    }

    if (queryString === 'empty') {
      RecipeSchema.paginate({},
        {
          sort: { usersWhoFavorited: -1 },
          page: currentPage,
          limit: 24,
        })
        .then((results) => {
          const pageNumbers = [];
          for (let i = 1; i <= results.pages; i += 1) {
            pageNumbers.push(i);
          }
          return res.render('index', {
            user,
            recipes: results.docs,
            numPages: results.pages,
            pageNumbers,
            currentPage,
            instructions: 'Try another search term.',
          });
        })
        .catch(err => res.send(err));
    } else {
      // user searching for recipe
      RecipeSchema.paginate({
        $or:
          [
            { label: regExpQuery },
            { url: regExpQuery },
            { ingredientLines: regExpQuery },
          ],
      },
      {
        sort: { usersWhoFavorited: -1 },
        page: currentPage,
        limit: 24,
      })
        .then((results) => {
          const pageNumbers = [];
          for (let i = 1; i <= results.pages; i += 1) {
            pageNumbers.push(i);
          }
          return res.render('index', {
            recipes: results.docs,
            numPages: results.pages,
            pageNumbers,
            currentPage,
            instructions: 'Try another search term.',
            queryString,
          });
        })
        .catch(err => res.send(err));
    }
  });
};
