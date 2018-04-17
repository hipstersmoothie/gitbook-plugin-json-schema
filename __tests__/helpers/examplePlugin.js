'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _map2 = require('lodash/map');

var _map3 = _interopRequireDefault(_map2);

var _get2 = require('lodash/get');

var _get3 = _interopRequireDefault(_get2);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

var getEnumVal = function getEnumVal(decl) {
  return (
    (0, _get3.default)(decl, 'const') || (0, _get3.default)(decl, 'enum.0')
  );
};

var roleRow = function roleRow(schema) {
  return (
    '\n    <tr>\n      <td>' +
    getEnumVal(schema) +
    '</td>\n      <td>' +
    schema.description +
    '</td>\n    </tr>\n  '
  );
};

var roleTable = function roleTable(_ref) {
  var oneOf = _ref.oneOf;

  if (!oneOf) return '';

  return (
    '\n    <h4>Role</h4>\n    <table>\n      <thead>\n        <tr>\n          <td>Role</td>\n          <td>Description</td>\n        </tr>\n      </thead>\n      <tbody>\n        ' +
    (0, _map3.default)(oneOf, roleRow).join('') +
    '\n      </tbody>\n    </table>\n  '
  );
};

exports.default = roleTable;
