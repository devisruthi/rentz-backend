const express = require('express');
const router = express.Router();
const ProductModel = require('../models/ProductModel.js');
const passport = require('passport');
const UserModel = require('../models/UserModel.js');
const cloudinary = require('cloudinary').v2;

router.get(
    '/',
    (req, res) => {
        ProductModel
            .find()
            .then(
                (document) => {
                    res.status(200).send(document);
                }
            )
            .catch(
                (errorObj) => {
                    console.log('error', errorObj);
                    res.status(500).send({ message: "Something went wrong ", error: errorObj, errorCode: "RNPR001" });
                }
            )
    }
)

router.get(
    '/available',
    (req, res) => {
        ProductModel
            .find({ available: true })
            .then(
                (document) => {
                    res.status(200).send(document);
                }
            )
            .catch(
                (errorObj) => {
                    console.log('error', errorObj);
                    res.status(500).send({ message: "Something went wrong ", error: errorObj, errorCode: "RNPR001" });
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
            summary: req.body.summary,
            monthlyRent: req.body.monthlyRent,
            available: req.body.available,
            images: [],
            sellerEmail: ""
        };

        const newProductModel = new ProductModel(formData);

        UserModel
            .findById(req.user.id)
            .then(
                async (user) => {
                    newProductModel.sellerEmail = user.email;

                    // 1. Check if image is included
                    if (Object.values(req.files).length > 0) {
                        // 1.1 If included, upload to Cloudinary
                        const files = Object.values(req.files);
                        console.log(files);
                        let i = 0;
                        for (i = 0; i < files.length; i++) {
                            await cloudinary.uploader.upload(
                                // location of file
                                files[i].path,
                                // callback for when file is uploaded
                                (errorObj, cloudinaryResult) => {
                                    if (errorObj) {
                                        console.log('error', errorObj);
                                        res.status(500).send({ message: "Something went wrong ", error: errorObj, errorCode: "RNPR004" });
                                    }
                                    // 1.2 Take the image url and append it to newUserModel
                                    console.log(cloudinaryResult);
                                    newProductModel.images.push(cloudinaryResult.url);
                                }
                            )
                        }
                    }

                    newProductModel
                        .save()
                        .then(
                            (document) => {
                                res.send(document)
                            }
                        )
                        .catch(
                            (errorObj) => {
                                console.log('error', errorObj);
                                res.status(500).send({ message: "Something went wrong ", error: errorObj, errorCode: "RNPR002" });
                            }
                        )
                }
            )
            .catch(
                (errorObj) => {
                    console.log('error', errorObj);
                    res.status(500).send({ message: "Something went wrong ", error: errorObj, errorCode: "RNPR003" });
                }
            )


    }
)


router.put(
    '/sold/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {

        var productId = req.params.id;


        UserModel
            .findById(req.user.id)
            .then(
                (user) => {
                    const authenticatedUserMail = user.email;

                    ProductModel
                        .update(
                            { _id: productId, sellerEmail : authenticatedUserMail },
                            {
                                $set: {
                                    available: false
                                }
                            },
                            { new: true }
                        )
                        .then(
                            (document) => {
                                if (document.nModified = 1) {
                                    res.status(200).send(document)
                                }
                                else {
                                    console.log('Product not found for updationror');
                                    res.status(401).send({ message: "Product not found with user for updation " })
                                }
                            }
                        )
                        .catch(
                            (error) => {
                                console.log('error', error);
                                res.status(500).send({ message: "Something went wrong ", error: errorObj })
                            }
                        )
                })
            .catch(
                (error) => {
                    console.log('error', error);
                    res.status(500).send({ message: "Something went wrong ", error: errorObj })
                }
            )


    }
)


router.put(
    '/setAvailable/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {

        var productId = req.params.id;

        ProductModel
            .findByIdAndUpdate(
                productId,
                {
                    $set: {
                        available: true
                    }
                },
                { new: true }
            )
            .then(
                (document) => {
                    res.status(200).send(document)
                }
            )
            .catch(
                (error) => {
                    console.log('error', error);
                    res.status(500).send({ message: "Something went wrong ", error: errorObj })
                }
            )
    }
)


module.exports = router;