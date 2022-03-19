const express = require('express');
const Campsite = require('../models/campsite');
const User = require('../models/users');
const Favorite = require('../models/favorites');
const authenticate = require('../authenticate')
const cors = require('./cors');
const favoriteRouter = express.Router();

favoriteRouter.route('/')
    .options(cors.corsWithOptions, authenticate.verifyUser, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Favorite.find({user: req.user._id })
            .populate('user')
            .populate('campsites')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
            if (favorite) {
                req.body.forEach(fav => {
                    if(!favorite.campsites.includes(fav._id)){
                        favorite.campsites.push(fav._id);
                    }
                });
                favorite.save()
                .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
                })
                .catch(err => next(err));
            } else {
                Favorite.create({ user: req.user._id, campsites: req.body })
                .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
                })
                .catch(err => next(err));
            }
        })
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorite');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findOneAndDelete({user: req.user._id})
        .then(favorite => {
            if (favorite) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(favorite);
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('There are no favorites to delete!');
            }
        })
        .catch(err => next(err));
    });

favoriteRouter.route('/:campsiteId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Favorite.findById(req.params.favoriteId)
            .populate('comments.author')
            .then(favorite => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorite);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
            if (favorite) {
                console.log(favorite.campsites)
                    if(!favorite.campsites.includes(req.params.campsiteId)){
                        favorite.campsites.push(req.params.campsiteId)
                        favorite.save()
                        .then(favorite => {
                            res.setHeader('Content-Type', 'text/plain');
                            res.json(favorite)
                        })
                        .catch(err => next(err));
                    } else {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/plain');
                            res.end('That campsite is already in the list of favorites!');
                    }
            } else {
                    Favorite.create({ user: req.user._id, campsites: [req.params.campsiteId]})
                    .then(favorite => {
                        res.statusCode = 200;
                        res.json(favorite)
                    })
                    .catch(err => next(err));
                    }
        }).catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /favorite');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Favorite.findOne({user: req.user._id})
        .then(favorite => {
            if(favorite) {
                const campsiteIndex = favorite.campsites.indexOf(req.params.campsiteId)
                if(campsiteIndex >= 0){
                    favorite.campsites.splice(campsiteIndex, 1)
                }
                favorite.save()
                .then(favorite => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'text/plain');
                })
            } else {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'text/plain');
                res.end('There are no favorites to delete!');
            }
        })
    });

module.exports = favoriteRouter;