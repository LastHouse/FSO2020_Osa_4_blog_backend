const Post = require('../models/post');
const User = require('../models/user');

const initialPosts = [
  {
    title: 'Igor speaks',
    author: 'Igor Popowitz',
    url: 'http://localhost:3001/',
    likes: 3,
  },
  {
    title: 'Jimmy preaches',
    author: 'Jimmy James',
    url: 'http://localhost:3001/',
    likes: 2,
  },
];

const nonExistingId = async () => {
  const post = new Post({
    title: 'will remove this soon',
    url: 'http://localhost:3001/',
  });
  await post.save();
  await post.remove();

  return post._id.toString();
};

const postsInDb = async () => {
  const posts = await Post.find({});
  return posts.map((post) => post.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

module.exports = {
  initialPosts,
  nonExistingId,
  postsInDb,
  usersInDb,
};
