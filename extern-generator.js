/*
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

(function (){
  util = require('util');
  fs = require('fs');
  ContextFreeParser = require('../context-free-parser');

  // Static text
  headerTemplate = fs.readFileSync('header-snippet.txt', {encoding: 'UTF-8'});

  function headerSnippet(cls) {
    camelCaseParent = className(cls.extends);
    camelCaseClass = className(cls.name);
    return util.format(headerTemplate, cls.name, camelCaseParent, camelCaseClass);
  }

  function camelCase(name) {
    return name.split('-').map(function(name){
      return name.toLowerCase().charAt(0).toUpperCase() + name.slice(1);
    }).join("")
  }

  function className(name) {
    if (name == undefined) {
      return "PolymerElement";
    }
    return camelCase(name)+"Element";
  }

  attributeTemplate = fs.readFileSync('attribute-snippet.txt', {encoding: 'UTF-8'});
  function attributeSnippet(cls, attr) {
    return util.format(attributeTemplate,
                       commentify(attr.description),
                       attr.type,
                       className(cls.name),
                       attr.name);
  }

  function commentify(description) {
    // Splitting on newlines gives us one more than we need for nicely
    // formatted comments.
    splitlines = description.split("\n").slice(0, -1);
    return splitlines.map(function(line){
      return " * " + line
    }).join("\n");
  }

  eventTemplate = fs.readFileSync('event-snippet.txt', {encoding: 'UTF-8'});
  function eventSnippet(cls) {
    if (cls.events === undefined) {
      return ''
    }
    eventType = camelCase(cls.name)+'EventType';
    eventDefs = cls.events.map(function(evt){
      snippet = evt.description.trim().split('\n').map(function(line){
        return '  // ' + line
      }).join('\n');
      snippet += '\n  ' + evt.name.toUpperCase().replace('-', '_') + ": '" + evt.name + "'";
      return snippet;
    }).join(',\n');
    return util.format(eventTemplate, eventType, cls.name, eventType, eventDefs)
  }

  input = process.argv[2];
  externs = process.argv[3];
  events = process.argv[4];

  [input, externs, events].forEach(function(file){
    if (file == undefined) {
      console.log("usage:\nnode extern-generator.js [input] [externs_file] [event_enum_file]");
      process.exit(1);
    }
  });

  // Get input buffer
  inputText = fs.readFileSync(input, {encoding: 'UTF-8'});
  // Parse input
  classes = ContextFreeParser.parse(inputText);
  // Build output string
  outputBuffer = '';

  eventOutputBuffer = '';
  classes.forEach(function(cls){
    outputBuffer += headerSnippet(cls);
    if (cls.attributes) {
      cls.attributes.forEach(function(attr){
        outputBuffer += attributeSnippet(cls, attr);
      });
    }
    eventOutputBuffer += eventSnippet(cls)
  });

  // Write output buffer
  //console.log(outputBuffer);
  fs.writeFileSync(externs, outputBuffer);
  if (eventOutputBuffer.length > 0) {
    fs.writeFileSync(events, eventOutputBuffer);
  }
}());
