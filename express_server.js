const { getUserByEmail } = require('./helpers');
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const { render } = require("ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookieSession({
  name: 'session',
  keys: ['key1'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

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

const urlsForUser = (id) => {
  const userUrls = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userUrls[url] = urlDatabase[url];
    }
  }
  return userUrls;
};

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = {};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req,res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req,res) => {
  const templateVars = {
    user: users[req.session.username],
    urls: urlsForUser(req.session.username)
  };
  res.render("urls_index", templateVars);
  console.log(urlDatabase);
  console.log(users);
  console.log("cookie is ", req.session.username);
  console.log(urlsForUser(req.session.username));
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.username] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  const userID = req.session.username;

  urlDatabase[randomString] = { longURL: req.body.longURL, userID };
  res.redirect(`urls/${randomString}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.get("/urls/:shortURL", (req,res) => {
  if (urlDatabase[req.params.shortURL]) {
    const templateVars = {
      user: users[req.session.username],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };

    if (!req.session.username) {
      return res.status(400).send('You are not logged in!');
    }

    if (urlDatabase[templateVars.shortURL].userID !== req.session.username) {
      return res.status(400).send('This URL does not belong to you!');
    }

    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(404);
  }
});

app.get("/register", (req,res) => {
  const templateVars = {
    user: users[req.session.username],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.username],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_login", templateVars);
});

app.post("/register", (req, res) => {
  //add .send() to status
  //dont pass in hard variables
  //dont use if else

  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = getUserByEmail(email, users);
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send('Username and Password cannot be blank');
  }

  if (user) {
    return res.status(400).send('User already exisit');
  }

  users[id] = {id, email, hashedPassword};

  req.session.username = id;
  res.redirect("/urls");
  
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
  };

  if (urlDatabase[templateVars.shortURL].userID !== req.session.username) {
    return res.status(400).send('This URL does not belong to you!');
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.session.username],
    shortURL: req.params.shortURL,
  };

  if (urlDatabase[templateVars.shortURL].userID !== req.session.username) {
    return res.status(400).send('This URL does not belong to you!');
  }
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);

  if (!user) {
    return res.status(403).send("Account does not exist");
  }

  if (!bcrypt.compareSync(password, user.hashedPassword)) {
    return res.status(400).send("Incorrect Password");
  }

  req.session.username = user.id;
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});