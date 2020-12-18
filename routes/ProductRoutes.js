const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel.js');
const passport = require('passport');
const UserModel = require('../models/UserModel.js');

router.get(
    '/',
    (req, res) => {
        ProductModel
            .find()
            .then(
                (document) => {
                    res.send(document);
                }
            )
            .catch(
                (error) => {
                    console.log('error', error);
                }
            )
    }
)

router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {

        let formData = {
            category: req.body.category,
            title: req.body.title,
            description: req.body.description,
            monthlyRent: req.body.monthlyRent,
            images: req.body.images,
            sellerEmail: "hello"
        };


        UserModel
            .findById(req.user.id)
            .then(
                (user) => {
                    formData.sellerEmail = user.email;

                    const newProduct = new ProductModel(formData);

                    newProduct
                        .save()
                        .then(
                            (document) => {
                                res.send(document)
                            }
                        )
                        .catch(
                            (error) => {
                                console.log('error', error);
                                res.send({ 'error': error })
                            }
                        )
                }
            )
            .catch(
                (error) => {
                    res.send({
                        message: "error occured " + error
                    })
                }
            )


    }
)

module.exports = router;