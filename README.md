
# md-macros

![Node.js CI](https://github.com/lzilioli/md-macros/workflows/Node.js%20CI/badge.svg?branch=master)

# Overview

There have been lots of requests and proposals over the years for an official spec
for a slightly more rich and extensible version of markdown.

* https://stackoverflow.com/questions/24580042/github-markdown-are-macros-and-variables-possible
* https://github.com/howardroark/Markdown-Macros

To John Gruber's (the creator of Markdown) credit, he designed Markdown to be lightweight
and he has largely stuck to his original spec, so it is unlikely we will ever see an
overhaul to the markdown specification that would bring features like macros or
more rich rendering capabilities to the markdown language itself.

Luckily, markdown is just text at some stage of a rendering pipeline. Thus, it is easy to
pre or post process any markdown text without interfering with the resulting markdown in
unintended ways.
