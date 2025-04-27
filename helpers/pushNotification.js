const amqp = require('amqplib');

async function publishNotification(messageObj) {
  let connection;
  try {
    connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();
    const queue = 'notification.new_message';

    await channel.assertQueue(queue, { durable: true });

    channel.sendToQueue(queue, Buffer.from(JSON.stringify(messageObj)), {
      persistent: true,
    });

    console.log('Message sent to notification queue');
    await channel.close();
  } catch (err) {
    console.error('Failed to send message', err);
  } finally {
    if (connection) await connection.close();
  }
}

module.exports = {publishNotification}

// from where should i start rabbitMQ or the notification service 
// how to secure communication between chat and notification services 