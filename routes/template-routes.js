'use strict';

var Joi = require('joi');
var rabbit = require('wascally');
var lapin = require('lapin')(rabbit);

module.exports = [
  {
    path: '/templates',
    method: 'GET',
    handler: function (request, reply) {
      // lapin requester
      var requester = lapin.request('v1.templates.findAll');

      requester.produce({}, function (err, template) {
        if (err) {
          reply(err).code(500);
        }
        reply(template.data);
      });
    }
  },

  {
    path: '/templates',
    method: 'POST',
    config: {
      description: 'Create template',
      validate: {
        payload: {
          name: Joi.string().required()
            .description( 'Name of the template' ),

          description: Joi.string().optional()
            .description('Description of the template'),

          content: Joi.string().required()
            .description('Template content')
        }
      },
      handler: function (request, reply) {
        // lapin requester
        var requester = lapin.request('v1.template.create');

        requester.produce(request.payload, function (err, template) {
          if (err) {
            reply(err).code(500);
          }
          reply(template.data);
        });
      }
    }
  },

  {
    path : '/templates/{templateId}',
    method: 'GET',
    config : {
      description: 'Get specific template',
      validate: {
        params: {
          templateId: Joi.string()
            .description('The id of the template')
        }
      },
      handler : function (request, reply) {
        // lapin requester
        var requester = lapin.request('v1.template.findById');

        var requestData = {
          'id' : request.params.templateId
        };
        // console.log( requestData );
        requester.produce(requestData, function (err, template) {
          if ( err) {
            reply(err).code(500);
          }
          reply(template.data);
        });
      }
    }
  },

  {
    path : '/templates/{templateId}',
    method: 'PUT',
    config : {
      description: 'Update specific template',
      validate: {
        params: {
          templateId: Joi.string()
            .description('The id of the template')
        },
        payload: {
          name: Joi.string().required()
            .description('Name of the template'),

          description: Joi.string().optional()
            .description('Description of the template'),

          content: Joi.string().required()
            .description('Template content'),
        }
      },
      handler : function ( request, reply) {
         // lapin requester
        var requester = lapin.request( 'v1.template.updateById' );
        if(!request.payload.id) {
          request.payload.id = request.params.templateId;
        }

        requester.produce(request.payload, function (err, template) {
          if (err) {
            reply(err).code( 500 );
          }
          reply(template.data);
        });
      }
    }
  }
];