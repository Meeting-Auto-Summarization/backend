const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const meetingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    hostId: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    time: {
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    members: [{
        type: ObjectId,
        required: true,
        ref: 'User'
    }],
});

module.exports = mongoose.model('Meeting', meetingSchema);
