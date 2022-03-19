const express = require('express');
const Partner = require('../models/partner');
const authenticate = require('../authenticate');
const cors = require('./cors');
const partnerRouter = express.Router();


partnerRouter.route('/')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get(cors.cors, (req, res, next) => {
        Partner.find()
            .populate('comments.author')
            .then(partners => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(partners);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
        Partner.create(req.body)
            .then(partner => {
                console.log('Partner Created ', partner);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(partner);
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end('PUT operation not supported on /partners');
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Partner.deleteMany()
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

partnerRouter.route('/:partnerId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        Partner.findById(req.params.partnerId)
            .populate('comments.author')
            .then(partner => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(partner);
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.end(`POST operation not supported on /partners/${req.params.partnerId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Partner.findByIdAndUpdate(req.params.partnerId, {
            $set: req.body
        }, { new: true })
            .then(partner => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(partner);
            })
            .catch(err => next(err));
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Partner.findByIdAndDelete(req.params.partnerId)
            .then(response => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(response);
            })
            .catch(err => next(err));
    });

partnerRouter.route('/:partnerId/comments')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        Partner.findById(req.params.partnerId)
            .populate('comments.author')
            .then(partner => {
                if (partner) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(partner.comments);
                } else {
                    err = new Error(`Partner ${req.params.partnerId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Partner.findById(req.params.partnerId)
            .then(partner => {
                if (partner) {
                    req.body.author = req.user._id;
                    console.log(req.body);
                    partner.comments.push(req.body);
                    partner.save()
                        .then(partner => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(partner);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Partner ${req.params.partnerId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res) => {
        res.statusCode = 403;
        res.end(`PUT operation not supported on /partners/${req.params.partnerId}/comments`);
    })
    .delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin,(req, res, next) => {
        Partner.findById(req.params.partnerId)
            .then(partner => {
                if (partner) {
                    for (let i = (partner.comments.length - 1); i >= 0; i--) {
                        partner.comments.id(partner.comments[i]._id).remove();
                    }
                    partner.save()
                        .then(partner => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(partner);
                        })
                        .catch(err => next(err));
                } else {
                    err = new Error(`Partner ${req.params.partnerId} not found`);
                    err.status = 404;
                    return next(err);
                }
            })
            .catch(err => next(err));
    });

partnerRouter.route('/:partnerId/comments/:commentId')
    .options(cors.corsWithOptions, (req, res) => res.sendStatus(200))
    .get((req, res, next) => {
        Partner.findById(req.params.partnerId)
            .populate('comments.author')
            .then(partner => {
                if (partner && partner.comments.id(req.params.commentId)) {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(partner.comments.id(req.params.commentId));
                } else if (!partner) {
                    err = new Error(`Partner ${req.params.partnerId} not found`);
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
        res.end(`POST operation not supported on /partners/${req.params.partnerId}/comments/${req.params.commentId}`);
    })
    .put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
        Partner.findById(req.params.partnerId)
            .then(partner => {
                console.log(`AuthorId ${partner.comments.id(req.params.commentId).author}`)
                console.log(`User ID ${req.user.id}`)
                if (partner && partner.comments.id(req.params.commentId)) {
                    if ((partner.comments.id(req.params.commentId).author).equals(req.user._id)) {
                        console.log("This is the author");
                        if (req.body.rating) {
                        partner.comments.id(req.params.commentId).rating = req.body.rating;
                    }
                    if (req.body.text) {
                        partner.comments.id(req.params.commentId).text = req.body.text;
                    }
                    partner.save()
                        .then(partner => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(partner);
                        })
                        .catch(err => next(err));
                    } else {
                        err = new Error('You are not authorized to delete this comment!');
                        err.status = 403;
                        return next(err);
                    }
                } else if (!partner) {
                    err = new Error(`Partner ${req.params.partnerId} not found`);
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
        Partner.findById(req.params.partnerId)
            .then(partner => {
            if (partner && partner.comments.id(req.params.commentId)){
                console.log(partner.comments.id(req.params.commentId).author)
            
                if ((partner.comments.id(req.params.commentId).author).equals(req.user._id)) {
                    console.log("This is the author");
                    partner.comments.id(req.params.commentId).remove();
                    partner.save()
                        .then(partner => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(partner);
                        })
                        
                } else {
                    err = new Error('You are not authorized to delete this comment!');
                    err.status = 403;
                    return next(err);
                }
            } else if (!partner) {
                    err = new Error(`Partner ${req.params.partnerId} not found`);
                    err.status = 404;
                    return next(err);
                } else {
                    err = new Error(`Comment ${req.params.commentId} not found`);
                    err.status = 404;
                    return next(err);
                }
        }).catch(err => next(err));
    });
    
module.exports = partnerRouter;