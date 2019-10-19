# Contest Scoreboard
A real-time, live scoring software to replace traditional pen and paper when running a competition.

Example of **real** past results of a contest (Exile Skimboards Oktoberfest 2018) can be found at http://contest-scoreboard.herokuapp.com.

# About
This software was built using the ["MEAN" Stack](https://en.wikipedia.org/wiki/MEAN_(software_bundle)), allowing for a "bring your own device" scenario of use, allowing for low budget hardware to be used as scoreboards such as the Amazon Fire Tablet. 

The primary goal of this software was to first reduce the "human error" of manually tabulating scores for a contest. In the process of doing this we also wanted to provide a way to enhance contests with **real-time** scores and result. We thought it would be beneficial in running a more exciting, smoother contest. and aid in letting anyone (_with a little know how_) to run a contest smoothly.

> This was used as an "introductory" for the author into full-stack web development. As a result, there is a **lot** of clean up within the code and build scripts which can be done. 

## Features
The software is designed around the different personas (or users of the software) to provide a catered experience towards what the end-user wants to be able to do. These persons consist of:

### "Viewers"
  + See real-time updates for a running heat
  + Find past results of completed heats
  + Find the contest timeline and heat sheat to understand what heats are coming up next
### "Judges"
  + Easily entering scores during a heat
  + All capabilities of a "viewer"
### "Contest Directors"
  + Managing the riders, divisions, heats, rounds
  + Starting/Stopping heats
  + Auditing and Fixing "accidental" scores the different "judges"
  + Organizing the heat including
    + Start/Stopping the heat
    + Adding/Removing contestants and assigning jersey color
  + Adjusting rules and regulations of the contest (i.e. total heat count, score direction)
  + All capabilities of the software



# Usage
The software has been used for a handful of contests, ran on a local area network on the beach without internet:

- _2014_ [DB Skimboards](https://dbskimboards.com/) Dash Point Contest (_using an older Ruby-on-Rails implementation_)
- _2016_ One Dolla Skim 'Contest' on Oahu
- _2016_ - _2018_ [Exile Skimboards](https://exileskimboards.com/) Oktoberfest Contest

# Does the Software still work?
**Absolutely!** The goal was always to give this software away with the hope of being able to provide additional maintanence. Although this has not been updated with new features for some time, the software will still properly run  and aid in running a contest.

# How To / Get Started

## Installation and Running Locally
Running the software can be done by following the provide steps:

1. Install **Node.js** from https://nodejs.org.
2. Install **MongoDB** (_Community Server_) from https://www.mongodb.com/.
3. Clone or Fork the repository locally.
4. Download all required libraries via running `npm install` from within the directory that has been copied down locally.
5. Modify the `config/database.js` file to point to your MongoDB instance. By default if you are running everything on the same machine, no changes are necessary.
6. Start the software using the command `npm run start`. You can then open up the softare in your local web brower at http://localhost:8080.
> For Windows based installations, you will need to modify the `package.json` to avoid some of the command lines not available which cause errors. 
>
> Alternatively, you can also run `npm run build` followed by `node server.js`.

## Creating Initial Accounts
Once the software is up and running, with a connection to MongoDB (remote or local) you will want to populate the product with your initial contest director accounts. This can be done through the use of the `seed_users.js` script.

1. Modify the `config/seedusers.js` file to add in the desired user accounts. See the comments within the file for details of usage, but an example file to create an administrator named **Robert** with a password of **calmcorgi123**, and a judge named **Aaron** with a password of **coolcat456** may look like the following

``` javascript
// seedusers.js

// Available roles:
// - admin
// - judge
module.exports = {
  "users" : [
    {
      "username" : "robert",
      "password" : "calmcorgi123",
      "role" : "admin"
    },
    {
      "username" : "aaron",
      "password" : "coolcat456",
      "role" : "judge"
    },
  ]
};

```

2. Run the script using `npm run seedusers`.
3. Wait for a few seconds for it to run, and you should see some logs about the users being created.

> Note: The script may not automatically close so you will need to kill it once completed using `Ctrl+C` or `Ctrl+D`.

## Deploying Online
While originally designed for use in a local network, this software can be deployed and used online (see example on http://contest-scoreboard.herokuapp.com). There are a lot of guides out there to aid in this process of choosing the correct providers (or using your own), but here are some quick steps for what I have done to deploy it to heroku just to show share scores.

I used:
- Heroku - to host the Node.JS web server
- mLab - to host the Mongo database for free

### Create your accounts
1. Sign up for a [Heroku](https://www.heroku.com/) account.
2. Follow the guides for deploying a Node.js app in Heroku and start by setting up a new app for the Contest Scoreboard.

> _Guides for deploying a Node.js server_
>
> https://devcenter.heroku.com/articles/deploying-nodejs
> https://devcenter.heroku.com/articles/getting-started-with-nodejs
>
> Notice how the repository contains a `Procfile` which already has a command to start the server once installed via `web: npm run start:production`

3. Use the mLab add-on (https://elements.heroku.com/addons/mongolab) within Heroku (recommended) or alternatively sign up for a [mLab](https://mlab.com/) account.
4. Obtain the mLab connection string for your collection. They make it fairly easy to find the connection string and it should take the form of:

> To connect using the mongo shell:
>> `mongo 12345.mlab.com:11765/your_database_name -u <dbuser> -p <dbpassword>`
>
> To connect using a driver via the standard MongoDB URI (what's this?):
>> `mongodb://<dbuser>:<dbpassword>@12345.mlab.com:11765/your_database_name`

5. Modify the `config/database.js` file to match this. For example:

``` javascript
// config/database.js
module.exports = {
  // Local Copy - For use when running locally
  // 'url' : 'mongodb://localhost/your_database_name' 

  // mLab server
  'url' : 'mongodb://dbuser:dbpassword@12345.mlab.com:11765/your_database_name'
};

```
6. Generate some initial user accounts (admins) within the Contest Scoreboard mongo database provided by mLab by connecting locally and running the modified `seed_users.js` script.
7. Modify the `config/sessionSecret.js` file to provide security for the web sessions, this can be any string. An example is:

``` javascript
module.exports = {
  "secret" : "mycontestsecrete"
};
```

8. Push up the code into Heroku and watch the software come to life!

# Contributors
A special thanks for design help from **Jill Axelson**, as well as all of the people who helped me with testing along the way in my house or at the beach. Big thanks to the _Exile Skimboards family_ (particularly **Aaron Pelsuo** and **Steve Taylor**) with providing the trust in me along the way and helping further shape the direction of the software.
