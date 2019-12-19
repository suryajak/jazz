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
const StreamZip = require('node-stream-zip');

const zip = 

  //Setting up default values for the aws event and context needed for handler params
describe('Sample', function () {

    beforeEach(function(){
        input = { "file" : new StreamZip({
            file: 'helloWorld.js.zip',
            storeEntries: true
        })
    }
        context = awsContext();
        cb = (value) => {
          return value;
        };
      });

    it('should throw a 101 error for failed items', function (done) {
        input.file = undefined;
        var bool = index.handler(input,context,cb).includes("101") &&
        index.handler(input,context,cb).includes("Failed Items");
        assert(bool);
        done();
    });
}); 