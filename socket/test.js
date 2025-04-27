const { publishNotification } = require("../helpers/pushNotification")

publishNotification({
  userId: 123,
  message: 'Hello from RabbitMQ!',
});
