var express = require('express');
var router = express.Router();
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var fs = require('fs');

//Twili Voice Call Data import
const accountSid = require('../env2').accountSid;
const authToken = require('../env2').authToken;
const phoneNumber = require('../env2').phoneNumber;
const agent = require('../env2').agent;
const twLink = require('../env2').twLink;
const client = require('twilio')(accountSid, authToken);


router.post('/:formID',function(req,res,next){
    console.log("deneme")
    // Create Call
    // client.calls
    // .create({
    // url:twLink + req.params.formID,
    // to: phoneNumber,
    // from: agent,
    // })
    // .then(call => console.log(call.sid))

    // if(!req.body.formNumber){
    //     console.log("empty")
    // }
    if(req.body.formNumber){
        let json = JSON.stringify(req.body.formNumber);
        fs.writeFileSync('contactList.json',json, 'utf8',() => console.log("json file created!"));
    }else{
        let rawData = fs.readFileSync('contactList.json');
        let contactList = JSON.parse(rawData);
        contactList.shift();
        console.log("removed version",contactList);
        let json = JSON.stringify(contactList);
        fs.writeFileSync('contactList.json', json, 'utf8', () => console.log("contactList first element is removed!"))
    }

    let rawData = fs.readFileSync('contactList.json');
    let contactList = JSON.parse(rawData);

    if(!contactList[0]){
        console.log("call is done!")
    }else{
       // Create Call
        // client.calls
        // .create({
        // url:twLink + req.params.formID,
        // to: contactList[0].PHONE,
        // from: agent,
        // })
        // .then(call => console.log(call.sid)) 
    }
    console.log("phone  number", contactList[0])

    


    res.type('text/html');
    res.send("ok");
    
})


module.exports = router;
