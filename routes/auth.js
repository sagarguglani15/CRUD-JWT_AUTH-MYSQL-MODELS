var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const {to} = require('await-to-js')
const mysql = require('./../src/lib/database')

const myKey='YehMeriKeyHai'

router.post('/signup', async (req, res)=>{
    try{
        var body = req.body
        let username = body.username
        let name = body.name
        let age = body.age
        let sex = body.sex
        let stream = body.stream
        let password = body.password

        if (!username) {
            throw new Error(' "username" is a required attribute')
        }
        if (!password) {
            throw new Error(' "password" is a required attribute')
        }
        if (!name) {
            throw new Error(' "name" is a required attribute')
        }
        if (!age) {
            throw new Error(' "age" is a required attribute')
        }
        if (!sex) {
            throw new Error(' "sex" is a required attribute')
        }
        if (!stream) {
            throw new Error(' "stream" is a required attribute')
        }

        const encryptedPassword = await bcrypt.hash(password.toString(), 10)
        let err, result

        [err, result] = await to ( mysql.studentsModel.findAll({
            where: {
                username: username
            }
        }) )
        if(err){
            throw new Error(err.message)
        }
        if(result[0]){
            throw new Error(' A student with this username already exists !')
        }

        [err, result] = await to ( mysql.studentsModel.create({
            name, username, age, sex, stream, encryptedPassword
        }) )
        if (err){
            throw new Error(err.message)
        }

        let user = {username: username, encryptedPassword: encryptedPassword}
        const token = jwt.sign(user, myKey, {expiresIn: '50m'})
        return res.json({
            'data': { "Message": ` SignUp Successful!`,
                "yourAccesToken": `${token} `
            },
            'error': null
        })
    }
    catch (err) {
        res.json({
            'data':null,
            'error': {
                'message': err.message
            }
        })
    }
})


router.post('/login', async (req, res)=>{
    try {
        let username = req.body.username
        let password = req.body.password
        if (!username) {
            throw new Error(' "username" is a required attribute')
        }
        if (!password) {
            throw new Error(' "password" is a required attribute')
        }

        let student, err, result

        [err, result] = await to ( mysql.studentsModel.findAll({
            where: {
                username: username
            }
        }) )
        if(err){
            throw new Error(err.message)
        }
        if(!result[0]){
            throw new Error(' No student with this username exists !')
        }
        student = result[0]['dataValues']

        if ( await bcrypt.compare(password.toString(), student.encryptedPassword)){
            let user = {username: username, encryptedPassword: student.encryptedPassword}
            const token = jwt.sign(user, myKey, {expiresIn: '50m'})
            return res.json({
                'data':{ "Message": ` Login Successful!`,
                    "yourAccesToken" : `${token} `
                },
                'error':null
            })
        }else{
            throw new Error(`Incorrect password!`)
        }

    } catch (err) {
        res.json({
            'data':null,
            'error': {
                'message': err.message
            }
        })
    }
})
module.exports = router;