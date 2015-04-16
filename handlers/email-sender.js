'use strict';

var util = require('util');
var Rabbus = require('rabbus');
var wascally = require('wascally');

function EmailSender () {
  Rabbus.Sender.call(this, wascally, {
    exchange: 'send-rec.email-exchange',
    messageType: 'send-rec.v1.email.send',
  });
}

util.inherits(EmailSender, Rabbus.Sender);

module.exports = EmailSender;
