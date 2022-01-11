const express = require('express');
const router  = express.Router();

module.exports = (db) => {

  let receiver;
  router.get("/", (req, res) => {
    db.query(`SELECT * FROM messages;`)
      .then(data => {
        const users = data.rows;
        res.json({ users });
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  router.get("/:user_id/:product_id", (req, res) => {
    db.query(`SELECT sender_id, receiver_id, message
    FROM messages
    JOIN users ON messages.sender_id = users.id
    JOIN products ON messages.product_id = products.id
    WHERE sender_id = $1 OR receiver_id = $1 AND products.id = $2
    ORDER BY time DESC
    ;`,[req.params.user_id, req.params.product_id])
      .then(data => {
        if (data.rows[0].sender_id === req.params.user_id) {
          receiver = data.rows[0].receiver_id;
        } else
        {
          receiver = data.rows[0].sender_id;
        }
        const conversation = data.rows;
        // res.json({ conversation });
        res.render("conversation", {conversation});
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });

  router.post("/:user_id/:product_id", (req, res) => {
    const message = req.body.message;
    const receiver_id = receiver;
    const messageValues = [req.params.user_id, receiver_id, req.params.product_id, message];
    console.log('POST a message:');
    console.log(messageValues);

    db.query(`INSERT INTO messages (sender_id, receiver_id, product_id, message)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
    `, messageValues)
      .then(data => {
        res.redirect(`../${req.params.user_id}/${req.params.product_id}`);
      })
      .catch(err => {
        res
          .status(500)
          .json({ error: err.message });
      });
  });



  return router;
};


// const postTime = Date.now();