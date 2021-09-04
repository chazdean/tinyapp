const getUserByEmail = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user];
    }
  }
  return null;
};

const generateRandomString = () => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz123456789";
  let randomString = "";
  let i = 0;
  while (i < 6) {
    randomString += alphabet[Math.floor(Math.random() * alphabet.length)];
    i++;
  }
  return randomString;
};

const getUrlsForUser = (id, urlDatabase) => {
  const userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

module.exports = { getUserByEmail, generateRandomString, getUrlsForUser };