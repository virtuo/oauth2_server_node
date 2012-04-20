var assert = require('nodetk/testing/custom_assert')
  , formidable = require('formidable')
  , server = require('oauth2-server')
  , tools = require('nodetk/testing/tools')
  , querystring = require('querystring')
  , expect_oauth_error = require('./tools').expect_oauth_error
  ;

// Reinit some mocked / faked stuff:
original_authorize = server.authorize;
original_oauth_error = server.oauth_error;
exports.module_close = function(callback) {
  server.authorize = original_authorize;
  server.oauth_error = original_oauth_error;
  callback();
};

exports.setup = function(callback) {
  server.authorize = original_authorize;
  callback();
};


exports.tests = [

['Params given (GET)', 3, function() {
  var qs = querystring.stringify({someparam: "someval"});
  var req = {method: 'GET', url: 'http://server/auth?' + qs};
  var res = 'res obj';
  server.authorize = function(params, req_, res_) {
    assert.equal(req_, req);
    assert.equal(res_, res);
    assert.deepEqual({someparam: "someval"}, params);
  };
  server.authorize_endpoint(req, res);
}],

['Params given (POST)', 3, function() {
  var req = tools.get_fake_post_request('http://server/auth', {
    someparam: "someval",
  });
  var res = 'res obj';
  server.authorize = function(params, req_, res_) {
    assert.equal(req_, req);
    assert.equal(res_, res);
    assert.deepEqual({someparam: "someval"}, params);
  };
  server.authorize_endpoint(req, res);
}],

['No params given', 3, function() {
  var req = tools.get_fake_post_request('http://server/auth', {})
  var res = 'res obj';
  expect_oauth_error(res, 'eua', 'invalid_request');
  server.authorize_endpoint(req, res);
}],

['Error in form.parse', 3, function() {
  var req = tools.get_fake_post_request('http://server/auth', {a: "b"}, 'error');
  var res = 'res obj';
  expect_oauth_error(res, 'eua', 'invalid_request');
  server.authorize_endpoint(req, res);
}],

];

