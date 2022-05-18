const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const scriptSchema = new Schema({
    meetingId: {
        type: ObjectId,
        required: true,
        ref: 'Meeting',
    },
    text: [{
        nick: {
            type: String,
        },
        content: {
            type: String,
        },
        time: {
            type: String,
        },
        isChecked: {
            type: Boolean,
            default: false,
        },
    }],
});

module.exports = mongoose.model('Script', scriptSchema);
