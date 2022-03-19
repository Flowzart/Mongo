const express = require('express');
const Promotion = require('../models/promotion');
const authenticate = require('../authenticate');
const cors = require('./cors');
const promotionRouter = express.Router();


promotionRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Promotion.find()
            .populate('comments.author')
            .then(promotions => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(promotions);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Promotion.create(req.body)
            .then(promotion => {
                console.log('Promotion Created ', promotion);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(promotion);
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /promotions');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Promotion.deleteMany()
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

promotionRouter.route('/:promotionId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .populate('comments.author')
            .then(promotion => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(promotion);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.end(`POST operation not supported on /promotions/${req.params.promotionId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Promotion.findByIdAndUpdate(req.params.promotionId, {
            $set: req.body
        }, { new: true })
            .then(promotion => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(promotion);
            })
            .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Promotion.findByIdAndDelete(req.params.promotionId)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

promotionRouter.route('/:promotionId/comments')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .populate('comments.author')
            .then(promotion => {
                if (promotion) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(promotion.comments);
                } else {
                    err = new Error(`Promotion ${req.params.promotionId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .then(promotion => {
                if (promotion) {
                    req.body.author = req.user._id;
                    console.log(req.body);
                    promotion.comments.push(req.body);
                    promotion.save()
                        .then(promotion => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(promotion);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Promotion ${req.params.promotionId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /promotions/${req.params.promotionId}/comments`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .then(promotion => {
                if (promotion) {
                    for (let i = (promotion.comments.length - 1); i >= 0; i--) {
                        promotion.comments.id(promotion.comments[i]._id).remove();
                    }
                    promotion.save()
                        .then(promotion => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(promotion);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Promotion ${req.params.promotionId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

promotionRouter.route('/:promotionId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .populate('comments.author')
            .then(promotion => {
                if (promotion && promotion.comments.id(req.params.commentId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(promotion.comments.id(req.params.commentId));
                } else if (!promotion) {
                    err = new Error(`Promotion ${req.params.promotionId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`POST operation not supported on /promotions/${req.params.promotionId}/comments/${req.params.commentId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .then(promotion => {
                console.log(`AuthorId ${promotion.comments.id(req.params.commentId).author}`)
                console.log(`User ID ${req.user.id}`)
                if (promotion && promotion.comments.id(req.params.commentId)) {
                    if ((promotion.comments.id(req.params.commentId).author).equals(req.user._id)) {
                        console.log("This is the author");
                        if (req.body.rating) {
                        promotion.comments.id(req.params.commentId).rating = req.body.rating;
                    }
                    if (req.body.text) {
                        promotion.comments.id(req.params.commentId).text = req.body.text;
                    }
                    promotion.save()
                        .then(promotion => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(promotion);
                        })
                        .catch(err => next(err));
                    } else {
                        err = new Error('You are not authorized to delete this comment!');
                        err.status = 403;
                        return next(err);
                    }
                } else if (!promotion) {
                    err = new Error(`Promotion ${req.params.promotionId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }; 
            })
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Promotion.findById(req.params.promotionId)
            .then(promotion => {
            if (promotion && promotion.comments.id(req.params.commentId)){
                console.log(promotion.comments.id(req.params.commentId).author)
            
                if ((promotion.comments.id(req.params.commentId).author).equals(req.user._id)) {
                    console.log("This is the author");
                    promotion.comments.id(req.params.commentId).remove();
                    promotion.save()
                        .then(promotion => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(promotion);
                        })
                        
                } else {
                    err = new Error('You are not authorized to delete this comment!');
                    err.status = 403;
                    return next(err);
                }
            } else if (!promotion) {
                    err = new Error(`Promotion ${req.params.promotionId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
        }).catch(err => next(err));
    });
    
module.exports = promotionRouter;