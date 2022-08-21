# Minecraft Terminal

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal.

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/5d815c7321aa468fa37b3f3509757b6c)](https://www.codacy.com/gh/MC-Terminal/Minecraft-Terminal/dashboard?utm_source=github.com&utm_medium=referral&utm_content=MC-Terminal/Minecraft-Terminal&utm_campaign=Badge_Grade)

This README is a work in progress:

- [X] [Downloads](#downloads)
- [ ] [Usage](#usage)
  - [X] [Command-line usage](#command-line-usage)
  - [ ] Internal commands
  - [ ] Hotkeys
  - [ ] Remote control (RCON)
  - [ ] Configuration
    - [ ] Credentials
    - [ ] Configuration
    - [ ] Physics

## Downloads

### Install with npm

```
$ npm i --location=global npm i --location=global git@github.com:MC-Terminal/Minecraft-Terminal.git
$ mc-term
```

Alternatively you can clone the gir repo.

### Clone git repo

```
$ git clone https://github.com/678435021/Minecraft-Terminal.git
$ cd Minecraft-Terminal
$ npm install
$ node .
```

## Usage

### Command-line usage

```
Usage:
   --no-conf, -nc           Do not use the configuration file.
   --no-cred, -ns           Do not use the credentials file.
   --set-conf-path, -scp    Set the config folder path
   --get-conf-path, -gcp    Get the config folder path
   --gen-conf, -gc         Generate configuration files
   --cred, -c               <Auth> <Username> <Password> <Version> <Server>
                            Override credentials from CLI arguments.
   --help, -h               Show this help message.
   --version, -v            Show version information.
```

You can use '!' in --cred to leave it empty.

#### Examples and further explanations:

Use the the default settings overriding the username:

```
$ node . --c ! Player456 ! ! !
```

\- '!' will use the login options specified in cred.json if no options are set it will use defaults

Do not use the credentials file cred.json:

```
$ node .  --no-cred
```

Do not use the configuration file config.json:

```
$ node . --no-conf
```

Set the configuration files path and exit:

```
$ node . --set-conf-path /home/user/.config/mc-term
```

Print the configuration files location and exit:

```
$ node . --get-conf-path
[INFO] Configuration files are located in: /home/user/.config/mc-term
```

Generate default configuration files in the specified location:

```
$ node . --gen-conf /path/to/folder
```

### Internal commands

For now you can get basic, incomplete help by typing `.help` in chat.

### Hotkeys

Most emacs hotkeys
