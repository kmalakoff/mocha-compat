// Vendored from serialize-javascript 7.1.1, with feature detection so it runs on the >=0.8 floor.
// Upstream needs Node >=20 only because it generates its UID with crypto.getRandomValues; every
// other 7.x change is portable, so the UID keeps using randombytes and the rest is carried over.
/*
Copyright (c) 2014, Yahoo! Inc. All rights reserved.
Copyrights licensed under the New BSD License.
See the accompanying LICENSE file for terms.
*/ "use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return serialize;
    }
});
var _randombytes = /*#__PURE__*/ _interop_require_default(require("randombytes"));
function _instanceof(left, right) {
    "@swc/helpers - instanceof";
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else return left instanceof right;
}
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
var hasMap = typeof Map !== 'undefined';
var hasSet = typeof Set !== 'undefined';
var hasURL = typeof URL !== 'undefined';
var hasBigInt = typeof BigInt !== 'undefined';
var isArray = Array.isArray || function(x) {
    return Object.prototype.toString.call(x) === '[object Array]';
};
// Object.assign is missing until Node 4, and only the sparse-array branch needs it
var assign = Object.assign || function(target, source) {
    var keys = Object.keys(source);
    for(var i = 0; i < keys.length; i++)target[keys[i]] = source[keys[i]];
    return target;
};
// RegExp.prototype.flags is missing until Node 6; the individual booleans go back to ES3
function regexpFlags(re) {
    if (typeof re.flags === 'string') return re.flags;
    return (re.global ? 'g' : '') + (re.ignoreCase ? 'i' : '') + (re.multiline ? 'm' : '');
}
// Array.from is missing until Node 4, but Map/Set arrive in 0.12, so entries are collected by hand
function mapEntries(map) {
    var out = [];
    map.forEach(function(value, key) {
        out.push([
            key,
            value
        ]);
    });
    return out;
}
function setValues(set) {
    var out = [];
    set.forEach(function(value) {
        out.push(value);
    });
    return out;
}
// Generate an internal UID to make the regexp pattern harder to guess.
var UID_LENGTH = 16;
var UID = generateUID();
var PLACE_HOLDER_REGEXP = new RegExp('(\\\\)?"@__(F|R|D|M|S|A|U|I|B|L)-'.concat(UID, '-(\\d+)__@"'), 'g');
var IS_NATIVE_CODE_REGEXP = /\{\s*\[native code\]\s*\}/g;
var IS_PURE_FUNCTION = /function.*?\(/;
var IS_ARROW_FUNCTION = /.*?=>.*?/;
var UNSAFE_CHARS_REGEXP = /[<>/\u2028\u2029]/g;
// Matches a script end tag (case-insensitive) for XSS protection: either a full `</script...>` tag,
// or a bare `</script` followed by a character the HTML tokenizer treats as ending the tag name.
var SCRIPT_CLOSE_REGEXP = /<\/script[^>]*>|<\/script(?=[\t\n\f\r /><])/gi;
var RESERVED_SYMBOLS = [
    '*',
    'async'
];
// Mapping of unsafe HTML and invalid JavaScript line terminator chars to their
// Unicode char counterparts which are safe to use in JavaScript strings.
var ESCAPED_CHARS = {
    '<': '\\u003C',
    '>': '\\u003E',
    '/': '\\u002F',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};
function escapeUnsafeChars(unsafeChar) {
    return ESCAPED_CHARS[unsafeChar];
}
// Roughly matches string literals, template literals, regex literals and comments, so a script-close
// sequence inside one can be escaped differently from one in plain code. A heuristic, not a parser.
var STRING_OR_COMMENT_REGEXP = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\/(?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\n])+\//g;
// Escape a function body for XSS protection while preserving arrow syntax, comparison operators and
// regex literals: only script end tags and line terminators are escaped.
function escapeFunctionBody(str) {
    var stringAndCommentSpans = [];
    var match;
    STRING_OR_COMMENT_REGEXP.lastIndex = 0;
    // biome-ignore lint/suspicious/noAssignInExpressions: exec-loop is the documented RegExp idiom
    while(match = STRING_OR_COMMENT_REGEXP.exec(str)){
        stringAndCommentSpans.push([
            match.index,
            match.index + match[0].length
        ]);
    }
    // Matches and spans are both in increasing offset order, so one forward cursor classifies every
    // match in O(n) instead of rescanning the spans each time.
    var spanCursor = 0;
    var out = str.replace(SCRIPT_CLOSE_REGEXP, function(scriptCloseMatch, offset) {
        while(spanCursor < stringAndCommentSpans.length && stringAndCommentSpans[spanCursor][1] <= offset){
            spanCursor++;
        }
        var span = stringAndCommentSpans[spanCursor];
        var inStringOrComment = !!span && offset >= span[0] && offset < span[1];
        if (!inStringOrComment) {
            // In plain code `<` and `/` may be real tokens, so they cannot be rewritten as unicode escapes
            // without breaking syntax. A space is a no-op that still breaks up the `</script` sequence.
            return "< ".concat(scriptCloseMatch.slice(1));
        }
        // Inside a string/template/regex/comment the characters must survive exactly, so escape instead.
        return scriptCloseMatch.replace(/</g, '\\u003C').replace(/\//g, '\\u002F').replace(/>/g, '\\u003E');
    });
    out = out.replace(/\u2028/g, '\\u2028');
    out = out.replace(/\u2029/g, '\\u2029');
    return out;
}
function generateUID() {
    var bytes = (0, _randombytes.default)(UID_LENGTH);
    var result = '';
    for(var i = 0; i < UID_LENGTH; ++i){
        result += bytes[i].toString(16);
    }
    return result;
}
function deleteFunctions(obj) {
    var functionKeys = [];
    for(var key in obj){
        if (typeof obj[key] === 'function') {
            functionKeys.push(key);
        }
    }
    for(var i = 0; i < functionKeys.length; i++){
        delete obj[functionKeys[i]];
    }
}
function serialize(obj, options) {
    var opts = {};
    if (options) {
        // Backwards-compatibility for `space` as the second argument.
        if (typeof options === 'number' || typeof options === 'string') {
            opts = {
                space: options
            };
        } else {
            opts = options;
        }
    }
    var functions = [];
    var regexps = [];
    var dates = [];
    var maps = [];
    var sets = [];
    var arrays = [];
    var undefs = [];
    var infinities = [];
    var bigInts = [];
    var urls = [];
    // Returns placeholders for functions and regexps (identified by index)
    // which are later replaced by their string representation.
    function replacer(key, value) {
        // For nested function
        if (opts.ignoreFunction) {
            deleteFunctions(value);
        }
        if (hasBigInt && !value && value !== undefined && value !== BigInt(0)) {
            return value;
        }
        // If the value is an object w/ a toJSON method, toJSON is called before
        // the replacer runs, so we use this[key] to get the non-toJSONed value.
        var origValue = this[key];
        var type = typeof origValue === "undefined" ? "undefined" : _type_of(origValue);
        if (type === 'object') {
            if (_instanceof(origValue, RegExp)) {
                return "@__R-".concat(UID, "-").concat(regexps.push(origValue) - 1, "__@");
            }
            if (_instanceof(origValue, Date)) {
                return "@__D-".concat(UID, "-").concat(dates.push(origValue) - 1, "__@");
            }
            if (hasMap && _instanceof(origValue, Map)) {
                return "@__M-".concat(UID, "-").concat(maps.push(origValue) - 1, "__@");
            }
            if (hasSet && _instanceof(origValue, Set)) {
                return "@__S-".concat(UID, "-").concat(sets.push(origValue) - 1, "__@");
            }
            if (isArray(origValue)) {
                var isSparse = origValue.filter(function() {
                    return true;
                }).length !== origValue.length;
                if (isSparse) {
                    return "@__A-".concat(UID, "-").concat(arrays.push(origValue) - 1, "__@");
                }
            }
            if (hasURL && _instanceof(origValue, URL)) {
                return "@__L-".concat(UID, "-").concat(urls.push(origValue) - 1, "__@");
            }
        }
        if (type === 'function') {
            return "@__F-".concat(UID, "-").concat(functions.push(origValue) - 1, "__@");
        }
        if (type === 'undefined') {
            return "@__U-".concat(UID, "-").concat(undefs.push(origValue) - 1, "__@");
        }
        if (type === 'number' && !Number.isNaN(origValue) && !Number.isFinite(origValue)) {
            return "@__I-".concat(UID, "-").concat(infinities.push(origValue) - 1, "__@");
        }
        if (type === 'bigint') {
            return "@__B-".concat(UID, "-").concat(bigInts.push(origValue) - 1, "__@");
        }
        return value;
    }
    function serializeFunc(fn, funcOptions) {
        var serializedFn = fn.toString();
        if (IS_NATIVE_CODE_REGEXP.test(serializedFn)) {
            throw new TypeError("Serializing native function: ".concat(fn.name));
        }
        // Escape unsafe HTML characters in function body for XSS protection
        if (funcOptions && funcOptions.unsafe !== true) {
            serializedFn = escapeFunctionBody(serializedFn);
        }
        // pure functions, example: {key: function() {}}
        if (IS_PURE_FUNCTION.test(serializedFn)) {
            return serializedFn;
        }
        // arrow functions, example: arg1 => arg1+5
        if (IS_ARROW_FUNCTION.test(serializedFn)) {
            return serializedFn;
        }
        var argsStartsAt = serializedFn.indexOf('(');
        var def = serializedFn.substr(0, argsStartsAt).trim().split(' ').filter(function(val) {
            return val.length > 0;
        });
        var nonReservedSymbols = def.filter(function(val) {
            return RESERVED_SYMBOLS.indexOf(val) === -1;
        });
        // enhanced literal objects, example: {key() {}}
        if (nonReservedSymbols.length > 0) {
            return "".concat(def.indexOf('async') > -1 ? 'async ' : '', "function").concat(def.join('').indexOf('*') > -1 ? '*' : '').concat(serializedFn.substr(argsStartsAt));
        }
        // arrow functions
        return serializedFn;
    }
    // Check if the parameter is function
    var objToSerialize = obj;
    if (opts.ignoreFunction && typeof objToSerialize === 'function') {
        objToSerialize = undefined;
    }
    // Protects against `JSON.stringify()` returning `undefined`, by serializing
    // to the literal string: "undefined".
    if (objToSerialize === undefined) {
        return String(objToSerialize);
    }
    var str;
    // Creates a JSON string representation of the value.
    // NOTE: Node 0.12 goes into slow mode with extra JSON.stringify() args.
    if (opts.isJSON && !opts.space) {
        str = JSON.stringify(objToSerialize);
    } else {
        str = JSON.stringify(objToSerialize, opts.isJSON ? null : replacer, opts.space);
    }
    // Protects against `JSON.stringify()` returning `undefined`, by serializing
    // to the literal string: "undefined".
    if (typeof str !== 'string') {
        return String(str);
    }
    // Replace unsafe HTML and invalid JavaScript line terminator chars with
    // their safe Unicode char counterpart. This _must_ happen before the
    // regexps and functions are serialized and added back to the string.
    if (opts.unsafe !== true) {
        str = str.replace(UNSAFE_CHARS_REGEXP, escapeUnsafeChars);
    }
    if (functions.length === 0 && regexps.length === 0 && dates.length === 0 && maps.length === 0 && sets.length === 0 && arrays.length === 0 && undefs.length === 0 && infinities.length === 0 && bigInts.length === 0 && urls.length === 0) {
        return str;
    }
    // Replaces all occurrences of function, regexp, date, map and set placeholders in the
    // JSON string with their string representations. If the original value can
    // not be found, then `undefined` is used.
    return str.replace(PLACE_HOLDER_REGEXP, function(match, backSlash, type, valueIndex) {
        // The placeholder may not be preceded by a backslash. This is to prevent
        // replacing things like `"a\"@__R-<UID>-0__@"` and thus outputting
        // invalid JS.
        if (backSlash) {
            return match;
        }
        if (type === 'D') {
            // Validate the ISO string to prevent code injection through a spoofed toISOString()
            var isoStr = String(dates[valueIndex].toISOString());
            if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(isoStr)) {
                throw new TypeError('Invalid Date ISO string');
            }
            return 'new Date("'.concat(isoStr, '")');
        }
        if (type === 'R') {
            // Sanitize flags to prevent code injection (only valid RegExp flag characters survive)
            var flags = String(regexpFlags(regexps[valueIndex])).replace(/[^gimsuydv]/g, '');
            var regexpSource = regexps[valueIndex].source;
            if (typeof regexpSource !== 'string') {
                throw new TypeError('RegExp.source must be a string');
            }
            return "new RegExp(".concat(serialize(regexpSource), ', "').concat(flags, '")');
        }
        if (type === 'M') {
            return "new Map(".concat(serialize(mapEntries(maps[valueIndex]), opts), ")");
        }
        if (type === 'S') {
            return "new Set(".concat(serialize(setValues(sets[valueIndex]), opts), ")");
        }
        if (type === 'A') {
            return "Array.prototype.slice.call(".concat(serialize(assign({
                length: arrays[valueIndex].length
            }, arrays[valueIndex]), opts), ")");
        }
        if (type === 'U') {
            return 'undefined';
        }
        if (type === 'I') {
            return String(infinities[valueIndex]);
        }
        if (type === 'B') {
            return 'BigInt("'.concat(bigInts[valueIndex], '")');
        }
        if (type === 'L') {
            var urlStr = urls[valueIndex].toString();
            if (typeof urlStr !== 'string') {
                throw new TypeError('URL.toString() must return a string');
            }
            return "new URL(".concat(serialize(urlStr, opts), ")");
        }
        var fn = functions[valueIndex];
        return serializeFunc(fn, opts);
    });
}
/* CJS INTEROP */ if (exports.__esModule && exports.default) { try { Object.defineProperty(exports.default, '__esModule', { value: true }); for (var key in exports) { exports.default[key] = exports[key]; } } catch (_) {}; module.exports = exports.default; }