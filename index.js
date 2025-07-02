const express = require('express');
const app = express();
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const postModel = require('./models/post');
const userModel = require('./models/user')

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('login')
})

app.get('/logout', (req, res) => {
    res.cookie("token", " ");
    res.redirect("/login");
})

app.get('/profile', isLoggedIn , async (req, res) => {
    let user = await userModel.findOne({email : req.user.email}).populate('posts');
    res.render('profile', {user})
})

app.get('/edit/:id', isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({_id : req.params.id}).populate('user');
    res.render('edit', {post});
})

app.get('/delete/:id', isLoggedIn, async (req, res, next) => {
  try {
    const deleted = await postModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      console.warn(`Post with ID ${req.params.id} was not found.`);
      return res.status(404).send('Post not found');
    }
    // Note the leading slash to avoid a relative redirect
    return res.redirect('/profile');
  } catch (err) {
    console.error('Error deleting post:', err);
    return next(err);
  }
});


app.post('/update/:id', isLoggedIn, async(req, res) => {
  let post = await postModel.findOneAndUpdate({_id : req.params.id}, {content : req.body.content});
  res.redirect('/profile');
})


app.post('/post', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email : req.user.email});
    let {content} = req.body;   

    let post = await postModel.create({
        user : user._id,
        content
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something went wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhhhh");
            res.cookie("token", token);
            res.status(200).redirect('/profile')
        }
        else res.redirect('/login');

    })
});

app.post('/register', async (req, res) => {
  try {
    const { name, username, age, email, password } = req.body;
    const existing = await userModel.findOne({ email });
    if (existing) return res.status(400).send("Account already exists");

    const hash = await bcrypt.hash(password, 10);
    const user = await userModel.create({ username, name, email, age, password: hash });

    const token = jwt.sign({ email, userid: user._id }, "shhhhh");
    res.cookie("token", token, { httpOnly: true });
    res.redirect('/profile');
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error during registration");
  }
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token || token.trim() === "") return res.status(401).redirect('/login');

  try {
    req.user = jwt.verify(token, "shhhhh");
    next();
  } catch {
    res.status(401).send("Invalid token");
  }
}

app.listen(3000);