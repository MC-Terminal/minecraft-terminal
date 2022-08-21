# Minecraft Terminal

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/4a08ba06355f4ba9a2235ec0f114807b)](https://app.codacy.com/gh/MC-Terminal/Minecraft-Terminal?utm_source=github.com&utm_medium=referral&utm_content=MC-Terminal/Minecraft-Terminal&utm_campaign=Badge_Grade_Settings)

Minecraft Terminal is a lightweight CLI app that allows you to play minecraft in the terminal.

This README is a work in progress:

- [X] Downloads
- [ ] Usage
  - [X] Command-line usage
  - [ ] Internal commands
  - [ ] Hotkeys
  - [ ] Remote control (RCON)
  - [ ] Configuration
    - [ ] Credentials
    - [ ] Configuration
    - [ ] Physics

## Downloads

### Clone git repo

```
$ git clone https://github.com/678435021/Minecraft-Terminal.git
$ cd Minecraft-Terminal
$ npm install
$ node .
```

### Install with npm

```
$ npm i https://github.com/678435021/Minecraft-Terminal.git
$ mc-term
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
$ node . --set-conf-path /home/.config/mc-term
```

Print the configuration files location and exit:

```
$ node . --get-conf-path
[INFO] Configuration files are located in: /home/.config/mc-term
```

Generate default configuration files in the specified location:

```
$ node . --gen-conf /path/to/folder
```

### Internal commands

For now you can get basic help by typing `.help` in chat.
