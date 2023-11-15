var express = require('express');
var router = express.Router();

var mongoose = require("mongoose")


const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs")
const { body, validator } = require("express-validator")

const Account = require("../models/account")
const Article = require("../models/article")
const Message = require("../models/message")
const Comment = require("../models/comment")

let path = require("path")
let _views =  path.join(__dirname, 'views');


let friend_list = async (accts, iam) => {
  // let accts = jpar(jstr(await Account.find({}, { moniker:1, avatar:1, url:1}) ))
  let friends = []
  let others = []
  accts.filter(acct => acct._id !== iam._id).forEach(acct => { 
    if (iam.friends.includes(acct._id) ) {
      friends.push(acct) 
    } else {

      others.push(acct)
    }
})
  // friends = jpar(jstr(await Account.find({_id:{ $in: iam.friends }}, { moniker:1, avatar:1, url:1}) ));
  return [friends, others]
}

passport.use(
  new LocalStrategy(async (moniker, password, done) => {
    try {
      const account = await Account.findOne({ moniker: moniker });
      if (!account) {
        return done(null, false, { message: "Incorrect username or password" });
      };

      const match = await bcrypt.compare(password, account.password);
      if (!match) {
        // passwords do not match!
        return done(null, false, { message: "Incorrect password or username" })
      }
      // if (account.password !== password) {
      //   return done(null, false, { message: "Incorrect password" });
      // };
      return done(null, account);
    } catch(err) {
      return done(err);
    };
  })
);

passport.serializeUser((account, done) => {
  done(null, account.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const account = await Account.findById(id);
    done(null, account);
  } catch(err) {
    done(err);
  };
});

router.use(session({ secret: "sqwarkingmansoapbox", resave: false, saveUninitialized: true, maxAge: Date.now() + (30 * 86400 * 1000), httpOnly: false}));
router.use(passport.initialize());
router.use(passport.session());

router.use((req, res, next) => {
  res.locals.user = req.user ;
  next();
})

let sessions = []

router.use((req, res, next) => {
  try {
    if (!sessions.includes(req.session.passport.user)) {
      sessions.push(req.session.passport.user)
    }
    console.log(req.session)
    console.log(sessions)  
  } catch (err) {
    console.log("not authenticated")
  }  
  next();
})


router.get("/api/v1/authed/:id", async (req, res) => {
  if (sessions.includes(req.params.id)) {
    console.log(req.params.id + " is authenticated")
    res.json({ op: "check auth", status: 200, result: "ok"})
  } else {
    res.json({ op: "check auth", status: 403, result: "not authenticated"})
  }
})

/* GET home page. */
router.get('/', function(req, res, next) {
  //res.render('index', { title: 'birdSong' });
  res.redirect("/login")
});

/* timeline message stream support */ 

const jstr = (_in) => JSON.stringify(_in);
const jpar = (_str) => JSON.parse(_str)
const uuid = () => { 
  let url = URL.createObjectURL(new Blob([]))
  if (url.indexOf("/") > -1) { // browser
      return url.split("/")[3]
  } else { // node
      return url.split(":")[2]
  }
}

// templates
// router.get("/_", (req, res) => { })
// router.post("api/vi/", async (req, res, next) => {})
router.get("/timeline", async (req, res, next) => {

    // user = {
    //   _id: "654040c4b2a54b3a05410600",
    //   moniker: 'Vivienne',
    //   email: 'Vivienne.Feil-Moen@hotmail.com',
    //   forename: 'Vivien',
    //   surname: 'Feil-Moen',
    //   avatar: 'https://avatars.githubusercontent.com/u/74259971',
    //   friends: [
    //     "65402cefb2a54b3a054105f2",
    //     "654146f3366c9a1b6b3c2536",
    //     "654188fe366c9a1b6b3c2579",
    //     "65418901366c9a1b6b3c257d"
    //   ]
    // } 
    // let iam = jpar(jstr(await Account.findById("65402cefb2a54b3a054105f2", { moniker:1, forename:1, avatar:1, friends:1})))
    // let friends = iam.friends.push(iam._id) // XXX wrong got to remove 'new ObjectId()' to make work properly

   try {
    iam = req.user // res.locals.user
    console.log(iam._id)
    console.log(iam.moniker)
    
    // simplifies query statement
    iam.friends.push(iam._id);
    
    let articles = jpar(jstr(await Article.find({author:{ $in: iam.friends }}).populate("author", { moniker:1, avatar:1, url:1, friends: 1}).sort({timestamp:-1})));
    let articles_ids = articles.map(art => art._id);
    let [_comments, _messages, _accounts] = await Promise.all([
      Comment.find({ article: { $in: articles_ids}})
        .populate("author", { moniker:1, avatar:1, url:1}).sort({timestamp:-1}),
      Message.find({ $or: [{ sender: iam._id}, {recipient: iam._id }]})
        .populate("sender", { moniker:1, avatar:1, url:1})
        .populate("recipient", { moniker:1, avatar:1, url:1}).sort({timestamp:-1}),
      Account.find({}, { moniker:1, avatar:1, url:1 })
    ])
    let [friends, others] = await friend_list(jpar(jstr(_accounts)), iam)
    let comments = jpar(jstr(_comments));
    let messages = jpar(jstr(_messages));
    console.log(jstr(_messages));
    console.log(messages.length)
    res.render("timeline", { iam, friends, others, articles, comments, messages });

  } catch (err) {
    res.redirect("/login")
   }
})

router.post("/api/v1/likes_plus_one", async (req, res, next) => {
  try {
    if (req.body.collection === "article") {
      result = await Article.findOneAndUpdate({ _id: req.body._id }, { $inc: { likes: 1 }}, { new: true})
    } else if (req.body.collection === "comment") {
      result = await Comment.findOneAndUpdate({ _id: req.body._id }, { $inc: { likes: 1 }}, { new: true})
    }
    if (result) {
      res.json({ op: "likes_plus_one", status: 200, result: result})
    } else {
      // ooops
      res.json({ op: "likes_plus_one", status: 404, result: "unexpected behaviour"})
    }
  } catch (err) {
    res.json({ op: "likes_plus_one", status: 500, result: err})
  }
  next();
})

router.get("/api/v1/timeline/:id", async (req, res, next) => {
  try {
    let iam = await Account.findById(req.params.id)
    let articles = jpar(jstr(await Article.find({author:{ $in: iam.friends }}).populate("author", { moniker:1, avatar:1, url:1, friends: 1}).sort({timestamp:-1})));
    let articles_ids = articles.map(art => art._id);
    let comments = jpar(jstr(await Comment.find({ article: { $in: articles_ids}}).populate("author", { moniker:1, avatar:1, url:1, friends: 1}).sort({timestamp:-1})));
  
    
    let jade = require("pug")
    let result = jade.renderFile("views/timeline_of_id.pug", { iam, articles, comments, articles_ids }) 

    res.json({ op: "timeline/" + req.params.id, status: 200, result: result})      
  } catch (err) {
    res.json({ op: "timeline/" + req.params.id, status: 500, result: err})
  } 
})

router.post("/api/v1/article", async (req, res, next) => {
  // console.log(req.account._id)
  let new_article = new Article({
    timestamp: new Date().toISOString(),
    author: new mongoose.Types.ObjectId(req.body.author), // req.account._id,
    subject: req.body.subject,
    payload: req.body.payload,
    attachments: req.body.attachments,
    likes: 0
  })
  console.log(new_article)
  res_save = await new_article.save()
  res.json({ op: "new posting", status: 200, result: res_save })

})

router.post("/api/v1/comment", async (req, res, next) => {
  console.log(req.body.attachments)
  let new_comment = new Comment({
    timestamp: new Date().toISOString(),
    author: new mongoose.Types.ObjectId(req.body.author), // req.account._id,
    article: new mongoose.Types.ObjectId(req.body.article),
    payload: req.body.payload,
    attachments: req.body.attachments,
    likes: 0
  })
  console.log(new_comment)
  res_save = await new_comment.save()
  res.json({ op: "new comment", status: 200, result: res_save })

})

router.post("/api/v1/message", async (req, res, next) => {
  console.log(req.body.attachments)
  let new_message = new Message({
    timestamp: new Date().toISOString(),
    sender: new mongoose.Types.ObjectId(req.body.sender), // req.account._id,
    recipient: new mongoose.Types.ObjectId(req.body.recipient),
    payload: req.body.payload,
    attachments: req.body.attachments
  })
  console.log(new_message)
  res_save = await new_message.save()
  res.json({ op: "new message", status: 200, result: res_save })

})

router.post("/api/v1/update_profile", async (req, res, next) => {
  try {
    let update_result = await Account.findOneAndUpdate({ _id: req.body._id},
      { $set: { [req.body.key]: req.body.value}}, 
      { returnNewDocument: true, projection: {moniker: 1, email:1, forename: 1, surname:1, avatar:1, friends: 1 }}
    )
    // delete update_result.password
    res.json({ op: "update_profile", status: 200, result: update_result})  
  } catch (err) {
    res.json({  op: "update_profile", status: 200, result: err })
  }
})



/*  account login / register / reset / unregister routes */ 

router.get("/login", (req, res) => {
  res.render("login", {title:"Songbird"})
});

router.post("/login", 
  passport.authenticate("local", {
    successRedirect: "/timeline",
    failureRedirect: "/login"
  })
)

router.get('/register', function(req, res, next) {
  res.render('register', {title: "Songbird Register"});
});

router.post('/register', async (req, res, next) => {
  console.log('process signin');
  body("email").custom(async value => {
    const user = await User.findOne({ email: value} ).exec();
    if (user) {
      // throw new Error('E-mail already in use');
      res.render("register", {title: "Songbird Register",  errors: [`email ${value} is already registered`]})
    }
  }),
  body('password').isLength({ min: 8 }),
  body('confirm').custom((value, { req }) => {
    return value === req.body.password;
  })
  bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
    if(err) {
      res.redirect("/register");
    }
    // if err, do something
    // otherwise, store hashedPassword in DB
    try {
      const user = new User({
        email: req.body.email,
        anom: req.body.anom,
        password: hashedPassword,
        forename: req.body.forename,
        surname: req.body.surname,
      });
      const result = await user.save();
      console.log("registered\n" + result);
      let messages = await Message.find().exec()
      // res.render("messageboard", {messages: messages, user: req.user, club: req.user.club, admin: req.user.admin })
      // res.render("/", {title: "Post-a-Note Register", messages: messages, user: req.user ? req.user: false, club: req.user ? req.user.club: false, admin:req.user ? req.user.admin : false })
      res.render("index")
      // res.redirect("/messageboard");
    } catch(err) {
      return next(err);
    };
  })  
});

// logout done
router.post('/logout', async (req, res, next) => {
  console.log('process signout');
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  })
  res.redirect("/")
});

router.get('/reset', function(req, res, next) {
  res.render('reset_password');
});

router.post("/reset", async (req, res) => {
      try {
        let account = await User.findOne({ email: req.body.email })
        let verify_old_password = await bcrypt.compare(req.body.oldpassword, account.password)
        if (verify_old_password) {

            req.body.password = await bcrypt.hash(req.body.password, 10)
            // req.body.new_password = await bcrypt.hash(req.body.new_password, salt_length)
            let find_result = await User.findOneAndUpdate({ email: req.body.email },{ $set: { password: req.body.password }}, { new: true})
            res.redirect("/messages")
            // res.json({ op: "post / resetpassword find + update", status: 200, result: find_result, authentication_data: authentication_data})    
        } else {
            res.redirect("/reset_password")
            // res.json({ op: "reset password", status: 401, result: "incorrect data"})
        }
    } catch (err) {
      res.redirect("/")
    }    
})

router.get('/unregister', function(req, res, next) {
  res.render('unregister');
});

router.post("/unregister", async (req, res, next) => {
  // comapare password
  check_user = await User.findOne({ email: req.body.email })
  match = await bcrypt.compare(req.body.password, check_user.password)
  if (match) {
    try {
      
      let hashed = await bcrypt.hash("disabled_account_" + req.body.password, 10)
      unreg_resp = await User.findOneAndUpdate({ email: req.body.email },{ $set: {
        email: "disabled_" + req.body.email,
        password: hashed,
        active: false
      }}, { new: true})

      res.redirect("/")        
    } catch (err) {
      next(err)
    }
  }
})
















module.exports = router;
