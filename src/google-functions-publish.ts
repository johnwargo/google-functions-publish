#!/usr/bin/env node

/************************************************ 
 * Google Functions Publish
 * by John M. Wargo (https://johnwargo.com)
 * Created July 9, 2024
 * https://github.com/johnwargo/google-functions-publish
 ***********************************************/

// node modules
import fs from 'fs-extra';
import path from 'path';

// Third-party modules
import chalk from 'chalk';
import boxen from 'boxen';
import { execa } from 'execa';
import prompts from 'prompts';
//@ts-ignore
import logger from 'cli-logger';
var log = logger();

// ====================================
// Types
// ====================================

enum PropertyType { Array, Boolean, Number, String }

type ConfigObject = {
  // https://dev.to/tlylt/exploring-key-string-any-in-typescript-4ake
  [key: string]: any;
  // the list of folders to deploy the functions from
  functionFolders: string[];
  flags: string[];
}

type Choice = {
  title: string;
  value: string;
}

type PromptSelection = {
  title: string;
  value: string;
}

// ====================================
// Constants and Variables
// ====================================

const APP_NAME = 'Publish Google Functions';
const APP_AUTHOR = 'by John M. Wargo (https://johnwargo.com)';
const APP_CONFIG_FILE = 'gfpub.json';

// ====================================
// Functions
// ====================================

function compareFunction(a: any, b: any) {
  if (a.property < b.property) {
    return -1;
  }
  if (a.property > b.property) {
    return 1;
  }
  return 0;
}


function buildConfigObject(): ConfigObject {
  // Returns a default configuration object
  // only used if the configuration file doesn't exist
  return {
    functionFolders: [],
    flags: []
  };
}

function readConfigFile(configFilePath: string): ConfigObject {
  try {
    return JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
  } catch (err: any) {
    log.error(`${chalk.red('Error:')} Unable to read ${configFilePath}`);
    console.dir(err);
    process.exit(1);
  }
}

function saveConfigFile(configFilePath: string, configObject: ConfigObject): boolean {
  log.info(`Writing configuration file ${configFilePath}`);
  // replace the backslashes with forward slashes
  // do this so on windows it won't have double backslashes
  let outputStr = JSON.stringify(configObject, null, 2);
  outputStr = outputStr.replace(/\\/g, '/');
  outputStr = outputStr.replaceAll('//', '/');
  var result = true;
  try {
    fs.writeFileSync(path.join('.', configFilePath), outputStr, 'utf8');
    log.info('Output file written successfully');
    log.info(`\nOpen ${chalk.yellow(configFilePath)} in an editor to modify configuration settings.`);
  } catch (err: any) {
    log.error(`${chalk.red('Error:')} Unable to write to ${APP_CONFIG_FILE}`);
    console.dir(err);
    result = false;
  }
  return result;
}

function updateConfigFile(configObject: ConfigObject, configFilePath: string): boolean {
  log.info('Updating the configuration file');
  const defaultConfig: ConfigObject = buildConfigObject();
  // Apply the default values to the configuration object
  for (var key in defaultConfig) {
    if (!configObject[key]) {
      configObject[key] = defaultConfig[key];
    }
  }
  // write the file to disk
  return saveConfigFile(configFilePath, configObject);
}

function directoryExists(filePath: string): boolean {
  if (fs.existsSync(filePath)) {
    try {
      return fs.lstatSync(filePath).isDirectory();
    } catch (err) {
      log.error(`checkDirectory error: ${err}`);
      return false;
    }
  }
  return false;
}

function isFolderArrayValid(configValue: string, folders: string[]): boolean {
  var missingFolders: string[] = folders.filter(
    folder => !directoryExists(path.join(process.cwd(), folder))
  );
  if (missingFolders.length > 0) {
    log.error(`\n${chalk.red('Error:')} Configuration property ${chalk.yellow(configValue)} contains invalid path entries (folder does not exist).`);
    var folderStr = missingFolders.length > 1 ? 'Folders' : 'Folder';
    log.error(`${folderStr}: ${missingFolders.join(', ')}`);
  }
  return missingFolders.length === 0;
}

// ====================================
// Processing Starts Here
// ====================================
console.log(chalk.green(boxen(APP_NAME, { padding: 1 })));
console.log(`${APP_AUTHOR}\n`);

// do we have command-line arguments?
const myArgs = process.argv.slice(2);
const doConfigUpdate = myArgs.includes('-u');
const debugMode = myArgs.includes('-d');

// set the logger log level
log.level(debugMode ? log.DEBUG : log.INFO);
log.debug(chalk.green('Debug mode enabled'));
log.debug(`Working directory: ${path.join(process.cwd(), path.sep)}`);

// does the config file exist?
const configFilePath = path.join(process.cwd(), APP_CONFIG_FILE);
log.info(`Configuration file: ${configFilePath}`);
if (!fs.existsSync(configFilePath)) {
  log.info(chalk.red('\nConfiguration file missing: '));
  log.info('Rather than requiring the use of a bunch of command-line arguments, this tool uses a configuration file instead.');
  log.info('In the next step, the module will automatically create the configuration file for you.');
  log.info('Once it completes, you can edit the configuration file to change the default values and execute the command again.\n');

  let response = await prompts({
    type: 'confirm',
    name: 'continue',
    message: chalk.green('Create configuration file?'),
    initial: true
  });
  if (response.continue) {
    // create the configuration file  
    let configObject: ConfigObject = buildConfigObject();
    if (debugMode) console.dir(configObject);

    // TODO: Ask the user to select the folders to deploy functions from


    // populate some default flags (this is what I use for my functions)
    configObject.flags.push('--region=us-east1');
    configObject.flags.push('--runtime=nodejs20');
    configObject.flags.push('--trigger-http');
    configObject.flags.push('--allow-unauthenticated');

    // write the file to disk
    if (saveConfigFile(configFilePath, configObject)) {
      try {
        await execa('code', [configFilePath]);
      } catch (err) {
        log.error(err);
        process.exit(1);
      }
      process.exit(0);
    }
    process.exit(1);
  } else {
    log.info('Exiting...');
    process.exit(0);
  }
}

// now start working with the config file
// Read the file, the module already validated that it exists
// otherwise we wouldn't be here
const configObject = readConfigFile(configFilePath);

// update the configuration file if requested
if (doConfigUpdate) {
  var result = updateConfigFile(configObject, configFilePath);
  if (result) process.exit(0);
  process.exit(1);
}

// is the folder array empty?
if (!isFolderArrayValid('functionFolders', configObject.functionFolders)) {
  log.error("The configuration file's functionFolders array is empty, exiting...");
  process.exit(1);
}

// is the flags array empty?
if (configObject.flags.length < 1) {
  log.error("The configuration file's flags array is empty, exiting...");
  process.exit(1);
}

for (const func of configObject.functionFolders) {
  // build a flag list from the flags array
  var flagStr = configObject.flags.join(' ');
  // execute the function deploy command passing in the flags as options to the command
  var deployCmd = `functions deploy ${func} ${flagStr}`; 
  // change to the function directory
  process.chdir(func);
  console.log('Deploying the ' + chalk.green(func) + ' function');
  // deploy the function
  await execa `gcloud ${deployCmd}`;
  // change back to the project directory
  process.chdir('..');
}