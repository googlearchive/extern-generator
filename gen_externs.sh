#!/bin/bash

# Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
# This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE
# The complete set of authors may be found at http://polymer.github.io/AUTHORS
# The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS
# Code distributed by Google as part of the polymer project is also
# subject to an additional IP rights grant found at http://polymer.github.io/PATENTS

while read module
do
  echo "Externs for ${module}"
  modpath="../${module}/${module}.html"
  externs_dir="../${module}/externs"
  externs="${externs_dir}/${module}.externs.js"
  events="${externs_dir}/eventtype.js"

  mkdir -p ${externs_dir}
  node extern-generator.js ${modpath} ${externs} ${events}

done<extern-modules
