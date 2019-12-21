// =========================================================================
// Copyright © 2017 T-Mobile USA, Inc.
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

const assert = require('chai').assert;
const index = require('../index');
const awsContext = require('aws-lambda-mock-context');
var AWS = require('aws-sdk');
var cwl = new AWS.CloudWatchLogs({ apiVersion: '2014-03-28' });

/*var params = {
    destinationArn: 'LAMBDA_FUNCTION_ARN',
    filterName: 'FILTER_NAME',
    filterPattern: 'ERROR',
    logGroupName: 'LOG_GROUP',
};

cwl.putSubscriptionFilter(params, function (err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data);
    }
});*/

describe('Sample', function () {

    beforeEach(function () {
        input = cwl;
        context = awsContext();
        cb = (value) => {
            return value;
        };
    });

    it('tests handler', function (done) {
        //context = undefined;
        var bool = index.handler(input, context, cb).includes("100") &&
            index.handler(input, context, cb).includes("Context Failed Error");

        assert(bool);
        done();
    });
});
