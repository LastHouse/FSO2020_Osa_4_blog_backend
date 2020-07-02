const postsRouter = require('express').Router();
const Post = require('../models/post');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

postsRouter.get('/', async (request, response) => {
  const posts = await Post.find({}).populate('user', { username: 1, name: 1 });
  response.json(posts.map((post) => post.toJSON()));
});

postsRouter.get('/:id', async (request, response) => {
  const post = await Post.findById(request.params.id);
  if (post) {
    response.json(post.toJSON());
  } else {
    response.status(404).end();
  }
});

postsRouter.post('/', async (request, response) => {
  const body = request.body;

  const decodedToken = jwt.verify(request.token, process.env.SECRET);
  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);

  const post = new Post({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
  });

  const savedPost = await post.save();
  user.posts = user.posts.concat(savedPost._id);
  await user.save();

  response.json(savedPost.toJSON());
});

postsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }
  const post = await Post.findById(request.params.id);
  const user = await User.findById(decodedToken.id);

  if (post.user.toString() === user.id.toString()) {
    await Post.findByIdAndRemove(request.params.id);
    response.status(204).end();
  } else {
    response
      .status(401)
      .json({ error: 'can not delete a post, which is not added by you' });
  }
});

postsRouter.put('/:id', async (request, response) => {
  const body = request.body;

  const post = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const updatedPost = await Post.findByIdAndUpdate(request.params.id, post, {
    new: true,
  });
  response.json(updatedPost.toJSON());
});

module.exports = postsRouter;
