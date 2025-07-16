const admin = require('firebase-admin');
const amqp = require('amqplib');
const axios = require('axios');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(), // use service account credentials here
});

// Queue for RabbitMQ
const queue = 'notification.new_message'; // Queue name

// Function to send FCM notification
async function sendPushNotification(token, message) {
  try {
    const messagePayload = {
      notification: {
        title: 'New Message',
        body: message.content,
      },
      data: {
        messageId: message.messageId,
        senderId: message.senderId,
      },
      token: token,
    };

    // Send notification via FCM
    const response = await admin.messaging().send(messagePayload);
    console.log('Successfully sent message:', response);
    return response;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

// RabbitMQ consumer to listen for new message notifications
async function listenForNewMessages() {
const rabbitHost = process.env.RABBITMQ_HOST || 'rabbitmq';
const connection = await amqp.connect(`amqp://${rabbitHost}:5672`);  const channel = await connection.createChannel();

  await channel.assertQueue(queue, { durable: true });

  console.log(`Waiting for messages in ${queue}. To exit press CTRL+C`);
  channel.consume(queue, async (msg) => {
    const messageData = JSON.parse(msg.content.toString());
    console.log('Received message:', messageData);

    // Call function to send push notification to the user
    try {
      const token = await getUserFCMToken(messageData.receiverId); // Fetch receiver's FCM token
      if (token) {
        const response = await sendPushNotification(token, messageData);
        
        // After successful notification delivery, update status
        await updateMessageStatus(messageData.messageId, 'delivered');
      }
    } catch (error) {
      console.error('Error sending notification or updating message status:', error);
    }

    channel.ack(msg);
  });
}

// Function to fetch the receiver's FCM token (you can implement this to query your database)
async function getUserFCMToken(userId) {
  // Replace this with the actual logic to fetch FCM token from DB
  return 'user-fcm-token';
}

// Function to update message status in the DB (this can be MongoDB, SQL, etc.)
async function updateMessageStatus(messageId, status) {
  // You can implement your database update logic here
  console.log(`Updating message ${messageId} status to ${status}`);
  // For example:
  // await db.collection('messages').updateOne({ id: messageId }, { $set: { status } });
}

// Start the notification service
listenForNewMessages().catch(console.error);

