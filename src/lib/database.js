const {to} = require('await-to-js')
const {Sequelize, DataTypes} = require('sequelize')

const connection = new Sequelize(
    'crud2',
    'root',
    'rootpasswordgiven',
    {
        host : 'localhost',
        dialect : 'mysql'
    })

const coursesModel = connection.define('courses', {
    id:{
        type: DataTypes.BIGINT(11),
        autoIncrement:true,
        allowNull: false,
        primaryKey: true
    },
    name:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    },
    availableSlots:{
        type: DataTypes.INTEGER,
        isInt: true,
        notNull: true
    }
})

const studentsModel = connection.define('students', {
    username:{
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    name:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    },
    age:{
        type: DataTypes.INTEGER,
        notNull: true,
    },
    sex:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    },
    stream:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    },
    encryptedPassword:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    }
})

const enrollementModel = connection.define('enrollement', {
    course_id :{
        type: DataTypes.BIGINT(11),
        allowNull:false,
        references:{
            model: coursesModel,
            key: 'id'
        }
    },
    student: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: studentsModel,
            key: 'username'
        }
    }
})

const connect = async ()=>{
    let [err, result] = await to ( connection.sync( {alter:true} ) )
    if (err){
        console.log(`Error: ${err.message}`)
        return
    }
    console.log(`Successfully connected to MySQL server !`)
}

module.exports = {
    connect, coursesModel, enrollementModel, studentsModel
}