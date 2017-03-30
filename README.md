## Readme

  - dependencies
  
    - `node` server dependencies
    - `bower` website dependencies
    - `express` website
    - `gulp-standard` js linting
    - `request` server cURLs
    - `socket.io` server to website updates
    - `helmet` xss security

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
      

  - develop

  ```bash
  npm start
  ```

  - deploy

  ```bash
  git commit -am 'update'
  git push heroku master
  ```
    
  - todo

    - push to git
    - move credentials to config.json
    - https://uptimerobot.com
