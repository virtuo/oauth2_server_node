var assert = require('nodetk/testing/custom_assert')
  , server = require('oauth2-server')
  ;


exports.expect_oauth_error = function(res, type, id) {
  /* Set expected values for next oauth_error call.
   * 3 asserts are done.
   *
   * This fct is dangerous because it modifies the state
   * of the server.oauth_error fct. It should probably not be
   * used more than once per test fct.
   */
  server.oauth_error = function(res_, type_, id_) {
    assert.equal(res_, res);
    assert.equal(type_, type);
    assert.equal(id_, id);
    server.oauth_error = function() {
      assert.ok(false, 'server.oauth_error fake called twice.');
    }
  };
};

