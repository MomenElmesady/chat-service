const amqp = require('amqplib');

async function publishNotification(messageObj, retries = 5, delay = 5000) {
  let connection;

  const rabbitHost = process.env.RABBITMQ_HOST || 'rabbitmq';
  const url = `amqp://${rabbitHost}:5672`;
  const queue = 'notification.new_message';

  while (retries > 0) {
    try {
      console.log(`📤 Trying to connect to RabbitMQ at ${url}`);
      connection = await amqp.connect(url);
      const channel = await connection.createChannel();

      await channel.assertQueue(queue, { durable: true });

      channel.sendToQueue(queue, Buffer.from(JSON.stringify(messageObj)), {
        persistent: true,
      });

      console.log('✅ Message sent to notification queue');

      await channel.close();
      break; // ✅ Done successfully, break out of retry loop
    } catch (err) {
      retries--;
      console.error(`❌ Failed to send message. Retries left: ${retries}`);
      console.error(err.message);

      if (retries === 0) {
        console.error("🚫 Could not publish message after multiple attempts");
        break;
      }

      await new Promise(res => setTimeout(res, delay));
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error("⚠️ Error closing RabbitMQ connection:", e.message);
        }
      }
    }
  }
}

module.exports = { publishNotification };
