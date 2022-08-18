const { Appsignal } = require("@appsignal/nodejs");
const Queue = require("bull");

const axios = require("axios").default;

const appsignal = new Appsignal({
  active: true,
  name: "bull",
  logLevel: "trace",
  logPath: "logs",
});

const tracer = appsignal.tracer();

// 1. Initiating the Queue
const getUsersQueue = new Queue("getUsers", {
  redis: {
    host: "127.0.0.1",
    port: 6379,
  },
});

const data = {
  url: "https://reqres.in/api/users",
};

const options = {
  delay: 60000,
  attempts: 2,
};

tracer.withSpan(
  tracer.createSpan({ namespace: "background" }),
  async (span) => {
    span.setCategory("perform.bull");
    span.setName("getUsersQueue");
    try {
      // 2. Adding a Job to the Queue
      getUsersQueue.add(data, options);

      tracer.withSpan(span.child(), async (child) => {
        child.setCategory("getUsers");

        // Processing the job
        getUsersQueue.process(async (job) => {
          await getUsers();
        });
        child.close();
      });
    } catch (e) {
      span.setError(e);
      // Rethrow error so bull's retry logic (if any) gets run
      throw e;
    } finally {
      // Close the root span at the end of the job regardless if an error occurred
      span.close();
    }
  }
);

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
