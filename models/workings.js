const mongoose = require("mongoose");

Article = require("./models/article");Comment = require("./models/comment"); // Attachment = require("./models/attachment");
Account = require("./models/account");Message  = require("./models/message");

// article, account, comment, message, x attachment redundant

jstr = (_in) => JSON.stringify(_in);jpar = (_str) => JSON.parse(_str)

bcrypt = require("bcryptjs");
require("dotenv").config();const mongodb = process.env.MONGODB_URI;

mongoose.connect(mongodb, { useUnifiedTopology: true, useNewUrlParser: true });
// const db = mongoose.connection;
// db.on("error", console.error.bind(console, "mongo connection error"));


const { faker } = require('@faker-js/faker');
// or, if desiring a different locale
// const { fakerDE: faker } = require('@faker-js/faker');

// const randomName = faker.person.fullName(); // Rowan Nikolaus
// const randomEmail = faker.internet.email(); // Kassandra.Haley@erich.biz


new_acct = async () => {
    let email = faker.internet.email();
    let hash = await bcrypt.hash("12", 10);
    let [forename, surname, rest] = email.split(/[_.-@]/g);    
    let acct = new Account({
        moniker: forename,
        email: email,
        forename: forename,
        surname: surname,
        password: hash,
        avatar: faker.image.avatar(),
        active: true,
        friends: []
    })
    return acct
}

new_article = () => {
    n = parseInt(Math.random()*2)
    atts = (n) => { arr=[]; for(x=0; x<n; x++) { arr.push(faker.image.url()) }; return arr }
    attachments = n == 0 ? [] : atts(n)
    return new Article({
        timestamp: faker.date.past(),
        author: accts[parseInt(Math.random()* naccts)]._id ,// "id: need to link to accounts ",
        subject: faker.lorem.words(parseInt(Math.random()*7) + 1),
        payload: faker.lorem.paragraphs(parseInt(Math.random()*7) + 1),
        attachments: attachments,
        likes: parseInt(Math.random()*7)
    })
}

new_comment = () => {
    nart = parseInt(Math.random()* narts) 
    ncmmtr = parseInt(Math.random()* naccts)
    // auth_id = nart == ncmmtr ? ncmmtr : nart + 1 < ncmmtr ? nart - 1: nart + 1 
    return new Comment({
        timestamp: new Date(Date.parse(arts[nart].timestamp)+ parseInt(Math.random() * 86400000 * Math.random()*3)),
        author: accts[ncmmtr]._id,
        article: arts[nart]._id,
        payload: faker.lorem.paragraphs(parseInt(Math.random()*3) + 1),
        attachments: [],
        likes: parseInt(Math.random()*7)
    })
}


// create accts first
acct = await new_acct();res = await acct.save()
// then articles bcos ref to author (account)
art = new_article(); res = await art.save()
// comments last
comm = new_comment();res = await comm.save()


let accts, arts, comms, naccts, narts, ncomms;

accts = await Account.find();naccts = accts.length;
arts = await Article.find();narts = arts.length;
comms = await Comment.find();ncomms = comms.length;

let accounts, articles, comments
accounts =jpar(jstr(accts))
articles = jpar(jstr(arts))
comments = jpar(jstr(comms))


friend_list = async (iam) => {
  friends = jpar(jstr(await Account.find({_id:{ $in: iam.friends }}, { moniker:1, avatar:1, url:1}) ));
  return friends
}




// is linkage ok?
// seems to be ok
// art = arts[3] // 0 had no comments
// let [article, comment ] = await Promise.all([
//     Article.findOne({_id: art._id}).populate("author", { moniker:1, avatar: 1, friends: 1 }),
//     Comment.find({ article: art._id }).populate("author")
// ])

// articl = jpar(jstr(article));articlcomms = jpar(jstr(comment));articlcomms.length

// articles = jpar(jstr(arts))
// comments = jpar(jstr(comms))

// naccts

// friends = []

// set up friends linkage
for (req = 0; req < naccts; req++) {
    nfr = parseInt(Math.random() * naccts / 3)
    if (req % 2 == 0) { // takes the odds
        for (fr = 1; fr <= nfr; fr++ ) {
             Promise.all([
                Account.findOneAndUpdate({ _id: accts[req]._id }, { $push: { friends: accts[fr]._id }} ),
                Account.findOneAndUpdate({ _id: accts[fr]._id }, { $push: { friends: accts[req]._id }} )
            ])
            
        }
    }
}


// res = await Promise.all([
//     Account.findOneAndUpdate({ _id: msgs[1].sender }, { $push: { friends: msgs[1].recipient }} ),
//     Account.findOneAndUpdate({ _id: msgs[1].recipient }, { $push: { friends: msgs[1].sender }} )
// ])



// friend request sequence
// 'friend' potential contact reads and either ignores, denies or accepts
friend_request_response = (frnd_req_msg, status, response) => {
    return new Message({
        timestamp: new Date().toISOString(),
        sender: frnd_req_msg.recipient._id,
        recipient: frnd_req_msg.sender._id,
        type: "Friend_request",
        status: status,
        request_id: frnd_req_msg.request_id,
        payload: response,
        type: frnd_req_msg.type
    })
}

friend_request = (requester, friend) => {
    if (requester.friends.includes( friend._id)) {
        console.log("already friended")
        return
    }
    req = new Message({
        timestamp: new Date().toISOString(),
        sender: requester._id,
        recipient: friend._id,
        type: "Friend_Request",
        request_id: new mongoose.Types.ObjectId(),
        status: -1,
        payload: "Hi I'm " + requester.forename + " and I want to befriend you. Like to hear back soon"
    })
    return req
}


// requester composes and sends a message to a potential contact
// return if friended already
frnd_req_msg = friend_request(accts[0], accts[2])

res = await frnd_req_msg.save()
/* 
->  {
        timestamp: 2023-10-31T02:16:34.446Z,
        sender: new ObjectId("65402cefb2a54b3a054105f2"),
        payload: "Hi I'm Cade and I want to befriend you. Like to hear back soon",
        recipient: new ObjectId("654040c4b2a54b3a05410600"),
        attachments: [],
        _id: new ObjectId("654063824ae3af4496bea499"),
        type: 'Friend_Request',
        request_id: new ObjectId("654063824ae3af4496bea498"),
        __v: 0
    } 
*/
// get only the friend requests and sort by ascending to ensure replies follow requests
msgs = await Message.find({type: "Friend_Request"}).populate("sender", {moniker: 1, forename: 1, avatar: 1 }).populate("recipient", {moniker: 1, forename: 1, avatar: 1 }).sort({timestamp: 1})
/* query 
[
  {
    _id: new ObjectId("654063824ae3af4496bea499"),
    timestamp: 2023-10-31T02:16:34.446Z,
    sender: {
      _id: new ObjectId("65402cefb2a54b3a054105f2"),
      moniker: 'Cade',
      forename: 'Cade',
      avatar: 'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/16.jpg'
    },
    payload: "Hi I'm Cade and I want to befriend you. Like to hear back soon",
    recipient: {
      _id: new ObjectId("654040c4b2a54b3a05410600"),
      moniker: 'Vivienne',
      forename: 'Vivienne',
      avatar: 'https://avatars.githubusercontent.com/u/74259971'
    },
    attachments: [],
    type: 'Friend_Request',
    request_id: new ObjectId("654063824ae3af4496bea498"),
    __v: 0
  }
]

*/
xok = friend_request_response(frnd_req_msg, false, "Regretably Protocol prevents .... ") 
ok = friend_request_response(frnd_req_msg, true, "OK nice to .... ")
res = await xok.save()
/*
 save
    ->  {
            timestamp: 2023-10-31T02:27:05.705Z,
            sender: new ObjectId("654040c4b2a54b3a05410600"),
            payload: 'OK nice to .... ',
            recipient: new ObjectId("65402cefb2a54b3a054105f2"),
            attachments: [],
            _id: new ObjectId("654065f94ae3af4496bea4a2"),
            type: 'Friend_Request',
            status: true,
            request_id: new ObjectId("654063824ae3af4496bea498"),
            __v: 0
        }
*/

// get only the specific friend request and sort bascending to ensure reply follows request
msgs = await Message.find({ request_id: frnd_req_msg.request_id }).sort({ timestamp: 1 })
req_response = msgs.length == 2 ? true : false // response has been received (2) or not (1) 
req_response_status = msgs[1].status // request status true:accepted or false:declned  if only one message status is indeterminate maybe ignored, inactioned, unwanted, ....

// updating both accounts to reflect new friend status
if (req_response && req_response_status) {
    // add the other to each account.friends []
    res = await Promise.all([
        Account.findOneAndUpdate({ _id: msgs[1].sender }, { $push: { friends: msgs[1].recipient }} ),
        Account.findOneAndUpdate({ _id: msgs[1].recipient }, { $push: { friends: msgs[1].sender }} )
    ])
} else {
    console.log("request response negative")
}



// articles + comments for timeline
// extract current user + friends / articles & article comments

jade = require("jade")
jade.renderFile("./views/mixins.jade", { articles: articles, comments: comments, pretty: true})




// client-side like update

res = await fetch("/api/v1/likes_plus_one", { 
    method:"post", 
    headers: {"Content-Type":"application/json"}, 
    body: JSON.stringify({_id: "65403d8eb2a54b3a054105fa", increment: "likes" })})
  
  await res.json()



// author -> articles -> comments


accts = await Account.find();naccts = accts.length;
// then articles bcos ref to author (account)
arts = await Article.find();narts = arts.length;
// comments last
comms = await Comment.find();ncomms = comms.length;

[accts.length, arts.length, comms.length]

accounts = jpar(jstr(accts)) // 11 ok
articles = jpar(jstr(arts))  // 17 ok
comments = jpar(jstr(comms)) // 23 ok

accounts.forEach((acct, idx) => {
    acct_arts = articles.filter(art => art.author === acct._id)
    console.log(` ${acct.moniker} has ${acct_arts.length} arts & ${acct.friends.length} friends`)
    acct_arts.forEach((art, artidx) => console.log( ['   art #', artidx, ' has ', comments.filter(c=>c.article===art._id).length, "comms" ].join(""))) // , ' comments id:', art._id
    // console.log(acct_arts)
});






max_width = 200 
max_height = 150
calc_scaled_width_height = (img) => { 
  if (img.naturalWidth > img.naturalHeight) { // landscape
    new_width = max_width
    new_height = new_width / (img.naturalWidth / img.naturalHeight)
    console.log([img.naturalWidth, img.naturalHeight])
    console.log([new_width, new_height])
  } else if (img.naturalWidth < img.naturalHeight) { // portrait
    new_width = max_height * (img.naturalWidth / img.naturalHeight)
    new_height = max_height 
    console.log([img.naturalWidth, img.naturalHeight])
    console.log([new_width, new_height])
  } else { // square
      new_width = new_height = max_height
  }
  return [new_width, new_height]
}

async function get_URL_Base64(url, max_wdth, max_ht) {
  // https://stackoverflow.com/questions/34124604/convert-img-to-base64-javascript
  return new Promise(function(resolve, reject) {
    let img = new Image();
    // To prevent: "Uncaught SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported."
    img.crossOrigin = "Anonymous"; 
    img.onload = function() {
      let aspect = this.naturalWidth / this.naturalHeight
      console.log([aspect, this.naturalWidth, this.naturalHeight])
      
      let [new_width, new_height] = calc_scaled_width_height(this)
      this.width = new_width
      this.height = new_height
      
      let canvas = document.createElement("canvas");
      canvas.width = new_width // this.naturalWidth;
      canvas.height = new_height // this.naturalHeight;
      
      let ctx = canvas.getContext("2d");
      ctx.drawImage(this, 0, 0, new_width, new_height);
      let dataURL = canvas.toDataURL("image/jpeg");
      resolve([aspect,  [new_width, new_height], [this.naturalWidth, this.naturalHeight], url, dataURL]); // .replace(/^data:image\/(png|jpg|jpeg|pdf);base64,/, "")
      // resolve(true)
    };  
    img.src = url;      
  });
};

url =  "https://picsum.photos/seed/uFGEZNYX30/640/480";
 
[aspect, w, h, url, b64] = await get_URL_Base64(url, 100, 75);

































































canvas = document.createElement("canvas");
ctx = canvas.getContext("2d");

image = new Image(60, 45); // Using optional size for image
image.onload = drawImage; // Draw when image has loaded

// Load an image of intrinsic size 300x227 in CSS pixels
image.src = "rhino.jpg";

function drawImage() {
  // Use the intrinsic size of image in CSS pixels for the canvas element
  canvas.width = this.naturalWidth;
  canvas.height = this.naturalHeight;

  // Will draw the image as 300x227, ignoring the custom size of 60x45
  // given in the constructor
  ctx.drawImage(this, 0, 0);

  // To use the custom size we'll have to specify the scale parameters
  // using the element's width and height properties - lets draw one
  // on top in the corner:
  ctx.drawImage(this, 0, 0, this.width, this.height);
}




/*
// current user + friends 
    cusr = accts[0]
    frnds = cusr.friends.concat([cusr._id])

// get articles first    
timeline_articles = await Article.find({ author: {$in: frnds }}).populate("author", { moniker: 1, forename: 1, avatar: 1 })
// extract ids to use in secondary query for comments
arts_ids = timeline_articles.map(ta => ta._id )
// get the comments pertaining to each article populated with the commenter meta,
comments = await Comment.find({ article: { $in: arts_ids }}).populate("author", { moniker: 1, forename: 1, avatar: 1 })




*/










/*
faker.

faker.defaultRefDate        faker.seed                  faker.setDefaultRefDate

faker.address               faker.constructor           faker.getMetadata           faker.locale
faker.localeFallback        faker.locales               faker.name                  faker.setLocale

faker._defaultRefDate       faker._randomizer           faker.airline               faker.animal
faker.color                 faker.commerce              faker.company               faker.database
faker.datatype              faker.date                  faker.definitions           faker.finance
faker.git                   faker.hacker                faker.helpers               faker.image
faker.internet              faker.location              faker.lorem                 faker.music
faker.number                faker.person                faker.phone                 faker.random
faker.rawDefinitions        faker.science               faker.string                faker.system
faker.vehicle               faker.word





faker.lorem.

faker.lorem.constructor

faker.lorem.faker                 faker.lorem.lines                 faker.lorem.paragraph
faker.lorem.paragraphs            faker.lorem.sentence              faker.lorem.sentences
faker.lorem.slug                  faker.lorem.text                  faker.lorem.word
faker.lorem.words


faker.date.
faker.date.constructor

faker.date.anytime               faker.date.between               faker.date.betweens
faker.date.birthdate             faker.date.faker                 faker.date.future
faker.date.month                 faker.date.past                  faker.date.recent
faker.date.soon                  faker.date.weekday

            faker.string.numeric() // for "random"


            n = parseInt(Math.random()*2)
            atts = (n) => { arr=[]; for(x=0; x<n; x++) { arr.push(faker.image.url()) }; return arr }
attachments = n == 0 ? [] : atts(n)
new Article({
    timestamp: faker.date.past(),
    author id: need to link to accounts 
    subject: faker.lorem.words(parseInt(Math.random()*7) + 1)
    payload: faker.lorem.paragraphs(parseInt(Math.random()*7) + 1)
    attachments: []
    likes: parseInt(Math.random()*7)

})

*/

// let readUrl = async (url) => {
//     // let url = _url + fn
//     resp = await fetch(url)
//     res = resp.blob()
//     return new Promise((resolve, reject) => {
//         const reader = new FileReader();
//         reader.onload = evt => {
//           resolve(evt.target.result);
//         };
//         reader.onerror = err => reject(err);
//         reader.readAsDataURL(res);
//       });
// }

// await readUrl(faker.image.avatar())
// const readFile = (file) => {
//     // https://masteringjs.io/tutorials/fundamentals/filereader
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = evt => {
//         resolve(evt.target.result);
//       };
//       reader.onerror = err => reject(err);
//       reader.readAsDataURL(file);
//     });
//   }

// interface User { ... } : User

// function createRandomUser() {
//     const sex = faker.person.sexType();
//     const firstName = faker.person.firstName(sex);
//     const lastName = faker.person.lastName();
//     const email = faker.internet.email({ firstName, lastName });
  
//     return {
//       _id: faker.string.uuid(),
//       avatar: faker.image.avatar(),
//       birthday: faker.date.birthdate(),
//       email,
//       firstName,
//       lastName,
//       sex,
//       subscriptionTier: faker.helpers.arrayElement(['free', 'basic', 'business']),
//     };
//   }
  
//   const user = createRandomUser();