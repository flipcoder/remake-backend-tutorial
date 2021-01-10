const jsonfile = require("jsonfile");
const path = require("upath")
const statsFile = path.join(__dirname, "data/database/stats.json");
const fs = require("fs")
const hbs = require("handlebars");
const util = require("util");
const readFileAsync = util.promisify(fs.readFile)
const readJsonAsync = util.promisify(jsonfile.readFile)

const incrementUserActivity = ({ name, email }) => {
  if(name == null || email == null)
    return;

  // open or create a stats.json file if it doesn't exist
  let stats = {};
  try {
    stats = jsonfile.readFileSync(statsFile);
  } catch (err) {
    if(err instanceof Error && err.code == 'ENOENT') {
      // file not found? create it!
      jsonfile.writeFileSync(statsFile, {});
    } else {
      // unknown error, rethrow
      throw err;
    }
  }
  
  // create user activity entry in stats.json if it doesn't exist
  if(stats.userActivity === undefined) {
    stats.userActivity = {};
  }
  
  if(stats.userActivity[email] === undefined) {
    stats.userActivity[email] = {};
  }
  
  if(stats.userActivity[email].activity === undefined) {
    stats.userActivity[email].activity = 0;
  }
  stats.userActivity[email].activity += 1;
  stats.userActivity[email].lastUseTimestamp = stats.lastUseTimestamp =  Date.now();
  stats.lastUser = email;

  jsonfile.writeFileSync(statsFile, stats);
};

const onNew = ({app, user, data}) => {
  if(user == null || data == null)
    return;
  console.log("initApiNew callback data:",
    "\nUser:", user.email,
    "\nData:", data
  );
  incrementUserActivity(user);
};

const onSave = ({app, user, data}) => {
  if(user == null || data == null)
    return;
  console.log("initApiSave callback data:",
    "\nUser:", user.email,
    "\nOld Data:", data.oldData,
    "\nNew Data:", data.newData
  );
  incrementUserActivity(user);
};

const init = ({app}) => {
  // Create the route for our page at /stats
  app.get("/stats", (req, res) => {
    res.set('Content-Type', 'text/plain'); // plain text page
    if(req.isAuthenticated() && req.user.details.username === "flipcoder"){
      res.write("Stats\n\n");
      let stats = {};
      try {
        stats = jsonfile.readFileSync(statsFile);
      } catch (err) {
        // ignore file not found, otherwise throw
        if(!(err instanceof Error) || err.code !== "ENOENT")
          throw err;
      }
      if(stats == null || stats.userActivity == null) {
        res.write("No stats recorded.");
        res.end();
        return;
      }
      let mostActiveUser = null;
      let totalActivity = 0;
      let mostActivity = 0;
      if(stats.userActivity != null) {
        for(var email in stats.userActivity) {
          let user = stats.userActivity[email];
          if(user.activity != null) {
            if(user.activity > mostActivity) {
              mostActivity = user.activity;
              mostActiveUser = email;
            }
            totalActivity += user.activity;
          }
        }
      }
      if(totalActivity !== null)
        res.write("Total Activity: " + totalActivity + "\n");
      if(stats.lastUseTimestamp != null && stats.lastUser != null)
        res.write("Last Activity: " + (new Date(stats.lastUseTimestamp)).toString() + " by " + stats.lastUser  + "\n");
      if(mostActiveUser !== null) 
        res.write("Most Active User: " + mostActiveUser + " (" + mostActivity + ")\n");
      res.end();
    }else{
      res.status(403); // not authorized
      res.end();
    }
  });
};

const run = ({app}) => {
  console.log("Custom backend running...");
};

export { init, onNew, onSave, run };
