# Google Functions Publish

A node.js CLI that allows users to publish multiple Google Cloud functions (in separate folders) using a single command.

## Background

A while back, I migrated several cloud functions from Netlify to the Google Cloud platform and noticed that the Google Cloud CLI (`gcloud` command) requires that developers issue a separate deployment comment for each function deployment. 

My project had three functions and I wanted a way to deploy all three with a single command. In [Google Cloud Multiple Functions in a Project](https://johnwargo.com/posts/2024/google-cloud-multiple-functions/) I added some code to my project that allowed me to easily do this using [Google zx](https://github.com/google/zx) as an execution helper. 

In an effort to make that code easier to use across multiple project, I decided to make a node-based CLI that allows me to easily execute batch publishing across multiple Google Cloud Functions projects.

To use this module, you install it globally, then add a simple (automatically generated by the module) configuration file to the project folder. With the correct configuration in place, you can deploy all cloud functions in a project folder using a single command. 

## Installation

To install the command, open a terminal window, then execute the following command:

``` shell
npm install -g google-functions-publish
```

**Note:** You should not need to use `sudo` on linux or macOS to install the module. If you find that you need to or want to, instead go back and fix permissions for your local node.js installation and try it again.

The module adds a `gfpub` command you can use in any Google Cloud Functions project to deploy a function or group of functions in a single command - without requiring any command-line parameters.

## Usage



``` shell
┌──────────────────────────────┐
│                              │
│   Publish Google Functions   │
│                              │
└──────────────────────────────┘
by John M. Wargo (https://johnwargo.com)
Configuration path: D:\dev\node\google-functions-publish\gfpub.json

Configuration file missing:
Rather than requiring the use of a bunch of command-line arguments, this tool uses a configuration file instead.
In the next step, the module will automatically create the configuration file for you.
Once it completes, you can edit the configuration file to change the default values and execute the command again.

√ Create configuration file? ... yes
√ Use default flags? ... yes
√ Select one or more function folders to deploy: » images, node_modules, src
Writing configuration file D:\dev\node\google-functions-publish\gfpub.json
Output file written successfully

Open D:\dev\node\google-functions-publish\gfpub.json in an editor to modify configuration settings.

D:\dev\node\google-functions-publish>
```


automatically loads config file if running in vscode