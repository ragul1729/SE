const express=require('express');
const mongoose=require('mongoose');
const passport=require('passport');
const bodyParser=require("body-parser");
const passportLocalMongoose=require('passport-local-mongoose');
const LocalStrategy = require('passport-local');
const flash=require('connect-flash');
const session = require('express-session');
const { countReset } = require('console');
const app=express();
const firebase=require('firebase');
//const { nextTick } = require('node:process');
var firebaseConfig = {
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
const auth=firebase.auth();


mongoose.connect('mongodb://localhost:27017/maindb', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});


////////////////////////////////////////////////////////////////////
const UserSchema=new mongoose.Schema({
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

const FileSchema=new mongoose.Schema({
        file:{
            type:String
        }
    });

const CourseSchema=new mongoose.Schema({
    courseName:{
        type:String,
        unique:true,
        required:true,
    },
    code: String
})

///////////////////////////////////////////////////////

UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User',UserSchema);
const File=mongoose.model('File',FileSchema);
const Course=mongoose.model('Course',CourseSchema);

app.use(express.urlencoded({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(session({
    secret:'Thisisasecret',
    saveUninitialized: true,
    resave: true
}));

app.use((req,res,next)=>{
    res.locals.loginError=req.flash('loginError');
    next();
})

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/',(req,res)=>{
    res.render('register.ejs');
})

app.post('/register',(req,res)=>{
    console.log(req.body.userType);
    const {username,password,name,phoneNumber,userType}=req.body;
    auth.createUserWithEmailAndPassword(username,password)
    .then((user)=>{
        const newUser=new User({username:username,name:name,courseList:[],phoneNumber:phoneNumber,userType:userType});
        console.log(newUser);
        newUser.save((err,saveduser)=>{
            if(err){
                console.log(err);
            }
            else{
                res.redirect('/home');
            }
        })

    })
    .catch((e)=>{
        res.send("Username or password already exists");
        console.log(e);
    })
    /*const newUser=new User({username:username,name:name});
    //console.log(newUser);
    try{
    User.register(newUser,password);
    res.redirect('/');
    }
    catch(e){
        console.log(e);
    }*/
})


app.get('/login',(req,res)=>{
    res.render('login.ejs');
})

app.post('/login',(req,res)=>{
    const {username,password}=req.body;
    auth.signInWithEmailAndPassword(username,password)
    .then((user)=>{
        //console.log(user);
        res.redirect('/home');
    })
    .catch((e)=>{
        console.log(e);
        req.flash('loginError','Your username or password is incorrect');
        res.redirect('/login');
    })
    //res.render('homepage.ejs');
})

app.get('/logout',(req,res)=>{
    auth.signOut();
    res.redirect('/login');
})
/*app.post('/login',passport.authenticate('local'),(req,res)=>{

    res.render('homepage.ejs');
})

app.post('/upload',(req,res)=>{
    const file=req.body.singlefile;
    const newFile=new File({file:file});
    newFile.save((err,returnfile)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(returnfile);
        }

    })
})*/

app.get('/home',(req,res)=>{
    if(!auth.currentUser){
        res.redirect('/login');
        return;
    }
    User.findOne({username:auth.currentUser.email}).populate('courseList').exec((err,currentUser)=>{
        //console.log(currentUser);
        if(currentUser){
            res.render('courses.ejs',{user:currentUser});
        }
        else{
            res.redirect('/login');
        }
    })
})

app.get('/courseRegister',(req,res)=>{
    res.render("courseRegister.ejs");
})

app.post('/courseRegister',(req,res)=>{
    const {courseName}=req.body;
    const newCourse= new Course({courseName:courseName.toUpperCase()});
    newCourse.save((err,savedCourse)=>{
        if(err){
            console.log(err);
        }
        else{
            res.redirect('/courseRegister');
        }
    })
})

app.get('/facultyList',(req, res)=> {
        User.find({}, (err, facultyList) => {
            res.render('facultyList.ejs', { facultyList: facultyList });
        });
})

app.get('/update/faculty/:fac_id',(req,res)=>{
    User.findById(req.params.fac_id,(err,faculty)=>{
        if(faculty){
            res.render('updateForm.ejs',{user:faculty});
        }
    })
});

app.post('/update/faculty/:fac_id',(req,res)=>{
    User.findById(req.params.fac_id,(err,faculty)=>{
        if(!err){
            Course.findOne({code:req.body.courseid},(err1,course)=>{
                if(!err1 && course){
                    faculty.courseList.push(course);
                    faculty.save();
                    res.redirect('/update/faculty/'+req.params.fac_id);
                }
            })
        }
    })
});

app.get('/faculty/:fac_id',(req,res)=> {
        var faculty;
        User.findById(req.params.fac_id,(err,fac)=>{
            faculty=fac;
        })
        Course.find({}, (err, courses)=> {
                if (err) {
                    console.log(err);
                }
                else {
                    res.render('faculty.ejs', {courses:courses,faculty:faculty});
                }
        });
})

app.get('/courseAssign',(req,res)=>{
    res.render('courseAssign.ejs');
})

app.listen(4000, () => {
    console.log('Serving on port 4000')
})