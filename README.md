## Readme

  - dependencies
  
    - `node` for server
    - `express` for website
    - `gulp-standard` for linting
    - `request` for cURLs
    - `socket.io` for website updates
    - `ejs` for website templating

  - files

    - `Procfile` runs worker on load
    - `app.js` run website
    - `clock.js` simulates a cron job
    - `worker.js` runs server operations

  - develop

  ```
  npm run test
  ```

  - deploy

  ```
  git commit -am 'update'
  git push heroku master
  ```