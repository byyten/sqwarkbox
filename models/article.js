const mongoose = require("mongoose")

const Schema = mongoose.Schema

const ArticleSchema = new Schema({
    timestamp: { type: Date, required: true, default: new Date().toISOString() },
    author: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
    subject: { type: String },
    payload: { type: String, required: true },
    attachments: [ { type: String } ],
    likes: { type: Number }
})

ArticleSchema.virtual("url").get(function () {
    return `/messages/${this._id}`
})

module.exports = mongoose.model("Article", ArticleSchema)