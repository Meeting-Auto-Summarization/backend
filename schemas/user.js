const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const userSchema = new Schema({
    id: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    meetings: [{
        type: ObjectId,
        ref: 'Meeting'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    deletedAt: {
        type: Date,
    },
});

module.exports = mongoose.model('User', userSchema);
