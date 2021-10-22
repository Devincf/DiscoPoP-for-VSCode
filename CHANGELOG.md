# Change Log

All notable changes to the "discopopvsc" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

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

### 0.1.5
- Decreased minimum VS Code version to 1.50.0
- Added "DiscoPoP: " as a prefix to all commands

### 0.2.0
- Added DiscoPoP view on the left to manage the tasks
- Made it possible to run multiple tasks at once
- Made it possible to select which files you wish to run the task on


### 0.3.0
- scripts/build path can now be seperate
- source folder doesn't get cluttered with temp files anymore

### 0.4.0
- filemapping task now runs every 5s in the background
- Added the ability to run the pattern identification task
- Added potential parallelism text highlighting, for all file that previously had the pattern identification task executed
- Added auto code insertion for all potential parallelism highlights.
- Fixed a bug where you could only run tasks on 1 file
- Fixed a bug where the extension would sometimes not load properly