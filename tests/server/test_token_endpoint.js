var assert = require('nodetk/testing/custom_assert')
  , server = require('oauth2-server')
  , tools = require('nodetk/testing/tools')
  , expect_oauth_error = require('./tools').expect_oauth_error
  ;


// To reinit faked/mocked stuff in the end:
var initial_oauth_error = server.oauth_error;
var initial_RFactory = server.RFactory;
var initial_valid_grant = server.valid_grant;
exports.module_close = function(callback) {
  server.oauth_error = initial_oauth_error;
  server.RFactory = initial_RFactory;
  server.valid_grant = initial_valid_grant;
  callback();
};


var missing_param_test = function(missing_param) {
  /* Test behaviour when there is a missing param. 
   * 3 asserts done.
   */
  server.RFactory = function(){return {}};
  var res = 'resobj';
  var params = {grant_type: 1, client_id: 1, code: 1, redirect_uri: 1};
  delete params[missing_param];
  var req = tools.get_fake_post_request('url', params);
  expect_oauth_error(res, 'oat', 'invalid_request');
  server.token_endpoint(req, res);
};


var unsupported_grand_type_test = function(grant_type) {
  /* Test behaviour when providing unsupported grant_type.
   * 3 asserts are done.
   */
  server.RFactory = function(){return {}};
  var res = 'resobj';
  var params = {client_id: 1, code: 1, redirect_uri: 1,
                grant_type: grant_type};
  var req = tools.get_fake_post_request('url', params);
  expect_oauth_error(res, 'oat', 'unsupported_grant_type');
  server.token_endpoint(req, res);
}


exports.tests = [

['Empty POST req', 3, function() {
  var res = 'resobj';
  var req = tools.get_fake_post_request('url', {});
  expect_oauth_error(res, 'oat', 'invalid_request');
  server.token_endpoint(req, res);
}],

['POST req with err', 3, function() {
  var res = 'resobj';
  var req = tools.get_fake_post_request('url', {}, 'error');
  expect_oauth_error(res, 'oat', 'invalid_request');
  server.token_endpoint(req, res);
}],

['Missing parameter: grant_type', 3, function() {
  missing_param_test('grant_type');
}],

['Missing parameter: client_id', 3, function() {
  missing_param_test('client_id');
}],

['Missing parameter: code', 3, function() {
  missing_param_test('code');
}],

['Missing parameter: redirect_uri', 3, function() {
  missing_param_test('redirect_uri');
}],

['Unsupported grant_type: password', 3, function() {
  unsupported_grand_type_test('password');
}],

['Unsupported grant_type: assertion', 3, function() {
  unsupported_grand_type_test('assertion');
}],

['Unsupported grant_type: refresh_token', 3, function() {
  unsupported_grand_type_test('refresh_token');
}],

['Unsupported grant_type: none', 3, function() {
  unsupported_grand_type_test('none');
}],

['client_secret given twice', 3, function() {
  server.RFactory = function(){return {}};
  var res = 'resobj';
  var params = {
    client_id: 1, code: 1, redirect_uri: 1,
    grant_type: 'authorization_code',
    client_secret: 'somesecret'
  };
  var additional_headers = {authorization: 'Basic somesecret'};
  var req = tools.get_fake_post_request('url', params, null,
                                        additional_headers);
  expect_oauth_error(res, 'oat', 'invalid_request');
  server.token_endpoint(req, res);
}],


['Unexisting client', 4, function() {
  server.RFactory = function(){return {Client: {get: function(query, callback) {
    assert.equal(query.ids, 'cid');
    callback(null);
  }}}};
  var res = 'resobj';
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 1,
    grant_type: 'authorization_code',
  };
  var additional_headers = {authorization: 'Basic somesecret'};
  var req = tools.get_fake_post_request('url', params, null,
                                        additional_headers);
  expect_oauth_error(res, 'oat', 'invalid_client');
  server.token_endpoint(req, res);
}],

['Incorrect secret (in headers)', 4, function() {
  server.RFactory = function(){return {Client: {get: function(query, callback) {
    assert.equal(query.ids, 'cid');
    callback({secret: 'someothersecret'});
  }}}};
  var res = 'resobj';
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 1,
    grant_type: 'authorization_code',
  };
  var additional_headers = {authorization: 'Basic somesecret'};
  var req = tools.get_fake_post_request('url', params, null,
                                        additional_headers);
  expect_oauth_error(res, 'oat', 'invalid_client');
  server.token_endpoint(req, res);
}],


['Incorrect secret (in params)', 4, function() {
  server.RFactory = function(){return {Client: {get: function(query, callback) {
    assert.equal(query.ids, 'cid');
    callback({secret: 'someothersecret'});
  }}}};
  var res = 'resobj';
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 1,
    grant_type: 'authorization_code',
    client_secret: 'somesecret'
  };
  var req = tools.get_fake_post_request('url', params);
  expect_oauth_error(res, 'oat', 'invalid_client');
  server.token_endpoint(req, res);
}],

['Invalid grant', 3, function() {
  server.RFactory = function(){return {Client: {get: function(query, callback) {
    callback({secret: 'somesecret', redirect_uri: 'http://client/process'});
  }}}};
  server.valid_grant = function(_, _, callback){callback(null)};
  var res = 'resobj';
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 'http://client/process',
    grant_type: 'authorization_code',
    client_secret: 'somesecret'
  };
  var req = tools.get_fake_post_request('url', params);
  expect_oauth_error(res, 'oat', 'invalid_grant');
  server.token_endpoint(req, res);
}],

['Error retrieving client', 3, function() {
  server.RFactory = function(){return {Client: {get: function(query, _, fallback) {
    fallback('error');
  }}}};
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 'http://client/process',
    grant_type: 'authorization_code',
    client_secret: 'somesecret'
  };
  var req = tools.get_fake_post_request('url', params);
  var res = tools.get_expected_res(500);
  server.token_endpoint(req, res);
}],

['Error while validating grant', 3, function() {
  server.RFactory = function(){return {Client: {get: function(query, callback) {
    callback({secret: 'somesecret', redirect_uri: 'http://client/process'});
  }}}};
  server.valid_grant = function(_, _, _, fallback){fallback('error')};  
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 'http://client/process',
    grant_type: 'authorization_code',
    client_secret: 'somesecret'
  };
  var req = tools.get_fake_post_request('url', params);
  var res = tools.get_expected_res(500);
  server.token_endpoint(req, res);
}],

['Valid grant', 3, function() {
  server.RFactory = function(){return {Client: {get: function(query, callback) {
    callback({secret: 'somesecret', redirect_uri: 'http://client/process'});
  }}}};
  server.valid_grant = function(_, _, callback){callback({'a': 'b'})};
  var params = {
    client_id: 'cid', code: 1, redirect_uri: 'http://client/process',
    grant_type: 'authorization_code',
    client_secret: 'somesecret'
  };
  var req = tools.get_fake_post_request('url', params);
  var res = {
    writeHead: function(status_code, headers) {
      assert.equal(status_code, 200);
      assert.deepEqual(headers, { 
        'Content-Type': 'application/json'
      , 'Cache-Control': 'no-store'
      });
    }
  , end: function(body) {
      assert.equal(body, '{"a":"b"}');
    }
  };
  expect_oauth_error(res, 'oat', 'invalid_grant');
  server.token_endpoint(req, res);
}],

];

