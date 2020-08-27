var express = require('express');
var router = express.Router();
const {to} = require('await-to-js')
const mysql = require('./../src/lib/database')
const Sequelize = require('sequelize')

router.get('/', async (req, res)=>{
    try {
        let err, result

        [err, result] = await to ( mysql.studentsModel.findAll({
            where:{
                username: req.user.username
            }
        }) )
        if(err){
            throw new Error(err.message)
        }
        return res.json({
            'data': {"student details": result},
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

router.delete('/', async (req, res)=>{
    try {
        var curr_student
        let err, result

        [err, result] = await to ( mysql.studentsModel.findAll({
            where:{
                username: req.user.username
            }
        }) )
        if(err){
            throw new Error(err.message)
        }
        curr_student = result[0]

        if(!curr_student){
            throw new Error("Access token expired")
        }

        curr_student = curr_student['dataValues'];
        [err, result] = await to ( mysql.enrollementModel.findAll({
            attributes: ['course_id'],
            where:{
                student: req.user.username
            }
        }) )
        let deregister = result;

        [err, result] = await to ( mysql.enrollementModel.destroy({
            where:{
                student: curr_student.username
            }
        }) )
        if(err){
            throw new Error(err.message)
        }

        for (const course of deregister) {

            [err, result] = await to( mysql.coursesModel.update({
                availableSlots: Sequelize.literal('availableSlots + 1')
            },{
                where:{
                    id: course.course_id
                }
            }) )
            if(err){
                throw new Error(err.message)
            }
        }

        [err, result] = await to( mysql.studentsModel.destroy({
            where: {
                username:curr_student.username
            }
        }) )
        if(err){
            throw new Error(err.message)
        }

        return res.json({
            'data': { "Status": 'Student Deleted Successfully' },
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

module.exports = router;
