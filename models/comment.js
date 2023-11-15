const mongoose = require("mongoose")

const Schema = mongoose.Schema

const CommentSchema = new Schema({
    timestamp: { type: Date, required: true, default: new Date().toISOString() },
    article: { type: Schema.Types.ObjectId, ref: "Article" },
    author: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
    payload: { type: String },
    attachments: [ { type: String, ref: "Attachment" } ],
    likes: { type: Number }
})

CommentSchema.virtual("url").get(function () {
    return `/comments/${this._id}`
})

module.exports = mongoose.model("Comment", CommentSchema)