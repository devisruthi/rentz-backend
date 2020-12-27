const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const UserModel = require('../models/UserModel.js');

const cloudinary = require('cloudinary').v2;

require('dotenv').config();
const jwtSecret = process.env.JWT_SECRET;

router.post(
    '/register',           // users/register
    (req, res) => {
        const formData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            phoneNumber: req.body.phoneNumber
        };

        const newUserModel = new UserModel(formData);
    
        /*
         * Here we check for (A) uniques emails and
         * (B) prepare password for registration
         */
    
        /* Part (A) */
        // 1. Search the database for a matching email address
        UserModel
        .findOne({ email: formData.email })
        .then(
            (document) => {

                // 2.1. If there is a match, reject the registration
                if(document) {
                    res.status(401).send({ message: "An account with that email already exists." })
                }

                // 2.2. If there is not match, proceed to Part (B)
                else {
                    /* Part (B) */
                    // 1. Generate a salt
                    bcrypt.genSalt(
                        (err, salt) => {

                            // 2. Take salt and user's password to hash password
                            bcrypt.hash(
                                formData.password,
                                salt,
                                (err, encryptedPassword) => {
                                    // 3. Replace the user's password with the hash
                                    newUserModel.password = encryptedPassword;

                                    // 4. Save to the database
                                    newUserModel
                                    .save()
                                    .then(
                                        (document) => {
                                            res.status(200).send(document)
                                        }
                                    )
                                    .catch(
                                        (errorObj) => {
                                            console.log('error', error);
                                            res.status(500).send({ message: "Something went wrong ", error : errorObj })
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            }
        )
        .catch(
            (errorObj) => {
                res.status(500).send({ message: "Something went wrong ", error : errorObj })
            }
        )
    }
);

router.post(
    '/login',           // users/login
    (req, res) => {
        // 1. Capture the email and password
        const formData = {
            email: req.body.email,
            password: req.body.password
        }
        // 2. Find a match in the database for email
        UserModel
        .findOne({ email: formData.email})
        .then(
            (document) => {         
                if(document) {
                    // 2.1. If email has been found, check their password
                    bcrypt.compare(
                        formData.password,
                        document.password
                    )
                    .then(
                        (passwordMatch) => {

                            if(passwordMatch === true) {
                                // 3.1. If their password is correct, generate the json web token
                                const payload = {
                                    id: document._id,
                                    email: document.email
                                }
                                jsonwebtoken.sign(
                                    payload,
                                    jwtSecret,
                                    (errorObj, theToken) => {

                                        if(errorObj) {
                                            res.status(500).send({ message: "Something went wrong ", error : errorObj })
                                        }

                                        // 4. Send the json web token to the client
                                        res.status(200).send({ theToken: theToken })
                                    }
                                )
                            }
                            else {
                                // 3.2 If password is incorrect, reject the login
                                res.status(401).send({ message: "Wrong email or password"});
                            }
                        }
                    )
                    .catch(
                        (errorObj) => {
                            res.status(500).send({ message: "Something went wrong ", error : errorObj })
                        }
                    )
                } 
                else {
                    // 2.2 If no email match, reject the login
                    res.status(401).send({ message: "Wrong email or password"});
                }
            }
        )
    }
)

router.get(
    '/',               // https://www.app.com/users
    (req, res) => {
        UserModel
        .find()
        .then(
            (document) => {
                console.log('user', document);
                res.status(200).send(document);
            }
        )
        .catch(
            (errorObj) => {
                console.log('error', error)
                res.status(500).send({ message: "Something went wrong ", error : errorObj })
            }
        )
    }
);

router.get(
    '/profile',
    passport.authenticate('jwt', {session: false}),
    (req, res) => {
        UserModel
        .findById(req.user.id)
        .then(
            (document) => {
                res.status(200).send(document)
            }
        )
        .catch(
            (errorObj) => {
                res.status(500).send({ message: "Something went wrong ", error : errorObj })
            }
        )

    }
)

router.put(
    '/update',           // users/update
    passport.authenticate('jwt', {session: false}),
    async (req, res) => {
        const formData = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: req.body.password,
            photoUrl: req.body.photoUrl
        };
    
        /*
         * Here we check for (B) prepare password for registration, 
         * and (C) upload image to Cloudinary if provided
         */
    
        /* Part (C) */
        // 1. Check if image is included
        if(Object.values(req.files).length>0){
            // 1.1 If included, upload to Cloudinary
            const files = Object.values(req.files);
            await cloudinary.uploader.upload(
                // location of file
                files[0].path, 
                // callback for when file is uploaded
                (errorObj, cloudinaryResult) => {
                    if(errorObj) {
                        console.log('error from cloudinary : ', errorObj);
                        res.status(500).send({ message: "Something went wrong ", error : errorObj })
                    }
                    // 1.2 Take the image url and append it to newUserModel
                    console.log(cloudinaryResult);
                    formData.photoUrl  = cloudinaryResult.url;
                }
            )
        }

        
        // If user wants password change 

        if(formData.password.length > 0) {
            /* Part (B) */
            // 1. Generate a salt
            bcrypt.genSalt(
                (err, salt) => {

                    // 2. Take salt and user's password to hash password
                    bcrypt.hash(
                        formData.password,
                        salt,
                        (err, encryptedPassword) => {
                            // 4. Save to the database
                            UserModel
                            .findByIdAndUpdate(
                                req.user.id,
                                {
                                    $set: {
                                        firstName: formData.firstName,
                                        lastName: formData.lastName,
                                        email: formData.email,
                                        password: encryptedPassword,
                                        photoUrl: formData.photoUrl

                                    }
                                }
                            )
                            .then(
                                (document) => {
                                    res.status(200).send(document)
                                }
                            )
                            .catch(
                                (errorObj) => {
                                    console.log('error', errorObj);
                                    res.status(500).send({ message: "Something went wrong ", error : errorObj })
                                }
                            )
                        }
                    )
                }
            )
        }

        // If user does want password change
        else {
            UserModel
            .findByIdAndUpdate(
                req.user.id,
                {
                    $set: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        photoUrl: formData.photoUrl

                    }
                },
                //{ new: true }
            )
            .then(
                (document) => {
                    res.status(200).send(document)
                }
            )
            .catch(
            (error) => {
                console.log('error', error);
                res.status(500).send({ message: "Something went wrong ", error : errorObj })
            }
        )
        }
    }
);

module.exports = router;