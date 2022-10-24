const express = require("express");
const cors = require("cors");
const fileupload = require("express-fileupload");
const bodyParser = require('body-parser');
const socket = require("socket.io");
const notification = require("./notification");

class Server {
  constructor() {
    this.app = express();
    this.port = 4000;
    this.paths = {
      auth: "/auth",
      main: "/main",
      watch: "/watch",
      search: "/search",
      channel: "/channel"
    };

    this.middlewares();
    this.routes();
  }

  middlewares() {
    this.app.use(cors());
    this.app.use(fileupload({
      limits: { fileSize: 1000000*10 }, // 10mb
      abortOnLimit: true
    }));
    this.app.use(express.json());
    require('../middleware/passport');

    this.app.use('*/video_thumbnails',express.static('public/video_thumbnails'));
    this.app.use('*/user_thumbnails',express.static('public/user_thumbnails'));
    this.app.use('*/videos',express.static('public/videos'));

    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));

    // delay for testing - TODO: Remove it
    /*
    this.app.use(function(req,res,next){
      setTimeout(next, 500);
    });
    */
  }

  // Bind controllers to routes
  routes() {
    this.app.use(this.paths.auth, require("../routes/auth"));
    this.app.use(this.paths.main, require("../routes/main"));
    this.app.use(this.paths.watch, require("../routes/watch"));
    this.app.use(this.paths.search, require("../routes/search"));
    this.app.use(this.paths.channel, require("../routes/channel"));
  }

  listen() {
    this.server = this.app.listen(this.port);
    const socket_listen = socket(this.server,{ cors: { origin: '*' } });
    notification(socket_listen);
  }

}

module.exports = Server;
