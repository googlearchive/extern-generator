#!/bin/bash

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