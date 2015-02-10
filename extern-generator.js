/*
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

var argv = require('optimist')
    .alias('webcomponent', 'w')
    .alias('externs', 'x')
    .alias('events', 'e')
    .string(['w', 'x', 'e'])
    .demand(['w', 'x', 'e'])
    .usage('$0 -w [input] -x [externs_file] -e [event_enum_file]')
    .argv;

var input, externs, events;

input = argv.w;
externs = argv.x;
events = argv.e;

process.stderr.write(input + '\n');
process.stderr.write(externs + '\n');
process.stderr.write(events + '\n');

(function() {
  util = require('util');
  fs = require('fs');
  ContextFreeParser = require('context-free-parser');

  function readSnippet(snippetName) {
    return fs.readFileSync(__dirname + '/' + snippetName, 'UTF-8');
  }
  // Static text
  headerTemplate = readSnippet('header-snippet.txt');

  function headerSnippet(cls) {
    // Transitional fix for Polymer 0.5.4
    // Polymer 0.5.4's context-free-parser modifies the extends field to an
    // array of objects from a simple string.
    // TODO(robliao): Remove the cls.extends portion once the upgrade is
    //     complete.
    camelCaseParent = className(
        Array.isArray(cls.extends) ? cls.extends[0].name : cls.extends);
    camelCaseClass = className(cls.name);
    return util.format(headerTemplate,
                       cls.name,
                       camelCaseParent,
                       camelCaseClass);
  }

  function camelCase(name) {
    return name.split('-').map(function(name) {
      return name.toLowerCase().charAt(0).toUpperCase() + name.slice(1);
    }).join('');
  }

  function className(name) {
    if (name == undefined) {
      return 'PolymerElement';
    }
    return camelCase(name) + 'Element';
  }

  attributeTemplate = readSnippet('attribute-snippet.txt');
  function attributeSnippet(cls, attr) {
    return util.format(attributeTemplate,
                       commentify(attr.description),
                       attr.type,
                       className(cls.name),
                       attr.name);
  }

  function methodSnippet(cls, meth) {
    return util.format(attributeTemplate,
                       commentify(meth.description),
                       'function()',
                       className(cls.name),
                       meth.name);
  }

  function commentify(description) {
    // Splitting on newlines gives us one more than we need for nicely
    // formatted comments.
    splitlines = description.split('\n').slice(0, -1);
    return splitlines.map(function(line) {
      return ' * ' + line;
    }).join('\n');
  }

  eventTemplate = readSnippet('event-snippet.txt');
  function eventSnippet(cls) {
    if (cls.events === undefined) {
      return '';
    }
    eventType = camelCase(cls.name) + 'EventType';
    eventDefs = cls.events.map(function(evt) {
      snippet = evt.description.trim().split('\n').map(function(line) {
        return '  // ' + line;
      }).join('\n');
      snippet += '\n  ' + evt.name.toUpperCase().replace(/-/g, '_') + ": '" +
          evt.name + "'";
      return snippet;
    }).join(',\n');
    return util.format(
        eventTemplate, eventType, cls.name, eventType, eventDefs);
  }

  // Get input buffer
  inputText = fs.readFileSync(input, 'UTF-8');
  // Parse input
  classes = ContextFreeParser.parse(inputText);
  // Build output string
  outputBuffer = '';

  eventOutputBuffer = '';
  classes.forEach(function(cls) {
    if (cls.name.toLowerCase() !== 'entity') {
      outputBuffer += headerSnippet(cls);
      if (cls.attributes) {
        cls.attributes.forEach(function(attr) {
          outputBuffer += attributeSnippet(cls, attr);
        });
      }
      if (cls.methods) {
        cls.methods.forEach(function(meth) {
          outputBuffer += methodSnippet(cls, meth);
        });
      }
      eventOutputBuffer += eventSnippet(cls);
    }
  });

  // Write output buffer
  fs.writeFileSync(externs, outputBuffer);
  fs.writeFileSync(events, eventOutputBuffer);
}());
