// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * This application demonstrates how to perform basic recognize operations with
 * with the Google Cloud Speech API.
 *
 * For more information, see the README.md under /speech and the documentation
 * at https://cloud.google.com/speech/docs.
 */

const io = require('./app')

'use strict';

// sample-metadata:
//   title: Microphone stream
//   description: Streams audio input from microphone, translates to text.
//   usage: node MicrophoneStream.js <encoding> <sampleRateHertz> <languageCode>

/**
 * Note: Correct microphone settings is required: check enclosed link, and make
 * sure the following conditions are met:
 * 1. SoX must be installed and available in your $PATH- it can be found here:
 * http://sox.sourceforge.net/
 * 2. Microphone must be working
 * 3. Encoding, sampleRateHertz, and # of channels must match header of audio file you're
 * recording to.    
 * 4. Get Node-Record-lpcm16 https://www.npmjs.com/package/node-record-lpcm16
 * More Info: https://cloud.google.com/speech-to-text/docs/streaming-recognize
 */

function stt( //원래 main이었음
    //encoding = 'LINEAR16',
    //sampleRateHertz = 16000,
    //languageCode = 'en-US'
) {
    // [START micStreamRecognize]
    const recorder = require('node-record-lpcm16');

    // Imports the Google Cloud client library
    const speech = require('@google-cloud/speech');

    /**
     * TODO(developer): Uncomment the following lines before running the sample.
     */
    // const encoding = 'LINEAR16';
    // const sampleRateHertz = 16000;
    // const languageCode = 'en-US';

    const config = {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'ko-KR',
        audioChannelCount: 1,
        enableSeparateRecognitionPerChannel: true,
    };

    const request = {
        config,
        interimResults: false, //Get interim results from stream
    };


    // Creates a client
    const client = new speech.SpeechClient();

    const recognizeStream = client
        .streamingRecognize(request)
        .on('error', console.error)
        .on('data', data => {
            process.stdin.emit('data',
                data.results[0] && data.results[0].alternatives[0]
                    ? `${data}  ${data.results[0].alternatives[0].transcript}\n`
                    : '\n\nReached transcription time limit, press Ctrl+C\n'
            )
        }
        );

    // Start recording and send the microphone input to the Speech API
    recorder
        .record({
            sampleRateHertz: 16000,
            threshold: 0, //silence threshold
            recordProgram: 'sox', // Try also "arecord" or "sox"
            silence: '0.5', //seconds of silence before ending
        })
        .stream()
    // io.on('connection', function (socket) {
    //     socket.on('radio')
    //         .on('error', console.error)
    //         .pipe(recognizeStream);
    // });

    console.log('Listening, press Ctrl+C to stop.');
    // [END micStreamRecognize]

    process.on('unhandledRejection', err => {
        console.error(err.message);
        process.exitCode = 1;
    });

}

//main(...process.argv.slice(2));

module.exports = stt;