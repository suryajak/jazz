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
const utils = require("../components/utils");

describe('jazz_cloud-logs-streamer', function () {
    describe('utils', () => {
        describe('isNumeric', function () {
            it('should indicate a valid numeric value', function () {
                expect(utils().isNumeric(25.6)).to.equal(true);
            });
        });
        describe('hash', function () {
            it('should encode surya using hex', function () {
                expect(utils().hash('surya', 'hex')).to.equal('ea1b9d779a37fa378d87c40dd6a56fcd491a7c9bef3a1f6e40228031bf00ac68');
            });
            it('should encode surya using base-64', function () {
                expect(utils().hash('surya', 'base64')).to.equal('6hudd5o3+jeNh8QN1qVvzUkafJvvOh9uQCKAMb8ArGg=');
            });
            //Having trouble with special "\" in binary
            /*it('should encode surya using binary', function () {
                var expected = 'ê' + '\\' + 'u001b7ú7Ä' + '\\' + 'rÖ¥oÍI' + '\\' + 'u001a|:' + '\\' + 'u001fn@"1¿' + '\\' + 'u0000¬h';
                expect(utils().hash('surya', 'binary')).to.equal(expected);
            });*/
        });
        describe('isValidJson', function () {
            it('should indicate a valid numeric value', function () {
                expect(utils().isValidJson('{ "name": "Surya", "age": 22 }')).to.equal(true);
            });
        });
        //Need to write tests for getInfo function in utils. first attempt: utils().getInfo('09-09-2018', "\d\d-\d\d-\d\d\d\d")

    });
    describe('utils', () => {
        describe('isNumeric', function () {
            it('should indicate a valid numeric value', function () {
                expect(utils().isNumeric(25.6)).to.equal(true);
            });
        });
    });
});