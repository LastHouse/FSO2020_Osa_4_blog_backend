var _ = require('lodash');

const mostBlogs = (array) => {
  const mostBlogsByAuthor = _.map(_.countBy(array, 'author'), (value, key) => ({
    author: key,
    blogs: value,
  }));
  const result = _.maxBy(mostBlogsByAuthor, (x) => x.author);
  return result;
};

module.exports = {
  mostBlogs,
};
