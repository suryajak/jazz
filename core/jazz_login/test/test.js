const assert = require('chai').assert;
const awsContext = require('aws-lambda-mock-context');
const AWSCognito = require('amazon-cognito-identity-js');
const sinon = require('sinon');
const index = require('../index');

var event, context, callback;

describe('Login', function () {

  beforeEach(function () {
    event = {
      "method": "POST",
      "stage": "test",
      "body": {
        "username": "whatTimeIsIt",
        "password": "AdventureT1me!"
      }
    };
    context = awsContext();
    callback = (value) => {
      return value;
    };
  });

  it("Expected - BadRequest error: undefined method", function () {
    event.method = undefined;
    var bool = index.handler(event, context, callback).includes("Bad Request") &&
      index.handler(event, context, callback).includes("100");;
    assert.isTrue(bool);
  });

  it("Expected - BadRequest error: any method other than post", function () {
    var methods = ["PUT", "GET", "HEAD", "OPTIONS", "DELETE"];
    var badRequestBool = true;
    for (var i = 0; i < methods.length; i++) {
      event.method = methods[i];
      if (!(index.handler(event, context, callback).includes("Bad Request") &&
        index.handler(event, context, callback).includes("100"))) {
        badRequestBool = false;
      }
    }
    assert.isTrue(badRequestBool);
  });

  it("Expected - 101 error:  missing Username", function () {
    event.body.username = undefined;
    var bool = index.handler(event, context, callback).includes("101") &&
      index.handler(event, context, callback).includes("Username not provided");
    assert.isTrue(bool);
  });

  it("Expected - 102 error: Missing Password", function () {
    event.body.password = undefined;
    var bool = index.handler(event, context, callback).includes("102") &&
      index.handler(event, context, callback).includes("No password provided for user: ");
    assert.isTrue(bool);
  });
});