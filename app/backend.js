import { initApiNew } from "../_remake/lib/init-api-new";
import { initApiSave } from "../_remake/lib/init-api-save";
import { initApiUpload } from "../_remake/lib/init-api-upload";
import { initRenderedRoutes } from "../_remake/lib/init-rendered-routes";
import { initUserAccounts } from "../_remake/lib/init-user-accounts";
const jsonfile = require("jsonfile");
//const util = require("util")
//const readJsonFileAsync = util.promisify(jsonfile.readFile);
const path = require("upath")
const statsFile = path.join(__dirname, "data/stats.json");

const incrementUserActivity = (username) => {
  let stats = jsonfile.readFileSync(statsFile);
  
  // create user activity entry in stats.json if it doesn't exist
  if(stats.userActivity === undefined) {
    stats.userActivity = {};
  }
  
  if(stats.userActivity[username] === undefined) {
    stats.userActivity[username] = {};
  }
  
  if(stats.userActivity[username].activity === undefined) {
    stats.userActivity[username].activity = 0;
  }
  stats.userActivity[username].activity += 1;
  stats.userActivity[username].lastUseTimestamp = Date.now();
  
  jsonfile.writeFileSync(statsFile, stats);
};

const initBackend = ({app}) => {
  initApiNew({ app }, async (data) => {
    console.log("initApiNew callback data: ", data);
    incrementUserActivity(data.username);
  });
  initApiSave({ app }, async (data) => {
    console.log("initApiSave callback data:",
      "\nUser:", data.username,
      "\nOld Data:", data.oldData,
      "\nNew Data:", data.newData
    );
    incrementUserActivity(data.username);
  });
  initApiUpload({ app });

  // Create the route for our page at /stats
  app.get("/stats", async (req, res) => {
    res.write("Stats:");
    const stats = jsonfile.readFileSync(statsFile);
    console.log(stats);
    res.write(JSON.stringify(stats, null, 2));
    res.end();
  });
};

const runBackend = async ({app}) => {
  console.log("Custom backend running...");
};

export { initBackend, runBackend };
