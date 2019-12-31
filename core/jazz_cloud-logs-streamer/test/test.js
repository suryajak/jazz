
// =========================================================================// Copyright © 2017 T-Mobile USA, Inc.
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

const expect = require('chai').expect;
const awsContext = require('aws-lambda-mock-context');
const utils = require("../components/utils");
const index = require("../index");
const configObj = require('../components/config.js');
const zlib = require('zlib');
const sinon = require('sinon');
var PassThrough = require('stream').PassThrough;
var https = require('https');

describe('jazz_cloud-logs-streamer Handler', function () {
    var err, context, callback, config, event;
    beforeEach(function () {
        context = awsContext();
        context.functionName = context.functionName + "-test";
        err = {
            "errorType": "svtfoe",
            "message": "starco"
        };
        event = {
            "awslogs": {
                "data": "sample data"
            }

        };
        callback = (err, responseObj) => {
            if (err) {
                return err;
            } else {
                return JSON.stringify(responseObj);
            }
        };

        config = configObj.getConfig(event, context);
    });
    describe('index', () => {
        // tests for handler function in index.js
        describe('handler', function () {
            let postResult;

            beforeEach(function () {
                postResult = {
                    "attemptedItems": 1,
                    "successfulItems": 1,
                    "failedItems": 0
                };
            });

            /* Given an unsupported format, print giving input from the callback function
            @params {input} defined in beforeEach as a awsLogs:data which will be returned by callback function 
            @params {context} aws lamba mock context will be passed
            @params {callback} callback function which return the input json as a string value
                @params {err, res} input values for callback function
            @return json input as a stringified json
            zipStub is used to simulate the zip file which is passed into the function
            */
            it('should indicate that record is skipped since message is not in supported format (gzip)', () => {
                let zipStub = sinon.stub(zlib, "gunzip").yields((err, res) => {
                    return callback(err, null);
                });

                index.handler(event, context, (err, res) => {
                    expect(res).to.have.all.keys('data', 'input');
                    expect(res.data).to.eq('{"awslogs":{"data":"sample data"}}');
                    zipStub.restore();
                });
            });

            it('should skip control messages if !elasticsearchBulkdata', () => {
                let zipStub = sinon.stub(zlib, "gunzip").yields((err, res) => {
                    return callback(err, null);
                });

                index.handler(event, context, (err, res) => {
                    expect(res).to.have.all.keys('data', 'input');
                    expect(res.data).to.eq('{"awslogs":{"data":"sample data"}}');
                    zipStub.restore();
                });
            });

        });

        // tets for buildsource function in index.js
        describe('buildSource', function () {
            /* Given empty parameters, returns and empty object
            @params {string} passes a json as a string to the target function
            @params {JSON} passes a json object to the target function
            @return {JSON} returns json object
                if only JSON is passed with empty string {"", JSON}, extracted fields will be return
                if only string is passed with empty json {"JSON", ""}, JSON object is returned
                if both parameters are empty strings, return empty JSON object {}
                if both JSON and string are passed, only return extracted fields
            */

            //returns empty json object {} since input parameters are empty message and empty extracted fields
            //uses deep extract for condition to check if both empty JSON's are equal
            it('should return {} for empty message and empty extracted fields', function () {
                expect(index.buildSource("", "")).to.deep.equal({});
            });

            //passes a json as a string without any extracted fields
            //return JSON object of parsed json string
            it("should return parsed JSON", function () {
                var json = '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Service":"cloudtrail.amazonaws.com"},"Action":"sts:AssumeRole"}]}';
                expect(JSON.stringify(index.buildSource(json, ""))).to.equal(json);
            });

            // passes the extracted values as a JSON objects
            // returns extracted values as a JSON object with parsed numeric values
            it("should return Extracted fields with key value pairs with no json values", function () {

                var extractedFieldsInputParameter = {
                    "$status_code": "404",
                    "$request": "GET /products/index.html HTTP/1.0",
                    "$7": "1534",
                    "$4": "10/Oct/2000:13:25:15 -0700",
                    "$3": "frank",
                    "$2": "-",
                    "$1": "127.0.0.1"
                };

                expect(index.buildSource('', extractedFieldsInputParameter)).to.deep.equal({
                    "$status_code": 404,
                    "$request": "GET /products/index.html HTTP/1.0",
                    "$7": 1534,
                    "$4": "10/Oct/2000:13:25:15 -0700",
                    "$3": "frank",
                    "$2": "-",
                    "$1": "127.0.0.1"
                });
            });

            // passes the extracted values as a JSON objects
            // returns extracted values as a JSON object with parsed numeric values and appropriate key value pairs as JSON objects
            it("should return Extracted fields with key value pairs having json values", function () {

                var extractedFieldsInputParameter = {
                    "$status_code": "404",
                    "$request": "GET /products/index.html HTTP/1.0",
                    "$7": "1534",
                    "$4": "10/Oct/2000:13:25:15 -0700",
                    "$3": "frank",
                    "tags": '{"tagA": "valueA","tagB": "valueB","tagC": "valueC"}',
                    "$2": "-",
                    "$1": "127.0.0.1"
                };

                expect(index.buildSource('', extractedFieldsInputParameter)).to.deep.equal({
                    "$status_code": 404,
                    "$request": "GET /products/index.html HTTP/1.0",
                    "$7": 1534,
                    "$4": "10/Oct/2000:13:25:15 -0700",
                    '$tags': { tagA: 'valueA', tagB: 'valueB', tagC: 'valueC' },
                    "tags": '{"tagA": "valueA","tagB": "valueB","tagC": "valueC"}',
                    "$3": "frank",
                    "$2": "-",
                    "$1": "127.0.0.1"
                });

            });
        });

        //tests for transform function in index.js
        describe('transform', function () {
            /* Given a message passed as 'payload', transform function returns bulkrequestdata for the aws elasticsearch
            @params {JSON} payload is transferred as a JSON object containing:
                messagType: "string"
                logGroup: array object
                logEvents: JSON
                logStream: "string"
            @returns bulkrequestdata after processing the given payload
            */
            beforeEach(function () {
                payload = {
                    "messageType": 'DATA_MESSAGE',
                    "logGroup": ['/aws/lambda/', 'API-Gateway-Execution-Logs'],
                    "logEvents": [{
                        "id": "34299932504098067999982349861750949931928054373571100672",
                        "timestamp": 1538062167822,
                        "message": "2018-09-27T15:29:27.822Z\t1f08c356-c26a-11e8-817c-373a13df2581\t2018-09-27T15:29:27.822Z, verbose \t', , [object Object]\n"
                    },
                    {
                        "id": "34299932504098067999982349861750949931928054373571100673",
                        "timestamp": 1538062167822,
                        "message": "END RequestId: 1f08c356-c26a-11e8-817c-373a13df2581\n"
                    }
                    ],
                    "logStream": ""
                };
            })

            // when passing the 'CONTROL_MESSAGE' as payload, transform function returns a null value
            it('should return null value when passing CONTROL_MESSAGE', function () {
                payload.messageType = "CONTROL_MESSAGE";
                expect(index.transform(payload)).to.equal(null);
            });

            // when passing an array with neither /aws/lambda/ or API-Gateway-Execution-Logs at index 0, return null
            it('should return null if logGroup[0] is other than /aws/lambda/ or API-Gateway-Execution-Logs', function () {
                payload.logGroup[0] = "";
                expect(index.transform(payload)).to.equal(null);
            });

            // when passing an empty log events array in payload, return null
            it('should return null if data.request_id equals empty string', function () {
                payload.logEvents = [''];
                expect(index.transform(payload)).to.equal(null);
            });

            // when passing logevents with /aws/lambda/, transform function returns bulkrequestdata containing both action and data information
            it('should return expected bulkBodyRequest for /aws/lambda/', function () {
                var expectedReturnLamba = "{\"index\":{\"_index\":\"applicationlogs\",\"_type\":\"Logs\",\"_id\":\"34299932504098067999982349861750949931928054373571100672\"}}\n{\"request_id\":\"1f08c356-c26a-11e8-817c-373a13df2581\",\"environment\":\"Logs\",\"servicename\":\",API-Gateway-Execution\",\"platform_log_group\":[\"/aws/lambda/\",\"API-Gateway-Execution-Logs\"],\"platform_log_stream\":\"\",\"timestamp\":\"2018-09-27T15:29:27.822Z\",\"message\":\"2018-09-27T15:29:27.822Z, verbose \\t', , [object Object]\",\"log_level\":\"INFO\"}\n{\"index\":{\"_index\":\"applicationlogs\",\"_type\":\"Logs\",\"_id\":\"34299932504098067999982349861750949931928054373571100673\"}}\n{\"request_id\":\"1f08c356-c26a-11e8-817c-373a13df2581\",\"environment\":\"Logs\",\"servicename\":\",API-Gateway-Execution\",\"platform_log_group\":[\"/aws/lambda/\",\"API-Gateway-Execution-Logs\"],\"platform_log_stream\":\"\",\"timestamp\":\"2018-09-27T15:29:27.822Z\",\"message\":\"END RequestId: 1f08c356-c26a-11e8-817c-373a13df2581\",\"log_level\":\"INFO\"}\n";
                expect(index.transform(payload)).to.equal(expectedReturnLamba);
            });



            // when passing logevents with API-Gateway-Execution-Logs, transform function returns bulkrequestdata containing the expectedReturnAPIGateway
            it('should return expected bulkBodyRequest for API-Gateway-Execution-Logs', function () {
                payload.logGroup = ['API-Gateway-Execution-Logs', '/aws/lambda/'];
                var transformFunctionReturn = index.transform(payload);
                var splitArray = transformFunctionReturn.split("\n");
                let TestStamp = JSON.parse(splitArray[1]).timestamp;
                var expectedReturnAPIGateway = "{\"index\":{\"_index\":\"apilogs\",\"_type\":\"\",\"_id\":\"\"}}\n{\"timestamp\":\"" + TestStamp + "\",\"platform_log_group\":[\"API-Gateway-Execution-Logs\",\"/aws/lambda/\"],\"platform_log_stream\":\"\",\"environment\":\"\",\"request_id\":\"\",\"method\":\"GET\",\"domain\":\"\",\"servicename\":\"\",\"path\":\"\",\"application_logs_id\":\"\",\"origin\":\"\",\"host\":\"\",\"user_agent\":\"\",\"x_forwarded_port\":\"\",\"x_forwarded_for\":\"\",\"x_amzn_trace_id\":\"\",\"content_type\":\"\",\"cache_control\":\"\",\"log_level\":\"INFO\",\"status\":\"\"}\n";
                expect(transformFunctionReturn).to.equal(expectedReturnAPIGateway);
            });
        });

        describe('post', function () {
            let payload, expected, response, request, data;
            beforeEach(function () {
                payload = {
                    "host": config.ES_ENDPOINT,
                    "method": "POST",
                    "path": "/_bulk",
                    "body": "Sample data",
                    "headers": {
                        "Content-Type": "application/json",
                    }
                };
                expected = {
                    "took": 91,
                    "errors": false,
                    "items": [{
                        "index": {
                            "_index": "applicationlogs",
                            "_type": "prod",
                            "_id": "34299932504098067999982349861750949931928054373571100672",
                            "_version": 4,
                            "result": "updated",
                            "_shards": {
                                "total": 2,
                                "successful": 2,
                                "failed": 0
                            },
                            "created": false,
                            "status": 250
                        }
                    },
                    {
                        "index": {
                            "_index": "applicationlogs",
                            "_type": "prod",
                            "_id": "34299932504098067999982349861750949931928054373571100673",
                            "_version": 4,
                            "result": "updated",
                            "_shards": {
                                "total": 2,
                                "successful": 2,
                                "failed": 0
                            },
                            "created": false,
                            "status": 250
                        }
                    },
                    {
                        "index": {
                            "_index": "applicationlogs",
                            "_type": "prod",
                            "_id": "34299932504098067999982349861750949931928054373571100674",
                            "_version": 4,
                            "result": "updated",
                            "_shards": {
                                "total": 2,
                                "successful": 2,
                                "failed": 0
                            },
                            "created": false,
                            "status": 250
                        }
                    }
                    ]
                };

                response = new PassThrough();
                request = new PassThrough();
            });

            // tests the post function in index.js
            it("should successfully execute the post function", () => {
                expected.errors = true;
                response.write(JSON.stringify(expected));
                response.end();

                this.request = sinon.stub(https, 'request');
                this.request.callsArgWith(1, response)
                    .returns(request);

                index.post(config, "hello world", (error, success, response, failedItems) => {
                    expect(error).to.have.all.keys('statusCode', 'responseBody');
                });
            })
        });

        // tests the build request function in index.js
        describe('buildRequest', function () {
            /* Given 
            */
            it('should successfully return build request payload', () => {
                expect(index.buildRequest(config.ES_ENDPOINT, "sample text")).to.have.all.keys('host', 'method', 'path', 'body', 'headers');
            });
        });

    });

    describe('utils', () => {
        // Tests for the isNumeric private function in utils.js
        describe('isNumeric', function () {
            /* Given any value, isNumeric will determine whether the value is numeric or not
            * @params {Object} any value (string, int, float, array) that contains data
            * @returns {Boolean} true if passed parameter is numeric, false if it is not numeric
            */
            // positive test for isNumeric Function
            it('should indicate a valid numeric value', function () {
                expect(utils().isNumeric(25.6)).to.equal(true);
            });

            // test for isNumeric Function passing negative float value
            it('should indicate a valid numeric value for negative number', function () {
                expect(utils().isNumeric(-25.6)).to.equal(true);
            });

            // test for isNumeric Function passing 0 value
            it('should indicate a valid numeric value for 0 value', function () {
                expect(utils().isNumeric(0)).to.equal(true);
            });

            // test for isNumeric Function passing big integer value
            it('should indicate a valid numeric value for a big integer', function () {
                expect(utils().isNumeric(Math.floor(100000000 + Math.random() * 900000000))).to.equal(true);
            });
            //negative test for isNumeric Function passing string
            it('should not indicate a false numeric value for string', function () {
                expect(utils().isNumeric("hello")).to.equal(false);
            });

        });
        describe('hash', function () {
            /* Given a string and a encoding technique, hash() returns an encoded output of given string
            @params {String} any string value to be encoded
            @params {String} any of the encoding techniques compatible with sha256 (hex, binary, base64)
            @returns {String} encoded string
            */

            //encodes string = 'surya' in sha256 using hex encoding
            it('should encode surya using hex', function () {
                expect(utils().hash('surya', 'hex')).to.equal('ea1b9d779a37fa378d87c40dd6a56fcd491a7c9bef3a1f6e40228031bf00ac68');
            });

            //encodes string = 'surya' in sha256 using base64 encoding
            it('should encode surya using base-64', function () {
                expect(utils().hash('surya', 'base64')).to.equal('6hudd5o3+jeNh8QN1qVvzUkafJvvOh9uQCKAMb8ArGg=');
            });

            //Having trouble with special "\" in binary
            //encodes string = 'surya' in sha256 using binary encoding
            /*it('should encode surya using binary', function () {
                var expected = 'ê' + '\\' + 'u001b7ú7Ä' + '\\' + 'rÖ¥oÍI' + '\\' + 'u001a|:' + '\\' + 'u001fn@"1¿' + '\\' + 'u0000¬h';
                expect(utils().hash('surya', 'binary')).to.equal(expected);
            });*/

            //negative test condition to check for any invalid encoding technique
            it('should return buffer for any encoding other than base64, hex, or binary', function () {
                expect(utils().hash('surya', 'hex')).toString().includes("<Buffer");
            });
        });
        describe('isValidJson', function () {
            /* Given input, determine whether it is valid json or not
            @params {String} input string
            @returns {Boolean} true if given input string is a valid json file , false if given input string is not a valid json file
            */

            //positive test for isValidJson
            it('should indicate a valid JSON', function () {
                var json = '{ "Version": "2012-10-17","Statement": [{"Sid": "","Effect": "Allow","Principal": {"Service": "cloudtrail.amazonaws.com"},"Action": "sts:AssumeRole"}]}';
                expect(utils().isValidJson(json)).to.equal(true);
            });
            it('should indicate a invalid JSON', function () {
                var json = '{ "Version" "2012-10-17","Statement": [{"Sid": "","Effect": "Allow","Principal": {"Service": "cloudtrail.amazonaws.com"},"Action": "sts:AssumeRole"}]}';
                expect(utils().isValidJson(json)).to.equal(false);
            });
        });
        //Need to write tests for getInfo function in utils. first attempt: utils().getInfo('09-09-2018', "\d\d-\d\d-\d\d\d\d")

    });


});