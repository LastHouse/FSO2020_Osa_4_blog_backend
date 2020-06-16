const totalLikes = (array) => {
  const reducer = (sum, item) => {
    return sum + item;
  };
  const likes = (post) => {
    return post.likes;
  };

  return array.length === 0 ? 0 : array.map(likes).reduce(reducer, 0);
};

module.exports = {
  totalLikes,
};
