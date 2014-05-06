"use strict";
var db = require("zed/db");

var ID_REGEX = /[A-Za-z0-9_\$]/;
var HIGH_NUMBER = 1000000;

module.exports = function(info) {
    var i = info.inputs.cursorIndex - 1;
    var text = info.inputs.text;
    var modeName = info.inputs.modeName;

    var prefix = "";
    var prev;
    if (text[i] !== ".") {
        prefix = getBackIdentifier();
    }
    if (text[i] === ".") {
        i--;
        prev = getBackIdentifier();
        console.log("Results:", i, prev, prefix);
        if (prev) {
            return db.queryIndex("follow", "pred_idn", [">=", [modeName, prev, 0, prefix], "<=", [modeName, prev, HIGH_NUMBER, prefix + "~"], {
                limit: 200
            }]).then(function(candidates) {
                var totalScores = {};
                console.log("Result count:", candidates.length);
                candidates.forEach(function(candidate) {
                    if (!totalScores[candidate.follow]) {
                        totalScores[candidate.follow] = 0;
                    }
                    totalScores[candidate.follow] += candidate.count;
                });
                var results = Object.keys(totalScores).map(function(follow) {
                    var score = totalScores[follow];
                    if (follow.indexOf("(") !== -1) {
                        return {
                            name: follow,
                            value: follow,
                            snippet: follow.replace(/\$/g, "\\$").replace(")", "${1})"),
                            icon: "function",
                            score: 100 + score,
                            meta: "follow"
                        };
                    } else {
                        return {
                            name: follow,
                            value: follow,
                            icon: "property",
                            score: 100 + score,
                            meta: "follow"
                        };
                    }
                });
                // console.log("Results", results);
                return results;
            });
        }
    } else {
        return [];
    }

    function getBackIdentifier() {
        var characters = [];
        while (i >= 0) {
            var ch = text[i];
            if (ID_REGEX.exec(ch)) {
                characters.push(ch);
                i--;
            } else if (ch === ")") {
                characters.push(")", "(");
                handleBrace();
            } else {
                return characters.reverse().join('');
            }
        }
        return characters.reverse().join('');
    }

    function handleBrace() {
        i--;
        while (i > 0) {
            if (text[i] === "(") {
                i--;
                return;
            } else if (text[i] === ")") {
                handleBrace();
            }
            i--;
        }
    }
};
