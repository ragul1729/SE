const mongoose=require('mongoose');
const passport=require('passport');
const bodyParser=require("body-parser");
const flash=require('connect-flash');
const session = require('express-session');
const { countReset } = require('console');
const firebase=require('firebase');
const request=require('supertest');


/*var firebaseConfig = {
    apiKey: "AIzaSyCu1W_ewdzxHt9E_rcmGRDB9CFSbIdryYg",
    authDomain: "se-project-135ac.firebaseapp.com",
    projectId: "se-project-135ac",
    storageBucket: "se-project-135ac.appspot.com",
    messagingSenderId: "71038082848",
    appId: "1:71038082848:web:02e6cb4eaf550c99d58145",
    measurementId: "G-YC39N1PZMW"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();*/

/*const UserSchema=new mongoose.Schema({
    username:{
    type:String,
    required:true,
    unique:true
    },
    name: String,
    courseList:[{type:mongoose.Schema.Types.ObjectId,ref:'Course'}],
    phoneNumber: String,
    userType: String
});

const CourseSchema=new mongoose.Schema({
    courseName:{
        type:String,
        unique:true,
        required:true,
    },
    code: String,
    fileNot:{
        type:Number,
        default:2
    },
    marksNot:{
        type:Number,
        default:2
    },
    assignmentNot:{
        type:Number,
        default:2
    }
})

mongoose.connect('mongodb://localhost:27017/maindb', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});

const User = mongoose.model('User',UserSchema);
const Course=mongoose.model('Course',CourseSchema);*/

const app=require('./app');
const { TestScheduler } = require('@jest/core');

test('Login authentication', ()=>{
    request(app).post('/login')
    .expect(200)
})

test('Test for register',()=>{
    request(app).get('/register')
    .expect(200)
})

test('Test for whether courses page is rendered', ()=>{
    request(app).get('/home')
    .expect(200)
})

test('Test for logging out',()=>{
    request(app).get('/logout')
    .expect(200)
})

test('Test for rendering facultylist',()=>{
    request(app).get('/facultyList')
    .expect(200)
})


test('Test for rendering update form',()=>{
    request(app).get('/update/form')
    .expect(200)
})


test('Test for rendering facultylist',()=>{
    request(app).get('/facultyList')
    .expect(200)
})


