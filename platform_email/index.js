// =========================================================================
// Copyright � 2017 T-Mobile USA, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
// =========================================================================

/**
Jazz Email service
@author: 
@version: 1.0
 **/

const _ = require("lodash");

const request = require('request');
const AWS = require('aws-sdk');
const rp = require('request-promise-native');
const nodemailer = require('nodemailer');

const errorHandlerModule = require("./components/error-handler.js");
const responseObj = require("./components/response.js");
const configObj = require("./components/config.js");
const logger = require("./components/logger.js");

module.exports.handler = (event, context, cb) => {

  	var errorHandler = errorHandlerModule();
  	logger.init(event, context);
  
  	var config = configObj(event);

  	if (!config || config.length) {
	  	logger.error("Cannot load config object, will stop processing");
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", "Internal error, please reach out to admins")));
  	}

	try {
		logger.info(JSON.stringify(event));

		if (!event || !event.method) {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "invalid or missing arguments")));
		}

		if (event.method !== 'POST' )  {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "Service operation not supported")));
		}

		if (!event.body || !event.body.from || !event.body.to || !event.body.subject) {
			return cb(JSON.stringify(errorHandler.throwInputValidationError("101", "Required params - from, to, subject missing")));
		}

		var data = event.body;

		let transporter = nodemailer.createTransport({
			SES: new aws.SES({
				apiVersion: '2010-12-01'
			})
		});

		transporter.sendMail({
			from: data.from,
			to: data.to,
			subject: data.subject,
			text: data.text
		}, (err, info) => {
			if (err) {
				logger.error('Error in sending email ' + JSON.stringify(err));
			}else {
				loggger.info('Successfully sent email ' + JSON.stringify(info));
			}
		});
		
	} catch (e) {
		logger.error('Error in sending email : ' + e.message);
		return cb(JSON.stringify(errorHandler.throwInternalServerError("101", e.message)));
	}
};

