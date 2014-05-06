var session = require("zed/session");
module.exports = function(info) {
    return session.insert(info.path, info.inputs.cursor, ".").then(function() {
        return session.callCommand(info.path, "Edit:Complete:Trigger");
    });
};
