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
        unique: true
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
        unique: true,
        ref: 'User'
    }],
    visited: [{
        type: ObjectId,
        required: true,
        unique: true,
        ref: 'User'
    }],
    ongoing: {
        type: Boolean,
        required: true,
        default: true
    }
});

module.exports = mongoose.model('Meeting', meetingSchema);
