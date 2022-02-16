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
            type: Number, //1이면 체크
            default: 0,
        },
    }],
});

module.exports = mongoose.model('Script', scriptSchema);
