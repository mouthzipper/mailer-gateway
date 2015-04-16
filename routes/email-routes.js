'use strict';

var Joi = require( 'joi' );
var EmailSender = require('../handlers/email-sender.js');
var emailSender = new EmailSender()

module.exports = [
  {
    method: 'GET',
    path: '/email',
    config: {
      handler: function (request, reply) {
        var emailInfo = {
          from: 'gz.eskrima@gmail.com',
          to: 'raymond.torino@globalzeal.net',
          subject: 'Test',
          text: 'Test lang'
        };

        emailSender.send(emailInfo, function () {
          reply( 'message sent' );
        });
      }
    }
  }
];