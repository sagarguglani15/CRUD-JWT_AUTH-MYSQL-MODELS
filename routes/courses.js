var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken')
const {to} = require('await-to-js')
const mysql = require('./../src/lib/database')
const Sequelize = require('sequelize')


const myKey='YehMeriKeyHai'

const authenticate = (req, res, next)=>{
    try{
        var token = req.headers.authorization
        if (!token){
            throw new Error('Token value required as Authorization under header!')
        }else{
            token=token.split(' ')[1]
            if (token){
                jwt.verify(token, myKey, (err, user)=>{
                    if (err){
                        throw new Error ('Invalid Access Token')
                    }else{
                        req.user = user
                        next()
                    }
                })
            }else{
                throw new Error(' Access Token not found! ')
            }
        }
    }catch(err){
        return res.json({
            'data': null,
            'error': {
                'message': err.message
            }
        })
    }

}

router.get('/', async (req,res)=>{
    try{
        let [err, result] = await to (mysql.coursesModel.findAll() )
        if(err){
            throw new Error(err.message)
        }
        return res.json({
            'data': {'Course details': result},
            'error': null
        })
    } catch (err) {
        return res.json({
            'data': null,
            'error': {
                'message': err.message
            }
        })
    }

})

router.get('/:id', async (req,res)=>{
    try {
        let err, result
        [err, result] = await to ( mysql.coursesModel.findAll({
            where: {
                id: req.params.id
            }
        }))
        if(err){
            throw new Error(err.message)
        }
        if(!result[0]){
            throw new Error("No course found with this id !")
        }

        result[0]['dataValues']['enrolledStudents'] = await mysql.enrollementModel.findAll({
            where: {
                course_id: req.params.id
            }
        })

        return res.json({
            'data':result,
            'error': null
        })
    } catch (err) {
        res.json({
            'data':null,
            'error': {
                'message': err.message
            }
        })
    }
})

router.post('/', async (req,res)=>{
    try {
        if (!req.body.name){
            throw new Error(' "name" is a required attribute')
        }
        if (!req.body.availableSlots){
            throw new Error(' "availableSlots" is a required attribute')
        }

        if (parseInt(req.body.availableSlots)){
            if (parseInt(req.body.availableSlots) < 0){
                throw new Error("Available Slots must be a natural number" )
            }
        }else{
            throw new Error("Not a valid natural number !" )
        }

        let err, result
        [err, result] = await to (mysql.coursesModel.create({
            name: req.body.name,
            availableSlots: req.body.availableSlots
        }))
        if(err){
            throw new Error(err.message)
        }

        return res.json({
            'data':{"Success":"Course Added"},
            'error': null
        })

    } catch (err) {
        return res.json({
            'data':null,
            'error': {
                'message' : err.message
            }
        })
    }
})

router.post('/:id/enroll', authenticate, async (req,res)=>{
    try {
        let curr_course, err, result

        [err, result] = await to ( mysql.coursesModel.findAll({
            where:{
                id: req.params.id
            }
        }) )
        if (err){
            throw new Error(err.message)
        }
        curr_course = result[0]

        if (!curr_course) {
            throw new Error('No course found for this id!')
        }

        curr_course = curr_course['dataValues'];

        [err, result] = await to ( mysql.enrollementModel.findAll({
            where:{
                course_id: curr_course.id,
                student: req.user.username
            }
        }) )
        if (err){
            throw new Error(err.message)
        }
        if(result[0]){
            throw new Error('Student is already enrolled in this course !')
        }


        [err, result] = await to ( mysql.coursesModel.findAll({
            attributes: ['availableSlots'],
            where: {
                id: curr_course.id
            }
        }))
        if (err){
            throw new Error(err.message)
        }
        if (result[0]['dataValues']['availableSlots']<1){
            throw new Error('No slots available for this course !')
        }

        [err, result] = await to( mysql.enrollementModel.create({
            course_id: curr_course.id,
            student: req.user.username
        }) );
        if (err){
            throw new Error(err.message)
        }

        [err, result] = await to( mysql.coursesModel.update({
            availableSlots: Sequelize.literal('availableSlots - 1 ')
        },{
            where: {
                id: curr_course.id
            }
        }) )
        if(err){
            throw new Error(err.message)
        }

        return res.json({
            'data':{"Success": "Student enrolled successfully !"},
            'error': null
        })

    } catch (err) {
        return res.json({
            'data':null,
            'error': {
                'message' : err.message
            }
        })
    }
})

router.put('/:id/deregister', authenticate, async (req,res)=>{
    try {

        let curr_course, err, result

        [err, result] = await to ( mysql.coursesModel.findAll({
            where:{
                id: req.params.id
            }
        }) )
        if (err){
            throw new Error(err.message)
        }
        curr_course = result[0]

        if (!curr_course) {
            throw new Error('No course found for this id!')
        }

        curr_course = curr_course['dataValues'];

        [err, result] = await to ( mysql.enrollementModel.findAll({
            where: {
                course_id: req.params.id,
                student: req.user.username
            }
        }))
        if (err){
            throw new Error(err.message)
        }
        if (!result[0]){
            throw new Error('No student with this id is enrolled in this course !')
        }

        [err, result] = await to ( mysql.enrollementModel.destroy({
            where: {
                course_id: req.params.id,
                student: req.user.username
            }
        }))
        if (err){
            throw new Error(err.message)
        }

        [err, result] = await to ( mysql.coursesModel.update({
                availableSlots: Sequelize.literal('availableSlots + 1')
            },{
                where:{
                    id: req.params.id
                }
            }) )
        if (err){
            throw new Error(err.message)
        }

        return res.json({
            'data':{"Success":'Student unregistered successfully !'},
            'error': null
        })
    } catch (err) {
        return res.json({
            'data':null,
            'error': {
                'message' : err.message
            }
        })
    }
})


module.exports = router;