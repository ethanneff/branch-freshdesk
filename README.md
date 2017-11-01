## TODO

[![Greenkeeper badge](https://badges.greenkeeper.io/ethanneff/branch-freshdesk.svg)](https://greenkeeper.io/)

- schedule
- test multiple arguments
- push production
- change freshdesk pass
- push to github

## Readme

- #### dependencies
  
    - `node` server dependencies
    - `bower` website dependencies
    - `express` website
    - `gulp-standard` js linting
    - `request` server cURLs
    - `socket.io` server to website updates
    - `helmet` xss security
    - `jsonwebtoken` authentication
    - `body-parser` json post requests

  - files

    - `Procfile` runs worker on load
    - `package.json` server dependencies and scripts
    - `bower.json` website dependencies
    - `gulpfile.js` task manager
    - client
      + `index.html` client website
      + `app.js` client
      + `style.css` formatting
    - server
      + `app.js` server
      + `clock.js` simulates a cron job
      + `worker.js` runs server operations

- #### develop

  ```bash
  npm start
  ```

- #### deploy

  ```bash
  git commit -am 'update'
  git push heroku master
  ```
    
 - #### eneff.io
    
    - dependencies

    ```sh
    curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
    sudo apt-get install -y nodejs
    sudo apt-get install -y build-essential
    npm install -g yarn
    ```

    - update 
    ```sh
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.gitignore' --exclude '.DS_Store' /Users/eneff/drive/active/branch/env/web/branch-freshdesk root@eneff.io:/var/www/html/apps/
    ssh root@104.131.89.254
    cd /var/www/html/apps/branch-freshdesk
    yarn install
    ```


