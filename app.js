const express=require('express');
const mongoose=require('mongoose');
const passport=require('passport');
const bodyParser=require("body-parser");
const passportLocalMongoose=require('passport-local-mongoose');
const LocalStrategy = require('passport-local');
const flash=require('connect-flash');
const session = require('express-session');
const { countReset } = require('console');
const reader=require('xlsx');
const app=express();
const firebase=require('firebase');
const multer=require('multer');
const { stringify } = require('querystring');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname+'-'+Date.now());
    }
});
const upload = multer({ storage: storage });

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

    courseID:{type:mongoose.Schema.Types.ObjectId,ref:'Course'},
    fileData:{
        fieldname: String,
        originalname: String,
        encoding: String,
        mimetype: String,
        destination: String,
        filename: String,
        path: String,
        size: Number
    },
    UploadedDate: String,
    UploadedBy: {type:mongoose.Schema.Types.ObjectId,ref:'User'},

});

const CourseSchema=new mongoose.Schema({
    courseName:{
        type:String,
        unique:true,
        required:true,
    },
    courseCode: {
        type:String,
        unique:true,
        required:true,
    },
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

const MarkfileSchema=new mongoose.Schema({
    courseCode: String,
    UploadedBy:{
        id: {type:mongoose.Schema.Types.ObjectId,ref:'User'},
        name: String,
    },
    fileData:{
        fieldname: String,
        originalname: String,
        encoding: String,
        mimetype: String,
        destination: String,
        filename: String,
        path: String,
        size: Number
    },
    UploadedDate: String,
    markList: []
})

///////////////////////////////////////////////////////

UserSchema.plugin(passportLocalMongoose);
const User = mongoose.model('User',UserSchema);
const File=mongoose.model('File',FileSchema);
const Course=mongoose.model('Course',CourseSchema);
const Markfile=mongoose.model('Markfile',MarkfileSchema);

app.use(express.urlencoded({extended:true}));
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
//app.use(fileUpload());

app.use(session({
    secret:'Thisisasecret',
    saveUninitialized: true,
    resave: true
}));

app.use((req,res,next)=>{
    res.locals.loginError=req.flash('loginError');
    res.locals.registerError=req.flash('registerError');
    res.locals.weakPassword=req.flash('weakPassword');
    res.locals.invalidPhone=req.flash('invalidPhone');
    res.locals.passwordChangeSuccessful=req.flash('passwordChangeSuccessful');
    next();
})

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/',(req,res)=>{
    res.redirect('/login');
})

app.get('/admin/register',(req,res)=>{
    res.render('adminRegister.ejs');
})

app.post('/admin/register',(req,res)=>{
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
                res.redirect('/admin/register');
            }
        })

    })
    .catch((e)=>{
        if(e.code=='auth/email-already-in-use'){
            req.flash('registerError','Username already exists');
        }
        else if(e.code=='auth/weak-password'){
            req.flash('weakPassword','Password must be at least 6 characters');
        }
        res.redirect('/');
        console.log(e);
    })
})

app.get('/admin/course',(req,res)=>{
    Course.find({},(err,courses)=>{
        res.render('courseRegister.ejs',{courses:courses});
    })
    
})

app.post('/admin/course',(req,res)=>{
    const {courseName,courseCode}=req.body;
    const newCourse= new Course({courseName:courseName.toUpperCase(),courseCode:courseCode.toUpperCase()});
    newCourse.save((err,savedCourse)=>{
        if(err){
            console.log(err);
        }
        else{
            res.redirect('/admin/course');
        }
    })
})

app.get('/admin/course/delete/:course_id',(req,res)=>{
    Course.findByIdAndDelete(req.params.course_id,(err,courses)=>{
        if(err){
            console.log(err);
        }
        res.redirect('/admin/course');
    })
})

app.get('/admin/user',(req,res)=>{
    User.find({},(err,user)=>{
        if(!err){
            res.render('adminUser.ejs',{userList:user});
        }
    })
    
})

//both are common for students and teachers
app.get('/admin/user/update/:user_id',(req,res)=>{
    Course.find({},(err1,courses)=>{
        User.findById(req.params.user_id,(err,user)=>{
            res.render('userUpdate.ejs',{user:user,courses:courses});
        })
    })

})

app.post('/admin/user/edit/:user_id',(req,res)=>{
    if(req.body.newcourseList && req.body.newcourseList.length){
        if(typeof(req.body.newcourseList)=='string'){
            User.findById(req.params.user_id,(err,user)=>{
                user.courseList=[];
                user.courseList.push(req.body.newcourseList);
                user.save();
            })
        } else{
            User.findById(req.params.user_id,(err,user)=>{
                user.courseList=[];
                req.body.newcourseList.forEach(function(id){
                    user.courseList.push(id);
                })
                user.save();
            })
        }
    }
    res.redirect('/admin/user/update/'+req.params.user_id);
})

app.get('/login',(req,res)=>{
    res.render('login.ejs');
})

app.post('/login',(req,res)=>{
    const {username,password}=req.body;
    auth.signInWithEmailAndPassword(username,password)
    .then((user)=>{
        //console.log(user);
        if(user.email=='admin@gmail.com'){
            res.redirect('/admin');
        }
        else{
            res.redirect('/home');
        }
    })
    .catch((e)=>{
        console.log(e);
        req.flash('loginError','Your username or password is incorrect');
        res.redirect('/login');
    })
    //res.render('homepage.ejs');
})

app.get('/logout',(req,res)=>{
    if(!auth.currentUser){
        res.redirect('/login');
        return;
    }
    auth.signOut();
    res.redirect('/login');
})

app.get('/changePassword',(req,res)=>{
    res.render('forgotPassword.ejs')
})

app.post('/changePassword',(req,res)=>{
    auth.sendPasswordResetEmail('ragulcdm@gmail.com').then(function() {
        console.log('email sent successfully');
        res.redirect('/changePassword');
      }).catch(function(error) {
        console.log(error);
      });
    console.log('hello');
})


app.get('/admin',(req,res)=>{
    res.render('admin.ejs');
})

app.get('/home',(req,res)=>{
    if(!auth.currentUser){
        res.redirect('/login');
        return;
    }
    User.findOne({username:auth.currentUser.email}).populate('courseList').exec((err,currentUser)=>{
        //console.log(currentUser);
        if(currentUser){
            req.session.currentUser=currentUser;
            res.render('courses.ejs',{user:currentUser});
        }
        else{
            res.redirect('/login');
        }
    })
})

app.get('/courses/dashboard/:course_id',(req,res)=>{
    if(!auth.currentUser){
        res.redirect('/login');
        return;
    }
    Course.findById(req.params.course_id,(err,course)=>{
        if(!err){
            res.render('dashboard.ejs',{course:course});
        }
    })
});


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

app.get('/update/profile/:fac_id',(req,res)=>{
    if(!auth.currentUser){
        res.redirect('/login');
        return;
    }
    res.render('editProfile.ejs',{userid:req.params.fac_id});
});

app.post('/update/profile/:fac_id',(req,res)=>{
    const {name,password,phone}=req.body;
    
    if(name!=undefined){
        User.findById(req.params.fac_id,(err,user)=>{
            if(!err){
                user.name=name;
                user.save();
                console.log(user);
            }
        });
        res.redirect('/update/profile/'+req.params.fac_id);
    }
    if(phone!=undefined){
        User.findById(req.params.fac_id,(err,user)=>{
            if(!err){
                user.phoneNumber=phone;
                user.save();
                console.log(user)
            }
        });
        res.redirect('/update/profile/'+req.params.fac_id);
    }
    if(password!=undefined){
        auth.currentUser.updatePassword(password)
        .then(()=>{
            req.flash('passwordChangeSuccessful','Password updated successfully');
            console.log('successful');
            res.redirect('/update/profile/'+req.params.fac_id);
        })
        .catch((e)=>{
            if(e.code=='auth/weak-password'){
                req.flash('weakPassword','Your password must be at least 6 characters');
                console.log(e);
                res.redirect('/update/profile/'+req.params.fac_id);
            }
        })
    }
    
    
});

app.get('/:course_id/file/upload',(req,res)=>{
    File.find({courseID:req.params.course_id}).populate('UploadedBy').exec((err,files)=>{
        res.render('filePage.ejs',{course_id:req.params.course_id,files:files,currentUser:req.session.currentUser});
    });
});

app.post('/:course_id/file/upload',upload.single('newfile'),(req,res)=>{
    const newfile=req.file;
    const date=new Date();
    const today=date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();
    const newFile=new File({courseID:mongoose.Types.ObjectId(req.params.course_id),fileData:newfile,
        UploadedBy:mongoose.Types.ObjectId(req.session.currentUser._id),UploadedDate:today});
        newFile.save((err1,savedFile)=>{
            if(err1){
            console.log(err1);
            }
        })
        res.redirect('/'+req.params.course_id+'/file/upload');    
});

//common for all files
app.get('/:file_id/file/download',(req,res)=>{
    File.findById(req.params.file_id,(err,foundFile)=>{
        res.download('uploads/'+foundFile.fileData.filename,foundFile.fileData.filename.split("-")[0]);
    });
    
});

app.get('/:file_id/:course_id/file/delete',async (req,res)=>{
    await File.findByIdAndDelete(req.params.file_id);
    res.redirect('/'+req.params.course_id+'/file/upload');
})

// mark files
app.get('/:course_id/markfile/upload',(req,res)=>{
    if(req.session.currentUser.userType=='Teacher'){
        Markfile.find({}).exec((err,files)=>{
            res.render('markfilePage.ejs',{course_id:req.params.course_id,files:files,currentUser:req.session.currentUser});
        });
    }else{
        Course.findById(req.params.course_id,(err,foundcourse)=>{
            Markfile.findOne({courseCode:foundcourse.courseCode},(err,markfile)=>{
                if(markfile){
                    var markobj=markfile['markList'].find((ele)=>{
                        return ele['RollNumber']==req.session.currentUser.username.split("@")[0].toUpperCase();
                    });
                    console.log(markobj);
                    res.render('studentMarkpage.ejs',{markobj:markobj});
                }
                else{
                    res.render('studentMarkpage.ejs',{markobj:markfile});
                }
            })
        })
    }
})

app.post('/:course_id/markfile/upload',upload.single('newfile'),(req,res)=>{
    const newfile=req.file;
    const date=new Date();
    console.log(req.body);
    const today=date.getDate()+'/'+(date.getMonth()+1)+'/'+date.getFullYear();
    Course.findById(req.params.course_id,(err,foundcourse)=>{
        if(!err){
            User.findById(req.session.currentUser._id,(err1,founduser)=>{
                const file=reader.readFile('uploads/'+newfile.filename);
                let data=[];
                const temp = reader.utils.sheet_to_json(
                    file.Sheets[file.SheetNames[0]])
                temp.forEach((res) => {
                    data.push(res);
                })
                console.log(data);
                console.log(foundcourse);
                const newFile=new Markfile({courseCode:foundcourse.courseCode,fileData:newfile,
                    UploadedBy:{id:mongoose.Types.ObjectId(req.session.currentUser._id),name:founduser.name},UploadedDate:today,markList:data});
                newFile.save((err2,savedFile)=>{
                    if(err2){
                        console.log(err2);
                    }
                })
            })
        }
    })
    res.redirect('/'+req.params.course_id+'/markfile/upload');
    
});

app.get('/:file_id/:course_id/markfile/delete',(req,res)=>{
    Markfile.findByIdAndDelete(req.params.file_id,(err,foundfile)=>{
        if(!err){
            res.redirect('/'+req.params.course_id+'/markfile/upload');
        }
        else{
            console.log(err);
        }
    })
})


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


app.listen(4000, () => {
    console.log('Serving on port 4000')
})


module.exports=app;