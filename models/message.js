const mongoose = require("mongoose")

const Schema = mongoose.Schema

const MessageSchema = new Schema({
    timestamp: { type: Date, required: true, default: new Date().toISOString() },
    sender: { type: Schema.Types.ObjectId, required: true, ref: "Account" },
    payload: { type: String },
    recipient: { type: Schema.Types.ObjectId, ref: "Account" },
    attachments: [ { type: String } ]
}, { strict: false })

MessageSchema.virtual("url").get(function () {
    return `/messages/${this._id}`
})

module.exports = mongoose.model("Message", MessageSchema)