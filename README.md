# discopopvsc README

This VSCode Extension integrates the DiscoPoP features into Visual Studio Code

## Features

Automatically create file mappings.

Automatically do CU Generation, Dependence profiling and Identifation of reduction operations

## Requirements

You have a working DiscoPoP build 

## Extension Settings

This extension contributes the following settings:

* `discopopvsc.path`: Specifies the path to the discopop folder
* `discopopvsc.build_folder`: specifies the name of the build folder inside the discopop folder
* `discopopvsc.scripts_folder`: specifies the name of the scripts folder inside the discopop folder
* `discopopvsc.clang`: specifies the name of the clang++ executable

## Known Issues

- Compiler warnings sometimes get written to stderr which makes the extension think discopop failed.
- Checkboxes reset every time you click on a different tab
- Tasks fill up folder with 'clutter'. Will get moved to a seperate folder soon
- Build/Script path cannot be outside of the discopop folder

## Release Notes

### 0.1.0
- First proof of concept version which only features simple automation

### 0.1.1
- Config path now finds the files corrrectly

### 0.1.2
- Regex now matches the exact filenames

### 0.1.5
- Decreased minimum VS Code version to 1.50.0
- Added "DiscoPoP: " as a prefix to all commands

### 0.2.0
- Added DiscoPoP view on the left to manage the tasks
- Made it possible to run multiple tasks at once
- Made it possible to select which files you wish to run the task on

-----------------------------------------------------------------------------------------------------------

**Enjoy!**
