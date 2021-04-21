const messages = [];

const addMessage = ({ message }) => {
  messages.push(message);
  return { message };
};

const getHistory = () => messages.slice(-process.env.HISTORY);

module.exports = { addMessage, getHistory };
