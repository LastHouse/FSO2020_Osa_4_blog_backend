var _ = require('lodash');

const mostLikes = (array) => {
  const mostLikesByAuthor = _.map(_.groupBy(array, 'author'), (value, key) => ({
    author: key,
    likes: _.sumBy(value, 'likes'),
  }));

  const result = _.maxBy(mostLikesByAuthor, (x) => x.likes);
  return result;
};

module.exports = {
  mostLikes,
};
