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

## Release Notes

### 0.1.0
First proof of concept version which only features simple automation

### 0.1.1
Fixed small config path bug where it couldnt find the file if you didnt provide a trailing backslash

### 0.1.2
Fixed regex match. Now matches the exact filenames

### 0.1.3
Removed debug stuff - oops

### 0.1.4
Minor fix

-----------------------------------------------------------------------------------------------------------

**Enjoy!**
