const jwt = require('jsonwebtoken');
const db = require('../models/database');

function notification(io) {
    const users = [];
    io.use(function(socket, next){
        const token = socket.handshake.auth.token;
        if (token){
          jwt.verify(token, 'ninja', function(err, user) {
            if (err) return;
            socket.user = user;
            next();
          });
        }   
      }).on('connection', function(socket) {
          users.push({ userId: socket.user.id, socketId: socket.id });

          socket.on('NEWNOTI', function(notiId) {
            if(!isNaN(notiId)) {
                db.Notification.fetchById(notiId).then(rows => {
                    users.forEach(user => {
                        if(user.userId == rows[0].userId) {
                            io.to(user.socketId).emit('NOTI', rows);
                        }
                    });
                }).catch(() => {});
            }
          });
      });
}


module.exports = notification;


