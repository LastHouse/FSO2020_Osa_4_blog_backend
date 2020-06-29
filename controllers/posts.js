const postsRouter = require('express').Router();
const Post = require('../models/post');

postsRouter.get('/', async (request, response) => {
  const posts = await Post.find({});
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

  const post = new Post({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
  });

  const savedPost = await post.save();

  response.json(savedPost.toJSON());
});

postsRouter.delete('/:id', async (request, response) => {
  await Post.findByIdAndRemove(request.params.id);
  response.status(204).end();
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
