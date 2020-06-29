const Post = require('../models/post');

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
  const note = new Post({
    title: 'will remove this soon',
    url: 'http://localhost:3001/',
  });
  await note.save();
  await note.remove();

  return note._id.toString();
};

const postsInDb = async () => {
  const posts = await Post.find({});
  return posts.map((post) => post.toJSON());
};

module.exports = {
  initialPosts,
  nonExistingId,
  postsInDb,
};
