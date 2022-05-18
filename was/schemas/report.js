const mongoose = require('mongoose');

const { Schema } = mongoose;
const { Types: { ObjectId } } = Schema;
const summarizeSchema = new Schema({
    meetingId: {
        type: ObjectId,
        required: true,
        ref: 'Meeting',
    },
    report: [[{
        title: {
            type: String,
        },
        summary: {
            type: String,
        },
        // selected: [{
        //     type: ObjectId,
        //     ref: 'Script.text'
        // }]
    }]],
});

module.exports = mongoose.model('Report', summarizeSchema);
