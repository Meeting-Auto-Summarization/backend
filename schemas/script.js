const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const scriptSchema = new Schema({
    name: {
        type: ObjectId,
        required: true,
        ref: 'Meeting',
    },
    text: [{
        user: {
            type: String,
        },
        content: {
            type: String,
        },
        isChecked: {
            type: Boolean,
            default: false,
        },
    }],
});

module.exports = mongoose.model('Script', scriptSchema);
