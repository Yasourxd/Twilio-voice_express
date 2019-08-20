const VoiceResponse = require("twilio").twiml.VoiceResponse;

exports.handler = function(context, event, callback){
    const twiml = new VoiceResponse();
    twiml.say("This is a test!")
    callback(null, twiml);
}