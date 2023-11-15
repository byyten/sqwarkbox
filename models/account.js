const mongoose = require("mongoose")

const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    moniker: { type: String, required: true, unique: true  },
    email: { type: String, required: true, unique: true  },
    forename: { type: String },
    surname:  { type: String },
    password:  { type: String, required: true },
    avatar: { type: String },
    active: { type: Boolean, default: true },
    friends: [{ type: Schema.Types.ObjectId, required: true, ref: "Account" }],
})

AccountSchema.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/accounts/${this._id}`;
});

module.exports = mongoose.model("Account", AccountSchema)