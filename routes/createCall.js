var express = require('express');
var router = express.Router();
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var fs = require('fs');
var axios = require('axios');

//Twili Voice Call Data import
const accountSid = require('../env2').accountSid;
const authToken = require('../env2').authToken;
const phoneNumber = require('../env2').phoneNumber;
const agent = require('../env2').agent;
const twLink = require('../env2').twLink;
const client = require('twilio')(accountSid, authToken);


router.post('/:formID',function(req,res,next){
    console.log("direct: ", req.body);
    // let contactList = JSON.parse(req.body);
    // console.log("JSON version: ", contactList);
    // console.log("aa",req)
    if(Object.keys(req.body).length != 0){
        // console.log(req.body);
        fs.writeFileSync('contactList.json', req.body, 'utf8', () => console.log("number is in the json file now."));
    }else{
        let rawData = fs.readFileSync('contactList.json');
        let contactList = JSON.parse(rawData);
        console.log(contactList)
        contactList.formNumber.shift();
        console.log("removed version: ", contactList);
        let json = JSON.stringify(contactList);
        fs.writeFileSync('contactList.json', json, 'utf8', () => {console.log("contact list is updated!")})
    }

    var rawData = fs.readFileSync('contactList.json');
    var contactList = JSON.parse(rawData);

    console.log("contact list: ", contactList);
    console.log("Phone number up:", phoneNumber);
    if(!contactList.formNumber[0]){
        console.log("Calls is done!");
    }else{
        console.log("Link: ", twLink + req.params.formID);
        console.log("Phone  number: ", contactList.formNumber[0].PHONE);
        
        //Create Call
        
    }
    client.calls
        .create({
        url:twLink + req.params.formID,
        to: contactList.formNumber[0].PHONE,
        // to: "+905453622225",
        from: agent,
        })
        .then(call => {
            console.log(call.sid);
            let json = JSON.stringify(call);
            fs.writeFile('callConfig.json', json, 'utf8', () => console.log('callConfig is ok.'));
            axios.post(`http://localhost:3636/addcall/In%20progress/${contactList.formNumber[0].ID}/1/${call.sid}`)
        })
    res.send("ok");
    // console.log(contactList);
    
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
    // if(req.body.formNumber){
    //     let json = JSON.stringify(req.body.formNumber);
    //     fs.writeFileSync('contactList.json',json, 'utf8',() => console.log("json file created!"));
    // }else{
    //     let rawData = fs.readFile('contactList.json');
    //     let contactList = JSON.parse(rawData);
    //     contactList.shift();
    //     console.log("removed version",contactList);
    //     let json = JSON.stringify(contactList);
    //     fs.writeFileSync('contactList.json', json, 'utf8', () => console.log("contactList first element is removed!"))
    // }

    // let rawData = fs.readFileSync('contactList.json');
    // let contactList = JSON.parse(rawData);

    // if(!contactList[0]){
    //     console.log("call is done!")
    // }else{
    //     console.log("Link: ",twLink + req.params.formID)
    //     //Create Call
    //     client.calls
    //     .create({
    //     url:twLink + req.params.formID,
    //     to: phoneNumber,
    //     from: agent,
    //     })
    //     .then(call => {
    //         console.log(call.sid);
    //         // let json = JSON.stringify(call);
    //         // fs.writeFile('callConfig.json', json, 'utf8', () => console.log('callConfig is ok.'));
    //         // axios.post(`http://localhost:3636/addcall/In%20progress/${contactList[0].ID}/1/${call.sid}`)

    //     })
    // }
})


module.exports = router;
