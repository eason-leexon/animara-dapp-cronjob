require("dotenv").config();
const express = require('express');
const { task, task2 } = require("./src/utils/cronjob");

const app = express();
const port = 3333;

app.get('/', (req, res) => {
    res.send('Server is running')
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

// Start cron job task
task.start();
task2.start();

