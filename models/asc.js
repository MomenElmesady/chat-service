const User = require("./user.model")
const Status = require("./status.model")
const Contact = require("./contact.model")
const StatusView = require("./statusViews.model")
const StatusReact = require("./statusReacts.model")
const Message = require("./message.model")
const Chat = require("./chat.model")
const UserChat = require("./chat.model")
const Reaction = require("./reaction.model")
const MessageHistory = require(".//messageHistory.model")
const MessageReact = require("./messageReact.model")

// User & Status (One-to-Many)
User.hasMany(Status, { foreignKey: 'user_id', as: "statuses" }); // A user can have multiple statuses
Status.belongsTo(User, { foreignKey: "user_id", as: "user" }); // A status belongs to a user

// Status Views (One-to-Many)
User.hasMany(StatusView, { foreignKey: 'user_id', as: "statusViews" }); // A user can have multiple status views
StatusView.belongsTo(User, { foreignKey: "user_id", as: "user" }); // A status view belongs to a user

Status.hasMany(StatusView, { foreignKey: 'status_id', as: "views" }); // A status can have multiple views
StatusView.belongsTo(Status, { foreignKey: "status_id", as: "status" }); // A status view belongs to a status

// Status Reacts (One-to-Many)
User.hasMany(StatusReact, { foreignKey: 'user_id', as: "statusReacts" }); // A user can have multiple reactions
StatusReact.belongsTo(User, { foreignKey: "user_id", as: "user" }); // A reaction belongs to a user

Status.hasMany(StatusReact, { foreignKey: 'status_id', as: "reacts" }); // A status can have multiple reactions
StatusReact.belongsTo(Status, { foreignKey: "status_id", as: "status" }); // A reaction belongs to a status


User.belongsToMany(User, { through: Contact, as: "contacts", foreignKey: "user_id", otherKey: "contact_id" });


// Message
Message.belongsTo(User, {foreignKey: 'user_id', as: 'user'})
User.hasMany(Message, {foreignKey: 'user_id', as: 'messages'})

Message.belongsTo(Chat, {foreignKey: 'chat_id', as: 'chat'})
Chat.hasMany(Message, {foreignKey: 'chat_id', as: 'messages'})

Message.belongsTo(Status, {foreignKey: 'statusId', as: 'statuss'})
Status.hasMany(Message, {foreignKey: 'statusId', as: 'messages'})

// Self-reference association
Message.hasMany(Message, {
  foreignKey: "parent_id",
  as: "replies", // all messages replying to this message
});

Message.belongsTo(Message, {
  foreignKey: "parent_id",
  as: "parent", // the message this one replies to
});

// Chat 
Chat.belongsTo(User,{foreignKey: "admin_id", as: "admin"})
User.hasMany(Chat,{foreignKey: "admin_id", as: "user_admin_chats"})

Message.hasMany(MessageHistory, {foreignKey: 'message_id', as: 'history'})
MessageHistory.belongsTo(Message, {foreignKey: 'message_id', as: 'message'})

User.hasMany(MessageHistory, {foreignKey: 'user_id', as: 'history'})
MessageHistory.belongsTo(User, {foreignKey: 'user_id', as: 'user'})

Message.hasMany(MessageReact, {foreignKey: 'message_id', as: 'reacts'})
MessageReact.belongsTo(Message, {foreignKey: 'message_id', as: 'message'})

User.hasMany(MessageReact, {foreignKey: 'user_id', as: 'reacts'})
MessageReact.belongsTo(User, {foreignKey: 'user_id', as: 'user'})

Chat.belongsToMany(User, {
  through: UserChat,
  foreignKey: "chat_id",
  otherKey: "user_id",
  as: "users",
});
User.belongsToMany(Chat, {
  through: UserChat,
  foreignKey: "user_id",
  otherKey: "chat_id",
  as: "chats",
});

// reactions 
Message.hasMany(Reaction, { foreignKey: "message_id", as: "reactions" });
Reaction.belongsTo(Message, { foreignKey: "message_id" });

User.hasMany(Reaction, { foreignKey: "user_id", as: "reactions" });
Reaction.belongsTo(User, { foreignKey: "user_id" });



