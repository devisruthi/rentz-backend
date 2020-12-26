const express = require('express');
const passport = require('passport');
const router = express.Router();
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');
const UserModel = require('../models/UserModel.js');
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

module.exports = router;