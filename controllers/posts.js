const postsRouter = require('express').Router();
const Post = require('../models/post');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

postsRouter.get('/', async (request, response) => {
  const posts = await Post.find({}).populate('user', { username: 1, name: 1 });
  response.json(posts);
});

postsRouter.post('/', async (request, response) => {
  const post = new Post(request.body);

  const decodedToken = jwt.verify(request.token, process.env.SECRET);

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const user = await User.findById(decodedToken.id);

  if (!post.url || !post.title) {
    return response.status(400).send({ error: 'title or url missing ' });
  }

  if (!post.likes) {
    post.likes = 0;
  }

  post.user = user;

  const savedPost = await post.save();

  user.posts = user.posts.concat(savedPost._id);
  await user.save();

  response.json(savedPost);
});

postsRouter.post('/:id/comments', async (request, response) => {
  const post = await Post.findById(request.params.id).populate('user', {
    username: 1,
    name: 1,
  });
  const comment = request.body.comments;
  post.comments = post.comments.concat(comment);

  await post.save();

  response.json(post);
});

postsRouter.delete('/:id', async (request, response) => {
  const decodedToken = jwt.verify(request.token, process.env.SECRET);

  if (!request.token || !decodedToken.id) {
    return response.status(401).json({ error: 'token missing or invalid' });
  }

  const post = await Post.findById(request.params.id);
  const user = await User.findById(decodedToken.id);

  if (!post) {
    return response.status(404).json({ error: 'blog post not found' });
  }

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
  const post = request.body;

  const updatedPost = await Post.findByIdAndUpdate(request.params.id, post, {
    new: true,
  }).populate('user', { username: 1, name: 1 });
  response.json(updatedPost);
});

postsRouter.get('/:id', async (request, response) => {
  const post = await Post.findById(request.params.id);
  if (post) {
    response.json(post);
  } else {
    response.status(404).end();
  }
});

module.exports = postsRouter;
