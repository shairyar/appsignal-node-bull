const Queue = require('bull');

const axios = require("axios").default;

// 1. Initiating the Queue
const getUsersQueue = new Queue('getUsers', {
  redis: {
    host: '127.0.0.1',
    port: 6379
  }
});
const data = {
  url: "https://reqres.in/api/users"
};

const options = {
  delay: 5000, // 1 min in ms
  attempts: 2
};
// 2. Adding a Job to the Queue
getUsersQueue.add(data, options);

getUsersQueue.process(async job => { 
  return await getUsers(); 
});
function getUsers() {
  return new Promise((resolve, reject) => {
    axios
      .get(data.url)
      .then(function (response) {
        // handle success
        console.log(response.data.data);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
      .then(function () {
        // always executed
      });
  });
}
