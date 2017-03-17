## Readme

  - dependencies
  
    - `node` server dependencies
    - `bower` website dependencies
    - `express` website
    - `gulp-standard` js linting
    - `request` server cURLs
    - `socket.io` server to website updates
    - `ejs` website templating

  - files

    - `Procfile` runs worker on load
    - `app.js` run website
    - `clock.js` simulates a cron job
    - `worker.js` runs server operations

  - develop

  ```bash
  npm start
  ```

  - deploy

  ```bash
  git commit -am 'update'
  git push heroku master
  ```
    