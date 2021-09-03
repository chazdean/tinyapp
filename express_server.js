const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
const { render } = require("ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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

//return null
const getUserByEmail = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }
  return null;
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
    user: users[req.cookies["user_id"]],
    urls: urlsForUser(req.cookies["user_id"])
  };
  res.render("urls_index", templateVars);
  console.log(urlDatabase);
  console.log(users);
  console.log(urlsForUser(req.cookies["user_id"]));
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  const userID = req.cookies["user_id"];

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
      user: users[req.cookies["user_id"]],
      shortURL: req.params.shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL
    };

    if (!req.cookies["user_id"]) {
      return res.status(400).send('You are not logged in!');
    }

    if (urlDatabase[templateVars.shortURL].userID !== req.cookies["user_id"]) {
      return res.status(400).send('This URL does not belong to you!');
    }

    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(404);
  }
});

app.get("/register", (req,res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL]
  };
  res.render("urls_register", templateVars);
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
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
  const user = getUserByEmail(email);
  const id = generateRandomString();

  if (!email || !password) {
    return res.status(400).send('Username and Password cannot be blank');
  }

  if (user) {
    return res.status(400).send('User already exisit');
  }

  users[id] = {id, email, password};

  res.cookie("user_id", id);
  res.redirect("/urls");
  
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
  };

  if (urlDatabase[templateVars.shortURL].userID !== req.cookies["user_id"]) {
    return res.status(400).send('This URL does not belong to you!');
  }

  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  const templateVars = {
    user: users[req.cookies["user_id"]],
    shortURL: req.params.shortURL,
  };

  if (urlDatabase[templateVars.shortURL].userID !== req.cookies["user_id"]) {
    return res.status(400).send('This URL does not belong to you!');
  }
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  //add .send() to status
  //dont pass in hard variables
  //dont use if else
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email);

  if (!user) {
    return res.status(403).send("Account does not exist");
  }

  if (user.password !== password) {
    return res.status(400).send("Incorrect Password");
  }

  res.cookie("user_id", user.id);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});