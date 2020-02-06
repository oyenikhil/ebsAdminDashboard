(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
/*
 * Copyright 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

/*
 * NOTE: You must set the following string constants prior to running this
 * example application.
 */
var awsConfiguration = {
   poolId: 'ap-south-1:d42d6cf0-89cd-4a4d-9d00-c1aa7276aa79', // 'YourCognitoIdentityPoolId'
   host: 'a1gq176f0b2rcm-ats.iot.ap-south-1.amazonaws.com', // 'YourAwsIoTEndpoint', e.g. 'prefix.iot.us-east-1.amazonaws.com'
   region: 'ap-south-1' // 'YourAwsRegion', e.g. 'us-east-1'
};
module.exports = awsConfiguration;


},{}],2:[function(require,module,exports){
var WildRydes = window.WildRydes || {};
WildRydes.map = WildRydes.map || {};
var authToken;

var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope, $http) {
  
  $scope.notifs = [];
  $scope.hi = "";
  $scope.modeOptions = [['MANUAL'],['AUTO']];
  $scope.showConfirmation = false;
  var audio = new Audio('siren.mp3');
  $scope.xyz = [];
  document.getElementById('no-notif-div').style.display = "block";
  document.getElementById('notif-div').style.display = "none";
  $scope.dashboardLocation = "28.484993,77.094941";
  $scope.orderByField = 'deviceId';
  $scope.reverseSort = false;

    WildRydes.authToken.then(function setAuthToken(token) {
        if (token) {
            $scope.authToken = token;
            $scope.parsedAuthToken = $scope.parseAuthToken(token);
            $scope.deviceId = $scope.parsedAuthToken['custom:device_id'];
            $scope.email = $scope.parsedAuthToken.email;
            $scope.cognitoUserID = $scope.parsedAuthToken.sub
        } else {
            window.location.href = 'signin.html';
        }
    }).catch(function handleTokenError(error) {
         //alert(error);
         //window.location.href = '/signin.html';
    });

   $scope.toggleSidebar = function(){
      var element = document.getElementById("sidebar");
      element.classList.toggle("active");
   }


    //
// Instantiate the AWS SDK and confi$httpguration objects.  The AWS SDK for 
// JavaScript (aws-sdk) is used for Cognito Identity/Authentication, and 
// the AWS IoT SDK for JavaScript (aws-iot-device-sdk) is used for the
// WebSocket connection to AWS IoT and device shadow APIs.
// 
var AWS = require('aws-sdk');
var AWSIoTData = require('aws-iot-device-sdk');
var AWSConfiguration = require('./aws-configuration.js');

//
// Create a client id to use when connecting to AWS IoT.
//
var clientId = 'mqtt-explorer-' + (Math.floor((Math.random() * 100000) + 1));

//
// Initialize our configuration.
//
AWS.config.region = AWSConfiguration.region;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
   IdentityPoolId: AWSConfiguration.poolId
});

const mqttClient = AWSIoTData.device({
   region: AWS.config.region,
   host:AWSConfiguration.host,
   clientId: clientId,
   protocol: 'wss',
   keepalive: 40000,
   maximumReconnectTimeMs: 8000,
   debug: true,
   accessKeyId: '',
   secretKey: '',
   sessionToken: ''
});

//
// Attempt to authenticate to the Cognito Identity Pool.  Note that `this
// example only supports use of a pool which allows unauthenticated 
// identities.
//
var cognitoIdentity = new AWS.CognitoIdentity();
AWS.config.credentials.get(function(err, data) {
   if (!err) {
      var params = {
         IdentityId: AWS.config.credentials.identityId
      };
      cognitoIdentity.getCredentialsForIdentity(params, function(err, data) {
         if (!err) {
            //
            // Update our latest AWS credentials; the MQTT client will use these
            // during its next reconnect attempt.
            //
            mqttClient.updateWebSocketCredentials(data.Credentials.AccessKeyId,
               data.Credentials.SecretKey,
               data.Credentials.SessionToken);
         } else {
            console.log('error retrieving credentials: ' + err);
            alert('error retrieving credentials: ' + err);
         }
      });
   } else {
      console.log('error retrieving identity:' + err);
      alert('error retrieving identity: ' + err);
   }
});

//
// Connect handler; update div visibility and fetch latest shadow documents.
// Subscribe to lifecycle events on the first connect event.
//
window.mqttClientConnectHandler = function() {
   console.log('Connected!');
   mqttClient.subscribe('device/+/sensor');
   mqttClient.subscribe('$aws/things/+/shadow/update');
   mqttClient.subscribe('device/+/sim_response');
   mqttClient.subscribe('device/+/sim_command');
   //mqttClient.subscribe('$aws/things/+/shadow/get/accepted');
};

//
// Reconnect handler; update div visibility.
//
// window.mqttClientReconnectHandler = function() {
//    console.log('reconnect');
//    document.getElementById("connecting-div").style.visibility = 'visible';
//    document.getElementById("explorer-div").style.visibility = 'hidden';
// };

window.mqttClientMessageHandler = function(topic, payload) {
   console.log('topic: ' + topic + ', msg:' + payload.toString());
   if(!topic.includes('Saurav_esp_ledstrip2') && !topic.includes('sim_response')) {
   
   var parsedMsg = JSON.parse(payload);

   if (topic.includes('update') && parsedMsg.state.reported && Object.keys(parsedMsg.state.reported).length != 2) {
     document.getElementById('wait-msg').style.display = "none";
     document.getElementById('confirmation-msg').style.display = "block";
     console.log('var', $scope.showConfirmation);
     setTimeout(function() {document.getElementById('confirmation-msg').style.display = "none"}, 4000);
   }

   if(topic.includes('sensor')) {
      $scope.msg = JSON.parse(payload);
      $scope.addNotification($scope.msg);
      $scope.notifs.push($scope.msg);
      audio.play();
   }
 }

  if(topic.includes('sim_response')) {
   document.getElementById('simResponse').innerHTML = payload;
   //document.getElementById('simResponse').style.display = block;
  }

};

$scope.makeApiCall = function (parsedMsg) {
  parsedMsg.state.reported["deviceId"] = $scope.editModalDevice.deviceId; 
  var data = JSON.stringify(parsedMsg.state.reported);
  $http({
            method: "POST",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            data: data,
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
               $scope.getDevices();
               document.getElementById('confirmation-msg').style.display = "block";
               console.log('var', $scope.showConfirmation);
               setTimeout(function() {document.getElementById('confirmation-msg').style.display = "none"}, 4000);
                //editDevice ? $('#editDeviceModal').modal('toggle') : $('#addDeviceModal').modal('toggle');               
                //$('#addDeviceModal').modal('toggle');
                //$scope.getDevices();
                //$scope.deviceId = $scope.customerName = $scope.mobileNumbersString = $scope.mode = null;
            }
        }, function myError(response) {
            console.log(response);
        });
}

$scope.commandPayload = "";

$scope.sendCmd = function(deviceId, infoType) {
  var message = {}


  if(infoType === 'CALL' || infoType === 'USSD') {
    message[infoType] = [$scope.commandPayload];
    //message.infoType = "92828";
    //message = { [infoType] : [$scope.commandPayload]};
  }

  if(infoType === 'OPERATOR' || infoType === 'SIGNAL') {
    message = { [infoType] : ["nopayload"]};
  }

  console.log(message);

  mqttClient.publish('device/' + deviceId + '/sim_command', JSON.stringify(message));
}

$scope.clearCmd = function() {
  $scope.commandPayload = "";
  if($scope.infoType === 'OPERATOR' || $scope.infoType === 'SIGNAL') {
    document.getElementById("myInput").disabled = true;
  } else {
    document.getElementById("myInput").disabled = false;
  }
}


$scope.addNotification = function(notif) {
  document.getElementById('no-notif-div').style.display = "none";
  document.getElementById('notif-div').style.display = "block";
  var div = document.createElement("div");
  div.id = notif.deviceId;
  div.className = 'n-div';
  var timee = $scope.timeConverter1(notif.time);
  var test = "<div style='margin-bottom:6px;'>" + notif.deviceId + ': ' + notif.sensor + " detected at " + timee + "</div>";
  test += "<button type='button' class='btn btn-outline-primary control-panel-btn'><i class='fas fa-video'></i>&nbsp;Live Feed</button>" +
          "<button class='btn btn-outline-danger control-panel-btn'><i class='fa fa-bell'></i>&nbsp;Play Siren</button>" +
          "<button class='btn btn-outline-danger control-panel-btn'><i class='fa fa-bell'></i>&nbsp;Stop Siren</button>" +
          "<button class='btn btn-outline-primary control-panel-btn'><i class='fas fa-paper-plane'></i>&nbsp;Trigger SMS</button><br>" +
          "<a></a><br><div></div><br><a></a>";
  div.innerHTML = test;
  document.getElementById('notificationDiv').prepend(div);
  var childNodes = div.childNodes;
  var livePreviewLink = "http://35.239.70.45/image_retrival.php?deviceid=" + 
                        notif.deviceId + "&sensor=" + notif.sensor + "&time1=" + notif.time;
  childNodes[1].onclick = function() {openLiveFeed()};
  childNodes[2].onclick = function() {playSirenJs()};
  childNodes[3].onclick = function() {stopSirenJs()};
  childNodes[4].onclick = function() {sendMessagesJs()};
  childNodes[6].id = 'img-' + notif.deviceId + '-' + notif.time;
  childNodes[6].innerHTML = 'Live Preview!'; 
  childNodes[6].href = livePreviewLink;
  childNodes[6].target = '_blank';

  let deviceInfo = $scope.deviceArray.find(device => device.deviceId === notif.deviceId);
  $scope.generateRouteLink(deviceInfo.location);
  console.log(deviceInfo);
  childNodes[8].innerHTML = deviceInfo.customerAddress;
  childNodes[10].innerHTML = 'View Route'; 
  childNodes[10].href = $scope.generateRouteLink(deviceInfo.location);
  childNodes[10].target = '_blank';
}

$scope.generateRouteLink = function(customerLocation) {
  return "https://www.google.com/maps/dir/?api=1&origin=" + $scope.dashboardLocation +
         "&destination=" + customerLocation;
}

function openLiveFeed() {
  window.open('cam.html', '_blank');
}

function playSirenJs() {
  mqttClient.publish('$aws/things/Saurav_esp_ledstrip2/shadow/update', 'ON');
  console.log('siren on');
}

function stopSirenJs() {
  mqttClient.publish('$aws/things/Saurav_esp_ledstrip2/shadow/update', 'OFF');
  console.log('siren off');
}


$scope.openAddDeviceModal = function(){
   $scope.mobileNumbersString = null;
   $('#addDeviceModal').modal('toggle'); 
}

$scope.openEditDeviceModal = function(device) {
  document.getElementById('simResponse').innerHTML = '';
  $scope.commandPayload = "";
  document.getElementById('wait-msg').style.display = "none";
  console.log('device', device);
  $scope.xyz = device.mode;
  $scope.showConfirmation = false;
   //$scope.mobileNumbersString = device.mobileNumbers.toString();
   $('#editDeviceModal').modal('toggle');
   $scope.editModalDevice = device;
   $scope.editModalDevice.mode = device.mode[0];
   //$scope.editModalDevice.mode = ['MANUAL'];
   $scope.getDeviceNotifications(device.deviceId);
}


$scope.stopNotificationSound = function() {
   audio.pause();
   audio.currentTime = 0;
}

//
// Install connect/reconnect event handlers.
//
mqttClient.on('connect', window.mqttClientConnectHandler);
//mqttClient.on('reconnect', window.mqttClientReconnectHandler);
mqttClient.on('message', window.mqttClientMessageHandler);

$scope.getDevices = function(){
        $http({
            method: "GET",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
              console.log(response.data);
                $scope.deviceArray = response.data;
            }
        }, function myError(response) {
            console.log(response);
        });
 }

$scope.postDevice = function (editDevice, setting) {
   $scope.mobileNumbersArray = $scope.mobileNumbersString.split(',');
   if(editDevice) {
      //$scope.mobilePubTopic = "device/"+ $scope.editModalDevice.deviceId + "/mobile";
      //$scope.modePubTopic = "device/"+ $scope.editModalDevice.deviceId + "/mode";
      //$scope.mobilePubMessage = "CHANGE"+$scope.mobileNumbersString+"NUM";
      //setting == 'mob' ? mqttClient.publish($scope.mobilePubTopic, $scope.mobilePubMessage) : mqttClient.publish($scope.modePubTopic, $scope.editModalDevice.mode); 
      // mqttClient.publish($scope.mobilePubTopic, $scope.mobilePubMessage);
      // mqttClient.publish($scope.modePubTopic, $scope.editModalDevice.mode);
      //console.log('mob', $scope.mobilePubMessage);

      var data = JSON.stringify({
         "deviceId": $scope.editModalDevice.deviceId,
         "customerName": $scope.editModalDevice.customerName,
         "mobileNumbers": $scope.mobileNumbersArray,
         "mode": $scope.editModalDevice.mode
      });
   } else {
      var data = JSON.stringify({
         "deviceId": $scope.deviceId,
         "customerName": $scope.customerName,
         "mobileNumbers": $scope.mobileNumbersArray,
         "mode": $scope.mode
      });
   }

   $http({
            method: "POST",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            data: data,
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 201) {
                editDevice ? $('#editDeviceModal').modal('toggle') : $('#addDeviceModal').modal('toggle');               
                //$('#addDeviceModal').modal('toggle');
                $scope.getDevices();
                $scope.deviceId = $scope.customerName = $scope.mobileNumbersString = $scope.mode = null;
            }
        }, function myError(response) {
            console.log(response);
        });
        
}

$scope.putDevice = function (topic, parsedMsg) {
  var deviceId = topic.split('/')[2];
  console.log('msg',parsedMsg);
  parsedMsg.state.reported['deviceId'] = deviceId;

   $http({
            method: "PUT",
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/device',
            data: JSON.stringify(parsedMsg.state.reported),
            contentType: 'application/json'
        }).then(function mySuccess(response) {
            if(response.status == 204) {
              document.getElementById('wait-msg').style.display = "none";
              document.getElementById('confirmation-msg').style.display = "block";
               console.log('var', $scope.showConfirmation);
               setTimeout(function() {document.getElementById('confirmation-msg').style.display = "none"}, 4000);
              console.log("success");
            }
        }, function myError(response) {
            console.log(response);
        });
 
}



$scope.getDeviceNotifications = function (deviceId) {
        $http({
            method: "GET",
            params: {'deviceId': deviceId},
            url: 'https://kjp1y833xk.execute-api.ap-south-1.amazonaws.com/test/sensors'
        }).then(function mySuccess(response) {
            if(response.status == 200) {
                $scope.notifications = response.data;
                console.log('notifs', $scope.notifications);
            }
        }, function myError(response) {
            console.log(response);
        });
    }

    function sendMessagesJs() {
        fetch('http://api.textlocal.in/send/?apiKey=4KyJdpNUImc-IfWruKM8yEXi1MPtzN3DobwnNOiQzb&sender=TXTLCL&group_id=1037625&message=Emergency%20at%20device0002-http://ebs-admin.s3-website.ap-south-1.amazonaws.com/admin/cam.html').then(function(response) {
            return response.json();
        }).then(function(data) {
            alert('Messages Triggered Successfully! :D');
        }).catch(function() {
            console.log("Error in sending messages :(");
        });
    }

    $scope.siren = 0;

    $scope.playSiren = function() {
      if(!$scope.siren) {
        mqttClient.publish('$aws/things/Saurav_esp_ledstrip2/shadow/update', 'ON');
        $scope.siren = 1;
      }

      else {
        mqttClient.publish('$aws/things/Saurav_esp_ledstrip2/shadow/update', 'OFF');
        $scope.siren = 0;
      }
    }


    var init = function () {
      $scope.toggleSidebar(); 
      $scope.getDevices();
   };

   init();

   function yourFunction(){
    $scope.getDevices();
    setTimeout(yourFunction, 10000);
   }

   yourFunction();

   $scope.publishMode = function(deviceId, mode) {
     $scope.payload = {
         "state" : {
           "desired": {
             "mode" : [mode]
           }
         }
        }
        console.log(JSON.stringify($scope.payload));
     mqttClient.publish('$aws/things/' + deviceId + '/shadow/update',
                         JSON.stringify($scope.payload));
     document.getElementById('wait-msg').style.display = "block";
   }

   $scope.publishNumbers = function(deviceId, numberString, autoOrManualOrAdmin) {
     var numbersArray = numberString.split(',');
     console.log('NumbersArr', numbersArray);
     if (autoOrManualOrAdmin == 'auto') {
         $scope.payload = {
         "state" : {
           "desired": {
             "auto_num" : numbersArray
           }
         }
        }

        //$scope.putDevice(JSON.stringify({'deviceId': deviceId, 'auto_num': numbersArray}));

     } else if (autoOrManualOrAdmin == 'manual') {
       $scope.payload = {
       "state" : {
         "desired": {
           "man_num" : numbersArray
         }
       }
      }

      //$scope.putDevice(JSON.stringify({'deviceId': deviceId, 'man_num': numbersArray})) ;
     }

     else if(autoOrManualOrAdmin == 'admin') {
       $scope.payload = {
       "state" : {
         "desired": {
           "admin_num" : numbersArray
         }
       }
      }

      //$scope.putDevice(JSON.stringify({'deviceId': deviceId, 'admin_num': numbersArray})) ;
     }

     document.getElementById('wait-msg').style.display = "block";

     mqttClient.publish('$aws/things/' + deviceId +'/shadow/update',
                         JSON.stringify($scope.payload));
   }

   $scope.captureScreenshot = function (did, sensor, timestamp, triggerSrc) {
        var queryParams = {deviceId: did, sensor: sensor, timestamp: timestamp}
        $http({
            method: "GET",
            url: 'http://35.239.70.45/test.php',
            params: queryParams
        }).then(function mySuccess(response) {
          if(response.status == 200) {
            var link = (response.data).split('Success<br>').pop();
            if (triggerSrc == 'notification') {
              document.getElementById('img-'+ did + '-' + timestamp).href = link;
              document.getElementById('img-'+ did + '-' + timestamp).target = '_blank';
              document.getElementById('img-'+ did + '-' + timestamp).innerHTML = 'View Screenshot';

            } else {
              alert('Link: '+ link);
            }
          }
        }, function myError(response) {
            console.log('Error: ', response);
            alert('Error taking screenshot!')
        });
 }


$scope.timeConverter1 = function(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

$scope.timeConverter = function(UNIX_timestamp){
  var d = new Date(parseInt(UNIX_timestamp)).toString("HH:mm:ss - d MMM yyyy ");
  return (d);
}

});


},{"./aws-configuration.js":1,"aws-iot-device-sdk":"aws-iot-device-sdk","aws-sdk":"aws-sdk"}]},{},[2]);
