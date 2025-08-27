
// Override stdin and prompt to prevent browser modal dialogs
if (typeof Module === 'undefined') var Module = {};
Module.stdin = function() { return null; };
if (typeof prompt !== 'undefined') {
    var originalPrompt = prompt;
    prompt = function() { return null; };
}
