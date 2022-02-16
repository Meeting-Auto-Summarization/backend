const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const summarizeSchema = new Schema({
    name: {
        type: ObjectId,
        required: true,
        ref: 'Meeting',
    },
    text: {
        type: String,
    },
});

module.exports = mongoose.model('Surmmarize', summarizeSchema);
