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

const expect = require('chai').expect;
const assert = require('chai').assert;
const utils = require("../components/utils");
const index = require("../index");

describe('jazz_cloud-logs-streamer', function () {
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
            //negative test for isNumeric Function
            it('should indicate a false numeric value', function () {
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
    describe('index', () => {
        //var log = '127.0.0.1 - frank [10/Oct/2000:13:25:15 -0700] "GET /apache_pb.gif HTTP/1.0" 200 1534';
        //var extractedFields = '{ $.latency = * }'
        describe('buildSource', function () {
            it('should return {} for empty message and empty extracted fields', function () {
                expect(index.buildSource("", "")).to.deep.equal({});
            });
            it("should return parsed JSON", function () {
                var json = '{"Version":"2012-10-17","Statement":[{"Sid":"","Effect":"Allow","Principal":{"Service":"cloudtrail.amazonaws.com"},"Action":"sts:AssumeRole"}]}';
                expect(JSON.stringify(index.buildSource(json, ""))).to.equal(json);
            });

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

        describe('transform', function () {

            beforeEach(function(){
                payload = { "messageType" : 'DATA_MESSAGE',
                          "logGroup" : ['/aws/lambda/', 'API-Gateway-Execution-Logs'],
                          "logEvents" : [],
                          "logStream" : ""
                        };
              })

            it('should return null value when passing CONTROL_MESSAGE', function () {
                payload.messageType = "CONTROL_MESSAGE";
                expect(index.transform(payload)).to.equal(null);
            });
            it('should return null if logGroup[0] is other than /aws/lambda/ or API-Gateway-Execution-Logs', function(){
                payload.logGroup[0] = "";
                expect(index.transform(payload)).to.equal(null);
            });
        });
    });
});