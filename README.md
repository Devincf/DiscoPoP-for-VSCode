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
* `discopopvsc.loopCounter`: Determines whether loop heatmaps will be shown
* `discopopvsc.autoPipeline`: Run the entire pipeline after selecting files
* `discopopvsc.autoFilemapping`: Automatically execute the Filemapping task in the background
* `discopopvsc.allFiles`: List all files in the file selection


## Known Issues

- Compiler warnings sometimes get written to stderr which makes the extension think discopop failed.
- Checkboxes reset every time you click on a different tab
- When running the analysis and pattern identification on multiple files, the pattern identification sometimes fails and creates wrong highlights.
- If VSCode is installed via a FlatPak the extension will not work correctly, since Flatpak has its own virtual environment with its own version of clang. However DiscoPoP required a very specific version of clang8

## Release Notes

### 1.0.0
- to be added

### 0.4.0
- Added automatic file mapping
- Added Pattern Identification
- Added first version of text highlighting
- Added first version of simple pragma insertion
- Fixed multiple small bugs

### 0.3.0
- Changed build/scripts folder setting to build/scripts path
- Analyzers now move all discopop temporary files to a subfolder called discopop-tmp

### 0.2.0
- Added DiscoPoP view on the left to manage the tasks
- Made it possible to run multiple tasks at once
- Made it possible to select which files you wish to run the task on
### 0.1.5
- Decreased minimum VS Code version to 1.50.0
- Added "DiscoPoP: " as a prefix to all commands

### 0.1.2
- Regex now matches the exact filenames

### 0.1.1
- Config path now finds the files corrrectly

### 0.1.0
- First proof of concept version which only features simple automation

-----------------------------------------------------------------------------------------------------------

**Enjoy!**
