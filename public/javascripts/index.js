
class ImageB64 {
  constructor() {  }
  calc_scaled_width_height = (img_naturalWidth, img_naturalHeight) => { 
      let new_width 
      let new_height
      if (img_naturalWidth > img_naturalHeight) { // landscape
        new_width = max_width
        new_height = new_width / (img_naturalWidth / img_naturalHeight)
        console.log([img_naturalWidth, img_naturalHeight])
        console.log([new_width, new_height])
      } else if (img_naturalWidth < img_naturalHeight) { // portrait
        new_width = max_height * (img_naturalWidth / img_naturalHeight)
        new_height = max_height 
        console.log([img_naturalWidth, img_naturalHeight])
        console.log([new_width, new_height])
      } else { // square
          new_width = new_height = max_height
      }
      return [new_width, new_height]
  }
  get_scaled_URL_base64 = async (url, max_wdth, max_ht) => {
    let _this = this
    // https://stackoverflow.com/questions/34124604/convert-img-to-base64-javascript
    return new Promise(function(resolve, reject) {
      let img = new Image();
      img.classList.add("attach_img")

      // To prevent: "Uncaught SecurityError: Failed to execute 'toDataURL' on 'HTMLCanvasElement': Tainted canvases may not be exported."
      img.crossOrigin = "Anonymous"; 
      img.onload = function() {
        let aspect = this.naturalWidth / this.naturalHeight
        console.log([aspect, this.naturalWidth, this.naturalHeight])
        
        let [new_width, new_height] = _this.calc_scaled_width_height(this.naturalWidth, this.naturalHeight)
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
  }
  // add_attachment = async (evt) => {
  //   file = evt.target.files[0]
  //   src = await this.readFile(file)
  //   img = new Image()
  //   img.src = src
  //   img.filename = file.name
  //   img.size = file.size
  //   img.type = file.type
  //   return img
  // }
  get_local_Base64 = (file) => { // file is from a file input eg -> fileinput.files[0]
    // https://masteringjs.io/tutorials/fundamentals/filereader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = evt => {
        resolve(evt.target.result);
      };
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

// onload setup activities
const scaler = new ImageB64()
let max_width = 320; 
let max_height = 240;
let attached_image_width = 72
let prfl 
let msg 
let artcl 
let cmmnt


  const uuid = () => { 
    let url = URL.createObjectURL(new Blob([]))
    if (url.indexOf("/") > -1) { // browser
        return url.split("/")[3]
    } else { // node
        return url.split(":")[2]
    }
  }
  
  const jstr = (_in) => JSON.stringify(_in);
  const jpar = (_str) => JSON.parse(_str)
  
  const timestamps = (ts) => {
    return new Date().toString().slice(0, 21).replace(new Date().getFullYear(), '@')
  }
  
  /*
      scaler = new ImageB64()
  
      inp = document.createElement("input")
      inp.type = "file"
      document.body.appendChild(inp)
  
      // pick a file before proceeding
      inp.files[0].name
  
      max_width = 320; max_height = 240;
      [aspect, w, h, url, b64] = await scaler.get_scaled_URL_base64(await scaler.get_local_Base64(inp.files[0]), max_width, max_height);
  
      // proof
      i = new Image()
      document.body.appendChild(i)
      i.src = b64
  
  */
  

  const likes_plus_one = async (evt) => {
    let [collection, _id ] = evt.target.id.split("_")
    res = await fetch("/api/v1/likes_plus_one", { 
      method:"post", 
      headers: {"Content-Type":"application/json"}, 
      body: JSON.stringify({_id: _id, collection: collection, increment: "likes" })
    })
    response =  await res.json()
    console.log(response )
    if (response.status === 200) {
      evt.target.nextElementSibling.textContent = response.result.likes + " likes"
    }
  }

  const likes_click = (like) => {
    like.addEventListener("click", (evt) => {
      console.log(evt.target.id)
      likes_plus_one(evt)
    })
  }
  // these can change on re-render of timeline
  let like_incremters = document.querySelectorAll(".like .material-symbols-outlined")
  like_incremters.forEach(like => 
    likes_click(like) 
  )

  
  const attach_onchange = (file_attach) => {
    file_attach.addEventListener("change", async (evt) => {
      let [aspect, scaled_xy, original_xy, base64] = await scaler.get_scaled_URL_base64(await scaler.get_local_Base64(evt.target.files[0]), max_width, max_height);
      let img = new Image(attached_image_width)
      img.src = base64
      // img.aspect = aspect
      img.classList.add("attach_img")
      img.addEventListener("click", (evt) => { evt.target.parentNode.removeChild(evt.target)})
      evt.target.nextElementSibling.appendChild(img)
    })  
  }

  // adding attachments
  let file_attach = document.querySelectorAll("input.attach")
  file_attach.forEach( el => {
    attach_onchange(el)  
  })
  
  
 
  

  // these can change as timelines a re-rendered
  let author_click = document.querySelectorAll("button.author_ident")
    author_click.forEach(btn => {
    btn.addEventListener("click", async (evt) => { 
      console.log(evt.target.id)
      elid = evt.target.id.split("_") 
      account = elid[1]
      console.log(account + "  // go query db for account imeline")
      await timelineOf(account)
    })
  })

  // these are constant 
  let account_badges = document.querySelectorAll("button.account_badge")
  account_badges.forEach(btn => {
      btn.addEventListener("click", async (evt) => { 
        console.log(evt.target.closest("button").id)
        elid = evt.target.closest("button").id.split("_") 
        account = elid[1]
        console.log( account + " // go query db for account imeline")
        await timelineOf(account)
      })
    })

    
const timelineOf = async (id) => {
  let timeline_resp = await fetch("/api/v1/timeline/" + id)
  let timeline_result = await timeline_resp.json()
  //   timeline.result
  timeline = document.querySelector(".timeline")
  timeline.innerHTML = timeline_result.result
  
  author_click = timeline.querySelectorAll("button.author_ident")
    author_click.forEach(btn => {
    btn.addEventListener("click", async (evt) => { 
      console.log(evt.target.id)
      elid = evt.target.id.split("_") 
      account = elid[1]
      console.log(account + "  // go query db for account imeline")
      await timelineOf(account)
    })
  })

  like_incremters = timeline.querySelectorAll(".like .material-symbols-outlined")
  like_incremters.forEach(like => 
    likes_click(like) 
  )

  file_attach = timeline.querySelectorAll("input.attach")
  file_attach.forEach( el => {
    attach_onchange(el)  
  })
  
  artcl = new Article()
  cmmnt = new Comment()

}

  // profile related elements and click events

  class Profile {
    constructor () {
      let profile = document.querySelector(".profile")
      this.profile = profile
      this._id = profile.querySelector("input._id")
      let moniker, forename, surname, email
      this.moniker = moniker = profile.querySelector("input.moniker")
      this.avatar = profile.querySelector("img#avatar") // was avatar_img
      this.email = email = profile.querySelector("input.email")
      this.forename = forename = profile.querySelector("input.forename")
      this.surname = surname = profile.querySelector("input.surname")


      let meta = [moniker, email, forename, surname]
      meta.forEach(el => {
        el.addEventListener("change", async (evt) => {
          let update_result = await this.update_profile_meta(this._id.value, el.id, el.value)
          console.log(update_result)
  
        })
      })

      this.choose_avatar = profile.querySelector("input#choose_avatar")
      this.choose_avatar.addEventListener("change", async (evt) => {
        let file = evt.target.files[0]
        let src = await scaler.get_local_Base64(file)
        let [aspect, scaled_xy, original_xy, rescaled] = await scaler.get_scaled_URL_base64(src)
        try {
          let update_result = await this.update_profile_meta(this._id.value, "avatar", rescaled) // this.avatar_img.src)
          if (update_result.status === 200 ) {
            this.avatar.src = rescaled
          } else {
            console.log(update_result)
          }

        } catch (err) {
          alert("update avatar fail: " + err)
          console.log(err)
        }
      })
      this.edit_profile = profile.querySelector(".edit_profile")
      this.edit_profile.addEventListener("click", (evt) => {
        let main = profile.querySelector(".main")
        main.style.display = main.style.display === "none" ? "block" : "none" 
      })
      
      this.change_password = profile.querySelector(".change_password")
      this.change_password.addEventListener("click", (evt) => {
        window.location = "/reset"
      })
      
      this.unregister = profile.querySelector(".unregister")
      this.unregister.addEventListener("click", (evt) => {
        yn = confirm("Unregistering your account\n---------------------\n\nUnregistering your account will disable the account\nand make your messages inaccessible\nIt is an action that cannot be reversed!\nConfirm OK to remove, cancel to maintain")
        if (yn) {
          window.location = "/unregister"
        }
      })
    
      this.logout = profile.querySelector("button.logout")
      this.logout.addEventListener("click", async (evt) => {
        let off = await fetch("/logout", { method:"post" })
        console.log(off)  
      })
    }

    update_profile_meta = async (_id, key, value) => {
      try {
        let update_result = await this.update_profile(this._id.value, key, value) // this.avatar_img.src)
        if (update_result.status == 200 ) {
          console.log("success")
          return update_result
        } else {
          console.log(update_result)
          return { op: 'update_profile', status: update_result.status, result: update_result }
        }
      } catch (err) {
        console.log(err)
        return { op: 'update_profile', status: update_result.status, result: err }
       
      }
    }

    update_profile = async (_id, key, val) => {
      try {
        let upd_res = await fetch("/api/v1/update_profile", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: _id, key: key, value: val })
        })
        let res = await upd_res.json()
        console.log(res)
        return res
      } catch (err) {
        console.log(err)
        return err
      }   
    }
  }
  
  class Article {
    constructor() {
      // add new article, show/hide form
      this.add_article = document.querySelector(".add_article")
      this.show_hide_create_article(this.add_article)
      this.form = document.querySelector("form.form_new_article")
      this.form.addEventListener('submit', (evt) => {
        evt.preventDefault();
      });
      
      this.submit = this.form.querySelector(".submit")
      this.submit.addEventListener("click", async () => {
        this.post_article()
      })

      this.articles = document.querySelector(".articles")
      this.article = this.articles.querySelectorAll("div.article")[0]  
    }
    
    show_hide_create_article = (new_article) => {
      this.add_article.addEventListener("click", (evt) => {
        let add_article = document.querySelector(".form_new_article")
        add_article.style.display = add_article.style.display == "block" ?  "none" : "block"
      })
    }

    post_article = async (evt) => {
    
      // form = evt.target.closest("form")
    
      let article = {
        author: this.form.elements.author.value,
        subject: this.form.elements.subject.value,
        payload: this.form.elements.payload.value,
        attachments: Array.from(this.form.querySelectorAll("img")).map(img => img.src),
        likes: 0
      }
  
      let post_article_response
      try {
        post_article_response = await fetch("/api/v1/article", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: jstr(article)
        })
        
        console.log(post_article_response)
        if (post_article_response.status == 200) {
          let post_article_result = await post_article_response.json()
          // let post_art_resp = post_article_result.result
          this.insert_new_article(post_article_result.result)
          // return post_art_resp 
        } else {
          let err_text = await post_article_response.text()
          return { op: "post_article", status: post_article_response.status, result: err_text}
        }
      } catch (err) {
        // let err_text = await post_article_response.text()
        return { op: "post_article", status: "UA", result: err}
      } finally {
        this.form.style.display = "none"
      }
    }
    insert_new_article = async (post_art_resp) => {
     
      // clone an article node and populate with the new article content
      let new_article = this.article.cloneNode(true)
        // // subject
        // new_article.querySelector(".h1").textContent = post_art_resp.subject
        // timestamp
        new_article.querySelector(".timestamp").textContent = timestamps(post_art_resp.timestamp) // .toLocaleString()
        let identity = new_article.querySelector("button.author_ident") // = post_art_resp.subject
        identity.id = "article_" + prfl._id.value
        identity.textContent = prfl.moniker.value
        // article _id
        new_article.querySelector("._id").textContent = post_art_resp._id
        // subject
        new_article.querySelector(".subject").textContent = post_art_resp.subject
        // payload
        new_article.querySelector(".payload").textContent = post_art_resp.payload
        // likes
        new_article.querySelector(".like span").id = "article_" + post_art_resp._id
        // attachments
        let attachments = new_article.querySelector(".article.attachments")
        attachments.innerHTML = ""
        post_art_resp.attachments.forEach(attachment => {
          let img = new Image(attached_image_width)  
          img.src = attachment
          img.classList.add("attach_img")

          attachments.appendChild(img)
        })
        new_article.querySelectorAll("button.add_comment").forEach( el => {
          el.addEventListener("click", (evt) => {
            let target = evt.target.parentNode.nextElementSibling
            target.style.display = target.style.display === "none" ? "block" : "none"
          })
        })

        let like_incremter = new_article.querySelectorAll(".like .material-symbols-outlined")
        like_incremter.forEach(like => 
          likes_click(like) 
        )
        new_article.querySelectorAll(".like .likes").forEach(div => div.textContent = "0 likes")


      // update add comment form
        let form_comments = new_article.querySelector("form")
        form_comments.addEventListener("submit", (evt) => evt.preventDefault() )
        form_comments.id = "article_" + post_art_resp._id 
        form_comments.querySelector("button").id = "commentOnArticle_" + post_art_resp._id + "_add_comment"
        form_comments.elements.author.value = _id.value
        form_comments.elements.article.value = post_art_resp._id
        form_comments.elements.payload.value = ""
        form_comments.querySelector(".comment.attachments").innerHTML = ""
    
      let lbl_for = "attach_" + uuid() //  gen a uniq id to attach file input to attachment div
      form_comments.querySelector("label.lbl_attach").setAttribute("for", lbl_for)
      form_comments.querySelector("input[type='file']").id = lbl_for
      form_comments.querySelectorAll("input.attach").forEach( el => {
        el.addEventListener("change", async (evt) => {
          let [aspect, scaled_xy, original_xy, base64] = await scaler.get_scaled_URL_base64(await scaler.get_local_Base64(evt.target.files[0]), max_width, max_height);
          let img = new Image(attached_image_width)
          img.src = base64
          // img.aspect = aspect
          img.classList.add("attach_img")
          img.addEventListener("click", (evt) => { evt.target.parentNode.removeChild(evt.target)})
          evt.target.nextElementSibling.appendChild(img)
        })  
      })
      form_comments.querySelector("button.submit").addEventListener("click", (evt) => {
        cmmnt.post_comment(evt)
      })
      // comments (clear down)
      new_article.querySelector(".article_comments").innerHTML = ""

      console.log(" // article on insertion ")
      console.log(new_article.innerHTML)

      this.articles.insertBefore(new_article, this.article)
      return new_article
    }
  }

  class Comment {
    constructor() {
      let show_hide_create_comment = document.querySelectorAll("button.add_comment")
      show_hide_create_comment.forEach( el => {
        // this.show_hide_comment_form (el)
        el.addEventListener("click", (evt => {
          let target = evt.target.parentNode.nextElementSibling
          target.style.display = target.style.display === "none" ? "block" : "none"
        }))
      }) 

      
      let comment_forms = document.querySelectorAll("form.new_comment")
      comment_forms.forEach(form => {
        form.addEventListener('submit', (evt) => {
          evt.preventDefault();
        });
        form.querySelector("button.submit").addEventListener("click", (evt) => {
          this.post_comment(evt)
        })
      })
    }
    // show_hide_comment_form = (el) => {
    //   el.addEventListener("click", (evt => {
    //     let target = evt.target.parentNode.nextElementSibling
    //     target.style.display = target.style.display === "none" ? "block" : "none"
    //   }))
    // }

    post_comment = async (evt) => {
      let form = evt.target.closest("form")
      // [ "commentOnArticle", "65403d8eb2a54b3a054105fa", "add", "comment" ]
      let comment = {
        author: prfl._id.value,
        article: evt.target.id.split("_")[1],
        payload: form.elements.payload.value,
        attachments: Array.from(form.querySelectorAll("img")).map(img => img.src),
        likes: 0
      }
      let post_comment_response
      try {
        post_comment_response = await fetch("/api/v1/comment", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(comment)
        })
        
        console.log(post_comment_response)
        if (post_comment_response.status == 200) {
          // add the comment ( === response.result) to the page 
          let post_comment_result = await post_comment_response.json()
          this.insert_new_comment(evt, post_comment_result.result)
        }
    
      } catch (err) {
        // let err_text = await post_comment_response.text()
        return { op: "post new comment", status: "UA", result: err }
  
      } finally {
        form.closest("div.new_comment").style.display = "none"
      }
    }
    insert_new_comment = (evt, comment_post_return) => {
      let article = evt.target.closest('.article')      
      let comment = clone_comment.cloneNode(true)
      let attached = comment.querySelector(".comment.attachments")
    
      comment.querySelector("button.author_ident").id = "account_" + prfl._id.value
      comment.querySelector("button.author_ident").textContent = prfl.moniker.value 
      comment.querySelector(".timestamp").textContent = timestamps(comment_post_return.timestamp) // .toLocaleString()
      comment.querySelector(".payload.comment").textContent = comment_post_return.payload
      // comment.querySelector(".likes")
    
      comment.querySelector(".likes span.material-symbols-outlined").id = "comment_" + comment_post_return._id
      comment.querySelector(".likes span.likes").textContent = "0 likes"
    
      comment_post_return.attachments.forEach(attachment => {
        let img = new Image(attached_image_width)
        img.src = attachment
        img.classList.add("attach_img")

        attached.appendChild(img)
      })

      let like_incremter = comment.querySelectorAll(".like .material-symbols-outlined")
      like_incremter.forEach(like => 
        likes_click(like) 
      )
      console.log(" // comment on insertion ")
      console.log(comment.innerHTML)
      article.querySelector(".article_comments").appendChild(comment)
      
    }
  }

  class Message {
    constructor() {
        // once per page load
        this.recipient = document.querySelector("select.recipient")
        this.recipient.addEventListener("change", (evt) => {
          this.message_recipient_change(evt)
        })
            // new message, show/hide form
        this.create_message = document.querySelector(".new_message")
        this.show_hide_create_message()

        this.form = document.querySelector("form.form_message")
        this.form.addEventListener('submit', (evt) => {
          evt.preventDefault();
        });
        this.submit = this.form.querySelector(".submit")
        this.submit.addEventListener("click", async (evt) => {
          // evt.target.preventDefault()
          await this.post_message(evt)
        })
        
        // messaging container
        this.messagestream = document.querySelector(".messagestream")
        this.stream = this.messagestream.querySelector("ul.stream")
    }

    message_recipient_change = (evt) => {
      // form = evt.target.closest("form") // new_meessage form
      // recipient = evt.target
      // let form = this.recipient.closest("form")
      let isFriend = this.recipient.querySelectorAll("option")[this.recipient.selectedIndex].getAttribute("data-fr") === "1"
      if (isFriend) {
        this.form.elements.subject.value = ""
      } else {
        this.form.elements.subject.value = "friendship"
      }
      console.log(this.form.elements.subject.value)
    }

    show_hide_create_message = () => {
      this.create_message.addEventListener("click", (evt) => {
        //   let new_message = document.querySelector(".form_message")
        // new_message.style.display = new_message.style.display == "block" ?  "none" : "block"
        this.form.style.display = this.form.style.display == "block" ?  "none" : "block"
      })
    }

    post_message = async (evt) => {
      // form = evt.target.closest("form")
      // evt.target.preventDefault()
      let message = {
        sender: this.form.elements.sender.value,
        recipient: this.form.elements.recipient.value,
        subject: this.form.elements.subject.value,
        payload: this.form.elements.payload.value,
        attachments: Array.from(this.form.querySelectorAll("img")).map(img => img.src),
      }
      let post_message_response
      let err_text
      try {
        post_message_response = await fetch("/api/v1/message", {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message)
        })
        console.log(post_message_response)
        if (post_message_response.status == 200) {
          // add the message ( === response.result) to the page 
          let post_message_json = await post_message_response.json()
          this.insert_new_message(post_message_json.result)
        } else {
          err_text = await post_message_response.text()
          return { op: "new message: non 200 status", status: post_message_response.status, result: err_text }
        }
      } catch (err) {
        err_text = await post_message_response.text()
        return { op: "new message err status", status: post_message_response.status, result: err_text }
      } finally {
        this.form.style.display = "none"
      }
  
    }
  
    insert_new_message = (result) => {
      let li_stream_left = this.stream.querySelector("li.stream.left").cloneNode(true)
      li_stream_left.querySelector(".textarea").textContent = result.payload
      li_stream_left.querySelector("span.payload_owner").textContent = this.recipient[this.recipient.selectedIndex].textContent
      li_stream_left.querySelector("span.payload_time").textContent = timestamps(result.timestamp) // .toLocaleString() // + " " + new Date(res.timestamp).toLocaleTimeString().slice(0,5)
      let attachments = li_stream_left.querySelector(".attachments")
      result.attachments.forEach(attachment => {
        let img = new Image(attached_image_width)
          img.src = attachment
          img.classList.add("attach_img")
          attachments.appendChild(img)
      })
      this.stream.appendChild(li_stream_left)
    }
   
  }

  let tl = document.querySelector(".timeline")
  let clones = tl.querySelector(".clones")
  
  let clone_article = clones.querySelector(".article")
  let clone_comment = clones.querySelector(".comment_article")
  

  

  prfl = new Profile()
  msg = new Message()
  artcl = new Article()
  cmmnt = new Comment()













  /* 
  let post_article = async (evt) => {
    
    form = evt.target.closest("form")
  
    let article = {
      author: form.elements.author.value,
      subject: form.elements.subject.value,
      payload: form.elements.payload.value,
      attachments: Array.from(form.querySelectorAll("img")).map(img => img.src),
      likes: 0
    }

    try {
      response = await fetch("/api/v1/article", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: jstr(article)
      })
      
      console.log(response)
      if (response.status == 200) {
        let result = await response.json()
        let post_art_resp = result.result
        artcl.insert_new_article(post_art_resp)
        // return post_art_resp 
      } else {
        let err_text = await response.toText()
        return { op: "post_article", status: response.status, result: err_text}
      }
    } catch (err) {
      let err_text = await response.toText()
      return { op: "post_article", status: 500, result: err_text}
    } finally {
      form.style.display = "none"
    }
  }
   
  let post_comment = async (evt) => {
    let form = evt.target.closest("form")
    // [ "commentOnArticle", "65403d8eb2a54b3a054105fa", "add", "comment" ]
    let comment = {
      author: prfl._id.value,
      article: evt.target.id.split("_")[1],
      payload: form.elements.payload.value,
      attachments: Array.from(form.querySelectorAll("img")).map(img => img.src),
      likes: 0
    }

    try {
      post_comment_response = await fetch("/api/v1/comment", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comment)
      })
      
      console.log(post_comment_response)
      if (post_comment_response.status == 200) {
        // add the comment ( === response.result) to the page 
        post_comment_result = await post_comment_response.json()
        cmmnt.insert_new_comment(evt, post_comment_result)
      }
  
    } catch (err) {
      let err_text = await post_comment_response.toText()
      return { op: "post new comment", status: post_comment_response.status, result: err_text }

    } finally {
      form.closest("div.new_comment").style.display = "none"
    }
  }


  let post_message = async (evt) => {
    form = evt.target.closest("form")
    let message = {
      sender: form.elements.sender.value,
      recipient: form.elements.recipient.value,
      subject: form.elements.subject.value,
      payload: form.elements.payload.value,
      attachments: Array.from(form.querySelectorAll("img")).map(img => img.src),
      
    }

    try {
      post_message_response = await fetch("/api/v1/message", {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message)
      })
      console.log(post_message_response)
      if (post_message_response.status == 200) {
        // add the message ( === response.result) to the page 
        post_message_result = await post_message_response.json()
        msg.insert_new_message(post_message_result)
      }
    } catch (err) {

    } finally {

    }

  }

  */
   
  // let update_profile = async (_id, key, val) => {
  //   try {
  //     let upd_res = await fetch("/api/v1/update_profile", {
  //       method: "post",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({ _id: _id, key: key, value: val })
  //     })
  //     res = await upd_res.json()
  //     console.log(res)
  //     return res
  //   } catch (err) {
  //     console.log(err)
  //     return err
  //   }
  
  // }


