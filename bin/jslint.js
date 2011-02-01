#!/usr/bin/env node
/**
 * NodeJS版JSLint(JavaScript代码品质检查工具).
 * 代码部分引用自https://github.com/Ephigenia/nodejs-jslint
 * 感谢作者Marcel Eichner <love@ephigenia.de>
 * 使用： 
 * jslint [file1] [file2]
 * find . -type file -name "*.js" | jslint 
 * cat [file1] [file2] | jslint
 */

var app = function() {

    var options = {
        evil: true,
        undef: true,
        eqeqeq: true,
        fragment: true,
        predef: [ 
           // jQuery 
           "$",
           "jQuery",
           // Douban 
           "dui",
           "Douban",
           "Do",
           // Native
           "top",
           "self",
           "parent",
           "window",
           "document",
           "navigator",
           "alert",
           "setTimeout",
           "clearTimeout",
           "setInterval",
           "clearInterval",
           "console",
           // CommonJS
           "exports",
           // YUI
           "YUI",
           "YAHOO",
           "YAHOO_config",
           "YUI_config",
           "Y",
           // NodeJS
           "GLOBAL",
           "process",
           "require",
           "__filename",
           "module" ]
         
        },
    ok = {
      "Expected an assignment or function call and instead saw an expression.": true, //允许f && f(this)
      //"Expected a conditional expression and instead saw an assignment.": true, //允许for (; el = els[i++]; ) 
      // css
      "Unexpected '-'.": true,
      "Unexpected '_'.": true,
      "Unexpected '*'.": true
    },
    JSLint = require(__dirname + '/../lib/jslint.js').JSLINT,
    fs = require('fs'),
    path = require('path'),
    stdin = process.openStdin();
    
    var main = function() {
        
        stdin.setEncoding('utf8');
        stdin.on('data', function (chunk) {
            if (!this.data) {
                this.data = '';
            }
            this.data += chunk;
        });
        stdin.on('end', function () {
            if (!this.data) {
                console.error('nothing to do.');
                process.exit(1);
            }
            // js-source piped into
            if (this.mode) {
                var errors = checkSource(this.data);
                if (errors && errors.length > 0) {
                    console.error(showErrors('SOURCE', errors));
                }
            // filename list piped into
            } else if (this.data) {
                checkFiles(this.data.split('\n').slice(0, -1));
            }
            process.exit(0);
        });

        if (process.argv.length > 2) {
            var filenames = process.argv.slice(2);
            checkFiles(filenames);
            process.exit(0);
        }
    };
    
    var checkFiles = function(filenames) {
        if (!filenames.length) {
            console.error('You don’t have specified a single file to parse', 1);
            process.exit(1);
        }
        // parse every file
        for (var i = 0; i < filenames.length; i++) {
            var filename = filenames[i];
            if (filename.substr(0, 1) != '/') {
                filename = process.cwd() + '/' + filename;
            }
            var errors = checkFile(filename);
            if (errors && errors.length > 0) {
                console.error(showErrors(filename, errors) + '\n');
            } else {
                console.log('-----------------------------------\nGood! 0 error');
                        }
        }
        return true;
    };
    
    var checkFile = function(filename) {
        try {
            var stat = fs.statSync(filename);
        } catch (e) {
            console.error('File not found: "' + filename + '"');
            return false;
        }
        if (stat.isDirectory()) {
            console.error('File is a directory: "' + filename + '"');
            return false;
        }
        var script = fs.readFileSync(filename);
        console.info('checking "' + filename + '" (' + script.length + ' characters) … ');
        return checkSource(script.toString());
    };
    
    var checkSource = function(source) {
        if (JSLint(source, options)) {
            return true;
        }
        return JSLint.errors;
    };
    
    var showErrors = function(filename, errors) {
        var output = [];
        for (var i = 0; i < errors.length; i += 1) {
            var e = errors[i];
            if (!e || ok[e.reason]) continue;
            output.push(path.basename(filename) + ' (line at ' + e.line + ', character ' + e.character + '): ' + e.reason + '\n\t' + e.evidence);
        }
        return output.join('\n') + '\n-----------------------------------\n' + output.length + ' error(s)';
    };

    main();
};

app();
