'use strict';

var util   = require( 'util' );

var Hapi    = require( 'hapi' );
var Rabbit  = require( 'wascally' );
var Rabbus  = require( 'rabbus' );
var Joi     = require( 'joi' );
var Swagger = require( 'hapi-swagger' );
var lapin   = require( 'lapin' )( Rabbit );

var env    = process.env[ 'NODE_ENV' ] || 'dev';
var config = require( './config/config.json' )[ env ];

var server = new Hapi.Server();

server.connection( config.api )
	.register( {
		register : Swagger,
		options  : config.swagger
	}, function (err) {
		if (err) {
			server.log(['error'], 'hapi-swagger load error: ' + err)
		}else{
			server.log(['start'], 'hapi-swagger interface loaded')
		}
	} );

function GatewaySender ( rabbit ) {
	Rabbus.Sender.call( this, rabbit, {
		exchange    : 'send-rec.exchange',
		routingKey  : 'send-rec.key',
		messageType : 'send-rec.messageType'
	} );
}

util.inherits( GatewaySender, Rabbus.Sender);

Rabbit.configure( { connection: config.rabbit } )
	.then( function() {
		server.start( function () {
			console.log( 'Server Started!' );
		} );

		// route for sending email
		server.route( {
			method : 'POST',
			path   : '/sendEmail',
			config : {
				handler : function ( request, reply ) {
					reply();
				},
				description  : 'Send Email',
				notes        : 'Sends an email using passed object. Attributes are as follows: <br>'+
								'<table><tr><td>from</td><td>The e-mail address of the sender. All e-mail addresses can be plain "sender@server.com" or formatted "Sender Name <sender@server.com>"</td></tr>'+
								'<tr><td>sender</td><td>An e-mail address that will appear on the Sender: field</td></tr>'+
								'<tr><td>to</td><td>Comma separated list or an array of recipients e-mail addresses that will appear on the To: field</td></tr>'+
								'<tr><td>cc</td><td>Comma separated list or an array of recipients e-mail addresses that will appear on the Cc: field</td></tr>'+
								'<tr><td>bcc</td><td>Comma separated list or an array of recipients e-mail addresses that will appear on the Bcc: field</td></tr>'+
								'<tr><td>replyTo</td><td>An e-mail address that will appear on the Reply-To: field</td></tr>'+
								'<tr><td>inReplyTo</td><td>The message-id this message is replying</td></tr>'+
								'<tr><td>references</td><td>Message-id list (an array or space separated string)</td></tr>'+
								'<tr><td>subject</td><td>The subject of the e-mail</td></tr>'+
								'<tr><td>text</td><td>The plaintext version of the message as an Unicode string, Buffer, Stream or an object {path: "..."}</td></tr>'+
								'<tr><td>html</td><td>The HTML version of the message as an Unicode string, Buffer, Stream or an object {path: "..."}</td></tr>'+
								'<tr><td>headers</td><td>An object or array of additional header fields (e.g. {"X-Key-Name": "key value"} or [{key: "X-Key-Name", value: "val1"}, {key: "X-Key-Name", value: "val2"}])</td></tr>'+
								'<tr><td>attachments </td><td>An array of attachment objects (<a href="https://github.com/andris9/Nodemailer#attachments">more details</a>)</td></tr>'+
								'<tr><td>alternatives</td><td>An array of alternative text contents (in addition to text and html parts) (<a href="https://github.com/andris9/Nodemailer#alternatives">more details</a>)</td></tr>'+
								'<tr><td>envelope  </td><td>optional SMTP envelope, if auto generated envelope is not suitable (<a href="https://github.com/andris9/Nodemailer#smtp-envelope">more details</a>)</td></tr>'+
								'<tr><td>messageId </td><td>optional Message-Id value, random value will be generated if not set</td></tr>'+
								'<tr><td>date     </td><td>optional Date value, current UTC string will be used if not set</td></tr>'+
								'<tr><td>encoding  </td><td>optional transfer encoding for the textual parts (defaults to "quoted-printable")</td></tr></table>',
				tags         : [ 'api' ],
				validate     : {
					payload : {
						from : Joi.string().email().required(),
						to   : Joi.alternatives(
									Joi.string().email().required(),
									Joi.array().max( 500 ).items( Joi.string().email() )
								),
						cc   : Joi.alternatives(
									Joi.array().max( 500 ).items( Joi.string().email() ),
									Joi.string().email().required()
								),
						bcc  : Joi.alternatives(
									Joi.array().max( 500 ).items( Joi.string().email() ),
									Joi.string().email().required()
								),
						replyTo    : Joi.string().email(),
						inReplyTo  : Joi.string().max( 250 ),
						references : Joi.alternatives(
											Joi.array().max( 500 ).items( Joi.string().max( 250 ) ),
											Joi.string().email().required()
										),
						subject      : Joi.string().max( 250 ),
						text         : Joi.string(),
						html         : Joi.string(),
						headers      : Joi.any(),
						attachments  : Joi.array(),
						alternatives : Joi.array(),
						envelope     : Joi.any(),
						messageId    : Joi.string().max( 250 ),
						date         : Joi.date(),
						encoding     : Joi.string().max( 50 )
					}
				}
			}


		} );

// route for sending template
		server.route( {
			path : '/templates',
			method: 'GET',
			handler : function ( request, reply ) {
					// lapin requester
					var requester = lapin.request( 'v1.template.findAll' );

					requester.produce( 'getTemplate', function ( error, templateData ) {
						if ( error ) {
							reply( error ).code( 500 );
						}
						reply( templateData.data );
					} );

			}
		});

		server.route( {
			path : '/templates',
			method: 'POST',
			config : {
				'description' : 'create template',
				'validate' : {
					'payload' : {
						'name'        : Joi.string().required().description( 'Name of the template' ),
						'description' : Joi.string().optional().description( 'Description of the template' ),
						'content'     : Joi.string().required().description( 'Template content' ),
						'createdAt'   : Joi.date().optional().description( 'Template created date' )
					}
				},
				handler : function ( request, reply ) {
						// lapin requester
						var requester = lapin.request( 'v1.template.create' );

						requester.produce( request.payload, function ( error, templateData ) {
							if ( error ) {
								reply( error ).code( 500 );
							}
							reply( templateData.data );
						} );
				}
			}

		});
		server.route( {
			path : '/templates/{templateId}',
			method: 'GET',
			config : {
				'description' : 'get specific template',
				'validate' : {
					'params' : {
						'templateId' : Joi.string().description( 'The id of the template' )
					}
				},
				handler : function ( request, reply ) {
						// lapin requester
						var requester = lapin.request( 'v1.template.findById' );

						var requestData = {
							'id' : request.params.templateId
						};

						requester.produce( requestData, function ( error, templateData ) {
							if ( error ) {
								reply( error ).code( 500 );
							}
							reply( templateData.data );
						} );
				}
			}

		});

	} ).catch( function ( err ) {
		console.log( err );
	} );

