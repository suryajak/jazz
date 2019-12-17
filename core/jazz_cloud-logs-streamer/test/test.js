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
const sinon = require('sinon');
const rewire = require("rewire");
const context = require('aws-lambda-mock-context');

const index = rewire('../index');
const utils = require("../components/utils.js")();

describe('cloud-logs-streamer', function () {
  afterEach(function() {
    sinon.restore();
  });
  describe('index-payload method tests', function() {
    const transform = index.__get__('transform');
    let utils = index.__get__('utils')
    let payload = {
      logGroup: 'API-Gateway-Execution-Logs_Test/Mocking',
    };

    it('transform should return null in case of control message', function () {
            let payload = { messageType: 'CONTROL_MESSAGE'};
            assert(transform(payload) === null);
    });

    it('transform with logGroup API-Gateway-Exec-Logs should set all index data correctly ', function () {
      payload.logEvents = [
        {
          message: "(MOCK12345) Starting execution for request: "
        },
        {
          message: "HTTP Method: PATCH, mocking"
        },
        {
          message: "Resource Path: /api/mock-resourcepath/mock-domain"
        },
        {
          message: "Method request path:mocking-path"
        },
        {
          message: "Method request headers: , Host=mock.docs.com, \
          User-Agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:70.0) \
          Gecko/20100101 Firefox/70.0, Accept=text/html,application/xhtml+xml,\
          application/xml;q=0.9,*/*;q=0.8, Accept-Language=en-US,en;q=0.5, Accept-Encoding=gzip, \
          deflate, br, Referer=https://www.google.com/, DNT=1, Connection=keep-alive, \
          Cookie=hibext_instdsigdipv2=1, Upgrade-Insecure-Requests=1, Pragma=no-cache, \
          Cache-Control=no-cache"
        }];

      let getInfoSpy = sinon.spy(utils, 'getInfo');
      let getSubInfoSpy = sinon.spy(utils, 'getSubInfo');
      let res = transform(payload);
      getInfoSpy.restore();
      getSubInfoSpy.restore();

      assert.equal(getSubInfoSpy.callCount, 9)
      assert.equal(getInfoSpy.callCount, 7)

      let response = res.split("\n");
      assert(response.length === 3, "transform has not returned correct data")
      let action = JSON.parse(response[0])
      let data = JSON.parse(response[1])

      assert(action.index._index === "apilogs", "elastic index is not apilogs")
      assert(action.index._type === "Mocking",  "Mocking is not elastic type")
      assert(action.index._id === "MOCK12345", "_id is not MOCK12345" )
      assert(data["path"] === "mocking-path", "path is not mocking-path" )
    });

    it('transform with API-Gateway-Exec-Logs default method should be GET', function () {
      payload.logEvents = [
        // {
        //   message: "HTTP Method: PATCH, mocking"
        // }
      ];
      let res = transform(payload);
      let response = res.split("\n");
      let data = JSON.parse(response[1])
      assert(data["method"] === "GET", "path is not mocking-path" )
    });

    it('transform with API-Gateway-Exec-Logs domain should set correctly when passed in resourcepath', function () {
      payload.logEvents = [
        {
          message: "(MOCK12345) Starting execution for request: "
        },
        {
          message: "HTTP Method: PATCH, mocking"
        },
        {
          message: "Resource Path: /api/mock-resourcepath/mock-domain"
        },
        {
          message: "Method request path:mocking-path"
        },
        {
          message: "Method request headers: , Host=mock.docs.com, User-Agent=Mozilla/5.0 \
          (Macintosh; Intel Mac OS X 10.13; rv:70.0) Gecko/20100101 Firefox/70.0, \
          Accept=text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8, \
          Accept-Language=en-US,en;q=0.5, Accept-Encoding=gzip, deflate, br, \
          Referer=https://www.google.com/, DNT=1, Connection=keep-alive, \
          Cookie=hibext_instdsigdipv2=1, Upgrade-Insecure-Requests=1, Pragma=no-cache, \
          Cache-Control=no-cache"
        }];
      let getInfoSpy = sinon.spy(utils, 'getInfo');
      let getSubInfoSpy = sinon.spy(utils, 'getSubInfo');
      let res = transform(payload);
      getInfoSpy.restore();
      getSubInfoSpy.restore();

      assert.equal(getSubInfoSpy.callCount, 9)
      assert.equal(getInfoSpy.callCount, 7)

      let response = res.split("\n");
      assert(response.length === 3, "transform has not returned correct data")
      let action = JSON.parse(response[0])
      let data = JSON.parse(response[1])

      assert(data["domain"] === "mock-resourcepath", "data - domain is not mock-resourcepath" )
    });

    it('transform with API-Gateway-Exec-Logs domain should be empty ', function () {
      payload.logEvents = [
        {
          message: "(MOCK12345) Starting execution for request: "
        },
        {
          message: "HTTP Method: PATCH, mocking"
        },
        {
          message: "Resource Path: /api/mock-resourcepath-mock-domain"
        },
        {
          message: "Method request path:mocking-path"
        },
        {
          message: "Method request headers: , Host=mock.docs.com, User-Agent=Mozilla/5.0 \
          (Macintosh; Intel Mac OS X 10.13; rv:70.0) Gecko/20100101 Firefox/70.0, \
          Accept=text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8, \
          Accept-Language=en-US,en;q=0.5, Accept-Encoding=gzip, deflate, br, \
          Referer=https://www.google.com/, DNT=1, Connection=keep-alive, \
          Cookie=hibext_instdsigdipv2=1, Upgrade-Insecure-Requests=1, Pragma=no-cache, \
          Cache-Control=no-cache"
        }];
      let res = transform(payload);
      let response = res.split("\n");
      assert(response.length === 3, "transform has not returned correct data")
      let data = JSON.parse(response[1])
      assert(data["domain"] === "", "domain is not empty" )
    });

    it('transform with logGroup /aws/lambda/ return null when requestId is empty', function () {
      payload.logGroup = "/aws/lambda/";

      let getInfoSpy = sinon.spy(utils, 'getInfo');
      let getSubInfoSpy = sinon.spy(utils, 'getSubInfo');
      let res = transform(payload);
      getInfoSpy.restore();
      getSubInfoSpy.restore();

      assert.equal(getSubInfoSpy.callCount, 0);
      assert.equal(getInfoSpy.callCount, 1);
      assert.equal(res, null);
    });

    it('transform with logGroup /aws/lambda/ should return invalid when \
      environment/domain is not set', function () {
        payload.logGroup = "/aws/lambda/";
        payload.logEvents = [
          {
            message: "END RequestId: MOCK_REQUEST_ID\n"
          }];
        let getInfoSpy = sinon.spy(utils, 'getInfo');
        let getSubInfoSpy = sinon.spy(utils, 'getSubInfo');
        let res = transform(payload);
        getInfoSpy.restore();
        getSubInfoSpy.restore();

        assert.equal(getSubInfoSpy.callCount, 2);
        assert.equal(getInfoSpy.callCount, 1);
        assert.equal(res, '');
    });

    it('transform with logGroup /aws/lambda/ should set data correctly valid response when requestId and domain are set', function () {
        payload.logGroup = "/aws/lambda/mock-group";
        payload.logEvents = [
          {
            message: "END RequestId: f7acb674-40f4-45d7-93f3-f49eb3915148\n",
            timestamp: Math.round((new Date()).getTime() / 1000)
          },
          {
            message: "FATAL END RequestId: f9acb674-40f4-45d6-95f4-f49eb3915122",
            timestamp: Math.round((new Date()).getTime() / 1000)
          }
        ];
        let getInfoSpy = sinon.spy(utils, 'getInfo');
        let getSubInfoSpy = sinon.spy(utils, 'getSubInfo');
        let res = transform(payload);
        getInfoSpy.restore();
        getSubInfoSpy.restore();
        assert.equal(getSubInfoSpy.callCount, 8);
        assert.equal(getInfoSpy.callCount, 1);
        assert.notEqual(res, '');
        let response = res.split("\n");
        assert.equal(response.length, 5)
    });

    it('transform with logGroup /aws/lambda/ should set DEFAULT_LOG_LEVEL to info when input is valid', function () {
        payload.logGroup = "/aws/lambda/mock-group";
        payload.logEvents = [
          {
            message: "END RequestId: f9acb674-40f4-45d6-95f4-f49eb3915122\n",
            timestamp: Math.round((new Date()).getTime() / 1000)
          }
        ];
        let res = transform(payload);
        assert.notEqual(res, '');
        let response = res.split("\n");
        assert.equal(response.length, 3);
        let data = JSON.parse(response[1]);
        assert.equal(data.log_level, 'INFO')
    });
  });
});
