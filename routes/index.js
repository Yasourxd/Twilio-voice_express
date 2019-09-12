var express = require('express');
var router = express.Router();
var VoiceResponse = require('twilio').twiml.VoiceResponse;
var jf = require('jotform');
var fs = require('fs');

//Twili Voice Call Data import
const accountSid = require('../env2').accountSid;
const authToken = require('../env2').authToken;
const phoneNumber = require('../env2').phoneNumber;
const agent = require('../env2').agent;
const twLink = require('../env2').twLink;
const client = require('twilio')(accountSid, authToken);

//Jotform api settings
jf.options({
  debug: true,
  apiKey: "69144066531945e2a1979e118a0b3ddd"
});

router.post('/:formID/:orderID?/:submissionID?',function(req,res,next){
  // Variables
  const twiml = new VoiceResponse();
  var _submissionID = req.params.submissionID;
  var firstSubmission = req.params.submissionID ? false : true;
  var orderID = req.params.orderID ? req.params.orderID : 1;
  
  // Checking unser input for submission
  if(req.body.Digits || req.body.SpeechResult){
    console.log("done");
    /* True case */
    jf.getFormQuestions(req.params.formID)
    .then(function(r){
      var lengthR = Object.keys(r);
      lengthR = lengthR[lengthR.length-1];

      console.log(getKey(r, lengthR, orderID));
      // Submission Data
      var subText = "submission[" + r[getKey(r, lengthR, orderID)].qid + "]";
      var submissions = {};
      switch(r[getKey(r, lengthR, orderID)].type){
        case 'control_number':
          submissions[subText] = req.body.Digits; // change value to test
          break;
        case 'control_radio':
          var questOptions = (r[getKey(r, lengthR, orderID)].options).split('|');
          submissions[subText] = questOptions[req.body.Digits];
          break;
        case 'control_textbox':
          submissions[subText] = req.body.SpeechResult;
          break;
        case 'control_textarea':
          submissions[subText] = req.body.SpeechResult;
          break;
        case 'control_rating':
            submissions[subText] = req.body.Digits;
      }
      console.log(submissions);

      // Checking to create or edit submission
      if(firstSubmission){
        jf.createFormSubmission(req.params.formID, submissions)
        .then(function(s){
          console.log(s);
          console.log("subbb:", s.submissionID);
          _submissionID = s.submissionID;
          console.log("submissionID", _submissionID);

          //Send full name and submission
          var preText;
          var preSubmissions = {}

          let preDataLength = Object.keys(r);
          preDataLength = preDataLength[preDataLength.length-1];

          var searchList = ['control_fullname', 'control_phone']
          var preDataKeys = [];

          for(var i=1;i<=preDataLength;i++){
            if(r[i]){
              if(searchList.includes(r[i].type)){
                preDataKeys.push(i);
              }
            }
          }

          console.log(preDataKeys);

          for(var i=0;i<preDataKeys.length;i++){
            console.log(r[preDataKeys[i]].type)
            if(r[preDataKeys[i]].type == 'control_fullname'){
              preText = 'submission[' + r[preDataKeys[i]].qid + "]";
              console.log(preText);
              var fullName = {}

              let rawData = fs.readFileSync('contactList.json');
              let contactList = JSON.parse(rawData);

              fullName.first =  contactList[0].FNAME;
              fullName.last = contactList[0].LNAME;
              preSubmissions[preText] = fullName;
            }
            if(r[preDataKeys[i]].type == 'control_phone'){
              preText = 'submission[' + r[preDataKeys[i]].qid + "]";
              var phoneNo = {}

              phoneNo.area = contactList[0].PHONE.slice(1,4);
              phoneNo.phone = contactList[0].PHONE.slice(4);

              preSubmissions[preText] = phoneNo;
            }
          }
          console.log(_submissionID);
          console.log(preSubmissions);
          jf.editSubmission(_submissionID, preSubmissions)
          .then(function(s){
            console.log("Everything is okay!!");
          })


          // Is this last question? or ask next one...
          if(getKey(r, lengthR, (parseInt(orderID) + 1)) == -1){
            console.log("hangup")
            twiml.say({voice: 'alice'},"Have a nice day!");
            twiml.hangup();
          }else{
            console.log("type:", r[getKey(r, lengthR, orderID)].type);
            console.log(r[getKey(r, lengthR, (parseInt(orderID) + 1))].type)
            switch(r[getKey(r, lengthR, (parseInt(orderID) + 1))].type){
              case 'control_number':
                twiml.gather({
                  action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                  method: "POST",
                  input: "speech dtmf",
                  finishOnKey: "#"
                }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                break;
              case 'control_radio':
                console.log("buraya gidiyor");
                var questOptions = (r[getKey(r, lengthR, (parseInt(orderID) + 1))].options).split('|');
                var sayTwiml = "";
                for(var i=0;i<questOptions.length;i++){
                  sayTwiml += "Press " + i + " for " + questOptions[i] + ", ";
                }
                twiml.say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                twiml.gather({
                  action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                  method: "POST",
                  input: "speech dtmf",
                  finishOnKey: "#"
                }).say({voice: 'alice'}, sayTwiml);
                break;
              case 'control_textbox':
                  twiml.gather({
                    action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                    method: "POST",
                    input: "speech",
                    finishOnKey: "#"
                  }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                  break;
              case 'control_textarea':
                twiml.gather({
                  action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                  method: "POST",
                  input: "speech",
                  finishOnKey: "#"
                }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                break;
              case 'control_rating':
                  var sayTwiml = r[getKey(r, lengthR, (parseInt(orderID) + 1))].text + ": Press " + 
                  r[getKey(r, lengthR, (parseInt(orderID) + 1))].scaleFrom + " for min and Press " + 
                  r[getKey(r, lengthR, (parseInt(orderID) + 1))].stars + " for max.";
                  twiml.gather({
                    action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                    method: "POST",
                    input: "speech dtmf",
                    finishOnKey: "#"
                  }).say({voice: 'alice'}, sayTwiml);
                  break;
              default:
                twiml.say({voice: 'alice'}, "error!!!!!!!");
            }
          }
          res.type('text/xml');
          res.send(twiml.toString());
              
            })
      }else{
        jf.editSubmission(_submissionID, submissions)
        .then(function(s){
          console.log(s);

          // Is this last question? or ask next one...
          if(getKey(r, lengthR, (parseInt(orderID) + 1)) == -1){
            console.log("hangup")
            twiml.say({voice: 'alice'}, "Have a nice day!");
            twiml.hangup();
          }else{
            console.log("type:", r[getKey(r, lengthR, orderID)].type);
            switch(r[getKey(r, lengthR, (parseInt(orderID) + 1))].type){
              case 'control_number':
                twiml.gather({
                  action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                  method: "POST",
                  input: "speech dtmf",
                  finishOnKey: "#"
                }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                break;
              case 'control_radio':
                var questOptions = (r[getKey(r, lengthR, (parseInt(orderID) + 1))].options).split('|');
                var sayTwiml = "";
                for(var i=0;i<questOptions.length;i++){
                  sayTwiml += "Press " + i + " for " + questOptions[i] + ", ";
                }
                twiml.say(r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                twiml.gather({
                  action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                  method: "POST",
                  input: "speech dtmf",
                  finishOnKey: "#"
                }).say({voice: 'alice'}, sayTwiml);
                break;
              case 'control_textbox':
                  twiml.gather({
                    action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                    method: "POST",
                    input: "speech dtmf",
                    finishOnKey: "#"
                  }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                  break;
              case 'control_textarea':
                twiml.gather({
                  action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                  method: "POST",
                  input: "speech",
                  finishOnKey: "#"
                }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
                break;
              case 'control_rating':
                  var sayTwiml = r[getKey(r, lengthR, (parseInt(orderID) + 1))].text + ": Press " + 
                  r[getKey(r, lengthR, (parseInt(orderID) + 1))].scaleFrom + " for min and Press " + 
                  r[getKey(r, lengthR, (parseInt(orderID) + 1))].stars + " for max.";
                  twiml.gather({
                    action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
                    method: "POST",
                    input: "speech dtmf",
                    finishOnKey: "#"
                  }).say({voice: 'alice'}, sayTwiml);
                  break;
            }
          }
          res.type('text/xml');
          res.send(twiml.toString());
          
        })
      }
      console.log("a: ", _submissionID);

      console.log("key", getKey(r, lengthR, orderID));
      // // Is this last question? or ask next one...
      // if(getKey(r, lengthR, (parseInt(orderID) + 1)) == -1){
      //   console.log("hangup")
      //   twiml.say("Have a nice day!");
      //   twiml.hangup();
      // }else{
      //   twiml.gather({
      //     action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
      //     method: "POST",
      //     input: "speech dtmf",
      //     finishOnKey: "#"
      //   }).say(r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
      // }
      // res.type('text/xml');
      // res.send(twiml.toString());
    })
    
  }else{
    // False case

    //Twiml question
    jf.getFormQuestions(req.params.formID)
    .then(function(r){
      var lengthR = Object.keys(r);
      lengthR = lengthR[lengthR.length-1];

      //Initial conversation
      let rawData = fs.readFileSync('contactList.json');
      let contactList = JSON.parse(rawData);

      var FNAME = contactList[0].FNAME;
      var LNAME = contactList[0].LNAME;
      var brand = require('../env2').brand;
      var questCount = 0;

      for(var i=0;i<=lengthR;i++){
        let ignores = ['control_head', 'control_button','control_fullname', 'control_phone'];
        if(r[i]){
          if(ignores.includes(r[i].type)){
            questCount++;
          }
        }
      }

      if(orderID == 1){
        for(var i=1;i<=lengthR;i++){
          if(r[i]){
            if(r[i].type == 'control_head'){
              var twimlSay = "Hello " + FNAME + " " + LNAME + 
                ", Welcoome to Jotform Voice Call Service. We are calling you on behalf of " + brand
                + ' to fill out ' + r[i].text + ". We have " + questCount + " questions. Please answer the questions carefully."
              twiml.say({voice:'Polly.Salli'}, twimlSay);
            }
          }
        }
      }

      //First Question
      console.log("type:", r[getKey(r, lengthR, orderID)].type);
      switch(r[getKey(r, lengthR, orderID)].type){
        case 'control_number':
          twiml.gather({
            action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order,
            method: "POST",
            input: "speech dtmf",
            finishOnKey: "#"
          }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
          break;
        case 'control_radio':
          var questOptions = (r[getKey(r, lengthR, orderID)].options).split('|');
          var sayTwiml = "";
          for(var i=0;i<questOptions.length;i++){
            sayTwiml += "Press " + i + " for " + questOptions[i] + ", ";
          }
          twiml.say(r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
          twiml.gather({
            action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order,
            method: "POST",
            input: "speech dtmf",
            finishOnKey: "#"
          }).say({voice: 'alice'}, sayTwiml);
          break;
        case 'control_textbox':
          twiml.gather({
            action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order,
            method: "POST",
            input: "speech dtmf",
            finishOnKey: "#"
          }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
          break;
        case 'control_textarea':
          twiml.gather({
            action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order,
            method: "POST",
            input: "speech dtmf",
            finishOnKey: "#"
          }).say({voice: 'alice'}, r[getKey(r, lengthR, (parseInt(orderID) + 1))].text);
          break;
        case 'control_rating':
            var sayTwiml = r[getKey(r, lengthR, (parseInt(orderID) + 1))].text + ": Press " + 
            r[getKey(r, lengthR, (parseInt(orderID) + 1))].scaleFrom + " for min and Press " + 
            r[getKey(r, lengthR, (parseInt(orderID) + 1))].stars + " for max.";
            twiml.gather({
              action: twLink + req.params.formID + "/" + r[getKey(r, lengthR, (parseInt(orderID) + 1))].order + "/" + _submissionID,
              method: "POST",
              input: "speech dtmf",
              finishOnKey: "#"
            }).say({voice: 'alice'}, sayTwiml);
            break;
      }

      res.type('text/xml');
      res.send(twiml.toString());
    })
  }
})

//Getting key by giving order
function getKey(r, lengthR, order){

  //Types of items to ignore
  let ignores = ['control_head', 'control_button','control_fullname', 'control_phone'];
  if(parseInt(lengthR) < parseInt(order)){
      return -1;
  }
  for(var i=1;i<=lengthR;i++){
      if(r[i] != null){
          if(r[i].order == order && !ignores.includes(r[i].type)){
              return i;
         }
      }
  }
  return getKey(r, lengthR, ++order);
}

module.exports = router;
