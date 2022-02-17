const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const meetingSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    users: [{
        type: ObjectId,
        required: true,
        ref: 'User'
    }],
});

module.exports = mongoose.model('Meeting', meetingSchema);
